import { NextResponse } from "next/server";
import { extractRecipeFromImages, classifyGeminiError } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("image").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "image 파일이 필요합니다" }, { status: 400 });
  }

  const images = await Promise.all(
    files.map(async (file) => ({
      base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      mimeType: file.type || "image/jpeg",
    }))
  );

  try {
    const extracted = await extractRecipeFromImages(images);
    return NextResponse.json(extracted);
  } catch (err) {
    console.error("extract-image: gemini call failed", err);
    return NextResponse.json({ found: false, reason: classifyGeminiError(err) });
  }
}
