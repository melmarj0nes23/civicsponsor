import type { ProjectRecord } from '../../src/types/project.ts';
import {
  getProjectBySlug,
  listPublicProjects,
  type FirestoreRestConfig,
} from './firestore.ts';

interface EdgeCacheLike {
  match(request: Request | string): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
  delete(request: Request | string): Promise<boolean>;
}

function getDefaultEdgeCache(): EdgeCacheLike | null {
  try {
    const maybeCaches = (globalThis as unknown as { caches?: { default?: EdgeCacheLike } }).caches;
    return maybeCaches?.default ?? null;
  } catch {
    return null;
  }
}

function buildCacheKey(request: Request, path: string): Request | null {
  try {
    const origin = new URL(request.url).origin;
    return new Request(`${origin}${path}`, { method: 'GET' });
  } catch {
    return null;
  }
}

function scheduleBackground(
  promise: Promise<unknown>,
  waitUntil?: (promise: Promise<unknown>) => void,
): void {
  const safePromise = promise.catch(() => undefined);
  if (typeof waitUntil === 'function') {
    waitUntil(safePromise);
  }
}

async function readOrPopulateCache<T>(
  request: Request,
  cachePath: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<T> {
  const cache = getDefaultEdgeCache();
  const cacheKey = cache ? buildCacheKey(request, cachePath) : null;

  if (cache && cacheKey) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        return (await hit.json()) as T;
      }
    } catch {
      // Fall through to live Firestore fetch on cache miss/error
    }
  }

  const freshData = await fetcher();

  if (cache && cacheKey) {
    try {
      const responseToCache = new Response(JSON.stringify(freshData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': `public, max-age=${ttlSeconds}`,
        },
      });
      scheduleBackground(cache.put(cacheKey, responseToCache), waitUntil);
    } catch {
      // Never fail request due to cache write issue
    }
  }

  return freshData;
}

export function getCachedPublicProjects(
  request: Request,
  config: FirestoreRestConfig,
  waitUntil?: (promise: Promise<unknown>) => void,
  ttlSeconds = 60,
  limit = 200,
): Promise<ProjectRecord[]> {
  return readOrPopulateCache(
    request,
    `/__edge-cache/projects-list-v1?limit=${limit}`,
    ttlSeconds,
    () => listPublicProjects(config, limit),
    waitUntil,
  );
}

export function getCachedProjectBySlug(
  request: Request,
  slug: string,
  config: FirestoreRestConfig,
  waitUntil?: (promise: Promise<unknown>) => void,
  ttlSeconds = 60,
): Promise<ProjectRecord | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  return readOrPopulateCache(
    request,
    `/__edge-cache/project-slug-v1/${encodeURIComponent(normalizedSlug)}`,
    ttlSeconds,
    () => getProjectBySlug(slug, config),
    waitUntil,
  );
}

export function purgePublicProjectCaches(
  request: Request,
  slugs: Array<string | null | undefined>,
  waitUntil?: (promise: Promise<unknown>) => void,
): void {
  const cache = getDefaultEdgeCache();
  if (!cache) return;

  const paths = new Set<string>([
    '/__edge-cache/projects-list-v1?limit=200',
    '/__edge-cache/projects-list-v1?limit=500',
  ]);

  for (const rawSlug of slugs) {
    if (typeof rawSlug === 'string' && rawSlug.trim()) {
      paths.add(`/__edge-cache/project-slug-v1/${encodeURIComponent(rawSlug.trim().toLowerCase())}`);
    }
  }

  const deletions = Array.from(paths).map((path) => {
    const key = buildCacheKey(request, path);
    return key ? cache.delete(key).catch(() => false) : Promise.resolve(false);
  });

  scheduleBackground(Promise.all(deletions), waitUntil);
}
