// ================================================================
// src/lib/i18n.ts
// ================================================================
export const SUPPORTED_LANGS = ['en', 'es', 'pt', 'de', 'fr', 'ja'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

/**
 * Server‑side helper: Extract lang from the URL path.
 * Works with `/blog/en/...` (prefixDefaultLocale: false) and `/es/...` 
 * Handles the case where `blog` is the first segment.
 */
export function getLangFromAstroUrl(url: URL): Lang {
  const segments = url.pathname.split('/').filter(Boolean);
  // If the first segment is 'blog', check the second segment (e.g., /blog/en/...)
  const potentialLang = segments[0] === 'blog' ? segments[1] : segments[0];
  const lang = potentialLang as Lang;
  return lang && SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

/**
 * Server‑side helper: Extract lang from Astro.params.
 * This is the most direct way for pages using dynamic routes like [locale].
 */
export function getLangFromParams(locale: string | undefined): Lang {
  const lang = locale as Lang;
  return lang && SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

/**
 * Client‑side only: Determine language from URL path → localStorage → browser.
 * Must be called in a browser context (e.g., inside <script>).
 */
export function getLangFromURL(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;

  // 1. Check URL pathname (handles /blog/en, /es, etc.)
  const segments = window.location.pathname.split('/').filter(Boolean);
  const potentialLang = segments[0] === 'blog' ? segments[1] : segments[0];
  const urlLang = potentialLang as Lang;
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