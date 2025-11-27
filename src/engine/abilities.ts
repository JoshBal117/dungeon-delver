// src/engine/abilities.ts
import { rng } from './rng';
import { dealPhysicalDamage, computeHitChance } from './rules';
import type { Actor, CombatState, StatusEffect, LogEvent } from './types';
import { awardXPFromFoes } from './partyXp';
import { makeItemFromCode } from './item-index';

export function abilitiesForActor(a: Actor): Ability[] {
  return Object.values(Abilities).filter(ab => a.level >= ab.levelReq);
}

export type AbilityId =
  | 'power_slash_lv1'
  | 'shield_bash_lv1'
  | 'parry_lv1'
  | 'knights_strike'
  | 'knights_aura'
  | 'rushing_charge'
  | 'power_slash_lv2'
  | 'shield_bash_lv2'
  | 'parry_lv2'
  | 'starlight_slash'
  | 'oath_of_the_knight'
  | 'blade_of_the_kingdom';

export type Ability = {
  id: AbilityId;
  name: string;
  spCost: number;
  levelReq: number;
  requireShield?: boolean;
  type: 'attack' | 'status';
};

export const Abilities: Record<AbilityId, Ability> = {
  power_slash_lv1:   { id: 'power_slash_lv1',   name: 'Power Slash Lv1',     spCost: 2,  levelReq: 1,  type: 'attack' },
  shield_bash_lv1:   { id: 'shield_bash_lv1',   name: 'Shield Bash Lv1',     spCost: 2,  levelReq: 1,  type: 'status', requireShield: true },
  parry_lv1:         { id: 'parry_lv1',         name: 'Parry Lv1',           spCost: 0,  levelReq: 2,  type: 'status' },

  // new ones
  knights_strike:    { id: 'knights_strike',    name: 'Knight’s Strike',     spCost: 4,  levelReq: 4,  type: 'attack' },
  knights_aura:      { id: 'knights_aura',      name: 'Knight’s Aura',       spCost: 6,  levelReq: 6,  type: 'status' },
  rushing_charge:    { id: 'rushing_charge',    name: 'Rushing Charge',      spCost: 8,  levelReq: 8,  type: 'attack' },

  power_slash_lv2:   { id: 'power_slash_lv2',   name: 'Power Slash Lv2',     spCost: 8,  levelReq: 10, type: 'attack' },
  shield_bash_lv2:   { id: 'shield_bash_lv2',   name: 'Shield Bash Lv2',     spCost: 3,  levelReq: 10, type: 'status', requireShield: true },
  parry_lv2:         { id: 'parry_lv2',         name: 'Parry Lv2',           spCost: 0,  levelReq: 10, type: 'status' },

  starlight_slash:   { id: 'starlight_slash',   name: 'Starlight Slash',     spCost: 20, levelReq: 15, type: 'attack' },
  oath_of_the_knight:{ id: 'oath_of_the_knight',name: 'Oath of the Knight',  spCost: 25, levelReq: 20, type: 'attack' },
  blade_of_the_kingdom:{id: 'blade_of_the_kingdom', name:'Blade of the Kingdom', spCost: 50, levelReq: 24, type:'attack' },
};

function hasShield(a: Actor): boolean { return !!a.equipment?.shield; }

