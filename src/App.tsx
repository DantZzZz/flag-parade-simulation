import { useEffect } from 'react';
import ParadeScene from './scene/ParadeScene';
import { useParadeStore } from './store/useParadeStore';

export default function App() {
  const syncCssVars = useParadeStore((s) => s.syncCssVars);

  useEffect(() => {
    syncCssVars();
  }, [syncCssVars]);

  return (
    <div className="app-root">
      <ParadeScene />
      <div className="hud">
        <h1>Flag Parade</h1>
        <p>Phase 0 scaffold — R3F canvas mounted.</p>
      </div>
    </div>
  );
}
