import type { Actor } from './types';

export function clampResource(v: number, max: number) {
  return Math.max(0, Math.min(v, max));
}

export function dealPhysicalDamage(attacker: Actor, defender: Actor, base: number) {
  // Simple MVP: raw = base + STR; mitigation = armor
  const raw = base + attacker.base.str;
  const mitigated = Math.max(0, raw - defender.base.armor);
  return mitigated;
}

export function applyDamage(target: Actor, dmg: number) {
  target.hp.current = clampResource(target.hp.current - dmg, target.hp.max);
}

export function applyHeal(target: Actor, amount: number) {
  target.hp.current = clampResource(target.hp.current + amount, target.hp.max);
}
