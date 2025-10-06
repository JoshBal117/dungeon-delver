import { rng } from './rng';
import { dealPhysicalDamage, applyDamage } from './rules';
import type { Actor, CombatState } from './types';
import { tryLevelUp } from './leveling';

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

  // pick first living enemy
  const target = Object.values(state.actors).find(
    a => a.isPlayer !== actor.isPlayer && a.hp.current > 0
  );

  // no valid target => resolve win/lose and award XP on win
  if (!target) {
    const partyAlive = Object.values(state.actors).some(a => a.isPlayer && a.hp.current > 0);
    let log = [...state.log];

    if (partyAlive) {
      const hero = Object.values(state.actors).find(a => a.isPlayer);
      if (hero) {
        const xpGain = 20;
        hero.xp += xpGain;
        const levelMsgs = tryLevelUp(hero); // string[] of messages
        log = [
          ...log,
          { text: 'Victory!' },
          { text: `Gained ${xpGain} XP (${hero.xp}/${hero.xpToNext})` },
          ...levelMsgs.map(msg => ({ text: msg })),
        ];
      } else {
        log.push({ text: 'Victory!' });
      }
    } else {
      log.push({ text: 'Defeat…' });
    }

    return { ...state, over: true, log };
  }

  // attack sequence
  const variance = rng.int(-1, 2);
  const dmg = Math.max(1, dealPhysicalDamage(actor, target, 1) + variance);

  console.debug('Damage calc', {
    attacker: actor.name,
    defender: target.name,
    base: 1,
    STR: actor.base.str,
    ARM: target.base.armor,
    variance,
    dmg,
    defenderHP_before: `${target.hp.current}/${target.hp.max}`,
  });

  applyDamage(target, dmg);

  console.debug('After hit', {
    defender: target.name,
    defenderHP_after: `${target.hp.current}/${target.hp.max}`,
  });

  const log = [
    ...state.log,
    {
      text: `${actor.name} hits ${target.name} for ${dmg}. (${Math.max(0, target.hp.current)}/${target.hp.max} HP)`,
    },
  ];

  const partyAlive = Object.values(state.actors).some(a => a.isPlayer && a.hp.current > 0);
  const foesAlive = Object.values(state.actors).some(a => !a.isPlayer && a.hp.current > 0);

  const over = !(partyAlive && foesAlive);
  const finalLog = over ? [...log, { text: foesAlive ? 'Defeat…' : 'Victory!' }] : log;

  return { ...state, log: finalLog, over, turn: state.turn + 1 };
}
