import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import {
  ProjectAccordionList,
  ProjectAccordionSkeleton,
} from '../components/ProjectAccordionList.tsx';
import { useProjects } from '../hooks/useProjects.ts';
import {
  PHILIPPINE_PROVINCES,
  SPONSORSHIP_TYPE_OPTIONS,
  SponsorshipStatus,
} from '../types/project.ts';

type SortOption = 'recent' | 'oldest' | 'awaiting-first' | 'sponsored-first';
type StatusFilter = 'all' | SponsorshipStatus;

export function DirectoryPage() {
  const { projects, loading, error } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  useEffect(() => {
    document.title = 'Project Directory — BetterLGU Civic Sponsorship';
  }, []);

  const availableProvinces = useMemo(() => {
    const set = new Set<string>(PHILIPPINE_PROVINCES);
    for (const p of projects) {
      if (p.province.trim()) {
        set.add(p.province.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matched = projects.filter((project) => {
      if (statusFilter !== 'all' && project.sponsorshipStatus !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'all' && project.sponsorshipType !== typeFilter) {
        return false;
      }
      if (
        provinceFilter !== 'all' &&
        project.province.toLowerCase() !== provinceFilter.toLowerCase()
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          project.projectName,
          project.lguName,
          project.province,
          project.maintainerName,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...matched];
    sorted.sort((a, b) => {
      const timeA = a.submittedAt ? Date.parse(a.submittedAt) : 0;
      const timeB = b.submittedAt ? Date.parse(b.submittedAt) : 0;

      if (sortBy === 'oldest') {
        return timeA - timeB;
      }
      if (sortBy === 'awaiting-first') {
        if (a.sponsorshipStatus !== b.sponsorshipStatus) {
          return a.sponsorshipStatus === SponsorshipStatus.AWAITING ? -1 : 1;
        }
        return timeB - timeA;
      }
      if (sortBy === 'sponsored-first') {
        if (a.sponsorshipStatus !== b.sponsorshipStatus) {
          return a.sponsorshipStatus === SponsorshipStatus.SPONSORED ? -1 : 1;
        }
        return timeB - timeA;
      }
      return timeB - timeA;
    });

    return sorted;
  }, [projects, searchQuery, statusFilter, typeFilter, provinceFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    provinceFilter !== 'all' ||
    sortBy !== 'recent';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setProvinceFilter('all');
    setSortBy('recent');
  };

  return (
    <div>
      {/* Editorial Header Band */}
      <section className="bg-white border-b border-civic-border py-9 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-civic-primary mb-2">Open Civic Registry</p>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-civic-ink mb-2.5">
            Public Project Directory
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Explore independent civic technology projects built for Philippine Local Government
            Units. Both projects awaiting sponsorship and sponsored projects remain permanently
            visible.
          </p>
        </div>
      </section>

      {/* Directory Workspace */}
      <div className="bg-civic-surface py-10 sm:py-12 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search & Filter Toolbar */}
          <section
            aria-label="Search and filter projects"
            className="bg-white border border-civic-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-[0_1px_2px_rgba(11,18,32,0.03)] space-y-4 sm:space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5">
              <div className="sm:col-span-2 lg:col-span-5">
                <label htmlFor="directory-search" className="sr-only">
                  Search by project name, LGU, province, or maintainer
                </label>
                <div className="relative">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="directory-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search project, LGU, province, or maintainer..."
                    className="w-full pl-10 pr-4 py-2.5 min-h-11 sm:min-h-0 text-base sm:text-sm bg-white border border-slate-300 rounded-lg text-civic-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label htmlFor="filter-type" className="sr-only">
                  Filter by sponsorship type
                </label>
                <select
                  id="filter-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-11 sm:min-h-0 text-base sm:text-sm bg-white border border-slate-300 rounded-lg text-civic-ink focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                >
                  <option value="all">All Sponsorship Types</option>
                  {SPONSORSHIP_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <label htmlFor="filter-province" className="sr-only">
                  Filter by province
                </label>
                <select
                  id="filter-province"
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-11 sm:min-h-0 text-base sm:text-sm bg-white border border-slate-300 rounded-lg text-civic-ink focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                >
                  <option value="all">All Provinces</option>
                  {availableProvinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label htmlFor="sort-projects" className="sr-only">
                  Sort projects
                </label>
                <select
                  id="sort-projects"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3.5 py-2.5 min-h-11 sm:min-h-0 text-base sm:text-sm bg-white border border-slate-300 rounded-lg text-civic-ink focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary"
                >
                  <option value="recent">Recently submitted</option>
                  <option value="oldest">Oldest submitted</option>
                  <option value="awaiting-first">Awaiting sponsorship first</option>
                  <option value="sponsored-first">Sponsored projects</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pt-4 border-t border-slate-100">
              <div
                role="group"
                aria-label="Filter by sponsorship status"
                className="flex flex-wrap sm:inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto"
              >
                {(
                  [
                    { value: 'all', label: 'All Statuses' },
                    { value: SponsorshipStatus.AWAITING, label: 'Awaiting Sponsorship' },
                    { value: SponsorshipStatus.SPONSORED, label: 'Sponsored' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`flex-1 sm:flex-none px-3 sm:px-3.5 py-2 sm:py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer text-center ${
                      statusFilter === option.value
                        ? 'bg-white text-civic-primary shadow-xs'
                        : 'text-slate-600 hover:text-civic-ink'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="tabular-nums">
                  Showing <strong className="text-civic-ink">{filteredProjects.length}</strong> of{' '}
                  <strong className="text-civic-ink">{projects.length}</strong>{' '}
                  {projects.length === 1 ? 'project' : 'projects'}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 font-semibold text-civic-primary hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-800 mb-8"
            >
              {error}
            </div>
          )}

          {loading ? (
            <ProjectAccordionSkeleton rows={5} />
          ) : filteredProjects.length === 0 ? (
            <div className="bg-white border border-civic-border rounded-xl p-12 text-center max-w-xl mx-auto">
              <h2 className="font-display text-lg font-bold text-civic-ink mb-2">
                {projects.length === 0 ? 'No projects published yet' : 'No matching projects found'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {projects.length === 0
                  ? 'Use the Submit a Project button in the header to publish a civic technology project built for a Philippine LGU.'
                  : 'Try broadening your search terms or clearing one of the active filters.'}
              </p>
              {projects.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-civic-primary bg-white border border-slate-300 hover:border-civic-primary rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            <ProjectAccordionList projects={filteredProjects} />
          )}
        </div>
      </div>
    </div>
  );
}
