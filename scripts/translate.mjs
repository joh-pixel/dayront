import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import * as deepl from 'deepl-node';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCALES_DIR = path.resolve(__dirname, '../public/locales');
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const SOURCE_LANG = 'en';
const TARGET_LANGS = ['es', 'pt', 'de', 'fr', 'ja'];

const DEEPL_API_KEY = 'a36b9b71-076c-4cba-bcde-b480e23b6d1c:fx';
const translator = new deepl.Translator(DEEPL_API_KEY); // uses standard API URL

const langMap = {
  es: 'es',
  pt: 'pt-PT',   // change to 'pt-BR' for Brazilian Portuguese
  de: 'de',
  fr: 'fr',
  ja: 'ja',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function translateText(text, targetLang) {
  // Only strings can be translated
  if (typeof text !== 'string') return text;
  if (text.trim() === '') return text;

  const deeplLang = langMap[targetLang] || targetLang;
  const result = await translator.translateText(text, SOURCE_LANG, deeplLang);
  return result.text;
}

async function translateObject(obj, targetLang) {
  if (typeof obj === 'string') {
    const translated = await translateText(obj, targetLang);
    await delay(200);
    return translated;
  }
  if (Array.isArray(obj)) {
    const result = [];
    for (const item of obj) {
      result.push(await translateObject(item, targetLang));
      await delay(150);
    }
    return result;
  }
  if (typeof obj === 'object' && obj !== null) {
    const translated = {};
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObject(value, targetLang);
      await delay(150);
    }
    return translated;
  }
  // numbers, booleans, etc. – return as‑is
  return obj;
}

async function main() {
  console.log('🌐 Translating locale files (DeepL)…');
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

  console.log('📝 Translating blog posts…');
  const sourceBlogDir = path.join(BLOG_DIR, SOURCE_LANG);
  if (!(await fs.pathExists(sourceBlogDir))) {
    console.log('ℹ️  No English blog posts found. Skipping.');
  } else {
    for (const lang of TARGET_LANGS) {
      console.log(`  → ${lang}`);
      const targetBlogDir = path.join(BLOG_DIR, lang);
      await fs.ensureDir(targetBlogDir);
      const posts = await fs.readdir(sourceBlogDir);
      for (const post of posts) {
        if (path.extname(post) !== '.mdx') continue;

        const targetPath = path.join(targetBlogDir, post);
        if (await fs.pathExists(targetPath)) {
          console.log(`    ⏭  ${post} (already exists)`);
          continue;
        }

        const raw = await fs.readFile(path.join(sourceBlogDir, post), 'utf8');
        const { data, content } = matter(raw);

        const translatedData = {};
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string') {
            translatedData[key] = await translateText(value, lang);
          } else if (Array.isArray(value)) {
            translatedData[key] = await Promise.all(
              value.map(v => (typeof v === 'string' ? translateText(v, lang) : v))
            );
          } else {
            translatedData[key] = value;
          }
        }

        const translatedContent = await translateText(content, lang);
        const newMdx = matter.stringify(translatedContent, translatedData);
        await fs.writeFile(targetPath, newMdx, 'utf8');
        console.log(`    📄 ${post}`);
      }
    }
  }

  console.log('✨ All translations completed (DeepL).');
}

main().catch(console.error);