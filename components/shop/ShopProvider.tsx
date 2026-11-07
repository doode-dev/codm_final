"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// null = worked, "login" = the visitor must sign in first, anything else is an error message to show.
type Result = Promise<string | null>;
type Shop = {
  uid: string | null; cart: string[]; saved: string[];
  addToCart: (id: string) => Result; removeFromCart: (id: string) => Result; toggleSaved: (id: string) => Result;
};
const Ctx = createContext<Shop>({
  uid: null, cart: [], saved: [],
  addToCart: async () => "login", removeFromCart: async () => "login", toggleSaved: async () => "login",
});
export const useShop = () => useContext(Ctx);

export default function ShopProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [cart, setCart] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const client = useRef<ReturnType<typeof createClient> | null>(null);
  const db = () => (client.current ??= createClient());

  const refresh = useCallback(async () => {
    try {
      const { data: { user } } = await db().auth.getUser();
      if (!user) { setUid(null); setCart([]); setSaved([]); return; }
      setUid(user.id);
      const [c, f] = await Promise.all([db().from("cart_items").select("listing_id"), db().from("favorites").select("listing_id")]);
      setCart((c.data ?? []).map((x) => x.listing_id));
      setSaved((f.data ?? []).map((x) => x.listing_id));
    } catch { /* Supabase isn't configured yet */ }
  }, []);

  useEffect(() => {
    refresh();
    try {
      const { data } = db().auth.onAuthStateChange(() => { setTimeout(refresh, 0); });
      return () => data.subscription.unsubscribe();
    } catch { return; }
  }, [refresh]);

  const value: Shop = {
    uid, cart, saved,
    addToCart: async (id) => {
      if (!uid) return "login";
      const { error } = await db().from("cart_items").insert({ user_id: uid, listing_id: id });
      if (error && error.code !== "23505") {
        return error.code === "42501" ? "You can't add this account. It may be your own, or no longer available." : error.message;
      }
      setCart((c) => (c.includes(id) ? c : [...c, id]));
      return null;
    },
    removeFromCart: async (id) => {
      if (!uid) return "login";
      const { error } = await db().from("cart_items").delete().eq("user_id", uid).eq("listing_id", id);
      if (error) return error.message;
      setCart((c) => c.filter((x) => x !== id));
      return null;
    },
    toggleSaved: async (id) => {
      if (!uid) return "login";
      const has = saved.includes(id);
      const { error } = has
        ? await db().from("favorites").delete().eq("user_id", uid).eq("listing_id", id)
        : await db().from("favorites").insert({ user_id: uid, listing_id: id });
      if (error && error.code !== "23505") return error.message;
      setSaved((s) => (has ? s.filter((x) => x !== id) : [...s, id]));
      return null;
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
