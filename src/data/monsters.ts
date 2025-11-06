//src/data/monster.ts

import type { Actor, Item } from '../engine/types';
import { xpToNextLevel } from '../engine/leveling';
import { makeItemFromCode } from '../engine/item-index';



// Small scaler: base + perLv * (lvl - baseLevel)
function grow(base: number, perLv: number, level: number, baseLevel = 1) {
  return Math.max(0, Math.floor(base + perLv * (level - baseLevel)));
}

// Fully-specified stat bag used *after* normalization.
type BaseStats = {
  hp: number; str: number; dex: number; int: number; wis: number; vit: number;
  con: number; speed: number; armor: number; resist: number; luck: number;
};

// What authors write in templates (some fields optional)
type BaseStatsInput = {
  hp: number; str: number; dex: number; int: number; wis: number; vit: number;
  con?: number; speed: number; armor?: number; resist?: number; luck?: number;
};

// Allow growth on any stat (including hp)
type GrowthMap = Partial<Record<keyof BaseStats, number>>;

type MonsterTemplate = {
  id: string;
  name: string;
  minLv: number; maxLv: number;
  tags?: Record<string, boolean | number>;
  base: BaseStatsInput;
  growth?: GrowthMap;
  equip?: (a: Actor, level: number) => void;
  loot?:  (a: Actor, level: number) => Item[];
  spriteId?: string,
};

// Normalize optional base stats so we never reach for undefined.
function normalizeBase(b: BaseStatsInput): BaseStats {
  return {
    hp: b.hp, str: b.str, dex: b.dex, int: b.int, wis: b.wis, vit: b.vit,
    con: b.con ?? 0, speed: b.speed, armor: b.armor ?? 0, resist: b.resist ?? 0, luck: b.luck ?? 0,
  };
}


// ------------ CONCRETE TEMPLATES ---------------




