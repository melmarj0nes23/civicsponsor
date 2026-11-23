export const SponsorshipStatus = {
  AWAITING: 'Awaiting Sponsorship',
  SPONSORED: 'Sponsored',
} as const;
export type SponsorshipStatus = (typeof SponsorshipStatus)[keyof typeof SponsorshipStatus];

export const SponsorshipType = {
  DOMAIN: 'Domain Registration',
  HOSTING: 'Hosting',
  BOTH: 'Domain and Hosting',
} as const;
export type SponsorshipType = (typeof SponsorshipType)[keyof typeof SponsorshipType];

export interface ProjectRecord {
  projectId: string;
  slug: string;
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
  sponsorshipStatus: SponsorshipStatus;
  sponsorshipConfirmationNote: string;
  submittedAt: string | null;
  updatedAt: string | null;
  sponsoredAt: string | null;
  consentTimestamp: string | null;
  isPublic: boolean;
}

export interface ProjectSubmissionInput {
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
  consentAccepted: boolean;
}

export interface ProjectUpdateInput {
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
  sponsorshipStatus: SponsorshipStatus;
  sponsorshipConfirmationNote: string;
}

export interface SubmissionConfirmation {
  projectId: string;
  slug: string;
  projectName: string;
  publicPath: string;
  managementPath: string;
  managementToken: string;
}

export interface DirectoryStats {
  totalProjects: number;
  awaitingSponsorship: number;
  sponsoredProjects: number;
  lgusRepresented: number;
}

export const FIELD_LIMITS = {
  projectName: { min: 2, max: 120 },
  lguName: { min: 2, max: 120 },
  province: { min: 2, max: 80 },
  description: { min: 10, max: 1500 },
  objectives: { min: 10, max: 2000 },
  temporaryUrl: { min: 10, max: 300 },
  repositoryUrl: { min: 10, max: 300 },
  preferredDomain: { min: 3, max: 120 },
  maintainerName: { min: 2, max: 100 },
  maintainerEmail: { min: 5, max: 160 },
  maintainerContactLink: { min: 10, max: 300 },
  sponsorshipConfirmationNote: { min: 0, max: 500 },
} as const;

export const SPONSORSHIP_TYPE_OPTIONS: SponsorshipType[] = [
  SponsorshipType.DOMAIN,
  SponsorshipType.HOSTING,
  SponsorshipType.BOTH,
];

export const PHILIPPINE_PROVINCES: string[] = [
  'Metro Manila (NCR)',
  'Abra',
  'Agusan del Norte',
  'Agusan del Sur',
  'Aklan',
  'Albay',
  'Antique',
  'Apayao',
  'Aurora',
  'Basilan',
  'Bataan',
  'Batanes',
  'Batangas',
  'Benguet',
  'Biliran',
  'Bohol',
  'Bukidnon',
  'Bulacan',
  'Cagayan',
  'Camarines Norte',
  'Camarines Sur',
  'Camiguin',
  'Capiz',
  'Catanduanes',
  'Cavite',
  'Cebu',
  'Cotabato',
  'Davao de Oro',
  'Davao del Norte',
  'Davao del Sur',
  'Davao Occidental',
  'Davao Oriental',
  'Dinagat Islands',
  'Eastern Samar',
  'Guimaras',
  'Ifugao',
  'Ilocos Norte',
  'Ilocos Sur',
  'Iloilo',
  'Isabela',
  'Kalinga',
  'La Union',
  'Laguna',
  'Lanao del Norte',
  'Lanao del Sur',
  'Leyte',
  'Maguindanao del Norte',
  'Maguindanao del Sur',
  'Marinduque',
  'Masbate',
  'Misamis Occidental',
  'Misamis Oriental',
  'Mountain Province',
  'Negros Occidental',
  'Negros Oriental',
  'Northern Samar',
  'Nueva Ecija',
  'Nueva Vizcaya',
  'Occidental Mindoro',
  'Oriental Mindoro',
  'Palawan',
  'Pampanga',
  'Pangasinan',
  'Quezon',
  'Quirino',
  'Rizal',
  'Romblon',
  'Samar',
  'Sarangani',
  'Siquijor',
  'Sorsogon',
  'South Cotabato',
  'Southern Leyte',
  'Sultan Kudarat',
  'Sulu',
  'Surigao del Norte',
  'Surigao del Sur',
  'Tarlac',
  'Tawi-Tawi',
  'Zambales',
  'Zamboanga del Norte',
  'Zamboanga del Sur',
  'Zamboanga Sibugay',
];
