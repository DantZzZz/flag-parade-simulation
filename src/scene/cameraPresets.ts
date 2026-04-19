import type { CameraPresetKey } from '../store/types';

export interface PresetConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  label: string;
}

export const CAMERA_PRESETS: Record<CameraPresetKey, PresetConfig> = {
  'aerial':   { position: [0, 45, 0.1],   target: [0, 0, 0],    fov: 55, label: '1 · Aerial' },
  'ground':   { position: [22, 1.5, 0],   target: [0, 1.5, 0],  fov: 60, label: '2 · Ground Level' },
  'hero':     { position: [14, 8, 14],    target: [0, 1, 0],    fov: 42, label: '3 · Hero Shot' },
  'close-up': { position: [4, 3, 5],      target: [0, 1.5, 0],  fov: 35, label: '4 · Close-Up' },
  'wide':     { position: [32, 18, 32],   target: [0, 0, 0],    fov: 65, label: '5 · Wide' },
  'diagonal': { position: [22, 20, -18],  target: [0, 1, 0],    fov: 48, label: '6 · Diagonal' },
};

export const PRESET_KEYS: CameraPresetKey[] = [
  'aerial', 'ground', 'hero', 'close-up', 'wide', 'diagonal',
];
