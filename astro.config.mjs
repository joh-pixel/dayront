import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://dayront.com",
  output: "static",
  integrations: [
    tailwind(),
    preact({ compat: true }),
    mdx(),
    sitemap({
      // Keep this to filter out unwanted URLs from your sitemap
      filter: (page) => 
        !page.includes('?lang=') &&
        !page.includes('/tag/') &&
        !page.includes('/category/'),
      // ✅ FIXED: Sitemap plugin expects an OBJECT format for locales
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", es: "es", pt: "pt", de: "de", fr: "fr", ja: "ja" },
      },
    }),
    robotsTxt({
      policy: [
        { userAgent: "*", allow: "/", disallow: ["/blog/tag/", "/blog/category/", "/*?lang="] }
      ]
    }),
  ],
  // Root i18n settings (Astro core expects an ARRAY here)
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "pt", "de", "fr", "ja"],
    routing: {
      // IMPORTANT: Keep this FALSE!
      // If true, it becomes /en/blog/. We want /blog/en/
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