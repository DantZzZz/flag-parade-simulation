import { useRef, useState } from 'react';
import { useParadeStore } from '../store/useParadeStore';
import { PRESET_KEYS, CAMERA_PRESETS } from '../scene/cameraPresets';
import type { Ground, Mood, AccentSpotMode, CameraMode, CameraPresetKey } from '../store/types';

const MOODS: [Mood, string][] = [
  ['night', 'Night'], ['golden', 'Golden'], ['day', 'Day'], ['spot', 'Spotlit'],
];
const GROUNDS: Ground[] = ['grid', 'tile', 'marble', 'void'];
const ACCENT_MODES: AccentSpotMode[] = ['off', 'distributed', 'roaming'];
const CAM_MODES: CameraMode[] = ['orbit', 'preset', 'fly'];
const BEARER_SWATCHES = ['#1a2030', '#2b1e18', '#5a5248', '#1c2b1c', '#331a2a', '#ece6d5'];

function WindDial({ dir, onChange }: { dir: number; onChange: (d: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const startDrag = (e: React.MouseEvent) => {
    const move = (ev: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const a = Math.atan2(
        ev.clientY - (rect.top + rect.height / 2),
        ev.clientX - (rect.left + rect.width / 2),
      ) * 180 / Math.PI;
      onChange((a + 360) % 360);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e.nativeEvent);
  };

  const rad = dir * Math.PI / 180;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        ref={ref}
        onMouseDown={startDrag}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '1px solid var(--line-strong)',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.03), transparent 70%)',
          position: 'relative', cursor: 'grab', flexShrink: 0,
        }}
      >
        <svg
          viewBox="-32 -32 64 64"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="0" x2={Math.cos(rad) * 22} y2={Math.sin(rad) * 22}
            stroke="var(--accent)" strokeWidth="1.5" />
          <polygon
            points={`${Math.cos(rad)*26},${Math.sin(rad)*26} ${Math.cos(rad+2.7)*20},${Math.sin(rad+2.7)*20} ${Math.cos(rad-2.7)*20},${Math.sin(rad-2.7)*20}`}
            fill="var(--accent)"
          />
          <circle cx="0" cy="0" r="2" fill="var(--ink-dim)" />
        </svg>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>
        <div style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 500 }}>{Math.round(dir)}°</div>
        <div>wind dir</div>
      </div>
    </div>
  );
}

