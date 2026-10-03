/**
 * src/core/storage.ts
 * ----------------------------------------------------------------------------
 * Unified storage + settings for the Dayront app.
 *
 * On web:       uses localStorage (fast, synchronous).
 * On Capacitor: prefers @capacitor/preferences (native, survives OS clear).
 * On Tauri:     uses the tauri-plugin-store when available.
 *
 * All methods are safe on the server (return null / no-op).
 * All keys are automatically namespaced with "dayront:" prefix.
 *
 * NOTE: Capacitor packages are loaded via `import(/* @vite-ignore *\/ ...)` so
 * Rollup doesn't try to bundle them at build time — they only exist inside
 * the native app shell.
 */

const PREFIX = 'dayront:';

/* ── Internal ─────────────────────────────────────────────── */

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function fullKey(key: string): string {
  return key.startsWith(PREFIX) ? key : PREFIX + key;
}

function hasNative(): boolean {
  if (!hasWindow()) return false;
  const w = window as any;
  return w.Capacitor?.isNativePlatform?.() === true;
}

/* ── Synchronous API (localStorage-backed) ───────────────── */

/** Read a JSON value. Returns null if missing or malformed. */
export function read<T = unknown>(key: string): T | null {
  if (!hasWindow()) return null;
  try {
    const raw = localStorage.getItem(fullKey(key));
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Write a JSON value. Silently ignores storage-full errors. */
export function write(key: string, value: unknown): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(fullKey(key), JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode — ignore silently
  }
}

/** Read a plain string (not JSON-encoded). */
export function readString(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return localStorage.getItem(fullKey(key));
  } catch {
    return null;
  }
}

/** Write a plain string. */
export function writeString(key: string, value: string): void {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(fullKey(key), value);
  } catch {}
}

/** Remove a single key. */
export function remove(key: string): void {
  if (!hasWindow()) return;
  try {
    localStorage.removeItem(fullKey(key));
  } catch {}
}

/** Remove ALL Dayront-namespaced keys. Does not touch other apps' data. */
export function clearAll(): void {
  if (!hasWindow()) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/** Get every Dayront key as a plain object (for debugging / export). */
export function dumpAll(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!hasWindow()) return out;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        out[k] = localStorage.getItem(k) ?? '';
      }
    }
  } catch {}
  return out;
}

/* ══════════════════════════════════════════════════════════════
   ★ UNIFIED SETTINGS STORE
   ══════════════════════════════════════════════════════════════
   One source of truth for every user preference.
   Every toggle in SettingsScreen reads/writes here.

   Migration: if the old separate keys exist (theme, lang, dayront-lang),
   their values are folded into the new store on first read.
*/

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface AppSettings {
  /** auto · light · dark */
  theme: ThemeMode;
  /** BCP-47 language code */
  lang: string;
  /** Vibrate on taps and gestures */
  haptics: boolean;
  /** Local notification when a job finishes */
  notifications: boolean;
  /** Prevent the screen from sleeping during processing (native only) */
  keepAwake: boolean;
  /** Auto-save the result file after processing */
  autoDownload: boolean;
  /** Default output format for conversion tools */
  defaultFormat: string;
  /** Anonymous page-view analytics */
  analytics: boolean;
}

const SETTINGS_KEY = 'settings:v1';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  lang: 'en',
  haptics: true,
  notifications: true,
  keepAwake: true,
  autoDownload: false,
  defaultFormat: 'mp3',
  analytics: true,
};

/** Read all settings, applying defaults for anything missing. */
export function getSettings(): AppSettings {
  const stored = read<Partial<AppSettings>>(SETTINGS_KEY);
  if (!stored) {
    return { ...DEFAULT_SETTINGS };
  }

  // Migration: fold old separate keys into the new store
  const migrated: Partial<AppSettings> = {};
  const legacyTheme = readString('theme');
  if (legacyTheme && !stored.theme) {
    migrated.theme = (legacyTheme as ThemeMode) ?? 'auto';
  }
  const legacyLang = readString('dayront-lang') ?? readString('lang');
  if (legacyLang && !stored.lang) {
    migrated.lang = legacyLang;
  }

  return { ...DEFAULT_SETTINGS, ...migrated, ...stored };
}

/** Update a single setting key. Broadcasts a change event. */
export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): void {
  const current = getSettings();
  const next = { ...current, [key]: value };
  write(SETTINGS_KEY, next);

  if (hasWindow()) {
    try {
      window.dispatchEvent(
        new CustomEvent('dayront:settings-changed', {
          detail: { key, value },
        }),
      );
    } catch {}
  }
}

/** Wipe every Dayront key from localStorage + clear all caches. */
export async function clearAllData(): Promise<void> {
  clearAll();
  if (hasWindow() && 'caches' in window) {
    try {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    } catch {}
  }
}

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */

