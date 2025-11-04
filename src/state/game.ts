// src/state/games.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CombatState, Actor, Item } from '../engine/types';
import { initCombat, step, stepUntilPlayerAsync } from '../engine/combat';
import { makeKnight, makeGoblin, makeMage, makeThief, makeCleric } from './factories';
import type { ClassId } from './factories';
import { computeHpMax, computeMpMax, computeSpMax } from '../engine/derived';
import { makeItemFromCode } from '../engine/item-index';
import { newItemId } from '../engine/item-index';
import { applyAbility, } from '../engine/abilities';
import type { AbilityId } from '../engine/abilities';

const ENEMY_DELAY_MS = 1000

// Screens for a tiny UI state machine
type UIScreen = 'start' | 'title' | 'battle' | 'sheet';

type BattleMenu = 'closed' | 'root' | 'abilities' | 'items'

// Class ids (framework for future characters)


type GameStore = {
  heroes: Actor[];
  combat: CombatState;
  ui: { screen: UIScreen; selectID?:string; battleMenu?: BattleMenu };


  startNewCombat: () => Promise<void>;
  attack: () => Promise<void>;

  useAbility: (id: AbilityId) => Promise<void>;
  //new actions
  defend: () => Promise<void>;
  openActionMenu: () => void;
  closeActionMenu: () => void;
  openItemsMenu: () => void;
  openAbilitiesMenu: () => void;

  setHeroes: (h: Actor[]) => void;
  newGame: () => void;
  goToTitle: () => void;
  goToStart: () => void;
  goToClassSelect: () => void;
  startNewRun: (classId: ClassId) => Promise<void>;
  hasSave: () => boolean;

  //character page
  openSheet: (actorId: string) => void;
  closeSheet: () => void

  giveItem: (actorId: string, item: Item) => void;
  useItem: (actorId: string, itemId: string) => Promise<void>;
  equipItem: (actorId: string, itemId: string) => void;
 unequipItem: (actorId: string, slot:
  'weapon'|'shield'|'helm'|'cuirass'|'gauntlets'|'boots'|'greaves'|'robe'|'ring1'|'ring2'|'amulet'|'circlet'
) => void;

};


