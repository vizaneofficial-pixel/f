import React from 'react';

interface FenoraLogoProps {
  compact?: boolean;
  dark?: boolean;
}

export const FenoraLogo: React.FC<FenoraLogoProps> = ({ compact = false, dark = false }) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
          dark
            ? 'bg-slate-900 border-slate-700'
            : 'bg-slate-900 border-slate-900'
        }`}
        aria-hidden="true"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Minimal geometric F symbol */}
          <path d="M3.5 2.5H12.5V4.75H6V13.5H3.5V2.5Z" fill="#FFFFFF" />
          <rect x="7.25" y="7" width="4.25" height="2.25" fill="#10B981" />
        </svg>
      </div>
      {!compact && (
        <span
          className={`text-base font-semibold tracking-tight whitespace-nowrap ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          Fenora
        </span>
      )}
    </div>
  );
};