export const MONSTERS: MonsterTemplate[] = [

        // --- Goblin (Lv1–4) — your OG baseline ---
    {
    id: 'goblin',
    name: 'Goblin',
    minLv: 1, maxLv: 4,
    tags: { humanoid: true, goblinoid: true },
    base: { hp: 10, str: 2, dex: 4, int: 1, wis: 1, vit: 5, con: 1, speed: 3, armor: 0, resist: 0, luck: 2 },
    growth: { hp: 2, dex: 1 },
    equip: (a) => {
      const pool = ['goblin-club','wooden-club','iron-dagger','goblin-shortsword'] as const;
      const w = pool[Math.floor(Math.random() * pool.length)];
      (a.equipment ??= {}).weapon = makeItemFromCode(w);
      if (Math.random() < 0.60) (a.equipment ??= {}).cuirass = makeItemFromCode('goblin-loincloth');
      if (Math.random() < 0.40) (a.equipment ??= {}).boots   = makeItemFromCode('goblin-leather-boots');
      if (Math.random() < 0.30) (a.equipment ??= {}).helm    = makeItemFromCode('goblin-hide-helm');
    },
    loot: () => {
  const r = Math.random();
  if (r < 0.26) return [makeItemFromCode('heal-lesser')];     // most common
  if (r < 0.33) return [makeItemFromCode('stamina-lesser')];  // sometimes
  if (r < 0.36) return [makeItemFromCode('mana-lesser')];     // rare
  return [];
},
    spriteId: 'goblin',
  },


  // Wolf Lv 2–5
  {
    id: 'wolf',
    name: 'Wolf',
    minLv: 2, maxLv: 5,
    tags: { beast: true },
    base: { hp: 14, str: 5, dex: 6, int: 1, wis: 2, vit: 3, con: 4, speed: 7, armor: 0, resist: 0, luck: 2 },
    growth: { hp: 3, str: 1, dex: 1, vit: 1, speed: 1 },
    loot: () => {
  const r = Math.random();
  if (r < 0.18) return [makeItemFromCode('heal-lesser')];
  if (r < 0.26) return [makeItemFromCode('stamina-lesser')];
  if (r < 0.29) return [makeItemFromCode('mana-lesser')];
  return [];
},
    spriteId: 'wolf',
    // ability notes: Bite, Leaping Slash (engine hook later)
  },

  // Goblin Warrior Lv 3–9 (your Lv3 baseline given)
  {
    id: 'goblin-warrior',
    name: 'Goblin Warrior',
    minLv: 3, maxLv: 9,
    tags: { humanoid: true, goblinoid: true },
    base: { hp: 15, str: 5, dex: 4, int: 2, wis: 4, vit: 5, con: 4, speed: 4, armor: 1, resist: 0, luck: 1 },
    growth: { hp: 3, str: 1, dex: 1, vit: 1, speed: 1, armor: 0.3 },
    equip: (a) => {
      (a.equipment ??= {}).weapon = makeItemFromCode('goblin-shortsword');
      if (Math.random() < 0.9) (a.equipment ??= {}).cuirass = makeItemFromCode('hide-cuirass'); // “Fur Armor”
    },
    loot: () => {
  const r = Math.random();
  if (r < 0.24) return [makeItemFromCode('heal-lesser')];
  if (r < 0.31) return [makeItemFromCode('stamina-lesser')];
  if (r < 0.34) return [makeItemFromCode('mana-lesser')];
  return [];
},
    spriteId: 'goblin-warrior',
  },

  // Goblin Thief Lv 3–8 (your Lv3 baseline given)
  {
    id: 'goblin-thief',
    name: 'Goblin Thief',
    minLv: 3, maxLv: 8,
    tags: { humanoid: true, goblinoid: true },
    base: { hp: 16, str: 4, dex: 6, int: 3, wis: 2, vit: 4, con: 4, speed: 7, armor: 1, resist: 0, luck: 1 },
    growth: { hp: 2, dex: 1, speed: 1, luck: 1 },
    equip: (a) => {
      (a.equipment ??= {}).weapon = makeItemFromCode('goblin-bone-dagger');
      (a.equipment ??= {}).cuirass = makeItemFromCode('goblin-leather-armor'); // unique to thief
    },
    loot: () => {
  const r = Math.random();
  if (r < 0.20) return [makeItemFromCode('heal-lesser')];
  if (r < 0.30) return [makeItemFromCode('stamina-lesser')];
  if (r < 0.33) return [makeItemFromCode('mana-lesser')];
  return [];
},
    spriteId: 'goblin-thief',
  },

  // Giant Bat Lv 3–6 (you also listed 5–8; we’ll support both by template range)
  {
    id: 'giant-bat',
    name: 'Giant Bat',
    minLv: 3, maxLv: 8,
    tags: { beast: true, flying: true, resist_poison: 20 },
    base: { hp: 20, str: 6, dex: 8, int: 3, wis: 4, vit: 5, con: 6, speed: 10, armor: 0, resist: 0, luck: 3 },
    growth: { hp: 3, dex: 1, speed: 1, str: 1 },
    spriteId: 'giant-bat'
  },

  // Human Bandit Lv 4–8
  {
    id: 'human-bandit',
    name: 'Bandit',
    minLv: 4, maxLv: 8,
    tags: { humanoid: true },
    base: { hp: 22, str: 6, dex: 6, int: 3, wis: 3, vit: 5, con: 5, speed: 6, armor: 1, resist: 0, luck: 2 },
    growth: { hp: 3, str: 1, dex: 1, speed: 1 },
    equip: (a) => {
      (a.equipment ??= {}).weapon = Math.random() < 0.5
        ? makeItemFromCode('iron-shortsword')
        : makeItemFromCode('wooden-club');
      if (Math.random() < 0.4) (a.equipment ??= {}).cuirass = makeItemFromCode('leather-jerkin');
      if (Math.random() < 0.3) (a.equipment ??= {}).boots = makeItemFromCode('leather-boots');
    },
    loot: () => {
  const r = Math.random();
  if (r < 0.22) return [makeItemFromCode('heal-lesser')];
  if (r < 0.29) return [makeItemFromCode('stamina-lesser')];
  if (r < 0.32) return [makeItemFromCode('mana-lesser')];
  return [];
},
    spriteId: 'human-bandit-dagger',
  },

  // Goblin Boss Lv 5 (Mini-Boss)
  {
    id: 'goblin-boss',
    name: 'Goblin Boss',
    minLv: 5, maxLv: 5,
    tags: { humanoid: true, goblinoid: true, miniboss: true },
    base: { hp: 25, str: 9, dex: 7, int: 6, wis: 5, vit: 6, con: 8, speed: 6, armor: 2, resist: 0, luck: 3 },
    equip: (a) => {
      (a.equipment ??= {}).weapon   = makeItemFromCode('gladius');
      (a.equipment ??= {}).cuirass  = makeItemFromCode('goblin-leather-jerkin');
      (a.equipment ??= {}).boots    = makeItemFromCode('goblin-leather-boots');
      (a.equipment ??= {}).helm     = makeItemFromCode('leather-hood');
      (a.equipment ??= {}).gauntlets= makeItemFromCode('leather-gauntlets');
    },
    loot: () => [makeItemFromCode('stamina-potion')], // guaranteed nice drop
    spriteId: 'goblin-boss',

  },

  // Orc Lv 6 (and 7–15 variants below)
  {
    id: 'orc',
    name: 'Orc',
    minLv: 6, maxLv: 15,
    tags: { humanoid: true, orc: true },
    base: { hp: 32, str: 11, dex: 7, int: 5, wis: 4, vit: 9, con: 8, speed: 8, armor: 1, resist: 0, luck: 3 },
    growth: { hp: 4, str: 1, vit: 1, speed: 0.5, armor: 0.3 },
    equip: (a) => {
      (a.equipment ??= {}).weapon = makeItemFromCode('iron-shortsword');
      (a.equipment ??= {}).cuirass = makeItemFromCode('hide-armor');
    },
    loot: () => (Math.random() < 0.35 ? [makeItemFromCode('stamina-lesser')] : []),
    spriteId: 'orc-longsword',
  },

  // Hobgoblin Lv 7
  {
    id: 'hobgoblin',
    name: 'Hobgoblin',
    minLv: 7, maxLv: 12,
    tags: { humanoid: true, goblinoid: true },
    base: { hp: 30, str: 10, dex: 9, int: 6, wis: 6, vit: 7, con: 7, speed: 6, armor: 2, resist: 0, luck: 2 },
    growth: { hp: 3, str: 1, dex: 1, vit: 1, armor: 0.4 },
    equip: (a) => {
        (a.equipment ??= {}).weapon = makeItemFromCode('steel-longsword');
        (a.equipment ??= {}).cuirass = makeItemFromCode('iron-breastplate');
    },
    loot: () => (Math.random() < .25 ? [makeItemFromCode('steel-longsword')] : []),
    spriteId: 'hobgoblin-steel-longsword',
  },

  // Green Slime Lv 8 (slime tag → stamina drops)
  {
    id: 'green-slime',
    name: 'green Slime',
    minLv: 8, maxLv: 12,
    tags: { slime: true },
    base: { hp: 45, str: 12, dex: 13, int: 1, wis: 11, vit: 8, con: 10, speed: 3, armor: 1, resist: 0, luck: 1 },
    growth: { hp: 5, vit: 1, con: 1 },
    loot: () => (Math.random() < 0.95 ? [makeItemFromCode('stamina-lesser')] : []),
    spriteId: 'green-slime',

  },

  // … add: Orc Warrior (8–10), Orc Thug (8–10), Orc Brute (9–13), Orc Knight (11–22),
  // Skeletons (13–20), Red Slime (15–22), Skeleton Swordsman (16–23),
  // Orc Captain (25 boss), Gelatinous Cube (14), Minotaur Grunt (15 miniboss),
  // Wyvern (27 hidden boss)
];

