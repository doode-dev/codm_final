"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseListing, type ActionResult } from "@/lib/listing-input";
import { MAX_IMAGES, getFiles, removeImages, uploadImages, type Media } from "@/lib/listing-media";

export async function updateListing(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sell");

  const { data: current } = await supabase.from("listings").select("id,status,media,price_cents").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (!current) return { error: "Listing not found." };
  if (!["draft", "pending_review", "active", "rejected", "withdrawn", "expired"].includes(current.status)) {
    return { error: "This listing can't be edited right now." };
  }

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  const removed = formData.getAll("removeMedia").map(String);
  const oldMedia = (current.media ?? []) as Media[];
  const kept = oldMedia.filter((m) => !removed.includes(m.src));
  const files = getFiles(formData);
  if (kept.length + files.length < 1) return { error: "Keep or add at least one screenshot." };
  if (kept.length + files.length > MAX_IMAGES) return { error: `A listing can have up to ${MAX_IMAGES} screenshots.` };

  let added: Media[] = [];
  try {
    added = await uploadImages(supabase, user.id, files, kept.length);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Image upload failed." };
  }

  // Lowering the price shows the old price as a price drop. Raising it clears the drop.
  const newPrice = parsed.value.price_cents;
  const { data, error } = await supabase.from("listings").update({
    ...parsed.value,
    status: "pending_review", // every edit goes back through review
    media: [...kept, ...added],
    previous_price_cents: newPrice < current.price_cents ? current.price_cents : null,
  }).eq("id", id).eq("seller_id", user.id).select("id");

  if (error || !data?.length) {
    await removeImages(supabase, user.id, added.map((m) => m.src));
    console.error("Update listing failed:", error?.message);
    return { error: error && /cannot move|Only the price/.test(error.message) ? error.message : "Could not save your changes. Please try again." };
  }

  await removeImages(supabase, user.id, oldMedia.filter((m) => removed.includes(m.src)).map((m) => m.src));
  revalidatePath("/sell");
  revalidatePath("/accounts");
  redirect("/sell?updated=1");
}
