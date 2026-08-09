import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../public/locales');
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const SOURCE_LANG = 'en';
const TARGET_LANGS = ['es', 'pt', 'de', 'fr', 'ja'];

// Using MyMemory – free, no API key, 1000 words/day limit.
// To use LibreTranslate instead, replace this URL with your instance.
const TRANSLATION_API = 'https://api.mymemory.translated.net/get';

async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string' || text.trim() === '') return text;

  try {
    const url = `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=${SOURCE_LANG}|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.responseStatus === 200 && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      console.warn(`⚠️  MyMemory could not translate to ${targetLang}: "${text.slice(0, 50)}..."`);
      return text; // fallback to original
    }
  } catch (err) {
    console.warn(`⚠️  Network error for ${targetLang}: ${err.message}`);
    return text;
  }
}

async function translateObject(obj, targetLang) {
  const translated = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      translated[key] = await translateText(value, targetLang);
    } else if (Array.isArray(value)) {
      translated[key] = await Promise.all(
        value.map(item =>
          typeof item === 'string'
            ? translateText(item, targetLang)
            : translateObject(item, targetLang)
        )
      );
    } else if (typeof value === 'object' && value !== null) {
      translated[key] = await translateObject(value, targetLang);
    } else {
      translated[key] = value;
    }
  }
  return translated;
}

async function main() {
  // 1. Translate locale JSON files (common.json, tools.json, pages.json)
  console.log('🌐 Translating locale files...');
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
      const sourceData = await fs.readJson(path.join(sourceDir, file));
      const translatedData = await translateObject(sourceData, lang);
      await fs.writeJson(path.join(targetDir, file), translatedData, { spaces: 2 });
      console.log(`    ✅ ${file}`);
    }
  }

  // 2. Translate blog posts (if any)
  console.log('📝 Translating blog posts...');
  const sourceBlogDir = path.join(BLOG_DIR, SOURCE_LANG);
  if (!(await fs.pathExists(sourceBlogDir))) {
    console.log('ℹ️  No English blog posts found. Skipping.');
    return;
  }

  for (const lang of TARGET_LANGS) {
    console.log(`  → ${lang}`);
    const targetBlogDir = path.join(BLOG_DIR, lang);
    await fs.ensureDir(targetBlogDir);
    const posts = await fs.readdir(sourceBlogDir);
    for (const post of posts) {
      if (path.extname(post) !== '.mdx') continue;
      const raw = await fs.readFile(path.join(sourceBlogDir, post), 'utf8');
      const { data, content } = matter(raw);

      // Translate frontmatter values
      const translatedData = {};
      for (const [key, value] of Object.entries(data)) {
        translatedData[key] = typeof value === 'string' ? await translateText(value, lang) : value;
      }

      const translatedContent = await translateText(content, lang);
      const newMdx = matter.stringify(translatedContent, translatedData);
      await fs.writeFile(path.join(targetBlogDir, post), newMdx, 'utf8');
      console.log(`    📄 ${post}`);
    }
  }

  console.log('✨ All translations completed.');
}

main().catch(console.error);