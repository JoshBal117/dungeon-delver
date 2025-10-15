import { useGame } from '../state/game';
import { CLASSES } from '../state/factories';
import type { ClassId } from '../state/factories';

// Which classes can be started
const ALL_CLASSES: ClassId[] = ['knight','mage','thief','cleric'];
const ENABLED_CLASSES: ReadonlyArray<ClassId> = ['knight'];

export default function TitleScreen() {
  const startNewRun  = useGame(s => s.startNewRun);
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
                onClick={() => !disabled && startNewRun(id)}
                disabled={disabled}
                title={disabled ? 'Coming soon!' : undefined}
              >
                {disabled ? `${label} (Coming Soon)` : `Start — ${label}`}
              </button>
            );
          })}
          {/* optional: keep continue/reset here or move to App header */}
          {canContinue ? null : null}
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
      {/* no Select button here — display-only */}
      <ul style={{ marginTop: 8, paddingLeft: 18, opacity: 0.9 }}>
        {id === 'knight' && <li>Starts with an Iron Longsword</li>}
        {id === 'mage'   && <li>Wooden Staff + small mana</li>}
        {id === 'thief'  && <li>Iron Dagger + Lockpicks</li>}
        {id === 'cleric' && <li>Iron Mace + small heal</li>}
        {disabled && id !== 'knight' && <li>Not playable yet</li>}
      </ul>
    </div>
  );
}
