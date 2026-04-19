// App entry — mounts UI + plaza canvas.

const { useEffect: useEffectA } = React;

function App() {
  useEffectA(() => {
    // Apply saved tweaks from the defaults block
    try {
      const el = document.getElementById('tweak-defaults');
      const txt = el.textContent.replace(/^[\s\S]*?\{/, '{').replace(/\}[\s\S]*$/, '}');
      const defaults = JSON.parse(txt);
      window.paradeStore.setTweaks(defaults);
    } catch (e) { console.warn('tweak defaults', e); }
  }, []);

  return (
    <div className="app">
      <canvas id="plaza-canvas" className="plaza-canvas" />

      <div className="app-chrome">
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark" />
            <span>Flag Parade</span>
            <small>orchestrator</small>
          </div>
          <div className="topbar-spacer" />
          <div className="pill-group">
            <button className="pill-btn active">Plaza</button>
            <button className="pill-btn">Cameras</button>
            <button className="pill-btn">Export</button>
          </div>
          <div className="pill-group">
            <button className="pill-btn icon-only" title="Record">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#d86a5b"><circle cx="12" cy="12" r="7"/></svg>
            </button>
            <button className="pill-btn icon-only" title="Share">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/></svg>
            </button>
          </div>
        </div>

        <window.SidebarLeft />
        <window.SidebarRight />
        <window.Timeline />
        <window.Tweaks />

        <div className="canvas-status">
          <div>◎ orbit · drag to rotate · scroll to zoom</div>
          <div>▸ press SPACE to play/pause</div>
        </div>
      </div>
    </div>
  );
}

// Wait until all helper globals are in place
function mount() {
  if (!window.SidebarLeft || !window.SidebarRight || !window.Timeline || !window.Tweaks || !window.paradeStore) {
    setTimeout(mount, 30);
    return;
  }
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const store = window.paradeStore;
    if (e.code === 'Space') { e.preventDefault(); store.setPlaying(!store.get().timeline.playing); }
    if (e.code === 'ArrowLeft') store.setPlayhead(store.get().timeline.playhead - 1);
    if (e.code === 'ArrowRight') store.setPlayhead(store.get().timeline.playhead + 1);
  });
}
mount();
