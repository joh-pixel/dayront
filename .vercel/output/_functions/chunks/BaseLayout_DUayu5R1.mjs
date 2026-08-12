import { c as createAstro, a as createComponent, m as maybeRenderHead, u as unescapeHTML, d as addAttribute, e as renderScript, b as renderTemplate, w as defineScriptVars, r as renderComponent, x as renderSlot, y as renderHead } from './astro/server_CayxtmO5.mjs';
import 'piccolore';
import 'clsx';
import { g as getCollection } from './_astro_content_lyMaeEuS.mjs';
/* empty css                          */

const $$Astro$4 = createAstro("https://dayront.com");
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$Header;
  const logoSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#38bdf8"/>
  <path d="M8 12h16v8H8z" fill="#fff"/>
  <circle cx="16" cy="16" r="3" fill="#38bdf8"/>
</svg>`;
  const { lang = "en" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"> <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16"> <!-- Logo --> <a href="/" class="flex items-center gap-2 text-xl font-bold tracking-tight text-black dark:text-white hover:opacity-80 transition-opacity"> <span class="w-8 h-8">${unescapeHTML(logoSvg)}</span> <span>Dayront</span> </a> <!-- Desktop nav --> <div class="hidden md:flex items-center space-x-6 text-sm font-medium"> <a href="/tools" class="text-black dark:text-white hover:text-sky transition-colors">Tools</a> <a href="/blog" class="text-black dark:text-white hover:text-sky transition-colors">Blog</a> <a href="/about" class="text-black dark:text-white hover:text-sky transition-colors">About</a> <a href="/privacy" class="text-black dark:text-white hover:text-sky transition-colors">Privacy</a> <a href="/terms" class="text-black dark:text-white hover:text-sky transition-colors">Terms</a> <button onclick="window.openSearch()" class="text-black dark:text-white hover:text-sky transition-colors p-1" aria-label="Search"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg> </button> <!-- Language switcher – current lang preselected --> <select id="lang-select" class="text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-black dark:text-white focus:border-sky focus:outline-none" onchange="changeLang(this.value)"> <option value="en"${addAttribute(lang === "en", "selected")}>EN</option> <option value="es"${addAttribute(lang === "es", "selected")}>ES</option> <option value="pt"${addAttribute(lang === "pt", "selected")}>PT</option> <option value="de"${addAttribute(lang === "de", "selected")}>DE</option> <option value="fr"${addAttribute(lang === "fr", "selected")}>FR</option> <option value="ja"${addAttribute(lang === "ja", "selected")}>JA</option> </select> </div> <!-- Mobile menu button --> <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Menu"> <svg id="menu-icon" class="w-6 h-6 transition-transform duration-300 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path> </svg> </button> </nav> <!-- Mobile overlay --> <div id="mobile-overlay" class="fixed inset-0 z-40 bg-black/50 hidden transition-opacity duration-300" style="opacity:0;" aria-hidden="true"></div> <!-- Mobile menu --> <div id="mobile-menu" class="absolute top-16 inset-x-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 ease-out overflow-hidden" style="max-height:0; opacity:0; transform: translateY(-10px);"> <div class="p-4 space-y-1 text-sm font-medium"> <a href="/tools" class="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">Tools</a> <a href="/blog" class="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">Blog</a> <a href="/about" class="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">About</a> <a href="/privacy" class="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">Privacy</a> <a href="/terms" class="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white">Terms</a> <button onclick="window.openSearch()" class="block w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-black dark:text-white"> <span class="flex items-center gap-2"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg>
Search
</span> </button> <div class="flex items-center justify-between px-3 pt-3 border-t border-gray-200 dark:border-gray-800 mt-3"> <!-- Mobile language switcher – also preselected --> <select id="lang-select-mobile" class="text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-black dark:text-white" onchange="changeLang(this.value)"> <option value="en"${addAttribute(lang === "en", "selected")}>EN</option> <option value="es"${addAttribute(lang === "es", "selected")}>ES</option> <option value="pt"${addAttribute(lang === "pt", "selected")}>PT</option> <option value="de"${addAttribute(lang === "de", "selected")}>DE</option> <option value="fr"${addAttribute(lang === "fr", "selected")}>FR</option> <option value="ja"${addAttribute(lang === "ja", "selected")}>JA</option> </select> </div> </div> </div> </header> ${renderScript($$result, "/home/dayront/src/components/layout/Header.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/dayront/src/components/layout/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const logoSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="8" fill="#38bdf8"/>
  <path d="M8 12h16v8H8z" fill="#fff"/>
  <circle cx="16" cy="16" r="3" fill="#38bdf8"/>
</svg>`;
  return renderTemplate`${maybeRenderHead()}<footer class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto"> <div class="max-w-7xl mx-auto px-4 py-12"> <div class="grid grid-cols-2 md:grid-cols-4 gap-8"> <!-- Brand --> <div class="col-span-2 md:col-span-1"> <a href="/" class="flex items-center gap-2 text-xl font-bold text-black dark:text-white mb-3 hover:opacity-80 transition-opacity"> <span class="w-8 h-8">${unescapeHTML(logoSvg)}</span> <span>Dayront</span> </a> <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
Free media tools that run 100% in your browser. No uploads, no servers.
</p> <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">v1.0.0</p> </div> <!-- Popular Tools --> <div> <h4 class="font-semibold text-sm text-black dark:text-white mb-4">Popular Tools</h4> <ul class="space-y-2.5 text-sm"> <li><a href="/convert/mp4-to-mp3" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">MP4 to MP3</a></li> <li><a href="/tools/audio-cutter" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">Audio Cutter</a></li> <li><a href="/convert/mp3-to-wav" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">MP3 to WAV</a></li> <li><a href="/tools/audio-merger" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">Audio Merger</a></li> <li><a href="/tools" class="text-sky font-medium hover:underline">All Tools →</a></li> </ul> </div> <!-- Company --> <div> <h4 class="font-semibold text-sm text-black dark:text-white mb-4">Company</h4> <ul class="space-y-2.5 text-sm"> <li><a href="/about" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">About</a></li> <li><a href="/blog" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">Blog</a></li> <li><a href="/search" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">Search</a></li> <li><a href="mailto:hello@dayront.com" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">Contact</a></li> </ul> </div> <!-- Legal --> <div> <h4 class="font-semibold text-sm text-black dark:text-white mb-4">Legal</h4> <ul class="space-y-2.5 text-sm"> <li><a href="/privacy" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">Privacy Policy</a></li> <li><a href="/terms" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">Terms of Service</a></li> <li><a href="/rss.xml" class="text-gray-600 dark:text-gray-400 hover:text-sky transition-colors">RSS Feed</a></li> </ul> </div> </div> </div> <div class="border-t border-gray-200 dark:border-gray-800"> <div class="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400"> <p>&copy; ${year} Dayront. All rights reserved.</p> <p class="flex items-center gap-1.5"> <svg class="w-3.5 h-3.5 text-sky" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
Your files never leave your device
</p> </div> </div> </footer>`;
}, "/home/dayront/src/components/layout/Footer.astro", void 0);

