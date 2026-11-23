import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import {
  buildSitemapXml,
  injectRouteSeoIntoHtml,
  sortProjectsNewestFirst,
  type InitialCivicData,
} from './functions/_lib/seoHtml.ts';
import {
  buildProjectSlug,
  validateProjectSubmission,
  validateProjectUpdate,
  validateStatusUpdate,
} from './src/lib/validation.ts';
import {
  SponsorshipStatus,
  SponsorshipType,
  type ProjectRecord,
} from './src/types/project.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function generateProjectId(): string {
  const year = new Date().getUTCFullYear();
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `BLGU-${year}-${suffix}`;
}

function generateManagementToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    const seconds = Number((value as { seconds: number }).seconds);
    if (Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

function serializeProject(data: DocumentData): ProjectRecord {
  return {
    projectId: String(data.projectId ?? ''),
    slug: String(data.slug ?? ''),
    projectName: String(data.projectName ?? ''),
    lguName: String(data.lguName ?? ''),
    province: String(data.province ?? ''),
    description: String(data.description ?? ''),
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
    submittedAt: toIso(data.submittedAt),
    updatedAt: toIso(data.updatedAt),
    sponsoredAt: toIso(data.sponsoredAt),
    consentTimestamp: toIso(data.consentTimestamp),
    isPublic: Boolean(data.isPublic),
  };
}

async function resolveProjectIdByToken(rawToken: string): Promise<string | null> {
  if (!TOKEN_PATTERN.test(rawToken)) {
    return null;
  }
  const lookupHash = sha256Hex(`lookup:${rawToken}`);
  const tokenDoc = await getDoc(doc(db, 'project_tokens', lookupHash));
  if (!tokenDoc.exists()) {
    return null;
  }
  const projectId = tokenDoc.data()?.projectId;
  return typeof projectId === 'string' && projectId.length >= 6 ? projectId : null;
}

async function createServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Basic security headers (preserving iframe embedding compatibility)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '64kb' }));

  const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a few minutes and try again.' },
  });

  const submissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error:
        'Submission rate limit reached. Please wait a few minutes before submitting another project.',
    },
  });

  const managementUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many update attempts. Please wait a moment before saving again.' },
  });

  app.use('/api', generalApiLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/projects', async (_req, res) => {
    try {
      const q = query(collection(db, 'projects'), where('isPublic', '==', true), limit(200));
      const snap = await getDocs(q);
      const projects = sortProjectsNewestFirst(snap.docs.map((d) => serializeProject(d.data())));
      res.setHeader('Cache-Control', 'public, max-age=15');
      res.json({ projects });
    } catch (error) {
      console.error('Public project list failed:', error instanceof Error ? error.message : error);
      res.status(500).json({ error: 'Unable to load public projects right now.' });
    }
  });

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const q = query(collection(db, 'projects'), where('isPublic', '==', true), limit(500));
      const snap = await getDocs(q);
      const projects = snap.docs.map((d) => serializeProject(d.data()));
      const xml = buildSitemapXml(projects);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap generation failed:', error instanceof Error ? error.message : error);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(buildSitemapXml([]));
    }
  });

  // Anonymous, open project publication endpoint
  app.post('/api/projects', submissionLimiter, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        res.status(400).json({ error: 'Invalid submission payload.' });
        return;
      }

      const validation = validateProjectSubmission(req.body);
      if (!validation.valid || !validation.data) {
        res.status(400).json({
          error: 'Please complete all required fields with valid information.',
          fieldErrors: validation.errors,
        });
        return;
      }

      const clean = validation.data;
      const projectId = generateProjectId();
      const slug = buildProjectSlug(clean.projectName, projectId);
      const managementToken = generateManagementToken();
      const lookupHash = sha256Hex(`lookup:${managementToken}`);
      const managementTokenHash = sha256Hex(`auth:${managementToken}`);

      const batch = writeBatch(db);

      batch.set(doc(db, 'projects', projectId), {
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
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sponsoredAt: null,
        consentTimestamp: serverTimestamp(),
        isPublic: true,
      });

      batch.set(doc(db, 'project_secrets', projectId), {
        projectId,
        managementTokenHash,
        tokenProof: '',
        createdAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
      });

      batch.set(doc(db, 'project_tokens', lookupHash), {
        projectId,
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      res.status(201).json({
        projectId,
        slug,
        projectName: clean.projectName,
        publicPath: `/projects/${slug}`,
        managementPath: `/manage/${managementToken}`,
        managementToken,
      });
    } catch (error) {
      console.error('Project submission failed:', error instanceof Error ? error.message : error);
      res.status(500).json({
        error: 'We could not publish your project right now. Please verify your inputs and try again.',
      });
    }
  });

  // Private maintainer lookup endpoint
  app.get('/api/manage/:token', async (req, res) => {
    try {
      const rawToken = typeof req.params.token === 'string' ? req.params.token.trim() : '';
      const projectId = await resolveProjectIdByToken(rawToken);

      if (!projectId) {
        res.status(404).json({
          error: 'This management link is invalid. Please double-check the URL you saved after submission.',
        });
        return;
      }

      const projectSnap = await getDoc(doc(db, 'projects', projectId));
      if (!projectSnap.exists()) {
        res.status(404).json({ error: 'Project listing could not be found.' });
        return;
      }

      res.json({ project: serializeProject(projectSnap.data()) });
    } catch (error) {
      console.error('Management lookup failed:', error instanceof Error ? error.message : error);
      res.status(500).json({ error: 'Unable to load project management details right now.' });
    }
  });

  // Private maintainer update endpoint (token-authorized via atomic Firestore proof)
  app.put('/api/manage/:token', managementUpdateLimiter, async (req, res) => {
    try {
      const rawToken = typeof req.params.token === 'string' ? req.params.token.trim() : '';
      const projectId = await resolveProjectIdByToken(rawToken);

      if (!projectId) {
        res.status(404).json({
          error: 'This management link is invalid or unauthorized.',
        });
        return;
      }

      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        res.status(400).json({ error: 'Invalid update payload.' });
        return;
      }

      const validation = validateProjectUpdate(req.body);
      if (!validation.valid || !validation.data) {
        res.status(400).json({
          error: 'Please review the highlighted fields before saving changes.',
          fieldErrors: validation.errors,
        });
        return;
      }

      const projectRef = doc(db, 'projects', projectId);
      const existingSnap = await getDoc(projectRef);
      if (!existingSnap.exists()) {
        res.status(404).json({ error: 'Project listing could not be found.' });
        return;
      }

      const existingData = existingSnap.data();
      const clean = validation.data;
      const updatedSlug = buildProjectSlug(clean.projectName, projectId);
      const authHash = sha256Hex(`auth:${rawToken}`);

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
        updatedAt: serverTimestamp(),
      };

      if ('estimatedCost' in existingData) {
        updateFields.estimatedCost = deleteField();
      }
      if ('currency' in existingData) {
        updateFields.currency = deleteField();
      }
      if ('sponsorshipReason' in existingData) {
        updateFields.sponsorshipReason = deleteField();
      }
      if ('objectives' in existingData) {
        updateFields.objectives = deleteField();
      }

      if (!wasSponsored && isNowSponsored) {
        updateFields.sponsorshipStatus = SponsorshipStatus.SPONSORED;
        updateFields.sponsoredAt = serverTimestamp();
      } else if (wasSponsored && !isNowSponsored) {
        updateFields.sponsorshipStatus = SponsorshipStatus.AWAITING;
        updateFields.sponsoredAt = null;
        updateFields.sponsorshipConfirmationNote = '';
      }

      const batch = writeBatch(db);
      batch.update(projectRef, updateFields);
      batch.update(doc(db, 'project_secrets', projectId), {
        tokenProof: authHash,
        lastUsedAt: serverTimestamp(),
      });

      await batch.commit();

      const freshSnap = await getDoc(projectRef);
      res.json({
        message: 'Project listing updated successfully.',
        project: freshSnap.exists() ? serializeProject(freshSnap.data()) : null,
      });
    } catch (error) {
      console.error('Project update failed:', error instanceof Error ? error.message : error);
      res.status(500).json({
        error: 'Unable to save project changes right now. Please check your inputs and try again.',
      });
    }
  });

  // Dedicated fast sponsorship status update endpoint (token-authorized via atomic Firestore proof)
  app.patch('/api/manage/:token/status', managementUpdateLimiter, async (req, res) => {
    try {
      const rawToken = typeof req.params.token === 'string' ? req.params.token.trim() : '';
      const projectId = await resolveProjectIdByToken(rawToken);

      if (!projectId) {
        res.status(404).json({
          error: 'This private management link or token is invalid. Please double-check what you saved after submission.',
        });
        return;
      }

      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        res.status(400).json({ error: 'Invalid status update payload.' });
        return;
      }

      const validation = validateStatusUpdate(req.body as Record<string, unknown>);
      if (!validation.valid || !validation.data) {
        res.status(400).json({
          error: 'Please select a valid sponsorship status before saving.',
          fieldErrors: validation.errors,
        });
        return;
      }

      const clean = validation.data;
      if (clean.expectedProjectId && clean.expectedProjectId !== projectId) {
        res.status(403).json({
          error:
            'This private management token belongs to a different project listing. Please use the token issued for this project.',
        });
        return;
      }

      const projectRef = doc(db, 'projects', projectId);
      const existingSnap = await getDoc(projectRef);
      if (!existingSnap.exists()) {
        res.status(404).json({ error: 'Project listing could not be found.' });
        return;
      }

      const existingData = existingSnap.data();
      const authHash = sha256Hex(`auth:${rawToken}`);
      const wasSponsored = existingData.sponsorshipStatus === SponsorshipStatus.SPONSORED;
      const isNowSponsored = clean.sponsorshipStatus === SponsorshipStatus.SPONSORED;

      const updateFields: Record<string, unknown> = {
        sponsorshipConfirmationNote: clean.sponsorshipConfirmationNote,
        updatedAt: serverTimestamp(),
      };

      if ('estimatedCost' in existingData) {
        updateFields.estimatedCost = deleteField();
      }
      if ('currency' in existingData) {
        updateFields.currency = deleteField();
      }
      if ('sponsorshipReason' in existingData) {
        updateFields.sponsorshipReason = deleteField();
      }
      if ('objectives' in existingData) {
        updateFields.objectives = deleteField();
      }

      if (!wasSponsored && isNowSponsored) {
        updateFields.sponsorshipStatus = SponsorshipStatus.SPONSORED;
        updateFields.sponsoredAt = serverTimestamp();
      } else if (wasSponsored && !isNowSponsored) {
        updateFields.sponsorshipStatus = SponsorshipStatus.AWAITING;
        updateFields.sponsoredAt = null;
        updateFields.sponsorshipConfirmationNote = '';
      }

      const batch = writeBatch(db);
      batch.update(projectRef, updateFields);
      batch.update(doc(db, 'project_secrets', projectId), {
        tokenProof: authHash,
        lastUsedAt: serverTimestamp(),
      });

      await batch.commit();

      const freshSnap = await getDoc(projectRef);
      res.json({
        message: isNowSponsored
          ? 'Project status updated to Sponsored.'
          : 'Project status updated to Awaiting Sponsorship.',
        project: freshSnap.exists() ? serializeProject(freshSnap.data()) : null,
      });
    } catch (error) {
      console.error('Status update failed:', error instanceof Error ? error.message : error);
      res.status(500).json({
        error: 'Unable to update sponsorship status right now. Please try again.',
      });
    }
  });

  async function resolveProjectForPath(pathname: string): Promise<ProjectRecord | null> {
    if (!pathname.startsWith('/projects/')) return null;
    const slug = decodeURIComponent(pathname.slice('/projects/'.length).replace(/\/+$/, ''));
    if (!slug || slug.includes('/')) return null;
    try {
      const idMatch = slug.match(/(blgu-\d{4}-[a-z0-9]{6})$/i);
      if (idMatch) {
        const snap = await getDoc(doc(db, 'projects', idMatch[1].toUpperCase()));
        if (snap.exists() && snap.data().isPublic === true) {
          return serializeProject(snap.data());
        }
      }
      const q = query(
        collection(db, 'projects'),
        where('isPublic', '==', true),
        where('slug', '==', slug),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return serializeProject(snap.docs[0].data());
      }
    } catch {
      return null;
    }
    return null;
  }

  async function resolveInitialDataForPath(
    pathname: string,
  ): Promise<{ project: ProjectRecord | null; initialData: InitialCivicData }> {
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const initialData: InitialCivicData = {};

    if (normalizedPath === '/' || normalizedPath === '/projects') {
      try {
        const q = query(collection(db, 'projects'), where('isPublic', '==', true), limit(200));
        const snap = await getDocs(q);
        initialData.projects = sortProjectsNewestFirst(
          snap.docs.map((d) => serializeProject(d.data())),
        );
      } catch {
        // Client hook will still attempt live fetch
      }
      return { project: null, initialData };
    }

    const project = await resolveProjectForPath(normalizedPath);
    if (project) {
      initialData.project = project;
    }
    return { project, initialData };
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      try {
        const pathname = req.path || '/';
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, template);
        const { project, initialData } = await resolveInitialDataForPath(pathname);
        if (pathname === '/manage' || pathname.startsWith('/manage/')) {
          res.setHeader('X-Robots-Tag', 'noindex, nofollow');
        }
        res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(injectRouteSeoIntoHtml(transformed, pathname, project, initialData));
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const distIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    app.use(express.static(distDir, { index: false }));
    app.get('*', async (req, res) => {
      const pathname = req.path || '/';
      const { project, initialData } = await resolveInitialDataForPath(pathname);

      if (pathname === '/manage' || pathname.startsWith('/manage/')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(injectRouteSeoIntoHtml(distIndexHtml, pathname, project, initialData));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`BetterLGU CivicSponsor server listening on http://0.0.0.0:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
