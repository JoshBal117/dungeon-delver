import type { ItemTemplate } from '../types';

export const WEAPONS: ItemTemplate[] = [
  // Daggers / shortswords / swords
  { code: 'iron-dagger', name: 'Iron Dagger', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'stab', basePower: 3, mods: { dex: 1 } },
  { code: 'black-iron-dagger', name: 'Black Iron Dagger', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'stab', basePower: 5, mods: { dex: 1, speed: 1 } },
  { code: 'steel-dagger', name: 'Steel Dagger', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'stab', basePower: 4, mods: { dex: 1 } },
  { code: 'silver-steel-dagger', name: 'Silver Steel Dagger', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'stab', basePower: 8, mods: { dex: 1, luck: 1 } },
  { code: 'stiletto', name: 'Stiletto', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'stab', basePower: 7, mods: { dex: 1, speed: 1 }, tags: ['thin-blade'] },
  { code: 'elven-dagger', name: 'Elven Dagger', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'stab', basePower: 8, mods: { dex: 1, speed: 1 }, tags: ['elven'] },
  { code: 'assassin-dagger', name: 'Assassin Dagger', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'stab', basePower: 12, mods: { dex: 1, critPct: 10 }, tags: ['assassin'] },
  { code: 'black-assassin-dagger', name: 'Black Assassin Dagger', type: 'weapon', slot: 'weapon', rarity: 'epic', hands: 1, damageType: 'stab', basePower: 15, mods: { dex: 1, critPct: 15 }, tags: ['assassin'] },
  { code: 'goblin-shortsword', name: 'Goblin Shortsword', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'slash', basePower: 3, tags: ['goblin'] },
  { code: 'goblin-bone-dagger', name: 'Goblin Bone Dagger', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'stab', basePower: 2, mods: { dex: 1 }, tags: ['goblin'] },
  { code: 'elven-shortsword', name: 'Elven Shortsword', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'slash', basePower: 8, mods: { speed: 1 }, tags: ['elven'] },
  { code: 'bronze-shortsword', name: 'Bronze Short Sword', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'slash', basePower: 5 },
  { code: 'iron-shortsword', name: 'Iron Short Sword', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'slash', basePower: 5 },
  { code: 'steel-shortsword', name: 'Steel Short Sword', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'slash', basePower: 9 },


  { code: 'gladius', name: 'Gladius', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'slash', basePower: 7 },
  { code: 'tanto', name: 'Tanto', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'stab', basePower: 7 },

  { code: 'iron-longsword', name: 'Iron Longsword', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'slash', basePower: 5, mods: { str: 1 } },
  { code: 'steel-longsword', name: 'Steel Longsword', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'slash', basePower: 11, mods: { str: 1 } },
  { code: 'steel-broadsword', name: 'Steel Broadsword', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'slash', basePower: 13, mods: { str: 2 } },

  { code: 'iron-rapier', name: 'Iron Rapier', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'stab', basePower: 9, mods: { speed: 1 }, tags: ['rapier'] },
  { code: 'steel-rapier', name: 'Steel Rapier', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'stab', basePower: 12, mods: { speed: 1, dex: 1 }, tags: ['rapier'] },

  { code: 'black-iron-saber', name: 'Black Iron Saber', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'slash', basePower: 13, mods: { speed: 1 } },

  // Katanas (bleed via tag)
  { code: 'iron-katana', name: 'Iron Katana', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'slash', basePower: 10, mods: { speed: 1 }, tags: ['katana','bleed'] },
  { code: 'steel-katana', name: 'Steel Katana', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 1, damageType: 'slash', basePower: 13, mods: { speed: 1 }, tags: ['katana','bleed'] },
  { code: 'obsidian-steel-katana', name: 'Obsidian Steel Katana', type: 'weapon', slot: 'weapon', rarity: 'epic', hands: 1, damageType: 'slash', basePower: 18, mods: { speed: 2, critPct: 5 }, tags: ['katana','bleed'] },
  { code: 'mugenjin', name: 'Mugenjin', type: 'weapon', slot: 'weapon', rarity: 'legendary', hands: 1, damageType: 'slash', basePower: 28, mods: { critPct: 50 }, tags: ['katana','bleed','fire','magic'] },

  // Axes
  { code: 'iron-war-axe', name: 'Iron War Axe', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'slash', basePower: 10, mods: { str: 1 } },
  { code: 'steel-war-axe', name: 'Steel War Axe', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'slash', basePower: 14, mods: { str: 1 } },

  //Spears/lances/Javelins 

  // Great weapons (2-hand)
  { code: 'iron-greatsword', name: 'Greatsword', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 2, damageType: 'slash', basePower: 12, mods: { str: 2 } },
  { code: 'steel-great-warhammer', name: 'Great Warhammer', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 2, damageType: 'blunt', basePower: 20, mods: { str: 2 } },
  { code: 'nodachi', name: 'Nodachi', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 2, damageType: 'slash', basePower: 22, tags: ['katana','bleed'] },
  { code: 'iron-greataxe', name: 'Iron Greataxe', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 2, damageType: 'slash', basePower: 14 },
  { code: 'steel-greataxe', name: 'Steel Greataxe', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 2, damageType: 'slash', basePower: 16 },
  { code: 'black-iron-greataxe', name: 'Black Iron Greataxe', type: 'weapon', slot: 'weapon', rarity: 'epic', hands: 2, damageType: 'slash', basePower: 18 },
  { code: 'obsidian-greataxe', name: 'Obsidian Greataxe', type: 'weapon', slot: 'weapon', rarity: 'epic', hands: 2, damageType: 'slash', basePower: 26 },

  // Blunt weapons / maces / clubs
  { code: 'wooden-club', name: 'Wooden Club', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'blunt', basePower: 3 },
  { code: 'stone-mallet', name: 'Stone Mallet', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'blunt', basePower: 12 },
  { code: 'iron-club', name: 'Iron Club', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'blunt', basePower: 5 },
  { code: 'goblin-club', name: 'Goblin Club', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'blunt', basePower: 2, tags: ['goblin'] },
  { code: 'iron-mace', name: 'Iron Mace', type: 'weapon', slot: 'weapon', rarity: 'common', hands: 1, damageType: 'blunt', basePower: 6 },
  { code: 'steel-mace', name: 'Steel Mace', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 1, damageType: 'blunt', basePower: 8 },
  { code: 'Ogre Club', name: 'Ogre Club', type: 'weapon', slot: 'weapon', rarity: 'rare', hands: 2, damageType: 'blunt', basePower: 22 },
  { code: 'iron-warhammer', name: 'Warhammer', type: 'weapon', slot: 'weapon', rarity: 'uncommon', hands: 2, damageType: 'blunt', basePower: 14, mods: { str: 2 } },

  // Bows & crossbows
  { code: 'shortbow', name: 'Shortbow', type: 'bow', slot: 'weapon', rarity: 'common', hands: 2, damageType: 'pierce', basePower: 6 },
  { code: 'longbow', name: 'Longbow', type: 'bow', slot: 'weapon', rarity: 'uncommon', hands: 2, damageType: 'pierce', basePower: 10, tags: ['ranger-start'] },
  { code: 'goblin-shortbow', name: 'Goblin Shortbow', type: 'bow', slot: 'weapon', rarity: 'common', hands: 2, damageType: 'pierce', basePower: 4, tags: ['goblin'] },
  { code: 'elven-shortbow', name: 'Elven Shortbow', type: 'bow', slot: 'weapon', rarity: 'rare', hands: 2, damageType: 'pierce', basePower: 12, mods: { speed: 1 }, tags: ['elven'] },
  { code: 'elven-longbow', name: 'Elven Longbow', type: 'bow', slot: 'weapon', rarity: 'epic', hands: 2, damageType: 'pierce', basePower: 16, mods: { speed: 1 }, tags: ['elven'] },
  { code: 'elven-great-bow', name: 'Elven Great Bow', type: 'bow', slot: 'weapon', rarity: 'legendary', hands: 2, damageType: 'pierce', basePower: 18, mods: { speed: 2 }, tags: ['elven'] },

  { code: 'iron-crossbow', name: 'Iron Crossbow', type: 'crossbow', slot: 'weapon', rarity: 'uncommon', hands: 2, damageType: 'pierce', basePower: 10 },
  { code: 'steel-crossbow', name: 'Steel Crossbow', type: 'crossbow', slot: 'weapon', rarity: 'rare', hands: 2, damageType: 'pierce', basePower: 12 },
  { code: 'obsidian-crossbow', name: 'Obsidian Crossbow', type: 'crossbow', slot: 'weapon', rarity: 'epic', hands: 2, damageType: 'pierce', basePower: 17 },

  // Staves (spell cost tags; you can implement MP reduction later)
  { code: 'wooden-staff', name: 'Wooden Staff', type: 'staff', slot: 'weapon', rarity: 'common', hands: 2, damageType: 'blunt', basePower: 6, tags: ['mp-cost-0'] },
  { code: 'obsidian-staff', name: 'Obsidian Staff', type: 'staff', slot: 'weapon', rarity: 'rare', hands: 2, damageType: 'blunt', basePower: 8, tags: ['mp-cost-10'] },
  { code: 'elven-staff', name: 'Elven Staff', type: 'staff', slot: 'weapon', rarity: 'epic', hands: 2, damageType: 'blunt', basePower: 9, tags: ['mp-cost-15','elven'] },
  { code: 'dark-elven-staff', name: 'Dark Elven Staff', type: 'staff', slot: 'weapon', rarity: 'legendary', hands: 2, damageType: 'blunt', basePower: 10, tags: ['mp-cost-25','dark-elven'] },
  { code: 'staff-of-fire', name: 'Staff of Fire', type: 'staff', slot: 'weapon', rarity: 'legendary', hands: 2, damageType: 'blunt', basePower: 10, tags: ['fire','mp-fire-35'] },
];
