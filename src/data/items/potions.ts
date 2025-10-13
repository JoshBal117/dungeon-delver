import type { ItemTemplate } from '../types';

export const POTIONS: ItemTemplate[] = [
  { code: 'mana-lesser',   name: 'Lesser Potion of Mana', type: 'potion', rarity: 'common',   onUse: 'mana_10' },
  { code: 'mana',          name: 'Potion of Mana',        type: 'potion', rarity: 'uncommon', onUse: 'mana_25' },
  { code: 'mana-greater',  name: 'Greater Potion of Mana',type: 'potion', rarity: 'rare',     onUse: 'mana_50' },
  { code: 'mana-superior', name: 'Superior Potion of Mana',type:'potion', rarity: 'epic',     onUse: 'mana_50' },

  { code: 'heal-lesser',   name: 'Lesser Healing Potion', type: 'potion', rarity: 'common',   onUse: 'heal_10' },
  { code: 'heal',          name: 'Healing Potion',        type: 'potion', rarity: 'uncommon', onUse: 'heal_25' },
  { code: 'heal-greater',  name: 'Greater Healing Potion',type: 'potion', rarity: 'rare',     onUse: 'heal_50' },
  { code: 'heal-superior', name: 'Superior Healing Potion',type:'potion', rarity: 'epic',     onUse: 'heal_100' },

  { code: 'speed-potion',  name: 'Potion of Speed',       type: 'potion', rarity: 'uncommon', onUse: 'speed_buff' },
  { code: 'fire-res-potion',name:'Potion of Fire Resist', type: 'potion', rarity: 'uncommon', onUse: 'fire_res' },
  { code: 'ice-res-potion', name:'Potion of Ice Resist',  type: 'potion', rarity: 'uncommon', onUse: 'ice_res' },
  { code: 'lockpick-set',   name:'Lockpick Set',          type: 'tool',   rarity: 'common',   tags: ['thief-start'] },
  { code: 'amulet-healing', name:'Amulet of Healing',     type: 'trinket',slot: 'amulet', rarity: 'epic', tags: ['heal-free-3'] },

  { code: 'ring-fire-res',  name:'Ring of Fire Resist',   type: 'trinket',slot: 'ring', rarity: 'uncommon', mods: { fireResPct: 10 } },
  { code: 'ring-ice-res',   name:'Ring of Ice Resist',    type: 'trinket',slot: 'ring', rarity: 'uncommon', mods: { iceResPct: 10 } },
  { code: 'ring-speed',     name:'Ring of Speed',         type: 'trinket',slot: 'ring', rarity: 'rare',     mods: { speedPct: 10 } },
];
