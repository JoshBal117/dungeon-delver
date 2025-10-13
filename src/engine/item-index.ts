import { ITEM_MAP } from '../data/items';
import type { ItemTemplate } from '../data/types'; // type-only is fine
import type { Item } from './types'

let nextId = 1;

export function makeItemFromCode(code: string): Item {
  const t: ItemTemplate | undefined = ITEM_MAP[code];
  if (!t) throw new Error(`Unknown item code: ${code}`);

  const consumable = t.type === 'potion' || t.onUse !== undefined;

  const item: Item = {
    id: `itm-${nextId++}`,
    code: t.code,
    name: t.name,
    type: t.type,        // both sides share the same union
    rarity: t.rarity,
    slot: t.slot,
    mods: t.mods,
    consumable,
    onUse: (t.onUse ?? 'none') as Item['onUse'], // cast is fine, both sides share the same union

  };

  return item;
}
