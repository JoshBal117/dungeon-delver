import type { Actor } from '../engine/types';
import { xpToNextLevel } from '../engine/leveling';
import { computeHpMax, computeMpMax } from '../engine/derived';
import type {ClassId} from './game';

export function makeKnight(): Actor {
  const a: Actor = {
    id: 'hero',
    name: 'Knight',
    isPlayer: true,
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1),
    tags: { spellcaster: false },
    base: {
      str: 4, dex: 3, int: 1, wis: 2, vit: 3,
      speed: 4, armor: 3, resist: 0, luck: 2,
    },
    gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
    hp: { current: 0, max: 0 },
    mp: { current: 0,  max: 0  },
  };

  const hpMax = computeHpMax(a);
  const mpMax = computeMpMax(a);
  a.hp = {current: hpMax, max: hpMax};
  a.mp = {current: mpMax, max: mpMax};
  return a;

}

export function makeMage(): Actor {
  const a: Actor = {
    id: 'hero',
    name: 'Mage',
    isPlayer: true,
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1),
    tags: { spellcaster: true },
    base: { str: 1, dex: 3, int: 5, wis: 2, vit: 2, speed: 3, armor: 0, resist: 1, luck: 2 },
    gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
    hp: { current: 0, max: 0 }, mp: { current: 0, max: 0 },
  };
  const hpMax = computeHpMax(a), mpMax = computeMpMax(a);
  a.hp = { current: hpMax, max: hpMax }; a.mp = { current: mpMax, max: mpMax };
  return a;
}

export function makeThief(): Actor {
  const a: Actor = {
    id: 'hero',
    name: 'Thief',
    isPlayer: true,
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1),
    tags: { spellcaster: false },
    base: { str: 3, dex: 5, int: 1, wis: 1, vit: 2, speed: 5, armor: 1, resist: 0, luck: 3 },
    gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
    hp: { current: 0, max: 0 }, mp: { current: 0, max: 0 },
  };
  const hpMax = computeHpMax(a), mpMax = computeMpMax(a);
  a.hp = { current: hpMax, max: hpMax }; a.mp = { current: mpMax, max: mpMax };
  return a;
}

export function makeCleric(): Actor {
  const a: Actor = {
    id: 'hero',
    name: 'Cleric',
    isPlayer: true,
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1),
    tags: { spellcaster: true },
    base: { str: 2, dex: 2, int: 2, wis: 5, vit: 3, speed: 3, armor: 2, resist: 2, luck: 2 },
    gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
    hp: { current: 0, max: 0 }, mp: { current: 0, max: 0 },
  };
  const hpMax = computeHpMax(a), mpMax = computeMpMax(a);
  a.hp = { current: hpMax, max: hpMax }; a.mp = { current: mpMax, max: mpMax };
  return a;
}



//enemies 
export function makeGoblin( id=1): Actor {
  const a: Actor = {
    id: `gob-${id}`,
    name: 'Goblin',
    isPlayer: false,
    level: 1,
    xp: 0,
    xpToNext: xpToNextLevel(1),
    tags: { spellcaster: false },
    base: {
      str: 3, dex: 4, int: 1, wis: 1, vit: 2,
      speed: 3, armor: 0, resist: 0, luck: 2,
    },
    gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
    hp: { current: 8, max: 8 },
    mp: { current: 0, max: 0 },
  };

  const hpMax = computeHpMax(a);
  const mpMax = computeMpMax(a);
  a.hp = {current: hpMax, max: hpMax};
  a.mp = {current: mpMax, max: mpMax};
  return a;
}


export type ClassDef = {
  id: ClassId;
  name: string;
  description: string;
  spellcaster: boolean;
  // future: startingGear, growth, abilities, icon, sprite, etc.
};

export const CLASSES: Record<ClassId, ClassDef> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    description: 'Frontline fighter with solid defenses and steady growth.',
    spellcaster: false,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    description: 'Strong minds lean towards powerful magic. High INT/MP, powerful spells (coming soon).',
    spellcaster: true,
  },
  thief: {
    id: 'thief',
    name: 'Thief',
    description: 'Fast, evasive, crit-focused (future).',
    spellcaster: false,
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    description: 'Balanced healer class. Future divine spells and buffs.',
    spellcaster: true,
  },
};