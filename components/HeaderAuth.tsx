"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useShop } from "@/components/shop/ShopProvider";

type Me = { username: string; role: string };
const roleLabel: Record<string, string> = { buyer: "Buyer", seller: "Seller", both: "Buyer and seller", admin: "Admin" };

function CartLink() {
  const { cart } = useShop();
  return (
    <Link href="/cart" aria-label={`Cart, ${cart.length} item${cart.length === 1 ? "" : "s"}`} className="relative flex size-9 items-center justify-center rounded-full border border-line bg-surface hover:border-olive">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6" /><circle cx="9.5" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" />
      </svg>
      {cart.length > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-olive px-1 text-center text-xs font-bold text-white">{cart.length}</span>}
    </Link>
  );
}

export default function HeaderAuth() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined); // undefined = still checking
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | undefined;
    let alive = true;
    try {
      const supabase = createClient();
      const load = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alive && setMe(null);
        const { data: p } = await supabase.from("profiles").select("username,role,status").eq("id", user.id).single();
        if (!alive) return;
        setMe(p && p.status === "active" ? { username: p.username, role: p.role } : null);
      };
      load();
      sub = supabase.auth.onAuthStateChange(() => { setTimeout(load, 0); }).data.subscription; // don't await Supabase calls in this callback
    } catch {
      setMe(null); // Supabase isn't configured yet
    }
    return () => { alive = false; sub?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  async function signOut() {
    setOpen(false);
    await createClient().auth.signOut();
    setMe(null);
    router.push("/");
    router.refresh();
  }

  if (me === undefined) return <div className="h-9 w-28" aria-hidden />; // keeps the header from jumping

  if (!me) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <CartLink />
        <a href="/auth/login" className="underline-offset-4 hover:underline">Log in</a>
        <a href="/auth/register" className="rounded-sm bg-olive px-3 py-1.5 font-medium text-white hover:bg-olive-dark">Register</a>
      </div>
    );
  }

  const item = "block w-full px-4 py-2 text-left text-sm hover:bg-black";
  const sells = me.role === "seller" || me.role === "both";
  const close = () => setOpen(false);
  return (
    <div className="flex items-center gap-3">
      <CartLink />
      <div ref={box} className="relative">
        <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
          className="flex size-9 items-center justify-center rounded-full border border-line bg-surface hover:border-olive">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </button>
        {open && (
          <div role="menu" className="absolute right-0 z-30 mt-2 w-56 border border-line bg-surface py-1">
            <div className="border-b border-line px-4 py-3">
              <p className="truncate font-medium">{me.username}</p>
              <p className="text-xs text-mute">{roleLabel[me.role] ?? me.role}</p>
            </div>
            <Link role="menuitem" href="/profile" onClick={close} className={item}>Profile</Link>
            <Link role="menuitem" href="/orders" onClick={close} className={item}>My orders</Link>
            {sells && <Link role="menuitem" href="/sell" onClick={close} className={item}>Seller centre</Link>}
            {me.role === "admin" && <Link role="menuitem" href="/admin" onClick={close} className={item}>Admin panel</Link>}
            <button role="menuitem" onClick={signOut} className={item}>Sign out</button>
          </div>
        )}
      </div>
    </div>
  );
}
