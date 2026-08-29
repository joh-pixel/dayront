import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../public/locales');
const SOURCE_LANG = 'en';
const TARGET_LANGS = ['es', 'pt', 'de', 'fr', 'ja'];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function translateText(text, targetLang) {
  if (typeof text !== 'string') return text;
  if (text.trim() === '') return text;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${SOURCE_LANG}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Extract translated text from the nested array
      const translated = data?.[0]?.map(seg => seg?.[0]).join('') || text;
      return translated;
    } catch (err) {
      console.warn(`   ⚠️  attempt ${attempt}/3 failed for "${text.slice(0, 40)}": ${err.message}`);
      if (attempt === 3) return text;
      await delay(3000 * attempt);
    }
  }
}

async function translateObject(obj, targetLang) {
  if (typeof obj === 'string') {
    const translated = await translateText(obj, targetLang);
    await delay(1200);
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
  console.log('🌐 Translating locale files (Google endpoint)…');
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LANG);
  if (!(await fs.pathExists(sourceDir))) {
    console.log('❌ English locale files not found.');
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

  console.log('✨ All translations completed (Google endpoint).');
}

main().catch(console.error);