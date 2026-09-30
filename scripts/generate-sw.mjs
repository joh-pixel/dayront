#!/usr/bin/env node
/**
 * Generates public/sw.js from scripts/sw.template.js by injecting a
 * version string derived from package.json + today's UTC date.
 *
 * Runs automatically before every `npm run build` (via the "prebuild" hook).
 *
 * Example output version: 1.0.0-20260930
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TEMPLATE_PATH = path.join(__dirname, 'sw.template.js');
const OUTPUT_PATH = path.join(ROOT, 'public', 'sw.js');
const PKG_PATH = path.join(ROOT, 'package.json');

function buildStamp(date = new Date()) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function main() {
  const pkgRaw = await fs.readFile(PKG_PATH, 'utf8');
  const pkg = JSON.parse(pkgRaw);
  const appVersion = pkg.version || '0.0.0';

  const version = `${appVersion}-${buildStamp()}`;

  let template;
  try {
    template = await fs.readFile(TEMPLATE_PATH, 'utf8');
  } catch (err) {
    console.error(`[generate-sw] ❌ Cannot read template at ${TEMPLATE_PATH}`);
    throw err;
  }

  if (!template.includes('__VERSION__')) {
    console.error(
      '[generate-sw] ❌ Template is missing the __VERSION__ placeholder.\n' +
      '               Add `const VERSION = "__VERSION__";` to scripts/sw.template.js'
    );
    process.exit(1);
  }

  const output = template.replace(/__VERSION__/g, version);

  // Ensure public/ exists (it should, but be safe)
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, output, 'utf8');

  console.log(`[generate-sw] ✅ public/sw.js → VERSION = ${version}`);
}

main().catch((err) => {
  console.error('[generate-sw] ❌', err);
  process.exit(1);
});