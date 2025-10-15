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

function giveItemUniqueByCode(a: Actor, item: Item) {
  a.inventory ??= [];
  if (a.inventory.some(x => x.code === item.code)) return;
  a.inventory.push(item);
}

function dedupeInventory(a: Actor): Actor {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();

  const inventory = (a.inventory ?? []).filter(it => {
    // Ensure a unique runtime id for React keys (handles HMR reloads)
    let id = it.id;
    if (!id || seenIds.has(id)) {
      id = newItemId();            // <- uses your exported helper
      it = { ...it, id };
    }
    seenIds.add(id);

    // Potions/consumables can duplicate by code
    if (it.type === 'potion' || it.consumable) return true;

    // For weapons/armor/trinkets/etc, keep only one per code
    if (seenCodes.has(it.code)) return false;
    seenCodes.add(it.code);
    return true;
  });

  // Also normalize equipment IDs
  const eq = { ...(a.equipment ?? {}) };
  ([
    'weapon','shield','helm','cuirass','gauntlets','boots','greaves','robe',
    'ring1','ring2','amulet','circlet'
  ] as const).forEach(slot => {
    const it = eq[slot];
    if (!it) return;
    if (!it.id || seenIds.has(it.id)) {
      eq[slot] = { ...it, id: newItemId() };
    } else {
      seenIds.add(it.id);
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
        setHeroes: (h) => set({ heroes: h.map(ensurePools).map(ensureBags).map(dedupeInventory) }),

        // NEW: delegate to startNewRun so seeding happens in one place
        newGame: () => get().startNewRun('knight'),

        goToTitle: () => set({ ui: { screen: 'title' } }),

       startNewRun: (classId: ClassId) => {
  if (get().ui.screen !== 'title') return;   // guard against double clicks

 

  const hero =
    classId === 'mage'   ? makeMage()  :
    classId === 'thief'  ? makeThief() :
    classId === 'cleric' ? makeCleric() :
                           makeKnight();

  const heroes = [ensurePools(hero)];
  const h = heroes[0];
  h.inventory ??= [];

  if (classId === 'knight') {
    giveItemUniqueByCode(h, makeItemFromCode('iron-longsword'));
    giveItemUniqueByCode(h, makeItemFromCode('iron-knight-cuirass'));
  } else if (classId === 'mage') {
    giveItemUniqueByCode(h, makeItemFromCode('wooden-staff'));
    giveItemUniqueByCode(h, makeItemFromCode('mana_25'));
  } else if (classId === 'thief') {
    giveItemUniqueByCode(h, makeItemFromCode('iron-dagger'));
    giveItemUniqueByCode(h, makeItemFromCode('lockpicks'));
  } else if (classId === 'cleric') {
    giveItemUniqueByCode(h, makeItemFromCode('iron-mace'));
    giveItemUniqueByCode(h, makeItemFromCode('heal_25'));
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
          giveItemUniqueByCode(a, item);
          set({ heroes: heroes.map(dedupeInventory) });
        },

       useItem: (actorId, itemId) => {
  const s = get();

  // Find hero & item in the persisted heroes slice (inventory lives here)
  const heroes = [...s.heroes];
  const hero = heroes.find(h => h.id === actorId) ?? heroes[0];
  if (!hero?.inventory) return;

  const ix = hero.inventory.findIndex(it => it.id === itemId);
  if (ix === -1) return;
  const it = hero.inventory[ix];

  // Resolve heal amount from onUse code or fallback
  const code = (it.onUse ?? 'none').toLowerCase();
  const healMap: Record<string, number> = {
    'heal_10': 10, 'heal_25': 25, 'heal_50': 50, 'heal_100': 100,
    'heal-lesser': 10, 'heal': 25, 'heal-greater': 50, 'heal-superior': 100,
  };
  const amt = healMap[code] ?? it.mods?.heal ?? 0;

  if (amt > 0) {
    if (s.ui.screen === 'battle' && s.combat) {
      // Heal the combat actor (so the battle UI shows it immediately)
      const combat = { ...s.combat, actors: { ...s.combat.actors } };
      const actor = combat.actors[actorId] ?? Object.values(combat.actors).find(a => a.isPlayer);
      if (actor) {
        actor.hp = { ...actor.hp, current: Math.min(actor.hp.max, actor.hp.current + amt) };
        combat.log = [...combat.log, { text: `${actor.name} drinks a potion and heals ${amt} HP.` }];
      }
      // Consume from hero bag
      hero.inventory.splice(ix, 1);
      set({ heroes, combat });
      return;
    } else {
      // Out of battle: heal the hero directly
      hero.hp.current = Math.min(hero.hp.max, hero.hp.current + amt);
      hero.inventory.splice(ix, 1);
      set({ heroes });
      return;
    }
  }

  // TODO: handle mana/speed/resist potions later
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

  // ✅ Only push previous to bag if it’s a DIFFERENT item
  if (prev && prev.id !== it.id) {
    a.inventory.push(prev);
  }

  a.equipment[slotKey] = it;                         // equip new item
  a.inventory = a.inventory.filter(i => i.id !== it.id); // remove from bag
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
        const fixed = state.heroes.map(ensurePools).map(ensureBags).map(dedupeInventory);
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
