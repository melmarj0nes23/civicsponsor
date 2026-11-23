import { validateStatusUpdate } from '../../../../src/lib/validation.ts';
import { SponsorshipStatus } from '../../../../src/types/project.ts';
import {
  buildUpdateWrite,
  commitWrites,
  getProjectDocument,
  jsonResponse,
  resolveFirestoreConfig,
  resolveProjectIdByToken,
  serializeProjectData,
  sha256Hex,
} from '../../../_lib/firestore.ts';
import type { PagesContext } from '../../../_lib/types.ts';

export async function onRequestPatch(context: PagesContext<{ token: string }>): Promise<Response> {
  try {
    const contentLength = Number(context.request.headers.get('content-length') || '0');
    if (Number.isFinite(contentLength) && contentLength > 16384) {
      return jsonResponse({ error: 'Status update payload is too large.' }, 413);
    }

    const config = resolveFirestoreConfig(context.env);
    const rawToken = typeof context.params.token === 'string' ? context.params.token.trim() : '';
    const projectId = await resolveProjectIdByToken(rawToken, config);

    if (!projectId) {
      return jsonResponse(
        {
          error:
            'This private management link or token is invalid. Please double-check what you saved after submission.',
        },
        404,
      );
    }

    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON status update payload.' }, 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Invalid status update payload.' }, 400);
    }

    const validation = validateStatusUpdate(body as Record<string, unknown>);
    if (!validation.valid || !validation.data) {
      return jsonResponse(
        {
          error: 'Please select a valid sponsorship status before saving.',
          fieldErrors: validation.errors,
        },
        400,
      );
    }

    const clean = validation.data;
    if (clean.expectedProjectId && clean.expectedProjectId !== projectId) {
      return jsonResponse(
        {
          error:
            'This private management token belongs to a different project listing. Please use the token issued for this project.',
        },
        403,
      );
    }

    const existingData = await getProjectDocument(projectId, config);
    if (!existingData) {
      return jsonResponse({ error: 'Project listing could not be found.' }, 404);
    }

    const authHash = await sha256Hex(`auth:${rawToken}`);
    const wasSponsored = existingData.sponsorshipStatus === SponsorshipStatus.SPONSORED;
    const isNowSponsored = clean.sponsorshipStatus === SponsorshipStatus.SPONSORED;

    const updateFields: Record<string, unknown> = {
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

    const freshData = await getProjectDocument(projectId, config);
    return jsonResponse({
      message: isNowSponsored
        ? 'Project status updated to Sponsored.'
        : 'Project status updated to Awaiting Sponsorship.',
      project: freshData ? serializeProjectData(freshData) : null,
    });
  } catch (error) {
    console.error('Status update failed:', error instanceof Error ? error.message : error);
    return jsonResponse(
      { error: 'Unable to update sponsorship status right now. Please try again.' },
      500,
    );
  }
}
