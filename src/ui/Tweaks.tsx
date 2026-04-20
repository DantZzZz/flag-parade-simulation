import { useEffect, useState } from 'react';
import { useParadeStore } from '../store/useParadeStore';

const ACCENTS: [string, string][] = [
  ['#e6b34a', 'gold'],
  ['#d86a5b', 'ember'],
  ['#6fbf8e', 'sage'],
  ['#7da8d4', 'sky'],
  ['#c9a0d8', 'lilac'],
  ['#ece6d5', 'bone'],
];

export default function Tweaks() {
  const [visible, setVisible] = useState(false);
  const accent          = useParadeStore(s => s.tweaks.accent);
  const timelineDensity = useParadeStore(s => s.tweaks.timelineDensity);
  const setTweaks       = useParadeStore(s => s.setTweaks);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data?.type) return;
      if (e.data.type === '__activate_edit_mode') setVisible(true);
      else if (e.data.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!visible) return null;

  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginBottom: 6 }}>Accent color</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ACCENTS.map(([c, name]) => (
            <div key={c} title={name}
              onClick={() => setTweaks({ accent: c })}
              style={{
                width: 26, height: 26, borderRadius: 6, background: c, cursor: 'pointer',
                border: accent === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginBottom: 6 }}>Timeline density</div>
        <div className="chip-row">
          {(['compact', 'comfortable', 'spacious'] as const).map(d => (
            <button key={d}
              className={`chip${timelineDensity === d ? ' active' : ''}`}
              onClick={() => setTweaks({ timelineDensity: d })}>
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
