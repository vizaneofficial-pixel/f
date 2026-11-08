import React, { useState } from 'react';
import {
  Plus,
  Search,
  ArrowUpRight,
  Edit3,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useFenora } from '../../context/FenoraContext';
import {
  Client,
  ClientWorkspaceTab,
  NavigationTab,
} from '../../types/accounting';
import { FINANCIAL_YEARS } from '../../data/seedData';

interface OverviewSectionProps {
  onNavigate: (tab: NavigationTab, clientId?: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNavigate }) => {
  const {
    clients,
    documents,
    vouchers,
    tallySyncJobs,
    auditEvents,
  } = useFenora();

  const awaitingAI = documents.filter(
    (d) => d.processingStatus === 'Queued' || d.processingStatus === 'Analyzing'
  ).length;
  const awaitingReview = vouchers.filter((v) => v.approvalStatus === 'Pending Review').length;
  const exceptionsCount =
    documents.filter((d) => d.accountingStatus === 'Exception').length +
    vouchers.filter((v) => v.validationStatus !== 'Valid').length;
  const completedDocs = documents.filter((d) => d.processingStatus === 'Completed').length;
  const failedDocs = documents.filter(
    (d) => d.processingStatus === 'Failed' || d.extractionStatus === 'Low Confidence'
  ).length;
  const syncedClientsCount = clients.filter((c) => c.tallyStatus === 'Synced').length;

  return (
    <div className="space-y-8">
      {/* Header & Simulated Data Disclosure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Firm Overview · FY 2026-27 · Simulated Indian CA Workspace Data
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Practice Operations
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('documents')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Upload Document
          </button>
          <button
            type="button"
            onClick={() => onNavigate('voucher-review')}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Review Vouchers ({awaitingReview})
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Single-Elevation, Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('clients')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-colors"
        >
          <span className="text-xs text-slate-500 block">Total Clients</span>
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1 block">
            {clients.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('documents')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-colors"
        >
          <span className="text-xs text-slate-500 block">Docs Received</span>
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1 block">
            {documents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ai-processing')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-colors"
        >
          <span className="text-xs text-slate-500 block">Awaiting AI</span>
          <span className="text-2xl font-semibold font-mono tabular-nums text-amber-700 mt-1 block">
            {awaitingAI}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('accounting')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-colors"
        >
          <span className="text-xs text-slate-500 block">Vouchers</span>
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1 block">
            {vouchers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('voucher-review')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-colors"
        >
          <span className="text-xs text-slate-500 block">Pending Review</span>
          <span className="text-2xl font-semibold font-mono tabular-nums text-emerald-700 mt-1 block">
            {awaitingReview}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('voucher-review')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-colors"
        >
          <span className="text-xs text-slate-500 block">Exceptions</span>
          <span className="text-2xl font-semibold font-mono tabular-nums text-red-600 mt-1 block">
            {exceptionsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tally')}
          className="text-left bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-4 transition-colors col-span-2 sm:col-span-1"
        >
          <span className="text-xs text-slate-500 block">Tally Synced</span>
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1 block">
            {syncedClientsCount}/{clients.length}
          </span>
        </button>
      </div>

      {/* Processing Statistics & Tally Status Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              AI Extraction & Validation Rate
            </h2>
            <span className="text-xs font-mono tabular-nums text-emerald-700">
              {documents.length > 0
                ? `${Math.round(((completedDocs - failedDocs) / documents.length) * 100)}% Clean`
                : '100%'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full"
              style={{ width: `${Math.max(15, (completedDocs / Math.max(1, documents.length)) * 100)}%` }}
            />
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${(awaitingAI / Math.max(1, documents.length)) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums pt-1">
            <span>Succeeded: {completedDocs - failedDocs}</span>
            <span>Low Confidence / Alert: {failedDocs}</span>
            <span>In Queue: {awaitingAI}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              TallyPrime Synchronization Summary (Simulated)
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('tally')}
              className="text-xs font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              Open Tally Connector <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {tallySyncJobs.slice(0, 2).map((job) => (
              <div
                key={job.id}
                className="border border-slate-200 rounded-md p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{job.clientName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job.status} · {job.vouchersCount} vouchers · {job.syncedAt}
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-emerald-700 shrink-0">
                  FY {job.financialYear}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Recently Processed Documents & Recent Accounting Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Processed Documents */}
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Recently Processed Documents
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {documents.slice(0, 5).map((docItem) => (
              <div
                key={docItem.id}
                className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {docItem.fileName}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {docItem.clientName} · {docItem.category} · {docItem.period}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono tabular-nums font-medium text-slate-900">
                    ₹{docItem.totalAmount.toLocaleString('en-IN')}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      docItem.accountingStatus === 'Exception'
                        ? 'text-red-600'
                        : docItem.accountingStatus === 'CA Approved'
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {docItem.accountingStatus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Accounting Activity */}
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Accounting Activity
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('audit')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Audit Trail
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {auditEvents.slice(0, 5).map((evt) => (
              <div key={evt.id} className="px-5 py-3.5 space-y-1 hover:bg-slate-50/70">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-800">{evt.eventType}</span>
                  <span className="font-mono tabular-nums">{evt.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">{evt.description}</p>
                <p className="text-xs text-slate-400">
                  {evt.clientName} · Ref: <span className="font-mono">{evt.reference}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

interface ClientsSectionProps {
  initialSelectedClientId?: string | null;
  onNavigate: (tab: NavigationTab, clientId?: string) => void;
}

export const ClientsSection: React.FC<ClientsSectionProps> = ({
  initialSelectedClientId,
  onNavigate,
}) => {
  const {
    clients,
    documents,
    vouchers,
    ledgerAccounts,
    accountingProfiles,
    auditEvents,
    tallySyncJobs,
    gstReconciliation,
    createClient,
    updateClient,
    updateAccountingProfile,
    generateTallyXmlForClient,
    simulateTallyImportForClient,
  } = useFenora();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialSelectedClientId || null
  );
  const [workspaceTab, setWorkspaceTab] = useState<ClientWorkspaceTab>('Overview');

  // Create / Edit Client Modal state
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formType, setFormType] = useState<string>('Private Limited · Manufacturing');
  const [formGstin, setFormGstin] = useState<string>('');
  const [formPan, setFormPan] = useState<string>('');
  const [formFY, setFormFY] = useState<string>('2026-27');
  const [formEmail, setFormEmail] = useState<string>('');

  // Accounting profile conventions edit state
  const [conventionsDraft, setConventionsDraft] = useState<string>('');
  const [profileSavedToast, setProfileSavedToast] = useState<boolean>(false);

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormCode('');
    setFormType('Private Limited · Manufacturing');
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
    if (!formName.trim() || !formGstin.trim()) return;

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
        name: formName,
        code: formCode || `CLI-${clients.length + 1}`,
        businessType: formType,
        gstin: formGstin,
        pan: formPan || formGstin.slice(2, 12),
        financialYear: formFY,
        contactEmail: formEmail || 'accounts@client.in',
      });
      setSelectedClientId(created.id);
    }
    setShowClientModal(false);
  };

  const activeClient = clients.find((c) => c.id === selectedClientId) || null;

  // If a client workspace is open, render the 9-tab Client Workspace
  if (activeClient) {
    const clientDocs = documents.filter((d) => d.clientId === activeClient.id);
    const clientVouchers = vouchers.filter((v) => v.clientId === activeClient.id);
    const clientLedgers = ledgerAccounts.filter((l) => l.clientId === activeClient.id);
    const clientProfile = accountingProfiles.find((p) => p.clientId === activeClient.id);
    const clientAudit = auditEvents.filter((a) => a.clientId === activeClient.id);
    const clientTallyJobs = tallySyncJobs.filter((t) => t.clientId === activeClient.id);
    const clientGstItems = gstReconciliation.filter((g) => g.clientId === activeClient.id);

    const WORKSPACE_TABS: ClientWorkspaceTab[] = [
      'Overview',
      'Documents',
      'Accounting Profile',
      'Historical Books',
      'Ledger Mapping',
      'Vouchers',
      'GST',
      'Audit History',
      'Tally Synchronization',
    ];

    return (
      <div className="space-y-6">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => setSelectedClientId(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              All Clients
            </button>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              {activeClient.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {activeClient.code} · GSTIN {activeClient.gstin} · PAN {activeClient.pan} · FY{' '}
              {activeClient.financialYear}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openEditClientModal(activeClient)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Client
            </button>
            <button
              type="button"
              onClick={() => onNavigate('documents', activeClient.id)}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap shrink-0"
            >
              Upload Document
            </button>
          </div>
        </div>

        {/* 9 Client Workspace Tabs */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-5 min-w-max">
            {WORKSPACE_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setWorkspaceTab(t);
                  if (t === 'Accounting Profile' && clientProfile) {
                    setConventionsDraft(clientProfile.conventionsSummary);
                  }
                }}
                className={`py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  workspaceTab === t
                    ? 'border-slate-900 text-slate-900 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview */}
        {workspaceTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <span className="text-xs text-slate-500">Documents</span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {clientDocs.length}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <span className="text-xs text-slate-500">Vouchers</span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {clientVouchers.length}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <span className="text-xs text-slate-500">Client Ledgers</span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                  {clientLedgers.length}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <span className="text-xs text-slate-500">Profile Completeness</span>
                <p className="text-2xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
                  {clientProfile?.profileCompleteness ?? 80}%
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Accounting Memory & Conventions Summary
              </h3>
              <p className="text-sm text-slate-600">
                {clientProfile?.conventionsSummary}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>Method: {clientProfile?.accountingMethod}</span>
                <span>·</span>
                <span>GST Filing: {clientProfile?.gstFilingFrequency}</span>
                <span>·</span>
                <span>Tally Status: {activeClient.tallyStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Documents */}
        {workspaceTab === 'Documents' && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Uploaded Documents ({clientDocs.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('documents', activeClient.id)}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                + Upload in Document Manager
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                    <th className="py-3 px-5 font-medium">File Name</th>
                    <th className="py-3 px-4 font-medium">Category · Period</th>
                    <th className="py-3 px-4 font-medium text-right">Amount</th>
                    <th className="py-3 px-4 font-medium">AI Confidence</th>
                    <th className="py-3 px-5 font-medium text-right">Accounting Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {clientDocs.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-5 font-medium text-slate-900">{d.fileName}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {d.category} · {d.period}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        ₹{d.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600">
                        {d.confidence}%
                      </td>
                      <td className="py-3 px-5 text-right text-xs font-medium text-slate-700">
                        {d.accountingStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Accounting Profile (Memory Architecture A-F) */}
        {workspaceTab === 'Accounting Profile' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Client Accounting Memory Architecture (Simulated Profile)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structured rule layers preparing for future Gemini & historical book learning.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-emerald-700">
                  Completeness: {clientProfile?.profileCompleteness ?? 85}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs font-semibold text-slate-900">
                    A. Firm Accounting Standards
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {clientProfile?.accountingMethod || 'Mercantile · Ind AS / ICDS Verified'}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs font-semibold text-slate-900">
                    B. Client Ledger Mappings
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {clientLedgers.length} active client ledgers mapped with supplier GSTIN and HSN rules.
                  </p>
                </div>
                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs font-semibold text-slate-900">
                    C. Historical Accounting Books
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {clientProfile?.historicalBooksStatus}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs font-semibold text-slate-900">
                    D. Previously CA-Approved Vouchers
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {clientVouchers.filter((v) => v.approvalStatus === 'CA Approved').length} locked vouchers in current FY.
                  </p>
                </div>
                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs font-semibold text-slate-900">
                    E. CA Corrections Memory
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {clientProfile?.aiLearningStatus}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-md p-4">
                  <p className="text-xs font-semibold text-slate-900">
                    F. GST & Reverse Charge Config
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {clientProfile?.gstFilingFrequency} · {clientProfile?.reverseChargeDefault}
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Client-Specific Accounting Conventions & Instructions
                </label>
                <textarea
                  rows={3}
                  value={conventionsDraft || clientProfile?.conventionsSummary || ''}
                  onChange={(e) => setConventionsDraft(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    Note: Initial version uses simulated rule profiles; live LLM training on uploaded books is not active yet.
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await updateAccountingProfile(activeClient.id, {
                        conventionsSummary:
                          conventionsDraft || clientProfile?.conventionsSummary || '',
                      });
                      setProfileSavedToast(true);
                      setTimeout(() => setProfileSavedToast(false), 2500);
                    }}
                    className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                  >
                    {profileSavedToast ? 'Saved to Profile' : 'Save Conventions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Historical Books */}
        {workspaceTab === 'Historical Books' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Historical Books Ingestion Status (Simulated)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prior financial year Trial Balance and Tally Master snapshots used for reference.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600">
                {clientProfile?.historicalBooksStatus}
              </span>
            </div>

            <div className="border border-slate-200 rounded-md divide-y divide-slate-200 text-sm">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    FY 2025-26 Audited Trial Balance & Ledger Master (Tally XML)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    142 Ledger Masters · Opening Balances Verified · Simulated Reference Snapshot
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-700">Indexed (Simulated)</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">
                    FY 2024-25 Tax Audit Grouping Schedule (Form 3CD Clauses)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prior year disallowance & TDS 40(a)(ia) mapping reference
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-600">Reference Only</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Ledger Mapping */}
        {workspaceTab === 'Ledger Mapping' && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Client Ledgers & AI Keyword Mapping ({clientLedgers.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('ledgers', activeClient.id)}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Manage All Ledgers
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                    <th className="py-3 px-5 font-medium">Ledger Name</th>
                    <th className="py-3 px-4 font-medium">Group</th>
                    <th className="py-3 px-4 font-medium">AI Keywords / Pattern</th>
                    <th className="py-3 px-4 font-medium text-right">Opening Balance</th>
                    <th className="py-3 px-5 font-medium text-right">Tally Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {clientLedgers.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-5 font-medium text-slate-900">{l.name}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{l.group}</td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {l.aiSuggestedKeywords}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        ₹{l.openingBalance.toLocaleString('en-IN')} {l.balanceType}
                      </td>
                      <td className="py-3 px-5 text-right text-xs text-slate-700">
                        {l.tallySyncStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Vouchers */}
        {workspaceTab === 'Vouchers' && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Client Vouchers ({clientVouchers.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('voucher-review', activeClient.id)}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Open in Voucher Review
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                    <th className="py-3 px-5 font-medium">Voucher No · Date</th>
                    <th className="py-3 px-4 font-medium">Type · Party</th>
                    <th className="py-3 px-4 font-medium text-right">Debit (₹)</th>
                    <th className="py-3 px-4 font-medium text-right">Credit (₹)</th>
                    <th className="py-3 px-5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {clientVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-5 font-mono tabular-nums text-xs text-slate-900">
                        {v.voucherNumber} · {v.voucherDate}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {v.voucherType} · {v.partyLedger}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        ₹{v.totalDebit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        ₹{v.totalCredit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-5 text-right text-xs font-medium text-slate-700">
                        {v.approvalStatus} ({v.validationStatus})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: GST */}
        {workspaceTab === 'GST' && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Simulated GSTR-2B vs Books Reconciliation ({activeClient.gstin})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('gst', activeClient.id)}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                Full GST Workspace
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                    <th className="py-3 px-5 font-medium">Supplier · GSTIN</th>
                    <th className="py-3 px-4 font-medium">Invoice</th>
                    <th className="py-3 px-4 font-medium text-right">Books Tax</th>
                    <th className="py-3 px-4 font-medium text-right">2B Tax</th>
                    <th className="py-3 px-5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {clientGstItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-5 text-xs">
                        <p className="font-medium text-slate-900">{item.supplierName}</p>
                        <p className="text-slate-500 font-mono">{item.supplierGstin}</p>
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-700">
                        {item.invoiceNo}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        ₹{item.booksIgstCgstSgst.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs">
                        ₹{item.gstr2bTax.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-5 text-right text-xs font-medium text-slate-800">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Audit History */}
        {workspaceTab === 'Audit History' && (
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Append-Only Client Audit History ({clientAudit.length})
              </h3>
            </div>
            {clientAudit.map((evt) => (
              <div key={evt.id} className="px-5 py-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{evt.eventType}</span>
                  <span className="font-mono tabular-nums">{evt.timestamp}</span>
                </div>
                <p className="text-xs text-slate-700">{evt.description}</p>
                <p className="text-xs text-slate-400">
                  Actor: {evt.actor} · Ref: <span className="font-mono">{evt.reference}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 9: Tally Synchronization */}
        {workspaceTab === 'Tally Synchronization' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  TallyPrime Synchronization ({activeClient.tallyStatus})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate TallyPrime XML or run a simulated voucher import for {activeClient.name}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateTallyXmlForClient(activeClient.id, activeClient.financialYear)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md"
                >
                  Generate Tally XML
                </button>
                <button
                  type="button"
                  onClick={() => simulateTallyImportForClient(activeClient.id, activeClient.financialYear)}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Simulate Tally Import
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
              {clientTallyJobs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No Tally sync jobs recorded for this client yet. Click "Simulate Tally Import" above.
                </div>
              ) : (
                clientTallyJobs.map((job) => (
                  <div key={job.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{job.tallyCompany}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{job.summary}</p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                      {job.syncedAt}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Client Directory List View
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || c.accountingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Client Directory · Multi-Tenant CA Firm Workspace
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Clients ({clients.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={openNewClientModal}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Client
        </button>
      </div>

      {/* Search & Segmented Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, code, GSTIN, or PAN..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-md">
          {['ALL', 'Up to Date', 'Review Pending', 'Action Required'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status === 'ALL' ? 'All Clients' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                <th className="py-3 px-5 font-medium">Client Name · Code</th>
                <th className="py-3 px-4 font-medium">Business Type</th>
                <th className="py-3 px-4 font-medium">GSTIN · PAN</th>
                <th className="py-3 px-4 font-medium">FY</th>
                <th className="py-3 px-4 font-medium">Accounting · Docs</th>
                <th className="py-3 px-4 font-medium">Tally Status</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientId(client.id);
                        setWorkspaceTab('Overview');
                      }}
                      className="text-left font-semibold text-slate-900 hover:text-emerald-700 transition-colors"
                    >
                      {client.name}
                    </button>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{client.code}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{client.businessType}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700">
                    <div>{client.gstin}</div>
                    <div className="text-slate-400">PAN: {client.pan}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700">
                    {client.financialYear}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <span
                      className={`font-medium ${
                        client.accountingStatus === 'Action Required'
                          ? 'text-red-600'
                          : client.accountingStatus === 'Review Pending'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {client.accountingStatus}
                    </span>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-600">{client.docProcessingStatus}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">{client.tallyStatus}</td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditClientModal(client)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setWorkspaceTab('Overview');
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded"
                      >
                        Workspace
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              {editingClient ? 'Edit Client Information' : 'Create New Client'}
            </h2>
            <form onSubmit={handleSaveClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sahyadri Forgings Pvt. Ltd."
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Client Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="SFP-05"
                    className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={formFY}
                    onChange={(e) => setFormFY(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                  >
                    {FINANCIAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>
                        {fy}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Business Type
                </label>
                <input
                  type="text"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GSTIN (15 chars)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    placeholder="27AABCS1429P1Z1"
                    className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PAN (10 chars)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formPan}
                    onChange={(e) => setFormPan(e.target.value)}
                    placeholder="AABCS1429P"
                    className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2 uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Client Portal Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="accounts@company.in"
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                >
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
