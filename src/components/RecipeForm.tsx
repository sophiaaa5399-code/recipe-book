"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadRecipeImage } from "@/lib/uploadImage";
import { compressImage } from "@/lib/compressImage";
import { CATEGORIES } from "@/lib/types";

export type RecipeFormInitial = {
  title?: string;
  ingredients?: string[];
  steps?: string[];
  category?: string | null;
  tags?: string[];
  image_url?: string | null;
  imageFile?: File | null;
  source_url?: string | null;
};

export default function RecipeForm({
  recipeId,
  initial,
}: {
  recipeId?: string;
  initial?: RecipeFormInitial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [ingredientsText, setIngredientsText] = useState(
    (initial?.ingredients ?? []).join("\n")
  );
  const [stepsText, setStepsText] = useState((initial?.steps ?? []).join("\n"));
  const [category, setCategory] = useState<string | null>(initial?.category ?? null);
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(initial?.imageFile ?? null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.imageFile) {
      const url = URL.createObjectURL(initial.imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [initial?.imageFile]);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("요리 이름을 입력해주세요");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadRecipeImage(imageFile);
      }

      const payload = {
        title: title.trim(),
        ingredients: ingredientsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        steps: stepsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        category,
        tags: tagsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        image_url: finalImageUrl,
        source_url: initial?.source_url ?? null,
      };

      if (recipeId) {
        const { error: updateError } = await supabase
          .from("recipes")
          .update(payload)
          .eq("id", recipeId);
        if (updateError) throw updateError;
        router.push(`/recipe/${recipeId}`);
      } else {
        const { data, error: insertError } = await supabase
          .from("recipes")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw insertError;
        router.push(`/recipe/${data.id}`);
      }
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-4">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-stone-700">사진</span>
        <div className="relative w-full aspect-video rounded-xl bg-white border border-dashed border-stone-300 overflow-hidden flex items-center justify-center">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="레시피 사진" className="w-full h-full object-cover" />
          ) : (
            <span className="text-stone-400 text-sm">사진을 선택해주세요 (선택)</span>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-stone-700">요리 이름</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 김치볶음밥"
          className="rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-stone-700">상황별 카테고리</span>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(category === c ? null : c)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-orange-600 text-white"
                  : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-stone-700">재료</span>
        <span className="text-xs text-stone-400">한 줄에 재료 하나씩 입력해주세요</span>
        <textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          placeholder={"계란 2개\n대파 1/2대\n밥 1공기"}
          rows={5}
          className="rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-stone-700">조리 순서</span>
        <span className="text-xs text-stone-400">한 줄에 한 단계씩 입력해주세요</span>
        <textarea
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          placeholder={"1. 팬에 기름을 두르고 대파를 볶는다\n2. 밥과 김치를 넣고 볶는다"}
          rows={6}
          className="rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-stone-700">태그</span>
        <span className="text-xs text-stone-400">쉼표로 구분해주세요 (예: 매운맛, 에어프라이어)</span>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className="rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-orange-600 text-white font-bold py-3 disabled:opacity-50"
      >
        {saving ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}
