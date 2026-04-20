import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [fadeOut, setFadeOut]   = useState(false);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1200);
    const t2 = setTimeout(() => setVisible(false), 1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease',
      pointerEvents: fadeOut ? 'none' : 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-serif)', fontSize: 28, letterSpacing: '0.02em',
        color: 'var(--ink)',
      }}>
        <div style={{
          width: 22, height: 28, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in oklch, var(--accent) 60%, black) 100%)',
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)',
        }} />
        Flag Parade
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)',
        letterSpacing: '0.1em',
      }}>
        loading<span style={{ animation: 'blink 1s infinite' }}>_</span>
      </div>
    </div>
  );
}
