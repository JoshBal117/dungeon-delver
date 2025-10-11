import { useGame } from '../state/game';
import { CLASSES } from '../state/factories';

export default function TitleScreen() {
  const { startNewRun, newGame} = useGame();
  // hasSave() is a function on the store — call it at render time:
  const canContinue = useGame.getState().hasSave?.() ?? false;

  return (
    <div className="container">
      <h1>Dungeon Delver</h1>

      <div className="panel" style={{ marginBottom: 12 }}>
        <p style={{ marginTop: 0 }}>
          A tactical dungeon RPG prototype. Choose your hero and begin your delve.
        </p>
        <div className="buttons">
          <button onClick={() => startNewRun('knight')}>Start — Knight</button>
          {/* Framework-only buttons for now (disabled until implemented) */}
          <button disabled title="Coming soon">Start — Wizard</button>
          <button disabled title="Coming soon">Start — Thief</button>
          {canContinue ? <button onClick={newGame}>New Game (reset)</button> : null}
        </div>
      </div>

      <div className="grid">
        <ClassCard id="knight" />
        <ClassCard id="mage" disabled />
        <ClassCard id="thief" disabled />
      </div>
    </div>
  );
}

function ClassCard({ id, disabled=false }: { id: keyof typeof CLASSES; disabled?: boolean }) {
  const c = CLASSES[id];
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>{c.name}</h2>
      <p style={{ marginTop: 4, opacity: .9 }}>{c.description}</p>
      <div className="statline">{c.spellcaster ? 'Spellcaster' : 'Martial'}</div>
      <div style={{ marginTop: 8 }}>
        <button disabled={disabled}>Select</button>
      </div>
    </div>
  );
}
