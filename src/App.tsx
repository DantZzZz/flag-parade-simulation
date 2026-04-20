import { useCallback, useEffect, useState } from 'react';
import ParadeScene from './scene/ParadeScene';
import Timeline from './ui/Timeline';
import SidebarLeft from './ui/SidebarLeft';
import SidebarRight from './ui/SidebarRight';
import Tweaks from './ui/Tweaks';
import LoadingScreen from './ui/LoadingScreen';
import { useParadeStore } from './store/useParadeStore';

export default function App() {
  const syncCssVars     = useParadeStore(s => s.syncCssVars);
  const playing         = useParadeStore(s => s.timeline.playing);
  const playhead        = useParadeStore(s => s.timeline.playhead);
  const formations      = useParadeStore(s => s.timeline.formations);
  const selectedId      = useParadeStore(s => s.selectedId);
  const setPlaying      = useParadeStore(s => s.setPlaying);
  const setPlayhead     = useParadeStore(s => s.setPlayhead);
  const updateFormation = useParadeStore(s => s.updateFormation);

  const [panelsVisible, setPanelsVisible] = useState(true);

  useEffect(() => { syncCssVars(); }, [syncCssVars]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        setPlaying(!playing);
        break;

      case 'ArrowRight': {
        e.preventDefault();
        const next = formations
          .filter(f => f.start > playhead + 0.05)
          .sort((a, b) => a.start - b.start)[0];
        if (next) setPlayhead(next.start);
        break;
      }

      case 'ArrowLeft': {
        e.preventDefault();
        const prev = formations
          .filter(f => f.start < playhead - 0.05)
          .sort((a, b) => b.start - a.start)[0];
        setPlayhead(prev ? prev.start : 0);
        break;
      }

      case 'h':
      case 'H':
        setPanelsVisible(v => !v);
        break;

      case '+':
      case '=': {
        if (!selectedId) break;
        const f = formations.find(x => x.id === selectedId);
        if (f) updateFormation(selectedId, { count: Math.min(500, f.count + 10) });
        break;
      }

      case '-':
      case '_': {
        if (!selectedId) break;
        const f = formations.find(x => x.id === selectedId);
        if (f) updateFormation(selectedId, { count: Math.max(10, f.count - 10) });
        break;
      }
    }
  }, [playing, playhead, formations, selectedId, setPlaying, setPlayhead, updateFormation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app-root">
      <LoadingScreen />
      <ParadeScene />

      {panelsVisible ? (
        <>
          <div className="topbar">
            <div className="brand">
              <div className="brand-mark" />
              Flag Parade
              <small>Director</small>
            </div>
          </div>
          <SidebarLeft />
          <SidebarRight />
          <Tweaks />
          <Timeline />
        </>
      ) : (
        <div
          className="panels-hidden-indicator"
          onClick={() => setPanelsVisible(true)}
          title="Show panels"
        >
          <span className="keyhint">H</span> show panels
        </div>
      )}
    </div>
  );
}
