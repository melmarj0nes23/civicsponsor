import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface CivicImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function CivicImage({ src, alt, className = '', fallbackTitle }: CivicImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-slate-100 border border-slate-200 text-slate-500 p-8 ${className}`}
      >
        <Building2 className="w-8 h-8 mb-3 text-civic-primary/60" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700 text-center">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
