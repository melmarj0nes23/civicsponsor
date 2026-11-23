import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  Timestamp,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import {
  SponsorshipStatus,
  SponsorshipType,
  type DirectoryStats,
  type ProjectRecord,
} from '../types/project.ts';

function toIsoString(value: unknown): string | null {
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

export function mapFirestoreProject(data: DocumentData): ProjectRecord {
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
    submittedAt: toIsoString(data.submittedAt),
    updatedAt: toIsoString(data.updatedAt),
    sponsoredAt: toIsoString(data.sponsoredAt),
    consentTimestamp: toIsoString(data.consentTimestamp),
    isPublic: Boolean(data.isPublic),
  };
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const path = 'projects';
    const projectsQuery = query(collection(db, path), where('isPublic', '==', true));

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => mapFirestoreProject(docSnap.data()));
        items.sort((a, b) => {
          const timeA = a.submittedAt ? Date.parse(a.submittedAt) : 0;
          const timeB = b.submittedAt ? Date.parse(b.submittedAt) : 0;
          return timeB - timeA;
        });
        setProjects(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        setError('Unable to load live project records from the directory.');
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (wrapped) {
          console.error(wrapped);
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const stats: DirectoryStats = useMemo(() => {
    const totalProjects = projects.length;
    let awaitingSponsorship = 0;
    let sponsoredProjects = 0;
    const uniqueLgus = new Set<string>();

    for (const project of projects) {
      if (project.sponsorshipStatus === SponsorshipStatus.SPONSORED) {
        sponsoredProjects += 1;
      } else {
        awaitingSponsorship += 1;
      }
      const key = `${project.lguName.trim().toLowerCase()}|${project.province.trim().toLowerCase()}`;
      if (project.lguName.trim()) {
        uniqueLgus.add(key);
      }
    }

    return {
      totalProjects,
      awaitingSponsorship,
      sponsoredProjects,
      lgusRepresented: uniqueLgus.size,
    };
  }, [projects]);

  return { projects, stats, loading, error };
}

function extractProjectIdFromSlug(slugOrId: string): string | null {
  const match = slugOrId.match(/(blgu-\d{4}-[a-z0-9]{6,12})$/i);
  if (match) {
    return match[1].toUpperCase();
  }
  if (/^[a-zA-Z0-9_-]{6,64}$/.test(slugOrId) && slugOrId.toUpperCase().startsWith('BLGU-')) {
    return slugOrId.toUpperCase();
  }
  return null;
}

export function useProjectBySlug(slugParam: string | undefined) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugParam) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const extractedId = extractProjectIdFromSlug(slugParam);

    if (extractedId) {
      const path = `projects/${extractedId}`;
      const unsubscribe = onSnapshot(
        doc(db, 'projects', extractedId),
        (snapshot) => {
          if (snapshot.exists()) {
            setProject(mapFirestoreProject(snapshot.data()));
          } else {
            setProject(null);
          }
          setLoading(false);
        },
        (err) => {
          setLoading(false);
          setError('Unable to load project details in real time.');
          try {
            handleFirestoreError(err, OperationType.GET, path);
          } catch (wrapped) {
            console.error(wrapped);
          }
        },
      );

      return () => unsubscribe();
    }

    const path = 'projects';
    const slugQuery = query(
      collection(db, path),
      where('isPublic', '==', true),
      where('slug', '==', slugParam.toLowerCase()),
    );

    const unsubscribe = onSnapshot(
      slugQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setProject(mapFirestoreProject(snapshot.docs[0].data()));
        } else {
          setProject(null);
        }
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError('Unable to load project details in real time.');
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (wrapped) {
          console.error(wrapped);
        }
      },
    );

    return () => unsubscribe();
  }, [slugParam]);

  return { project, loading, error };
}
