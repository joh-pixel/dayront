// scripts/fix-i18n-issues.mjs
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir = path.resolve(__dirname, '../src/pages');
const layoutsDir = path.resolve(__dirname, '../src/layouts');
const libDir = path.resolve(__dirname, '../src/lib');

function toPosix(p) {
  return p.split(path.sep).join('/');
}

async function main() {
  const files = await glob('**/*.astro', { cwd: pagesDir, absolute: true });
  console.log(`🔧 Scanning ${files.length} pages...\n`);

  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);

    if (!fmMatch) continue;

    const frontmatter = fmMatch[1];
    const rest = raw.slice(fmMatch[0].length);

    // Split frontmatter into lines for manipulation
    let lines = frontmatter.split('\n');

    // --- 1. Remove duplicate BaseLayout imports, then re-add correct one ---
    const baseLayoutImportIndex = lines.findIndex(line =>
      /^import\s+BaseLayout\s+from\s+['"].*BaseLayout\.astro['"]/.test(line)
    );
    if (baseLayoutImportIndex !== -1) {
      // Remove all BaseLayout imports
      lines = lines.filter(line => !/^import\s+BaseLayout\s+from\s+['"].*BaseLayout\.astro['"]/.test(line));

      // Compute correct relative import path
      const relPath = toPosix(path.relative(path.dirname(file), path.join(layoutsDir, 'BaseLayout.astro')));
      const importLine = `import BaseLayout from '${relPath.startsWith('.') ? relPath : './' + relPath}';`;

      // Insert at top (after optional other imports, but easiest: at very beginning)
      lines.unshift(importLine);
    }

    // --- 2. Check if the template uses lang={lang} or t() ---
    const usesLang = /lang=\{lang\}/.test(rest);
    const usesT = /{t\(|{tc\(/.test(rest);

    if (usesLang || usesT) {
      // Ensure i18n import exists
      const hasI18nImport = lines.some(line => /^import\s+.*from\s+['"].*lib\/i18n['"]/.test(line));
      if (!hasI18nImport) {
        const relPath = toPosix(path.relative(path.dirname(file), path.join(libDir, 'i18n')));
        const importLine = `import { getLangFromAstroUrl } from '${relPath.startsWith('.') ? relPath : './' + relPath}';`;
        // Insert after BaseLayout import
        const baseIdx = lines.findIndex(line => /^import\s+BaseLayout\s+from/.test(line));
        lines.splice(baseIdx + 1, 0, importLine);
      }

      // Ensure const lang = getLangFromAstroUrl(Astro.url) exists
      const hasLangDef = lines.some(line => /\bconst\s+lang\s*=/.test(line));
      if (!hasLangDef) {
        const langLine = 'const lang = getLangFromAstroUrl(Astro.url);';
        // Insert after i18n import
        const i18nIdx = lines.findIndex(line => /^import\s+.*from\s+['"].*lib\/i18n['"]/.test(line));
        lines.splice(i18nIdx + 1, 0, langLine);
      }
    }

    // --- 3. Remove duplicate const lang lines (if any) ---
    const langDefIndices = lines
      .map((line, idx) => ({ line, idx }))
      .filter(({ line }) => /\bconst\s+lang\s*=/.test(line))
      .map(({ idx }) => idx);

    if (langDefIndices.length > 1) {
      // Keep first, remove rest
      const keepIdx = langDefIndices[0];
      lines = lines.filter((_, idx) => !/\bconst\s+lang\s*=/.test(lines[idx]) || idx === keepIdx);
    }

    const newFrontmatter = lines.join('\n');
    const newContent = `---\n${newFrontmatter}\n---${rest}`;

    if (newContent !== raw) {
      writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Fixed: ${path.relative(pagesDir, file)}`);
    }
  }

  console.log('\n✨ All issues fixed. Re-run diagnosis to verify.');
}

main().catch(console.error);