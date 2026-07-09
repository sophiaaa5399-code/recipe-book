export const CATEGORIES = [
  "야식",
  "간식",
  "안주",
  "한 끼 식사",
  "국물요리",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Recipe = {
  id: string;
  owner_id: string;
  title: string;
  image_url: string | null;
  ingredients: string[];
  steps: string[];
  category: string | null;
  tags: string[];
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ExtractedRecipe = {
  title: string;
  ingredients: string[];
  steps: string[];
  image_url?: string | null;
};
