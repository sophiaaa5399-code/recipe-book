"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureSession, supabase } from "@/lib/supabase";
import RecipeForm, { RecipeFormInitial } from "@/components/RecipeForm";

type Mode = "select" | "url" | "photo" | "form";

export default function AddRecipePage() {
  const [mode, setMode] = useState<Mode>("select");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [initial, setInitial] = useState<RecipeFormInitial>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleExtractPhoto() {
    if (!photoFile) return;
    setBusy(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("image", photoFile);
      const res = await fetch("/api/extract-image", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.found) {
        setNotice("레시피를 자동으로 찾지 못했어요. 아래에서 직접 채워주세요.");
      }

      setInitial({
        title: data.title || "",
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        imageFile: photoFile,
      });
      setMode("form");
    } catch {
      setNotice("추출에 실패했어요. 직접 입력해주세요.");
      setInitial({ imageFile: photoFile });
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
              <p className="text-sm text-stone-500">저장해둔 캡쳐 사진에서 자동으로 인식해드려요</p>
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
          <label className="relative w-full aspect-video rounded-xl bg-white border border-dashed border-stone-300 overflow-hidden flex items-center justify-center">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="캡쳐 사진" className="w-full h-full object-cover" />
            ) : (
              <span className="text-stone-400 text-sm">캡쳐 사진을 선택해주세요</span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoPick}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          <button
            onClick={handleExtractPhoto}
            disabled={busy || !photoFile}
            className="rounded-xl bg-orange-600 text-white font-bold py-3 disabled:opacity-50"
          >
            {busy ? "추출하는 중..." : "추출하기"}
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
