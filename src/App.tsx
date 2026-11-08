/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FenoraProvider, useFenora } from './context/FenoraContext';
import { CAWorkspaceView } from './components/CAWorkspaceView';
import { ClientPortalView } from './components/ClientPortalView';
import { RoleAccessModal } from './components/RoleAccessModal';

function FenoraAppRouter() {
  const { activeRole } = useFenora();
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);

  return (
    <>
      {activeRole === 'client' ? (
        <ClientPortalView onOpenRoleModal={() => setRoleModalOpen(true)} />
      ) : (
        <CAWorkspaceView onOpenRoleModal={() => setRoleModalOpen(true)} />
      )}
      <RoleAccessModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <FenoraProvider>
      <FenoraAppRouter />
    </FenoraProvider>
  );
}
