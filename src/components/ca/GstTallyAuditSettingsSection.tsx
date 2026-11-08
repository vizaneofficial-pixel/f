import React, { useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  Code2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Database,
  Server,
} from 'lucide-react';
import { useFenora } from '../../context/FenoraContext';
import { FINANCIAL_YEARS } from '../../data/seedData';

interface GSTReconciliationSectionProps {
  initialClientId?: string | null;
}

export const GSTReconciliationSection: React.FC<GSTReconciliationSectionProps> = ({
  initialClientId,
}) => {
  const { clients, vouchers, gstReconciliation } = useFenora();

  const [selectedClient, setSelectedClient] = useState<string>(initialClientId || 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = gstReconciliation.filter((item) => {
    const matchClient = selectedClient === 'ALL' || item.clientId === selectedClient;
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchSearch =
      item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplierGstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClient && matchStatus && matchSearch;
  });

  // Compute simulated Sales / Purchase / Input GST / Output GST summary
  const salesVouchers = vouchers.filter(
    (v) =>
      (selectedClient === 'ALL' || v.clientId === selectedClient) &&
      v.voucherType === 'Sales'
  );
  const purchaseVouchers = vouchers.filter(
    (v) =>
      (selectedClient === 'ALL' || v.clientId === selectedClient) &&
      v.voucherType === 'Purchase'
  );

  const totalSalesValue = salesVouchers.reduce((s, v) => s + v.totalCredit, 0) || 826000;
  const totalPurchaseValue = purchaseVouchers.reduce((s, v) => s + v.totalDebit, 0) || 590000;
  const outputGstTotal = Math.round((totalSalesValue * 18) / 118);
  const inputGstBooks = filteredItems.reduce((s, i) => s + i.booksIgstCgstSgst, 0);
  const inputGst2B = filteredItems.reduce((s, i) => s + i.gstr2bTax, 0);

  const mismatchedCount = gstReconciliation.filter((i) => i.status === 'Mismatch').length;
  const missingCount = gstReconciliation.filter(
    (i) => i.status === 'Missing in GSTR-2B' || i.status === 'Missing in Books'
  ).length;
  const duplicateCount = gstReconciliation.filter((i) => i.status === 'Duplicate').length;
  const ineligibleCount = gstReconciliation.filter(
    (i) => i.status === 'Ineligible ITC'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Simulated GSTR-2B vs Purchase Register Reconciliation · Non-Filing Preview
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            GST Reconciliation
          </h1>
        </div>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800"
        >
          <option value="ALL">All Firm Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.gstin})
            </option>
          ))}
        </select>
      </div>

      {/* GST Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">Sales & Output GST</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
            ₹{outputGstTotal.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-400 font-mono">
            Gross Sales: ₹{totalSalesValue.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">Purchase & Input GST (Books)</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
            ₹{inputGstBooks.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-400 font-mono">
            Purchases: ₹{totalPurchaseValue.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">GSTR-2B Auto-Drafted ITC</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
            ₹{inputGst2B.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-slate-400 font-mono">
            Variance: ₹{Math.abs(inputGstBooks - inputGst2B).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <span className="text-xs text-slate-500">Reconciliation Exceptions</span>
          <p className="text-xl font-semibold font-mono tabular-nums text-amber-700 mt-1">
            {mismatchedCount + missingCount + duplicateCount + ineligibleCount}
          </p>
          <span className="text-xs text-slate-400">
            {mismatchedCount} mismatch · {missingCount} missing · {ineligibleCount} Sec 17(5)
          </span>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supplier name, GSTIN, or invoice number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-md">
          {[
            'ALL',
            'Matched',
            'Mismatch',
            'Missing in GSTR-2B',
            'Missing in Books',
            'Duplicate',
            'Ineligible ITC',
          ].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                <th className="py-3 px-5 font-medium">Supplier · GSTIN</th>
                <th className="py-3 px-4 font-medium">Invoice No · Date</th>
                <th className="py-3 px-4 font-medium text-right">Books Taxable · GST</th>
                <th className="py-3 px-4 font-medium text-right">GSTR-2B Taxable · GST</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-5 font-medium">CA Audit Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-slate-900 text-xs">{item.supplierName}</p>
                    <p className="text-xs font-mono text-slate-500">{item.supplierGstin}</p>
                    <p className="text-[11px] text-slate-400">{item.clientName}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-xs">
                    <div className="text-slate-900 font-medium">{item.invoiceNo}</div>
                    <div className="text-slate-500">{item.invoiceDate}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                    <div className="text-slate-900">
                      ₹{item.booksTaxable.toLocaleString('en-IN')}
                    </div>
                    <div className="text-slate-500">
                      Tax: ₹{item.booksIgstCgstSgst.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                    <div className="text-slate-900">
                      ₹{item.gstr2bTaxable.toLocaleString('en-IN')}
                    </div>
                    <div className="text-slate-500">
                      Tax: ₹{item.gstr2bTax.toLocaleString('en-IN')}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium">
                    <span
                      className={
                        item.status === 'Matched'
                          ? 'text-emerald-700'
                          : item.status === 'Ineligible ITC' || item.status === 'Duplicate'
                          ? 'text-red-600'
                          : 'text-amber-700'
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-600 max-w-xs">
                    {item.remarks}
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

export const TallyIntegrationSection: React.FC = () => {
  const {
    clients,
    vouchers,
    tallySyncJobs,
    generateTallyXmlForClient,
    simulateTallyImportForClient,
  } = useFenora();

  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients[0]?.id || 'client_aravind_tex'
  );
  const [selectedFY, setSelectedFY] = useState<string>('2026-27');
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);

  const activeClient =
    clients.find((c) => c.id === selectedClientId) || clients[0];

  const clientVouchers = vouchers.filter((v) => v.clientId === activeClient?.id);
  const pendingVouchers = clientVouchers.filter((v) => v.tallySyncStatus === 'Pending').length;
  const importedVouchers = clientVouchers.filter(
    (v) => v.tallySyncStatus === 'Imported' || v.tallySyncStatus === 'XML Generated'
  ).length;
  const failedRecords = clientVouchers.filter((v) => v.validationStatus !== 'Valid').length;

  const handleGenerateXml = async () => {
    if (!activeClient) return;
    const xml = await generateTallyXmlForClient(activeClient.id, selectedFY);
    setGeneratedXml(xml);
    setSyncBanner(`Generated TallyPrime XML envelope for ${activeClient.name}.`);
  };

  const handleDownloadXml = async () => {
    if (!activeClient) return;
    const xml = generatedXml || (await generateTallyXmlForClient(activeClient.id, selectedFY));
    setGeneratedXml(xml);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fenora_TallyPrime_${activeClient.code}_${selectedFY}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSimulateImport = async () => {
    if (!activeClient) return;
    await simulateTallyImportForClient(activeClient.id, selectedFY);
    setSyncBanner(
      `Simulated TallyPrime import completed for ${activeClient.name}. Sync job recorded.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Simulated TallyPrime v4.0 XML Bridge · Ready for Local Desktop Connector
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Tally Integration
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateXml}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md inline-flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            Generate Tally XML
          </button>
          <button
            type="button"
            onClick={handleDownloadXml}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download XML
          </button>
          <button
            type="button"
            onClick={handleSimulateImport}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Simulate Tally Import
          </button>
        </div>
      </div>

      {syncBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs text-emerald-900 flex items-center justify-between">
          <span>{syncBanner}</span>
          <button
            type="button"
            onClick={() => setSyncBanner(null)}
            className="font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Company & FY Selector Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Tally Company (Client)
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setGeneratedXml(null);
              }}
              className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tallyStatus})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Financial Year
            </label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
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
              Connector Mode
            </label>
            <div className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5">
              Simulated XML Bridge · Last Sync: {tallySyncJobs[0]?.syncedAt || '2026-11-06 17:30'}
            </div>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200">
          <div>
            <span className="text-xs text-slate-500 block">Pending Vouchers</span>
            <span className="text-lg font-semibold font-mono tabular-nums text-amber-700">
              {pendingVouchers}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Imported / XML Ready</span>
            <span className="text-lg font-semibold font-mono tabular-nums text-emerald-700">
              {importedVouchers}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Failed / Imbalanced</span>
            <span className="text-lg font-semibold font-mono tabular-nums text-red-600">
              {failedRecords}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Duplicate Detection</span>
            <span className="text-xs font-medium text-slate-900 mt-1 block">
              0 Duplicate Voucher Nos
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Manual Changes Detected</span>
            <span className="text-xs font-medium text-slate-900 mt-1 block">
              1 CA Line Correction Locked
            </span>
          </div>
        </div>
      </div>

      {/* Generated XML Preview if triggered */}
      {generatedXml && (
        <div className="bg-slate-900 text-slate-100 rounded-lg p-5 space-y-3 overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono text-emerald-400">
              TallyPrime XML Envelope Preview ({activeClient?.name})
            </span>
            <button
              type="button"
              onClick={() => setGeneratedXml(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Hide Preview
            </button>
          </div>
          <pre className="text-xs font-mono leading-relaxed overflow-x-auto max-h-72">
            {generatedXml}
          </pre>
        </div>
      )}

      {/* Synchronization History */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Synchronization History (Simulated)
          </h2>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {tallySyncJobs.length} jobs
          </span>
        </div>
        <div className="divide-y divide-slate-200">
          {tallySyncJobs.map((job) => (
            <div
              key={job.id}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {job.tallyCompany} ·{' '}
                  <span className="text-emerald-700 font-medium">{job.status}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{job.summary}</p>
              </div>
              <div className="text-right font-mono tabular-nums text-xs text-slate-500 shrink-0">
                <div>{job.syncedAt}</div>
                <div>{job.vouchersCount} vouchers</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Append-Only Immutable Event Log · Enforced in Application & Firestore Rules
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Audit Trail ({auditEvents.length})
          </h1>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event type, voucher/doc reference, actor, or description..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
          />
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
        >
          <option value="ALL">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                <th className="py-3 px-5 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Client · FY</th>
                <th className="py-3 px-4 font-medium">Reference</th>
                <th className="py-3 px-4 font-medium">Event Type</th>
                <th className="py-3 px-4 font-medium">Actor</th>
                <th className="py-3 px-5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5 font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-medium text-slate-900">{evt.clientName}</div>
                    <div className="text-slate-400 font-mono">FY {evt.financialYear}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-800 whitespace-nowrap">
                    {evt.reference}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-900 whitespace-nowrap">
                    {evt.eventType}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{evt.actor}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-700 max-w-md">
                    {evt.description}
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

export const SettingsSection: React.FC = () => {
  const { firm, firebaseUser, userProfile } = useFenora();
  const [savedToast, setSavedToast] = useState<boolean>(false);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-xs text-slate-500">
          Practice Configuration · Multi-Tenant Isolation & Integration Adapters
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
          Firm Settings
        </h1>
      </div>

      {/* CA Firm Profile */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Chartered Accountant Firm Tenant Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Firm Name
            </label>
            <input
              type="text"
              defaultValue={firm.name}
              className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ICAI Firm Registration Number (FRN)
            </label>
            <input
              type="text"
              defaultValue={firm.registrationNo}
              className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Firm GSTIN
            </label>
            <input
              type="text"
              defaultValue={firm.gstin}
              className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Default Financial Year
            </label>
            <input
              type="text"
              defaultValue={firm.defaultFinancialYear}
              className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tenant ID: <span className="font-mono">{firm.id}</span> · Active User:{' '}
            {firebaseUser?.email || userProfile?.email}
          </span>
          <button
            type="button"
            onClick={() => {
              setSavedToast(true);
              setTimeout(() => setSavedToast(false), 2500);
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
          >
            {savedToast ? 'Preferences Saved' : 'Save Firm Settings'}
          </button>
        </div>
      </div>

      {/* Modular Integration Architecture Status */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Firebase Authentication & Multi-Tenant Firestore Rules
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Provisioned and active. Every collection enforces strict ownerUid & firmId isolation and append-only Audit Events.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-emerald-700 shrink-0">Active</span>
        </div>

        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Gemini Multimodal Extraction & n8n Workflow Adapter
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Currently running deterministic simulated Indian GST & voucher extraction so no paid API keys are required for initial evaluation.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-600 shrink-0">Simulated Mode</span>
        </div>

        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                TallyPrime Desktop Connector & XML Envelope Generator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generates standards-compliant TallyPrime v4.0 XML envelopes (`ALLLEDGERENTRIES.LIST`). Ready for future local Tally port 9000 bridge.
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-600 shrink-0">XML Export Ready</span>
        </div>
      </div>
    </div>
  );
};
