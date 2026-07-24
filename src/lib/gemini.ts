import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedRecipe } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 무료 사용량은 모델별로 별도 한도라, 기본 모델이 하루 한도를 넘기면
// 별도 한도를 쓰는 가벼운 모델로 자동 전환해서 계속 동작하게 한다.
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-flash-lite-latest";

async function generateWithFallback(
  params: Omit<Parameters<typeof ai.models.generateContent>[0], "model">
) {
  try {
    return await ai.models.generateContent({ ...params, model: PRIMARY_MODEL });
  } catch (err) {
    if ((err as { status?: number })?.status !== 429) throw err;
    return await ai.models.generateContent({ ...params, model: FALLBACK_MODEL });
  }
}

const RECIPE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "레시피(요리 이름/재료/조리순서)를 인식했으면 true, 전혀 알아볼 수 없으면 false",
    },
    title: { type: Type.STRING, description: "요리 이름" },
    ingredients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "재료 목록. 각 항목은 '재료명 분량' 형태 (예: '계란 2개')",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "조리 순서. 각 항목은 한 단계",
    },
  },
  required: ["found", "title", "ingredients", "steps"],
};

const PROMPT = `너는 요리 레시피 정리를 도와주는 도우미야. 주어진 내용(블로그 글 캡쳐 사진 또는 PDF 문서)에서
요리 이름, 재료 목록, 조리 순서를 찾아 한국어로 정리해줘.
- 재료는 "재료명 분량" 형태로 한 줄씩.
- 조리 순서는 실제 조리 단계만 순서대로, 광고/잡담/이모지는 제외.
- 레시피 내용을 전혀 찾을 수 없으면 found를 false로 하고 나머지는 빈 값으로 줘.
- 알아볼 수 있는 정보만 채우고, 확실하지 않은 내용은 지어내지 마.`;

const MULTI_IMAGE_PROMPT = `${PROMPT}
- 아래 자료는 하나의 블로그 글(또는 게시물)을 위에서부터 순서대로 캡쳐한 여러 장의 사진이거나, 여러 페이지로 된 PDF 문서야.
- 모든 페이지/사진을 순서대로 읽어서, 하나의 레시피로 종합해서 정리해줘. 같은 재료나 단계가 여러 장에 걸쳐 나오면 중복 없이 합쳐줘.`;

export function classifyGeminiError(err: unknown): "rate_limited" | "extract_failed" {
  const status = (err as { status?: number })?.status;
  if (status === 429) return "rate_limited";
  return "extract_failed";
}

function parseResult(text: string | undefined): ExtractedRecipe & { found: boolean } {
  if (!text) return { found: false, title: "", ingredients: [], steps: [] };
  try {
    const parsed = JSON.parse(text);
    return {
      found: Boolean(parsed.found),
      title: parsed.title ?? "",
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    };
  } catch {
    return { found: false, title: "", ingredients: [], steps: [] };
  }
}

export async function extractRecipeFromText(pageText: string) {
  const response = await generateWithFallback({
    contents: `${PROMPT}\n\n--- 블로그 본문 ---\n${pageText.slice(0, 15000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA,
    },
  });
  return parseResult(response.text);
}

export async function extractRecipeFromImages(
  images: { base64: string; mimeType: string }[]
) {
  const isMulti = images.length > 1 || images.some((img) => img.mimeType === "application/pdf");
  const promptText = isMulti ? MULTI_IMAGE_PROMPT : PROMPT;
  const response = await generateWithFallback({
    contents: [
      {
        role: "user",
        parts: [
          { text: promptText },
          ...images.map((img) => ({
            inlineData: { data: img.base64, mimeType: img.mimeType },
          })),
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA,
    },
  });
  return parseResult(response.text);
}
