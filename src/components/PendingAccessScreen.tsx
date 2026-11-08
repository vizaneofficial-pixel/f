import React from 'react';
import { Sun, Moon, LogOut, Clock, ShieldCheck, XCircle, Building2 } from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { useTheme } from '../context/ThemeContext';
import { FenoraLogo } from './FenoraLogo';

export const PendingAccessScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { firebaseUser, userProfile, directoryFirms, signOutUser } = useFenora();

  const isRejected = userProfile?.membershipStatus === 'REJECTED';
  const assignedFirm = directoryFirms.find((f) => f.id === userProfile?.firmId);

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative select-none">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle in top right */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-full glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Centered Glass Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-modal rounded-3xl p-7 text-center shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-5 bg-white/95 dark:bg-slate-900/90">
          <div className="flex justify-center">
            <FenoraLogo dark={theme === 'dark'} />
          </div>

          <div
            className={`w-12 h-12 mx-auto rounded-2xl border flex items-center justify-center ${
              isRejected
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/60 text-rose-600 dark:text-rose-400'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isRejected ? (
              <XCircle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6 animate-pulse" />
            )}
          </div>

          <div className="space-y-1.5">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${
                isRejected
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              Status: {userProfile?.membershipStatus || 'PENDING'}
            </span>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {isRejected
                ? 'Membership Request Declined'
                : 'Awaiting CA Firm Approval'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isRejected
                ? 'Your registration request was declined by the selected Chartered Accountant firm. Please contact your CA partner for assistance.'
                : 'Your registration has been sent to your Chartered Accountant firm. Document uploads and accounting portal access will unlock automatically once your CA approves your request.'}
            </p>
          </div>

          {/* Client & Selected Firm Summary */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-3.5 text-left space-y-2 text-xs">
            {userProfile?.businessName && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Business</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {userProfile.businessName}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Selected CA Firm</span>
              <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {assignedFirm?.name || userProfile?.firmId || 'Assigned Firm'}
                </span>
              </span>
            </div>
            {(firebaseUser?.email || userProfile?.email) && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Account</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate">{firebaseUser?.email || userProfile?.email}</span>
                </span>
              </div>
            )}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={signOutUser}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
