/**
 * src/ui/mobile/tool/ui.tsx
 * ----------------------------------------------------------------------------
 * Presentational primitives shared across the tool screen.
 *
 *   • BottomSheet     slide-up sheet with backdrop
 *   • PremiumButton   pill button with press feedback + 3 variants
 *   • PillSetting     one setting row (select / range / number)
 *   • ProgressRing    circular SVG progress indicator
 *
 * Everything here is stateless w.r.t. the tool workflow — no knowledge of
 * files, jobs, or the runner. That keeps these components reusable elsewhere
 * (SettingsScreen already duplicates similar patterns) and makes them easy
 * to iterate on visually without touching the screen logic.
 */
import { useState } from 'preact/hooks';
import { haptic } from '../haptic';
import type { SettingDef } from './types';

/* ── Bottom sheet wrapper ───────────────────────────────── */

export function BottomSheet({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: any; }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
        animation: 'd-fade-in 180ms ease-out',
      }} />
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '560px',
        background: 'var(--bg-elev, #fff)',
        color: 'var(--fg, #0f172a)',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.28)',
        animation: 'd-slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px', paddingBottom: '4px' }}>
          <div style={{ width: '42px', height: '4px', borderRadius: '999px', background: 'rgba(120,120,120,0.4)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Premium curved button ──────────────────────────────── */

export function PremiumButton({
  children, onClick, variant = 'primary', disabled = false,
}: {
  children: any;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const styles: Record<string, any> = {
    primary: {
      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: pressed
        ? '0 4px 12px rgba(2,132,199,0.35)'
        : '0 10px 24px rgba(2,132,199,0.40), inset 0 1px 0 rgba(255,255,255,0.25)',
    },
    secondary: {
      background: 'var(--bg-soft, #eef2f7)',
      color: 'inherit',
      border: '1px solid var(--line, rgba(148,163,184,0.35))',
      boxShadow: pressed
        ? '0 2px 6px rgba(0,0,0,0.06)'
        : '0 6px 14px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
    },
    ghost: {
      background: 'transparent',
      color: 'inherit',
      border: '1px solid var(--line, rgba(148,163,184,0.35))',
      boxShadow: 'none',
    },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: '100%',
        padding: '1rem 1.5rem',
        borderRadius: '999px',
        fontSize: '1rem',
        fontWeight: 800,
        letterSpacing: '0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

/* ── Segmented pill option (CapCut-style) ───────────────── */

export function PillSetting({
  setting, value, onChange,
}: {
  setting: SettingDef;
  value: string | number;
  onChange: (v: string | number) => void;
}) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{
        fontSize: '0.78rem', fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        opacity: 0.55, marginBottom: '0.5rem',
      }}>
        {setting.label}
      </div>

      {setting.type === 'select' && setting.options && (
        <div style={{
          display: 'flex', gap: '0.5rem',
          overflowX: 'auto', paddingBottom: '0.25rem',
          scrollbarWidth: 'none',
        }}>
          {setting.options.map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            const active = String(val) === String(value);
            return (
              <button
                key={String(val)}
                type="button"
                onClick={() => { haptic(); onChange(val); }}
                style={{
                  flexShrink: 0,
                  padding: '0.65rem 1rem',
                  borderRadius: '999px',
                  border: active ? 'none' : '1px solid var(--line, rgba(148,163,184,0.35))',
                  background: active ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'var(--bg-elev, #fff)',
                  color: active ? '#fff' : 'inherit',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer',
                  boxShadow: active ? '0 6px 14px rgba(2,132,199,0.35)' : '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 140ms ease-out',
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      )}

      {setting.type === 'range' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 0.75rem', borderRadius: '1rem',
          background: 'var(--bg-soft, rgba(241,245,249,0.6))',
        }}>
          <input
            type="range"
            min={setting.min}
            max={setting.max}
            value={Number(value)}
            onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: '52px', textAlign: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
            {value}
          </span>
        </div>
      )}

      {setting.type === 'number' && (
        <input
          type="number"
          min={setting.min}
          max={setting.max}
          value={Number(value)}
          onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
          style={{
            width: '100%', padding: '0.875rem 1rem',
            fontSize: '1rem', fontWeight: 700,
            borderRadius: '1rem',
            border: '1px solid var(--line, rgba(148,163,184,0.35))',
            background: 'var(--bg-elev, #fff)',
            color: 'inherit',
          }}
        />
      )}
    </div>
  );
}

/* ── Progress ring ──────────────────────────────────────── */

export function ProgressRing({ percent }: { percent: number }) {
  const size = 148, stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circ * (1 - clamped / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#38bdf8" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 300ms ease-out' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="28" fontWeight="800">
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}