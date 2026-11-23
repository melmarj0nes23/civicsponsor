import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useSeo.ts';
import { SITE_NAME, buildBreadcrumbJsonLd } from '../lib/seo.ts';

export function PrivacyPage() {
  const privacyJsonLd = useMemo(
    () =>
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Privacy Policy', path: '/privacy' },
      ]),
    [],
  );

  useSeo({
    title: `Privacy Policy — ${SITE_NAME}`,
    description:
      'Read how BetterLGU CivicSponsor handles public project submissions, private management link security, and abuse prevention with zero user tracking accounts.',
    path: '/privacy',
    jsonLd: privacyJsonLd,
  });

  return (
    <div>
      <header className="bg-white border-b border-civic-border py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-civic-primary mb-2">Legal</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-civic-ink mb-2">
            Privacy Policy
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
                1. No Accounts or Tracking Profiles
              </h2>
              <p>
                BetterLGU Civic Sponsorship does not require user accounts, logins, or personal
                profiles to browse projects or submit a listing. We do not sell, rent, or trade
                visitor or maintainer information to third parties.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                2. Publicly Published Project Information
              </h2>
              <p>
                When you submit a civic technology project, all fields in the Project Information
                and Maintainer Information sections—including your preferred public name, contact
                email address, and preferred contact link—are published openly in the public
                directory so potential sponsors can verify your work and contact you directly.
              </p>
              <p>
                We recommend using a dedicated project or public-facing email address and contact
                link that you are comfortable sharing openly.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                3. Private Management Link Security
              </h2>
              <p>
                Upon submission, the server generates a cryptographically random private management
                token and displays the resulting link to you once. Only cryptographic SHA-256 hashes
                of the token are stored in Firestore in a non-readable private collection. Raw
                tokens are never stored in the database and are never exposed in public project
                records or API responses.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                4. Abuse Prevention &amp; Rate Limiting
              </h2>
              <p>
                To protect the open directory from automated spam and abuse, server endpoints apply
                temporary in-memory IP rate limiting and input sanitization. Rate-limit counters are
                transient and are not linked to published project records.
              </p>
            </section>

            <section className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
              <h2 className="font-display text-lg font-bold text-civic-ink">
                5. Updating Your Information
              </h2>
              <p>
                You may update your project details, contact email, contact links, or sponsorship
                status at any time using the private management link issued when you published your
                project.
              </p>
            </section>

            <div className="pt-6 border-t border-civic-border text-sm">
              <Link to="/terms" className="text-civic-primary font-semibold hover:underline">
                Read Terms of Use
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
