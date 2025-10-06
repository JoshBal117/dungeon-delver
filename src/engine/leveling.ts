import type { Actor } from './attributes';
import { computeHpMax, computeMpMax } from './derived';
import { d4 } from './dice';

export type LevelingMode = 'd4_per_attribute' | 'controlled_knight';

export type LevelingConfig = {
  mode: LevelingMode;

  // Optional tweaks per mode
  hpPerLevelFromVit?: (vit: number) => number; // default: floor(vit/2)
  mpPerLevelFromInt?: (int: number, isCaster: boolean) => number; // default: floor(int/2) if caster
};

export const DefaultLeveling: LevelingConfig = {
  mode: 'd4_per_attribute',
  hpPerLevelFromVit: (vit) => Math.floor(vit / 2),
  mpPerLevelFromInt: (int, isCaster) => isCaster ? Math.floor(int / 2) : 0,
};

// Call after adding XP; may level multiple times.
export function tryLevelUp(c: Actor, cfg = DefaultLeveling): string[] {
  const log: string[] = [];
  while (c.xp >= c.xpToNext) {
    c.xp -= c.xpToNext;
    c.level += 1;
    c.xpToNext = xpToNextLevel(c.level);

    const gains = applyLevelGains(c, cfg);
    log.push(`Leveled up to ${c.level}!`, ...gains);

    // Recompute pools from new stats/level and heal to full (early design choice)
    const newHpMax = computeHpMax(c);
    const newMpMax = computeMpMax(c);
    c.hp = { current: newHpMax, max: newHpMax };
    c.mp = { current: newMpMax, max: newMpMax };
  }
  return log;
}

// Gentle quadratic: 100, 200, 350, 525, ...
export function xpToNextLevel(level: number): number {
  return Math.floor(25 * level * level + 75 * level);
}

function applyLevelGains(c: Actor, cfg: LevelingConfig): string[] {
  const msgs: string[] = [];

  if (cfg.mode === 'd4_per_attribute') {
    // Roll 1d4 for each attribute; early-playtest spicy mode
    const old = { ...c.base };
    c.base.str += d4();
    c.base.dex += d4();
    c.base.int += d4();
    c.base.wis += d4();
    c.base.vit += d4();
    c.base.speed += d4();
    //c.base.armor += d4();  // if you prefer armor from gear only, comment this
    c.base.resist += d4();
    c.base.luck += d4();

    msgs.push(
      `STR ${old.str}→${c.base.str}`,
      `DEX ${old.dex}→${c.base.dex}`,
      `INT ${old.int}→${c.base.int}`,
      `WIS ${old.wis}→${c.base.wis}`,
      `VIT ${old.vit}→${c.base.vit}`,
      `SPD ${old.speed}→${c.base.speed}`,
      `RES ${old.resist}→${c.base.resist}`,
      `LCK ${old.luck}→${c.base.luck}`,
    );
    return msgs;
  }

  // Example “controlled_knight” mode: steady with small spice
  if (cfg.mode === 'controlled_knight') {
    const old = { ...c.base };
    // HP is handled by computeHpMax from VIT, but we still increase VIT a bit:
    c.base.vit += 1;                    // steady vitality
    c.base.str += 1 + (Math.random() < 0.25 ? 1 : 0); // +1 or +2 (25% chance)
    if (Math.random() < 0.15) c.base.dex += 1;        // rare dex bump
    if (c.level % 4 === 0) c.base.speed += 1;         // milestone speed
    if (Math.random() < 0.10) c.base.luck += 1;        // tiny luck nudge

    msgs.push(
      ...(c.base.vit !== old.vit ? [`VIT ${old.vit}→${c.base.vit}`] : []),
      ...(c.base.str !== old.str ? [`STR ${old.str}→${c.base.str}`] : []),
      ...(c.base.dex !== old.dex ? [`DEX ${old.dex}→${c.base.dex}`] : []),
  
      ...(c.base.luck !== old.luck ? [`LCK ${old.luck}→${c.base.luck}`] : []),
    );
    return msgs;
  }

  return msgs;
}