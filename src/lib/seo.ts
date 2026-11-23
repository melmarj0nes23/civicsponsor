import { SponsorshipStatus, type ProjectRecord } from '../types/project.ts';

export const SITE_URL = 'https://civicsponsor.betteralcala.org';
export const SITE_NAME = 'BetterLGU CivicSponsor';
export const DEFAULT_TITLE = 'BetterLGU CivicSponsor — Philippine Civic Tech Directory';
export const DEFAULT_DESCRIPTION =
  'Discover and sponsor independent Philippine LGU civic technology projects. Connect directly with builders needing domain and hosting support on BetterLGU CivicSponsor.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const DEFAULT_OG_IMAGE_ALT =
  'BetterLGU CivicSponsor — Open Philippine Civic Technology Directory';

export const MAINTAINER_CONTACT_URL = 'https://facebook.com/melmarj0nes23';

export const BETTERGOV_COMMUNITY_LINKS = [
  {
    label: 'Facebook Group',
    shortLabel: 'BetterGovPH Facebook Group',
    href: 'https://web.facebook.com/groups/bettergovph',
    description: 'Join civic tech builders and volunteers collaborating across the Philippines.',
  },
  {
    label: 'Facebook Page',
    shortLabel: 'BetterGovPH Facebook Page',
    href: 'https://web.facebook.com/bettergovph',
    description: 'Follow official BetterGovPH updates, launches, and civic tech highlights.',
  },
  {
    label: 'Discord',
    shortLabel: 'BetterGovPH Discord',
    href: 'https://discord.gg/bettergovph',
    description: 'Chat with developers, designers, and open-data contributors in real time.',
  },
  {
    label: 'Messenger',
    shortLabel: 'BetterGovPH Messenger',
    href: 'https://m.me/ch/T9BIBxaAXbA0z6CT/',
    description: 'Connect quickly through the BetterGovPH community Messenger channel.',
  },
] as const;

export function buildCanonicalUrl(pathname: string): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (cleanPath === '/') {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}${cleanPath.replace(/\/+$/, '')}`;
}

export function truncateDescription(text: string, maxLength = 158): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut = lastSpace > Math.floor(maxLength * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${cleanCut.replace(/[,;:\-–—]+$/, '').trimEnd()}…`;
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}

export function buildProjectItemListJsonLd(projects: ProjectRecord[]) {
  return {
    '@type': 'ItemList',
    name: 'Philippine Civic Technology Projects',
    numberOfItems: projects.length,
    itemListElement: projects.slice(0, 50).map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: `${p.projectName} (${p.lguName})`,
      url: buildCanonicalUrl(`/projects/${p.slug}`),
    })),
  };
}

export function buildProjectSeoMetadata(project: ProjectRecord) {
  const canonicalUrl = buildCanonicalUrl(`/projects/${project.slug}`);
  const title = `${project.projectName} (${project.lguName}) — ${SITE_NAME}`;
  const statusPhrase =
    project.sponsorshipStatus === SponsorshipStatus.SPONSORED
      ? 'Sponsored civic tech project'
      : `Seeking ${project.sponsorshipType.toLowerCase()} sponsorship (${project.preferredDomain})`;
  const description = truncateDescription(
    `${statusPhrase} for ${project.lguName}, ${project.province}. ${project.description}`,
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Projects',
            item: `${SITE_URL}/projects`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.projectName,
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: project.projectName,
        url: canonicalUrl,
        applicationCategory: 'ReferenceApplication',
        operatingSystem: 'Web',
        description: project.description,
        creator: {
          '@type': 'Person',
          name: project.maintainerName,
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: `${project.lguName}, ${project.province}, Philippines`,
        },
        ...(project.repositoryUrl ? { codeRepository: project.repositoryUrl } : {}),
        ...(project.temporaryUrl ? { sameAs: [project.temporaryUrl] } : {}),
        ...(project.submittedAt ? { datePublished: project.submittedAt } : {}),
        ...(project.updatedAt ? { dateModified: project.updatedAt } : {}),
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'PHP',
        },
      },
    ],
  };

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article' as const,
    jsonLd,
  };
}
