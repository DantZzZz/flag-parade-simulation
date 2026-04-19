import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useParadeStore } from '../store/useParadeStore';

export default function ParadeScene() {
  const mood = useParadeStore((s) => s.plaza.mood);
  const ambient = useParadeStore((s) => s.plaza.ambient);
  const bg = MOOD_BG[mood];

  return (
    <Canvas
      shadows
      camera={{ position: [12, 10, 16], fov: 45 }}
      style={{ background: bg }}
    >
      <ambientLight intensity={ambient} />
      <directionalLight position={[8, 14, 6]} intensity={1.1} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1b2130" />
      </mesh>
      <gridHelper args={[40, 40, '#2a3550', '#1e2638']} />
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial color="#d4c5a0" />
      </mesh>
      <OrbitControls makeDefault />
    </Canvas>
  );
}

const MOOD_BG: Record<string, string> = {
  night: '#0b0f1a',
  golden: '#2a1a0f',
  day: '#8ab4d8',
  spot: '#050608',
};
