/* empty css                                     */
import { a as createComponent, r as renderComponent, b as renderTemplate } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { $ as $$ToolLayout } from '../../chunks/ToolLayout_DEadn9aC.mjs';
export { renderers } from '../../renderers.mjs';

const $$VideoToGif = createComponent(($$result, $$props, $$slots) => {
  const tool = {
    slug: "video-to-gif",
    name: "Video to GIF",
    type: "video-to-gif",
    from: void 0,
    to: void 0,
    outputFormat: "gif",
    settings: [{ "name": "fps", "label": "Frames per second", "type": "number", "min": 1, "max": 30, "default": 10 }, { "name": "width", "label": "Width (pixels)", "type": "number", "min": 100, "max": 800, "default": 320 }],
    tutorial: "\n      <h2>Create Perfect GIFs from Videos</h2>\n      <p>Turn any video clip into an animated GIF with our Video to GIF. Adjust the frame rate and size to get a small, shareable file.</p>\n      <h3>Pro Tips</h3>\n      <ul>\n        <li>Keep GIFs short (a few seconds) for smaller file size.</li>\n        <li>Use a lower FPS for smaller GIFs.</li>\n        <li>Resize to 320px width for most social platforms.</li>\n      </ul>\n    ",
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
}, "/home/dayront/src/pages/tools/video-to-gif.astro", void 0);

const $$file = "/home/dayront/src/pages/tools/video-to-gif.astro";
const $$url = "/tools/video-to-gif";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$VideoToGif,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
