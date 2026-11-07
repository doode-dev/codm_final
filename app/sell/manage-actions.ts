"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { removeImages, type Media } from "@/lib/listing-media";
import type { ActionResult } from "@/lib/listing-input";

async function owned(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sell");
  const { data: listing } = await supabase.from("listings").select("id,status,media").eq("id", id).eq("seller_id", user.id).maybeSingle();
  return { supabase, user, listing };
}

const refresh = () => { revalidatePath("/sell"); revalidatePath("/accounts"); revalidatePath("/"); };

async function move(id: string, from: string[], to: string, notice: string, wrong: string): Promise<ActionResult> {
  const { supabase, listing } = await owned(id);
  if (!listing) return { error: "Listing not found." };
  if (!from.includes(listing.status)) return { error: wrong };
  const { data, error } = await supabase.from("listings").update({ status: to }).eq("id", id).select("id");
  if (error || !data?.length) return { error: error?.message ?? "Nothing was changed. Please try again." };
  refresh();
  redirect(`/sell?${notice}=1`);
}

export async function pauseListing(id: string): Promise<ActionResult> {
  return move(id, ["active", "pending_review"], "withdrawn", "paused", "Only live or pending listings can be paused.");
}

export async function reactivateListing(id: string): Promise<ActionResult> {
  return move(id, ["withdrawn", "expired"], "pending_review", "reactivated", "This listing can't be sent for review again.");
}

export async function deleteListing(id: string): Promise<ActionResult> {
  const { supabase, user, listing } = await owned(id);
  if (!listing) return { error: "Listing not found." };
  if (!["draft", "rejected", "withdrawn", "expired"].includes(listing.status)) {
    return { error: "Pause a live listing first, then you can delete it." };
  }
  const { data, error } = await supabase.from("listings").delete().eq("id", id).select("id");
  if (error?.code === "23503") return { error: "This listing has orders on it, so it can't be deleted." };
  if (error || !data?.length) return { error: error?.message ?? "Nothing was deleted. Please try again." };

  await removeImages(supabase, user.id, ((listing.media ?? []) as Media[]).map((m) => m.src));
  refresh();
  redirect("/sell?deleted=1");
}
