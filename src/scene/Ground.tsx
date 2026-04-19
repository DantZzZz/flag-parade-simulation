import { useMemo } from 'react';
import * as THREE from 'three';
import { Grid, MeshReflectorMaterial } from '@react-three/drei';
import { useParadeStore } from '../store/useParadeStore';

function makeTileTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#e8e3d6';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#2e343d';
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
      if ((x + y) % 2 === 0) ctx.fillRect(x * 64, y * 64, 64, 64);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(512, i * 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, 512); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMarbleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#d8cfbd');
  g.addColorStop(1, '#ece6d5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(80,70,55,0.22)';
  ctx.lineWidth = 1.2;
  // deterministic veins
  const rng = (() => { let s = 99; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; }; })();
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(rng() * 512, rng() * 512);
    for (let j = 0; j < 6; j++)
      ctx.quadraticCurveTo(rng() * 512, rng() * 512, rng() * 512, rng() * 512);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Ground() {
  const ground              = useParadeStore((s) => s.plaza.ground);
  const size                = useParadeStore((s) => s.plaza.size);
  const groundReflectivity  = useParadeStore((s) => s.plaza.groundReflectivity);

  const dims = size === 'small' ? 30 : size === 'large' ? 80 : 50;

  const tileTex   = useMemo(() => (ground === 'tile'   ? makeTileTexture()   : null), [ground]);
  const marbleTex = useMemo(() => (ground === 'marble' ? makeMarbleTexture() : null), [ground]);

  if (ground === 'grid') {
    return (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
          <planeGeometry args={[dims, dims]} />
          <meshStandardMaterial color="#0e1114" roughness={0.95} metalness={0.05} />
        </mesh>
        <Grid
          args={[dims, dims]}
          cellSize={1.8}
          cellThickness={0.4}
          cellColor="#1e2840"
          sectionSize={9}
          sectionThickness={0.8}
          sectionColor="#253050"
          fadeDistance={60}
          fadeStrength={1}
          infiniteGrid
        />
      </>
    );
  }

  if (ground === 'tile' && tileTex) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[dims, dims]} />
        <MeshReflectorMaterial
          map={tileTex}
          color="#ffffff"
          roughness={0.6}
          metalness={0.05}
          mirror={groundReflectivity}
          blur={[400, 100]}
          resolution={512}
          mixBlur={6}
          mixStrength={0.8}
          depthScale={0}
          minDepthThreshold={0.9}
          maxDepthThreshold={1}
        />
      </mesh>
    );
  }

  if (ground === 'marble' && marbleTex) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[dims, dims]} />
        <MeshReflectorMaterial
          map={marbleTex}
          color="#ffffff"
          roughness={0.3}
          metalness={0.15}
          mirror={groundReflectivity}
          blur={[300, 80]}
          resolution={512}
          mixBlur={4}
          mixStrength={1.2}
          depthScale={0}
          minDepthThreshold={0.9}
          maxDepthThreshold={1}
        />
      </mesh>
    );
  }

  // void
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[dims, dims]} />
        <meshStandardMaterial color="#070809" roughness={1} metalness={0} />
      </mesh>
      <Grid
        args={[dims, dims]}
        cellSize={1.8}
        cellThickness={0.2}
        cellColor="#141820"
        sectionSize={9}
        sectionThickness={0.5}
        sectionColor="#1a1e28"
        fadeDistance={40}
        fadeStrength={1.5}
        infiniteGrid
      />
    </>
  );
}
