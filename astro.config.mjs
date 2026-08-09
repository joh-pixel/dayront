import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import astroI18next from "astro-i18next";

export default defineConfig({
  site: "https://dayront.com",
  integrations: [
    tailwind(),
    preact({ compat: true }), // Preact with React compat
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", es: "es", pt: "pt", de: "de", fr: "fr", ja: "ja" },
      },
    }),
    robotsTxt(),
    astroI18next(),
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
      // Required for FFmpeg.wasm (SharedArrayBuffer)
      {
        name: 'configure-response-headers',
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            next();
          });
        },
        // Also apply headers when running `astro preview`
        configurePreviewServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
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
