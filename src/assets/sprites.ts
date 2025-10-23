// src/assets/sprites.ts
import type { Actor } from '../engine/types';

const BASE = import.meta.env.BASE_URL;  // '' in dev, '/dungeon-delver/' on GH Pages

export function getSpriteFor(a: Actor): string {
  if (a.isPlayer) return `${BASE}images/sprites/heroes/knight.png`;

  const w = a.equipment?.weapon?.code ?? '';

  if (w.includes('club'))       return `${BASE}images/sprites/goblins/goblin-club.png`;
  if (w.includes('shortsword')) return `${BASE}images/sprites/goblins/goblin-shortsword.png`;
  if (w.includes('dagger'))     return `${BASE}images/sprites/goblins/goblin.png`; // or goblin-dagger.png if you add one

  return `${BASE}images/sprites/goblins/goblin.png`;
}
