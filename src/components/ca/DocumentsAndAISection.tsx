import React, { useState, useRef } from 'react';
import {
  Upload,
  Search,
  FileText,
  Play,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  ArrowUpRight,
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

  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(
    initialClientId || 'ALL'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Upload form state
  const [uploadClientId, setUploadClientId] = useState<string>(
    initialClientId || clients[0]?.id || 'client_aravind_tex'
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
    const f = files[0];
    const ext = f.name.split('.').pop()?.toUpperCase() || 'PDF';
    const sizeKb = Math.max(18, Math.round(f.size / 1024));

    const created = await uploadDocument({
      clientId: uploadClientId,
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
    setUploadBanner(`Uploaded "${f.name}". Running simulated AI extraction...`);
    setTimeout(() => {
      triggerAIProcessingForDoc(created.id);
    }, 700);
    setTimeout(() => setUploadBanner(null), 4000);
  };

  const handleSampleUpload = async () => {
    const sampleName = `GST_Inv_${uploadCategory.replace(/\s+/g, '')}_${Math.floor(
      1000 + Math.random() * 8999
    )}.pdf`;
    const created = await uploadDocument({
      clientId: uploadClientId,
      fileName: sampleName,
      fileType: 'PDF',
      fileSize: '390 KB',
      financialYear: uploadFY,
      period: uploadPeriod,
      category: uploadCategory,
      vendorOrParty: uploadVendor.trim() || 'Kirloskar Industrial Pneumatics Ltd.',
      totalAmount: uploadAmount ? Number(uploadAmount) : 236000,
    });
    setUploadBanner(`Uploaded "${sampleName}" and queued simulated extraction.`);
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
              className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to Documents
            </button>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {activeDoc.fileName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeDoc.clientName} · {activeDoc.category} · {activeDoc.period} (FY{' '}
              {activeDoc.financialYear})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {activeDoc.processingStatus !== 'Completed' && (
              <button
                type="button"
                onClick={() => triggerAIProcessingForDoc(activeDoc.id)}
                className="px-3.5 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Run Simulated AI Extraction
              </button>
            )}
            {linkedVoucher && (
              <button
                type="button"
                onClick={() => onNavigate('voucher-review', activeDoc.clientId)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5"
              >
                Open in Voucher Review <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Document Preview Placeholder */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-semibold text-slate-900">
                  Document Preview ({activeDoc.fileType} · {activeDoc.fileSize})
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Confidence: {activeDoc.confidence}%
                </span>
              </div>

              {/* Clean Simulated Tax Invoice Document Sheet */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-5 space-y-4 font-mono text-xs text-slate-700">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <p className="font-semibold text-slate-900 uppercase">
                      {activeDoc.vendorOrParty}
                    </p>
                    <p className="text-slate-500">GSTIN: {activeDoc.gstin}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{activeDoc.category}</p>
                    <p className="text-slate-500">No: {activeDoc.invoiceNumber}</p>
                    <p className="text-slate-500">Date: {activeDoc.invoiceDate}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-500">Billed To:</p>
                  <p className="font-semibold text-slate-900">{activeDoc.clientName}</p>
                </div>

                <div className="border-t border-b border-slate-200 py-3 space-y-1.5 tabular-nums">
                  <div className="flex justify-between">
                    <span>Taxable Value</span>
                    <span>
                      ₹{(activeDoc.totalAmount - activeDoc.taxAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (IGST / CGST+SGST)</span>
                    <span>₹{activeDoc.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-200">
                    <span>Invoice Total</span>
                    <span>₹{activeDoc.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Simulated Document Preview Placeholder · Uploaded {activeDoc.uploadDate}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Processing: {activeDoc.processingStatus}</span>
              <span>Extraction: {activeDoc.extractionStatus}</span>
              <span>Review: {activeDoc.accountingStatus}</span>
            </div>
          </div>

          {/* Right Column: Extracted Info, Proposed Entries, Validation & History */}
          <div className="lg:col-span-7 space-y-6">
            {/* Extracted Fields */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Extracted Information (Simulated OCR)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Counterparty</span>
                  <span className="font-medium text-slate-900 mt-0.5 block">
                    {activeDoc.vendorOrParty}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Counterparty GSTIN</span>
                  <span className="font-mono font-medium text-slate-900 mt-0.5 block">
                    {activeDoc.gstin}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Document Number</span>
                  <span className="font-mono font-medium text-slate-900 mt-0.5 block">
                    {activeDoc.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Document Date</span>
                  <span className="font-mono font-medium text-slate-900 mt-0.5 block">
                    {activeDoc.invoiceDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">GST Component</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900 mt-0.5 block">
                    ₹{activeDoc.taxAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Value</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5 block">
                    ₹{activeDoc.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Proposed Accounting Entries */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Proposed Accounting Entries
                </h2>
                {linkedVoucher && (
                  <span className="text-xs font-mono text-slate-600">
                    {linkedVoucher.voucherNumber} · Validation: {linkedVoucher.validationStatus} ·{' '}
                    {linkedVoucher.approvalStatus}
                  </span>
                )}
              </div>

              {!linkedVoucher ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No voucher generated yet. Click "Run Simulated AI Extraction" to generate proposed entries.
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 font-medium">Ledger Account</th>
                        <th className="py-2 font-medium">Group</th>
                        <th className="py-2 font-medium text-right">Debit (₹)</th>
                        <th className="py-2 font-medium text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {linkedEntries.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2.5 font-medium text-slate-900">{line.ledgerName}</td>
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
                  <p className="text-xs text-slate-500">
                    Narration: {linkedVoucher.narration}
                  </p>
                </div>
              )}
            </div>

            {/* Processing History */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">Processing History</h2>
              <div className="divide-y divide-slate-200 text-xs">
                {docHistory.length === 0 ? (
                  <p className="text-slate-500 py-2">Uploaded on {activeDoc.uploadDate}</p>
                ) : (
                  docHistory.map((h) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-medium text-slate-900">{h.eventType}</span>
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
          <p className="text-xs text-slate-500">
            Client Document Intake · Supports PDF, JPG, JPEG, PNG, XLSX, CSV
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Documents ({documents.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSampleUpload}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap shrink-0"
        >
          + Upload Sample Invoice
        </button>
      </div>

      {uploadBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs text-emerald-900 flex items-center justify-between">
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
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
            <select
              value={uploadClientId}
              onChange={(e) => setUploadClientId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-2 text-slate-900"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Financial Year
            </label>
            <select
              value={uploadFY}
              onChange={(e) => setUploadFY(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-2 text-slate-900"
            >
              {FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Accounting Period
            </label>
            <select
              value={uploadPeriod}
              onChange={(e) => setUploadPeriod(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-2 text-slate-900"
            >
              {['Nov 2026', 'Oct 2026', 'Sep 2026', 'Q2 FY26-27'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-2.5 py-2 text-slate-900"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amount in ₹ (Optional)
            </label>
            <input
              type="number"
              value={uploadAmount}
              onChange={(e) => setUploadAmount(e.target.value)}
              placeholder="e.g. 236000"
              className="w-full text-xs font-mono bg-white border border-slate-300 rounded-md px-2.5 py-2 text-slate-900"
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
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-emerald-600 bg-emerald-50/40'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
          <p className="text-xs font-medium text-slate-900">
            Drag and drop accounting documents here, or click to browse files
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Supported formats: PDF, JPG, JPEG, PNG, XLSX, CSV
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by document name, party, or client..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
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

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                <th className="py-3 px-5 font-medium">Document Name</th>
                <th className="py-3 px-4 font-medium">Client · FY</th>
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Upload Date</th>
                <th className="py-3 px-4 font-medium">Processing · Extraction</th>
                <th className="py-3 px-4 font-medium">Accounting Status</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredDocs.map((docItem) => (
                <tr key={docItem.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-5">
                    <button
                      type="button"
                      onClick={() => setActiveDocId(docItem.id)}
                      className="text-left font-medium text-slate-900 hover:text-emerald-700 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{docItem.fileName}</span>
                    </button>
                    <p className="text-xs text-slate-500 pl-6">
                      {docItem.vendorOrParty} · ₹{docItem.totalAmount.toLocaleString('en-IN')}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">
                    <div>{docItem.clientName}</div>
                    <div className="text-slate-400 font-mono">
                      FY {docItem.financialYear} · {docItem.period}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{docItem.category}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-500">
                    {docItem.uploadDate}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <span className="font-medium text-slate-800">
                      {docItem.processingStatus}
                    </span>
                    <span className="text-slate-400"> · </span>
                    <span
                      className={
                        docItem.extractionStatus === 'Low Confidence'
                          ? 'text-amber-700 font-medium'
                          : 'text-slate-600'
                      }
                    >
                      {docItem.extractionStatus} ({docItem.confidence}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium">
                    <span
                      className={
                        docItem.accountingStatus === 'Exception'
                          ? 'text-red-600'
                          : docItem.accountingStatus === 'CA Approved'
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }
                    >
                      {docItem.accountingStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setActiveDocId(docItem.id)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded"
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

  const handleProcessAllPending = async () => {
    for (const d of queuedDocs) {
      await triggerAIProcessingForDoc(d.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Simulated Document Pipeline · Ready for Gemini API & n8n Webhook Orchestration
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            AI Processing Queue
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          {queuedDocs.length > 0 && (
            <button
              type="button"
              onClick={handleProcessAllPending}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Process Pending Queue ({queuedDocs.length})
            </button>
          )}
        </div>
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">Queue / Analyzing</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-amber-700 mt-1">
            {queuedDocs.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">Completed Extraction</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
            {completedDocs.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">Low Confidence / Alert</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-red-600 mt-1">
            {attentionDocs.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">Mean Confidence</span>
          <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
            93.4%
          </p>
        </div>
      </div>

      {/* Processing Jobs Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Document Analysis & Rule Validation Jobs
          </h2>
          <span className="text-xs text-slate-500">Simulated Extraction Pipeline</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                <th className="py-3 px-5 font-medium">Document · Client</th>
                <th className="py-3 px-4 font-medium">Pipeline Stage</th>
                <th className="py-3 px-4 font-medium">Confidence</th>
                <th className="py-3 px-4 font-medium">Accounting Validation Summary</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {aiProcessingJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5">
                    <p className="font-medium text-slate-900">{job.documentName}</p>
                    <p className="text-xs text-slate-500">{job.clientName}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium">
                    <span
                      className={
                        job.stage === 'Completed'
                          ? 'text-emerald-700'
                          : job.stage === 'Failed'
                          ? 'text-red-600'
                          : 'text-amber-700'
                      }
                    >
                      {job.stage}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700">
                    {job.confidence}%
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md">
                    {job.validationSummary}
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    {job.stage !== 'Completed' ? (
                      <button
                        type="button"
                        onClick={() => triggerAIProcessingForDoc(job.documentId)}
                        className="px-3 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded"
                      >
                        Complete Now
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavigate('voucher-review', job.clientId)}
                        className="px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded"
                      >
                        Review Voucher
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modular n8n & Gemini Pipeline Architecture Specification */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Modular Webhook & Gemini Extraction Adapter (Simulation Mode)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Designed so an external n8n workflow or server-side Gemini multimodal extractor can consume queued documents and return structured GST/Voucher payloads without altering UI state contracts.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap shrink-0"
        >
          Pipeline Settings
        </button>
      </div>
    </div>
  );
};
