import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildProjectSeoMetadata,
} from '../../src/lib/seo.ts';
import type { ProjectRecord } from '../../src/types/project.ts';

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeJsonLdString(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function buildSitemapXml(projects: ProjectRecord[]): string {
  const staticUrls: Array<{ loc: string; changefreq: string; priority: string; lastmod?: string }> =
    [
      { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
      { loc: `${SITE_URL}/projects`, changefreq: 'daily', priority: '0.9' },
      { loc: `${SITE_URL}/submit`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: '0.3' },
      { loc: `${SITE_URL}/terms`, changefreq: 'yearly', priority: '0.3' },
    ];

  const projectUrls = projects
    .filter((p) => p.isPublic && p.slug)
    .map((p) => {
      const rawDate = p.updatedAt || p.submittedAt;
      const lastmod = rawDate ? rawDate.slice(0, 10) : undefined;
      return {
        loc: buildCanonicalUrl(`/projects/${p.slug}`),
        changefreq: 'weekly',
        priority: '0.8',
        lastmod,
      };
    });

  const allUrls = [...staticUrls, ...projectUrls];
  const entries = allUrls
    .map((entry) => {
      const lastmodTag = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmodTag}\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

interface ResolvedRouteSeo {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogType: 'website' | 'article';
  jsonLd?: Record<string, unknown> | null;
}

const INDEX_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

export function resolveRouteSeo(
  pathname: string,
  project?: ProjectRecord | null,
): ResolvedRouteSeo {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  if (normalized === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonicalUrl: `${SITE_URL}/`,
      robots: INDEX_ROBOTS,
      ogType: 'website',
    };
  }

  if (normalized === '/projects') {
    return {
      title: `Project Directory — ${SITE_NAME}`,
      description:
        'Explore independent Philippine LGU civic technology projects seeking domain and hosting sponsorship, filterable by province, status, and infrastructure need.',
      canonicalUrl: `${SITE_URL}/projects`,
      robots: INDEX_ROBOTS,
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Project Directory', path: '/projects' },
          ]),
          {
            '@type': 'CollectionPage',
            name: `Public Project Directory — ${SITE_NAME}`,
            url: `${SITE_URL}/projects`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        ],
      },
    };
  }

  if (normalized.startsWith('/projects/')) {
    if (project) {
      const projectMeta = buildProjectSeoMetadata(project);
      return {
        title: projectMeta.title,
        description: projectMeta.description,
        canonicalUrl: projectMeta.canonicalUrl,
        robots: INDEX_ROBOTS,
        ogType: projectMeta.ogType,
        jsonLd: projectMeta.jsonLd,
      };
    }
    return {
      title: `Project Not Found — ${SITE_NAME}`,
      description: 'The requested civic technology project listing could not be found.',
      canonicalUrl: buildCanonicalUrl(normalized),
      robots: 'noindex, nofollow',
      ogType: 'website',
    };
  }

  if (normalized === '/submit') {
    return {
      title: `Submit a Civic Tech Project — ${SITE_NAME}`,
      description:
        'Publish your Philippine LGU civic technology project directly to BetterLGU CivicSponsor for domain or hosting sponsorship—no account or approval queue required.',
      canonicalUrl: `${SITE_URL}/submit`,
      robots: INDEX_ROBOTS,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Submit a Project', path: '/submit' },
      ]),
    };
  }

  if (normalized === '/about') {
    return {
      title: `About — ${SITE_NAME}`,
      description:
        'Learn how BetterLGU CivicSponsor supports independent Philippine LGU civic technology builders and connects with the BetterGovPH community.',
      canonicalUrl: `${SITE_URL}/about`,
      robots: INDEX_ROBOTS,
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          buildBreadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
          {
            '@type': 'AboutPage',
            name: `About ${SITE_NAME}`,
            url: `${SITE_URL}/about`,
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
        ],
      },
    };
  }

  if (normalized === '/privacy') {
    return {
      title: `Privacy Policy — ${SITE_NAME}`,
      description:
        'Read how BetterLGU CivicSponsor handles public project submissions, private management link security, and abuse prevention with zero user tracking accounts.',
      canonicalUrl: `${SITE_URL}/privacy`,
      robots: INDEX_ROBOTS,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Privacy Policy', path: '/privacy' },
      ]),
    };
  }

  if (normalized === '/terms') {
    return {
      title: `Terms of Use — ${SITE_NAME}`,
      description:
        'Review the Terms of Use for BetterLGU CivicSponsor, covering open directory participation, maintainer responsibilities, and direct sponsor coordination.',
      canonicalUrl: `${SITE_URL}/terms`,
      robots: INDEX_ROBOTS,
      ogType: 'website',
      jsonLd: buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Terms of Use', path: '/terms' },
      ]),
    };
  }

  if (normalized === '/manage' || normalized.startsWith('/manage/')) {
    return {
      title: `Manage a Listing — ${SITE_NAME}`,
      description:
        'Private maintainer controls for updating a BetterLGU CivicSponsor project listing.',
      canonicalUrl: `${SITE_URL}/manage`,
      robots: 'noindex, nofollow',
      ogType: 'website',
    };
  }

  return {
    title: `Page Not Found — ${SITE_NAME}`,
    description: 'The requested page could not be found on BetterLGU CivicSponsor.',
    canonicalUrl: buildCanonicalUrl(normalized),
    robots: 'noindex, nofollow',
    ogType: 'website',
  };
}

function replaceTag(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

export function injectRouteSeoIntoHtml(
  html: string,
  pathname: string,
  project?: ProjectRecord | null,
): string {
  const seo = resolveRouteSeo(pathname, project);
  const titleAttr = escapeHtmlAttr(seo.title);
  const descAttr = escapeHtmlAttr(seo.description);
  const canonicalAttr = escapeHtmlAttr(seo.canonicalUrl);
  const robotsAttr = escapeHtmlAttr(seo.robots);
  const ogImageAttr = escapeHtmlAttr(DEFAULT_OG_IMAGE);
  const ogImageAltAttr = escapeHtmlAttr(seo.title || DEFAULT_OG_IMAGE_ALT);

  let out = html;
  out = replaceTag(out, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlText(seo.title)}</title>`);
  out = replaceTag(
    out,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${descAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${robotsAttr}" />`,
  );
  out = replaceTag(
    out,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${seo.ogType}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${titleAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${descAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${ogImageAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${ogImageAltAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:url" content="${canonicalAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${titleAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${descAttr}" />`,
  );
  out = replaceTag(
    out,
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${ogImageAltAttr}" />`,
  );

  if (seo.jsonLd) {
    const routeScript = `    <script id="route-seo-json-ld" type="application/ld+json">${safeJsonLdString(seo.jsonLd)}</script>\n  </head>`;
    out = out.replace(/<\/head>/i, routeScript);
  }

  return out;
}
