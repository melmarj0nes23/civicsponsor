import { buildProjectSlug, validateProjectUpdate } from '../../../src/lib/validation.ts';
import { SponsorshipStatus } from '../../../src/types/project.ts';
import { purgePublicProjectCaches } from '../../_lib/edgeCache.ts';
import {
  buildUpdateWrite,
  commitWrites,
  getProjectDocument,
  jsonResponse,
  resolveFirestoreConfig,
  resolveProjectIdByToken,
  serializeProjectData,
  sha256Hex,
} from '../../_lib/firestore.ts';
import type { PagesContext } from '../../_lib/types.ts';

export async function onRequestGet(context: PagesContext<{ token: string }>): Promise<Response> {
  try {
    const config = resolveFirestoreConfig(context.env);
    const rawToken = typeof context.params.token === 'string' ? context.params.token.trim() : '';
    const projectId = await resolveProjectIdByToken(rawToken, config);

    if (!projectId) {
      return jsonResponse(
        {
          error:
            'This management link is invalid. Please double-check the URL you saved after submission.',
        },
        404,
      );
    }

    const projectData = await getProjectDocument(projectId, config);
    if (!projectData) {
      return jsonResponse({ error: 'Project listing could not be found.' }, 404);
    }

    return jsonResponse({ project: serializeProjectData(projectData) });
  } catch (error) {
    console.error('Management lookup failed:', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Unable to load project management details right now.' }, 500);
  }
}

export async function onRequestPut(context: PagesContext<{ token: string }>): Promise<Response> {
  try {
    const contentLength = Number(context.request.headers.get('content-length') || '0');
    if (Number.isFinite(contentLength) && contentLength > 65536) {
      return jsonResponse({ error: 'Update payload is too large.' }, 413);
    }

    const config = resolveFirestoreConfig(context.env);
    const rawToken = typeof context.params.token === 'string' ? context.params.token.trim() : '';
    const projectId = await resolveProjectIdByToken(rawToken, config);

    if (!projectId) {
      return jsonResponse({ error: 'This management link is invalid or unauthorized.' }, 404);
    }

    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON update payload.' }, 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Invalid update payload.' }, 400);
    }

    const validation = validateProjectUpdate(body as Record<string, unknown>);
    if (!validation.valid || !validation.data) {
      return jsonResponse(
        {
          error: 'Please review the highlighted fields before saving changes.',
          fieldErrors: validation.errors,
        },
        400,
      );
    }

    const existingData = await getProjectDocument(projectId, config);
    if (!existingData) {
      return jsonResponse({ error: 'Project listing could not be found.' }, 404);
    }

    const clean = validation.data;
    const updatedSlug = buildProjectSlug(clean.projectName, projectId);
    const authHash = await sha256Hex(`auth:${rawToken}`);
    const wasSponsored = existingData.sponsorshipStatus === SponsorshipStatus.SPONSORED;
    const isNowSponsored = clean.sponsorshipStatus === SponsorshipStatus.SPONSORED;

    const updateFields: Record<string, unknown> = {
      slug: updatedSlug,
      projectName: clean.projectName,
      lguName: clean.lguName,
      province: clean.province,
      description: clean.description,
      temporaryUrl: clean.temporaryUrl,
      repositoryUrl: clean.repositoryUrl,
      sponsorshipType: clean.sponsorshipType,
      preferredDomain: clean.preferredDomain,
      maintainerName: clean.maintainerName,
      maintainerEmail: clean.maintainerEmail,
      maintainerContactLink: clean.maintainerContactLink,
      sponsorshipConfirmationNote: clean.sponsorshipConfirmationNote,
    };

    const serverTimestampFields = ['updatedAt'];
    const deleteFieldNames: string[] = [];

    if ('estimatedCost' in existingData) deleteFieldNames.push('estimatedCost');
    if ('currency' in existingData) deleteFieldNames.push('currency');
    if ('sponsorshipReason' in existingData) deleteFieldNames.push('sponsorshipReason');
    if ('objectives' in existingData) deleteFieldNames.push('objectives');

    if (!wasSponsored && isNowSponsored) {
      updateFields.sponsorshipStatus = SponsorshipStatus.SPONSORED;
      serverTimestampFields.push('sponsoredAt');
    } else if (wasSponsored && !isNowSponsored) {
      updateFields.sponsorshipStatus = SponsorshipStatus.AWAITING;
      updateFields.sponsoredAt = null;
      updateFields.sponsorshipConfirmationNote = '';
    }

    const projectWrite = buildUpdateWrite(
      config,
      'projects',
      projectId,
      updateFields,
      serverTimestampFields,
      deleteFieldNames,
    );

    const secretWrite = buildUpdateWrite(
      config,
      'project_secrets',
      projectId,
      { tokenProof: authHash },
      ['lastUsedAt'],
    );

    await commitWrites(config, [projectWrite, secretWrite]);
    purgePublicProjectCaches(
      context.request,
      [typeof existingData.slug === 'string' ? existingData.slug : null, updatedSlug],
      context.waitUntil,
    );

    const freshData = await getProjectDocument(projectId, config);
    return jsonResponse({
      message: 'Project listing updated successfully.',
      project: freshData ? serializeProjectData(freshData) : null,
    });
  } catch (error) {
    console.error('Project update failed:', error instanceof Error ? error.message : error);
    return jsonResponse(
      {
        error:
          'Unable to save project changes right now. Please check your inputs and try again.',
      },
      500,
    );
  }
}
