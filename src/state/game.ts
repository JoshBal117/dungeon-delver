// src/state/games.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor, Item } from '../engine/types';
import { initCombat, step, stepUntilPlayerAsync } from '../engine/combat';
import { makeKnight, makeGoblin, makeMage, makeThief, makeCleric } from './factories';
import type { ClassId } from './factories';
import { computeHpMax, computeMpMax } from '../engine/derived';
import { makeItemFromCode } from '../engine/item-index';
import { newItemId } from '../engine/item-index';


const ENEMY_DELAY_MS = 1000

// Screens for a tiny UI state machine
type UIScreen = 'title' | 'battle' | 'sheet';

// Class ids (framework for future characters)


type GameStore = {
  heroes: Actor[];
  combat: CombatState;
  ui: { screen: UIScreen; selectID?:string };


  startNewCombat: () => Promise<void>;
  attack: () => Promise<void>;
  setHeroes: (h: Actor[]) => void;
  newGame: () => void;
  goToTitle: () => void;
  startNewRun: (classId: ClassId) => Promise<void>;
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
  const isStackable = item.type === 'potion' || item.consumable === true;
  if (!isStackable && a.inventory.some(x => x.code === item.code)) return; // ← only block non-stackables
  a.inventory.push(item);
}


function dedupeInventory(a: Actor): Actor {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();

  // normalize equipment IDs and collect equipped non-consumable codes
  const eq = { ...(a.equipment ?? {}) };
  const equippedCodes = new Set<string>();
  ([
    'weapon','shield','helm','cuirass','gauntlets','boots','greaves','robe',
    'ring1','ring2','amulet','circlet'
  ] as const).forEach(slot => {
    const it = eq[slot];
    if (!it) return;

    // normalize id
    if (!it.id || seenIds.has(it.id)) {
      eq[slot] = { ...it, id: newItemId() };
    }
    seenIds.add(eq[slot]!.id);

    // track codes so bag can't hold a duplicate non-consumable of the same thing
    equippedCodes.add(eq[slot]!.code);
  });

  // rebuild inventory with normalized ids and no dupes vs bag or equipped
  const normalized: Item[] = [];
  for (const orig of (a.inventory ?? [])) {
    const id = (!orig.id || seenIds.has(orig.id)) ? newItemId() : orig.id;
    seenIds.add(id);
    const it = { ...orig, id };

    // potions/consumables can duplicate freely by code
    if (it.type === 'potion' || it.consumable) {
      normalized.push(it);
      continue;
    }

    // for non-consumables: drop if matches any equipped code OR a previous bag code
    if (equippedCodes.has(it.code)) continue;
    if (seenCodes.has(it.code)) continue;

    seenCodes.add(it.code);
    normalized.push(it);
  }

  return { ...a, inventory: normalized, equipment: eq };
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
        startNewCombat: async () => {
  const s0 = rebuildCombat(get().heroes);
  set ({combat: s0})
  const s1 = await stepUntilPlayerAsync(s0, ENEMY_DELAY_MS);
  set({ combat: s1 });
},

attack: async () => {
  const afterPlayer = step(get().combat);
  set ({combat: afterPlayer})      // Player acts
  const afterAI = await stepUntilPlayerAsync(afterPlayer, ENEMY_DELAY_MS);     // Then AI resolves its turns
  set({ combat: afterAI });
},
        setHeroes: (h) => set({ heroes: h.map(ensurePools).map(ensureBags).map(dedupeInventory) }),

        // NEW: delegate to startNewRun so seeding happens in one place
        newGame: () => {void get().startNewRun('knight'); },

        goToTitle: () => set({ ui: { screen: 'title' } }),

       startNewRun: async (classId: ClassId) => {
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
    const add = (code: string) => giveItemUniqueByCode(h, makeItemFromCode(code));
    [
      'iron-longsword',
    'iron-knight-helm',
    'iron-knight-cuirass',
    'iron-knight-gauntlets',
    'iron-knight-greaves',
    'iron-knight-boots',
    'iron-shield',
    ].forEach(add);
// Starter potions
  ['heal-lesser', 'heal-lesser', 'heal-lesser'].forEach(add);

  // Auto-equip from bag by code
  const equipByCode = (slot: keyof NonNullable<typeof h.equipment>, code: string) => {
    const it = h.inventory!.find(i => i.code === code);
    if (!it) return;
    h.equipment ??= {};
    h.equipment[slot] = it;
    h.inventory = h.inventory!.filter(i => i.id !== it.id);
  };

  equipByCode('weapon',   'iron-longsword');
  equipByCode('helm',     'iron-knight-helm');
  equipByCode('cuirass',  'iron-knight-cuirass');   // will be 'body' later if you unify
  equipByCode('gauntlets','iron-knight-gauntlets');
  equipByCode('greaves',  'iron-knight-greaves');
  equipByCode('boots',    'iron-knight-boots');
  equipByCode('shield',   'iron-shield');
}
   else if (classId === 'mage') {
    giveItemUniqueByCode(h, makeItemFromCode('wooden-staff'));
    giveItemUniqueByCode(h, makeItemFromCode('mana_25'));
  } else if (classId === 'thief') {
    giveItemUniqueByCode(h, makeItemFromCode('iron-dagger'));
    giveItemUniqueByCode(h, makeItemFromCode('lockpicks'));
  } else if (classId === 'cleric') {
    giveItemUniqueByCode(h, makeItemFromCode('iron-mace'));
    giveItemUniqueByCode(h, makeItemFromCode('heal_25'));
  }
  
  //set initial battle, then autoplay AI until it's the player's turn
  const s0 = rebuildCombat(heroes);
  set({heroes, combat: s0, ui: {screen: 'battle'} });
const s1 = await stepUntilPlayerAsync(s0, ENEMY_DELAY_MS);
set({combat: s1});
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

  // find hero & item in the persisted slice
  const heroes = [...s.heroes];
  const hero = heroes.find(h => h.id === actorId) ?? heroes[0];
  if (!hero?.inventory) return;

  const ix = hero.inventory.findIndex(it => it.id === itemId);
  if (ix === -1) return;
  const it = hero.inventory[ix];

  const code = (it.onUse ?? 'none').toLowerCase();
  const healMap: Record<string, number> = {
    'heal_10': 10, 'heal_25': 25, 'heal_50': 50, 'heal_100': 100,
    'heal-lesser': 10, 'heal': 25, 'heal-greater': 50, 'heal-superior': 100,
  };
  const amt = healMap[code] ?? it.mods?.heal ?? 0;
  if (amt <= 0) { set({ heroes }); return; }

  if (s.ui.screen === 'battle' && s.combat) {
    // in-battle: heal combat actor + consume item
    const combat = { ...s.combat, actors: { ...s.combat.actors } };
    const actor = combat.actors[actorId] ?? Object.values(combat.actors).find(a => a.isPlayer);
    if (actor) {
      actor.hp = { ...actor.hp, current: Math.min(actor.hp.max, actor.hp.current + amt) };
      combat.log = [...combat.log, { text: `${actor.name} drinks a potion and heals ${amt} HP.` }];
    }
    hero.inventory.splice(ix, 1);
    set({ heroes, combat }); // ✅ update both slices
    return;
  }

  // out-of-battle: heal persisted hero, mirror into combat if present
  hero.hp.current = Math.min(hero.hp.max, hero.hp.current + amt);
  hero.inventory.splice(ix, 1);

  if (s.combat && s.combat.actors[actorId]) {
    const combat = { ...s.combat, actors: { ...s.combat.actors } };
    const act = combat.actors[actorId];
    act.hp = { ...act.hp, current: Math.min(act.hp.max, hero.hp.current) };
    combat.log = [...combat.log, { text: `${act.name} uses a potion and heals ${amt} HP.` }];
    set({ heroes, combat }); // ✅ mirror heal into combat
  } else {
    set({ heroes }); // ✅ only heroes slice changes
  }
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

      // ✅ rehydrate path can't be truly async; do two-phase update:
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const fixed = state.heroes.map(ensurePools).map(ensureBags).map(dedupeInventory);
        const base = rebuildCombat(fixed);
        const hasSave = fixed.length && ((fixed[0].level ?? 1) > 1 || (fixed[0].xp ?? 0) > 0);

        // 1) Set immediate state
        useGame.setState({
          heroes: fixed,
          combat: base,
          ui: { screen: hasSave ? 'battle' : 'title' }
        });

        // 2) Kick off async AI pass without blocking rehydrate
        (async () => {
          const s1 = await stepUntilPlayerAsync(base, ENEMY_DELAY_MS);
          useGame.setState({ combat: s1 });
        })();
      },
    }
  )
);
