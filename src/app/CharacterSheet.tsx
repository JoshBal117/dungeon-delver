import { useGame } from '../state/game';


export default function CharacterSheet() {
  const { ui, heroes, closeSheet } = useGame();
  const id = ui.selectID ?? heroes[0]?.id;
  const a = heroes.find(h => h.id === id) ?? heroes[0];

  if (!a) return null;

  return (
    <div className="container">
      <div className="panel" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>{a.name} — Level {a.level}</h2>
        <div className="statline" style={{ marginBottom: 8 }}>
          HP {a.hp.current}/{a.hp.max}
          {a.tags?.spellcaster ? <> | MP {a.mp.current}/{a.mp.max}</> : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Stat label="STR" v={a.base.str} />
          <Stat label="DEX" v={a.base.dex} />
          <Stat label="INT" v={a.base.int} />
          <Stat label="WIS" v={a.base.wis} />
          <Stat label="VIT" v={a.base.vit} />
          <Stat label="SPD" v={a.base.speed} />
          <Stat label="ARM" v={a.base.armor} />
          <Stat label="RES" v={a.base.resist} />
          <Stat label="LCK" v={a.base.luck} />
        </div>

        <div className="buttons">
          <button onClick={closeSheet}>Back</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="panel" style={{ padding: 8 }}>
      <div style={{ fontSize: 12, opacity: .8 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{v}</div>
    </div>
  );
}
