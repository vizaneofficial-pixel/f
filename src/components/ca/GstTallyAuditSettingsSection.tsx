import React, { useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  Code2,
  Shield,
  CheckCircle2,
  Database,
  Server,
  HardDrive,
  UserPlus,
  Check,
  X,
  BarChart3,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useFenora } from '../../context/FenoraContext';
import { FINANCIAL_YEARS } from '../../data/seedData';
import { NavigationTab } from '../../types/accounting';

/**
 * 1. CLIENT REQUESTS SECTION (CA Approval System for Client Registrations)
 */
export const ClientRequestsSection: React.FC = () => {
  const {
    clientRequests,
    clients,
    approveClientMembership,
    rejectClientMembership,
  } = useFenora();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Combine membership requests from clientRequests collection
  const membershipRequests = clientRequests.filter(
    (r) =>
      r.requestType === 'MEMBERSHIP' ||
      r.status === 'PENDING' ||
      r.status === 'APPROVED' ||
      r.status === 'REJECTED'
  );

  // Also surface any client record in `clients` with PENDING status that might not have a matching request entry
  const standalonePendingClients = clients.filter(
    (c) =>
      c.membershipStatus === 'PENDING' &&
      !membershipRequests.some((r) => r.clientId === c.id)
  );

  const unifiedRequests = [
    ...membershipRequests.map((r) => ({
      id: r.id,
      clientName: r.clientName,
      businessName: r.businessName || r.clientName,
      email: r.email || '—',
      requestedAt: r.requestedAt || r.updatedAt || '—',
      membershipStatus:
        r.status === 'APPROVED' || r.status === 'Resolved'
          ? 'APPROVED'
          : r.status === 'REJECTED'
          ? 'REJECTED'
          : 'PENDING',
    })),
    ...standalonePendingClients.map((c) => ({
      id: `req_mem_${c.id}`,
      clientName: c.name,
      businessName: c.businessName || c.name,
      email: c.contactEmail || '—',
      requestedAt: 'Recent',
      membershipStatus: c.membershipStatus || 'PENDING',
    })),
  ];

  const filteredRequests = unifiedRequests.filter((req) => {
    if (statusFilter === 'ALL') return true;
    return req.membershipStatus === statusFilter;
  });

  const pendingCount = unifiedRequests.filter((r) => r.membershipStatus === 'PENDING').length;

  const handleApprove = async (reqId: string, businessName: string) => {
    setProcessingId(reqId);
    setFeedbackMsg(null);
    const res = await approveClientMembership(reqId);
    setProcessingId(null);
    if (res.ok) {
      setFeedbackMsg(`Approved ${businessName}. Client can now upload accounting documents.`);
    } else {
      setFeedbackMsg(res.error || 'Could not approve request.');
    }
  };

  const handleReject = async (reqId: string, businessName: string) => {
    setProcessingId(reqId);
    setFeedbackMsg(null);
    const res = await rejectClientMembership(reqId);
    setProcessingId(null);
    if (res.ok) {
      setFeedbackMsg(`Rejected membership request from ${businessName}.`);
    } else {
      setFeedbackMsg(res.error || 'Could not reject request.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Client Membership Verification · Clients cannot upload documents until approved
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Client Requests ({pendingCount} Pending)
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <UserPlus className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No client registration requests
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            When clients select your CA firm during registration, their membership requests will appear here for your approval.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-3.5 px-5 font-medium">Client Name</th>
                  <th className="py-3.5 px-4 font-medium">Business / Company Name</th>
                  <th className="py-3.5 px-4 font-medium">Gmail Address</th>
                  <th className="py-3.5 px-4 font-medium">Request Date</th>
                  <th className="py-3.5 px-4 font-medium">Approval Status</th>
                  <th className="py-3.5 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredRequests.map((req) => {
                  const isBusy = processingId === req.id;
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white">
                        {req.clientName}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {req.businessName}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {req.email}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-500">
                        {req.requestedAt}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                            req.membershipStatus === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : req.membershipStatus === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {req.membershipStatus}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {req.membershipStatus === 'PENDING' ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApprove(req.id, req.businessName)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>APPROVE</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleReject(req.id, req.businessName)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>REJECT</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            Decision Recorded
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 2. REPORTS & ANALYTICS SECTION (Firm-wide & Client-Isolated Financial Reports, GST & Tally)
 */
interface ReportsAndAnalyticsSectionProps {
  initialClientId?: string | null;
  onNavigate?: (tab: NavigationTab, clientId?: string) => void;
}

export const ReportsAndAnalyticsSection: React.FC<ReportsAndAnalyticsSectionProps> = ({
  initialClientId,
}) => {
  const {
    clients,
    vouchers,
    documents,
    tallySyncJobs,
    generateTallyXmlForClient,
    simulateTallyImportForClient,
  } = useFenora();

  const approvedClients = clients.filter(
    (c) => c.membershipStatus !== 'PENDING' && c.membershipStatus !== 'REJECTED'
  );

  const [selectedClient, setSelectedClient] = useState<string>(initialClientId || 'ALL');
  const [selectedFY, setSelectedFY] = useState<string>('2026-27');

  const scopedVouchers = vouchers.filter(
    (v) => selectedClient === 'ALL' || v.clientId === selectedClient
  );
  const scopedDocs = documents.filter(
    (d) => selectedClient === 'ALL' || d.clientId === selectedClient
  );

  // Strictly real calculations (Zero-State = 0, never fallback to fake numbers)
  const salesVouchers = scopedVouchers.filter((v) => v.voucherType === 'Sales');
  const purchaseVouchers = scopedVouchers.filter((v) => v.voucherType === 'Purchase');
  const expenseVouchers = scopedVouchers.filter(
    (v) => v.voucherType === 'Payment' || v.voucherType === 'Journal'
  );

  const totalSales = salesVouchers.reduce((s, v) => s + v.totalCredit, 0);
  const totalPurchases = purchaseVouchers.reduce((s, v) => s + v.totalDebit, 0);
  const totalOtherExpenses = expenseVouchers.reduce((s, v) => s + v.totalDebit, 0);
  const totalExpenses = totalPurchases + totalOtherExpenses;
  const netProfit = totalSales - totalExpenses;

  const outputGst = Math.round((totalSales * 18) / 118);
  const inputGst = Math.round((totalPurchases * 18) / 118);

  const activeClientObj = approvedClients.find((c) => c.id === selectedClient);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Financial Statements, GST Summary & TallyPrime Export · Populated strictly from verified data
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Reports & Analytics
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Approved Clients ({approvedClients.length})</option>
            {approvedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
          >
            {FINANCIAL_YEARS.map((fy) => (
              <option key={fy} value={fy}>
                FY {fy}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards (Strict Zero-State) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Revenue (Sales)</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            ₹{totalSales.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Expenses</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Net Profit / (Loss)</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{netProfit.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Net GST Liability</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            ₹{Math.max(0, outputGst - inputGst).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {scopedVouchers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <BarChart3 className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            No processed accounting data yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Profit & Loss, Balance Sheet, Sales & Purchase registers, and GST reports will be populated once client documents are uploaded and processed ({scopedDocs.length} documents currently on file).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
              Profit & Loss Summary
            </h2>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Sales & Operational Revenue</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  ₹{totalSales.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Purchases ({purchaseVouchers.length} vouchers)</span>
                <span className="text-slate-900 dark:text-white">
                  ₹{totalPurchases.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operating Expenses</span>
                <span className="text-slate-900 dark:text-white">
                  ₹{totalOtherExpenses.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold">
                <span>Net Surplus / (Deficit)</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ₹{netProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                GST & TallyPrime Sync Status
              </h2>
              {activeClientObj && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generateTallyXmlForClient(activeClientObj.id, selectedFY)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    Generate XML
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateTallyImportForClient(activeClientObj.id, selectedFY)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600 text-white"
                  >
                    Sync Tally
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Output GST (Sales)</span>
                <span className="text-slate-900 dark:text-white">
                  ₹{outputGst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Input GST Credit (Purchases)</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ₹{inputGst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tally Sync Jobs Recorded</span>
                <span className="text-slate-900 dark:text-white">{tallySyncJobs.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GSTReconciliationSection: React.FC<{ initialClientId?: string | null }> = ({
  initialClientId,
}) => {
  return <ReportsAndAnalyticsSection initialClientId={initialClientId} />;
};

export const TallyIntegrationSection: React.FC = () => {
  return <ReportsAndAnalyticsSection />;
};

export const AuditTrailSection: React.FC = () => {
  const { clients, auditEvents } = useFenora();
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = auditEvents.filter((evt) => {
    const matchClient = selectedClient === 'ALL' || evt.clientId === selectedClient;
    const matchSearch =
      evt.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.actor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClient && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Append-Only Immutable Event Log
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
          Audit Trail ({auditEvents.length})
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit events..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
        >
          <option value="ALL">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-400">
          No audit events recorded yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-3 px-5 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Client</th>
                  <th className="py-3 px-4 font-medium">Event Type</th>
                  <th className="py-3 px-4 font-medium">Actor</th>
                  <th className="py-3 px-5 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id}>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{evt.timestamp}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {evt.clientName}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {evt.eventType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{evt.actor}</td>
                    <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300">
                      {evt.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 3. SETTINGS SECTION (CA Firm Details & Google Drive Connection Management)
 */
export const SettingsSection: React.FC = () => {
  const {
    firm,
    firebaseUser,
    userProfile,
    connectGoogleDrive,
    disconnectGoogleDrive,
  } = useFenora();

  const [isCheckingDrive, setIsCheckingDrive] = useState<boolean>(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState<{
    ok: boolean;
    message?: string;
    missingEnvVars?: string[];
  } | null>(null);

  const handleConnectDrive = async () => {
    setIsCheckingDrive(true);
    setDriveStatusMsg(null);
    const res = await connectGoogleDrive();
    setIsCheckingDrive(false);
    setDriveStatusMsg({
      ok: res.ok,
      message: res.error,
      missingEnvVars: res.missingEnvVars,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Multi-Firm Tenant Configuration & Google Drive Storage Adapter
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
          Firm Settings
        </h1>
      </div>

      {/* CA Firm Profile */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Chartered Accountant Firm Tenant Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visible in the client registration CA firm directory
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            Active Firm
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
              Permanent Firm ID
            </label>
            <div className="px-3 py-2 rounded-xl font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              {firm.id}
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
              Firm Name
            </label>
            <div className="px-3 py-2 rounded-xl font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              {firm.name || '—'}
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
              Owner / Partner CA Name
            </label>
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              {firm.ownerName || userProfile?.displayName || '—'}
            </div>
          </div>
          <div>
            <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
              Owner Gmail & Contact
            </label>
            <div className="px-3 py-2 rounded-xl font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 truncate">
              {firebaseUser?.email || userProfile?.email}{' '}
              {firm.contactPhone ? `· ${firm.contactPhone}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Integration Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Google Drive Document Storage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Folder hierarchy: <span className="font-mono">Fenora / Clients / Client Name / Financial Year / Documents</span>
              </p>
            </div>
          </div>

          {firm.driveConnected ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 truncate max-w-xs">
                Connected: {firm.driveEmail || 'Authorized Account'}
              </span>
              <button
                type="button"
                onClick={disconnectGoogleDrive}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                Disconnect Drive
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectDrive}
              disabled={isCheckingDrive}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {isCheckingDrive && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Connect Google Drive</span>
            </button>
          )}
        </div>

        {driveStatusMsg && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              driveStatusMsg.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-start gap-2">
              {driveStatusMsg.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">
                  {driveStatusMsg.ok
                    ? 'Google Drive Connected'
                    : 'Backend Google OAuth Configuration Required'}
                </p>
                {driveStatusMsg.message && <p>{driveStatusMsg.message}</p>}
                {driveStatusMsg.missingEnvVars && driveStatusMsg.missingEnvVars.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {driveStatusMsg.missingEnvVars.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded bg-slate-900/10 dark:bg-white/10 font-mono text-[10px]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Architecture & Security Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-200 dark:divide-slate-800">
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Multi-Firm Firestore Security & Tenant Isolation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every client, document, and voucher is isolated by permanent firmId and verified ownership.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
            Active
          </span>
        </div>

        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                n8n Webhook & Gemini Document Extraction Pipeline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ready for N8N_DOCUMENT_WEBHOOK_URL and server-side Gemini multimodal extraction.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500 shrink-0">Ready</span>
        </div>
      </div>
    </div>
  );
};
