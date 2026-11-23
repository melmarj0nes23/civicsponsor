import { useEffect } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_TITLE,
  SITE_NAME,
  buildCanonicalUrl,
} from '../lib/seo.ts';

export interface PageSeoOptions {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  ogType?: 'website' | 'article';
  ogImage?: string;
  ogImageAlt?: string;
  jsonLd?: Record<string, unknown> | null;
}

const ROUTE_JSON_LD_ID = 'route-seo-json-ld';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setRouteJsonLd(data: Record<string, unknown> | null | undefined) {
  const existing = document.getElementById(ROUTE_JSON_LD_ID);
  if (!data) {
    existing?.remove();
    return;
  }

  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = ROUTE_JSON_LD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function useSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  noIndex = false,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = DEFAULT_OG_IMAGE_ALT,
  jsonLd,
}: PageSeoOptions) {
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const resolvedTitle = title || DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const canonicalUrl = buildCanonicalUrl(path);
    const robotsValue = noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    document.title = resolvedTitle;
    upsertMeta('name', 'description', resolvedDescription);
    upsertMeta('name', 'robots', robotsValue);
    upsertCanonical(canonicalUrl);

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', 'en_PH');
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:title', resolvedTitle);
    upsertMeta('property', 'og:description', resolvedDescription);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:image:secure_url', ogImage);
    upsertMeta('property', 'og:image:alt', ogImageAlt);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:url', canonicalUrl);
    upsertMeta('name', 'twitter:title', resolvedTitle);
    upsertMeta('name', 'twitter:description', resolvedDescription);
    upsertMeta('name', 'twitter:image', ogImage);
    upsertMeta('name', 'twitter:image:alt', ogImageAlt);

    setRouteJsonLd(serializedJsonLd ? (JSON.parse(serializedJsonLd) as Record<string, unknown>) : null);

    return () => {
      document.getElementById(ROUTE_JSON_LD_ID)?.remove();
    };
  }, [title, description, path, noIndex, ogType, ogImage, ogImageAlt, serializedJsonLd]);
}
