import { create } from 'zustand';
import { initCombat, step } from '../engine/combat';
import type { Actor, CombatState } from '../engine/types';

const makeFighter = (): Actor => ({
  id: 'hero',
  name: 'Fighter',
  isPlayer: true,
  stats: {
    hp: { current: 10, max: 10 },
    mp: { current: 0, max: 0 },
    str: 5,
    dex: 5,
    int: 3,
    armor: 3,
    resist: 0,
    speed: 5,
  },
});

const makeGoblin = (): Actor => ({
  id: 'gob',
  name: 'Goblin',
  isPlayer: false,
  stats: {
    hp: { current: 15, max: 15 },
    mp: { current: 0, max: 0 },
    str: 5,
    dex: 4,
    int: 2,
    armor: 1,
    resist: 0,
    speed: 4,
  },
});


type GameStore = {
    combat: CombatState;
    attack: () => void;
    reset: () => void;
};


const init = () => initCombat([makeFighter()], [makeGoblin()]);

export const useGame = create<GameStore>((set, get) => ({
    combat: init(),
    attack: () => set({ combat: step(get().combat) }),
    reset: () => set({ combat: init() }),
}));