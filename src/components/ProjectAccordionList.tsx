import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  GitBranch,
  Mail,
} from 'lucide-react';
import {
  buildMailtoHref,
  formatDisplayDate,
  isSafeHttpUrl,
} from '../lib/validation.ts';
import { type ProjectRecord } from '../types/project.ts';
import { StatusLabel } from './StatusLabel.tsx';

interface ProjectAccordionListProps {
  projects: ProjectRecord[];
  defaultExpandedFirst?: boolean;
}

export function ProjectAccordionList({
  projects,
  defaultExpandedFirst = false,
}: ProjectAccordionListProps) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(() => {
    if (defaultExpandedFirst && projects.length > 0) {
      return { [projects[0].projectId]: true };
    }
    return {};
  });

  const toggleRow = (projectId: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const allExpanded =
    projects.length > 0 && projects.every((project) => Boolean(expandedIds[project.projectId]));

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const project of projects) {
      next[project.projectId] = true;
    }
    setExpandedIds(next);
  };

  return (
    <div className="bg-white border border-civic-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(11,18,32,0.03)]">
      {/* Desktop Column Header Bar */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center px-6 py-3 bg-civic-surface border-b border-civic-border text-xs font-semibold text-slate-500">
        <div className="col-span-4">Project &amp; LGU</div>
        <div className="col-span-2">Sponsorship Need</div>
        <div className="col-span-2">Preferred Domain</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 flex items-center justify-end gap-3">
          <span>Submitted</span>
          {projects.length > 1 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-civic-primary hover:underline font-semibold cursor-pointer whitespace-nowrap"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Header Strip */}
      {projects.length > 1 && (
        <div className="lg:hidden flex items-center justify-between px-5 py-2.5 bg-civic-surface border-b border-civic-border text-xs text-slate-500">
          <span className="font-semibold">Tap any project to expand details</span>
          <button
            type="button"
            onClick={toggleAll}
            className="text-civic-primary font-semibold hover:underline cursor-pointer"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      )}

      {/* Accordion Rows */}
      <div className="divide-y divide-civic-border">
        {projects.map((project) => {
          const isOpen = Boolean(expandedIds[project.projectId]);
          const panelId = `project-panel-${project.projectId}`;
          const safeTempUrl = isSafeHttpUrl(project.temporaryUrl)
            ? project.temporaryUrl
            : undefined;
          const safeRepoUrl = isSafeHttpUrl(project.repositoryUrl)
            ? project.repositoryUrl
            : undefined;
          const safeContactUrl = isSafeHttpUrl(project.maintainerContactLink)
            ? project.maintainerContactLink
            : undefined;
          const mailtoHref = buildMailtoHref(project.maintainerEmail, project.projectName);
          const primaryContactHref = safeContactUrl || mailtoHref;

          return (
            <div key={project.projectId} className={isOpen ? 'bg-civic-tint/20' : 'bg-white'}>
              <button
                type="button"
                onClick={() => toggleRow(project.projectId)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="w-full text-left px-5 sm:px-6 py-4.5 hover:bg-civic-surface/80 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-civic-primary"
              >
                {/* Desktop 12-Column Row */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                  <div className="col-span-4 min-w-0 pr-2">
                    <p className="font-display text-sm font-bold text-civic-ink truncate">
                      {project.projectName}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      <span className="font-medium text-slate-700">{project.lguName}</span>
                      <span aria-hidden="true" className="mx-1.5 text-slate-300">
                        ·
                      </span>
                      <span>{project.province}</span>
                    </p>
                  </div>

                  <div className="col-span-2 text-xs font-medium text-slate-700 truncate">
                    {project.sponsorshipType}
                  </div>

                  <div className="col-span-2 min-w-0">
                    <span
                      className="block font-mono text-xs font-medium text-civic-primary truncate"
                      title={project.preferredDomain}
                    >
                      {project.preferredDomain}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <StatusLabel status={project.sponsorshipStatus} />
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-3">
                    <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {formatDisplayDate(project.submittedAt)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-civic-primary' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Mobile / Tablet Compact Row */}
                <div className="lg:hidden flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="font-display text-sm font-bold text-civic-ink leading-snug break-words">
                      {project.projectName}
                    </p>
                    <p className="text-xs text-slate-500 break-words">
                      <span className="font-medium text-slate-700">{project.lguName}</span>
                      <span aria-hidden="true" className="mx-1.5 text-slate-300">
                        ·
                      </span>
                      <span>{project.province}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5 text-xs">
                      <StatusLabel status={project.sponsorshipStatus} />
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-600">{project.sponsorshipType}</span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-mono text-civic-primary break-all">
                        {project.preferredDomain}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 mt-0.5 transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-civic-primary' : ''
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* Expanded Accordion Details Drawer */}
              {isOpen && (
                <div
                  id={panelId}
                  className="px-5 sm:px-6 pb-6 pt-5 bg-civic-surface/70 border-t border-slate-100"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-500 mb-1.5">
                          Project Overview
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {project.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs">
                        {safeTempUrl && (
                          <a
                            href={safeTempUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-civic-primary hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Temporary Site</span>
                          </a>
                        )}
                        {safeRepoUrl && (
                          <a
                            href={safeRepoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-civic-primary hover:underline"
                          >
                            <GitBranch className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>GitHub Repository</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-5 lg:border-l lg:border-civic-border lg:pl-7">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                        <div className="min-w-0">
                          <dt className="text-slate-500 mb-0.5">Maintainer</dt>
                          <dd className="font-semibold text-civic-ink break-words">
                            {project.maintainerName}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-slate-500 mb-0.5">Reference ID</dt>
                          <dd className="font-mono text-slate-700">{project.projectId}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-slate-500 mb-0.5">Preferred Domain</dt>
                          <dd className="font-mono font-medium text-civic-primary break-all">
                            {project.preferredDomain}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-slate-500 mb-0.5">Submitted</dt>
                          <dd className="text-slate-700 tabular-nums">
                            {formatDisplayDate(project.submittedAt)}
                          </dd>
                        </div>
                      </dl>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 pt-1">
                        <Link
                          to={`/projects/${project.slug}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 min-h-11 sm:min-h-0 text-xs font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors whitespace-nowrap"
                        >
                          <span>View Project</span>
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </Link>

                        <a
                          href={primaryContactHref}
                          target={safeContactUrl ? '_blank' : undefined}
                          rel={safeContactUrl ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 min-h-11 sm:min-h-0 text-xs font-semibold text-civic-ink bg-white border border-slate-300 hover:border-civic-primary hover:text-civic-primary rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Contact Maintainer</span>
                        </a>

                        <Link
                          to={`/projects/${project.slug}#maintainer-access`}
                          className="inline-flex items-center justify-center sm:justify-start px-2 py-2 text-xs font-medium text-slate-500 hover:text-civic-primary hover:underline transition-colors whitespace-nowrap"
                        >
                          Update status
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectAccordionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white border border-civic-border rounded-xl overflow-hidden divide-y divide-civic-border animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="px-5 sm:px-6 py-4.5 sm:py-5 flex flex-col gap-2.5 lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center"
        >
          <div className="lg:col-span-5 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4 sm:w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/2 sm:w-1/3" />
          </div>
          <div className="hidden lg:block lg:col-span-2 h-3.5 bg-slate-100 rounded w-3/4" />
          <div className="lg:col-span-3 h-3.5 bg-slate-100 rounded w-2/3" />
          <div className="hidden lg:block lg:col-span-2 h-3.5 bg-slate-100 rounded w-1/2 ml-auto" />
        </div>
      ))}
    </div>
  );
}
