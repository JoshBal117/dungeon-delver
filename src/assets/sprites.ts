// src/assets/sprites.ts
import type { Actor } from '../engine/types';

// This automatically becomes "/" in local dev
// and "/dungeon-delver/" when you build/deploy.
const ROOT = `${import.meta.env.BASE_URL}sprites`;

export function getSpriteFor(a: Actor): string {
  if (a.isPlayer) return `${ROOT}/heroes/knight.png`;

  const w =
    a.equipment?.weapon?.code?.toLowerCase() ??
    a.equipment?.weapon?.name?.toLowerCase() ??
    '';

  if (w.includes('club'))       return `${ROOT}/goblins/goblin-club.png`;
  if (w.includes('shortsword')) return `${ROOT}/goblins/goblin-shortsword.png`;
  if (w.includes('dagger'))     return `${ROOT}/goblins/goblin.png`;

  return `${ROOT}/goblins/goblin.png`;
}
