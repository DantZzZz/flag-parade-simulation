import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useParadeStore } from '../store/useParadeStore';
import BearerInstances from './BearerInstances';
import FlagMesh from './FlagMesh';
import Lighting from './Lighting';
import Ground from './Ground';
import SpotlightSystem from './SpotlightSystem';
import PostProcessing from './PostProcessing';

const MOOD_BG: Record<string, string> = {
  night:  '#0b0d10',
  golden: '#2a1a12',
  day:    '#c8d8e8',
  spot:   '#05060a',
};

export default function ParadeScene() {
  const mood = useParadeStore((s) => s.plaza.mood);
  const bg   = MOOD_BG[mood] ?? '#0b0d10';

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        toneMapping: 4, // ACESFilmicToneMapping
        toneMappingExposure: 1.0,
      }}
      camera={{ position: [14, 11, 18], fov: 42, near: 0.1, far: 300 }}
      style={{ background: bg, position: 'absolute', inset: 0 }}
    >
      <Lighting />
      <Ground />
      <SpotlightSystem />
      <BearerInstances />
      <FlagMesh />
      <PostProcessing />

      <OrbitControls
        makeDefault
        target={[0, 0.8, 0]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={120}
        dampingFactor={0.08}
        enableDamping
      />
    </Canvas>
  );
}
