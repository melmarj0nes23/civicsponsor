import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { extractManagementToken } from '../lib/validation.ts';

export function ManageAccessPage() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    document.title = 'Manage a Listing — BetterLGU Civic Sponsorship';
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const token = extractManagementToken(tokenInput);
    if (!token || token.length < 32) {
      setError(
        'Please paste the complete private management link or token you received after submitting your project.',
      );
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(`/api/manage/${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok || !data.project) {
        setError(
          data.error ||
            'We could not match that link or token to any project listing. Please double-check and try again.',
        );
        setVerifying(false);
        return;
      }

      navigate(`/manage/${encodeURIComponent(token)}`);
    } catch {
      setError('Network error while verifying your private management link. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <div>
      <section className="bg-white border-b border-civic-border py-12 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-civic-primary mb-2">Maintainer Access</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-civic-ink mb-3">
            Update Sponsorship Status or Edit a Listing
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Paste the private management link or token generated when you submitted your project to
            mark it as <strong>Sponsored</strong> or update listing details—no login required.
          </p>
        </div>
      </section>

      <div className="bg-civic-surface py-12 lg:py-16 min-h-[55vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white border border-civic-border rounded-xl p-6 sm:p-10 shadow-[0_1px_3px_rgba(11,18,32,0.04)] space-y-6"
          >
            <div className="space-y-2">
              <label
                htmlFor="management-token-input"
                className="block text-sm font-semibold text-civic-ink"
              >
                Private Management Link or Token <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <KeyRound
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="management-token-input"
                  name="managementToken"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={verifying}
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste https://.../manage/your-token or just the private token"
                  className="w-full pl-10 pr-4 py-3 min-h-12 sm:min-h-0 text-base sm:text-sm font-mono bg-white border border-slate-300 rounded-lg text-civic-ink placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                You can paste either the full management URL or only the secret token string at the
                end of the link.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 rounded-lg p-3.5 text-sm text-red-800"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3.5 sm:gap-4 pt-2">
              <button
                type="submit"
                disabled={verifying}
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 min-h-12 sm:min-h-0 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover disabled:opacity-60 rounded-lg shadow-[0_1px_2px_rgba(0,56,168,0.2)] transition-colors cursor-pointer whitespace-nowrap"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{verifying ? 'Verifying Link...' : 'Open Management Page'}</span>
              </button>

              <Link
                to="/projects"
                className="text-center sm:text-left text-sm font-medium text-slate-600 hover:text-civic-primary transition-colors py-1"
              >
                Browse Public Directory
              </Link>
            </div>
          </form>

          <section className="bg-white border border-civic-border rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-civic-ink">
              <ShieldCheck className="w-5 h-5 text-civic-primary shrink-0" aria-hidden="true" />
              <h2 className="font-display text-base font-bold">
                How private project management works
              </h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 leading-relaxed list-disc pl-5">
              <li>
                Whenever you publish a project on BetterLGU Civic Sponsorship, a unique private
                management link is generated immediately on your confirmation screen.
              </li>
              <li>
                Only the holder of that link can change a project&apos;s status from{' '}
                <strong>Awaiting Sponsorship</strong> to <strong>Sponsored</strong> or edit its
                listing details.
              </li>
              <li>
                You can also update a project&apos;s sponsorship status directly from its public
                project page using the <strong>Update Status</strong> option.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
