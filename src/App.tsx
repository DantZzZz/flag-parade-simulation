import { useEffect } from 'react';
import ParadeScene from './scene/ParadeScene';
import Timeline from './ui/Timeline';
import { useParadeStore } from './store/useParadeStore';

export default function App() {
  const syncCssVars = useParadeStore((s) => s.syncCssVars);

  useEffect(() => {
    syncCssVars();
  }, [syncCssVars]);

  return (
    <div className="app-root">
      <ParadeScene />
      <Timeline />
    </div>
  );
}
