// Three.js plaza — instanced bearers, waving flags, scrubbable to timeline playhead.
// Loaded as ES module (uses importmap).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let store; // Resolved at boot() after Babel scripts have defined window.paradeStore

// --- Helpers to evaluate a formation's bearer positions at a given time ---
function evalFormation(f, t) {
  // Base shape-generated local positions for each bearer (relative to center).
  const gen = window.FORMATIONS[f.shape] || window.FORMATIONS.grid;
  const localBase = gen.fn(f.count, { spacing: f.spacing, points: f._customPoints });
  // If action is 'transform' and time > start, interpolate between shape and transformTo
  let local = localBase;
  if (f.action === 'transform' && f.transformTo) {
    const targetGen = window.FORMATIONS[f.transformTo];
    if (targetGen) {
      const targetLocal = targetGen.fn(f.count, { spacing: f.spacing });
      const tt = Math.max(0, Math.min(1, (t - f.start) / f.duration));
      const eased = easeInOut(tt);
      local = localBase.map((p, i) => ({
        x: lerp(p.x, targetLocal[i].x, eased),
        z: lerp(p.z, targetLocal[i].z, eased),
      }));
    }
  }
  // Apply rotation
  const rot = (f.rotation || 0) * Math.PI / 180;
  const cosR = Math.cos(rot), sinR = Math.sin(rot);
  // Center may move if action == 'walk' with path
  let cx = f.center.x, cz = f.center.z;
  if (f.action === 'walk' && f.path && f.path.length > 1) {
    const tt = Math.max(0, Math.min(1, (t - f.start) / f.duration));
    const p = samplePath(f.path, easeInOut(tt));
    cx = p.x; cz = p.z;
  }
  return local.map((p) => ({
    x: cx + p.x * cosR - p.z * sinR,
    z: cz + p.x * sinR + p.z * cosR,
  }));
}

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function samplePath(path, t) {
  // path: array of { x, z } waypoints. t in [0,1]. Returns catmull-like linear interp.
  if (path.length === 1) return path[0];
  const segments = path.length - 1;
  const s = t * segments;
  const i = Math.floor(Math.min(segments - 1, s));
  const frac = s - i;
  const a = path[i], b = path[i + 1];
  return { x: a.x + (b.x - a.x) * frac, z: a.z + (b.z - a.z) * frac };
}

// --- Scene setup ---
let scene, camera, renderer, controls, clock;
let bearerMesh, flagMesh;
let ground, gridHelper;
let tempObj = new THREE.Object3D();
let bearerCapacity = 0;

const BEARER_HEIGHT = 1.8;
const FLAG_W = 1.4, FLAG_H = 0.9;

// Phase offsets, flag phases — stored in typed arrays for stability
let phases = null;

// bearer positions (current x, z) we interpolate each frame toward formation target
let liveX = null, liveZ = null;
let liveVX = null, liveVZ = null; // velocity for flag inertia
let liveFacing = null;

function init(canvas) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0d10');
  scene.fog = new THREE.Fog('#0b0d10', 30, 90);

  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(12, 14, 22);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 1, 0);

  // Lights
  const amb = new THREE.AmbientLight(0xffffff, 0.3);
  amb.name = 'amb';
  scene.add(amb);

  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(10, 18, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -20; key.shadow.camera.right = 20;
  key.shadow.camera.top = 20; key.shadow.camera.bottom = -20;
  key.shadow.bias = -0.0008;
  key.name = 'key';
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xffd2a0, 0.35);
  rim.position.set(-8, 6, -10);
  rim.name = 'rim';
  scene.add(rim);

  const spot = new THREE.SpotLight(0xfff0cc, 1.4, 40, Math.PI / 5, 0.6, 1.2);
  spot.position.set(0, 18, 0);
  spot.target.position.set(0, 0, 0);
  spot.name = 'spot';
  scene.add(spot);
  scene.add(spot.target);

  // Ground
  buildGround('grid', 'medium', 'square');

  // Instanced bearers + flags. Initial capacity = 256, we'll grow if needed.
  bearerCapacity = 256;
  buildBearers(bearerCapacity);

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  onResize();
  animate();
}

