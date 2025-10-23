// src/engine/types.ts
import type { DamageType } from '../data/types';
// -------------------------
// Core Resource Type
// -------------------------
export type Resource = { current: number; max: number };

// -------------------------
// Runtime item types (used by Actor.inventory/equipment)
export type AIAction = 
  | {kind: 'attack';                       targetId: string}
  | {kind: 'ability'; abilityCode: string; targetId: string}
  | {kind: 'defend'}
  | {kind: 'use-item'; itemId: string;     targetId: string}

// -------------------------
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
  slot?: ItemSlot;                         // equippables set this
  mods?: Partial<Record<string, number>>;  // flat additive mods
  consumable?: boolean;
  onUse?: OnUseCode;
  value?: number;
  damageType?: DamageType;                 // for weapons
}

// Equipment object uses two ring slots (ring1, ring2)
export type Equipment = Partial<{
  weapon: Item; shield: Item; helm: Item; cuirass: Item; gauntlets: Item; boots: Item;
  greaves: Item; robe: Item; ring1: Item; ring2: Item; amulet: Item; circlet: Item;
}>;

// -------------------------
// Base Attributes
// -------------------------
export type BaseAttributes = {
  str: number;
  dex: number;
  int: number;
  wis: number;
  vit: number;
  speed: number;
  armor: number;
  resist: number;
  luck: number;
};

// -------------------------
// Gear / Equipment Bonuses
// -------------------------
export type GearBonuses = {
  hpMax?: number;
  mpMax?: number;
  speed?: number;
  armorPct?: number;
  resistPct?: number;
};

// -------------------------
// Tags (metadata flags)
// -------------------------
export type Tags = {
  spellcaster?: boolean;
  undead?: boolean;
  beast?: boolean;
  humanoid?: boolean;
  flying?: boolean;
  demon?: boolean;
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

  tags: Tags;               // flags (spellcaster, beast, etc.)
  base: BaseAttributes;     // raw stats that level up
  gear: GearBonuses;        // equipment modifiers
  hp: Resource;             // visible HP
  mp: Resource;             // visible MP (if spellcaster)

  // NEW: inventory/equipment/currency
  inventory?: Item[];
  equipment?: Equipment;
  gold?: number;


};

// -------------------------
// Combat System Structures
// -------------------------
export type LogEvent = { text: string };

export type CombatState = {
  turn: number;
  order: string[];
  actors: Record<string, Actor>;
  log: LogEvent[];
  over: boolean;
};
