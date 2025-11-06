import { rng } from './rng';
import { performAttack, applyDamage } from './rules';
import type { Actor, CombatState, StatusCode, StatusEffect } from './types';
import { makeItemFromCode } from './item-index';
import { awardXPFromFoes } from './partyXp';
import { decideAction } from './ai'


// --- Loot helpers (typed, no any, uses rng) ----------------------
type SlimeColor = 'red' | 'green' | 'blue';

const isHumanoid = (a: Actor) => Boolean(a.tags?.humanoid);

// Read tags.slimeColor in a typed-safe way without `any`
const slimeColorOf = (a: Actor): SlimeColor | undefined => {
  const t = a.tags as { slimeColor?: SlimeColor } | undefined;
  return t?.slimeColor;
};

function rngChance(pct: number): boolean {
  // pct as 0..100
  return rng.int(1, 100) <= Math.max(0, Math.min(100, Math.floor(pct)));
}

function dropsFromFoe(foe: Actor): string[] {
  const codes: string[] = [];

  // 1) Slimes by color: red->heal, green->stamina, blue->mana
  const sc = slimeColorOf(foe);
  if (sc === 'red')   { if (rngChance(35)) codes.push('heal-lesser'); }
  if (sc === 'green') { if (rngChance(35)) codes.push('stamina-lesser'); }
  if (sc === 'blue')  { if (rngChance(35)) codes.push('mana-lesser'); }

  // 2) Humanoids (e.g., goblins, bandits): stamina potions
  if (isHumanoid(foe)) {
    if (rngChance(30)) codes.push('stamina-lesser');
  }

  // Optional: keep your old generic drop on non-slimes & non-humanoids
  if (!sc && !isHumanoid(foe)) {
    if (rngChance(40)) codes.push('heal-lesser');
  }

  return codes;
}

function rollDropsForKilled(killed: Actor[]): string[] {
  const out: string[] = [];
  for (const k of killed) out.push(...dropsFromFoe(k));
  return out;
}





export function initCombat(party: Actor[], foes: Actor[]): CombatState {
  const all = [...party, ...foes];
  const order = [...all]
      .sort((a, b) => {
        if (b.base.speed !== a.base.speed) return b.base.speed - a.base.speed;
        if (b.base.dex   !== a.base.dex)   return b.base.dex   - a.base.dex;  
        return a.id.localeCompare(b.id)
      })
        .map(a => a.id);

  return {
    turn: 0,
    order,
    actors: Object.fromEntries(all.map(a => [a.id, a])),
    log: [{ text: 'Battle begins!' }],
    over: false,

    
  };

}



function getEffects(s: CombatState, id: string): StatusEffect[] {
  return (s.statuses?.[id] ?? []);
}
function hasEffect(s: CombatState, id: string, code: StatusCode): StatusEffect | undefined {
  return getEffects(s, id).find(e => e.code === code);
}
function tickStatuses(s: CombatState, id: string) {
  if (!s.statuses) return;
  const next = (s.statuses[id] ?? []).map(e => ({ ...e, turns: e.turns - 1 })).filter(e => e.turns > 0);
  s.statuses[id] = next;
}
function reduceDamageByStatuses(s: CombatState, targetId: string, dmg: number): number {
  let out = dmg;
  const parry = hasEffect(s, targetId, 'parry');
  if (parry?.potency) out = Math.floor(out * (1 - parry.potency));
  const defend = hasEffect(s, targetId, 'defend');
  if (defend?.potency) out = Math.floor(out * (1 - defend.potency));
  return Math.max(0, out);
}


