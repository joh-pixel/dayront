import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://dayront.com",
  output: "static",
  adapter: vercel({
    edgeMiddleware: false,
  }),

  // ★ NEW: 301 Redirects from old tool/convert URLs to new SEO-optimized URLs ★
  redirects: {
    "/tools/audio-cutter": "/tools/trim-audio-files-online-free",
    "/tools/audio-merger": "/tools/merge-audio-files-privacy-first",
    "/tools/audio-compressor": "/tools/compress-audio-files-online-free",
    "/tools/volume-booster": "/tools/boost-audio-volume-online-free",
    "/tools/stereo-to-mono": "/tools/convert-stereo-to-mono-privacy-first",
    "/tools/speed-changer": "/tools/change-audio-speed-without-pitch-online",
    "/tools/reverse-audio": "/tools/reverse-audio-files-online-free",
    "/tools/extract-audio": "/tools/extract-audio-from-video-privacy-first",
    "/tools/video-cutter": "/tools/trim-video-files-online-free",
    "/tools/video-merger": "/tools/merge-video-files-privacy-first",
    "/tools/video-compressor": "/tools/compress-video-files-online-free",
    "/tools/video-to-gif": "/tools/convert-video-to-gif-online-free",
    "/tools/gif-to-video": "/tools/convert-gif-to-video-privacy-first",
    "/tools/mute-video": "/tools/mute-video-audio-online-free",
    "/tools/crop-video": "/tools/crop-video-online-free",
    "/tools/resize-video": "/tools/resize-video-resolution-online-free",
    "/tools/change-fps": "/tools/change-video-fps-online-free",
    "/tools/burn-subtitles": "/tools/burn-subtitles-into-video-privacy-first",
    "/tools/ai-background-remover": "/tools/remove-background-from-image-ai-free",
    "/tools/ai-photo-editor": "/tools/ai-photo-editor-online-free",
    "/tools/ai-video-captions": "/tools/generate-video-captions-ai-free",
    "/convert/mp3-to-wav": "/convert/convert-mp3-to-wav-online-free",
    "/convert/wav-to-mp3": "/convert/convert-wav-to-mp3-privacy-first",
    "/convert/mp4-to-mp3": "/convert/convert-mp4-to-mp3-online-free",
    "/convert/flac-to-mp3": "/convert/convert-flac-to-mp3-privacy-first",
    "/convert/m4a-to-mp3": "/convert/convert-m4a-to-mp3-online-free",
    "/convert/mov-to-mp3": "/convert/convert-mov-to-mp3-privacy-first",
    "/convert/webm-to-mp3": "/convert/convert-webm-to-mp3-online-free",
    "/convert/aac-to-mp3": "/convert/convert-aac-to-mp3-privacy-first",
    "/convert/ogg-to-mp3": "/convert/convert-ogg-to-mp3-online-free",
    "/convert/opus-to-mp3": "/convert/convert-opus-to-mp3-privacy-first",
    "/convert/avi-to-mp3": "/convert/convert-avi-to-mp3-online-free",
    "/convert/mkv-to-mp3": "/convert/convert-mkv-to-mp3-privacy-first",
    "/convert/webm-to-wav": "/convert/convert-webm-to-wav-online-free",
    "/convert/mp4-to-wav": "/convert/convert-mp4-to-wav-privacy-first",
    "/convert/aiff-to-mp3": "/convert/convert-aiff-to-mp3-online-free",
    "/convert/amr-to-mp3": "/convert/convert-amr-to-mp3-privacy-first",
    "/convert/ape-to-mp3": "/convert/convert-ape-to-mp3-online-free",
    "/convert/flv-to-mp3": "/convert/convert-flv-to-mp3-privacy-first",
    "/convert/flv-to-mp4": "/convert/convert-flv-to-mp4-online-free",
    "/convert/flv-to-webm": "/convert/convert-flv-to-webm-privacy-first",
    "/convert/mp3-to-m4a": "/convert/convert-mp3-to-m4a-online-free",
    "/convert/mp3-to-ogg": "/convert/convert-mp3-to-ogg-privacy-first"
  },

  integrations: [
    tailwind(),
    preact({ compat: true }),
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('?lang=') &&
        !page.includes('/tag/') &&
        !page.includes('/category/'),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", es: "es", pt: "pt", de: "de", fr: "fr", ja: "ja" },
      },
    }),
    robotsTxt({
      policy: [
        { userAgent: "*", allow: "/" } // UPDATED: Removed disallow to allow crawling
      ]
    }),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "pt", "de", "fr", "ja"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    resolve: {
      alias: {
        react: "preact/compat",
        "react-dom": "preact/compat",
        "react/jsx-runtime": "preact/jsx-runtime",
      },
    },
    worker: {
      format: 'es',
    },
    plugins: [
      {
        name: 'configure-response-headers',
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
            if (_req.url?.startsWith('/ffmpeg/')) {
              if (_req.url.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
              else if (_req.url.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
            }
            next();
          });
        },
        configurePreviewServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
            if (_req.url?.startsWith('/ffmpeg/')) {
              if (_req.url.endsWith('.js')) res.setHeader('Content-Type', 'text/javascript');
              else if (_req.url.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
            }
            next();
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: [
        '@ffmpeg/ffmpeg',
        '@ffmpeg/util',
        '@ffmpeg/core',
        '@huggingface/transformers',
        'onnxruntime-web',
        '@imgly/background-removal',
      ],
    },
  },
});