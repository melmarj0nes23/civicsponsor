import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { ProjectFormFields, type ProjectFormValues } from '../components/ProjectFormFields.tsx';
import { StatusLabel } from '../components/StatusLabel.tsx';
import { formatDisplayDate, validateProjectUpdate } from '../lib/validation.ts';
import {
  FIELD_LIMITS,
  SponsorshipStatus,
  type ProjectRecord,
} from '../types/project.ts';

function toFormValues(project: ProjectRecord): ProjectFormValues {
  return {
    projectName: project.projectName,
    lguName: project.lguName,
    province: project.province,
    description: project.description,
    objectives: project.objectives,
    temporaryUrl: project.temporaryUrl,
    repositoryUrl: project.repositoryUrl,
    sponsorshipType: project.sponsorshipType,
    preferredDomain: project.preferredDomain,
    maintainerName: project.maintainerName,
    maintainerEmail: project.maintainerEmail,
    maintainerContactLink: project.maintainerContactLink,
  };
}

export function ManageProjectPage() {
  const { token } = useParams<{ token: string }>();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [values, setValues] = useState<ProjectFormValues | null>(null);
  const [sponsorshipStatus, setSponsorshipStatus] = useState<SponsorshipStatus>(
    SponsorshipStatus.AWAITING,
  );
  const [confirmationNote, setConfirmationNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    document.title = 'Manage Project Listing — BetterLGU Civic Sponsorship';
  }, []);

  useEffect(() => {
    if (!token) {
      setLoadError('Missing management token.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchProject() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/manage/${encodeURIComponent(token ?? '')}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.project) {
          setLoadError(data.error || 'This management link is invalid or could not be verified.');
          setLoading(false);
          return;
        }

        const loaded = data.project as ProjectRecord;
        setProject(loaded);
        setValues(toFormValues(loaded));
        setSponsorshipStatus(loaded.sponsorshipStatus);
        setConfirmationNote(loaded.sponsorshipConfirmationNote || '');
        document.title = `Manage: ${loaded.projectName} — BetterLGU Civic Sponsorship`;
      } catch {
        if (!cancelled) {
          setLoadError('Network error while verifying your private management link.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProject();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleFieldChange = <K extends keyof ProjectFormValues>(
    field: K,
    value: ProjectFormValues[K],
  ) => {
    setValues((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaveSuccess(null);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!values || !token) return;

    setSaveError(null);
    setSaveSuccess(null);

    const payload = {
      ...values,
      sponsorshipStatus,
      sponsorshipConfirmationNote:
        sponsorshipStatus === SponsorshipStatus.SPONSORED ? confirmationNote : '',
    };

    const validation = validateProjectUpdate(payload);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const firstErrorField = Object.keys(validation.errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setFieldErrors({});
    setSaving(true);

    try {
      const response = await fetch(`/api/manage/${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          setFieldErrors(data.fieldErrors);
        }
        setSaveError(data.error || 'Unable to save changes. Please verify all fields.');
        setSaving(false);
        return;
      }

      if (data.project) {
        const updated = data.project as ProjectRecord;
        setProject(updated);
        setValues(toFormValues(updated));
        setSponsorshipStatus(updated.sponsorshipStatus);
        setConfirmationNote(updated.sponsorshipConfirmationNote || '');
      }

      setSaveSuccess(
        'Your changes have been saved and synchronized live across the public directory.',
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSaveError('Network error while saving your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusSave = async () => {
    if (!token) return;

    setSaveError(null);
    setSaveSuccess(null);

    if (
      sponsorshipStatus === SponsorshipStatus.SPONSORED &&
      confirmationNote.trim().length > FIELD_LIMITS.sponsorshipConfirmationNote.max
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        sponsorshipConfirmationNote: `Confirmation note cannot exceed ${FIELD_LIMITS.sponsorshipConfirmationNote.max} characters.`,
      }));
      return;
    }

    setSavingStatus(true);
    try {
      const response = await fetch(`/api/manage/${encodeURIComponent(token)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorshipStatus,
          sponsorshipConfirmationNote:
            sponsorshipStatus === SponsorshipStatus.SPONSORED ? confirmationNote : '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          setFieldErrors((prev) => ({ ...prev, ...data.fieldErrors }));
        }
        setSaveError(data.error || 'Unable to update sponsorship status right now.');
        return;
      }

      if (data.project) {
        const updated = data.project as ProjectRecord;
        setProject(updated);
        setSponsorshipStatus(updated.sponsorshipStatus);
        setConfirmationNote(updated.sponsorshipConfirmationNote || '');
      }

      setSaveSuccess(
        data.message ||
          'Sponsorship status updated and synchronized live across the public directory.',
      );
    } catch {
      setSaveError('Network error while updating sponsorship status. Please try again.');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-civic-surface py-20 min-h-[65vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-civic-border rounded-xl p-10 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-civic-primary mx-auto" aria-hidden="true" />
            <p className="text-sm text-slate-600">Verifying private management link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !project || !values) {
    return (
      <div className="bg-civic-surface py-20 min-h-[65vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-civic-border rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <ShieldAlert className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-civic-ink">
                Invalid Private Management Link
              </h1>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {loadError || 'We could not verify this private project management link.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/manage"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors"
              >
                Enter Another Management Link
              </Link>
              <Link
                to="/projects"
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-civic-ink bg-white border border-slate-300 hover:border-civic-primary hover:text-civic-primary rounded-lg transition-colors"
              >
                Browse Public Directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="bg-white border-b border-civic-border py-10 lg:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-mono text-xs font-medium text-slate-500">
                {project.projectId}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <StatusLabel status={project.sponsorshipStatus} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-civic-ink">
              Manage Project Listing
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
              Published {formatDisplayDate(project.submittedAt)} · Last updated{' '}
              {formatDisplayDate(project.updatedAt)}
            </p>
          </div>

          <Link
            to={`/projects/${project.slug}`}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-civic-ink bg-white border border-slate-300 hover:border-civic-primary hover:text-civic-primary rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>Review Public Listing</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="bg-civic-surface py-10 lg:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div
            role="region"
            aria-label="Private management link confidentiality warning"
            className="bg-amber-50/80 border border-amber-300 rounded-xl p-5 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-amber-950 leading-relaxed">
              <strong className="font-semibold">Keep this page URL confidential.</strong> Anyone who
              possesses this private management link can edit this project listing and update its
              sponsorship status without signing in.
            </div>
          </div>

          {saveSuccess && (
            <div
              role="status"
              className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-sm text-emerald-900"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800"
            >
              {saveError}
            </div>
          )}

          <form
            onSubmit={handleSave}
            noValidate
            className="bg-white border border-civic-border rounded-xl p-6 sm:p-10 shadow-[0_1px_3px_rgba(11,18,32,0.04)] space-y-12"
          >
            <section aria-labelledby="section-status-control" className="space-y-5">
              <div className="pb-4 border-b border-civic-border">
                <h2
                  id="section-status-control"
                  className="font-display text-xl font-bold text-civic-ink"
                >
                  Sponsorship Status
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Update your project status once infrastructure sponsorship is secured. Sponsored
                  projects stay permanently visible in the directory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup">
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    sponsorshipStatus === SponsorshipStatus.AWAITING
                      ? 'border-civic-primary bg-civic-tint/40'
                      : 'border-civic-border hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="sponsorshipStatus"
                    value={SponsorshipStatus.AWAITING}
                    checked={sponsorshipStatus === SponsorshipStatus.AWAITING}
                    onChange={() => {
                      setSponsorshipStatus(SponsorshipStatus.AWAITING);
                      setSaveSuccess(null);
                    }}
                    disabled={saving}
                    className="mt-1 h-4 w-4 text-civic-primary focus:ring-civic-primary cursor-pointer"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-amber-700">
                      Awaiting Sponsorship
                    </span>
                    <span className="block text-xs text-slate-600 mt-0.5">
                      Project is live in the directory and seeking domain or hosting support.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    sponsorshipStatus === SponsorshipStatus.SPONSORED
                      ? 'border-emerald-700 bg-emerald-50/50'
                      : 'border-civic-border hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="sponsorshipStatus"
                    value={SponsorshipStatus.SPONSORED}
                    checked={sponsorshipStatus === SponsorshipStatus.SPONSORED}
                    onChange={() => {
                      setSponsorshipStatus(SponsorshipStatus.SPONSORED);
                      setSaveSuccess(null);
                    }}
                    disabled={saving}
                    className="mt-1 h-4 w-4 text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-emerald-700">Sponsored</span>
                    <span className="block text-xs text-slate-600 mt-0.5">
                      Requested sponsorship has been secured. Remains listed as a supported tool.
                    </span>
                  </div>
                </label>
              </div>

              {sponsorshipStatus === SponsorshipStatus.SPONSORED && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="sponsorshipConfirmationNote"
                      className="block text-sm font-semibold text-civic-ink"
                    >
                      Public Sponsorship Confirmation Note (Optional)
                    </label>
                    <span className="text-xs text-slate-400 font-mono tabular-nums">
                      {confirmationNote.length}/{FIELD_LIMITS.sponsorshipConfirmationNote.max}
                    </span>
                  </div>
                  <textarea
                    id="sponsorshipConfirmationNote"
                    name="sponsorshipConfirmationNote"
                    rows={3}
                    disabled={saving}
                    maxLength={FIELD_LIMITS.sponsorshipConfirmationNote.max}
                    value={confirmationNote}
                    onChange={(e) => {
                      setConfirmationNote(e.target.value);
                      setSaveSuccess(null);
                    }}
                    placeholder="Domain sponsorship secured. Thank you to our sponsor for supporting this project."
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-lg text-civic-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                  />
                  {fieldErrors.sponsorshipConfirmationNote && (
                    <p className="text-xs text-red-700 mt-1.5">
                      {fieldErrors.sponsorshipConfirmationNote}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  {sponsorshipStatus !== project.sponsorshipStatus ||
                  (sponsorshipStatus === SponsorshipStatus.SPONSORED &&
                    confirmationNote.trim() !== (project.sponsorshipConfirmationNote || '').trim())
                    ? 'You have unsaved sponsorship status changes.'
                    : 'Current public status is synchronized with the directory.'}
                </p>
                <button
                  type="button"
                  onClick={handleQuickStatusSave}
                  disabled={saving || savingStatus}
                  className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap ${
                    sponsorshipStatus === SponsorshipStatus.SPONSORED
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-civic-primary hover:bg-civic-primary-hover'
                  }`}
                >
                  {savingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>
                    {savingStatus
                      ? 'Updating Status...'
                      : sponsorshipStatus === SponsorshipStatus.SPONSORED
                        ? 'Save Status as Sponsored'
                        : 'Save Status as Awaiting Sponsorship'}
                  </span>
                </button>
              </div>
            </section>

            <ProjectFormFields
              values={values}
              errors={fieldErrors}
              onChange={handleFieldChange}
              disabled={saving}
            />

            <div className="pt-6 border-t border-civic-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Changes update the public directory and live statistics immediately.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 min-h-12 sm:min-h-0 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover disabled:opacity-60 rounded-lg shadow-[0_1px_2px_rgba(0,56,168,0.2)] transition-colors cursor-pointer whitespace-nowrap"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
