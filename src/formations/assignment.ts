import type { Pt } from './presets';

/**
 * Greedy nearest-neighbor assignment.
 * Returns assignment[i] = index into `targets` for source bearer i.
 * O(n²) — fine for up to 500 bearers.
 */
export function assignTargets(sources: Pt[], targets: Pt[]): number[] {
  const n = Math.min(sources.length, targets.length);
  const used = new Uint8Array(targets.length); // 0 = available
  const result: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const sx = sources[i].x;
    const sz = sources[i].z;
    let best = -1;
    let bestDist = Infinity;

    for (let j = 0; j < targets.length; j++) {
      if (used[j]) continue;
      const dx = sx - targets[j].x;
      const dz = sz - targets[j].z;
      const d = dx * dx + dz * dz;
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }

    result[i] = best;
    if (best >= 0) used[best] = 1;
  }

  return result;
}
