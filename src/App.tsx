/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FenoraProvider, useFenora } from './context/FenoraContext';
import { AuthScreen } from './components/AuthScreen';
import { PendingAccessScreen } from './components/PendingAccessScreen';
import { CAWorkspaceView } from './components/CAWorkspaceView';
import { ClientPortalView } from './components/ClientPortalView';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { FirmSuspendedScreen } from './components/FirmSuspendedScreen';
import { FenoraAdminView } from './components/FenoraAdminView';
import {
  CAFirmSetupScreen,
  DriveOnboardingScreen,
  ClientFirmSelectionScreen,
} from './components/OnboardingScreens';

function FenoraAppRouter() {
  const { firebaseUser, userProfile, firm, authReady, activeRole } = useFenora();

  // Wait for Firebase Auth & user profile initialization
  if (!authReady) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Unauthenticated user -> Clean minimal sign-in screen
  if (!firebaseUser || !userProfile) {
    return <AuthScreen />;
  }

  // 1. SUPER ADMIN EXPERIENCE
  if (activeRole === 'super_admin' || userProfile.role === 'super_admin') {
    return <FenoraAdminView />;
  }

  // Check if tenant firm is suspended
  const isFirmSuspended =
    Boolean(firm.id) &&
    (firm.status === 'suspended' || firm.active === false);

  // 2. CLIENT EXPERIENCE
  if (activeRole === 'client') {
    // If firm is suspended, block client portal access with friendly support explanation
    if (isFirmSuspended) {
      return <FirmSuspendedScreen isClientView={true} />;
    }

    // If client signed in via Google and has not selected an active firm yet
    if (!userProfile.firmId || userProfile.firmId === 'pending') {
      return <ClientFirmSelectionScreen />;
    }

    // If client registration is PENDING or REJECTED by the CA firm, block document portal access
    if (userProfile.membershipStatus !== 'APPROVED') {
      return <PendingAccessScreen />;
    }

    return <ClientPortalView />;
  }

  // 3. FIRM OWNER / CA EXPERIENCE
  // If firm is suspended, block workspace access with reactivation instructions
  if (isFirmSuspended) {
    return <FirmSuspendedScreen isClientView={false} />;
  }

  // Mandatory first-time password change check
  if (userProfile.mustChangePassword || firm.mustChangePassword) {
    return <ChangePasswordScreen />;
  }

  // If CA user signed in via Google and has not initialized firm profile
  if (!userProfile.firmId || userProfile.firmId === 'pending') {
    return <CAFirmSetupScreen />;
  }

  // First onboarding step after firm creation: Connect Google Drive
  if (firm.id && firm.driveOnboardingCompleted === false) {
    return <DriveOnboardingScreen />;
  }

  return <CAWorkspaceView />;
}

export default function App() {
  return (
    <ThemeProvider>
      <FenoraProvider>
        <FenoraAppRouter />
      </FenoraProvider>
    </ThemeProvider>
  );
}
