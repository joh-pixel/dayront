import fs from 'fs';
import path from 'path';

const BLOG_DIR = 'src/content/blog/en';

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // 1. Fix the import statements
  // Old: import varName from './slug/filename.jpg';
  // New: import varName from '../../images/filename.jpg';
  const importRegex = /import\s+(img[a-zA-Z0-9_]+)\s+from\s+['"]\.\/[^\/]+\/([^'"]+)['"];/g;
  const newContent = content.replace(importRegex, (match, varName, filename) => {
    changed = true;
    return `import ${varName} from '../../images/${filename}';`;
  });

  // 2. Fix the frontmatter image path
  // Old: image: "slug/filename.jpg"
  // New: image: "../../images/filename.jpg"
  let finalContent = newContent;
  const frontmatterImageRegex = /image:\s*"([^\/"]+\/[^"]+)"/;
  if (frontmatterImageRegex.test(finalContent)) {
    finalContent = finalContent.replace(frontmatterImageRegex, (match, oldPath) => {
      changed = true;
      // Extract just the filename part (e.g., "slug/filename.jpg" -> "filename.jpg")
      const parts = oldPath.split('/');
      const filename = parts[parts.length - 1];
      return `image: "../../images/${filename}"`;
    });
  }

  if (changed) {
    fs.writeFileSync(filePath, finalContent);
    console.log(`✅ Updated paths in ${file}`);
  }
});

console.log('🎉 All done! Images consolidated and imports updated.');
