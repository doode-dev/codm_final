import { ranks } from "@/data/site";

export type ActionResult = { error?: string; ok?: boolean } | null | undefined;

export const REGIONS = ["Global", "Asia", "Europe", "North America", "South America", "Africa", "Middle East", "Oceania"];
export const PLATFORMS = ["Android", "iOS"];
export const SIGN_INS = ["Activision account", "Facebook", "Google", "Apple ID", "Other"];

const text = (f: FormData, k: string, max = 300) => {
  const v = String(f.get(k) ?? "").trim();
  if (v.length > max) throw new Error(`Keep each text field under ${max} characters.`);
  return v;
};
const whole = (f: FormData, k: string, label: string, min: number, max: number) => {
  const raw = text(f, k);
  const n = raw === "" ? 0 : Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return n;
};
const oneOf = (v: string, options: readonly string[], label: string) => {
  if (!options.includes(v)) throw new Error(`Choose a valid ${label}.`);
  return v;
};
const csv = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 60);

function weapons(v: string) {
  return v.split("\n").slice(0, 30).flatMap((line) => {
    const [name, skin, rarity, level] = line.split("|").map((x) => x.trim());
    if (!name || !skin) return [];
    const r = ["Mythic", "Legendary", "Epic"].includes(rarity) ? rarity : "Epic";
    return [{ name, skin, rarity: r as "Mythic" | "Legendary" | "Epic", upgradeLevel: Math.max(0, Math.min(99, Number(level) || 0)) }];
  });
}

// Reads and checks the listing form. Used by both "create" and "edit", so the rules are the same.
export function parseListing(f: FormData) {
  try {
    if (f.get("disclosure") !== "on") throw new Error("Confirm the disclosure at the bottom of the form.");

    const title = text(f, "title", 120);
    if (title.length < 10) throw new Error("Give the listing a title of at least 10 characters.");

    const price = Number(text(f, "price"));
    if (!Number.isFinite(price) || price < 1 || price > 100000) throw new Error("Enter an asking price between $1 and $100,000.");

    const recovery = text(f, "recoveryDependencies", 200);
    if (!recovery) throw new Error("Say what the account is linked to (for example the email or social login).");

    return {
      value: {
        title,
        price_cents: Math.round(price * 100),
        region: oneOf(text(f, "region"), REGIONS, "region"),
        platform: oneOf(text(f, "platform"), PLATFORMS, "platform"),
        game_version: text(f, "game_version", 60) || null,
        level: whole(f, "level", "Level", 1, 500),
        mp_rank: oneOf(text(f, "mp_rank"), ranks, "multiplayer rank"),
        mp_ranked_season: text(f, "mp_ranked_season", 60) || null,
        br_rank: oneOf(text(f, "br_rank"), ranks, "battle royale rank"),
        inventory: {
          mythic: csv(text(f, "mythic", 3000)),
          legendary: csv(text(f, "legendary", 3000)),
          operatorSkins: csv(text(f, "operatorSkins", 3000)),
          weapons: weapons(text(f, "weapons", 4000)),
          collectibles: {
            emotes: whole(f, "emotes", "Emotes", 0, 9999), callingCards: whole(f, "callingCards", "Calling cards", 0, 9999),
            avatars: whole(f, "avatars", "Avatars", 0, 9999), frames: whole(f, "frames", "Frames", 0, 9999),
            charms: whole(f, "charms", "Charms", 0, 9999), blueprints: whole(f, "blueprints", "Blueprints", 0, 9999),
          },
        },
        cp: whole(f, "cp", "COD Points", 0, 10_000_000),
        credits: whole(f, "credits", "Credits", 0, 100_000_000),
        access: {
          signInMethod: oneOf(text(f, "signInMethod"), SIGN_INS, "sign-in method"),
          transferLimitations: text(f, "transferLimitations") || "Not disclosed",
          recoveryDependencies: recovery,
        },
        risk: {
          knownRestrictions: text(f, "knownRestrictions") || "Not disclosed",
          previousEnforcement: text(f, "previousEnforcement") || "Not disclosed",
          transferUncertainty:
            "Account transfers are not recognised by the game publisher. Access may be restricted or recovered by the original owner at any time.",
        },
        proof_provided: false,
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Check the form and try again." };
  }
}
