import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bearerSystem } from './Bearer';
import { useParadeStore } from '../store/useParadeStore';

const FLAG_W = 1.2;
const FLAG_H = 0.75;
const FLAG_SEG_W = 20;
const FLAG_SEG_H = 12;
const MAX = 500;
const BEARER_H = 2.55; // world Y where flag attaches (top of pole)

const PATTERN_IDX: Record<string, number> = {
  solid: 0, horizontal: 1, vertical: 2,
  diagonal: 3, circle: 4, cross: 5, border: 6,
};

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Full fragment shader (patterns)
const FRAG_FULL = /* glsl */`
  varying vec2 vUv;
  varying vec3 vPrimary;
  varying vec3 vSecondary;
  varying float vPattern;

  void main() {
    vec3 col = vPrimary;
    float p = vPattern;

    if (p < 0.5) {
      // solid
      col = vPrimary;
    } else if (p < 1.5) {
      // horizontal stripes
      col = vUv.y > 0.5 ? vPrimary : vSecondary;
    } else if (p < 2.5) {
      // vertical stripes
      col = vUv.x > 0.5 ? vPrimary : vSecondary;
    } else if (p < 3.5) {
      // diagonal
      col = (vUv.x + vUv.y) > 1.0 ? vPrimary : vSecondary;
    } else if (p < 4.5) {
      // circle emblem
      float d = distance(vUv, vec2(0.5, 0.5));
      col = d < 0.22 ? vSecondary : vPrimary;
    } else if (p < 5.5) {
      // cross
      bool cx = abs(vUv.x - 0.5) < 0.12;
      bool cy = abs(vUv.y - 0.5) < 0.18;
      col = (cx || cy) ? vSecondary : vPrimary;
    } else {
      // border
      bool border = vUv.x < 0.08 || vUv.x > 0.92 || vUv.y < 0.12 || vUv.y > 0.88;
      col = border ? vSecondary : vPrimary;
    }

    // Edge shading — brighter at free tip
    col *= 0.82 + vUv.x * 0.18;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT_FULL = /* glsl */`
  attribute float aPhase;
  attribute vec2  aBearerVelocity;
  attribute float aTurbulence;
  attribute vec3  aPrimary;
  attribute vec3  aSecondary;
  attribute float aPattern;

  varying vec2  vUv;
  varying vec3  vPrimary;
  varying vec3  vSecondary;
  varying float vPattern;

  uniform float uTime;
  uniform vec2  uWindDir;
  uniform float uWindStrength;

  void main() {
    vUv       = uv;
    vPrimary  = aPrimary;
    vSecondary= aSecondary;
    vPattern  = aPattern;

    float attach = uv.x;

    float wave = sin(uv.x * 3.8 + uTime * 3.5 + aPhase * 6.28318) * 0.20
               + sin(uv.y * 4.5 + uTime * 2.2 + aPhase * 3.14)    * 0.06;
    float turb = sin(uv.x * 7.0 + uTime * 5.5 + aPhase * 5.0) * 0.10 * aTurbulence;

    float disp = (wave + turb) * attach * uWindStrength * 1.2;
    vec2  inertia = -aBearerVelocity * 0.12 * attach * attach;

    vec3 displaced = position;
    displaced.z   += disp;
    displaced.x   += attach * attach * uWindStrength * 0.25 + inertia.x;
    displaced.z   += inertia.y;
    displaced.y   += sin(uv.x * 2.5 + uTime * 1.6 + aPhase) * attach * 0.04;

    vec4 world = instanceMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * world;
  }
