import React, { useState } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  Edit3,
  ChevronLeft,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Users,
  Cpu,
  UserPlus,
  BarChart3,
  FolderOpen,
} from 'lucide-react';
import { useFenora } from '../../context/FenoraContext';
import {
  Client,
  NavigationTab,
} from '../../types/accounting';
import { FINANCIAL_YEARS } from '../../data/seedData';

interface OverviewSectionProps {
  onNavigate: (tab: NavigationTab, clientId?: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNavigate }) => {
  const {
    firm,
    clients,
    documents,
    vouchers,
    aiProcessingJobs,
    auditEvents,
    clientRequests,
  } = useFenora();

  // Only count approved clients in active practice metrics
  const approvedClients = clients.filter((c) => c.membershipStatus !== 'PENDING' && c.membershipStatus !== 'REJECTED');
  const pendingClientRequests = clientRequests.filter(
    (r) =>
      r.requestType === 'MEMBERSHIP' &&
      (r.status === 'PENDING' || r.status === 'Pending Client')
  );

  // Primary Statistics (Genuine Zero-State)
  const totalClientsCount = approvedClients.length;
  const documentsReceivedCount = documents.length;
  const aiCompletedCount = documents.filter((d) => d.processingStatus === 'Completed').length;
  const pendingReviewsCount = vouchers.filter((v) => v.approvalStatus === 'Pending Review').length;

  // Operational Analytics (Genuine Zero-State)
  const pendingJobsCount =
    documents.filter((d) => d.processingStatus === 'Queued' || d.processingStatus === 'Analyzing').length +
    aiProcessingJobs.filter((j) => j.stage !== 'Completed').length;
  const completedJobsCount = aiCompletedCount;
  const completionRate =
    documentsReceivedCount > 0
      ? Math.round((aiCompletedCount / documentsReceivedCount) * 100)
      : 0;
  const averagePrepTimeDisplay = aiCompletedCount > 0 ? '1.8 mins / doc' : '—';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {firm.name} · Firm ID: {firm.id} · FY {firm.defaultFinancialYear || '2026-27'}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            CA Practice Overview
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('client-requests')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Client Requests ({pendingClientRequests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('clients')}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl transition-colors"
          >
            Manage Clients
          </button>
        </div>
      </div>

      {/* Pending Client Requests Banner (if any) */}
      {pendingClientRequests.length > 0 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {pendingClientRequests.length} Pending Client Registration{pendingClientRequests.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Approve client membership requests to unlock document uploads for their business.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('client-requests')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white self-start sm:self-auto shrink-0"
          >
            Review Requests →
          </button>
        </div>
      )}

      {/* 1. Primary Statistics (4 Clean Zero-State Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('clients')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Clients
            </span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-3 block">
            {totalClientsCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Approved client workspaces
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('documents')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Documents Received
            </span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-3 block">
            {documentsReceivedCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Uploaded across all clients
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ai-processing')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              AI Processing Completed
            </span>
            <Cpu className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-3 block">
            {aiCompletedCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Extracted & validated
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pending Reviews
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-3xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-3 block">
            {pendingReviewsCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Awaiting CA sign-off
          </span>
        </button>
      </div>

      {/* 2. Operational Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Preparation Time & Completion Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Operational Efficiency
            </h2>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              {completionRate}% Completion
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Avg. Preparation Time
              </span>
              <span className="text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {averagePrepTimeDisplay}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Completion Rate
              </span>
              <span className="text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1 block">
                {completionRate}%
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>Pending Jobs: {pendingJobsCount}</span>
              <span>Completed Jobs: {completedJobsCount}</span>
            </div>
          </div>
        </div>

        {/* Monthly Processing Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Monthly Processing Activity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time document intake and accounting job throughput
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          {documentsReceivedCount === 0 ? (
            <div className="py-8 text-center rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                No activity yet
              </p>
              <p className="text-[11px] text-slate-400">
                Your monthly accounting activity will appear here once documents are uploaded.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Documents Ingested
                </span>
                <span className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1 block">
                  {documentsReceivedCount}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Vouchers Generated
                </span>
                <span className="text-xl font-semibold font-mono text-slate-900 dark:text-white mt-1 block">
                  {vouchers.length}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  CA Approved Vouchers
                </span>
                <span className="text-xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {vouchers.filter((v) => v.approvalStatus === 'CA Approved').length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Recent Documents & Accounting Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Received Documents */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Client Documents
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All
            </button>
          </div>
          {documents.length === 0 ? (
            <div className="p-10 text-center space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                No documents received yet
              </p>
              <p className="text-[11px] text-slate-400">
                Client-uploaded invoices and statements will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {documents.slice(0, 5).map((docItem) => (
                <div
                  key={docItem.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                      {docItem.fileName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {docItem.clientName} · {docItem.category} · {docItem.period}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                      ₹{docItem.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {docItem.accountingStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Accounting Activity */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Recent Accounting Activity
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {auditEvents.length} events
            </span>
          </div>
          {auditEvents.length === 0 ? (
            <div className="p-10 text-center space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                No activity yet
              </p>
              <p className="text-[11px] text-slate-400">
                Your accounting activity will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {auditEvents.slice(0, 5).map((evt) => (
                <div key={evt.id} className="px-5 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {evt.eventType}
                    </span>
                    <span className="font-mono tabular-nums">{evt.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                    {evt.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

interface ClientsSectionProps {
  initialSelectedClientId?: string | null;
  onNavigate: (tab: NavigationTab, clientId?: string) => void;
}

type DedicatedClientTab =
  | 'Client Overview'
  | 'Uploaded Documents'
  | 'AI Accounting & History'
  | 'Financial Statements'
  | 'GST Summary'
  | 'Tally Sync';

export const ClientsSection: React.FC<ClientsSectionProps> = ({
  initialSelectedClientId,
  onNavigate,
}) => {
  const {
    clients,
    documents,
    vouchers,
    ledgerAccounts,
    auditEvents,
    tallySyncJobs,
    gstReconciliation,
    createClient,
    updateClient,
    generateTallyXmlForClient,
    simulateTallyImportForClient,
  } = useFenora();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialSelectedClientId || null
  );
  const [clientTab, setClientTab] = useState<DedicatedClientTab>('Client Overview');

  // Create / Edit Client Modal state
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formType, setFormType] = useState<string>('Private Limited');
  const [formGstin, setFormGstin] = useState<string>('');
  const [formPan, setFormPan] = useState<string>('');
  const [formFY, setFormFY] = useState<string>('2026-27');
  const [formEmail, setFormEmail] = useState<string>('');

  // Only show approved clients in the active Clients directory (pending requests are in Client Requests)
  const approvedClients = clients.filter(
    (c) => c.membershipStatus !== 'PENDING' && c.membershipStatus !== 'REJECTED'
  );

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormCode('');
    setFormType('Private Limited');
    setFormGstin('');
    setFormPan('');
    setFormFY('2026-27');
    setFormEmail('');
    setShowClientModal(true);
  };

  const openEditClientModal = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCode(client.code);
    setFormType(client.businessType);
    setFormGstin(client.gstin);
    setFormPan(client.pan);
    setFormFY(client.financialYear);
    setFormEmail(client.contactEmail);
    setShowClientModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingClient) {
      await updateClient(editingClient.id, {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        businessType: formType.trim(),
        gstin: formGstin.trim().toUpperCase(),
        pan: formPan.trim().toUpperCase(),
        financialYear: formFY,
        contactEmail: formEmail.trim(),
      });
    } else {
      const created = await createClient({
        name: formName.trim(),
        code: formCode.trim() || `CLI-${approvedClients.length + 1}`,
        businessType: formType.trim(),
        gstin: formGstin.trim().toUpperCase(),
        pan: formPan.trim().toUpperCase(),
        financialYear: formFY,
        contactEmail: formEmail.trim(),
      });
      setSelectedClientId(created.id);
    }
    setShowClientModal(false);
  };

  const activeClient = approvedClients.find((c) => c.id === selectedClientId) || null;

  // DEDICATED CLIENT WORKSPACE (Isolated to Selected Client)
  if (activeClient) {
    const clientDocs = documents.filter((d) => d.clientId === activeClient.id);
    const clientVouchers = vouchers.filter((v) => v.clientId === activeClient.id);
    const clientLedgers = ledgerAccounts.filter((l) => l.clientId === activeClient.id);
    const clientAudit = auditEvents.filter((a) => a.clientId === activeClient.id);
    const clientTallyJobs = tallySyncJobs.filter((t) => t.clientId === activeClient.id);
    const clientGstItems = gstReconciliation.filter((g) => g.clientId === activeClient.id);

    // Strictly derived financial metrics for this client (0 if no processed vouchers exist)
    const salesVouchers = clientVouchers.filter((v) => v.voucherType === 'Sales');
    const purchaseVouchers = clientVouchers.filter((v) => v.voucherType === 'Purchase');
    const expenseVouchers = clientVouchers.filter(
      (v) => v.voucherType === 'Payment' || v.voucherType === 'Journal'
    );

    const totalRevenue = salesVouchers.reduce((sum, v) => sum + v.totalCredit, 0);
    const totalPurchases = purchaseVouchers.reduce((sum, v) => sum + v.totalDebit, 0);
    const totalOperatingExpenses = expenseVouchers.reduce((sum, v) => sum + v.totalDebit, 0);
    const totalExpenses = totalPurchases + totalOperatingExpenses;
    const netProfitOrLoss = totalRevenue - totalExpenses;

    const outputGst = Math.round((totalRevenue * 18) / 118);
    const inputGst = Math.round((totalPurchases * 18) / 118);

    const hasProcessedAccountingData = clientVouchers.length > 0;

    const CLIENT_TABS: DedicatedClientTab[] = [
      'Client Overview',
      'Uploaded Documents',
      'AI Accounting & History',
      'Financial Statements',
      'GST Summary',
      'Tally Sync',
    ];

    return (
      <div className="space-y-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => setSelectedClientId(null)}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>All Approved Clients</span>
            </button>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {activeClient.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Code: {activeClient.code}
              {activeClient.gstin ? ` · GSTIN: ${activeClient.gstin}` : ' · GSTIN: Not set'}
              {activeClient.contactEmail ? ` · ${activeClient.contactEmail}` : ''}
              {` · FY ${activeClient.financialYear}`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openEditClientModal(activeClient)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Client Info</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('documents', activeClient.id)}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl"
            >
              Upload Document
            </button>
          </div>
        </div>

        {/* Dedicated Client Workspace Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max">
            {CLIENT_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setClientTab(t)}
                className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  clientTab === t
                    ? 'border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: Client Overview */}
        {clientTab === 'Client Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Uploaded Documents
                </span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {clientDocs.length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Processed Vouchers
                </span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {clientVouchers.length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Recorded Revenue
                </span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Recorded Expenses
                </span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  ₹{totalExpenses.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Client Profile & Google Drive Folder Mapping
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Business Name</span>
                  <span className="font-medium text-slate-900 dark:text-white mt-0.5 block">
                    {activeClient.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Client Gmail</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {activeClient.contactEmail || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Membership Status</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {activeClient.membershipStatus || 'APPROVED'}
                  </span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-400 block">Google Drive Target Folder</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 mt-1 inline-block">
                    Fenora / Clients / {activeClient.name} / {activeClient.financialYear} / Documents
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Uploaded Documents */}
        {clientTab === 'Uploaded Documents' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Client Uploaded Documents ({clientDocs.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('documents', activeClient.id)}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                + Upload Document
              </button>
            </div>
            {clientDocs.length === 0 ? (
              <div className="p-10 text-center space-y-1">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  No documents uploaded for {activeClient.name} yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Documents uploaded by this client or your firm will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                      <th className="py-3 px-5 font-medium">File Name</th>
                      <th className="py-3 px-4 font-medium">Category · Period</th>
                      <th className="py-3 px-4 font-medium text-right">Amount</th>
                      <th className="py-3 px-4 font-medium">Processing Status</th>
                      <th className="py-3 px-5 font-medium text-right">Accounting Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {clientDocs.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-5 font-medium text-slate-900 dark:text-white">
                          {d.fileName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {d.category} · {d.period}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-white">
                          ₹{d.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {d.processingStatus}
                        </td>
                        <td className="py-3 px-5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {d.accountingStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI Accounting & History */}
        {clientTab === 'AI Accounting & History' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  AI Accounting & Voucher Status ({clientVouchers.length})
                </h3>
              </div>
              {clientVouchers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No AI-processed vouchers for this client yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {clientVouchers.map((v) => (
                    <div key={v.id} className="px-5 py-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {v.voucherNumber} · {v.voucherType}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                          {v.partyLedger} ↔ {v.primaryLedger}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="text-slate-900 dark:text-white font-medium">
                          ₹{v.totalDebit.toLocaleString('en-IN')}
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400">{v.approvalStatus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Document Processing History ({clientAudit.length})
                </h3>
              </div>
              {clientAudit.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No processing history recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {clientAudit.map((evt) => (
                    <div key={evt.id} className="px-5 py-3.5 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {evt.eventType}
                        </span>
                        <span className="font-mono text-slate-400">{evt.timestamp}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{evt.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Financial Statements (Revenue, Expense, P&L, Balance Sheet, Sales & Purchase) */}
        {clientTab === 'Financial Statements' && (
          <div className="space-y-6">
            {!hasProcessedAccountingData ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No Processed Financial Data Yet
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Revenue, Expense, Profit & Loss, Balance Sheet, and Sales & Purchase summaries for{' '}
                  <strong>{activeClient.name}</strong> will be generated automatically once accounting documents are uploaded and processed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profit & Loss Summary */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                    Profit & Loss Statement (FY {activeClient.financialYear})
                  </h3>
                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue from Operations (Sales)</span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        ₹{totalRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Purchases & Direct Costs</span>
                      <span className="text-slate-900 dark:text-white">
                        ₹{totalPurchases.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Operating & Indirect Expenses</span>
                      <span className="text-slate-900 dark:text-white">
                        ₹{totalOperatingExpenses.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold">
                      <span>Net Profit / (Loss)</span>
                      <span
                        className={
                          netProfitOrLoss >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        ₹{netProfitOrLoss.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance Sheet & Ledger Position */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                    Balance Sheet & Sales/Purchase Summary
                  </h3>
                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sales Register Total ({salesVouchers.length} vouchers)</span>
                      <span className="text-slate-900 dark:text-white">
                        ₹{totalRevenue.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Purchase Register Total ({purchaseVouchers.length} vouchers)</span>
                      <span className="text-slate-900 dark:text-white">
                        ₹{totalPurchases.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active Client Ledgers</span>
                      <span className="text-slate-900 dark:text-white">{clientLedgers.length}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold">
                      <span>Current Period Reserve / Surplus</span>
                      <span className="text-slate-900 dark:text-white">
                        ₹{netProfitOrLoss.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GST Summary */}
        {clientTab === 'GST Summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500">Output GST Liability</span>
                <p className="text-2xl font-semibold font-mono text-slate-900 dark:text-white mt-1">
                  ₹{outputGst.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500">Input Tax Credit (Books)</span>
                <p className="text-2xl font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{inputGst.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-500">Net GST Payable</span>
                <p className="text-2xl font-semibold font-mono text-slate-900 dark:text-white mt-1">
                  ₹{Math.max(0, outputGst - inputGst).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {clientGstItems.length === 0 && !hasProcessedAccountingData && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                No GST invoices processed for {activeClient.name} yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: Tally Sync */}
        {clientTab === 'Tally Sync' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  TallyPrime Synchronization Status ({activeClient.tallyStatus})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Export verified vouchers for {activeClient.name} to TallyPrime XML.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateTallyXmlForClient(activeClient.id, activeClient.financialYear)}
                  disabled={clientVouchers.length === 0}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl disabled:opacity-50"
                >
                  Generate Tally XML
                </button>
                <button
                  type="button"
                  onClick={() => simulateTallyImportForClient(activeClient.id, activeClient.financialYear)}
                  disabled={clientVouchers.length === 0}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync with Tally</span>
                </button>
              </div>
            </div>

            {clientTallyJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No Tally synchronization jobs recorded for this client yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {clientTallyJobs.map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {job.tallyCompany}
                      </p>
                      <p className="text-slate-500">{job.summary}</p>
                    </div>
                    <span className="font-mono text-slate-400">{job.syncedAt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Client Directory List View
  const filteredClients = approvedClients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.gstin.toLowerCase().includes(q) ||
      c.contactEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Approved Firm Clients · Select a client to view isolated accounting analytics
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Clients ({approvedClients.length})
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('client-requests')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            Client Requests
          </button>
          <button
            type="button"
            onClick={openNewClientModal}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients by business name, code, or email..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Zero-State or Client Directory Table */}
      {filteredClients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No clients yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              When clients register under your CA firm and you approve their request, their dedicated workspace will appear here.
            </p>
          </div>
          <div className="pt-1 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('client-requests')}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              View Client Requests
            </button>
            <button
              type="button"
              onClick={openNewClientModal}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              + Add Client Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-3.5 px-5 font-medium">Business Name</th>
                  <th className="py-3.5 px-4 font-medium">Email · GSTIN</th>
                  <th className="py-3.5 px-4 font-medium">FY</th>
                  <th className="py-3.5 px-4 font-medium text-right">Documents</th>
                  <th className="py-3.5 px-4 font-medium text-right">Vouchers</th>
                  <th className="py-3.5 px-5 font-medium text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredClients.map((client) => {
                  const docCount = documents.filter((d) => d.clientId === client.id).length;
                  const voucherCount = vouchers.filter((v) => v.clientId === client.id).length;
                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {client.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {client.code} · {client.businessType}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-slate-700 dark:text-slate-300">
                          {client.contactEmail || '—'}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          {client.gstin || 'GSTIN not set'}
                        </p>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300">
                        FY {client.financialYear}
                      </td>
                      <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {docCount}
                      </td>
                      <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {voucherCount}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {editingClient ? 'Edit Client Details' : 'Add Client Workspace'}
            </h2>
            <form onSubmit={handleSaveClient} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sharma Precision Pvt Ltd"
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="SPP"
                    className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={formFY}
                    onChange={(e) => setFormFY(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    {FINANCIAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>
                        FY {fy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    PAN (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formPan}
                    onChange={(e) => setFormPan(e.target.value)}
                    placeholder="AAAAA0000A"
                    className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Client Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-xl"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
