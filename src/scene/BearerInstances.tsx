import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bearerSystem } from './Bearer';
import { generatePositions } from '../formations/presets';
import { useParadeStore } from '../store/useParadeStore';

const MAX = 500;
const MARCH_HZ = 2.0; // steps per second (global tempo)

// Limb offsets in bearer-local space (yaw=0 → facing +Z).
// ox/oz rotate with bearer yaw; oy is always vertical.
const LIMBS = {
  torso: { ox: 0,      oy: 0.90, oz: 0, rz: 0 },
  head:  { ox: 0,      oy: 1.55, oz: 0, rz: 0 },
  lArm:  { ox: -0.22,  oy: 1.00, oz: 0, rz:  0.26 },
  rArm:  { ox:  0.22,  oy: 1.00, oz: 0, rz: -0.26 },
  lLeg:  { ox: -0.09,  oy: 0.25, oz: 0, rz: 0 },
  rLeg:  { ox:  0.09,  oy: 0.25, oz: 0, rz: 0 },
  pole:  { ox:  0.22,  oy: 1.70, oz: 0, rz: 0.12 },
} as const;

type LimbKey = keyof typeof LIMBS;
const LIMB_KEYS = Object.keys(LIMBS) as LimbKey[];

export default function BearerInstances() {
  const selectedId  = useParadeStore((s) => s.selectedId);
  const formations  = useParadeStore((s) => s.timeline.formations);
  const bearerColor = useParadeStore((s) => s.plaza.bearerColor);
  const accentColor = useParadeStore((s) => s.plaza.accentColor);

  const torsoRef = useRef<THREE.InstancedMesh>(null!);
  const headRef  = useRef<THREE.InstancedMesh>(null!);
  const lArmRef  = useRef<THREE.InstancedMesh>(null!);
  const rArmRef  = useRef<THREE.InstancedMesh>(null!);
  const lLegRef  = useRef<THREE.InstancedMesh>(null!);
  const rLegRef  = useRef<THREE.InstancedMesh>(null!);
  const poleRef  = useRef<THREE.InstancedMesh>(null!);

  const meshRefs: Record<LimbKey, React.RefObject<THREE.InstancedMesh>> = {
    torso: torsoRef, head: headRef,
    lArm: lArmRef,  rArm: rArmRef,
    lLeg: lLegRef,  rLeg: rLegRef,
    pole: poleRef,
  };

  const dummy = useMemo(() => {
    const o = new THREE.Object3D();
    o.rotation.order = 'YXZ'; // yaw → march → tilt
    return o;
  }, []);

  useEffect(() => {
    const f = formations.find((x) => x.id === selectedId);
    if (!f) return;
    const positions = generatePositions(f.shape, f.count, f.spacing, f.rotation, f.center, f.customPoints);
    if (bearerSystem.count === 0) {
      bearerSystem.init(positions);
    } else if (bearerSystem.count !== f.count) {
      bearerSystem.resize(f.count, positions);
    } else {
      bearerSystem.setTargets(positions);
    }
    for (const key of LIMB_KEYS) {
      const m = meshRefs[key].current;
      if (m) m.count = bearerSystem.count;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, formations]);

  useFrame((state, dt) => {
    bearerSystem.step(dt);

    const n = bearerSystem.count;
    if (n === 0) return;

    const t = state.clock.elapsedTime;
    const { liveX, liveZ, yaw, phaseOffsets } = bearerSystem;

    for (let i = 0; i < n; i++) {
      const wx = liveX[i];
      const wz = liveZ[i];
      const a = yaw[i];
      const ca = Math.cos(a), sa = Math.sin(a);

      // March phase for this bearer
      const phase = t * Math.PI * 2 * MARCH_HZ + phaseOffsets[i];
      const bob   = Math.abs(Math.sin(phase)) * 0.028; // vertical body bob
      const lean  = Math.sin(phase) * 0.025;           // slight forward lean

      // Per-limb march rotations (X = forward/back swing)
      const marchRx: Record<LimbKey, number> = {
        torso:  lean,
        head:   0.08,                        // constant slight forward tilt
        lArm:  -Math.sin(phase) * 0.30,
        rArm:   Math.sin(phase) * 0.12,     // reduced — holding pole
        lLeg:   Math.sin(phase) * 0.45,
        rLeg:  -Math.sin(phase) * 0.45,
        pole:   0,
      };

      for (const key of LIMB_KEYS) {
        const { ox, oy, oz, rz } = LIMBS[key];

        // Rotate local offset by bearer yaw
        const wx2 = wx + ox * ca - oz * sa;
        const wz2 = wz + ox * sa + oz * ca;
        const wy  = oy + (key === 'torso' || key === 'head' || key === 'lArm' || key === 'rArm' || key === 'pole' ? bob : 0);

        dummy.position.set(wx2, wy, wz2);
        dummy.rotation.set(marchRx[key], a, rz);
        dummy.updateMatrix();
        meshRefs[key].current?.setMatrixAt(i, dummy.matrix);
      }
    }

    for (const key of LIMB_KEYS) {
      const m = meshRefs[key].current;
      if (!m) continue;
      m.count = n;
      m.instanceMatrix.needsUpdate = true;
    }
  });

  const bodyMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: bearerColor, roughness: 0.7, metalness: 0.1 }), [bearerColor]);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5, metalness: 0.2 }), [accentColor]);
  const poleMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b89850', roughness: 0.35, metalness: 0.6 }), []);

  return (
    <group frustumCulled={false}>
      <instancedMesh ref={torsoRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.14, 0.50, 4, 8]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      <instancedMesh ref={headRef} args={[undefined, undefined, MAX]} castShadow>
        <sphereGeometry args={[0.12, 8, 6]} />
        <primitive object={accentMat} attach="material" />
      </instancedMesh>

      <instancedMesh ref={lArmRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.055, 0.38, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      <instancedMesh ref={rArmRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.055, 0.38, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      <instancedMesh ref={lLegRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.08, 0.44, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      <instancedMesh ref={rLegRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.08, 0.44, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      <instancedMesh ref={poleRef} args={[undefined, undefined, MAX]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.60, 5]} />
        <primitive object={poleMat} attach="material" />
      </instancedMesh>
    </group>
  );
}
