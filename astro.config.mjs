import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import indexnow from "astro-indexnow";

export default defineConfig({
  site: "https://dayront.com",
  output: "static",
  integrations: [
    tailwind(),
    preact({ compat: true }),
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", es: "es", pt: "pt", de: "de", fr: "fr", ja: "ja" },
      },
    }),
    robotsTxt(),
    indexnow(),
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
    plugins: [
      {
        name: 'configure-response-headers',
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
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
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
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
      ],
    },
  },
});