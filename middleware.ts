// middleware.ts — Vercel Edge Middleware
// Runs before redirects, rewrites, and static files.
//
// Purpose: serve /download on the subdomain while keeping the URL clean.
// Canonical URL: download.dayront.com
// - download.dayront.com          → shows /download, URL stays clean
// - download.dayront.com/anything → shows /download, URL stays as-is
// - download.dayront.com/download → redirects to download.dayront.com/

import { next, rewrite } from '@vercel/edge';

export const config = {
  matcher: [
    '/((?!_astro|ai-models|ffmpeg|icons|favicon|robots|sitemap|manifest|sw\\.js|_vercel).*)',
  ],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';

  const isDownloadHost =
    host === 'download.dayront.com' ||
    host === 'www.download.dayront.com';

  if (!isDownloadHost) {
    return next();
  }

  // Canonicalize: /download on the subdomain → /
  if (url.pathname === '/download' || url.pathname === '/download/') {
    return Response.redirect(`${url.origin}/`, 308);
  }

  // Silent rewrite to /download (URL bar stays clean)
  return rewrite(new URL('/download', url));
}