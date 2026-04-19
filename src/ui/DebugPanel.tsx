/**
 * Temporary Phase 1-2 debug panel.
 * Will be replaced by proper sidebar UI in Phase 6.
 */
import ShapeIcon from './ShapeIcon';
import CustomShapeEditor from './CustomShapeEditor';
import { PRESETS } from '../formations/presets';
import { useParadeStore } from '../store/useParadeStore';
import type { PresetKey } from '../formations/presets';
import type { Mood, Ground, FlagPattern, AccentSpotMode } from '../store/types';

const MOODS: Mood[]              = ['night', 'golden', 'day', 'spot'];
const GROUNDS: Ground[]          = ['grid', 'tile', 'marble', 'void'];
const ACCENT_MODES: AccentSpotMode[] = ['off', 'distributed', 'roaming'];
const PATTERNS: FlagPattern[] = ['solid', 'horizontal', 'vertical', 'diagonal', 'circle', 'cross', 'border'];

export default function DebugPanel() {
  const formations  = useParadeStore((s) => s.timeline.formations);
  const selectedId  = useParadeStore((s) => s.selectedId);
  const updateFormation = useParadeStore((s) => s.updateFormation);
  const setPlaza = useParadeStore((s) => s.setPlaza);
  const mood               = useParadeStore((s) => s.plaza.mood);
  const ground             = useParadeStore((s) => s.plaza.ground);
  const wind               = useParadeStore((s) => s.plaza.wind);
  const groundReflectivity = useParadeStore((s) => s.plaza.groundReflectivity);
  const accentSpotMode     = useParadeStore((s) => s.plaza.accentSpotMode);
  const accentSpotSpeed    = useParadeStore((s) => s.plaza.accentSpotSpeed);

  const formation = formations.find((f) => f.id === selectedId);
  if (!formation) return null;

  return (
    <div className="debug-panel">
      <div className="debug-panel__title">Formation</div>

      {/* Shape grid */}
      <div className="debug-panel__shapes">
        {PRESETS.filter((p) => p.key !== 'custom').map((p) => (
          <button
            key={p.key}
            className={`shape-btn${formation.shape === p.key ? ' shape-btn--active' : ''}`}
            onClick={() => updateFormation(formation.id, { shape: p.key as PresetKey })}
            title={p.label}
          >
            <ShapeIcon kind={p.key} size={22} stroke="currentColor" />
          </button>
        ))}
      </div>

      {/* Bearers */}
      <label className="debug-panel__label">
        Bearers: {formation.count}
        <input type="range" min={10} max={500} step={10}
          value={formation.count} className="debug-panel__slider"
          onChange={(e) => updateFormation(formation.id, { count: Number(e.target.value) })} />
      </label>

      {/* Spacing */}
      <label className="debug-panel__label">
        Spacing: {formation.spacing.toFixed(1)}m
        <input type="range" min={0.8} max={4.0} step={0.1}
          value={formation.spacing} className="debug-panel__slider"
          onChange={(e) => updateFormation(formation.id, { spacing: Number(e.target.value) })} />
      </label>

      {/* Rotation */}
      <label className="debug-panel__label">
        Rotation: {formation.rotation}°
        <input type="range" min={-180} max={180} step={5}
          value={formation.rotation} className="debug-panel__slider"
          onChange={(e) => updateFormation(formation.id, { rotation: Number(e.target.value) })} />
      </label>

      {/* Custom shape editor — shown only when shape is 'custom' */}
      {formation.shape === 'custom' && (
        <CustomShapeEditor
          points={formation.customPoints ?? []}
          onChange={(pts) => updateFormation(formation.id, { customPoints: pts })}
        />
      )}

      {/* Flag pattern */}
      <div className="debug-panel__title" style={{ marginTop: 4 }}>Flag</div>
      <div className="debug-panel__row">
        {PATTERNS.map((p) => (
          <button key={p}
            className={`debug-btn${formation.flag.pattern === p ? ' debug-btn--active' : ''}`}
            onClick={() => updateFormation(formation.id, { flag: { ...formation.flag, pattern: p } })}>
            {p}
          </button>
        ))}
      </div>

      {/* Mood */}
      <div className="debug-panel__title" style={{ marginTop: 4 }}>Mood</div>
      <div className="debug-panel__row">
        {MOODS.map((m) => (
          <button key={m}
            className={`debug-btn${mood === m ? ' debug-btn--active' : ''}`}
            onClick={() => setPlaza({ mood: m })}>
            {m}
          </button>
        ))}
      </div>

      {/* Ground */}
      <div className="debug-panel__title" style={{ marginTop: 4 }}>Ground</div>
      <div className="debug-panel__row">
        {GROUNDS.map((g) => (
          <button key={g}
            className={`debug-btn${ground === g ? ' debug-btn--active' : ''}`}
            onClick={() => setPlaza({ ground: g })}>
            {g}
          </button>
        ))}
      </div>

      {/* Wind strength */}
      <label className="debug-panel__label" style={{ marginTop: 4 }}>
        Wind: {wind.strength.toFixed(2)}
        <input type="range" min={0} max={1.5} step={0.05}
          value={wind.strength} className="debug-panel__slider"
          onChange={(e) => setPlaza({ wind: { ...wind, strength: Number(e.target.value) } })} />
      </label>

      {/* Ground reflectivity — only relevant for tile / marble */}
      {(ground === 'tile' || ground === 'marble') && (
        <label className="debug-panel__label">
          Reflectivity: {groundReflectivity.toFixed(2)}
          <input type="range" min={0} max={1} step={0.05}
            value={groundReflectivity} className="debug-panel__slider"
            onChange={(e) => setPlaza({ groundReflectivity: Number(e.target.value) })} />
        </label>
      )}

      {/* Accent spotlights */}
      <div className="debug-panel__title" style={{ marginTop: 4 }}>Accent Spots</div>
      <div className="debug-panel__row">
        {ACCENT_MODES.map((m) => (
          <button key={m}
            className={`debug-btn${accentSpotMode === m ? ' debug-btn--active' : ''}`}
            onClick={() => setPlaza({ accentSpotMode: m })}>
            {m}
          </button>
        ))}
      </div>
      {accentSpotMode === 'roaming' && (
        <label className="debug-panel__label">
          Sweep speed: {accentSpotSpeed.toFixed(1)}
          <input type="range" min={0.1} max={2.0} step={0.1}
            value={accentSpotSpeed} className="debug-panel__slider"
            onChange={(e) => setPlaza({ accentSpotSpeed: Number(e.target.value) })} />
        </label>
      )}
    </div>
  );
}
