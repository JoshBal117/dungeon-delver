// src/state/gamestats.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor } from '../engine/types';
import { initCombat, step } from '../engine/combat';
import { makeKnight, makeGoblin /* later: makeWizard, makeThief, makeCleric */ } from './factories';
import { computeHpMax, computeMpMax } from '../engine/derived';

// Screens for a tiny UI state machine
type UIScreen = 'title' | 'battle';

// Class ids (framework for future characters)
export type ClassId = 'knight' | 'mage' | 'thief' | 'cleric';

type GameStore = {
  // Persisted slice
  heroes: Actor[];

  // Ephemeral per-battle state
  combat: CombatState;

  // NEW: UI state
  ui: { screen: UIScreen };

  // Actions
  startNewCombat: () => void;
  attack: () => void;
  setHeroes: (h: Actor[]) => void;

  // Reset/seed
  newGame: () => void;

  // NEW UI actions
  goToTitle: () => void;
  startNewRun: (classId: ClassId) => void;
  hasSave: () => boolean;
};

// Normalize resource pools based on derived max
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

// For now, 1 goblin per fight (expand later)
const spawnGoblins = () => [makeGoblin(1)];
const rebuildCombat = (heroes: Actor[]): CombatState =>
  initCombat(heroes.map(ensurePools), spawnGoblins());

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      const starter = [ensurePools(makeKnight())];

      return {
        // persisted + ephemeral seeds
        heroes: starter,
        combat: rebuildCombat(starter),

        // NEW: default to title screen on boot
        ui: { screen: 'title' },

        // actions
        startNewCombat: () => set({ combat: rebuildCombat(get().heroes) }),
        attack: () => set({ combat: step(get().combat) }),
        setHeroes: (h) => set({ heroes: h }),

        // overwrite save with a fresh L1 Knight and jump into battle
        newGame: () => {
          const fresh = [ensurePools(makeKnight())];
          set({
            heroes: fresh,
            combat: rebuildCombat(fresh),
            ui: { screen: 'battle' },
          });
        },

        // UI actions
        goToTitle: () => set({ ui: { screen: 'title' } }),

        startNewRun: (classId) => {
          // framework: swap by class later
          // const hero =
          //   classId === 'mage'   ? makeWizard()
          // : classId === 'thief'  ? makeThief()
          // : classId === 'cleric' ? makeCleric()
          // : makeKnight();
          const hero = makeKnight(); // placeholder until others exist

          const heroes = [ensurePools(hero)];
          set({
            heroes,
            combat: rebuildCombat(heroes),
            ui: { screen: 'battle' },
          });
        },

        hasSave: () => {
          const h = get().heroes;
          if (!h || !h.length) return false;
          const a = h[0];
          return (a.level ?? 1) > 1 || (a.xp ?? 0) > 0;
        },
      };
    },
    {
      name: 'dd:save',
      version: 1,
      storage: createJSONStorage(() => localStorage),

      // Persist ONLY the heroes; UI + combat are ephemeral
      partialize: (s) => ({ heroes: s.heroes }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const fixed = state.heroes.map(ensurePools);

        // If a save exists, you can auto-open battle; otherwise title.
        const hasSave =
          fixed.length > 0 &&
          ((fixed[0].level ?? 1) > 1 || (fixed[0].xp ?? 0) > 0);

        useGame.setState({
          heroes: fixed,
          combat: rebuildCombat(fixed),
          ui: { screen: hasSave ? 'battle' : 'title' },
        });
      },
    }
  )
);
