import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(__dirname, '../src/pages');
const localesDir = path.resolve(__dirname, '../public/locales/en');
const dryRun = process.argv.includes('--dry');

// Load all English keys/values
const common = JSON.parse(readFileSync(path.join(localesDir, 'common.json'), 'utf8'));
const pages = JSON.parse(readFileSync(path.join(localesDir, 'pages.json'), 'utf8'));
const translations = { ...common, ...pages };

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  const files = await glob('**/*.astro', { cwd: pagesDir, absolute: true });

  for (const file of files) {
    let content = readFileSync(file, 'utf8');

    // Replace {t('key', `fallback`)} with <span data-i18n="key">fallback</span>
    content = content.replace(
      /\{t\(\s*['"]([^'"]+)['"]\s*,\s*`([^`]*)`\s*\)\}/g,
      (match, key, fallback) => {
        const text = translations[key] || fallback;
        return `<span data-i18n="${key}">${escapeHtml(text)}</span>`;
      }
    );

    // Replace {t('key', 'fallback')}
    content = content.replace(
      /\{t\(\s*['"]([^'"]+)['"]\s*,\s*'([^']*)'\s*\)\}/g,
      (match, key, fallback) => {
        const text = translations[key] || fallback;
        return `<span data-i18n="${key}">${escapeHtml(text)}</span>`;
      }
    );

    // Replace placeholder={t('key', 'fallback')}
    content = content.replace(
      /placeholder=\{t\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)\}/g,
      (match, key, fallback) => {
        return `placeholder="${fallback}" data-i18n-placeholder="${key}"`;
      }
    );

    // Replace aria-label={t('key', 'fallback')} similarly
    content = content.replace(
      /aria-label=\{t\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)\}/g,
      (match, key, fallback) => {
        return `aria-label="${fallback}" data-i18n-aria-label="${key}"`;
      }
    );

    if (dryRun) {
      console.log(`🔍 would update: ${path.relative(pagesDir, file)}`);
    } else {
      writeFileSync(file, content, 'utf8');
      console.log(`✅ updated: ${path.relative(pagesDir, file)}`);
    }
  }

  console.log(dryRun ? '🔍 Dry run complete. No files changed.' : '✨ All pages now have data-i18n attributes.');
}

main().catch(console.error);