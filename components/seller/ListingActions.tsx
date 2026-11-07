"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { deleteListing, pauseListing, reactivateListing } from "@/app/sell/manage-actions";
import type { ActionResult } from "@/lib/listing-input";

const btn = "rounded-sm border border-line px-2.5 py-1 text-xs hover:border-ink disabled:opacity-50";

export default function ListingActions({ id, status, title }: { id: string; status: string; title: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  const run = (fn: (id: string) => Promise<ActionResult>) =>
    start(async () => {
      setError("");
      dialog.current?.close();
      const r = await fn(id); // on success the action redirects and the page refreshes
      if (r?.error) setError(r.error);
    });

  const canEdit = ["draft", "pending_review", "active", "rejected", "withdrawn", "expired"].includes(status);
  const canPause = ["active", "pending_review"].includes(status);
  const canReactivate = ["withdrawn", "expired"].includes(status);
  const canDelete = ["draft", "rejected", "withdrawn", "expired"].includes(status);

  if (!canEdit) return <span className="text-xs text-mute">No actions</span>;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Link href={`/sell/edit/${id}`} className={btn}>Edit</Link>
        {canPause && <button className={btn} disabled={pending} onClick={() => run(pauseListing)}>Pause</button>}
        {canReactivate && <button className={btn} disabled={pending} onClick={() => run(reactivateListing)}>Send for review</button>}
        {canDelete && (
          <button className="rounded-sm border border-alert px-2.5 py-1 text-xs text-alert hover:bg-alert hover:text-white disabled:opacity-50"
            disabled={pending} onClick={() => dialog.current?.showModal()}>Delete</button>
        )}
      </div>
      {error && <p role="alert" className="mt-2 max-w-52 text-xs text-alert">{error}</p>}
      <dialog ref={dialog} className="m-auto w-[min(26rem,calc(100%-1.5rem))] rounded-sm border border-line bg-surface p-0 text-ink">
        <div className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Delete this listing?</h2>
          <p className="text-sm leading-relaxed text-mute">&ldquo;{title}&rdquo; and its screenshots will be erased. This can&apos;t be undone.</p>
          <div className="flex justify-end gap-2">
            <button className={btn} onClick={() => dialog.current?.close()}>Cancel</button>
            <button className="rounded-sm border border-alert px-2.5 py-1 text-xs text-alert hover:bg-alert hover:text-white" onClick={() => run(deleteListing)}>Delete listing</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
