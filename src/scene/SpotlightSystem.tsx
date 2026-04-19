import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { bearerSystem } from './Bearer';
import { useParadeStore } from '../store/useParadeStore';

const SPOT_HEIGHT = 22;
const LERP_SPEED  = 2.5; // how fast spotlight follows formation center

export default function SpotlightSystem() {
  const spotlight    = useParadeStore((s) => s.plaza.spotlight);
  const accentColor  = useParadeStore((s) => s.plaza.accentColor);
  const mood         = useParadeStore((s) => s.plaza.mood);

  const spotRef      = useRef<THREE.SpotLight>(null!);
  const targetRef    = useRef<THREE.Object3D>(null!);

  // Spotlight intensity per mood
  const intensity =
    !spotlight    ? 0   :
    mood === 'spot'   ? 3.5 :
    mood === 'night'  ? 2.2 :
    mood === 'golden' ? 0.8 :
    0; // day: no spot

  useFrame((_, dt) => {
    const spot = spotRef.current;
    const target = targetRef.current;
    if (!spot || !target || bearerSystem.count === 0) return;

    // Compute formation bounding box center from live positions
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    const n = bearerSystem.count;
    for (let i = 0; i < n; i++) {
      const x = bearerSystem.liveX[i];
      const z = bearerSystem.liveZ[i];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) * 0.5;
    const cz = (minZ + maxZ) * 0.5;

    // Formation extent → cone angle
    const extentX = maxX - minX;
    const extentZ = maxZ - minZ;
    const radius  = Math.max(4, Math.sqrt(extentX * extentX + extentZ * extentZ) * 0.5 + 2);
    const angle   = Math.atan2(radius, SPOT_HEIGHT);

    // Smooth follow
    const alpha = Math.min(1, LERP_SPEED * dt);
    spot.position.x += (cx  - spot.position.x) * alpha;
    spot.position.z += (cz  - spot.position.z) * alpha;
    spot.position.y  = SPOT_HEIGHT;

    target.position.x += (cx - target.position.x) * alpha;
    target.position.z += (cz - target.position.z) * alpha;
    target.position.y  = 0;

    spot.angle    = Math.min(Math.PI / 3, angle);
    spot.penumbra = 0.55;
  });

  return (
    <group>
      <spotLight
        ref={spotRef}
        color={accentColor}
        intensity={intensity}
        distance={60}
        angle={Math.PI / 5}
        penumbra={0.55}
        decay={1.2}
        position={[0, SPOT_HEIGHT, 0]}
        castShadow={false}
      />
      <object3D ref={targetRef} position={[0, 0, 0]} />
    </group>
  );
}
