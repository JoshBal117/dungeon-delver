// src/state/gamestats.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor, Item } from '../engine/types';
import { initCombat, step } from '../engine/combat';
import { makeKnight, makeGoblin, makeMage, makeThief, makeCleric } from './factories';
import type { ClassId } from './factories';
import { computeHpMax, computeMpMax } from '../engine/derived';
import { makeItemFromCode } from '../engine/item-index';

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
          const h = fresh[0];
          h.inventory ??= [];
          h.inventory?.push(
            makeItemFromCode('heal-lesser'),
            makeItemFromCode('iron-longsword'),
            
          ); console.log('Seeded items:', h.inventory.map(i => i.code)); 

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
           const hero =
            classId === 'mage'   ? makeMage()  :
            classId === 'thief'  ? makeThief() :
           classId === 'cleric' ? makeCleric() :
                                 makeKnight() ;
   

          const heroes = [ensurePools(hero)];
  const h = heroes[0];
  h.inventory ??= [];

  // class-specific starters
  if (classId === 'knight') {
    h.inventory.push(makeItemFromCode('iron-longsword'));
  } else if (classId === 'mage') {
    h.inventory.push(makeItemFromCode('wooden-staff'), makeItemFromCode('mana_25'));
  } else if (classId === 'thief') {
    h.inventory.push(makeItemFromCode('iron-dagger'), makeItemFromCode('lockpicks'));
  } else if (classId === 'cleric') {
    h.inventory.push(makeItemFromCode('iron-mace'), makeItemFromCode('heal_25'));
  }

  set({ heroes, combat: rebuildCombat(heroes), ui: { screen: 'battle' } });
},

        hasSave: () => {
          const h = get().heroes;
          if (!h || !h.length) return false;
          const a = h[0];
          return (a.level ?? 1) > 1 || (a.xp ?? 0) > 0;
        },

         // Character Page
        openSheet: (actorId) => set({ ui: { screen: 'sheet', selectID: actorId } }),
        closeSheet: () => set({ ui: { screen: 'battle' } }),

        // --- Inventory / Equipment actions ---
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

  // basic potion effects — expand later
  const code = it.onUse ?? 'none';
  if (code.startsWith('heal')) {
    const amt =
      code === 'heal_10' ? 10 :
      code === 'heal_50' ? 50 :
      code === 'heal_100' ? 100 : 25; // defaults to heal_25
    a.hp.current = Math.min(a.hp.max, a.hp.current + amt);
    a.inventory.splice(ix, 1); // consume
    set({ heroes });
    return;
  }

  // TODO: handle mana_xx, speed_buff, fire_res, ice_res
  set({ heroes });
},

equipItem: (actorId, itemId) => {
  const heroes = [...get().heroes];
  const a = heroes.find(h => h.id === actorId) ?? heroes[0];
  if (!a?.inventory) return;

  const it = a.inventory.find(i => i.id === itemId);
  if (!it || !it.slot) return;

  a.equipment ??= {};

  // robe vs cuirass exclusivity
  if (it.slot === 'robe') a.equipment.cuirass = undefined;
  if (it.slot === 'cuirass') a.equipment.robe = undefined;

  const slotKey = it.slot as keyof NonNullable<typeof a.equipment>;
  const prev = a.equipment[slotKey];
  if (prev) {
    a.inventory.push(prev);             // return previously-equipped to bag
  }

  a.equipment[slotKey] = it;            // equip new item
  a.inventory = a.inventory.filter(i => i.id !== it.id); // remove from bag
  set({ heroes });
},

// NOTE: slot names must match your engine types (robe, not cloak; includes greaves)
unequipItem: (actorId, slot) => {
  const heroes = [...get().heroes];
  const a = heroes.find(h => h.id === actorId) ?? heroes[0];
  if (!a?.equipment) return;

  const eq = a.equipment[slot as keyof NonNullable<typeof a.equipment>];
  if (!eq) return;

  a.inventory ??= [];
  a.inventory.push(eq);                  // move equipped item back to bag
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
  const fixed = state.heroes.map(ensurePools).map(ensureBags);
  const hasSave = fixed.length && ((fixed[0].level ?? 1) > 1 || (fixed[0].xp ?? 0) > 0);
  useGame.setState({ heroes: fixed, combat: rebuildCombat(fixed), ui: { screen: hasSave ? 'battle' : 'title' } });
},
    }
  )
);
