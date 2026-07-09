import { NextResponse } from "next/server";
import { extractRecipeFromImage } from "@/lib/gemini";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image 파일이 필요합니다" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const extracted = await extractRecipeFromImage(base64, file.type || "image/jpeg");
    return NextResponse.json(extracted);
  } catch {
    return NextResponse.json({ found: false, reason: "extract_failed" });
  }
}
