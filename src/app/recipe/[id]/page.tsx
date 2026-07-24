"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("recipes").select("*").eq("id", id).single();
      setRecipe((data as Recipe) ?? null);
      setLoading(false);
    })();
  }, [id]);

  async function handleDelete() {
    if (!confirm("이 레시피를 삭제할까요?")) return;
    setDeleting(true);
    await supabase.from("recipes").delete().eq("id", id);
    router.push("/");
  }

  if (loading) {
    return <p className="text-center text-stone-400 py-16">불러오는 중...</p>;
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-stone-400">레시피를 찾을 수 없어요</p>
        <Link href="/" className="text-orange-600 font-medium">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 safe-top bg-orange-50/90 backdrop-blur px-4 pt-4 pb-3 flex items-center justify-between">
        <Link href="/" className="text-xl">
          ←
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href={`/recipe/${id}/edit`} className="text-orange-600">
            수정
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="text-red-500">
            삭제
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-5 px-4 py-4 pb-10">
        <div className="w-full aspect-video rounded-2xl bg-orange-100 overflow-hidden flex items-center justify-center">
          {recipe.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">🍳</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {recipe.category && (
            <span className="self-start text-xs font-medium text-orange-600 bg-orange-100 rounded-full px-2.5 py-1">
              {recipe.category}
            </span>
          )}
          <h1 className="text-2xl font-black">{recipe.title}</h1>
          {recipe.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {recipe.tags.map((tag) => (
                <span key={tag} className="text-xs text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {recipe.ingredients.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-bold text-stone-800">재료</h2>
            <ul className="flex flex-col gap-1.5 rounded-xl bg-white p-4 shadow-sm">
              {recipe.ingredients.map((item, i) => (
                <li key={i} className="text-sm text-stone-700">
                  • {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {recipe.steps.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-bold text-stone-800">조리 순서</h2>
            <ol className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
              {recipe.steps.map((step, i) => (
                <li key={i} className="text-sm text-stone-700 flex gap-2">
                  <span className="font-bold text-orange-600">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-400 underline"
          >
            원본 보러가기
          </a>
        )}
      </main>
    </div>
  );
}
