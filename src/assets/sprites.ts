// src/assets/sprites.ts
import type { Actor } from '../engine/types';

const BASE = import.meta.env.BASE_URL;
const url = (p: string) => new URL(p, BASE).toString();

export function getSpriteFor(a: Actor): string {
  if (a.isPlayer) return url('images/sprites/heroes/knight.png');

  const w = a.equipment?.weapon?.code?.toLowerCase() ?? '';
  if (w.includes('club'))       return url('images/sprites/goblins/goblin-club.png');
  if (w.includes('shortsword')) return url('images/sprites/goblins/goblin-shortsword.png');
  if (w.includes('dagger'))     return url('images/sprites/goblins/goblin-dagger.png'); // if you have it

  return url('images/sprites/goblins/goblin.png'); // fallback
}
