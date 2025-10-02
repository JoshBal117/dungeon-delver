import { useGame } from '../state/game';

export default function App() {
  const { combat, attack, reset } = useGame();
  const hero = combat.actors['hero'];
  const gob = combat.actors['gob'];

  return (

  
    <div style={{ maxWidth: 720, margin: '2rem auto', fontFamily: 'systemm-ui. sans-serif' }}>
      <h1>Dungeon Delver - MVP</h1>

      <div style={{ display: 'flex', gap: 16 }}>
      <Card title={hero.name} hp={`${hero.stats.hp.current}/${hero.stats.hp.max}`} />
        <Card title={gob.name}  hp={`${gob.stats.hp.current}/${gob.stats.hp.max}`} />
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={attack} disabled={combat.over} style={{ padding: '0.6rem 1rem' }}>Attack</button>
        <button onClick={reset} style={{ marginLeft: 8, padding: '0.6rem 1rem' }}>Reset</button>
      </div>

      <pre style={{ marginTop: 16, background: '#111', color: '#0f0', padding: 12, height: 200, overflow: 'auto' }}>
        {combat.log.map((l,i)=> `[${i}] ${l.text}`).join('\n')}
      </pre>
      {combat.over && <p><strong>Battle Over.</strong></p>}
    </div>
  );
}

function Card ({title, hp}: {title: string; hp: string}) {
  return(
    <div style={{ border: '1px solid #ddd', padding: 12, flex: 1}}>
      <h3>{title}</h3>
      <div>HP: {hp}</div>
    </div>
  );
}