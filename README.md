⚔️ Dungeon Delver — v0.4a Development Phase

A browser-based tactical RPG inspired by Shining Force, Darkest Dungeon, and Final Fantasy Tactics.
Built with React + TypeScript + Zustand, it began as a small learning project and has evolved into a persistent, data-driven RPG prototype guided by one rule:

Every strike should feel earned.

🧠 Concept

You play as a Knight, the first of many planned classes, delving through dungeons, forests, and catacombs where every fight is a puzzle of timing, luck, and preparation.
Combat is fast, readable, and strategic — designed to make every attack, block, and decision matter.

🎮 Current Features (v0.4a — AI Integration Stable)
🧠 Monster Intelligence

Enemies now act on their own initiative using a new AI engine.
Each monster evaluates its turn through decideAction(), choosing when to attack, defend, or later use abilities — no more waiting for manual input.

⏳ Asynchronous Turn Flow

The combat loop now alternates naturally between player and AI turns with built-in pacing.
After your attack, enemies respond automatically after a short delay (3 seconds by default), creating rhythm and tension.

🧮 Enhanced Turn Order

Combat initiative now resolves based on Speed, with Dexterity breaking ties — the fastest fighter truly acts first.

🧾 Dynamic Combat Log

The log now shows complete event narration:

“Critical Hit! Goblin deals a crushing blow to Knight for 9 damage.”

This system scales with weapon type and context to make each turn feel alive.

🎒 Inventory & Equipment

Weapons, shields, and armor each contribute modifiers to attack, armor, and resist stats.
All items use unique runtime IDs to ensure safe persistence and deduplication between sessions.

💾 Persistent Progress

Game state and characters are stored locally with Zustand + localStorage. You can close your browser and return to the same battle later.

⚙️ Damage & Defense

Strength-based damage scaling with random variance.

Smooth armor mitigation curve for consistent survivability.

Critical hits deal devastating damage (2× to 3× base by weapon type).

Evasion, hit chance, and luck modifiers are under development.

🧩 Upcoming Focus (v0.4 Roadmap — Knight Phase II)
Phase	Feature	Description	Status
0.4a	🧠 Enemy AI & Turn Flow	Goblins and monsters now act automatically through initiative-based AI.	🟢 Complete
0.4b	⚔️ Ability System	Implement Knight abilities (Slash, Power Strike, Shield Bash) and monster skills.	🟡 In progress
0.4c	🛡 Armor & Resist Scaling	Add elemental resistances and improved defense calculations.	⚪ Planned
0.4d	🎯 Hit / Miss / Crit Logic	Introduce full accuracy rolls, evasion checks, and critical multipliers.	⚪ Planned
0.4e	🧟 Monster Expansion	Wolves, bats, and elite goblins with unique attack patterns.	⚪ Planned
0.5+	🧙 Class Expansion	Add Mage, Thief, Cleric, Barbarian, Samurai, etc.	🔴 Deferred
🧰 Tech Stack
Layer	Library / Framework
Frontend	React + TypeScript
State Management	Zustand (Persistent Store)
Build Tool	Vite
Styling	Custom CSS (mobile-first)
Deployment	GitHub Pages (CI/CD)
🧪 Local Development
git clone https://github.com/JoshBal117/dungeon-delver.git
cd dungeon-delver
npm install
npm run dev


Runs locally at http://localhost:5173

🧱 File Structure
src/
├── app/               # UI and screen management
│   ├── App.tsx
│   ├── TitleScreen.tsx
│   └── CharacterSheet.tsx
│
├── engine/            # Core combat logic
│   ├── combat.ts      # Turn loop, AI, and delay pacing
│   ├── rules.ts       # Damage, crits, and hit calculations
│   ├── ai.ts          # Monster AI decision-making
│   ├── item-index.ts  # Item creation + unique IDs
│   ├── types.ts
│   └── rng.ts
│
├── state/             # Global Zustand store
│   ├── game.ts        # Async turn handling, persistence
│   └── factories.ts
│
└── data/              # Item and entity definitions
    ├── items.ts
    └── types.ts