const $$Astro$3 = createAstro("https://dayront.com");
const $$SeoHead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$SeoHead;
  const { title, description, ogImage, canonicalURL } = Astro2.props;
  const siteName = "Dayront";
  return renderTemplate`<title>${title} | ${siteName}</title><meta name="description"${addAttribute(description, "content")}><link rel="canonical"${addAttribute(canonicalURL || Astro2.url.href, "href")}><meta property="og:title"${addAttribute(title, "content")}><meta property="og:description"${addAttribute(description, "content")}><meta property="og:type" content="website"><meta property="og:url"${addAttribute(canonicalURL || Astro2.url.href, "content")}>${ogImage && renderTemplate`<meta property="og:image"${addAttribute(ogImage, "content")}>`}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"${addAttribute(title, "content")}><meta name="twitter:description"${addAttribute(description, "content")}>`;
}, "/home/dayront/src/components/shared/SeoHead.astro", void 0);

const $$Astro$2 = createAstro("https://dayront.com");
const $$AdSlot = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$AdSlot;
  const { position, class: className = "" } = Astro2.props;
  const dimensionsMap = {
    "sticky-footer": "h-[60px] md:h-[90px]",
    "below-tool": "h-[90px] md:h-[120px]",
    "in-content": "h-[250px] md:h-[280px]",
    "below-header": "h-[50px] md:h-[60px]"
    // ← compact banner
  };
  const reservedHeight = dimensionsMap[position];
  return renderTemplate`${maybeRenderHead()}<div${addAttribute([
    "w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center",
    reservedHeight,
    className
  ], "class:list")}${addAttribute(position, "data-ad-position")} aria-label="Advertisement"> <span class="text-xs text-gray-400 dark:text-gray-500 select-none">Ad</span> </div>`;
}, "/home/dayront/src/components/layout/AdSlot.astro", void 0);

var __freeze$1 = Object.freeze;
var __defProp$1 = Object.defineProperty;
var __template$1 = (cooked, raw) => __freeze$1(__defProp$1(cooked, "raw", { value: __freeze$1(raw || cooked.slice()) }));
var _a$1;
const $$Astro$1 = createAstro("https://dayront.com");
const $$SearchModal = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SearchModal;
  const { items = [] } = Astro2.props;
  return renderTemplate(_a$1 || (_a$1 = __template$1(["<!-- Modal backdrop (Now uses opacity and pointer-events instead of hidden) -->", '<div id="search-modal" class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none" aria-modal="true" role="dialog"> <!-- Modal Content (Uses scale, translate, and opacity for smooth entry/exit) --> <div id="search-modal-content" class="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 opacity-0 scale-95 translate-y-4 sm:translate-y-0"> <div class="relative border-b border-gray-200 dark:border-gray-800"> <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg> <input id="modal-search-input" type="text" placeholder="Search tools, articles..." class="w-full pl-12 pr-4 py-4 text-lg bg-transparent text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" autocomplete="off"> <button id="modal-close" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" aria-label="Close search"> <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg> </button> </div> <div id="modal-results" class="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"> <div class="p-6 text-center text-gray-400 dark:text-gray-500"> <p class="text-lg mb-2">Start typing to search\u2026</p> <p class="text-sm">Find tools, guides, and more</p> </div> </div> </div> </div> <script>(function(){', `
  const searchData = items;

  const modal = document.getElementById('search-modal');
  const modalContent = document.getElementById('search-modal-content');
  const input = document.getElementById('modal-search-input');
  const results = document.getElementById('modal-results');
  const close = document.getElementById('modal-close');

  function renderResults(filtered) {
    if (filtered.length === 0) {
      results.innerHTML = \`<div class="p-6 text-center text-gray-400">No results found</div>\`;
      return;
    }
    results.innerHTML = filtered.map(item => \`
      <a href="\${item.url}" class="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <span class="text-2xl flex-shrink-0">\${item.icon || (item.type === 'blog' ? '\u{1F4DD}' : '\u{1F527}')}</span>
        <div class="min-w-0">
          <p class="font-semibold text-black dark:text-white truncate">\${item.title}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">\${item.description || ''}</p>
          <span class="text-xs text-gray-400 mt-1 capitalize">\${item.type}</span>
        </div>
      </a>
    \`).join('');
  }

  input?.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) {
      results.innerHTML = \`<div class="p-6 text-center text-gray-400 dark:text-gray-500">Start typing to search\u2026</div>\`;
      return;
    }
    const filtered = searchData.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
    renderResults(filtered);
  });

  // Function to handle Opening with animations
  window.openSearch = () => {
    // Reveal Backdrop
    modal.classList.remove('opacity-0', 'pointer-events-none');
    
    // Reveal and Scale Content
    modalContent.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    modalContent.classList.add('opacity-100', 'scale-100', 'translate-y-0');
    
    input?.focus();
    if (input) input.value = '';
    results.innerHTML = \`<div class="p-6 text-center text-gray-400 dark:text-gray-500">Start typing to search\u2026</div>\`;
  };

  // Function to handle Closing with animations
  const closeSearch = () => {
    // Hide Backdrop
    modal.classList.add('opacity-0', 'pointer-events-none');
    
    // Hide and Scale Down Content
    modalContent.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    modalContent.classList.add('opacity-0', 'scale-95', 'translate-y-4');
    
    // Optional: Blur the input so mobile keyboards dismiss immediately
    input?.blur();
  };

  close?.addEventListener('click', closeSearch);
  
  // Close when clicking outside the modal content
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch();
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
      closeSearch();
    }
  });
})();<\/script>`], ["<!-- Modal backdrop (Now uses opacity and pointer-events instead of hidden) -->", '<div id="search-modal" class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none" aria-modal="true" role="dialog"> <!-- Modal Content (Uses scale, translate, and opacity for smooth entry/exit) --> <div id="search-modal-content" class="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 opacity-0 scale-95 translate-y-4 sm:translate-y-0"> <div class="relative border-b border-gray-200 dark:border-gray-800"> <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path></svg> <input id="modal-search-input" type="text" placeholder="Search tools, articles..." class="w-full pl-12 pr-4 py-4 text-lg bg-transparent text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" autocomplete="off"> <button id="modal-close" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors" aria-label="Close search"> <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg> </button> </div> <div id="modal-results" class="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"> <div class="p-6 text-center text-gray-400 dark:text-gray-500"> <p class="text-lg mb-2">Start typing to search\u2026</p> <p class="text-sm">Find tools, guides, and more</p> </div> </div> </div> </div> <script>(function(){', `
  const searchData = items;

  const modal = document.getElementById('search-modal');
  const modalContent = document.getElementById('search-modal-content');
  const input = document.getElementById('modal-search-input');
  const results = document.getElementById('modal-results');
  const close = document.getElementById('modal-close');

  function renderResults(filtered) {
    if (filtered.length === 0) {
      results.innerHTML = \\\`<div class="p-6 text-center text-gray-400">No results found</div>\\\`;
      return;
    }
    results.innerHTML = filtered.map(item => \\\`
      <a href="\\\${item.url}" class="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <span class="text-2xl flex-shrink-0">\\\${item.icon || (item.type === 'blog' ? '\u{1F4DD}' : '\u{1F527}')}</span>
        <div class="min-w-0">
          <p class="font-semibold text-black dark:text-white truncate">\\\${item.title}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">\\\${item.description || ''}</p>
          <span class="text-xs text-gray-400 mt-1 capitalize">\\\${item.type}</span>
        </div>
      </a>
    \\\`).join('');
  }

  input?.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) {
      results.innerHTML = \\\`<div class="p-6 text-center text-gray-400 dark:text-gray-500">Start typing to search\u2026</div>\\\`;
      return;
    }
    const filtered = searchData.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
    renderResults(filtered);
  });

  // Function to handle Opening with animations
  window.openSearch = () => {
    // Reveal Backdrop
    modal.classList.remove('opacity-0', 'pointer-events-none');
    
    // Reveal and Scale Content
    modalContent.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    modalContent.classList.add('opacity-100', 'scale-100', 'translate-y-0');
    
    input?.focus();
    if (input) input.value = '';
    results.innerHTML = \\\`<div class="p-6 text-center text-gray-400 dark:text-gray-500">Start typing to search\u2026</div>\\\`;
  };

  // Function to handle Closing with animations
  const closeSearch = () => {
    // Hide Backdrop
    modal.classList.add('opacity-0', 'pointer-events-none');
    
    // Hide and Scale Down Content
    modalContent.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    modalContent.classList.add('opacity-0', 'scale-95', 'translate-y-4');
    
    // Optional: Blur the input so mobile keyboards dismiss immediately
    input?.blur();
  };

  close?.addEventListener('click', closeSearch);
  
  // Close when clicking outside the modal content
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch();
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) {
      closeSearch();
    }
  });
})();<\/script>`])), maybeRenderHead(), defineScriptVars({ items }));
}, "/home/dayront/src/components/ui/SearchModal.astro", void 0);

