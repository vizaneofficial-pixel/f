import React, { useState } from 'react';
import { X, ShieldCheck, Building2, UserCheck, LogIn } from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { FenoraLogo } from './FenoraLogo';
import { UserRole } from '../types/accounting';

interface RoleAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({ isOpen, onClose }) => {
  const {
    activeRole,
    activePortalClientId,
    clients,
    enterWorkspaceAsRole,
    signInWithGoogle,
    firebaseUser,
    isSigningIn,
  } = useFenora();

  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);
  const [selectedClient, setSelectedClient] = useState<string>(activePortalClientId);

  if (!isOpen) return null;

  const handleConfirmSwitch = async () => {
    await enterWorkspaceAsRole(selectedRole, selectedClient);
    onClose();
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle(selectedRole, selectedClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <FenoraLogo compact />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Select Experience & Role Access
              </h2>
              <p className="text-xs text-slate-500">
                Fenora provides distinct role-isolated portals for CA firms and clients.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSelectedRole('ca')}
            className={`text-left p-4 rounded-lg border transition-colors ${
              selectedRole === 'ca'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldCheck
              className={`w-5 h-5 mb-2 ${
                selectedRole === 'ca' ? 'text-emerald-400' : 'text-slate-700'
              }`}
            />
            <p className="text-sm font-semibold">CA / Firm Dashboard</p>
            <p
              className={`text-xs mt-1 ${
                selectedRole === 'ca' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Full access to clients, AI extraction queue, voucher review, ledgers, GST 2B, and Tally XML.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('client')}
            className={`text-left p-4 rounded-lg border transition-colors ${
              selectedRole === 'client'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
            }`}
          >
            <Building2
              className={`w-5 h-5 mb-2 ${
                selectedRole === 'client' ? 'text-emerald-400' : 'text-slate-700'
              }`}
            />
            <p className="text-sm font-semibold">Client Portal</p>
            <p
              className={`text-xs mt-1 ${
                selectedRole === 'client' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Simplified document upload, status tracking, and CA communication without accounting complexity.
            </p>
          </button>
        </div>

        {selectedRole === 'client' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Active Client Account
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (GSTIN: {c.gstin})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {!firebaseUser ? (
            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleSignIn}
              className="px-4 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              {isSigningIn ? 'Signing in...' : 'Sign in with Google & Persist'}
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              Signed in as <strong className="text-slate-800">{firebaseUser.email}</strong>
            </span>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSwitch}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Enter {selectedRole === 'ca' ? 'CA Dashboard' : 'Client Portal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
