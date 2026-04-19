import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useParadeStore } from '../store/useParadeStore';

export default function PostProcessing() {
  const mood = useParadeStore((s) => s.plaza.mood);

  // Tune bloom per mood
  const bloomIntensity =
    mood === 'night'  ? 0.30 :
    mood === 'spot'   ? 0.55 :
    mood === 'golden' ? 0.18 :
    0.08; // day

  const bloomThreshold =
    mood === 'spot'   ? 0.55 :
    mood === 'night'  ? 0.70 :
    0.85;

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.4}
        blendFunction={BlendFunction.ADD}
      />
      <Vignette
        offset={0.38}
        darkness={mood === 'day' ? 0.28 : 0.55}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
