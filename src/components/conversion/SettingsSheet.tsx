/**
 * src/components/conversion/SettingsSheet.tsx
 * ----------------------------------------------------------------------------
 * Drop-up settings panel. Renders a "Adjust settings" trigger + a bottom
 * sheet that slides up from the viewport bottom.
 *
 *   • Trigger shows a one-line summary of the current settings
 *   • Sheet has a handle bar, title, optional preset chips, content, Done
 *   • Closes on backdrop click, X, ESC, or Done
 *   • Body scroll lock while open
 *   • Portaled to <body> so it escapes any `transform` / `filter` ancestors
 *
 * Presets are optional. When provided, they render as chips at the top of
 * the sheet; tapping one applies a whole settings record at once.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ComponentChildren } from 'preact';

export interface SettingsPreset {
  name: string;
  icon?: string;
  settings: Record<string, string | number>;
}

interface Props {
  /** Human-readable summary shown on the trigger, e.g. "-20 dB · 4:1 · 20/250" */
  summary: string;
  /** Tool name — used in the sheet title. */
  toolName: string;
  /** Preset chips. Omit or pass empty array for no presets. */
  presets?: SettingsPreset[];
  /** Called when the user taps a preset chip. */
  onApplyPreset?: (settings: Record<string, string | number>) => void;
  /** The currently-selected preset name, if any (for chip highlight). */
  activePresetName?: string;
  /** The settings fields. */
  children: ComponentChildren;
  /** Optional: disable the trigger (e.g. while processing). */
  disabled?: boolean;
}

const DURATION_MS = 260;

export default function SettingsSheet({
  summary,
  toolName,
  presets,
  onApplyPreset,
  activePresetName,
  children,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      document.body.style.paddingRight = '';
    };
  }, [open]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openSheet() {
    if (disabled) return;
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function close() {
    setVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, DURATION_MS);
  }

  return (
    <>
      {/* ── Trigger card ── */}
      <button
        type="button"
        onClick={openSheet}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        class={[
          'flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition dark:border-gray-700 dark:bg-gray-900',
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'hover:border-sky-400 hover:bg-sky-50/40 active:scale-[0.995] dark:hover:border-sky-500 dark:hover:bg-sky-950/30',
        ].join(' ')}
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg dark:bg-sky-900/40">
            ⚙️
          </div>
          <div class="min-w-0">
            <div class="text-sm font-bold text-gray-900 dark:text-white">
              Adjust settings
            </div>
            <div class="mt-0.5 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
              {summary || 'Tap to configure'}
            </div>
          </div>
        </div>
        <svg
          class="h-5 w-5 shrink-0 text-gray-400"
          fill="none" stroke="currentColor" stroke-width="2.2"
          viewBox="0 0 24 24" aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* ── Sheet (portaled) ── */}
      {mounted && open && createPortal(
        <div role="dialog" aria-modal="true" aria-label={`${toolName} settings`} style="position:fixed;inset:0;z-index:200;">
          {/* Backdrop */}
          <div
            onClick={close}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15,23,42,0.5)',
              backdropFilter: 'blur(3px)',
              opacity: visible ? 1 : 0,
              transition: `opacity ${DURATION_MS}ms ease-out`,
            }}
          />

          {/* Sheet panel */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-elev, #ffffff)',
              color: 'var(--fg, #0f172a)',
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.28)',
              transform: visible ? 'translateY(0)' : 'translateY(100%)',
              transition: `transform ${DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            class="dark:bg-gray-900"
          >
            {/* Handle bar */}
            <div class="flex justify-center pt-2.5 pb-1">
              <div class="h-1 w-11 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            {/* Header */}
            <div class="flex items-start justify-between gap-3 px-5 pt-1 pb-3">
              <div class="min-w-0">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Options</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Customize your output before processing.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close options"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-[0.95] dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preset chips */}
            {presets && presets.length > 0 && (
              <div class="border-t border-gray-100 px-5 pt-3 pb-3 dark:border-gray-800">
                <p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Quick presets
                </p>
                <div class="flex flex-wrap gap-2">
                  {presets.map((preset) => {
                    const active = activePresetName === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          if (onApplyPreset) onApplyPreset(preset.settings);
                        }}
                        class={[
                          'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition',
                          active
                            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                            : 'border border-gray-300 bg-white text-gray-800 hover:border-sky-400 hover:bg-sky-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-sky-500 dark:hover:bg-sky-950/40',
                        ].join(' ')}
                      >
                        {preset.icon && <span aria-hidden="true">{preset.icon}</span>}
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Settings content */}
            <div class="flex-1 overflow-y-auto border-t border-gray-100 px-5 py-4 dark:border-gray-800">
              <div class="space-y-6">{children}</div>
            </div>

            {/* Done */}
            <div class="border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={close}
                class="w-full rounded-2xl bg-sky-500 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-sky-500/30 transition hover:bg-sky-600 active:scale-[0.985]"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}