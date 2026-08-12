/* empty css                                     */
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_DEadn9aC.mjs';
export { renderers } from '../../renderers.mjs';

const $$ExtractAudio = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "extract-audio",
    name: "Extract Audio",
    type: "extract-audio",
    from: void 0,
    to: void 0,
    outputFormat: "mp3",
    settings: [{ "name": "format", "label": "Output Format", "type": "select", "options": ["mp3", "wav", "m4a", "ogg", "flac", "aac"], "default": "mp3" }],
    tutorial: "\n    <h2>Using Our Extract Audio</h2>\n    <p>Our Extract Audio tool is designed to be simple and private. Upload your file, adjust any settings, and download the processed result \u2013 all inside your browser. No data ever leaves your device.</p>\n    <h3>Why Choose Dayront?</h3>\n    <ul>\n      <li>No uploads \u2013 your files stay on your device.</li>\n      <li>Fast processing using the latest browser technology.</li>\n      <li>Completely free, no registration required.</li>\n    </ul>\n  ",
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
}, "/home/dayront/src/pages/tools/extract-audio.astro", void 0);

const $$file = "/home/dayront/src/pages/tools/extract-audio.astro";
const $$url = "/tools/extract-audio";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ExtractAudio,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