const tools = [
  // ── AUDIO UTILITIES ──────────────────────
  {
    slug: "audio-cutter",
    name: "Audio Cutter",
    category: "audio-utility",
    description: "Trim and cut audio files directly in your browser.",
    metaTitle: "Audio Cutter – Trim MP3, WAV Online Free | Dayront",
    metaDescription: "Cut audio files online without uploading. Trim MP3, WAV, M4A, and more. 100% private.",
    icon: "✂️",
    type: "cut",
    outputFormat: "mp3",
    settings: [{
      name: "start",
      label: "Start time (seconds)",
      type: "number",
      min: 0,
      default: 0
    }, {
      name: "duration",
      label: "Duration (seconds)",
      type: "number",
      min: 1,
      default: 30
    }],
    faq: [{
      question: "Is it really free?",
      answer: "Yes, completely free."
    }, {
      question: "Do my files leave my device?",
      answer: "No, processing is local."
    }, {
      question: "What formats are supported?",
      answer: "MP3, WAV, M4A, OGG, FLAC, and more."
    }],
    howTo: [{
      title: "Select your audio file",
      text: "Click or drag & drop your audio file."
    }, {
      title: "Adjust the cut points",
      text: "Use the sliders to set start and end."
    }, {
      title: "Download the trimmed audio",
      text: "Save your trimmed file."
    }],
    relatedTools: ["audio-merger", "audio-compressor", "mp3-to-wav"]
  },
  {
    slug: "audio-merger",
    name: "Audio Merger",
    category: "audio-utility",
    description: "Combine multiple audio files into one.",
    metaTitle: "Audio Merger – Combine Audio Files Online Free | Dayront",
    metaDescription: "Merge multiple audio tracks into one file. Supports MP3, WAV, M4A, and more.",
    icon: "🔗",
    type: "merge",
    outputFormat: "mp3",
    faq: [{
      question: "Can I merge different formats?",
      answer: "Yes, mix MP3, WAV, M4A, etc."
    }, {
      question: "Is quality preserved?",
      answer: "Yes, we avoid unnecessary re-encoding."
    }, {
      question: "Is there a file size limit?",
      answer: "No hard limit."
    }],
    howTo: [{
      title: "Upload your audio files",
      text: "Select two or more files."
    }, {
      title: "Arrange the order",
      text: "Drag to set playback sequence."
    }, {
      title: "Merge and download",
      text: "Get your combined file."
    }],
    relatedTools: ["audio-cutter", "audio-compressor", "wav-to-mp3"]
  },
  {
    slug: "audio-compressor",
    name: "Audio Compressor",
    category: "audio-utility",
    description: "Reduce audio file size without losing quality.",
    metaTitle: "Audio Compressor – Reduce Audio File Size Online | Dayront",
    metaDescription: "Compress MP3, WAV, M4A files in your browser. No uploads, 100% private.",
    icon: "📦",
    type: "compress",
    outputFormat: "mp3",
    settings: [{
      name: "quality",
      label: "Quality (0 best, 9 smallest)",
      type: "range",
      min: 0,
      max: 9,
      default: 3
    }],
    faq: [{
      question: "Will quality suffer?",
      answer: "Smart compression keeps audio clear."
    }, {
      question: "Is my file safe?",
      answer: "Everything happens on your device."
    }, {
      question: "Which formats?",
      answer: "MP3, WAV, M4A, OGG, FLAC."
    }],
    howTo: [{
      title: "Upload your audio file",
      text: "Select the file to compress."
    }, {
      title: "Choose compression strength",
      text: "Adjust quality vs size."
    }, {
      title: "Download compressed file",
      text: "Get a lighter file instantly."
    }],
    relatedTools: ["volume-booster", "audio-cutter", "mp3-to-wav"]
  },
  {
    slug: "volume-booster",
    name: "Volume Booster",
    category: "audio-utility",
    description: "Make your audio files louder without distortion.",
    metaTitle: "Volume Booster – Increase Audio Volume Online Free | Dayront",
    metaDescription: "Make audio files louder instantly. No upload, 100% private.",
    icon: "🔊",
    type: "boost",
    outputFormat: "mp3",
    settings: [{
      name: "gain",
      label: "Gain (dB)",
      type: "number",
      min: 1,
      max: 20,
      default: 6
    }],
    faq: [{
      question: "Will it distort?",
      answer: "No, we prevent clipping."
    }, {
      question: "How much louder?",
      answer: "+6 dB by default."
    }, {
      question: "Supported formats?",
      answer: "MP3, WAV, M4A, OGG, FLAC."
    }],
    howTo: [{
      title: "Select your audio file",
      text: "Choose a quiet track."
    }, {
      title: "Boost the volume",
      text: "Safe gain applied."
    }, {
      title: "Download louder file",
      text: "Save boosted audio."
    }],
    relatedTools: ["audio-compressor", "speed-changer", "mp3-to-wav"]
  },
  {
    slug: "speed-changer",
    name: "Speed Changer",
    category: "audio-utility",
    description: "Speed up or slow down audio playback.",
    metaTitle: "Audio Speed Changer – Change Playback Speed Online Free | Dayront",
    metaDescription: "Speed up or slow down audio files in your browser. No upload, 100% private.",
    icon: "⏩",
    type: "speed",
    outputFormat: "mp3",
    settings: [{
      name: "factor",
      label: "Speed factor",
      type: "number",
      min: 0.25,
      max: 4,
      default: 1.5
    }],
    faq: [{
      question: "Does it affect pitch?",
      answer: "We preserve original pitch."
    }, {
      question: "What speeds?",
      answer: "From 0.25× to 4×."
    }, {
      question: "Is it free?",
      answer: "Yes, completely free."
    }],
    howTo: [{
      title: "Upload your audio",
      text: "Select file to modify."
    }, {
      title: "Choose speed factor",
      text: "Pick desired speed."
    }, {
      title: "Download altered file",
      text: "Get speed-changed audio."
    }],
    relatedTools: ["reverse-audio", "volume-booster", "audio-cutter"]
  },
  {
    slug: "reverse-audio",
    name: "Reverse Audio",
    category: "audio-utility",
    description: "Play your audio backwards.",
    metaTitle: "Reverse Audio – Play Audio Backwards Free Online | Dayront",
    metaDescription: "Reverse audio files online. No upload needed. 100% private.",
    icon: "↩️",
    type: "reverse",
    outputFormat: "mp3",
    faq: [{
      question: "What does reversing do?",
      answer: "Plays sound backwards."
    }, {
      question: "Long files?",
      answer: "Yes, depends on device speed."
    }, {
      question: "Is my file safe?",
      answer: "Everything stays on your device."
    }],
    howTo: [{
      title: "Choose your audio file",
      text: "Drop an MP3 or WAV."
    }, {
      title: "Reverse it",
      text: "Click reverse."
    }, {
      title: "Download reversed file",
      text: "Save backwards audio."
    }],
    relatedTools: ["speed-changer", "audio-cutter", "mp3-to-ogg"]
  },
  {
    slug: "stereo-to-mono",
    name: "Stereo to Mono",
    category: "audio-utility",
    description: "Convert stereo audio to mono.",
    metaTitle: "Stereo to Mono Converter – Free Online Tool | Dayront",
    metaDescription: "Convert stereo audio to mono instantly. No upload, 100% private.",
    icon: "🔉",
    type: "stereo-to-mono",
    outputFormat: "mp3",
    faq: [{
      question: "Why convert to mono?",
      answer: "Smaller files, same audio in both ears."
    }, {
      question: "Quality lost?",
      answer: "Combined signal preserves clarity."
    }, {
      question: "All formats?",
      answer: "MP3, WAV, M4A, FLAC, OGG."
    }],
    howTo: [{
      title: "Upload stereo file",
      text: "Select an audio file."
    }, {
      title: "Convert automatically",
      text: "Mixed to mono."
    }, {
      title: "Download mono file",
      text: "Save single-channel audio."
    }],
    relatedTools: ["audio-cutter", "volume-booster", "mp3-to-wav"]
  },
  // ── AUDIO CONVERSIONS ─────────────────────
  {
    slug: "mp3-to-wav",
    name: "MP3 to WAV",
    category: "audio-conversion",
    from: "mp3",
    to: "wav",
    description: "Convert MP3 to lossless WAV format.",
    metaTitle: "MP3 to WAV Converter – Free Online, No Upload | Dayront",
    metaDescription: "Convert MP3 to lossless WAV in your browser. No upload, 100% private.",
    icon: "🎵",
    type: "convert",
    faq: [{
      question: "Does it improve quality?",
      answer: "No, preserves original MP3 quality."
    }, {
      question: "Why convert to WAV?",
      answer: "Preferred for editing and archiving."
    }, {
      question: "Is my file safe?",
      answer: "All processing is local."
    }],
    howTo: [{
      title: "Upload MP3 file",
      text: "Select an MP3."
    }, {
      title: "Convert to WAV",
      text: "Decoded to uncompressed WAV."
    }, {
      title: "Download WAV",
      text: "Get lossless file."
    }],
    relatedTools: ["wav-to-mp3", "mp3-to-m4a", "flac-to-mp3"]
  },
  {
    slug: "wav-to-mp3",
    name: "WAV to MP3",
    category: "audio-conversion",
    from: "wav",
    to: "mp3",
    description: "Convert WAV to MP3 format.",
    metaTitle: "WAV to MP3 Converter – Free Online, No Upload | Dayront",
    metaDescription: "Convert WAV to MP3 in your browser. No upload, fully private.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "How much smaller?",
      answer: "5-10× smaller than WAV."
    }, {
      question: "Will I hear difference?",
      answer: "At 320kbps, indistinguishable."
    }, {
      question: "Is it free?",
      answer: "Yes, unlimited conversions."
    }],
    howTo: [{
      title: "Upload WAV file",
      text: "Select a WAV."
    }, {
      title: "Convert to MP3",
      text: "Compressed to MP3."
    }, {
      title: "Download MP3",
      text: "Save smaller file."
    }],
    relatedTools: ["mp3-to-wav", "flac-to-mp3", "audio-cutter"]
  },
  {
    slug: "m4a-to-mp3",
    name: "M4A to MP3",
    category: "audio-conversion",
    from: "m4a",
    to: "mp3",
    description: "Convert M4A audio to MP3 format.",
    metaTitle: "M4A to MP3 Converter – Free Online, No Upload | Dayront",
    metaDescription: "Convert M4A to MP3 in your browser. No upload, fully private.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "Why convert?",
      answer: "MP3 is more widely supported."
    }, {
      question: "File size?",
      answer: "Similar, high-quality MP3 bitrate."
    }, {
      question: "Secure?",
      answer: "All local processing."
    }],
    howTo: [{
      title: "Upload M4A file",
      text: "Select M4A."
    }, {
      title: "Convert to MP3",
      text: "Re-encoded to MP3."
    }, {
      title: "Download MP3",
      text: "Get compatible file."
    }],
    relatedTools: ["mp3-to-m4a", "wav-to-mp3", "volume-booster"]
  },
  {
    slug: "mp3-to-m4a",
    name: "MP3 to M4A",
    category: "audio-conversion",
    from: "mp3",
    to: "m4a",
    description: "Convert MP3 to M4A (AAC) format.",
    metaTitle: "MP3 to M4A Converter – Free Online, No Upload | Dayront",
    metaDescription: "Convert MP3 to M4A in your browser. Keep quality, reduce size.",
    icon: "🎵",
    type: "convert",
    faq: [{
      question: "Why M4A?",
      answer: "Better quality at same bitrate, ideal for Apple."
    }, {
      question: "Quality loss?",
      answer: "Minimal, high-bitrate AAC encoder."
    }, {
      question: "Free?",
      answer: "Yes, completely free."
    }],
    howTo: [{
      title: "Select MP3 file",
      text: "Choose an MP3."
    }, {
      title: "Convert to M4A",
      text: "Wrapped in M4A container."
    }, {
      title: "Download M4A",
      text: "Save for Apple devices."
    }],
    relatedTools: ["m4a-to-mp3", "mp3-to-wav", "audio-compressor"]
  },
  {
    slug: "flac-to-mp3",
    name: "FLAC to MP3",
    category: "audio-conversion",
    from: "flac",
    to: "mp3",
    description: "Convert FLAC audio to MP3.",
    metaTitle: "FLAC to MP3 Converter – Free Online, No Upload | Dayront",
    metaDescription: "Convert FLAC to MP3 in your browser. 100% private, fast and free.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "Will I lose quality?",
      answer: "High-quality 320kbps encoding."
    }, {
      question: "Safe?",
      answer: "Everything on your device."
    }, {
      question: "Batch?",
      answer: "Coming soon."
    }],
    howTo: [{
      title: "Upload FLAC file",
      text: "Select FLAC."
    }, {
      title: "Convert instantly",
      text: "Transcoded to MP3."
    }, {
      title: "Download MP3",
      text: "Save compressed file."
    }],
    relatedTools: ["mp3-to-wav", "ogg-to-mp3", "audio-cutter"]
  },
  {
    slug: "ogg-to-mp3",
    name: "OGG to MP3",
    category: "audio-conversion",
    from: "ogg",
    to: "mp3",
    description: "Convert OGG audio to MP3 format.",
    metaTitle: "OGG to MP3 Converter – Free Online, No Upload | Dayront",
    metaDescription: "Convert OGG to MP3 in your browser. No upload, fully private.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "Why convert?",
      answer: "MP3 is more widely supported."
    }, {
      question: "File size change?",
      answer: "Slightly larger at high bitrate."
    }, {
      question: "Free?",
      answer: "Yes, no registration."
    }],
    howTo: [{
      title: "Upload OGG file",
      text: "Select OGG Vorbis."
    }, {
      title: "Convert to MP3",
      text: "Transcoded to MP3."
    }, {
      title: "Download MP3",
      text: "Get universal file."
    }],
    relatedTools: ["mp3-to-ogg", "flac-to-mp3", "reverse-audio"]
  },
  {
    slug: "mp3-to-ogg",
    name: "MP3 to OGG",
    category: "audio-conversion",
    from: "mp3",
    to: "ogg",
    description: "Convert MP3 to OGG Vorbis format.",
    metaTitle: "MP3 to OGG Converter – Free Online, No Upload | Dayront",
    metaDescription: "Convert MP3 to OGG in your browser. No upload, completely private.",
    icon: "🎵",
    type: "convert",
    faq: [{
      question: "Why OGG?",
      answer: "Open format, excellent quality."
    }, {
      question: "Quality lost?",
      answer: "Minimal with high-quality settings."
    }, {
      question: "Safe?",
      answer: "Local processing."
    }],
    howTo: [{
      title: "Select MP3 file",
      text: "Choose MP3."
    }, {
      title: "Convert to OGG",
      text: "Re-encoded to OGG."
    }, {
      title: "Download OGG",
      text: "Save open-source file."
    }],
    relatedTools: ["ogg-to-mp3", "mp3-to-wav", "audio-compressor"]
  },
  {
    slug: "ape-to-mp3",
    name: "APE to MP3",
    category: "audio-conversion",
    from: "ape",
    to: "mp3",
    description: "Convert APE lossless audio to MP3.",
    metaTitle: "APE to MP3 Converter – Free Online | Dayront",
    metaDescription: "Convert APE files to MP3 in your browser. No upload, private.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [],
    howTo: [{
      title: "Upload APE file",
      text: "Select an APE audio file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP3",
      text: "Get the MP3 file."
    }],
    relatedTools: ["flac-to-mp3", "wav-to-mp3", "audio-cutter"]
  },
  {
    slug: "opus-to-mp3",
    name: "OPUS to MP3",
    category: "audio-conversion",
    from: "opus",
    to: "mp3",
    description: "Convert OPUS audio to MP3 format.",
    metaTitle: "OPUS to MP3 Converter – Free Online | Dayront",
    metaDescription: "Convert OPUS to MP3 in your browser. No upload.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [],
    howTo: [{
      title: "Upload OPUS file",
      text: "Select an OPUS audio file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP3",
      text: "Get the MP3 file."
    }],
    relatedTools: ["ogg-to-mp3", "flac-to-mp3", "mp3-to-wav"]
  },
  {
    slug: "aiff-to-mp3",
    name: "AIFF to MP3",
    category: "audio-conversion",
    from: "aiff",
    to: "mp3",
    description: "Convert AIFF audio to MP3.",
    metaTitle: "AIFF to MP3 Converter – Free Online | Dayront",
    metaDescription: "Convert AIFF files to MP3 in your browser. No upload.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [],
    howTo: [{
      title: "Upload AIFF file",
      text: "Select an AIFF audio file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP3",
      text: "Get the MP3 file."
    }],
    relatedTools: ["wav-to-mp3", "flac-to-mp3", "mp3-to-m4a"]
  },
  {
    slug: "aac-to-mp3",
    name: "AAC to MP3",
    category: "audio-conversion",
    from: "aac",
    to: "mp3",
    description: "Convert AAC audio to MP3.",
    metaTitle: "AAC to MP3 Converter – Free Online | Dayront",
    metaDescription: "Convert AAC to MP3 in your browser. No upload.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [],
    howTo: [{
      title: "Upload AAC file",
      text: "Select an AAC audio file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP3",
      text: "Get the MP3 file."
    }],
    relatedTools: ["m4a-to-mp3", "wav-to-mp3", "volume-booster"]
  },
  {
    slug: "amr-to-mp3",
    name: "AMR to MP3",
    category: "audio-conversion",
    from: "amr",
    to: "mp3",
    description: "Convert AMR audio (voice recordings) to MP3.",
    metaTitle: "AMR to MP3 Converter – Free Online | Dayront",
    metaDescription: "Convert AMR files to MP3 in your browser. No upload.",
    icon: "🎵",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [],
    howTo: [{
      title: "Upload AMR file",
      text: "Select an AMR audio file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP3",
      text: "Get the MP3 file."
    }],
    relatedTools: ["wav-to-mp3", "aac-to-mp3", "mp3-to-ogg"]
  },
  // ── VIDEO TO AUDIO ────────────────────────
  {
    slug: "mp4-to-mp3",
    name: "MP4 to MP3",
    category: "video-to-audio",
    from: "mp4",
    to: "mp3",
    description: "Extract MP3 audio from MP4 videos.",
    metaTitle: "MP4 to MP3 Converter – Extract Audio Free Online | Dayront",
    metaDescription: "Convert MP4 video to MP3 audio in your browser. No upload, fully private.",
    icon: "🎬",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Audio bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "HD videos?",
      answer: "Yes, any MP4 with audio."
    }, {
      question: "Uploaded?",
      answer: "No, conversion is local."
    }, {
      question: "Part of audio?",
      answer: "Use Audio Cutter after."
    }],
    howTo: [{
      title: "Upload MP4 video",
      text: "Drag & drop MP4."
    }, {
      title: "Convert to MP3",
      text: "Audio extracted."
    }, {
      title: "Download MP3",
      text: "Get audio file."
    }],
    relatedTools: ["mp4-to-wav", "webm-to-mp3", "audio-cutter"]
  },
  {
    slug: "mov-to-mp3",
    name: "MOV to MP3",
    category: "video-to-audio",
    from: "mov",
    to: "mp3",
    description: "Extract MP3 audio from MOV videos.",
    metaTitle: "MOV to MP3 Converter – Extract Audio Free Online | Dayront",
    metaDescription: "Convert MOV video to MP3 audio in your browser. No upload, 100% private.",
    icon: "🎬",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "iPhone videos?",
      answer: "Yes, fully compatible."
    }, {
      question: "Quality loss?",
      answer: "High-quality encoder."
    }, {
      question: "Free?",
      answer: "Yes, unlimited."
    }],
    howTo: [{
      title: "Choose MOV file",
      text: "Select QuickTime MOV."
    }, {
      title: "Extract audio",
      text: "Encoded to MP3."
    }, {
      title: "Download MP3",
      text: "Save audio."
    }],
    relatedTools: ["mp4-to-mp3", "avi-to-mp3", "speed-changer"]
  },
  {
    slug: "mkv-to-mp3",
    name: "MKV to MP3",
    category: "video-to-audio",
    from: "mkv",
    to: "mp3",
    description: "Extract MP3 audio from MKV videos.",
    metaTitle: "MKV to MP3 Converter – Extract Audio Free Online | Dayront",
    metaDescription: "Convert MKV video to MP3 audio in your browser. No upload, completely private.",
    icon: "🎬",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "Multi-channel?",
      answer: "Downmixed to stereo."
    }, {
      question: "Subtitles?",
      answer: "Ignored."
    }, {
      question: "File size limit?",
      answer: "No hard limit."
    }],
    howTo: [{
      title: "Upload MKV video",
      text: "Select MKV."
    }, {
      title: "Convert to MP3",
      text: "Audio extracted."
    }, {
      title: "Download MP3",
      text: "Get audio file."
    }],
    relatedTools: ["avi-to-mp3", "mp4-to-mp3", "audio-merger"]
  },
  {
    slug: "avi-to-mp3",
    name: "AVI to MP3",
    category: "video-to-audio",
    from: "avi",
    to: "mp3",
    description: "Extract MP3 audio from AVI videos.",
    metaTitle: "AVI to MP3 Converter – Extract Audio Free Online | Dayront",
    metaDescription: "Convert AVI video to MP3 audio in your browser. No upload, 100% private.",
    icon: "🎬",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "All AVI files?",
      answer: "Yes, with audio track."
    }, {
      question: "Uploaded?",
      answer: "No, local processing."
    }, {
      question: "Multiple?",
      answer: "One at a time currently."
    }],
    howTo: [{
      title: "Select AVI file",
      text: "Choose AVI video."
    }, {
      title: "Extract audio",
      text: "Encoded to MP3."
    }, {
      title: "Download MP3",
      text: "Save audio file."
    }],
    relatedTools: ["mkv-to-mp3", "mov-to-mp3", "audio-cutter"]
  },
  {
    slug: "webm-to-mp3",
    name: "WebM to MP3",
    category: "video-to-audio",
    from: "webm",
    to: "mp3",
    description: "Extract MP3 audio from WebM videos.",
    metaTitle: "WebM to MP3 Converter – Extract MP3 Audio Free Online | Dayront",
    metaDescription: "Convert WebM video to MP3 audio in your browser. No upload, private, and free.",
    icon: "🎬",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [{
      question: "Audio-only?",
      answer: "Yes, works."
    }, {
      question: "Bitrate?",
      answer: "High-quality VBR."
    }, {
      question: "Safe?",
      answer: "100% local."
    }],
    howTo: [{
      title: "Upload WebM file",
      text: "Select WebM."
    }, {
      title: "Convert to MP3",
      text: "Audio extracted."
    }, {
      title: "Download MP3",
      text: "Get audio file."
    }],
    relatedTools: ["webm-to-wav", "mp4-to-mp3", "audio-compressor"]
  },
  {
    slug: "mp4-to-wav",
    name: "MP4 to WAV",
    category: "video-to-audio",
    from: "mp4",
    to: "wav",
    description: "Extract WAV audio from MP4 videos.",
    metaTitle: "MP4 to WAV Converter – Extract Audio Free Online | Dayront",
    metaDescription: "Convert MP4 video to WAV audio in your browser. No upload, fully private.",
    icon: "🎬",
    type: "convert",
    faq: [{
      question: "Why WAV?",
      answer: "Ideal for editing and archiving."
    }, {
      question: "Large files?",
      answer: "Yes, depends on device speed."
    }, {
      question: "Safe?",
      answer: "Everything stays on your computer."
    }],
    howTo: [{
      title: "Choose MP4 video",
      text: "Select MP4."
    }, {
      title: "Extract WAV",
      text: "Uncompressed audio."
    }, {
      title: "Download WAV",
      text: "Save high-quality audio."
    }],
    relatedTools: ["mp4-to-mp3", "webm-to-wav", "volume-booster"]
  },
  {
    slug: "webm-to-wav",
    name: "WebM to WAV",
    category: "video-to-audio",
    from: "webm",
    to: "wav",
    description: "Extract WAV audio from WebM videos.",
    metaTitle: "WebM to WAV Converter – Free Online, No Upload | Dayront",
    metaDescription: "Extract lossless WAV from WebM files in your browser. No upload, 100% private.",
    icon: "🎬",
    type: "convert",
    faq: [{
      question: "Lossless?",
      answer: "WAV preserves original audio."
    }, {
      question: "WebM videos?",
      answer: "Yes, any WebM with audio."
    }, {
      question: "Free?",
      answer: "Completely free."
    }],
    howTo: [{
      title: "Upload WebM file",
      text: "Select WebM."
    }, {
      title: "Convert to WAV",
      text: "Uncompressed WAV."
    }, {
      title: "Download WAV",
      text: "Save for editing."
    }],
    relatedTools: ["webm-to-mp3", "mp4-to-wav", "audio-cutter"]
  },
  {
    slug: "flv-to-mp3",
    name: "FLV to MP3",
    category: "video-to-audio",
    from: "flv",
    to: "mp3",
    description: "Extract MP3 audio from FLV videos.",
    metaTitle: "FLV to MP3 Converter – Free Online | Dayront",
    metaDescription: "Convert FLV to MP3 in your browser. No upload, private.",
    icon: "🎬",
    type: "convert",
    settings: [{
      name: "bitrate",
      label: "Bitrate",
      type: "select",
      options: ["128k", "192k", "256k", "320k"],
      default: "192k"
    }],
    faq: [],
    howTo: [{
      title: "Upload FLV file",
      text: "Select an FLV video."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP3",
      text: "Get the audio."
    }],
    relatedTools: ["mp4-to-mp3", "webm-to-mp3", "flv-to-mp4"]
  },
  // ── VIDEO CONVERSIONS ─────────────────────
  {
    slug: "flv-to-mp4",
    name: "FLV to MP4",
    category: "video-conversion",
    from: "flv",
    to: "mp4",
    description: "Convert FLV video to MP4 format.",
    metaTitle: "FLV to MP4 Converter – Free Online | Dayront",
    metaDescription: "Convert FLV to MP4 in your browser. No upload.",
    icon: "🎬",
    type: "convert-video",
    outputFormat: "mp4",
    settings: [{
      name: "vcodec",
      label: "Video Codec",
      type: "select",
      options: ["libx264", "copy"],
      default: "libx264"
    }, {
      name: "acodec",
      label: "Audio Codec",
      type: "select",
      options: ["aac", "copy"],
      default: "aac"
    }],
    faq: [],
    howTo: [{
      title: "Upload FLV",
      text: "Select FLV file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP4",
      text: "Get the MP4 file."
    }],
    relatedTools: ["flv-to-webm", "mp4-to-mp3", "video-compressor"]
  },
  {
    slug: "flv-to-webm",
    name: "FLV to WebM",
    category: "video-conversion",
    from: "flv",
    to: "webm",
    description: "Convert FLV to WebM format.",
    metaTitle: "FLV to WebM Converter – Free Online | Dayront",
    metaDescription: "Convert FLV to WebM in your browser. No upload.",
    icon: "🎬",
    type: "convert-video",
    outputFormat: "webm",
    settings: [{
      name: "vcodec",
      label: "Video Codec",
      type: "select",
      options: ["libvpx", "copy"],
      default: "libvpx"
    }, {
      name: "acodec",
      label: "Audio Codec",
      type: "select",
      options: ["libvorbis", "copy"],
      default: "libvorbis"
    }],
    faq: [],
    howTo: [{
      title: "Upload FLV",
      text: "Select FLV file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download WebM",
      text: "Get the WebM file."
    }],
    relatedTools: ["flv-to-mp4", "webm-to-mp3", "video-compressor"]
  },
  // ── VIDEO UTILITIES ──────────────────────
  {
    slug: "video-compressor",
    name: "Video Compressor",
    category: "video-utility",
    description: "Reduce video file size with adjustable quality.",
    metaTitle: "Video Compressor – Reduce Video Size Online Free | Dayront",
    metaDescription: "Compress MP4, WebM, MOV files in your browser. Adjust quality and speed. 100% private.",
    icon: "📉",
    type: "video-compress",
    outputFormat: "mp4",
    settings: [{
      name: "crf",
      label: "Quality (0 best, 51 worst)",
      type: "range",
      min: 0,
      max: 51,
      default: 23
    }, {
      name: "preset",
      label: "Encoding Speed",
      type: "select",
      options: ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow"],
      default: "medium"
    }],
    faq: [{
      question: "Will quality be lost?",
      answer: "Yes, but you can control the trade‑off with the CRF slider. Lower CRF = better quality, larger file."
    }, {
      question: "Is it really free?",
      answer: "Yes, unlimited use."
    }],
    howTo: [{
      title: "Upload your video",
      text: "Choose an MP4, WebM, or MOV file."
    }, {
      title: "Adjust settings",
      text: "Select quality and speed."
    }, {
      title: "Download compressed file",
      text: "Get a smaller video instantly."
    }],
    relatedTools: ["video-cutter", "resize-video", "video-to-gif"]
  },
  {
    slug: "video-cutter",
    name: "Video Cutter",
    category: "video-utility",
    description: "Trim and cut video clips without re‑encoding.",
    metaTitle: "Video Cutter – Trim Video Online Free | Dayront",
    metaDescription: "Cut MP4, WebM, MOV videos in your browser. No upload, 100% private.",
    icon: "✂️",
    type: "video-cut",
    outputFormat: "mp4",
    settings: [{
      name: "start",
      label: "Start time (seconds)",
      type: "number",
      min: 0,
      default: 0
    }, {
      name: "duration",
      label: "Duration (seconds)",
      type: "number",
      min: 1,
      default: 30
    }],
    faq: [{
      question: "Does it re‑encode?",
      answer: "No, we use stream copy for speed and no quality loss."
    }],
    howTo: [{
      title: "Upload your video",
      text: "Select a video file."
    }, {
      title: "Set start and duration",
      text: "Enter the seconds to keep."
    }, {
      title: "Download the trimmed clip",
      text: "Get your cut video instantly."
    }],
    relatedTools: ["video-compressor", "video-merger", "audio-cutter"]
  },
  {
    slug: "video-merger",
    name: "Video Merger",
    category: "video-utility",
    description: "Combine multiple videos into one file.",
    metaTitle: "Video Merger – Combine Videos Online Free | Dayront",
    metaDescription: "Merge MP4, WebM, MOV clips in your browser. No upload, private.",
    icon: "🔗",
    type: "video-merge",
    outputFormat: "mp4",
    settings: [],
    faq: [{
      question: "Can I merge different formats?",
      answer: "Yes, they will be converted to a consistent format automatically."
    }],
    howTo: [{
      title: "Upload video files",
      text: "Select two or more videos."
    }, {
      title: "Arrange order",
      text: "Drag to reorder."
    }, {
      title: "Merge and download",
      text: "Get a single combined video."
    }],
    relatedTools: ["video-cutter", "audio-merger", "video-compressor"]
  },
  {
    slug: "video-to-gif",
    name: "Video to GIF",
    category: "video-utility",
    description: "Convert a video clip to an animated GIF.",
    metaTitle: "Video to GIF Converter – Free Online | Dayront",
    metaDescription: "Turn MP4, WebM, MOV into GIFs. Adjust FPS and size. 100% private.",
    icon: "🖼️",
    type: "video-to-gif",
    outputFormat: "gif",
    settings: [{
      name: "fps",
      label: "Frames per second",
      type: "number",
      min: 1,
      max: 30,
      default: 10
    }, {
      name: "width",
      label: "Width (pixels)",
      type: "number",
      min: 100,
      max: 800,
      default: 320
    }],
    faq: [{
      question: "Will it loop?",
      answer: "Yes, GIFs loop infinitely."
    }],
    howTo: [{
      title: "Upload video",
      text: "Choose a short video."
    }, {
      title: "Set size and speed",
      text: "Adjust width and FPS."
    }, {
      title: "Download GIF",
      text: "Get your animated GIF."
    }],
    relatedTools: ["gif-to-video", "video-compressor", "video-cutter"]
  },
  {
    slug: "gif-to-video",
    name: "GIF to MP4",
    category: "video-utility",
    description: "Convert an animated GIF to an MP4 video.",
    metaTitle: "GIF to MP4 Converter – Free Online | Dayront",
    metaDescription: "Turn GIFs into MP4 videos. No upload, private.",
    icon: "🎞️",
    type: "gif-to-video",
    outputFormat: "mp4",
    settings: [],
    faq: [{
      question: "Why convert to video?",
      answer: "MP4 files are often smaller than GIFs and support audio."
    }],
    howTo: [{
      title: "Upload GIF",
      text: "Select a GIF file."
    }, {
      title: "Convert",
      text: "Click convert."
    }, {
      title: "Download MP4",
      text: "Get the video version."
    }],
    relatedTools: ["video-to-gif", "video-compressor", "resize-video"]
  },
  {
    slug: "resize-video",
    name: "Resize Video",
    category: "video-utility",
    description: "Change video resolution (width/height).",
    metaTitle: "Resize Video – Change Resolution Online Free | Dayront",
    metaDescription: "Resize MP4, WebM, MOV videos. Set custom width and height. Private.",
    icon: "↔️",
    type: "resize-video",
    outputFormat: "mp4",
    settings: [{
      name: "width",
      label: "Width (pixels)",
      type: "number",
      min: 100,
      max: 3840,
      default: 1280
    }, {
      name: "height",
      label: "Height (pixels)",
      type: "number",
      min: 100,
      max: 2160,
      default: 720
    }],
    faq: [{
      question: "Will it keep aspect ratio?",
      answer: "No, it will stretch to the exact dimensions. To maintain aspect ratio, set only width or height and leave the other blank (advanced mode coming soon)."
    }],
    howTo: [{
      title: "Upload video",
      text: "Choose a file."
    }, {
      title: "Enter new dimensions",
      text: "Set width and height."
    }, {
      title: "Download resized video",
      text: "Get the video at the new size."
    }],
    relatedTools: ["crop-video", "video-compressor", "video-cutter"]
  },
  {
    slug: "crop-video",
    name: "Crop Video",
    category: "video-utility",
    description: "Crop a region from a video.",
    metaTitle: "Crop Video – Cut Region Online Free | Dayront",
    metaDescription: "Crop MP4, WebM, MOV videos. Specify X, Y, width, height. Private.",
    icon: "🔲",
    type: "crop-video",
    outputFormat: "mp4",
    settings: [{
      name: "x",
      label: "X offset",
      type: "number",
      min: 0,
      default: 0
    }, {
      name: "y",
      label: "Y offset",
      type: "number",
      min: 0,
      default: 0
    }, {
      name: "w",
      label: "Width",
      type: "number",
      min: 1,
      default: 640
    }, {
      name: "h",
      label: "Height",
      type: "number",
      min: 1,
      default: 480
    }],
    faq: [],
    howTo: [{
      title: "Upload video",
      text: "Select a file."
    }, {
      title: "Set crop area",
      text: "Enter coordinates and size."
    }, {
      title: "Download cropped video",
      text: "Get the selected region."
    }],
    relatedTools: ["resize-video", "video-cutter", "video-compressor"]
  },
  {
    slug: "change-fps",
    name: "Change FPS",
    category: "video-utility",
    description: "Adjust video frame rate.",
    metaTitle: "Change FPS – Adjust Frame Rate Online Free | Dayront",
    metaDescription: "Change FPS of MP4, WebM, MOV videos. No upload, private.",
    icon: "⏱️",
    type: "change-fps",
    outputFormat: "mp4",
    settings: [{
      name: "fps",
      label: "New FPS",
      type: "number",
      min: 1,
      max: 60,
      default: 30
    }],
    faq: [],
    howTo: [{
      title: "Upload video",
      text: "Select a video."
    }, {
      title: "Choose new frame rate",
      text: "Enter FPS."
    }, {
      title: "Download video",
      text: "Get the video with the new frame rate."
    }],
    relatedTools: ["video-compressor", "speed-changer", "video-cutter"]
  },
  {
    slug: "mute-video",
    name: "Mute Video",
    category: "video-utility",
    description: "Remove audio from a video file.",
    metaTitle: "Mute Video – Remove Audio Online Free | Dayront",
    metaDescription: "Mute MP4, WebM, MOV videos. No upload, private.",
    icon: "🔇",
    type: "mute-video",
    outputFormat: "mp4",
    settings: [],
    faq: [],
    howTo: [{
      title: "Upload video",
      text: "Choose a video."
    }, {
      title: "Mute",
      text: "Click convert."
    }, {
      title: "Download silent video",
      text: "Get the video without audio."
    }],
    relatedTools: ["extract-audio", "video-compressor", "audio-cutter"]
  },
  {
    slug: "extract-audio",
    name: "Extract Audio",
    category: "video-utility",
    description: "Extract the audio stream from any video.",
    metaTitle: "Extract Audio – Get Sound from Video Online Free | Dayront",
    metaDescription: "Extract audio from MP4, WebM, MOV, etc. to MP3. Private.",
    icon: "🎧",
    type: "extract-audio",
    outputFormat: "mp3",
    settings: [{
      name: "format",
      label: "Output Format",
      type: "select",
      options: ["mp3", "wav", "m4a", "ogg", "flac", "aac"],
      default: "mp3"
    }],
    faq: [],
    howTo: [{
      title: "Upload video",
      text: "Select a video."
    }, {
      title: "Choose output format",
      text: "Pick MP3, WAV, etc."
    }, {
      title: "Download audio",
      text: "Get the extracted audio."
    }],
    relatedTools: ["mp4-to-mp3", "mute-video", "audio-cutter"]
  }
];

