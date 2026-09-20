/* --------------------------------------------------------------------------
   AD CAMPAIGNS
   
   Two types of ads:
   1. IMAGE ADS (external paid advertisers) — require `image`
   2. PROMO ADS (Dayront internal self-promo) — use text fields instead
   
   Multiple ads in the same position rotate automatically as a slideshow.
-------------------------------------------------------------------------- */

export type AdPosition = 'below-header' | 'below-tool' | 'in-content' | 'sticky-footer';

export interface AdCampaign {
  /** Unique ID — used for click tracking */
  id: string;
  /** Which slot this ad appears in */
  position: AdPosition;
  /** Advertiser name (shown in analytics) */
  advertiser: string;
  /** Alt text for accessibility & SEO */
  alt: string;
  /** Where the ad links to (include UTM params for external) */
  href: string;
  /** Start showing on this date (YYYY-MM-DD) */
  startsAt: string;
  /** Stop showing after this date (YYYY-MM-DD) */
  endsAt: string;
  /** ★ Seconds to display before rotating to the next ad. Defaults to 6. */
  duration?: number;
  /** Small label overlay (e.g., "Sponsored", "Promoted"). Optional. */
  label?: string;

  // ─── IMAGE MODE (external paid ads) ───
  /** Path to the image inside /public. */
  image?: string;

  // ─── PROMO MODE (Dayront internal ads) ───
  /** Set true for Dayront self-promo (renders text instead of image) */
  isDayront?: boolean;
  /** Big line of text for promo ads */
  title?: string;
  /** Smaller subtext for promo ads */
  subtitle?: string;
  /** CTA button text (defaults to "Learn more") */
  ctaText?: string;
  /** Optional emoji shown next to the title */
  emoji?: string;
}

/* --------------------------------------------------------------------------
   RECOMMENDED IMAGE SIZES (2x for retina)
   - below-header  : 1200 × 120  (aspect ratio ~10:1)
   - below-tool    : 1200 × 240  (aspect ratio ~5:1)
   - in-content    : 1200 × 560  (aspect ratio ~2.1:1)
   - sticky-footer : 1200 × 180  (aspect ratio ~6.7:1)
   
   Save as JPEG, ~80% quality. Keep file size under 200KB.
-------------------------------------------------------------------------- */

