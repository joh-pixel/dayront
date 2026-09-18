import fs from 'fs';
import path from 'path';

const OUT_DIR = 'src/pages/convert';

const RES = {
  '480p':  { w: 854,  h: 480,  label: '480p SD',       tier: 1 },
  '720p':  { w: 1280, h: 720,  label: '720p HD',       tier: 2 },
  '1080p': { w: 1920, h: 1080, label: '1080p Full HD', tier: 3 },
  '2k':    { w: 2560, h: 1440, label: '2K QHD',        tier: 4 },
  '4k':    { w: 3840, h: 2160, label: '4K UHD',        tier: 5 },
  '8k':    { w: 7680, h: 4320, label: '8K UHD',        tier: 6 },
};

function humanSize(w, h) {
  return `${w} × ${h} (${(w * h / 1_000_000).toFixed(2)} MP)`;
}

function buildFile(from, to) {
  const fromRes = RES[from];
  const toRes = RES[to];
  const isUpscale = toRes.tier > fromRes.tier;
  const slug = `${from}-to-${to}`;
  const action = isUpscale ? 'Upscale' : 'Downscale';
  const name = `${fromRes.label} to ${toRes.label} ${action}er`;

  // Determine desktop requirement
  const requiresDesktop = from === '8k' || to === '8k' || (isUpscale && toRes.tier >= 5);
  const is8k = to === '8k';

  // Warning message per tier
  let warningMessage = '';
  if (is8k) {
    warningMessage = 'Converting to 8K is extremely resource-intensive. A 30-second clip can consume 4GB+ of RAM. Use a powerful desktop computer.';
  } else if (requiresDesktop) {
    warningMessage = 'This conversion is CPU-intensive. Keep the tab open and avoid running other heavy apps.';
  }

  const metaTitle = `${fromRes.label} to ${toRes.label} Converter – Free Online | Dayront`;
  const metaDescription = `${action} ${fromRes.label} videos to ${toRes.label} in your browser. Free, private, no uploads. 100% local processing.`;

  const tutorial = `\n      <h2>Why ${action} ${fromRes.label} to ${toRes.label}?</h2>\n      <p>${isUpscale ? `Upscaling to ${toRes.label} prepares your footage for large displays, projectors, or platforms that require higher resolutions.` : `Downscaling to ${toRes.label} reduces file size, improves playback on older devices, and meets upload limits on social platforms.`}</p>\n      <h3>Resolution Comparison</h3>\n      <table>\n        <thead><tr><th>Format</th><th>Dimensions</th><th>Total Pixels</th></tr></thead>\n        <tbody>\n          <tr><td>Source (${fromRes.label})</td><td>${humanSize(fromRes.w, fromRes.h)}</td></tr>\n          <tr><td>Output (${toRes.label})</td><td>${humanSize(toRes.w, toRes.h)}</td></tr>\n        </tbody>\n      </table>\n      <h3>Key Benefits</h3>\n      <ul>\n        <li><strong>100% Private</strong> – Your files never leave your device.</li>\n        <li><strong>No Software Install</strong> – Works directly in your browser.</li>\n        <li><strong>Free & Unlimited</strong> – Use it as many times as you need.</li>\n      </ul>\n    `;

  const faq = is8k
    ? `[{"q":"Can I convert to 8K on mobile?","a":"No. 8K requires more memory than most mobile browsers can allocate. Use a desktop with 16GB+ RAM."},{"q":"How long does 8K conversion take?","a":"A 30-second 1080p clip to 8K can take 3-10 minutes depending on your CPU."}]`
    : isUpscale
    ? `[{"q":"Will upscaling add detail?","a":"No. Upscaling interpolates pixels but cannot recover detail that wasn't in the source. It standardizes resolution across your library."},{"q":"Is it free?","a":"Yes, completely free with no signup."}]`
    : `[{"q":"Does downscaling reduce file size?","a":"Yes, significantly. A 4K to 720p downscale can reduce file size by 80-90%."},{"q":"Will I lose quality?","a":"The output matches the target resolution exactly. Detail is preserved as well as possible at the lower resolution."}]`;

  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ToolLayout from '../../layouts/ToolLayout.astro';

const tool = {
  slug: "${slug}",
  name: "${name}",
  metaTitle: "${metaTitle}",
  metaDescription: "${metaDescription}",
  icon: "🎬",
  howTo: [
    { title: "Upload video", text: "Select a ${fromRes.label} video file from your device." },
    { title: "Convert", text: "Click convert to ${action.toLowerCase()} to ${toRes.label}." },
    { title: "Download", text: "Save your ${toRes.label} video." }
  ],
  faq: ${faq},
  relatedTools: [],
  type: "resolution-convert",
  from: "${from}",
  to: "${to}",
  outputFormat: "mp4",
  presetWidth: ${toRes.w},
  presetHeight: ${toRes.h},
  requiresDesktop: ${requiresDesktop},
  warningMessage: ${JSON.stringify(warningMessage)},
  settings: [],
  tutorial: "${tutorial.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  relatedBlogs: [],
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
    presetWidth: tool.presetWidth,
    presetHeight: tool.presetHeight,
    requiresDesktop: tool.requiresDesktop,
  }}
  extraContent={{
    tutorial: tool.tutorial,
    relatedBlogs: tool.relatedBlogs,
  }}
/>
`;
}

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const keys = Object.keys(RES);
let count = 0;

for (const from of keys) {
  for (const to of keys) {
    if (from === to) continue;
    const filePath = path.join(OUT_DIR, `${from}-to-${to}.astro`);
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  Skipped (exists): ${from}-to-${to}.astro`);
      continue;
    }
    fs.writeFileSync(filePath, buildFile(from, to));
    console.log(`✅ Created: ${from}-to-${to}.astro`);
    count++;
  }
}

console.log(`\n🎉 Generated ${count} resolution converter pages.`);
console.log(`\n📱 Desktop-only tools: 8K operations`);
console.log(`⚠️  Warnings added: 4K upscale, all 8K operations`);