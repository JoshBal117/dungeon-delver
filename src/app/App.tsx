import { useGame } from '../state/game';
import type { Actor, LogEvent } from '../engine/types';
import { useEffect, useRef } from 'react';

export default function App() {
  const { combat, attack, resetCombat, startNewCombat, setHeroes, newGame } = useGame();
  const savedRef = useRef(false);

  useEffect(() => {
    if (!combat) return;
    if (!combat.over) { savedRef.current = false; return; }

    const partyAlive = Object.values(combat.actors).some(a => a.isPlayer && a.hp.current > 0);
    if (!partyAlive) return; // don't save on defeat

    if (!savedRef.current) {
      const heroes = Object.values(combat.actors).filter(a => a.isPlayer);
      setHeroes(heroes);             //  writes to persisted slice via zustand persist
      savedRef.current = true;
    }

    // OPTIONAL: auto-queue next battle so you can grind XP quickly
    // setTimeout(() => startNewCombat(), 400);
  }, [combat, setHeroes, startNewCombat])

  if (!combat) return <div style={{ color: '#eee', padding: 16 }}>Loading…</div>;

  const actors: Actor[] = Object.values(combat.actors);
  const players = actors.filter(a => a.isPlayer);
  const foes = actors.filter(a => !a.isPlayer);

  return (
    <div style={{ color: '#eee', background: '#111', minHeight: '100vh', fontFamily: 'system-ui', padding: 16 }}>
      <h1>Dungeon Delver — Prototype</h1>

      <section style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
        <Party title="Heroes" list={players} />
        <Party title="Foes" list={foes} />
      </section>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
  <button onClick={attack} disabled={combat.over}>Attack</button>
  <button onClick={resetCombat}>Reset</button>
  <button onClick={startNewCombat}>New Battle</button>
  <button onClick={newGame}>New Game (Level 1)</button>
  {combat.over && <span style={{ marginLeft: 8, color: '#9cf' }}>Battle over</span>}
</div>

      <div style={{ background: '#000', border: '1px solid #333', padding: 12, height: 220, overflowY: 'auto' }}>
        {combat.log.map((l: LogEvent, i: number) => (
          <div key={i} style={{ fontFamily: 'monospace' }}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}

function Party({ title, list }: { title: string; list: Actor[] }) {
  return (
    <div>
      <h2 style={{ margin: '4px 0 8px' }}>{title}</h2>
      {list.map(a => (
        <div key={a.id} style={{ marginBottom: 6 }}>
          <strong>{a.name}</strong>{' '}
          <span>Lv {a.level}</span>{' '}
          <span>HP {a.hp.current}/{a.hp.max}</span>{' '}
          {/* MP only if spellcaster */}
          {a.tags?.spellcaster ? <span> | MP {a.mp.current}/{a.mp.max}</span> : null}
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            SPD {a.base.speed} | STR {a.base.str} | ARM {a.base.armor}
          </div>
          {a.isPlayer ? <XPBar xp={a.xp} xpToNext={a.xpToNext} /> : null}
        </div>
      ))}
    </div>
  );
}

function XPBar({ xp, xpToNext }: { xp:number; xpToNext: number}) {
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
