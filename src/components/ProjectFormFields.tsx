import {
  FIELD_LIMITS,
  PHILIPPINE_PROVINCES,
  SPONSORSHIP_TYPE_OPTIONS,
  type SponsorshipType,
} from '../types/project.ts';

export interface ProjectFormValues {
  projectName: string;
  lguName: string;
  province: string;
  description: string;
  objectives: string;
  temporaryUrl: string;
  repositoryUrl: string;
  sponsorshipType: SponsorshipType;
  preferredDomain: string;
  maintainerName: string;
  maintainerEmail: string;
  maintainerContactLink: string;
}

interface ProjectFormFieldsProps {
  values: ProjectFormValues;
  errors: Record<string, string>;
  onChange: <K extends keyof ProjectFormValues>(field: K, value: ProjectFormValues[K]) => void;
  disabled?: boolean;
}

const inputBaseClass =
  'w-full px-3.5 py-2.5 min-h-11 sm:min-h-0 text-base sm:text-sm bg-white border rounded-lg text-civic-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-civic-primary/20 focus:border-civic-primary transition-colors disabled:bg-slate-50 disabled:text-slate-500';

function fieldBorderClass(hasError: boolean): string {
  return hasError ? 'border-red-500 focus:border-red-600 focus:ring-red-200' : 'border-slate-300';
}

