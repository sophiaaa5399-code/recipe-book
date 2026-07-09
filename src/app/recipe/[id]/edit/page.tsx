"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ensureSession, supabase } from "@/lib/supabase";
import RecipeForm from "@/components/RecipeForm";
import type { Recipe } from "@/lib/types";

export default function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await ensureSession();
      const { data } = await supabase.from("recipes").select("*").eq("id", id).single();
      setRecipe((data as Recipe) ?? null);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 safe-top bg-orange-50/90 backdrop-blur px-4 pt-4 pb-3 flex items-center gap-3">
        <Link href={`/recipe/${id}`} className="text-xl">
          ←
        </Link>
        <h1 className="text-lg font-bold">레시피 수정</h1>
      </header>

      {loading ? (
        <p className="text-center text-stone-400 py-16">불러오는 중...</p>
      ) : !recipe ? (
        <p className="text-center text-stone-400 py-16">레시피를 찾을 수 없어요</p>
      ) : (
        <RecipeForm
          recipeId={id}
          initial={{
            title: recipe.title,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            category: recipe.category,
            tags: recipe.tags,
            image_url: recipe.image_url,
            source_url: recipe.source_url,
          }}
        />
      )}
    </div>
  );
}
