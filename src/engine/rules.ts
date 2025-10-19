// src/engine/rules.ts
import { rng } from './rng';
import type { Actor } from './types';
import { getTotalArmor, computeLinearMitigation } from './armor';

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
  return attacker.equipment?.weapon?.name ?? 'Fists';
}

// We don’t have weapon.damageType on runtime Items, so derive a verb from the name.
function verbFromWeaponName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('dagger') || lower.includes('stiletto') || lower.includes('rapier') || lower.includes('tanto')) return 'stabs';
  if (lower.includes('spear') || lower.includes('arrow') || lower.includes('bow') || lower.includes('crossbow')) return 'pierces';
  if (lower.includes('mace') || lower.includes('club') || lower.includes('hammer') || lower.includes('staff')) return 'smashes';
  // default covers swords/axes/etc.
  return 'slashes';
}

// Optional weapon-driven accuracy/crit from mods
function weaponAccuracy(attacker: Actor): number {
  return attacker.equipment?.weapon?.mods?.accuracy ?? 0;
}
function weaponCrit(attacker: Actor): number {
  return attacker.equipment?.weapon?.mods?.critPct ?? 0;
}

// Tunables
const BASE_HIT   = 75;  // %
const DEX_DIFF   = 3;   // per point of (attDEX - defDEX)
const LUCK_HIT   = 1;   // per point of (attLCK - defLCK)
const MIN_HIT    = 5;
const MAX_HIT    = 98;

const BASE_CRIT  = 5;   // %
const LUCK_CRIT  = 1;   // per LCK
const MAX_CRIT   = 50;
const CRIT_MULT  = 1.5;

function rollPct(pct: number): boolean {
  const r = rng.int(1, 100); // inclusive
  return r <= pct;
}

export function computeHitChance(attacker: Actor, defender: Actor): number {
  const dexDelta  = (attacker.base.dex ?? 0) - (defender.base.dex ?? 0);
  const luckDelta = (attacker.base.luck ?? 0) - (defender.base.luck ?? 0);
  const chance    = BASE_HIT + dexDelta * DEX_DIFF + luckDelta * LUCK_HIT + weaponAccuracy(attacker);
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

function critPhraseForWeapon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('sword') || lower.includes('axe') || lower.includes('katana')) return 'Devastating Slash';
  if (lower.includes('dagger') || lower.includes('stiletto') || lower.includes('rapier') || lower.includes('tanto')) return 'Precise Stab';
  if (lower.includes('spear') || lower.includes('lance') || lower.includes('arrow')) return 'Piercing Strike';
  if (lower.includes('mace') || lower.includes('club') || lower.includes('hammer')) return 'Crushing Blow';
  if (lower.includes('staff')) return 'Arcane Strike';
  if (lower.includes('bow') || lower.includes('crossbow')) return 'Perfect Shot';
  return 'Powerful Hit';
}


export function performAttack(attacker: Actor, defender: Actor): AttackResult {
  // 1) to-hit gate
  const toHit = computeHitChance(attacker, defender);
  if (!rollPct(toHit)) {
    const weaponName = getWeaponName(attacker);
    const logLine = `${attacker.name} misses ${defender.name}${weaponName === 'Fists' ? '' : ` with ${weaponName}`}.`;
    return { hit: false, crit: false, dmg: 0, verb: 'misses', weaponName, logLine };
  }

  // 2) baseline damage (non-crit)
  const raw          = computeRawPhysicalDamage(attacker);
  const nonCritBase  = applyMitigationToRaw(raw, defender);
  const nonCritFinal = Math.max(1, nonCritBase + rng.int(-2, 2)); // −2..+2 variance

  // 3) crit roll and crit branch (multiply BEFORE mitigation)
  const isCrit = rollPct(computeCritChance(attacker));
  let dmg      = nonCritFinal;

  if (isCrit) {
    const critRaw   = raw * CRIT_MULT;
    const critBase  = applyMitigationToRaw(critRaw, defender);
    const critFinal = Math.max(2, critBase + rng.int(0, 2)); // non-negative variance for crits
    dmg = Math.max(critFinal, nonCritFinal + 1);             // ensure crit > non-crit
  }

  // 4) narration, after we know crit + dmg
  const weaponName = getWeaponName(attacker);
  const verb       = verbFromWeaponName(weaponName);

  // Optional: debug
  // console.log('[HIT]', { atk: attacker.name, def: defender.name, isCrit, nonCritFinal, final: dmg });

  let logLine: string;
  if (isCrit) {
    const phrase = critPhraseForWeapon(weaponName);
    const lead   = attacker.isPlayer ? 'unleashes' : 'lands';
    logLine = `Critical Hit! ${attacker.name} ${lead} a ${phrase} on ${defender.name} with ${weaponName}, dealing ${dmg} damage!`;
  } else {
    logLine = `${attacker.name} ${verb} ${defender.name} with ${weaponName} for ${dmg} damage.`;
  }

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
