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
 * ★ Capacitor packages that must NOT be bundled by Vite/Rollup.
 *
 * Two reasons:
 *   1. They only exist inside the native mobile app shell (Capacitor 8.x)
 *      — bundling them for the web build would produce a broken bundle.
 *   2. They are loaded lazily at runtime only when running in the app
 *      (see src/core/storage.ts and src/core/ffmpeg-native.ts).
 *
 * The dynamic imports in those files use `/* @vite-ignore *\/` so Vite
 * doesn't try to resolve them at build time, and this externals list
 * tells Rollup to skip them in the production build.
 *
 * IMPORTANT: @capacitor/app is now STATICALLY imported by
 * src/ui/mobile/layouts/MobileLayout.tsx (needed for the back-button
 * listener and deep links). It MUST be in this list, otherwise
 * Rollup fails to resolve it during the SSR pass of static generation.
 */
const CAPACITOR_EXTERNALS = [
  // Core + platform
  "@capacitor/core",
  "@capacitor/android",
  "@capacitor/cli",

  // Native APIs used across the app
  "@capacitor/app",
  "@capacitor/preferences",
  "@capacitor/filesystem",
  "@capacitor/share",
  "@capacitor/local-notifications",

  // Community + third-party plugins
  "@capacitor-community/keep-awake",
  "@capacitor-community/ffmpeg",
  "@capawesome/capacitor-file-picker",
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

    // ★ Client-side build — tells Rollup not to try bundling the
    // Capacitor + AI packages, they'll be resolved at runtime.
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

    // ★ Server-side render (build-time render pass for static output)
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