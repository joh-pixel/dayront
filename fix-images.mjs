import fs from 'fs';
import path from 'path';

const BLOG_DIR = 'src/content/blog/en';
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. Fix the frontmatter issue
  const frontmatterRegex = /image:\s*"\{(img[a-zA-Z0-9_]+)\}"/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    const varName = match[1];
    const importRegex = new RegExp(`import\\s+${varName}\\s+from\\s+['"](.*?)['"];`);
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      const cleanPath = importMatch[1].replace(/^\.\//, '');
      content = content.replace(frontmatterRegex, `image: "${cleanPath}"`);
      changed = true;
    } else {
      content = content.replace(frontmatterRegex, `image: ""`);
      changed = true;
    }
  }

  // 2. Fix the body <img> tags to Astro <Image> tags
  const originalContent = content;
  content = content.replace(/<img\s+/g, '<Image ');
  if (content !== originalContent) changed = true;

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${file}`);
  }
});

console.log('🎉 All done! Frontmatter and body images are now fixed.');
