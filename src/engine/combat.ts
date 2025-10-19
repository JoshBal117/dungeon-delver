import { rng } from './rng';
import { performAttack, applyDamage } from './rules';
import type { Actor, CombatState } from './types';
import { makeItemFromCode } from './item-index';
import { awardXPFromFoes } from './partyXp';



export function initCombat(party: Actor[], foes: Actor[]): CombatState {
  const all = [...party, ...foes];
  const order = [...all].sort((a, b) => b.base.speed - a.base.speed).map(a => a.id);

  return {
    turn: 0,
    order,
    actors: Object.fromEntries(all.map(a => [a.id, a])),
    log: [{ text: 'Battle begins!' }],
    over: false,
  };
}

export function step(state: CombatState): CombatState {
  if (state.over) return state;

  const id = state.order[state.turn % state.order.length];
  const actor = state.actors[id];

  const target = Object.values(state.actors).find(
    a => a.isPlayer !== actor.isPlayer && a.hp.current > 0
  );

  if (!target) {
    const partyAlive = Object.values(state.actors).some(a => a.isPlayer && a.hp.current > 0);
    let log = [...state.log];

    if (partyAlive) {
      const heroes = Object.values(state.actors).filter(a => a.isPlayer);
      const foes   = Object.values(state.actors).filter(a => !a.isPlayer);
      const xpMsgs = awardXPFromFoes(heroes, foes);
      log = [...log, { text: 'Victory!' }, ...xpMsgs.map(text => ({ text }))];
    } else {
      log.push({ text: 'Defeat…' });
    }
    return { ...state, over: true, log };
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

  applyDamage(target, result.dmg);

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
    if (rng.int(0, 99) < 40) {
      const potion = makeItemFromCode('heal-lesser');
      const hero = heroes[0];
      hero.inventory ??= [];
      hero.inventory.push(potion);
      dropMsgs.push(`${hero.name} finds a ${potion.name}.`);
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