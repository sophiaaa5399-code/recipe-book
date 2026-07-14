function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function htmlToText(html: string) {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const withoutTags = withoutScripts.replace(/<[^>]+>/g, "\n");
  return decodeEntities(withoutTags)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export function extractOgImage(html: string) {
  const match =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return match ? decodeEntities(match[1]) : null;
}

// 네이버 블로그/카페는 PC 주소가 실제 글을 iframe으로 감싸고 있어
// 서버에서 그대로 fetch하면 본문을 못 읽는다. 모바일 주소는 본문이 바로 렌더링돼서
// 가능하면 모바일 주소로 바꿔서 가져온다. (카페는 비공개/회원전용 글이면 로그인이
// 필요해서 이 우회로도 못 읽을 수 있다 - 이 경우 캡쳐 사진으로 대체해야 한다.)
export function toFetchableUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === "blog.naver.com") {
      url.hostname = "m.blog.naver.com";
    } else if (url.hostname === "cafe.naver.com") {
      url.hostname = "m.cafe.naver.com";
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}
