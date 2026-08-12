import '../chunks/page-ssr_B6YcU95I.mjs';
import { c as createAstro, a as createComponent, b as renderTemplate, w as defineScriptVars, r as renderComponent, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { g as getLangFromAstroUrl, t as tools, $ as $$BaseLayout } from '../chunks/BaseLayout_DUayu5R1.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://dayront.com");
const $$Tools = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Tools;
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
      slug: tool.slug,
      name: tt.title || tool.name,
      icon: tt.icon || tool.icon,
      category: tool.category,
      from: tool.from,
      to: tool.to,
      url: tool.from && tool.to ? `/convert/${tool.slug}?lang=${lang}` : `/tools/${tool.slug}?lang=${lang}`
    };
  }
  const translatedTools = tools.map(translateTool);
  const allCategories = [
    ...new Set(tools.map((tool) => tool.category))
  ];
  const categoryLabels = {};
  for (const cat of allCategories) {
    const labelKey = `category_${cat}`.replace(/-/g, "_");
    const fallback = cat.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
    categoryLabels[cat] = commonTrans[labelKey] || fallback;
  }
  const categoryIcons = {
    "audio-utility": "\u{1F6E0}\uFE0F",
    "audio-conversion": "\u{1F3B5}",
    "video-to-audio": "\u{1F3AC}",
    "video-utility": "\u{1F39E}\uFE0F",
    "video-conversion": "\u{1F504}"
  };
  const toolsJson = JSON.stringify(translatedTools);
  const categoryLabelsJson = JSON.stringify(categoryLabels);
  const categoryIconsJson = JSON.stringify(categoryIcons);
  return renderTemplate(_a || (_a = __template(["", "  <script>(function(){", "\n  const tools = JSON.parse(toolsData);\n  const labels = JSON.parse(categoryLabels);\n  const icons = JSON.parse(categoryIcons);\n\n  const searchInput =\n    document.querySelector('#tool-search');\n\n  const clearButton =\n    document.querySelector('#clear-search');\n\n  const categoryFilter =\n    document.querySelector('#tool-filter');\n\n  const grid =\n    document.querySelector('#tool-grid');\n\n  const emptyState =\n    document.querySelector('#empty-state');\n\n  const resultCount =\n    document.querySelector('#result-count');\n\n  const resetButton =\n    document.querySelector('#reset-tools');\n\n  const gridButton =\n    document.querySelector('#view-grid');\n\n  const listButton =\n    document.querySelector('#view-list');\n\n  const categoryPills =\n    document.querySelectorAll('.category-pill');\n\n  function updateTools() {\n    if (!searchInput || !categoryFilter || !grid) return;\n\n    const search =\n      searchInput.value.trim().toLowerCase();\n\n    const category =\n      categoryFilter.value;\n\n    let visible = 0;\n\n    const cards =\n      grid.querySelectorAll('.tool-card');\n\n    cards.forEach((card) => {\n      const name =\n        card.dataset.toolName?.toLowerCase() || '';\n\n      const cardCategory =\n        card.dataset.toolCategory || '';\n\n      const matchesSearch =\n        !search ||\n        name.includes(search);\n\n      const matchesCategory =\n        category === 'all' ||\n        cardCategory === category;\n\n      const show =\n        matchesSearch &&\n        matchesCategory;\n\n      card.style.display =\n        show ? '' : 'none';\n\n      if (show) visible++;\n    });\n\n    if (resultCount) {\n      const template =\n        'Showing {count} tools';\n\n      resultCount.textContent =\n        template.replace(\n          '{count}',\n          String(visible)\n        );\n    }\n\n    if (emptyState) {\n      emptyState.classList.toggle(\n        'hidden',\n        visible !== 0\n      );\n    }\n\n    if (clearButton) {\n      clearButton.classList.toggle(\n        'visible',\n        searchInput.value.length > 0\n      );\n    }\n  }\n\n  function setCategory(category) {\n    if (!categoryFilter) return;\n\n    categoryFilter.value = category;\n\n    categoryPills.forEach((pill) => {\n      pill.classList.toggle(\n        'active',\n        pill.dataset.category === category\n      );\n    });\n\n    updateTools();\n  }\n\n  searchInput?.addEventListener(\n    'input',\n    updateTools\n  );\n\n  categoryFilter?.addEventListener(\n    'change',\n    () => {\n      setCategory(categoryFilter.value);\n    }\n  );\n\n  clearButton?.addEventListener(\n    'click',\n    () => {\n      if (!searchInput) return;\n\n      searchInput.value = '';\n      updateTools();\n      searchInput.focus();\n    }\n  );\n\n  categoryPills.forEach((pill) => {\n    pill.addEventListener(\n      'click',\n      () => {\n        setCategory(\n          pill.dataset.category || 'all'\n        );\n      }\n    );\n  });\n\n  resetButton?.addEventListener(\n    'click',\n    () => {\n      if (searchInput) {\n        searchInput.value = '';\n      }\n\n      setCategory('all');\n    }\n  );\n\n  gridButton?.addEventListener(\n    'click',\n    () => {\n      grid?.classList.remove('list-view');\n\n      gridButton.classList.add('active');\n      listButton?.classList.remove('active');\n    }\n  );\n\n  listButton?.addEventListener(\n    'click',\n    () => {\n      grid?.classList.add('list-view');\n\n      listButton.classList.add('active');\n      gridButton?.classList.remove('active');\n    }\n  );\n\n  updateTools();\n})();<\/script>"])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "lang": lang, "title": t(
    "tools_page_title",
    "All Media Tools \u2013 Free & Private | Dayront"
  ), "description": t(
    "tools_page_desc",
    "Browse all free online media tools. Convert, cut, merge, boost, and more \u2013 100% private, no upload."
  ), "data-astro-cid-mlc4vpxg": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="tools-hero relative overflow-hidden" data-astro-cid-mlc4vpxg> <div class="absolute inset-0 pointer-events-none" data-astro-cid-mlc4vpxg> <div class="hero-glow hero-glow-one" data-astro-cid-mlc4vpxg></div> <div class="hero-glow hero-glow-two" data-astro-cid-mlc4vpxg></div> <div class="hero-glow hero-glow-three" data-astro-cid-mlc4vpxg></div> </div> <div class="relative max-w-7xl mx-auto px-4 pt-14 pb-10 sm:pt-20 sm:pb-14" data-astro-cid-mlc4vpxg> <div class="max-w-3xl" data-astro-cid-mlc4vpxg> <div class="privacy-badge" data-astro-cid-mlc4vpxg> <span class="status-dot" data-astro-cid-mlc4vpxg></span> ${t(
    "privacy_first_badge",
    "Privacy-first media processing"
  )} </div> <h1 class="hero-title" data-astro-cid-mlc4vpxg> ${t("tools_hero_heading", "All Your Media Tools")} <span data-astro-cid-mlc4vpxg> ${t("tools_hero_subheading", "In One Place.")} </span> </h1> <p class="hero-description" data-astro-cid-mlc4vpxg> ${t(
    "tools_hero_desc",
    "Everything you need to convert, edit, combine, enhance, and process audio and video files directly in your browser."
  )} </p> <div class="feature-pills" data-astro-cid-mlc4vpxg> <div class="feature-pill" data-astro-cid-mlc4vpxg> <span data-astro-cid-mlc4vpxg>🔒</span> ${t("no_uploads", "No uploads")} </div> <div class="feature-pill" data-astro-cid-mlc4vpxg> <span data-astro-cid-mlc4vpxg>⚡</span> ${t("fast_processing", "Fast processing")} </div> <div class="feature-pill" data-astro-cid-mlc4vpxg> <span data-astro-cid-mlc4vpxg>🆓</span> ${t("free_to_use", "Free to use")} </div> </div> </div> </div> </section>  <section class="max-w-7xl mx-auto px-4 pb-8" data-astro-cid-mlc4vpxg> <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" data-astro-cid-mlc4vpxg> <div class="stat-card reveal" data-astro-cid-mlc4vpxg> <p class="stat-number" data-astro-cid-mlc4vpxg>${tools.length}+</p> <p class="stat-label" data-astro-cid-mlc4vpxg> ${t("free_tools", "Free tools")} </p> </div> <div class="stat-card reveal" data-astro-cid-mlc4vpxg> <p class="stat-number" data-astro-cid-mlc4vpxg>100%</p> <p class="stat-label" data-astro-cid-mlc4vpxg> ${t("browser_based", "Browser based")} </p> </div> <div class="stat-card reveal" data-astro-cid-mlc4vpxg> <p class="stat-number" data-astro-cid-mlc4vpxg>0</p> <p class="stat-label" data-astro-cid-mlc4vpxg> ${t("server_uploads", "Server uploads")} </p> </div> <div class="stat-card reveal" data-astro-cid-mlc4vpxg> <p class="stat-number" data-astro-cid-mlc4vpxg>24/7</p> <p class="stat-label" data-astro-cid-mlc4vpxg> ${t("available_online", "Available online")} </p> </div> </div> </section>  <section class="max-w-7xl mx-auto px-4 py-8" data-astro-cid-mlc4vpxg> <div class="search-panel reveal" data-astro-cid-mlc4vpxg> <div class="search-header" data-astro-cid-mlc4vpxg> <div data-astro-cid-mlc4vpxg> <p class="section-kicker" data-astro-cid-mlc4vpxg> ${t("find_tool", "FIND A TOOL")} </p> <h2 class="section-title" data-astro-cid-mlc4vpxg> ${t(
    "what_do_you_want",
    "What do you want to do?"
  )} </h2> <p class="section-description" data-astro-cid-mlc4vpxg> ${t(
    "search_or_browse",
    "Search by tool name or browse by category."
  )} </p> </div> <div class="search-controls" data-astro-cid-mlc4vpxg> <div class="search-box" data-astro-cid-mlc4vpxg> <svg class="search-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" data-astro-cid-mlc4vpxg> <circle cx="11" cy="11" r="8" data-astro-cid-mlc4vpxg></circle> <path stroke-linecap="round" d="m21 21-4.35-4.35" data-astro-cid-mlc4vpxg></path> </svg> <input id="tool-search" type="text"${addAttribute(t(
    "search_tools_placeholder",
    "Search tools..."
  ), "placeholder")}${addAttribute(t(
    "search_tools",
    "Search tools"
  ), "aria-label")} autocomplete="off" data-astro-cid-mlc4vpxg> <button id="clear-search" type="button"${addAttribute(t(
    "clear_search",
    "Clear search"
  ), "aria-label")} data-astro-cid-mlc4vpxg>
