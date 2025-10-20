import type {Actor, CombatState} from './types'
import type { AIAction } from './types'
import { getTotalArmor } from './armor'

function enemyTeam(state: CombatState, actor: Actor): Actor[] {
    return Object.values(state.actors).filter( a => a.isPlayer !==actor.isPlayer && a.hp.current > 0);

}

// Targeting heuristics (simple, readable, tweakable)
// Strategy: pick lowest HP; tiebreaker = lower armor; final tiebreaker = higher threat-ish (level/STR)
function pickFocusTarget(candidates: Actor[]): Actor | undefined {
  if (candidates.length === 0) return undefined;

  return [...candidates].sort((a, b) => {
    // 1) lowest HP %
    const ahp = a.hp.current / Math.max(1, a.hp.max);
    const bhp = b.hp.current / Math.max(1, b.hp.max);
    if (ahp !== bhp) return ahp - bhp;

    // 2) lowest armor
    const aArm = getTotalArmor(a);
    const bArm = getTotalArmor(b);
    if (aArm !== bArm) return aArm - bArm;

    // 3) "threat" (hit the scarier one last): lower threat first
    const aThreat = (a.level ?? 1) + (a.base.str ?? 0);
    const bThreat = (b.level ?? 1) + (b.base.str ?? 0);
    if (aThreat !== bThreat) return aThreat - bThreat;

    // 4) stable fallback
    return a.id.localeCompare(b.id);
  })[0];
}

// Personality hook: goblins get a small chance to defend if very hurt (placeholder)
// You can extend this with tags (humanoid, goblin, beast, etc.) and behaviors later.
function maybePanicDefend(actor: Actor): boolean {
  const hpPct = actor.hp.current / Math.max(1, actor.hp.max);
  if (hpPct <= 0.20) {
    // 25% chance to defend when under 20% HP
    return Math.random() < 0.25;
  }
  return false;
}

export function decideAction(state: CombatState, actor: Actor): AIAction {
  // For players, the UI should decide; for enemies, use AI
  if (actor.isPlayer) {
    // You *could* return a default 'attack' here, but better to gate by UI.
    // For now, just attack like a simple AI if you want auto-battle behavior:
    const tgt = pickFocusTarget(enemyTeam(state, actor));
    if (!tgt) return { kind: 'defend' };
    return { kind: 'attack', targetId: tgt.id };
  }

  // Enemy AI:
  const enemies = enemyTeam(state, actor);
  const target = pickFocusTarget(enemies);
  if (!target) return { kind: 'defend' };

  // Panic/defend logic (can branch to run, use item, call-help, etc.)
  if (maybePanicDefend(actor)) {
    return { kind: 'defend' };
  }

  // Future: if the goblin gets abilities (Kick Sand, Hamstring, etc.), choose here.
  // Example skeleton:
  // if (hasAbility(actor, 'goblin-kick') && shouldUseKick(actor, target)) {
  //   return { kind: 'ability', abilityCode: 'goblin-kick', targetId: target.id };
  // }

  return { kind: 'attack', targetId: target.id };
}