/**
 * src/components/conversion/SettingField.tsx
 * ----------------------------------------------------------------------------
 * Renders a single tool setting so a non-technical user can operate it.
 *
 *   number with min & max   →  slider + value badge + endpoints
 *   number without min/max  →  number input + step buttons
 *   select ≤ 5 options      →  pill row
 *   select > 5 options      →  styled dropdown
 *   range                   →  slider + value badge + endpoints
 *
 * Adds plain-English hints under each control, quick-pick chips on
 * time-related numbers, and unit suffixes inferred from the label.
 *
 * Purely presentational — the parent owns the value and gets every change
 * via onChange(). No new SettingDef fields were introduced.
 */
import type { SettingDef } from './Converter';

interface Props {
  setting: SettingDef;
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
}

/* ═══════════════════════════════════════════════════════════
   Hint dictionary — plain English under every control.
   Unknown keys return null and render no hint.
   ═══════════════════════════════════════════════════════════ */
const HINTS: Record<string, string> = {
  start: 'Where the cut begins.',
  duration: 'How long the output should be.',
  fadeIn: 'Seconds of silence that ramp up at the start.',
  fadeOut: 'Seconds of silence that ramp down at the end.',
  curve: 'Shape of the fade. Linear sounds the most natural.',
  threshold: 'Everything below this level is treated as silence or compressed.',
  ratio: 'How strongly the effect applies. Higher = stronger.',
  attack: 'How quickly the effect reacts to changes.',
  release: 'How quickly the effect recovers.',
  makeup: 'Extra volume added back after compression.',
  ceiling: 'The loudest the output is allowed to be. -1 dB is safest.',
  quality: 'Higher = smaller file, lower quality.',
  crf: 'Lower = better quality, larger file.',
  preset: 'Encoding speed vs file size. Balanced is a good start.',
  gain: 'How much louder to make the file. +6 dB is a safe default.',
  factor: 'Playback speed multiplier. 1× is unchanged.',
  bass: 'Boost or cut low frequencies.',
  mid: 'Body of voice and instruments.',
  treble: 'Clarity and air at the top of the spectrum.',
  targetLufs: 'Platform loudness standard. Pick the one you are targeting.',
  truePeak: 'Prevents distortion on loud peaks. -1 dBTP or lower.',
  lra: 'How much dynamic variation is allowed.',
  sampleRate: 'Standard is 44.1 kHz for music, 48 kHz for video.',
  bitDepth: 'Higher = more headroom. 16-bit to deliver, 24-bit to edit.',
  mode: 'How to handle the left and right channels.',
  format: 'The output file format.',
  strength: 'How aggressive the processing is. Balanced is recommended.',
  frequency: 'Mains hum is 50 Hz in most of the world, 60 Hz in the US.',
  harmonics: 'Number of hum overtones to remove. 3 is usually enough.',
  delayMs: 'Time between echoes. Short = reverb, long = canyon.',
  decay: 'How much the echo fades on each repeat.',
  minSilence: 'Silence longer than this will be trimmed.',
  keepSilence: 'A short gap is left in place of the cut silence.',
  x: 'Horizontal offset from the left edge.',
  y: 'Vertical offset from the top edge.',
  w: 'How wide the crop region is.',
  h: 'How tall the crop region is.',
  width: 'How many pixels wide the output should be.',
  height: 'How many pixels tall the output should be.',
  fps: 'Frames per second. Higher = smoother motion.',
};

function hintFor(setting: SettingDef): string | null {
  const name = setting.name.toLowerCase();
  return HINTS[name] ?? null;
}

/* ═══════════════════════════════════════════════════════════
   Unit suffix inferred from the label.
   ═══════════════════════════════════════════════════════════ */
