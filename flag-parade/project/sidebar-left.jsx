// Left sidebar — Plaza controls

const { useState: useStateL, useEffect: useEffectL } = React;

function SidebarLeft() {
  const store = window.paradeStore;
  const [, setTick] = useStateL(0);
  useEffectL(() => store.subscribe(() => setTick((x) => x + 1)), []);
  const s = store.get();
  const p = s.plaza;

  return (
    <div className="sidebar left">
      <div className="sidebar-header">
        <div className="sidebar-title"><span className="accent-dot" />Plaza</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>Director</span>
      </div>
      <div className="sidebar-body">

        <div className="section">
          <div className="section-label">Ground</div>
          <div className="chip-row">
            {['grid', 'tile', 'marble', 'void'].map((g) => (
              <button key={g} className={`chip ${p.ground === g ? 'active' : ''}`}
                onClick={() => store.setPlaza({ ground: g })}>{g}</button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-label">Shape & Size</div>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            {['square', 'round'].map((sh) => (
              <button key={sh} className={`chip ${p.shape === sh ? 'active' : ''}`}
                onClick={() => store.setPlaza({ shape: sh })}>{sh}</button>
            ))}
          </div>
          <div className="chip-row">
            {['small', 'medium', 'large'].map((sz) => (
              <button key={sz} className={`chip ${p.size === sz ? 'active' : ''}`}
                onClick={() => store.setPlaza({ size: sz })}>{sz}</button>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-label">Mood</div>
          <div className="chip-row">
            {[
              ['night', 'Night'],
              ['golden', 'Golden'],
              ['day', 'Day'],
              ['spot', 'Spotlit'],
            ].map(([k, v]) => (
              <button key={k} className={`chip ${p.mood === k ? 'active' : ''}`}
                onClick={() => store.setPlaza({ mood: k })}>{v}</button>
            ))}
          </div>
          <div style={{ height: 10 }} />
          <div className="row">
            <label>Ambient</label>
            <input type="range" className="slider" min="0" max="1" step="0.02" value={p.ambient}
              onChange={(e) => store.setPlaza({ ambient: parseFloat(e.target.value) })} />
            <span className="value">{p.ambient.toFixed(2)}</span>
          </div>
          <div className="row">
            <label>Formation spotlight</label>
            <input type="checkbox" checked={p.spotlight} onChange={(e) => store.setPlaza({ spotlight: e.target.checked })} />
          </div>
          <div className="row">
            <label>Spot / accent color</label>
            <div className="color-input">
              <input type="color" value={p.accentColor} onChange={(e) => store.setPlaza({ accentColor: e.target.value })} />
              <span>{p.accentColor}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-label">Wind</div>
          <WindDial dir={p.wind.dir} onChange={(d) => store.setPlaza({ wind: { dir: d } })} />
          <div className="row" style={{ marginTop: 10 }}>
            <label>Strength</label>
            <input type="range" className="slider" min="0" max="1.3" step="0.02" value={p.wind.strength}
              onChange={(e) => store.setPlaza({ wind: { strength: parseFloat(e.target.value) } })} />
            <span className="value">{p.wind.strength.toFixed(2)}</span>
          </div>
        </div>

        <div className="section">
          <div className="section-label">Bearers</div>
          <div className="row">
            <label>Uniform color</label>
            <div className="color-input">
              <input type="color" value={p.bearerColor} onChange={(e) => store.setPlaza({ bearerColor: e.target.value })} />
              <span>{p.bearerColor}</span>
            </div>
          </div>
          <div className="swatch-row" style={{ marginTop: 6 }}>
            {['#1a2030', '#2b1e18', '#5a5248', '#1c2b1c', '#331a2a', '#ece6d5'].map((c) => (
              <div key={c} className={`swatch ${p.bearerColor === c ? 'active' : ''}`} style={{ background: c }}
                onClick={() => store.setPlaza({ bearerColor: c })} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function WindDial({ dir, onChange }) {
  const ref = React.useRef(null);
  const start = (e) => {
    const move = (ev) => {
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI;
      onChange((a + 360) % 360);
    };
    move(e);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  const rad = dir * Math.PI / 180;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        ref={ref}
        onMouseDown={start}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '1px solid var(--line-strong)',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.03), transparent 70%)',
          position: 'relative', cursor: 'grab',
        }}
      >
        <svg viewBox="-32 -32 64 64" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="0" x2={Math.cos(rad) * 22} y2={Math.sin(rad) * 22}
            stroke="var(--accent)" strokeWidth="1.5" />
          <polygon points={`${Math.cos(rad) * 26},${Math.sin(rad) * 26} ${Math.cos(rad + 2.7) * 20},${Math.sin(rad + 2.7) * 20} ${Math.cos(rad - 2.7) * 20},${Math.sin(rad - 2.7) * 20}`}
            fill="var(--accent)" />
          <circle cx="0" cy="0" r="2" fill="var(--ink-dim)" />
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>
        <div style={{ color: 'var(--ink)' }}>{Math.round(dir)}°</div>
        <div>wind dir</div>
      </div>
    </div>
  );
}

window.SidebarLeft = SidebarLeft;
