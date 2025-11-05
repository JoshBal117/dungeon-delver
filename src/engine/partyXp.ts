import type { Actor } from './types';
import { tryLevelUp } from './leveling';
import { computeHpMax, computeMpMax } from './derived';
import { rng } from './rng';

// --- small helpers ---
type LooseTags = Record<string, unknown>;
const hasTrue = (a: Actor, key: 'boss' | 'miniboss'): boolean => {
  const v = (a.tags as LooseTags | undefined)?.[key];
  return v === true || (typeof v === 'number' && v > 0);
};
const isBossLike = (e: Actor) => hasTrue(e, 'boss') || hasTrue(e, 'miniboss');
const rint = (lo: number, hi: number) => rng.int(lo, hi);

// Base XP at equal level by family (easy to extend later)
function baseXpForEnemy(enemy: Actor): number {
  // simple table; expand later if you like
  const n = enemy.name.toLowerCase();
  switch (n) {
    case 'goblin':
    case 'goblin warrior':
    case 'goblin thief':
      return 10;  // equal-level base
    case 'wolf':
    case 'giant bat':
      return 10;
    default:
      return 10;
  }
}

// Level-delta table, per your spec
function xpDeltaBucket(enemyLevel: number, heroLevel: number): number {
  return enemyLevel - heroLevel; // positive => enemy is higher
}

function xpFromEnemyForHero(enemy: Actor, hero: Actor): number {
  // Boss/miniboss
  if (isBossLike(enemy)) {
    return rint(100, 200);
  }

  const base = baseXpForEnemy(enemy);
  const d = xpDeltaBucket(enemy.level ?? 1, hero.level ?? 1);

  if (d >= 3) return rint(40, 60);  // enemy +3
  if (d === 2) return rint(30, 45); // enemy +2
  if (d === 1) return rint(20, 30); // enemy +1
  if (d === 0) return base;         // equal → 10

  // Diminishing returns for weaker foes
  // hero higher by 1..3 → taper from ~8..6..4
  if (d === -1) return rint(8, 10);
  if (d === -2) return rint(6, 8);
  if (d === -3) return rint(4, 6);

  // hero higher by 4+ → 2..3 XP (your example at L5 vs L1)
  return rint(2, 3);
}

// Award XP and handle level-ups
export function awardXPFromFoes(heroes: Actor[], foes: Actor[]): string[] {
  const log: string[] = [];

  for (const hero of heroes) {
    if (hero.hp.current <= 0) continue;

    const totalXP = foes.reduce((sum, foe) => sum + xpFromEnemyForHero(foe, hero), 0);

    hero.xp += totalXP;
    log.push(`${hero.name} gained ${totalXP} XP (${hero.xp}/${hero.xpToNext})`);

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
