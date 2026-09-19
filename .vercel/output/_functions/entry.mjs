import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_C718mxJE.mjs';
import { manifest } from './manifest_-o3hDOGF.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/transcribe.astro.mjs');
const _page3 = () => import('./pages/blog/_locale_/category/_category_.astro.mjs');
const _page4 = () => import('./pages/blog/_locale_/tag/_tag_.astro.mjs');
const _page5 = () => import('./pages/blog/_locale_/_slug_.astro.mjs');
const _page6 = () => import('./pages/blog/_locale_.astro.mjs');
const _page7 = () => import('./pages/blog.astro.mjs');
const _page8 = () => import('./pages/convert/1080p-to-2k.astro.mjs');
const _page9 = () => import('./pages/convert/1080p-to-480p.astro.mjs');
const _page10 = () => import('./pages/convert/1080p-to-4k.astro.mjs');
const _page11 = () => import('./pages/convert/1080p-to-720p.astro.mjs');
const _page12 = () => import('./pages/convert/1080p-to-8k.astro.mjs');
const _page13 = () => import('./pages/convert/2k-to-1080p.astro.mjs');
const _page14 = () => import('./pages/convert/2k-to-480p.astro.mjs');
const _page15 = () => import('./pages/convert/2k-to-4k.astro.mjs');
const _page16 = () => import('./pages/convert/2k-to-720p.astro.mjs');
const _page17 = () => import('./pages/convert/2k-to-8k.astro.mjs');
const _page18 = () => import('./pages/convert/480p-to-1080p.astro.mjs');
const _page19 = () => import('./pages/convert/480p-to-2k.astro.mjs');
const _page20 = () => import('./pages/convert/480p-to-4k.astro.mjs');
const _page21 = () => import('./pages/convert/480p-to-720p.astro.mjs');
const _page22 = () => import('./pages/convert/480p-to-8k.astro.mjs');
const _page23 = () => import('./pages/convert/4k-to-1080p.astro.mjs');
const _page24 = () => import('./pages/convert/4k-to-2k.astro.mjs');
const _page25 = () => import('./pages/convert/4k-to-480p.astro.mjs');
const _page26 = () => import('./pages/convert/4k-to-720p.astro.mjs');
const _page27 = () => import('./pages/convert/4k-to-8k.astro.mjs');
const _page28 = () => import('./pages/convert/720p-to-1080p.astro.mjs');
const _page29 = () => import('./pages/convert/720p-to-2k.astro.mjs');
const _page30 = () => import('./pages/convert/720p-to-480p.astro.mjs');
const _page31 = () => import('./pages/convert/720p-to-4k.astro.mjs');
const _page32 = () => import('./pages/convert/720p-to-8k.astro.mjs');
const _page33 = () => import('./pages/convert/8k-to-1080p.astro.mjs');
const _page34 = () => import('./pages/convert/8k-to-2k.astro.mjs');
const _page35 = () => import('./pages/convert/8k-to-480p.astro.mjs');
const _page36 = () => import('./pages/convert/8k-to-4k.astro.mjs');
const _page37 = () => import('./pages/convert/8k-to-720p.astro.mjs');
const _page38 = () => import('./pages/convert/aac-to-mp3.astro.mjs');
const _page39 = () => import('./pages/convert/aiff-to-mp3.astro.mjs');
const _page40 = () => import('./pages/convert/amr-to-mp3.astro.mjs');
const _page41 = () => import('./pages/convert/ape-to-mp3.astro.mjs');
const _page42 = () => import('./pages/convert/avi-to-mp3.astro.mjs');
const _page43 = () => import('./pages/convert/flac-to-mp3.astro.mjs');
const _page44 = () => import('./pages/convert/flv-to-mp3.astro.mjs');
const _page45 = () => import('./pages/convert/flv-to-mp4.astro.mjs');
const _page46 = () => import('./pages/convert/flv-to-webm.astro.mjs');
const _page47 = () => import('./pages/convert/m4a-to-mp3.astro.mjs');
const _page48 = () => import('./pages/convert/mkv-to-mp3.astro.mjs');
const _page49 = () => import('./pages/convert/mov-to-mp3.astro.mjs');
const _page50 = () => import('./pages/convert/mp3-to-m4a.astro.mjs');
const _page51 = () => import('./pages/convert/mp3-to-ogg.astro.mjs');
const _page52 = () => import('./pages/convert/mp3-to-wav.astro.mjs');
const _page53 = () => import('./pages/convert/mp4-to-mp3.astro.mjs');
const _page54 = () => import('./pages/convert/mp4-to-wav.astro.mjs');
const _page55 = () => import('./pages/convert/ogg-to-mp3.astro.mjs');
const _page56 = () => import('./pages/convert/opus-to-mp3.astro.mjs');
const _page57 = () => import('./pages/convert/wav-to-mp3.astro.mjs');
const _page58 = () => import('./pages/convert/webm-to-mp3.astro.mjs');
const _page59 = () => import('./pages/convert/webm-to-wav.astro.mjs');
const _page60 = () => import('./pages/privacy.astro.mjs');
const _page61 = () => import('./pages/rss.xml.astro.mjs');
const _page62 = () => import('./pages/search.astro.mjs');
const _page63 = () => import('./pages/terms.astro.mjs');
const _page64 = () => import('./pages/tools/ai-background-remover.astro.mjs');
const _page65 = () => import('./pages/tools/ai-photo-editor.astro.mjs');
const _page66 = () => import('./pages/tools/ai-video-captions.astro.mjs');
const _page67 = () => import('./pages/tools/audio-compressor.astro.mjs');
const _page68 = () => import('./pages/tools/audio-cutter.astro.mjs');
const _page69 = () => import('./pages/tools/audio-merger.astro.mjs');
const _page70 = () => import('./pages/tools/burn-subtitles.astro.mjs');
const _page71 = () => import('./pages/tools/change-fps.astro.mjs');
const _page72 = () => import('./pages/tools/crop-video.astro.mjs');
const _page73 = () => import('./pages/tools/extract-audio.astro.mjs');
const _page74 = () => import('./pages/tools/gif-to-video.astro.mjs');
const _page75 = () => import('./pages/tools/mute-video.astro.mjs');
const _page76 = () => import('./pages/tools/resize-video.astro.mjs');
const _page77 = () => import('./pages/tools/reverse-audio.astro.mjs');
const _page78 = () => import('./pages/tools/speed-changer.astro.mjs');
const _page79 = () => import('./pages/tools/stereo-to-mono.astro.mjs');
const _page80 = () => import('./pages/tools/video-compressor.astro.mjs');
const _page81 = () => import('./pages/tools/video-cutter.astro.mjs');
const _page82 = () => import('./pages/tools/video-merger.astro.mjs');
const _page83 = () => import('./pages/tools/video-to-gif.astro.mjs');
const _page84 = () => import('./pages/tools/volume-booster.astro.mjs');
const _page85 = () => import('./pages/tools.astro.mjs');
const _page86 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/transcribe.ts", _page2],
    ["src/pages/blog/[locale]/category/[category].astro", _page3],
    ["src/pages/blog/[locale]/tag/[tag].astro", _page4],
    ["src/pages/blog/[locale]/[slug].astro", _page5],
    ["src/pages/blog/[locale]/index.astro", _page6],
    ["src/pages/blog/index.astro", _page7],
    ["src/pages/convert/1080p-to-2k.astro", _page8],
    ["src/pages/convert/1080p-to-480p.astro", _page9],
    ["src/pages/convert/1080p-to-4k.astro", _page10],
    ["src/pages/convert/1080p-to-720p.astro", _page11],
    ["src/pages/convert/1080p-to-8k.astro", _page12],
    ["src/pages/convert/2k-to-1080p.astro", _page13],
    ["src/pages/convert/2k-to-480p.astro", _page14],
    ["src/pages/convert/2k-to-4k.astro", _page15],
    ["src/pages/convert/2k-to-720p.astro", _page16],
    ["src/pages/convert/2k-to-8k.astro", _page17],
    ["src/pages/convert/480p-to-1080p.astro", _page18],
    ["src/pages/convert/480p-to-2k.astro", _page19],
    ["src/pages/convert/480p-to-4k.astro", _page20],
    ["src/pages/convert/480p-to-720p.astro", _page21],
    ["src/pages/convert/480p-to-8k.astro", _page22],
    ["src/pages/convert/4k-to-1080p.astro", _page23],
    ["src/pages/convert/4k-to-2k.astro", _page24],
    ["src/pages/convert/4k-to-480p.astro", _page25],
    ["src/pages/convert/4k-to-720p.astro", _page26],
    ["src/pages/convert/4k-to-8k.astro", _page27],
    ["src/pages/convert/720p-to-1080p.astro", _page28],
    ["src/pages/convert/720p-to-2k.astro", _page29],
    ["src/pages/convert/720p-to-480p.astro", _page30],
    ["src/pages/convert/720p-to-4k.astro", _page31],
    ["src/pages/convert/720p-to-8k.astro", _page32],
    ["src/pages/convert/8k-to-1080p.astro", _page33],
    ["src/pages/convert/8k-to-2k.astro", _page34],
    ["src/pages/convert/8k-to-480p.astro", _page35],
    ["src/pages/convert/8k-to-4k.astro", _page36],
    ["src/pages/convert/8k-to-720p.astro", _page37],
    ["src/pages/convert/aac-to-mp3.astro", _page38],
    ["src/pages/convert/aiff-to-mp3.astro", _page39],
    ["src/pages/convert/amr-to-mp3.astro", _page40],
    ["src/pages/convert/ape-to-mp3.astro", _page41],
    ["src/pages/convert/avi-to-mp3.astro", _page42],
    ["src/pages/convert/flac-to-mp3.astro", _page43],
    ["src/pages/convert/flv-to-mp3.astro", _page44],
    ["src/pages/convert/flv-to-mp4.astro", _page45],
    ["src/pages/convert/flv-to-webm.astro", _page46],
    ["src/pages/convert/m4a-to-mp3.astro", _page47],
    ["src/pages/convert/mkv-to-mp3.astro", _page48],
    ["src/pages/convert/mov-to-mp3.astro", _page49],
    ["src/pages/convert/mp3-to-m4a.astro", _page50],
    ["src/pages/convert/mp3-to-ogg.astro", _page51],
    ["src/pages/convert/mp3-to-wav.astro", _page52],
    ["src/pages/convert/mp4-to-mp3.astro", _page53],
    ["src/pages/convert/mp4-to-wav.astro", _page54],
    ["src/pages/convert/ogg-to-mp3.astro", _page55],
    ["src/pages/convert/opus-to-mp3.astro", _page56],
    ["src/pages/convert/wav-to-mp3.astro", _page57],
    ["src/pages/convert/webm-to-mp3.astro", _page58],
    ["src/pages/convert/webm-to-wav.astro", _page59],
    ["src/pages/privacy.astro", _page60],
    ["src/pages/rss.xml.js", _page61],
    ["src/pages/search.astro", _page62],
    ["src/pages/terms.astro", _page63],
    ["src/pages/tools/ai-background-remover.astro", _page64],
    ["src/pages/tools/ai-photo-editor.astro", _page65],
    ["src/pages/tools/ai-video-captions.astro", _page66],
    ["src/pages/tools/audio-compressor.astro", _page67],
    ["src/pages/tools/audio-cutter.astro", _page68],
    ["src/pages/tools/audio-merger.astro", _page69],
    ["src/pages/tools/burn-subtitles.astro", _page70],
    ["src/pages/tools/change-fps.astro", _page71],
    ["src/pages/tools/crop-video.astro", _page72],
    ["src/pages/tools/extract-audio.astro", _page73],
    ["src/pages/tools/gif-to-video.astro", _page74],
    ["src/pages/tools/mute-video.astro", _page75],
    ["src/pages/tools/resize-video.astro", _page76],
    ["src/pages/tools/reverse-audio.astro", _page77],
    ["src/pages/tools/speed-changer.astro", _page78],
    ["src/pages/tools/stereo-to-mono.astro", _page79],
    ["src/pages/tools/video-compressor.astro", _page80],
    ["src/pages/tools/video-cutter.astro", _page81],
    ["src/pages/tools/video-merger.astro", _page82],
    ["src/pages/tools/video-to-gif.astro", _page83],
    ["src/pages/tools/volume-booster.astro", _page84],
    ["src/pages/tools.astro", _page85],
    ["src/pages/index.astro", _page86]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "303da8b1-6ecc-4ca0-87af-451f4b2feffc",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
