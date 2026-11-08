import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Cpu,
  BookOpen,
  Layers,
  CheckSquare,
  FileSpreadsheet,
  RefreshCw,
  History,
  Settings,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { useFenora } from '../context/FenoraContext';
import { useTheme } from '../context/ThemeContext';
import { FenoraLogo } from './FenoraLogo';
import { NavigationTab } from '../types/accounting';
import { OverviewSection, ClientsSection } from './ca/OverviewAndClientsSection';
import { DocumentsSection, AIProcessingSection } from './ca/DocumentsAndAISection';
import {
  AccountingSection,
  LedgerManagementSection,
  VoucherReviewSection,
} from './ca/AccountingAndReviewSection';
import {
  GSTReconciliationSection,
  TallyIntegrationSection,
  AuditTrailSection,
  SettingsSection,
} from './ca/GstTallyAuditSettingsSection';

interface CAWorkspaceViewProps {
  onOpenRoleModal?: () => void;
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'ai-processing', label: 'AI Processing', icon: Cpu },
  { id: 'accounting', label: 'Accounting', icon: BookOpen },
  { id: 'ledgers', label: 'Ledger Management', icon: Layers },
  { id: 'voucher-review', label: 'Voucher Review', icon: CheckSquare },
  { id: 'gst', label: 'GST Reconciliation', icon: FileSpreadsheet },
  { id: 'tally', label: 'Tally Integration', icon: RefreshCw },
  { id: 'audit', label: 'Audit Trail', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const CAWorkspaceView: React.FC<CAWorkspaceViewProps> = () => {
  const { theme, toggleTheme } = useTheme();
  const { firm, signOutUser } = useFenora();

  const [activeNav, setActiveNav] = useState<NavigationTab>('overview');
  const [scopedClientId, setScopedClientId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleNavigate = (tab: NavigationTab, clientId?: string) => {
    setScopedClientId(clientId || null);
    setActiveNav(tab);
    setMobileMenuOpen(false);
  };

  const currentNavLabel =
    NAV_ITEMS.find((n) => n.id === activeNav)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Desktop Sidebar — Proper Light Mode & Dark Mode */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shrink-0 border-r border-slate-200 dark:border-slate-800 transition-colors">
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <FenoraLogo dark={theme === 'dark'} />
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60">
            CA FIRM
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="text-xs">
            <p className="font-medium text-slate-900 dark:text-white truncate">{firm.name}</p>
            <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
              {firm.registrationNo} · FY {firm.defaultFinancialYear}
            </p>
          </div>
          <button
            type="button"
            onClick={signOutUser}
            className="w-full py-1.5 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col h-full p-4 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <FenoraLogo dark={theme === 'dark'} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div
            className="flex-1 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-6 flex items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate whitespace-nowrap">
              <span className="font-semibold text-slate-900 dark:text-white">Fenora CA</span>
              <span className="mx-2 text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{currentNavLabel}</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => handleNavigate('clients')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Clients
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('documents')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Documents
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('voucher-review')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Voucher Review
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('tally')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Tally XML
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>CA Workspace</span>
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
          </div>
        </header>

        {/* Workspace Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeNav === 'overview' && <OverviewSection onNavigate={handleNavigate} />}
          {activeNav === 'clients' && (
            <ClientsSection
              initialSelectedClientId={scopedClientId}
              onNavigate={handleNavigate}
            />
          )}
          {activeNav === 'documents' && (
            <DocumentsSection
              initialClientId={scopedClientId}
              onNavigate={handleNavigate}
            />
          )}
          {activeNav === 'ai-processing' && (
            <AIProcessingSection onNavigate={handleNavigate} />
          )}
          {activeNav === 'accounting' && (
            <AccountingSection onNavigate={handleNavigate} />
          )}
          {activeNav === 'ledgers' && (
            <LedgerManagementSection initialClientId={scopedClientId} />
          )}
          {activeNav === 'voucher-review' && (
            <VoucherReviewSection initialClientId={scopedClientId} />
          )}
          {activeNav === 'gst' && (
            <GSTReconciliationSection initialClientId={scopedClientId} />
          )}
          {activeNav === 'tally' && <TallyIntegrationSection />}
          {activeNav === 'audit' && <AuditTrailSection />}
          {activeNav === 'settings' && <SettingsSection />}
        </main>
      </div>
    </div>
  );
};
