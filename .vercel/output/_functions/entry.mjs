import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_jvfoGmEc.mjs';
import { manifest } from './manifest_dL9jGz26.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/transcribe.astro.mjs');
const _page3 = () => import('./pages/blog/_locale_/category/_category_.astro.mjs');
const _page4 = () => import('./pages/blog/_locale_/tag/_tag_.astro.mjs');
const _page5 = () => import('./pages/blog/_locale_/_slug_.astro.mjs');
const _page6 = () => import('./pages/blog/_locale_.astro.mjs');
const _page7 = () => import('./pages/blog.astro.mjs');
const _page8 = () => import('./pages/convert/aac-to-mp3.astro.mjs');
const _page9 = () => import('./pages/convert/aiff-to-mp3.astro.mjs');
const _page10 = () => import('./pages/convert/amr-to-mp3.astro.mjs');
const _page11 = () => import('./pages/convert/ape-to-mp3.astro.mjs');
const _page12 = () => import('./pages/convert/avi-to-mp3.astro.mjs');
const _page13 = () => import('./pages/convert/flac-to-mp3.astro.mjs');
const _page14 = () => import('./pages/convert/flv-to-mp3.astro.mjs');
const _page15 = () => import('./pages/convert/flv-to-mp4.astro.mjs');
const _page16 = () => import('./pages/convert/flv-to-webm.astro.mjs');
const _page17 = () => import('./pages/convert/m4a-to-mp3.astro.mjs');
const _page18 = () => import('./pages/convert/mkv-to-mp3.astro.mjs');
const _page19 = () => import('./pages/convert/mov-to-mp3.astro.mjs');
const _page20 = () => import('./pages/convert/mp3-to-m4a.astro.mjs');
const _page21 = () => import('./pages/convert/mp3-to-ogg.astro.mjs');
const _page22 = () => import('./pages/convert/mp3-to-wav.astro.mjs');
const _page23 = () => import('./pages/convert/mp4-to-mp3.astro.mjs');
const _page24 = () => import('./pages/convert/mp4-to-wav.astro.mjs');
const _page25 = () => import('./pages/convert/ogg-to-mp3.astro.mjs');
const _page26 = () => import('./pages/convert/opus-to-mp3.astro.mjs');
const _page27 = () => import('./pages/convert/wav-to-mp3.astro.mjs');
const _page28 = () => import('./pages/convert/webm-to-mp3.astro.mjs');
const _page29 = () => import('./pages/convert/webm-to-wav.astro.mjs');
const _page30 = () => import('./pages/privacy.astro.mjs');
const _page31 = () => import('./pages/rss.xml.astro.mjs');
const _page32 = () => import('./pages/search.astro.mjs');
const _page33 = () => import('./pages/terms.astro.mjs');
const _page34 = () => import('./pages/tools/ai-background-remover.astro.mjs');
const _page35 = () => import('./pages/tools/ai-photo-editor.astro.mjs');
const _page36 = () => import('./pages/tools/ai-video-captions.astro.mjs');
const _page37 = () => import('./pages/tools/audio-compressor.astro.mjs');
const _page38 = () => import('./pages/tools/audio-cutter.astro.mjs');
const _page39 = () => import('./pages/tools/audio-merger.astro.mjs');
const _page40 = () => import('./pages/tools/burn-subtitles.astro.mjs');
const _page41 = () => import('./pages/tools/change-fps.astro.mjs');
const _page42 = () => import('./pages/tools/crop-video.astro.mjs');
const _page43 = () => import('./pages/tools/extract-audio.astro.mjs');
const _page44 = () => import('./pages/tools/gif-to-video.astro.mjs');
const _page45 = () => import('./pages/tools/mute-video.astro.mjs');
const _page46 = () => import('./pages/tools/resize-video.astro.mjs');
const _page47 = () => import('./pages/tools/reverse-audio.astro.mjs');
const _page48 = () => import('./pages/tools/speed-changer.astro.mjs');
const _page49 = () => import('./pages/tools/stereo-to-mono.astro.mjs');
const _page50 = () => import('./pages/tools/video-compressor.astro.mjs');
const _page51 = () => import('./pages/tools/video-cutter.astro.mjs');
const _page52 = () => import('./pages/tools/video-merger.astro.mjs');
const _page53 = () => import('./pages/tools/video-to-gif.astro.mjs');
const _page54 = () => import('./pages/tools/volume-booster.astro.mjs');
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
    ["src/pages/convert/aac-to-mp3.astro", _page8],
    ["src/pages/convert/aiff-to-mp3.astro", _page9],
    ["src/pages/convert/amr-to-mp3.astro", _page10],
    ["src/pages/convert/ape-to-mp3.astro", _page11],
    ["src/pages/convert/avi-to-mp3.astro", _page12],
    ["src/pages/convert/flac-to-mp3.astro", _page13],
    ["src/pages/convert/flv-to-mp3.astro", _page14],
    ["src/pages/convert/flv-to-mp4.astro", _page15],
    ["src/pages/convert/flv-to-webm.astro", _page16],
    ["src/pages/convert/m4a-to-mp3.astro", _page17],
    ["src/pages/convert/mkv-to-mp3.astro", _page18],
    ["src/pages/convert/mov-to-mp3.astro", _page19],
    ["src/pages/convert/mp3-to-m4a.astro", _page20],
    ["src/pages/convert/mp3-to-ogg.astro", _page21],
    ["src/pages/convert/mp3-to-wav.astro", _page22],
    ["src/pages/convert/mp4-to-mp3.astro", _page23],
    ["src/pages/convert/mp4-to-wav.astro", _page24],
    ["src/pages/convert/ogg-to-mp3.astro", _page25],
    ["src/pages/convert/opus-to-mp3.astro", _page26],
    ["src/pages/convert/wav-to-mp3.astro", _page27],
    ["src/pages/convert/webm-to-mp3.astro", _page28],
    ["src/pages/convert/webm-to-wav.astro", _page29],
    ["src/pages/privacy.astro", _page30],
    ["src/pages/rss.xml.js", _page31],
    ["src/pages/search.astro", _page32],
    ["src/pages/terms.astro", _page33],
    ["src/pages/tools/ai-background-remover.astro", _page34],
    ["src/pages/tools/ai-photo-editor.astro", _page35],
    ["src/pages/tools/ai-video-captions.astro", _page36],
    ["src/pages/tools/audio-compressor.astro", _page37],
    ["src/pages/tools/audio-cutter.astro", _page38],
    ["src/pages/tools/audio-merger.astro", _page39],
    ["src/pages/tools/burn-subtitles.astro", _page40],
    ["src/pages/tools/change-fps.astro", _page41],
    ["src/pages/tools/crop-video.astro", _page42],
    ["src/pages/tools/extract-audio.astro", _page43],
    ["src/pages/tools/gif-to-video.astro", _page44],
    ["src/pages/tools/mute-video.astro", _page45],
    ["src/pages/tools/resize-video.astro", _page46],
    ["src/pages/tools/reverse-audio.astro", _page47],
    ["src/pages/tools/speed-changer.astro", _page48],
    ["src/pages/tools/stereo-to-mono.astro", _page49],
    ["src/pages/tools/video-compressor.astro", _page50],
    ["src/pages/tools/video-cutter.astro", _page51],
    ["src/pages/tools/video-merger.astro", _page52],
    ["src/pages/tools/video-to-gif.astro", _page53],
    ["src/pages/tools/volume-booster.astro", _page54],
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
    "middlewareSecret": "d4eabd7c-7f63-4f10-ae88-5f5a4868e900",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
