// scripts/diagnose-i18n.mjs
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(__dirname, '../src/pages');
const localesDir = path.resolve(__dirname, '../public/locales');
const languages = ['en', 'es', 'pt', 'de', 'fr', 'ja'];

async function main() {
  const files = await glob('**/*.astro', { cwd: pagesDir, absolute: true });
  console.log(`🔍 Scanning ${files.length} pages...\n`);

  const issues = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const rel = path.relative(pagesDir, file);

    // Extract frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = fmMatch ? fmMatch[1] : '';
    const rest = fmMatch ? content.slice(fmMatch[0].length) : '';

    // Check duplicates
    const importBaseLayoutCount = (frontmatter.match(/import\s+BaseLayout\s+from/g) || []).length;
    if (importBaseLayoutCount > 1) {
      issues.push(`❌ ${rel}: duplicate import BaseLayout (${importBaseLayoutCount}x)`);
    }

    const importI18nCount = (frontmatter.match(/from\s+['"].*lib\/i18n['"]/g) || []).length;
    if (importI18nCount > 1) {
      issues.push(`❌ ${rel}: duplicate i18n import (${importI18nCount}x)`);
    }

    const langDefCount = (frontmatter.match(/\bconst\s+lang\s*=/g) || []).length;
    if (langDefCount > 1) {
      issues.push(`❌ ${rel}: duplicate const lang (${langDefCount}x)`);
    }

    // Check if page uses t() but doesn't import i18n helpers or define t
    const usesT = /{t\(|{tc\(/.test(rest);
    if (usesT && !importI18nCount && !langDefCount) {
      issues.push(`⚠️  ${rel}: uses t() in template but no i18n import or lang definition`);
    }

    // Check if page passes lang to BaseLayout but doesn't define it
    if (/<BaseLayout[^>]*lang=\{lang\}/.test(rest) && !langDefCount) {
      issues.push(`❌ ${rel}: uses <BaseLayout lang={lang}> but lang is not defined`);
    }

    // Check if page uses lang={lang} but doesn't import i18n
    if (/lang=\{lang\}/.test(rest) && !importI18nCount && !langDefCount) {
      issues.push(`⚠️  ${rel}: uses lang={lang} but missing i18n import/definition`);
    }
  }

  // Check translation JSON files
  console.log('📁 Translation JSON files:');
  for (const lang of languages) {
    const missing = [];
    for (const ns of ['common', 'pages', 'tools']) {
      const file = path.join(localesDir, lang, `${ns}.json`);
      if (!existsSync(file)) missing.push(`${ns}.json`);
    }
    if (missing.length) {
      issues.push(`❌ public/locales/${lang}/ missing: ${missing.join(', ')}`);
    } else {
      console.log(`  ✅ ${lang}: common.json, pages.json, tools.json`);
    }
  }

  // Check for empty JSON files
  for (const lang of languages) {
    for (const ns of ['common', 'pages', 'tools']) {
      const file = path.join(localesDir, lang, `${ns}.json`);
      if (existsSync(file)) {
        try {
          const data = JSON.parse(readFileSync(file, 'utf8'));
          const keyCount = Object.keys(data).length;
          if (keyCount === 0) {
            issues.push(`⚠️  ${lang}/${ns}.json is empty (0 keys)`);
          }
        } catch {
          issues.push(`❌ ${lang}/${ns}.json is invalid JSON`);
        }
      }
    }
  }

  // Report
  console.log('\n📋 Issues found:');
  if (issues.length === 0) {
    console.log('   ✅ No issues detected.');
  } else {
    issues.forEach(issue => console.log('   ' + issue));
  }

  console.log('\n✨ Diagnosis complete.');
}

main().catch(console.error);