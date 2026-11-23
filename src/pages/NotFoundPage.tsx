import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSeo } from '../hooks/useSeo.ts';
import { SITE_NAME } from '../lib/seo.ts';

export function NotFoundPage() {
  const { pathname } = useLocation();

  useSeo({
    title: `Page Not Found — ${SITE_NAME}`,
    description: 'The requested page could not be found on BetterLGU CivicSponsor.',
    path: pathname,
    noIndex: true,
  });

  return (
    <div className="bg-civic-surface py-24 min-h-[65vh]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white border border-civic-border rounded-xl p-10 space-y-4">
          <p className="font-mono text-xs font-semibold text-civic-primary">404</p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-civic-ink">
            Page not found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you are looking for does not exist or may have moved.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
