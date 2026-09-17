import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_jvfoGmEc.mjs';
import { manifest } from './manifest_3uX4mAcO.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/transcribe.astro.mjs');
const _page3 = () => import('./pages/blog/_locale_/category/_category_.astro.mjs');
const _page4 = () => import('./pages/blog/_locale_/tag/_tag_.astro.mjs');
const _page5 = () => import('./pages/blog/_locale_/_slug_.astro.mjs');
const _page6 = () => import('./pages/blog/_locale_.astro.mjs');
const _page7 = () => import('./pages/blog.astro.mjs');
const _page8 = () => import('./pages/convert/convert-aac-to-mp3-privacy-first.astro.mjs');
const _page9 = () => import('./pages/convert/convert-aiff-to-mp3-online-free.astro.mjs');
const _page10 = () => import('./pages/convert/convert-amr-to-mp3-privacy-first.astro.mjs');
const _page11 = () => import('./pages/convert/convert-ape-to-mp3-online-free.astro.mjs');
const _page12 = () => import('./pages/convert/convert-avi-to-mp3-online-free.astro.mjs');
const _page13 = () => import('./pages/convert/convert-flac-to-mp3-privacy-first.astro.mjs');
const _page14 = () => import('./pages/convert/convert-flv-to-mp3-privacy-first.astro.mjs');
const _page15 = () => import('./pages/convert/convert-flv-to-mp4-online-free.astro.mjs');
const _page16 = () => import('./pages/convert/convert-flv-to-webm-privacy-first.astro.mjs');
const _page17 = () => import('./pages/convert/convert-m4a-to-mp3-online-free.astro.mjs');
const _page18 = () => import('./pages/convert/convert-mkv-to-mp3-privacy-first.astro.mjs');
const _page19 = () => import('./pages/convert/convert-mov-to-mp3-privacy-first.astro.mjs');
const _page20 = () => import('./pages/convert/convert-mp3-to-m4a-online-free.astro.mjs');
const _page21 = () => import('./pages/convert/convert-mp3-to-ogg-privacy-first.astro.mjs');
const _page22 = () => import('./pages/convert/convert-mp3-to-wav-online-free.astro.mjs');
const _page23 = () => import('./pages/convert/convert-mp4-to-mp3-online-free.astro.mjs');
const _page24 = () => import('./pages/convert/convert-mp4-to-wav-privacy-first.astro.mjs');
const _page25 = () => import('./pages/convert/convert-ogg-to-mp3-online-free.astro.mjs');
const _page26 = () => import('./pages/convert/convert-opus-to-mp3-privacy-first.astro.mjs');
const _page27 = () => import('./pages/convert/convert-wav-to-mp3-privacy-first.astro.mjs');
const _page28 = () => import('./pages/convert/convert-webm-to-mp3-online-free.astro.mjs');
const _page29 = () => import('./pages/convert/convert-webm-to-wav-online-free.astro.mjs');
const _page30 = () => import('./pages/privacy.astro.mjs');
const _page31 = () => import('./pages/rss.xml.astro.mjs');
const _page32 = () => import('./pages/search.astro.mjs');
const _page33 = () => import('./pages/terms.astro.mjs');
const _page34 = () => import('./pages/tools/ai-photo-editor-online-free.astro.mjs');
const _page35 = () => import('./pages/tools/boost-audio-volume-online-free.astro.mjs');
const _page36 = () => import('./pages/tools/burn-subtitles-into-video-privacy-first.astro.mjs');
const _page37 = () => import('./pages/tools/change-audio-speed-without-pitch-online.astro.mjs');
const _page38 = () => import('./pages/tools/change-video-fps-online-free.astro.mjs');
const _page39 = () => import('./pages/tools/compress-audio-files-online-free.astro.mjs');
const _page40 = () => import('./pages/tools/compress-video-files-online-free.astro.mjs');
const _page41 = () => import('./pages/tools/convert-gif-to-video-privacy-first.astro.mjs');
const _page42 = () => import('./pages/tools/convert-stereo-to-mono-privacy-first.astro.mjs');
const _page43 = () => import('./pages/tools/convert-video-to-gif-online-free.astro.mjs');
const _page44 = () => import('./pages/tools/crop-video-online-free.astro.mjs');
const _page45 = () => import('./pages/tools/extract-audio-from-video-privacy-first.astro.mjs');
const _page46 = () => import('./pages/tools/generate-video-captions-ai-free.astro.mjs');
const _page47 = () => import('./pages/tools/merge-audio-files-privacy-first.astro.mjs');
const _page48 = () => import('./pages/tools/merge-video-files-privacy-first.astro.mjs');
const _page49 = () => import('./pages/tools/mute-video-audio-online-free.astro.mjs');
const _page50 = () => import('./pages/tools/remove-background-from-image-ai-free.astro.mjs');
const _page51 = () => import('./pages/tools/resize-video-resolution-online-free.astro.mjs');
const _page52 = () => import('./pages/tools/reverse-audio-files-online-free.astro.mjs');
const _page53 = () => import('./pages/tools/trim-audio-files-online-free.astro.mjs');
const _page54 = () => import('./pages/tools/trim-video-files-online-free.astro.mjs');
const _page55 = () => import('./pages/tools.astro.mjs');
const _page56 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/transcribe.ts", _page2],
    ["src/pages/blog/[locale]/category/[category].astro", _page3],
    ["src/pages/blog/[locale]/tag/[tag].astro", _page4],
    ["src/pages/blog/[locale]/[slug].astro", _page5],
    ["src/pages/blog/[locale]/index.astro", _page6],
    ["src/pages/blog/index.astro", _page7],
    ["src/pages/convert/convert-aac-to-mp3-privacy-first.astro", _page8],
    ["src/pages/convert/convert-aiff-to-mp3-online-free.astro", _page9],
    ["src/pages/convert/convert-amr-to-mp3-privacy-first.astro", _page10],
    ["src/pages/convert/convert-ape-to-mp3-online-free.astro", _page11],
    ["src/pages/convert/convert-avi-to-mp3-online-free.astro", _page12],
    ["src/pages/convert/convert-flac-to-mp3-privacy-first.astro", _page13],
    ["src/pages/convert/convert-flv-to-mp3-privacy-first.astro", _page14],
    ["src/pages/convert/convert-flv-to-mp4-online-free.astro", _page15],
    ["src/pages/convert/convert-flv-to-webm-privacy-first.astro", _page16],
    ["src/pages/convert/convert-m4a-to-mp3-online-free.astro", _page17],
    ["src/pages/convert/convert-mkv-to-mp3-privacy-first.astro", _page18],
    ["src/pages/convert/convert-mov-to-mp3-privacy-first.astro", _page19],
    ["src/pages/convert/convert-mp3-to-m4a-online-free.astro", _page20],
    ["src/pages/convert/convert-mp3-to-ogg-privacy-first.astro", _page21],
    ["src/pages/convert/convert-mp3-to-wav-online-free.astro", _page22],
    ["src/pages/convert/convert-mp4-to-mp3-online-free.astro", _page23],
    ["src/pages/convert/convert-mp4-to-wav-privacy-first.astro", _page24],
    ["src/pages/convert/convert-ogg-to-mp3-online-free.astro", _page25],
    ["src/pages/convert/convert-opus-to-mp3-privacy-first.astro", _page26],
    ["src/pages/convert/convert-wav-to-mp3-privacy-first.astro", _page27],
    ["src/pages/convert/convert-webm-to-mp3-online-free.astro", _page28],
    ["src/pages/convert/convert-webm-to-wav-online-free.astro", _page29],
    ["src/pages/privacy.astro", _page30],
    ["src/pages/rss.xml.js", _page31],
    ["src/pages/search.astro", _page32],
    ["src/pages/terms.astro", _page33],
    ["src/pages/tools/ai-photo-editor-online-free.astro", _page34],
    ["src/pages/tools/boost-audio-volume-online-free.astro", _page35],
    ["src/pages/tools/burn-subtitles-into-video-privacy-first.astro", _page36],
    ["src/pages/tools/change-audio-speed-without-pitch-online.astro", _page37],
    ["src/pages/tools/change-video-fps-online-free.astro", _page38],
    ["src/pages/tools/compress-audio-files-online-free.astro", _page39],
    ["src/pages/tools/compress-video-files-online-free.astro", _page40],
    ["src/pages/tools/convert-gif-to-video-privacy-first.astro", _page41],
    ["src/pages/tools/convert-stereo-to-mono-privacy-first.astro", _page42],
    ["src/pages/tools/convert-video-to-gif-online-free.astro", _page43],
    ["src/pages/tools/crop-video-online-free.astro", _page44],
    ["src/pages/tools/extract-audio-from-video-privacy-first.astro", _page45],
    ["src/pages/tools/generate-video-captions-ai-free.astro", _page46],
    ["src/pages/tools/merge-audio-files-privacy-first.astro", _page47],
    ["src/pages/tools/merge-video-files-privacy-first.astro", _page48],
    ["src/pages/tools/mute-video-audio-online-free.astro", _page49],
    ["src/pages/tools/remove-background-from-image-ai-free.astro", _page50],
    ["src/pages/tools/resize-video-resolution-online-free.astro", _page51],
    ["src/pages/tools/reverse-audio-files-online-free.astro", _page52],
    ["src/pages/tools/trim-audio-files-online-free.astro", _page53],
    ["src/pages/tools/trim-video-files-online-free.astro", _page54],
    ["src/pages/tools.astro", _page55],
    ["src/pages/index.astro", _page56]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "a5644caf-2ceb-4261-ae7d-4597cb289a3b",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
