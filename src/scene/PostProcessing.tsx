import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useParadeStore } from '../store/useParadeStore';

export default function PostProcessing() {
  const mood       = useParadeStore((s) => s.plaza.mood);
  const dofEnabled = useParadeStore((s) => s.camera.dofEnabled);

  const bloomIntensity =
    mood === 'night'  ? 0.30 :
    mood === 'spot'   ? 0.55 :
    mood === 'golden' ? 0.18 :
    0.08;

  const bloomThreshold =
    mood === 'spot'   ? 0.55 :
    mood === 'night'  ? 0.70 :
    0.85;

  if (dofEnabled) {
    return (
      <EffectComposer enableNormalPass={false}>
        <DepthOfField focusDistance={0.018} focalLength={0.06} bokehScale={4} height={480} />
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
