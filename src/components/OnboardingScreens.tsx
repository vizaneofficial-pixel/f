import React, { useState } from 'react';
import {
  HardDrive,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Search,
  Check,
  Loader2,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { useTheme } from '../context/ThemeContext';
import { FenoraLogo } from './FenoraLogo';

/**
 * 1. CA Firm Initial Setup Screen (shown when a CA signs in with Google for the first time)
 */
export const CAFirmSetupScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { userProfile, completeCAFirmSetup, signOutUser } = useFenora();

  const [firmName, setFirmName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>(userProfile?.displayName || '');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);
    const res = await completeCAFirmSetup({
      firmName,
      ownerName,
      contactPhone,
    });
    setIsSaving(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to register CA firm.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="fixed top-5 right-5 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-full glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={signOutUser}
          className="px-3 py-1.5 rounded-full text-xs font-medium glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-5 bg-white/95 dark:bg-slate-900/90">
        <div className="flex flex-col items-center text-center">
          <FenoraLogo dark={theme === 'dark'} />
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Step 1 of 2 · CA Firm Registration</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white mt-2">
            Register Your CA Practice
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create your permanent firm workspace so clients can find and register under your practice.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              CA Firm Name
            </label>
            <input
              type="text"
              required
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="e.g. Deshmukh & Associates Chartered Accountants"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Owner / Partner CA Name
            </label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. CA Vikram Deshmukh"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Information (Phone / City)
            </label>
            <input
              type="text"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +91 98200 00000 · Mumbai"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Firm Workspace...</span>
              </>
            ) : (
              <>
                <span>Create Firm & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

/**
 * 2. CA Firm Google Drive Onboarding Screen (First onboarding step after CA registration)
 */
export const DriveOnboardingScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    firm,
    connectGoogleDrive,
    completeDriveOnboarding,
    signOutUser,
  } = useFenora();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [driveResponse, setDriveResponse] = useState<{
    ok: boolean;
    message?: string;
    missingEnvVars?: string[];
  } | null>(null);

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    setDriveResponse(null);
    const res = await connectGoogleDrive();
    setIsConnecting(false);
    setDriveResponse({
      ok: res.ok,
      message: res.error,
      missingEnvVars: res.missingEnvVars,
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="fixed top-5 right-5 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-full glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={signOutUser}
          className="px-3 py-1.5 rounded-full text-xs font-medium glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="w-full max-w-lg glass-modal rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 bg-white/95 dark:bg-slate-900/90">
        <div className="flex flex-col items-center text-center">
          <FenoraLogo dark={theme === 'dark'} />
          <span className="mt-3 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            Firm ID: {firm.id}
          </span>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white mt-3">
            Connect your Google Drive
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
            Fenora never stores client accounting document binaries in Firebase. All client uploads are routed directly to your firm’s Google Drive.
          </p>
        </div>

        {/* Target Folder Architecture Preview */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <FolderTree className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Automated Google Drive Folder Hierarchy</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3">
            Fenora / Clients / &lt;Client Name&gt; / &lt;Financial Year&gt; / Documents
          </div>
        </div>

        {/* Honest OAuth / Backend Connection Status */}
        {driveResponse && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 ${
              driveResponse.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-start gap-2">
              {driveResponse.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5">
                <p className="font-semibold">
                  {driveResponse.ok
                    ? 'Google Drive Connected'
                    : 'Backend Google OAuth Credentials Required'}
                </p>
                {driveResponse.message && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {driveResponse.message}
                  </p>
                )}
                {driveResponse.missingEnvVars && driveResponse.missingEnvVars.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Configure in backend environment to enable live Drive OAuth & storage:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {driveResponse.missingEnvVars.map((envVar) => (
                        <span
                          key={envVar}
                          className="px-2 py-0.5 rounded bg-slate-900/10 dark:bg-white/10 font-mono text-[10px]"
                        >
                          {envVar}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Primary Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleConnectDrive}
            disabled={isConnecting}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Google Drive OAuth Service...</span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4" />
                <span>Connect Google Drive</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => completeDriveOnboarding()}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Continue to CA Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Client Firm Selection Screen (shown when a Client signs in with Google for the first time)
 */
export const ClientFirmSelectionScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    userProfile,
    directoryFirms,
    completeClientFirmSelection,
    signOutUser,
  } = useFenora();

  const [fullName, setFullName] = useState<string>(userProfile?.displayName || '');
  const [businessName, setBusinessName] = useState<string>(userProfile?.businessName || '');
  const [selectedFirmId, setSelectedFirmId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredFirms = directoryFirms.filter((f) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      (f.ownerName || '').toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!selectedFirmId) {
      setErrorMsg('Please select your Chartered Accountant firm.');
      return;
    }
    setIsSubmitting(true);
    const res = await completeClientFirmSelection({
      fullName,
      businessName,
      selectedFirmId,
    });
    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to submit membership request.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="fixed top-5 right-5 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-full glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={signOutUser}
          className="px-3 py-1.5 rounded-full text-xs font-medium glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-5 bg-white/95 dark:bg-slate-900/90">
        <div className="flex flex-col items-center text-center">
          <FenoraLogo dark={theme === 'dark'} />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white mt-3">
            Complete Client Registration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select your Chartered Accountant firm to request document upload access.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Business / Company Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Registered Business Name"
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Select CA Firm
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered CA firms..."
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredFirms.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No registered CA firms found. Please ask your CA to register their firm first.
                </div>
              ) : (
                filteredFirms.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFirmId(f.id)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors ${
                      selectedFirmId === f.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="truncate">{f.name}</p>
                        {f.ownerName && (
                          <p className="text-[10px] text-slate-400 truncate">
                            CA: {f.ownerName}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedFirmId === f.id && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || directoryFirms.length === 0}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <span>Request Client Approval</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
