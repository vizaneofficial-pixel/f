import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Eye,
  X,
  FileSpreadsheet,
  FileCheck,
  Check,
  Building2,
} from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { useTheme } from '../context/ThemeContext';
import { FenoraLogo } from './FenoraLogo';
import { DocumentCategory } from '../types/accounting';

export const ClientPortalView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    clients,
    activePortalClientId,
    documents,
    financialYears,
    uploadDocument,
    triggerAIProcessingForDoc,
    signOutUser,
    userProfile,
  } = useFenora();

  const currentClient =
    clients.find((c) => c.id === activePortalClientId) || clients[0] || {
      id: 'client_aravind_tex',
      name: userProfile?.displayName || 'Aravind Technical Textiles Pvt Ltd',
      code: 'ATX',
      financialYear: '2026-27',
      gstin: '33AABCA1234F1Z8',
    };

  const [selectedFY, setSelectedFY] = useState<string>(currentClient?.financialYear || '2026-27');
  const [selectedPeriod] = useState<string>('Nov 2026');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const targetCategoryRef = useRef<DocumentCategory>('Purchase Invoice');

  // Filter client documents for current client & FY
  const clientDocs = documents.filter(
    (d) => d.clientId === currentClient.id && (selectedFY ? d.financialYear === selectedFY : true)
  );

  // Status metrics
  const submittedCount = clientDocs.length;
  const processedCount = clientDocs.filter(
    (d) => d.processingStatus === 'Completed' || d.accountingStatus === 'CA Approved'
  ).length;
  const pendingCount = clientDocs.filter(
    (d) =>
      d.processingStatus === 'Queued' ||
      d.processingStatus === 'Analyzing' ||
      d.accountingStatus === 'Unprocessed' ||
      d.accountingStatus === 'Voucher Drafted'
  ).length;

  // Required documents configuration
  const requiredCategories: {
    category: DocumentCategory;
    title: string;
    description: string;
    icon: typeof FileText;
  }[] = [
    {
      category: 'Bank Statement',
      title: 'Bank Statement',
      description: 'Official monthly e-statement',
      icon: FileSpreadsheet,
    },
    {
      category: 'Purchase Invoice',
      title: 'Purchase Invoices',
      description: 'Vendor bills & input tax invoices',
      icon: FileText,
    },
    {
      category: 'Sales Invoice',
      title: 'Sales Invoices',
      description: 'Outward customer invoices & receipts',
      icon: FileText,
    },
    {
      category: 'Expense Bill',
      title: 'Expense Bills',
      description: 'Utility, logistics & operational receipts',
      icon: FileText,
    },
  ];

  const handleFileUpload = async (files: FileList | null, category?: DocumentCategory) => {
    if (!files || files.length === 0 || !currentClient) return;

    const file = files[0];
    const cat = category || targetCategoryRef.current;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const sizeKb = Math.max(24, Math.round(file.size / 1024));

    // Progress animation
    setUploadProgress(20);
    const pInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (!prev) return 30;
        if (prev >= 85) {
          clearInterval(pInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 180);

    try {
      const created = await uploadDocument({
        clientId: currentClient.id,
        fileName: file.name,
        fileType: ext,
        fileSize: `${sizeKb} KB`,
        financialYear: selectedFY,
        period: selectedPeriod,
        category: cat,
      });

      clearInterval(pInterval);
      setUploadProgress(100);
      setUploadNotice(`Received ${file.name}`);

      setTimeout(() => {
        triggerAIProcessingForDoc(created.id);
        setUploadProgress(null);
      }, 700);

      setTimeout(() => setUploadNotice(null), 3500);
    } catch {
      clearInterval(pInterval);
      setUploadProgress(null);
    }
  };

  const triggerSpecificUpload = (cat: DocumentCategory) => {
    targetCategoryRef.current = cat;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        multiple={false}
        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.csv"
        className="hidden"
      />

      {/* TOP SECTION: Apple-grade Minimal Navbar */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-6 sm:px-10 py-3.5 flex items-center justify-between transition-colors">
        {/* Left: Brand & Client Identity */}
        <div className="flex items-center gap-6">
          <FenoraLogo dark={theme === 'dark'} />
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
              {userProfile?.businessName || currentClient.name}
            </span>
          </div>
        </div>

        {/* Right: Controls & Profile (Strictly NO CA role switching) */}
        <div className="flex items-center gap-3">
          {/* Financial Year Selector */}
          <div className="relative">
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors"
            >
              {financialYears.length > 0 ? (
                financialYears.map((fy) => (
                  <option key={fy.id} value={fy.label}>
                    FY {fy.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="2026-27">FY 2026-27</option>
                  <option value="2025-26">FY 2025-26</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Account Menu (Strict Client Profile & Sign Out Only) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center text-xs font-semibold">
                {(userProfile?.displayName || currentClient.name).slice(0, 1)}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-modal shadow-xl border border-slate-200/80 dark:border-slate-800 p-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {userProfile?.displayName || currentClient.name}
                  </p>
                  {userProfile?.businessName && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                      {userProfile.businessName}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {userProfile?.email || 'client@fenora.in'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOutUser();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN SECTION: Spacious, effortless, client-centric */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-12 space-y-10">
        {/* A. CLIENT GREETING */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {userProfile?.businessName || currentClient.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              Account: {userProfile?.displayName || currentClient.name} · GSTIN: {currentClient.gstin || '33AABCA1234F1Z8'}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Document Portal Active</span>
          </div>
        </section>

        {/* B. DOCUMENT STATUS (3 Clean Visual Indicators) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Submitted */}
          <div className="glass-panel rounded-2xl p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Submitted
              </span>
              <FileCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {submittedCount}
              </span>
              <span className="text-xs text-slate-400">documents</span>
            </div>
          </div>

          {/* Pending */}
          <div className="glass-panel rounded-2xl p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {pendingCount}
              </span>
              <span className="text-xs text-slate-400">in processing</span>
            </div>
          </div>

          {/* Processed */}
          <div className="glass-panel rounded-2xl p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Processed
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {processedCount}
              </span>
              <span className="text-xs text-slate-400">verified by CA</span>
            </div>
          </div>
        </section>

        {/* C. DOCUMENT UPLOAD (HERO ELEMENT — Clean & Bright) */}
        <section>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              targetCategoryRef.current = 'Purchase Invoice';
              fileInputRef.current?.click();
            }}
            className={`cursor-pointer rounded-3xl p-10 sm:p-14 text-center transition-all duration-300 relative overflow-hidden group border-2 border-dashed ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                : 'border-slate-300/80 dark:border-slate-800 hover:border-emerald-500/80 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none'
            } emerald-glow`}
          >
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 group-hover:scale-110 transition-transform duration-200">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Drop files or click to upload
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Invoices, bank statements, bills or Excel sheets
              </p>

              {/* Supported file tags */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
                {['PDF', 'JPG', 'PNG', 'XLSX', 'CSV'].map((format) => (
                  <span
                    key={format}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Feedback Toast */}
          {uploadNotice && (
            <div className="mt-3 p-3 rounded-2xl glass-panel text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{uploadNotice}</span>
            </div>
          )}
        </section>

        {/* D. REQUIRED DOCUMENTS CHECKLIST */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight uppercase text-slate-400">
              Required Documents
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {clientDocs.length} on file
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {requiredCategories.map((item) => {
              const matchingDocs = clientDocs.filter((d) => d.category === item.category);
              const isUploaded = matchingDocs.length > 0;
              const Icon = item.icon;

              return (
                <div
                  key={item.category}
                  className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isUploaded
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isUploaded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
                        <Check className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => triggerSpecificUpload(item.category)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>Upload</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* E. RECENT DOCUMENTS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight uppercase text-slate-400">
              Recent Documents
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              FY {selectedFY}
            </span>
          </div>

          {clientDocs.length === 0 ? (
            <div className="glass-panel rounded-2xl p-10 text-center">
              <p className="text-xs text-slate-400">
                No documents uploaded for this period yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientDocs.slice(0, 8).map((doc) => {
                const isCompleted =
                  doc.processingStatus === 'Completed' || doc.accountingStatus === 'CA Approved';
                const isAnalyzing =
                  doc.processingStatus === 'Analyzing' || doc.processingStatus === 'Queued';

                return (
                  <div
                    key={doc.id}
                    className="glass-panel rounded-2xl p-4 sm:px-6 flex items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Left: Icon & Title */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          {doc.period} · {doc.category} {doc.fileSize ? `· ${doc.fileSize}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status badge & Preview Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : isAnalyzing
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isCompleted ? 'Processed' : isAnalyzing ? 'Processing' : 'Uploaded'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {previewDoc.fileName}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Category</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {previewDoc.category}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Period</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {previewDoc.period} ({previewDoc.financialYear})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Format & Size</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {previewDoc.fileType} · {previewDoc.fileSize}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400">Status</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {previewDoc.processingStatus || previewDoc.accountingStatus}
                </span>
              </div>
              {previewDoc.vendorOrParty && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Vendor / Party</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {previewDoc.vendorOrParty}
                  </span>
                </div>
              )}
              {previewDoc.totalAmount !== undefined && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Total Value</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    ₹{previewDoc.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
