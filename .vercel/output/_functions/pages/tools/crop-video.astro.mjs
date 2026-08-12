/* empty css                                     */
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_DEadn9aC.mjs';
export { renderers } from '../../renderers.mjs';

const $$CropVideo = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "crop-video",
    name: "Crop Video",
    type: "crop-video",
    from: void 0,
    to: void 0,
    outputFormat: "mp4",
    settings: [{ "name": "x", "label": "X offset", "type": "number", "min": 0, "default": 0 }, { "name": "y", "label": "Y offset", "type": "number", "min": 0, "default": 0 }, { "name": "w", "label": "Width", "type": "number", "min": 1, "default": 640 }, { "name": "h", "label": "Height", "type": "number", "min": 1, "default": 480 }],
    tutorial: "\n    <h2>Using Our Crop Video</h2>\n    <p>Our Crop Video tool is designed to be simple and private. Upload your file, adjust any settings, and download the processed result \u2013 all inside your browser. No data ever leaves your device.</p>\n    <h3>Why Choose Dayront?</h3>\n    <ul>\n      <li>No uploads \u2013 your files stay on your device.</li>\n      <li>Fast processing using the latest browser technology.</li>\n      <li>Completely free, no registration required.</li>\n    </ul>\n  ",
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
}, "/home/dayront/src/pages/tools/crop-video.astro", void 0);

const $$file = "/home/dayront/src/pages/tools/crop-video.astro";
const $$url = "/tools/crop-video";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$CropVideo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