export function canUseAbility(a: Actor, ab: Ability): string | null {
  if ((a.level ?? 1) < ab.levelReq) return `Requires level ${ab.levelReq}.`;
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

function rollPct(p: number) {
  return rng.int(1, 100) <= p;
}

// Reusable damage calc for Power Slash Lv1
function computePowerSlashLv1Damage(user: Actor, target: Actor): number {

  let dmg = dealPhysicalDamage(user, target) * 2; // base 2×
  if (rollPct(70)) {
    dmg = Math.floor(dmg * 1.5); // 70% good-angle bonus → up to 3×
  }
  return dmg;
}
function livingFoes(state: CombatState, user: Actor): Actor[] {
  return Object.values(state.actors).filter(a => a.isPlayer !== user.isPlayer && a.hp.current > 0);
}
function firstLivingFoe(state: CombatState, user: Actor): Actor | undefined {
  return livingFoes(state, user)[0];
}
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

/** ✅ Accept LogEvent[] and convert all strings to LogEvent before appending */
function resolveOutcome(state: CombatState, log: LogEvent[]): CombatState {
  const partyAlive = Object.values(state.actors).some(a => a.isPlayer && a.hp.current > 0);
  const foesAlive  = Object.values(state.actors).some(a => !a.isPlayer && a.hp.current > 0);

  if (partyAlive && !foesAlive) {
    const heroes = Object.values(state.actors).filter(a => a.isPlayer);
    const foes   = Object.values(state.actors).filter(a => !a.isPlayer);

    // 1) XP gain + level ups (includes SP full on level-up via awardXPFromFoes)
    const xpMsgs = awardXPFromFoes(heroes, foes);
    const xpLog: LogEvent[] = xpMsgs.map(t => ({ text: t }));

    // 2) Between-battle Stamina regen, same rule as combat.step
    const spMsgs: string[] = [];
    for (const h of heroes) {
      if (!h.sp) continue;
      const gain   = Math.max(2, Math.ceil(h.sp.max * 0.5)); // half bar, min 2
      const before = h.sp.current;
      h.sp.current = Math.min(h.sp.max, h.sp.current + gain);
      const actual = h.sp.current - before;
      if (actual > 0) {
        spMsgs.push(`${h.name} regains ${actual} Stamina between battles.`);
      }
    }
    const spLog: LogEvent[] = spMsgs.map(t => ({ text: t }));

    // 3) Simple potion drop (your existing ability-path drop logic)
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
      log: [...log, { text: 'Victory!' }, ...xpLog, ...spLog, ...dropLog],
      over: true,
    };
  }

  // Battle continues → just advance the turn
  return { ...state, log, turn: state.turn + 1 };
}


