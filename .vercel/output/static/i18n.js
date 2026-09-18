// dayront/public/i18n.js
(async function () {
  // 1. Detect language from the URL path first (e.g., /blog/es/...)
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const supportedLocales = ['en', 'es', 'pt', 'de', 'fr', 'ja'];
  let lang = pathSegments[0] || 'en'; // Default to 'en' if no path segment

  // 2. Handle legacy '?lang=' links (only if user clicks an old URL)
  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang');
  if (queryLang && supportedLocales.includes(queryLang)) {
    lang = queryLang;
    // Redirect legacy /?lang=es to the new static URL /es/
    const newPath = `/${lang}${window.location.pathname}`;
    window.location.replace(newPath); 
    return; // Stop running here, we are redirecting
  }

  // 3. Ensure the detected language is supported, otherwise fallback to 'en'
  if (!supportedLocales.includes(lang)) {
    lang = 'en';
  }

  // 4. Remember the language for future visits
  localStorage.setItem('dayront-lang', lang);

  // 5. Update the language switcher links (if you have a dropdown)
  document.querySelectorAll('[data-lang-link]').forEach(el => {
    const targetLang = el.getAttribute('data-lang-link');
    // Update the href to point to the new static path
    el.setAttribute('href', `/${targetLang}${window.location.pathname.replace(/^\/[a-z]{2}/, '')}`);
  });

  // NOTE: We removed the fetch() and textContent replacement loop.
  // Your Astro server will now serve the correct static HTML for the `/en/` route,
  // so client-side translation is no longer needed and was blocking Pinterest's bot.
})();