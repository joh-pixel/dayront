import fs from 'fs'; import path from 'path';
// ⚙️ CONFIGURATION
const BLOG_DIR = 'src/content/blog/en';
// Helper to create safe variable names from slugs
const toVarName = (str, index) => { return 'img' + 
    str.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15) + index;
};
async function processBlogs() { const files = 
  fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx')); console.log(`🔍 
  Found ${files.length} blog files to process.\n`); for (const file of files) 
  {
    const filePath = path.join(BLOG_DIR, file); const slug = 
    file.replace('.mdx', ''); let content = fs.readFileSync(filePath, 
    'utf-8');
    // Find Unsplash image URLs
    const urlRegex = /https:\/\/images\.unsplash\.com\/[^\s"')]+/g; const 
    matches = content.match(urlRegex); if (!matches || matches.length === 0) 
    {
      console.log(`⏭️ Skipping ${slug} - No Unsplash URLs found.`); continue;
    }
    console.log(`🖼️ Processing ${slug} - Found ${matches.length} image 
    URLs.`); const uniqueUrls = [...new Set(matches)]; const imageDir = 
    path.join(BLOG_DIR, slug);
    
    // Create a folder for the blog post's images
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true 
    });
    let imports = []; let count = 1; for (const url of uniqueUrls) { const 
      imgName = `${slug}-${count}.jpg`; const imgPath = path.join(imageDir, 
      imgName); const relativePath = `./${slug}/${imgName}`; const varName = 
      toVarName(slug, count); console.log(` ⬇️ Downloading: ${url.substring(0, 
      50)}...`); try {
        // Node 18+ has native fetch
        const res = await fetch(url); if (!res.ok) throw new Error(`HTTP 
        error! status: ${res.status}`); const buffer = await 
        res.arrayBuffer(); fs.writeFileSync(imgPath, Buffer.from(buffer));
      } catch (e) {
        console.error(` ❌ Failed to download ${url}`, e.message); count++; 
        continue;
      }
      // Prepare import statement
      imports.push(`import ${varName} from '${relativePath}';`);
      // Replace URL in the markdown body with the Astro variable
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); content 
      = content.replace(new RegExp(escapedUrl, 'g'), `{${varName}}`);
      // Convert <img> tags to Astro's <Image> component This specifically 
      // looks for the <img> tag containing the new variable
      const imgRegex = new RegExp(`<img\\s+([^>]*)src={${varName}}([^>]*)>`, 
      'g'); content = content.replace(imgRegex, (match, p1, p2) => {
          return `<Image ${p1.trim()} src={${varName}} ${p2.trim()} />`;
      });
      count++;
    }
    // Inject imports at the top of the body, right after the frontmatter
    const parts = content.split('---'); if (parts.length >= 3) { let 
      frontmatter = parts[1]; let body = parts.slice(2).join('---');
      
      // Only add the Astro import if it's not already there
      let importBlock = ''; if (!body.includes("import { Image } from 
      'astro:assets';")) {
          importBlock += `import { Image } from 'astro:assets';\n`;
      }
      importBlock += imports.join('\n') + '\n\n';
      
      // Clean up any potential duplicate import blocks
      body = body.replace(/import { Image } from 'astro:assets';\n/g, '');
      
      content = `---${frontmatter}---\n\n${importBlock}${body}`;
    }
    fs.writeFileSync(filePath, content); console.log(` ✅ Finished ${slug} - 
    Saved ${uniqueUrls.length} local images.\n`);
  }
  console.log('🎉 All done! Your blogs now use local, optimized images.');
}
processBlogs();

