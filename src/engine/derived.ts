import type { Actor } from './attributes';


export function computeHpMax(c: Actor): number {
    // Base rule for the character's max HP by default: eact level add floor(VIT/2) + 10
    // Example: level 1 = 10, plus per-level growth
    //  as more classes/characters are added they will have different starting healths and different growth rates
    if (!c.isPlayer) return c.hp.max; //monsters have fixed health for now
    const baseAtL1 = 10;
    const perLevelGain = Math.floor(c.base.vit / 2) + 2;
    const fromLevels = perLevelGain * (c.level - 1);
    const gear = c.gear.hpMax ?? 0;
    return baseAtL1 + fromLevels + gear;
}


export function computeMpMax(c: Actor): number {
    //this wil only display and grow if character has Spellcaster tag
    const gear = c.gear.mpMax ?? 0;
    if (!c.tags.spellcaster) return gear;
    const baseAtL1 = 0;
    const perLevelGain = Math.floor(c.base.int / 2); //simple early rules
    const fromLevels = perLevelGain * (c.level - 1);
    return baseAtL1 + fromLevels + gear;
}

export function visibleResource( c: Actor) {
    return {
        hp: c.hp,
        mp: c.tags.spellcaster ? c.mp : undefined,

    };
}