/** Apply a theme value to <html>. Safe on server. */
export function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const prefersDark =
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
}

export function getTheme(): ThemeMode {
  return getSettings().theme;
}

export function setTheme(theme: ThemeMode): void {
  updateSetting('theme', theme);
  applyThemeToDom(theme);
}

/* ══════════════════════════════════════════════════════════════
   LANGUAGE
   ══════════════════════════════════════════════════════════════ */

export function getLang(): string {
  return getSettings().lang;
}

export function setLang(code: string): void {
  updateSetting('lang', code);
  // Keep legacy keys in sync for any component still reading them
  writeString('lang', code);
  writeString('dayront-lang', code);
}

/* ══════════════════════════════════════════════════════════════
   BOOT: apply theme immediately + watch system changes
   ══════════════════════════════════════════════════════════════ */

if (typeof window !== 'undefined') {
  // Apply stored theme before paint (best effort)
  applyThemeToDom(getTheme());

  // When theme is 'auto', follow system changes live
  window
    .matchMedia?.('(prefers-color-scheme: dark)')
    .addEventListener?.('change', () => {
      if (getTheme() === 'auto') applyThemeToDom('auto');
    });
}

/* ══════════════════════════════════════════════════════════════
   WELCOME · RECENT · NOTIFY (existing features)
   ══════════════════════════════════════════════════════════════ */

/* Welcome toast seen? */
export function hasSeenWelcome(): boolean {
  return readString('welcome-seen:v1') !== null;
}

export function markWelcomeSeen(): void {
  writeString('welcome-seen:v1', Date.now().toString());
}

/* Recent files */
export interface RecentEntry {
  tool: string;
  toolName: string;
  icon: string;
  fileName: string;
  fileSize: number;
  ts: number;
}

const RECENT_KEY = 'recent-files';
const RECENT_MAX = 30;

export function getRecent(): RecentEntry[] {
  return read<RecentEntry[]>(RECENT_KEY) ?? [];
}

export function addRecent(entry: Omit<RecentEntry, 'ts'>): void {
  const list = getRecent();
  list.unshift({ ...entry, ts: Date.now() });
  write(RECENT_KEY, list.slice(0, RECENT_MAX));
}

export function clearRecent(): void {
  remove(RECENT_KEY);
}

/* Recent tools (jumped to from Home) */
const RECENT_TOOLS_KEY = 'recent-tools';
const RECENT_TOOLS_MAX = 8;

export function getRecentTools(): string[] {
  return read<string[]>(RECENT_TOOLS_KEY) ?? [];
}

export function pushRecentTool(slug: string): void {
  const list = getRecentTools().filter((s) => s !== slug);
  list.unshift(slug);
  write(RECENT_TOOLS_KEY, list.slice(0, RECENT_TOOLS_MAX));
}

/* Notify form — remember if user already submitted */
export function hasSubmittedNotify(): boolean {
  const raw = readString('notify-submitted');
  if (!raw) return false;
  const age = Date.now() - parseInt(raw, 10);
  return age < 7 * 24 * 60 * 60 * 1000; // 7 days
}

export function markNotifySubmitted(): void {
  writeString('notify-submitted', Date.now().toString());
}

/* ══════════════════════════════════════════════════════════════
   ASYNC API (native platforms)
   ══════════════════════════════════════════════════════════════ */

/**
 * Async getter that uses Capacitor Preferences when available.
 * Falls back to synchronous localStorage on web.
 */
export async function getAsync(key: string): Promise<string | null> {
  if (hasNative()) {
    try {
      const mod: any = await import(/* @vite-ignore */ '@capacitor/preferences');
      const { value } = await mod.Preferences.get({ key: fullKey(key) });
      return value ?? null;
    } catch {
      // Plugin not installed — fall back to localStorage
    }
  }
  return readString(key);
}

/** Async setter that uses Capacitor Preferences when available. */
export async function setAsync(key: string, value: string): Promise<void> {
  if (hasNative()) {
    try {
      const mod: any = await import(/* @vite-ignore */ '@capacitor/preferences');
      await mod.Preferences.set({ key: fullKey(key), value });
      return;
    } catch {
      // Plugin not installed — fall back to localStorage
    }
  }
  writeString(key, value);
}

/* ══════════════════════════════════════════════════════════════
   STORAGE ESTIMATE (Settings screen)
   ══════════════════════════════════════════════════════════════ */

export async function estimateUsage(): Promise<{
  usedMB: number;
  quotaMB: number | null;
}> {
  if (!hasWindow() || !navigator.storage?.estimate) {
    return { usedMB: 0, quotaMB: null };
  }
  try {
    const est = await navigator.storage.estimate();
    return {
      usedMB: (est.usage ?? 0) / (1024 * 1024),
      quotaMB: est.quota ? est.quota / (1024 * 1024) : null,
    };
  } catch {
    return { usedMB: 0, quotaMB: null };
  }
}