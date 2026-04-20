import type { Formation } from '../store/types';
import { catmullRomPoint } from '../utils/timeline';

export function sampleWalkCenter(
  f: Formation,
  playhead: number,
): { x: number; z: number } {
  if (!f.path || f.path.length < 2) return f.center;
  const progress = Math.max(0, Math.min(1, (playhead - f.start) / f.duration));
  return catmullRomPoint(f.path, progress);
}

export function getFormationAtTime(
  formations: Formation[],
  t: number,
): Formation | undefined {
  return formations.find((f) => t >= f.start && t < f.start + f.duration);
}