export default function SidebarLeft() {
  const setPlaza = useParadeStore(s => s.setPlaza);
  const plaza = useParadeStore(s => s.plaza);

  const camMode         = useParadeStore(s => s.camera.mode);
  const activePreset    = useParadeStore(s => s.camera.activePreset);
  const autoRotate      = useParadeStore(s => s.camera.autoRotate);
  const autoRotateSpeed = useParadeStore(s => s.camera.autoRotateSpeed);
  const flySpeed        = useParadeStore(s => s.camera.flySpeed);
  const bookmarks       = useParadeStore(s => s.camera.bookmarks);

  const setCameraMode          = useParadeStore(s => s.setCameraMode);
  const goToPreset             = useParadeStore(s => s.goToPreset);
  const goToBookmark           = useParadeStore(s => s.goToBookmark);
  const setAutoRotate          = useParadeStore(s => s.setAutoRotate);
  const setAutoRotateSpeed     = useParadeStore(s => s.setAutoRotateSpeed);
  const setFlySpeed            = useParadeStore(s => s.setFlySpeed);
  const requestBookmarkCapture = useParadeStore(s => s.requestBookmarkCapture);
  const deleteBookmark         = useParadeStore(s => s.deleteBookmark);
  const renameBookmark         = useParadeStore(s => s.renameBookmark);

  const [bookmarkName, setBookmarkName] = useState('');
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameVal, setRenameVal]       = useState('');

  return (
    <div className="sidebar left">
      <div className="sidebar-header">
        <div className="sidebar-title"><span className="accent-dot" />Plaza</div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)' }}>
          Director
        </span>
      </div>
      <div className="sidebar-body">

        {/* Ground */}
        <div className="section">
          <div className="section-label">Ground</div>
          <div className="chip-row">
            {GROUNDS.map(g => (
              <button key={g} className={`chip${plaza.ground === g ? ' active' : ''}`}
                onClick={() => setPlaza({ ground: g })}>
                {g}
              </button>
            ))}
          </div>
          {(plaza.ground === 'tile' || plaza.ground === 'marble') && (
            <div className="row" style={{ marginTop: 12 }}>
              <label>Reflectivity</label>
              <input type="range" className="slider" min={0} max={1} step={0.05}
                value={plaza.groundReflectivity}
                onChange={e => setPlaza({ groundReflectivity: Number(e.target.value) })} />
              <span className="value">{plaza.groundReflectivity.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Shape & Size */}
        <div className="section">
          <div className="section-label">Shape & Size</div>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            {(['square', 'round'] as const).map(sh => (
              <button key={sh} className={`chip${plaza.shape === sh ? ' active' : ''}`}
                onClick={() => setPlaza({ shape: sh })}>
                {sh}
              </button>
            ))}
          </div>
          <div className="chip-row">
            {(['small', 'medium', 'large'] as const).map(sz => (
              <button key={sz} className={`chip${plaza.size === sz ? ' active' : ''}`}
                onClick={() => setPlaza({ size: sz })}>
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="section">
          <div className="section-label">Mood</div>
          <div className="chip-row">
            {MOODS.map(([k, v]) => (
              <button key={k} className={`chip${plaza.mood === k ? ' active' : ''}`}
                onClick={() => setPlaza({ mood: k })}>
                {v}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <label>Ambient</label>
            <input type="range" className="slider" min={0} max={1} step={0.02}
              value={plaza.ambient}
              onChange={e => setPlaza({ ambient: Number(e.target.value) })} />
            <span className="value">{plaza.ambient.toFixed(2)}</span>
          </div>
          <div className="row">
            <label>Formation spotlight</label>
            <input type="checkbox" checked={plaza.spotlight}
              onChange={e => setPlaza({ spotlight: e.target.checked })} />
          </div>
          <div className="row">
            <label>Spot / accent color</label>
            <div className="color-input">
              <input type="color" value={plaza.accentColor}
                onChange={e => setPlaza({ accentColor: e.target.value })} />
              <span>{plaza.accentColor}</span>
            </div>
          </div>
        </div>

        {/* Accent Spots */}
        <div className="section">
          <div className="section-label">Accent Spots</div>
          <div className="chip-row">
            {ACCENT_MODES.map(m => (
              <button key={m} className={`chip${plaza.accentSpotMode === m ? ' active' : ''}`}
                onClick={() => setPlaza({ accentSpotMode: m })}>
                {m}
              </button>
            ))}
          </div>
          {plaza.accentSpotMode === 'roaming' && (
            <div className="row" style={{ marginTop: 12 }}>
              <label>Sweep speed</label>
              <input type="range" className="slider" min={0.1} max={2.0} step={0.1}
                value={plaza.accentSpotSpeed}
                onChange={e => setPlaza({ accentSpotSpeed: Number(e.target.value) })} />
              <span className="value">{plaza.accentSpotSpeed.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Wind */}
        <div className="section">
          <div className="section-label">Wind</div>
          <WindDial dir={plaza.wind.dir}
            onChange={d => setPlaza({ wind: { ...plaza.wind, dir: d } })} />
          <div className="row" style={{ marginTop: 12 }}>
            <label>Strength</label>
            <input type="range" className="slider" min={0} max={1.5} step={0.02}
              value={plaza.wind.strength}
              onChange={e => setPlaza({ wind: { ...plaza.wind, strength: Number(e.target.value) } })} />
            <span className="value">{plaza.wind.strength.toFixed(2)}</span>
          </div>
        </div>

        {/* Bearers */}
        <div className="section">
          <div className="section-label">Bearers</div>
          <div className="row">
            <label>Uniform color</label>
            <div className="color-input">
              <input type="color" value={plaza.bearerColor}
                onChange={e => setPlaza({ bearerColor: e.target.value })} />
              <span>{plaza.bearerColor}</span>
            </div>
          </div>
          <div className="swatch-row" style={{ marginTop: 6 }}>
            {BEARER_SWATCHES.map(c => (
              <div key={c}
                className={`swatch${plaza.bearerColor === c ? ' active' : ''}`}
                style={{ background: c }}
                onClick={() => setPlaza({ bearerColor: c })}
              />
            ))}
          </div>
        </div>

        {/* Camera */}
        <div className="section">
          <div className="section-label">Camera</div>
          <div className="chip-row">
            {CAM_MODES.map(m => (
              <button key={m} className={`chip${camMode === m ? ' active' : ''}`}
                onClick={() => {
                  if (m === 'fly') {
                    setCameraMode('fly');
                    document.body.requestPointerLock();
                  } else {
                    setCameraMode(m);
                  }
                }}>
                {m}
              </button>
            ))}
          </div>

          {camMode === 'orbit' && (
            <>
              <div className="row" style={{ marginTop: 12 }}>
                <label>Auto-rotate</label>
                <input type="checkbox" checked={autoRotate}
                  onChange={e => setAutoRotate(e.target.checked)} />
              </div>
              {autoRotate && (
                <div className="row">
                  <label>Speed</label>
                  <input type="range" className="slider" min={0.2} max={5} step={0.1}
                    value={autoRotateSpeed}
                    onChange={e => setAutoRotateSpeed(Number(e.target.value))} />
                  <span className="value">{autoRotateSpeed.toFixed(1)}</span>
                </div>
              )}
            </>
          )}

          {camMode === 'preset' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {(PRESET_KEYS as CameraPresetKey[]).map(key => (
                <button key={key}
                  className={`chip${activePreset === key ? ' active' : ''}`}
                  onClick={() => goToPreset(key)}>
                  {CAMERA_PRESETS[key].label}
                </button>
              ))}
            </div>
          )}

          {camMode === 'fly' && (
            <>
              <div className="row" style={{ marginTop: 12 }}>
                <label>Fly speed</label>
                <input type="range" className="slider" min={1} max={30} step={1}
                  value={flySpeed}
                  onChange={e => setFlySpeed(Number(e.target.value))} />
                <span className="value">{flySpeed} m/s</span>
              </div>
              <div style={{
                fontSize: 10, opacity: 0.5, marginTop: 4,
                fontFamily: 'var(--font-mono)', lineHeight: 1.5,
              }}>
                WASD · Q/E up/down<br />Shift fast · scroll speed · Esc exit
              </div>
            </>
          )}
        </div>

        {/* Camera Bookmarks */}
        <div className="section">
          <div className="section-label">Bookmarks</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            <input
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--line-strong)', borderRadius: 4,
                color: 'inherit', padding: '4px 8px',
                fontSize: 11, fontFamily: 'var(--font-mono)', outline: 'none',
              }}
              placeholder="Bookmark name…"
              value={bookmarkName}
              onChange={e => setBookmarkName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && bookmarkName.trim()) {
                  requestBookmarkCapture(bookmarkName.trim());
                  setBookmarkName('');
                }
              }}
            />
            <button className="tool-btn" onClick={() => {
              if (!bookmarkName.trim()) return;
              requestBookmarkCapture(bookmarkName.trim());
              setBookmarkName('');
            }}>
              Save
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {bookmarks.map(bm => (
              <div key={bm.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {renamingId === bm.id ? (
                  <>
                    <input
                      style={{
                        flex: 1, background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--accent)', borderRadius: 4,
                        color: 'inherit', padding: '3px 6px',
                        fontSize: 11, fontFamily: 'var(--font-mono)', outline: 'none',
                      }}
                      value={renameVal}
                      autoFocus
                      onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { renameBookmark(bm.id, renameVal); setRenamingId(null); }
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                    />
                    <button className="chip"
                      onClick={() => { renameBookmark(bm.id, renameVal); setRenamingId(null); }}>
                      ✓
                    </button>
                  </>
                ) : (
                  <>
                    <button className="chip" style={{ flex: 1, textAlign: 'left' }}
                      onClick={() => goToBookmark(bm.id)}>
                      {bm.name}
                    </button>
                    <button className="chip"
                      onClick={() => { setRenamingId(bm.id); setRenameVal(bm.name); }}>
                      ✎
                    </button>
                    <button className="chip" onClick={() => deleteBookmark(bm.id)}>✕</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
