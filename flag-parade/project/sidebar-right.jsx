// Right sidebar — editor for the currently selected formation.

const { useState: useStateR, useEffect: useEffectR, useRef: useRefR } = React;

function SidebarRight() {
  const store = window.paradeStore;
  const [, setTick] = useStateR(0);
  useEffectR(() => store.subscribe(() => setTick((x) => x + 1)), []);
  const s = store.get();
  const f = s.timeline.formations.find((x) => x.id === s.selectedId);

  if (!f) {
    return (
      <div className="sidebar right empty">
        <div className="sidebar-header">
          <div className="sidebar-title"><span className="accent-dot" />Formation</div>
        </div>
        <div className="empty-state">
          <div className="title">No formation selected</div>
          <div>Click a block in the timeline to edit its shape, count, flags, path, and tempo.</div>
        </div>
      </div>
    );
  }

  const patch = (p) => store.updateFormation(f.id, p);

  return (
    <div className="sidebar right">
      <div className="sidebar-header">
        <div className="sidebar-title"><span className="accent-dot" />Formation</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>{f.action.toUpperCase()}</span>
      </div>
      <div className="sidebar-body">

        <div className="section">
          <input
            type="text"
            value={f.name}
            onChange={(e) => patch({ name: e.target.value })}
            style={{ width: '100%', fontFamily: 'var(--font-serif)', fontSize: 18, background: 'transparent', border: 'none', color: 'var(--ink)', padding: 0, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>
            <span>{f.count} bearers</span>
            <span>·</span>
            <span>{f.duration.toFixed(1)}s</span>
            <span>·</span>
            <span>t={f.start.toFixed(1)}s</span>
          </div>
        </div>

        <div className="section">
          <div className="section-label">Shape</div>
          <div className="shape-grid">
            {Object.entries(window.FORMATIONS).map(([k, v]) => (
              <div key={k} className={`shape-tile ${f.shape === k ? 'active' : ''}`}
                onClick={() => patch({ shape: k })} title={v.name}>
                <window.ShapeIcon kind={v.icon} size={30} />
              </div>
            ))}
          </div>
        </div>

        {f.shape === 'custom' && (
          <div className="section">
            <div className="section-label">Draw custom <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', textTransform: 'none' }}>click to add · right-click to remove</span></div>
            <CustomShapeEditor
              points={f._customPoints || []}
              onChange={(pts) => patch({ _customPoints: pts })}
            />
          </div>
        )}

        <div className="section">
          <div className="section-label">Count</div>
          <div className="row">
            <input type="range" className="slider" min="4" max="200" step="1" value={f.count}
              onChange={(e) => patch({ count: parseInt(e.target.value) })} />
            <span className="value">{f.count}</span>
          </div>
          <div className="section-label" style={{ marginTop: 14 }}>Spacing & rotation</div>
          <div className="row">
            <label>Spacing</label>
            <input type="range" className="slider" min="1" max="4" step="0.05" value={f.spacing}
              onChange={(e) => patch({ spacing: parseFloat(e.target.value) })} />
            <span className="value">{f.spacing.toFixed(2)}</span>
          </div>
          <div className="row">
            <label>Rotation</label>
            <input type="range" className="slider" min="-180" max="180" step="1" value={f.rotation}
              onChange={(e) => patch({ rotation: parseInt(e.target.value) })} />
            <span className="value">{f.rotation}°</span>
          </div>
          <div className="row">
            <label>Tempo</label>
            <input type="range" className="slider" min="0.4" max="2" step="0.05" value={f.tempo}
              onChange={(e) => patch({ tempo: parseFloat(e.target.value) })} />
            <span className="value">{f.tempo.toFixed(2)}×</span>
          </div>
        </div>

        <div className="section">
          <div className="section-label">Flag pattern</div>
          <div className="chip-row">
            {['solid', 'horizontal', 'vertical', 'diagonal', 'circle', 'cross'].map((p) => (
              <button key={p} className={`chip ${f.flag.pattern === p ? 'active' : ''}`}
                onClick={() => patch({ flag: { pattern: p } })}>{p}</button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <label>Primary</label>
            <div className="color-input">
              <input type="color" value={f.flag.primary}
                onChange={(e) => patch({ flag: { primary: e.target.value } })} />
              <span>{f.flag.primary}</span>
            </div>
          </div>
          <div className="row">
            <label>Secondary</label>
            <div className="color-input">
              <input type="color" value={f.flag.secondary}
                onChange={(e) => patch({ flag: { secondary: e.target.value } })} />
              <span>{f.flag.secondary}</span>
            </div>
          </div>
          <div className="swatch-row" style={{ marginTop: 6 }}>
            {[
              ['#b83434', '#ece6d5'],
              ['#2a4c7a', '#e6b34a'],
              ['#1c1c1c', '#d4c5a0'],
              ['#6b2e4a', '#ece6d5'],
              ['#3e5a8a', '#ffffff'],
              ['#0a3d2f', '#e6b34a'],
            ].map(([a, b], i) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: 5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)` }}
                onClick={() => patch({ flag: { primary: a, secondary: b } })} />
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-label">Position</div>
          <div className="row">
            <label>Center X</label>
            <input type="range" className="slider" min="-20" max="20" step="0.5" value={f.center.x}
              onChange={(e) => store.updateFormation(f.id, { center: { ...f.center, x: parseFloat(e.target.value) } })} />
            <span className="value">{f.center.x.toFixed(1)}</span>
          </div>
          <div className="row">
            <label>Center Z</label>
            <input type="range" className="slider" min="-20" max="20" step="0.5" value={f.center.z}
              onChange={(e) => store.updateFormation(f.id, { center: { ...f.center, z: parseFloat(e.target.value) } })} />
            <span className="value">{f.center.z.toFixed(1)}</span>
          </div>
        </div>

        {f.action === 'walk' && (
          <div className="section">
            <div className="section-label">Path <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)', textTransform: 'none' }}>click to add waypoint</span></div>
            <PathEditor
              path={f.path || [{ x: f.center.x, z: f.center.z }]}
              onChange={(path) => patch({ path })}
            />
          </div>
        )}

        {f.action === 'transform' && (
          <div className="section">
            <div className="section-label">Transform target</div>
            <div className="shape-grid">
              {Object.entries(window.FORMATIONS).filter(([k]) => k !== 'custom').map(([k, v]) => (
                <div key={k} className={`shape-tile ${f.transformTo === k ? 'active' : ''}`}
                  onClick={() => patch({ transformTo: k })} title={v.name}>
                  <window.ShapeIcon kind={v.icon} size={28} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-label">Action</div>
          <div className="chip-row">
            {['hold', 'walk', 'transform', 'split', 'merge'].map((a) => (
              <button key={a} className={`chip ${f.action === a ? 'active' : ''}`}
                onClick={() => {
                  if (a === 'split') {
                    store.splitFormation(f.id);
                  } else {
                    patch({ action: a });
                    if (a === 'walk' && !f.path) patch({ path: [{ x: f.center.x, z: f.center.z }, { x: f.center.x + 6, z: f.center.z }] });
                    if (a === 'transform' && !f.transformTo) patch({ transformTo: 'circle' });
                  }
                }}>{a}</button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function CustomShapeEditor({ points, onChange }) {
  const ref = useRefR(null);
  const onClick = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onChange([...points, { x, y }]);
  };
  const onContext = (e) => {
    e.preventDefault();
    if (points.length === 0) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    // remove nearest
    let best = 0, bd = Infinity;
    points.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    onChange(points.filter((_, i) => i !== best));
  };
  return (
    <div className="shape-editor" ref={ref} onClick={onClick} onContextMenu={onContext}>
      <div className="grid-bg" />
      {points.length === 0 && <div className="hint">click to place points</div>}
      {points.map((p, i) => (
        <div key={i} className="dot" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />
      ))}
    </div>
  );
}

function PathEditor({ path, onChange }) {
  const ref = useRefR(null);
  const onClick = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    // Map [0..1] → [-20..20]
    const x = (px - 0.5) * 40;
    const z = (py - 0.5) * 40;
    onChange([...path, { x, z }]);
  };
  const toPct = (v) => ((v + 20) / 40) * 100;
  return (
    <div className="path-editor" ref={ref} onClick={onClick}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="pgrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0 H0 V10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#pgrid)" />
        <path d={path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toPct(p.x)} ${toPct(p.z)}`).join(' ')}
          fill="none" stroke="var(--accent)" strokeWidth="0.7" strokeDasharray="1.5 1" />
        {path.map((p, i) => (
          <g key={i}>
            <circle cx={toPct(p.x)} cy={toPct(p.z)} r="1.5" fill={i === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.8)'} />
            <text x={toPct(p.x) + 2} y={toPct(p.z) - 2} fill="var(--ink-faint)" fontSize="3" fontFamily="var(--font-mono)">{i}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

window.SidebarRight = SidebarRight;
