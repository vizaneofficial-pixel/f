import React, { useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit3,
  Power,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Cloud,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  Users,
} from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { useTheme } from '../context/ThemeContext';
import { Firm } from '../types/accounting';
import { FenoraLogo } from './FenoraLogo';

export const FenoraAdminView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    allFirms,
    userProfile,
    createFirmAdmin,
    toggleFirmStatus,
    updateFirmDetails,
    signOutUser,
  } = useFenora();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Add Firm Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [firmName, setFirmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [manualUid, setManualUid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [iamGuidance, setIamGuidance] = useState<string | null>(null);

  // Edit Firm Modal state
  const [editingFirm, setEditingFirm] = useState<Firm | null>(null);
  const [editName, setEditName] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // View Firm Details Modal
  const [viewingFirm, setViewingFirm] = useState<Firm | null>(null);

  // Action status feedback
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter firms
  const filteredFirms = allFirms.filter((f) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (f.name || f.firmName || '').toLowerCase().includes(q) ||
      (f.ownerName || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.id || '').toLowerCase().includes(q) ||
      (f.city || '').toLowerCase().includes(q);

    const isSuspended = f.status === 'suspended' || f.active === false;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !isSuspended) ||
      (statusFilter === 'suspended' && isSuspended);

    return matchesSearch && matchesStatus;
  });

  const totalFirms = allFirms.length;
  const activeFirmsCount = allFirms.filter((f) => f.status !== 'suspended' && f.active !== false).length;
  const suspendedFirmsCount = totalFirms - activeFirmsCount;
  const driveConnectedCount = allFirms.filter((f) => f.driveConnected).length;

  const handleCreateFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setIamGuidance(null);

    const trimmedFirm = firmName.trim();
    const trimmedOwner = ownerName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUid = manualUid.trim();

    if (!trimmedFirm || !trimmedOwner || !trimmedEmail) {
      setAddError('Please fill in all required fields (Firm Name, Owner Name, Email).');
      return;
    }
    if (!trimmedUid) {
      setAddError('Firebase Auth User UID is required. Please create the user in Firebase Console Authentication (see instructions below) and paste their UID.');
      return;
    }
    if (tempPassword && tempPassword.length < 6) {
      setAddError('Temporary password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const res = await createFirmAdmin({
      firmName: trimmedFirm,
      ownerName: trimmedOwner,
      email: trimmedEmail,
      temporaryPassword: tempPassword,
      manualUid: trimmedUid,
    });
    setIsSubmitting(false);

    if (!res.ok) {
      setAddError(res.error || 'Failed to onboard firm.');
      if (res.guidance) {
        setIamGuidance(res.guidance);
      }
      return;
    }

    setAddSuccess(`Firm "${trimmedFirm}" onboarded successfully for owner ${trimmedOwner} (${trimmedEmail}). The firm owner will be required to change their password upon first sign-in.`);
    setFirmName('');
    setOwnerName('');
    setEmail('');
    setTempPassword('');
    setManualUid('');
  };

  const handleToggleStatus = async (f: Firm) => {
    const isCurrentlySuspended = f.status === 'suspended' || f.active === false;
    const newStatus = isCurrentlySuspended ? 'active' : 'suspended';
    setActionLoadingId(f.id);
    await toggleFirmStatus(f.id, newStatus);
    setActionLoadingId(null);
  };

  const handleOpenEdit = (f: Firm) => {
    setEditingFirm(f);
    setEditName(f.name || f.firmName || '');
    setEditOwner(f.ownerName || '');
    setEditEmail(f.email || '');
    setEditPhone(f.contactPhone || '');
    setEditCity(f.city || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;
    setIsEditing(true);
    await updateFirmDetails(editingFirm.id, {
      name: editName.trim(),
      firmName: editName.trim(),
      ownerName: editOwner.trim(),
      email: editEmail.trim(),
      contactPhone: editPhone.trim(),
      city: editCity.trim(),
    });
    setIsEditing(false);
    setEditingFirm(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FenoraLogo />
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            Fenora Admin
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs">{userProfile?.email || 'Administrator'}</span>
          </div>

          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => signOutUser()}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Firms Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Private administrator control panel for onboarding, editing, and managing Chartered Accountant firms.
            </p>
          </div>

          <button
            onClick={() => {
              setShowAddModal(true);
              setAddError(null);
              setAddSuccess(null);
              setIamGuidance(null);
            }}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm shadow-emerald-600/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Firm</span>
          </button>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Firms</span>
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalFirms}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeFirmsCount}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Suspended</span>
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{suspendedFirmsCount}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Google Drive Active</span>
              <Cloud className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{driveConnectedCount}</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by firm, owner, email, city..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              type="button"
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All ({totalFirms})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              type="button"
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Active ({activeFirmsCount})
            </button>
            <button
              onClick={() => setStatusFilter('suspended')}
              type="button"
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'suspended'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Suspended ({suspendedFirmsCount})
            </button>
          </div>
        </div>

        {/* Firms Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {filteredFirms.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-medium">No firms match your filter criteria.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {allFirms.length === 0
                  ? 'Click "Onboard New Firm" above to create your first firm account.'
                  : 'Try clearing your search query or changing the status filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/50">
                    <th className="px-6 py-3.5">Firm Details</th>
                    <th className="px-6 py-3.5">Owner & Contact</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Drive Storage</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredFirms.map((f) => {
                    const isSuspended = f.status === 'suspended' || f.active === false;
                    const isLoading = actionLoadingId === f.id;

                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {f.name || f.firmName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="font-mono text-[11px]">{f.id}</span>
                            {f.city && <span>• {f.city}</span>}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-slate-800 dark:text-slate-200">
                            {f.ownerName || 'Firm Partner'}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {f.email || 'N/A'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {f.driveConnected ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                              <Cloud className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[140px]">{f.driveEmail || 'Connected'}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not Connected</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setViewingFirm(f)}
                              type="button"
                              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              Details
                            </button>

                            <button
                              onClick={() => handleOpenEdit(f)}
                              type="button"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Firm"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(f)}
                              disabled={isLoading}
                              type="button"
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                isSuspended
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              }`}
                              title={isSuspended ? 'Reactivate Firm' : 'Suspend Firm'}
                            >
                              {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Power className="w-3.5 h-3.5" />
                              )}
                              <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Onboard New Firm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Onboard CA Firm
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccess && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{addSuccess}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                    The firm is now active and immediately selectable in client registrations.
                  </p>
                </div>
              </div>
            )}

            {addError && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{addError}</p>
                  {iamGuidance && (
                    <div className="mt-2.5 p-3 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-rose-200 dark:border-rose-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
                        <Info className="w-4 h-4" />
                        <span>Supported Onboarding Fallback:</span>
                      </div>
                      <p>{iamGuidance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateFirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Firm Name *
                </label>
                <input
                  type="text"
                  required
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g. Kalyani & Associates"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Owner's Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. CA Ramesh Kalyani"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  3. Login Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@kalyanica.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  4. Temporary Password *
                </label>
                <input
                  type="text"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="e.g. Fenora#2026 (min 6 characters)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The owner will be strictly prompted to set a permanent password upon first login.
                </p>
              </div>

              {/* Free-Tier Manual UID Workflow */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
                    <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>5. Firebase Auth User UID *</span>
                  </div>
                  <a
                    href="https://console.firebase.google.com/project/key-course-zhh41/authentication/users"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    <span>Open Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-sans">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Free-Tier 3-Step Setup:</p>
                  <p>1. In Firebase Console &rarr; <strong>Authentication &rarr; Users</strong>, click <strong>&quot;Add user&quot;</strong>.</p>
                  <p>2. Enter the <strong>Login Email</strong> and <strong>Temporary Password</strong> specified above.</p>
                  <p>3. Copy the generated <strong>User UID</strong> and paste it in the box below.</p>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={manualUid}
                    onChange={(e) => setManualUid(e.target.value)}
                    placeholder="e.g. WqK18d9Jp2Z4bX7cM..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Fenora will initialize the firm profile and user records with <code className="font-mono text-emerald-600">mustChangePassword: true</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowAddModal(false)}
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Firm...</span>
                    </>
                  ) : (
                    <span>Create Firm</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Firm Modal */}
      {editingFirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Edit Firm Details
              </h2>
              <button
                onClick={() => setEditingFirm(null)}
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Firm Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Owner's Name
                </label>
                <input
                  type="text"
                  required
                  value={editOwner}
                  onChange={(e) => setEditOwner(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setEditingFirm(null)}
                  type="button"
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Firm Details Modal */}
      {viewingFirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {viewingFirm.name || viewingFirm.firmName}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{viewingFirm.id}</p>
              </div>
              <button
                onClick={() => setViewingFirm(null)}
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Owner Name:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{viewingFirm.ownerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Owner Email:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100">{viewingFirm.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Owner Firebase UID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{viewingFirm.ownerUid}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Subscription Status:</span>
                <span className={`font-semibold uppercase tracking-wider ${
                  viewingFirm.status === 'suspended' || viewingFirm.active === false
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {viewingFirm.status || (viewingFirm.active ? 'active' : 'suspended')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Google Drive Integration:</span>
                <span className={viewingFirm.driveConnected ? 'text-sky-600 font-medium' : 'text-slate-400'}>
                  {viewingFirm.driveConnected ? `Connected (${viewingFirm.driveEmail})` : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Initial Password Changed:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {viewingFirm.mustChangePassword ? 'Pending First-Login Change' : 'Yes (Password Secured)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">City / Jurisdiction:</span>
                <span className="text-slate-900 dark:text-slate-100">{viewingFirm.city || 'India'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500">Created On:</span>
                <span className="text-slate-700 dark:text-slate-300">{viewingFirm.createdAt?.slice(0, 10) || 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setViewingFirm(null)}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
