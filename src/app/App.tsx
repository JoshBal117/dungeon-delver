import { useEffect, useRef } from 'react';
import { useGame } from '../state/game';
import type { Actor, LogEvent } from '../engine/types';
import TitleScreen from './TitleScreen';
import CharacterSheet from './CharacterSheet';
import {getSpriteFor} from '../assets/sprites';
import StartScreen from './StartScreen.tsx';



function ItemsOverlay() {
  // Alias useItem -> doUseItem to avoid react-hooks/rules-of-hooks false positive
  const { ui, heroes, useItem: doUseItem, closeActionMenu } = useGame();
  const hero = heroes[0];
  if (ui.battleMenu !== 'items') return null;

  const items = (hero?.inventory ?? []).filter(it =>
    it.type === 'potion' || it.consumable || it.onUse || it.mods?.heal
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
      onClick={closeActionMenu}
    >
      <div
        className="panel"
        style={{ minWidth: 320, padding: 16, border: '1px solid #23262b', borderRadius: 10, background: '#0f1115' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong>Use an Item</strong>
          <button onClick={closeActionMenu} aria-label="Close">✕</button>
        </div>

        {(!items || items.length === 0) ? (
          <div style={{ marginBottom: 12, opacity: 0.85 }}>No usable items.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 260, overflowY: 'auto' }}>
            {items.map(it => {
              const heal = it.mods?.heal ??
                (it.onUse && typeof it.onUse === 'string' && /(\d+)/.exec(it.onUse)?.[1] ? Number(/(\d+)/.exec(it.onUse)![1]) : undefined);
              const subtitle = typeof heal === 'number' ? `Heals ${heal} HP` : (it.onUse ? String(it.onUse) : '');

              return (
                <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    {/* No it.description access — avoids TS error */}
                    {subtitle ? <div style={{ fontSize: 12, opacity: 0.8 }}>{subtitle}</div> : null}
                  </div>
                  <button
                    onClick={async () => {
                      // Call the aliased function, not something named `useItem`
                      await doUseItem(hero.id, it.id);
                    }}
                  >
                    Use
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={closeActionMenu}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ResourceBar({
  label,
  current,
  max,
  color,
  width = 160,
}: {label: string; current: number; max: number; color: string; width?: number }) {
  const denom = Math.max(1, max ?? 0);
  const pct = Math.max(0, Math.min(100, Math.floor((current / denom ) *100)));
  return (
    <div style={{ width, marginTop: 4 }}>
      <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 2 }}>
        {label} {current}/{max}
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
          background: color,
          transition: 'width 250ms linear'
        }} />
      </div>
    </div>
  );
}

export default function App() {
  const { ui, combat, attack, startNewCombat, setHeroes, newGame, goToTitle, openSheet, openActionMenu, closeActionMenu, openItemsMenu, openAbilitiesMenu, defend, useAbility:performAbility } = useGame();
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
    // NEW start/intro screen
 if ( ui.screen === 'start') {
    return (
      <>
        <Header />
        <StartScreen />
      </>
    );
 } 

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
              style={{ imageRendering: 'pixelated', width: 'clamp(72px, 28 vw, 128 px)', height: 'auto'}}
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
                width: 'clamp(56px, 22vw, 96px',
                height: 'auto',
                filter: f.hp.current <= 0 ? 'grayscale(100%) opacity(55%)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

       {/* Controls row: left = Action/Inventory, right = Next Encounter */}
<div className="buttons" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  {/* Left group */}
  <div style={{ display: 'flex', gap: 8 }}>
    {/* Action opens submenu */}
    <button onClick={openActionMenu} disabled={combat.over}>Action</button>
    {/* Inventory (renamed from Character for now; still uses your sheet) */}
    {players[0] && <button onClick={() => openSheet(players[0].id)}>Inventory</button>}
  </div>

  {/* Right group */}
  <div style={{ display: 'flex', gap: 8 }}>
    <button onClick={startNewCombat}>Next Encounter</button>
    {combat.over && <span style={{ color: '#9cf', alignSelf: 'center' }}>Battle over</span>}
  </div>
</div>

{/* Submenu overlay/panel when open */}
{ui.battleMenu && ui.battleMenu !== 'closed' && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'grid',
      placeItems: 'center',
      zIndex: 20
    }}
    onClick={closeActionMenu}
  >
    <div
  className="panel w-responsive"
  style={{ padding: 16, border: '1px solid #23262b', borderRadius: 10, background: '#0f1115', maxWidth: 520, maxHeight: '80dvh', overflow: 'auto' }}
  onClick={e => e.stopPropagation()}
>

      {/* Header with close X */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong>Choose Action</strong>
        <button onClick={closeActionMenu} aria-label="Close">✕</button>
      </div>
      <ItemsOverlay/>
      {/* Root level */}
      {ui.battleMenu === 'root' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={attack}>Attack</button>
          <button onClick={openAbilitiesMenu}>Abilities</button>
          <button onClick={defend}>Defend</button>
          <button onClick={openItemsMenu}>Use Item</button>
          <button onClick={closeActionMenu}>Back</button>
        </div>
      )}

{players[0] && <button onClick={() => { closeActionMenu(); openSheet(players[0].id); }}>Use Item</button>}

      {/* Abilities submenu */}
      
 
      {ui.battleMenu === 'abilities' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ opacity: 0.85 }}>Abilities:</div>
          <button onClick={() => performAbility('power_slash_lv1')}>Power Slash (2 SP)</button>
          <button onClick={() => performAbility('shield_bash_lv1')}>Shield Bash (2 SP)</button>
          <button onClick={() => performAbility('parry_lv1')}>Parry (15%)</button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={() => setHeroes([...useGame.getState().heroes]) /* noop to please TS */} style={{ display: 'none' }} />
            <button onClick={closeActionMenu}>Close</button>
            <button onClick={openActionMenu}>Back</button>
          </div>
        </div>
      )}
    </div>
  </div>
)}


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
      {list.map(a => {
        const showSP = !!a.sp && a.sp.max > 0;
        const showMP = !!a.mp && a.mp.max > 0 && (a.tags?.spellcaster ?? false);
        return (
          <div key={a.id} style={{ marginBottom: 12 }}>
            <strong>{a.name}</strong>{' '}
            <span>Lv {a.level}</span>
            {/* Inline snapshot numbers stay (quick scan), bars below */}
            

            {/* Bars */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <ResourceBar label="HP" current={a.hp.current} max={a.hp.max} color="#c0392b" />
              {showSP && <ResourceBar label="SP" current={a.sp!.current} max={a.sp!.max} color="#2ecc71" />}
              {showMP && <ResourceBar label="MP" current={a.mp!.current} max={a.mp!.max} color="#2980b9" />}
              {a.isPlayer ? <XPBar xp={a.xp} xpToNext={a.xpToNext} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function XPBar({ xp, xpToNext }: { xp: number; xpToNext: number }) {
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
        {/* Gold fill */}
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: '#d4af37',
          transition: 'width 250ms linear'
        }} />
      </div>
    </div>
  );
}


