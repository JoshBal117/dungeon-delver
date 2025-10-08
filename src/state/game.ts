import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor } from '../engine/types';
import { initCombat, step } from '../engine/combat';
import { makeKnight, makeGoblin } from './factories';
import { computeHpMax, computeMpMax } from '../engine/derived';

type GameStore = {
  heroes: Actor[];          // persisted
  combat: CombatState;      // ephemeral
  startNewCombat: () => void;
  attack: () => void;
  resetCombat: () => void;
  setHeroes: (h: Actor[]) => void;
};

// -- single place that guarantees sane HP/MP for any hero object
const ensurePools = (a: Actor): Actor => {
  const hpMax = computeHpMax(a);
  const mpMax = computeMpMax(a);
  return {
    ...a,
    hp: {
      max: hpMax,
      // if missing/zero/negative, start full; otherwise clamp to max
      current: a.hp?.current && a.hp.current > 0 ? Math.min(a.hp.current, hpMax) : hpMax,
    },
    mp: {
      max: mpMax,
      current: a.mp?.current && a.mp.current > 0 ? Math.min(a.mp.current, mpMax) : mpMax,
    },
  };
};

const rebuildCombat = (heroes: Actor[]): CombatState =>
  initCombat(heroes.map(ensurePools), [makeGoblin()]);  // or a pack of goblins

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      const starter = [makeKnight()];                // create once
      return {
        heroes: starter.map(ensurePools),            // persisted slice
        combat: rebuildCombat(starter),              // ephemeral from same base

        startNewCombat: () => set({ combat: rebuildCombat(get().heroes) }),
        attack: () => set({ combat: step(get().combat) }),
        resetCombat: () => set({ combat: rebuildCombat(get().heroes) }),
        setHeroes: (h) => set({ heroes: h }),       // persisted via partialize
      };
    },
    {
      name: 'dd:save',
      version: 1,
      storage: createJSONStorage(() => localStorage),

      // persist only long-term data
      partialize: (s) => ({ heroes: s.heroes }),

      // DRY: use ensurePools here too, then rebuild combat
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const fixed = state.heroes.map(ensurePools);
        useGame.setState({
          heroes: fixed,
          combat: rebuildCombat(fixed),
        });
      },
    }
  )
);
