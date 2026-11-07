"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { SelectField, TextField } from "@/components/auth/ui";
import { ranks } from "@/data/site";
import { PLATFORMS, REGIONS, SIGN_INS, type ActionResult } from "@/lib/listing-input";
import Area from "./Area";

export type ListingInitial = Partial<{
  title: string; region: string; platform: string; game_version: string; level: number | string;
  mp_rank: string; mp_ranked_season: string; br_rank: string; mythic: string; legendary: string; operatorSkins: string; weapons: string;
  emotes: number; callingCards: number; avatars: number; frames: number; charms: number; blueprints: number;
  cp: number; credits: number; signInMethod: string; transferLimitations: string; recoveryDependencies: string;
  knownRestrictions: string; previousEnforcement: string; price: number | string; media: { src: string; caption: string }[];
}>;

const MAX = 6;
const DEFAULTS = {
  region: "Global", platform: "Android", game_version: "Season 10, 2026", mp_rank: "Rookie", br_rank: "Rookie", signInMethod: "Activision account",
  transferLimitations: "Linked sign-in must be changed by the buyer after delivery.", knownRestrictions: "None known", previousEnforcement: "None disclosed",
};

// Resizes a screenshot to at most 1600px and re-saves it as JPEG. This keeps uploads small and drops hidden camera/location data.
async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Only JPG, PNG and WebP images are allowed.");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  if (!blob) throw new Error("Could not process that image.");
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-mute">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
const two = "grid gap-4 sm:grid-cols-2";

