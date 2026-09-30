// middleware.ts — Vercel Edge Middleware
// Runs before redirects, rewrites, and static files.
//
// Purpose: serve /download on the subdomain while keeping the URL clean.
// Result:  download.dayront.com   → shows /download, URL stays as-is
//          download.dayront.com/x → shows /download, URL stays as-is

import { next, rewrite } from '@vercel/edge';

export const config = {
  // Match everything EXCEPT static assets so they load normally
  matcher: [
    '/((?!_astro|ai-models|ffmpeg|icons|favicon|robots|sitemap|manifest|sw\\.js|_vercel).*)',
  ],
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';

  // Only act on the download subdomain
  const isDownloadHost =
    host === 'download.dayront.com' ||
    host === 'www.download.dayront.com';

  if (!isDownloadHost) {
    return next();
  }

  // Already on /download — don't loop
  if (url.pathname === '/download' || url.pathname.startsWith('/download/')) {
    return next();
  }

  // Rewrite silently to /download (URL bar stays clean)
  return rewrite(new URL('/download', url));
}