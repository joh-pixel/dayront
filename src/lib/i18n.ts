// ================================================================
// src/lib/i18n.ts
// ================================================================
export const SUPPORTED_LANGS = ['en', 'es', 'pt', 'de', 'fr', 'ja'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

/**
 * Server‑side / Astro frontmatter: extract lang from URL query parameter.
 * Safe to use in .astro files’ frontmatter.
 */
export function getLangFromAstroUrl(url: URL): Lang {
  const params = new URLSearchParams(url.search);
  const lang = params.get('lang') as Lang;
  return lang && SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

/**
 * Client‑side only: determine language from URL → localStorage → browser.
 * Must be called in a browser context (e.g., inside <script>).
 */
export function getLangFromURL(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;

  // 1. Check URL query parameter
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang') as Lang;
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) {
    localStorage.setItem('dayront-lang', urlLang);
    return urlLang;
  }

  // 2. Check localStorage
  const stored = localStorage.getItem('dayront-lang') as Lang | null;
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;

  // 3. Browser language
  const browserLang = navigator.language?.split('-')[0] as Lang;
  if (browserLang && SUPPORTED_LANGS.includes(browserLang)) return browserLang;

  return DEFAULT_LANG;
}

/**
 * Load translation JSON file. Works both server‑side (with origin) and client‑side.
 * Falls back to English if the requested language fails.
 */
export async function loadTranslations(
  lang: Lang,
  namespace: string,
  origin?: string, // pass Astro.url.origin on server‑side
): Promise<Record<string, any>> {
  const baseUrl = origin ?? '';
  try {
    const res = await fetch(`${baseUrl}/locales/${lang}/${namespace}.json`);
    if (res.ok) return res.json();
  } catch {}

  // Fallback to English
  try {
    const res = await fetch(`${baseUrl}/locales/en/${namespace}.json`);
    if (res.ok) return res.json();
  } catch {}

  return {};
}

/**
 * Convenience wrapper that returns a translation helper `t()` and `tc()`.
 * Designed for use in Astro pages.
 */
export async function useTranslations(lang: Lang, origin: string) {
  const pages = await loadTranslations(lang, 'pages', origin);
  const common = await loadTranslations(lang, 'common', origin);

  const t = (key: string, fallback: string) => {
    const keys = key.split('.');
    let val: any = pages;
    for (const k of keys) {
      if (val && typeof val === 'object') val = val[k];
      else return fallback;
    }
    return typeof val === 'string' ? val : fallback;
  };

  const tc = (key: string, fallback: string) => common[key] || fallback;

  return { t, tc, lang, pages, common };
}