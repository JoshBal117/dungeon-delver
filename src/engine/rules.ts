// src/engine/rules.ts
import type { Actor } from './types';

// ---- Tunables ----
const STR_BONUS_PER_POINT = 0.05; // 5% per STR
const UNARMED_BASE_MIN = 1;
const UNARMED_PER_STR = 0.10;     // +0.10 per STR (floored)
const ARMOR_K = 10;               // bigger => armor stronger

function getWeaponBaseDamage(attacker: Actor): number {
  const w = attacker.equipment?.weapon;
  const weaponDamage = w?.mods?.damage ?? 0;  // ✅ not 00
  return weaponDamage;
}

function applyStrengthMultiplier(weaponDamage: number, strength: number): number {
  const mult = 1 + strength * STR_BONUS_PER_POINT;
  return Math.max(0, weaponDamage * mult);
}

function unarmedDamage(strength: number): number {
  return Math.max(
    UNARMED_BASE_MIN,
    Math.floor(UNARMED_BASE_MIN + strength * UNARMED_PER_STR)
  );
}

function applyArmorCurve(raw: number, defenderArmor: number): number {
  if (raw <= 0) return 0;
  const factor = 100 / (100 + defenderArmor * ARMOR_K);
  return raw * factor;
}

/** Weapon-based damage with STR multiplier and smooth armor curve. */
export function dealPhysicalDamage(attacker: Actor, defender: Actor): number {
  const baseWeapon = getWeaponBaseDamage(attacker);

  let raw = 0;
  if (baseWeapon > 0) {
    raw = applyStrengthMultiplier(baseWeapon, attacker.base.str);
  } else {
    raw = unarmedDamage(attacker.base.str);
  }

  const mitigated = applyArmorCurve(raw, defender.base.armor);
  return Math.max(1, Math.floor(mitigated));
}



export function clampResource(v: number, max: number) {
  return Math.max(0, Math.min(v, max));
}



export function applyDamage(target: Actor, dmg: number) {
  target.hp.current = clampResource(target.hp.current - dmg, target.hp.max);
}

export function applyHeal(target: Actor, amount: number) {
  target.hp.current = clampResource(target.hp.current + amount, target.hp.max);
}
