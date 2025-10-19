import type { Actor, Item } from './types';

// --- simple slot list ---
export const SLOTS = ['helm','cuirass','gauntlets','greaves','boots','shield'] as const;
export type Slot = typeof SLOTS[number];

export type ArmorItem = Item & { type: 'armor'; slot: Slot };

// --- guard ---
function isArmorPiece(it: unknown): it is ArmorItem {
  if (!it || typeof it !== 'object') return false;
  const x = it as Partial<ArmorItem>;
  return x.type === 'armor' && typeof x.slot === 'string' && (SLOTS as readonly string[]).includes(x.slot);
}

// --- 1) sum all armor pieces ---
export function getTotalArmor(actor: Actor): number {
  type Equipment = Partial<Record<Slot, Item>>;
  const eq = (actor.equipment ?? {}) as Equipment;

  let total = actor.base?.armor ?? 0;
  for (const slot of SLOTS) {
    const item = eq[slot];
    if (!isArmorPiece(item)) continue;
    total += item.mods?.armor ?? 0;
  }
  return total;
}

// --- 2) convert to % reduction ---
export function computeLinearMitigation(totalArmor: number, PCT_PER_ARMOR = 0.02, MAX_MIT = 0.60): number {
  return Math.min(MAX_MIT, Math.max(0, totalArmor * PCT_PER_ARMOR));
}
