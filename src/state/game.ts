import { create } from 'zustand';
import { initCombat, step } from '../engine/combat';
import type { CombatState } from '../engine/types';
import { makeKnight, makeGoblin } from './factories';

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
