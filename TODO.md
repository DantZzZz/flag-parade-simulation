# Flag Parade — Implementation TODO

Roadmap from the current prototype (`flag-parade/project/`) to the spec-defined v1+ build.
Spec: `flag-bearer-parade-spec.md`. Existing prototype is reference material; the build target is a new `src/` tree **at the project root** (alongside this file). Do not scaffold inside `flag-parade/`.

**Scope decisions**
- Stack: Vite + React + R3F + Zustand + TypeScript (migrate from CDN/Babel prototype).
- Choreography UI: timeline editor only (port from prototype). No step-through UI.
- Visuals: keep 4 moods + 4 ground styles; polish all to spec quality.
- Cut: video export, URL-hash sharing, camera path record/playback.

---

## Phase 0 — Architecture migration ✅

- [x] Initialize Vite + React + TypeScript project at project root.
- [x] Install deps: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `zustand`, `maath`, `vite-plugin-glsl`.
- [x] Build project structure per spec (`src/main.tsx`, `src/App.tsx`, `src/store/`, `src/scene/`, `src/formations/`, `src/choreography/`, `src/ui/`, `src/shaders/`, `src/utils/`).
- [x] Port `store.jsx` pub-sub store to Zustand (`useParadeStore.ts`). All helpers preserved.
- [x] Add TypeScript interfaces in `src/store/types.ts`.
- [x] Move styles.css into Vite build; CSS variables intact.
- [x] Wire R3F `<Canvas>` in `ParadeScene.tsx`.
- [x] Update CLAUDE.md + `.claude/launch.json`.

## Phase 1 — Core bearers & formations ✅

- [x] Port formation generators to `src/formations/presets.ts` — all 12 existing + new:
  - [x] **Square Outline** (hollow square perimeter)
  - [x] **Staggered Rows** (offset grid / brick pattern)
- [x] Port `ShapeIcon` SVG generator to `src/ui/ShapeIcon.tsx`.
- [x] `BearerInstances.tsx`: 7 R3F `InstancedMesh` objects (torso, head, L/R arms, L/R legs, pole). Per-frame matrix updates via `useFrame`.
- [x] **Humanoid body**: capsule torso + sphere head + capsule arms + capsule legs + cylinder pole. 5–6 separate InstancedMesh, limb offsets applied in JS each frame.
- [x] **Greedy nearest-neighbor assignment** (`src/formations/assignment.ts`): O(n²), replaces index-order.
- [x] **Smooth travel** (`BearerSystem.step`): constant-speed movement toward NN-assigned targets. Formation change → NN reassign → smooth travel.
- [x] Per-bearer ±3% speed variation (assigned at spawn, preserved across formations).

## Phase 2 — Animation & visuals ✅

### Marching cadence
- [x] Per-bearer fixed phase offset (±2-5% of step cycle) assigned at spawn. Preserved across formation changes.
- [x] Procedural marching (`BearerInstances.tsx`, `MARCH_HZ = 2.0`):
  - [x] Legs: alternating forward/back sine-wave rotation.
  - [x] Arms: opposite-phase; flag-holding arm reduced amplitude.
  - [x] Torso: vertical bob (~2.8% of height).
  - [x] Head: constant slight forward tilt.
- [ ] Global tempo state + master clock in store (currently hardcoded 2 Hz). Left for Phase 5/6 polish.
- [ ] Idle ease-in/ease-out (currently instant start/stop). Left for Phase 5/6 polish.

### Flag behavior
- [x] Flag shader ported to `src/shaders/flag.vert` / `.frag`.
- [x] `uWindDir` now **actually rotates displacement vector** (prototype bug fixed).
- [x] `uWindStrength` scales amplitude.
- [x] `aPhase` per-instance random wave offset.
- [x] `aBearerVelocity` per-instance — flag inertia trails bearer velocity.
- [x] `aTurbulence` per-instance — driven by bearer acceleration, exponential decay.
- [x] Pole-edge clamped to zero; displacement scales with distance from pole.
- [x] Per-bearer velocity & acceleration tracked on CPU each frame (`Bearer.ts`).
- [x] **Border** pattern added (7th pattern, solid fill + contrasting border stripe).

### Environment & lighting
- [x] All 4 moods polished (`Lighting.tsx`): night/golden/day/spot with R3F lights + fog.
- [x] All 4 ground styles (`Ground.tsx`): grid/tile/marble/void with procedural canvas textures.
- [x] `MeshReflectorMaterial` on tile + marble grounds; `groundReflectivity` slider exposed in UI.
- [x] Post-processing pipeline: bloom + vignette (`PostProcessing.tsx`).
- [x] **Formation spotlight** tracks live bounding box center + scales cone angle with formation extent (`SpotlightSystem.tsx`).
- [x] **Accent spotlights** (`AccentSpotlights.tsx`): distributed (4 spots N/S/E/W) + roaming (2 spots opposing sine arcs). Mode + sweep speed exposed in UI.

## Phase 3 — Formations & custom editor ✅

- [x] Collision avoidance during transitions (`src/scene/Bearer.ts`): separation steering O(n²) pass — repulsion within 0.6m, capped at 50% of seek speed per frame.
- [x] Custom formation editor (`src/ui/CustomShapeEditor.tsx`):
  - [x] "Distribute evenly" button — arc-length reparameterizes existing points along their polyline path.
  - [x] Draggable points (pointer capture drag); right-click to remove.
  - [x] Save custom formation to named entry in store (`savedCustomFormations`).
  - [x] Load saved custom formations from list (load/delete per entry).
