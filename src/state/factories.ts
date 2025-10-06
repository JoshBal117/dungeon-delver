import type { Actor } from '../engine/types';
import { xpToNextLevel } from '../engine/leveling';

export function makeKnight(): Actor {
  return {
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
    hp: { current: 10, max: 10 },
    mp: { current: 0,  max: 0  },
  };
}

export function makeGoblin(): Actor {
  return {
    id: 'gob-1',
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
}
