/**
 * src/ui/mobile/screens/SettingsScreen.tsx
 * ----------------------------------------------------------------------------
 * Everything the user can control.
 * Every toggle is persisted via core/storage and applies immediately.
 *
 * NOTE: Only English is shipped right now. The language row auto-hides
 * when fewer than 2 languages are registered — add more to LANGUAGES
 * and the row reappears with the full picker.
 */
import { useEffect, useState } from 'preact/hooks';
import {
  getSettings, updateSetting, clearAllData, applyThemeToDom,
  estimateUsage, type ThemeMode,
} from '../../../core/storage';
import { blogHref } from '../blog';
import { haptic } from '../haptic';

/* ── Supported languages ───────────────────────────────────
   Add more entries here to enable the language picker. */
const LANGUAGES = [
  { code: 'en', label: 'English' },
  // { code: 'es', label: 'Español' },
  // { code: 'pt', label: 'Português' },
  // { code: 'de', label: 'Deutsch' },
  // { code: 'fr', label: 'Français' },
  // { code: 'ja', label: '日本語' },
];

const THEME_LABELS: Record<ThemeMode, string> = {
  auto:  'Follow system',
  light: 'Always off',
  dark:  'Always on',
};

const FORMATS = [
  { code: 'mp3',  label: 'MP3  ·  audio' },
  { code: 'wav',  label: 'WAV  ·  audio, lossless' },
  { code: 'm4a',  label: 'M4A  ·  audio' },
  { code: 'mp4',  label: 'MP4  ·  video' },
  { code: 'webm', label: 'WebM ·  video' },
];

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true || w.__TAURI__ !== undefined;
}

/* ── Share Dayront — professional message ─────────────── */