🧱 Design Goals

Keep combat fast and readable — every log entry tells a story.

Use data-driven architecture — every weapon, armor, and monster is defined in data files.

Build a robust Knight foundation before introducing multi-class balance.

Ensure persistence stability through consistent UUID and inventory cleanup.

🧑‍💻 Developer Notes

Goblins are now controlled by AI — they select targets, roll attacks, and act in initiative order.

stepUntilPlayerAsync() governs AI pacing and simulates “thinking time.”

Future updates will tie delay speed to the enemy’s Speed stat for natural variety.

Next milestone: Player and enemy ability systems, starting with Shield Bash, Slash, and Power Strike.

📜 Changelog
v0.4a — “Mind of the Goblin” (Current)

Added full AI-controlled enemy turns.

Implemented async pacing with stepUntilPlayerAsync().

Added initiative order based on Speed/Dexterity.

Cleaned up TypeScript promise mismatches and async store handling.

Set groundwork for future ability and action trees.

AI system expanded-
🧠 AI System Overview (v0.4a)
🎯 Core Behavior: decideAction(state, actor)

The new AI system provides autonomous behavior for monsters. Each creature, starting with the Goblin, uses a lightweight decision function to determine its move every turn.

Action Types:
The AI can return one of several ActionKinds:

attack: Choose a living enemy target (usually the player).

defend: Skip turn but gain minor future mitigation (placeholder).

use-item: Reserved for healing or buff items (planned).

ability: Placeholder for special skills once implemented.

Target Selection Logic:
At present, Goblins always prioritize living player characters.
In future patches, enemies will:

Focus the lowest-HP or lowest-defense target.

Switch based on type (e.g., archers prefer unarmored foes).

Evaluate elemental vulnerabilities and positioning.

AI Flow in Combat:
Every non-player actor follows the same flow:

decideAction() → performAttack() → applyDamage() → logResult()


Each step updates the CombatState log, displaying the action in real time.

⏳ Timing and Pacing: stepUntilPlayerAsync()

This asynchronous helper controls the rhythm of combat.

Each AI action is delayed by a configurable interval (default: 3000 ms).

The delay mimics “thinking time,” keeping the battle readable and dramatic.

After all enemies finish their turns, control automatically returns to the player.

Future versions will compute delay dynamically using:

delayMs = clamp(3500 - (speed * 200), 1200, 3500)


So faster enemies will strike more quickly, while slower ones hesitate.

🧩 Modular Expansion

The AI layer is intentionally modular:

New monsters (wolves, bats, etc.) can plug into the same system by providing unique decideAction branches.

Bosses can override base behavior entirely, adding scripted patterns or conditional phases.

Once abilities are implemented, decideAction() will weigh cooldowns, MP cost, and current HP before selecting an optimal move.

🧾 Design Philosophy

“Even a simple enemy should feel alive.”

Rather than raw randomness, the AI uses predictable priorities with subtle variance.
Players should learn behaviors — not guess them. When a Goblin suddenly decides to defend instead of attack, it’s because conditions changed, not luck.

v0.3a — “Steel and Potion”

Added potion usage in and out of combat with persistence.

Implemented item ID deduplication system.

Added Goblin gear randomization and 40% potion drop chance.

Rebalanced Knight’s early STR scaling.

v0.2b — “Persistence and Progression”

Added Zustand persistent store and XP leveling.

Enabled battle restart and save/load continuity.

Fixed early duplication and registry bugs.

v0.1a — “Prototype Combat Demo”

Basic Knight vs Goblin loop.

RNG-based attack variance.

Early UI prototype for battle flow.

📜 License

This project is licensed under the MIT License — see the LICENSE file for details.

Developed by Joshua Balao

“The dungeon remembers your steps — whether you return stronger or weaker is up to you"