×
</button> </div> <select id="tool-filter"${addAttribute(t(
    "filter_category",
    "Filter tools by category"
  ), "aria-label")} data-astro-cid-mlc4vpxg> <option value="all" data-astro-cid-mlc4vpxg> ${t(
    "all_categories",
    "All Categories"
  )} </option> ${Object.entries(categoryLabels).map(
    ([value, label]) => renderTemplate`<option${addAttribute(value, "value")} data-astro-cid-mlc4vpxg> ${label} </option>`
  )} </select> <div class="view-toggle" data-astro-cid-mlc4vpxg> <button id="view-grid" type="button" class="view-button active" data-astro-cid-mlc4vpxg> ${t("grid", "Grid")} </button> <button id="view-list" type="button" class="view-button" data-astro-cid-mlc4vpxg> ${t("list", "List")} </button> </div> </div> </div> <!-- CATEGORY PILLS --> <div class="category-pills" data-astro-cid-mlc4vpxg> <button type="button" data-category="all" class="category-pill active" data-astro-cid-mlc4vpxg> ${t("all_tools", "All Tools")} </button> ${Object.entries(categoryLabels).map(
    ([value, label]) => renderTemplate`<button type="button"${addAttribute(value, "data-category")} class="category-pill" data-astro-cid-mlc4vpxg> ${categoryIcons[value] || ""} <span data-astro-cid-mlc4vpxg>${label}</span> </button>`
  )} </div> <div class="results-bar" data-astro-cid-mlc4vpxg> <p id="result-count" data-astro-cid-mlc4vpxg> ${t(
    "showing_tools",
    "Showing {count} tools"
  ).replace(
    "{count}",
    String(tools.length)
  )} </p> <span class="browser-status" data-astro-cid-mlc4vpxg> <span data-astro-cid-mlc4vpxg></span> ${t(
    "processing_in_browser",
    "Processing stays in your browser"
  )} </span> </div> </div> </section>  <section class="max-w-7xl mx-auto px-4 pb-20" data-astro-cid-mlc4vpxg> <div id="tool-grid" class="tool-grid" data-astro-cid-mlc4vpxg> ${translatedTools.map((tool, index) => renderTemplate`<a${addAttribute(tool.url, "href")} class="tool-card group"${addAttribute(tool.name, "data-tool-name")}${addAttribute(tool.category, "data-tool-category")}${addAttribute(`--delay:${Math.min(index * 35, 350)}ms`, "style")} data-astro-cid-mlc4vpxg> <div class="card-glow" data-astro-cid-mlc4vpxg></div> <div class="tool-card-top" data-astro-cid-mlc4vpxg> <div class="tool-icon" data-astro-cid-mlc4vpxg> ${tool.icon} </div> <svg class="arrow-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" data-astro-cid-mlc4vpxg> <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" data-astro-cid-mlc4vpxg></path> </svg> </div> <div class="tool-card-content" data-astro-cid-mlc4vpxg> <p class="tool-name" data-astro-cid-mlc4vpxg> ${tool.name} </p> <span class="tool-category" data-astro-cid-mlc4vpxg> ${categoryLabels[tool.category] || tool.category} </span> </div> </a>`)} </div> <!-- EMPTY --> <div id="empty-state" class="empty-state hidden" data-astro-cid-mlc4vpxg> <div class="empty-icon" data-astro-cid-mlc4vpxg>
