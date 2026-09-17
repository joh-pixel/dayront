import fs from 'fs';
import path from 'path';

const BLOG_DIR = 'src/content/blog/en';
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace image: "../../images/filename.jpg" with image: "filename.jpg"
  const frontmatterRegex = /image:\s*"\.\.\/\.\.\/images\/([^"]+)"/;
  const newContent = content.replace(frontmatterRegex, 'image: "$1"');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Updated ${file}`);
  }
});
console.log('🎉 All frontmatter paths updated to just filenames.');
