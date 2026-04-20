import type { Formation } from '../store/types';

export function assignLanes(formations: Formation[]): Record<string, number> {
  const sorted = [...formations].sort((a, b) => a.start - b.start);
  const tails: number[] = [];
  const map: Record<string, number> = {};
  for (const f of sorted) {
    let placed = false;
    for (let i = 0; i < tails.length; i++) {
      if (tails[i] <= f.start + 0.001) {
        tails[i] = f.start + f.duration;
        map[f.id] = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      tails.push(f.start + f.duration);
      map[f.id] = tails.length - 1;
    }
  }
  return map;
}

// Catmull-Rom spline through pts, t in [0, 1]
export function catmullRomPoint(
  pts: ReadonlyArray<{ x: number; z: number }>,
  t: number,
): { x: number; z: number } {
  if (pts.length === 0) return { x: 0, z: 0 };
  if (pts.length === 1) return { x: pts[0].x, z: pts[0].z };
  const p = [pts[0], ...pts, pts[pts.length - 1]];
  const segs = pts.length - 1;
  const seg = Math.min(Math.floor(t * segs), segs - 1);
  const u = t * segs - seg;
  const p0 = p[seg], p1 = p[seg + 1], p2 = p[seg + 2], p3 = p[seg + 3];
  const u2 = u * u, u3 = u2 * u;
  return {
    x: 0.5 * (2*p1.x + (-p0.x+p2.x)*u + (2*p0.x-5*p1.x+4*p2.x-p3.x)*u2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*u3),
    z: 0.5 * (2*p1.z + (-p0.z+p2.z)*u + (2*p0.z-5*p1.z+4*p2.z-p3.z)*u2 + (-p0.z+3*p1.z-3*p2.z+p3.z)*u3),
  };
}
