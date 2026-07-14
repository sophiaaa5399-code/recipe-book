// 캡쳐 사진은 원본이 커서(장당 1~3MB) 여러 장을 그대로 올리면 서버 요청 용량 제한에
// 걸리기 쉽다. 전송 전에 브라우저에서 가로/세로를 줄이고 JPEG로 다시 인코딩해 용량을 낮춘다.
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.8 } = {}
): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
