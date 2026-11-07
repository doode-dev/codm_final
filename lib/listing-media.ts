import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_IMAGES = 6;
const MAX_SIZE = 5 * 1024 * 1024;
const BUCKET = "listing-media";
export type Media = { src: string; caption: string };

export const getFiles = (f: FormData) => f.getAll("media").filter((x): x is File => x instanceof File && x.size > 0);

// Uploads into the seller's own folder. If one file fails, the ones already uploaded are removed again.
export async function uploadImages(supabase: SupabaseClient, userId: string, files: File[], startAt = 0): Promise<Media[]> {
  const done: string[] = [];
  const media: Media[] = [];
  try {
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Only JPG, PNG and WebP images are allowed.");
      if (file.size > MAX_SIZE) throw new Error("Each image must be 5 MB or smaller.");
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error("Image upload failed: " + error.message);
      done.push(path);
      media.push({ src: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, caption: `Screenshot ${startAt + media.length + 1}` });
    }
    return media;
  } catch (e) {
    if (done.length) await supabase.storage.from(BUCKET).remove(done);
    throw e;
  }
}

const pathFromUrl = (url: string) => {
  const rest = url.split(`/object/public/${BUCKET}/`)[1];
  return rest ? decodeURIComponent(rest.split("?")[0]) : null;
};

// Best-effort cleanup of files that are no longer used. Only touches the seller's own folder.
export async function removeImages(supabase: SupabaseClient, userId: string, urls: string[]) {
  const paths = urls.map(pathFromUrl).filter((p): p is string => !!p && p.startsWith(userId + "/"));
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
