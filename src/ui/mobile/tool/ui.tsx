/**
 * src/ui/mobile/tool/ui.tsx
 * ----------------------------------------------------------------------------
 * Presentational primitives shared across the tool screen.
 *
 *   • BottomSheet       slide-up sheet with backdrop (opts out of page-swipe)
 *   • PremiumButton     pill button with press feedback + 3 variants
 *   • PillSetting       one setting row (select / range / number)
 *   • AspectPairPicker  matched width/height picker (Phase D)
 *   • ProgressRing      circular SVG progress indicator
 *
 * Settings detection helpers (isTrimSetting, isCropSetting, isAspectPair)
 * live here so overlays.tsx and the group renderer use the same rules.
 */
import { useState } from 'preact/hooks';
import { haptic } from '../haptic';
import type { SettingDef } from './types';

/* ── Detection helpers (used by OptionsSheet) ──────────── */

const TRIM_NAMES = new Set(['start', 'duration', 'end', 'cut']);
const CROP_NAMES = new Set(['x', 'y', 'w', 'h']);

export function isTrimSetting(s: SettingDef): boolean {
  return s.type === 'number' && TRIM_NAMES.has(s.name);
}

export function isCropSetting(s: SettingDef): boolean {
  return s.type === 'number' && CROP_NAMES.has(s.name);
}

export function isAspectPair(s: SettingDef): boolean {
  return s.type === 'select' && (s.name === 'width' || s.name === 'height');
}

/* ── Bottom sheet wrapper ───────────────────────────────── */

export function BottomSheet({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: any; }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" data-swipe-block style={{
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

/* ── Segmented pill option ──────────────────────────────── */

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
        <div
          data-swipe-block
          style={{
            display: 'flex', gap: '0.5rem',
            overflowX: 'auto', paddingBottom: '0.25rem',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
        >
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
            {value}{setting.unit ?? ''}
          </span>
        </div>
      )}

      {setting.type === 'number' && (
        <div style={{ position: 'relative' }}>
          <input
            type="number"
            min={setting.min}
            max={setting.max}
            value={Number(value)}
            onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
            style={{
              width: '100%', padding: '0.875rem 2.5rem 0.875rem 1rem',
              fontSize: '1rem', fontWeight: 700,
              borderRadius: '1rem',
              border: '1px solid var(--line, rgba(148,163,184,0.35))',
              background: 'var(--bg-elev, #fff)',
              color: 'inherit',
            }}
          />
          {setting.unit && (
            <span style={{
              position: 'absolute', right: '0.875rem', top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.82rem', fontWeight: 700, opacity: 0.5,
              pointerEvents: 'none',
            }}>
              {setting.unit}
            </span>
          )}
        </div>
      )}

      {setting.hint && (
        <p style={{
          fontSize: '0.72rem', opacity: 0.55,
          margin: '0.4rem 0 0', lineHeight: 1.4,
        }}>
          {setting.hint}
        </p>
      )}
    </div>
  );
}

/* ── Aspect pair picker (Phase D) ───────────────────────── */

export function AspectPairPicker({
  widthSetting, heightSetting, width, height, onChange,
}: {
  widthSetting: SettingDef;
  heightSetting: SettingDef;
  width: number;
  height: number;
  onChange: (patch: { width?: number; height?: number }) => void;
}) {
  const ratioOf = (w: number, h: number) => (w && h ? w / h : 16 / 9);

  const PRESETS: Array<{ key: string; label: string; w: number; h: number }> = [
    { key: '9:16', label: '9:16', w: 1080, h: 1920 },
    { key: '16:9', label: '16:9', w: 1920, h: 1080 },
    { key: '1:1',  label: '1:1',  w: 1080, h: 1080 },
    { key: '4:3',  label: '4:3',  w: 1440, h: 1080 },
    { key: '2:1',  label: '2:1',  w: 1920, h: 960 },
  ];

  const activePreset = PRESETS.find((p) => p.w === width && p.h === height)?.key ?? null;

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{
        fontSize: '0.78rem', fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        opacity: 0.55, marginBottom: '0.5rem',
      }}>
        Aspect ratio
      </div>

      <div
        data-swipe-block
        style={{
          display: 'flex', gap: '0.5rem',
          overflowX: 'auto', paddingBottom: '0.25rem',
          scrollbarThin: 'none', WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x', scrollbarWidth: 'none',
        }}
      >
        {PRESETS.map((p) => {
          const active = p.key === activePreset;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => { haptic(); onChange({ width: p.w, height: p.h }); }}
              style={{
                flexShrink: 0,
                minWidth: '64px',
                padding: '0.65rem 0.5rem',
                borderRadius: '0.875rem',
                border: active ? 'none' : '1px solid var(--line, rgba(148,163,184,0.35))',
                background: active ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'var(--bg-elev, #fff)',
                color: active ? '#fff' : 'inherit',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 600,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '0.35rem',
              }}
            >
              <RatioGlyph ratio={ratioOf(p.w, p.h)} active={active} />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom width + height */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <NumberField
          label="Width"
          value={width}
          options={widthSetting.options}
          onChange={(v) => onChange({ width: v })}
        />
        <NumberField
          label="Height"
          value={height}
          options={heightSetting.options}
          onChange={(v) => onChange({ height: v })}
        />
      </div>
    </div>
  );
}

function NumberField({
  label, value, options, onChange,
}: {
  label: string;
  value: number;
  options?: Array<string | { value: string | number; label: string }>;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsed = (options ?? []).map((o) =>
    typeof o === 'string' ? { value: Number(o), label: o } : { value: Number(o.value), label: o.label },
  );

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.3rem' }}>{label}</div>
      <button
        type="button"
        onClick={() => { haptic(); setOpen((v) => !v); }}
        style={{
          width: '100%',
          padding: '0.75rem 0.9rem',
          borderRadius: '0.875rem',
          border: '1px solid var(--line, rgba(148,163,184,0.35))',
          background: 'var(--bg-elev, #fff)',
          color: 'inherit',
          fontWeight: 700,
          fontSize: '0.92rem',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{value} px</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{
          marginTop: '0.35rem',
          borderRadius: '0.875rem',
          border: '1px solid var(--line, rgba(148,163,184,0.35))',
          background: 'var(--bg-elev, #fff)',
          maxHeight: '180px',
          overflowY: 'auto',
        }}>
          {parsed.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { haptic(); onChange(o.value); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.55rem 0.9rem',
                border: 'none',
                background: o.value === value ? 'var(--brand-soft, #e0f2fe)' : 'transparent',
                color: 'inherit',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: o.value === value ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RatioGlyph({ ratio, active }: { ratio: number; active: boolean }) {
  const maxW = 22;
  const maxH = 22;
  let w = maxW;
  let h = maxW / ratio;
  if (h > maxH) { h = maxH; w = maxH * ratio; }
  return (
    <span
      style={{
        width: `${w}px`, height: `${h}px`,
        border: `2px solid ${active ? '#fff' : 'currentColor'}`,
        borderRadius: '3px',
        display: 'inline-block',
      }}
    />
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