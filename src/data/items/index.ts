import { WEAPONS } from './weapons';
import { POTIONS } from './potions';
import { ARMOR } from './armor';
import type { ItemTemplate } from '../types';

export const ALL_ITEMS: ItemTemplate[] = [...WEAPONS, ...POTIONS, ...ARMOR];

export const ITEM_MAP: Record<string, ItemTemplate> =
  Object.fromEntries(ALL_ITEMS.map(it => [it.code, it]));
