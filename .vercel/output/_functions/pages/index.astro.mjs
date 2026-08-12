/* empty css                                  */
import { c as createAstro, a as createComponent, r as renderComponent, e as renderScript, b as renderTemplate, m as maybeRenderHead, d as addAttribute } from '../chunks/astro/server_CayxtmO5.mjs';
import 'piccolore';
import { g as getLangFromAstroUrl, $ as $$BaseLayout, t as tools } from '../chunks/BaseLayout_m8T0OSWF.mjs';
/* empty css                                 */
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://dayront.com");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const lang = getLangFromAstroUrl(Astro2.url);
  let pages = {};
  let common = {};
  try {
    const [pagesRes, commonRes] = await Promise.all([
      fetch(new URL(`/locales/${lang}/pages.json`, Astro2.url.origin)),
      fetch(new URL(`/locales/${lang}/common.json`, Astro2.url.origin))
    ]);
    if (pagesRes.ok) pages = await pagesRes.json();
    if (commonRes.ok) common = await commonRes.json();
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
  const tc = (key, fallback) => common[key] || fallback;
  const toolCount = tools.length;
  const stats = [
    { value: toolCount, suffix: "+", label: "Media Tools", icon: "\u{1F6E0}\uFE0F" },
    { value: 0, suffix: "", label: "Required Uploads", icon: "\u2601\uFE0F" },
    { value: 100, suffix: "%", label: "Browser Processing", icon: "\u{1F510}" },
    { value: 24, suffix: "/7", label: "Available", icon: "\u26A1" }
  ];
  const features = [
    {
      icon: "\u{1F510}",
      title: "Private by Design",
      description: "For supported tools, processing happens directly inside your browser. Your working files do not need to be sent to a conversion server.",
      link: "/privacy"
    },
    {
      icon: "\u26A1",
      title: "Fast Local Processing",
      description: "Modern browser technologies and WebAssembly make it possible to process many media tasks without waiting for a remote upload.",
      link: "/tools"
    },
    {
      icon: "\u{1F4F1}",
      title: "Works on Your Devices",
      description: "Use Dayront on phones, tablets, laptops and desktops with a responsive interface designed for real-world use.",
      link: "/tools"
    },
    {
      icon: "\u{1F193}",
      title: "Free to Start",
      description: "Choose a tool, select your file and get started without creating an account or entering payment information.",
      link: "/tools"
    },
    {
      icon: "\u{1F30D}",
      title: "Built for Everyone",
      description: "Simple controls, clear instructions and a lightweight interface make media conversion easier for beginners and experienced creators.",
      link: "/about"
    },
    {
      icon: "\u2728",
      title: "No Clutter",
      description: "No complicated dashboard. Pick a tool, upload a file locally, adjust what you need and download the result.",
      link: "/tools"
    }
  ];
  const popularTools = [
    {
      name: "MP4 to MP3",
      url: "/convert/mp4-to-mp3",
      icon: "\u{1F3AC}",
      desc: "Extract audio",
      category: "Video"
    },
    {
      name: "Audio Cutter",
      url: "/tools/audio-cutter",
      icon: "\u2702\uFE0F",
      desc: "Trim audio",
      category: "Audio"
    },
    {
      name: "MP3 to WAV",
      url: "/convert/mp3-to-wav",
      icon: "\u{1F3B5}",
      desc: "Change format",
      category: "Audio"
    },
    {
      name: "Audio Merger",
      url: "/tools/audio-merger",
      icon: "\u{1F517}",
      desc: "Join tracks",
      category: "Audio"
    },
    {
      name: "Video Compressor",
      url: "/tools/video-compressor",
      icon: "\u{1F4E6}",
      desc: "Reduce size",
      category: "Video"
    },
    {
      name: "Video Cutter",
      url: "/tools/video-cutter",
      icon: "\u{1F39E}\uFE0F",
      desc: "Trim video",
      category: "Video"
    },
    {
      name: "GIF to Video",
      url: "/tools/gif-to-video",
      icon: "\u{1F504}",
      desc: "Convert GIFs",
      category: "Video"
    },
    {
      name: "Speed Changer",
      url: "/tools/speed-changer",
      icon: "\u23E9",
      desc: "Change speed",
      category: "Audio"
    }
  ];
  const testimonials = [
    {
      quote: "The biggest thing for me is not having to upload a private recording just to change its format.",
      name: "Sarah",
      role: "Video Editor",
      avatar: "S"
    },
    {
      quote: "I wanted something simple. Choose the file, choose the format and get the result. Dayront gets out of the way.",
      name: "Marcus",
      role: "Podcast Creator",
      avatar: "M"
    },
    {
      quote: "The interface feels much cleaner than most online converters. It is especially nice on my phone.",
      name: "Emma",
      role: "Content Creator",
      avatar: "E"
    }
  ];
  const faqs = [
    {
      q: "Does Dayront upload my files?",
      a: "Dayront is designed around browser-based processing for supported tools. When a tool performs local processing, your selected media stays on your device instead of being uploaded to a conversion server. The exact processing method can depend on the tool and browser."
    },
    {
      q: 'What does "browser processing" actually mean?',
      a: "It means the browser running Dayront performs the media operation on your device. Technologies such as WebAssembly allow complex media processing to run inside modern browsers instead of automatically sending the file to a remote server."
    },
    {
      q: "Can I use Dayront on Android?",
      a: "Yes. Dayront is designed to work with modern mobile browsers. For larger video files, performance depends on your phone hardware, available memory, browser capabilities and the complexity of the conversion."
    },
    {
      q: "Why can a large video take longer on my phone?",
      a: "Local processing uses your own device resources. A powerful desktop may process a large video faster than an entry-level phone. This is one of the trade-offs of keeping processing local rather than sending your file to a powerful remote server."
    },
    {
      q: "Do I need to install an application?",
      a: "No installation is required for the web tools. Open Dayront in a supported browser, select a tool and begin. Some advanced browser features may work differently depending on your device and browser."
    },
    {
      q: "What formats can I work with?",
      a: "The project currently includes converters and tools covering formats such as MP3, WAV, M4A, OGG, FLAC, AAC, AIFF, AMR, APE, MP4, MOV, MKV, AVI, WebM and FLV, along with editing utilities."
    },
    {
      q: "Can I convert MP4 to MP3?",
      a: "Yes. Use the MP4 to MP3 converter to extract the audio track from a compatible MP4 video. For the quickest start, use the dedicated converter from the Popular Tools section above."
    },
    {
      q: "Can I compress a video?",
      a: "Yes. Dayront includes a Video Compressor tool. Compression can reduce file size, although the final size and quality depend on the source video and the selected settings."
    },
    {
      q: "Can I cut audio without installing an editor?",
      a: "Yes. The Audio Cutter lets you work with an audio file directly from the browser. This is useful for trimming recordings, music clips, voice notes and other audio."
    },
    {
      q: "Does Dayront require an account?",
      a: "The core tools are designed to be usable without requiring an account. You can open a tool and begin working without going through a traditional registration flow."
    },
    {
      q: "Why should I use a local converter instead of an online upload converter?",
      a: "Local processing can reduce the need to transfer personal media to a third-party server. It can also eliminate upload and download waiting time. The trade-off is that processing performance depends on your own device."
    },
    {
      q: "Will every browser perform exactly the same?",
      a: "No. Browser support, available memory, CPU performance and WebAssembly capabilities can vary. If a large file is slow on one device, trying a modern desktop browser may provide better performance."
    }
  ];
  const workflow = [
    {
      number: "01",
      title: "Choose your tool",
      text: "Find the exact converter or editor you need from the media toolbox."
    },
    {
      number: "02",
      title: "Add your file",
      text: "Select or drag your media into the tool. Supported local tools process it in your browser."
    },
    {
      number: "03",
      title: "Adjust & process",
      text: "Choose your settings and let your device handle the media operation."
    },
    {
      number: "04",
      title: "Download",
      text: "Save the finished file directly to your device when processing is complete."
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "lang": lang, "title": tc("site_title", "Dayront \u2013 Free Media Tools, Private Browser Processing"), "description": tc("site_desc", "Convert, cut, merge, compress and edit audio and video with Dayront's browser-based media tools."), "data-astro-cid-j7pv25f6": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<section class="hero relative overflow-hidden" data-astro-cid-j7pv25f6> <div class="hero-grid" data-astro-cid-j7pv25f6></div> <div class="hero-glow hero-glow-one" data-astro-cid-j7pv25f6></div> <div class="hero-glow hero-glow-two" data-astro-cid-j7pv25f6></div> <div class="max-w-7xl mx-auto px-4 pt-16 sm:pt-20 lg:pt-28 pb-20 relative z-10" data-astro-cid-j7pv25f6> <div class="max-w-4xl mx-auto text-center" data-astro-cid-j7pv25f6> <div class="hero-pill reveal" data-astro-cid-j7pv25f6> <span class="status-dot" data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6>${t("home_private_media_processing_in_yo_80", `Private media processing in your browser`)}</span> <span class="pill-arrow" data-astro-cid-j7pv25f6>↗</span> </div> <h1 class="hero-title reveal reveal-delay-1" data-astro-cid-j7pv25f6>
Your media.
<br data-astro-cid-j7pv25f6> <span class="gradient-text" data-astro-cid-j7pv25f6>${t("home_your_device_81", `Your device.`)}</span> <br class="sm:hidden" data-astro-cid-j7pv25f6> <span class="hero-last" data-astro-cid-j7pv25f6>${t("home_your_control_82", `Your control.`)}</span> </h1> <p class="hero-description reveal reveal-delay-2" data-astro-cid-j7pv25f6>
Convert, cut, compress, merge and edit audio & video without
          turning every file into a trip to a remote server.
</p> <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 reveal reveal-delay-3" data-astro-cid-j7pv25f6> <a href="/tools" class="premium-button primary-button" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${t("home_explore_tools_83", `Explore Tools`)}</span> <span class="button-icon" data-astro-cid-j7pv25f6>→</span> </a> <a href="/blog" class="premium-button secondary-button" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${t("home_read_blog_84", `Read Blog`)}</span> <span class="button-icon" data-astro-cid-j7pv25f6>↗</span> </a> </div> <div class="hero-trust reveal reveal-delay-4" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6><span data-astro-cid-j7pv25f6>✓</span> No account required</div> <div data-astro-cid-j7pv25f6><span data-astro-cid-j7pv25f6>✓</span> Browser-first workflow</div> <div data-astro-cid-j7pv25f6><span data-astro-cid-j7pv25f6>✓</span> Mobile friendly</div> </div> </div> <!-- Premium visual demo --> <div class="hero-dashboard reveal reveal-delay-5" data-astro-cid-j7pv25f6> <div class="dashboard-top" data-astro-cid-j7pv25f6> <div class="window-dots" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> </div> <div class="dashboard-title" data-astro-cid-j7pv25f6>
Dayront <span data-astro-cid-j7pv25f6>/</span> Media Workspace
</div> <div class="live-indicator" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span>
LIVE
</div> </div> <div class="dashboard-body" data-astro-cid-j7pv25f6> <div class="workspace-sidebar" data-astro-cid-j7pv25f6> <div class="mini-brand" data-astro-cid-j7pv25f6>D</div> <div class="side-item active" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>⌂</span> <span data-astro-cid-j7pv25f6>Home</span> </div> <div class="side-item" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>♫</span> <span data-astro-cid-j7pv25f6>${t("home_audio_85", `Audio`)}</span> </div> <div class="side-item" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>▣</span> <span data-astro-cid-j7pv25f6>${t("home_video_86", `Video`)}</span> </div> <div class="side-item" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>⚙</span> <span data-astro-cid-j7pv25f6>${t("home_tools_87", `Tools`)}</span> </div> </div> <div class="workspace-main" data-astro-cid-j7pv25f6> <div class="workspace-header" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <span class="eyebrow" data-astro-cid-j7pv25f6>${t("home_workspace_88", `WORKSPACE`)}</span> <h3 data-astro-cid-j7pv25f6>${t("home_mp4_to_mp3_89", `MP4 to MP3`)}</h3> </div> <span class="secure-chip" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>●</span> Local
</span> </div> <div class="file-card" data-astro-cid-j7pv25f6> <div class="file-preview" data-astro-cid-j7pv25f6> <div class="play-circle" data-astro-cid-j7pv25f6>▶</div> <div class="preview-bars" data-astro-cid-j7pv25f6> <i data-astro-cid-j7pv25f6></i><i data-astro-cid-j7pv25f6></i><i data-astro-cid-j7pv25f6></i><i data-astro-cid-j7pv25f6></i><i data-astro-cid-j7pv25f6></i><i data-astro-cid-j7pv25f6></i><i data-astro-cid-j7pv25f6></i> </div> </div> <div class="file-info" data-astro-cid-j7pv25f6> <strong data-astro-cid-j7pv25f6>my-video.mp4</strong> <span data-astro-cid-j7pv25f6>128.4 MB · 04:32</span> </div> <div class="file-status" data-astro-cid-j7pv25f6> <span class="check" data-astro-cid-j7pv25f6>✓</span>
Ready
</div> </div> <div class="dashboard-chart" data-astro-cid-j7pv25f6> <div class="chart-heading" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${t("home_processing_activity_90", `PROCESSING ACTIVITY`)}</span> <strong data-astro-cid-j7pv25f6>${t("home_local_performance_91", `Local performance`)}</strong> </div> <div class="chart-live" data-astro-cid-j7pv25f6> <i data-astro-cid-j7pv25f6></i>
Live
</div> </div> <div class="chart-area" data-astro-cid-j7pv25f6> <div class="chart-y" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>100</span> <span data-astro-cid-j7pv25f6>75</span> <span data-astro-cid-j7pv25f6>50</span> <span data-astro-cid-j7pv25f6>25</span> <span data-astro-cid-j7pv25f6>0</span> </div> <svg viewBox="0 0 700 190" preserveAspectRatio="none" class="activity-chart" data-astro-cid-j7pv25f6> <defs data-astro-cid-j7pv25f6> <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1" data-astro-cid-j7pv25f6> <stop offset="0%" stop-color="#38bdf8" stop-opacity=".35" data-astro-cid-j7pv25f6></stop> <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" data-astro-cid-j7pv25f6></stop> </linearGradient> </defs> <path class="chart-area-fill" d="M0 160 C35 145 45 125 78 135 C110 145 130 92 165 108 C198 123 215 72 250 87 C286 104 304 48 338 67 C370 84 389 34 424 53 C455 71 474 95 508 76 C542 57 564 87 595 65 C625 44 660 55 700 25 L700 190 L0 190 Z" data-astro-cid-j7pv25f6></path> <path class="chart-line" d="M0 160 C35 145 45 125 78 135 C110 145 130 92 165 108 C198 123 215 72 250 87 C286 104 304 48 338 67 C370 84 389 34 424 53 C455 71 474 95 508 76 C542 57 564 87 595 65 C625 44 660 55 700 25" data-astro-cid-j7pv25f6></path> <circle class="chart-dot" cx="700" cy="25" r="5" data-astro-cid-j7pv25f6></circle> </svg> </div> <div class="chart-labels" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>0s</span> <span data-astro-cid-j7pv25f6>10s</span> <span data-astro-cid-j7pv25f6>20s</span> <span data-astro-cid-j7pv25f6>30s</span> <span data-astro-cid-j7pv25f6>40s</span> <span data-astro-cid-j7pv25f6>50s</span> </div> </div> <div class="dashboard-bottom" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${t("home_output_92", `OUTPUT`)}</span> <strong data-astro-cid-j7pv25f6>${t("home_mp3_320_kbps_93", `MP3 \xB7 320 kbps`)}</strong> </div> <button type="button" class="fake-process" data-astro-cid-j7pv25f6>
Process file →
</button> </div> </div> </div> </div> </div> </section>  <section class="cli-section" data-astro-cid-j7pv25f6> <div class="max-w-5xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="cli-container reveal" data-astro-cid-j7pv25f6> <div class="cli-window" data-astro-cid-j7pv25f6> <div class="cli-window-bar" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span><span data-astro-cid-j7pv25f6></span><span data-astro-cid-j7pv25f6></span> <strong data-astro-cid-j7pv25f6>${t("home_dayront_cli_94", `Dayront CLI`)}</strong> </div> <div class="cli-body" data-astro-cid-j7pv25f6> <div class="cli-line" data-astro-cid-j7pv25f6> <span class="prompt" data-astro-cid-j7pv25f6>$</span> <span class="command typing-animation" id="cli-command" data-astro-cid-j7pv25f6></span> <span class="cursor" data-astro-cid-j7pv25f6>|</span> </div> <div class="cli-output" id="cli-output" data-astro-cid-j7pv25f6> <div class="progress-bar" data-astro-cid-j7pv25f6> <div class="progress-fill" data-astro-cid-j7pv25f6></div> </div> <span class="success" data-astro-cid-j7pv25f6>✔ Package installed successfully</span> </div> </div> </div> <div class="cli-copy" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_power_user_95", `POWER USER`)}</span> <h3 data-astro-cid-j7pv25f6>${t("home_install_the_cli_for_offline_wo_96", `Install the CLI for offline workflows`)}</h3> <p data-astro-cid-j7pv25f6>
Run conversions directly from your terminal. One command unlocks
            batch processing and scripting superpowers.
</p> <a href="/blog" class="text-link" data-astro-cid-j7pv25f6>${t("home_learn_more_about_the_cli_97", `Learn more about the CLI \u2192`)}</a> </div> </div> </div> </section>  <section class="stats-section" data-astro-cid-j7pv25f6> <div class="max-w-6xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="stats-card reveal" data-astro-cid-j7pv25f6> ${stats.map((stat) => renderTemplate`<div class="stat-item" data-astro-cid-j7pv25f6> <div class="stat-icon" data-astro-cid-j7pv25f6>${stat.icon}</div> <div data-astro-cid-j7pv25f6> <div class="stat-number"${addAttribute(stat.value, "data-counter")}${addAttribute(stat.suffix, "data-suffix")} data-astro-cid-j7pv25f6>
0
</div> <div class="stat-label" data-astro-cid-j7pv25f6>${stat.label}</div> </div> </div>`)} </div> </div> </section>  <section class="section" data-astro-cid-j7pv25f6> <div class="max-w-6xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="section-heading reveal" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_a_closer_look_98", `A closer look`)}</span> <h2 data-astro-cid-j7pv25f6>${t("home_see_what_happens_behind_the_in_99", `See what happens behind the interface.`)}</h2> <p data-astro-cid-j7pv25f6>
Dayront is designed to make media processing feel simple.
          Underneath that simplicity, your browser is doing the heavy lifting.
</p> </div> <div class="charts-grid" data-astro-cid-j7pv25f6> <div class="chart-card large reveal" data-astro-cid-j7pv25f6> <div class="chart-card-head" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <span class="chart-kicker" data-astro-cid-j7pv25f6>${t("home_processing_load_100", `PROCESSING LOAD`)}</span> <h3 data-astro-cid-j7pv25f6>${t("home_device_activity_101", `Device activity`)}</h3> </div> <div class="chart-value" data-astro-cid-j7pv25f6> <strong id="load-value" data-astro-cid-j7pv25f6>68%</strong> <span class="positive" data-astro-cid-j7pv25f6>● Active</span> </div> </div> <div class="big-live-chart" data-astro-cid-j7pv25f6> <div class="horizontal-lines" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> </div> <svg viewBox="0 0 900 260" preserveAspectRatio="none" data-astro-cid-j7pv25f6> <path id="live-area" d="M0 205 C40 195 55 170 90 184 C130 200 155 122 195 145 C235 166 255 98 300 121 C345 143 365 84 405 110 C450 140 470 65 510 91 C550 117 575 135 615 92 C655 48 690 96 730 72 C775 45 820 68 900 28 L900 260 L0 260 Z" data-astro-cid-j7pv25f6></path> <path id="live-line" d="M0 205 C40 195 55 170 90 184 C130 200 155 122 195 145 C235 166 255 98 300 121 C345 143 365 84 405 110 C450 140 470 65 510 91 C550 117 575 135 615 92 C655 48 690 96 730 72 C775 45 820 68 900 28" data-astro-cid-j7pv25f6></path> <circle id="live-dot" cx="900" cy="28" r="7" data-astro-cid-j7pv25f6></circle> </svg> <div class="chart-axis" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>10:00</span> <span data-astro-cid-j7pv25f6>10:10</span> <span data-astro-cid-j7pv25f6>10:20</span> <span data-astro-cid-j7pv25f6>10:30</span> <span data-astro-cid-j7pv25f6>10:40</span> <span data-astro-cid-j7pv25f6>Now</span> </div> </div> <div class="chart-footer" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6><i class="legend-dot" data-astro-cid-j7pv25f6></i> Browser processing</span> <span data-astro-cid-j7pv25f6>${t("home_updates_automatically_102", `Updates automatically`)}</span> </div> </div> <div class="chart-card reveal" data-astro-cid-j7pv25f6> <div class="chart-card-head" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <span class="chart-kicker" data-astro-cid-j7pv25f6>${t("home_workflow_103", `WORKFLOW`)}</span> <h3 data-astro-cid-j7pv25f6>${t("home_typical_session_104", `Typical session`)}</h3> </div> <span class="mini-live" data-astro-cid-j7pv25f6>LIVE</span> </div> <div class="donut-wrapper" data-astro-cid-j7pv25f6> <div class="donut" data-astro-cid-j7pv25f6> <div class="donut-center" data-astro-cid-j7pv25f6> <strong data-astro-cid-j7pv25f6>4</strong> <span data-astro-cid-j7pv25f6>steps</span> </div> </div> <div class="donut-list" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <i data-astro-cid-j7pv25f6></i> <span data-astro-cid-j7pv25f6>${t("home_select_file_105", `Select file`)}</span> <strong data-astro-cid-j7pv25f6>20%</strong> </div> <div data-astro-cid-j7pv25f6> <i data-astro-cid-j7pv25f6></i> <span data-astro-cid-j7pv25f6>${t("home_processing_106", `Processing`)}</span> <strong data-astro-cid-j7pv25f6>55%</strong> </div> <div data-astro-cid-j7pv25f6> <i data-astro-cid-j7pv25f6></i> <span data-astro-cid-j7pv25f6>${t("home_finishing_107", `Finishing`)}</span> <strong data-astro-cid-j7pv25f6>15%</strong> </div> <div data-astro-cid-j7pv25f6> <i data-astro-cid-j7pv25f6></i> <span data-astro-cid-j7pv25f6>${t("home_download_108", `Download`)}</span> <strong data-astro-cid-j7pv25f6>10%</strong> </div> </div> </div> </div> </div> </div> </section>  <section class="hint-section" data-astro-cid-j7pv25f6> <div class="max-w-6xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="hint-box reveal" data-astro-cid-j7pv25f6> <div class="hint-icon" data-astro-cid-j7pv25f6>✦</div> <div class="hint-content" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${t("home_smart_tip_109", `SMART TIP`)}</span> <h3 id="tip-title" data-astro-cid-j7pv25f6>${t("home_keep_large_files_comfortable_110", `Keep large files comfortable.`)}</h3> <p id="tip-text" data-astro-cid-j7pv25f6>
For large videos, close unnecessary browser tabs so your device has
            more memory available for processing.
</p> </div> <button id="next-tip" type="button"${addAttribute(t("home_show_another_tip_144", `Show another tip`), "aria-label")} data-astro-cid-j7pv25f6>
↻
</button> </div> </div> </section>  <section class="section tools-section" data-astro-cid-j7pv25f6> <div class="max-w-7xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="section-heading split-heading reveal" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_the_toolbox_111", `The toolbox`)}</span> <h2 data-astro-cid-j7pv25f6>${t("home_everything_you_need_for_everyd_112", `Everything you need for everyday media work.`)}</h2> </div> <a href="/tools" class="text-link" data-astro-cid-j7pv25f6>
Browse all tools →
</a> </div> <div class="tool-grid" data-astro-cid-j7pv25f6> ${popularTools.map((tool, index) => renderTemplate`<a${addAttribute(tool.url, "href")}${addAttribute(`premium-tool-card reveal reveal-delay-${Math.min(index + 1, 5)}`, "class")} data-astro-cid-j7pv25f6> <div class="tool-card-top" data-astro-cid-j7pv25f6> <span class="tool-icon" data-astro-cid-j7pv25f6>${tool.icon}</span> <span class="tool-category" data-astro-cid-j7pv25f6>${tool.category}</span> </div> <h3 data-astro-cid-j7pv25f6>${tool.name}</h3> <p data-astro-cid-j7pv25f6>${tool.desc}</p> <div class="tool-arrow" data-astro-cid-j7pv25f6>↗</div> </a>`)} </div> <div class="center-button reveal" data-astro-cid-j7pv25f6> <a href="/tools" class="premium-button secondary-button" data-astro-cid-j7pv25f6>
Explore the complete toolbox
<span data-astro-cid-j7pv25f6>→</span> </a> </div> </div> </section>  <section class="image-showcase" data-astro-cid-j7pv25f6> <div class="max-w-6xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="showcase-layout" data-astro-cid-j7pv25f6> <div class="showcase-text reveal" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_watch_learn_113", `WATCH & LEARN`)}</span> <h2 data-astro-cid-j7pv25f6>
Not sure where to start?
<span data-astro-cid-j7pv25f6>${t("home_see_it_in_action_114", `See it in action.`)}</span> </h2> <p data-astro-cid-j7pv25f6>
Learn the basic Dayront workflow before touching your files.
            Pick a tool, select your media, adjust the options and download
            the finished result.
</p> <div class="video-points" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>01</span> <strong data-astro-cid-j7pv25f6>${t("home_choose_a_converter_115", `Choose a converter`)}</strong> </div> <div data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>02</span> <strong data-astro-cid-j7pv25f6>${t("home_select_your_media_116", `Select your media`)}</strong> </div> <div data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>03</span> <strong data-astro-cid-j7pv25f6>${t("home_process_and_download_117", `Process and download`)}</strong> </div> </div> <a href="/blog" class="text-link" data-astro-cid-j7pv25f6>
Read the tutorials →
</a> </div> <div class="showcase-image reveal" data-astro-cid-j7pv25f6> <div class="image-mockup" data-astro-cid-j7pv25f6> <div class="mockup-toolbar" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span><span data-astro-cid-j7pv25f6></span><span data-astro-cid-j7pv25f6></span> <small data-astro-cid-j7pv25f6>${t("home_dayront_media_converter_118", `Dayront Media Converter`)}</small> </div> <div class="mockup-body" data-astro-cid-j7pv25f6> <div class="mockup-file" data-astro-cid-j7pv25f6> <span class="file-icon" data-astro-cid-j7pv25f6>🎬</span> <div data-astro-cid-j7pv25f6> <strong data-astro-cid-j7pv25f6>my-video.mp4</strong> <small data-astro-cid-j7pv25f6>128.4 MB · 04:32</small> </div> <span class="badge" data-astro-cid-j7pv25f6>${t("home_ready_119", `Ready`)}</span> </div> <div class="mockup-arrow" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>⟶</span> <span class="format-badge" data-astro-cid-j7pv25f6>MP4</span> <span class="format-badge output" data-astro-cid-j7pv25f6>MP3</span> </div> <div class="mockup-output" data-astro-cid-j7pv25f6> <span class="file-icon" data-astro-cid-j7pv25f6>🎵</span> <div data-astro-cid-j7pv25f6> <strong data-astro-cid-j7pv25f6>my-audio.mp3</strong> <small data-astro-cid-j7pv25f6>320 kbps</small> </div> <span class="badge done" data-astro-cid-j7pv25f6>✓</span> </div> </div> <div class="mockup-cta" data-astro-cid-j7pv25f6> <button disabled data-astro-cid-j7pv25f6>${t("home_processing_complete_120", `Processing complete`)}</button> </div> </div> </div> </div> </div> </section>  <section class="section" data-astro-cid-j7pv25f6> <div class="max-w-6xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="section-heading reveal" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_built_for_real_work_121", `BUILT FOR REAL WORK`)}</span> <h2 data-astro-cid-j7pv25f6>${t("home_a_workspace_that_stays_out_of__122", `A workspace that stays out of your way.`)}</h2> <p data-astro-cid-j7pv25f6>
Clean controls, readable information and visual feedback make it
          easier to understand what is happening to your file.
</p> </div> <div class="visual-grid" data-astro-cid-j7pv25f6> <div class="visual-card visual-large reveal" data-astro-cid-j7pv25f6> <div class="visual-image visual-editor" data-astro-cid-j7pv25f6> <div class="visual-toolbar" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <div data-astro-cid-j7pv25f6></div> </div> <div class="editor-stage" data-astro-cid-j7pv25f6> <div class="editor-video" data-astro-cid-j7pv25f6> <div class="editor-play" data-astro-cid-j7pv25f6>▶</div> </div> <div class="editor-timeline" data-astro-cid-j7pv25f6> <div class="timeline-line" data-astro-cid-j7pv25f6></div> <div class="timeline-track" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> <span data-astro-cid-j7pv25f6></span> </div> </div> </div> </div> <div class="visual-copy" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>01 / EDIT</span> <h3 data-astro-cid-j7pv25f6>${t("home_simple_editing_controls_123", `Simple editing controls`)}</h3> <p data-astro-cid-j7pv25f6>${t("home_trim_merge_reverse_and_adjust__124", `Trim, merge, reverse and adjust media without a complicated editor.`)}</p> </div> </div> <div class="visual-card reveal" data-astro-cid-j7pv25f6> <div class="visual-image visual-converter" data-astro-cid-j7pv25f6> <div class="converter-file" data-astro-cid-j7pv25f6>MP4</div> <div class="converter-arrow" data-astro-cid-j7pv25f6>→</div> <div class="converter-file output" data-astro-cid-j7pv25f6>MP3</div> </div> <div class="visual-copy" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>02 / CONVERT</span> <h3 data-astro-cid-j7pv25f6>${t("home_change_formats_quickly_125", `Change formats quickly`)}</h3> <p data-astro-cid-j7pv25f6>${t("home_use_dedicated_conversion_pages_126", `Use dedicated conversion pages for common media formats.`)}</p> </div> </div> <div class="visual-card reveal" data-astro-cid-j7pv25f6> <div class="visual-image visual-security" data-astro-cid-j7pv25f6> <div class="security-ring" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>✓</span> </div> <div class="security-lines" data-astro-cid-j7pv25f6> <i data-astro-cid-j7pv25f6></i> <i data-astro-cid-j7pv25f6></i> <i data-astro-cid-j7pv25f6></i> </div> </div> <div class="visual-copy" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>03 / PRIVACY</span> <h3 data-astro-cid-j7pv25f6>${t("home_know_what_happens_to_your_file_127", `Know what happens to your file`)}</h3> <p data-astro-cid-j7pv25f6>${t("home_clear_privacy_messaging_helps__128", `Clear privacy messaging helps you understand the processing workflow.`)}</p> </div> </div> </div> </div> </section>  <section class="soft-section" data-astro-cid-j7pv25f6> <div class="max-w-7xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="section-heading reveal" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_why_dayront_129", `WHY DAYRONT`)}</span> <h2 data-astro-cid-j7pv25f6>${t("home_designed_around_the_way_people_130", `Designed around the way people actually use tools.`)}</h2> </div> <div class="feature-grid" data-astro-cid-j7pv25f6> ${features.map((feature, index) => renderTemplate`<a${addAttribute(feature.link, "href")}${addAttribute(`feature-card reveal reveal-delay-${Math.min(index + 1, 5)}`, "class")} data-astro-cid-j7pv25f6> <div class="feature-icon" data-astro-cid-j7pv25f6>${feature.icon}</div> <div data-astro-cid-j7pv25f6> <h3 data-astro-cid-j7pv25f6>${feature.title}</h3> <p data-astro-cid-j7pv25f6>${feature.description}</p> </div> <span class="feature-link" data-astro-cid-j7pv25f6>${t("home_learn_more_131", `Learn more \u2192`)}</span> </a>`)} </div> </div> </section>  <section class="section" data-astro-cid-j7pv25f6> <div class="max-w-6xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="section-heading reveal" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_the_workflow_132", `THE WORKFLOW`)}</span> <h2 data-astro-cid-j7pv25f6>${t("home_four_steps_nothing_complicated_133", `Four steps. Nothing complicated.`)}</h2> </div> <div class="workflow" data-astro-cid-j7pv25f6> ${workflow.map((step, index) => renderTemplate`<div class="workflow-item reveal" data-astro-cid-j7pv25f6> <div class="workflow-number" data-astro-cid-j7pv25f6>${step.number}</div> <div class="workflow-content" data-astro-cid-j7pv25f6> <h3 data-astro-cid-j7pv25f6>${step.title}</h3> <p data-astro-cid-j7pv25f6>${step.text}</p> </div> ${index < workflow.length - 1 && renderTemplate`<div class="workflow-line" data-astro-cid-j7pv25f6></div>`} </div>`)} </div> </div> </section>  <section class="testimonial-section" data-astro-cid-j7pv25f6> <div class="max-w-6xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="section-heading reveal" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_from_people_who_use_it_134", `FROM PEOPLE WHO USE IT`)}</span> <h2 data-astro-cid-j7pv25f6>${t("home_less_friction_more_getting_thi_135", `Less friction. More getting things done.`)}</h2> </div> <div class="testimonial-grid" data-astro-cid-j7pv25f6> ${testimonials.map((testimonial) => renderTemplate`<article class="testimonial-card reveal" data-astro-cid-j7pv25f6> <div class="stars" data-astro-cid-j7pv25f6>★★★★★</div> <p class="testimonial-quote" data-astro-cid-j7pv25f6>
"${testimonial.quote}"
</p> <div class="testimonial-person" data-astro-cid-j7pv25f6> <div class="avatar" data-astro-cid-j7pv25f6>${testimonial.avatar}</div> <div data-astro-cid-j7pv25f6> <strong data-astro-cid-j7pv25f6>${testimonial.name}</strong> <span data-astro-cid-j7pv25f6>${testimonial.role}</span> </div> </div> </article>`)} </div> </div> </section>  <section class="section faq-section" data-astro-cid-j7pv25f6> <div class="max-w-4xl mx-auto px-4" data-astro-cid-j7pv25f6> <div class="section-heading reveal" data-astro-cid-j7pv25f6> <span class="section-kicker" data-astro-cid-j7pv25f6>${t("home_help_center_136", `HELP CENTER`)}</span> <h2 data-astro-cid-j7pv25f6>${t("home_questions_you_might_actually_h_137", `Questions you might actually have.`)}</h2> <p data-astro-cid-j7pv25f6>
From privacy and file formats to mobile performance, here are the
          practical answers before you start.
</p> </div> <div class="faq-list" data-astro-cid-j7pv25f6> ${faqs.map((faq, index) => renderTemplate`<details class="faq-item reveal"${addAttribute(index === 0, "open")} data-astro-cid-j7pv25f6> <summary data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>${faq.q}</span> <i data-astro-cid-j7pv25f6>+</i> </summary> <div class="faq-answer" data-astro-cid-j7pv25f6> <p data-astro-cid-j7pv25f6>${faq.a}</p> </div> </details>`)} </div> <div class="faq-bottom reveal" data-astro-cid-j7pv25f6> <div data-astro-cid-j7pv25f6> <strong data-astro-cid-j7pv25f6>${t("home_still_have_a_question_138", `Still have a question?`)}</strong> <span data-astro-cid-j7pv25f6>${t("home_explore_the_tools_and_guides_f_139", `Explore the tools and guides for more practical help.`)}</span> </div> <div class="flex flex-wrap gap-3" data-astro-cid-j7pv25f6> <a href="/tools" class="small-button primary" data-astro-cid-j7pv25f6>${t("home_browse_tools_140", `Browse tools`)}</a> <a href="/blog" class="small-button secondary" data-astro-cid-j7pv25f6>${t("home_read_guides_141", `Read guides`)}</a> </div> </div> </div> </section>  <section class="final-cta" data-astro-cid-j7pv25f6> <div class="cta-glow" data-astro-cid-j7pv25f6></div> <div class="max-w-5xl mx-auto px-4 relative z-10" data-astro-cid-j7pv25f6> <div class="cta-card reveal" data-astro-cid-j7pv25f6> <div class="cta-badge" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6></span>
Ready when you are
</div> <h2 data-astro-cid-j7pv25f6>
Stop fighting with
<span data-astro-cid-j7pv25f6>complicated media tools.</span> </h2> <p data-astro-cid-j7pv25f6>
Pick a tool and get your next conversion, edit or compression job
          started in seconds.
</p> <div class="flex flex-col sm:flex-row justify-center gap-3" data-astro-cid-j7pv25f6> <a href="/tools" class="premium-button primary-button" data-astro-cid-j7pv25f6>
Start using Dayront
<span data-astro-cid-j7pv25f6>→</span> </a> <a href="/about" class="premium-button secondary-button" data-astro-cid-j7pv25f6>
Learn about Dayront
</a> </div> <div class="cta-note" data-astro-cid-j7pv25f6> <span data-astro-cid-j7pv25f6>✓</span> No complicated setup
<span data-astro-cid-j7pv25f6>✓</span> Browser-first
<span data-astro-cid-j7pv25f6>✓</span> Mobile friendly
</div> </div> </div> </section>  <div id="privacy-toast" class="privacy-toast" data-astro-cid-j7pv25f6> <span class="toast-dot" data-astro-cid-j7pv25f6></span> <div data-astro-cid-j7pv25f6> <strong data-astro-cid-j7pv25f6>${t("home_browserfirst_processing_142", `Browser-first processing`)}</strong> <small data-astro-cid-j7pv25f6>${t("home_your_workflow_stays_close_to_y_143", `Your workflow stays close to your device.`)}</small> </div> </div> ` })}  ${renderScript($$result, "/home/dayront/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "/home/dayront/src/pages/index.astro", void 0);

const $$file = "/home/dayront/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
