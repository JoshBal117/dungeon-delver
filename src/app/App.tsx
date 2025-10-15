import { useEffect, useRef } from 'react';
import { useGame } from '../state/game';
import type { Actor, LogEvent } from '../engine/types';
import TitleScreen from './TitleScreen';
import CharacterSheet from './CharacterSheet';

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
          <div className="statline">
            SPD {a.base.speed} | STR {a.base.str} | ARM {a.base.armor}
          </div>
          {a.isPlayer ? <XPBar xp={a.xp} xpToNext={a.xpToNext} /> : null}
        </div>
      ))}
    </div>
  );
}

function XPBar({ xp, xpToNext }: { xp: number; xpToNext: number }) {
  const pct = Math.max(0, Math.min(100, Math.floor((xp / xpToNext) * 100)));
  return (
    <div style={{ width: 160, marginTop: 4 }}>
      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
        XP {xp}/{xpToNext}
      </div>
      <div style={{ height: 8, background: '#222', border: '1px solid #333' }}>
        <div style={{ width: `${pct}%`, height: '100%' }} />
      </div>
    </div>
  );
}
