import React from 'react';
import { AlertTriangle, LogOut, ShieldAlert } from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { FenoraLogo } from './FenoraLogo';

interface FirmSuspendedScreenProps {
  isClientView?: boolean;
}

export const FirmSuspendedScreen: React.FC<FirmSuspendedScreenProps> = ({ isClientView = false }) => {
  const { firm, userProfile, signOutUser } = useFenora();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm text-center">
        <div className="flex flex-col items-center mb-6">
          <FenoraLogo />
          <div className="mt-6 p-3.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            {isClientView ? <AlertTriangle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {isClientView ? 'Firm Access Inactive' : 'Firm Account Suspended'}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isClientView ? (
              <>
                The accounting firm <strong className="text-slate-900 dark:text-slate-200">{firm.name || userProfile?.businessName || 'associated with your account'}</strong> is currently suspended. Document uploads and accounting services are temporarily paused.
              </>
            ) : (
              <>
                Subscription access for <strong className="text-slate-900 dark:text-slate-200">{firm.name || 'your firm'}</strong> is currently suspended. All historical accounting vouchers, documents, and Google Drive files remain safe and preserved.
              </>
            )}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-6 text-left space-y-1.5">
          <div className="flex justify-between">
            <span>Firm ID:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{firm.id || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Suspended</span>
          </div>
          <div className="flex justify-between">
            <span>Data Preservation:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Google Drive Files Untouched</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Please contact Fenora Administration at <span className="font-mono text-emerald-600 dark:text-emerald-400">admin@fenora.in</span> to reactivate this firm.
        </p>

        <button
          onClick={() => signOutUser()}
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-medium text-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
