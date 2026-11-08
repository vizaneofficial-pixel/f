import React, { useState, useRef } from 'react';
import { Sun, Moon, Loader2, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { useTheme } from '../context/ThemeContext';
import { FenoraLogo } from './FenoraLogo';

export const AuthScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signInWithGoogle,
    isSigningIn,
  } = useFenora();

  // Mode: 'signin' | 'signup' | 'forgot' | 'ca_login' | 'ca_register'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'ca_login' | 'ca_register'>('signin');

  // Client form states
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');

  // CA form states
  const [caName, setCaName] = useState<string>('');
  const [firmName, setFirmName] = useState<string>('');
  const [caEmail, setCaEmail] = useState<string>('');
  const [caPassword, setCaPassword] = useState<string>('');
  const [caConfirmPassword, setCaConfirmPassword] = useState<string>('');

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 5-click hidden CA detector
  const tapHistoryRef = useRef<number[]>([]);
  const [hasCaInitialized, setHasCaInitialized] = useState<boolean>(() => {
    return localStorage.getItem('fenora_ca_initialized') === 'true';
  });

  const handleHiddenLogoTap = () => {
    const now = Date.now();
    tapHistoryRef.current = tapHistoryRef.current.filter((t) => now - t < 3000);
    tapHistoryRef.current.push(now);

    if (tapHistoryRef.current.length >= 5) {
      tapHistoryRef.current = [];
      setErrorMsg(null);
      setSuccessMsg(null);
      if (hasCaInitialized) {
        setMode('ca_login');
      } else {
        setMode('ca_register');
      }
    }
  };

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Client Submit
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();

    if (mode === 'forgot') {
      if (!trimmedEmail) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      setIsSubmitting(true);
      const res = await sendPasswordReset(trimmedEmail);
      setIsSubmitting(false);
      if (res.ok) {
        setSuccessMsg('Password reset link sent to your email.');
      } else {
        setErrorMsg(res.error || 'Failed to send reset email.');
      }
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!trimmedEmail) {
        setErrorMsg('Please enter your email.');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter a password.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      const res = await signUpWithEmail(
        trimmedEmail,
        password,
        fullName.trim(),
        'client',
        businessName.trim() || undefined
      );
      setIsSubmitting(false);
      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to create account.');
      }
      return;
    }

    // mode === 'signin'
    if (!trimmedEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await signInWithEmail(trimmedEmail, password);
    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error || 'Incorrect email or password.');
    }
  };

  // CA Form Submit
  const handleCaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedCaEmail = caEmail.trim();

    if (mode === 'ca_register') {
      if (!caName.trim()) {
        setErrorMsg('Please enter CA full name.');
        return;
      }
      if (!firmName.trim()) {
        setErrorMsg('Please enter CA firm name.');
        return;
      }
      if (!trimmedCaEmail || !validateEmail(trimmedCaEmail)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (!caPassword || caPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (caPassword !== caConfirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      const res = await signUpWithEmail(trimmedCaEmail, caPassword, caName.trim(), 'ca');
      setIsSubmitting(false);
      if (res.ok) {
        localStorage.setItem('fenora_ca_initialized', 'true');
        setHasCaInitialized(true);
      } else {
        setErrorMsg(res.error || 'CA registration failed.');
      }
      return;
    }

    // mode === 'ca_login'
    if (!trimmedCaEmail || !caPassword) {
      setErrorMsg('Please enter CA email and password.');
      return;
    }
    setIsSubmitting(true);
    const res = await signInWithEmail(trimmedCaEmail, caPassword);
    setIsSubmitting(false);
    if (res.ok) {
      localStorage.setItem('fenora_ca_initialized', 'true');
      setHasCaInitialized(true);
    } else {
      setErrorMsg(res.error || 'Incorrect CA credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await signInWithGoogle('client');
    if (!res.ok && res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleCaGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await signInWithGoogle('ca');
    if (!res.ok && res.error) {
      setErrorMsg(res.error);
    }
  };

  const isBusy = isSubmitting || isSigningIn;
  const isCaMode = mode === 'ca_login' || mode === 'ca_register';

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col justify-center items-center px-4 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-full glass-panel hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Centered Single-Screen Compact Auth Card */}
      <div className="w-full max-w-[380px] relative z-10">
        <div className="glass-modal rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/90 dark:border-slate-800/80 space-y-3.5 bg-white/95 dark:bg-slate-900/90 transition-colors">
          {/* Header */}
          <div className="flex flex-col items-center">
            <FenoraLogo dark={theme === 'dark'} />
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2">
              {isCaMode
                ? mode === 'ca_register'
                  ? 'CA Partner Onboarding'
                  : 'CA Partner Sign In'
                : mode === 'signin'
                ? 'Welcome back'
                : mode === 'signup'
                ? 'Create account'
                : 'Reset password'}
            </h1>
          </div>

          {/* Mode Switcher for Normal Client Flow */}
          {!isCaMode && mode !== 'forgot' && (
            <div className="grid grid-cols-2 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Status Feedback */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium leading-relaxed space-y-2 text-left">
              <p className="font-semibold text-rose-800 dark:text-rose-200">{errorMsg}</p>
              {errorMsg.includes('Firebase Console') && (
                <div className="pt-1 border-t border-rose-500/20 space-y-2 text-[11px]">
                  <p className="text-slate-600 dark:text-slate-300">
                    To use Email/Password sign-in, toggle the <strong>Email/Password</strong> provider to <strong>Enabled</strong> in your Firebase Console:
                  </p>
                  <a
                    href="https://console.firebase.google.com/project/key-course-zhh41/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-center shadow-xs transition-colors"
                  >
                    <span>Open Firebase Authentication Console ↗</span>
                  </a>
                  <div className="pt-1 text-center">
                    <span className="text-slate-500 text-[10px]">Or enter immediately without setup:</span>
                    <button
                      type="button"
                      onClick={isCaMode ? handleCaGoogleSignIn : handleGoogleSignIn}
                      disabled={isBusy}
                      className="mt-1 w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Continue with Google (Instant Access)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {successMsg && (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs text-center font-medium flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* CLIENT FORM FLOW */}
          {!isCaMode ? (
            <>
              {mode !== 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isBusy}
                    className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-2xs transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden="true">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z" />
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center my-0.5">
                    <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
                    <span className="absolute px-2 text-[10px] uppercase font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-md">
                      or
                    </span>
                  </div>
                </>
              )}

              <form onSubmit={handleClientSubmit} className="space-y-2.5">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                        Business Name (optional)
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Company or Trading Name"
                        className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2 px-4 rounded-xl font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : mode === 'signin' ? (
                    <span>Sign in</span>
                  ) : mode === 'signup' ? (
                    <span>Create account</span>
                  ) : (
                    <span>Send reset link</span>
                  )}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-center transition-colors"
                  >
                    Back to Sign in
                  </button>
                )}
              </form>
            </>
          ) : (
            /* CA WORKSPACE AUTHENTICATION FLOW (Hidden or initialized) */
            <form onSubmit={handleCaSubmit} className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Chartered Accountant Portal</span>
              </div>

              <button
                type="button"
                onClick={handleCaGoogleSignIn}
                disabled={isBusy}
                className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-2xs transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                </svg>
                <span>Continue with Google (CA Partner)</span>
              </button>

              <div className="relative flex items-center justify-center my-0.5">
                <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
                <span className="absolute px-2 text-[10px] uppercase font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-md">
                  or with CA credentials
                </span>
              </div>

              {mode === 'ca_register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                      CA Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={caName}
                      onChange={(e) => setCaName(e.target.value)}
                      placeholder="CA Vikram Deshmukh"
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                      Firm Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="Deshmukh & Associates"
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                  CA Email
                </label>
                <input
                  type="email"
                  required
                  value={caEmail}
                  onChange={(e) => setCaEmail(e.target.value)}
                  placeholder="partner@fenoraca.in"
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={caPassword}
                  onChange={(e) => setCaPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {mode === 'ca_register' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={caConfirmPassword}
                    onChange={(e) => setCaConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-2 px-4 rounded-xl font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Authorizing CA...</span>
                  </>
                ) : mode === 'ca_register' ? (
                  <span>Register CA Firm</span>
                ) : (
                  <span>Sign In to CA Workspace</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Client Login</span>
                </button>

                {hasCaInitialized && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'ca_login' ? 'ca_register' : 'ca_login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {mode === 'ca_login' ? 'Register New CA Firm' : 'Existing CA Login'}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Persistent CA Entry point (visible only if CA account was established on this system) */}
          {hasCaInitialized && !isCaMode && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('ca_login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                CA Firm Partner Sign In →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden 5-Click CA Entry Point Logo in Bottom-Right Corner */}
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
        <button
          type="button"
          onClick={handleHiddenLogoTap}
          onTouchEnd={handleHiddenLogoTap}
          title="Fenora"
          aria-label="Fenora"
          className="w-11 h-11 rounded-full flex items-center justify-center opacity-30 hover:opacity-100 active:scale-95 transition-all text-slate-400 hover:text-slate-700 dark:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
        >
          <FenoraLogo compact dark={theme === 'dark'} />
        </button>
      </div>
    </div>
  );
};
