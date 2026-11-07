import type { Rank } from "./site";

/* All data here is dummy. Prices are in minor units (cents). */

export type Seller = { id: string; name: string; rating: number; completedSales: number; joinedAt: string; verified: boolean };
export type Weapon = { name: string; skin: string; rarity: "Mythic" | "Legendary" | "Epic"; upgradeLevel: number };
export type Listing = {
  id: string; slug: string; title: string;
  status: "draft" | "pending_review" | "active" | "reserved" | "sold" | "rejected" | "withdrawn" | "suspended" | "expired";
  createdAt: string; updatedAt: string; featured: boolean; views: number; favorites: number;
  game: { name: string; region: string; platform: "Android" | "iOS"; version: string };
  progression: { level: number; mpRank: Rank; mpRankedSeason: string; brRank: Rank };
  inventory: {
    mythic: string[]; legendary: string[]; operatorSkins: string[]; weapons: Weapon[];
    collectibles: { emotes: number; callingCards: number; avatars: number; frames: number; charms: number; blueprints: number };
  };
  currency: { cp: number; credits: number };
  access: { signInMethod: string; transferLimitations: string; recoveryDependencies: string };
  proofOfOwnership: { provided: boolean; redacted: boolean };
  media: { src: string; caption: string }[];
  pricing: { askingPrice: number; previousPrice?: number; currency: string; buyerFeePct: number };
  seller: Seller;
  risk: { knownRestrictions: string; previousEnforcement: string; transferUncertainty: string };
  moderation: { verificationStatus: "attributes_verified" | "seller_declared"; reviewedAt: string; notes: string };
};

const sellers: Record<string, Seller> = {
  kofi: { id: "S-1042", name: "kofi_loadouts", rating: 4.9, completedSales: 38, joinedAt: "2024-03-12", verified: true },
  maren: { id: "S-2217", name: "maren.v", rating: 4.7, completedSales: 12, joinedAt: "2025-06-02", verified: true },
  tobi: { id: "S-3390", name: "tobi_sells", rating: 4.2, completedSales: 3, joinedAt: "2026-08-19", verified: false },
};

const UNCERTAIN = "Account transfers are not recognised by the game publisher. Access may be restricted or recovered by the original owner at any time.";
const shots = (id: string) => [
  { src: `/listings/${id}/profile.jpg`, caption: "Profile and level" },
  { src: `/listings/${id}/ranks.jpg`, caption: "Multiplayer and battle royale ranks" },
  { src: `/listings/${id}/inventory.jpg`, caption: "Inventory" },
];

type Seed = {
  id: string; slug: string; title: string; created: string; featured?: boolean; views: number; favorites: number;
  region: string; platform: "Android" | "iOS"; level: number; mp: Rank; season: string; br: Rank;
  mythic: string[]; legendary: string[]; operators: string[]; weapons: Weapon[];
  collectibles: Listing["inventory"]["collectibles"]; cp: number; credits: number;
  signIn: string; recovery: string; owned: boolean; price: number; was?: number; seller: Seller;
  restrictions: string; enforcement: string; verified: boolean; notes: string;
};

const make = (s: Seed): Listing => ({
  id: s.id, slug: s.slug, title: s.title, status: "active", createdAt: s.created, updatedAt: s.created,
  featured: !!s.featured, views: s.views, favorites: s.favorites,
  game: { name: "Call of Duty: Mobile", region: s.region, platform: s.platform, version: "Season 10, 2026" },
  progression: { level: s.level, mpRank: s.mp, mpRankedSeason: s.season, brRank: s.br },
  inventory: { mythic: s.mythic, legendary: s.legendary, operatorSkins: s.operators, weapons: s.weapons, collectibles: s.collectibles },
  currency: { cp: s.cp, credits: s.credits },
  access: { signInMethod: s.signIn, transferLimitations: "Linked sign-in must be changed by the buyer after delivery. Some regions limit changes.", recoveryDependencies: s.recovery },
  proofOfOwnership: { provided: s.owned, redacted: true },
  media: shots(s.id),
  pricing: { askingPrice: s.price, previousPrice: s.was, currency: "USD", buyerFeePct: 5 },
  seller: s.seller,
  risk: { knownRestrictions: s.restrictions, previousEnforcement: s.enforcement, transferUncertainty: UNCERTAIN },
  moderation: { verificationStatus: s.verified ? "attributes_verified" : "seller_declared", reviewedAt: s.created, notes: s.notes },
});

