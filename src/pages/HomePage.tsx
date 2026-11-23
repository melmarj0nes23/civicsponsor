import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { CivicImage } from '../components/CivicImage.tsx';
import {
  ProjectAccordionList,
  ProjectAccordionSkeleton,
} from '../components/ProjectAccordionList.tsx';
import { useProjects } from '../hooks/useProjects.ts';

const HERO_LOGO_PATH = '/src/assets/images/bettergov-primary.png';

const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Build',
    description:
      'Independent developers and volunteers build open civic tools that make local government data and services more accessible.',
  },
  {
    number: '02',
    title: 'Submit',
    description:
      'Maintainers publish directly to the directory with zero account registration or moderation wait times.',
  },
  {
    number: '03',
    title: 'Discover',
    description:
      'Potential sponsors filter projects by province, LGU, or infrastructure need to find initiatives worth backing.',
  },
  {
    number: '04',
    title: 'Connect',
    description:
      'Sponsors review the live deployment and source code, then reach out directly to coordinate domain or hosting support.',
  },
  {
    number: '05',
    title: 'Support',
    description:
      'Once sponsorship is secured, maintainers mark their project as Sponsored via their private management link.',
  },
];

export function HomePage() {
  const { projects, stats, loading, error } = useProjects();
  const recentProjects = projects.slice(0, 6);

  useEffect(() => {
    document.title = 'BetterLGU Civic Sponsorship — Open Civic Tech Directory';
  }, []);

  return (
    <div>
      {/* Editorial Civic Hero */}
      <section className="relative bg-white border-b border-civic-border overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 civic-dot-grid [mask-image:radial-gradient(ellipse_70%_70%_at_50%_30%,#000_25%,transparent_100%)]"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-20 sm:pb-24 text-center">
          <div className="mb-6 sm:mb-8 flex justify-center">
            <CivicImage
              src={HERO_LOGO_PATH}
              alt="BetterGov.PH primary logo"
              fallbackTitle="BetterGov.PH"
              className="h-11 sm:h-16 w-auto object-contain"
            />
          </div>

          <p className="text-xs font-semibold tracking-wide text-civic-primary mb-3 sm:mb-4">
            Open Philippine Civic Technology Sponsorship Directory
          </p>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-[-0.03em] text-civic-ink leading-[1.12] sm:leading-[1.08] mb-5 sm:mb-6">
            Great civic tech projects deserve a domain of their own.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
            CivicSponsor connects community-built civic technology projects with people willing to
            help them secure the domains and infrastructure they need to serve their communities.
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-3.5 max-w-sm sm:max-w-none mx-auto">
            <Link
              to="/projects"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-12 sm:min-h-0 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg shadow-[0_1px_3px_rgba(0,56,168,0.25)] transition-colors duration-150 whitespace-nowrap"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              to="/submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-12 sm:min-h-0 text-sm font-semibold text-civic-ink bg-white border border-slate-300 hover:border-civic-primary hover:text-civic-primary rounded-lg transition-colors duration-150 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              <span>Submit a Project</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Real-Time Architectural KPI Strip */}
      <section aria-label="Live directory statistics" className="bg-civic-surface border-b border-civic-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-civic-border">
            <div className="py-5 sm:py-9 pr-3 sm:px-6 lg:first:pl-0 border-b border-r border-civic-border lg:border-b-0 lg:border-r-0">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Total Projects Listed</p>
              <p className="font-mono tabular-nums text-2xl sm:text-4xl font-semibold tracking-tight text-civic-ink">
                {loading ? '—' : stats.totalProjects}
              </p>
            </div>

            <div className="py-5 sm:py-9 pl-4 sm:px-6 border-b border-civic-border lg:border-b-0">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Awaiting Sponsorship</p>
              <p className="font-mono tabular-nums text-2xl sm:text-4xl font-semibold tracking-tight text-amber-700">
                {loading ? '—' : stats.awaitingSponsorship}
              </p>
            </div>

            <div className="py-5 sm:py-9 pr-3 sm:px-6 border-r border-civic-border lg:border-r-0">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Sponsored Projects</p>
              <p className="font-mono tabular-nums text-2xl sm:text-4xl font-semibold tracking-tight text-emerald-700">
                {loading ? '—' : stats.sponsoredProjects}
              </p>
            </div>

            <div className="py-5 sm:py-9 pl-4 sm:px-6">
              <p className="text-xs font-medium text-slate-500 mb-1.5">LGUs Represented</p>
              <p className="font-mono tabular-nums text-2xl sm:text-4xl font-semibold tracking-tight text-civic-primary">
                {loading ? '—' : stats.lgusRepresented}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Submitted Projects */}
      <section aria-labelledby="recent-projects-heading" className="bg-white border-b border-civic-border py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-civic-primary mb-2">Live Directory</p>
              <h2
                id="recent-projects-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-civic-ink"
              >
                Recently Submitted Projects
              </h2>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-civic-primary hover:text-civic-primary-hover transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>View Complete Directory</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {loading ? (
            <ProjectAccordionSkeleton rows={3} />
          ) : recentProjects.length === 0 ? (
            <div className="bg-civic-surface border border-civic-border rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
              <h3 className="font-display text-lg font-bold text-civic-ink mb-2">
                No civic tech projects listed yet
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Be the first maintainer to list an open civic technology project built for a
                Philippine LGU. Valid submissions publish immediately without creating an account.
              </p>
              <Link
                to="/submit"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 sm:py-2.5 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>Submit the First Project</span>
              </Link>
            </div>
          ) : (
            <ProjectAccordionList projects={recentProjects} defaultExpandedFirst />
          )}
        </div>
      </section>

      {/* How It Works */}
      <section aria-labelledby="how-it-works-heading" className="bg-civic-surface py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-9 sm:mb-12">
            <p className="text-xs font-semibold text-civic-primary mb-2">Open Process</p>
            <h2
              id="how-it-works-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-civic-ink mb-3"
            >
              How BetterLGU Civic Sponsorship Works
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Designed for zero gatekeeping. Community builders publish directly and sponsors
              coordinate infrastructure support without intermediaries.
            </p>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <li
                key={step.number}
                className="border-t-2 border-civic-primary/25 pt-4 sm:pt-5 space-y-2 sm:space-y-2.5"
              >
                <span className="font-mono text-xs font-semibold text-civic-primary block">
                  {step.number}
                </span>
                <h3 className="font-display text-base font-bold text-civic-ink">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
