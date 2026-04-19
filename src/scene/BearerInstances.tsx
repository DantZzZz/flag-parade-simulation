import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bearerSystem } from './Bearer';
import { generatePositions } from '../formations/presets';
import { useParadeStore } from '../store/useParadeStore';

const MAX = 500;

// Humanoid body offsets (relative to bearer world position, Y from ground)
const LIMBS = {
  torso:    { ox: 0,     oy: 0.90, oz: 0, rx: 0,    ry: 0, rz: 0 },
  head:     { ox: 0,     oy: 1.55, oz: 0, rx: 0,    ry: 0, rz: 0 },
  lArm:     { ox: -0.22, oy: 1.00, oz: 0, rx: 0,    ry: 0, rz:  0.26 },
  rArm:     { ox:  0.22, oy: 1.00, oz: 0, rx: 0,    ry: 0, rz: -0.26 },
  lLeg:     { ox: -0.09, oy: 0.25, oz: 0, rx: 0,    ry: 0, rz: 0 },
  rLeg:     { ox:  0.09, oy: 0.25, oz: 0, rx: 0,    ry: 0, rz: 0 },
  pole:     { ox:  0.20, oy: 1.70, oz: 0, rx: 0,    ry: 0, rz: 0.10 },
} as const;

type LimbKey = keyof typeof LIMBS;

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

  const refs = { torso: torsoRef, head: headRef, lArm: lArmRef, rArm: rArmRef, lLeg: lLegRef, rLeg: rLegRef, pole: poleRef };

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Sync formation → BearerSystem when selected formation changes
  useEffect(() => {
    const f = formations.find((x) => x.id === selectedId);
    if (!f) return;

    const positions = generatePositions(f.shape, f.count, f.spacing, f.rotation, f.center);

    if (bearerSystem.count === 0) {
      bearerSystem.init(positions);
    } else if (bearerSystem.count !== f.count) {
      bearerSystem.resize(f.count, positions);
    } else {
      bearerSystem.setTargets(positions);
    }

    // Update instance counts on meshes
    for (const key of Object.keys(refs) as LimbKey[]) {
      const mesh = refs[key].current;
      if (mesh) mesh.count = bearerSystem.count;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, formations]);

  useFrame((_, dt) => {
    bearerSystem.step(dt);

    const n = bearerSystem.count;
    const { liveX, liveZ } = bearerSystem;

    for (const key of Object.keys(refs) as LimbKey[]) {
      const mesh = refs[key].current;
      if (!mesh) continue;
      const { ox, oy, oz, rx, ry, rz } = LIMBS[key];

      for (let i = 0; i < n; i++) {
        dummy.position.set(liveX[i] + ox, oy, liveZ[i] + oz);
        dummy.rotation.set(rx, ry, rz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const bodyMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: bearerColor, roughness: 0.7, metalness: 0.1 }), [bearerColor]);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5, metalness: 0.2 }), [accentColor]);
  const poleMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c0a060', roughness: 0.4, metalness: 0.5 }), []);

  return (
    <group>
      {/* Torso — capsule (radius, length, capSegs, radSegs) */}
      <instancedMesh ref={torsoRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.14, 0.50, 4, 8]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      {/* Head */}
      <instancedMesh ref={headRef} args={[undefined, undefined, MAX]} castShadow>
        <sphereGeometry args={[0.12, 8, 6]} />
        <primitive object={accentMat} attach="material" />
      </instancedMesh>

      {/* Left arm */}
      <instancedMesh ref={lArmRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.055, 0.40, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      {/* Right arm */}
      <instancedMesh ref={rArmRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.055, 0.40, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      {/* Left leg */}
      <instancedMesh ref={lLegRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.08, 0.45, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      {/* Right leg */}
      <instancedMesh ref={rLegRef} args={[undefined, undefined, MAX]} castShadow>
        <capsuleGeometry args={[0.08, 0.45, 2, 6]} />
        <primitive object={bodyMat} attach="material" />
      </instancedMesh>

      {/* Flag pole */}
      <instancedMesh ref={poleRef} args={[undefined, undefined, MAX]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.60, 5]} />
        <primitive object={poleMat} attach="material" />
      </instancedMesh>
    </group>
  );
}
