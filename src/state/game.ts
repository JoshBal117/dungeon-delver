// src/state/gamestats.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor, Item } from '../engine/types';
import { initCombat, step } from '../engine/combat';
import { makeKnight, makeGoblin, makeMage, makeThief, makeCleric } from './factories';
import type { ClassId } from './factories';
import { computeHpMax, computeMpMax } from '../engine/derived';
import { makeItemFromCode } from '../engine/item-index';
import { newItemId } from '../engine/item-index';

// Screens for a tiny UI state machine
type UIScreen = 'title' | 'battle' | 'sheet';

// Class ids (framework for future characters)


type GameStore = {
  heroes: Actor[];
  combat: CombatState;
  ui: { screen: UIScreen; selectID?:string };


  startNewCombat: () => void;
  attack: () => void;
  setHeroes: (h: Actor[]) => void;
  newGame: () => void;
  goToTitle: () => void;
  startNewRun: (classId: ClassId) => void;
  hasSave: () => boolean;

  //character page
  openSheet: (actorId: string) => void;
  closeSheet: () => void

  giveItem: (actorId: string, item: Item) => void;
  useItem: (actorId: string, itemId: string) => void;
  equipItem: (actorId: string, itemId: string) => void;
 unequipItem: (actorId: string, slot:
  'weapon'|'shield'|'helm'|'cuirass'|'gauntlets'|'boots'|'greaves'|'robe'|'ring1'|'ring2'|'amulet'|'circlet'
) => void;

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

const ensureBags = (a: Actor): Actor => ({
  ...a,
  inventory: a.inventory ?? [],
  equipment: a.equipment ?? {},
  gold: a.gold ?? 0,
});

function dedupeItemIds(a: Actor): Actor {
  const seen = new Set<string>();

  const inventory = (a.inventory ?? []).map(it => {
    const id = it.id;
    if (!id || seen.has(id)) return{  ...it, id: newItemId() };
    seen.add(it.id);
    return it;
  });


  const eq = {...( a.equipment ?? {}) };
  ([
    'weapon', 'shield', 'helm', 'cuirass', 'gauntlets', 'boots', 'greaves', 'robe', 
    'ring1', 'ring2', 'amulet', 'circlet'
  ] as const).forEach(slot=> {
    const it = eq[slot];
    if (!it) return;
    const id = it.id;
    if (!id || seen.has(id)) {
      eq[slot] = { ...it, id: newItemId() };
    } else {
      seen.add(id);
    }
  });

  return { ...a, inventory, equipment: eq };
  
}


// For now, 1 goblin per fight (expand later)
const spawnGoblins = () => [makeGoblin(1)];
const rebuildCombat = (heroes: Actor[]): CombatState =>
  initCombat(heroes.map(ensurePools), spawnGoblins());

export const useGame = create<GameStore>()(
  persist(
    (set, get) => {
      const starter = [ensurePools(makeKnight())];

      return {
        // --- state ---
        heroes: starter,
        combat: rebuildCombat(starter),
        ui: { screen: 'title' },

        // --- actions ---
        startNewCombat: () => set({ combat: rebuildCombat(get().heroes) }),
        attack: () => set({ combat: step(get().combat) }),
        setHeroes: (h) => set({ heroes: h }),

        // NEW: delegate to startNewRun so seeding happens in one place
        newGame: () => get().startNewRun('knight'),

        goToTitle: () => set({ ui: { screen: 'title' } }),

        startNewRun: (classId) => {
          const hero =
            classId === 'mage'   ? makeMage()  :
            classId === 'thief'  ? makeThief() :
            classId === 'cleric' ? makeCleric() :
                                   makeKnight();

          const heroes = [ensurePools(hero)];
          const h = heroes[0];
          h.inventory ??= [];

          const has = (code: string) => h.inventory!.some(i => i.code === code);

          if (classId === 'knight') {
            if (!has('iron-longsword')) h.inventory.push(makeItemFromCode('iron-longsword'));
            if (!has('heal-lesser'))    h.inventory.push(makeItemFromCode('heal-lesser'));
          } else if (classId === 'mage') {
            if (!has('wooden-staff')) h.inventory.push(makeItemFromCode('wooden-staff'));
            if (!has('mana_25'))      h.inventory.push(makeItemFromCode('mana_25'));
          } else if (classId === 'thief') {
            if (!has('iron-dagger')) h.inventory.push(makeItemFromCode('iron-dagger'));
            if (!has('lockpicks'))   h.inventory.push(makeItemFromCode('lockpicks'));
          } else if (classId === 'cleric') {
            if (!has('iron-mace')) h.inventory.push(makeItemFromCode('iron-mace'));
            if (!has('heal_25'))   h.inventory.push(makeItemFromCode('heal_25'));
          }

          set({ heroes, combat: rebuildCombat(heroes), ui: { screen: 'battle' } });
        },

        hasSave: () => {
          const h = get().heroes;
          if (!h || !h.length) return false;
          const a = h[0];
          return (a.level ?? 1) > 1 || (a.xp ?? 0) > 0;
        },

        openSheet: (actorId) => set({ ui: { screen: 'sheet', selectID: actorId } }),
        closeSheet: () => set({ ui: { screen: 'battle' } }),

        giveItem: (actorId, item) => {
          const heroes = [...get().heroes];
          const a = heroes.find(h => h.id === actorId) ?? heroes[0];
          a.inventory ??= [];
          a.inventory.push(item);
          set({ heroes });
        },

        useItem: (actorId, itemId) => {
          const heroes = [...get().heroes];
          const a = heroes.find(h => h.id === actorId) ?? heroes[0];
          if (!a?.inventory) return;
          const ix = a.inventory.findIndex(it => it.id === itemId);
          if (ix === -1) return;
          const it = a.inventory[ix];

          const code = it.onUse ?? 'none';
          if (code.startsWith('heal')) {
            const amt =
              code === 'heal_10' ? 10 :
              code === 'heal_50' ? 50 :
              code === 'heal_100' ? 100 : 25;
            a.hp.current = Math.min(a.hp.max, a.hp.current + amt);
            a.inventory.splice(ix, 1);
            set({ heroes });
            return;
          }
          set({ heroes });
        },

        equipItem: (actorId, itemId) => {
          const heroes = [...get().heroes];
          const a = heroes.find(h => h.id === actorId) ?? heroes[0];
          if (!a?.inventory) return;

          const it = a.inventory.find(i => i.id === itemId);
          if (!it || !it.slot) return;

          a.equipment ??= {};
          if (it.slot === 'robe') a.equipment.cuirass = undefined;
          if (it.slot === 'cuirass') a.equipment.robe = undefined;

          const slotKey = it.slot as keyof NonNullable<typeof a.equipment>;
          const prev = a.equipment[slotKey];
          if (prev) a.inventory.push(prev);

          a.equipment[slotKey] = it;
          a.inventory = a.inventory.filter(i => i.id !== it.id);
          set({ heroes });
        },

        unequipItem: (actorId, slot) => {
          const heroes = [...get().heroes];
          const a = heroes.find(h => h.id === actorId) ?? heroes[0];
          if (!a?.equipment) return;

          const eq = a.equipment[slot as keyof NonNullable<typeof a.equipment>];
          if (!eq) return;

          a.inventory ??= [];
          a.inventory.push(eq);
          a.equipment[slot as keyof NonNullable<typeof a.equipment>] = undefined;
          set({ heroes });
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
        const fixed = state.heroes.map(ensurePools).map(ensureBags).map(dedupeItemIds);
        const hasSave = fixed.length && ((fixed[0].level ?? 1) > 1 || (fixed[0].xp ?? 0) > 0);
        useGame.setState({
          heroes: fixed,
          combat: rebuildCombat(fixed),
          ui: { screen: hasSave ? 'battle' : 'title' }
        });
      },
    }
  )
);
