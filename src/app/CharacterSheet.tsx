import { useGame } from '../state/game.ts';
import type { Item } from '../engine/types';
import { getTotalArmor,  } from '../engine/armor.ts';

export default function CharacterSheet() {
  const { ui, heroes, closeSheet } = useGame();
  const id = ui.selectID ?? heroes[0]?.id;
  const a = heroes.find(h => h.id === id) ?? heroes[0];
  if (!a) return null;

  // Inventory / Equipment helpers (typed)
  const inv = a.inventory ?? [];
  const slots = [
    'weapon','shield','helm','cuirass','gauntlets','boots','greaves','robe',
    'ring1','ring2','amulet','circlet'
  ] as const;
  type Slot = typeof slots[number];
  const eq: Partial<Record<Slot, Item>> = (a.equipment ?? {}) as Partial<Record<Slot, Item>>;
  const armorTotal = getTotalArmor(a);


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

        {/* Armor summary (from base + gear) */}
<div className="panel" style={{ padding: 8, marginBottom: 12 }}>
  <div><b>Total Armor:</b> {armorTotal}</div>
</div>


        {/* Equipment */}
        <h3 style={{ marginTop: 12, marginBottom: 6 }}>Equipment</h3>
        <div className="panel" style={{ marginBottom: 12 }}>
          {slots.map((slot) => {
            const item = eq[slot]; // ✅ no any
            return (
              <div key={slot} style={{ display:'flex', gap:8, alignItems:'center', padding:'4px 0' }}>
                <b style={{ width: 120 }}>{slot.toUpperCase()}</b>
                <span style={{ flex:1, opacity: item ? 1 : .7 }}>
                  {item ? item.name : <i>Empty</i>}
                </span>
                
                {item ? (
                  <button onClick={() => useGame.getState().unequipItem(a.id, slot)}>Unequip</button>
                ) : null}
                
              </div>
            );
          })}
        </div>

        {/* Inventory */}
        <h3 style={{ marginBottom: 6 }}>Inventory</h3>
        <div className="panel">
          {inv.length === 0 ? (
            <i>(Empty)</i>
          ) : (
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {inv.map(it => (
                <li key={it.id} style={{ display:'flex', gap:8, alignItems:'center', padding:'4px 0' }}>
                  <span><b>{it.name}</b></span>
                  <small> ({it.type}{it.slot ? ` • ${it.slot}` : ''})</small>
                  <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                     
                    {it.type === 'potion' ? (
                      <button onClick={() => useGame.getState().useItem(a.id, it.id)}>Use</button>
                    ) : null}
                    {it.slot ? (
                      <button onClick={() => useGame.getState().equipItem(a.id, it.id)}>Equip</button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
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
