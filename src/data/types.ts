//types.ts in data
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type DamageType = 'slash' | 'stab' | 'pierce' | 'blunt' | 'fire' | 'cold' | 'lightning' | 'arcane' | 'holy' | 'necrotic';

export type ItemSlot = 
    | 'weapon' | 'shield'
  | 'helm' | 'cuirass' | 'gauntlets' | 'boots' | 'greaves' // legs
  | 'robe' // mutually exclusive with cuirass/greaves/gauntlets/boots in UI
  | 'ring' | 'amulet' | 'circlet';

  export interface ItemTemplate {

    code: string;
    name: string;
    type: 'weapon' | 'armor' | 'potion' | 'tool' | 'trinket' | 'staff' | 'bow' | 'crossbow';
    slot?: ItemSlot; // not for potions, tools, treasure
    rarity: Rarity;
    hands? : 1 | 2; // for weapons
    damageType?: DamageType; // for weapons
    basePower?: number; // for weapons
    //small additive stat mod which are applied while equipped 
    mods?: Partial<{
     str: number; dex: number; int: number; wis: number; vit: number;
    speed: number; armor: number; resist: number; luck: number;
    hpMax: number; mpMax: number;
    armorPct: number; resistPct: number; speedPct: number; critPct: number;
    fireResPct: number; iceResPct: number; lightningResPct: number;
    }>;

    tags?: string[];

    onUse?: 'heal_10' | 'heal_25' | 'heal_50' | 'heal_100' | 'mana_10' | 'mana_25' | 'mana_50' | 'mana_100' | 'stamina_10'| 'stamina_25' | 'stamina_50'| 'stamina_100' | 'speed_buff' | 'fire_res' | 'ice_res' | 'none';
    damageTYpe?: DamageType; // for weapons
  }