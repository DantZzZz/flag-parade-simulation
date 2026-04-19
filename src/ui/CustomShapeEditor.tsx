import { useRef, useState } from 'react';
import type { Pt } from '../formations/presets';
import { useParadeStore } from '../store/useParadeStore';

interface Props {
  points: Pt[];
  onChange: (pts: Pt[]) => void;
}

export default function CustomShapeEditor({ points, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [saveName, setSaveName] = useState('');

  const savedFormations = useParadeStore((s) => s.savedCustomFormations);
  const saveCustomFormation = useParadeStore((s) => s.saveCustomFormation);
  const deleteCustomFormation = useParadeStore((s) => s.deleteCustomFormation);
  const loadCustomFormation = useParadeStore((s) => s.loadCustomFormation);

  const toNorm = (e: React.PointerEvent<HTMLDivElement>): Pt => {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / r.width)),
      z: Math.max(0.02, Math.min(0.98, (e.clientY - r.top) / r.height)),
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    onChange([...points, toNorm(e)]);
  };

  const handleDotPointerDown = (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(idx);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging === null) return;
    const pos = toNorm(e);
    const next = [...points];
    next[dragging] = pos;
    onChange(next);
  };

  const handlePointerUp = () => setDragging(null);

  const removeDot = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(points.filter((_, i) => i !== idx));
  };

  const distributeEvenly = () => {
    if (points.length < 2) return;
    const n = points.length;
    const cumDist = [0];
    for (let i = 1; i < n; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dz = points[i].z - points[i - 1].z;
      cumDist.push(cumDist[i - 1] + Math.sqrt(dx * dx + dz * dz));
    }
    const total = cumDist[n - 1];
    if (total < 0.001) return;
    const newPts = points.map((_, i) => {
      const target = (i / (n - 1)) * total;
      let si = cumDist.findIndex((d) => d >= target) - 1;
      si = Math.max(0, Math.min(si, n - 2));
      const segLen = cumDist[si + 1] - cumDist[si];
      const t = segLen > 0 ? (target - cumDist[si]) / segLen : 0;
      return {
        x: points[si].x + (points[si + 1].x - points[si].x) * t,
        z: points[si].z + (points[si + 1].z - points[si].z) * t,
      };
    });
    onChange(newPts);
  };

  return (
    <div className="custom-shape-editor">
      {/* Drawing canvas */}
      <div
        ref={containerRef}
        className="shape-editor"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="grid-bg" />
        {points.length === 0 && (
          <div className="hint">click to add points · right-click to remove</div>
        )}
        {/* Path lines */}
        {points.length > 1 && (
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
          >
            <polyline
              points={points.map((p) => `${p.x},${p.z}`).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.008"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
        {points.map((p, i) => (
          <div
            key={i}
            className="dot"
            style={{
              left: `${p.x * 100}%`,
              top: `${p.z * 100}%`,
              cursor: dragging === i ? 'grabbing' : 'grab',
            }}
            onPointerDown={(e) => handleDotPointerDown(e, i)}
            onContextMenu={(e) => removeDot(e, i)}
          />
        ))}
      </div>

      {/* Toolbar */}
      <div className="custom-editor-toolbar">
        <button className="debug-btn" onClick={distributeEvenly} title="Space existing points evenly along their path">
          Distribute evenly
        </button>
        <button className="debug-btn" onClick={() => onChange([])} title="Remove all points">
          Clear
        </button>
        <span className="custom-editor-count">{points.length} pts</span>
      </div>

      {/* Save row */}
      <div className="custom-editor-save">
        <input
          type="text"
          placeholder="formation name…"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && saveName.trim() && points.length > 0) {
              saveCustomFormation(saveName.trim(), points);
              setSaveName('');
            }
          }}
        />
        <button
          className="debug-btn"
          disabled={!saveName.trim() || points.length === 0}
          onClick={() => {
            if (saveName.trim() && points.length > 0) {
              saveCustomFormation(saveName.trim(), points);
              setSaveName('');
            }
          }}
        >
          Save
        </button>
      </div>

      {/* Saved formations list */}
      {savedFormations.length > 0 && (
        <div className="custom-editor-saved">
          {savedFormations.map((sf) => (
            <div key={sf.id} className="custom-editor-saved__row">
              <span className="custom-editor-saved__name" title={sf.name}>
                {sf.name}
              </span>
              <button className="debug-btn" onClick={() => loadCustomFormation(sf.id)}>
                Load
              </button>
              <button
                className="debug-btn debug-btn--danger"
                onClick={() => deleteCustomFormation(sf.id)}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
