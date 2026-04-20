import { useRef, useState, useEffect, useCallback } from 'react';
import { useParadeStore } from '../store/useParadeStore';
import ShapeIcon from './ShapeIcon';
import { assignLanes } from '../utils/timeline';
import type { Formation, FormationShape } from '../store/types';

const RULER_H = 22;
const BLOCK_H = 34;
const LANE_H = 44;

const SHAPES: FormationShape[] = [
  'grid', 'circle', 'concentric', 'chevron', 'diamond', 'line',
  'cross', 'star', 'arrow', 'spiral', 'heart', 'scatter',
  'square-outline', 'staggered-rows',
];

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  const ms = Math.floor((t % 1) * 10);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${ms}`;
}

function laneY(lane: number): number {
  return 6 + lane * LANE_H;
}

// Flag any formations whose time ranges overlap (potential bearer conflict)
function findOverlaps(formations: Formation[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < formations.length; i++) {
    for (let j = i + 1; j < formations.length; j++) {
      const a = formations[i], b = formations[j];
      const overlapEnd = Math.min(a.start + a.duration, b.start + b.duration);
      if (overlapEnd > Math.max(a.start, b.start)) {
        // Skip expected split/merge overlaps
        const aChildOfB = b.splitInto?.includes(a.id) || a.mergeFrom?.includes(b.id);
        const bChildOfA = a.splitInto?.includes(b.id) || b.mergeFrom?.includes(a.id);
        if (!aChildOfB && !bChildOfA) {
          overlapping.add(a.id);
          overlapping.add(b.id);
        }
      }
    }
  }
  return overlapping;
}

interface DragState {
  kind: 'move' | 'resize-left' | 'resize-right';
  id: string;
  startX: number;
  orig: { start: number; duration: number };
}

export default function Timeline() {
  const timeline       = useParadeStore((s) => s.timeline);
  const selectedId     = useParadeStore((s) => s.selectedId);
  const tweaks         = useParadeStore((s) => s.tweaks);
  const select         = useParadeStore((s) => s.select);
  const setPlayhead    = useParadeStore((s) => s.setPlayhead);
  const setPlaying     = useParadeStore((s) => s.setPlaying);
  const addFormation   = useParadeStore((s) => s.addFormation);
  const splitFormation = useParadeStore((s) => s.splitFormation);
  const deleteFormation = useParadeStore((s) => s.deleteFormation);
  const updateFormation = useParadeStore((s) => s.updateFormation);
  const recomputeDuration = useParadeStore((s) => s.recomputeDuration);
  const setTweaks      = useParadeStore((s) => s.setTweaks);
  const setPxPerSec    = useParadeStore((s) => s.setPxPerSec);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [transformPickerId, setTransformPickerId] = useState<string | null>(null);

  const { formations, playhead, playing, duration, pxPerSec } = timeline;

  const lanes = assignLanes(formations);
  const overlapping = findOverlaps(formations);
  const numLanes = formations.length === 0 ? 1 : Math.max(...Object.values(lanes).map((l) => l + 1));
  const bodyH = RULER_H + numLanes * LANE_H + 16;
  const widthPx = Math.max(duration * pxPerSec, 600);

  const selected = formations.find((f) => f.id === selectedId) ?? null;

  // --- Drag: move / resize ---
  const onBlockMouseDown = useCallback(
    (e: React.MouseEvent, f: Formation, kind: DragState['kind']) => {
      e.stopPropagation();
      e.preventDefault();
      select(f.id);
      setDragging({ kind, id: f.id, startX: e.clientX, orig: { start: f.start, duration: f.duration } });
    },
    [select],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dt = dx / pxPerSec;
      const { kind, id, orig } = dragging;
      if (kind === 'move') {
        updateFormation(id, { start: Math.max(0, orig.start + dt) });
      } else if (kind === 'resize-right') {
        updateFormation(id, { duration: Math.max(1, orig.duration + dt) });
      } else if (kind === 'resize-left') {
        const newStart = Math.max(0, orig.start + dt);
        const dStart = newStart - orig.start;
        if (orig.duration - dStart > 1) {
          updateFormation(id, { start: newStart, duration: orig.duration - dStart });
        }
      }
    };
    const up = () => {
      setDragging(null);
      recomputeDuration();
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging, pxPerSec, updateFormation, recomputeDuration]);

  // --- Scrub ---
  const scrub = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!scrollRef.current) return;
      const rect = scrollRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollRef.current.scrollLeft;
      setPlayhead(Math.max(0, Math.min(duration, x / pxPerSec)));
    },
    [duration, pxPerSec, setPlayhead],
  );

  const onRulerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    scrub(e);
    const move = (e2: MouseEvent) => scrub(e2);
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const onBodyMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.t-block')) {
      scrub(e);
    }
  };

  // --- Connector links ---
  const links: Array<{ from: Formation; to: Formation; kind: 'split' | 'merge' }> = [];
  formations.forEach((f) => {
    f.splitInto?.forEach((childId) => {
      const child = formations.find((x) => x.id === childId);
      if (child) links.push({ from: f, to: child, kind: 'split' });
    });
    f.mergeFrom?.forEach((parentId) => {
      const parent = formations.find((x) => x.id === parentId);
      if (parent && !parent.splitInto?.includes(f.id)) {
        links.push({ from: parent, to: f, kind: 'merge' });
      }
    });
  });

  const playheadX = playhead * pxPerSec;

  return (
    <div className="timeline-wrap">
      {/* Toolbar */}
      <div className="timeline-toolbar">
        {/* Transport */}
        <div className="transport">
          <button className="transport-btn" onClick={() => setPlayhead(0)} title="Rewind">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/></svg>
          </button>
          <button
            className={`transport-btn ${playing ? '' : 'play'}`}
            onClick={() => setPlaying(!playing)}
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="transport-btn" onClick={() => setPlayhead(duration)} title="End">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg>
          </button>
        </div>

        <div className="timecode">
          {fmt(playhead)} <span className="total">/ {fmt(duration)}</span>
        </div>

        {/* Zoom */}
        <div className="tl-zoom">
          <button className="transport-btn" onClick={() => setPxPerSec(pxPerSec * 0.75)} title="Zoom out">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11h14v2H5z"/></svg>
          </button>
          <button className="transport-btn" onClick={() => setPxPerSec(pxPerSec * 1.33)} title="Zoom in">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5v6H5v2h6v6h2v-6h6v-2h-6V5z"/></svg>
          </button>
        </div>

        {/* Density */}
        <div className="tl-density">
          {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
            <button
              key={d}
              className={`tool-btn ${tweaks.timelineDensity === d ? 'primary' : ''}`}
              onClick={() => setTweaks({ timelineDensity: d })}
            >
              {d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Formation tools */}
        <div className="timeline-tools">
          <button className="tool-btn" onClick={() => addFormation()}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5v6H5v2h6v6h2v-6h6v-2h-6V5z"/></svg>
            Add
          </button>
          {selected && (
            <>
              <button className="tool-btn" onClick={() => splitFormation(selected.id)}>Split</button>
              <button className="tool-btn" onClick={() => setTransformPickerId(selected.id)}>Transform</button>
              <button
                className="tool-btn"
                onClick={() =>
                  updateFormation(selected.id, {
                    action: 'walk',
                    path: [
                      { x: selected.center.x, z: selected.center.z },
                      { x: selected.center.x + 6, z: selected.center.z + 4 },
                    ],
                  })
                }
              >
                Walk path
              </button>
              <button
                className="tool-btn"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                onClick={() => deleteFormation(selected.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transform shape picker (replaces prompt()) */}
      {transformPickerId && (
        <div className="tl-transform-picker">
          <span className="tl-transform-label">Transform to:</span>
          <div className="tl-transform-shapes">
            {SHAPES.map((shape) => (
              <button
                key={shape}
                className="tool-btn"
                title={shape}
                onClick={() => {
                  updateFormation(transformPickerId, { action: 'transform', transformTo: shape });
                  setTransformPickerId(null);
                }}
              >
                <span style={{ display: 'inline-block', width: 12, height: 12, verticalAlign: 'middle', marginRight: 4 }}>
                  <ShapeIcon kind={shape} size={12} stroke="currentColor" />
                </span>
                {shape}
              </button>
            ))}
          </div>
          <button className="tool-btn" onClick={() => setTransformPickerId(null)}>✕ Cancel</button>
        </div>
      )}

      {/* Track body */}
      <div className="timeline-body" style={{ height: bodyH }}>
        <div
          className="tl-scroll-area"
          ref={scrollRef}
          onMouseDown={onBodyMouseDown}
        >
          <div style={{ width: widthPx, position: 'relative', minHeight: '100%' }}>
            {/* Ruler */}
            <div className="timeline-ruler" onMouseDown={onRulerMouseDown}>
              {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
                <div key={i} className="tick" style={{ left: i * pxPerSec }}>{i}s</div>
              ))}
            </div>

            {/* Tracks */}
            <div className="timeline-tracks" style={{ position: 'absolute', top: RULER_H, left: 0, right: 0, bottom: 0 }}>
              {/* Connector SVG */}
              <svg
                className="t-links"
                width={widthPx}
                height={numLanes * LANE_H + 20}
                style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
              >
                {links.map((l, i) => {
                  const la = lanes[l.from.id] ?? 0;
                  const lb = lanes[l.to.id] ?? 0;
                  const ax = (l.from.start + l.from.duration) * pxPerSec;
                  const ay = laneY(la) + BLOCK_H / 2;
                  const bx = l.to.start * pxPerSec;
                  const by = laneY(lb) + BLOCK_H / 2;
                  const midX = (ax + bx) / 2;
                  return (
                    <path
                      key={i}
                      d={`M ${ax} ${ay} C ${midX} ${ay}, ${midX} ${by}, ${bx} ${by}`}
                      className={`t-link ${l.kind}`}
                    />
                  );
                })}
              </svg>

              {/* Formation blocks */}
              {formations.map((f) => {
                const lane = lanes[f.id] ?? 0;
                const left = f.start * pxPerSec;
                const width = Math.max(24, f.duration * pxPerSec);
                const isSel = selectedId === f.id;
                const hasOverlap = overlapping.has(f.id);
                return (
                  <div
                    key={f.id}
                    className={`t-block${isSel ? ' selected' : ''}${hasOverlap ? ' overlapping' : ''}`}
                    style={{ left, top: laneY(lane), width }}
                    onMouseDown={(e) => onBlockMouseDown(e, f, 'move')}
                  >
                    <div className="t-handle left" onMouseDown={(e) => onBlockMouseDown(e, f, 'resize-left')} />
                    <div className="t-icon">
                      <ShapeIcon kind={f.shape} size={14} stroke="currentColor" />
                    </div>
                    <span className="t-label">{f.name}</span>
                    <span className="t-count">{f.count}</span>
                    {f.action !== 'hold' && <ActionBadge action={f.action} />}
                    <div className="t-handle" onMouseDown={(e) => onBlockMouseDown(e, f, 'resize-right')} />
                  </div>
                );
              })}

              {/* Playhead */}
              <div className="playhead" style={{ left: playheadX, height: numLanes * LANE_H + 20 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  walk: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  ),
  transform: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h10l-3-3M20 17H10l3 3"/>
    </svg>
  ),
  split: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h6M14 6l6 0M14 18l6 0M10 12l4-6M10 12l4 6"/>
    </svg>
  ),
  merge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 12h-6M4 6l6 6M4 18l6-6"/>
    </svg>
  ),
};

function ActionBadge({ action }: { action: string }) {
  return (
    <span className="t-action-badge">
      <span className="t-action-icon">{ACTION_ICONS[action]}</span>
      {action}
    </span>
  );
}
