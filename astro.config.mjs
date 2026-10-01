import { defineConfig, passthroughImageService } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

/**
 * ★ AI packages that must NOT be bundled by Vite/Rollup.
 * They are loaded at runtime from CDN via the import map
 * declared in src/layouts/BaseLayout.astro.
 */
const AI_EXTERNALS = [
  "@huggingface/transformers",
  "onnxruntime-web",
  "@imgly/background-removal",
];

/**
 * ★ Capacitor packages that must NOT be bundled.
 * They only exist inside the native mobile app, not on web.
 * Loaded lazily at runtime only when running in the app shell
 * (see src/core/storage.ts and src/core/ffmpeg-native.ts).
 *
 * The dynamic imports in those files use `/* @vite-ignore *\/` so Vite
 * doesn't try to resolve them, and this externals list tells Rollup
 * to skip them in the production build.
 */
const CAPACITOR_EXTERNALS = [
  "@capacitor/core",
  "@capacitor/preferences",
  "@capacitor/filesystem",
  "@capacitor/share",
  "@capacitor-community/ffmpeg",
];

/** Merged list — used across build / worker / ssr / optimizeDeps. */
const ALL_EXTERNALS = [...AI_EXTERNALS, ...CAPACITOR_EXTERNALS];

export default defineConfig({
  site: "https://dayront.com",
  output: "static",
  adapter: vercel({
    edgeMiddleware: false,
  }),

  // ★ Skip sharp image optimization (native binary not available on Android/Termux)
  image: {
    service: passthroughImageService(),
  },

  integrations: [
    tailwind(),
    preact({ compat: true }),
    mdx(),
    sitemap({
      // ★ Exclude noise + duplicated download URL
      filter: (page) =>
        !page.includes("?lang=") &&
        !page.includes("/tag/") &&
        !page.includes("/category/") &&
        !page.includes("/download") &&
        !page.includes("/status") &&
        !page.includes("/404"),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", es: "es", pt: "pt", de: "de", fr: "fr", ja: "ja" },
      },
    }),
    robotsTxt({
      policy: [{ userAgent: "*", allow: "/" }],
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

    // ★ Client-side build — THIS was the missing piece.
    // Without this, Rollup still tries to resolve @capacitor/* during
    // the client bundle, even though ssr.external already lists them.
    build: {
      rollupOptions: {
        external: ALL_EXTERNALS,
      },
    },

    // ★ Worker build (Web Workers spawned by Vite)
    worker: {
      format: "es",
      rollupOptions: {
        external: ALL_EXTERNALS,
      },
    },

    // ★ Server-side render (Astro SSR pass)
    ssr: {
      external: ALL_EXTERNALS,
    },

    plugins: [
      {
        name: "configure-response-headers",
        configureServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
            if (_req.url?.startsWith("/ffmpeg/")) {
              if (_req.url.endsWith(".js")) res.setHeader("Content-Type", "text/javascript");
              else if (_req.url.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
            }
            next();
          });
        },
        configurePreviewServer: (server) => {
          server.middlewares.use((_req, res, next) => {
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
            if (_req.url?.startsWith("/ffmpeg/")) {
              if (_req.url.endsWith(".js")) res.setHeader("Content-Type", "text/javascript");
              else if (_req.url.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
            }
            next();
          });
        },
      },
    ],

    // ★ Exclude the same packages from dep pre-bundling in dev mode
    optimizeDeps: {
      exclude: [
        "@ffmpeg/ffmpeg",
        "@ffmpeg/util",
        "@ffmpeg/core",
        ...ALL_EXTERNALS,
      ],
    },
  },
});