import {
  FIELD_LIMITS,
  SponsorshipStatus,
  SponsorshipType,
  type ProjectSubmissionInput,
  type ProjectUpdateInput,
} from '../types/project.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/[a-zA-Z0-9.-]+(:[0-9]{1,5})?(\/.*)?$/;
const DOMAIN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.-]{1,118}[a-zA-Z0-9]$/;
const VALID_SPONSORSHIP_TYPES = new Set<string>(Object.values(SponsorshipType));
const VALID_STATUSES = new Set<string>(Object.values(SponsorshipStatus));

export function sanitizeText(value: unknown, preserveNewlines = false): string {
  if (typeof value !== 'string') {
    return '';
  }

  let cleaned = value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  if (preserveNewlines) {
    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else {
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  }

  return cleaned;
}

export function sanitizeDomain(value: unknown): string {
  const cleaned = sanitizeText(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim();
  return cleaned;
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url || !URL_PATTERN.test(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return false;
    }
    const lowerHost = parsed.hostname.toLowerCase();
    if (
      lowerHost === 'localhost' ||
      lowerHost === '127.0.0.1' ||
      lowerHost === '0.0.0.0' ||
      lowerHost.endsWith('.local')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function buildProjectSlug(projectName: string, projectId: string): string {
  const baseSlug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

  const normalizedId = projectId.toLowerCase().replace(/[^a-z0-9-]+/g, '');
  const combined = baseSlug ? `${baseSlug}-${normalizedId}` : normalizedId;
  return combined.slice(0, 160);
}

export function buildMailtoHref(email: string, projectName: string): string {
  const safeEmail = sanitizeText(email);
  const subject = encodeURIComponent(`Sponsorship Inquiry: ${projectName}`);
  return `mailto:${safeEmail}?subject=${subject}`;
}

export function formatDisplayDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return '—';
  }
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export interface SanitizedProjectPayload {
  projectName: string;
  lguName: string;
  province: string;
  description: string;
  temporaryUrl: string;
  repositoryUrl: string;
  sponsorshipType: SponsorshipType;
  preferredDomain: string;
  maintainerName: string;
  maintainerEmail: string;
  maintainerContactLink: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  errors: Record<string, string>;
  data?: T;
}

function validateCoreFields(
  input: Record<string, unknown>,
): ValidationResult<SanitizedProjectPayload> {
  const errors: Record<string, string> = {};

  const projectName = sanitizeText(input.projectName);
  const lguName = sanitizeText(input.lguName);
  const province = sanitizeText(input.province);
  const description = sanitizeText(input.description, true);
  const temporaryUrl = sanitizeText(input.temporaryUrl);
  const repositoryUrl = sanitizeText(input.repositoryUrl);
  const sponsorshipType = sanitizeText(input.sponsorshipType);
  const preferredDomain = sanitizeDomain(input.preferredDomain);
  const maintainerName = sanitizeText(input.maintainerName);
  const maintainerEmail = sanitizeText(input.maintainerEmail).toLowerCase();
  const maintainerContactLink = sanitizeText(input.maintainerContactLink);

  if (
    projectName.length < FIELD_LIMITS.projectName.min ||
    projectName.length > FIELD_LIMITS.projectName.max
  ) {
    errors.projectName = `Project name must be between ${FIELD_LIMITS.projectName.min} and ${FIELD_LIMITS.projectName.max} characters.`;
  }

  if (lguName.length < FIELD_LIMITS.lguName.min || lguName.length > FIELD_LIMITS.lguName.max) {
    errors.lguName = `LGU name must be between ${FIELD_LIMITS.lguName.min} and ${FIELD_LIMITS.lguName.max} characters.`;
  }

  if (province.length < FIELD_LIMITS.province.min || province.length > FIELD_LIMITS.province.max) {
    errors.province = 'Please select or enter a valid Philippine province.';
  }

  if (
    description.length < FIELD_LIMITS.description.min ||
    description.length > FIELD_LIMITS.description.max
  ) {
    errors.description = `Project description must be between ${FIELD_LIMITS.description.min} and ${FIELD_LIMITS.description.max} characters.`;
  }

  if (
    temporaryUrl.length < FIELD_LIMITS.temporaryUrl.min ||
    temporaryUrl.length > FIELD_LIMITS.temporaryUrl.max ||
    !isSafeHttpUrl(temporaryUrl)
  ) {
    errors.temporaryUrl = 'Enter a valid public deployment URL starting with https:// or http://.';
  }

  if (
    repositoryUrl.length < FIELD_LIMITS.repositoryUrl.min ||
    repositoryUrl.length > FIELD_LIMITS.repositoryUrl.max ||
    !isSafeHttpUrl(repositoryUrl)
  ) {
    errors.repositoryUrl = 'Enter a valid public repository URL starting with https:// or http://.';
  }

  if (!VALID_SPONSORSHIP_TYPES.has(sponsorshipType)) {
    errors.sponsorshipType = 'Select a valid sponsorship requirement.';
  }

  if (
    preferredDomain.length < FIELD_LIMITS.preferredDomain.min ||
    preferredDomain.length > FIELD_LIMITS.preferredDomain.max ||
    !DOMAIN_PATTERN.test(preferredDomain) ||
    !preferredDomain.includes('.')
  ) {
    errors.preferredDomain = 'Enter a valid domain name (for example, bettercebu.org or mylgu.ph).';
  }

  if (
    maintainerName.length < FIELD_LIMITS.maintainerName.min ||
    maintainerName.length > FIELD_LIMITS.maintainerName.max
  ) {
    errors.maintainerName = `Maintainer public name must be between ${FIELD_LIMITS.maintainerName.min} and ${FIELD_LIMITS.maintainerName.max} characters.`;
  }

  if (
    maintainerEmail.length < FIELD_LIMITS.maintainerEmail.min ||
    maintainerEmail.length > FIELD_LIMITS.maintainerEmail.max ||
    !EMAIL_PATTERN.test(maintainerEmail)
  ) {
    errors.maintainerEmail = 'Enter a valid email address for sponsorship inquiries.';
  }

  if (
    maintainerContactLink.length < FIELD_LIMITS.maintainerContactLink.min ||
    maintainerContactLink.length > FIELD_LIMITS.maintainerContactLink.max ||
    !isSafeHttpUrl(maintainerContactLink)
  ) {
    errors.maintainerContactLink =
      'Enter a valid contact link (Facebook, Messenger, LinkedIn, or personal page) starting with https://.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: {
      projectName,
      lguName,
      province,
      description,
      temporaryUrl,
      repositoryUrl,
      sponsorshipType: sponsorshipType as SponsorshipType,
      preferredDomain,
      maintainerName,
      maintainerEmail,
      maintainerContactLink,
    },
  };
}

export function validateProjectSubmission(
  input: Partial<ProjectSubmissionInput> | Record<string, unknown>,
): ValidationResult<SanitizedProjectPayload> {
  const core = validateCoreFields(input as Record<string, unknown>);
  const errors = { ...core.errors };

  if (input.consentAccepted !== true) {
    errors.consentAccepted =
      'You must confirm all submission consent statements before publishing.';
  }

  if (Object.keys(errors).length > 0 || !core.data) {
    return { valid: false, errors };
  }

  return { valid: true, errors: {}, data: core.data };
}

export interface SanitizedProjectUpdatePayload extends SanitizedProjectPayload {
  sponsorshipStatus: SponsorshipStatus;
  sponsorshipConfirmationNote: string;
}

export function validateProjectUpdate(
  input: Partial<ProjectUpdateInput> | Record<string, unknown>,
): ValidationResult<SanitizedProjectUpdatePayload> {
  const core = validateCoreFields(input as Record<string, unknown>);
  const errors = { ...core.errors };

  const status = sanitizeText(input.sponsorshipStatus);
  if (!VALID_STATUSES.has(status)) {
    errors.sponsorshipStatus = 'Select a valid sponsorship status.';
  }

  const note = sanitizeText(input.sponsorshipConfirmationNote, true);
  if (note.length > FIELD_LIMITS.sponsorshipConfirmationNote.max) {
    errors.sponsorshipConfirmationNote = `Confirmation note cannot exceed ${FIELD_LIMITS.sponsorshipConfirmationNote.max} characters.`;
  }

  if (Object.keys(errors).length > 0 || !core.data) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: {
      ...core.data,
      sponsorshipStatus: status as SponsorshipStatus,
      sponsorshipConfirmationNote:
        status === SponsorshipStatus.SPONSORED ? note : '',
    },
  };
}

export function extractManagementToken(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return '';
  }

  // Handle full URLs or paths such as https://example.com/manage/<token> or /manage/<token>
  const manageSegmentMatch = trimmed.match(/\/manage\/([A-Za-z0-9_-]+)/i);
  if (manageSegmentMatch && manageSegmentMatch[1]) {
    return manageSegmentMatch[1];
  }

  // Strip surrounding whitespace or stray slashes/query fragments from a bare token
  return trimmed.replace(/^\/+|\/+$/g, '').split(/[?#]/)[0].trim();
}

export interface SanitizedStatusUpdatePayload {
  sponsorshipStatus: SponsorshipStatus;
  sponsorshipConfirmationNote: string;
  expectedProjectId?: string;
}

export function validateStatusUpdate(
  input: Record<string, unknown>,
): ValidationResult<SanitizedStatusUpdatePayload> {
  const errors: Record<string, string> = {};

  const status = sanitizeText(input.sponsorshipStatus);
  if (!VALID_STATUSES.has(status)) {
    errors.sponsorshipStatus = 'Select a valid sponsorship status.';
  }

  const note = sanitizeText(input.sponsorshipConfirmationNote, true);
  if (note.length > FIELD_LIMITS.sponsorshipConfirmationNote.max) {
    errors.sponsorshipConfirmationNote = `Confirmation note cannot exceed ${FIELD_LIMITS.sponsorshipConfirmationNote.max} characters.`;
  }

  const expectedProjectId =
    typeof input.expectedProjectId === 'string' && input.expectedProjectId.trim().length > 0
      ? sanitizeText(input.expectedProjectId)
      : undefined;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    data: {
      sponsorshipStatus: status as SponsorshipStatus,
      sponsorshipConfirmationNote:
        status === SponsorshipStatus.SPONSORED ? note : '',
      expectedProjectId,
    },
  };
}
