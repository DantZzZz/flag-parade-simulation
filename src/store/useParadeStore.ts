import { create } from 'zustand';
import type {
  AccentSpotMode,
  Formation,
  FormationShape,
  Plaza,
  SavedCustomFormation,
  TimelineState,
  Tweaks,
} from './types';

const uid = () => Math.random().toString(36).slice(2, 9);

function makeInitialFormation(): Formation {
  return {
    id: uid(),
    name: 'Grand Opening',
    shape: 'grid',
    count: 200,
    spacing: 1.8,
    rotation: 0,
    start: 0,
    duration: 8,
    center: { x: 0, z: 0 },
    path: null,
    action: 'hold',
    transformTo: null,
    splitInto: null,
    mergeFrom: null,
    flag: {
      pattern: 'horizontal',
      primary: '#b83434',
      secondary: '#ece6d5',
    },
    tempo: 1.0,
  };
}

interface ParadeStore {
  timeline: TimelineState;
  selectedId: string | null;
  plaza: Plaza;
  tweaks: Tweaks;
  savedCustomFormations: SavedCustomFormation[];

  select: (id: string | null) => void;
  updateFormation: (id: string, patch: Partial<Formation>) => void;
  addFormation: (at?: number | null) => Formation;
  splitFormation: (id: string) => void;
  deleteFormation: (id: string) => void;
  recomputeDuration: () => void;
  setPlayhead: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setPlaza: (patch: Partial<Plaza> & { wind?: Partial<Plaza['wind']> }) => void;
  setTweaks: (patch: Partial<Tweaks>) => void;
  syncCssVars: () => void;
  saveCustomFormation: (name: string, points: Array<{ x: number; z: number }>) => void;
  deleteCustomFormation: (id: string) => void;
  loadCustomFormation: (id: string) => void;
}

const initialFormation = makeInitialFormation();

