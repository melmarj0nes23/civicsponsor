import { listPublicProjects, resolveFirestoreConfig } from './_lib/firestore.ts';
import { buildSitemapXml } from './_lib/seoHtml.ts';
import type { PagesContext } from './_lib/types.ts';

export async function onRequestGet(context: PagesContext): Promise<Response> {
  try {
    const config = resolveFirestoreConfig(context.env);
    const projects = await listPublicProjects(config, 500);
    const xml = buildSitemapXml(projects);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=900',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Sitemap generation failed:', error instanceof Error ? error.message : error);
    const fallbackXml = buildSitemapXml([]);
    return new Response(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
}