const SUPPORTED_LANGS = ["en", "es", "pt", "de", "fr", "ja"];
const DEFAULT_LANG = "en";
function getLangFromAstroUrl(url) {
  const params = new URLSearchParams(url.search);
  const lang = params.get("lang");
  return lang && SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}
async function loadTranslations(lang, namespace, origin) {
  const baseUrl = origin ?? "";
  try {
    const res = await fetch(`${baseUrl}/locales/${lang}/${namespace}.json`);
    if (res.ok) return res.json();
  } catch {
  }
  try {
    const res = await fetch(`${baseUrl}/locales/en/${namespace}.json`);
    if (res.ok) return res.json();
  } catch {
  }
  return {};
}
async function useTranslations(lang, origin) {
  const pages = await loadTranslations(lang, "pages", origin);
  const common = await loadTranslations(lang, "common", origin);
  const t = (key, fallback) => {
    const keys = key.split(".");
    let val = pages;
    for (const k of keys) {
      if (val && typeof val === "object") val = val[k];
      else return fallback;
    }
    return typeof val === "string" ? val : fallback;
  };
  const tc = (key, fallback) => common[key] || fallback;
  return {
    t,
    tc,
    lang,
    pages,
    common
  };
}

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://dayront.com");
const $$BaseLayout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title, description, ogImage, canonicalURL } = Astro2.props;
  const lang = getLangFromAstroUrl(Astro2.url);
  const { t: layoutT, tc: layoutTC } = await useTranslations(lang, Astro2.url.origin);
  let blogItems = [];
  try {
    const blogPosts = await getCollection("blog");
    blogItems = blogPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      url: `/blog/${post.id.replace(/\.mdx$/, "").replace(/^en\//, "")}`,
      type: "blog",
      icon: "\u{1F4DD}"
    }));
  } catch {
    blogItems = [];
  }
  const toolItems = tools.map((tool) => ({
    title: tool.name,
    description: tool.description,
    url: tool.from && tool.to ? `/convert/${tool.slug}` : `/tools/${tool.slug}`,
    type: "tool",
    icon: tool.icon
  }));
  const allSearchItems = [...toolItems, ...blogItems];
  return renderTemplate(_a || (_a = __template(["<html", ' style="color-scheme: light dark;"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">', `<script>
      (() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = (e) => {
          document.documentElement.classList.toggle('dark', e.matches);
        };
        apply(mq);
        mq.addEventListener('change', apply);
      })();
    <\/script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#38bdf8"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="Dayront"><!-- ----------------------------------------------------
         Auto\u2011append ?lang= to all internal links
    ----------------------------------------------------- --><script>
      (() => {
        const url = new URL(window.location.href);
        const lang = url.searchParams.get('lang');
        if (!lang) return;

        // We'll mutate all internal links to include the lang param
        document.addEventListener('astro:page-load', () => {
          document.querySelectorAll('a[href^="/"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href.includes('?')) {
              // already has query, just append
              link.href = href + '&lang=' + lang;
            } else {
              link.href = href + '?lang=' + lang;
            }
          });
        });
      })();
    <\/script>`, '</head> <body class="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-black dark:text-white antialiased transition-colors duration-200"> <!-- Pass current language to Header --> ', ' <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"> ', ' </div> <main class="flex-1"> ', " </main> ", " ", " ", ' <button id="pwa-install-btn" type="button" aria-label="Install Dayront" class="fixed bottom-20 right-4 z-50 bg-sky text-black font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-sky-bright transition-all duration-300 hidden items-center gap-2"> <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"></path> </svg>\nInstall Dayront\n</button> ', " ", " </body> </html>  ", ""])), addAttribute(lang, "lang"), renderComponent($$result, "SeoHead", $$SeoHead, { "title": title, "description": description, "ogImage": ogImage, "canonicalURL": canonicalURL }), renderHead(), renderComponent($$result, "Header", $$Header, { "lang": lang }), renderComponent($$result, "AdSlot", $$AdSlot, { "position": "below-header", "class": "my-2" }), renderSlot($$result, $$slots["default"]), renderComponent($$result, "Footer", $$Footer, { "lang": lang }), renderComponent($$result, "AdSlot", $$AdSlot, { "position": "sticky-footer", "class": "fixed bottom-0 left-0 right-0 z-40" }), renderComponent($$result, "SearchModal", $$SearchModal, { "items": allSearchItems }), renderScript($$result, "/home/dayront/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts"), renderScript($$result, "/home/dayront/src/layouts/BaseLayout.astro?astro&type=script&index=1&lang.ts"), renderScript($$result, "/home/dayront/src/layouts/BaseLayout.astro?astro&type=script&index=2&lang.ts"));
}, "/home/dayront/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $, $$AdSlot as a, getLangFromAstroUrl as g, tools as t };
