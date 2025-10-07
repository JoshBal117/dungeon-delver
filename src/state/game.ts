import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor } from '../engine/types';
import { initCombat, step } from '../engine/combat';
import { makeKnight, makeGoblin } from './factories';
import { computeHpMax, computeMpMax } from '../engine/derived';

type GameStore = {
  //  Persisted slice
  heroes: Actor[];

  //  Ephemeral per-battle state
  combat: CombatState;

  // Actions
  startNewCombat: () => void;
  attack: () => void;
  resetCombat: () => void;
  setHeroes: (h: Actor[]) => void;
};

const rebuildCombat = (heroes: Actor[]): CombatState =>
  initCombat(heroes, [makeGoblin()]);

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state: a Knight vs a Goblin
      heroes: [makeKnight()],                 // persisted
      combat: rebuildCombat([makeKnight()]),  // ephemeral, derived from heroes

      // Actions
      startNewCombat: () => set({ combat: rebuildCombat(get().heroes) }),
      attack: () => set({ combat: step(get().combat) }),
      resetCombat: () => set({ combat: rebuildCombat(get().heroes) }),
      setHeroes: (h) => set({ heroes: h }),  // writing here auto-persists (partialize)
    }),
    {
      name: 'dd:save',                                   // localStorage key
      version: 1,                                        // schema version for future migrations
      storage: createJSONStorage(() => localStorage),

      // Persist ONLY the heroes; do not serialize combat state
      partialize: (s) => ({ heroes: s.heroes }),

      // When rehydrating, recompute derived pools & rebuild combat
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const fixed = state.heroes.map((a) => {
          const hpMax = computeHpMax(a);
          const mpMax = computeMpMax(a);
          return {
            ...a,
            hp: { current: Math.min(a.hp.current, hpMax), max: hpMax },
            mp: { current: Math.min(a.mp.current, mpMax), max: mpMax },
          };
        });
        // Put sanitized heroes back and rebuild combat fresh
        useGame.setState({
          heroes: fixed,
          combat: rebuildCombat(fixed),
        });
      },

      // If you later change shapes, migrate older saves here
      // migrate: (persisted, version) => persisted,
    }
  )
);
