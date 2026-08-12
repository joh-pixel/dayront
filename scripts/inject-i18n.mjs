// scripts/inject-i18n.mjs
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(__dirname, '../src/pages');
const dryRun = process.argv.includes('--dry');

const IMPORT_LINES = `import BaseLayout from '../layouts/BaseLayout.astro';
import { getLangFromAstroUrl, useTranslations } from '../lib/i18n';

const lang = getLangFromAstroUrl(Astro.url);
const { t, tc } = await useTranslations(lang, Astro.url.origin);
`;

async function main() {
  const files = await glob('**/*.astro', { cwd: pagesDir, absolute: true });

  for (const file of files) {
    let content = readFileSync(file, 'utf8');

    // Skip if already injected
    if (content.includes('getLangFromAstroUrl')) {
      console.log(`⏭  already i18n-ready: ${path.basename(file)}`);
      continue;
    }

    // Split frontmatter from rest of the file
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.warn(`⚠  No frontmatter found in ${file}, skipping.`);
      continue;
    }

    const existingFrontmatter = frontmatterMatch[1];
    const afterFrontmatter = content.slice(frontmatterMatch[0].length);

    // Build new frontmatter by prepending the imports and lang logic
    const newFrontmatter = `---
${IMPORT_LINES.trim()}
${existingFrontmatter.trim()}
---`;

    // Rebuild the file content
    const newContent = newFrontmatter + afterFrontmatter;

    // Optionally add lang={lang} to <BaseLayout if missing
    if (newContent.includes('<BaseLayout') && !newContent.includes('lang={lang}')) {
      // Insert `lang={lang} ` right after '<BaseLayout '
      // This is a simple regex replacement; adjust if your BaseLayout has other attributes
      const updatedContent = newContent.replace(
        /(<BaseLayout\b)(\s*)/,
        `$1 lang={lang}$2`
      );
      if (updatedContent !== newContent) {
        console.log(`   🔗  added lang={lang} to <BaseLayout>`);
        content = updatedContent;
      } else {
        content = newContent;
      }
    } else {
      content = newContent;
    }

    if (dryRun) {
      console.log(`📝 would update: ${path.relative(pagesDir, file)}`);
    } else {
      writeFileSync(file, content, 'utf8');
      console.log(`✅ injected: ${path.relative(pagesDir, file)}`);
    }
  }

  console.log(dryRun ? '🔍 Dry run complete. No files changed.' : '✨ All pages injected with i18n.');
}

main().catch(console.error);