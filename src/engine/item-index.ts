import { ITEM_MAP } from '../data/items';
import type { ItemTemplate } from '../data/types';
import type { Item } from './types';


// Strong unique id generator
export function newItemId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `itm-${crypto.randomUUID()}`;
  }
  return `itm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeItemFromCode(code: string): Item {
  console.log('[makeItemFromCode]', code);
  const t: ItemTemplate | undefined = ITEM_MAP[code];
  if (!t) throw new Error(`Unknown item code: ${code}`);

  // normalize mods so weapons always have mods.damage
  const mods: Record<string, number> = { ...(t.mods ?? {}) };
  if (t.type === 'weapon' && mods.damage == null) {
    mods.damage = t.basePower ?? 0;
  }

  const consumable = t.type === 'potion' || t.onUse !== undefined;

  const item: Item = {
    id: newItemId(),                     // ✅ no more collisions on HMR
    code: t.code,
    name: t.name,
    type: t.type,
    rarity: t.rarity,
    slot: t.slot,
    mods,
    consumable,
    onUse: (t.onUse ?? 'none') as Item['onUse'],
                       // fine if undefined
    damageType: t.damageType, // for weapons
   
   
  };

  return item;
}
