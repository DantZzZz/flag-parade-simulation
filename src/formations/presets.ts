// Formation shape generators.
// Each returns Array<{x, z}> in formation-local space (origin = formation center).

export interface Pt { x: number; z: number }

export interface FormationOpts {
  spacing?: number;
  cols?: number;
  rings?: number;
  angle?: number;
  points?: number;
  outer?: number;
  horizontal?: boolean;
  radius?: number;
  scale?: number;
  customPoints?: Pt[];
}

const S = 1.8; // default spacing

export function applyRotation(pts: Pt[], deg: number): Pt[] {
  if (deg === 0) return pts;
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  return pts.map((p) => ({
    x: p.x * cos - p.z * sin,
    z: p.x * sin + p.z * cos,
  }));
}

// ──────────────────────────────────────────────
// Generators
// ──────────────────────────────────────────────

export function grid(n: number, opts: FormationOpts = {}): Pt[] {
  const cols = opts.cols ?? Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const s = opts.spacing ?? S;
  const pts: Pt[] = [];
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

export function circle(n: number, opts: FormationOpts = {}): Pt[] {
  const r = opts.radius ?? Math.max(2, (n * (opts.spacing ?? S)) / (2 * Math.PI));
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
  }
  return pts;
}

export function concentric(n: number, opts: FormationOpts = {}): Pt[] {
  const rings = opts.rings ?? 3;
  const s = opts.spacing ?? S;
  const weights = Array.from({ length: rings }, (_, k) => k + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.round((w / total) * n));
  counts[counts.length - 1] += n - counts.reduce((a, b) => a + b, 0);
  const pts: Pt[] = [];
  counts.forEach((count, k) => {
    const r = (k + 1) * s * 1.4;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + k * 0.3;
      pts.push({ x: Math.cos(a) * r, z: Math.sin(a) * r });
    }
  });
  return pts.slice(0, n);
}

export function chevron(n: number, opts: FormationOpts = {}): Pt[] {
  const s = opts.spacing ?? S;
  const angle = ((opts.angle ?? 60) * Math.PI) / 180;
  const perArm = Math.ceil(n / 2);
  const pts: Pt[] = [];
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

export function diamond(n: number, opts: FormationOpts = {}): Pt[] {
  const s = opts.spacing ?? S;
  const side = Math.ceil(n / 4);
  const len = side * s;
  const corners: [number, number][] = [
    [0, -len / 2], [len / 2, 0], [0, len / 2], [-len / 2, 0],
  ];
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const si = i % 4;
    const k = Math.floor(i / 4) / Math.max(1, side - 1);
    const a = corners[si];
    const b = corners[(si + 1) % 4];
    pts.push({ x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k });
  }
  return pts;
}

export function line(n: number, opts: FormationOpts = {}): Pt[] {
  const s = opts.spacing ?? S;
  const horizontal = opts.horizontal !== false;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = (i - (n - 1) / 2) * s;
    pts.push(horizontal ? { x: p, z: 0 } : { x: 0, z: p });
  }
  return pts;
}

export function cross(n: number, opts: FormationOpts = {}): Pt[] {
  const s = opts.spacing ?? S;
  const half = Math.ceil(n / 2);
  const pts: Pt[] = [];
  for (let i = 0; i < half; i++)
    pts.push({ x: (i - (half - 1) / 2) * s, z: 0 });
  for (let i = 0; i < n - half; i++)
    pts.push({ x: 0, z: (i - (n - half - 1) / 2) * s });
  return pts;
}

export function star(n: number, opts: FormationOpts = {}): Pt[] {
  const numPoints = opts.points ?? 5;
  const outer = opts.outer ?? 5;
  const inner = outer * 0.4;
  const total = numPoints * 2;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const idx = i % total;
    const t = (idx / total) * Math.PI * 2 - Math.PI / 2;
    const kRing = Math.floor(i / total);
    const r = (idx % 2 === 0 ? outer : inner) + kRing * 0.9;
    pts.push({ x: Math.cos(t) * r, z: Math.sin(t) * r });
  }
  return pts;
}

export function arrow(n: number, opts: FormationOpts = {}): Pt[] {
  const s = opts.spacing ?? S;
  const pts: Pt[] = [];
  const shaftRows = Math.floor(n * 0.4);
  const shaftCols = 2;
  let idx = 0;
  for (let r = 0; r < shaftRows && idx < n; r++) {
    for (let c = 0; c < shaftCols && idx < n; c++) {
      pts.push({ x: (c - 0.5) * s, z: r * s });
      idx++;
    }
  }
  let k = 0;
  while (idx < n) {
    const row = shaftRows + Math.floor(k / 2);
    const side = k % 2 === 0 ? -1 : 1;
    const width = Math.max(1, 4 - Math.floor(k / 2) * 0.7);
    pts.push({ x: side * width * s * 0.6, z: row * s });
    idx++;
    k++;
  }
  return pts;
}

