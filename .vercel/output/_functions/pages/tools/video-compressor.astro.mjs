/* empty css                                     */
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_DEadn9aC.mjs';
export { renderers } from '../../renderers.mjs';

const $$VideoCompressor = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "video-compressor",
    name: "Video Compressor",
    type: "video-compress",
    from: void 0,
    to: void 0,
    outputFormat: "mp4",
    settings: [{ "name": "crf", "label": "Quality (0 best, 51 worst)", "type": "range", "min": 0, "max": 51, "default": 23 }, { "name": "preset", "label": "Encoding Speed", "type": "select", "options": ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow"], "default": "medium" }],
    tutorial: '\n      <h2>How to Compress Video Files Without Losing Quality</h2>\n      <p>Video files can be huge, taking up precious storage. Our Video Compressor lets you reduce file size while keeping the quality as high as you want. Use the quality slider to find the perfect balance.</p>\n      <h3>Tips for Best Results</h3>\n      <ul>\n        <li>Use a lower CRF (18\u201123) for near\u2011lossless compression.</li>\n        <li>Choose "medium" or "slow" preset for better compression (smaller file).</li>\n        <li>Always keep an original copy if you may need to edit later.</li>\n      </ul>\n    ',
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
}, "/home/dayront/src/pages/tools/video-compressor.astro", void 0);

const $$file = "/home/dayront/src/pages/tools/video-compressor.astro";
const $$url = "/tools/video-compressor";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$VideoCompressor,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
