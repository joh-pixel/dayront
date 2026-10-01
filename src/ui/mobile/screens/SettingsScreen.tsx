/**
 * src/ui/mobile/screens/SettingsScreen.tsx
 * Theme, language, cache, about.
 *
 * Storage: uses src/core/storage.ts.
 */
import { useEffect, useState } from 'preact/hooks';
import {
  getTheme, setTheme as saveTheme,
  getLang, setLang as saveLang,
  estimateUsage,
} from '../../../core/storage';
import { blogHref } from '../blog';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
];

function haptic(ms = 8) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch {}
  }
}

export default function SettingsScreen() {
  const [theme, setThemeState] = useState<'auto' | 'light' | 'dark'>('auto');
  const [lang, setLangState] = useState('en');
  const [cacheSize, setCacheSize] = useState('—');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getTheme());
    setLangState(getLang());

    estimateUsage().then(({ usedMB }) => {
      if (usedMB < 0.1) setCacheSize('< 0.1 MB');
      else if (usedMB < 1) setCacheSize(`${(usedMB * 1024).toFixed(0)} KB`);
      else setCacheSize(`${usedMB.toFixed(1)} MB`);
    });

    setMounted(true);
  }, []);

  function applyTheme(t: 'auto' | 'light' | 'dark') {
    setThemeState(t);
    saveTheme(t);

    if (typeof document !== 'undefined') {
      if (t === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        document.documentElement.classList.toggle('dark', t === 'dark');
      }
    }
    haptic(8);
  }

  function toggleDark() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function changeLang(code: string) {
    setLangState(code);
    saveLang(code);
    haptic(8);
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
    } catch {}
  }

  if (!mounted) return <div class="d-settings" />;

  return (
    <div class="d-settings">
      {/* Appearance */}
      <section class="d-settings__group">
        <h2 class="d-settings__group-title">Appearance</h2>
        <div class="d-settings__list">
          <button
            type="button"
            class="d-settings__row"
            onClick={toggleDark}
            aria-pressed={theme === 'dark'}
          >
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 1 0 9 9 9 9 0 1 1-9-9z" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Dark mode</p>
              <p class="d-settings__row-sub">
                {theme === 'dark' ? 'Always on' : theme === 'light' ? 'Always off' : 'Follow system'}
              </p>
            </div>
            <span
              class={`d-settings__toggle ${theme === 'dark' ? 'd-settings__toggle--on' : ''}`}
              aria-hidden="true"
            />
          </button>

          <div class="d-settings__row d-settings__row--static">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Language</p>
            </div>
            <select
              class="d-tool__option-select d-settings__lang"
              value={lang}
              onChange={(e) => changeLang((e.target as HTMLSelectElement).value)}
              aria-label="Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Storage */}
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
        </div>
      </section>

      {/* About */}
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

          <div class="d-settings__row d-settings__row--static">
            <span class="d-settings__row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </span>
            <div class="d-settings__row-body">
              <p class="d-settings__row-title">Version</p>
            </div>
            <span class="d-settings__row-value">1.0.0</span>
          </div>
        </div>
      </section>

      <p class="d-settings__footer">
        <strong>Dayront</strong> — private media tools.<br />
        Nothing you process ever leaves your device.
      </p>
    </div>
  );
}