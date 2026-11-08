import React, { useState, useRef } from 'react';
import {
  Upload,
  Search,
  FileText,
  Play,
  ChevronLeft,
  Cpu,
  ArrowUpRight,
  FolderOpen,
} from 'lucide-react';
import { useFenora } from '../../context/FenoraContext';
import { DOCUMENT_CATEGORIES, FINANCIAL_YEARS } from '../../data/seedData';
import {
  AccountingDocument,
  DocumentCategory,
  NavigationTab,
} from '../../types/accounting';

interface DocumentsSectionProps {
  initialClientId?: string | null;
  onNavigate: (tab: NavigationTab, clientId?: string) => void;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  initialClientId,
  onNavigate,
}) => {
  const {
    clients,
    documents,
    vouchers,
    voucherEntries,
    auditEvents,
    uploadDocument,
    triggerAIProcessingForDoc,
  } = useFenora();

  const approvedClients = clients.filter(
    (c) => c.membershipStatus !== 'PENDING' && c.membershipStatus !== 'REJECTED'
  );

  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(
    initialClientId || 'ALL'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Upload form state
  const [uploadClientId, setUploadClientId] = useState<string>(
    initialClientId || approvedClients[0]?.id || ''
  );
  const [uploadFY, setUploadFY] = useState<string>('2026-27');
  const [uploadPeriod, setUploadPeriod] = useState<string>('Nov 2026');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Purchase Invoice');
  const [uploadVendor, setUploadVendor] = useState<string>('');
  const [uploadAmount, setUploadAmount] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadBanner, setUploadBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const targetClientId = uploadClientId || approvedClients[0]?.id;
    if (!targetClientId) {
      setUploadBanner('Please approve or create a client first before uploading documents.');
      return;
    }

    const f = files[0];
    const ext = f.name.split('.').pop()?.toUpperCase() || 'PDF';
    const sizeKb = Math.max(1, Math.round(f.size / 1024));

    const created = await uploadDocument({
      clientId: targetClientId,
      fileName: f.name,
      fileType: ext,
      fileSize: `${sizeKb} KB`,
      financialYear: uploadFY,
      period: uploadPeriod,
      category: uploadCategory,
      vendorOrParty: uploadVendor.trim() || undefined,
      totalAmount: uploadAmount ? Number(uploadAmount) : undefined,
    });

    setUploadVendor('');
    setUploadAmount('');
    setUploadBanner(`Uploaded "${f.name}" for client review.`);
    setTimeout(() => {
      triggerAIProcessingForDoc(created.id);
    }, 600);
    setTimeout(() => setUploadBanner(null), 4000);
  };

  const activeDoc: AccountingDocument | null =
    documents.find((d) => d.id === activeDocId) || null;

  // Document Detail View
  if (activeDoc) {
    const linkedVoucher = vouchers.find((v) => v.sourceDocumentId === activeDoc.id);
    const linkedEntries = linkedVoucher
      ? voucherEntries.filter((ve) => ve.voucherId === linkedVoucher.id)
      : [];
    const docHistory = auditEvents.filter(
      (a) =>
        a.reference === activeDoc.fileName ||
        (linkedVoucher && a.reference === linkedVoucher.voucherNumber)
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => setActiveDocId(null)}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Documents</span>
            </button>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {activeDoc.fileName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {activeDoc.clientName} · {activeDoc.category} · {activeDoc.period} (FY{' '}
              {activeDoc.financialYear})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {activeDoc.processingStatus !== 'Completed' && (
              <button
                type="button"
                onClick={() => triggerAIProcessingForDoc(activeDoc.id)}
                className="px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run AI Extraction</span>
              </button>
            )}
            {linkedVoucher && (
              <button
                type="button"
                onClick={() => onNavigate('voucher-review', activeDoc.clientId)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 rounded-xl inline-flex items-center gap-1.5"
              >
                <span>Open Voucher Review</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Document Summary ({activeDoc.fileType} · {activeDoc.fileSize})
              </span>
              <span className="text-xs font-mono text-slate-500">
                Confidence: {activeDoc.confidence}%
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Counterparty:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeDoc.vendorOrParty || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Document No:</span>
                <span>{activeDoc.invoiceNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{activeDoc.invoiceDate || activeDoc.uploadDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                <span>Total Amount:</span>
                <span>₹{activeDoc.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Proposed Accounting Entries
                </h2>
              </div>

              {!linkedVoucher ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No voucher generated yet. Click "Run AI Extraction" to generate proposed entries.
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-2 font-medium">Ledger Account</th>
                        <th className="py-2 font-medium">Group</th>
                        <th className="py-2 font-medium text-right">Debit (₹)</th>
                        <th className="py-2 font-medium text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {linkedEntries.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                            {line.ledgerName}
                          </td>
                          <td className="py-2.5 text-slate-500">{line.ledgerGroup}</td>
                          <td className="py-2.5 text-right font-mono tabular-nums">
                            {line.entryType === 'Dr'
                              ? `₹${line.amount.toLocaleString('en-IN')}`
                              : '—'}
                          </td>
                          <td className="py-2.5 text-right font-mono tabular-nums">
                            {line.entryType === 'Cr'
                              ? `₹${line.amount.toLocaleString('en-IN')}`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Processing History
              </h2>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {docHistory.length === 0 ? (
                  <p className="text-slate-500 py-2">Uploaded on {activeDoc.uploadDate}</p>
                ) : (
                  docHistory.map((h) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {h.eventType}
                        </span>
                        <p className="text-slate-500 mt-0.5">{h.description}</p>
                      </div>
                      <span className="font-mono tabular-nums text-slate-400 shrink-0">
                        {h.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredDocs = documents.filter((d) => {
    const matchClient =
      selectedClientFilter === 'ALL' || d.clientId === selectedClientFilter;
    const matchCat =
      selectedCategoryFilter === 'ALL' || d.category === selectedCategoryFilter;
    const matchSearch =
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vendorOrParty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClient && matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Client Document Intake · Supports PDF, JPG, JPEG, PNG, XLSX, CSV
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Documents ({documents.length})
          </h1>
        </div>
      </div>

      {uploadBanner && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{uploadBanner}</span>
          <button
            type="button"
            onClick={() => setUploadBanner(null)}
            className="font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Approved Client
            </label>
            <select
              value={uploadClientId}
              onChange={(e) => setUploadClientId(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white"
            >
              {approvedClients.length === 0 ? (
                <option value="">No approved clients yet</option>
              ) : (
                approvedClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Financial Year
            </label>
            <select
              value={uploadFY}
              onChange={(e) => setUploadFY(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white"
            >
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Accounting Period
            </label>
            <select
              value={uploadPeriod}
              onChange={(e) => setUploadPeriod(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white"
            >
              {['Nov 2026', 'Oct 2026', 'Sep 2026', 'Q2 FY26-27'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Document Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Amount in ₹ (Optional)
            </label>
            <input
              type="number"
              value={uploadAmount}
              onChange={(e) => setUploadAmount(e.target.value)}
              placeholder="0"
              className="w-full text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-950/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-slate-900 dark:text-white">
            Drag and drop accounting documents here, or click to browse files
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Supported formats: PDF, JPG, JPEG, PNG, XLSX, CSV
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by document name, party, or client..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Clients</option>
            {approvedClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Categories</option>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table or Zero-State */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
          <FolderOpen className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No documents received yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Client-uploaded accounting documents will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-3 px-5 font-medium">Document Name</th>
                  <th className="py-3 px-4 font-medium">Client · FY</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Upload Date</th>
                  <th className="py-3 px-4 font-medium">Processing Status</th>
                  <th className="py-3 px-4 font-medium">Accounting Status</th>
                  <th className="py-3 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredDocs.map((docItem) => (
                  <tr
                    key={docItem.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => setActiveDocId(docItem.id)}
                        className="text-left font-medium text-slate-900 dark:text-white hover:text-emerald-600 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{docItem.fileName}</span>
                      </button>
                      <p className="text-[11px] text-slate-500 pl-6">
                        {docItem.vendorOrParty} · ₹{docItem.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>{docItem.clientName}</div>
                      <div className="text-slate-400 font-mono">
                        FY {docItem.financialYear} · {docItem.period}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {docItem.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500">
                      {docItem.uploadDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {docItem.processingStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                      {docItem.accountingStatus}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveDocId(docItem.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        Inspect
                      </button>
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

interface AIProcessingSectionProps {
  onNavigate: (tab: NavigationTab, clientId?: string) => void;
}

export const AIProcessingSection: React.FC<AIProcessingSectionProps> = ({ onNavigate }) => {
  const { documents, aiProcessingJobs, triggerAIProcessingForDoc } = useFenora();

  const queuedDocs = documents.filter(
    (d) => d.processingStatus === 'Queued' || d.processingStatus === 'Analyzing'
  );
  const completedDocs = documents.filter((d) => d.processingStatus === 'Completed');
  const attentionDocs = documents.filter(
    (d) => d.extractionStatus === 'Low Confidence' || d.processingStatus === 'Failed'
  );

  // Genuine Mean Confidence (— if no completed docs)
  const meanConfidenceDisplay =
    completedDocs.length > 0
      ? `${Math.round(
          completedDocs.reduce((acc, d) => acc + (d.confidence || 0), 0) /
            completedDocs.length
        )}%`
      : '—';

  const handleProcessAllPending = async () => {
    for (const d of queuedDocs) {
      await triggerAIProcessingForDoc(d.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            AI Accounting Pipeline · Document Extraction & Ledger Rule Validation
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-0.5">
            AI Processing ({aiProcessingJobs.length})
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {queuedDocs.length > 0 && (
            <button
              type="button"
              onClick={handleProcessAllPending}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 rounded-xl inline-flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Process Pending Queue ({queuedDocs.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Genuine Zero-State Queue Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Queue / Analyzing</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {queuedDocs.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Completed Extraction</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {completedDocs.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Low Confidence / Alert</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {attentionDocs.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Mean Confidence</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {meanConfidenceDisplay}
          </p>
        </div>
      </div>

      {/* Processing Jobs Table or Zero-State */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Document Analysis & Rule Validation Jobs
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {aiProcessingJobs.length} jobs
          </span>
        </div>

        {aiProcessingJobs.length === 0 ? (
          <div className="p-10 text-center space-y-1.5">
            <Cpu className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No AI processing jobs yet
            </p>
            <p className="text-[11px] text-slate-400">
              When documents are uploaded, AI extraction and double-entry validation jobs will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 bg-slate-50/60 dark:bg-slate-950/40">
                  <th className="py-3 px-5 font-medium">Document · Client</th>
                  <th className="py-3 px-4 font-medium">Pipeline Stage</th>
                  <th className="py-3 px-4 font-medium">Confidence</th>
                  <th className="py-3 px-4 font-medium">Validation Summary</th>
                  <th className="py-3 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {aiProcessingJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {job.documentName}
                      </p>
                      <p className="text-slate-500">{job.clientName}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <span
                        className={
                          job.stage === 'Completed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {job.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {job.confidence}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {job.validationSummary}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {job.stage !== 'Completed' ? (
                        <button
                          type="button"
                          onClick={() => triggerAIProcessingForDoc(job.documentId)}
                          className="px-3 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-emerald-600 rounded-lg"
                        >
                          Complete Now
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigate('reports', job.clientId)}
                          className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
                        >
                          View Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
