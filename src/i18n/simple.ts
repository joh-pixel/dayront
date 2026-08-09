type Translations = Record<string, string | Record<string, any>>;

let currentLang = 'en';
const listeners: Array<() => void> = [];

// Detect browser language or use saved preference
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem('dayront-lang');
  if (saved && ['en','es','pt','de','fr','ja'].includes(saved)) {
    currentLang = saved;
  } else {
    const browserLang = navigator.language.split('-')[0];
    if (['en','es','pt','de','fr','ja'].includes(browserLang)) {
      currentLang = browserLang;
    }
  }
}

export function getLang(): string {
  return currentLang;
}

export function setLang(lang: string): void {
  currentLang = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('dayront-lang', lang);
  }
  listeners.forEach(fn => fn());
}

export function onLangChange(fn: () => void): void {
  listeners.push(fn);
}

// Simple translation function — loads from pre-fetched JSON
let translations: Record<string, Translations> = {};

export async function loadTranslations(lang: string): Promise<void> {
  if (translations[lang]) return;
  try {
    const res = await fetch(`/locales/${lang}/common.json`);
    translations[lang] = await res.json();
  } catch {
    // fallback to English
    if (lang !== 'en') {
      await loadTranslations('en');
      translations[lang] = translations['en'] || {};
    }
  }
}

export function t(key: string, params?: Record<string, any>): string {
  const keys = key.split('.');
  let value: any = translations[currentLang] || translations['en'] || {};
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // fallback to key
    }
  }

  if (typeof value !== 'string') return key;

  // Replace {{param}} placeholders
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, p) => params[p] ?? `{{${p}}}`);
  }
  return value;
}