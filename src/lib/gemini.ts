import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedRecipe } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

const PROMPT = `너는 요리 레시피 정리를 도와주는 도우미야. 주어진 내용(블로그 글 또는 캡쳐 이미지)에서
요리 이름, 재료 목록, 조리 순서를 찾아 한국어로 정리해줘.
- 재료는 "재료명 분량" 형태로 한 줄씩.
- 조리 순서는 실제 조리 단계만 순서대로, 광고/잡담/이모지는 제외.
- 레시피 내용을 전혀 찾을 수 없으면 found를 false로 하고 나머지는 빈 값으로 줘.
- 알아볼 수 있는 정보만 채우고, 확실하지 않은 내용은 지어내지 마.`;

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
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${PROMPT}\n\n--- 블로그 본문 ---\n${pageText.slice(0, 15000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA,
    },
  });
  return parseResult(response.text);
}

export async function extractRecipeFromImage(base64: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: PROMPT }, { inlineData: { data: base64, mimeType } }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: RECIPE_SCHEMA,
    },
  });
  return parseResult(response.text);
}