export default function ListingForm({ action, initial = {}, editing = false, liveWarning = false }: {
  action: (fd: FormData) => Promise<ActionResult>; initial?: ListingInitial; editing?: boolean; liveWarning?: boolean;
}) {
  const v = { ...DEFAULTS, ...initial } as ListingInitial & typeof DEFAULTS;
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [busyImages, setBusyImages] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const existing = (initial.media ?? []).filter((m) => !removed.includes(m.src));
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  const total = existing.length + files.length;

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    setBusyImages(true);
    try {
      const room = MAX - total;
      if (list.length > room) throw new Error(`You can have up to ${MAX} screenshots. Remove one first.`);
      const done: File[] = [];
      for (const f of Array.from(list)) done.push(await shrink(f));
      setFiles((cur) => [...cur, ...done]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add that image.");
    } finally {
      setBusyImages(false);
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (total < 1) { setError("Add at least one screenshot."); return; }
    const fd = new FormData(e.currentTarget); // the file picker has no name, so only our shrunk copies are sent
    fd.set("currency", "USD");
    files.forEach((f) => fd.append("media", f, f.name));
    start(async () => {
      const r = await action(fd); // on success the action redirects to /sell
      if (r?.error) { setError(r.error); window.scrollTo({ top: 0, behavior: "smooth" }); }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <p role="alert" className="border-l-2 border-alert pl-3 text-sm text-alert">{error}</p>}
      {liveWarning && (
        <p className="border-l-2 border-olive pl-3 text-sm leading-relaxed text-mute">
          This listing is live. Saving sends it back to review and hides it from buyers until a moderator approves it again.
        </p>
      )}

      <Section title="The listing" hint="A clear title and honest price get the most interest.">
        <TextField label="Title" name="title" required minLength={10} maxLength={120} defaultValue={v.title}
          placeholder="Level 211, Legendary rank, 6 mythic items" />
        <div className={two}>
          <TextField label="Asking price (USD)" name="price" type="number" required min={1} max={100000} step="0.01" inputMode="decimal" defaultValue={v.price}
            hint="A buyer service fee is added at checkout and a seller commission is taken when it sells." />
          <TextField label="Game version or season" name="game_version" defaultValue={v.game_version} />
        </div>
        <div className={two}>
          <SelectField label="Platform" name="platform" defaultValue={v.platform}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</SelectField>
          <SelectField label="Region" name="region" defaultValue={v.region}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</SelectField>
        </div>
      </Section>

      <Section title="Progression">
        <div className={two}>
          <TextField label="Account level" name="level" type="number" required min={1} max={500} inputMode="numeric" defaultValue={v.level} />
          <TextField label="Ranked season" name="mp_ranked_season" defaultValue={v.mp_ranked_season} placeholder="Season 10" />
        </div>
        <div className={two}>
          <SelectField label="Multiplayer rank" name="mp_rank" defaultValue={v.mp_rank}>{ranks.map((r) => <option key={r}>{r}</option>)}</SelectField>
          <SelectField label="Battle royale rank" name="br_rank" defaultValue={v.br_rank}>{ranks.map((r) => <option key={r}>{r}</option>)}</SelectField>
        </div>
      </Section>

      <Section title="Inventory" hint="List what the account really has. Buyers compare these lines.">
        <Area label="Mythic items" name="mythic" rows={2} defaultValue={v.mythic} hint="Separate with commas. Example: DL Q33 Cryo Fang, Krig 6 Hollow Point" />
        <Area label="Legendary items" name="legendary" rows={2} defaultValue={v.legendary} hint="Separate with commas." />
        <Area label="Operator skins" name="operatorSkins" rows={2} defaultValue={v.operatorSkins} hint="Separate with commas." />
        <Area label="Featured weapons" name="weapons" rows={4} defaultValue={v.weapons}
          hint="One per line: Name | Skin | Rarity | Upgrade level. Example: DL Q33 | Cryo Fang | Mythic | 8" />
      </Section>

      <Section title="Collection and currency">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {([["emotes", "Emotes"], ["callingCards", "Calling cards"], ["avatars", "Avatars"], ["frames", "Frames"], ["charms", "Charms"], ["blueprints", "Blueprints"]] as const).map(([k, l]) => (
            <TextField key={k} label={l} name={k} type="number" min={0} inputMode="numeric" defaultValue={v[k] ?? 0} />
          ))}
        </div>
        <div className={two}>
          <TextField label="COD Points balance" name="cp" type="number" min={0} inputMode="numeric" defaultValue={v.cp ?? 0} />
          <TextField label="Credits balance" name="credits" type="number" min={0} inputMode="numeric" defaultValue={v.credits ?? 0} />
        </div>
      </Section>

      <Section title="Access and risk" hint="Never write passwords, codes or recovery details here. Buyers get access details only through the protected order page.">
        <div className={two}>
          <SelectField label="Sign-in method" name="signInMethod" defaultValue={v.signInMethod}>{SIGN_INS.map((s) => <option key={s}>{s}</option>)}</SelectField>
          <TextField label="What is it linked to?" name="recoveryDependencies" required maxLength={200} defaultValue={v.recoveryDependencies}
            placeholder="Linked Facebook profile" />
        </div>
        <TextField label="Transfer limits" name="transferLimitations" maxLength={300} defaultValue={v.transferLimitations} />
        <div className={two}>
          <TextField label="Known restrictions" name="knownRestrictions" maxLength={300} defaultValue={v.knownRestrictions} />
          <TextField label="Previous enforcement" name="previousEnforcement" maxLength={300} defaultValue={v.previousEnforcement}
            hint="Any bans, mutes or warnings. Be honest: buyers can dispute a listing that hid this." />
        </div>
      </Section>

      <Section title="Screenshots" hint={`Add 1 to ${MAX}. Show your profile and level, both ranks, and your inventory. The first image is the cover.`}>
        {total > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existing.map((m) => (
              <li key={m.src}>
                <div className="relative aspect-video bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.src} alt={m.caption} className="h-full w-full object-cover" />
                </div>
                <button type="button" onClick={() => setRemoved((r) => [...r, m.src])} className="mt-1 text-xs text-mute underline underline-offset-4 hover:text-alert">Remove</button>
              </li>
            ))}
            {previews.map((src, i) => (
              <li key={src}>
                <div className="relative aspect-video bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`New screenshot ${i + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-sm bg-olive px-1.5 py-0.5 text-xs font-medium text-white">New</span>
                </div>
                <button type="button" onClick={() => setFiles((f) => f.filter((_, j) => j !== i))} className="mt-1 text-xs text-mute underline underline-offset-4 hover:text-alert">Remove</button>
              </li>
            ))}
          </ul>
        )}
        {removed.map((src) => <input key={src} type="hidden" name="removeMedia" value={src} />)}
        <div>
          <label className="inline-block cursor-pointer rounded-sm border border-line px-3 py-2 text-sm hover:border-ink">
            {busyImages ? "Processing" : total ? "Add more screenshots" : "Choose screenshots"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busyImages || total >= MAX} className="sr-only"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
          <span className="ml-3 text-xs text-mute">{total} of {MAX}</span>
          <p className="mt-2 text-xs leading-relaxed text-mute">
            Hide usernames, emails, player IDs and any codes before you upload. Each image is resized and re-saved, which also removes hidden location data.
          </p>
        </div>
      </Section>

      <section className="border border-line bg-surface p-5 sm:p-6">
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="disclosure" required className="mt-1 size-4 shrink-0 accent-[var(--color-olive)]" />
          <span>
            I own this account and everything above is true. I understand that selling a game account breaks Activision&apos;s terms, and that the account
            can be banned or recovered by its original owner.
          </span>
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || busyImages}
          className="rounded-sm bg-olive px-5 py-2.5 text-sm font-medium text-white hover:bg-olive-dark disabled:opacity-60">
          {pending ? "Saving" : editing ? "Save and send for review" : "Submit for review"}
        </button>
        <Link href="/sell" className="rounded-sm border border-line px-5 py-2.5 text-sm hover:border-ink">Cancel</Link>
      </div>
    </form>
  );
}
