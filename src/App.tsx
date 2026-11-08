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

function FenoraAppRouter() {
  const { firebaseUser, userProfile, authReady, activeRole } = useFenora();

  // If Firebase Auth listener is still initializing
  if (!authReady) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Unauthenticated user -> Client authentication screen
  if (!firebaseUser) {
    return <AuthScreen />;
  }

  // If a newly registered client has not yet been assigned to a CA firm workspace
  if (activeRole === 'client' && userProfile && (!userProfile.clientId || userProfile.clientId === 'pending')) {
    return <PendingAccessScreen />;
  }

  // Strict role-based destination: Client Portal vs CA Dashboard
  if (activeRole === 'client') {
    return <ClientPortalView />;
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
