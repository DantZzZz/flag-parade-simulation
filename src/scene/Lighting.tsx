import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useParadeStore } from '../store/useParadeStore';

interface MoodConfig {
  bg: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  ambientColor: string;
  keyColor: string;
  keyIntensity: number;
  rimColor: string;
  rimIntensity: number;
}

const MOODS: Record<string, MoodConfig> = {
  night: {
    bg: '#0b0d10',    fog: '#0b0d10',    fogNear: 30,  fogFar: 90,
    ambientColor: '#ffffff', keyColor: '#bdd0ff', keyIntensity: 0.30,
    rimColor: '#4060a0',     rimIntensity: 0.25,
  },
  golden: {
    bg: '#2a1a12',    fog: '#3a2418',    fogNear: 25,  fogFar: 100,
    ambientColor: '#ffcc99', keyColor: '#ffb070', keyIntensity: 1.10,
    rimColor: '#ff8a4a',     rimIntensity: 0.60,
  },
  day: {
    bg: '#c8d8e8',    fog: '#d4e0ec',    fogNear: 40,  fogFar: 140,
    ambientColor: '#ffffff', keyColor: '#ffffff', keyIntensity: 1.20,
    rimColor: '#cfe0ff',     rimIntensity: 0.40,
  },
  spot: {
    bg: '#05060a',    fog: '#05060a',    fogNear: 20,  fogFar: 70,
    ambientColor: '#ffffff', keyColor: '#ffffff', keyIntensity: 0.08,
    rimColor: '#ffffff',     rimIntensity: 0.30,
  },
};

export default function Lighting() {
  const mood        = useParadeStore((s) => s.plaza.mood);
  const ambient     = useParadeStore((s) => s.plaza.ambient);
  const accentColor = useParadeStore((s) => s.plaza.accentColor);

  const { scene } = useThree();
  const cfg = MOODS[mood] ?? MOODS.night;

  const rimRef = useRef<THREE.DirectionalLight>(null!);

  // Scene background + fog
  useEffect(() => {
    scene.background = new THREE.Color(cfg.bg);
    scene.fog = new THREE.Fog(cfg.fog, cfg.fogNear, cfg.fogFar);
  }, [scene, cfg]);

  return (
    <>
      {/* Ambient */}
      <ambientLight color={cfg.ambientColor} intensity={ambient} />

      {/* Key light */}
      <directionalLight
        color={cfg.keyColor}
        intensity={cfg.keyIntensity}
        position={[10, 18, 8]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0008}
      />

      {/* Rim light */}
      <directionalLight
        ref={rimRef}
        color={mood === 'spot' ? accentColor : cfg.rimColor}
        intensity={cfg.rimIntensity}
        position={[-8, 6, -10]}
      />
    </>
  );
}
