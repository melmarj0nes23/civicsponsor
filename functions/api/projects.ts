import { buildProjectSlug, validateProjectSubmission } from '../../src/lib/validation.ts';
import { SponsorshipStatus } from '../../src/types/project.ts';
import {
  buildCreateWrite,
  commitWrites,
  generateManagementToken,
  generateProjectId,
  jsonResponse,
  resolveFirestoreConfig,
  sha256Hex,
} from '../_lib/firestore.ts';
import type { PagesContext } from '../_lib/types.ts';

export async function onRequestPost(context: PagesContext): Promise<Response> {
  try {
    const contentLength = Number(context.request.headers.get('content-length') || '0');
    if (Number.isFinite(contentLength) && contentLength > 65536) {
      return jsonResponse({ error: 'Submission payload is too large.' }, 413);
    }

    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON submission payload.' }, 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Invalid submission payload.' }, 400);
    }

    const validation = validateProjectSubmission(body as Record<string, unknown>);
    if (!validation.valid || !validation.data) {
      return jsonResponse(
        {
          error: 'Please complete all required fields with valid information.',
          fieldErrors: validation.errors,
        },
        400,
      );
    }

    const config = resolveFirestoreConfig(context.env);
    const clean = validation.data;
    const projectId = generateProjectId();
    const slug = buildProjectSlug(clean.projectName, projectId);
    const managementToken = generateManagementToken();
    const lookupHash = await sha256Hex(`lookup:${managementToken}`);
    const managementTokenHash = await sha256Hex(`auth:${managementToken}`);

    const projectWrite = buildCreateWrite(
      config,
      'projects',
      projectId,
      {
        projectId,
        slug,
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
        sponsorshipStatus: SponsorshipStatus.AWAITING,
        sponsorshipConfirmationNote: '',
        sponsoredAt: null,
        isPublic: true,
      },
      ['submittedAt', 'updatedAt', 'consentTimestamp'],
    );

    const secretWrite = buildCreateWrite(
      config,
      'project_secrets',
      projectId,
      {
        projectId,
        managementTokenHash,
        tokenProof: '',
      },
      ['createdAt', 'lastUsedAt'],
    );

    const tokenWrite = buildCreateWrite(
      config,
      'project_tokens',
      lookupHash,
      {
        projectId,
      },
      ['createdAt'],
    );

    await commitWrites(config, [projectWrite, secretWrite, tokenWrite]);

    return jsonResponse(
      {
        projectId,
        slug,
        projectName: clean.projectName,
        publicPath: `/projects/${slug}`,
        managementPath: `/manage/${managementToken}`,
        managementToken,
      },
      201,
    );
  } catch (error) {
    console.error('Project submission failed:', error instanceof Error ? error.message : error);
    return jsonResponse(
      {
        error:
          'We could not publish your project right now. Please verify your inputs and try again.',
      },
      500,
    );
  }
}
