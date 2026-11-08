import React from 'react';
import { Sun, Moon, LogOut, Clock, ShieldCheck } from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { useTheme } from '../context/ThemeContext';
import { FenoraLogo } from './FenoraLogo';

export const PendingAccessScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { firebaseUser, signOutUser } = useFenora();

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
      <div className="w-full max-w-sm relative z-10">
        <div className="glass-modal rounded-3xl p-7 text-center shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-5">
          <div className="flex justify-center">
            <FenoraLogo dark={theme === 'dark'} />
          </div>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Account Created
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Your account has been registered. Your Chartered Accountant firm will link your workspace and configure your accounting profile shortly.
            </p>
          </div>

          {firebaseUser?.email && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60 truncate max-w-full">
              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{firebaseUser.email}</span>
            </div>
          )}

          <div className="pt-2">
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