export function spiral(n: number, _opts: FormationOpts = {}): Pt[] {
  const pts: Pt[] = [];
  const a = 0.5, b = 0.35;
  for (let i = 0; i < n; i++) {
    const t = i * 0.55;
    const r = a + b * t;
    pts.push({ x: Math.cos(t) * r, z: Math.sin(t) * r });
  }
  return pts;
}

export function heart(n: number, _opts: FormationOpts = {}): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    pts.push({ x: x * 0.22, z: -y * 0.22 });
  }
  return pts;
}

export function scatter(n: number, opts: FormationOpts = {}): Pt[] {
  const r = opts.radius ?? 6;
  let seed = 42;
  const rnd = () => {
    seed = ((seed * 1664525 + 1013904223) >>> 0);
    return seed / 0xffffffff;
  };
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = Math.sqrt(rnd()) * r;
    pts.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr });
  }
  return pts;
}

/** NEW — hollow square perimeter */
export function squareOutline(n: number, opts: FormationOpts = {}): Pt[] {
  const s = opts.spacing ?? S;
  const perimeter = n;
  const sideCount = Math.ceil(perimeter / 4);
  const half = (sideCount - 1) * s * 0.5;
  const pts: Pt[] = [];
  // Walk the four sides: top, right, bottom, left
  const sides: Array<[number, number, number, number]> = [
    [-half, -half, half, -half], // top (z = -half)
    [half, -half, half, half],   // right
    [half, half, -half, half],   // bottom
    [-half, half, -half, -half], // left
  ];
  for (const [x0, z0, x1, z1] of sides) {
    for (let k = 0; k < sideCount && pts.length < n; k++) {
      const t = sideCount > 1 ? k / (sideCount - 1) : 0;
      pts.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t });
    }
  }
  return pts.slice(0, n);
}

/** NEW — staggered rows (brick offset pattern) */
export function staggeredRows(n: number, opts: FormationOpts = {}): Pt[] {
  const s = opts.spacing ?? S;
  const cols = opts.cols ?? Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const offset = r % 2 === 1 ? s * 0.5 : 0;
    pts.push({
      x: (c - (cols - 1) / 2) * s + offset,
      z: (r - (rows - 1) / 2) * s * 0.866, // √3/2 for tighter rows
    });
  }
  return pts;
}

export function customFromPoints(n: number, opts: FormationOpts = {}): Pt[] {
  const normPts = opts.customPoints ?? [];
  if (normPts.length === 0) return grid(n);
  const scale = opts.scale ?? 8;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p = normPts[i % normPts.length];
    pts.push({ x: (p.x - 0.5) * scale, z: (p.z - 0.5) * scale });
  }
  return pts;
}

// ──────────────────────────────────────────────
// Registry
// ──────────────────────────────────────────────

export type PresetKey =
  | 'grid' | 'circle' | 'concentric' | 'chevron' | 'diamond'
  | 'line' | 'cross' | 'star' | 'arrow' | 'spiral' | 'heart'
  | 'scatter' | 'square-outline' | 'staggered-rows' | 'custom';

export interface PresetMeta {
  key: PresetKey;
  label: string;
  fn: (n: number, opts?: FormationOpts) => Pt[];
}

export const PRESETS: PresetMeta[] = [
  { key: 'grid',           label: 'Grid',           fn: grid },
  { key: 'circle',         label: 'Circle',         fn: circle },
  { key: 'concentric',     label: 'Rings',          fn: concentric },
  { key: 'chevron',        label: 'Chevron',        fn: chevron },
  { key: 'diamond',        label: 'Diamond',        fn: diamond },
  { key: 'line',           label: 'Line',           fn: line },
  { key: 'cross',          label: 'Cross',          fn: cross },
  { key: 'star',           label: 'Star',           fn: star },
  { key: 'arrow',          label: 'Arrow',          fn: arrow },
  { key: 'spiral',         label: 'Spiral',         fn: spiral },
  { key: 'heart',          label: 'Heart',          fn: heart },
  { key: 'scatter',        label: 'Scatter',        fn: scatter },
  { key: 'square-outline', label: 'Square Outline', fn: squareOutline },
  { key: 'staggered-rows', label: 'Staggered Rows', fn: staggeredRows },
  { key: 'custom',         label: 'Custom',         fn: customFromPoints },
];

export const PRESET_MAP = Object.fromEntries(
  PRESETS.map((p) => [p.key, p]),
) as Record<PresetKey, PresetMeta>;

/** Generate formation positions, with rotation applied. */
export function generatePositions(
  shape: string,
  n: number,
  spacing: number,
  rotationDeg: number,
  center: { x: number; z: number },
): Pt[] {
  const meta = PRESET_MAP[shape as PresetKey] ?? PRESET_MAP['grid'];
  const local = meta.fn(n, { spacing });
  const rotated = applyRotation(local, rotationDeg);
  return rotated.map((p) => ({ x: p.x + center.x, z: p.z + center.z }));
}
