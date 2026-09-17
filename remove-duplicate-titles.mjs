import fs from 'fs';
import path from 'path';

const BLOG_DIR = 'src/content/blog/en';

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Split the file into Frontmatter and Body
  const parts = content.split('---');
  
  if (parts.length >= 3) {
    let frontmatter = parts[1];
    let body = parts.slice(2).join('---');

    // Regex: Matches the first line that starts with "# " at the beginning of the body
    // It ignores spaces and handles any title text.
    const titleRegex = /^\s*#\s+.*$/m; 
    
    const originalBody = body;
    body = body.replace(titleRegex, '').trim(); // Remove the duplicate title

    if (body !== originalBody) {
      // Reconstruct the file
      content = `---${frontmatter}---\n\n${body}`;
      fs.writeFileSync(filePath, content);
      console.log(`✅ Removed duplicate title from ${file}`);
      fixedCount++;
    }
  }
});

console.log(`\n🎉 All done! Fixed ${fixedCount} files. Restart your dev server with "npm run dev".`);