export function ProjectFormFields({
  values,
  errors,
  onChange,
  disabled = false,
}: ProjectFormFieldsProps) {
  return (
    <div className="space-y-12">
      <section aria-labelledby="section-project-info" className="space-y-6">
        <div className="pb-4 border-b border-civic-border">
          <p className="font-mono text-xs font-semibold text-civic-primary mb-1">01</p>
          <h2 id="section-project-info" className="font-display text-xl font-bold text-civic-ink">
            Project Information
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            All fields are required so prospective sponsors can inspect your project and its
            infrastructure needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label htmlFor="projectName" className="block text-sm font-semibold text-civic-ink mb-1.5">
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              id="projectName"
              name="projectName"
              type="text"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.projectName.max}
              value={values.projectName}
              onChange={(e) => onChange('projectName', e.target.value)}
              placeholder="e.g., BetterIloilo Public Budget Portal"
              aria-invalid={Boolean(errors.projectName)}
              aria-describedby={errors.projectName ? 'projectName-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.projectName))}`}
            />
            {errors.projectName && (
              <p id="projectName-error" className="text-xs text-red-700 mt-1.5">
                {errors.projectName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lguName" className="block text-sm font-semibold text-civic-ink mb-1.5">
              LGU Name <span className="text-red-600">*</span>
            </label>
            <input
              id="lguName"
              name="lguName"
              type="text"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.lguName.max}
              value={values.lguName}
              onChange={(e) => onChange('lguName', e.target.value)}
              placeholder="e.g., City of Iloilo or Municipality of Solano"
              aria-invalid={Boolean(errors.lguName)}
              aria-describedby={errors.lguName ? 'lguName-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.lguName))}`}
            />
            {errors.lguName && (
              <p id="lguName-error" className="text-xs text-red-700 mt-1.5">
                {errors.lguName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="province" className="block text-sm font-semibold text-civic-ink mb-1.5">
              Province <span className="text-red-600">*</span>
            </label>
            <select
              id="province"
              name="province"
              required
              disabled={disabled}
              value={values.province}
              onChange={(e) => onChange('province', e.target.value)}
              aria-invalid={Boolean(errors.province)}
              aria-describedby={errors.province ? 'province-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.province))}`}
            >
              <option value="">Select province or region</option>
              {PHILIPPINE_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            {errors.province && (
              <p id="province-error" className="text-xs text-red-700 mt-1.5">
                {errors.province}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="description" className="block text-sm font-semibold text-civic-ink">
                Project Description <span className="text-red-600">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {values.description.length}/{FIELD_LIMITS.description.max}
              </span>
            </div>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              disabled={disabled}
              maxLength={FIELD_LIMITS.description.max}
              value={values.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Explain what this civic technology tool does, who it serves, and what public information or service it improves."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.description))}`}
            />
            {errors.description && (
              <p id="description-error" className="text-xs text-red-700 mt-1.5">
                {errors.description}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="objectives" className="block text-sm font-semibold text-civic-ink">
                Project Objectives <span className="text-red-600">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {values.objectives.length}/{FIELD_LIMITS.objectives.max}
              </span>
            </div>
            <textarea
              id="objectives"
              name="objectives"
              required
              rows={4}
              disabled={disabled}
              maxLength={FIELD_LIMITS.objectives.max}
              value={values.objectives}
              onChange={(e) => onChange('objectives', e.target.value)}
              placeholder="List the concrete civic goals, public transparency outcomes, or citizen services this project aims to deliver."
              aria-invalid={Boolean(errors.objectives)}
              aria-describedby={errors.objectives ? 'objectives-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.objectives))}`}
            />
            {errors.objectives && (
              <p id="objectives-error" className="text-xs text-red-700 mt-1.5">
                {errors.objectives}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="temporaryUrl"
              className="block text-sm font-semibold text-civic-ink mb-1.5"
            >
              Temporary Deployment URL <span className="text-red-600">*</span>
            </label>
            <input
              id="temporaryUrl"
              name="temporaryUrl"
              type="url"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.temporaryUrl.max}
              value={values.temporaryUrl}
              onChange={(e) => onChange('temporaryUrl', e.target.value)}
              placeholder="https://better-iloilo.vercel.app"
              aria-invalid={Boolean(errors.temporaryUrl)}
              aria-describedby={errors.temporaryUrl ? 'temporaryUrl-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.temporaryUrl))}`}
            />
            {errors.temporaryUrl && (
              <p id="temporaryUrl-error" className="text-xs text-red-700 mt-1.5">
                {errors.temporaryUrl}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="repositoryUrl"
              className="block text-sm font-semibold text-civic-ink mb-1.5"
            >
              GitHub Repository URL <span className="text-red-600">*</span>
            </label>
            <input
              id="repositoryUrl"
              name="repositoryUrl"
              type="url"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.repositoryUrl.max}
              value={values.repositoryUrl}
              onChange={(e) => onChange('repositoryUrl', e.target.value)}
              placeholder="https://github.com/username/project-repo"
              aria-invalid={Boolean(errors.repositoryUrl)}
              aria-describedby={errors.repositoryUrl ? 'repositoryUrl-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.repositoryUrl))}`}
            />
            {errors.repositoryUrl && (
              <p id="repositoryUrl-error" className="text-xs text-red-700 mt-1.5">
                {errors.repositoryUrl}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sponsorshipType"
              className="block text-sm font-semibold text-civic-ink mb-1.5"
            >
              Sponsorship Requirement <span className="text-red-600">*</span>
            </label>
            <select
              id="sponsorshipType"
              name="sponsorshipType"
              required
              disabled={disabled}
              value={values.sponsorshipType}
              onChange={(e) => onChange('sponsorshipType', e.target.value as SponsorshipType)}
              aria-invalid={Boolean(errors.sponsorshipType)}
              aria-describedby={errors.sponsorshipType ? 'sponsorshipType-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.sponsorshipType))}`}
            >
              {SPONSORSHIP_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.sponsorshipType && (
              <p id="sponsorshipType-error" className="text-xs text-red-700 mt-1.5">
                {errors.sponsorshipType}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="preferredDomain"
              className="block text-sm font-semibold text-civic-ink mb-1.5"
            >
              Preferred Domain Name <span className="text-red-600">*</span>
            </label>
            <input
              id="preferredDomain"
              name="preferredDomain"
              type="text"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.preferredDomain.max}
              value={values.preferredDomain}
              onChange={(e) => onChange('preferredDomain', e.target.value)}
              placeholder="e.g., betteriloilo.org"
              aria-invalid={Boolean(errors.preferredDomain)}
              aria-describedby={errors.preferredDomain ? 'preferredDomain-error' : undefined}
              className={`${inputBaseClass} font-mono ${fieldBorderClass(Boolean(errors.preferredDomain))}`}
            />
            {errors.preferredDomain && (
              <p id="preferredDomain-error" className="text-xs text-red-700 mt-1.5">
                {errors.preferredDomain}
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="section-maintainer-info" className="space-y-6">
        <div className="pb-4 border-b border-civic-border">
          <p className="font-mono text-xs font-semibold text-civic-primary mb-1">02</p>
          <h2 id="section-maintainer-info" className="font-display text-xl font-bold text-civic-ink">
            Maintainer Information
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            These contact details will be displayed publicly on your project listing so sponsors can
            contact you directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label
              htmlFor="maintainerName"
              className="block text-sm font-semibold text-civic-ink mb-1.5"
            >
              Maintainer&apos;s Full Name or Preferred Public Name{' '}
              <span className="text-red-600">*</span>
            </label>
            <input
              id="maintainerName"
              name="maintainerName"
              type="text"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.maintainerName.max}
              value={values.maintainerName}
              onChange={(e) => onChange('maintainerName', e.target.value)}
              placeholder="e.g., Maria Santos or Civic Dev Collective"
              aria-invalid={Boolean(errors.maintainerName)}
              aria-describedby={errors.maintainerName ? 'maintainerName-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.maintainerName))}`}
            />
            {errors.maintainerName && (
              <p id="maintainerName-error" className="text-xs text-red-700 mt-1.5">
                {errors.maintainerName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maintainerEmail"
              className="block text-sm font-semibold text-civic-ink mb-1.5"
            >
              Contact Email Address <span className="text-red-600">*</span>
            </label>
            <input
              id="maintainerEmail"
              name="maintainerEmail"
              type="email"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.maintainerEmail.max}
              value={values.maintainerEmail}
              onChange={(e) => onChange('maintainerEmail', e.target.value)}
              placeholder="maintainer@example.org"
              aria-invalid={Boolean(errors.maintainerEmail)}
              aria-describedby={errors.maintainerEmail ? 'maintainerEmail-error' : undefined}
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.maintainerEmail))}`}
            />
            {errors.maintainerEmail && (
              <p id="maintainerEmail-error" className="text-xs text-red-700 mt-1.5">
                {errors.maintainerEmail}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maintainerContactLink"
              className="block text-sm font-semibold text-civic-ink mb-1.5"
            >
              Preferred Contact Link <span className="text-red-600">*</span>
            </label>
            <input
              id="maintainerContactLink"
              name="maintainerContactLink"
              type="url"
              required
              disabled={disabled}
              maxLength={FIELD_LIMITS.maintainerContactLink.max}
              value={values.maintainerContactLink}
              onChange={(e) => onChange('maintainerContactLink', e.target.value)}
              placeholder="https://m.me/username or https://facebook.com/username"
              aria-invalid={Boolean(errors.maintainerContactLink)}
              aria-describedby={
                errors.maintainerContactLink ? 'maintainerContactLink-error' : undefined
              }
              className={`${inputBaseClass} ${fieldBorderClass(Boolean(errors.maintainerContactLink))}`}
            />
            {errors.maintainerContactLink && (
              <p id="maintainerContactLink-error" className="text-xs text-red-700 mt-1.5">
                {errors.maintainerContactLink}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
