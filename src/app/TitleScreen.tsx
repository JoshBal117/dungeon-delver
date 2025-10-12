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
        <p style={{ marginTop: 0 }}>Choose your hero and begin your delve.</p>
        <div className="buttons">
          <button onClick={() => startNewRun('knight')}>Start — Knight</button>
          <button onClick={() => startNewRun('mage')}>Start — Mage</button>
          <button onClick={() => startNewRun('thief')}>Start — Thief</button>
          <button onClick={() => startNewRun('cleric')}>Start — Cleric</button>
          {canContinue ? <button onClick={newGame}>New Game (reset)</button> : null}
        </div>
      </div>

      <div className="grid">
        <ClassCard id="knight" />
        <ClassCard id="mage" />
        <ClassCard id="thief" />
        <ClassCard id="cleric" />
      </div>
    </div>
  );
}

function ClassCard({ id }: { id: keyof typeof CLASSES }) {
  const c = CLASSES[id];
  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}>{c.name}</h2>
      <p style={{ marginTop: 4, opacity: .9 }}>{c.description}</p>
      <div className="statline">{c.spellcaster ? 'Spellcaster' : 'Martial'}</div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => useGame.getState().startNewRun(id)}>Select</button>
      </div>
    </div>
  );
}