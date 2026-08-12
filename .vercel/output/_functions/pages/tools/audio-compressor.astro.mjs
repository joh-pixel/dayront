import '../../chunks/page-ssr_B6YcU95I.mjs';
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_CVyddFiD.mjs';
export { renderers } from '../../renderers.mjs';

const $$AudioCompressor = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "audio-compressor",
    name: "Audio Compressor",
    type: "compress",
    from: void 0,
    to: void 0,
    outputFormat: "mp3",
    settings: [{ "name": "quality", "label": "Quality (0 best, 9 smallest)", "type": "range", "min": 0, "max": 9, "default": 3 }],
    tutorial: "\n    <h2>Using Our Audio Compressor</h2>\n    <p>Our Audio Compressor tool is designed to be simple and private. Upload your file, adjust any settings, and download the processed result \u2013 all inside your browser. No data ever leaves your device.</p>\n    <h3>Why Choose Dayront?</h3>\n    <ul>\n      <li>No uploads \u2013 your files stay on your device.</li>\n      <li>Fast processing using the latest browser technology.</li>\n      <li>Completely free, no registration required.</li>\n    </ul>\n  ",
    relatedBlogs: [{ "slug": "the-complete-guide-to-converting-video-to-audio", "title": "The Complete Guide to Converting Video to Audio: MP4, MOV, MKV to MP3", "categories": ["video to audio"] }]
  };
  return renderTemplate`${renderComponent($$result, "ToolLayout", $$ToolLayout, { "toolKey": tool.slug, "toolConfig": {
    type: tool.type,
    from: tool.from,
    to: tool.to,
    outputFormat: tool.outputFormat,
    label: tool.name,
    settings: tool.settings
  }, "extraContent": {
    tutorial: tool.tutorial,
    relatedBlogs: tool.relatedBlogs
  } })}`;
}, "/home/dayront/src/pages/tools/audio-compressor.astro", void 0);

const $$file = "/home/dayront/src/pages/tools/audio-compressor.astro";
const $$url = "/tools/audio-compressor";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$AudioCompressor,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
