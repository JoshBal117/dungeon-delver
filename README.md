⚔️ Dungeon Delver — v0.3 Development Phase

A browser-based tactical RPG inspired by Shining Force, Darkest Dungeon, and Final Fantasy Tactics.
Built with React + TypeScript + Zustand, it began as a small learning project and has evolved into a functional, persistent RPG prototype centered on one guiding principle: every strike matters.

🧠 Concept

You play as a Knight, the first of many planned classes, fighting through increasingly difficult dungeon skirmishes.
Combat is fast, readable, and strategic — your equipment, luck, and timing determine survival.

🎮 Current Features (v0.2 Prototype Stable)

⚔️ Knight Class (Playable) — Balanced martial hero with scaling stats and XP leveling.

🧮 Turn-Based Combat — Initiative-based turns with variance and armor mitigation.

🎒 Inventory & Equipment

Weapons define basePower and scaling with Strength.

Items use runtime-unique UUIDs to prevent duplication.

dedupeInventory() keeps inventories clean and conflict-free.

💾 Persistent Progress — Save/load through Zustand + localStorage.

🧾 Battle Logs + Character Sheets — Real-time combat feedback and stat inspection.

🎁 Loot Drops — 40% chance for goblins to drop a Lesser Healing Potion.

⚙️ Damage Formula — Strength-based scaling with a smooth armor reduction curve.

🧩 Upcoming Focus (v0.3 Roadmap — Knight Phase)
Phase	Feature	Description	Status
0.3a	🎯 Enemy AI Turns	Goblins and other enemies take their own turns automatically after the player attacks.	🟡 In progress
0.3b	🛡 Armor System	Implement armor slots (helm, cuirass, boots, etc.) and defense bonuses for both Knight and enemies.	⚪ Planned
0.3c	💥 Hit / Miss / Crit System	Introduce accuracy checks, evasion, and critical hit multipliers.	⚪ Planned
0.3d	🧟 Expanded Enemy Roster	Add wolves, bats, and other low-level foes to diversify Knight battles.	⚪ Planned
0.3e	👑 Boss Battles	One-on-one and multi-round boss encounters with unique stats and loot.	⚪ Planned
0.4+	🧙 Additional Classes	Mage, Thief, Cleric, Barbarian, Samurai, etc.	🔴 Deferred
🧰 Tech Stack
Layer	Library / Framework
Frontend	React + TypeScript
State Management	Zustand (persistent store)
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
│   ├── combat.ts      # Turn loop, AI, and loot
│   ├── rules.ts       # Damage, hit chance, and crit math
│   ├── item-index.ts  # Item creation + unique IDs
│   ├── types.ts
│   └── rng.ts
│
├── state/             # Global Zustand store
│   ├── game.ts
│   └── factories.ts
│
└── data/              # Item and entity definitions
    ├── items.ts
    └── types.ts

🧱 Design Goals

Keep combat fast — short animations, visible math, clean UI.

Use data-driven architecture — every weapon, armor, and monster lives in data files.

Make the Knight experience airtight before adding new classes.

Maintain persistent progression between runs to test systems early.

🧑‍💻 Developer Notes

Goblin AI will be the first autonomous opponent using initiative order.

Armor will split between Martial (Knight, Thief, Cleric, Paladin, etc.) and Caster (Mage, Warlock, Bard, Necromancer).

Hit/miss will use speed and luck differentials; crits scale with dexterity or luck.

Once stable, the Knight branch will expand into multi-enemy battles and boss duels.

Developed by Joshua Balao
"The dungeon remembers your steps — whether you return stronger or weaker is up to you."