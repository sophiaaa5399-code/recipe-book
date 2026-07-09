"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ensureSession, supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/types";
import type { Recipe } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";
import CategoryChips from "@/components/CategoryChips";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await ensureSession();
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });
      setRecipes((data as Recipe[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      const matchesCategory = category ? r.category === category : true;
      const matchesQuery =
        q.length === 0 ||
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [recipes, query, category]);

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 safe-top bg-orange-50/90 backdrop-blur px-4 pt-4 pb-3 flex flex-col gap-3">
        <h1 className="text-xl font-black text-orange-700">나만의 레시피북</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="요리 이름이나 재료로 검색"
          className="w-full rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </header>

      <CategoryChips categories={CATEGORIES} selected={category} onSelect={setCategory} />

      <main className="flex-1 px-4 py-4">
        {loading ? (
          <p className="text-center text-stone-400 py-16">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-stone-400 py-16 flex flex-col gap-2">
            <p>
              {recipes.length === 0
                ? "아직 저장한 레시피가 없어요"
                : "조건에 맞는 레시피가 없어요"}
            </p>
            {recipes.length === 0 && <p className="text-sm">오른쪽 아래 + 버튼으로 추가해보세요</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>

      <Link
        href="/add"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 text-white text-3xl font-light shadow-lg flex items-center justify-center active:scale-95 transition-transform safe-bottom"
        aria-label="레시피 추가"
      >
        +
      </Link>
    </div>
  );
}
