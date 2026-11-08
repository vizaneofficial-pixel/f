import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  LogOut,
  ArrowRightLeft,
  FolderOpen,
} from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { FenoraLogo } from './FenoraLogo';
import { DOCUMENT_CATEGORIES, FINANCIAL_YEARS } from '../data/seedData';
import { DocumentCategory } from '../types/accounting';

interface ClientPortalViewProps {
  onOpenRoleModal: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ onOpenRoleModal }) => {
  const {
    clients,
    activePortalClientId,
    enterWorkspaceAsRole,
    documents,
    clientRequests,
    uploadDocument,
    triggerAIProcessingForDoc,
    createClientRequest,
    updateClientRequestStatus,
    firebaseUser,
    signInWithGoogle,
    signOutUser,
  } = useFenora();

  const currentClient =
    clients.find((c) => c.id === activePortalClientId) || clients[0];

  const [activeTab, setActiveTab] = useState<'upload' | 'requests' | 'messages'>('upload');
  const [selectedFY, setSelectedFY] = useState<string>(currentClient?.financialYear || '2026-27');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Nov 2026');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('Purchase Invoice');
  const [vendorName, setVendorName] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const [msgTitle, setMsgTitle] = useState<string>('');
  const [msgCategory, setMsgCategory] = useState<string>('Purchase Invoice');
  const [msgBody, setMsgBody] = useState<string>('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clientDocs = documents.filter((d) => d.clientId === currentClient?.id);
  const myRequests = clientRequests.filter((r) => r.clientId === currentClient?.id);
  const pendingRequests = myRequests.filter((r) => r.status === 'Pending Client');

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !currentClient) return;
    const file = fileList[0];
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const sizeKb = Math.max(12, Math.round(file.size / 1024));

    const created = await uploadDocument({
      clientId: currentClient.id,
      fileName: file.name,
      fileType: ext,
      fileSize: `${sizeKb} KB`,
      financialYear: selectedFY,
      period: selectedPeriod,
      category: selectedCategory,
      vendorOrParty: vendorName.trim() || undefined,
      totalAmount: amountInput ? Number(amountInput) : undefined,
    });

    setVendorName('');
    setAmountInput('');
    setUploadNotice(`Uploaded "${file.name}". Simulated extraction started.`);
    setTimeout(() => {
      triggerAIProcessingForDoc(created.id);
    }, 900);
    setTimeout(() => setUploadNotice(null), 4500);
  };

  const handleQuickDemoUpload = async (sampleName: string, category: DocumentCategory, vendor: string, amt: number) => {
    if (!currentClient) return;
    const created = await uploadDocument({
      clientId: currentClient.id,
      fileName: sampleName,
      fileType: sampleName.endsWith('.xlsx') ? 'XLSX' : 'PDF',
      fileSize: '340 KB',
      financialYear: selectedFY,
      period: selectedPeriod,
      category,
      vendorOrParty: vendor,
      totalAmount: amt,
    });
    setUploadNotice(`Uploaded "${sampleName}". Simulated processing triggered.`);
    setTimeout(() => {
      triggerAIProcessingForDoc(created.id);
    }, 800);
    setTimeout(() => setUploadNotice(null), 4000);
  };

  const handleSendClientMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim() || !currentClient) return;
    await createClientRequest({
      clientId: currentClient.id,
      financialYear: selectedFY,
      title: msgTitle.trim(),
      category: msgCategory,
      message: msgBody.trim(),
    });
    setMsgTitle('');
    setMsgBody('');
  };

  const getClientFriendlyStatus = (docStatus: string) => {
    if (docStatus === 'Completed') return 'Processed by CA System';
    if (docStatus === 'Analyzing' || docStatus === 'Queued') return 'Processing';
    return 'Attention Needed';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between gap-8">
        <FenoraLogo />

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Documents & Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'requests'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            CA Requests ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'messages'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Ask CA
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Switch View
          </button>
        </div>
      </header>

      {/* Main Client Workspace Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Client Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs text-slate-500">
              Client Portal · FY {selectedFY} · GSTIN {currentClient?.gstin}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
              {currentClient?.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-slate-500">Client Account:</label>
            <select
              value={currentClient?.id || ''}
              onChange={(e) => enterWorkspaceAsRole('client', e.target.value)}
              className="text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 focus:outline-none focus:border-slate-900"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            {!firebaseUser ? (
              <button
                type="button"
                onClick={() => signInWithGoogle('client', currentClient?.id)}
                className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Sign in with Google
              </button>
            ) : (
              <button
                type="button"
                onClick={signOutUser}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <span className="text-xs text-slate-500">Submitted Documents</span>
            <p className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
              {clientDocs.length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <span className="text-xs text-slate-500">Processed</span>
            <p className="text-2xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
              {clientDocs.filter((d) => d.processingStatus === 'Completed').length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <span className="text-xs text-slate-500">Pending CA Requests</span>
            <p className="text-2xl font-semibold font-mono tabular-nums text-amber-700 mt-1">
              {pendingRequests.length}
            </p>
          </div>
        </div>

        {uploadNotice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-900 flex items-center justify-between">
            <span>{uploadNotice}</span>
            <button
              type="button"
              onClick={() => setUploadNotice(null)}
              className="text-xs font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-8">
            {/* Simple 2-Step Upload Box */}
            <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Upload Accounting Documents
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select period and category, then drop your invoice, bill, or statement.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoUpload(
                        `Purchase_Inv_${Math.floor(100 + Math.random() * 899)}.pdf`,
                        selectedCategory,
                        vendorName || 'vikas Industrial Fasteners',
                        Number(amountInput) || 141600
                      )
                    }
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    + Instant Sample Upload
                  </button>
                </div>
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={selectedFY}
                    onChange={(e) => setSelectedFY(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
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
                    Period
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    {['Nov 2026', 'Oct 2026', 'Sep 2026', 'Q2 FY26-27'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Document Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Party / Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Supplier / Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g. Surat Synthetic Yarn Mills"
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Invoice Amount in ₹ (Optional)
                  </label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="e.g. 118000"
                    className="w-full text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-emerald-600 bg-emerald-50/40'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PDF, JPG, JPEG, PNG, XLSX, CSV
                </p>
              </div>
            </section>

            {/* Submitted Documents Table */}
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Recent Submissions
                </h2>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {clientDocs.length} files
                </span>
              </div>

              {clientDocs.length === 0 ? (
                <div className="p-10 text-center">
                  <FolderOpen className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                        <th className="py-3 px-6 font-medium">Document</th>
                        <th className="py-3 px-4 font-medium">Category · Period</th>
                        <th className="py-3 px-4 font-medium">Uploaded</th>
                        <th className="py-3 px-6 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {clientDocs.map((docItem) => (
                        <tr key={docItem.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <div>
                                <p className="font-medium text-slate-900">{docItem.fileName}</p>
                                <p className="text-xs text-slate-500">
                                  {docItem.vendorOrParty} · ₹{docItem.totalAmount.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            {docItem.category} · {docItem.period} (FY {docItem.financialYear})
                          </td>
                          <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-500">
                            {docItem.uploadDate}
                          </td>
                          <td className="py-3.5 px-6 text-right text-xs font-medium">
                            {docItem.processingStatus === 'Completed' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {getClientFriendlyStatus(docItem.processingStatus)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700">
                                <Clock className="w-3.5 h-3.5" />
                                {getClientFriendlyStatus(docItem.processingStatus)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'requests' && (
          <section className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Document Requests from Your CA
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Respond to pending queries or mark documents as submitted.
                </p>
              </div>
            </div>

            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No active requests for {currentClient?.name}.
              </div>
            ) : (
              myRequests.map((req) => (
                <div key={req.id} className="p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        {req.category} · FY {req.financialYear} · Updated {req.updatedAt}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                        {req.title}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        req.status === 'Pending Client'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200/80 rounded-md p-3.5">
                    {req.message}
                  </p>

                  {req.status === 'Pending Client' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={replyTextMap[req.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="Add a note for your CA..."
                        className="flex-1 text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateClientRequestStatus(
                            req.id,
                            'Submitted',
                            replyTextMap[req.id] || 'Uploaded requested document.'
                          );
                          setReplyTextMap((prev) => ({ ...prev, [req.id]: '' }));
                        }}
                        className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        Mark Submitted
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === 'messages' && (
          <section className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <h2 className="text-base font-semibold text-slate-900">
                Send a Note or Query to Your CA Firm
              </h2>
            </div>

            <form onSubmit={handleSendClientMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  placeholder="e.g. Clarification on October credit note"
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Related Category
                </label>
                <select
                  value={msgCategory}
                  onChange={(e) => setMsgCategory(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
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
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Write a brief message for your Chartered Accountant..."
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send Message
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};
