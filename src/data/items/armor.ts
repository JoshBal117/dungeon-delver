import type { ItemTemplate } from '../types';

export const ARMOR: ItemTemplate[] = [
  // Fur / Leather / Hide sets
  { code: 'fur-cuirass', name: 'Fur Chest Armor', type: 'armor', slot: 'cuirass', rarity: 'common', mods: { armor: 1 } },
  { code: 'fur-gauntlets', name: 'Fur Gloves', type: 'armor', slot: 'gauntlets', rarity: 'common', mods: { armor: 1 } },
  { code: 'fur-boots', name: 'Fur Boots', type: 'armor', slot: 'boots', rarity: 'common', mods: { armor: 1 } },
  { code: 'fur-greaves', name: 'Fur Pants', type: 'armor', slot: 'greaves', rarity: 'common', mods: { armor: 1 } },

  { code: 'leather-cuirass', name: 'Leather Chest Armor', type: 'armor', slot: 'cuirass', rarity: 'common', mods: { armor: 2 } },
  { code: 'leather-gauntlets', name: 'Leather Vambraces', type: 'armor', slot: 'gauntlets', rarity: 'common', mods: { armor: 1 } },
  { code: 'leather-greaves', name: 'Leather Pants', type: 'armor', slot: 'greaves', rarity: 'common', mods: { armor: 1 } },
  { code: 'leather-boots', name: 'Leather Boots', type: 'armor', slot: 'boots', rarity: 'common', mods: { armor: 1 } },

  { code: 'hide-cuirass', name: 'Hide Chest Armor', type: 'armor', slot: 'cuirass', rarity: 'common', mods: { armor: 2 } },
  { code: 'hide-gauntlets', name: 'Hide Bracers', type: 'armor', slot: 'gauntlets', rarity: 'common', mods: { armor: 1 } },
  { code: 'hide-greaves', name: 'Hide Pants', type: 'armor', slot: 'greaves', rarity: 'common', mods: { armor: 1 } },
  { code: 'hide-boots', name: 'Hide Boots', type: 'armor', slot: 'boots', rarity: 'common', mods: { armor: 1 } },
  { code: 'hide-helm', name: 'Hide Helm', type: 'armor', slot: 'helm', rarity: 'common', mods: { armor: 1 } },

  // Iron set
  { code: 'iron-breastplate', name: 'Iron Breastplate', type: 'armor', slot: 'cuirass', rarity: 'uncommon', mods: { armor: 3 } },
  { code: 'iron-greaves', name: 'Iron Greaves', type: 'armor', slot: 'greaves', rarity: 'uncommon', mods: { armor: 2 } },
  { code: 'iron-gauntlets', name: 'Iron Gauntlets', type: 'armor', slot: 'gauntlets', rarity: 'uncommon', mods: { armor: 2 } },
  { code: 'iron-helm', name: 'Iron Helm', type: 'armor', slot: 'helm', rarity: 'uncommon', mods: { armor: 2 } },
  { code: 'iron-boots', name: 'Iron Boots', type: 'armor', slot: 'boots', rarity: 'uncommon', mods: { armor: 2 } },

  // Knight starting set
  { code: 'iron-knight-helm', name: 'Iron Knight Helm', type: 'armor', slot: 'helm', rarity: 'uncommon', mods: { armor: 2 } },
  { code: 'iron-knight-cuirass', name: 'Iron Knight Chestplate', type: 'armor', slot: 'cuirass', rarity: 'uncommon', mods: { armor: 3 } },
  { code: 'iron-knight-gauntlets', name: 'Iron Knight Gauntlets', type: 'armor', slot: 'gauntlets', rarity: 'uncommon', mods: { armor: 2 } },
  { code: 'iron-knight-greaves', name: 'Iron Knight Greaves', type: 'armor', slot: 'greaves', rarity: 'uncommon', mods: { armor: 2 } },
  { code: 'iron-knight-boots', name: 'Iron Knight Boots', type: 'armor', slot: 'boots', rarity: 'uncommon', mods: { armor: 2 } },

  // Steel plate (Paladin start)
  { code: 'steel-plate-cuirass', name: 'Steel Plate Chest Armor', type: 'armor', slot: 'cuirass', rarity: 'rare', mods: { armor: 4 } },
  { code: 'steel-plate-gauntlets', name: 'Steel Plate Gauntlets', type: 'armor', slot: 'gauntlets', rarity: 'rare', mods: { armor: 3 } },
  { code: 'steel-plate-greaves', name: 'Steel Plate Greaves', type: 'armor', slot: 'greaves', rarity: 'rare', mods: { armor: 3 } },
  { code: 'steel-plate-boots', name: 'Steel Plate Boots', type: 'armor', slot: 'boots', rarity: 'rare', mods: { armor: 3 } },
  { code: 'steel-plate-helm', name: 'Steel Plate Helm', type: 'armor', slot: 'helm', rarity: 'rare', mods: { armor: 3 } },

  // Elven, Dwarven, Black Iron, etc. (add more as you go)
  { code: 'black-iron-cuirass', name: 'Black Iron Chestplate', type: 'armor', slot: 'cuirass', rarity: 'rare', mods: { armor: 4 } },
  { code: 'black-iron-gauntlets', name: 'Black Iron Gauntlets', type: 'armor', slot: 'gauntlets', rarity: 'rare', mods: { armor: 3 } },
  { code: 'black-iron-boots', name: 'Black Iron Boots', type: 'armor', slot: 'boots', rarity: 'rare', mods: { armor: 3 } },
  { code: 'black-iron-helm', name: 'Black Iron Helm', type: 'armor', slot: 'helm', rarity: 'rare', mods: { armor: 3 } },
  { code: 'black-iron-greaves', name: 'Black Iron Greaves', type: 'armor', slot: 'greaves', rarity: 'rare', mods: { armor: 3 } },
];
