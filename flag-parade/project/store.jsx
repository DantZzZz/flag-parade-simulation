// Global store (plain pub-sub, no external deps).
// Holds parade state (formations, timeline, plaza options) and notifies subscribers.

const uid = () => Math.random().toString(36).slice(2, 9);

const initialState = () => {
  const f1 = {
    id: uid(),
    name: 'Grand Opening',
    shape: 'grid',
    count: 64,
    spacing: 1.8,
    rotation: 0,
    start: 0, duration: 8,
    center: { x: 0, z: 0 },
    path: null, // if action==walk, path of waypoints
    action: 'hold', // 'hold' | 'walk' | 'transform' | 'split' | 'merge'
    transformTo: null, // target shape when transform
    splitInto: null, // array of child formation ids
    mergeFrom: null,
    flag: {
      pattern: 'horizontal',
      primary: '#b83434',
      secondary: '#ece6d5',
    },
    tempo: 1.0, // 1.0 = standard march
  };
  return {
    timeline: {
      formations: [f1],
      playhead: 0,
      playing: false,
      duration: 40,
      pxPerSec: 28,
    },
    selectedId: f1.id,
    plaza: {
      ground: 'grid', // 'grid' | 'tile' | 'void' | 'marble'
      size: 'medium',  // 'small' | 'medium' | 'large'
      shape: 'square', // 'square' | 'round'
      ambient: 0.35,
      mood: 'night', // 'night' | 'golden' | 'day' | 'spot'
      spotlight: true,
      bearerColor: '#1a2030',
      accentColor: '#d4c5a0',
      wind: { dir: 45, strength: 0.55 },
    },
    tweaks: {
      accent: '#e6b34a',
      timelineDensity: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
    },
    _subs: new Set(),
  };
};

const state = initialState();

const store = {
  get: () => state,
  subscribe(fn) { state._subs.add(fn); return () => state._subs.delete(fn); },
  notify() { state._subs.forEach((fn) => fn(state)); },
  update(mutator) { mutator(state); this.notify(); },
  // helpers
  updateFormation(id, patch) {
    const f = state.timeline.formations.find((x) => x.id === id);
    if (!f) return;
    Object.assign(f, patch);
    if (patch.flag) Object.assign(f.flag, patch.flag);
    this.notify();
  },
  select(id) { state.selectedId = id; this.notify(); },
  addFormation(at = null) {
    const existing = state.timeline.formations;
    const start = at != null ? at : (existing.length ? Math.max(...existing.map((f) => f.start + f.duration)) + 0.5 : 0);
    const f = {
      id: uid(),
      name: `Formation ${existing.length + 1}`,
      shape: 'circle',
      count: 48,
      spacing: 1.8,
      rotation: 0,
      start, duration: 6,
      center: { x: 4, z: 0 },
      path: null,
      action: 'hold',
      transformTo: null,
      splitInto: null, mergeFrom: null,
      flag: { pattern: 'solid', primary: '#3e5a8a', secondary: '#ece6d5' },
      tempo: 1.0,
    };
    existing.push(f);
    state.selectedId = f.id;
    this.recomputeDuration();
    this.notify();
    return f;
  },
  splitFormation(id) {
    const f = state.timeline.formations.find((x) => x.id === id);
    if (!f) return;
    const t = f.start + f.duration;
    const a = {
      id: uid(), name: `${f.name} · A`, shape: 'chevron', count: Math.ceil(f.count / 2), spacing: f.spacing, rotation: -15,
      start: t + 0.3, duration: 6, center: { x: f.center.x - 4, z: f.center.z + 2 },
      path: null, action: 'hold', transformTo: null, splitInto: null, mergeFrom: [id],
      flag: { ...f.flag }, tempo: f.tempo,
    };
    const b = {
      id: uid(), name: `${f.name} · B`, shape: 'chevron', count: Math.floor(f.count / 2), spacing: f.spacing, rotation: 15,
      start: t + 0.3, duration: 6, center: { x: f.center.x + 4, z: f.center.z + 2 },
      path: null, action: 'hold', transformTo: null, splitInto: null, mergeFrom: [id],
      flag: { ...f.flag }, tempo: f.tempo,
    };
    f.action = 'split';
    f.splitInto = [a.id, b.id];
    state.timeline.formations.push(a, b);
    this.recomputeDuration();
    this.notify();
  },
  deleteFormation(id) {
    state.timeline.formations = state.timeline.formations.filter((f) => f.id !== id);
    if (state.selectedId === id) state.selectedId = state.timeline.formations[0]?.id || null;
    // clean up refs
    state.timeline.formations.forEach((f) => {
      if (f.splitInto) f.splitInto = f.splitInto.filter((x) => x !== id);
      if (f.mergeFrom) f.mergeFrom = f.mergeFrom.filter((x) => x !== id);
    });
    this.recomputeDuration();
    this.notify();
  },
  recomputeDuration() {
    const last = state.timeline.formations.reduce((m, f) => Math.max(m, f.start + f.duration), 0);
    state.timeline.duration = Math.max(40, Math.ceil(last + 5));
  },
  setPlayhead(t) {
    state.timeline.playhead = Math.max(0, Math.min(state.timeline.duration, t));
    this.notify();
  },
  setPlaying(p) { state.timeline.playing = p; this.notify(); },
  setPlaza(patch) { Object.assign(state.plaza, patch); if (patch.wind) Object.assign(state.plaza.wind, patch.wind); this.notify(); },
  setTweaks(patch) {
    Object.assign(state.tweaks, patch);
    // reflect to CSS
    document.documentElement.style.setProperty('--accent', state.tweaks.accent);
    const density = state.tweaks.timelineDensity;
    const h = density === 'compact' ? 80 : density === 'spacious' ? 160 : 120;
    const px = density === 'compact' ? 56 : density === 'spacious' ? 100 : 80;
    document.documentElement.style.setProperty('--timeline-height', h + 'px');
    document.documentElement.style.setProperty('--tick-spacing', px + 'px');
    // notify parent for persistence (Tweaks protocol)
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch (e) {}
    this.notify();
  },
};

// Initial CSS var sync
document.documentElement.style.setProperty('--accent', state.tweaks.accent);
document.documentElement.style.setProperty('--timeline-height', '120px');
document.documentElement.style.setProperty('--tick-spacing', '80px');

window.paradeStore = store;