- [x] Per-formation bearer count limit: raised to **10-500** range, step 10. Default 200. `customPoints` field added to `Formation`; `generatePositions` passes them through.

## Phase 4 — Camera system (no path recording) ✅

- [x] `CameraController.tsx` with 3 modes: Orbit (default), Presets, Free-Fly. State in store.
- [x] **6 camera presets** with smooth animated transitions (lerp, lambda 3.5):
  - [x] Aerial / Bird's Eye (1)
  - [x] Ground Level Tracking (2)
  - [x] Hero Shot (3)
  - [x] Close-Up (4, with DOF)
  - [x] Wide Establishing (5)
  - [x] Diagonal Fly-Over (6)
- [x] Free-fly mode: WASD + mouse-look (pointer lock), Shift to move faster, scroll adjusts speed, Esc exits.
- [x] "Save current position" bookmark list (named entries in store, delete/rename).
- [x] Auto-rotate toggle + speed slider in Orbit mode.
- [x] Camera-related keyboard shortcuts: 1-6 presets, O orbit, F free-fly, Esc exit free-fly.

## Phase 5 — Timeline choreography (port & polish) ✅

- [x] Port `timeline.jsx` to R3F-era component (`src/ui/Timeline.tsx`). Lanes, drag-to-move blocks, drag-edge-to-resize, scrub on ruler, play/pause transport, split/merge connector paths, action badges.
- [x] Keep split/merge/transform/walk actions. Bezier connector curves rendered in SVG.
- [x] Walk action: Catmull-Rom spline interpolation (`catmullRomPoint` in `src/utils/timeline.ts`); bearer center sampled per-frame in `BearerInstances.tsx` via `setTargetsDirect` (no NN, same shape translated).
- [x] Transform action: greedy NN assignment via existing `bearerSystem.setTargets()` — NN fires on formation identity change.
- [x] Collision/overlap hinting: overlapping (non-split/merge) formations highlighted with danger border + ⚠ badge.
- [x] Timeline density control (compact/comfortable/spacious) — buttons in toolbar call `setTweaks`.
- [x] Inline transform shape picker replaces `prompt()`.
- [x] Zoom +/- buttons (`setPxPerSec` store action).
- [x] Playhead-driven bearer animation: `BearerInstances.tsx` advances playhead in `useFrame`, finds active formation at `t`, handles walk with Catmull-Rom center.

## Phase 6 — UI polish & keyboard

- [ ] Port all sidebar sections to R3F-era React components, 1:1 feature parity, preserve glassmorphism styling.
- [ ] **Hide-all-panels mode** (`H` key) — 3D canvas fullscreen, show tiny indicator.
- [ ] Keyboard shortcuts per spec (§Keyboard Shortcuts): Space, ←/→, 1-6, O, F, H, +/-, Esc. (Skip R and M — recording and mood cycle are out of scope or handled via UI.)
- [ ] Loading screen / intro animation.
- [ ] Responsive: panels collapse/stack below 1024px viewport; desktop is primary.
- [ ] Tweaks edit-mode integration: preserve `__activate_edit_mode`/`__deactivate_edit_mode` postMessage protocol from `tweaks.jsx`.

## Phase 7 — Performance

- [ ] Profile at 200, 300, 500 bearers. Target 60fps at 300 on a mid-range GPU.
- [ ] LOD system: at 300+ bearers reduce flag subdivisions, disable flag turbulence shader branch, drop spotlight shadow resolution.
- [ ] Move greedy NN assignment to a Web Worker if the main-thread pass exceeds 16ms at 500 bearers.
- [ ] Verify InstancedMesh frustum culling behavior (currently `frustumCulled = false`); consider a manual bounding sphere update per formation.
- [ ] **Update CLAUDE.md** — record actual LOD thresholds that worked (e.g. segment counts, shadow resolution), and note whether the Web Worker was needed. Remove any gotchas that were resolved during this phase.

## Out of scope (explicit cuts)

- Video export (`MediaRecorder`, resolution selection, fixed-framerate capture).
- URL-hash sharing (`pako` compress + base64 encode + auto-play on load + clipboard fallback).
- Camera path recording/playback (keyframe capture during free-fly).
- v2 items: freeform flag designer, AI formation creation, SVG import, particle effects, sound, mobile/touch, cloud save, multiple flag groups.

## Verification

- Run `npm run dev`, load the page, verify the 3D scene renders.
- Add formations via timeline "Add formation" button; drag blocks to re-time; scrub playhead; observe bearers transitioning.
- Switch through all 4 moods and all 4 ground styles in the left sidebar; confirm lighting/post-processing responds.
- Load 200 bearers, 300 bearers, 500 bearers — observe FPS in dev tools; confirm graceful degradation at 500.
- Toggle flag pattern chips; change wind direction via dial; raise wind strength; confirm flag inertia lags bearer velocity during `walk` actions.
- Cycle camera presets 1-6 via keyboard; switch to free-fly (`F`) and navigate with WASD; press `H` to hide UI.
- Exercise split/merge/transform/walk actions on selected formation; confirm bearer counts and paths render correctly.
