// Formation shape generators. Each returns an array of {x, z} positions (y=0),
// with the origin being the formation's center.
// Exposed to window for cross-file use (Babel scripts have isolated scope).

const SPACING = 1.8; // meters between bearers in most formations

function grid(n, opts = {}) {
  const cols = opts.cols || Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const s = opts.spacing || SPACING;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    pts.push({
      x: (c - (cols - 1) / 2) * s,
      z: (r - (rows - 1) / 2) * s,
    });
  }
  return pts;
}

function circle(n, opts = {}) {
  const r = opts.radius || Math.max(2, (n * (opts.spacing || SPACING)) / (2 * Math.PI));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
  }
  return pts;
}

function concentric(n, opts = {}) {
  const rings = opts.rings || 3;
  const s = opts.spacing || SPACING;
  const per = [];
  let remaining = n;
  for (let k = 0; k < rings; k++) {
    // distribute proportional to ring circumference
    const w = (k + 1);
    per.push(w);
  }
  const total = per.reduce((a, b) => a + b, 0);
  const counts = per.map((w) => Math.round((w / total) * n));
  // correct rounding
  let diff = n - counts.reduce((a, b) => a + b, 0);
  counts[counts.length - 1] += diff;
  const pts = [];
  counts.forEach((count, k) => {
    const r = (k + 1) * s * 1.4;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + k * 0.3;
      pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
  });
  return pts.slice(0, n);
}

function chevron(n, opts = {}) {
  const s = opts.spacing || SPACING;
  const angle = (opts.angle || 60) * Math.PI / 180;
  const pts = [];
  const perArm = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    const arm = i % 2 === 0 ? -1 : 1;
    const k = Math.floor(i / 2);
    pts.push({
      x: arm * k * s * Math.sin(angle / 2),
      z: k * s * Math.cos(angle / 2) - perArm * s * 0.25,
    });
  }
  return pts;
}

function diamond(n) {
  // diamond outline-ish: distribute around rotated square
  const pts = [];
  const side = Math.ceil(n / 4);
  const s = SPACING;
  for (let i = 0; i < n; i++) {
    const side_i = i % 4;
    const k = Math.floor(i / 4) / Math.max(1, side - 1);
    const len = side * s;
    const corners = [
      [0, -len / 2],
      [len / 2, 0],
      [0, len / 2],
      [-len / 2, 0],
    ];
    const a = corners[side_i];
    const b = corners[(side_i + 1) % 4];
    pts.push({ x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k });
  }
  return pts;
}

function line(n, opts = {}) {
  const s = opts.spacing || SPACING;
  const horizontal = opts.horizontal !== false;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const p = (i - (n - 1) / 2) * s;
    pts.push(horizontal ? { x: p, z: 0 } : { x: 0, z: p });
  }
  return pts;
}

function cross(n) {
  const s = SPACING;
  const half = Math.ceil(n / 2);
  const pts = [];
  for (let i = 0; i < half; i++) pts.push({ x: (i - (half - 1) / 2) * s, z: 0 });
  for (let i = 0; i < n - half; i++) pts.push({ x: 0, z: (i - (n - half - 1) / 2) * s });
  return pts;
}

function star(n, opts = {}) {
  const points = opts.points || 5;
  const outer = opts.outer || 5;
  const inner = outer * 0.4;
  const pts = [];
  const total = points * 2;
  for (let i = 0; i < n; i++) {
    const idx = i % total;
    const t = (idx / total) * Math.PI * 2 - Math.PI / 2;
    const kRing = Math.floor(i / total);
    const r = (idx % 2 === 0 ? outer : inner) + kRing * 0.9;
    pts.push({ x: Math.cos(t) * r, z: Math.sin(t) * r });
  }
  return pts;
}

function arrow(n) {
  // simple arrow pointing +z
  const pts = [];
  const s = SPACING;
  const shaftRows = Math.floor(n * 0.4);
  const shaftCols = 2;
  let idx = 0;
  for (let r = 0; r < shaftRows && idx < n; r++) {
    for (let c = 0; c < shaftCols && idx < n; c++) {
      pts.push({ x: (c - 0.5) * s, z: r * s });
      idx++;
    }
  }
  // head
  let k = 0;
  while (idx < n) {
    const row = shaftRows + Math.floor(k / 2);
    const side = k % 2 === 0 ? -1 : 1;
    const width = Math.max(1, 4 - Math.floor(k / 2) * 0.7);
    pts.push({ x: side * width * s * 0.6, z: row * s });
    idx++; k++;
  }
  return pts;
}

function spiral(n) {
  const pts = [];
  const a = 0.5, b = 0.35;
  for (let i = 0; i < n; i++) {
    const t = i * 0.55;
    const r = a + b * t;
    pts.push({ x: Math.cos(t) * r, z: Math.sin(t) * r });
  }
  return pts;
}

function heart(n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pts.push({ x: x * 0.22, z: -y * 0.22 });
  }
  return pts;
}

function scatter(n, opts = {}) {
  const r = opts.radius || 6;
  const pts = [];
  // deterministic pseudo-random
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = Math.sqrt(rnd()) * r;
    pts.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr });
  }
  return pts;
}

function customFromPoints(n, opts = {}) {
  // opts.points: normalized [0..1] in both axes
  const pts = [];
  const normPoints = opts.points || [];
  if (normPoints.length === 0) return grid(n);
  const scale = opts.scale || 8;
  for (let i = 0; i < n; i++) {
    const p = normPoints[i % normPoints.length];
    pts.push({
      x: (p.x - 0.5) * scale,
      z: (p.y - 0.5) * scale,
    });
  }
  return pts;
}