const none = { emotes: 0, callingCards: 0, avatars: 0, frames: 0, charms: 0, blueprints: 0 };

export const listings: Listing[] = [
  make({ id: "CM-48213", slug: "level-211-legendary-6-mythics", title: "Level 211, Legendary rank, 6 mythic items", created: "2026-10-18", featured: true, views: 412, favorites: 37,
    region: "Global", platform: "Android", level: 211, mp: "Legendary", season: "Season 9", br: "Master",
    mythic: ["DL Q33 Cryo Fang", "Peacekeeper MK2 Solar Flare", "Krig 6 Hollow Point", "Ghost Reaper's Mark", "Kilo Bolt-Action Ashfall", "Fennec Redline"],
    legendary: ["AK-47 Jungle Wrath", "M4 Frostbite", "Oden Night Watch", "Type 25 Ember", "RUS-79U Static", "Chopper Flatline", "BK57 Dusk", "Shorty Tidepool"],
    operators: ["Ghost Reaper's Mark", "Price Winter Guard", "Mara Verdigris"],
    weapons: [{ name: "DL Q33", skin: "Cryo Fang", rarity: "Mythic", upgradeLevel: 8 }, { name: "Peacekeeper MK2", skin: "Solar Flare", rarity: "Mythic", upgradeLevel: 8 }, { name: "AK-47", skin: "Jungle Wrath", rarity: "Legendary", upgradeLevel: 6 }],
    collectibles: { emotes: 41, callingCards: 120, avatars: 33, frames: 18, charms: 22, blueprints: 9 }, cp: 1240, credits: 86000,
    signIn: "Activision account", recovery: "Seller's email, to be removed before delivery", owned: true, price: 42000, was: 48000, seller: sellers.kofi,
    restrictions: "None known", enforcement: "None disclosed", verified: true, notes: "Level, ranks and mythic list matched screenshots." }),
  make({ id: "CM-47890", slug: "level-176-grandmaster-3-mythics", title: "Level 176, Grandmaster rank, 3 mythic items", created: "2026-10-17", featured: true, views: 288, favorites: 21,
    region: "Global", platform: "Android", level: 176, mp: "Grandmaster", season: "Season 10", br: "Pro",
    mythic: ["Krig 6 Hollow Point", "HVK-30 Quartz", "Ghost Nightfall"],
    legendary: ["M13 Sunbreak", "ASM10 Tangent", "QQ9 Riptide", "HS2126 Cinder"],
    operators: ["Ghost Nightfall", "Alex Rustwater"],
    weapons: [{ name: "Krig 6", skin: "Hollow Point", rarity: "Mythic", upgradeLevel: 7 }, { name: "HVK-30", skin: "Quartz", rarity: "Mythic", upgradeLevel: 6 }],
    collectibles: { emotes: 24, callingCards: 80, avatars: 19, frames: 11, charms: 14, blueprints: 4 }, cp: 320, credits: 41000,
    signIn: "Facebook", recovery: "Linked Facebook profile", owned: true, price: 21500, seller: sellers.maren,
    restrictions: "None known", enforcement: "One 24-hour chat mute in 2025", verified: true, notes: "Ranks confirmed from ranked history screenshot." }),
  make({ id: "CM-47611", slug: "level-143-master-2-mythics", title: "Level 143, Master rank, 2 mythic items", created: "2026-10-15", views: 176, favorites: 9,
    region: "Asia", platform: "iOS", level: 143, mp: "Master", season: "Season 10", br: "Elite",
    mythic: ["Peacekeeper MK2 Solar Flare", "Fennec Redline"],
    legendary: ["Switchblade X9 Pulse", "Man-O-War Ironclad", "AK117 Dune"],
    operators: ["Mara Verdigris"],
    weapons: [{ name: "Peacekeeper MK2", skin: "Solar Flare", rarity: "Mythic", upgradeLevel: 5 }, { name: "Fennec", skin: "Redline", rarity: "Mythic", upgradeLevel: 5 }],
    collectibles: { emotes: 15, callingCards: 52, avatars: 12, frames: 6, charms: 8, blueprints: 2 }, cp: 90, credits: 22000,
    signIn: "Apple ID", recovery: "Apple ID held by seller, handed over in full", owned: false, price: 11800, was: 13500, seller: sellers.kofi,
    restrictions: "iOS accounts may not move to Android", enforcement: "None disclosed", verified: false, notes: "Seller-declared. Screenshots show level and rank only." }),
  make({ id: "CM-47402", slug: "level-98-pro-rank-legendary-weapons", title: "Level 98, Pro rank, 9 legendary weapons", created: "2026-10-12", views: 120, favorites: 6,
    region: "Europe", platform: "Android", level: 98, mp: "Pro", season: "Season 10", br: "Veteran",
    mythic: [], legendary: ["AK-47 Jungle Wrath", "M4 Frostbite", "Oden Night Watch", "RUS-79U Static", "Chopper Flatline", "BK57 Dusk", "Shorty Tidepool", "DR-H Tundra", "Fennec Ember"],
    operators: ["Price Winter Guard"],
    weapons: [{ name: "AK-47", skin: "Jungle Wrath", rarity: "Legendary", upgradeLevel: 5 }, { name: "M4", skin: "Frostbite", rarity: "Legendary", upgradeLevel: 4 }],
    collectibles: { emotes: 9, callingCards: 33, avatars: 8, frames: 4, charms: 5, blueprints: 1 }, cp: 0, credits: 15000,
    signIn: "Google", recovery: "Linked Google account", owned: true, price: 6200, seller: sellers.maren,
    restrictions: "None known", enforcement: "None disclosed", verified: true, notes: "Weapon list matched screenshots." }),
  make({ id: "CM-47155", slug: "level-64-elite-starter-collection", title: "Level 64, Elite rank, starter collection", created: "2026-10-09", views: 74, favorites: 3,
    region: "Global", platform: "Android", level: 64, mp: "Elite", season: "Season 10", br: "Rookie",
    mythic: [], legendary: ["M4 Frostbite", "Shorty Tidepool"], operators: [],
    weapons: [{ name: "M4", skin: "Frostbite", rarity: "Legendary", upgradeLevel: 3 }],
    collectibles: { ...none, emotes: 4, callingCards: 18, avatars: 5 }, cp: 0, credits: 9000,
    signIn: "Facebook", recovery: "Linked Facebook profile", owned: false, price: 2400, seller: sellers.tobi,
    restrictions: "None known", enforcement: "None disclosed", verified: false, notes: "New seller, seller-declared only." }),
  make({ id: "CM-46970", slug: "level-189-legendary-rank-4-mythics", title: "Level 189, Legendary rank, 4 mythic items", created: "2026-10-06", views: 351, favorites: 28,
    region: "Global", platform: "Android", level: 189, mp: "Legendary", season: "Season 10", br: "Grandmaster",
    mythic: ["DL Q33 Cryo Fang", "Krig 6 Hollow Point", "Kilo Bolt-Action Ashfall", "Ghost Reaper's Mark"],
    legendary: ["AK-47 Jungle Wrath", "Oden Night Watch", "RUS-79U Static", "BK57 Dusk", "Chopper Flatline"],
    operators: ["Ghost Reaper's Mark", "Alex Rustwater"],
    weapons: [{ name: "DL Q33", skin: "Cryo Fang", rarity: "Mythic", upgradeLevel: 8 }, { name: "Kilo Bolt-Action", skin: "Ashfall", rarity: "Mythic", upgradeLevel: 7 }],
    collectibles: { emotes: 30, callingCards: 96, avatars: 26, frames: 14, charms: 17, blueprints: 6 }, cp: 610, credits: 64000,
    signIn: "Activision account", recovery: "Seller's email, to be removed before delivery", owned: true, price: 33900, was: 36500, seller: sellers.kofi,
    restrictions: "None known", enforcement: "None disclosed", verified: true, notes: "Level, ranks and mythic list matched screenshots." }),
];
