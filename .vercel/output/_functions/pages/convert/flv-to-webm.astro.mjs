/* empty css                                     */
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_DEadn9aC.mjs';
export { renderers } from '../../renderers.mjs';

const $$FlvToWebm = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "flv-to-webm",
    name: "FLV to WebM",
    type: "convert-video",
    from: "flv",
    to: "webm",
    outputFormat: "webm",
    settings: [{ "name": "vcodec", "label": "Video Codec", "type": "select", "options": ["libvpx", "copy"], "default": "libvpx" }, { "name": "acodec", "label": "Audio Codec", "type": "select", "options": ["libvorbis", "copy"], "default": "libvorbis" }],
    tutorial: "\n      <h2>Why Convert FLV to WEBM?</h2>\n      <p>Converting FLV to WEBM is one of the most common audio/video tasks. Our FLV to WebM tool makes it effortless and completely private. Whether you need to save space, improve compatibility, or extract audio for editing, this tool does it instantly in your browser.</p>\n      <h3>Key Benefits</h3>\n      <ul>\n        <li><strong>100% Private</strong> \u2013 Your files never leave your device.</li>\n        <li><strong>No Software Install</strong> \u2013 Works directly in your browser.</li>\n        <li><strong>Free & Unlimited</strong> \u2013 Use it as many times as you need.</li>\n        <li><strong>High Quality</strong> \u2013 Preserves the best possible quality during conversion.</li>\n      </ul>\n    ",
    relatedBlogs: []
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
}, "/home/dayront/src/pages/convert/flv-to-webm.astro", void 0);

const $$file = "/home/dayront/src/pages/convert/flv-to-webm.astro";
const $$url = "/convert/flv-to-webm";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$FlvToWebm,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
