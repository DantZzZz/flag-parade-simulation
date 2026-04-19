/**
 * Temporary Phase 1 debug panel — lets you switch formations + tweak count/spacing.
 * Will be replaced by proper sidebar UI in Phase 6.
 */
import ShapeIcon from './ShapeIcon';
import { PRESETS } from '../formations/presets';
import { useParadeStore } from '../store/useParadeStore';
import type { PresetKey } from '../formations/presets';

export default function DebugPanel() {
  const formations  = useParadeStore((s) => s.timeline.formations);
  const selectedId  = useParadeStore((s) => s.selectedId);
  const updateFormation = useParadeStore((s) => s.updateFormation);
  const select = useParadeStore((s) => s.select);

  const formation = formations.find((f) => f.id === selectedId);
  if (!formation) return null;

  return (
    <div className="debug-panel">
      <div className="debug-panel__title">Formation</div>

      {/* Formation selector */}
      {formations.length > 1 && (
        <div className="debug-panel__row">
          {formations.map((f) => (
            <button
              key={f.id}
              className={`debug-btn${f.id === selectedId ? ' debug-btn--active' : ''}`}
              onClick={() => select(f.id)}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

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

      {/* Count */}
      <label className="debug-panel__label">
        Bearers: {formation.count}
        <input
          type="range" min={4} max={300} step={4}
          value={formation.count}
          onChange={(e) => updateFormation(formation.id, { count: Number(e.target.value) })}
          className="debug-panel__slider"
        />
      </label>

      {/* Spacing */}
      <label className="debug-panel__label">
        Spacing: {formation.spacing.toFixed(1)}m
        <input
          type="range" min={0.8} max={4.0} step={0.1}
          value={formation.spacing}
          onChange={(e) => updateFormation(formation.id, { spacing: Number(e.target.value) })}
          className="debug-panel__slider"
        />
      </label>

      {/* Rotation */}
      <label className="debug-panel__label">
        Rotation: {formation.rotation}°
        <input
          type="range" min={-180} max={180} step={5}
          value={formation.rotation}
          onChange={(e) => updateFormation(formation.id, { rotation: Number(e.target.value) })}
          className="debug-panel__slider"
        />
      </label>
    </div>
  );
}
