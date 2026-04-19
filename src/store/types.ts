export type FormationShape =
  | 'grid'
  | 'circle'
  | 'chevron'
  | 'star'
  | 'triangle'
  | 'line'
  | 'diamond'
  | 'spiral'
  | 'heart'
  | 'arrow'
  | 'ring'
  | 'cross'
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
}

export type Mood = 'night' | 'golden' | 'day' | 'spot';
export type Ground = 'grid' | 'tile' | 'void' | 'marble';
export type PlazaSize = 'small' | 'medium' | 'large';
export type PlazaShape = 'square' | 'round';

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