export function applyAbility(state: CombatState, userId: string, abilityId: AbilityId): CombatState {
  const ab = Abilities[abilityId];
  const user = state.actors[userId];
  const log: LogEvent[] = [...state.log];

  if (!ab || !user || user.hp.current <= 0) {
    return { ...state, log: [...log, { text: 'Ability fizzles…' }], turn: state.turn + 1 };
  }
  const fail = canUseAbility(user, ab);
  if (fail) {
    return { ...state, log: [...log, { text: `${user.name} cannot use ${ab.name}: ${fail}` }], turn: state.turn + 1 };
  }

  // Default single target (for attacks)
  const defaultTarget = firstLivingFoe(state, user);

  // Spend SP up front
  spendSP(user, ab.spCost);

  switch (abilityId) {
    // ---------- Existing Lv1 set ----------
   case 'power_slash_lv1': {
  if (!defaultTarget) {
    log.push({ text: `${user.name} uses Power Slash, but there is no target.` });
    return resolveOutcome(state, log);
  }

  const t = state.actors[defaultTarget.id];
  const toHit = computeHitChance(user, t);
  if (!rollPct(toHit)) {
    log.push({ text: `${user.name} uses Power Slash and misses ${t.name}.` });
    return resolveOutcome(state, log);
  }

  const dmg = computePowerSlashLv1Damage(user, t);
  t.hp.current = Math.max(0, t.hp.current - dmg);

  log.push({
    text: `${user.name} unleashes Power Slash on ${t.name} for ${dmg} damage! (${t.hp.current}/${t.hp.max} HP)`
  });
  return resolveOutcome(state, log);
}
    case 'shield_bash_lv1': {
      if (!defaultTarget) {
        log.push({ text: `${user.name} tries Shield Bash, but there is no target.` });
        return resolveOutcome(state, log);
      }
      const dex = defaultTarget.base.dex ?? 0;
      const chance = clamp(50 - dex * 5, 10, 90);
      if (!rollPct(chance)) {
        log.push({ text: `${user.name} tries Shield Bash, but ${defaultTarget.name} keeps footing.` });
        return resolveOutcome(state, log);
      }
      addStatus(state, defaultTarget.id, { code: 'stun', turns: 1 });
      log.push({ text: `${user.name} slams ${defaultTarget.name} with Shield Bash — stunned for 1 round!` });
      return resolveOutcome(state, log);
    }

   case 'parry_lv1': {
  // Next incoming hit is reduced, next attack is empowered
  addStatus(state, user.id, { code: 'defend', turns: 1, potency: 0.50 }); // 50% dmg reduction on next hit
  addStatus(state, user.id, { code: 'parry',  turns: 1, potency: 2.00 }); // 1.5× damage on next attack

  log.push({
    text: `${user.name} braces to parry — the next hit is softened, and the next strike will be a vicious riposte.`
  });
  return resolveOutcome(state, log);
}

    // ---------- New Knight abilities ----------
   case 'knights_strike': {
  const foes = livingFoes(state, user);
  if (foes.length === 0) {
    log.push({ text: `${user.name} uses Knight’s Strike but no foes remain.` });
    return resolveOutcome(state, log);
  }

  const maxTargets = (user.level ?? 1) >= 21 ? 3 : 2; // Lv21 upgrade → 3 targets
  const targets = foes.slice(0, maxTargets);

  // SINGLE-TARGET MODE: "two Power Slashes"
  if (targets.length === 1) {
    const t = state.actors[targets[0].id];

    const toHit1 = computeHitChance(user, t);
    const toHit2 = computeHitChance(user, t);

    let total = 0;

    if (rollPct(toHit1)) {
      const dmg1 = computePowerSlashLv1Damage(user, t);
      t.hp.current = Math.max(0, t.hp.current - dmg1);
      total += dmg1;
    } else {
      log.push({ text: `${user.name}'s first swing of Knight’s Strike misses ${t.name}.` });
    }

    if (t.hp.current > 0 && rollPct(toHit2)) {
      const dmg2 = computePowerSlashLv1Damage(user, t);
      t.hp.current = Math.max(0, t.hp.current - dmg2);
      total += dmg2;
    } else if (t.hp.current > 0) {
      log.push({ text: `${user.name}'s second swing of Knight’s Strike misses ${t.name}.` });
    }

    log.push({
      text: `${user.name} executes Knight’s Strike — two crushing arcs for ${total} total damage! (${t.hp.current}/${t.hp.max} HP)`
    });

    return resolveOutcome(state, log);
  }

  // MULTI-TARGET MODE: cleave slightly stronger than a basic attack
  for (const target of targets) {
    const t = state.actors[target.id];
    const toHit = computeHitChance(user, t);
    if (!rollPct(toHit)) {
      log.push({ text: `${user.name} swings Knight’s Strike at ${t.name} but misses.` });
      continue;
    }
    const base = dealPhysicalDamage(user, t);
    const dmg = Math.floor(base * 1.5);
    t.hp.current = Math.max(0, t.hp.current - dmg);
    log.push({ text: `${user.name} cleaves ${t.name} for ${dmg} damage with Knight’s Strike.` });
  }

  return resolveOutcome(state, log);
}

    case 'knights_aura': {
      const foes = livingFoes(state, user);
      if (foes.length === 0) { log.push({ text: `${user.name} invokes Knight’s Aura, but no foes remain.` }); return resolveOutcome(state, log); }

      for (const f of foes) {
        const userWis = user.base.wis ?? 0;
        const foeWis  = f.base.wis ?? 0;
        const chance  = clamp(50 + (userWis - foeWis) * 5, 10, 90);
        const roll    = rng.int(1, 100);
        if (roll <= chance) {
          addStatus(state, f.id, { code: 'paralyzed', turns: 1 });
          log.push({ text: `${f.name} is terrified by ${user.name} and is paralyzed for 1 round!` });
        } else {
          log.push({ text: `${f.name} resists ${user.name}’s aura.` });
        }
      }
      return resolveOutcome(state, log);
    }

    case 'rushing_charge': {
      const foes = livingFoes(state, user).slice(0, 4); // “line” → first 4 foes
      if (foes.length === 0) { log.push({ text: `${user.name} charges… but there’s no one there.` }); return resolveOutcome(state, log); }
      log.push({ text: `${user.name} performs a Rushing Charge!` });
      for (const t of foes) {
        const toHit = computeHitChance(user, t);
        if (!rollPct(toHit)) { log.push({ text: `${user.name} rushes past ${t.name}, missing.` }); continue; }
        const dmg = dealPhysicalDamage(user, t) * 2; // double damage
        t.hp.current = Math.max(0, t.hp.current - dmg);
        log.push({ text: `${user.name} slams ${t.name} for ${dmg} damage!` });
      }
      return resolveOutcome(state, log);
    }

    case 'power_slash_lv2': {
      if (!defaultTarget) { log.push({ text: `${user.name} uses Power Slash, but there is no target.` }); return resolveOutcome(state, log); }
      const toHit = computeHitChance(user, defaultTarget);
      if (!rollPct(toHit)) { log.push({ text: `${user.name} uses Power Slash (Lv2) and misses ${defaultTarget.name}.` }); return resolveOutcome(state, log); }
      const t = state.actors[defaultTarget.id];
      const dmg = dealPhysicalDamage(user, t) * 4; // 4× at Lv2
      t.hp.current = Math.max(0, t.hp.current - dmg);
      log.push({ text: `${user.name} unleashes Power Slash Lv2 on ${t.name} for ${dmg} damage!` });
      return resolveOutcome(state, log);
    }

    case 'shield_bash_lv2': {
      if (!defaultTarget) { log.push({ text: `${user.name} tries Shield Bash, but there is no target.` }); return resolveOutcome(state, log); }
      const dex = defaultTarget.base.dex ?? 0;
      const chance = clamp(55 - dex * 4, 15, 95); // slightly better than Lv1
      if (!rollPct(chance)) {
        log.push({ text: `${user.name} tries Shield Bash (Lv2), but ${defaultTarget.name} keeps footing.` });
        return resolveOutcome(state, log);
      }
      // small damage bump + stun
      const bump = Math.floor(dealPhysicalDamage(user, defaultTarget) * 0.3);
      const t = state.actors[defaultTarget.id];
      t.hp.current = Math.max(0, t.hp.current - bump);
      addStatus(state, defaultTarget.id, { code: 'stun', turns: 1 });
      log.push({ text: `${user.name} crushes ${t.name} with Shield Bash Lv2 for ${bump} and stuns for 1 round!` });
      return resolveOutcome(state, log);
    }

    case 'parry_lv2': {
  // Stronger version: tougher guard, nastier riposte
  addStatus(state, user.id, { code: 'defend', turns: 1, potency: 0.65 }); // 65% dmg reduction
  addStatus(state, user.id, { code: 'parry',  turns: 1, potency: 4.00 }); // 2× damage on next attack

  log.push({
    text: `${user.name} enters a perfect parry stance — the next blow is blunted, and the riposte will be devastating.`
  });
  return resolveOutcome(state, log);
}

    case 'starlight_slash': {
      const t0 = defaultTarget;
      if (!t0) { log.push({ text: `${user.name} tries Starlight Slash but no target is present.` }); return resolveOutcome(state, log); }
      const t = state.actors[t0.id];
      log.push({ text: `${user.name} unleashes Starlight Slash!` });
      // 5 sequential hits, +10% each hit
      const mults = [1.0, 1.1, 1.2, 1.3, 1.4];
      for (const m of mults) {
        if (t.hp.current <= 0) break;
        const toHit = computeHitChance(user, t);
        if (!rollPct(toHit)) { log.push({ text: `A streak misses ${t.name}.` }); continue; }
        const dmg = Math.floor(dealPhysicalDamage(user, t) * m);
        t.hp.current = Math.max(0, t.hp.current - dmg);
        log.push({ text: `Starlight hit deals ${dmg} to ${t.name}.` });
      }
      return resolveOutcome(state, log);
    }

    case 'oath_of_the_knight': {
      const t0 = defaultTarget;
      if (!t0) { log.push({ text: `${user.name} invokes the Oath, but no target is present.` }); return resolveOutcome(state, log); }
      const t = state.actors[t0.id];
      const toHit = computeHitChance(user, t);
      if (!rollPct(toHit)) { log.push({ text: `${user.name} strikes with the Oath but misses ${t.name}.` }); return resolveOutcome(state, log); }
      const dmg = dealPhysicalDamage(user, t) * 5; // guaranteed crit flavor → 5×
      t.hp.current = Math.max(0, t.hp.current - dmg);
      log.push({ text: `${user.name} pierces ${t.name}'s weakness for ${dmg} damage! (Oath of the Knight)` });
      return resolveOutcome(state, log);
    }

    case 'blade_of_the_kingdom': {
      const t0 = defaultTarget;
      if (!t0) { log.push({ text: `${user.name} invokes Blade of the Kingdom, but no target is present.` }); return resolveOutcome(state, log); }
      const t = state.actors[t0.id];
      const toHit = computeHitChance(user, t);
      if (!rollPct(toHit)) { log.push({ text: `${user.name} swings the royal blade but misses ${t.name}.` }); return resolveOutcome(state, log); }
      const dmg = dealPhysicalDamage(user, t) * 10;
      t.hp.current = Math.max(0, t.hp.current - dmg);
      addStatus(state, user.id, { code: 'armor_down', turns: 2, potency: -10 });
      log.push({ text: `${user.name} unleashes Blade of the Kingdom for ${dmg} damage! Armor -10 for 2 rounds.` });
      return resolveOutcome(state, log);
    }

    default:
      log.push({ text: `${user.name} fumbles ${ab.name}.` });
      return resolveOutcome(state, log);
  }
}