const SHARE_URL = 'https://download.dayront.com';
const SHARE_TITLE = 'Dayront — private media tools';
const SHARE_TEXT =
  'Dayront — 73+ media tools that run entirely on your device.\n' +
  'No uploads, no accounts, no tracking.\n\n' +
  '🎬 Compress, trim, and merge video\n' +
  '🎵 Cut, boost, and convert audio\n' +
  '🤖 AI captions & background removal\n\n' +
  'Works offline · 5 GB files in the Android app';

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  // Legacy fallback
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState(getSettings());
  const [cacheSize, setCacheSize] = useState('—');
  const [mounted, setMounted] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const native = isNativeApp();
  const showLanguagePicker = LANGUAGES.length > 1;

  useEffect(() => {
    estimateUsage().then(({ usedMB }) => {
      if (usedMB < 0.1) setCacheSize('< 0.1 MB');
      else if (usedMB < 1) setCacheSize(`${(usedMB * 1024).toFixed(0)} KB`);
      else setCacheSize(`${usedMB.toFixed(1)} MB`);
    });
    setMounted(true);
  }, []);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  /* ── Handlers ─────────────────────────────────────────── */

  function cycleTheme() {
    const order: ThemeMode[] = ['auto', 'light', 'dark'];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    updateSetting('theme', next);
    applyThemeToDom(next);
    setSettings((s) => ({ ...s, theme: next }));
    haptic(8);
    flash(`Theme: ${THEME_LABELS[next]}`);
  }

  function setLang(code: string) {
    if (code === settings.lang) return;
    updateSetting('lang', code);
    setSettings((s) => ({ ...s, lang: code }));
    haptic(8);

    const path = window.location.pathname;
    const supported = LANGUAGES.map((l) => l.code);
    const segments = path.split('/').filter(Boolean);
    const hadLocale = supported.includes(segments[0]);
    const suffix = '/' + (hadLocale ? segments.slice(1) : segments).join('/');
    const cleanSuffix = suffix === '/' ? '' : suffix;
    const target = code === 'en'
      ? `/app${cleanSuffix}`
      : `/${code}/app${cleanSuffix}`;
    window.location.href = target;
  }

  function toggle<K extends keyof typeof settings>(key: K, label: string) {
    const next = !settings[key];
    updateSetting(key, next as any);
    setSettings((s) => ({ ...s, [key]: next }));
    haptic(next ? 10 : 6);
    flash(`${label}: ${next ? 'On' : 'Off'}`);
  }

  function setFormat(code: string) {
    updateSetting('defaultFormat', code);
    setSettings((s) => ({ ...s, defaultFormat: code }));
    haptic(8);
    flash(`Default format: ${code.toUpperCase()}`);
  }

  async function clearCache() {
    if (typeof window === 'undefined') return;
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      haptic(15);
      setCacheSize('< 0.1 MB');
      flash('Cache cleared');
    } catch {
      flash('Could not clear cache');
    }
  }

  async function resetAll() {
    if (!resetConfirm) {
      setResetConfirm(true);
      flash('Tap again to confirm');
      setTimeout(() => setResetConfirm(false), 3500);
      return;
    }
    await clearAllData();
    haptic(20);
    flash('All data cleared — reloading…');
    setTimeout(() => { window.location.href = '/app'; }, 800);
  }

  /* ── Share Dayront ─────────────────────────────────────
     Order of preference:
       1. @capacitor/share (native Android/iOS) — real share sheet
       2. navigator.share (web) — native browser share
       3. Copy link to clipboard — fallback for old browsers
  ────────────────────────────────────────────────────── */
  async function shareApp() {
    haptic(12);

    /* 1. Native share sheet */
    if (native) {
      try {
        const mod: any = await import(/* @vite-ignore */ '@capacitor/share');
        const { Share } = mod;
        await Share.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SHARE_URL,
          dialogTitle: 'Share Dayront with a friend',
        });
        return;
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('abort')) return;
        console.warn('[share] Native share failed, falling back:', err);
      }
    }

    /* 2. Web Share API (Chrome Android, Safari iOS 15+) */
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SHARE_URL,
        });
        return;
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('abort')) return;
        // Fall through to copy
      }
    }

    /* 3. Copy link fallback */
    const copied = await copyText(`${SHARE_TEXT}\n\n${SHARE_URL}`);
    flash(copied ? 'Link copied — paste in any app' : 'Could not open share');
  }

  if (!mounted) return <div class="d-settings" />;

  return (
    <div class="d-settings">
      {/* ═══════════════════════════════════════════════
          APPEARANCE
          ═══════════════════════════════════════════════ */}
      <section class="d-settings__group">
        <h2 class="d-settings__group-title">Appearance</h2>
        <div class="d-settings__list">
          <button
            type="button"
            class="d-settings__row"
            onClick={cycleTheme}
            aria-label="Change theme"
          >
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 1 0 9 9 9 9 0 1 1-9-9z" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Dark mode</p>
              <p class="d-settings__row-sub">{THEME_LABELS[settings.theme]}</p>
            </div>
            <span class="d-settings__row-value">
              {settings.theme === 'dark' ? 'On' : settings.theme === 'light' ? 'Off' : 'Auto'}
            </span>
            <span class="d-settings__row-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </button>

          {showLanguagePicker && (
            <div class="d-settings__row d-settings__row--static">
              <span class="d-settings__row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
                </svg>
              </span>
              <div class="d-settings__row-body">
                <p class="d-settings__row-title">Language</p>
                <p class="d-settings__row-sub">App + tool names</p>
              </div>
              <select
                class="d-tool__option-select d-settings__lang"
                value={settings.lang}
                onChange={(e) => setLang((e.target as HTMLSelectElement).value)}
                aria-label="Language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FEEDBACK & NOTIFICATIONS
          ═══════════════════════════════════════════════ */}
      <section class="d-settings__group">
        <h2 class="d-settings__group-title">Feedback</h2>
        <div class="d-settings__list">
          <button
            type="button"
            class="d-settings__row"
            onClick={() => toggle('haptics', 'Haptics')}
            aria-pressed={settings.haptics}
          >
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 3v18M16 3v18M5 8h3M5 16h3M16 8h3M16 16h3" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Haptics</p>
              <p class="d-settings__row-sub">Vibrate on taps & gestures</p>
            </div>
            <span class={`d-settings__toggle ${settings.haptics ? 'd-settings__toggle--on' : ''}`} aria-hidden="true" />
          </button>

          {native && (
            <button
              type="button"
              class="d-settings__row"
              onClick={() => toggle('notifications', 'Notifications')}
              aria-pressed={settings.notifications}
            >
              <span class="d-settings__row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
              </span>
              <div class="d-settings__row-body">
                <p class="d-settings__row-title">Notifications</p>
                <p class="d-settings__row-sub">Alert when a job finishes</p>
              </div>
              <span class={`d-settings__toggle ${settings.notifications ? 'd-settings__toggle--on' : ''}`} aria-hidden="true" />
            </button>
          )}

          {native && (
            <button
              type="button"
              class="d-settings__row"
              onClick={() => toggle('keepAwake', 'Keep screen awake')}
              aria-pressed={settings.keepAwake}
            >
              <span class="d-settings__row-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              </span>
              <div class="d-settings__row-body">
                <p class="d-settings__row-title">Keep screen awake</p>
                <p class="d-settings__row-sub">Prevents sleep during processing</p>
              </div>
              <span class={`d-settings__toggle ${settings.keepAwake ? 'd-settings__toggle--on' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROCESSING
          ═══════════════════════════════════════════════ */}
      <section class="d-settings__group">
        <h2 class="d-settings__group-title">Processing</h2>
        <div class="d-settings__list">
          <div class="d-settings__row d-settings__row--static">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Default format</p>
              <p class="d-settings__row-sub">Used when a tool has options</p>
            </div>
            <select
              class="d-tool__option-select d-settings__lang"
              value={settings.defaultFormat}
              onChange={(e) => setFormat((e.target as HTMLSelectElement).value)}
              aria-label="Default output format"
            >
              {FORMATS.map((f) => (
                <option key={f.code} value={f.code}>{f.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            class="d-settings__row"
            onClick={() => toggle('autoDownload', 'Auto-save')}
            aria-pressed={settings.autoDownload}
          >
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Auto-save result</p>
              <p class="d-settings__row-sub">Save to device after processing</p>
            </div>
            <span class={`d-settings__toggle ${settings.autoDownload ? 'd-settings__toggle--on' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STORAGE
          ═══════════════════════════════════════════════ */}
      <section class="d-settings__group">
        <h2 class="d-settings__group-title">Storage</h2>
        <div class="d-settings__list">
          <div class="d-settings__row d-settings__row--static">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Cache</p>
              <p class="d-settings__row-sub">Service worker + FFmpeg core</p>
            </div>
            <span class="d-settings__row-value">{cacheSize}</span>
          </div>

          <button type="button" class="d-settings__row" onClick={clearCache}>
            <span class="d-settings__row-icon d-settings__row-icon--danger" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Clear cache</p>
              <p class="d-settings__row-sub">Force re-download on next use</p>
            </div>
            <span class="d-settings__row-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </button>

          <button type="button" class="d-settings__row" onClick={resetAll}>
            <span class="d-settings__row-icon d-settings__row-icon--danger-strong" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title d-settings__row-title--danger">
                {resetConfirm ? 'Tap again to confirm' : 'Reset all data'}
              </p>
              <p class="d-settings__row-sub">
                Removes settings, cache, and recent history
              </p>
            </div>
            <span class="d-settings__row-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRIVACY
          ═══════════════════════════════════════════════ */}
      <section class="d-settings__group">
        <h2 class="d-settings__group-title">Privacy</h2>
        <div class="d-settings__list">
          <button
            type="button"
            class="d-settings__row"
            onClick={() => toggle('analytics', 'Analytics')}
            aria-pressed={settings.analytics}
          >
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 3 3 6-6" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Anonymous analytics</p>
              <p class="d-settings__row-sub">No file data — just page views</p>
            </div>
            <span class={`d-settings__toggle ${settings.analytics ? 'd-settings__toggle--on' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ABOUT
          ═══════════════════════════════════════════════ */}
      <section class="d-settings__group">
        <h2 class="d-settings__group-title">About</h2>
        <div class="d-settings__list">
          <a href={blogHref('/blog/en')} target="_blank" rel="noopener noreferrer" class="d-settings__row">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Blog</p>
              <p class="d-settings__row-sub">Opens in browser</p>
            </div>
            <span class="d-settings__row-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </span>
          </a>

          <a href={blogHref('/privacy')} target="_blank" rel="noopener noreferrer" class="d-settings__row">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Privacy Policy</p>
            </div>
            <span class="d-settings__row-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </span>
          </a>

          <a href={blogHref('/terms')} target="_blank" rel="noopener noreferrer" class="d-settings__row">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 13h6M9 17h6" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Terms of Service</p>
            </div>
            <span class="d-settings__row-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </span>
          </a>

          <button type="button" class="d-settings__row" onClick={shareApp}>
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Share Dayront</p>
              <p class="d-settings__row-sub">Tell a friend — no tracking</p>
            </div>
            <span class="d-settings__row-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          </button>

          <div class="d-settings__row d-settings__row--static">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Version</p>
              <p class="d-settings__row-sub">{native ? 'Android · native FFmpeg' : 'Web · WASM'}</p>
            </div>
            <span class="d-settings__row-value">1.1.0</span>
          </div>
        </div>
      </section>

      <p class="d-settings__footer">
        <strong>Dayront</strong> — private media tools.<br />
        Nothing you process ever leaves your device.
      </p>

      {/* Toast */}
      {toast && <div class="d-toast">{toast}</div>}
    </div>
  );
}