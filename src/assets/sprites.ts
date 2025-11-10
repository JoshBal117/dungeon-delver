// src/assets/sprites.ts
import type { Actor } from '../engine/types';

// Ensure the base ends with a trailing slash
const rawBase = (import.meta.env.BASE_URL ?? '/') as string;
const BASE = rawBase.endsWith('/') ? rawBase : rawBase + '/';
const url = (p: string) => BASE + p;

// Central map: spriteId -> relative path under /public
const SPRITES: Record<string, string> = {
  // beasts
  'wolf-black':                          'images/sprites/beasts/wolf-black.png',
  'wolf-gray' :                           'images/sprites/beasts/wolf-gray.png',
  'wolf-brown':                           'images/sprites/beasts/wolf-brown.png', 
  'giant-bat' :                           'images/sprites/beasts/giant-bat.png',

  // goblins / hobs
  'goblin':                 'images/sprites/goblins/goblin.png',
'goblin-club':            'images/sprites/goblins/goblin-club.png',
'goblin-dagger':          'images/sprites/goblins/goblin-dagger.png',
'goblin-bone-dagger':     'images/sprites/goblins/goblin-bone-dagger.png',
'goblin-shortsword':      'images/sprites/goblins/goblin-shortsword.png',
'goblin-warrior':         'images/sprites/goblins/goblin-warrior.png',
'goblin-thief':           'images/sprites/goblins/goblin-thief.png',
'goblin-boss':            'images/sprites/goblins/goblin-boss.png',
'hobgoblin-steel-longsword': 'images/sprites/goblins/hobgoblin-steel-longsword.png',
  // bandits
  'bandit-female-daggers':  'images/sprites/bandits/bandit-female-daggers.png',
'bandit-female-dagger2':  'images/sprites/bandits/bandit-female-dagger2.png',
'bandit-male-dagger':     'images/sprites/bandits/bandit-male-dagger.png',
'bandit-male-shortsword': 'images/sprites/bandits/bandit-male-shortsword.png',
  'bandit-male-loot':              'images/sprites/bandits/bandit-male-loot.png',      // optional, if you plan to use it
  'male-highwayman':               'images/sprites/bandits/male-highwayman.png',       // optional alt

  // orcs
  'orc-longsword':                 'images/sprites/orcs/orc-longsword.png',
  'orc-shortsword':                'images/sprites/orcs/orc-shortsword.png',
  'orc-maul':                      'images/sprites/orcs/orc-maul.png',
  'orc-warrior-mace':              'images/sprites/orcs/orc-warrior-mace.png',

  // slimes
  'blue-slime':                    'images/sprites/slimes/blue-slime.png',
  'green-slime':                   'images/sprites/slimes/green-slime.png',
  'red-slime':                     'images/sprites/slimes/red-slime.png',
};

export function getSpriteFor(a: Actor): string {
  if (a.isPlayer) return url('images/sprites/heroes/knight-male-64x64.png');

  // ---- safe lookup via a narrowed key ----
  const key = a.spriteId as (keyof typeof SPRITES) | undefined;
  if (key && SPRITES[key]) {
    return url(SPRITES[key]);
  }
  const name = a.name?.toLowerCase() ?? '';
  const w = a.equipment?.weapon?.code?.toLowerCase() ?? '';

  // --- Beasts ---
  if (name.includes('wolf')) return url('images/sprites/beasts/wolf.png');
  if (name.includes('bat'))  return url('images/sprites/beasts/giant-bat.png');

  // --- Slimes (color by name) ---
  if (name.includes('slime')) {
    if (name.includes('red'))   return url('images/sprites/slimes/red-slime.png');
    if (name.includes('green')) return url('images/sprites/slimes/green-slime.png');
    if (name.includes('blue'))  return url('images/sprites/slimes/blue-slime.png');
    return url('images/sprites/slimes/green-slime.png'); // neutral fallback
  }

  // --- Orcs (pick by weapon if present) ---
  if (name.includes('orc')) {
    if (w.includes('longsword'))  return url('images/sprites/orcs/orc-longsword.png');
    if (w.includes('shortsword')) return url('images/sprites/orcs/orc-shortsword.png');
    if (w.includes('mace'))       return url('images/sprites/orcs/orc-warrior-mace.png');
    // generic orc if weapon is unknown
    return url('images/sprites/orcs/orc-shortsword.png');
  }

  // --- Bandits / humans ---
  if (name.includes('bandit') || (a.tags?.humanoid && !name.includes('goblin') && !name.includes('orc'))) {
    if (w.includes('shortsword')) return url('images/sprites/bandits/human-bandit-shortsword.png');
    if (w.includes('daggers'))    return url('images/sprites/bandits/human-bandit-daggers.png');
    if (w.includes('dagger'))     return url('images/sprites/bandits/human-bandit-dagger.png');
    return url('images/sprites/bandits/human-bandit-dagger.png');
  }

  // --- Goblins (role + weapon variants you already have) ---
  if (name.includes('goblin')) {
    if (name.includes('boss'))    return url('images/sprites/goblins/goblin-boss.png');
    if (name.includes('warrior')) return url('images/sprites/goblins/goblin-warrior.png');
    if (name.includes('thief'))   return url('images/sprites/goblins/goblin-thief.png');

    if (w.includes('club'))       return url('images/sprites/goblins/goblin-club.png');
    if (w.includes('shortsword')) return url('images/sprites/goblins/goblin-shortsword.png');
    if (w.includes('dagger'))     return url('images/sprites/goblins/goblin-dagger.png');

    return url('images/sprites/goblins/goblin.png');
  }

  // --- Ultimate fallback ---
  return url('images/sprites/goblins/goblin.png');
}
