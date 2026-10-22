import React, { useState, useEffect } from 'react';
import { normalizeImageUrl, getBrandInitials } from '../utils';
import { Shield } from 'lucide-react';

interface BrandLogoProps {
  src?: string | null;
  name: string;
  className?: string; // Container classes (size, border, etc.)
  imgClassName?: string;
  showFallbackBadge?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  src,
  name,
  className = 'w-14 h-14 rounded-xl',
  imgClassName = '',
  showFallbackBadge = true,
}) => {
  const normalizedSrc = normalizeImageUrl(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [normalizedSrc]);

  const initials = getBrandInitials(name);

  // If no source or error occurred, render luxury fallback emblem
  if (!normalizedSrc || hasError) {
    if (!showFallbackBadge) return null;
    return (
      <div
        className={`${className} bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-700/80 flex flex-col items-center justify-center p-1 relative overflow-hidden shadow-inner group-hover:border-amber-400/50 transition-colors shrink-0`}
        title={`${name} emblem`}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-500/5 pointer-events-none" />
        <span className="font-extrabold text-amber-400 font-mono tracking-wider drop-shadow-sm select-none leading-none text-xs sm:text-sm">
          {initials}
        </span>
        <span className="text-[8px] font-mono tracking-tighter text-neutral-400 uppercase truncate max-w-full px-0.5 mt-0.5 opacity-80">
          {name.slice(0, 7)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${className} bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow-inner relative group/logo`}
    >
      {/* Background placeholder while image loads */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 animate-pulse">
          <span className="font-bold text-amber-500/40 text-xs font-mono">{initials}</span>
        </div>
      )}

      <img
        src={normalizedSrc}
        alt={`${name} logo`}
        className={`w-full h-full object-contain rounded-lg transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${imgClassName}`}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onLoad={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onError={() => {
          // If error happens, switch immediately to the luxury badge fallback
          setHasError(true);
          setIsLoaded(false);
        }}
      />
    </div>
  );
};