🔎
</div> <h3 data-astro-cid-mlc4vpxg> ${t(
    "no_tools_found",
    "No tools found"
  )} </h3> <p data-astro-cid-mlc4vpxg> ${t(
    "try_another_search",
    "Try another search term or choose a different category."
  )} </p> <button id="reset-tools" type="button" data-astro-cid-mlc4vpxg> ${t(
    "show_all_tools",
    "Show all tools"
  )} </button> </div> </section>  <section class="max-w-7xl mx-auto px-4 pb-20" data-astro-cid-mlc4vpxg> <div class="privacy-callout reveal" data-astro-cid-mlc4vpxg> <div class="privacy-glow" data-astro-cid-mlc4vpxg></div> <div class="relative max-w-3xl" data-astro-cid-mlc4vpxg> <div class="privacy-heading" data-astro-cid-mlc4vpxg> <span data-astro-cid-mlc4vpxg>🔒</span> ${t(
    "privacy_first_by_design",
    "PRIVACY-FIRST BY DESIGN"
  )} </div> <h2 data-astro-cid-mlc4vpxg> ${t(
    "files_belong_to_you",
    "Your files belong to you."
  )} </h2> <p data-astro-cid-mlc4vpxg> ${t(
    "privacy_callout_desc",
    "Dayront is designed to process media directly in your browser. Your files don't need to be uploaded to a remote server just to perform a simple conversion or edit."
  )} </p> <div class="privacy-features" data-astro-cid-mlc4vpxg> <div data-astro-cid-mlc4vpxg> <strong data-astro-cid-mlc4vpxg> ${t("no_account", "No account")} </strong> <span data-astro-cid-mlc4vpxg> ${t(
    "start_immediately",
    "Start immediately"
  )} </span> </div> <div data-astro-cid-mlc4vpxg> <strong data-astro-cid-mlc4vpxg> ${t("no_upload", "No upload")} </strong> <span data-astro-cid-mlc4vpxg> ${t(
    "local_processing",
    "Local processing"
  )} </span> </div> <div data-astro-cid-mlc4vpxg> <strong data-astro-cid-mlc4vpxg> ${t(
    "free_tools_callout",
    "Free tools"
  )} </strong> <span data-astro-cid-mlc4vpxg> ${t(
    "no_hidden_fees",
    "No hidden fees"
  )} </span> </div> </div> </div> </div> </section> ` }), defineScriptVars({
    toolsData: toolsJson,
    categoryLabels: categoryLabelsJson,
    categoryIcons: categoryIconsJson
  }));
}, "/home/dayront/src/pages/tools.astro", void 0);

const $$file = "/home/dayront/src/pages/tools.astro";
const $$url = "/tools";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tools,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
