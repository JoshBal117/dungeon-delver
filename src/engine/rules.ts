// src/engine/rules.ts
import { rng } from './rng';
import type { Actor } from './types';
import { getTotalArmor, computeLinearMitigation } from './armor';

type NaturalAttack = { name: string; verb: string; crit: string}


function naturalAttackFor( a: Actor): NaturalAttack | null {
  if (a.equipment?.weapon) return null;

  const n = (a.name  || '').toLowerCase();

  if (a.tags?.beast) {
    if (n.includes('wolf'))        return { name: 'Fangs',  verb: 'bites',    crit: 'Savage Bite' };
    if (n.includes('bat'))         return { name: 'Fangs',  verb: 'bites',    crit: 'Vicious Bite' };
    if (n.includes('bear'))        return { name: 'Claws',  verb: 'mauls',    crit: 'Rending Maul' };
    if (n.includes('slime'))       return { name: 'Body',   verb: 'engulfs',  crit: 'Crushing Squeeze' };
  }

  if (a.tags?.flying && !a.equipment?.weapon) {
    return {name: 'Talons', verb: 'bludgeons', crit: 'Shattering Blow'};
  }

  return { name: 'Claws', verb: 'claws', crit: 'Ripper Slash'};
} 


function computeRawPhysicalDamage(attacker: Actor): number {
  const weaponBase = attacker.equipment?.weapon?.mods?.damage ?? 2;
  const strBonus   = (attacker.base.str ?? 0) * 0.5;
  return weaponBase + strBonus; 
}

function applyMitigationToRaw( raw: number, defender: Actor): number{
  const totalArmor = getTotalArmor(defender);
  const mit        = computeLinearMitigation(totalArmor);
  const after      = raw * (1 -mit);
  return Math.max(1, Math.floor(after));
}

/** Weapon-based damage with STR addition and linear armor mitigation. */
export function dealPhysicalDamage(attacker: Actor, defender: Actor): number {
  const weaponBase = attacker.equipment?.weapon?.mods?.damage ?? 2; // unarmed ~= 2
  const strBonus   = (attacker.base.str ?? 0) * 0.5;
  const raw        = weaponBase + strBonus;

  const totalArmor = getTotalArmor(defender);
  const mit        = computeLinearMitigation(totalArmor); // 0..0.60
  const mitigated  = raw * (1 - mit);

   console.log('[DMG/Armor]', {
    atk: attacker.name,
    def: defender.name,
    weaponBase,
    strBonus,
    raw,
    totalArmor,
    mitigationPct: Math.round(mit * 100),          // e.g., 24 => 24%
    prevented: +(raw - mitigated).toFixed(2),      // raw damage shaved off by armor
    afterArmor: +mitigated.toFixed(2),
  });

  return Math.max(1, Math.floor(mitigated));
}

