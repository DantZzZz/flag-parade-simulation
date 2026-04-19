export type FormationShape =
  | 'grid'
  | 'circle'
  | 'concentric'
  | 'chevron'
  | 'diamond'
  | 'line'
  | 'cross'
  | 'star'
  | 'arrow'
  | 'spiral'
  | 'heart'
  | 'scatter'
  | 'square-outline'
  | 'staggered-rows'
  | 'custom';

export type FormationAction = 'hold' | 'walk' | 'transform' | 'split' | 'merge';

export type FlagPattern =
  | 'solid'
  | 'horizontal'
  | 'vertical'
  | 'diagonal'
  | 'cross'
  | 'circle'
  | 'border';

export interface FlagSpec {
  pattern: FlagPattern;
  primary: string;
  secondary: string;
}

export interface Waypoint {
  x: number;
  z: number;
}

export interface Formation {
  id: string;
  name: string;
  shape: FormationShape;
  count: number;
  spacing: number;
  rotation: number;
  start: number;
  duration: number;
  center: { x: number; z: number };
  path: Waypoint[] | null;
  action: FormationAction;
  transformTo: FormationShape | null;
  splitInto: string[] | null;
  mergeFrom: string[] | null;
  flag: FlagSpec;
  tempo: number;
  customPoints?: Array<{ x: number; z: number }>;
}

export interface SavedCustomFormation {
  id: string;
  name: string;
  points: Array<{ x: number; z: number }>;
}

export type Mood = 'night' | 'golden' | 'day' | 'spot';
export type Ground = 'grid' | 'tile' | 'void' | 'marble';
export type PlazaSize = 'small' | 'medium' | 'large';
export type PlazaShape = 'square' | 'round';
export type AccentSpotMode = 'off' | 'distributed' | 'roaming';

export interface Plaza {
  ground: Ground;
  size: PlazaSize;
  shape: PlazaShape;
  ambient: number;
  mood: Mood;
  spotlight: boolean;
  bearerColor: string;
  accentColor: string;
  wind: { dir: number; strength: number };
  groundReflectivity: number;
  accentSpotMode: AccentSpotMode;
  accentSpotSpeed: number;
}

export type TimelineDensity = 'compact' | 'comfortable' | 'spacious';

export interface Tweaks {
  accent: string;
  timelineDensity: TimelineDensity;
}

export interface TimelineState {
  formations: Formation[];
  playhead: number;
  playing: boolean;
  duration: number;
  pxPerSec: number;
}

export type CameraMode = 'orbit' | 'preset' | 'fly';
export type CameraPresetKey = 'aerial' | 'ground' | 'hero' | 'close-up' | 'wide' | 'diagonal';

export interface CameraBookmark {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface CameraState {
  mode: CameraMode;
  activePreset: CameraPresetKey | null;
  autoRotate: boolean;
  autoRotateSpeed: number;
  flySpeed: number;
  bookmarks: CameraBookmark[];
  transitionTo: { position: [number, number, number]; target: [number, number, number] } | null;
  dofEnabled: boolean;
  pendingBookmarkName: string | null;
}
