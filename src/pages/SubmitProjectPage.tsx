import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { ProjectFormFields, type ProjectFormValues } from '../components/ProjectFormFields.tsx';
import { useSeo } from '../hooks/useSeo.ts';
import { SITE_NAME, buildBreadcrumbJsonLd } from '../lib/seo.ts';
import { validateProjectSubmission } from '../lib/validation.ts';
import {
  SponsorshipType,
  type SubmissionConfirmation,
} from '../types/project.ts';

const INITIAL_VALUES: ProjectFormValues = {
  projectName: '',
  lguName: '',
  province: '',
  description: '',
  temporaryUrl: '',
  repositoryUrl: '',
  sponsorshipType: SponsorshipType.BOTH,
  preferredDomain: '',
  maintainerName: '',
  maintainerEmail: '',
  maintainerContactLink: '',
};

export function SubmitProjectPage() {
  const [values, setValues] = useState<ProjectFormValues>(INITIAL_VALUES);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<SubmissionConfirmation | null>(null);
  const [copiedKey, setCopiedKey] = useState<'public' | 'manage' | null>(null);

  const submitJsonLd = useMemo(
    () =>
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Submit a Project', path: '/submit' },
      ]),
    [],
  );

  useSeo({
    title: `Submit a Civic Tech Project — ${SITE_NAME}`,
    description:
      'Publish your Philippine LGU civic technology project directly to BetterLGU CivicSponsor for domain or hosting sponsorship—no account or approval queue required.',
    path: '/submit',
    jsonLd: submitJsonLd,
  });

  const handleFieldChange = <K extends keyof ProjectFormValues>(
    field: K,
    value: ProjectFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleCopy = async (text: string, target: 'public' | 'manage') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(target);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);

    const validation = validateProjectSubmission({
      ...values,
      consentAccepted,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.getElementById(firstErrorField);
      element?.focus();
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          consentAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          setFieldErrors(data.fieldErrors);
        }
        setServerError(data.error || 'Submission failed. Please check your details and try again.');
        setSubmitting(false);
        return;
      }

      setConfirmation(data as SubmissionConfirmation);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setServerError('Network error while publishing your project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullPublicUrl = `${origin}${confirmation.publicPath}`;
    const fullManageUrl = `${origin}${confirmation.managementPath}`;

    return (
      <div className="bg-civic-surface py-12 lg:py-16 min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-civic-border rounded-xl p-6 sm:p-10 shadow-[0_1px_3px_rgba(11,18,32,0.04)] space-y-8">
            <div className="flex items-start gap-4 pb-6 border-b border-civic-border">
              <CheckCircle2
                className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-civic-ink mb-2">
                  Project Published to Directory
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Your civic technology project is now live in the BetterLGU Civic Sponsorship
                  directory and visible to potential sponsors immediately.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <dt className="text-xs text-slate-500 mb-1">Project Name</dt>
                <dd className="font-bold text-civic-ink text-base">{confirmation.projectName}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 mb-1">Project Reference ID</dt>
                <dd className="font-mono font-semibold text-civic-primary text-base">
                  {confirmation.projectId}
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Public Project URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullPublicUrl}
                  aria-label="Public Project URL"
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-civic-surface border border-slate-300 rounded-lg text-civic-ink"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(fullPublicUrl, 'public')}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copiedKey === 'public' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="w-5 h-5 text-amber-800 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <h2 className="font-display text-base font-bold text-amber-950">
                    Save Your Private Project Management Link Now
                  </h2>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    This private link is shown only once. Because CivicSponsor does not use accounts
                    or logins, this link is your sole way to edit project details or update your
                    status to <strong>Sponsored</strong>. Keep it confidential—anyone with this link
                    can manage your listing.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullManageUrl}
                  aria-label="Private Project Management Link"
                  className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm font-mono bg-white border border-amber-300 rounded-lg text-civic-ink"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(fullManageUrl, 'manage')}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {copiedKey === 'manage' ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>Copy Private Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <Link
                to={confirmation.publicPath}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors"
              >
                <span>View Public Listing</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                to={confirmation.managementPath}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-civic-ink bg-white border border-slate-300 hover:border-civic-primary hover:text-civic-primary rounded-lg transition-colors"
              >
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                <span>Open Management Page</span>
              </Link>

              <Link
                to="/projects"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-civic-ink transition-colors"
              >
                <span>Browse Directory</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-white border-b border-civic-border py-12 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-civic-primary mb-2">Open Publication</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-civic-ink mb-3">
            Submit a Civic Tech Project
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            No account or approval queue required. Complete the fields below and your project will
            publish immediately to the public directory with a private management link for future
            updates.
          </p>
        </div>
      </section>

      <div className="bg-civic-surface py-10 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white border border-civic-border rounded-xl p-6 sm:p-10 shadow-[0_1px_3px_rgba(11,18,32,0.04)] space-y-12"
          >
            {serverError && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800"
              >
                {serverError}
              </div>
            )}

            <ProjectFormFields
              values={values}
              errors={fieldErrors}
              onChange={handleFieldChange}
              disabled={submitting}
            />

            <section aria-labelledby="section-consent" className="space-y-4">
              <div className="pb-4 border-b border-civic-border">
                <p className="font-mono text-xs font-semibold text-civic-primary mb-1">03</p>
                <h2 id="section-consent" className="font-display text-xl font-bold text-civic-ink">
                  Submission Consent
                </h2>
              </div>

              <div
                className={`rounded-xl border p-5 ${
                  fieldErrors.consentAccepted
                    ? 'border-red-400 bg-red-50/40'
                    : 'border-civic-border bg-civic-surface'
                }`}
              >
                <label
                  htmlFor="consentAccepted"
                  className="flex items-start gap-3.5 cursor-pointer select-none"
                >
                  <input
                    id="consentAccepted"
                    name="consentAccepted"
                    type="checkbox"
                    checked={consentAccepted}
                    disabled={submitting}
                    onChange={(e) => {
                      setConsentAccepted(e.target.checked);
                      if (fieldErrors.consentAccepted) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.consentAccepted;
                          return next;
                        });
                      }
                    }}
                    aria-invalid={Boolean(fieldErrors.consentAccepted)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-civic-primary focus:ring-civic-primary cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-slate-700 leading-relaxed space-y-2">
                    <span className="font-semibold text-civic-ink block">
                      By submitting this project, I confirm and agree to all of the following:
                    </span>
                    <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
                      <li>
                        I am the project maintainer or an authorized representative of this civic
                        technology project.
                      </li>
                      <li>All project and contact information submitted is accurate.</li>
                      <li>
                        I authorize BetterLGU Civic Sponsorship (CivicSponsor) to publicly display
                        the submitted project information.
                      </li>
                      <li>
                        I understand that my maintainer name, email address, and preferred contact
                        link will be publicly visible to potential sponsors.
                      </li>
                      <li>
                        I understand that CivicSponsor is an open directory and does not guarantee
                        sponsorship or process payments.
                      </li>
                      <li>
                        I agree to the platform&apos;s{' '}
                        <Link to="/terms" className="text-civic-primary font-semibold underline">
                          Terms of Use
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-civic-primary font-semibold underline">
                          Privacy Policy
                        </Link>
                        .
                      </li>
                    </ul>
                  </span>
                </label>
                {fieldErrors.consentAccepted && (
                  <p className="text-xs text-red-700 mt-3">{fieldErrors.consentAccepted}</p>
                )}
              </div>
            </section>

            <div className="pt-6 border-t border-civic-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Status is automatically set to <strong>Awaiting Sponsorship</strong> upon
                publication.
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 min-h-12 sm:min-h-0 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover disabled:opacity-60 rounded-lg shadow-[0_1px_2px_rgba(0,56,168,0.2)] transition-colors cursor-pointer whitespace-nowrap"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>{submitting ? 'Publishing Project...' : 'Submit Project'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
