import { supabase } from "./supabase";

export async function uploadRecipeImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("recipe-images")
    .upload(path, file, { contentType: file.type || "image/jpeg" });
  if (error) throw error;
  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return data.publicUrl;
}
