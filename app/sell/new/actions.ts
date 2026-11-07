"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseListing, type ActionResult } from "@/lib/listing-input";
import { MAX_IMAGES, getFiles, removeImages, uploadImages, type Media } from "@/lib/listing-media";

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export async function createListing(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/sell/new");

  const { data: seller } = await supabase.from("sellers").select("id").eq("id", user.id).maybeSingle();
  if (!seller) redirect("/sell");

  const { data: phoneOk } = await supabase.rpc("seller_phone_verified");
  if (!phoneOk) return { error: "Verify your phone number in the Seller centre before you list an account." };

  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  const files = getFiles(formData);
  if (files.length < 1) return { error: "Add at least one screenshot." };
  if (files.length > MAX_IMAGES) return { error: `You can add up to ${MAX_IMAGES} screenshots.` };

  let media: Media[];
  try {
    media = await uploadImages(supabase, user.id, files);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Image upload failed." };
  }

  const { error } = await supabase.from("listings").insert({
    ...parsed.value,
    slug: `${slugify(parsed.value.title) || "codm-account"}-${crypto.randomUUID().slice(0, 8)}`,
    status: "pending_review",
    seller_id: user.id,
    media,
  });

  if (error) {
    await removeImages(supabase, user.id, media.map((m) => m.src));
    console.error("Create listing failed:", error.message);
    return {
      error: error.code === "42501"
        ? "Your seller profile isn't active yet, so this listing was refused. Please contact support."
        : "Could not create the listing. Please try again.",
    };
  }

  revalidatePath("/sell");
  redirect("/sell?created=1");
}
