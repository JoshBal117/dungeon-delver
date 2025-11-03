// src/app/StartScreen.tsx
import { useEffect } from 'react';
import { useGame } from '../state/game';

export default function StartScreen() {
  // ✅ call the hook
  const { goToClassSelect } = useGame();

  // ✅ hooks must be inside the component
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        goToClassSelect();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToClassSelect]);

  // ✅ return JSX from the component
  return (
    <div className="container" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          padding: 24,
          border: '1px solid #23262b',
          borderRadius: 12,
          background: 'linear-gradient(#121418, #0c0e12)', // fixed color
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 12, fontSize: 28 }}>Dungeon Delver — v0.4a.b</h1>

        <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
          Welcome to my prototype game called Dungeon Delver. Here in this beginning game, you will help me test and provide feedback about the current features. This is a turn based combat system, it also incorperates a hit/miss chance mechanic as well as a Critical Hit chance as well. The enemies you face will automatically attack after your own attack, and if the enemy is faster than your character, they will go first.
        </p>

        <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
          What you are testing now: the basic combat flow as you take turns with the simple battle mechanics, and you will see the damage logs, and the newly added battle sprites. The class selector currently offers the <strong>Knight</strong> only. Press <strong>Start</strong> to choose your hero and begin. More features will arrive with future updates.
        </p>

        <div
          style={{
            margin: '18px 0',
            padding: 12,
            background: '#0e1318',
            border: '1px dashed #2a2f37',
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          Roadmap: more enemy types and gear, abilities for heroes/monsters, multi-enemy skirmishes, Magic system and characters who use magic as well as several more characters to play as; and an actual dungeon crawl loop, and the first story reveal.
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
          <button onClick={goToClassSelect} style={{ padding: '10px 18px', fontSize: 16 }}>
            Start — Game
          </button>
          <span style={{ alignSelf: 'center', opacity: 0.75 }}>(Press Enter)</span>
        </div>
      </div>
    </div>
  );
}
