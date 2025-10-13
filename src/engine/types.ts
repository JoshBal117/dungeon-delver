// src/engine/types.ts

// -------------------------
// Core Resource Type
// -------------------------
export type Resource = { current: number; max: number };

//items for the game
// --- Runtime item types used by Actor.inventory and equipment ---
export type ItemSlot =
  | 'weapon' | 'shield'
  | 'helm' | 'cuirass' | 'gauntlets' | 'boots' | 'greaves'
  | 'robe'
  | 'ring' | 'amulet' | 'circlet';

export type ItemType =
  | 'weapon' | 'armor' | 'potion' | 'trinket' | 'tool'
  | 'staff' | 'bow' | 'crossbow';

export type Rarity  = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type OnUseCode =
  | 'heal_10' | 'heal_25' | 'heal_50' | 'heal_100'
  | 'mana_10' | 'mana_25' | 'mana_50' | 'mana_100'
  | 'speed_buff' | 'fire_res' | 'ice_res' | 'none';

export interface Item {
  id: string;
  code: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  slot?: ItemSlot;
  mods?: Partial<Record<string, number>>;
  consumable?: boolean;
  onUse?: OnUseCode;
  value?: number;
}

// -------------------------
// Base Attributes
// -------------------------
export type BaseAttributes = {
  str: number;  // Strength: physical attack power
  dex: number;  // Dexterity: accuracy / agility
  int: number;  // Intelligence: magic power
  wis: number;  // Wisdom: healing / divine power
  vit: number;  // Vitality: affects HP growth
  speed: number; // Turn order / movement range
  armor: number; // Base physical defense
  resist: number; // Base magical resistance
  luck: number;  // Critical hits / loot drops
};

// -------------------------
// Gear / Equipment Bonuses
// -------------------------
export type GearBonuses = {
  hpMax?: number;
  mpMax?: number;
  speed?: number;
  armorPct?: number;  // flat % bonus
  resistPct?: number; // flat % bonus
};

// -------------------------
// Tags (metadata flags)
// -------------------------
export type Tags = {
  spellcaster?: boolean; // determines MP visibility and spellcasting ability
  undead?: boolean;
  beast?: boolean;
  humanoid?: boolean;
  flying?: boolean;
  demon?: boolean;
  // You can expand this later as needed
};

// -------------------------
// Main Actor / Character Type
// -------------------------
export type Actor = {
  id: string;
  name: string;
  isPlayer: boolean;

  level: number;
  xp: number;
  xpToNext: number;

  // Character-specific fields
  tags: Tags;               // flags (spellcaster, beast, etc.)
  base: BaseAttributes;     // raw stats that level up
  gear: GearBonuses;        // equipment modifiers
  hp: Resource;             // visible HP
  mp: Resource;             // visible MP (if spellcaster)
};

// -------------------------
// Combat System Structures
// -------------------------
export type LogEvent = { text: string };

export type CombatState = {
  turn: number;
  order: string[];               // actor IDs in initiative order
  actors: Record<string, Actor>; // all combat participants
  log: LogEvent[];
  over: boolean;
};
