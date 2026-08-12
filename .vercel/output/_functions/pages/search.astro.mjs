import '../chunks/page-ssr_B6YcU95I.mjs';
import { c as createAstro, a as createComponent, b as renderTemplate, w as defineScriptVars, r as renderComponent, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { g as getLangFromAstroUrl, t as tools, $ as $$BaseLayout } from '../chunks/BaseLayout_DUayu5R1.mjs';
import { g as getCollection } from '../chunks/_astro_content_lyMaeEuS.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://dayront.com");
const $$Search = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Search;
  const lang = getLangFromAstroUrl(Astro2.url);
  let toolsTrans = {};
  let commonTrans = {};
  try {
    const [toolsRes, commonRes] = await Promise.all([
      fetch(new URL(`/locales/${lang}/tools.json`, Astro2.url.origin)),
      fetch(new URL(`/locales/${lang}/common.json`, Astro2.url.origin))
    ]);
    if (toolsRes.ok) toolsTrans = await toolsRes.json();
    if (commonRes.ok) commonTrans = await commonRes.json();
  } catch {
  }
  const t = (key, fallback) => commonTrans[key] || fallback;
  function translateTool(tool) {
    const tt = toolsTrans[tool.slug] || {};
    return {
      title: tt.title || tool.name,
      description: tt.description || tool.description,
      url: tool.from && tool.to ? `/convert/${tool.slug}?lang=${lang}` : `/tools/${tool.slug}?lang=${lang}`,
      type: "tool",
      icon: tt.icon || tool.icon
    };
  }
  let blogPosts = [];
  try {
    const posts = await getCollection("blog");
    blogPosts = posts.map((post) => ({
      title: post.data.title,
      description: post.data.description || "",
      slug: post.id.replace(/\.mdx$/, "").replace(/^en\//, ""),
      date: post.data.date?.toISOString() || ""
    }));
  } catch {
  }
  const searchData = {
    tools: tools.map(translateTool),
    blog: blogPosts.map((post) => ({
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}?lang=${lang}`,
      type: "blog",
      icon: "\u{1F4DD}"
    }))
  };
  const allItems = [...searchData.tools, ...searchData.blog];
  return renderTemplate(_a || (_a = __template(["", " <script>(function(){", `
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const noResults = document.getElementById('no-results');

  function renderResults(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      resultsContainer.innerHTML = '';
      noResults.classList.add('hidden');
      return;
    }

    const filtered = allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      resultsContainer.innerHTML = '';
      noResults.classList.remove('hidden');
      return;
    }
    noResults.classList.add('hidden');

    resultsContainer.innerHTML = filtered.map(item => \`
      <a href="\${item.url}" class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md transition">
        <span class="text-2xl flex-shrink-0">\${item.icon || (item.type === 'blog' ? '\u{1F4DD}' : '\u{1F527}')}</span>
        <div>
          <div class="font-semibold text-black dark:text-white">\${item.title}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">\${item.description}</div>
          <div class="text-xs text-gray-400 mt-1 capitalize">\${item.type}</div>
        </div>
      </a>
    \`).join('');
  }

  let timeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      renderResults(e.target.value);
    }, 200);
  });
})();<\/script>`], ["", " <script>(function(){", `
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const noResults = document.getElementById('no-results');

  function renderResults(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      resultsContainer.innerHTML = '';
      noResults.classList.add('hidden');
      return;
    }

    const filtered = allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      resultsContainer.innerHTML = '';
      noResults.classList.remove('hidden');
      return;
    }
    noResults.classList.add('hidden');

    resultsContainer.innerHTML = filtered.map(item => \\\`
      <a href="\\\${item.url}" class="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md transition">
        <span class="text-2xl flex-shrink-0">\\\${item.icon || (item.type === 'blog' ? '\u{1F4DD}' : '\u{1F527}')}</span>
        <div>
          <div class="font-semibold text-black dark:text-white">\\\${item.title}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">\\\${item.description}</div>
          <div class="text-xs text-gray-400 mt-1 capitalize">\\\${item.type}</div>
        </div>
      </a>
    \\\`).join('');
  }

  let timeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      renderResults(e.target.value);
    }, 200);
  });
})();<\/script>`])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "lang": lang, "title": t("search_page_title", "Search \u2013 Dayront"), "description": t("search_page_desc", "Search across all media tools, blog articles, and FAQs.") }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="max-w-4xl mx-auto px-4 py-12"> <h1 class="text-4xl font-extrabold text-black dark:text-white mb-4"> ${t("search_heading", "Search")} </h1> <p class="text-gray-500 dark:text-white/70 mb-8 text-lg"> ${t("search_subtitle", "Find tools, articles, and answers instantly.")} </p> <div class="relative mb-8"> <input id="search-input" type="text"${addAttribute(t("search_placeholder", "Type to search\u2026"), "placeholder")} class="w-full px-5 py-3 text-lg rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky" autocomplete="off"> <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span> </div> <div id="search-results" class="space-y-4"></div> <div id="no-results" class="text-center py-10 hidden"> <p class="text-gray-400 dark:text-gray-500"> ${t("no_results", "No results found. Try a different keyword.")} </p> </div> </section> ` }), defineScriptVars({ allItems }));
}, "/home/dayront/src/pages/search.astro", void 0);

const $$file = "/home/dayront/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
