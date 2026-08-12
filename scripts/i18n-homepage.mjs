import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '../src/pages/index.astro');
const commonPath = path.resolve(__dirname, '../public/locales/en/common.json');

// Read current files
let astroContent = fs.readFileSync(indexPath, 'utf8');
let common = {};
try {
  common = JSON.parse(fs.readFileSync(commonPath, 'utf8'));
} catch {}

let keyCounter = Object.keys(common).length;

// Regex to find literal English strings longer than 3 chars, not already inside t()
// This is a simplified approach – it replaces text inside HTML tags and attribute values.
// It will skip any string already wrapped in t('...').

// Helper to generate a unique key
function makeKey(text) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 30);
  keyCounter++;
  return `home_${base}_${keyCounter}`;
}

// Replace plain English text inside HTML elements (not inside <script> or <style>)
// This is a basic find-and-replace that works for most cases.
// It will not touch code blocks or existing t() calls.

// Pattern: >Some English text<  (ignoring whitespace)
const regex = />([A-Z][^<]{4,})</g; // starts with capital letter, at least 5 chars total

astroContent = astroContent.replace(regex, (match, text) => {
  // Trim and check if it looks like a real sentence/phrase
  const trimmed = text.trim();
  if (
    trimmed.startsWith('t(') ||
    trimmed.startsWith('{') ||
    trimmed.includes('{') ||
    trimmed.length < 5
  ) {
    return match;
  }

  const key = makeKey(trimmed);
  common[key] = trimmed;
  return `>{t('${key}', \`${trimmed}\`)}<`;
});

// Also replace text inside quotes for attributes like placeholder="..."
// We'll do a separate pass for attribute values
const attrRegex = /(placeholder|title|aria-label)="([^"]+)"/g;
astroContent = astroContent.replace(attrRegex, (match, attr, text) => {
  if (text.length < 5) return match;
  const key = makeKey(text);
  common[key] = text;
  return `${attr}={t('${key}', \`${text}\`)}`;
});

// Write back
fs.writeFileSync(indexPath, astroContent, 'utf8');
fs.writeFileSync(commonPath, JSON.stringify(common, null, 2), 'utf8');
console.log('✅ Homepage i18n keys added. New keys saved to common.json');