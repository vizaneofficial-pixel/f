import React, { useState } from 'react';
import {
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Edit3,
  Check,
  X,
  HelpCircle,
  Flag,
} from 'lucide-react';
import { useFenora } from '../../context/FenoraContext';
import { LEDGER_GROUPS, VOUCHER_TYPES, FINANCIAL_YEARS } from '../../data/seedData';
import {
  LedgerGroup,
  Voucher,
  VoucherType,
  NavigationTab,
} from '../../types/accounting';

interface AccountingSectionProps {
  onNavigate: (tab: NavigationTab, clientId?: string) => void;
}

export const AccountingSection: React.FC<AccountingSectionProps> = ({ onNavigate }) => {
  const { clients, vouchers, voucherEntries } = useFenora();

  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedVoucher, setInspectedVoucher] = useState<Voucher | null>(null);

  const filteredVouchers = vouchers.filter((v) => {
    const matchClient = selectedClient === 'ALL' || v.clientId === selectedClient;
    const matchType = selectedType === 'ALL' || v.voucherType === selectedType;
    const matchSearch =
      v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.partyLedger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sourceDocumentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClient && matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Double-Entry Voucher Register · Simulated Indian Accounting Entries
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Accounting Transactions ({vouchers.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('voucher-review')}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md whitespace-nowrap shrink-0"
        >
          Open Voucher Review Queue
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher no, ledger, narration, or document..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
          >
            <option value="ALL">All Voucher Types</option>
            {VOUCHER_TYPES.map((vt) => (
              <option key={vt} value={vt}>
                {vt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Voucher Register Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                <th className="py-3 px-5 font-medium">Date · Voucher No</th>
                <th className="py-3 px-4 font-medium">Type · Client</th>
                <th className="py-3 px-4 font-medium">Ledger Accounts & Narration</th>
                <th className="py-3 px-4 font-medium text-right">Debit (₹)</th>
                <th className="py-3 px-4 font-medium text-right">Credit (₹)</th>
                <th className="py-3 px-4 font-medium">Validation · Confidence</th>
                <th className="py-3 px-5 font-medium text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredVouchers.map((v) => {
                const isBalanced = Math.abs(v.totalDebit - v.totalCredit) < 0.01;
                return (
                  <tr
                    key={v.id}
                    onClick={() => setInspectedVoucher(v)}
                    className="hover:bg-slate-50/80 cursor-pointer"
                  >
                    <td className="py-3.5 px-5 font-mono tabular-nums text-xs">
                      <div className="font-semibold text-slate-900">{v.voucherNumber}</div>
                      <div className="text-slate-500">{v.voucherDate}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-medium text-slate-900">{v.voucherType}</div>
                      <div className="text-slate-500">{v.clientName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs max-w-xs">
                      <div className="font-medium text-slate-900 truncate">
                        {v.partyLedger} ↔ {v.primaryLedger}
                      </div>
                      <div className="text-slate-500 truncate mt-0.5">{v.narration}</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                        Source: {v.sourceDocumentName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-medium text-slate-900">
                      ₹{v.totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-medium text-slate-900">
                      ₹{v.totalCredit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`font-medium ${
                          isBalanced ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isBalanced ? 'Valid (Dr = Cr)' : 'Imbalanced'}
                      </span>
                      <span className="text-slate-400 font-mono"> · {v.aiConfidence}%</span>
                    </td>
                    <td className="py-3.5 px-5 text-right text-xs font-medium">
                      <span
                        className={
                          v.approvalStatus === 'CA Approved'
                            ? 'text-emerald-700 inline-flex items-center gap-1'
                            : v.approvalStatus === 'Rejected'
                            ? 'text-red-600'
                            : 'text-amber-700'
                        }
                      >
                        {v.caLocked && <Lock className="w-3 h-3" />}
                        {v.approvalStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Detail Modal with Debit-Credit Balance Validation */}
      {inspectedVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs text-slate-500 font-mono">
                  {inspectedVoucher.voucherType} Voucher · {inspectedVoucher.voucherNumber} ·{' '}
                  {inspectedVoucher.voucherDate}
                </p>
                <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                  {inspectedVoucher.clientName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectedVoucher(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                    <th className="py-2.5 px-3 font-medium">Ledger Account</th>
                    <th className="py-2.5 px-3 font-medium">Group</th>
                    <th className="py-2.5 px-3 font-medium text-right">Debit (Dr)</th>
                    <th className="py-2.5 px-3 font-medium text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {voucherEntries
                    .filter((e) => e.voucherId === inspectedVoucher.id)
                    .map((line) => (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {line.ledgerName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{line.ledgerGroup}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {line.entryType === 'Dr'
                            ? `₹${line.amount.toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {line.entryType === 'Cr'
                            ? `₹${line.amount.toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-semibold text-slate-900 bg-slate-50">
                    <td colSpan={2} className="py-2.5 px-3">
                      Total Double-Entry Balance Check
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{inspectedVoucher.totalDebit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      ₹{inspectedVoucher.totalCredit.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="text-xs space-y-1.5 bg-slate-50 border border-slate-200 rounded-md p-3.5">
              <p className="text-slate-700">
                <strong>Narration:</strong> {inspectedVoucher.narration}
              </p>
              <p className="text-slate-500">
                <strong>AI Explanation:</strong> {inspectedVoucher.aiExplanation}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span
                className={`text-xs font-medium ${
                  inspectedVoucher.totalDebit === inspectedVoucher.totalCredit
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}
              >
                {inspectedVoucher.totalDebit === inspectedVoucher.totalCredit
                  ? 'Balance Validated: Total Debit equals Total Credit'
                  : 'Validation Blocked: Total Debit does not equal Total Credit'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectedVoucher(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cId = inspectedVoucher.clientId;
                    setInspectedVoucher(null);
                    onNavigate('voucher-review', cId);
                  }}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                >
                  Open in CA Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface LedgerManagementSectionProps {
  initialClientId?: string | null;
}

export const LedgerManagementSection: React.FC<LedgerManagementSectionProps> = ({
  initialClientId,
}) => {
  const { clients, ledgerAccounts, createLedgerAccount, updateLedgerAccount } = useFenora();

  const [selectedClient, setSelectedClient] = useState<string>(initialClientId || 'ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  const [formClientId, setFormClientId] = useState<string>(
    initialClientId || clients[0]?.id || 'client_aravind_tex'
  );
  const [formName, setFormName] = useState<string>('');
  const [formGroup, setFormGroup] = useState<LedgerGroup>('Purchase Accounts');
  const [formBalance, setFormBalance] = useState<string>('0');
  const [formBalanceType, setFormBalanceType] = useState<'Dr' | 'Cr'>('Dr');
  const [formGstApp, setFormGstApp] = useState<'Applicable' | 'Not Applicable' | 'Exempt'>(
    'Applicable'
  );
  const [formGstin, setFormGstin] = useState<string>('');
  const [formFY, setFormFY] = useState<string>('2026-27');
  const [formKeywords, setFormKeywords] = useState<string>('');

  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  const [keywordsEditDraft, setKeywordsEditDraft] = useState<string>('');

  const handleCreateLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    await createLedgerAccount({
      clientId: formClientId,
      name: formName,
      group: formGroup,
      openingBalance: Number(formBalance) || 0,
      balanceType: formBalanceType,
      gstApplicable: formGstApp,
      gstin: formGstin,
      financialYear: formFY,
      aiSuggestedKeywords: formKeywords || formName,
    });
    setFormName('');
    setFormKeywords('');
    setShowCreateModal(false);
  };

  const filteredLedgers = ledgerAccounts.filter((l) => {
    const matchClient = selectedClient === 'ALL' || l.clientId === selectedClient;
    const matchGroup = selectedGroup === 'ALL' || l.group === selectedGroup;
    const matchSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.aiSuggestedKeywords.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.group.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClient && matchGroup && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Chart of Accounts · Tally Master Groups & AI Account Mapping
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Ledger Management ({ledgerAccounts.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Ledger Master
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ledger name, group, or AI mapping keywords..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-700"
          >
            <option value="ALL">All 13 Ledger Groups</option>
            {LEDGER_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledgers Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/60">
                <th className="py-3 px-5 font-medium">Ledger Name · Client</th>
                <th className="py-3 px-4 font-medium">Ledger Group</th>
                <th className="py-3 px-4 font-medium text-right">Opening Balance</th>
                <th className="py-3 px-4 font-medium">GST Applicability · GSTIN</th>
                <th className="py-3 px-4 font-medium">AI-Suggested Mapping Keywords</th>
                <th className="py-3 px-5 font-medium text-right">Tally Master Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredLedgers.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-slate-900">{l.name}</p>
                    <p className="text-xs text-slate-500">
                      {l.clientName} · FY {l.financialYear}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">{l.group}</td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-medium text-slate-900">
                    ₹{l.openingBalance.toLocaleString('en-IN')} {l.balanceType}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="text-slate-800">{l.gstApplicable}</div>
                    {l.gstin && <div className="text-slate-400 font-mono">{l.gstin}</div>}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    {editingLedgerId === l.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={keywordsEditDraft}
                          onChange={(e) => setKeywordsEditDraft(e.target.value)}
                          className="text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await updateLedgerAccount(l.id, {
                              aiSuggestedKeywords: keywordsEditDraft,
                            });
                            setEditingLedgerId(null);
                          }}
                          className="px-2 py-1 text-xs text-white bg-slate-900 rounded"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-600">{l.aiSuggestedKeywords}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLedgerId(l.id);
                            setKeywordsEditDraft(l.aiSuggestedKeywords);
                          }}
                          className="text-slate-400 hover:text-slate-700"
                          title="Map AI keywords"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right text-xs font-medium">
                    <span
                      className={
                        l.tallySyncStatus === 'Synced'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }
                    >
                      {l.tallySyncStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ledger Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Create Client Ledger & AI Mapping
            </h2>
            <form onSubmit={handleCreateLedger} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Client</label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
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
                  Ledger Name (Tally Master Name)
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Job Work Machining Charges (18%)"
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Under Ledger Group
                  </label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as LedgerGroup)}
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                  >
                    {LEDGER_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    value={formBalance}
                    onChange={(e) => setFormBalance(e.target.value)}
                    className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Dr / Cr
                  </label>
                  <select
                    value={formBalanceType}
                    onChange={(e) => setFormBalanceType(e.target.value as 'Dr' | 'Cr')}
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                  >
                    <option value="Dr">Debit (Dr)</option>
                    <option value="Cr">Credit (Cr)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GST Applicability
                  </label>
                  <select
                    value={formGstApp}
                    onChange={(e) =>
                      setFormGstApp(
                        e.target.value as 'Applicable' | 'Not Applicable' | 'Exempt'
                      )
                    }
                    className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                  >
                    <option value="Applicable">Applicable</option>
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="Exempt">Exempt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Party GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formGstin}
                    onChange={(e) => setFormGstin(e.target.value)}
                    className="w-full text-sm font-mono bg-white border border-slate-300 rounded-md px-3 py-2 uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  AI-Suggested Account Keywords (HSN / Vendor / Description)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="e.g. CNC Turning, SAC 9988, Subcontracting"
                  className="w-full text-sm bg-white border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                >
                  Save Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface VoucherReviewSectionProps {
  initialClientId?: string | null;
}

export const VoucherReviewSection: React.FC<VoucherReviewSectionProps> = ({
  initialClientId,
}) => {
  const {
    vouchers,
    voucherEntries,
    documents,
    ledgerAccounts,
    reviewAndModifyVoucher,
  } = useFenora();

  const [selectedVoucherId, setSelectedVoucherId] = useState<string>(
    vouchers.find((v) => !initialClientId || v.clientId === initialClientId)?.id ||
      vouchers[0]?.id ||
      ''
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const activeVoucher =
    vouchers.find((v) => v.id === selectedVoucherId) || vouchers[0] || null;
  const activeDoc = activeVoucher
    ? documents.find((d) => d.id === activeVoucher.sourceDocumentId)
    : null;
  const activeLines = activeVoucher
    ? voucherEntries.filter((e) => e.voucherId === activeVoucher.id)
    : [];

  // Editable state when CA clicks "Edit"
  const [editDate, setEditDate] = useState<string>('');
  const [editType, setEditType] = useState<VoucherType>('Purchase');
  const [editPartyLedger, setEditPartyLedger] = useState<string>('');
  const [editPrimaryLedger, setEditPrimaryLedger] = useState<string>('');
  const [editTaxLedger, setEditTaxLedger] = useState<string>('');
  const [editNarration, setEditNarration] = useState<string>('');
  const [editLines, setEditLines] = useState<
    { id: string; ledgerName: string; ledgerGroup: string; entryType: 'Dr' | 'Cr'; amount: number }[]
  >([]);

  const startEditingVoucher = (v: Voucher) => {
    const lines = voucherEntries.filter((e) => e.voucherId === v.id);
    setEditDate(v.voucherDate);
    setEditType(v.voucherType);
    setEditPartyLedger(v.partyLedger);
    setEditPrimaryLedger(v.primaryLedger);
    setEditTaxLedger(v.taxLedger);
    setEditNarration(v.narration);
    setEditLines(
      lines.map((l) => ({
        id: l.id,
        ledgerName: l.ledgerName,
        ledgerGroup: l.ledgerGroup,
        entryType: l.entryType,
        amount: l.amount,
      }))
    );
    setIsEditMode(true);
    setFeedbackBanner(null);
  };

  const handleSelectVoucher = (v: Voucher) => {
    setSelectedVoucherId(v.id);
    setIsEditMode(false);
    setFeedbackBanner(null);
    setReviewerNote('');
  };

  const currentDrTotal = isEditMode
    ? editLines
        .filter((l) => l.entryType === 'Dr')
        .reduce((s, l) => s + Number(l.amount || 0), 0)
    : activeVoucher?.totalDebit || 0;

  const currentCrTotal = isEditMode
    ? editLines
        .filter((l) => l.entryType === 'Cr')
        .reduce((s, l) => s + Number(l.amount || 0), 0)
    : activeVoucher?.totalCredit || 0;

  const isBalanced = Math.abs(currentDrTotal - currentCrTotal) < 0.01 && currentDrTotal > 0;

  const handleActionDecision = async (
    decision: 'CA Approved' | 'Rejected' | 'Info Requested' | 'Marked for Senior CA'
  ) => {
    if (!activeVoucher) return;

    const result = await reviewAndModifyVoucher(
      activeVoucher.id,
      decision,
      reviewerNote,
      isEditMode
        ? {
            voucherDate: editDate,
            voucherType: editType,
            partyLedger: editPartyLedger,
            primaryLedger: editPrimaryLedger,
            taxLedger: editTaxLedger,
            narration: editNarration,
            entries: editLines,
          }
        : undefined
    );

    if (!result.ok) {
      setFeedbackBanner({ type: 'error', text: result.error || 'Validation failed.' });
    } else {
      setIsEditMode(false);
      setReviewerNote('');
      setFeedbackBanner({
        type: 'success',
        text: `Voucher ${activeVoucher.voucherNumber} marked as "${decision}" and recorded in the append-only Audit Trail.`,
      });
    }
  };

  if (!activeVoucher) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        No vouchers available for review.
      </div>
    );
  }

  const clientLedgers = ledgerAccounts.filter((l) => l.clientId === activeVoucher.clientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Chartered Accountant Sign-Off · AI Cannot Overwrite CA-Approved Entries
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
            Voucher Review Workspace
          </h1>
        </div>

        {/* Voucher Queue Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {vouchers.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => handleSelectVoucher(v)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                v.id === activeVoucher.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {v.voucherNumber} ({v.approvalStatus === 'CA Approved' ? 'Approved' : v.validationStatus})
            </button>
          ))}
        </div>
      </div>

      {feedbackBanner && (
        <div
          className={`rounded-lg px-4 py-3 text-xs flex items-center justify-between border ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Side-by-Side Source Document & Proposed Voucher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Original Source Document & Extracted Information */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Original Source Document
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {activeVoucher.sourceDocumentName}
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700">
              AI Confidence: {activeVoucher.aiConfidence}%
            </span>
          </div>

          {/* Simulated Invoice Sheet */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3 font-mono text-xs text-slate-700">
            <div className="flex justify-between border-b border-slate-200 pb-2.5">
              <div>
                <p className="font-semibold text-slate-900">
                  {activeDoc?.vendorOrParty || activeVoucher.partyLedger}
                </p>
                <p className="text-slate-500">GSTIN: {activeDoc?.gstin || '24AABCS1429P1Z1'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {activeDoc?.invoiceNumber || activeVoucher.voucherNumber}
                </p>
                <p className="text-slate-500">{activeVoucher.voucherDate}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-slate-500">Customer / Recipient:</p>
              <p className="font-semibold text-slate-900">{activeVoucher.clientName}</p>
            </div>

            <div className="border-t border-slate-200 pt-2.5 space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span>Extracted Taxable Value</span>
                <span>
                  ₹
                  {(
                    (activeDoc?.totalAmount || activeVoucher.totalCredit) -
                    (activeDoc?.taxAmount || 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Extracted GST</span>
                <span>₹{(activeDoc?.taxAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-1">
                <span>Document Total</span>
                <span>
                  ₹{(activeDoc?.totalAmount || activeVoucher.totalCredit).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* AI Explanation & GST Details */}
          <div className="space-y-3 pt-1">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                AI Accounting & GST Explanation
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {activeVoucher.aiExplanation}
              </p>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <h3 className="text-xs font-semibold text-slate-900 mb-1.5">
                Client Ledger Mapping Context ({clientLedgers.length} ledgers)
              </h3>
              <p className="text-xs text-slate-500">
                Party Ledger: <strong className="text-slate-800">{activeVoucher.partyLedger}</strong> · Primary Head:{' '}
                <strong className="text-slate-800">{activeVoucher.primaryLedger}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Proposed Voucher, Debit/Credit Lines, Validation & CA Action Bar */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Proposed {isEditMode ? editType : activeVoucher.voucherType} Voucher (
                  {activeVoucher.voucherNumber})
                </h2>
                {activeVoucher.caLocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Lock className="w-3.5 h-3.5" />
                    CA Approved & Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeVoucher.clientName} · FY {activeVoucher.financialYear} · Status:{' '}
                <strong className="text-slate-800">{activeVoucher.approvalStatus}</strong>
              </p>
            </div>

            {!isEditMode && (
              <button
                type="button"
                onClick={() => startEditingVoucher(activeVoucher)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1.5 self-start"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Voucher Lines
              </button>
            )}
          </div>

          {/* Debit & Credit Lines Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
                  <th className="py-2.5 px-3 font-medium">Ledger Account</th>
                  <th className="py-2.5 px-3 font-medium">Group</th>
                  <th className="py-2.5 px-3 font-medium w-20">Dr / Cr</th>
                  <th className="py-2.5 px-3 font-medium text-right w-36">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(isEditMode ? editLines : activeLines).map((line, idx) => (
                  <tr key={line.id}>
                    <td className="py-2.5 px-3">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={line.ledgerName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditLines((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, ledgerName: val } : item
                              )
                            );
                          }}
                          className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-900"
                        />
                      ) : (
                        <span className="font-medium text-slate-900">{line.ledgerName}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{line.ledgerGroup}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {isEditMode ? (
                        <select
                          value={line.entryType}
                          onChange={(e) => {
                            const val = e.target.value as 'Dr' | 'Cr';
                            setEditLines((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, entryType: val } : item
                              )
                            );
                          }}
                          className="text-xs bg-white border border-slate-300 rounded px-1.5 py-1"
                        >
                          <option value="Dr">Dr</option>
                          <option value="Cr">Cr</option>
                        </select>
                      ) : (
                        line.entryType
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {isEditMode ? (
                        <input
                          type="number"
                          value={line.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setEditLines((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, amount: val } : item
                              )
                            );
                          }}
                          className="w-28 text-right text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="font-medium text-slate-900">
                          ₹{line.amount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={2} className="py-2.5 px-3">
                    Double-Entry Validation Check
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">
                    Dr: ₹{currentDrTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    Cr: ₹{currentCrTotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance Validation Banner */}
          <div
            className={`rounded-md p-3 text-xs flex items-center justify-between border ${
              isBalanced
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>
                {isBalanced
                  ? `Accounting Validation Passed: Total Debit (₹${currentDrTotal.toLocaleString(
                      'en-IN'
                    )}) equals Total Credit (₹${currentCrTotal.toLocaleString('en-IN')}).`
                  : `Imbalanced Voucher: Total Debit (₹${currentDrTotal.toLocaleString(
                      'en-IN'
                    )}) ≠ Total Credit (₹${currentCrTotal.toLocaleString(
                      'en-IN'
                    )}). Difference: ₹${Math.abs(currentDrTotal - currentCrTotal).toLocaleString(
                      'en-IN'
                    )}.`}
              </span>
            </div>
            {!isBalanced && !isEditMode && (
              <button
                type="button"
                onClick={() => startEditingVoucher(activeVoucher)}
                className="font-semibold underline shrink-0 ml-2"
              >
                Fix Balance Now
              </button>
            )}
          </div>

          {/* Narration & Reviewer Note */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Voucher Narration
              </label>
              {isEditMode ? (
                <textarea
                  rows={2}
                  value={editNarration}
                  onChange={(e) => setEditNarration(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2"
                />
              ) : (
                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-2.5">
                  {activeVoucher.narration}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                CA Audit Note / Review Remarks (Recorded in Audit History)
              </label>
              <input
                type="text"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="e.g. Verified HSN 5402 tax rate and party GSTIN..."
                className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          {/* 5 Required CA Review Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleActionDecision('CA Approved')}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? 'Save Edits & Approve' : 'Approve'}
              </button>

              <button
                type="button"
                onClick={() =>
                  isEditMode ? setIsEditMode(false) : startEditingVoucher(activeVoucher)
                }
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditMode ? 'Cancel Edit' : 'Edit'}
              </button>

              <button
                type="button"
                onClick={() => handleActionDecision('Info Requested')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md inline-flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Request Information
              </button>

              <button
                type="button"
                onClick={() => handleActionDecision('Marked for Senior CA')}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md inline-flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                Mark for CA Review
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleActionDecision('Rejected')}
              className="px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md inline-flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
