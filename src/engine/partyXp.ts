import type { Actor } from './types';
import { tryLevelUp } from './leveling';
import { computeHpMax, computeMpMax } from './derived';

// 1️⃣ Define the base XP for an enemy type
function baseXpForEnemy(enemy: Actor): number {
    switch (enemy.name) {
        case 'Goblin':   return 10;
        default: return 5;
    }
  // For now, all Goblins give 10 XP when equal level

}

// 2️⃣ Apply scaling — higher-level heroes get less XP
function xpFromEnemyForHero(enemy: Actor, hero: Actor): number {
  const base = baseXpForEnemy(enemy);
  const delta = hero.level - enemy.level;            // positive if hero is higher
  const scaled = Math.floor(base * Math.pow(0.85, Math.max(0, delta)));
  return Math.max(1, scaled);                        // floor at 1 XP minimum
}

// 3️⃣ Award XP to each living hero, and trigger level-ups
export function awardXPFromFoes(heroes: Actor[], foes: Actor[]): string[] {
  const log: string[] = [];

  for (const hero of heroes) {
    if (hero.hp.current <= 0) continue;               // KO'd heroes get none (for now)

    const totalXP = foes.reduce(
      (sum, foe) => sum + xpFromEnemyForHero(foe, hero),
      0
    );

    hero.xp += totalXP;
    log.push(`${hero.name} gained ${totalXP} XP (${hero.xp}/${hero.xpToNext})`);

    // Level up if thresholds crossed
    const ups = tryLevelUp(hero);
    if (ups.length) {
      const hpMax = computeHpMax(hero);
      const mpMax = computeMpMax(hero);
      hero.hp = { current: hpMax, max: hpMax };
      hero.mp = { current: mpMax, max: mpMax };
      log.push(...ups);
    }
  }

  return log;
}
