import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor } from '../engine/types';
import { initCombat, step } from '../engine/combat';
import { makeKnight, makeGoblin } from './factories';
import { computeHpMax, computeMpMax } from '../engine/derived';

type GameStore = {
  // Persisted slice
  heroes: Actor[];

  // Ephemeral per-battle state
  combat: CombatState;

  // Actions
  startNewCombat: () => void;
  attack: () => void;
  resetCombat: () => void;
  setHeroes: (h: Actor[]) => void;

  // NEW: wipe progression to L1 knight
  newGame: () => void;
};

// one place to normalize pools
const ensurePools = (a: Actor): Actor => {
  const hpMax = computeHpMax(a);
  const mpMax = computeMpMax(a);
  return {
    ...a,
    hp: {
      max: hpMax,
      current: a.hp?.current && a.hp.current > 0 ? Math.min(a.hp.current, hpMax) : hpMax,
    },
    mp: {
      max: mpMax,
      current: a.mp?.current && a.mp.current > 0 ? Math.min(a.mp.current, mpMax) : mpMax,
    },
  };
};

// OPTIONAL: give the knight a few foes per battle (3 goblins)
const spawnGoblins = () => [makeGoblin(1),];
const rebuildCombat = (heroes: Actor[]): CombatState =>
  initCombat(heroes.map(ensurePools), spawnGoblins());

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      const starter = [ensurePools(makeKnight())]; // seed once, normalized

      return {
        heroes: starter,
        combat: rebuildCombat(starter),

        startNewCombat: () => set({ combat: rebuildCombat(get().heroes) }),
        attack: () => set({ combat: step(get().combat) }),
        resetCombat: () => set({ combat: rebuildCombat(get().heroes) }),
        setHeroes: (h) => set({ heroes: h }),

        // NEW: overwrite persisted heroes with a fresh L1 knight
        newGame: () => {
          const fresh = [ensurePools(makeKnight())];
          set({
            heroes: fresh,            // this overwrites the persisted slice
            combat: rebuildCombat(fresh),
          });
        },
      };
    },
    {
      name: 'dd:save',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ heroes: s.heroes }),

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
