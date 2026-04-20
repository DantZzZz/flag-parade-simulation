import { assignTargets } from '../formations/assignment';
import type { Pt } from '../formations/presets';

const MAX_BEARERS = 500;
const BASE_SPEED = 2.5; // m/s
const TURB_DECAY = 0.92; // per-frame turbulence decay multiplier
const SEP_RADIUS = 0.6; // m — separation trigger distance
const SEP_STRENGTH = 1.5; // m/s equivalent push force

function randSpeedVar(): number {
  return 1 + (Math.random() * 0.06 - 0.03);
}

export class BearerSystem {
  count = 0;

  // World-space positions
  liveX = new Float32Array(MAX_BEARERS);
  liveZ = new Float32Array(MAX_BEARERS);
  targetX = new Float32Array(MAX_BEARERS);
  targetZ = new Float32Array(MAX_BEARERS);

  // Speed variation ±3%
  speedVars = new Float32Array(MAX_BEARERS);

  // March phase offsets (0–2π), fixed at spawn, used for animation
  phaseOffsets = new Float32Array(MAX_BEARERS);

  // Velocity (world m/s) — updated each step(), used by flag shader
  velX = new Float32Array(MAX_BEARERS);
  velZ = new Float32Array(MAX_BEARERS);

  // Turbulence magnitude (0–N), driven by acceleration, decays exponentially
  turbulence = new Float32Array(MAX_BEARERS);

  // Bearer facing angle (radians, Y-rotation), updated while moving
  yaw = new Float32Array(MAX_BEARERS);

  private _prevVelX = new Float32Array(MAX_BEARERS);
  private _prevVelZ = new Float32Array(MAX_BEARERS);

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
      this.velX[i] = 0;
      this.velZ[i] = 0;
      this.turbulence[i] = 0;
      this.yaw[i] = 0;
    }
  }

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

  resize(count: number, newPositions: Pt[]): void {
    const oldCount = this.count;
    const n = Math.min(count, MAX_BEARERS);

    if (n === oldCount) {
      this.setTargets(newPositions);
      return;
    }
    if (n < oldCount) {
      this.count = n;
      this.setTargets(newPositions);
      return;
    }

    const sources: Pt[] = [];
    for (let i = 0; i < oldCount; i++) {
      sources.push({ x: this.liveX[i], z: this.liveZ[i] });
    }
    const assignment = assignTargets(sources, newPositions.slice(0, n));
    for (let i = 0; i < oldCount; i++) {
      const ti = assignment[i];
      if (ti >= 0) {
        this.targetX[i] = newPositions[ti].x;
        this.targetZ[i] = newPositions[ti].z;
      }
    }
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
        this.velX[newIdx] = 0;
        this.velZ[newIdx] = 0;
        this.turbulence[newIdx] = 0;
        this.yaw[newIdx] = 0;
        newIdx++;
      }
    }
    this.count = newIdx;
  }

  setTargetsDirect(positions: Pt[]): void {
    const n = Math.min(this.count, positions.length);
    for (let i = 0; i < n; i++) {
      this.targetX[i] = positions[i].x;
      this.targetZ[i] = positions[i].z;
    }
  }

  step(dt: number): void {
    for (let i = 0; i < this.count; i++) {
      const dx = this.targetX[i] - this.liveX[i];
      const dz = this.targetZ[i] - this.liveZ[i];
      const distSq = dx * dx + dz * dz;

      let vx = 0, vz = 0;
      if (distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const move = Math.min(dist, BASE_SPEED * this.speedVars[i] * dt);
        const nx = dx / dist, nz = dz / dist;
        this.liveX[i] += nx * move;
        this.liveZ[i] += nz * move;
        vx = nx * move / dt;
        vz = nz * move / dt;

        // Smooth yaw toward direction of motion
        const targetYaw = -Math.atan2(dx, dz);
        const dyaw = targetYaw - this.yaw[i];
        // Handle angle wrap
        const wrappedDyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
        this.yaw[i] += wrappedDyaw * Math.min(1, dt * 6);
      }

      // Velocity & turbulence
      const ax = (vx - this._prevVelX[i]) / Math.max(dt, 0.001);
      const az = (vz - this._prevVelZ[i]) / Math.max(dt, 0.001);
      const accelMag = Math.sqrt(ax * ax + az * az);
      this.turbulence[i] = this.turbulence[i] * TURB_DECAY + accelMag * 0.002;
      this.turbulence[i] = Math.min(this.turbulence[i], 3.0);

      this.velX[i] = vx;
      this.velZ[i] = vz;
      this._prevVelX[i] = vx;
      this._prevVelZ[i] = vz;
    }

    // Separation pass — repel bearers that are too close.
    // Cap per-bearer displacement at half the max seek movement so separation
    // never completely overrides target-seeking.
    const sepCap = BASE_SPEED * dt * 0.5;
    const sepRadSq = SEP_RADIUS * SEP_RADIUS;
    for (let i = 0; i < this.count; i++) {
      let sx = 0, sz = 0;
      for (let j = 0; j < this.count; j++) {
        if (i === j) continue;
        const dx = this.liveX[i] - this.liveX[j];
        const dz = this.liveZ[i] - this.liveZ[j];
        const d2 = dx * dx + dz * dz;
        if (d2 < sepRadSq && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const force = (1 - d / SEP_RADIUS) * SEP_STRENGTH * dt;
          sx += (dx / d) * force;
          sz += (dz / d) * force;
        }
      }
      const mag = Math.sqrt(sx * sx + sz * sz);
      if (mag > sepCap) {
        const inv = sepCap / mag;
        sx *= inv;
        sz *= inv;
      }
      this.liveX[i] += sx;
      this.liveZ[i] += sz;
    }
  }
}

export const bearerSystem = new BearerSystem();
