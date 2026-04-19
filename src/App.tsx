import { useEffect } from 'react';
import ParadeScene from './scene/ParadeScene';
import DebugPanel from './ui/DebugPanel';
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
        <p>Phase 1 — formations + humanoid bearers</p>
      </div>
      <DebugPanel />
    </div>
  );
}
