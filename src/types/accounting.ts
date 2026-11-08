export type UserRole = 'firm_owner' | 'ca' | 'client' | 'super_admin';

export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type NavigationTab =
  | 'overview'
  | 'clients'
  | 'documents'
  | 'ai-processing'
  | 'reports'
  | 'client-requests'
  | 'settings'
  | 'accounting'
  | 'ledgers'
  | 'voucher-review'
  | 'gst'
  | 'tally'
  | 'audit';

export type ClientWorkspaceTab =
  | 'Overview'
  | 'Documents'
  | 'Financial Reports'
  | 'GST & Tally'
  | 'Accounting Profile'
  | 'Vouchers'
  | 'Audit History';

export type DocumentCategory =
  | 'Purchase Invoice'
  | 'Sales Invoice'
  | 'Expense Bill'
  | 'Bank Statement'
  | 'Credit Note'
  | 'Debit Note'
  | 'Payment Receipt'
  | 'Supplier Statement'
  | 'Customer Statement'
  | 'Other Accounting Document';

export type VoucherType =
  | 'Purchase'
  | 'Sales'
  | 'Payment'
  | 'Receipt'
  | 'Journal'
  | 'Credit Note'
  | 'Debit Note';

export type LedgerGroup =
  | 'Capital Account'
  | 'Current Assets'
  | 'Fixed Assets'
  | 'Current Liabilities'
  | 'Sundry Debtors'
  | 'Sundry Creditors'
  | 'Sales Accounts'
  | 'Purchase Accounts'
  | 'Direct Expenses'
  | 'Indirect Expenses'
  | 'Duties and Taxes'
  | 'Bank Accounts'
  | 'Cash-in-Hand';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  fullName?: string;
  businessName?: string;
  contactPhone?: string;
  role: UserRole;
  firmId: string;
  clientId: string;
  membershipStatus?: MembershipStatus;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Firm {
  id: string;
  firmId?: string;
  ownerUid: string;
  name: string;
  firmName?: string;
  ownerName?: string;
  email?: string;
  contactPhone?: string;
  registrationNo: string;
  gstin: string;
  city: string;
  defaultFinancialYear: string;
  role?: 'firm_owner' | 'ca';
  status?: 'active' | 'suspended';
  mustChangePassword?: boolean;
  driveConnected?: boolean;
  driveEmail?: string;
  driveOnboardingCompleted?: boolean;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  ownerUid: string;
  clientUid?: string;
  firmId: string;
  firmName?: string;
  name: string;
  businessName?: string;
  code: string;
  businessType: string;
  gstin: string;
  pan: string;
  financialYear: string;
  membershipStatus?: MembershipStatus;
  accountingStatus: 'Up to Date' | 'Review Pending' | 'Action Required';
  docProcessingStatus: 'Idle' | 'Processing' | 'Attention';
  tallyStatus: 'Synced' | 'Pending Sync' | 'Disconnected';
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialYear {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  label: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Closed' | 'Audit';
}

export interface AccountingDocument {
  id: string;
  ownerUid: string;
  clientUid?: string;
  firmId: string;
  clientId: string;
  clientName: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  financialYear: string;
  period: string;
  category: DocumentCategory;
  uploadDate: string;
  processingStatus: 'Queued' | 'Analyzing' | 'Completed' | 'Failed';
  extractionStatus: 'Pending' | 'Extracted' | 'Low Confidence' | 'Failed';
  accountingStatus: 'Unprocessed' | 'Voucher Drafted' | 'CA Approved' | 'Exception';
  confidence: number;
  vendorOrParty: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  gstin: string;
  driveFileId?: string;
  driveFolderPath?: string;
  uploadedByRole: UserRole;
  updatedAt: string;
}

export interface AccountingProfile {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  accountingMethod: string;
  gstFilingFrequency: string;
  reverseChargeDefault: string;
  historicalBooksStatus: string;
  profileCompleteness: number;
  aiLearningStatus: string;
  conventionsSummary: string;
  updatedAt: string;
}

export interface LedgerAccount {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  clientName: string;
  name: string;
  group: LedgerGroup;
  openingBalance: number;
  balanceType: 'Dr' | 'Cr';
  gstApplicable: 'Applicable' | 'Not Applicable' | 'Exempt';
  gstin: string;
  financialYear: string;
  tallySyncStatus: 'Synced' | 'Pending' | 'Mismatch';
  aiSuggestedKeywords: string;
  updatedAt: string;
}

export interface Voucher {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  clientName: string;
  financialYear: string;
  voucherDate: string;
  voucherType: VoucherType;
  voucherNumber: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  partyLedger: string;
  primaryLedger: string;
  taxLedger: string;
  totalDebit: number;
  totalCredit: number;
  narration: string;
  aiExplanation: string;
  aiConfidence: number;
  validationStatus: 'Valid' | 'Imbalanced' | 'GST Warning';
  approvalStatus: 'Pending Review' | 'CA Approved' | 'Rejected' | 'Info Requested' | 'Marked for Senior CA';
  caLocked: boolean;
  tallySyncStatus: 'Pending' | 'XML Generated' | 'Imported' | 'Failed';
  updatedAt: string;
}

export interface VoucherEntry {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  voucherId: string;
  ledgerName: string;
  ledgerGroup: string;
  entryType: 'Dr' | 'Cr';
  amount: number;
}

export interface AIProcessingJob {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  documentId: string;
  documentName: string;
  clientName: string;
  stage: 'Queued' | 'OCR & Layout' | 'Ledger Matching' | 'GST Validation' | 'Completed' | 'Failed';
  confidence: number;
  validationSummary: string;
  startedAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  voucherId: string;
  checkType: string;
  status: 'Passed' | 'Warning' | 'Failed';
  message: string;
  checkedAt: string;
}

export interface CAApproval {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  voucherId: string;
  reviewerName: string;
  decision: 'CA Approved' | 'Rejected' | 'Info Requested' | 'Marked for Senior CA' | 'Edited & Approved';
  notes: string;
  decidedAt: string;
}

export interface TallySyncJob {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  clientName: string;
  tallyCompany: string;
  financialYear: string;
  vouchersCount: number;
  status: 'XML Generated' | 'Simulated Import Success' | 'Partial Failure';
  summary: string;
  syncedAt: string;
}

export interface AuditEvent {
  id: string;
  ownerUid: string;
  firmId: string;
  clientId: string;
  clientName: string;
  financialYear: string;
  reference: string;
  eventType: string;
  actor: string;
  description: string;
  timestamp: string;
}

export interface ClientRequest {
  id: string;
  ownerUid: string;
  clientUid?: string;
  firmId: string;
  clientId: string;
  clientName: string;
  businessName?: string;
  email?: string;
  financialYear: string;
  title: string;
  category: string;
  requestType?: 'MEMBERSHIP' | 'DOCUMENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'Pending Client' | 'Submitted' | 'Resolved';
  senderRole: UserRole;
  message: string;
  requestedAt?: string;
  updatedAt: string;
}

export interface GSTReconciliationItem {
  id: string;
  clientId: string;
  clientName: string;
  supplierName: string;
  supplierGstin: string;
  invoiceNo: string;
  invoiceDate: string;
  booksTaxable: number;
  booksIgstCgstSgst: number;
  gstr2bTaxable: number;
  gstr2bTax: number;
  status: 'Matched' | 'Mismatch' | 'Missing in GSTR-2B' | 'Missing in Books' | 'Duplicate' | 'Ineligible ITC';
  remarks: string;
}
