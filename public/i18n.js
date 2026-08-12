(async function () {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || localStorage.getItem('dayront-lang') || 'en';
  if (lang === 'en') return;

  const [pagesRes, commonRes] = await Promise.all([
    fetch(`/locales/${lang}/pages.json`),
    fetch(`/locales/${lang}/common.json`),
  ]);
  const pages = await pagesRes.json();
  const common = await commonRes.json();
  const translations = { ...pages, ...common };

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) el.textContent = translations[key];
  });

  // handle attributes if needed
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[key]) el.setAttribute('placeholder', translations[key]);
  });
})();