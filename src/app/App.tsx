import { useEffect, useRef } from 'react';
import { useGame } from '../state/game';
import type { Actor, LogEvent } from '../engine/types';
import TitleScreen from './TitleScreen';
import CharacterSheet from './CharacterSheet';
import {getSpriteFor} from '../assets/sprites';






export default function App() {
  const { ui, combat, attack, startNewCombat, setHeroes, newGame, goToTitle, openSheet } = useGame();
  const savedRef = useRef(false);

  // --- tiny global header ---
  const Header = () => (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', padding: '8px 12px',
      background: '#111', borderBottom: '1px solid #222'
    }}>
      <div style={{ fontWeight: 700 }}>Dungeon Delver</div>
      <div className="buttons" style={{ gap: 8 }}>
        <button onClick={goToTitle}>Title</button>
        <button
          title="Clear save and start a fresh run"
          onClick={() => { localStorage.removeItem('dd:save'); newGame(); }}
        >
          Reset Save
        </button>
      </div>
    </div>
  );

  // Persist hero progression after a victorious battle
  useEffect(() => {
    if (!combat) return;
    if (!combat.over) { savedRef.current = false; return; }

    const partyAlive = Object.values(combat.actors).some(a => a.isPlayer && a.hp.current > 0);
    if (!partyAlive) return; // don't save on defeat

    if (!savedRef.current) {
      const heroes = Object.values(combat.actors).filter(a => a.isPlayer);
      setHeroes(heroes); // writes to persisted slice via zustand persist
      savedRef.current = true;
    }
  }, [combat, setHeroes, startNewCombat]);

  // --- UI routing ---
  if (ui.screen === 'title') {
    return (
      <>
        <Header />
        <TitleScreen />
      </>
    );
  }

  if (ui.screen === 'sheet') {
    return (
      <>
        <Header />
        <CharacterSheet />
      </>
    );
  }

  if (!combat) {
    return (
      <>
        <Header />
        <div className="container">Loading…</div>
      </>
    );
  }

  const actors: Actor[] = Object.values(combat.actors);
  const players = actors.filter(a => a.isPlayer);
  const foes = actors.filter(a => !a.isPlayer);

  return (
    <>
      <Header />
      <div className="container">
        <h1>Dungeon Delver — Prototype</h1>

        <section className="grid" style={{ marginBottom: 16 }}>
          <Party title="Heroes" list={players} />
          <Party title="Foes" list={foes} />
        </section>

         {/* 🆕 Battlefield sprites go here */}
      <div
        className="battlefield"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          alignItems: 'end',
          minHeight: 220,
          padding: 16,
          marginBottom: 16,
          background: 'linear-gradient(#1a1d22, #0f1115)',
          border: '1px solid #23262b',
          borderRadius: 8,
        }}
      >
        {/* Player side (left) */}
        <div style={{ display: 'flex', alignItems: 'end', height: 200 }}>
          {players[0] && (
            <img
              src={getSpriteFor(players[0])}
              alt={players[0].name}
              width={128}
              height={128}
              style={{ imageRendering: 'pixelated' }}
            />
          )}
        </div>

        {/* Enemy side (right) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'end', height: 200 }}>
          {foes.map((f) => (
            <img
              key={f.id}
              src={getSpriteFor(f)}
              alt={f.name}
              width={96}
              height={96}
              style={{
                imageRendering: 'pixelated',
                filter: f.hp.current <= 0 ? 'grayscale(100%) opacity(55%)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

        <div className="buttons">
          <button onClick={attack} disabled={combat.over}>Attack</button>
          <button onClick={startNewCombat}>New Battle</button>
          {/* Removed in-body "New Game" — it's now in the header as Reset Save */}
          {players[0] && <button onClick={() => openSheet(players[0].id)}>Character</button>}
          {combat.over && <span style={{ marginLeft: 8, color: '#9cf' }}>Battle over</span>}
        </div>

        <div className="log">
          {combat.log.map((l: LogEvent, i) => (
            <div key={i} style={{ fontFamily: 'monospace' }}>{l.text}</div>
          ))}
        </div>
      </div>
    </>
  );
}

function Party({ title, list }: { title: string; list: Actor[] }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      {list.map(a => (
        <div key={a.id} style={{ marginBottom: 10 }}>
          <strong>{a.name}</strong>{' '}
          <span>Lv {a.level}</span>{' '}
          <span>HP {a.hp.current}/{a.hp.max}</span>{' '}
          {a.tags?.spellcaster ? <span> | MP {a.mp.current}/{a.mp.max}</span> : null}
          {a.isPlayer ? <XPBar xp={a.xp} xpToNext={a.xpToNext} /> : null}
        </div>
      ))}
    </div>
  );
}

function XPBar({ xp, xpToNext }: { xp: number; xpToNext: number }) {
  // guard against divide-by-zero and clamp to [0,100]
  const denom = Math.max(1, xpToNext);
  const pct = Math.max(0, Math.min(100, Math.floor((xp / denom) * 100)));

  return (
    <div style={{ width: 160, marginTop: 4 }}>
      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
        XP {xp}/{xpToNext}
      </div>
      <div style={{
        height: 8,
        background: '#222',
        border: '1px solid #333',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: '#24c24a',          // ✅ green fill
          transition: 'width 250ms linear'
        }} />
      </div>
    </div>
  );
}

