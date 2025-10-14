import { ITEM_MAP } from '../data/items';
import type { ItemTemplate } from '../data/types'; // type-only is fine
import type { Item } from './types'

let nextId = 1;

export function makeItemFromCode(code: string): Item {
  const t: ItemTemplate | undefined = ITEM_MAP[code];
  if (!t) throw new Error(`Unknown item code: ${code}`);

  //we are going to normalize the mods so runtime items always have the mods.damage for weapons 

  const mods: Record<string, number> = {...(t.mods ?? {}) };
    if(t.type === 'weapon') {
      if (mods.damage == null) {
        //base power in your data becomes damage at runtime
        mods.damage = t.basePower ?? 0;
      }
    }

  const consumable = t.type === 'potion' || t.onUse !== undefined;

  const item: Item = {
    id: `itm-${nextId++}`,
    code: t.code,
    name: t.name,
    type: t.type,        // both sides share the same union
    rarity: t.rarity,
    slot: t.slot,
    mods,
    consumable,
    onUse: (t.onUse ?? 'none') as Item['onUse'], // cast is fine, both sides share the same union
    

  };

  return item;
}
