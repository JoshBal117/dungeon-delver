import { create } from 'zustand';
import { initCombat, step } from '../engine/combat';
import type { Actor, CombatState } from '../engine/types';
import { xpToNextLevel } from '../engine/leveling';

const makeKnight = (): Actor => ({
  id: 'hero',
  name: 'Knight',
  isPlayer: true,
  level: 1,
  xp: 0,
  xpToNext: xpToNextLevel(1),
  tags: { spellcaster: false },
  base: { str: 5, dex: 5, int: 3, wis: 2, vit: 3, speed: 5, armor: 3, resist: 0, luck: 2 },
  gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
  hp: { current: 10, max: 10 },
  mp: { current: 0, max: 0 },
});

const makeGoblin = (): Actor => ({
  id: 'gob',
  name: 'Goblin',
  isPlayer: false,
  level: 1,
  xp: 0,
  xpToNext: xpToNextLevel(1),
  tags: { spellcaster: false },
  base: { str: 5, dex: 4, int: 2, wis: 1, vit: 2, speed: 4, armor: 1, resist: 0, luck: 2 },
  gear: { hpMax: 0, mpMax: 0, speed: 0, armorPct: 0, resistPct: 0 },
  hp: { current: 8, max: 8 },
  mp: { current: 0, max: 0 },
});

type GameStore = {
  combat: CombatState;
  attack: () => void;
  reset: () => void;
};

const init = () => initCombat([makeKnight()], [makeGoblin()]);

export const useGame = create<GameStore>((set, get) => ({
  combat: init(),
  attack: () => set({ combat: step(get().combat) }),
  reset: () => set({ combat: init() }),
}));
