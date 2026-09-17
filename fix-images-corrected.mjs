import fs from 'fs';
import path from 'path';

const BLOG_DIR = 'src/content/blog/en';

async function fixImages() {
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
  console.log(`🔍 Found ${files.length} blog files to check.\n`);

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const slug = file.replace('.mdx', '');
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // 1. Check for broken placeholders like {img10essentialaudi1}
    const brokenPlaceholderRegex = /\{img[a-zA-Z0-9_]+\}/g;
    const brokenMatches = content.match(brokenPlaceholderRegex);

    // 2. Check for any remaining Unsplash URLs
    const unsplashRegex = /https:\/\/images\.unsplash\.com\/[^\s"')]+/g;
    const unsplashMatches = content.match(unsplashRegex);

    if (!brokenMatches && !unsplashMatches) {
      continue; // No issues, skip
    }

    console.log(`🖼️  Processing ${slug}...`);

    let imageCounter = 1;
    const imageDir = path.join(BLOG_DIR, slug);
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

    let importStatements = [];
    let body = content;

    // --- Handle Broken Placeholders ---
    if (brokenMatches) {
      const uniquePlaceholders = [...new Set(brokenMatches)];
      for (const placeholder of uniquePlaceholders) {
        const varName = placeholder.replace(/[{}]/g, '');
        // Find the original import path (assuming it was added by the previous script)
        const importPathRegex = new RegExp(`import\\s+${varName}\\s+from\\s+['"](.*?)['"];`);
        const importMatch = body.match(importPathRegex);
        
        if (importMatch) {
          // Keep the import statement, but remove the broken placeholder from the body
          body = body.replace(new RegExp(placeholder, 'g'), `{${varName}}`); // Will be fixed in the next step
          importStatements.push(importMatch[0]); // Keep the original import
          body = body.replace(importMatch[0], ''); // Remove from body to re-add later
        } else {
          // If no import found, this is a critical error. We'll leave it and log.
          console.error(`  ❌ Could not find import for ${varName} in ${slug}`);
        }
      }
    }

    // --- Handle Remaining Unsplash URLs ---
    if (unsplashMatches) {
      const uniqueUrls = [...new Set(unsplashMatches)];
      for (const url of uniqueUrls) {
        const imgName = `${slug}-${imageCounter}.jpg`;
        const imgPath = path.join(imageDir, imgName);
        const relativePath = `./${slug}/${imgName}`;
        const varName = `img${slug.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15)}${imageCounter}`;

        console.log(`  ⬇️  Downloading: ${url.substring(0, 60)}...`);
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buffer = await res.arrayBuffer();
          fs.writeFileSync(imgPath, Buffer.from(buffer));
        } catch (e) {
          console.error(`  ❌ Failed to download: ${url}`, e.message);
          imageCounter++;
          continue;
        }

        // Add import statement
        importStatements.push(`import ${varName} from '${relativePath}';`);

        // Replace the URL in the body with the variable
        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        body = body.replace(new RegExp(escapedUrl, 'g'), `{${varName}}`);
        
        imageCounter++;
      }
    }

    // --- Final Cleanup of <img> tags ---
    // Convert any remaining <img> tags that now have a variable as src
    const imgTagRegex = /<img\s+([^>]*)src=\{([a-zA-Z0-9_]+)\}([^>]*)>/g;
    body = body.replace(imgTagRegex, (match, p1, varName, p2) => {
      return `<Image ${p1.trim()} src={${varName}} ${p2.trim()} />`;
    });

    // --- Reassemble the MDX file ---
    const parts = body.split('---');
    if (parts.length >= 3) {
      let frontmatter = parts[1];
      let mainBody = parts.slice(2).join('---');
      
      // Update frontmatter image field if it's broken
      const frontmatterImageRegex = /image:\s*".*?"/;
      if (frontmatterImageRegex.test(frontmatter)) {
        // Try to find the first image for the frontmatter
        if (importStatements.length > 0) {
          const firstImport = importStatements[0];
          const pathMatch = firstImport.match(/from\s+['"](.*?)['"]/);
          if (pathMatch) {
            frontmatter = frontmatter.replace(frontmatterImageRegex, `image: "${pathMatch[1].replace(/^\.\//, '')}"`);
          }
        }
      }

      // Add import block to the top of the body
      const importBlock = `import { Image } from 'astro:assets';\n${importStatements.join('\n')}\n\n`;
      
      // Remove any existing Astro Image import to avoid duplication
      mainBody = mainBody.replace(/import { Image } from 'astro:assets';\n/g, '');
      
      content = `---${frontmatter}---\n\n${importBlock}${mainBody}`;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed ${slug}\n`);
    }
  }
  console.log('🎉 All done! Check your files and run "npm run build".');
}

fixImages();
