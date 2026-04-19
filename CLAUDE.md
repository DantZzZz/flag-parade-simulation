# Flag Parade Simulation

Interactive 3D flag bearer parade simulator. User is a "director" choreographing stylized humanoid bearers between formations on a parade ground.

## Repo state

Phase 0 scaffold landed. Production build lives at the project root:

- **`src/`** — Vite + React + TS + R3F + Zustand production tree. Canonical code.
- **`package.json` / `vite.config.ts` / `tsconfig.json`** — build tooling at root.
- **`flag-bearer-parade-spec.md`** — source of truth for behavior & visuals (v1 spec).
- **`flag-parade/project/`** — original CDN React + Babel + vanilla Three.js prototype. Reference only; do not create or edit files there.
- **`TODO.md`** — phase-by-phase roadmap. Start here when picking up work.

## Stack

Vite + React 18 + TypeScript + React Three Fiber (`@react-three/fiber`) + `@react-three/drei` + `@react-three/postprocessing` + Zustand + `maath`. GLSL loaded via `vite-plugin-glsl`.

## Scope decisions (locked in, don't relitigate)

- Keep the timeline editor UI; do **not** build the step-through sequence UX (spec's v1 default).
- Keep & polish all 4 moods (night/golden/day/spot) and 4 ground styles (grid/tile/marble/void) as first-class v1 features.
- **Cut from scope**: video export (MediaRecorder), URL-hash sharing, camera path record/playback.

## Running

Production build: `npm install` then `npm run dev` (Vite on `http://localhost:5173`). Use the Claude Code preview tool (`preview_start`) rather than launching manually.

Prototype (reference only): `.claude/launch.json` still has an `http-server` entry pointing at `flag-parade/project/Flag%20Parade.html` on port 8080.

## Key prototype files (reference during migration)

- `plaza.js` — Three.js scene: instanced bearers + flag shader + lighting + mood system.
- `formations.jsx` — 12 shape generators + SVG icons. **Missing from spec**: Square Outline, Staggered Rows.
- `store.jsx` — custom pub-sub store; state shape to preserve when porting to Zustand.
- `timeline.jsx` — timeline editor (blocks/lanes/drag/resize/scrub/split-merge connectors).
- `sidebar-left.jsx` / `sidebar-right.jsx` — plaza and formation-editor controls.
- `styles.css` — glassmorphism styling; CSS variables `--accent`, `--timeline-height`, `--tick-spacing` power live tweaks.

## Gotchas (open)

- Prototype's flag shader passes `uWindDir` but doesn't actually rotate displacement — fix during Phase 2 port.
- Prototype bearer updates snap (`liveX[i] = s.x`) — Phase 1 adds lerp + per-bearer speed variation.
- Formation transitions use index-order assignment, not nearest-neighbor — replace with greedy NN in `src/formations/assignment.ts` (Phase 1).
- `bearerMesh.frustumCulled = false` in prototype — revisit in Phase 7.
- `flag-parade/project/check*.png` are reference screenshots — use for visual regression during port, then delete.

## Platform

Windows 11, bash shell (Git Bash / MSYS style). Use forward slashes in paths; paths with spaces need quoting (`"Flag Parade.html"`).
