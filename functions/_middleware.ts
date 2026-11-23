import { getProjectBySlug, resolveFirestoreConfig } from './_lib/firestore.ts';
import { injectRouteSeoIntoHtml } from './_lib/seoHtml.ts';
import type { PagesContext } from './_lib/types.ts';

const STATIC_EXT_PATTERN = /\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|json|xml|txt|webmanifest|map)$/i;

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env, next } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }

  const url = new URL(request.url);
  const { pathname } = url;

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    STATIC_EXT_PATTERN.test(pathname)
  ) {
    return next();
  }

  const response = await next();
  if (response.status >= 300 && response.status < 400) {
    return response;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  if (pathname === '/manage' || pathname.startsWith('/manage/')) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  let project = null;
  if (pathname.startsWith('/projects/')) {
    const slug = decodeURIComponent(pathname.slice('/projects/'.length).replace(/\/+$/, ''));
    if (slug && !slug.includes('/')) {
      try {
        const config = resolveFirestoreConfig(env);
        project = await getProjectBySlug(slug, config);
      } catch {
        project = null;
      }
    }
  }

  const originalHtml = await response.text();
  const updatedHtml = injectRouteSeoIntoHtml(originalHtml, pathname, project);
  headers.delete('content-length');

  return new Response(updatedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
