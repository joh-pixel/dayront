import '../../chunks/page-ssr_B6YcU95I.mjs';
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_CVyddFiD.mjs';
export { renderers } from '../../renderers.mjs';

const $$WebmToWav = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "webm-to-wav",
    name: "WebM to WAV",
    type: "convert",
    from: "webm",
    to: "wav",
    outputFormat: void 0,
    settings: [],
    tutorial: "\n      <h2>Why Convert WEBM to WAV?</h2>\n      <p>Converting WEBM to WAV is one of the most common audio/video tasks. Our WebM to WAV tool makes it effortless and completely private. Whether you need to save space, improve compatibility, or extract audio for editing, this tool does it instantly in your browser.</p>\n      <h3>Key Benefits</h3>\n      <ul>\n        <li><strong>100% Private</strong> \u2013 Your files never leave your device.</li>\n        <li><strong>No Software Install</strong> \u2013 Works directly in your browser.</li>\n        <li><strong>Free & Unlimited</strong> \u2013 Use it as many times as you need.</li>\n        <li><strong>High Quality</strong> \u2013 Preserves the best possible quality during conversion.</li>\n      </ul>\n    ",
    relatedBlogs: [{ "slug": "understanding-audio-formats", "title": "Understanding Audio Formats: MP3, WAV, FLAC, OGG, and M4A Explained", "categories": ["audio formats"] }]
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
}, "/home/dayront/src/pages/convert/webm-to-wav.astro", void 0);

const $$file = "/home/dayront/src/pages/convert/webm-to-wav.astro";
const $$url = "/convert/webm-to-wav";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$WebmToWav,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
