import fs from 'fs';
import path from 'path';

const BLOG_DIR = 'src/content/blog/en';
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. Fix invalid destructuring imports: import {imgName} from '...' -> import imgName from '...'
  // This specifically targets variables starting with "img" to avoid breaking "import { Image } from 'astro:assets'"
  const badImportRegex = /import\s+\{(img[a-zA-Z0-9_]+)\}\s+from/g;
  content = content.replace(badImportRegex, 'import $1 from');

  // 2. Just in case, fix any leftover quoted variables in the <Image> component
  const badSrcRegex = /src="\{(img[a-zA-Z0-9_]+)\}"/g;
  content = content.replace(badSrcRegex, 'src={$1}');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed import syntax in ${file}`);
    fixedCount++;
  }
});

console.log(`\n🎉 Done! Fixed ${fixedCount} files. Restart your build.`);
