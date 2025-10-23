// src/assets/sprites.ts
import type { Actor } from '../engine/types';

// Ensure the base ends with a trailing slash
const rawBase = (import.meta.env.BASE_URL ?? '/') as string;
const BASE = rawBase.endsWith('/') ? rawBase : rawBase + '/';
const url = (p: string) => BASE + p;   // <-- string concat, no URL()

export function getSpriteFor(a: Actor): string {
  if (a.isPlayer) return url('images/sprites/heroes/knight.png');

  const w = a.equipment?.weapon?.code?.toLowerCase() ?? '';
  if (w.includes('club'))       return url('images/sprites/goblins/goblin-club.png');
  if (w.includes('shortsword')) return url('images/sprites/goblins/goblin-shortsword.png');
  if (w.includes('dagger'))     return url('images/sprites/goblins/goblin-dagger.png');

  return url('images/sprites/goblins/goblin.png');
}
