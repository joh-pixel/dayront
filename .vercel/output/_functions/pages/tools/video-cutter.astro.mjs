/* empty css                                     */
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_DEadn9aC.mjs';
export { renderers } from '../../renderers.mjs';

const $$VideoCutter = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "video-cutter",
    name: "Video Cutter",
    type: "video-cut",
    from: void 0,
    to: void 0,
    outputFormat: "mp4",
    settings: [{ "name": "start", "label": "Start time (seconds)", "type": "number", "min": 0, "default": 0 }, { "name": "duration", "label": "Duration (seconds)", "type": "number", "min": 1, "default": 30 }],
    tutorial: "\n      <h2>Precise Video Cutting Without Re\u2011encoding</h2>\n      <p>Our Video Cutter lets you trim videos without losing quality because it uses stream copy. Just enter the start time and duration, and get your clip instantly.</p>\n      <h3>Common Use Cases</h3>\n      <ul>\n        <li>Cut out unwanted sections from recorded meetings.</li>\n        <li>Save the best moments from a long video.</li>\n        <li>Create short previews for social media.</li>\n      </ul>\n    ",
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
}, "/home/dayront/src/pages/tools/video-cutter.astro", void 0);

const $$file = "/home/dayront/src/pages/tools/video-cutter.astro";
const $$url = "/tools/video-cutter";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$VideoCutter,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