export const activeAds: AdCampaign[] = [
  /* ─────────────────────────────────────────────────────
     DAYRONT SELF-PROMO ADS (always ready, no images needed)
     These rotate automatically when no paid ads are active.
     To pause a promo, change `endsAt` to a past date.
  ───────────────────────────────────────────────────── */

  // ─── Below Header ───
  {
    id: 'dayront-hero-tools',
    position: 'below-header',
    advertiser: 'Dayront',
    isDayront: true,
    emoji: '🛠️',
    title: 'Explore all 40+ free tools',
    subtitle: 'Audio, video, and AI — all in your browser',
    ctaText: 'Browse tools',
    href: '/tools',
    alt: 'Explore all Dayront tools',
    label: 'From Dayront',
    duration: 6,
    startsAt: '2024-01-01',
    endsAt: '2099-12-31',
  },
  {
    id: 'dayront-hero-ai',
    position: 'below-header',
    advertiser: 'Dayront',
    isDayront: true,
    emoji: '✨',
    title: 'New: AI Video Captions',
    subtitle: 'Auto-generate subtitles in seconds',
    ctaText: 'Try it free',
    href: '/tools/ai-video-captions',
    alt: 'Try AI Video Captions',
    label: 'From Dayront',
    duration: 6,
    startsAt: '2024-01-01',
    endsAt: '2099-12-31',
  },

  // ─── Below Tool ───
  {
    id: 'dayront-tool-blog',
    position: 'below-tool',
    advertiser: 'Dayront',
    isDayront: true,
    emoji: '📚',
    title: 'Deep-dive guides for creators',
    subtitle: 'Workflows, tips, and privacy-first how-tos',
    ctaText: 'Read the blog',
    href: '/blog/en',
    alt: 'Read the Dayront blog',
    label: 'From Dayront',
    duration: 7,
    startsAt: '2024-01-01',
    endsAt: '2099-12-31',
  },
  {
    id: 'dayront-tool-resolution',
    position: 'below-tool',
    advertiser: 'Dayront',
    isDayront: true,
    emoji: '📺',
    title: 'Convert to any resolution',
    subtitle: '480p, 720p, 1080p, 2K, 4K, and 8K',
    ctaText: 'See resolutions',
    href: '/tools/resize-video',
    alt: 'Convert video resolutions',
    label: 'From Dayront',
    duration: 7,
    startsAt: '2024-01-01',
    endsAt: '2099-12-31',
  },

  // ─── In Content ───
  {
    id: 'dayront-content-advertise',
    position: 'in-content',
    advertiser: 'Dayront',
    isDayront: true,
    emoji: '📣',
    title: 'Want to advertise here?',
    subtitle: 'Reach creators who care about their craft',
    ctaText: 'See ad placements',
    href: '/advertise',
    alt: 'Advertise on Dayront',
    label: 'Promotion',
    duration: 8,
    startsAt: '2024-01-01',
    endsAt: '2099-12-31',
  },

  // ─── Sticky Footer ───
  {
    id: 'dayront-footer-advertise',
    position: 'sticky-footer',
    advertiser: 'Dayront',
    isDayront: true,
    emoji: '📣',
    title: 'Advertise with us',
    subtitle: 'Reach creators on every page',
    ctaText: 'Learn more',
    href: '/advertise',
    alt: 'Advertise on Dayront',
    label: 'Promo',
    duration: 5,
    startsAt: '2024-01-01',
    endsAt: '2099-12-31',
  },
  {
    id: 'dayront-footer-ai',
    position: 'sticky-footer',
    advertiser: 'Dayront',
    isDayront: true,
    emoji: '✨',
    title: 'AI captions — free',
    subtitle: 'Auto subtitles in your browser',
    ctaText: 'Try it',
    href: '/tools/ai-video-captions',
    alt: 'Try AI Video Captions',
    label: 'From Dayront',
    duration: 5,
    startsAt: '2024-01-01',
    endsAt: '2099-12-31',
  },

  /* ─────────────────────────────────────────────────────
     EXTERNAL PAID AD EXAMPLE
     Uncomment & edit when you get your first paying client.
  ───────────────────────────────────────────────────── */
  //
  // {
  //   id: 'acme-2025-11',
  //   position: 'below-tool',
  //   advertiser: 'Acme Video Suite',
  //   image: '/ads/acme-video-suite.jpg',
  //   alt: 'Acme Video Suite — Pro editing, browser-native',
  //   href: 'https://acme.com/?utm_source=dayront&utm_medium=display&utm_campaign=below-tool-2025-11',
  //   label: 'Sponsored',
  //   duration: 8,
  //   startsAt: '2025-11-01',
  //   endsAt: '2025-11-30',
  // },
];

/* --------------------------------------------------------------------------
   HELPERS
-------------------------------------------------------------------------- */

/**
 * Returns ALL active campaigns for a given position.
 * Sorted by duration desc so longer-value ads appear first.
 */
export function getActiveAds(position: AdPosition): AdCampaign[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return activeAds
    .filter((ad) => {
      if (ad.position !== position) return false;
      const start = new Date(ad.startsAt);
      const end = new Date(ad.endsAt);
      end.setHours(23, 59, 59, 999);
      return now >= start && now <= end;
    })
    .sort((a, b) => (b.duration ?? 6) - (a.duration ?? 6));
}

/** Returns only Dayront internal promo ads for a position. */
export function getDayrontAds(position: AdPosition): AdCampaign[] {
  return getActiveAds(position).filter((ad) => ad.isDayront);
}

/** Returns only external paid ads for a position. */
export function getPaidAds(position: AdPosition): AdCampaign[] {
  return getActiveAds(position).filter((ad) => !ad.isDayront);
}