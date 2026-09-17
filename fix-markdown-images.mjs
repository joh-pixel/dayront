import fs from 'fs';
import path from 'path';

const BLOG_DIR = 'src/content/blog/en';
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // 1. Convert ![alt]({varName}) to <Image src={varName} alt="alt" />
  const mdImageRegex = /!\[(.*?)\]\(\{(img[a-zA-Z0-9_]+)\}\)/g;
  content = content.replace(mdImageRegex, '<Image src={$2} alt="$1" />');

  // 2. Ensure the Image component is imported if we made a change
  if (content !== originalContent && !content.includes("import { Image } from 'astro:assets';")) {
    const parts = content.split('---');
    if (parts.length >= 3) {
      const frontmatter = parts[1];
      let body = parts.slice(2).join('---');
      const importBlock = "import { Image } from 'astro:assets';\n";
      
      // Add the import block at the very top of the body
      body = importBlock + body.trimStart();
      content = `---${frontmatter}---\n\n${body}`;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed markdown image syntax in ${file}`);
    fixedCount++;
  }
});

console.log(`\n🎉 Done! Fixed ${fixedCount} files. Run 'npm run build' again.`);
