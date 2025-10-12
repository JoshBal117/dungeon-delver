import { useGame } from '../state/game';
import { CLASSES } from '../state/factories';
import type { ClassId } from '../state/factories';


// Single source of truth for lists
const ALL_CLASSES = Object.keys(CLASSES) as ClassId[];
const ENABLED_CLASSES: readonly ClassId[] = ['knight']; // add 'mage' later, etc.

export default function TitleScreen() {
  const { startNewRun, newGame } = useGame();
  const canContinue = useGame.getState().hasSave?.() ?? false;

  return (
    <div className="container">
      <h1>Dungeon Delver</h1>

      <div className="panel" style={{ marginBottom: 12 }}>
        <p style={{ marginTop: 0 }}>Choose your hero and begin your delve.</p>

        <div className="buttons">
          {ALL_CLASSES.map((id) => {
            const disabled = !ENABLED_CLASSES.includes(id);
            const label = CLASSES[id].name;
            return (
              <button
                key={id}
                onClick={() => !disabled && startNewRun(id)} // id is ClassId here
                disabled={disabled}
                title={disabled ? 'Coming soon!' : undefined}
              >
                {disabled ? `${label} (Coming Soon)` : `Start — ${label}`}
              </button>
            );
          })}

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

function ClassCard({ id }: { id: ClassId }) {
  const c = CLASSES[id];
  const disabled = !ENABLED_CLASSES.includes(id);
  return (
    <div className="panel" style={{ opacity: disabled ? 0.6 : 1 }}>
      <h2 style={{ marginTop: 0 }}>{c.name}</h2>
      <p style={{ marginTop: 4, opacity: .9 }}>{c.description}</p>
      <div className="statline">{c.spellcaster ? 'Spellcaster' : 'Martial'}</div>
      <div style={{ marginTop: 8 }}>
        <button
          onClick={() => !disabled && useGame.getState().startNewRun(id)}
          disabled={disabled}
          title={disabled ? 'Coming soon!' : undefined}
        >
          Select
        </button>
      </div>
    </div>
  );
}
