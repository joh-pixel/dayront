import { defineConfig, passthroughImageService } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

/**
 * ★ AI packages that must NOT be bundled by Vite/Rollup.
 */
const AI_EXTERNALS = [
  "@huggingface/transformers",
  "onnxruntime-web",
  "@imgly/background-removal",
];

/**
 * ★ Capacitor packages that must NOT be bundled by Vite/Rollup.
 */
const CAPACITOR_EXTERNALS = [
  "@capacitor/core",
  "@capacitor/android",
  "@capacitor/cli",
  "@capacitor/app",
  "@capacitor/preferences",
  "@capacitor/filesystem",
  "@capacitor/share",
  "@capacitor/local-notifications",
  "@capacitor-community/keep-awake",
  "@capacitor-community/ffmpeg",
  "@capawesome/capacitor-file-picker",
];

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
        !page.includes("/app/") && // ★ Prevents PWA routes from bloating the sitemap
        !page.includes("/404"),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", es: "es", pt: "pt", de: "de", fr: "fr", ja: "ja" },
      },
    }),
    robotsTxt({
      policy: [
        { 
          userAgent: "*", 
          allow: "/", 
          // ★ UPDATED: Matches the full list of rules to save crawl budget
          disallow: ["/app/", "/api/", "/status", "/*?q=", "/*?lang=", "/download"] 
        }
      ],
      sitemap: true, // ★ Ensures the sitemap URL is added to robots.txt
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
    build: {
      rollupOptions: {
        external: ALL_EXTERNALS,
      },
    },
    worker: {
      format: "es",
      rollupOptions: {
        external: ALL_EXTERNALS,
      },
    },
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