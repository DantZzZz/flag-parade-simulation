import { assignTargets } from '../formations/assignment';
import type { Pt } from '../formations/presets';

const MAX_BEARERS = 500;
const BASE_SPEED = 2.5; // m/s

/** Per-bearer speed variation ±3% */
function randSpeedVar(): number {
  return 1 + (Math.random() * 0.06 - 0.03);
}

/**
 * BearerSystem — mutable singleton holding per-frame live state.
 * Positions stored in world space (center already baked in).
 */
export class BearerSystem {
  count = 0;
  // Live world positions
  liveX = new Float32Array(MAX_BEARERS);
  liveZ = new Float32Array(MAX_BEARERS);
  // Assigned targets
  targetX = new Float32Array(MAX_BEARERS);
  targetZ = new Float32Array(MAX_BEARERS);
  // Per-bearer speed multiplier (±3%)
  speedVars = new Float32Array(MAX_BEARERS);
  // Per-bearer random phase offset for marching (filled now, used in Phase 2)
  phaseOffsets = new Float32Array(MAX_BEARERS);

  /** Initialize with a fresh set of world-space positions (snap, no transition). */
  init(positions: Pt[]): void {
    const n = Math.min(positions.length, MAX_BEARERS);
    this.count = n;
    for (let i = 0; i < n; i++) {
      this.liveX[i] = positions[i].x;
      this.liveZ[i] = positions[i].z;
      this.targetX[i] = positions[i].x;
      this.targetZ[i] = positions[i].z;
      this.speedVars[i] = randSpeedVar();
      this.phaseOffsets[i] = Math.random() * Math.PI * 2;
    }
  }

  /**
   * Assign new targets via greedy NN.
   * Call when formation shape/center/rotation changes but count stays the same.
   */
  setTargets(newPositions: Pt[]): void {
    const n = Math.min(this.count, newPositions.length, MAX_BEARERS);
    const sources: Pt[] = [];
    for (let i = 0; i < this.count; i++) {
      sources.push({ x: this.liveX[i], z: this.liveZ[i] });
    }
    const assignment = assignTargets(sources, newPositions.slice(0, n));
    for (let i = 0; i < n; i++) {
      const ti = assignment[i];
      if (ti >= 0) {
        this.targetX[i] = newPositions[ti].x;
        this.targetZ[i] = newPositions[ti].z;
      }
    }
  }

  /**
   * Resize bearer count.
   * Existing bearers keep their live positions + get new NN-assigned targets.
   * New bearers (if count grew) spawn at their target (no transition).
   */
  resize(count: number, newPositions: Pt[]): void {
    const oldCount = this.count;
    const n = Math.min(count, MAX_BEARERS);

    if (n === oldCount) {
      this.setTargets(newPositions);
      return;
    }

    if (n < oldCount) {
      // Shrink: keep first n bearers, reassign targets
      this.count = n;
      this.setTargets(newPositions);
      return;
    }

    // Grow: keep existing, spawn new ones at their targets
    const sources: Pt[] = [];
    for (let i = 0; i < oldCount; i++) {
      sources.push({ x: this.liveX[i], z: this.liveZ[i] });
    }
    // Assign old bearers first
    const assignment = assignTargets(sources, newPositions.slice(0, n));
    for (let i = 0; i < oldCount; i++) {
      const ti = assignment[i];
      if (ti >= 0) {
        this.targetX[i] = newPositions[ti].x;
        this.targetZ[i] = newPositions[ti].z;
      }
    }
    // Spawn new bearers at remaining positions
    const usedTargets = new Set(assignment.filter((t) => t >= 0));
    let newIdx = oldCount;
    for (let j = 0; j < newPositions.length && newIdx < n; j++) {
      if (!usedTargets.has(j)) {
        this.liveX[newIdx] = newPositions[j].x;
        this.liveZ[newIdx] = newPositions[j].z;
        this.targetX[newIdx] = newPositions[j].x;
        this.targetZ[newIdx] = newPositions[j].z;
        this.speedVars[newIdx] = randSpeedVar();
        this.phaseOffsets[newIdx] = Math.random() * Math.PI * 2;
        newIdx++;
      }
    }
    this.count = newIdx;
  }

  /** Advance positions toward targets. Call once per frame with delta time. */
  step(dt: number): void {
    for (let i = 0; i < this.count; i++) {
      const dx = this.targetX[i] - this.liveX[i];
      const dz = this.targetZ[i] - this.liveZ[i];
      const distSq = dx * dx + dz * dz;
      if (distSq < 0.0001) continue;
      const dist = Math.sqrt(distSq);
      const move = Math.min(dist, BASE_SPEED * this.speedVars[i] * dt);
      this.liveX[i] += (dx / dist) * move;
      this.liveZ[i] += (dz / dist) * move;
    }
  }
}

export const bearerSystem = new BearerSystem();
