import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { bearerSystem } from './Bearer';
import { useParadeStore } from '../store/useParadeStore';

const SPOT_HEIGHT = 18;
const LERP = 2.5;

export default function AccentSpotlights() {
  const { scene } = useThree();
  const mode  = useParadeStore((s) => s.plaza.accentSpotMode);
  const speed = useParadeStore((s) => s.plaza.accentSpotSpeed);
  const color = useParadeStore((s) => s.plaza.accentColor);
  const mood  = useParadeStore((s) => s.plaza.mood);

  const spotsRef   = useRef<THREE.SpotLight[]>([]);
  const targetsRef = useRef<THREE.Object3D[]>([]);

  // Intensity per mood — dim in bright daylight, strong in night/spot
  const intensity =
    mood === 'spot'   ? 2.0 :
    mood === 'night'  ? 1.4 :
    mood === 'golden' ? 0.9 :
    0.4; // day

  useEffect(() => {
    // Tear down previous lights
    spotsRef.current.forEach((s) => { s.target.removeFromParent(); scene.remove(s); });
    targetsRef.current.forEach((t) => scene.remove(t));
    spotsRef.current = [];
    targetsRef.current = [];

    if (mode === 'off') return;

    const count = mode === 'distributed' ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const target = new THREE.Object3D();
      scene.add(target);

      const spot = new THREE.SpotLight(color, 0);
      spot.target = target;
      spot.castShadow = false;
      spot.angle = Math.PI / 7;
      spot.penumbra = 0.65;
      spot.decay = 1.4;
      spot.distance = 55;
      scene.add(spot);

      spotsRef.current.push(spot);
      targetsRef.current.push(target);
    }

    return () => {
      spotsRef.current.forEach((s) => { s.target.removeFromParent(); scene.remove(s); });
      targetsRef.current.forEach((t) => scene.remove(t));
      spotsRef.current = [];
      targetsRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, mode, color]);

  useFrame((state, dt) => {
    if (mode === 'off' || spotsRef.current.length === 0) return;
    const n = bearerSystem.count;
    if (n === 0) return;

    // Formation bounding box
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = bearerSystem.liveX[i], z = bearerSystem.liveZ[i];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) * 0.5;
    const cz = (minZ + maxZ) * 0.5;
    const extX = maxX - minX;
    const extZ = maxZ - minZ;
    const alpha = Math.min(1, LERP * dt);
    const margin = 4;

    const spots   = spotsRef.current;
    const targets = targetsRef.current;

    if (mode === 'distributed') {
      // N / S / W / E of formation bbox
      const tx = [cx,                   cx,                   cx - extX * 0.5 - margin, cx + extX * 0.5 + margin];
      const tz = [cz - extZ * 0.5 - margin, cz + extZ * 0.5 + margin, cz,               cz];

      for (let i = 0; i < 4; i++) {
        spots[i].position.x   += (tx[i] - spots[i].position.x)   * alpha;
        spots[i].position.y    = SPOT_HEIGHT;
        spots[i].position.z   += (tz[i] - spots[i].position.z)   * alpha;
        targets[i].position.x += (cx - targets[i].position.x)    * alpha;
        targets[i].position.y  = 0;
        targets[i].position.z += (cz - targets[i].position.z)    * alpha;
        spots[i].intensity     = intensity;
        spots[i].color.set(color);
      }
    }

    if (mode === 'roaming') {
      const t = state.clock.elapsedTime;
      const sweepX = (extX * 0.5 + margin) * Math.sin(t * speed);
      const sweepZ = (extZ * 0.5 + margin) * Math.cos(t * speed * 0.65);

      // Two spots on opposing arcs
      const positions = [
        [cx + sweepX,  cz + sweepZ],
        [cx - sweepX,  cz - sweepZ],
      ] as const;

      for (let i = 0; i < 2; i++) {
        spots[i].position.set(positions[i][0], SPOT_HEIGHT, positions[i][1]);
        targets[i].position.set(cx, 0, cz);
        spots[i].intensity = intensity;
        spots[i].color.set(color);
      }
    }
  });

  return null;
}
