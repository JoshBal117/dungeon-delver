import { rng } from './rng';
import { dealPhysicalDamage, applyDamage } from './rules';
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

  // whose turn?
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
      const heroes = Object.values(state.actors).filter(a => a.isPlayer);
      const foes   = Object.values(state.actors).filter(a => !a.isPlayer);
      const xpMsgs = awardXPFromFoes(heroes, foes);
      log = [...log, { text: 'Victory!' }, ...xpMsgs.map(text => ({ text }))];
    } else {
      log.push({ text: 'Defeat…' });
    }

    return { ...state, over: true, log };
  }

  // attack sequence
  const variance = rng.int(-2, 2); // or tighten to (-1, 1)
  const dmg = Math.max(dealPhysicalDamage(actor, target) + variance);

  const weapon = actor.equipment?.weapon;
const wDmg = weapon?.mods?.damage ?? 0;
console.log('Damage calc', {
  attacker: actor.name,
  defender: target.name,
  weaponDamage: wDmg,
  STR: actor.base.str,
  ARM: target.base.armor,
  variance,
  dmg,
  defenderHP_before: `${target.hp.current}/${target.hp.max}`,
});


  applyDamage(target, dmg);

  const log = [
    ...state.log,
    { text: `${actor.name} hits ${target.name} for ${dmg}. (${Math.max(0, target.hp.current)}/${target.hp.max} HP)` },
  ];

const partyAliveAfter = Object.values(state.actors).some(a => a.isPlayer && a.hp.current > 0);
  const foesAliveAfter = Object.values(state.actors).some(a => !a.isPlayer && a.hp.current > 0);


  if (partyAliveAfter && !foesAliveAfter) {
    const heroes = Object.values(state.actors).filter(a => a.isPlayer);
    const foes = Object.values(state.actors).filter(a => !a.isPlayer);
    const xpMsgs = awardXPFromFoes(heroes, foes);

    const dropMsgs: string[] = [];
     if (rng.int(0, 99) < 40) {
      const potion = makeItemFromCode('heal-lesser');
      const hero = heroes[0];
      hero.inventory ??= [];
      hero.inventory.push(potion);
      dropMsgs.push(`${hero.name} finds a ${potion.name}.`);
     }

   
    const winLog = [...log, { text: 'Victory!' }, 
      ...xpMsgs.map(text => ({ text })),
      ...dropMsgs.map(text => ({ text }))
    ];
    return { ...state, log: winLog, over: true };
  }
 // If battle continues, move to next turn
  const over = !(partyAliveAfter && foesAliveAfter);
  const finalLog = over ? [...log, { text: foesAliveAfter ? 'Defeat…' : 'Victory!' }] : log;

  return { ...state, log: finalLog, over, turn: state.turn + 1 };
}

