// src/engine/abilities.ts
import { rng } from './rng'
import { dealPhysicalDamage, computeHitChance } from './rules'
import type { Actor, CombatState, StatusEffect, LogEvent } from './types' // 👈 include LogEvent
import { awardXPFromFoes } from './partyXp'                               // 👈 already added
import { makeItemFromCode } from './item-index'                           // 👈 already added

export type AbilityId = 
  | 'power_slash_lv1'
  | 'shield_bash_lv1'
  | 'parry_lv1'
  ;

export type Ability = {
  id: AbilityId;
  name: string;
  spCost: number;
  levelReq: number;
  requireShield?: boolean;
  type: 'attack' | 'status' ;
};

export const Abilities: Record<AbilityId, Ability> = {
  power_slash_lv1: { id: 'power_slash_lv1', name: 'Power Slash', spCost: 2, levelReq: 1, type: 'attack' },
  shield_bash_lv1:{ id: 'shield_bash_lv1',name: 'Shield Bash', spCost: 2, levelReq: 1, type: 'status', requireShield: true },
  parry_lv1:      { id: 'parry_lv1',      name: 'Parry',       spCost: 0, levelReq: 2, type: 'status' },
};

function hasShield(a: Actor): boolean {
  return !!a.equipment?.shield;
}

export function canUseAbility(a: Actor, ab: Ability): string | null {
  if (a.level < ab.levelReq) return `Requires level ${ab.levelReq}.`;
  const sp = a.sp?.current ?? 0;
  if (sp < ab.spCost) return 'Not enough Stamina.';
  if (ab.requireShield && !hasShield(a)) return 'Requires a shield.';
  return null;
}

function spendSP(a: Actor, cost: number) {
  if (!a.sp) return;
  a.sp.current = Math.max(0, a.sp.current - cost);
}

function addStatus(s: CombatState, id: string, eff: StatusEffect) {
  s.statuses ??= {};
  s.statuses[id] ??= [];
  s.statuses[id].push(eff);
}

function rollPct(p: number) { return rng.int(1, 100) <= p; }

/** ✅ Accept LogEvent[] and convert all strings to LogEvent before appending */
function resolveOutcome(state: CombatState, log: LogEvent[]): CombatState {
  const partyAlive = Object.values(state.actors).some(a => a.isPlayer && a.hp.current > 0);
  const foesAlive  = Object.values(state.actors).some(a => !a.isPlayer && a.hp.current > 0);

  if (partyAlive && !foesAlive) {
    const heroes = Object.values(state.actors).filter(a => a.isPlayer);
    const foes   = Object.values(state.actors).filter(a => !a.isPlayer);
    const xpMsgs = awardXPFromFoes(heroes, foes);            // string[]
    const xpLog: LogEvent[]   = xpMsgs.map(t => ({ text: t }));

    const dropMsgs: string[] = [];
    if (rng.int(0, 99) < 40) {
      const potion = makeItemFromCode('heal-lesser');
      const hero = heroes[0];
      hero.inventory ??= [];
      hero.inventory.push(potion);
      dropMsgs.push(`${hero.name} finds a ${potion.name}.`);
    }
    const dropLog: LogEvent[] = dropMsgs.map(t => ({ text: t }));

    return {
      ...state,
      log: [...log, { text: 'Victory!' }, ...xpLog, ...dropLog],
      over: true,
    };
  }

  return { ...state, log, turn: state.turn + 1 };
}

export function applyAbility(state: CombatState, userId: string, abilityId: AbilityId): CombatState {
  const ab = Abilities[abilityId];
  const user = state.actors[userId];
  const log: LogEvent[] = [...state.log];   // ✅ keep this as LogEvent[]

  if (!ab || !user || user.hp.current <= 0) {
    return { ...state, log: [...log, { text: 'Ability fizzles…' }], turn: state.turn + 1 };
  }
  const fail = canUseAbility(user, ab);
  if (fail) {
    return { ...state, log: [...log, { text: `${user.name} cannot use ${ab.name}: ${fail}` }], turn: state.turn + 1 };
  }

  // Target = first living foe by default
  const target = Object.values(state.actors).find(a => !a.isPlayer && a.hp.current > 0);
  if (ab.type !== 'status' && !target) {
    spendSP(user, ab.spCost);
    return { ...state, log: [...log, { text: `${user.name} uses ${ab.name}, but there is no target.` }], turn: state.turn + 1 };
  }

  // Spend SP up front
  spendSP(user, ab.spCost);

  switch (abilityId) {
    case 'power_slash_lv1': {
      const toHit = computeHitChance(user, target!);
      if (!rollPct(toHit)) {
        return { ...state, log: [...log, { text: `${user.name} uses Power Slash and misses ${target!.name}.` }], turn: state.turn + 1 };
      }
      let dmg = dealPhysicalDamage(user, target!) * 2;
      if (rollPct(70)) dmg = Math.floor(dmg * 1.5);

      const t = state.actors[target!.id];
      t.hp.current = Math.max(0, t.hp.current - dmg);
      log.push({ text: `${user.name} unleashes Power Slash on ${t.name} for ${dmg} damage! (${Math.max(0, t.hp.current)}/${t.hp.max} HP)` });

      return resolveOutcome(state, log); // ✅ ends battle immediately if last foe died
    }

    case 'shield_bash_lv1': {
      const dex = target!.base.dex ?? 0;
      const chance = Math.max(10, Math.min(90, 50 - dex * 5));
      if (!rollPct(chance)) {
        return { ...state, log: [...log, { text: `${user.name} tries Shield Bash, but ${target!.name} keeps footing.` }], turn: state.turn + 1 };
      }
      addStatus(state, target!.id, { code: 'stun', turns: 1 });
      log.push({ text: `${user.name} slams ${target!.name} with Shield Bash — stunned for 1 round!` });
      return resolveOutcome(state, log);
    }

    case 'parry_lv1': {
      addStatus(state, user.id, { code: 'parry', turns: 1, potency: 0.15 });
      log.push({ text: `${user.name} prepares to parry — 15% damage reduction until next turn.` });
      return resolveOutcome(state, log);
    }

    default:
      log.push({ text: `${user.name} fumbles ${ab.name}.` });
      return resolveOutcome(state, log);
  }
}
