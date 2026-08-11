import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsFilePath = path.resolve(__dirname, '../src/lib/tools.ts');

// Read the tools.ts file and extract the tools array
const toolsContent = fs.readFileSync(toolsFilePath, 'utf8');

// A very basic extraction of the tools array – assumes the file ends with `];`
// For a robust solution, use a TypeScript parser, but for now this regex works.
const match = toolsContent.match(/export const tools: Tool\[\] = (\[[\s\S]*\]);/);
if (!match) throw new Error('Could not find tools array in tools.ts');
let toolsArray;
try {
  toolsArray = eval(match[1]);
} catch (e) {
  throw new Error('Failed to parse tools array: ' + e.message);
}

const blogPosts = [
  { slug: 'how-to-convert-mp4-to-mp3', title: 'How to Convert MP4 to MP3 Online – Private, Fast & Free', categories: ['mp4', 'mp3', 'audio extraction'] },
  { slug: 'privacy-local-processing', title: 'Why Local Processing Matters – Your Files, Your Device', categories: ['privacy', 'local processing'] },
  { slug: 'why-browser-processing-secure', title: 'Why Browser‑Based Audio Processing is More Secure Than Desktop Software', categories: ['security', 'local processing'] },
  { slug: 'understanding-audio-formats', title: 'Understanding Audio Formats: MP3, WAV, FLAC, OGG, and M4A Explained', categories: ['audio formats'] },
  { slug: 'ultimate-guide-audio-compression', title: 'The Ultimate Guide to Audio Compression: Reduce File Size Without Losing Quality', categories: ['compression', 'audio editing'] },
  { slug: '10-essential-audio-editing-tips', title: '10 Essential Audio Editing Tips for Podcasters and Content Creators', categories: ['podcast', 'audio editing'] },
  { slug: 'how-to-change-audio-speed', title: 'How to Speed Up or Slow Down Audio Without Changing Pitch', categories: ['speed changer', 'audio editing'] },
  { slug: 'the-complete-guide-to-converting-video-to-audio', title: 'The Complete Guide to Converting Video to Audio: MP4, MOV, MKV to MP3', categories: ['video to audio'] },
  { slug: 'audio-quality-comparison-lossy-vs-lossless', title: 'Audio Quality Compared: Lossy vs Lossless – What You\'re Really Losing', categories: ['audio quality'] },
  { slug: 'video-to-audio-stats-what-people-convert', title: 'What People Actually Convert: Video‑to‑Audio Usage Statistics & Insights', categories: ['statistics'] },
  { slug: 'audio-editing-workflow-privacy-first', title: 'A Complete Privacy‑First Audio Editing Workflow Using Only Your Browser', categories: ['workflow', 'privacy'] },
];

function findRelatedBlogs(tool) {
  const toolName = tool.name.toLowerCase();
  const toolSlug = tool.slug.toLowerCase();
  return blogPosts.filter(post => {
    const postTitle = post.title.toLowerCase();
    const postCategories = (post.categories || []).join(' ').toLowerCase();
    return (
      postTitle.includes(toolName) ||
      postCategories.includes(toolName) ||
      toolSlug.includes(post.slug.split('-').pop()) ||
      (tool.from && postTitle.includes(tool.from)) ||
      (tool.to && postTitle.includes(tool.to))
    );
  });
}

