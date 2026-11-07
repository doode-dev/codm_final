"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Listing } from "@/data/accounts";
import Row from "./ListingRow";
import Detail from "./Detail";

const SHOWN = 10;

export default function HomeAccounts({ listings }: { listings: Listing[] }) {
  const [open, setOpen] = useState<Listing | null>(null);
  const active = useMemo(() => listings.filter((l) => l.status === "active"), [listings]);
  const top = useMemo(
    () => [...active].sort((a, b) => Number(b.featured) - Number(a.featured) || b.views - a.views).slice(0, SHOWN),
    [active],
  );

  return (
    <section id="browse" className="mx-auto max-w-6xl px-5 pb-14">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">Featured accounts</h2>
        <Link href="/accounts" className="text-sm text-mute underline underline-offset-4 hover:text-ink">
          See all {active.length}
        </Link>
      </div>
      <ul className="space-y-3">
        {top.map((l) => <Row key={l.id} l={l} onOpen={setOpen} />)}
      </ul>
      <div className="mt-8 flex justify-center">
        <Link href="/accounts" className="rounded-sm bg-olive px-6 py-3 text-sm font-medium text-white hover:bg-olive-dark">
          Explore all {active.length} accounts
        </Link>
      </div>
      <Detail l={open} onClose={() => setOpen(null)} />
    </section>
  );
}
