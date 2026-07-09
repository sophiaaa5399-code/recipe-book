import Link from "next/link";
import type { Recipe } from "@/lib/types";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="aspect-square bg-orange-100 flex items-center justify-center overflow-hidden">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">🍳</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        {recipe.category && (
          <span className="self-start text-xs font-medium text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">
            {recipe.category}
          </span>
        )}
        <h3 className="font-bold text-sm leading-snug line-clamp-2">{recipe.title}</h3>
        {recipe.ingredients.length > 0 && (
          <p className="text-xs text-stone-500 line-clamp-1">
            {recipe.ingredients.join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
