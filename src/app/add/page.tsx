"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureSession, supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compressImage";
import RecipeForm, { RecipeFormInitial } from "@/components/RecipeForm";

type Mode = "select" | "url" | "photo" | "form";

const MAX_PHOTOS = 15;

export default function AddRecipePage() {
  const [mode, setMode] = useState<Mode>("select");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [initial, setInitial] = useState<RecipeFormInitial>({});
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    ensureSession();
  }, []);

  async function handleExtractUrl() {
    if (!url.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      let finalImageUrl: string | null = data.image_url ?? null;
      if (finalImageUrl) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const rehostRes = await fetch("/api/rehost-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: finalImageUrl, accessToken: session.access_token }),
          });
          const rehostData = await rehostRes.json();
          finalImageUrl = rehostData.image_url ?? null;
        }
      }

      if (!data.found) {
        setNotice("레시피를 자동으로 찾지 못했어요. 아래에서 직접 채워주세요.");
      }

      setInitial({
        title: data.title || "",
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        image_url: finalImageUrl,
        source_url: url.trim(),
      });
      setMode("form");
    } catch {
      setNotice("가져오기에 실패했어요. 직접 입력해주세요.");
      setInitial({ source_url: url.trim() });
      setMode("form");
    } finally {
      setBusy(false);
    }
  }

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const remaining = MAX_PHOTOS - photoFiles.length;
    if (remaining <= 0) {
      setNotice(`사진은 한 번에 최대 ${MAX_PHOTOS}장까지 선택할 수 있어요. 레시피가 담긴 페이지 위주로 골라주세요.`);
      return;
    }
    const files = picked.slice(0, remaining);
    if (picked.length > files.length) {
      setNotice(`사진은 한 번에 최대 ${MAX_PHOTOS}장까지 선택할 수 있어서 앞의 ${files.length}장만 담았어요.`);
    }

    setCompressing(true);
    const compressed = await Promise.all(files.map((f) => compressImage(f)));
    setCompressing(false);

    setPhotoFiles((prev) => [...prev, ...compressed]);
    setPhotoPreviews((prev) => [...prev, ...compressed.map((f) => URL.createObjectURL(f))]);
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleExtractPhoto() {
    if (photoFiles.length === 0) return;
    setBusy(true);
    setNotice(null);
    const coverImage = photoFiles.find((f) => f.type.startsWith("image/"));
    try {
      const formData = new FormData();
      photoFiles.forEach((file) => formData.append("image", file));
      const res = await fetch("/api/extract-image", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.found) {
        setNotice("레시피를 자동으로 찾지 못했어요. 아래에서 직접 채워주세요.");
      }

      setInitial({
        title: data.title || "",
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        imageFile: coverImage,
      });
      setMode("form");
    } catch {
      setNotice("추출에 실패했어요. 직접 입력해주세요.");
      setInitial({ imageFile: coverImage });
      setMode("form");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 safe-top bg-orange-50/90 backdrop-blur px-4 pt-4 pb-3 flex items-center gap-3">
        <Link href="/" className="text-xl">
          ←
        </Link>
        <h1 className="text-lg font-bold">레시피 추가</h1>
      </header>

      {mode === "select" && (
        <div className="flex flex-col gap-3 px-4 py-6">
          <button
            onClick={() => setMode("url")}
            className="rounded-2xl bg-white shadow-sm p-5 text-left flex items-center gap-4"
          >
            <span className="text-3xl">🔗</span>
            <div>
              <p className="font-bold">URL로 가져오기</p>
              <p className="text-sm text-stone-500">네이버 블로그 등 링크를 붙여넣으면 자동으로 채워드려요</p>
            </div>
          </button>
          <button
            onClick={() => setMode("photo")}
            className="rounded-2xl bg-white shadow-sm p-5 text-left flex items-center gap-4"
          >
            <span className="text-3xl">📷</span>
            <div>
              <p className="font-bold">캡쳐 사진으로 가져오기</p>
              <p className="text-sm text-stone-500">저장해둔 캡쳐 사진에서 자동으로 인식해드려요 (여러 장 또는 PDF도 가능)</p>
            </div>
          </button>
          <button
            onClick={() => {
              setInitial({});
              setMode("form");
            }}
            className="rounded-2xl bg-white shadow-sm p-5 text-left flex items-center gap-4"
          >
            <span className="text-3xl">✏️</span>
            <div>
              <p className="font-bold">처음부터 직접 입력하기</p>
              <p className="text-sm text-stone-500">바로 빈 양식에 입력할게요</p>
            </div>
          </button>
        </div>
      )}

      {mode === "url" && (
        <div className="flex flex-col gap-4 px-4 py-6">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://blog.naver.com/..."
            className="rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={handleExtractUrl}
            disabled={busy || !url.trim()}
            className="rounded-xl bg-orange-600 text-white font-bold py-3 disabled:opacity-50"
          >
            {busy ? "가져오는 중..." : "가져오기"}
          </button>
        </div>
      )}

      {mode === "photo" && (
        <div className="flex flex-col gap-4 px-4 py-6">
          <p className="text-sm text-stone-500">
            블로그 글처럼 여러 장을 캡쳐했다면, 읽는 순서대로 여러 장을 한 번에 선택해주세요.
            사진들을 합친 PDF 파일도 한 개 선택해서 올릴 수 있어요.
          </p>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white">
                  {photoFiles[i]?.type === "application/pdf" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2 text-center">
                      <span className="text-2xl">📄</span>
                      <span className="text-[10px] text-stone-500 line-clamp-2 break-all">
                        {photoFiles[i].name}
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={`캡쳐 ${i + 1}`} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="relative w-full aspect-video rounded-xl bg-white border border-dashed border-stone-300 overflow-hidden flex items-center justify-center">
            <span className="text-stone-400 text-sm">
              {photoPreviews.length > 0 ? "추가로 선택하기" : "캡쳐 사진 또는 PDF를 선택해주세요"}
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handlePhotoPick}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          <button
            onClick={handleExtractPhoto}
            disabled={busy || compressing || photoFiles.length === 0}
            className="rounded-xl bg-orange-600 text-white font-bold py-3 disabled:opacity-50"
          >
            {compressing
              ? "사진 준비 중..."
              : busy
                ? "추출하는 중..."
                : `추출하기${photoFiles.length > 0 ? ` (${photoFiles.length}개)` : ""}`}
          </button>
        </div>
      )}

      {mode === "form" && (
        <>
          {notice && (
            <p className="mx-4 mt-4 rounded-xl bg-amber-100 text-amber-800 text-sm px-4 py-2.5">
              {notice}
            </p>
          )}
          <RecipeForm initial={initial} />
        </>
      )}
    </div>
  );
}
