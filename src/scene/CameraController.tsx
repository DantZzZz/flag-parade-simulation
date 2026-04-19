import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useParadeStore } from '../store/useParadeStore';

const TRANSITION_LAMBDA = 3.5;

export default function CameraController() {
  const { camera } = useThree();
  const orbitRef = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);

  const mode             = useParadeStore((s) => s.camera.mode);
  const autoRotate       = useParadeStore((s) => s.camera.autoRotate);
  const autoRotateSpeed  = useParadeStore((s) => s.camera.autoRotateSpeed);
  const flySpeed         = useParadeStore((s) => s.camera.flySpeed);
  const transitionTo     = useParadeStore((s) => s.camera.transitionTo);
  const pendingBookmark  = useParadeStore((s) => s.camera.pendingBookmarkName);

  const setCameraMode        = useParadeStore((s) => s.setCameraMode);
  const goToPreset           = useParadeStore((s) => s.goToPreset);
  const setFlySpeed          = useParadeStore((s) => s.setFlySpeed);
  const clearTransition      = useParadeStore((s) => s.clearTransition);
  const _commitBookmark      = useParadeStore((s) => s._commitBookmark);

  // Fly input state
  const keysRef      = useRef(new Set<string>());
  const mouseDelta   = useRef({ x: 0, y: 0 });
  const flyYaw       = useRef(0);
  const flyPitch     = useRef(0);

  // Transition state — mutable, not React state
  const transPos     = useRef(new THREE.Vector3());
  const transTarget  = useRef(new THREE.Vector3(0, 0.8, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.8, 0));

  const prevMode = useRef(mode);

  const syncLookAtFromCamera = () => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    currentLookAt.current.copy(camera.position).addScaledVector(dir, 15);
  };

  // Capture new transition target whenever transitionTo changes
  useEffect(() => {
    if (!transitionTo) return;
    syncLookAtFromCamera();
    transPos.current.set(...transitionTo.position);
    transTarget.current.set(...transitionTo.target);
  }, [transitionTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      keysRef.current.add(e.code);

      switch (e.key) {
        case '1': goToPreset('aerial'); break;
        case '2': goToPreset('ground'); break;
        case '3': goToPreset('hero'); break;
        case '4': goToPreset('close-up'); break;
        case '5': goToPreset('wide'); break;
        case '6': goToPreset('diagonal'); break;
        case 'o': case 'O': setCameraMode('orbit'); break;
        case 'f': case 'F': {
          const dir = new THREE.Vector3();
          camera.getWorldDirection(dir);
          flyYaw.current = Math.atan2(-dir.x, -dir.z);
          flyPitch.current = Math.asin(Math.max(-0.99, Math.min(0.99, dir.y)));
          setCameraMode('fly');
          document.body.requestPointerLock();
          break;
        }
        case 'Escape':
          if (mode === 'fly') {
            document.exitPointerLock();
            setCameraMode('orbit');
          }
          break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [mode, camera, goToPreset, setCameraMode]);

  // Pointer lock mouse for fly mode
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        mouseDelta.current.x += e.movementX;
        mouseDelta.current.y += e.movementY;
      }
    };
    const onPointerLockChange = () => {
      if (!document.pointerLockElement && mode === 'fly') {
        setCameraMode('orbit');
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [mode, setCameraMode]);

  // Scroll adjusts fly speed
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (mode !== 'fly') return;
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      setFlySpeed(Math.max(1, Math.min(30, flySpeed + delta)));
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [mode, flySpeed, setFlySpeed]);

  useFrame((_, delta) => {
    // Capture bookmark when requested
    if (pendingBookmark) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const lookAt = camera.position.clone().addScaledVector(dir, 15);
      _commitBookmark(
        pendingBookmark,
        camera.position.toArray() as [number, number, number],
        lookAt.toArray() as [number, number, number],
      );
      return;
    }

    // Sync orbit controls target on first frame after returning to orbit
    if (prevMode.current !== mode) {
      if (mode === 'orbit' && orbitRef.current) {
        orbitRef.current.target.copy(currentLookAt.current);
        orbitRef.current.update();
      }
      prevMode.current = mode;
    }

    // Preset / bookmark transitions
    if (mode === 'preset' && transitionTo) {
      const f = 1 - Math.exp(-TRANSITION_LAMBDA * delta);
      camera.position.lerp(transPos.current, f);
      currentLookAt.current.lerp(transTarget.current, f);
      camera.lookAt(currentLookAt.current);

      if (camera.position.distanceTo(transPos.current) < 0.05) {
        camera.position.copy(transPos.current);
        currentLookAt.current.copy(transTarget.current);
        camera.lookAt(currentLookAt.current);
        clearTransition();
      }
      return;
    }

    // Free-fly
    if (mode === 'fly') {
      const sensitivity = 0.002;
      flyYaw.current -= mouseDelta.current.x * sensitivity;
      flyPitch.current -= mouseDelta.current.y * sensitivity;
      flyPitch.current = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, flyPitch.current));
      mouseDelta.current.x = 0;
      mouseDelta.current.y = 0;

      camera.quaternion.setFromEuler(new THREE.Euler(flyPitch.current, flyYaw.current, 0, 'YXZ'));

      const shift = keysRef.current.has('ShiftLeft') || keysRef.current.has('ShiftRight');
      const speed = flySpeed * (shift ? 3 : 1);
      const moveDir = new THREE.Vector3();
      if (keysRef.current.has('KeyW')) moveDir.z -= 1;
      if (keysRef.current.has('KeyS')) moveDir.z += 1;
      if (keysRef.current.has('KeyA')) moveDir.x -= 1;
      if (keysRef.current.has('KeyD')) moveDir.x += 1;
      if (keysRef.current.has('KeyE')) moveDir.y += 1;
      if (keysRef.current.has('KeyQ')) moveDir.y -= 1;
      if (moveDir.lengthSq() > 0) {
        moveDir.normalize().applyQuaternion(camera.quaternion);
        camera.position.addScaledVector(moveDir, speed * delta);
      }

      // keep currentLookAt in sync for orbit handoff
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      currentLookAt.current.copy(camera.position).addScaledVector(fwd, 15);
    }
  });

  return (
    <OrbitControls
      ref={orbitRef as React.Ref<any>}
      enabled={mode === 'orbit'}
      makeDefault
      target={[0, 0.8, 0]}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={3}
      maxDistance={120}
      dampingFactor={0.08}
      enableDamping
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
    />
  );
}
