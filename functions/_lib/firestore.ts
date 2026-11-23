import defaultFirebaseConfig from '../../firebase-applet-config.json';
import {
  SponsorshipStatus,
  SponsorshipType,
  type ProjectRecord,
} from '../../src/types/project.ts';
import type { PagesEnv } from './types.ts';

export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export interface FirestoreRestConfig {
  projectId: string;
  databaseId: string;
  apiKey: string;
}

export function resolveFirestoreConfig(env?: PagesEnv): FirestoreRestConfig {
  return {
    projectId: env?.FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
    databaseId: env?.FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId || '(default)',
    apiKey: env?.FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateProjectId(): string {
  const year = new Date().getUTCFullYear();
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `BLGU-${year}-${suffix}`;
}

export function generateManagementToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { nullValue: null };

interface FirestoreRestDoc {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  return { stringValue: String(value) };
}

function encodeFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, val] of Object.entries(obj)) {
    fields[key] = encodeValue(val);
  }
  return fields;
}

function decodeValue(val: FirestoreValue | undefined): unknown {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('nullValue' in val) return null;
  return null;
}

export function decodeDocumentFields(
  fields: Record<string, FirestoreValue> | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!fields) return result;
  for (const [key, val] of Object.entries(fields)) {
    result[key] = decodeValue(val);
  }
  return result;
}

export function serializeProjectData(data: Record<string, unknown>): ProjectRecord {
  return {
    projectId: String(data.projectId ?? ''),
    slug: String(data.slug ?? ''),
    projectName: String(data.projectName ?? ''),
    lguName: String(data.lguName ?? ''),
    province: String(data.province ?? ''),
    description: String(data.description ?? ''),
    objectives: String(data.objectives ?? ''),
    temporaryUrl: String(data.temporaryUrl ?? ''),
    repositoryUrl: String(data.repositoryUrl ?? ''),
    sponsorshipType: (data.sponsorshipType as SponsorshipType) ?? SponsorshipType.DOMAIN,
    preferredDomain: String(data.preferredDomain ?? ''),
    maintainerName: String(data.maintainerName ?? ''),
    maintainerEmail: String(data.maintainerEmail ?? ''),
    maintainerContactLink: String(data.maintainerContactLink ?? ''),
    sponsorshipStatus:
      (data.sponsorshipStatus as SponsorshipStatus) ?? SponsorshipStatus.AWAITING,
    sponsorshipConfirmationNote: String(data.sponsorshipConfirmationNote ?? ''),
    submittedAt: typeof data.submittedAt === 'string' ? data.submittedAt : null,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
    sponsoredAt: typeof data.sponsoredAt === 'string' ? data.sponsoredAt : null,
    consentTimestamp: typeof data.consentTimestamp === 'string' ? data.consentTimestamp : null,
    isPublic: Boolean(data.isPublic),
  };
}

function documentsBaseUrl(config: FirestoreRestConfig): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/${encodeURIComponent(config.databaseId)}/documents`;
}

function docResourceName(config: FirestoreRestConfig, collection: string, docId: string): string {
  return `projects/${config.projectId}/databases/${config.databaseId}/documents/${collection}/${docId}`;
}

async function fetchFirestoreDocument(
  config: FirestoreRestConfig,
  collection: string,
  docId: string,
): Promise<Record<string, unknown> | null> {
  const url = `${documentsBaseUrl(config)}/${encodeURIComponent(collection)}/${encodeURIComponent(docId)}?key=${encodeURIComponent(config.apiKey)}`;
  const res = await fetch(url, { method: 'GET' });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore GET ${collection}/${docId} failed (${res.status}): ${text}`);
  }

  const docJson = (await res.json()) as FirestoreRestDoc;
  return decodeDocumentFields(docJson.fields);
}

export async function resolveProjectIdByToken(
  rawToken: string,
  config: FirestoreRestConfig,
): Promise<string | null> {
  if (!TOKEN_PATTERN.test(rawToken)) {
    return null;
  }
  const lookupHash = await sha256Hex(`lookup:${rawToken}`);
  const tokenData = await fetchFirestoreDocument(config, 'project_tokens', lookupHash);
  if (!tokenData) {
    return null;
  }
  const projectId = tokenData.projectId;
  return typeof projectId === 'string' && projectId.length >= 6 ? projectId : null;
}

export async function getProjectDocument(
  projectId: string,
  config: FirestoreRestConfig,
): Promise<Record<string, unknown> | null> {
  return fetchFirestoreDocument(config, 'projects', projectId);
}

export async function commitWrites(
  config: FirestoreRestConfig,
  writes: unknown[],
): Promise<void> {
  const url = `${documentsBaseUrl(config)}:commit?key=${encodeURIComponent(config.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore commit failed (${res.status}): ${text}`);
  }
}

export function buildCreateWrite(
  config: FirestoreRestConfig,
  collection: string,
  docId: string,
  fields: Record<string, unknown>,
  serverTimestampFields: string[],
) {
  return {
    update: {
      name: docResourceName(config, collection, docId),
      fields: encodeFields(fields),
    },
    currentDocument: { exists: false },
    updateTransforms: serverTimestampFields.map((fieldPath) => ({
      fieldPath,
      setToServerValue: 'REQUEST_TIME',
    })),
  };
}

export function buildUpdateWrite(
  config: FirestoreRestConfig,
  collection: string,
  docId: string,
  fields: Record<string, unknown>,
  serverTimestampFields: string[],
  deleteFieldNames: string[] = [],
) {
  const maskPaths = [...Object.keys(fields), ...deleteFieldNames];
  return {
    update: {
      name: docResourceName(config, collection, docId),
      fields: encodeFields(fields),
    },
    updateMask: {
      fieldPaths: maskPaths,
    },
    currentDocument: { exists: true },
    updateTransforms: serverTimestampFields.map((fieldPath) => ({
      fieldPath,
      setToServerValue: 'REQUEST_TIME',
    })),
  };
}