function generateTutorial(tool) {
  const name = tool.name;
  const from = tool.from ? tool.from.toUpperCase() : '';
  const to = tool.to ? tool.to.toUpperCase() : '';
  if (tool.type === 'convert' || tool.type === 'convert-video') {
    return `
      <h2>Why Convert ${from} to ${to}?</h2>
      <p>Converting ${from} to ${to} is one of the most common audio/video tasks. Our ${name} tool makes it effortless and completely private. Whether you need to save space, improve compatibility, or extract audio for editing, this tool does it instantly in your browser.</p>
      <h3>Key Benefits</h3>
      <ul>
        <li><strong>100% Private</strong> – Your files never leave your device.</li>
        <li><strong>No Software Install</strong> – Works directly in your browser.</li>
        <li><strong>Free & Unlimited</strong> – Use it as many times as you need.</li>
        <li><strong>High Quality</strong> – Preserves the best possible quality during conversion.</li>
      </ul>
    `;
  }
  if (tool.type === 'video-compress') {
    return `
      <h2>How to Compress Video Files Without Losing Quality</h2>
      <p>Video files can be huge, taking up precious storage. Our ${name} lets you reduce file size while keeping the quality as high as you want. Use the quality slider to find the perfect balance.</p>
      <h3>Tips for Best Results</h3>
      <ul>
        <li>Use a lower CRF (18‑23) for near‑lossless compression.</li>
        <li>Choose "medium" or "slow" preset for better compression (smaller file).</li>
        <li>Always keep an original copy if you may need to edit later.</li>
      </ul>
    `;
  }
  if (tool.type === 'video-cut') {
    return `
      <h2>Precise Video Cutting Without Re‑encoding</h2>
      <p>Our ${name} lets you trim videos without losing quality because it uses stream copy. Just enter the start time and duration, and get your clip instantly.</p>
      <h3>Common Use Cases</h3>
      <ul>
        <li>Cut out unwanted sections from recorded meetings.</li>
        <li>Save the best moments from a long video.</li>
        <li>Create short previews for social media.</li>
      </ul>
    `;
  }
  if (tool.type === 'video-to-gif') {
    return `
      <h2>Create Perfect GIFs from Videos</h2>
      <p>Turn any video clip into an animated GIF with our ${name}. Adjust the frame rate and size to get a small, shareable file.</p>
      <h3>Pro Tips</h3>
      <ul>
        <li>Keep GIFs short (a few seconds) for smaller file size.</li>
        <li>Use a lower FPS for smaller GIFs.</li>
        <li>Resize to 320px width for most social platforms.</li>
      </ul>
    `;
  }
  // Generic tutorial for other tools
  return `
    <h2>Using Our ${name}</h2>
    <p>Our ${name} tool is designed to be simple and private. Upload your file, adjust any settings, and download the processed result – all inside your browser. No data ever leaves your device.</p>
    <h3>Why Choose Dayront?</h3>
    <ul>
      <li>No uploads – your files stay on your device.</li>
      <li>Fast processing using the latest browser technology.</li>
      <li>Completely free, no registration required.</li>
    </ul>
  `;
}

function generatePage(tool) {
  const isConversion = tool.from && tool.to;
  const folder = isConversion ? 'convert' : 'tools';
  const filename = isConversion ? `${tool.slug}.astro` : `${tool.slug}.astro`;
  const filePath = path.resolve(__dirname, `../src/pages/${folder}/${filename}`);

  const relatedTools = (tool.relatedTools || []).map(slug => {
    const t = toolsArray.find(tt => tt.slug === slug);
    if (!t) return null;
    return {
      href: t.from && t.to ? `/convert/${t.slug}` : `/tools/${t.slug}`,
      icon: t.icon,
      name: t.name,
    };
  }).filter(Boolean);

  const relatedBlogs = findRelatedBlogs(tool);

  const tutorialSection = generateTutorial(tool);

  const content = `---
import ToolLayout from '../../layouts/ToolLayout.astro';

const tool = {
  slug: ${JSON.stringify(tool.slug)},
  name: ${JSON.stringify(tool.name)},
  metaTitle: ${JSON.stringify(tool.metaTitle)},
  metaDescription: ${JSON.stringify(tool.metaDescription)},
  icon: ${JSON.stringify(tool.icon)},
  howTo: ${JSON.stringify(tool.howTo)},
  faq: ${JSON.stringify(tool.faq)},
  relatedTools: ${JSON.stringify(relatedTools)},
  type: ${JSON.stringify(tool.type || 'convert')},
  from: ${JSON.stringify(tool.from)},
  to: ${JSON.stringify(tool.to)},
  outputFormat: ${JSON.stringify(tool.outputFormat)},
  settings: ${JSON.stringify(tool.settings || [])},
  tutorial: ${JSON.stringify(tutorialSection)},
  relatedBlogs: ${JSON.stringify(relatedBlogs)},
};
---

<ToolLayout
  toolKey={tool.slug}
  toolConfig={{
    type: tool.type,
    from: tool.from,
    to: tool.to,
    outputFormat: tool.outputFormat,
    label: tool.name,
    settings: tool.settings,
  }}
  extraContent={{
    tutorial: tool.tutorial,
    relatedBlogs: tool.relatedBlogs,
  }}
/>
`;

  // Ensure directory exists
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Generated ${filePath}`);
}

// Generate for all tools
toolsArray.forEach(tool => generatePage(tool));
console.log('All tool pages generated.');