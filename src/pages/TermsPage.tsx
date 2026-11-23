import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo.ts';
import { SITE_NAME, buildBreadcrumbJsonLd } from '../lib/seo.ts';

export function TermsPage() {
  const termsJsonLd = useMemo(
    () =>
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Terms of Use', path: '/terms' },
      ]),
    [],
  );

  useSeo({
    title: `Terms of Use — ${SITE_NAME}`,
    description:
      'Review the Terms of Use for BetterLGU CivicSponsor, covering open directory participation, maintainer responsibilities, and direct sponsor coordination.',
    path: '/terms',
    jsonLd: termsJsonLd,
  });

  return (
    <div>
      <header className="bg-white border-b border-civic-border py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-civic-primary mb-2">Legal</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-civic-ink mb-2">
            Terms of Use
          </h1>
          <p className="text-xs text-slate-500">
            Effective Date: November 2026 · BetterLGU CivicSponsor
          </p>
        </div>
      </header>

      <div className="bg-civic-surface py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="bg-white border border-civic-border rounded-xl p-6 sm:p-10 shadow-[0_1px_2px_rgba(11,18,32,0.03)] space-y-8">
            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                1. Nature of the Directory
              </h2>
              <p>
                BetterLGU Civic Sponsorship (CivicSponsor) is an independent, open, community-driven
                directory. Listing a project does not imply official endorsement, affiliation, or
                verification by any Local Government Unit (LGU), BetterGovPH, BetterLGU, or any
                other organization.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                2. No Financial Intermediation or Guarantees
              </h2>
              <p>
                CivicSponsor does not collect donations, process payments, hold funds in escrow, or
                act as a financial intermediary. All sponsorship agreements—including domain
                registration, DNS stewardship, and hosting payments—are arranged directly between
                project maintainers and sponsors. Listing a project does not guarantee that
                sponsorship will be secured.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                3. Maintainer Responsibilities
              </h2>
              <p>
                By submitting a project, you represent that you are the project maintainer or an
                authorized representative, that all submitted URLs and project details are accurate
                and lawful, and that the project is a genuine civic technology initiative built for
                the public interest. You are solely responsible for safeguarding your private
                project management link and promptly updating your listing status once sponsorship
                is secured.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                4. Sponsor Due Diligence
              </h2>
              <p>
                Prospective sponsors are encouraged to review each project&apos;s live deployment,
                open-source GitHub repository, and maintainer credentials directly before providing
                infrastructure support or registering domain names.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                5. Prohibited Use
              </h2>
              <p>
                You agree not to submit fraudulent listings, malicious links, spam, defamatory
                content, or automated bulk requests aimed at disrupting the directory.
              </p>
            </section>

            <div className="pt-6 border-t border-civic-border text-sm">
              <Link to="/privacy" className="text-civic-primary font-semibold hover:underline">
                Read Privacy Policy
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
