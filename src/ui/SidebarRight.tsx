import { useRef } from 'react';
import { useParadeStore } from '../store/useParadeStore';
import { PRESETS } from '../formations/presets';
import ShapeIcon from './ShapeIcon';
import CustomShapeEditor from './CustomShapeEditor';
import type { FlagPattern, FormationShape } from '../store/types';
import type { PresetKey } from '../formations/presets';

const PATTERNS: FlagPattern[] = [
  'solid', 'horizontal', 'vertical', 'diagonal', 'circle', 'cross', 'border',
];

const FLAG_SWATCHES: [string, string][] = [
  ['#b83434', '#ece6d5'],
  ['#2a4c7a', '#e6b34a'],
  ['#1c1c1c', '#d4c5a0'],
  ['#6b2e4a', '#ece6d5'],
  ['#3e5a8a', '#ffffff'],
  ['#0a3d2f', '#e6b34a'],
];

const ACTIONS = ['hold', 'walk', 'transform', 'split', 'merge'] as const;

function PathEditor({
  path,
  onChange,
}: {
  path: { x: number; z: number }[];
  onChange: (p: { x: number; z: number }[]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const toPct = (v: number) => ((v + 20) / 40) * 100;

  const handleClick = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    onChange([...path, { x: (px - 0.5) * 40, z: (py - 0.5) * 40 }]);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (path.length <= 1) return;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const cx = (px - 0.5) * 40;
    const cz = (py - 0.5) * 40;
    let best = 1, bd = Infinity;
    path.slice(1).forEach((p, i) => {
      const d = (p.x - cx) ** 2 + (p.z - cz) ** 2;
      if (d < bd) { bd = d; best = i + 1; }
    });
    onChange(path.filter((_, i) => i !== best));
  };

  return (
    <div className="path-editor" ref={ref} onClick={handleClick} onContextMenu={handleContextMenu}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="pgrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0 H0 V10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#pgrid)" />
        <path
          d={path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toPct(p.x)} ${toPct(p.z)}`).join(' ')}
          fill="none" stroke="var(--accent)" strokeWidth="0.7" strokeDasharray="1.5 1"
        />
        {path.map((p, i) => (
          <g key={i}>
            <circle cx={toPct(p.x)} cy={toPct(p.z)} r="1.5"
              fill={i === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.8)'} />
            <text x={toPct(p.x) + 2} y={toPct(p.z) - 2}
              fill="var(--ink-faint)" fontSize="3" fontFamily="var(--font-mono)">
              {i}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function SidebarRight() {
  const formations      = useParadeStore(s => s.timeline.formations);
  const selectedId      = useParadeStore(s => s.selectedId);
  const updateFormation = useParadeStore(s => s.updateFormation);
  const splitFormation  = useParadeStore(s => s.splitFormation);

  const f = formations.find(x => x.id === selectedId);

  if (!f) {
    return (
      <div className="sidebar right empty">
        <div className="sidebar-header">
          <div className="sidebar-title"><span className="accent-dot" />Formation</div>
        </div>
        <div className="empty-state">
          <div className="title">No selection</div>
          <div>Click a timeline block to edit its shape, count, flags, and path.</div>
        </div>
      </div>
    );
  }

  const patch = (p: Parameters<typeof updateFormation>[1]) => updateFormation(f.id, p);

  return (
    <div className="sidebar right">
      <div className="sidebar-header">
        <div className="sidebar-title"><span className="accent-dot" />Formation</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>
          {f.action.toUpperCase()}
        </span>
      </div>
      <div className="sidebar-body">

        {/* Name + metadata */}
        <div className="section">
          <input
            type="text"
            value={f.name}
            onChange={e => patch({ name: e.target.value })}
            style={{
              width: '100%', fontFamily: 'var(--font-serif)', fontSize: 18,
              background: 'transparent', border: 'none', color: 'var(--ink)',
              padding: 0, outline: 'none',
            }}
          />
          <div style={{
            display: 'flex', gap: 8, marginTop: 4,
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)',
          }}>
            <span>{f.count} bearers</span>
            <span>·</span>
            <span>{f.duration.toFixed(1)}s</span>
            <span>·</span>
            <span>t={f.start.toFixed(1)}s</span>
          </div>
        </div>

        {/* Shape grid */}
        <div className="section">
          <div className="section-label">Shape</div>
          <div className="shape-grid">
            {PRESETS.filter(p => p.key !== 'custom').map(p => (
              <div key={p.key}
                className={`shape-tile${f.shape === p.key ? ' active' : ''}`}
                onClick={() => patch({ shape: p.key as FormationShape })}
                title={p.label}
              >
                <ShapeIcon kind={p.key} size={30} stroke="currentColor" />
              </div>
            ))}
          </div>
        </div>

        {/* Custom shape editor */}
        {f.shape === 'custom' && (
          <div className="section">
            <CustomShapeEditor
              points={f.customPoints ?? []}
              onChange={pts => patch({ customPoints: pts })}
            />
          </div>
        )}

        {/* Count / Spacing / Rotation / Tempo */}
        <div className="section">
          <div className="section-label">Count</div>
          <div className="row">
            <input type="range" className="slider" min={10} max={500} step={10}
              value={f.count}
              onChange={e => patch({ count: Number(e.target.value) })} />
            <span className="value">{f.count}</span>
          </div>
          <div className="section-label" style={{ marginTop: 14 }}>Layout</div>
          <div className="row">
            <label>Spacing</label>
            <input type="range" className="slider" min={0.8} max={4.0} step={0.1}
              value={f.spacing}
              onChange={e => patch({ spacing: Number(e.target.value) })} />
            <span className="value">{f.spacing.toFixed(1)}m</span>
          </div>
          <div className="row">
            <label>Rotation</label>
            <input type="range" className="slider" min={-180} max={180} step={1}
              value={f.rotation}
              onChange={e => patch({ rotation: Number(e.target.value) })} />
            <span className="value">{f.rotation}°</span>
          </div>
          <div className="row">
            <label>Tempo</label>
            <input type="range" className="slider" min={0.4} max={2.0} step={0.05}
              value={f.tempo}
              onChange={e => patch({ tempo: Number(e.target.value) })} />
            <span className="value">{f.tempo.toFixed(2)}×</span>
          </div>
        </div>

        {/* Flag pattern + colors */}
        <div className="section">
          <div className="section-label">Flag pattern</div>
          <div className="chip-row">
            {PATTERNS.map(p => (
              <button key={p}
                className={`chip${f.flag.pattern === p ? ' active' : ''}`}
                onClick={() => patch({ flag: { ...f.flag, pattern: p } })}>
                {p}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <label>Primary</label>
            <div className="color-input">
              <input type="color" value={f.flag.primary}
                onChange={e => patch({ flag: { ...f.flag, primary: e.target.value } })} />
              <span>{f.flag.primary}</span>
            </div>
          </div>
          <div className="row">
            <label>Secondary</label>
            <div className="color-input">
              <input type="color" value={f.flag.secondary}
                onChange={e => patch({ flag: { ...f.flag, secondary: e.target.value } })} />
              <span>{f.flag.secondary}</span>
            </div>
          </div>
          <div className="swatch-row" style={{ marginTop: 6 }}>
            {FLAG_SWATCHES.map(([a, b], i) => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: 5, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.15)',
                background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)`,
              }} onClick={() => patch({ flag: { ...f.flag, primary: a, secondary: b } })} />
            ))}
          </div>
        </div>

        {/* Position */}
        <div className="section">
          <div className="section-label">Position</div>
          <div className="row">
            <label>Center X</label>
            <input type="range" className="slider" min={-20} max={20} step={0.5}
              value={f.center.x}
              onChange={e => patch({ center: { ...f.center, x: Number(e.target.value) } })} />
            <span className="value">{f.center.x.toFixed(1)}</span>
          </div>
          <div className="row">
            <label>Center Z</label>
            <input type="range" className="slider" min={-20} max={20} step={0.5}
              value={f.center.z}
              onChange={e => patch({ center: { ...f.center, z: Number(e.target.value) } })} />
            <span className="value">{f.center.z.toFixed(1)}</span>
          </div>
        </div>

        {/* Action */}
        <div className="section">
          <div className="section-label">Action</div>
          <div className="chip-row">
            {ACTIONS.map(a => (
              <button key={a}
                className={`chip${f.action === a ? ' active' : ''}`}
                onClick={() => {
                  if (a === 'split') { splitFormation(f.id); return; }
                  patch({ action: a });
                  if (a === 'walk' && !f.path) {
                    patch({ path: [{ x: f.center.x, z: f.center.z }, { x: f.center.x + 6, z: f.center.z }] });
                  }
                  if (a === 'transform' && !f.transformTo) {
                    patch({ transformTo: 'circle' });
                  }
                }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Walk path editor */}
        {f.action === 'walk' && (
          <div className="section">
            <div className="section-label">
              Path
              <span style={{
                fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)',
                textTransform: 'none', fontSize: 9, marginLeft: 6,
              }}>
                click add · right-click remove
              </span>
            </div>
            <PathEditor
              path={f.path ?? [{ x: f.center.x, z: f.center.z }]}
              onChange={path => patch({ path })}
            />
          </div>
        )}

        {/* Transform target */}
        {f.action === 'transform' && (
          <div className="section">
            <div className="section-label">Transform target</div>
            <div className="shape-grid">
              {PRESETS.filter(p => p.key !== 'custom').map(p => (
                <div key={p.key}
                  className={`shape-tile${f.transformTo === p.key ? ' active' : ''}`}
                  onClick={() => patch({ transformTo: p.key as PresetKey })}
                  title={p.label}
                >
                  <ShapeIcon kind={p.key} size={28} stroke="currentColor" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
