/* empty css                                  */
import { c as createAstro, a as createComponent, r as renderComponent, b as renderTemplate, m as maybeRenderHead, u as unescapeHTML } from '../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { g as getLangFromAstroUrl, $ as $$BaseLayout } from '../chunks/BaseLayout_m8T0OSWF.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://dayront.com");
const $$Terms = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Terms;
  const lang = getLangFromAstroUrl(Astro2.url);
  let pages = {};
  try {
    const res = await fetch(
      new URL(`/locales/${lang}/pages.json`, Astro2.url.origin)
    );
    if (res.ok) pages = await res.json();
  } catch {
  }
  function t(key, fallback) {
    const keys = key.split(".");
    let val = pages;
    for (const k of keys) {
      if (val && typeof val === "object") val = val[k];
      else return fallback;
    }
    return typeof val === "string" ? val : fallback;
  }
  const term = (key, fallback) => t(`terms.${key}`, fallback);
  const sections = pages.terms?.sections || [
    {
      title: "1. Introduction",
      body: [
        "Welcome to Dayront. By accessing or using our website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use Dayront.",
        "Dayront provides browser\u2011based media conversion and editing tools. The core principle of our service is that all file processing happens locally on your device \u2014 we do not have access to your files, nor do we store them on any server."
      ]
    },
    {
      title: "2. Description of Service",
      body: [
        "Dayront offers free online tools for audio and video processing, including but not limited to:",
        "<ul><li>Format conversion (MP4 to MP3, MP3 to WAV, and many others)</li><li>Audio editing (cutting, merging, compressing, volume boosting)</li><li>Audio effects (speed change, reversing, stereo to mono)</li></ul>",
        "All processing is performed locally in your browser. No files are uploaded to our servers. The website serves only static assets \u2014 HTML, CSS, JavaScript, and the necessary processing engine that runs entirely on your device."
      ]
    },
    {
      title: "3. User Responsibilities",
      body: [
        "By using Dayront, you agree that:",
        "<ul><li>You are solely responsible for the files you process through our tools.</li><li>You will not use Dayront for any illegal, harmful, or unauthorized purpose.</li><li>You will not attempt to bypass or disable any security features of the website.</li><li>You have the necessary rights to process the files you use with our tools \u2014 including intellectual property rights, privacy rights, and any applicable consent.</li><li>You will not use Dayront to process content that is defamatory, obscene, harassing, or otherwise violates applicable laws.</li></ul>",
        "Because we never see or access your files, we cannot monitor what you process. However, we reserve the right to block access to our service from any IP address or region if we become aware of misuse."
      ]
    },
    {
      title: "4. Intellectual Property",
      body: [
        "The Dayront name, logo, website design, and original code are owned by Dayront and are protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works from our website or branding without explicit written permission.",
        "Your files remain your property. Dayront claims no ownership over any content you process through our tools. Since processing is entirely local, we never have access to your files in the first place."
      ]
    },
    {
      title: "5. Third\u2011Party Services",
      body: [
        "Dayront may display advertisements from third\u2011party networks. These networks may use cookies or similar technologies to serve relevant ads. We do not share any file data or personal information with advertisers \u2014 we don't have any to share.",
        "Our website may contain links to external sites that are not operated by us. We have no control over the content or practices of those sites and assume no responsibility for them."
      ]
    },
    {
      title: "6. Disclaimer of Warranties",
      body: [
        'Dayront is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding:',
        "<ul><li>The accuracy, reliability, or completeness of our tools</li><li>That the service will be uninterrupted, timely, secure, or error\u2011free</li><li>That any errors in the software will be corrected</li><li>That the results obtained from using our tools will meet your expectations</li></ul>",
        "We strive to provide high\u2011quality tools, but technology is imperfect. Use Dayront at your own discretion."
      ]
    },
    {
      title: "7. Limitation of Liability",
      body: [
        "To the fullest extent permitted by applicable law, Dayront and its team members shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:",
        "<ul><li>Your use or inability to use the service</li><li>Any errors or omissions in the service's operation</li><li>Any loss or damage to files processed through our tools</li><li>Any unauthorized access to or use of our servers \u2014 though we note again that your files never reach our servers</li></ul>",
        "Since Dayront processes files locally on your device and does not store them, the risk of file loss or damage is inherently limited to your own device's capabilities."
      ]
    },
    {
      title: "8. Changes to These Terms",
      body: [
        'We reserve the right to modify or replace these Terms of Service at any time. When we make significant changes, we will update the "Last updated" date at the top of this page and, where appropriate, notify users through a notice on our website.',
        "By continuing to use Dayront after changes are posted, you agree to be bound by the revised terms. We encourage you to review these terms periodically."
      ]
    },
    {
      title: "9. Governing Law",
      body: [
        "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Dayront operates, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved through good\u2011faith negotiation before any formal legal action."
      ]
    },
    {
      title: "10. Contact Us",
      body: [
        "If you have any questions about these Terms of Service, please contact us at:",
        '<strong>Email:</strong> <a href="mailto:legal@dayront.com" class="text-sky hover:underline">legal@dayront.com</a>',
        "We aim to respond to all inquiries within 48 hours."
      ]
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "lang": lang, "title": term("metaTitle", "Terms of Service \u2013 Dayront"), "description": term("metaDescription", "Terms of service for using Dayront's free online media tools.") }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="max-w-3xl mx-auto px-4 py-16 bg-white dark:bg-gray-950"> <div class="mb-12"> <h1 class="text-4xl sm:text-5xl font-extrabold text-black dark:text-white mb-3"> ${term("heading", "Terms of Service")} </h1> <p class="text-gray-500 dark:text-gray-400"> ${term("lastUpdated", "Last updated: January 1, 2025")} </p> </div> <div class="space-y-10"> ${sections.map((section) => renderTemplate`<div> <h2 class="text-2xl font-bold text-black dark:text-white mb-3"> ${section.title} </h2> ${Array.isArray(section.body) ? section.body.map((para) => renderTemplate`<p class="text-gray-700 dark:text-white leading-relaxed mt-2">${unescapeHTML(para)}</p>`) : renderTemplate`<p class="text-gray-700 dark:text-white leading-relaxed">${unescapeHTML(section.body)}</p>`} </div>`)} </div> </section> ` })}`;
}, "/home/dayront/src/pages/terms.astro", void 0);

const $$file = "/home/dayront/src/pages/terms.astro";
const $$url = "/terms";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Terms,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