function buildGround(style, size, shape) {
  // remove old
  if (ground) { scene.remove(ground); ground.geometry.dispose(); ground.material.dispose(); }
  if (gridHelper) { scene.remove(gridHelper); gridHelper.material.dispose(); gridHelper.geometry.dispose(); gridHelper = null; }

  const dims = { small: 30, medium: 50, large: 80 }[size] || 50;

  let mat;
  if (style === 'grid') {
    mat = new THREE.MeshStandardMaterial({ color: 0x0e1114, roughness: 0.95, metalness: 0.05 });
  } else if (style === 'tile') {
    // checker via procedural shader on top of standard
    const tileTex = makeTileTexture();
    mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tileTex, roughness: 0.7, metalness: 0.1 });
  } else if (style === 'marble') {
    const marbleTex = makeMarbleTexture();
    mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: marbleTex, roughness: 0.35, metalness: 0.2 });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: 0x070809, roughness: 1, metalness: 0 });
  }

  let geo;
  if (shape === 'round') {
    geo = new THREE.CircleGeometry(dims / 2, 64);
  } else {
    geo = new THREE.PlaneGeometry(dims, dims, 1, 1);
  }
  ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  if (style === 'grid' || style === 'void') {
    gridHelper = new THREE.GridHelper(dims, dims / 2, 0x2a3038, 0x1a1d22);
    gridHelper.position.y = 0.005;
    if (style === 'void') gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
  }
}

function makeTileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8e3d6'; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#2e343d';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    if ((x + y) % 2 === 0) ctx.fillRect(x * 64, y * 64, 64, 64);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(512, i * 64); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, 512); ctx.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMarbleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#d8cfbd'); g.addColorStop(1, '#ece6d5');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  // veins
  ctx.strokeStyle = 'rgba(80,70,55,0.25)'; ctx.lineWidth = 1.2;
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    for (let j = 0; j < 6; j++) {
      ctx.quadraticCurveTo(Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildBearers(cap) {
  // remove old
  if (bearerMesh) { scene.remove(bearerMesh); bearerMesh.geometry.dispose(); bearerMesh.material.dispose(); }
  if (flagMesh) { scene.remove(flagMesh); flagMesh.geometry.dispose(); flagMesh.material.dispose(); }

  // Bearer group geometry: merge a capsule body + head into one by using two InstancedMeshes? simpler: use capsule for body+head combined approximation.
  // Use a combined geometry.
  const bodyGeo = new THREE.CapsuleGeometry(0.22, 1.0, 4, 8);
  // Shift so base at y=0
  bodyGeo.translate(0, 0.72, 0);

  // Also add a head as a sphere merged — but BufferGeometryUtils not imported. Use a group via InstancedMesh for body only; the pole can double as a spine.
  const bMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(store.get().plaza.bearerColor),
    roughness: 0.7, metalness: 0.1,
  });
  bMat.name = 'bMat';
  bearerMesh = new THREE.InstancedMesh(bodyGeo, bMat, cap);
  bearerMesh.castShadow = true;
  bearerMesh.frustumCulled = false;
  bearerMesh.count = 0;
  scene.add(bearerMesh);

  // Flag mesh: subdivided plane. We'll set per-instance phase & primary/secondary via instanceColor + custom attribute.
  // For simplicity, one color via instanceColor, pattern baked into texture. (Two colors require shader work.)
  const flagGeo = new THREE.PlaneGeometry(FLAG_W, FLAG_H, 16, 8);
  // Translate so the pole-attached edge is at x=0 (left edge), and flag hangs at top
  flagGeo.translate(FLAG_W / 2, 0, 0);

  // Shader: wave vertices. We encode per-instance phase via an attribute.
  const flagMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWindDir: { value: new THREE.Vector2(1, 0) },
      uWindStrength: { value: 0.5 },
    },
    vertexShader: `
      attribute float aPhase;
      attribute vec3 aPrimary;
      attribute vec3 aSecondary;
      attribute float aPattern; // 0 solid, 1 horizontal, 2 vertical, 3 diagonal, 4 circle, 5 cross
      varying vec2 vUv;
      varying vec3 vPrimary;
      varying vec3 vSecondary;
      varying float vPattern;
      uniform float uTime;
      uniform vec2 uWindDir;
      uniform float uWindStrength;

      void main() {
        vUv = uv;
        vPrimary = aPrimary;
        vSecondary = aSecondary;
        vPattern = aPattern;
        vec3 pos = position;
        // distance from attached edge along x (0 = pole, 1 = tip)
        float attach = clamp(pos.x / ${FLAG_W.toFixed(2)}, 0.0, 1.0);
        float wave = sin(pos.x * 3.0 + uTime * 3.5 + aPhase * 6.28) * 0.18
                   + sin(pos.y * 4.0 + uTime * 2.2 + aPhase * 4.0) * 0.08;
        // flag extends in wind direction when strong
        vec3 displaced = pos;
        displaced.z += wave * attach * uWindStrength * 1.4;
        displaced.x += attach * attach * uWindStrength * 0.3; // stretch
        displaced.y += sin(pos.x * 2.0 + uTime * 1.5) * attach * 0.06;
        vec4 world = instanceMatrix * vec4(displaced, 1.0);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * world;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vPrimary;
      varying vec3 vSecondary;
      varying float vPattern;

      void main() {
        vec3 col = vPrimary;
        if (vPattern < 0.5) {
          col = vPrimary;
        } else if (vPattern < 1.5) {
          col = vUv.y > 0.5 ? vPrimary : vSecondary;
        } else if (vPattern < 2.5) {
          col = vUv.x > 0.5 ? vPrimary : vSecondary;
        } else if (vPattern < 3.5) {
          col = (vUv.x + vUv.y) > 1.0 ? vPrimary : vSecondary;
        } else if (vPattern < 4.5) {
          float d = distance(vUv, vec2(0.5));
          col = d < 0.22 ? vSecondary : vPrimary;
        } else {
          bool cx = abs(vUv.x - 0.5) < 0.12;
          bool cy = abs(vUv.y - 0.5) < 0.18;
          col = (cx || cy) ? vSecondary : vPrimary;
        }
        // slight shading
        col *= (0.85 + vUv.x * 0.15);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });

  flagMesh = new THREE.InstancedMesh(flagGeo, flagMat, cap);
  flagMesh.frustumCulled = false;
  flagMesh.count = 0;

  // Attributes for per-instance phase/color/pattern
  const phaseAttr = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
  const primaryAttr = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
  const secondaryAttr = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
  const patternAttr = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
  flagGeo.setAttribute('aPhase', phaseAttr);
  flagGeo.setAttribute('aPrimary', primaryAttr);
  flagGeo.setAttribute('aSecondary', secondaryAttr);
  flagGeo.setAttribute('aPattern', patternAttr);
  scene.add(flagMesh);

  bearerCapacity = cap;
  phases = new Float32Array(cap);
  liveX = new Float32Array(cap);
  liveZ = new Float32Array(cap);
  liveVX = new Float32Array(cap);
  liveVZ = new Float32Array(cap);
  liveFacing = new Float32Array(cap);
  for (let i = 0; i < cap; i++) {
    phases[i] = Math.random();
    phaseAttr.array[i] = phases[i];
    liveX[i] = (Math.random() - 0.5) * 20;
    liveZ[i] = (Math.random() - 0.5) * 20;
  }
  phaseAttr.needsUpdate = true;
}

// Map pattern string to shader index
const PATTERN_IDX = { solid: 0, horizontal: 1, vertical: 2, diagonal: 3, circle: 4, cross: 5 };

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function onResize() {
  const canvas = renderer.domElement;
  const w = canvas.clientWidth; const h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

// --- Visibility: determine which formations are "active" at time t ---
// A formation is active in its [start, start+duration] window (also we render during holds by anchoring after duration)
function activeFormations(t) {
  const formations = store.get().timeline.formations;
  // For formations whose duration ended, still render in their ending state unless superseded by a transform/split child.
  // Simple logic: sort by start time. For each formation, show it if t >= start AND (t < start+duration OR there's no formation superseding it — i.e., not in splitInto of a formation whose window started before t).
  const active = [];
  const superseded = new Set();
  // Mark parents whose split children have started (parents stop rendering)
  for (const f of formations) {
    if (f.splitInto && f.start + f.duration <= t) {
      // parent finished splitting; don't render parent after that
      // (actually we mark parent as superseded once t exceeds parent's end)
    }
  }
  for (const f of formations) {
    const endT = f.start + f.duration;
    if (t < f.start) continue;
    // If this formation has split into children and we're past its end, skip
    if (f.splitInto && f.splitInto.length && t > endT) continue;
    active.push(f);
  }
  return active;
}

// For smooth scrubbing, we compute TARGET positions at time t for each bearer slot,
// assigning slots deterministically per formation by order.
let currentSlots = []; // array of { x, z, facing, phase, flag }

function computeTargets(t) {
  const actives = activeFormations(t);
  // total bearers needed:
  let total = 0;
  for (const f of actives) total += f.count;
  if (total > bearerCapacity) {
    buildBearers(Math.max(total, bearerCapacity * 2));
  }
  // Build slots
  const slots = [];
  let idx = 0;
  for (const f of actives) {
    const positions = evalFormation(f, t);
    // detect motion: sample slightly earlier and later to get velocity & facing
    let motionPositions = null;
    const dt = 0.05;
    if (f.action === 'walk' || f.action === 'transform') {
      motionPositions = evalFormation(f, Math.min(f.start + f.duration, t + dt));
    }
    const flagPrimary = hexToRgb(f.flag.primary);
    const flagSecondary = hexToRgb(f.flag.secondary);
    const patternIdx = PATTERN_IDX[f.flag.pattern] ?? 0;
    for (let i = 0; i < f.count; i++) {
      const p = positions[i];
      let facing = 0;
      let vx = 0, vz = 0;
      if (motionPositions) {
        const p2 = motionPositions[i];
        vx = (p2.x - p.x) / dt;
        vz = (p2.z - p.z) / dt;
        if (Math.abs(vx) > 0.01 || Math.abs(vz) > 0.01) facing = Math.atan2(vx, vz);
      } else {
        // idle: face formation center or +z
        facing = Math.atan2(-p.x, -p.z) * 0.1; // subtle turn toward center
      }
      slots[idx++] = {
        x: p.x, z: p.z,
        vx, vz,
        facing,
        flagPrimary, flagSecondary, patternIdx,
        tempo: f.tempo || 1.0,
      };
    }
  }
  return slots;
}

// --- Animation loop ---
let lastT = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = store.get().timeline.playhead;
  if (store.get().timeline.playing) {
    const nt = t + dt;
    if (nt >= store.get().timeline.duration) {
      store.setPlaying(false);
      store.setPlayhead(store.get().timeline.duration);
    } else {
      store.setPlayhead(nt);
    }
  }

  controls.update();
  onResize();

  const slots = computeTargets(store.get().timeline.playhead);
  const count = slots.length;
  bearerMesh.count = count;
  flagMesh.count = count;

  const flagGeo = flagMesh.geometry;
  const phaseAttr = flagGeo.getAttribute('aPhase');
  const primaryAttr = flagGeo.getAttribute('aPrimary');
  const secondaryAttr = flagGeo.getAttribute('aSecondary');
  const patternAttr = flagGeo.getAttribute('aPattern');

  const playing = store.get().timeline.playing;
  const globalTempo = 3.8; // steps/sec approx
  const time = performance.now() * 0.001;

  // March tempo animation — y bob + tiny body lean
  for (let i = 0; i < count; i++) {
    const s = slots[i];
    // smooth live position toward target (gives interpolation beyond the per-frame target jump)
    const smooth = Math.min(1, dt * 6);
    liveX[i] = lerp(liveX[i], s.x, 1); // just snap — target already smooth from eval
    liveZ[i] = lerp(liveZ[i], s.z, 1);
    // march bob
    const phase = phases[i];
    const stepT = time * globalTempo * s.tempo + phase * Math.PI * 2;
    const bob = Math.abs(Math.sin(stepT)) * 0.04;
    const lean = Math.sin(stepT) * 0.03;

    tempObj.position.set(liveX[i], bob, liveZ[i]);
    tempObj.rotation.set(lean, s.facing, 0);
    tempObj.scale.set(1, 1, 1);
    tempObj.updateMatrix();
    bearerMesh.setMatrixAt(i, tempObj.matrix);

    // flag — attached at top of bearer, slightly offset, with pole orientation facing bearer
    tempObj.position.set(liveX[i] + Math.sin(s.facing) * 0.22, BEARER_HEIGHT, liveZ[i] + Math.cos(s.facing) * 0.22);
    tempObj.rotation.set(0, s.facing + Math.PI / 2, 0);
    tempObj.scale.set(1, 1, 1);
    tempObj.updateMatrix();
    flagMesh.setMatrixAt(i, tempObj.matrix);

    // flag attrs
    primaryAttr.array[i * 3] = s.flagPrimary[0];
    primaryAttr.array[i * 3 + 1] = s.flagPrimary[1];
    primaryAttr.array[i * 3 + 2] = s.flagPrimary[2];
    secondaryAttr.array[i * 3] = s.flagSecondary[0];
    secondaryAttr.array[i * 3 + 1] = s.flagSecondary[1];
    secondaryAttr.array[i * 3 + 2] = s.flagSecondary[2];
    patternAttr.array[i] = s.patternIdx;
  }
  bearerMesh.instanceMatrix.needsUpdate = true;
  flagMesh.instanceMatrix.needsUpdate = true;
  primaryAttr.needsUpdate = true;
  secondaryAttr.needsUpdate = true;
  patternAttr.needsUpdate = true;

  // Wind uniforms
  const plaza = store.get().plaza;
  const wRad = plaza.wind.dir * Math.PI / 180;
  flagMesh.material.uniforms.uTime.value = time;
  flagMesh.material.uniforms.uWindDir.value.set(Math.cos(wRad), Math.sin(wRad));
  flagMesh.material.uniforms.uWindStrength.value = plaza.wind.strength;

  // Update scene based on plaza state (mood, ambient) — cheap checks
  applyPlaza(plaza);

  renderer.render(scene, camera);
}

let lastPlazaKey = '';
function applyPlaza(plaza) {
  const key = [plaza.mood, plaza.ambient, plaza.ground, plaza.size, plaza.shape, plaza.spotlight, plaza.bearerColor, plaza.accentColor].join('|');
  if (key === lastPlazaKey) return;
  lastPlazaKey = key;

  const amb = scene.getObjectByName('amb');
  const key_ = scene.getObjectByName('key');
  const rim = scene.getObjectByName('rim');
  const spot = scene.getObjectByName('spot');

  amb.intensity = plaza.ambient;

  if (plaza.mood === 'night') {
    scene.background = new THREE.Color('#0b0d10');
    scene.fog.color.set('#0b0d10'); scene.fog.near = 30; scene.fog.far = 90;
    key_.intensity = 0.3; key_.color.set(0xbdd0ff);
    rim.intensity = 0.25; rim.color.set(0x4060a0);
    spot.intensity = plaza.spotlight ? 2.2 : 0;
    spot.color.set(new THREE.Color(plaza.accentColor));
  } else if (plaza.mood === 'golden') {
    scene.background = new THREE.Color('#2a1a12');
    scene.fog.color.set('#3a2418'); scene.fog.near = 25; scene.fog.far = 100;
    key_.intensity = 1.1; key_.color.set(0xffb070);
    rim.intensity = 0.6; rim.color.set(0xff8a4a);
    spot.intensity = plaza.spotlight ? 0.7 : 0; spot.color.set(0xffd2a0);
  } else if (plaza.mood === 'day') {
    scene.background = new THREE.Color('#c8d8e8');
    scene.fog.color.set('#d4e0ec'); scene.fog.near = 40; scene.fog.far = 140;
    key_.intensity = 1.2; key_.color.set(0xffffff);
    rim.intensity = 0.4; rim.color.set(0xcfe0ff);
    spot.intensity = 0;
  } else if (plaza.mood === 'spot') {
    scene.background = new THREE.Color('#05060a');
    scene.fog.color.set('#05060a'); scene.fog.near = 20; scene.fog.far = 70;
    key_.intensity = 0.1; key_.color.set(0xffffff);
    rim.intensity = 0.35; rim.color.set(new THREE.Color(plaza.accentColor));
    spot.intensity = 3.2; spot.color.set(new THREE.Color(plaza.accentColor));
  }

  // bearer color
  if (bearerMesh && bearerMesh.material) {
    bearerMesh.material.color.set(plaza.bearerColor);
  }
  // ground rebuild if changed
  if (plaza._lastGround !== plaza.ground + '|' + plaza.size + '|' + plaza.shape) {
    buildGround(plaza.ground, plaza.size, plaza.shape);
    plaza._lastGround = plaza.ground + '|' + plaza.size + '|' + plaza.shape;
  }
}

function boot() {
  const canvas = document.getElementById('plaza-canvas');
  if (!canvas || !window.paradeStore || !window.FORMATIONS) { setTimeout(boot, 80); return; }
  store = window.paradeStore;
  console.log('[plaza] booting; formations=', Object.keys(window.FORMATIONS).length);
  try { init(canvas); } catch (e) { console.error('[plaza] init failed', e); }
}
// Wait for DOM and deferred script execution
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 100));
else setTimeout(boot, 100);