`;

export default function FlagMesh() {
  const selectedId = useParadeStore((s) => s.selectedId);
  const formations = useParadeStore((s) => s.timeline.formations);
  const wind       = useParadeStore((s) => s.plaza.wind);

  const meshRef = useRef<THREE.InstancedMesh>(null!);

  // Geometry — translate so left edge (pole attach) is at local x=0
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(FLAG_W, FLAG_H, FLAG_SEG_W, FLAG_SEG_H);
    g.translate(FLAG_W / 2, 0, 0); // pole attach at origin
    return g;
  }, []);

  // Per-instance buffer attributes
  const phaseAttr   = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(MAX),     1), []);
  const velAttr     = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(MAX * 2), 2), []);
  const turbAttr    = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(MAX),     1), []);
  const primaryAttr = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3), []);
  const secAttr     = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3), []);
  const patAttr     = useMemo(() => new THREE.InstancedBufferAttribute(new Float32Array(MAX),     1), []);

  useEffect(() => {
    const g = geometry;
    g.setAttribute('aPhase',           phaseAttr);
    g.setAttribute('aBearerVelocity',  velAttr);
    g.setAttribute('aTurbulence',      turbAttr);
    g.setAttribute('aPrimary',         primaryAttr);
    g.setAttribute('aSecondary',       secAttr);
    g.setAttribute('aPattern',         patAttr);

    // Seed phase offsets once
    for (let i = 0; i < MAX; i++) phaseAttr.array[i] = Math.random();
    phaseAttr.needsUpdate = true;
  }, [geometry, phaseAttr, velAttr, turbAttr, primaryAttr, secAttr, patAttr]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   VERT_FULL,
        fragmentShader: FRAG_FULL,
        uniforms: {
          uTime:         { value: 0 },
          uWindDir:      { value: new THREE.Vector2(1, 0) },
          uWindStrength: { value: 0.55 },
        },
        side: THREE.DoubleSide,
      }),
    [],
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Sync flag colors/patterns when formation changes
  useEffect(() => {
    const f = formations.find((x) => x.id === selectedId);
    if (!f) return;
    const [r1, g1, b1] = hexToRgb(f.flag.primary);
    const [r2, g2, b2] = hexToRgb(f.flag.secondary);
    const patIdx = PATTERN_IDX[f.flag.pattern] ?? 0;
    const n = Math.min(bearerSystem.count, MAX);
    for (let i = 0; i < n; i++) {
      primaryAttr.array[i * 3]     = r1;
      primaryAttr.array[i * 3 + 1] = g1;
      primaryAttr.array[i * 3 + 2] = b1;
      secAttr.array[i * 3]         = r2;
      secAttr.array[i * 3 + 1]     = g2;
      secAttr.array[i * 3 + 2]     = b2;
      patAttr.array[i]             = patIdx;
    }
    primaryAttr.needsUpdate = true;
    secAttr.needsUpdate     = true;
    patAttr.needsUpdate     = true;
  }, [selectedId, formations, primaryAttr, secAttr, patAttr]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const n = bearerSystem.count;
    mesh.count = n;

    const t = state.clock.elapsedTime;
    const { liveX, liveZ, yaw, velX, velZ, turbulence } = bearerSystem;

    // Wind uniforms
    const wRad = (wind.dir * Math.PI) / 180;
    material.uniforms.uTime.value         = t;
    material.uniforms.uWindDir.value.set(Math.cos(wRad), Math.sin(wRad));
    material.uniforms.uWindStrength.value = wind.strength;

    for (let i = 0; i < n; i++) {
      const a  = yaw[i];
      const ca = Math.cos(a), sa = Math.sin(a);

      // Flag attaches on bearer's right side, at top of pole
      const ox = 0.22, oz = 0;
      const wx = liveX[i] + ox * ca - oz * sa;
      const wz = liveZ[i] + ox * sa + oz * ca;

      // Rotate flag 90° relative to bearer so it extends sideways
      dummy.position.set(wx, BEARER_H, wz);
      dummy.rotation.set(0, a + Math.PI * 0.5, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Velocity attribute (XZ in flag's local frame)
      velAttr.array[i * 2]     = velX[i];
      velAttr.array[i * 2 + 1] = velZ[i];

      // Turbulence
      turbAttr.array[i] = turbulence[i];
    }

    mesh.instanceMatrix.needsUpdate = true;
    velAttr.needsUpdate             = true;
    turbAttr.needsUpdate            = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX]}
      frustumCulled={false}
    />
  );
}
