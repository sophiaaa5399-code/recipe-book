export default function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: readonly string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          selected === null
            ? "bg-orange-600 text-white"
            : "bg-white text-stone-600 border border-stone-200"
        }`}
      >
        전체
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            selected === category
              ? "bg-orange-600 text-white"
              : "bg-white text-stone-600 border border-stone-200"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
