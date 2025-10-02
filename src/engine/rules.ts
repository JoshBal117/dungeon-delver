import type { Actor } from "./types";

export function clampResource( v:number, max :number) {
    return Math.max(0, Math.min(v, max));

}

export function dealPhysicalDamage( attacker: Actor, defender: Actor, base: number) {
    //simple: attack power = base + str; mitigation = armor + defense
    const raw = base + attacker.stats.str;
    const mitigated = Math.max(0, raw - defender.stats.armor);
    return mitigated;
}

export function applyDamage( target: Actor, dmg: number) {
    target.stats.hp.current = clampResource(target.stats.hp.current - dmg, target.stats.hp.max);
}

export function applyHeal(target: Actor, amount: number) {
    target.stats.hp.current = clampResource(target.stats.hp.current + amount, target.stats.hp.max);
}