// ------------------
// Helpers
// ------------------
function clampN(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function getWeaponName(attacker: Actor): string {
  if (attacker.equipment?.weapon?.name) return attacker.equipment.weapon.name;
  const nat = naturalAttackFor(attacker);
  return nat ? nat.name : 'Fists';
}
// We don’t have weapon.damageType on runtime Items, so derive a verb from the name.
// Use attacker + weapon name to decide verb
function verbForAttack(attacker: Actor, weaponName: string): string {
  // Natural?
  const nat = naturalAttackFor(attacker);
  if (nat) return nat.verb;

  // Armed: derive from the weapon name
  const lower = weaponName.toLowerCase();
  if (weaponName === 'Fists') return 'punches';
  if (lower.includes('dagger') || lower.includes('stiletto') || lower.includes('rapier') || lower.includes('tanto')) return 'stabs';
  if (lower.includes('spear') || lower.includes('arrow') || lower.includes('bow') || lower.includes('crossbow') || lower.includes('lance')) return 'pierces';
  if (lower.includes('mace') || lower.includes('club') || lower.includes('hammer') || lower.includes('staff')) return 'smashes';
  return 'slashes';
}

function critPhraseForAttack(attacker: Actor, weaponName: string): string {
  const nat = naturalAttackFor(attacker);
  if (nat) return nat.crit;

  const lower = weaponName.toLowerCase();
  if (lower.includes('sword') || lower.includes('axe') || lower.includes('katana')) return 'Devastating Slash';
  if (lower.includes('dagger') || lower.includes('stiletto') || lower.includes('rapier') || lower.includes('tanto')) return 'Precise Stab';
  if (lower.includes('spear') || lower.includes('lance') || lower.includes('arrow')) return 'Piercing Strike';
  if (lower.includes('mace') || lower.includes('club') || lower.includes('hammer')) return 'Crushing Blow';
  if (lower.includes('staff')) return 'Arcane Strike';
  if (lower.includes('bow') || lower.includes('crossbow')) return 'Perfect Shot';
  return 'Powerful Hit';
}

// Optional weapon-driven accuracy/crit from mods
function weaponAccuracy(attacker: Actor): number {
  return attacker.equipment?.weapon?.mods?.accuracy ?? 0;
}
function weaponCrit(attacker: Actor): number {
  return attacker.equipment?.weapon?.mods?.critPct ?? 0;
}

// Tunables
const BASE_HIT   = 88;  // %
const DEX_DIFF   = 2;   // per point of (attDEX - defDEX)
const LUCK_HIT   = 0.5;
const LEVEL_HIT  = 1.5; // per point of (attLCK - defLCK)
const MIN_HIT    = 60;
const MAX_HIT    = 98;

const BASE_CRIT  = 5;   // %
const LUCK_CRIT  = 1;   // per LCK
const MAX_CRIT   = 50;
const CRIT_MULT  = 1.5;

const GRAZE_WINDOW = 8;
const GRAZE_MULT   = 0.5; 

function rollPct(pct: number): boolean {
  const r = rng.int(1, 100); // inclusive
  return r <= pct;
}

export function computeHitChance(attacker: Actor, defender: Actor): number {
  const dexDelta   = (attacker.base.dex ?? 0) - (defender.base.dex ?? 0);
  const luckDelta  = (attacker.base.luck ?? 0) - (defender.base.luck ?? 0);
  const levelDelta = (attacker.level ?? 1) - (defender.level ?? 1);
  const chance     = BASE_HIT + dexDelta * DEX_DIFF + luckDelta * LUCK_HIT + levelDelta * LEVEL_HIT + weaponAccuracy(attacker);
  return clampN(Math.floor(chance), MIN_HIT, MAX_HIT);
}

export function computeCritChance(attacker: Actor): number {
  const base = BASE_CRIT + (attacker.base.luck ?? 0) * LUCK_CRIT + weaponCrit(attacker);
  return clampN(Math.floor(base), 0, MAX_CRIT);
}

// What the combat loop consumes
export type AttackResult = {
  hit: boolean;
  crit: boolean;
  dmg: number;          // 0 on miss
  verb: string;         // 'slashes'/'stabs'/...
  weaponName: string;   // 'Iron Longsword' or 'Fists'
  logLine: string;      // full log text ready to append
};




export function performAttack(attacker: Actor, defender: Actor): AttackResult {
  const toHit = computeHitChance(attacker, defender);
  const roll = rng.int(1, 100);

  const weaponName = getWeaponName(attacker); // now respects natural weapons
  const nat = naturalAttackFor(attacker);

  if (roll > toHit + GRAZE_WINDOW) {
    const withPart = nat ? '' : ` with ${weaponName}`;
    const logLine = `${attacker.name} misses ${defender.name}${withPart}.`;
    return { hit: false, crit: false, dmg: 0, verb: 'misses', weaponName, logLine };
  }

  const raw       = computeRawPhysicalDamage(attacker);
  const baseAfter = applyMitigationToRaw(raw, defender);
  const nonCrit   = Math.max(1, baseAfter + rng.int(-2, 2));

  if (roll > toHit) {
    const dmg = Math.max(1, Math.floor(nonCrit * GRAZE_MULT));
    const withPart = nat ? '' : ` with ${weaponName}`;
    const logLine = `${attacker.name} grazes ${defender.name}${withPart} for ${dmg} damage.`;
    return { hit: true, crit: false, dmg, verb: 'grazes', weaponName, logLine };
  }

  const isCrit = rollPct(computeCritChance(attacker));
  let dmg = nonCrit;

  if (isCrit) {
    const critRaw   = raw * CRIT_MULT;
    const critBase  = applyMitigationToRaw(critRaw, defender);
    const critFinal = Math.max(2, critBase + rng.int(0, 2));
    dmg = Math.max(critFinal, nonCrit + 1);
  }

  const verb = verbForAttack(attacker, weaponName);

  const logLine = isCrit
    ? (() => {
        const phrase = critPhraseForAttack(attacker, weaponName);
        const lead   = attacker.isPlayer ? 'unleashes' : 'lands';
        const withPart = nat ? '' : ` with ${weaponName}`;
        return `Critical Hit! ${attacker.name} ${lead} a ${phrase} on ${defender.name}${withPart}, dealing ${dmg} damage!`;
      })()
    : (() => {
        const withPart = nat ? '' : ` with ${weaponName}`;
        return `${attacker.name} ${verb} ${defender.name}${withPart} for ${dmg} damage.`;
      })();

  return { hit: true, crit: isCrit, dmg, verb, weaponName, logLine };
}



// --- shared resource helpers (unchanged) ---
export function clampResource(v: number, max: number) {
  return Math.max(0, Math.min(v, max));
}
export function applyDamage(target: Actor, dmg: number) {
  target.hp.current = clampResource(target.hp.current - dmg, target.hp.max);
}
export function applyHeal(target: Actor, amount: number) {
  target.hp.current = clampResource(target.hp.current + amount, target.hp.max);
}