export function step(state: CombatState): CombatState {
  if (state.over) return state;

  

  const id = state.order[state.turn % state.order.length];
  const actor = state.actors[id];

  const stunned = hasEffect(state, actor.id, 'stun') || hasEffect(state, actor.id, 'paralyzed');
if (stunned) {
  const newLog = [...state.log, { text: `${actor.name} is stunned and loses the turn.` }];
  // tick and advance
  tickStatuses(state, actor.id);
  return { ...state, log: newLog, turn: state.turn + 1 };
}

 
// --- Decide action via AI ---
const action = decideAction(state, actor);

if (action.kind === 'defend') {
  const newLog = [...state.log, { text: `${actor.name} takes a defensive stance.` }];
  return { ...state, log: newLog, turn: state.turn + 1 };
}

if (action.kind === 'use-item') {
  const newLog = [...state.log, { text: `${actor.name} fumbles with an item (not implemented).` }];
  return { ...state, log: newLog, turn: state.turn + 1 };
}

if (action.kind === 'ability') {
  const newLog = [...state.log, { text: `${actor.name} uses ${action.abilityCode} (not implemented).` }];
  return { ...state, log: newLog, turn: state.turn + 1 };
}

// kind === 'attack'
const target = state.actors[action.targetId];
if (!target || target.hp.current <= 0) {
  const newLog = [...state.log, { text: `${actor.name} hesitates...` }];
  return { ...state, log: newLog, turn: state.turn + 1 };
}

// --- Attack roll ---
const result = performAttack(actor, target);


  if (!result.hit) {
    // Inline the return so no unused variable warning
    return {
      ...state,
      log: [...state.log, { text: `${actor.name} misses ${target.name}.` }],
      turn: state.turn + 1,
    };
  }
  const mitigated = reduceDamageByStatuses(state, target.id, result.dmg);
  applyDamage(target,mitigated);

// Pick a verb from damage type

// Use the fully formatted line from performAttack
const newLog = [
  ...state.log,
  {
    text: `${result.logLine} (${Math.max(0, target.hp.current)}/${target.hp.max} HP)`
  },
];


  // --- Victory/defeat check (unchanged, just use newLog instead of log) ---
  const partyAliveAfter = Object.values(state.actors).some(a => a.isPlayer && a.hp.current > 0);
  const foesAliveAfter  = Object.values(state.actors).some(a => !a.isPlayer && a.hp.current > 0);

  if (partyAliveAfter && !foesAliveAfter) {
    const heroes = Object.values(state.actors).filter(a => a.isPlayer);
    const foes   = Object.values(state.actors).filter(a => !a.isPlayer);
    const xpMsgs = awardXPFromFoes(heroes, foes);

 const dropMsgs: string[] = [];
const killedFoes = foes.filter(f => f.hp.current <= 0);

const dropCodes = rollDropsForKilled(killedFoes);

const hero = heroes[0];
hero.inventory ??= [];
for (const code of dropCodes) {
  const item = makeItemFromCode(code);
  hero.inventory.push(item);
  dropMsgs.push(`${hero.name} finds a ${item.name}.`);
}

    const winLog = [...newLog, { text: 'Victory!' }, 
      ...xpMsgs.map(text => ({ text })),
      ...dropMsgs.map(text => ({ text }))
    ];
    return { ...state, log: winLog, over: true };
  }

  const over = !(partyAliveAfter && foesAliveAfter);
  const finalLog = over ? [...newLog, { text: foesAliveAfter ? 'Defeat…' : 'Victory!' }] : newLog;

  return { ...state, log: finalLog, over, turn: state.turn + 1 };
}

/* --------------------------
   Helpers to enable auto-AI
   -------------------------- */

// Who acts next?
export function currentActor(state: CombatState): Actor {
  const id = state.order[state.turn % state.order.length];
  return state.actors[id];
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Async version: pause between AI turns. */
export async function stepUntilPlayerAsync(state: CombatState, delayMs = 1000): Promise<CombatState> {
  let s = state;
  while (!s.over) {
    const a = currentActor(s);
    if (!a || a.isPlayer) break;

    // Delay before the AI acts
    await wait(delayMs);
    
    s = step(s);
  }
  return s;
}
