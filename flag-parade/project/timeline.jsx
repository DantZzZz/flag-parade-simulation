// Timeline — node-graph feel: blocks with connector strokes for splits/merges/transforms.
// Scrubbable playhead; drag blocks to move; drag edges to resize.

const { useState, useEffect, useRef, useCallback } = React;

function Timeline() {
  const store = window.paradeStore;
  const [tick, setTick] = useState(0);
  useEffect(() => store.subscribe(() => setTick((x) => x + 1)), []);
  const s = store.get();
  const tl = s.timeline;
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const pxPerSec = tl.pxPerSec;
  const widthPx = tl.duration * pxPerSec;

  const onMouseDown = (e, formation, kind) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = trackRef.current.getBoundingClientRect();
    setDragging({
      kind, // 'move' | 'resize-left' | 'resize-right'
      id: formation.id,
      startX: e.clientX,
      startLeft: rect.left,
      orig: { start: formation.start, duration: formation.duration },
    });
    store.select(formation.id);
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const dx = e.clientX - dragging.startX;
      const dt = dx / pxPerSec;
      const f = store.get().timeline.formations.find((x) => x.id === dragging.id);
      if (!f) return;
      if (dragging.kind === 'move') {
        f.start = Math.max(0, dragging.orig.start + dt);
      } else if (dragging.kind === 'resize-right') {
        f.duration = Math.max(1, dragging.orig.duration + dt);
      } else if (dragging.kind === 'resize-left') {
        const newStart = Math.max(0, dragging.orig.start + dt);
        const deltaStart = newStart - dragging.orig.start;
        if (dragging.orig.duration - deltaStart > 1) {
          f.start = newStart;
          f.duration = dragging.orig.duration - deltaStart;
        }
      }
      store.recomputeDuration();
      store.notify();
    };
    const up = () => setDragging(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging, pxPerSec]);

  const onScrub = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + trackRef.current.scrollLeft;
    const t = Math.max(0, Math.min(tl.duration, x / pxPerSec));
    store.setPlayhead(t);
  };

  const onRulerMouseDown = (e) => {
    onScrub(e);
    const move = (e2) => onScrub(e2);
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // Assign row lanes so overlapping / split formations don't collide
  const lanes = assignLanes(tl.formations);

  // Render connector links for splits
  const links = [];
  tl.formations.forEach((f) => {
    if (f.splitInto) {
      f.splitInto.forEach((childId) => {
        const child = tl.formations.find((x) => x.id === childId);
        if (!child) return;
        links.push({ from: f, to: child, kind: 'split' });
      });
    }
    if (f.mergeFrom) {
      f.mergeFrom.forEach((parentId) => {
        const parent = tl.formations.find((x) => x.id === parentId);
        if (!parent) return;
        // already covered by parent's splitInto iteration; skip
        if (parent.splitInto && parent.splitInto.includes(f.id)) return;
        links.push({ from: parent, to: f, kind: 'merge' });
      });
    }
  });

  const laneY = (lane) => 6 + lane * 44;

  const playheadX = tl.playhead * pxPerSec;

  const fmt = (t) => {
    const m = Math.floor(t / 60);
    const sec = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${ms}`;
  };

  const selected = tl.formations.find((f) => f.id === s.selectedId);

  return (
    <div className="timeline-wrap">
      <div className="timeline-toolbar">
        <div className="transport">
          <button className="transport-btn" onClick={() => store.setPlayhead(0)} title="Rewind">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/></svg>
          </button>
          <button className={`transport-btn ${tl.playing ? '' : 'play'}`} onClick={() => store.setPlaying(!tl.playing)} title={tl.playing ? 'Pause' : 'Play'}>
            {tl.playing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="transport-btn" onClick={() => store.setPlayhead(tl.duration)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z"/></svg>
          </button>
        </div>
        <div className="timecode">
          {fmt(tl.playhead)} <span className="total">/ {fmt(tl.duration)}</span>
        </div>

        <div className="timeline-tools">
          <button className="tool-btn" onClick={() => store.addFormation()}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5v6H5v2h6v6h2v-6h6v-2h-6V5z"/></svg>
            Add formation
          </button>
          {selected && (
            <>
              <button className="tool-btn" onClick={() => store.splitFormation(selected.id)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h6M14 6l6 0M14 18l6 0M10 12l4-6M10 12l4 6"/></svg>
                Split
              </button>
              <button className="tool-btn" onClick={() => {
                const next = prompt('Transform to shape (grid, circle, concentric, chevron, diamond, line, cross, star, arrow, spiral, heart, scatter):', 'circle');
                if (next && window.FORMATIONS[next]) {
                  store.updateFormation(selected.id, { action: 'transform', transformTo: next });
                }
              }}>Transform</button>
              <button className="tool-btn" onClick={() => {
                store.updateFormation(selected.id, {
                  action: 'walk',
                  path: [{ x: selected.center.x, z: selected.center.z }, { x: selected.center.x + 6, z: selected.center.z + 4 }],
                });
              }}>Walk path</button>
              <button className="tool-btn" onClick={() => store.deleteFormation(selected.id)}>Delete</button>
            </>
          )}
        </div>
      </div>

      <div
        className="timeline-body"
        ref={trackRef}
        onMouseDown={(e) => { if (e.target === trackRef.current) onScrub(e); }}
      >
        {/* Ruler */}
        <div className="timeline-ruler" onMouseDown={onRulerMouseDown}>
          {Array.from({ length: Math.ceil(tl.duration) + 1 }).map((_, i) => (
            <div key={i} className="tick" style={{ left: i * pxPerSec }}>{i}s</div>
          ))}
        </div>

        {/* Tracks area */}
        <div className="timeline-tracks" style={{ width: widthPx, position: 'relative', minHeight: '100%' }}>
          {/* Connector SVG */}
          <svg className="t-links" width={widthPx} height="400" style={{ position: 'absolute', left: 0, top: 0 }}>
            {links.map((l, i) => {
              const laneA = lanes[l.from.id] ?? 0;
              const laneB = lanes[l.to.id] ?? 0;
              const ax = (l.from.start + l.from.duration) * pxPerSec;
              const ay = laneY(laneA) + 17;
              const bx = l.to.start * pxPerSec;
              const by = laneY(laneB) + 17;
              const midX = (ax + bx) / 2;
              const d = `M ${ax} ${ay} C ${midX} ${ay}, ${midX} ${by}, ${bx} ${by}`;
              return <path key={i} d={d} className={`t-link ${l.kind}`} />;
            })}
          </svg>

          {tl.formations.map((f) => {
            const lane = lanes[f.id] ?? 0;
            const left = f.start * pxPerSec;
            const width = Math.max(24, f.duration * pxPerSec);
            const isSel = s.selectedId === f.id;
            return (
              <div
                key={f.id}
                className={`t-block ${isSel ? 'selected' : ''}`}
                style={{ left, top: laneY(lane), width }}
                onMouseDown={(e) => onMouseDown(e, f, 'move')}
              >
                <div className="t-handle left" onMouseDown={(e) => onMouseDown(e, f, 'resize-left')} />
                <div style={{ width: 14, height: 14, color: 'var(--accent)' }}>
                  <window.ShapeIcon kind={f.shape} size={14} stroke="currentColor" />
                </div>
                <span className="t-label">{f.name}</span>
                <span className="t-count">{f.count}</span>
                {f.action !== 'hold' && (
                  <ActionBadge action={f.action} />
                )}
                <div className="t-handle" onMouseDown={(e) => onMouseDown(e, f, 'resize-right')} />
              </div>
            );
          })}

          {/* Playhead */}
          <div className="playhead" style={{ left: playheadX, height: '100%' }} />
        </div>
      </div>
    </div>
  );
}

function ActionBadge({ action }) {
  const icons = {
    walk: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
    transform: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h10l-3-3M20 17H10l3 3"/></svg>,
    split: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h6M14 6l6 0M14 18l6 0M10 12l4-6M10 12l4 6"/></svg>,
    merge: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12h-6M4 6l6 6M4 18l6-6"/></svg>,
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--accent)', padding: '2px 6px', border: '1px solid var(--accent-dim)', borderRadius: 3, marginLeft: 6 }}>
      <span style={{ width: 10, height: 10 }}>{icons[action]}</span>
      {action}
    </span>
  );
}

function assignLanes(formations) {
  // simple greedy lane assignment
  const sorted = [...formations].sort((a, b) => a.start - b.start);
  const lanes = []; // array of end times
  const map = {};
  for (const f of sorted) {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      if (lanes[i] <= f.start + 0.001) {
        lanes[i] = f.start + f.duration;
        map[f.id] = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push(f.start + f.duration);
      map[f.id] = lanes.length - 1;
    }
  }
  return map;
}

window.Timeline = Timeline;