function unitFor(setting: SettingDef): string {
  const label = setting.label.toLowerCase();
  if (/\(db\)/.test(label) || /\bdb\b/.test(label)) return 'dB';
  if (/\(ms\)/.test(label) || /\bms\b/.test(label)) return 'ms';
  if (/\(sec/.test(label) || /\bsec\b/.test(label)) return 's';
  if (/\(px\)/.test(label) || /\bpx\b/.test(label)) return 'px';
  if (/\(%\)/.test(label) || /\bpercent\b/.test(label)) return '%';
  if (setting.name === 'gain') return 'dB';
  if (setting.name === 'factor') return '×';
  return '';
}

/* ═══════════════════════════════════════════════════════════
   Quick-pick chips for time and level settings.
   Shown above the slider when a mapping exists.
   ═══════════════════════════════════════════════════════════ */
const QUICK_PICKS: Record<string, number[]> = {
  fadeIn:      [0.5, 1, 2, 3],
  fadeOut:     [0.5, 1, 2, 3],
  duration:    [10, 30, 60, 90],
  minSilence:  [0.3, 0.5, 1],
  keepSilence: [0, 0.1, 0.3],
  attack:      [5, 10, 20, 50],
  release:     [50, 100, 200, 500],
  delayMs:     [50, 100, 200, 350],
  start:       [0, 5, 15, 30],
};

function quickPicksFor(setting: SettingDef): number[] | null {
  const picks = QUICK_PICKS[setting.name.toLowerCase()];
  if (!picks) return null;
  // Only show picks inside the declared range.
  const min = setting.min ?? -Infinity;
  const max = setting.max ?? Infinity;
  const filtered = picks.filter((p) => p >= min && p <= max);
  return filtered.length >= 2 ? filtered : null;
}

/* ═══════════════════════════════════════════════════════════
   Recommended detection for select options.
   ═══════════════════════════════════════════════════════════ */
function isRecommended(label: string): boolean {
  return /recommend/i.test(label);
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export default function SettingField({
  setting,
  value,
  onChange,
  disabled = false,
}: Props) {
  const hint = hintFor(setting);
  const unit = unitFor(setting);

  /* Shared label row */
  const labelRow = (
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <label
        for={`setting-${setting.name}`}
        class="text-sm font-semibold text-gray-900 dark:text-white"
      >
        {setting.label}
      </label>
    </div>
  );

  /* Shared hint block */
  const hintRow = hint ? (
    <p class="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
      {hint}
    </p>
  ) : null;

  /* ── Select ─────────────────────────────────────────── */
  if (setting.type === 'select' && setting.options) {
    const opts = setting.options;

    // ≤ 5 options → pill row
    if (opts.length <= 5) {
      return (
        <div class="space-y-2">
          {labelRow}
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label={setting.label}>
            {opts.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              const active = String(val) === String(value);
              const recommended = isRecommended(lbl);
              return (
                <button
                  key={String(val)}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => onChange(val)}
                  class={[
                    'relative inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                      : 'border border-gray-300 bg-white text-gray-800 hover:border-sky-400 hover:bg-sky-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-sky-500 dark:hover:bg-sky-950/40',
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.97]',
                  ].join(' ')}
                >
                  {recommended && !active && (
                    <span
                      class="inline-block h-1.5 w-1.5 rounded-full bg-sky-500"
                      aria-hidden="true"
                    />
                  )}
                  {lbl}
                </button>
              );
            })}
          </div>
          {hintRow}
        </div>
      );
    }

    // > 5 options → styled dropdown
    return (
      <div class="space-y-2">
        {labelRow}
        <div class="relative">
          <select
            id={`setting-${setting.name}`}
            value={String(value)}
            disabled={disabled}
            onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
            class="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
          >
            {opts.map((opt) => {
              const val = typeof opt === 'string' ? opt : opt.value;
              const lbl = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={String(val)} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {hintRow}
      </div>
    );
  }

  /* ── Slider (number with range, or explicit range) ──── */
  const hasRange =
    setting.min !== undefined &&
    setting.max !== undefined &&
    setting.type !== 'select';

  if (hasRange) {
    const min = setting.min as number;
    const max = setting.max as number;
    const numValue = Number(value);
    const safeValue = Number.isFinite(numValue) ? numValue : min;
    const picks = quickPicksFor(setting);

    return (
      <div class="space-y-2">
        {labelRow}

        {/* Quick-pick chips */}
        {picks && (
          <div class="flex flex-wrap gap-1.5">
            {picks.map((p) => {
              const active = Math.abs(p - safeValue) < 0.001;
              return (
                <button
                  key={p}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(p)}
                  class={[
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    active
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-sky-400 hover:text-sky-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-sky-500 dark:hover:text-sky-400',
                    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.95]',
                  ].join(' ')}
                >
                  {p}{unit}
                </button>
              );
            })}
          </div>
        )}

        {/* Slider + live value */}
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950">
          <div class="flex items-center gap-3">
            <input
              id={`setting-${setting.name}`}
              type="range"
              min={min}
              max={max}
              value={safeValue}
              disabled={disabled}
              onInput={(e) =>
                onChange(Number((e.target as HTMLInputElement).value))
              }
              class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 accent-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700"
            />
            <output
              aria-live="polite"
              class="flex h-9 min-w-[68px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-xs font-bold tabular-nums text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {safeValue}{unit ? ` ${unit}` : ''}
            </output>
          </div>

          {/* Endpoint labels */}
          <div class="mt-2 flex justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span>{min}{unit ? ` ${unit}` : ''}</span>
            <span>{max}{unit ? ` ${unit}` : ''}</span>
          </div>
        </div>

        {hintRow}
      </div>
    );
  }

  /* ── Number without range ───────────────────────────── */
  if (setting.type === 'number') {
    const numValue = Number(value);
    const step = unit === 's' || unit === 'ms' || unit === 'px' || unit === 'dB' ? 1 : 0.1;

    return (
      <div class="space-y-2">
        {labelRow}
        <div class="flex items-stretch gap-2">
          <button
            type="button"
            disabled={disabled}
            aria-label="Decrease"
            onClick={() => {
              const next = Number.isFinite(numValue) ? numValue - step : 0;
              onChange(Number(next.toFixed(4)));
            }}
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-lg font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            −
          </button>

          <div class="relative flex-1">
            <input
              id={`setting-${setting.name}`}
              type="number"
              step={step}
              value={Number.isFinite(numValue) ? numValue : ''}
              disabled={disabled}
              onInput={(e) => {
                const raw = (e.target as HTMLInputElement).value;
                if (raw === '') return;
                const n = Number(raw);
                if (Number.isFinite(n)) onChange(n);
              }}
              class="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 pr-12 text-base font-bold tabular-nums text-gray-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
            {unit && (
              <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                {unit}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={disabled}
            aria-label="Increase"
            onClick={() => {
              const next = Number.isFinite(numValue) ? numValue + step : step;
              onChange(Number(next.toFixed(4)));
            }}
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-lg font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            +
          </button>
        </div>
        {hintRow}
      </div>
    );
  }

  /* ── Fallback — bare range as a slider ──────────────── */
  return (
    <div class="space-y-2">
      {labelRow}
      <input
        id={`setting-${setting.name}`}
        type="range"
        value={Number(value)}
        disabled={disabled}
        onInput={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 accent-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700"
      />
      {hintRow}
    </div>
  );
}