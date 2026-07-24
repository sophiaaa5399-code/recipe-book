import { NextResponse } from "next/server";
import { extractRecipeFromText, classifyGeminiError } from "@/lib/gemini";
import { htmlToText, extractOgImage, toFetchableUrl } from "@/lib/html";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url이 필요합니다" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(toFetchableUrl(url), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });
    if (!res.ok) {
      return NextResponse.json({ found: false, reason: "fetch_failed" });
    }
    html = await res.text();
  } catch {
    return NextResponse.json({ found: false, reason: "fetch_failed" });
  }

  const text = htmlToText(html);
  const imageUrl = extractOgImage(html);

  try {
    const extracted = await extractRecipeFromText(text);
    return NextResponse.json({ ...extracted, image_url: imageUrl });
  } catch (err) {
    console.error("extract-url: gemini call failed", err);
    return NextResponse.json({
      found: false,
      reason: classifyGeminiError(err),
      image_url: imageUrl,
    });
  }
}
