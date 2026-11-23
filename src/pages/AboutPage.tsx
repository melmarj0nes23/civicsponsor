import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlusCircle } from 'lucide-react';

const PRINCIPLES = [
  {
    number: '01',
    title: 'Open Participation',
    body: 'No accounts, logins, or gatekeeping queues. Any independent builder working on a Philippine LGU civic tool can publish directly to the directory.',
  },
  {
    number: '02',
    title: 'Direct Community Support',
    body: 'Sponsors review live deployments and source repositories, then contact maintainers directly to cover domain registration or hosting.',
  },
  {
    number: '03',
    title: 'Maintainer Autonomy',
    body: 'Each submission issues a private, cryptographically generated management link so maintainers can update project details and sponsorship status on their own.',
  },
  {
    number: '04',
    title: 'Transparent Public Record',
    body: 'Both projects awaiting sponsorship and projects that have already secured support remain publicly visible to celebrate and sustain local civic innovation.',
  },
];

export function AboutPage() {
  useEffect(() => {
    document.title = 'About — BetterLGU Civic Sponsorship';
  }, []);

  return (
    <div>
      {/* Mission Hero Band */}
      <section className="bg-white border-b border-civic-border py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-semibold text-civic-primary">
                About CivicSponsor · Inspired by BetterGovPH &amp; BetterLGU
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-civic-ink leading-[1.15]">
                Sustaining community-built civic technology across the Philippines.
              </h1>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4 text-base text-slate-600 leading-relaxed">
                <p>
                  CivicSponsor is a community-driven initiative that helps independent civic
                  technology builders connect with potential sponsors.
                </p>
                <p>
                  Across the Philippines, developers and volunteers are creating digital tools that
                  make local governance more transparent, accessible, and accountable.
                </p>
                <p>
                  However, building a useful civic technology project is only part of the challenge.
                  Keeping it online through a proper domain name and reliable hosting also requires
                  resources.
                </p>
                <p>
                  CivicSponsor aims to bridge that gap by providing a centralized directory where
                  civic tech builders can showcase their work and connect directly with individuals
                  and organizations willing to support their projects.
                </p>
                <p className="font-semibold text-civic-ink">
                  We believe that good civic technology deserves to be accessible, sustainable, and
                  supported by the communities it serves.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 pt-2">
                <Link
                  to="/projects"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg shadow-[0_1px_2px_rgba(0,56,168,0.2)] transition-colors"
                >
                  <span>Explore Projects</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 min-h-11 sm:min-h-0 text-sm font-semibold text-civic-ink bg-white border border-slate-300 hover:border-civic-primary hover:text-civic-primary rounded-lg transition-colors"
                >
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Submit a Project</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section
        aria-labelledby="principles-heading"
        className="bg-civic-surface border-b border-civic-border py-16 sm:py-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-civic-primary mb-2">Core Principles</p>
          <h2
            id="principles-heading"
            className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-civic-ink mb-10"
          >
            How the Directory Operates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PRINCIPLES.map((item) => (
              <div key={item.number} className="border-t-2 border-civic-primary/25 pt-5 space-y-2.5">
                <span className="font-mono text-xs font-semibold text-civic-primary block">
                  {item.number}
                </span>
                <h3 className="font-display text-base font-bold text-civic-ink">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Independence Disclaimer */}
      <section aria-labelledby="disclaimer-heading" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-civic-surface border border-civic-border rounded-xl p-6 sm:p-8">
            <h2
              id="disclaimer-heading"
              className="font-display text-lg font-bold text-civic-ink mb-3"
            >
              Platform Independence &amp; Disclaimer
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-4xl">
              CivicSponsor is an independent community-driven directory. Listing a project does not
              imply official endorsement by the corresponding LGU, BetterGovPH, or any other
              organization. Sponsorship arrangements are made directly between maintainers and
              sponsors. CivicSponsor does not process payments or act as a financial intermediary.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