export const useParadeStore = create<ParadeStore>((set, get) => ({
  savedCustomFormations: [],
  timeline: {
    formations: [initialFormation],
    playhead: 0,
    playing: false,
    duration: 40,
    pxPerSec: 28,
  },
  selectedId: initialFormation.id,
  plaza: {
    ground: 'grid',
    size: 'medium',
    shape: 'square',
    ambient: 0.35,
    mood: 'night',
    spotlight: true,
    bearerColor: '#1a2030',
    accentColor: '#d4c5a0',
    wind: { dir: 45, strength: 0.55 },
    groundReflectivity: 0.35,
    accentSpotMode: 'off',
    accentSpotSpeed: 0.5,
  },
  tweaks: {
    accent: '#e6b34a',
    timelineDensity: 'comfortable',
  },

  select: (id) => set({ selectedId: id }),

  updateFormation: (id, patch) =>
    set((s) => ({
      timeline: {
        ...s.timeline,
        formations: s.timeline.formations.map((f) =>
          f.id === id
            ? {
                ...f,
                ...patch,
                flag: patch.flag ? { ...f.flag, ...patch.flag } : f.flag,
              }
            : f,
        ),
      },
    })),

  addFormation: (at = null) => {
    const existing = get().timeline.formations;
    const start =
      at != null
        ? at
        : existing.length
          ? Math.max(...existing.map((f) => f.start + f.duration)) + 0.5
          : 0;
    const f: Formation = {
      id: uid(),
      name: `Formation ${existing.length + 1}`,
      shape: 'circle',
      count: 200,
      spacing: 1.8,
      rotation: 0,
      start,
      duration: 6,
      center: { x: 4, z: 0 },
      path: null,
      action: 'hold',
      transformTo: null,
      splitInto: null,
      mergeFrom: null,
      flag: { pattern: 'solid', primary: '#3e5a8a', secondary: '#ece6d5' },
      tempo: 1.0,
    };
    set((s) => ({
      timeline: { ...s.timeline, formations: [...s.timeline.formations, f] },
      selectedId: f.id,
    }));
    get().recomputeDuration();
    return f;
  },

  splitFormation: (id) => {
    const state = get();
    const f = state.timeline.formations.find((x) => x.id === id);
    if (!f) return;
    const t = f.start + f.duration;
    const a: Formation = {
      id: uid(),
      name: `${f.name} · A`,
      shape: 'chevron',
      count: Math.ceil(f.count / 2),
      spacing: f.spacing,
      rotation: -15,
      start: t + 0.3,
      duration: 6,
      center: { x: f.center.x - 4, z: f.center.z + 2 },
      path: null,
      action: 'hold',
      transformTo: null,
      splitInto: null,
      mergeFrom: [id],
      flag: { ...f.flag },
      tempo: f.tempo,
    };
    const b: Formation = {
      id: uid(),
      name: `${f.name} · B`,
      shape: 'chevron',
      count: Math.floor(f.count / 2),
      spacing: f.spacing,
      rotation: 15,
      start: t + 0.3,
      duration: 6,
      center: { x: f.center.x + 4, z: f.center.z + 2 },
      path: null,
      action: 'hold',
      transformTo: null,
      splitInto: null,
      mergeFrom: [id],
      flag: { ...f.flag },
      tempo: f.tempo,
    };
    set((s) => ({
      timeline: {
        ...s.timeline,
        formations: s.timeline.formations.map((x) =>
          x.id === id
            ? { ...x, action: 'split' as const, splitInto: [a.id, b.id] }
            : x,
        ).concat([a, b]),
      },
    }));
    get().recomputeDuration();
  },

  deleteFormation: (id) =>
    set((s) => {
      const remaining = s.timeline.formations
        .filter((f) => f.id !== id)
        .map((f) => ({
          ...f,
          splitInto: f.splitInto ? f.splitInto.filter((x) => x !== id) : null,
          mergeFrom: f.mergeFrom ? f.mergeFrom.filter((x) => x !== id) : null,
        }));
      return {
        timeline: { ...s.timeline, formations: remaining },
        selectedId:
          s.selectedId === id ? (remaining[0]?.id ?? null) : s.selectedId,
      };
    }),

  recomputeDuration: () =>
    set((s) => {
      const last = s.timeline.formations.reduce(
        (m, f) => Math.max(m, f.start + f.duration),
        0,
      );
      return {
        timeline: { ...s.timeline, duration: Math.max(40, Math.ceil(last + 5)) },
      };
    }),

  setPlayhead: (t) =>
    set((s) => ({
      timeline: {
        ...s.timeline,
        playhead: Math.max(0, Math.min(s.timeline.duration, t)),
      },
    })),

  setPlaying: (p) =>
    set((s) => ({ timeline: { ...s.timeline, playing: p } })),

  setPlaza: (patch) =>
    set((s) => ({
      plaza: {
        ...s.plaza,
        ...patch,
        wind: patch.wind ? { ...s.plaza.wind, ...patch.wind } : s.plaza.wind,
      },
    })),

  setTweaks: (patch) => {
    set((s) => ({ tweaks: { ...s.tweaks, ...patch } }));
    get().syncCssVars();
  },

  saveCustomFormation: (name, points) =>
    set((s) => ({
      savedCustomFormations: [
        ...s.savedCustomFormations,
        { id: uid(), name, points },
      ],
    })),

  deleteCustomFormation: (id) =>
    set((s) => ({
      savedCustomFormations: s.savedCustomFormations.filter((f) => f.id !== id),
    })),

  loadCustomFormation: (id) => {
    const { selectedId, savedCustomFormations } = get();
    if (!selectedId) return;
    const saved = savedCustomFormations.find((f) => f.id === id);
    if (!saved) return;
    get().updateFormation(selectedId, { shape: 'custom', customPoints: saved.points });
  },

  syncCssVars: () => {
    const { accent, timelineDensity } = get().tweaks;
    document.documentElement.style.setProperty('--accent', accent);
    const h =
      timelineDensity === 'compact'
        ? 80
        : timelineDensity === 'spacious'
          ? 160
          : 120;
    const px =
      timelineDensity === 'compact'
        ? 56
        : timelineDensity === 'spacious'
          ? 100
          : 80;
    document.documentElement.style.setProperty('--timeline-height', `${h}px`);
    document.documentElement.style.setProperty('--tick-spacing', `${px}px`);
  },
}));

export type { AccentSpotMode, Formation, FormationShape, Plaza, SavedCustomFormation, Tweaks };
