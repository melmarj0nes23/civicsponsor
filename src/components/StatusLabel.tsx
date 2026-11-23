import { CheckCircle2, Clock } from 'lucide-react';
import { SponsorshipStatus } from '../types/project.ts';

interface StatusLabelProps {
  status: SponsorshipStatus;
  size?: 'sm' | 'md';
}

export function StatusLabel({ status, size = 'sm' }: StatusLabelProps) {
  const isSponsored = status === SponsorshipStatus.SPONSORED;
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-tight whitespace-nowrap shrink-0 ${textSize} ${
        isSponsored ? 'text-emerald-700' : 'text-amber-700'
      }`}
    >
      {isSponsored ? (
        <CheckCircle2 className={iconSize} aria-hidden="true" />
      ) : (
        <Clock className={iconSize} aria-hidden="true" />
      )}
      <span>{status}</span>
    </span>
  );
}