// Normalize resource pools based on derived max
const ensurePools = (a: Actor): Actor => {
  const hpMax = computeHpMax(a);
  const mpMax = computeMpMax(a);
  const spMax = computeSpMax(a);
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
    sp: {
      max: spMax,
      current: a.sp?.current && a.sp.current > 0 ? Math.min(a.sp.current, spMax) : spMax,
    }
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
        ui: { screen: 'start', battleMenu: 'closed' },

        // --- actions ---
openActionMenu: () => set({ ui: { ...get().ui, battleMenu: 'root' } }),
closeActionMenu: () => set({ ui: { ...get().ui, battleMenu: 'closed' } }),
openItemsMenu: () => set({ ui: { ...get().ui, battleMenu: 'items' } }),
openAbilitiesMenu: () => set({ ui: { ...get().ui, battleMenu: 'abilities' } }),

// Simple "Defend": log and pass turn to AI
defend: async () => {
  const s = get();
  const you = get().heroes[0];
  const c = { ...s.combat, statuses: s.combat.statuses ?? {}, log: [...s.combat.log] };
  c.statuses![you.id] ??= [];
  c.statuses![you.id].push({ code: 'defend', turns: 1, potency: 0.30 });
  c.log.push({ text: `${you.name} takes a defensive stance (30% damage reduction).` });

  //defend action consumes the player's turn
  c.turn = c.turn + 1;
  set({ combat: c, ui: { ...s.ui, battleMenu: 'closed' } });
  const afterAI = await stepUntilPlayerAsync(c, ENEMY_DELAY_MS);
  set({ combat: afterAI });
},

useAbility: async (id: AbilityId) => {
  const s0 = get().combat;
  const hero = get().heroes[0];            // current player character
  if (!s0 || !hero) return;

  // Ensure statuses bag exists before applying
  const s1 = applyAbility({ ...s0, statuses: s0.statuses ?? {} }, hero.id, id);

  // Close menu, commit player action
  set({ combat: s1, ui: { ...get().ui, battleMenu: 'closed' } });

  // Let AI resolve until it's the player's turn again
  const s2 = await stepUntilPlayerAsync(s1, ENEMY_DELAY_MS);
  set({ combat: s2 });
},


// update existing actions to ensure submenu closes when appropriate
startNewCombat: async () => {

  const s = get();
  const c = s.combat;

   if (c?.over) {
    const partyAlive = Object.values(c.actors).some(a => a.isPlayer && a.hp.current > 0);
    if (!partyAlive) {
      // Optionally append a log message to make it obvious in the UI:
      const log = [...(c.log ?? []), { text: 'Defeat ends the run. Choose "Restart Run" to play again.' }];
      set({ combat: { ...c, log } });
      return;
    }
  }

  const s0 = rebuildCombat(get().heroes);
  set({ combat: s0, ui: { ...get().ui, battleMenu: 'closed' } });
  const s1 = await stepUntilPlayerAsync(s0, ENEMY_DELAY_MS);
  set({ combat: s1 });
},

attack: async () => {
  const afterPlayer = step(get().combat);
  set({ combat: afterPlayer, ui: { ...get().ui, battleMenu: 'closed' } }); // close menu
  const afterAI = await stepUntilPlayerAsync(afterPlayer, ENEMY_DELAY_MS);
  set({ combat: afterAI });
},

        setHeroes: (h) => set({ heroes: h.map(ensurePools).map(ensureBags).map(dedupeInventory) }),

        // NEW: delegate to startNewRun so seeding happens in one place
        newGame: () => {
  // fully clear the persisted slice
  try { localStorage.removeItem('dd:save'); } catch {
    //ignore for now, as we are trying to seed a new run from restart run 
  }
  // move to title so UI is clean, then immediately seed a new Knight run
  set({ ui: { screen: 'title', battleMenu: 'closed' } });
  void get().startNewRun('knight');
},

        goToTitle:      () => set({ ui: { screen: 'start' } }),
        goToStart:      () => set({ ui: { screen: 'start' } }),
        goToClassSelect: () => set({ ui: { screen: 'title' } }),

       startNewRun: async (classId: ClassId) => {
  

 

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
  ['heal-lesser', 'heal-lesser', 'stamina-lesser', 'stamina-lesser'].forEach(add);

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




       useItem: async (actorId: string, itemId: string) => {


  const s = get();

  // find hero & item in the persisted slice
  const heroes = [...s.heroes];
  const hero = heroes.find(h => h.id === actorId) ?? heroes[0];
  if (!hero?.inventory) return;

  const ix = hero.inventory.findIndex(it => it.id === itemId);
  if (ix === -1) return;
  const it = hero.inventory[ix];

  const code = (it.onUse ?? 'none').toLowerCase();

// HP map (kept)
const healMap: Record<string, number> = {
  'heal_10': 10, 'heal_25': 25, 'heal_50': 50, 'heal_100': 100,
  'heal-lesser': 10, 'heal': 25, 'heal-greater': 50, 'heal-superior': 100,
};

// MP map (new)
const manaMap: Record<string, number> = {
  'mana_10': 10, 'mana_25': 25, 'mana_50': 50, 'mana_100': 100,
  'mana-lesser': 10, 'mana-potion': 25, 'mana-greater': 50, 'mana-superior': 100,
};

// SP map (new)
const staminaMap: Record<string, number> = {
  'stamina_10': 10, 'stamina_25': 25, 'stamina_50': 50, 'stamina_100': 100,
  'stamina-lesser': 10, 'stamina-potion': 25, 'stamina-greater': 50, 'stamina-superior': 100,
};

const hpAmt = healMap[code] ?? it.mods?.heal ?? 0;
const mpAmt = manaMap[code] ?? 0;
const spAmt = staminaMap[code] ?? 0;

// if no effect detected, bail like before
if (hpAmt <= 0 && mpAmt <= 0 && spAmt <= 0) { set({ heroes }); return; }


 if (s.ui.screen === 'battle' && s.combat) {
  const combat = { ...s.combat, actors: { ...s.combat.actors } };
  const actor = combat.actors[actorId] ?? Object.values(combat.actors).find(a => a.isPlayer);
  if (actor) {
    if (hpAmt > 0) actor.hp = { ...actor.hp, current: Math.min(actor.hp.max, actor.hp.current + hpAmt) };
    if (mpAmt > 0 && actor.mp) actor.mp = { ...actor.mp, current: Math.min(actor.mp.max, actor.mp.current + mpAmt) };
    if (spAmt > 0 && actor.sp) actor.sp = { ...actor.sp, current: Math.min(actor.sp.max, actor.sp.current + spAmt) };

    const parts: string[] = [];
    if (hpAmt > 0) parts.push(`heals ${hpAmt} HP`);
    if (mpAmt > 0) parts.push(`restores ${mpAmt} MP`);
    if (spAmt > 0) parts.push(`restores ${spAmt} SP`);
    combat.log = [...combat.log, { text: `${actor.name} drinks a potion and ${parts.join(' & ')}.` }];
  }
  hero.inventory.splice(ix, 1);

  // item use consumes player's turn
  combat.turn = combat.turn + 1;

  set({ heroes, combat, ui: { ...s.ui, battleMenu: 'closed'} });
  const afterAI = await stepUntilPlayerAsync(combat, ENEMY_DELAY_MS);
  set({ combat: afterAI });
  return;
}


  // out-of-battle: update persisted hero pools
if (hpAmt > 0) hero.hp.current = Math.min(hero.hp.max, hero.hp.current + hpAmt);
if (mpAmt > 0 && hero.mp) hero.mp.current = Math.min(hero.mp.max, hero.mp.current + mpAmt);
if (spAmt > 0 && hero.sp) hero.sp.current = Math.min(hero.sp.max, hero.sp.current + spAmt);

hero.inventory.splice(ix, 1);

// mirror into combat if present
if (s.combat && s.combat.actors[actorId]) {
  const combat = { ...s.combat, actors: { ...s.combat.actors } };
  const act = combat.actors[actorId];
  if (hpAmt > 0) act.hp = { ...act.hp, current: Math.min(act.hp.max, hero.hp.current) };
  if (mpAmt > 0 && act.mp) act.mp = { ...act.mp, current: Math.min(act.mp.max, hero.mp.current) };
  if (spAmt > 0) {
  hero.sp = hero.sp ?? { current: 0, max: 0 }; // ensure structure
  hero.sp.current = Math.min(hero.sp.max, hero.sp.current + spAmt);
}
  combat.log = [...combat.log, { text: `${act.name} uses a potion.` }];
  set({ heroes, combat });
} else {
  set({ heroes });
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
        const base = rebuildCombat(fixed);
        const hasSave = fixed.length && ((fixed[0].level ?? 1) > 1 || (fixed[0].xp ?? 0) > 0);

        // 1) Set immediate state
        useGame.setState({
          heroes: fixed,
          combat: base,
          ui: { screen: hasSave ? 'battle' : 'start' , battleMenu: 'closed' }
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
