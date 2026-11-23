import { getCachedProjectBySlug, getCachedPublicProjects } from './_lib/edgeCache.ts';
import { resolveFirestoreConfig } from './_lib/firestore.ts';
import { injectRouteSeoIntoHtml, type InitialCivicData } from './_lib/seoHtml.ts';
import type { PagesContext } from './_lib/types.ts';

const STATIC_EXT_PATTERN = /\.(?:js|mjs|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|json|xml|txt|webmanifest|map)$/i;

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env, next, waitUntil } = context;

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

  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const config = resolveFirestoreConfig(env);
  let project = null;
  const initialData: InitialCivicData = {};

  if (normalizedPath === '/' || normalizedPath === '/projects') {
    try {
      initialData.projects = await getCachedPublicProjects(request, config, waitUntil, 60, 200);
    } catch {
      // Fall back to client fetch if edge Firestore call transiently fails
    }
  } else if (normalizedPath.startsWith('/projects/')) {
    const slug = decodeURIComponent(normalizedPath.slice('/projects/'.length));
    if (slug && !slug.includes('/')) {
      try {
        project = await getCachedProjectBySlug(request, slug, config, waitUntil, 60);
        if (project) {
          initialData.project = project;
        }
      } catch {
        project = null;
      }
    }
  }

  const originalHtml = await response.text();
  const updatedHtml = injectRouteSeoIntoHtml(originalHtml, pathname, project, initialData);
  headers.delete('content-length');

  return new Response(updatedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