// Pick a template whose range covers the target level, else nearest
export function pickMonsterIdForLevel(level: number): string {
  const ok = MONSTERS.filter(m => level >= m.minLv && level <= m.maxLv);
  if (ok.length) return ok[Math.floor(Math.random() * ok.length)].id;

  // fallback to nearest-range template if none directly match
  let best = MONSTERS[0], bestDist = Infinity;
  for (const m of MONSTERS) {
    const dist = level < m.minLv ? (m.minLv - level) : (level - m.maxLv);
    if (dist < bestDist) { best = m; bestDist = dist; }
  }
  return best.id;
}



// ------------ FACTORY ---------------

export function makeMonster(kind: string, level: number): Actor {
  const t = MONSTERS.find(m => m.id === kind);
  if (!t) throw new Error(`Unknown monster: ${kind}`);

  const lv = Math.min(Math.max(level, t.minLv), t.maxLv);
  const base = normalizeBase(t.base);
  const g = (k: keyof BaseStats) => (t.growth?.[k] ?? 0);

  const A: Actor = {
    id: `${kind}-${lv}-${Math.random().toString(36).slice(2,7)}`,
    name: t.name,
    isPlayer: false,
    level: lv,
    xp: 0,
    xpToNext: xpToNextLevel(lv),
    tags: { ...(t.tags ?? {}) },
    base: {
      str: grow(base.str, g('str'), lv),
      dex: grow(base.dex, g('dex'), lv),
      int: grow(base.int, g('int'), lv),
      wis: grow(base.wis, g('wis'), lv),
      vit: grow(base.vit, g('vit'), lv),
      con: grow(base.con, g('con'), lv),
      speed: grow(base.speed, g('speed'), lv),
      armor: grow(base.armor, g('armor'), lv),
      resist: grow(base.resist, g('resist'), lv),
      luck: grow(base.luck, g('luck'), lv),
    },
    gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
    hp: { current: 0, max: 0 },
    mp: { current: 0, max: 0 },
    inventory: [],
    equipment: {},
    gold: 0,
    spriteId: t.spriteId,
  };

  // HP scales via its own growth entry (if present)
  const hp0 = Math.max(1, base.hp + (t.growth?.hp ?? 0) * (lv - 1));
  A.hp = { current: hp0, max: hp0 };

  t.equip?.(A, lv);
  // t.loot? call that during victory resolution, not here

  return A;
}
