// scripts/fix-lang.mjs
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(__dirname, '../src/pages');
const dryRun = process.argv.includes('--dry');

async function main() {
  const files = await glob('**/*.astro', { cwd: pagesDir, absolute: true });

  for (const file of files) {
    let content = readFileSync(file, 'utf8');

    // Extract frontmatter (between first --- and second ---)
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const frontmatter = fmMatch[1];
    const rest = content.slice(fmMatch[0].length);

    // Check if this file imports getLangFromAstroUrl or useTranslations from i18n
    const hasI18nImport = /from\s+['"].*lib\/i18n['"]/.test(frontmatter);

    // Check if there is already any 'const lang =' definition
    const hasLangDef = /\bconst\s+lang\s*=/.test(frontmatter);

    if (hasI18nImport && !hasLangDef) {
      // Find the i18n import line and insert the lang definition right after it
      const importLine = frontmatter.match(/^import\s+.*from\s+['"].*lib\/i18n['"];?\s*$/m);
      if (importLine) {
        const newFrontmatter = frontmatter.replace(
          importLine[0],
          `${importLine[0]}\n\nconst lang = getLangFromAstroUrl(Astro.url);`
        );

        const newContent = `---\n${newFrontmatter}\n---${rest}`;

        if (dryRun) {
          console.log(`🔍 would fix: ${path.relative(pagesDir, file)}`);
        } else {
          writeFileSync(file, newContent, 'utf8');
          console.log(`✅ fixed: ${path.relative(pagesDir, file)}`);
        }
      }
    }
  }

  console.log(dryRun ? '🔍 Dry run complete. No files changed.' : '✨ All missing lang definitions added.');
}

main().catch(console.error);