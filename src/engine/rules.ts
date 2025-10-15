// src/engine/rules.ts
import type { Actor } from './types';

// ---- Tunables ----
/**const STR_BONUS_PER_POINT = 0.05; // 5% per STR
const UNARMED_BASE_MIN = 1;
const UNARMED_PER_STR = 0.10;     // +0.10 per STR (floored)
const ARMOR_K = 10;               // bigger => armor stronger
*/
// ---- Functions ----

function totalArmor( a:Actor): number {
  const base = a.base.armor;
  const eq = a.equipment ?? {};
//add armor rating from any equippmed peices
  
 const add =
    (eq.helm?.mods?.armor ?? 0) +
    (eq.cuirass?.mods?.armor ?? 0) +
    (eq.gauntlets?.mods?.armor ?? 0) +
    (eq.greaves?.mods?.armor ?? 0) +
    (eq.boots?.mods?.armor ?? 0) +
    (eq.shield?.mods?.armor ?? 0) +
    (eq.robe?.mods?.armor ?? 0) +
    (eq.circlet?.mods?.armor ?? 0);
    //going to be adding this together  as a possible percentage later
      return Math.max(0, base + add);
}

/**function getWeaponBaseDamage(attacker: Actor): number {
  const w = attacker.equipment?.weapon;
  const weaponDamage = w?.mods?.damage ?? 0;  // ✅ not 00
  return weaponDamage;
} */

/**function applyStrengthMultiplier(weaponDamage: number, strength: number): number {
  const mult = 1 + strength * STR_BONUS_PER_POINT;
  return Math.max(0, weaponDamage * mult);
}*/

/**function unarmedDamage(strength: number): number {
  return Math.max(
    UNARMED_BASE_MIN,
    Math.floor(UNARMED_BASE_MIN + strength * UNARMED_PER_STR)
  );
}

function applyArmorCurve(raw: number, defenderArmor: number): number {
  if (raw <= 0) return 0;
  const factor = 100 / (100 + defenderArmor * ARMOR_K);
  return raw * factor;
}*/

/** Weapon-based damage with STR addtion and smooth armor curve. */
export function dealPhysicalDamage(attacker: Actor, defender: Actor): number {
  // Base damage: weapon or light unarmed fallback
  const weaponBase = attacker.equipment?.weapon?.mods?.damage ?? 2; // unarmed ~= 2

  // Flat STR contribution (gentle early-game scaling)
  const strBonus = attacker.base.str * 0.5; // try 0.4–0.6 to taste

  const raw = weaponBase + strBonus;

  // Softer armor curve (A=0 => 1.0; A=10 => ~0.67; A=20 => 0.5 ...)
  const A = totalArmor(defender);
  const mitigated = raw * (1 - A / (A + 20));

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
