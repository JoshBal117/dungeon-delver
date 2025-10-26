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
        <h1 style={{ marginTop: 0, marginBottom: 12, fontSize: 28 }}>Dungeon Delver — v0.4a.a</h1>

        <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
          A tiny tactical RPG prototype. Battles are turn-based with visible math: hit/miss, armor
          mitigation, and crits. Enemies act automatically in initiative order. If a foe is faster than
          you, they may take the first swing.
        </p>

        <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
          What to test now: basic combat flow, damage logs, and the new battle sprites. The class
          selector currently offers the <strong>Knight</strong> only. Press <strong>Start</strong> to
          choose your hero and begin. More features will arrive with future updates.
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
          Roadmap: more enemy types and gear, abilities for heroes/monsters, multi-enemy skirmishes,
          an actual dungeon crawl loop, and the first story reveal.
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
          <button onClick={goToClassSelect} style={{ padding: '10px 18px', fontSize: 16 }}>
            Start — Knight
          </button>
          <span style={{ alignSelf: 'center', opacity: 0.75 }}>(Press Enter)</span>
        </div>
      </div>
    </div>
  );
}