const FORMATIONS = {
  grid: { name: 'Grid', fn: grid, icon: 'grid' },
  circle: { name: 'Circle', fn: circle, icon: 'circle' },
  concentric: { name: 'Rings', fn: concentric, icon: 'concentric' },
  chevron: { name: 'Chevron', fn: chevron, icon: 'chevron' },
  diamond: { name: 'Diamond', fn: diamond, icon: 'diamond' },
  line: { name: 'Line', fn: line, icon: 'line' },
  cross: { name: 'Cross', fn: cross, icon: 'cross' },
  star: { name: 'Star', fn: star, icon: 'star' },
  arrow: { name: 'Arrow', fn: arrow, icon: 'arrow' },
  spiral: { name: 'Spiral', fn: spiral, icon: 'spiral' },
  heart: { name: 'Heart', fn: heart, icon: 'heart' },
  scatter: { name: 'Scatter', fn: scatter, icon: 'scatter' },
  custom: { name: 'Custom', fn: customFromPoints, icon: 'custom' },
};

function ShapeIcon({ kind, size = 14, stroke = 'currentColor' }) {
  const s = size; const r = s * 0.08;
  const dots = (pts) => pts.map(([x, y], i) => (
    <circle key={i} cx={x} cy={y} r={r} fill={stroke} />
  ));
  const half = s / 2;
  const makeGrid = () => {
    const out = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push([s * 0.2 + i * s * 0.3, s * 0.2 + j * s * 0.3]);
    return out;
  };
  const makeCircle = () => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return [half + Math.cos(a) * s * 0.35, half + Math.sin(a) * s * 0.35];
  });
  const makeConc = () => [...Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [half + Math.cos(a) * s * 0.35, half + Math.sin(a) * s * 0.35];
  }), ...Array.from({ length: 4 }, (_, i) => {
    const a = (i / 4) * Math.PI * 2;
    return [half + Math.cos(a) * s * 0.17, half + Math.sin(a) * s * 0.17];
  }), [half, half]];
  const makeChev = () => {
    const arr = [];
    for (let i = 0; i < 4; i++) arr.push([half - s * 0.08 - i * s * 0.09, s * 0.15 + i * s * 0.18]);
    for (let i = 0; i < 4; i++) arr.push([half + s * 0.08 + i * s * 0.09, s * 0.15 + i * s * 0.18]);
    return arr;
  };
  const makeDiamond = () => [
    [half, s * 0.12], [half + s * 0.2, s * 0.32], [half + s * 0.38, half],
    [half + s * 0.2, s * 0.68], [half, s * 0.88], [half - s * 0.2, s * 0.68],
    [half - s * 0.38, half], [half - s * 0.2, s * 0.32],
  ];
  const makeLine = () => Array.from({ length: 7 }, (_, i) => [s * 0.15 + i * s * 0.12, half]);
  const makeCross = () => [...Array.from({ length: 5 }, (_, i) => [s * 0.2 + i * s * 0.15, half]),
                            ...Array.from({ length: 4 }, (_, i) => [half, s * 0.2 + i * s * 0.15])];
  const makeStar = () => Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = (i % 2 === 0 ? s * 0.4 : s * 0.18);
    return [half + Math.cos(a) * rr, half + Math.sin(a) * rr];
  });
  const makeArrow = () => [
    [half - s * 0.06, s * 0.75], [half + s * 0.06, s * 0.75],
    [half - s * 0.06, s * 0.6], [half + s * 0.06, s * 0.6],
    [half - s * 0.06, s * 0.45], [half + s * 0.06, s * 0.45],
    [half - s * 0.22, s * 0.38], [half + s * 0.22, s * 0.38],
    [half - s * 0.12, s * 0.25], [half + s * 0.12, s * 0.25],
    [half, s * 0.14],
  ];
  const makeSpiral = () => Array.from({ length: 9 }, (_, i) => {
    const t = i * 0.7;
    const r = s * 0.05 + t * s * 0.04;
    return [half + Math.cos(t) * r, half + Math.sin(t) * r];
  });
  const makeHeart = () => Array.from({ length: 10 }, (_, i) => {
    const t = (i / 10) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [half + x * s * 0.022, half - y * s * 0.022];
  });
  const makeScatter = () => {
    let seed = 7;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
    return Array.from({ length: 9 }, () => [s * 0.15 + rnd() * s * 0.7, s * 0.15 + rnd() * s * 0.7]);
  };
  const makeCustom = () => [[half, half]];

  const map = {
    grid: makeGrid, circle: makeCircle, concentric: makeConc, chevron: makeChev,
    diamond: makeDiamond, line: makeLine, cross: makeCross, star: makeStar,
    arrow: makeArrow, spiral: makeSpiral, heart: makeHeart, scatter: makeScatter, custom: makeCustom,
  };
  const pts = (map[kind] || makeGrid)();
  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} style={{ display: 'block' }}>
      {dots(pts)}
      {kind === 'custom' && <path d={`M ${s*0.2} ${s*0.3} Q ${half} ${s*0.1} ${s*0.8} ${s*0.3} T ${s*0.8} ${s*0.7} Q ${half} ${s*0.9} ${s*0.2} ${s*0.7} T ${s*0.2} ${s*0.3}`} stroke={stroke} strokeWidth="0.6" fill="none" opacity="0.5" />}
    </svg>
  );
}

window.FORMATIONS = FORMATIONS;
window.ShapeIcon = ShapeIcon;
