import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../public/locales');
const SOURCE_LANG = 'en';
const TARGET_LANGS = ['pt', 'de', 'fr', 'ja'];   // skip 'es' (already done)
const API_URL = 'https://translate.argosopentech.com/translate';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string' || text.trim() === '') return text;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: SOURCE_LANG,
      target: targetLang,
      format: 'text',
    }),
  });
  const data = await res.json();
  return data.translatedText || text;
}

async function translateObject(obj, targetLang) {
  if (typeof obj === 'string') {
    const translated = await translateText(obj, targetLang);
    await delay(1200);   // public API has strict rate limits
    return translated;
  }
  if (Array.isArray(obj)) {
    const result = [];
    for (const item of obj) {
      result.push(await translateObject(item, targetLang));
      await delay(800);
    }
    return result;
  }
  if (typeof obj === 'object' && obj !== null) {
    const translated = {};
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObject(value, targetLang);
      await delay(800);
    }
    return translated;
  }
  return obj;
}

async function main() {
  console.log('🌐 Translating via public LibreTranslate (argosopentech) …');
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG);
  if (!(await fs.pathExists(sourceDir))) {
    console.log('❌ English locale files not found. Create public/locales/en/ first.');
    return;
  }

  for (const lang of TARGET_LANGS) {
    console.log(`  → ${lang}`);
    const targetDir = path.join(LOCALES_DIR, lang);
    await fs.ensureDir(targetDir);
    const files = await fs.readdir(sourceDir);
    for (const file of files) {
      if (path.extname(file) !== '.json') continue;
      const targetPath = path.join(targetDir, file);
      if (await fs.pathExists(targetPath)) {
        console.log(`    ⏭  ${file} (already exists)`);
        continue;
      }
      const sourceData = await fs.readJson(path.join(sourceDir, file));
      console.log(`    🔄 ${file}`);
      const translatedData = await translateObject(sourceData, lang);
      await fs.writeJson(targetPath, translatedData, { spaces: 2 });
      console.log(`    ✅ ${file}`);
    }
  }
  console.log('✨ All translations completed.');
}

main().catch(console.error);