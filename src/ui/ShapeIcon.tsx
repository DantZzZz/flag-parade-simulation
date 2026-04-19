import type { PresetKey } from '../formations/presets';

interface Props {
  kind: PresetKey | string;
  size?: number;
  stroke?: string;
}

export default function ShapeIcon({ kind, size = 14, stroke = 'currentColor' }: Props) {
  const s = size;
  const r = s * 0.08;
  const half = s / 2;

  const dot = (pts: [number, number][], key: string) =>
    pts.map(([x, y], i) => <circle key={`${key}-${i}`} cx={x} cy={y} r={r} fill={stroke} />);

  const makeGrid = (): [number, number][] => {
    const out: [number, number][] = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        out.push([s * 0.2 + i * s * 0.3, s * 0.2 + j * s * 0.3]);
    return out;
  };

  const makeCircle = (): [number, number][] =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return [half + Math.cos(a) * s * 0.35, half + Math.sin(a) * s * 0.35];
    });

  const makeConc = (): [number, number][] => [
    ...Array.from({ length: 6 }, (_, i): [number, number] => {
      const a = (i / 6) * Math.PI * 2;
      return [half + Math.cos(a) * s * 0.35, half + Math.sin(a) * s * 0.35];
    }),
    ...Array.from({ length: 4 }, (_, i): [number, number] => {
      const a = (i / 4) * Math.PI * 2;
      return [half + Math.cos(a) * s * 0.17, half + Math.sin(a) * s * 0.17];
    }),
    [half, half],
  ];

  const makeChev = (): [number, number][] => {
    const arr: [number, number][] = [];
    for (let i = 0; i < 4; i++) arr.push([half - s * 0.08 - i * s * 0.09, s * 0.15 + i * s * 0.18]);
    for (let i = 0; i < 4; i++) arr.push([half + s * 0.08 + i * s * 0.09, s * 0.15 + i * s * 0.18]);
    return arr;
  };

  const makeDiamond = (): [number, number][] => [
    [half, s * 0.12], [half + s * 0.2, s * 0.32], [half + s * 0.38, half],
    [half + s * 0.2, s * 0.68], [half, s * 0.88], [half - s * 0.2, s * 0.68],
    [half - s * 0.38, half], [half - s * 0.2, s * 0.32],
  ];

  const makeLine = (): [number, number][] =>
    Array.from({ length: 7 }, (_, i): [number, number] => [s * 0.15 + i * s * 0.12, half]);

  const makeCross = (): [number, number][] => [
    ...Array.from({ length: 5 }, (_, i): [number, number] => [s * 0.2 + i * s * 0.15, half]),
    ...Array.from({ length: 4 }, (_, i): [number, number] => [half, s * 0.2 + i * s * 0.15]),
  ];

  const makeStar = (): [number, number][] =>
    Array.from({ length: 10 }, (_, i): [number, number] => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? s * 0.4 : s * 0.18;
      return [half + Math.cos(a) * rr, half + Math.sin(a) * rr];
    });

  const makeArrow = (): [number, number][] => [
    [half - s * 0.06, s * 0.75], [half + s * 0.06, s * 0.75],
    [half - s * 0.06, s * 0.60], [half + s * 0.06, s * 0.60],
    [half - s * 0.06, s * 0.45], [half + s * 0.06, s * 0.45],
    [half - s * 0.22, s * 0.38], [half + s * 0.22, s * 0.38],
    [half - s * 0.12, s * 0.25], [half + s * 0.12, s * 0.25],
    [half, s * 0.14],
  ];

  const makeSpiral = (): [number, number][] =>
    Array.from({ length: 9 }, (_, i): [number, number] => {
      const t = i * 0.7;
      const rr = s * 0.05 + t * s * 0.04;
      return [half + Math.cos(t) * rr, half + Math.sin(t) * rr];
    });

  const makeHeart = (): [number, number][] =>
    Array.from({ length: 10 }, (_, i): [number, number] => {
      const t = (i / 10) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [half + x * s * 0.022, half - y * s * 0.022];
    });

  const makeScatter = (): [number, number][] => {
    let seed = 7;
    const rnd = () => { seed = ((seed * 1664525 + 1013904223) >>> 0); return seed / 0xffffffff; };
    return Array.from({ length: 9 }, (): [number, number] => [s * 0.15 + rnd() * s * 0.7, s * 0.15 + rnd() * s * 0.7]);
  };

  const makeSquareOutline = (): [number, number][] => {
    const pts: [number, number][] = [];
    const m = s * 0.1, M = s * 0.9;
    const n = 3;
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([m + (M - m) * t, m]); }
    for (let i = 1; i <= n; i++) { const t = i / n; pts.push([M, m + (M - m) * t]); }
    for (let i = 1; i <= n; i++) { const t = i / n; pts.push([M - (M - m) * t, M]); }
    for (let i = 1; i < n; i++) { const t = i / n; pts.push([m, M - (M - m) * t]); }
    return pts;
  };

  const makeStaggered = (): [number, number][] => {
    const pts: [number, number][] = [];
    for (let r = 0; r < 3; r++) {
      const off = r % 2 === 1 ? s * 0.15 : 0;
      for (let c = 0; c < 3; c++) pts.push([s * 0.18 + c * s * 0.27 + off, s * 0.2 + r * s * 0.27]);
    }
    return pts;
  };

  const map: Partial<Record<string, () => [number, number][]>> = {
    grid: makeGrid, circle: makeCircle, concentric: makeConc, chevron: makeChev,
    diamond: makeDiamond, line: makeLine, cross: makeCross, star: makeStar,
    arrow: makeArrow, spiral: makeSpiral, heart: makeHeart, scatter: makeScatter,
    'square-outline': makeSquareOutline, 'staggered-rows': makeStaggered,
    custom: () => [[half, half]],
  };

  const pts = (map[kind] ?? makeGrid)();

  return (
    <svg viewBox={`0 0 ${s} ${s}`} width={s} height={s} style={{ display: 'block' }}>
      {dot(pts, kind)}
      {kind === 'custom' && (
        <path
          d={`M ${s * 0.2} ${s * 0.3} Q ${half} ${s * 0.1} ${s * 0.8} ${s * 0.3} T ${s * 0.8} ${s * 0.7} Q ${half} ${s * 0.9} ${s * 0.2} ${s * 0.7} T ${s * 0.2} ${s * 0.3}`}
          stroke={stroke} strokeWidth="0.6" fill="none" opacity="0.5"
        />
      )}
    </svg>
  );
}
