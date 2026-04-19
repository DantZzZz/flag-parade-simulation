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

## Phase 2 — Animation & visuals (biggest gaps)

### Marching cadence
- [ ] Global tempo state + master clock (`useParadeStore` slice). Default ~2 Hz step cycle.
- [ ] Per-bearer fixed phase offset (±2-5% of step cycle) assigned at spawn. Preserved across formation changes.
- [ ] Procedural marching driven by `phase = globalTime * tempo * formationTempo + phaseOffset`:
  - [ ] Legs: alternating forward/back hip rotation (sine-wave).
  - [ ] Arms: opposite-phase to legs; flag-holding arm uses reduced amplitude (bracing the pole).
  - [ ] Torso: subtle vertical bob (~1-2% of bearer height).
  - [ ] Head: near-fixed with slight forward tilt.
- [ ] Idle state = marching in place (same animation, zero travel). Default when a formation is holding.
- [ ] Ease-in from idle → marching speed over ~0.5s; ease-out over ~0.5-1s on arrival.

### Flag behavior
- [ ] Flag geometry: subdivide to 20×12 segments (currently 16×8); keep pole-edge translate.
- [ ] Port vertex shader to external `src/shaders/flag.vert` (and `.frag`). Add uniforms & attributes:
  - [ ] `uWindDir` (vec2) — **actually rotate the displacement vector** by wind direction (prototype passes the uniform but doesn't use it to rotate).
  - [ ] `uWindStrength` — scales amplitude and forward extension.
  - [ ] `aPhase` (per-instance, random fixed offset ±5-10% of wave cycle).
  - [ ] `aBearerVelocity` (per-instance vec2) — drives inertia (flag trails behind the bearer's velocity vector, then eases back to wind direction over 1-2s).
  - [ ] `aTurbulence` (per-instance float) — scales frequency and amplitude; driven by bearer acceleration magnitude with exponential decay back to 1.0.
  - [ ] Clamp displacement to zero at the pole-attached edge; scale with distance from pole.
- [ ] Track per-bearer velocity & acceleration on CPU; write to `aBearerVelocity` and `aTurbulence` each frame.
- [ ] Add missing pattern: **Border** (solid fill with contrasting border stripe). Spec lists 7 patterns; prototype has 6.
- [ ] Optional: move pattern-split math into fragment shader with `uSplitRatio` uniform for configurable horizontal/vertical stripe ratios (spec §Flag Appearance).

### Environment & lighting
- [ ] Polish all 4 moods to spec quality (night with spots, golden hour, bright daylight, minimal/abstract). Use R3F `<Environment>` + `<fog>` + directional lights per mood.
- [ ] Polish all 4 ground styles (grid, tile, marble, void); keep prototype's procedural canvas textures, add **ground reflectivity slider** (`MeshReflectorMaterial` from drei) — currently missing.
- [ ] **Formation spotlight**: single overhead spot that **follows the current formation's bounding box center and scales its radius with formation extent**. Currently spot is anchored at (0,18,0). Expose color, intensity, softness.
- [ ] **Accent spotlights** (new — entirely missing in prototype):
  - [ ] Distributed mode: 3-5 auto-positioned spots at front/center/wings of formation. Reposition on formation change.
  - [ ] Roaming mode: 1-2 spots sweeping along a smooth path across the formation. Configurable sweep speed.
  - [ ] Shared low-res shadow map (or shadows disabled on distributed spots).
- [ ] Post-processing pipeline (`@react-three/postprocessing`): subtle bloom, vignette, optional DOF for Close-Up camera preset.

## Phase 3 — Formations & custom editor

- [ ] Collision avoidance during transitions (`src/formations/transition.ts`): simple separation steering — each frame, apply a repulsion force between bearers within ~0.6m, capped so it doesn't fight the target seeking.
- [ ] Custom formation editor (port + extend `CustomShapeEditor`):
  - [ ] "Distribute evenly" button — auto-space selected points along the implied drawn path.
  - [ ] Draggable points (click & drag existing dot to reposition).
  - [ ] Save custom formation to a named entry in local state.
  - [ ] Load saved custom formations from a thumbnail list.
- [ ] Per-formation bearer count limit: raise from current 4-200 slider to spec's **10-500** range. Default 200. Target 60fps at 300, graceful degrade to 500.

## Phase 4 — Camera system (no path recording)

- [ ] `CameraController.tsx` with 3 modes: Orbit (default), Presets, Free-Fly. State in store.
- [ ] **6 camera presets** with smooth animated transitions (use `maath` damping or `@react-spring/three`):
  - [ ] Aerial / Bird's Eye (1)
  - [ ] Ground Level Tracking (2)
  - [ ] Hero Shot (3)
  - [ ] Close-Up (4, with DOF)
  - [ ] Wide Establishing (5)
  - [ ] Diagonal Fly-Over (6)
- [ ] Free-fly mode: WASD + mouse-look, Shift to move faster, scroll adjusts speed, Esc exits.
- [ ] "Save current position" bookmark list (named entries in store, delete/rename).
- [ ] Auto-rotate toggle + speed slider in Orbit mode.
- [ ] Camera-related keyboard shortcuts: 1-6 presets, O orbit, F free-fly, Esc exit free-fly.

## Phase 5 — Timeline choreography (port & polish)

- [ ] Port `timeline.jsx` to R3F-era component. Preserve features: lanes, drag-to-move blocks, drag-edge-to-resize, scrub on ruler, play/pause transport, split/merge connector paths, action badges.
- [ ] Keep split/merge/transform/walk actions. Polish rendering of connector curves.
- [ ] Walk action: replace prototype's linear `samplePath` with Catmull-Rom spline interpolation for smoother curves.
- [ ] Transform action: ensure bearer indices are matched between source and target shape via greedy NN (currently interpolates by index which can cross paths).
- [ ] Collision/overlap hinting: warn in UI when two formations on different lanes share bearers at the same time.
- [ ] Timeline density control (compact/comfortable/spacious) ported from tweaks.

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
