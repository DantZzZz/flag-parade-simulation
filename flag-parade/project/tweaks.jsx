// Tweaks panel — host-integrated edit mode.

const { useState: useStateT, useEffect: useEffectT } = React;

function Tweaks() {
  const store = window.paradeStore;
  const [visible, setVisible] = useStateT(false);
  const [, setTick] = useStateT(0);
  useEffectT(() => store.subscribe(() => setTick((x) => x + 1)), []);

  useEffectT(() => {
    const onMsg = (e) => {
      if (!e.data || !e.data.type) return;
      if (e.data.type === '__activate_edit_mode') setVisible(true);
      else if (e.data.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!visible) return null;
  const s = store.get();
  const t = s.tweaks;

  const accents = [
    ['#e6b34a', 'gold'],
    ['#d86a5b', 'ember'],
    ['#6fbf8e', 'sage'],
    ['#7da8d4', 'sky'],
    ['#c9a0d8', 'lilac'],
    ['#ece6d5', 'bone'],
  ];

  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginBottom: 6 }}>Accent color</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {accents.map(([c, name]) => (
            <div key={c}
              onClick={() => store.setTweaks({ accent: c })}
              title={name}
              style={{
                width: 26, height: 26, borderRadius: 6, background: c,
                cursor: 'pointer', border: t.accent === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginBottom: 6 }}>Timeline density</div>
        <div className="chip-row">
          {['compact', 'comfortable', 'spacious'].map((d) => (
            <button key={d} className={`chip ${t.timelineDensity === d ? 'active' : ''}`}
              onClick={() => store.setTweaks({ timelineDensity: d })}>{d}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Tweaks = Tweaks;
