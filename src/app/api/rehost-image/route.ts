import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 원본 사이트의 og:image는 리퍼러 제한(핫링크 방지)으로 브라우저에서 바로 못 불러오는
// 경우가 많아서, 서버에서 대신 다운로드해 우리 Storage로 옮겨 저장한다.
export const maxDuration = 30;

export async function POST(request: Request) {
  const { imageUrl, accessToken } = await request.json();
  if (!imageUrl || !accessToken) {
    return NextResponse.json({ error: "imageUrl, accessToken이 필요합니다" }, { status: 400 });
  }

  let bytes: ArrayBuffer;
  let contentType = "image/jpeg";
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });
    if (!res.ok) return NextResponse.json({ image_url: null });
    contentType = res.headers.get("content-type") || contentType;
    bytes = await res.arrayBuffer();
  } catch {
    return NextResponse.json({ image_url: null });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("recipe-images").upload(path, bytes, {
    contentType,
  });
  if (error) {
    return NextResponse.json({ image_url: null });
  }

  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return NextResponse.json({ image_url: data.publicUrl });
}
