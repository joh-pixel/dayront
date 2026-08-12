import '../../chunks/page-ssr_B6YcU95I.mjs';
import { c as createAstro, a as createComponent } from '../../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://dayront.com");
const $$ = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  const { path } = Astro2.params;
  const supportedLangs = ["en", "es", "pt", "de", "fr", "ja"];
  const segments = path ? path.split("/").filter(Boolean) : [];
  let redirectTo = "/?lang=en";
  if (segments.length >= 2 && segments[0] === "blog" && supportedLangs.includes(segments[1])) {
    const lang = segments[1];
    const rest = segments.slice(2).join("/");
    redirectTo = rest ? `/blog/${rest}?lang=${lang}` : `/blog?lang=${lang}`;
  } else if (segments.length >= 1 && supportedLangs.includes(segments[0])) {
    const lang = segments[0];
    const rest = segments.slice(1).join("/");
    redirectTo = rest ? `/${rest}?lang=${lang}` : `/?lang=${lang}`;
  }
  console.log("Redirecting to:", redirectTo);
  return Astro2.redirect(redirectTo, 302);
}, "/home/dayront/src/pages/[locale]/[...path].astro", void 0);

const $$file = "/home/dayront/src/pages/[locale]/[...path].astro";
const $$url = "/[locale]/[...path]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
