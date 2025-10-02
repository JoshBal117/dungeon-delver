import { rng } from './rng';
import { dealPhysicalDamage, applyDamage } from './rules';
import type { Actor, CombatState } from './types';

export function initCombat(party: Actor[], foes: Actor[]): CombatState {
  const all = [...party, ...foes];
  const order = [...all].sort((a, b) => b.stats.speed - a.stats.speed).map(a => a.id);

  return {
    turn: 0,
    order,
    actors: Object.fromEntries(all.map(a => [a.id, a])),
    log: [{ text: 'Battle begins!' }],
    over: false,
  };
}

export function step(state: CombatState): CombatState {
  if (state.over) return state; // no-op if combat is over

  const id = state.order[state.turn % state.order.length];
  const actor = state.actors[id];

  // pick first living enemy
  const target = Object.values(state.actors).find(
    a => a.isPlayer !== actor.isPlayer && a.stats.hp.current > 0
  );

  // no valid target => the current side just wiped the other side
  if (!target) {
    return { ...state, over: true, log: [...state.log, { text: 'Victory!' }] };
  }

  // basic attack with a little variance
  const variance = rng.int(-1, 2);
  const dmg = Math.max(1, dealPhysicalDamage(actor, target, 5) + variance);
  applyDamage(target, dmg);

  const log = [
    ...state.log,
    {
      text: `${actor.name} hits ${target.name} for ${dmg}. (${Math.max(
        0,
        target.stats.hp.current
      )}/${target.stats.hp.max} HP)`,
    },
  ];

  const partyAlive = Object.values(state.actors).some(
    a => a.isPlayer && a.stats.hp.current > 0
  );
  const foesAlive = Object.values(state.actors).some(
    a => !a.isPlayer && a.stats.hp.current > 0
  );

  const over = !(partyAlive && foesAlive);
  const finalLog = over ? [...log, { text: foesAlive ? 'Defeat…' : 'Victory!' }] : log;

  return { ...state, log: finalLog, over, turn: state.turn + 1 };
}
