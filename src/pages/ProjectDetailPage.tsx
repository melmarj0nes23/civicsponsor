import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  KeyRound,
  Loader2,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { StatusLabel } from '../components/StatusLabel.tsx';
import { useProjectBySlug } from '../hooks/useProjects.ts';
import {
  buildMailtoHref,
  extractManagementToken,
  formatDisplayDate,
  isSafeHttpUrl,
} from '../lib/validation.ts';
import { FIELD_LIMITS, SponsorshipStatus } from '../types/project.ts';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { project, loading, error } = useProjectBySlug(slug);

  const [maintainerOpen, setMaintainerOpen] = useState(
    () => location.hash === '#maintainer-access',
  );
  const [tokenInput, setTokenInput] = useState('');
  const [targetStatus, setTargetStatus] = useState<SponsorshipStatus>(
    SponsorshipStatus.SPONSORED,
  );
  const [confirmationNote, setConfirmationNote] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!project) return;
    setTargetStatus(
      project.sponsorshipStatus === SponsorshipStatus.AWAITING
        ? SponsorshipStatus.SPONSORED
        : SponsorshipStatus.AWAITING,
    );
    setConfirmationNote(project.sponsorshipConfirmationNote || '');
  }, [project?.projectId, project?.sponsorshipStatus, project?.sponsorshipConfirmationNote]);

  useEffect(() => {
    if (location.hash === '#maintainer-access') {
      setMaintainerOpen(true);
      requestAnimationFrame(() => {
        document.getElementById('maintainer-access')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [location.hash]);

  useEffect(() => {
    if (project) {
      document.title = `${project.projectName} (${project.lguName}) — BetterLGU Civic Sponsorship`;
    } else {
      document.title = 'Project Details — BetterLGU Civic Sponsorship';
    }
  }, [project]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="animate-pulse space-y-6 max-w-4xl">
          <div className="h-4 bg-slate-200 rounded w-36" />
          <div className="h-10 bg-slate-200 rounded w-2/3" />
          <div className="h-24 bg-slate-100 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
          <h1 className="font-display text-lg font-bold mb-2">Unable to load project</h1>
          <p className="text-sm mb-4">{error}</p>
          <Link to="/projects" className="text-sm font-semibold underline">
            Return to Project Directory
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-white border border-civic-border rounded-xl p-10">
          <h1 className="font-display text-2xl font-bold text-civic-ink mb-3">
            Project not found
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            The project listing you requested could not be found in the directory.
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Project Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const isSponsored = project.sponsorshipStatus === SponsorshipStatus.SPONSORED;
  const safeTempUrl = isSafeHttpUrl(project.temporaryUrl) ? project.temporaryUrl : undefined;
  const safeRepoUrl = isSafeHttpUrl(project.repositoryUrl) ? project.repositoryUrl : undefined;
  const safeContactUrl = isSafeHttpUrl(project.maintainerContactLink)
    ? project.maintainerContactLink
    : undefined;
  const mailtoHref = buildMailtoHref(project.maintainerEmail, project.projectName);
  const primaryContactHref = safeContactUrl || mailtoHref;

  const openMaintainerPanel = () => {
    setMaintainerOpen(true);
    setStatusError(null);
    setStatusSuccess(null);
    requestAnimationFrame(() => {
      const panel = document.getElementById('maintainer-access');
      panel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = document.getElementById('detail-management-token');
      input?.focus({ preventScroll: true });
    });
  };

  const handleStatusSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatusError(null);
    setStatusSuccess(null);

    const token = extractManagementToken(tokenInput);
    if (!token || token.length < 32) {
      setStatusError(
        'Please paste the private management link or token you received after submitting this project.',
      );
      return;
    }

    if (
      targetStatus === SponsorshipStatus.SPONSORED &&
      confirmationNote.trim().length > FIELD_LIMITS.sponsorshipConfirmationNote.max
    ) {
      setStatusError(
        `Confirmation note cannot exceed ${FIELD_LIMITS.sponsorshipConfirmationNote.max} characters.`,
      );
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/manage/${encodeURIComponent(token)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorshipStatus: targetStatus,
          sponsorshipConfirmationNote:
            targetStatus === SponsorshipStatus.SPONSORED ? confirmationNote : '',
          expectedProjectId: project.projectId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatusError(data.error || 'Unable to verify your management token or update status.');
        return;
      }

      setStatusSuccess(
        data.message ||
          'Sponsorship status updated and synchronized live across the public directory.',
      );
    } catch {
      setStatusError('Network error while updating sponsorship status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenFullManagePage = async () => {
    setStatusError(null);
    const token = extractManagementToken(tokenInput);
    if (!token || token.length < 32) {
      setStatusError(
        'Paste your private management link or token above to open the full management page.',
      );
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/manage/${encodeURIComponent(token)}`);
      const data = await response.json();
      if (!response.ok || !data.project) {
        setStatusError(data.error || 'This private management link or token could not be verified.');
        return;
      }
      if (data.project.projectId !== project.projectId) {
        setStatusError(
          'This private management token belongs to a different project listing. Please use the token issued for this project.',
        );
        return;
      }
      navigate(`/manage/${encodeURIComponent(token)}`);
    } catch {
      setStatusError('Network error while verifying your management link. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div>
      {/* Header Band */}
      <header className="bg-white border-b border-civic-border py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-civic-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Project Directory</span>
            </Link>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <span className="font-semibold text-civic-ink">{project.lguName}</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>{project.province}</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="font-mono text-xs text-slate-500">{project.projectId}</span>
            </div>
            <StatusLabel status={project.sponsorshipStatus} size="md" />
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-civic-ink mb-6 sm:mb-7 break-words">
            {project.projectName}
          </h1>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-2.5 sm:gap-3">
            {safeTempUrl && (
              <a
                href={safeTempUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg shadow-[0_1px_2px_rgba(0,56,168,0.2)] transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                <span>Visit Project</span>
              </a>
            )}

            {safeRepoUrl && (
              <a
                href={safeRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-civic-ink bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <GitBranch className="w-4 h-4" aria-hidden="true" />
                <span>View Repository</span>
              </a>
            )}

            <a
              href={primaryContactHref}
              target={safeContactUrl ? '_blank' : undefined}
              rel={safeContactUrl ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-civic-primary bg-white border border-civic-primary/40 hover:border-civic-primary hover:bg-civic-tint/40 rounded-lg transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>Contact Maintainer</span>
            </a>

            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-11 sm:min-h-0 text-sm font-medium text-slate-600 hover:text-civic-primary transition-colors whitespace-nowrap"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>Email Inquiry</span>
            </a>
          </div>
        </div>
      </header>

      {/* Detail Body */}
      <div className="bg-civic-surface py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Sponsorship Status Notice */}
          <section
            aria-label="Sponsorship status notice"
            className={`rounded-xl border p-5 sm:p-6 ${
              isSponsored
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {isSponsored ? (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div className="space-y-2">
                  <p className="text-sm font-semibold leading-relaxed">
                    {isSponsored
                      ? 'This project has secured sponsorship. Thank you to everyone supporting community-driven civic technology.'
                      : 'This project is looking for a sponsor. If you would like to help provide its domain or hosting infrastructure, please contact the maintainer directly.'}
                  </p>
                  {isSponsored && project.sponsorshipConfirmationNote && (
                    <p className="text-sm text-emerald-900 leading-relaxed pt-2 border-t border-emerald-200/80">
                      Maintainer note: &ldquo;{project.sponsorshipConfirmationNote}&rdquo;
                    </p>
                  )}
                  {isSponsored && project.sponsoredAt && (
                    <p className="text-xs text-emerald-800 tabular-nums">
                      Marked sponsored on {formatDisplayDate(project.sponsoredAt)}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={openMaintainerPanel}
                className={`inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-3.5 py-2.5 sm:py-2 min-h-11 sm:min-h-0 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start ${
                  isSponsored
                    ? 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50'
                    : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-50'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isSponsored ? 'Update Status' : 'Mark as Sponsored'}</span>
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white border border-civic-border rounded-xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(11,18,32,0.03)] space-y-8">
                <div>
                  <h2 className="font-display text-xl font-bold text-civic-ink mb-3">
                    Project Description
                  </h2>
                  <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>
                </div>

                <div className="pt-7 border-t border-slate-100">
                  <h2 className="font-display text-xl font-bold text-civic-ink mb-3">
                    Project Objectives
                  </h2>
                  <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                    {project.objectives}
                  </p>
                </div>
              </section>

              {/* Inline Maintainer Status Update Controls */}
              <section
                id="maintainer-access"
                aria-labelledby="maintainer-controls-heading"
                className="bg-white border border-civic-border rounded-xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(11,18,32,0.03)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <KeyRound
                      className="w-5 h-5 text-civic-primary shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <h2
                        id="maintainer-controls-heading"
                        className="font-display text-base font-bold text-civic-ink"
                      >
                        Maintainer Controls — Update Sponsorship Status
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                        {isSponsored
                          ? 'Change sponsorship status, update your confirmation note, or edit listing details with your private management link.'
                          : 'Secured a domain or hosting sponsor? Mark this project as Sponsored using your private management link.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMaintainerOpen((prev) => !prev);
                      setStatusError(null);
                    }}
                    aria-expanded={maintainerOpen}
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-civic-primary bg-white border border-civic-primary/40 hover:border-civic-primary hover:bg-civic-tint/40 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    {maintainerOpen ? 'Close' : isSponsored ? 'Update Status' : 'Mark as Sponsored'}
                  </button>
                </div>

                {maintainerOpen && (
                  <form
                    onSubmit={handleStatusSubmit}
                    noValidate
                    className="mt-6 pt-6 border-t border-slate-100 space-y-5"
                  >
                    {statusSuccess && (
                      <div
                        role="status"
                        className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-center gap-2.5 text-sm text-emerald-900"
                      >
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-700 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{statusSuccess}</span>
                      </div>
                    )}

                    {statusError && (
                      <div
                        role="alert"
                        className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-sm text-red-800"
                      >
                        {statusError}
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="detail-management-token"
                        className="block text-sm font-semibold text-civic-ink mb-1.5"
                      >
                        Private Management Link or Token <span className="text-red-600">*</span>
                      </label>
                      <input
                        id="detail-management-token"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        disabled={updatingStatus}
                        value={tokenInput}
                        onChange={(e) => {
                          setTokenInput(e.target.value);
                          if (statusError) setStatusError(null);
                        }}
                        placeholder="Paste the private management link or token you saved upon submission"
                        className="w-full px-3.5 py-2.5 min-h-11 sm:min-h-0 text-base sm:text-sm font-mono bg-white border border-slate-300 rounded-lg text-civic-ink placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                      />
                    </div>

                    <div>
                      <span className="block text-sm font-semibold text-civic-ink mb-2">
                        Sponsorship Status
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                            targetStatus === SponsorshipStatus.SPONSORED
                              ? 'border-emerald-700 bg-emerald-50/50'
                              : 'border-civic-border hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="detailSponsorshipStatus"
                            value={SponsorshipStatus.SPONSORED}
                            checked={targetStatus === SponsorshipStatus.SPONSORED}
                            onChange={() => {
                              setTargetStatus(SponsorshipStatus.SPONSORED);
                              setStatusSuccess(null);
                            }}
                            disabled={updatingStatus}
                            className="mt-0.5 h-4 w-4 text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                          />
                          <div>
                            <span className="block text-sm font-semibold text-emerald-700">
                              Sponsored
                            </span>
                            <span className="block text-xs text-slate-600 mt-0.5">
                              Sponsorship has been secured for this project.
                            </span>
                          </div>
                        </label>

                        <label
                          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                            targetStatus === SponsorshipStatus.AWAITING
                              ? 'border-civic-primary bg-civic-tint/40'
                              : 'border-civic-border hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="detailSponsorshipStatus"
                            value={SponsorshipStatus.AWAITING}
                            checked={targetStatus === SponsorshipStatus.AWAITING}
                            onChange={() => {
                              setTargetStatus(SponsorshipStatus.AWAITING);
                              setStatusSuccess(null);
                            }}
                            disabled={updatingStatus}
                            className="mt-0.5 h-4 w-4 text-civic-primary focus:ring-civic-primary cursor-pointer"
                          />
                          <div>
                            <span className="block text-sm font-semibold text-amber-700">
                              Awaiting Sponsorship
                            </span>
                            <span className="block text-xs text-slate-600 mt-0.5">
                              Still seeking domain or hosting support.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {targetStatus === SponsorshipStatus.SPONSORED && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="detail-confirmation-note"
                            className="block text-sm font-semibold text-civic-ink"
                          >
                            Public Sponsorship Confirmation Note (Optional)
                          </label>
                          <span className="text-xs text-slate-400 font-mono tabular-nums">
                            {confirmationNote.length}/{FIELD_LIMITS.sponsorshipConfirmationNote.max}
                          </span>
                        </div>
                        <textarea
                          id="detail-confirmation-note"
                          rows={2}
                          disabled={updatingStatus}
                          maxLength={FIELD_LIMITS.sponsorshipConfirmationNote.max}
                          value={confirmationNote}
                          onChange={(e) => {
                            setConfirmationNote(e.target.value);
                            setStatusSuccess(null);
                          }}
                          placeholder="Domain sponsorship secured. Thank you to our sponsor!"
                          className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-300 rounded-lg text-civic-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={updatingStatus}
                        className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap ${
                          targetStatus === SponsorshipStatus.SPONSORED
                            ? 'bg-emerald-700 hover:bg-emerald-800'
                            : 'bg-civic-primary hover:bg-civic-primary-hover'
                        }`}
                      >
                        {updatingStatus ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>
                          {updatingStatus
                            ? 'Updating...'
                            : targetStatus === SponsorshipStatus.SPONSORED
                              ? 'Mark Project as Sponsored'
                              : 'Return to Awaiting Sponsorship'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenFullManagePage}
                        disabled={updatingStatus}
                        className="inline-flex items-center justify-center sm:justify-start gap-1.5 py-2 sm:py-0 text-xs font-semibold text-civic-primary hover:underline cursor-pointer disabled:opacity-60"
                      >
                        <span>Edit Full Project Details</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </div>

            <aside className="lg:col-span-4 space-y-6">
              <section className="bg-white border border-civic-border rounded-xl p-6 shadow-[0_1px_2px_rgba(11,18,32,0.03)]">
                <h2 className="font-display text-base font-bold text-civic-ink pb-3.5 border-b border-slate-100 mb-4">
                  Sponsorship Specifications
                </h2>

                <dl className="divide-y divide-slate-100 text-sm">
                  <div className="py-3 first:pt-0">
                    <dt className="text-xs text-slate-500 mb-0.5">Sponsorship Requirement</dt>
                    <dd className="font-semibold text-civic-ink">{project.sponsorshipType}</dd>
                  </div>

                  <div className="py-3">
                    <dt className="text-xs text-slate-500 mb-0.5">Preferred Domain</dt>
                    <dd className="font-mono font-medium text-civic-primary break-all">
                      {project.preferredDomain}
                    </dd>
                  </div>

                  <div className="py-3">
                    <dt className="text-xs text-slate-500 mb-0.5">Temporary Deployment</dt>
                    <dd className="break-all">
                      {safeTempUrl ? (
                        <a
                          href={safeTempUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-civic-primary hover:underline font-medium"
                        >
                          {safeTempUrl}
                        </a>
                      ) : (
                        <span className="text-slate-500">Unavailable</span>
                      )}
                    </dd>
                  </div>

                  <div className="py-3">
                    <dt className="text-xs text-slate-500 mb-0.5">GitHub Repository</dt>
                    <dd className="break-all">
                      {safeRepoUrl ? (
                        <a
                          href={safeRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-civic-primary hover:underline font-medium"
                        >
                          {safeRepoUrl}
                        </a>
                      ) : (
                        <span className="text-slate-500">Unavailable</span>
                      )}
                    </dd>
                  </div>

                  <div className="py-3">
                    <dt className="text-xs text-slate-500 mb-0.5">Submitted</dt>
                    <dd className="text-slate-800 tabular-nums">
                      {formatDisplayDate(project.submittedAt)}
                    </dd>
                  </div>

                  <div className="py-3 last:pb-0">
                    <dt className="text-xs text-slate-500 mb-0.5">Last Updated</dt>
                    <dd className="text-slate-800 tabular-nums">
                      {formatDisplayDate(project.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="bg-white border border-civic-border rounded-xl p-6 shadow-[0_1px_2px_rgba(11,18,32,0.03)]">
                <h2 className="font-display text-base font-bold text-civic-ink pb-3.5 border-b border-slate-100 mb-4">
                  Maintainer Contact
                </h2>

                <dl className="space-y-3.5 text-sm mb-6">
                  <div>
                    <dt className="text-xs text-slate-500 mb-0.5">Maintainer</dt>
                    <dd className="font-semibold text-civic-ink">{project.maintainerName}</dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500 mb-0.5">Email Address</dt>
                    <dd className="break-all">
                      <a
                        href={mailtoHref}
                        className="text-civic-primary hover:underline font-medium"
                      >
                        {project.maintainerEmail}
                      </a>
                    </dd>
                  </div>

                  {safeContactUrl && (
                    <div>
                      <dt className="text-xs text-slate-500 mb-0.5">Preferred Contact Channel</dt>
                      <dd className="break-all">
                        <a
                          href={safeContactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-civic-primary hover:underline font-medium"
                        >
                          {safeContactUrl}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="space-y-2.5">
                  <a
                    href={mailtoHref}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" aria-hidden="true" />
                    <span>Send Sponsorship Inquiry</span>
                  </a>

                  {safeContactUrl && (
                    <a
                      href={safeContactUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-civic-ink bg-white border border-slate-300 hover:border-civic-primary hover:text-civic-primary rounded-lg transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" aria-hidden="true" />
                      <span>Open Preferred Contact Link</span>
                    </a>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
