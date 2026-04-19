import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useParadeStore } from '../store/useParadeStore';
import BearerInstances from './BearerInstances';

const MOOD_BG: Record<string, string> = {
  night:  '#0b0f1a',
  golden: '#1a100a',
  day:    '#8ab4d8',
  spot:   '#050608',
};

export default function ParadeScene() {
  const mood    = useParadeStore((s) => s.plaza.mood);
  const ambient = useParadeStore((s) => s.plaza.ambient);
  const bg      = MOOD_BG[mood] ?? '#0b0f1a';

  return (
    <Canvas
      shadows
      camera={{ position: [14, 11, 18], fov: 45, near: 0.1, far: 500 }}
      style={{ background: bg, position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={ambient} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#141922" roughness={0.9} />
      </mesh>

      <Grid
        args={[80, 80]}
        position={[0, 0, 0]}
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

      <BearerInstances />

      <OrbitControls
        makeDefault
        target={[0, 0.8, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={120}
      />
    </Canvas>
  );
}
