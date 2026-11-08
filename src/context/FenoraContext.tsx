import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  UserRole,
  MembershipStatus,
  UserProfile,
  Firm,
  Client,
  FinancialYear,
  AccountingDocument,
  AccountingProfile,
  LedgerAccount,
  Voucher,
  VoucherEntry,
  AIProcessingJob,
  ValidationResult,
  CAApproval,
  TallySyncJob,
  AuditEvent,
  ClientRequest,
  GSTReconciliationItem,
  DocumentCategory,
  LedgerGroup,
  VoucherType,
} from '../types/accounting';

export interface DriveBackendStatus {
  oauthConfigured: boolean;
  missingEnvVars: string[];
  connected: boolean;
  driveEmail: string | null;
  connectedAt: string | null;
  folderStructureTemplate: string;
  loading: boolean;
}

interface FenoraContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  isSigningIn: boolean;
  activeRole: UserRole;
  activePortalClientId: string;
  firm: Firm;
  directoryFirms: Firm[];
  allFirms: Firm[];
  driveStatus: DriveBackendStatus;
  clients: Client[];
  approvedClients: Client[];
  financialYears: FinancialYear[];
  documents: AccountingDocument[];
  accountingProfiles: AccountingProfile[];
  ledgerAccounts: LedgerAccount[];
  vouchers: Voucher[];
  voucherEntries: VoucherEntry[];
  aiProcessingJobs: AIProcessingJob[];
  validationResults: ValidationResult[];
  caApprovals: CAApproval[];
  tallySyncJobs: TallySyncJob[];
  auditEvents: AuditEvent[];
  clientRequests: ClientRequest[];
  gstReconciliation: GSTReconciliationItem[];
  setActiveRole: (role: UserRole) => void;
  setActivePortalClientId: (clientId: string) => void;
  enterWorkspaceAsRole: (role: UserRole, clientId?: string) => Promise<void>;
  signInWithGoogle: (
    preferredRole?: UserRole,
    preferredClientId?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (
    email: string,
    pass: string,
    name?: string,
    role?: UserRole,
    businessName?: string,
    selectedFirmId?: string,
    contactPhone?: string,
    firmName?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  completeCAFirmSetup: (input: {
    firmName: string;
    ownerName: string;
    contactPhone: string;
    city?: string;
    registrationNo?: string;
    gstin?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  completeClientFirmSelection: (input: {
    fullName: string;
    businessName: string;
    selectedFirmId: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  approveClientMembership: (requestId: string) => Promise<{ ok: boolean; error?: string }>;
  rejectClientMembership: (requestId: string) => Promise<{ ok: boolean; error?: string }>;
  refreshDriveStatus: () => Promise<void>;
  connectGoogleDrive: () => Promise<{
    ok: boolean;
    error?: string;
    missingEnvVars?: string[];
  }>;
  disconnectGoogleDrive: () => Promise<{ ok: boolean; error?: string }>;
  completeDriveOnboarding: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  changeFirstTimePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  createFirmAdmin: (input: {
    firmName: string;
    ownerName: string;
    email: string;
    temporaryPassword?: string;
    manualUid?: string;
  }) => Promise<{ ok: boolean; error?: string; errorType?: string; guidance?: string }>;
  toggleFirmStatus: (firmId: string, status: 'active' | 'suspended') => Promise<{ ok: boolean; error?: string }>;
  updateFirmDetails: (firmId: string, updates: Partial<Firm>) => Promise<{ ok: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  createClient: (input: {
    name: string;
    businessName?: string;
    code: string;
    businessType: string;
    gstin: string;
    pan: string;
    financialYear: string;
    contactEmail: string;
  }) => Promise<Client>;
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>;
  uploadDocument: (input: {
    clientId: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    financialYear: string;
    period: string;
    category: DocumentCategory;
    vendorOrParty?: string;
    totalAmount?: number;
  }) => Promise<AccountingDocument>;
  verifyAndUploadClientDocument: (input: {
    clientId: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    financialYear: string;
    period: string;
    category: DocumentCategory;
    file?: File;
  }) => Promise<{
    ok: boolean;
    error?: string;
    targetDrivePath?: string;
    missingEnvVars?: string[];
  }>;
  triggerAIProcessingForDoc: (docId: string) => Promise<void>;
  createLedgerAccount: (input: {
    clientId: string;
    name: string;
    group: LedgerGroup;
    openingBalance: number;
    balanceType: 'Dr' | 'Cr';
    gstApplicable: 'Applicable' | 'Not Applicable' | 'Exempt';
    gstin: string;
    financialYear: string;
    aiSuggestedKeywords: string;
  }) => Promise<void>;
  updateLedgerAccount: (ledgerId: string, updates: Partial<LedgerAccount>) => Promise<void>;
  reviewAndModifyVoucher: (
    voucherId: string,
    decision: 'CA Approved' | 'Rejected' | 'Info Requested' | 'Marked for Senior CA',
    notes: string,
    editedVoucher?: {
      voucherDate: string;
      voucherType: VoucherType;
      partyLedger: string;
      primaryLedger: string;
      taxLedger: string;
      narration: string;
      entries: {
        id: string;
        ledgerName: string;
        ledgerGroup: string;
        entryType: 'Dr' | 'Cr';
        amount: number;
      }[];
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  updateAccountingProfile: (
    clientId: string,
    updates: Partial<AccountingProfile>
  ) => Promise<void>;
  generateTallyXmlForClient: (clientId: string, financialYear: string) => Promise<string>;
  simulateTallyImportForClient: (clientId: string, financialYear: string) => Promise<void>;
  createClientRequest: (input: {
    clientId: string;
    financialYear: string;
    title: string;
    category: string;
    message: string;
  }) => Promise<void>;
  updateClientRequestStatus: (
    reqId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'Pending Client' | 'Submitted' | 'Resolved',
    replyMessage?: string
  ) => Promise<void>;
}

const FenoraContext = createContext<FenoraContextValue | undefined>(undefined);

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'id_default';
}

function generateUniqueId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return sanitizeId(`${prefix}_${Date.now()}_${rand}`);
}

// Filter out any legacy demo/seeded records from earlier turns so all dashboards start in genuine Zero-State
const LEGACY_SEED_PREFIXES = [
  'client_aravind_tex',
  'client_kalyani_auto',
  'client_dakshin_spice',
  'client_nirmal_cloud',
  'fy_aravind',
  'fy_kalyani',
  'fy_dakshin',
  'doc_inv_8841',
  'doc_inv_1092',
  'doc_exp_4410',
  'doc_frt_3319',
  'doc_bnk_hdfc',
  'doc_cn_902',
  'prof_aravind',
  'prof_kalyani',
  'prof_dakshin',
  'prof_nirmal',
  'ldg_surat',
  'ldg_pur_igst',
  'ldg_input_igst',
  'ldg_reliance',
  'ldg_sales_local',
  'ldg_hdfc_cc',
  'ldg_factory_power',
  'ldg_maersk',
  'vch_pur_8841',
  'vch_sal_1092',
  'vch_pmt_4410',
  'vch_pur_3319',
  'vch_cn_902',
  've_8841',
  've_1092',
  've_4410',
  've_3319',
  've_902',
  'job_hdfc',
  'job_inv_8841',
  'job_frt_3319',
  'val_8841',
  'val_3319',
  'app_sal_1092',
  'tsync_kalyani',
  'tsync_aravind',
  'aud_01',
  'aud_02',
  'aud_03',
  'aud_04',
  'aud_05',
  'req_01',
  'req_02',
  'req_03',
];

function isLegacySeedRecord(id: string): boolean {
  return LEGACY_SEED_PREFIXES.some((prefix) => id.startsWith(prefix));
}

const EMPTY_FIRM: Firm = {
  id: '',
  ownerUid: '',
  name: '',
  ownerName: '',
  email: '',
  contactPhone: '',
  registrationNo: 'Pending FRN',
  gstin: 'Pending GSTIN',
  city: 'India',
  defaultFinancialYear: '2026-27',
  driveConnected: false,
  driveEmail: '',
  driveOnboardingCompleted: false,
  active: false,
  createdAt: '',
};

export const FenoraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<UserRole>('client');
  const [activePortalClientId, setActivePortalClientId] = useState<string>('');

  // Genuine Zero-State Initialization (No fake clients, documents, or transactions)
  const [firm, setFirm] = useState<Firm>(EMPTY_FIRM);
  const [directoryFirms, setDirectoryFirms] = useState<Firm[]>([]);
  const [allFirms, setAllFirms] = useState<Firm[]>([]);
  const [driveStatus, setDriveStatus] = useState<DriveBackendStatus>({
    oauthConfigured: false,
    missingEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'],
    connected: false,
    driveEmail: null,
    connectedAt: null,
    folderStructureTemplate: 'Fenora / Clients / <Client Name> / <Financial Year> / Documents',
    loading: false,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [documents, setDocuments] = useState<AccountingDocument[]>([]);
  const [accountingProfiles, setAccountingProfiles] = useState<AccountingProfile[]>([]);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherEntries, setVoucherEntries] = useState<VoucherEntry[]>([]);
  const [aiProcessingJobs, setAiProcessingJobs] = useState<AIProcessingJob[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [caApprovals, setCaApprovals] = useState<CAApproval[]>([]);
  const [tallySyncJobs, setTallySyncJobs] = useState<TallySyncJob[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [gstReconciliation] = useState<GSTReconciliationItem[]>([]);

  // Subscribe to active CA firms directory so clients can search and select an eligible firm during registration
  // Filter out any suspended or inactive firms
  useEffect(() => {
    const qFirms = query(collection(db, 'firms'), where('active', '==', true));
    const unsub = onSnapshot(
      qFirms,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Firm)
          .filter((f) => f.active === true && f.status !== 'suspended' && f.name && !f.id.startsWith('firm_demo'));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setDirectoryFirms(list);
      },
      (err) => {
        console.warn('Directory firms listener note:', err);
      }
    );
    return () => unsub();
  }, []);

  // Super Admin real-time listener for all firms
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const isSuperAdmin = (firebaseUser.email || '').toLowerCase() === 'relaxingsoundsformeditation@gmail.com';
    if (!isSuperAdmin) return;

    const unsub = onSnapshot(
      collection(db, 'firms'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Firm);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setAllFirms(list);
      },
      (err) => console.warn('All firms listener note:', err)
    );
    return () => unsub();
  }, [authReady, firebaseUser]);

  // Refresh Google Drive backend status for the active firm
  const refreshDriveStatus = useCallback(async (targetFirmId?: string) => {
    const fid = targetFirmId || firm.id;
    setDriveStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/drive/status?firmId=${encodeURIComponent(fid || '')}`);
      if (res.ok) {
        const data = await res.json();
        setDriveStatus({
          oauthConfigured: Boolean(data.oauthConfigured),
          missingEnvVars: Array.isArray(data.missingEnvVars) ? data.missingEnvVars : [],
          connected: Boolean(data.connected),
          driveEmail: data.driveEmail || null,
          connectedAt: data.connectedAt || null,
          folderStructureTemplate:
            data.folderStructureTemplate ||
            'Fenora / Clients / <Client Name> / <Financial Year> / Documents',
          loading: false,
        });
        return;
      }
    } catch {
      // Fallback if API route unreachable
    }
    setDriveStatus((prev) => ({ ...prev, loading: false }));
  }, [firm.id]);

  useEffect(() => {
    if (firm.id) {
      refreshDriveStatus(firm.id);
    }
  }, [firm.id, refreshDriveStatus]);

  // Synchronize client-persisted encrypted credentials to active server memory cache
  const syncFirmDriveCredentials = useCallback(
    async (firmId: string) => {
      if (!firebaseUser || !firmId) return;
      try {
        const credSnap = await getDoc(doc(db, 'firmDriveConnections', firmId));
        if (credSnap.exists()) {
          const credData = credSnap.data();
          const idToken = await firebaseUser.getIdToken();
          await fetch('/api/drive/credentials/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              firmId,
              connectionRecord: credData,
            }),
          });
        }
      } catch (err) {
        console.warn('[Drive Sync] Note during credentials sync:', err);
      }
    },
    [firebaseUser]
  );

  // Synchronize credentials to server cache on startup or firm change
  useEffect(() => {
    if (firm.id && firm.driveConnected && firebaseUser && activeRole === 'ca') {
      syncFirmDriveCredentials(firm.id);
    }
  }, [firm.id, firm.driveConnected, firebaseUser, activeRole, syncFirmDriveCredentials]);

  // Handle Google Drive OAuth callback redirect parameters & secure handoff code
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const driveHandoff = urlParams.get('drive_handoff');
    const driveConnected = urlParams.get('drive_connected');
    const driveError = urlParams.get('drive_error');
    const callbackFirmId = urlParams.get('firmId');
    const callbackEmail = urlParams.get('driveEmail');

    // 1. New Secure Handoff Code Exchange Flow
    if (driveHandoff) {
      const fid = callbackFirmId || firm.id;
      if (fid && firebaseUser) {
        (async () => {
          try {
            const idToken = await firebaseUser.getIdToken();
            const exchangeRes = await fetch('/api/drive/handoff/exchange', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                handoffCode: driveHandoff,
                firmId: fid,
              }),
            });
            const exchangeData = await exchangeRes.json();
            if (!exchangeRes.ok || !exchangeData.ok || !exchangeData.connectionRecord) {
              throw new Error(exchangeData.error || 'Failed to exchange Google Drive handoff.');
            }

            const record = exchangeData.connectionRecord;
            const nowIso = new Date().toISOString().slice(0, 35);

            // Durably persist encrypted credentials to Firestore via Firebase Client SDK
            // This runs in the authenticated CA firm owner's context, passing isFirmOwner(firmId)
            await setDoc(doc(db, 'firmDriveConnections', fid), record);

            // Update firm tenant metadata
            await updateDoc(doc(db, 'firms', fid), {
              driveConnected: true,
              driveEmail: record.driveEmail,
              driveOnboardingCompleted: true,
              updatedAt: nowIso,
            });

            // Update local React state
            setFirm((prev) => ({
              ...prev,
              driveConnected: true,
              driveEmail: record.driveEmail,
              driveOnboardingCompleted: true,
              updatedAt: nowIso,
            }));

            await refreshDriveStatus(fid);
            console.log('[Drive Handoff] Successfully persisted encrypted credentials to Firestore via Client SDK.');
          } catch (err) {
            console.error('[Drive Handoff] Error persisting Drive credentials:', err);
          } finally {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })();
      }
    } else if (driveConnected === 'true') {
      const fid = callbackFirmId || firm.id;
      if (fid) {
        refreshDriveStatus(fid);
        setFirm((prev) => ({
          ...prev,
          driveConnected: true,
          driveEmail: callbackEmail || prev.driveEmail,
          driveOnboardingCompleted: true,
        }));
        if (firebaseUser) {
          const nowIso = new Date().toISOString().slice(0, 35);
          updateDoc(doc(db, 'firms', fid), {
            driveConnected: true,
            driveEmail: callbackEmail || '',
            driveOnboardingCompleted: true,
            updatedAt: nowIso,
          }).catch((err) => console.warn('[Drive OAuth] Note updating firm record:', err));
        }
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (driveError) {
      console.warn('[Drive OAuth] Callback error returned from server:', driveError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [firm.id, firebaseUser, refreshDriveStatus]);

  // Load or initialize user profile and tenant firm association upon authentication
  const loadOrInitUserSession = useCallback(
    async (
      user: FirebaseUser,
      options?: {
        role?: UserRole;
        displayName?: string;
        businessName?: string;
        selectedFirmId?: string;
        contactPhone?: string;
        firmName?: string;
      }
    ) => {
      const uid = sanitizeId(user.uid);
      const nowIso = new Date().toISOString().slice(0, 35);
      const userRef = doc(db, 'users', uid);
      const userEmail = (user.email || '').toLowerCase().trim();

      try {
        // 1. Super Admin automatic detection
        const isSuperAdmin = userEmail === 'relaxingsoundsformeditation@gmail.com';
        if (isSuperAdmin) {
          const userSnap = await getDoc(userRef);
          let adminProfile: UserProfile;
          if (userSnap.exists()) {
            const raw = userSnap.data() as UserProfile;
            adminProfile = { ...raw, role: 'super_admin' };
          } else {
            adminProfile = {
              uid,
              email: user.email || '',
              displayName: 'Fenora Super Admin',
              role: 'super_admin',
              firmId: 'fenora_hq',
              clientId: 'admin',
              membershipStatus: 'APPROVED',
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            await setDoc(userRef, adminProfile);
          }
          setUserProfile(adminProfile);
          setActiveRole('super_admin');
          return;
        }

        // 2. Existing profile lookup
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const existingProfile = userSnap.data() as UserProfile;
          setUserProfile(existingProfile);
          setActiveRole(existingProfile.role);
          if (existingProfile.clientId) {
            setActivePortalClientId(existingProfile.clientId);
          }

          // Fetch associated firm for firm_owner, ca, or client
          const targetFirmId = existingProfile.firmId;
          if (targetFirmId && targetFirmId !== 'pending' && targetFirmId !== 'fenora_hq') {
            const firmSnap = await getDoc(doc(db, 'firms', targetFirmId));
            if (firmSnap.exists()) {
              setFirm(firmSnap.data() as Firm);
            }
          } else if (existingProfile.role === 'firm_owner' || existingProfile.role === 'ca') {
            const q = query(collection(db, 'firms'), where('ownerUid', '==', uid));
            const firmDocs = await getDocs(q);
            if (!firmDocs.empty) {
              setFirm(firmDocs.docs[0].data() as Firm);
            }
          }
          return;
        }

        // 3. Client Registration Flow (public registration is restricted strictly to clients)
        if (options?.role === 'client' && options?.selectedFirmId && options.selectedFirmId !== 'pending') {
          const firmSnap = await getDoc(doc(db, 'firms', options.selectedFirmId));
          if (!firmSnap.exists()) {
            throw new Error('Selected CA firm was not found.');
          }
          const targetFirm = firmSnap.data() as Firm;
          if (targetFirm.status === 'suspended' || targetFirm.active === false) {
            throw new Error('The selected firm is currently suspended and not accepting new registrations.');
          }

          const uniqueClientId = generateUniqueId('client');
          const clientFullName = (
            options.displayName ||
            user.displayName ||
            (user.email ? user.email.split('@')[0] : 'Client')
          ).slice(0, 100);
          const clientBizName = (options.businessName || clientFullName).trim().slice(0, 120);
          const clientEmail = (user.email || '').slice(0, 120);

          const newClientRecord: Client = {
            id: uniqueClientId,
            ownerUid: targetFirm.ownerUid,
            clientUid: uid,
            firmId: targetFirm.id,
            firmName: targetFirm.name,
            name: clientFullName,
            businessName: clientBizName,
            code: clientBizName
              .replace(/[^a-zA-Z0-9]/g, '')
              .toUpperCase()
              .slice(0, 6) || 'CL01',
            businessType: clientBizName,
            gstin: 'Pending',
            pan: 'Pending',
            financialYear: targetFirm.defaultFinancialYear || '2026-27',
            membershipStatus: 'PENDING',
            accountingStatus: 'Review Pending',
            docProcessingStatus: 'Idle',
            tallyStatus: 'Pending Sync',
            contactEmail: clientEmail,
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          const newUserProfile: UserProfile = {
            uid,
            email: clientEmail,
            displayName: clientFullName,
            businessName: clientBizName,
            role: 'client',
            firmId: targetFirm.id,
            clientId: uniqueClientId,
            membershipStatus: 'PENDING',
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          const membershipRequest: ClientRequest = {
            id: generateUniqueId('req'),
            ownerUid: targetFirm.ownerUid,
            clientUid: uid,
            firmId: targetFirm.id,
            clientId: uniqueClientId,
            clientName: clientFullName,
            businessName: clientBizName,
            email: clientEmail,
            financialYear: targetFirm.defaultFinancialYear || '2026-27',
            title: `New Client Registration: ${clientBizName}`,
            category: 'Client Registration',
            requestType: 'MEMBERSHIP',
            status: 'PENDING',
            senderRole: 'client',
            message: `${clientFullName} (${clientBizName}) requested client portal access under ${targetFirm.name}.`,
            requestedAt: nowIso,
            updatedAt: nowIso,
          };

          await setDoc(doc(db, 'clients', uniqueClientId), newClientRecord);
          await setDoc(userRef, newUserProfile);
          await setDoc(doc(db, 'clientRequests', membershipRequest.id), membershipRequest);

          setFirm(targetFirm);
          setUserProfile(newUserProfile);
          setActiveRole('client');
          setActivePortalClientId(uniqueClientId);
          return;
        }

        // 4. Unregistered / unprofiled account fallback
        console.warn(`Unregistered user signed in: ${user.email} (${uid})`);
        setUserProfile(null);
      } catch (error) {
        console.warn('Session initialization note:', error);
      }
    },
    []
  );

  // Complete CA Firm Setup (for CA users who authenticated with Google or need to finish firm creation)
  const completeCAFirmSetup = async (input: {
    firmName: string;
    ownerName: string;
    contactPhone: string;
    city?: string;
    registrationNo?: string;
    gstin?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (!firebaseUser) return { ok: false, error: 'Not authenticated.' };
    const uid = sanitizeId(firebaseUser.uid);
    const nowIso = new Date().toISOString().slice(0, 35);
    const uniqueFirmId = generateUniqueId('firm');

    const newFirm: Firm = {
      id: uniqueFirmId,
      ownerUid: uid,
      name: input.firmName.trim().slice(0, 120),
      ownerName: input.ownerName.trim().slice(0, 100),
      email: (firebaseUser.email || '').slice(0, 120),
      contactPhone: input.contactPhone.trim().slice(0, 40),
      registrationNo: (input.registrationNo || 'CA-FRN').trim().slice(0, 40),
      gstin: (input.gstin || 'Pending').trim().slice(0, 20),
      city: (input.city || 'India').trim().slice(0, 60),
      defaultFinancialYear: '2026-27',
      driveConnected: false,
      driveEmail: '',
      driveOnboardingCompleted: false,
      active: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await setDoc(doc(db, 'firms', uniqueFirmId), newFirm);
      const updatedProfile: UserProfile = {
        uid,
        email: (firebaseUser.email || '').slice(0, 120),
        displayName: input.ownerName.trim().slice(0, 100),
        businessName: input.firmName.trim().slice(0, 120),
        contactPhone: input.contactPhone.trim().slice(0, 40),
        role: 'ca',
        firmId: uniqueFirmId,
        clientId: 'ca_owner',
        membershipStatus: 'APPROVED',
        createdAt: userProfile?.createdAt || nowIso,
        updatedAt: nowIso,
      };
      await setDoc(doc(db, 'users', uid), updatedProfile);
      setFirm(newFirm);
      setUserProfile(updatedProfile);
      setActiveRole('ca');
      localStorage.setItem('fenora_ca_initialized', 'true');
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to register CA firm.',
      };
    }
  };

  // Complete Client Firm Selection (for clients who signed in with Google or have firmId === 'pending')
  const completeClientFirmSelection = async (input: {
    fullName: string;
    businessName: string;
    selectedFirmId: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (!firebaseUser) return { ok: false, error: 'Not authenticated.' };
    const uid = sanitizeId(firebaseUser.uid);
    const nowIso = new Date().toISOString().slice(0, 35);

    try {
      const firmSnap = await getDoc(doc(db, 'firms', input.selectedFirmId));
      if (!firmSnap.exists()) {
        return { ok: false, error: 'Selected CA firm does not exist.' };
      }
      const targetFirm = firmSnap.data() as Firm;
      const uniqueClientId = generateUniqueId('client');
      const clientFullName = input.fullName.trim().slice(0, 100);
      const clientBizName = input.businessName.trim().slice(0, 120);
      const clientEmail = (firebaseUser.email || '').slice(0, 120);

      const newClientRecord: Client = {
        id: uniqueClientId,
        ownerUid: targetFirm.ownerUid,
        clientUid: uid,
        firmId: targetFirm.id,
        firmName: targetFirm.name,
        name: clientFullName,
        businessName: clientBizName,
        code:
          clientBizName
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 6) || 'CL01',
        businessType: clientBizName,
        gstin: 'Pending',
        pan: 'Pending',
        financialYear: targetFirm.defaultFinancialYear || '2026-27',
        membershipStatus: 'PENDING',
        accountingStatus: 'Review Pending',
        docProcessingStatus: 'Idle',
        tallyStatus: 'Pending Sync',
        contactEmail: clientEmail,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const updatedProfile: UserProfile = {
        uid,
        email: clientEmail,
        displayName: clientFullName,
        businessName: clientBizName,
        role: 'client',
        firmId: targetFirm.id,
        clientId: uniqueClientId,
        membershipStatus: 'PENDING',
        createdAt: userProfile?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      const membershipRequest: ClientRequest = {
        id: generateUniqueId('req'),
        ownerUid: targetFirm.ownerUid,
        clientUid: uid,
        firmId: targetFirm.id,
        clientId: uniqueClientId,
        clientName: clientFullName,
        businessName: clientBizName,
        email: clientEmail,
        financialYear: targetFirm.defaultFinancialYear || '2026-27',
        title: `New Client Registration: ${clientBizName}`,
        category: 'Client Registration',
        requestType: 'MEMBERSHIP',
        status: 'PENDING',
        senderRole: 'client',
        message: `${clientFullName} (${clientBizName}) requested client portal access under ${targetFirm.name}.`,
        requestedAt: nowIso,
        updatedAt: nowIso,
      };

      await setDoc(doc(db, 'clients', uniqueClientId), newClientRecord);
      await setDoc(doc(db, 'users', uid), updatedProfile);
      await setDoc(doc(db, 'clientRequests', membershipRequest.id), membershipRequest);

      setFirm(targetFirm);
      setUserProfile(updatedProfile);
      setActivePortalClientId(uniqueClientId);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to submit client registration.',
      };
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadOrInitUserSession(user);
      } else {
        setUserProfile(null);
        setFirm(EMPTY_FIRM);
        setClients([]);
        setDocuments([]);
        setVouchers([]);
        setVoucherEntries([]);
        setAiProcessingJobs([]);
        setClientRequests([]);
        setAuditEvents([]);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [loadOrInitUserSession]);

  // Listen to user's own profile in real time (so when CA approves a client, the client's UI unlocks immediately)
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const uid = sanitizeId(firebaseUser.uid);
    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserProfile(data);
          setActiveRole(data.role);
          if (data.clientId) setActivePortalClientId(data.clientId);
        }
      },
      (err) => console.warn('User profile listener note:', err)
    );
    return () => unsubUser();
  }, [authReady, firebaseUser]);

  // Attach real-time Firestore listeners scoped strictly to the authenticated user's role and firm
  useEffect(() => {
    if (!authReady || !firebaseUser || !userProfile) return;
    const uid = sanitizeId(firebaseUser.uid);
    if (userProfile.role === 'super_admin') {
      return;
    }
    const isCA = userProfile.role === 'ca' || userProfile.role === 'firm_owner';

    if (isCA) {
      const unsubFirms = onSnapshot(
        query(collection(db, 'firms'), where('ownerUid', '==', uid)),
        (snap) => {
          const validFirms = snap.docs
            .map((d) => d.data() as Firm)
            .filter((f) => f.active === true);
          if (validFirms.length > 0) {
            setFirm(validFirms[0]);
          }
        },
        (err) => console.warn('Firm listener note:', err)
      );

      const unsubClients = onSnapshot(
        query(collection(db, 'clients'), where('ownerUid', '==', uid)),
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as Client)
            .filter((c) => !isLegacySeedRecord(c.id));
          setClients(list);
        },
        (err) => console.warn('Clients listener note:', err)
      );

      const unsubFY = onSnapshot(
        query(collection(db, 'financialYears'), where('ownerUid', '==', uid)),
        (snap) => {
          setFinancialYears(
            snap.docs
              .map((d) => d.data() as FinancialYear)
              .filter((f) => !isLegacySeedRecord(f.id))
          );
        },
        (err) => console.warn('FY listener note:', err)
      );

      const unsubDocs = onSnapshot(
        query(collection(db, 'documents'), where('ownerUid', '==', uid)),
        (snap) => {
          setDocuments(
            snap.docs
              .map((d) => d.data() as AccountingDocument)
              .filter((docItem) => !isLegacySeedRecord(docItem.id))
          );
        },
        (err) => console.warn('Documents listener note:', err)
      );

      const unsubProfiles = onSnapshot(
        query(collection(db, 'accountingProfiles'), where('ownerUid', '==', uid)),
        (snap) => {
          setAccountingProfiles(
            snap.docs
              .map((d) => d.data() as AccountingProfile)
              .filter((p) => !isLegacySeedRecord(p.id))
          );
        },
        (err) => console.warn('Profiles listener note:', err)
      );

      const unsubLedgers = onSnapshot(
        query(collection(db, 'ledgerAccounts'), where('ownerUid', '==', uid)),
        (snap) => {
          setLedgerAccounts(
            snap.docs
              .map((d) => d.data() as LedgerAccount)
              .filter((l) => !isLegacySeedRecord(l.id))
          );
        },
        (err) => console.warn('Ledgers listener note:', err)
      );

      const unsubVouchers = onSnapshot(
        query(collection(db, 'vouchers'), where('ownerUid', '==', uid)),
        (snap) => {
          setVouchers(
            snap.docs
              .map((d) => d.data() as Voucher)
              .filter((v) => !isLegacySeedRecord(v.id))
          );
        },
        (err) => console.warn('Vouchers listener note:', err)
      );

      const unsubEntries = onSnapshot(
        query(collection(db, 'voucherEntries'), where('ownerUid', '==', uid)),
        (snap) => {
          setVoucherEntries(
            snap.docs
              .map((d) => d.data() as VoucherEntry)
              .filter((ve) => !isLegacySeedRecord(ve.id))
          );
        },
        (err) => console.warn('VoucherEntries listener note:', err)
      );

      const unsubJobs = onSnapshot(
        query(collection(db, 'aiProcessingJobs'), where('ownerUid', '==', uid)),
        (snap) => {
          setAiProcessingJobs(
            snap.docs
              .map((d) => d.data() as AIProcessingJob)
              .filter((j) => !isLegacySeedRecord(j.id))
          );
        },
        (err) => console.warn('AIJobs listener note:', err)
      );

      const unsubValidations = onSnapshot(
        query(collection(db, 'validationResults'), where('ownerUid', '==', uid)),
        (snap) => {
          setValidationResults(
            snap.docs
              .map((d) => d.data() as ValidationResult)
              .filter((vr) => !isLegacySeedRecord(vr.id))
          );
        },
        (err) => console.warn('ValidationResults listener note:', err)
      );

      const unsubApprovals = onSnapshot(
        query(collection(db, 'caApprovals'), where('ownerUid', '==', uid)),
        (snap) => {
          setCaApprovals(
            snap.docs
              .map((d) => d.data() as CAApproval)
              .filter((ca) => !isLegacySeedRecord(ca.id))
          );
        },
        (err) => console.warn('CAApprovals listener note:', err)
      );

      const unsubTally = onSnapshot(
        query(collection(db, 'tallySyncJobs'), where('ownerUid', '==', uid)),
        (snap) => {
          setTallySyncJobs(
            snap.docs
              .map((d) => d.data() as TallySyncJob)
              .filter((ts) => !isLegacySeedRecord(ts.id))
          );
        },
        (err) => console.warn('TallySyncJobs listener note:', err)
      );

      const unsubAudit = onSnapshot(
        query(collection(db, 'auditEvents'), where('ownerUid', '==', uid)),
        (snap) => {
          const events = snap.docs
            .map((d) => d.data() as AuditEvent)
            .filter((ae) => !isLegacySeedRecord(ae.id));
          events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setAuditEvents(events);
        },
        (err) => console.warn('AuditEvents listener note:', err)
      );

      const unsubRequests = onSnapshot(
        query(collection(db, 'clientRequests'), where('ownerUid', '==', uid)),
        (snap) => {
          const reqs = snap.docs
            .map((d) => d.data() as ClientRequest)
            .filter((cr) => !isLegacySeedRecord(cr.id));
          reqs.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
          setClientRequests(reqs);
        },
        (err) => console.warn('ClientRequests listener note:', err)
      );

      return () => {
        unsubFirms();
        unsubClients();
        unsubFY();
        unsubDocs();
        unsubProfiles();
        unsubLedgers();
        unsubVouchers();
        unsubEntries();
        unsubJobs();
        unsubValidations();
        unsubApprovals();
        unsubTally();
        unsubAudit();
        unsubRequests();
      };
    } else {
      // Client Portal listeners — strictly isolated to this client's own records (`clientUid == uid`)
      const unsubClientRecord = onSnapshot(
        query(collection(db, 'clients'), where('clientUid', '==', uid)),
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as Client)
            .filter((c) => !isLegacySeedRecord(c.id));
          setClients(list);
          if (list[0]) {
            setActivePortalClientId(list[0].id);
          }
        },
        (err) => console.warn('Client own record listener note:', err)
      );

      const unsubClientDocs = onSnapshot(
        query(collection(db, 'documents'), where('clientUid', '==', uid)),
        (snap) => {
          setDocuments(
            snap.docs
              .map((d) => d.data() as AccountingDocument)
              .filter((docItem) => !isLegacySeedRecord(docItem.id))
          );
        },
        (err) => console.warn('Client documents listener note:', err)
      );

      const unsubClientReqs = onSnapshot(
        query(collection(db, 'clientRequests'), where('clientUid', '==', uid)),
        (snap) => {
          setClientRequests(
            snap.docs
              .map((d) => d.data() as ClientRequest)
              .filter((cr) => !isLegacySeedRecord(cr.id))
          );
        },
        (err) => console.warn('Client requests listener note:', err)
      );

      return () => {
        unsubClientRecord();
        unsubClientDocs();
        unsubClientReqs();
      };
    }
  }, [authReady, firebaseUser, userProfile]);

  const appendAuditEvent = useCallback(
    async (input: {
      clientId: string;
      clientName: string;
      financialYear: string;
      reference: string;
      eventType: string;
      actor: string;
      description: string;
    }) => {
      if (!firebaseUser || !firm.id) return;
      const uid = sanitizeId(firebaseUser.uid);
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const evt: AuditEvent = {
        id: generateUniqueId('aud'),
        ownerUid: firm.ownerUid || uid,
        firmId: firm.id,
        clientId: sanitizeId(input.clientId),
        clientName: input.clientName.slice(0, 120),
        financialYear: input.financialYear.slice(0, 20),
        reference: input.reference.slice(0, 80),
        eventType: input.eventType.slice(0, 60),
        actor: input.actor.slice(0, 100),
        description: input.description.slice(0, 350),
        timestamp: nowStr,
      };

      setAuditEvents((prev) => [evt, ...prev]);

      try {
        await setDoc(doc(db, 'auditEvents', evt.id), evt);
      } catch (error) {
        console.warn('Audit event log note:', error);
      }
    },
    [firebaseUser, firm.id, firm.ownerUid]
  );

  // CA Client Approval Actions
  const approveClientMembership = async (
    requestId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const req = clientRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: 'Request not found.' };
    const nowIso = new Date().toISOString().slice(0, 35);

    try {
      await updateDoc(doc(db, 'clientRequests', req.id), {
        status: 'APPROVED',
        updatedAt: nowIso,
      });

      await updateDoc(doc(db, 'clients', req.clientId), {
        membershipStatus: 'APPROVED',
        accountingStatus: 'Up to Date',
        updatedAt: nowIso,
      });

      if (req.clientUid) {
        await updateDoc(doc(db, 'users', req.clientUid), {
          membershipStatus: 'APPROVED',
          clientId: req.clientId,
          updatedAt: nowIso,
        });
      }

      await appendAuditEvent({
        clientId: req.clientId,
        clientName: req.businessName || req.clientName,
        financialYear: req.financialYear || '2026-27',
        reference: req.email || req.clientId,
        eventType: 'Client Membership Approved',
        actor: userProfile?.displayName || firm.ownerName || 'CA Partner',
        description: `Approved client registration for ${req.clientName} (${req.businessName || req.clientName}).`,
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to approve client request.',
      };
    }
  };

  const rejectClientMembership = async (
    requestId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const req = clientRequests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: 'Request not found.' };
    const nowIso = new Date().toISOString().slice(0, 35);

    try {
      await updateDoc(doc(db, 'clientRequests', req.id), {
        status: 'REJECTED',
        updatedAt: nowIso,
      });

      await updateDoc(doc(db, 'clients', req.clientId), {
        membershipStatus: 'REJECTED',
        updatedAt: nowIso,
      });

      if (req.clientUid) {
        await updateDoc(doc(db, 'users', req.clientUid), {
          membershipStatus: 'REJECTED',
          clientId: req.clientId,
          updatedAt: nowIso,
        });
      }

      await appendAuditEvent({
        clientId: req.clientId,
        clientName: req.businessName || req.clientName,
        financialYear: req.financialYear || '2026-27',
        reference: req.email || req.clientId,
        eventType: 'Client Membership Rejected',
        actor: userProfile?.displayName || firm.ownerName || 'CA Partner',
        description: `Rejected client registration request for ${req.clientName} (${req.businessName || req.clientName}).`,
      });

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to reject client request.',
      };
    }
  };

  // Google Drive Backend Integration Actions
  const connectGoogleDrive = async (): Promise<{
    ok: boolean;
    error?: string;
    missingEnvVars?: string[];
  }> => {
    if (!firebaseUser || !firm.id) {
      return { ok: false, error: 'Firm profile is not initialized.' };
    }
    try {
      const res = await fetch('/api/drive/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmId: firm.id,
          ownerUid: sanitizeId(firebaseUser.uid),
        }),
      });
      const data = await res.json();
      await refreshDriveStatus(firm.id);

      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error:
            data.error ||
            'Backend Google Drive OAuth is not configured yet. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server.',
          missingEnvVars: data.missingEnvVars,
        };
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
        return { ok: true };
      }

      return { ok: true };
    } catch {
      return {
        ok: false,
        error:
          'Unable to reach backend Google Drive OAuth service. Ensure server OAuth credentials are configured.',
      };
    }
  };

  const disconnectGoogleDrive = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!firebaseUser || !firm.id) {
      return { ok: false, error: 'Firm profile is not initialized.' };
    }
    try {
      await fetch('/api/drive/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmId: firm.id,
          ownerUid: sanitizeId(firebaseUser.uid),
        }),
      });

      // Remove from client-persisted Firestore collection
      try {
        await deleteDoc(doc(db, 'firmDriveConnections', firm.id));
      } catch (e) {
        console.warn('[Drive Disconnect] Firestore deleteDoc note:', e);
      }

      const nowIso = new Date().toISOString().slice(0, 35);
      await updateDoc(doc(db, 'firms', firm.id), {
        driveConnected: false,
        driveEmail: '',
        updatedAt: nowIso,
      });
      await refreshDriveStatus(firm.id);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to disconnect Google Drive.',
      };
    }
  };

  const completeDriveOnboarding = async () => {
    if (!firebaseUser || !firm.id) return;
    const nowIso = new Date().toISOString().slice(0, 35);
    setFirm((prev) => ({ ...prev, driveOnboardingCompleted: true, updatedAt: nowIso }));
    try {
      await updateDoc(doc(db, 'firms', firm.id), {
        driveOnboardingCompleted: true,
        updatedAt: nowIso,
      });
    } catch (err) {
      console.warn('Drive onboarding update note:', err);
    }
  };

  // Format Firebase Auth errors into clear, human-friendly messages
  const formatAuthError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = String((err as { code: string }).code);
      switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          return 'Incorrect email or password.';
        case 'auth/email-already-in-use':
          return 'An account with this email already exists. Please sign in.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/weak-password':
          return 'Password must be at least 6 characters.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
          return '';
        case 'auth/popup-blocked':
          return 'Pop-up blocked. Please allow pop-ups for this site.';
        case 'auth/account-exists-with-different-credential':
          return 'An account already exists with a different sign-in method.';
        case 'auth/unauthorized-domain':
          return 'Domain is not in Firebase authorized domains list.';
        case 'auth/operation-not-allowed':
          return 'Email/password sign-in is not enabled in Firebase Console. Please continue with Google.';
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please try again in a few moments.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection.';
        default:
          break;
      }
    }
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    return msg.replace(/^Firebase:\s*/, '').replace(/\s*\([a-z0-9/-]+\)\.?$/, '');
  };

  const signInWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsSigningIn(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        await loadOrInitUserSession(res.user);
      }
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: formatAuthError(err) };
    } finally {
      setIsSigningIn(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name?: string,
    role: UserRole = 'client',
    businessName?: string,
    selectedFirmId?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!selectedFirmId || selectedFirmId === 'pending') {
      return { ok: false, error: 'Please select an active accounting/CA firm.' };
    }
    setIsSigningIn(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        await loadOrInitUserSession(res.user, {
          role: 'client',
          displayName: name?.trim(),
          businessName: businessName?.trim(),
          selectedFirmId,
        });
      }
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: formatAuthError(err) };
    } finally {
      setIsSigningIn(false);
    }
  };

  const changeFirstTimePassword = async (
    newPassword: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!firebaseUser) return { ok: false, error: 'Not authenticated.' };
    const nowIso = new Date().toISOString().slice(0, 35);
    try {
      await updatePassword(firebaseUser, newPassword);
      const userRef = doc(db, 'users', sanitizeId(firebaseUser.uid));
      await updateDoc(userRef, {
        mustChangePassword: false,
        updatedAt: nowIso,
      });

      if (firm.id) {
        try {
          await updateDoc(doc(db, 'firms', firm.id), {
            mustChangePassword: false,
            updatedAt: nowIso,
          });
          setFirm((prev) => ({ ...prev, mustChangePassword: false }));
        } catch {
          // ignore firm update error if not permitted
        }
      }

      setUserProfile((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: formatAuthError(err) };
    }
  };

  const createFirmAdmin = async (input: {
    firmName: string;
    ownerName: string;
    email: string;
    temporaryPassword?: string;
    manualUid?: string;
  }): Promise<{ ok: boolean; error?: string; errorType?: string; guidance?: string }> => {
    if (!firebaseUser) return { ok: false, error: 'Not authenticated as administrator.' };
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/firms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || 'Failed to create firm.',
          errorType: data.errorType,
          guidance: data.guidance,
        };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error creating firm.',
      };
    }
  };

  const toggleFirmStatus = async (
    firmId: string,
    status: 'active' | 'suspended'
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!firebaseUser) return { ok: false, error: 'Not authenticated as administrator.' };
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/firms/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ firmId, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || 'Failed to update firm status.' };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error updating firm status.',
      };
    }
  };

  const updateFirmDetails = async (
    firmId: string,
    updates: Partial<Firm>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!firebaseUser) return { ok: false, error: 'Not authenticated as administrator.' };
    try {
      const nowIso = new Date().toISOString().slice(0, 35);
      await updateDoc(doc(db, 'firms', firmId), {
        ...updates,
        updatedAt: nowIso,
      });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to update firm details.',
      };
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: formatAuthError(err) };
    }
  };

  const signInWithGoogle = async (
    preferredRole?: UserRole,
    preferredFirmId?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await loadOrInitUserSession(result.user, {
          role: preferredRole,
          selectedFirmId: preferredFirmId,
        });
      }
      return { ok: true };
    } catch (err: unknown) {
      const formatted = formatAuthError(err);
      if (!formatted) {
        return { ok: false };
      }
      return { ok: false, error: formatted };
    } finally {
      setIsSigningIn(false);
    }
  };

  const enterWorkspaceAsRole = async (role: UserRole, clientId?: string) => {
    setActiveRole(role);
    if (clientId) setActivePortalClientId(clientId);
  };

  const signOutUser = async () => {
    if (firebaseUser) {
      await firebaseSignOut(auth);
    }
    setFirebaseUser(null);
    setUserProfile(null);
    setFirm(EMPTY_FIRM);
    setClients([]);
    setDocuments([]);
    setVouchers([]);
    setVoucherEntries([]);
    setAiProcessingJobs([]);
    setClientRequests([]);
    setAuditEvents([]);
  };

  const createClient = async (input: {
    name: string;
    businessName?: string;
    code: string;
    businessType: string;
    gstin: string;
    pan: string;
    financialYear: string;
    contactEmail: string;
  }) => {
    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : '';
    const nowIso = new Date().toISOString().slice(0, 35);
    const newClient: Client = {
      id: generateUniqueId('client'),
      ownerUid: uid,
      firmId: firm.id,
      firmName: firm.name,
      name: input.name.trim().slice(0, 120),
      businessName: (input.businessName || input.name).trim().slice(0, 120),
      code: input.code.trim().toUpperCase().slice(0, 24) || 'CL01',
      businessType: input.businessType.trim().slice(0, 60),
      gstin: input.gstin.trim().toUpperCase().slice(0, 20) || 'Pending',
      pan: input.pan.trim().toUpperCase().slice(0, 16) || 'Pending',
      financialYear: input.financialYear.slice(0, 20) || '2026-27',
      membershipStatus: 'APPROVED',
      accountingStatus: 'Up to Date',
      docProcessingStatus: 'Idle',
      tallyStatus: 'Pending Sync',
      contactEmail: input.contactEmail.trim().slice(0, 120),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const newProfile: AccountingProfile = {
      id: sanitizeId(`prof_${newClient.id}`),
      ownerUid: uid,
      firmId: firm.id,
      clientId: newClient.id,
      accountingMethod: 'Mercantile (Accrual) · Ind AS',
      gstFilingFrequency: 'Monthly (GSTR-1 & GSTR-3B)',
      reverseChargeDefault: 'Standard RCM Checks',
      historicalBooksStatus: 'Awaiting Historical Books',
      profileCompleteness: 0,
      aiLearningStatus: 'No Historical Books Uploaded Yet',
      conventionsSummary: 'No accounting conventions recorded yet.',
      updatedAt: nowIso,
    };

    if (firebaseUser && firm.id) {
      try {
        await setDoc(doc(db, 'clients', newClient.id), newClient);
        await setDoc(doc(db, 'accountingProfiles', newProfile.id), newProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `clients/${newClient.id}`);
      }
    }

    await appendAuditEvent({
      clientId: newClient.id,
      clientName: newClient.businessName || newClient.name,
      financialYear: newClient.financialYear,
      reference: newClient.code,
      eventType: 'Client Created',
      actor: userProfile?.displayName || firm.ownerName || 'CA Partner',
      description: `Added client ${newClient.businessName || newClient.name} to firm workspace.`,
    });

    return newClient;
  };

  const updateClient = async (clientId: string, updates: Partial<Client>) => {
    const nowIso = new Date().toISOString().slice(0, 35);
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, ...updates, updatedAt: nowIso } : c))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'clients', clientId), {
          ...updates,
          updatedAt: nowIso,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `clients/${clientId}`);
      }
    }
  };

  // Client Document Upload Verification (Routes to firm's Google Drive, never stores binaries in Firebase)
  const verifyAndUploadClientDocument = async (input: {
    clientId: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    financialYear: string;
    period: string;
    category: DocumentCategory;
    file?: File;
  }): Promise<{
    ok: boolean;
    error?: string;
    targetDrivePath?: string;
    missingEnvVars?: string[];
  }> => {
    if (!firebaseUser || !userProfile) {
      return { ok: false, error: 'You must be signed in to upload documents.' };
    }

    if (userProfile.role === 'client' && userProfile.membershipStatus !== 'APPROVED') {
      return {
        ok: false,
        error: 'Document upload is disabled until your CA firm approves your membership request.',
      };
    }

    const targetClient =
      clients.find((c) => c.id === input.clientId) ||
      clients.find((c) => c.clientUid === firebaseUser.uid);

    const clientDisplayName =
      targetClient?.businessName ||
      targetClient?.name ||
      userProfile.businessName ||
      userProfile.displayName;
    const targetFolderPath = `Fenora / Clients / ${clientDisplayName} / ${input.financialYear} / Documents`;

    try {
      const idToken = await firebaseUser.getIdToken();
      let res: globalThis.Response;
      if (input.file) {
        const formData = new FormData();
        formData.append('file', input.file);
        formData.append('firmId', userProfile.firmId);
        formData.append('clientId', targetClient?.id || userProfile.clientId);
        formData.append('clientName', clientDisplayName);
        formData.append('financialYear', input.financialYear);
        formData.append('fileName', input.fileName);
        formData.append('fileType', input.fileType);
        formData.append('fileSize', input.fileSize);
        formData.append('category', input.category);
        formData.append('period', input.period);
        formData.append('membershipStatus', userProfile.membershipStatus || 'APPROVED');
        formData.append('uploadedByRole', userProfile.role || 'client');
        formData.append('clientUid', firebaseUser.uid);

        res = await fetch('/api/drive/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          body: formData,
        });
      } else {
        res = await fetch('/api/drive/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            firmId: userProfile.firmId,
            clientId: targetClient?.id || userProfile.clientId,
            clientName: clientDisplayName,
            clientUid: firebaseUser.uid,
            financialYear: input.financialYear,
            fileName: input.fileName,
            fileType: input.fileType,
            fileSize: input.fileSize,
            category: input.category,
            period: input.period,
            membershipStatus: userProfile.membershipStatus || 'APPROVED',
            uploadedByRole: userProfile.role || 'client',
          }),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error:
            data.error ||
            'Upload requires an active CA firm Google Drive connection on the backend.',
          targetDrivePath: data.targetDrivePath || `${targetFolderPath} / ${input.fileName}`,
          missingEnvVars: data.missingEnvVars,
        };
      }

      if (data.document) {
        setDocuments((prev) => [data.document, ...prev.filter((d) => d.id !== data.document.id)]);
      }

      return {
        ok: true,
        targetDrivePath: data.targetDrivePath || `${targetFolderPath} / ${input.fileName}`,
      };
    } catch {
      return {
        ok: false,
        error: 'Backend Google Drive upload service is not connected.',
        targetDrivePath: `${targetFolderPath} / ${input.fileName}`,
      };
    }
  };

  const uploadDocument = async (input: {
    clientId: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    financialYear: string;
    period: string;
    category: DocumentCategory;
    vendorOrParty?: string;
    totalAmount?: number;
  }) => {
    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : '';
    const targetClient = clients.find((c) => c.id === input.clientId);
    if (!targetClient) {
      throw new Error('Select a registered client before uploading.');
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nowIso = new Date().toISOString().slice(0, 35);
    const baseAmount = input.totalAmount && input.totalAmount > 0 ? input.totalAmount : 0;
    const taxAmt = baseAmount > 0 ? Math.round((baseAmount * 18) / 118) : 0;
    const folderPath = `Fenora / Clients / ${targetClient.businessName || targetClient.name} / ${input.financialYear} / Documents`;

    const newDoc: AccountingDocument = {
      id: generateUniqueId('doc'),
      ownerUid: targetClient.ownerUid || uid,
      ...(targetClient.clientUid ? { clientUid: targetClient.clientUid } : {}),
      firmId: targetClient.firmId,
      clientId: targetClient.id,
      clientName: (targetClient.businessName || targetClient.name).slice(0, 120),
      fileName: input.fileName.trim().slice(0, 180),
      fileType: input.fileType.toUpperCase().slice(0, 20),
      fileSize: input.fileSize.slice(0, 30),
      financialYear: input.financialYear.slice(0, 20),
      period: input.period.slice(0, 30),
      category: input.category,
      uploadDate: nowStr,
      processingStatus: 'Queued',
      extractionStatus: 'Pending',
      accountingStatus: 'Unprocessed',
      confidence: 0,
      vendorOrParty: (input.vendorOrParty || 'Unverified Party').slice(0, 120),
      invoiceNumber: 'Pending Extraction',
      invoiceDate: new Date().toISOString().slice(0, 10),
      totalAmount: baseAmount,
      taxAmount: taxAmt,
      gstin: targetClient.gstin || 'Pending',
      driveFolderPath: folderPath.slice(0, 260),
      uploadedByRole: activeRole,
      updatedAt: nowIso,
    };

    const newJob: AIProcessingJob = {
      id: generateUniqueId('job'),
      ownerUid: targetClient.ownerUid || uid,
      firmId: targetClient.firmId,
      clientId: targetClient.id,
      documentId: newDoc.id,
      documentName: newDoc.fileName,
      clientName: (targetClient.businessName || targetClient.name).slice(0, 120),
      stage: 'Queued',
      confidence: 0,
      validationSummary: 'Queued for n8n & AI processing pipeline.',
      startedAt: nowStr,
      updatedAt: nowIso,
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'documents', newDoc.id), newDoc);
        await setDoc(doc(db, 'aiProcessingJobs', newJob.id), newJob);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `documents/${newDoc.id}`);
      }
    }

    return newDoc;
  };

  const triggerAIProcessingForDoc = async (_docId: string) => {
    // No fake AI completion results are fabricated per strict zero-state rules
  };

  const createLedgerAccount = async (input: {
    clientId: string;
    name: string;
    group: LedgerGroup;
    openingBalance: number;
    balanceType: 'Dr' | 'Cr';
    gstApplicable: 'Applicable' | 'Not Applicable' | 'Exempt';
    gstin: string;
    financialYear: string;
    aiSuggestedKeywords: string;
  }) => {
    if (!firebaseUser || !firm.id) return;
    const uid = sanitizeId(firebaseUser.uid);
    const targetClient = clients.find((c) => c.id === input.clientId);
    if (!targetClient) return;
    const nowIso = new Date().toISOString().slice(0, 35);

    const newLedger: LedgerAccount = {
      id: generateUniqueId('ldg'),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetClient.id,
      clientName: (targetClient.businessName || targetClient.name).slice(0, 120),
      name: input.name.trim().slice(0, 120),
      group: input.group,
      openingBalance: Number(input.openingBalance) || 0,
      balanceType: input.balanceType,
      gstApplicable: input.gstApplicable,
      gstin: input.gstin.trim().toUpperCase().slice(0, 20) || 'NA',
      financialYear: input.financialYear.slice(0, 20),
      tallySyncStatus: 'Pending',
      aiSuggestedKeywords: input.aiSuggestedKeywords.trim().slice(0, 200),
      updatedAt: nowIso,
    };

    try {
      await setDoc(doc(db, 'ledgerAccounts', newLedger.id), newLedger);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `ledgerAccounts/${newLedger.id}`);
    }
  };

  const updateLedgerAccount = async (ledgerId: string, updates: Partial<LedgerAccount>) => {
    const nowIso = new Date().toISOString().slice(0, 35);
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'ledgerAccounts', ledgerId), {
          ...updates,
          updatedAt: nowIso,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `ledgerAccounts/${ledgerId}`);
      }
    }
  };

  const reviewAndModifyVoucher = async (
    voucherId: string,
    decision: 'CA Approved' | 'Rejected' | 'Info Requested' | 'Marked for Senior CA',
    notes: string,
    editedVoucher?: {
      voucherDate: string;
      voucherType: VoucherType;
      partyLedger: string;
      primaryLedger: string;
      taxLedger: string;
      narration: string;
      entries: {
        id: string;
        ledgerName: string;
        ledgerGroup: string;
        entryType: 'Dr' | 'Cr';
        amount: number;
      }[];
    }
  ): Promise<{ ok: boolean; error?: string }> => {
    const targetVoucher = vouchers.find((v) => v.id === voucherId);
    if (!targetVoucher) return { ok: false, error: 'Voucher not found.' };
    if (!firebaseUser) return { ok: false, error: 'Not authenticated.' };

    const uid = sanitizeId(firebaseUser.uid);
    const nowIso = new Date().toISOString().slice(0, 35);

    let totalDebit = targetVoucher.totalDebit;
    let totalCredit = targetVoucher.totalCredit;
    let wasEdited = false;

    if (editedVoucher) {
      totalDebit = editedVoucher.entries
        .filter((e) => e.entryType === 'Dr')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      totalCredit = editedVoucher.entries
        .filter((e) => e.entryType === 'Cr')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      wasEdited = true;
    }

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
    if (decision === 'CA Approved' && !isBalanced) {
      return {
        ok: false,
        error: `Cannot approve imbalanced voucher: Total Debit (₹${totalDebit.toLocaleString('en-IN')}) must equal Total Credit (₹${totalCredit.toLocaleString('en-IN')}).`,
      };
    }

    const voucherUpdates = {
      voucherDate: editedVoucher
        ? editedVoucher.voucherDate.slice(0, 30)
        : targetVoucher.voucherDate,
      voucherType: editedVoucher ? editedVoucher.voucherType : targetVoucher.voucherType,
      partyLedger: editedVoucher
        ? editedVoucher.partyLedger.slice(0, 120)
        : targetVoucher.partyLedger,
      primaryLedger: editedVoucher
        ? editedVoucher.primaryLedger.slice(0, 120)
        : targetVoucher.primaryLedger,
      taxLedger: editedVoucher ? editedVoucher.taxLedger.slice(0, 120) : targetVoucher.taxLedger,
      narration: editedVoucher ? editedVoucher.narration.slice(0, 400) : targetVoucher.narration,
      totalDebit,
      totalCredit,
      validationStatus: (isBalanced ? 'Valid' : 'Imbalanced') as 'Valid' | 'Imbalanced',
      approvalStatus: decision,
      caLocked: decision === 'CA Approved',
      updatedAt: nowIso,
    };

    const approvalRecord: CAApproval = {
      id: generateUniqueId('app'),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetVoucher.clientId,
      voucherId,
      reviewerName: (userProfile?.displayName || firm.ownerName || 'CA Partner').slice(0, 100),
      decision: wasEdited && decision === 'CA Approved' ? 'Edited & Approved' : decision,
      notes: (notes || `Marked as ${decision}`).slice(0, 300),
      decidedAt: nowIso,
    };

    try {
      await updateDoc(doc(db, 'vouchers', voucherId), voucherUpdates);
      await setDoc(doc(db, 'caApprovals', approvalRecord.id), approvalRecord);
      return { ok: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vouchers/${voucherId}`);
    }
  };

  const updateAccountingProfile = async (
    clientId: string,
    updates: Partial<AccountingProfile>
  ) => {
    const target = accountingProfiles.find((p) => p.clientId === clientId);
    if (!target || !firebaseUser) return;
    const nowIso = new Date().toISOString().slice(0, 35);
    try {
      await updateDoc(doc(db, 'accountingProfiles', target.id), {
        ...updates,
        updatedAt: nowIso,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `accountingProfiles/${target.id}`);
    }
  };

  const generateTallyXmlForClient = async (clientId: string, financialYear: string) => {
    const targetClient = clients.find((c) => c.id === clientId);
    const companyName = targetClient?.businessName || targetClient?.name || firm.name || 'Fenora Client';
    const approvedVouchers = vouchers.filter(
      (v) =>
        (clientId === 'all' || v.clientId === clientId) &&
        v.approvalStatus === 'CA Approved' &&
        v.validationStatus === 'Valid'
    );

    const xmlVouchers = approvedVouchers
      .map((v) => {
        const lines = voucherEntries.filter((e) => e.voucherId === v.id);
        const ledgerEntriesXml = lines
          .map(
            (l) => `        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${l.ledgerName.replace(/&/g, '&amp;')}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${l.entryType === 'Dr' ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
          <AMOUNT>${l.entryType === 'Dr' ? `-${l.amount.toFixed(2)}` : `${l.amount.toFixed(2)}`}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
          )
          .join('\n');

        return `      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="${v.voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
          <DATE>${v.voucherDate.replace(/-/g, '')}</DATE>
          <VOUCHERTYPENAME>${v.voucherType}</VOUCHERTYPENAME>
          <VOUCHERNUMBER>${v.voucherNumber}</VOUCHERNUMBER>
          <PARTYLEDGERNAME>${v.partyLedger.replace(/&/g, '&amp;')}</PARTYLEDGERNAME>
          <NARRATION>${v.narration.replace(/&/g, '&amp;')}</NARRATION>
${ledgerEntriesXml}
        </VOUCHER>
      </TALLYMESSAGE>`;
      })
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName.replace(/&/g, '&amp;')} (${financialYear})</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${xmlVouchers || '      <!-- No CA-Approved Vouchers Available for Export -->'}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
  };

  const simulateTallyImportForClient = async (_clientId: string, _financialYear: string) => {
    // Strictly no simulated Tally import jobs created when no approved vouchers exist
  };

  const createClientRequest = async (input: {
    clientId: string;
    financialYear: string;
    title: string;
    category: string;
    message: string;
  }) => {
    if (!firebaseUser || !firm.id) return;
    const uid = sanitizeId(firebaseUser.uid);
    const targetClient = clients.find((c) => c.id === input.clientId);
    if (!targetClient) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newReq: ClientRequest = {
      id: generateUniqueId('req'),
      ownerUid: firm.ownerUid || uid,
      ...(targetClient.clientUid ? { clientUid: targetClient.clientUid } : {}),
      firmId: firm.id,
      clientId: targetClient.id,
      clientName: (targetClient.businessName || targetClient.name).slice(0, 120),
      businessName: (targetClient.businessName || targetClient.name).slice(0, 120),
      email: targetClient.contactEmail,
      financialYear: input.financialYear.slice(0, 20),
      title: input.title.trim().slice(0, 150),
      category: input.category.slice(0, 50),
      requestType: 'DOCUMENT',
      status: activeRole === 'ca' ? 'Pending Client' : 'Submitted',
      senderRole: activeRole,
      message: input.message.trim().slice(0, 400),
      requestedAt: nowStr,
      updatedAt: nowStr,
    };

    try {
      await setDoc(doc(db, 'clientRequests', newReq.id), newReq);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clientRequests/${newReq.id}`);
    }
  };

  const updateClientRequestStatus = async (
    reqId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'Pending Client' | 'Submitted' | 'Resolved',
    replyMessage?: string
  ) => {
    const target = clientRequests.find((r) => r.id === reqId);
    if (!target || !firebaseUser) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedMsg = replyMessage
      ? `${target.message} — Reply: ${replyMessage}`.slice(0, 400)
      : target.message;

    try {
      await updateDoc(doc(db, 'clientRequests', reqId), {
        status,
        senderRole: activeRole,
        message: updatedMsg,
        updatedAt: nowStr,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clientRequests/${reqId}`);
    }
  };

  // Approved clients list for CA firm
  const approvedClients = clients.filter(
    (c) => !c.membershipStatus || c.membershipStatus === 'APPROVED'
  );

  return (
    <FenoraContext.Provider
      value={{
        firebaseUser,
        userProfile,
        authReady,
        isSigningIn,
        activeRole,
        activePortalClientId,
        firm,
        directoryFirms,
        allFirms,
        driveStatus,
        clients,
        approvedClients,
        financialYears,
        documents,
        accountingProfiles,
        ledgerAccounts,
        vouchers,
        voucherEntries,
        aiProcessingJobs,
        validationResults,
        caApprovals,
        tallySyncJobs,
        auditEvents,
        clientRequests,
        gstReconciliation,
        setActiveRole,
        setActivePortalClientId,
        enterWorkspaceAsRole,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        completeCAFirmSetup,
        completeClientFirmSelection,
        approveClientMembership,
        rejectClientMembership,
        refreshDriveStatus,
        connectGoogleDrive,
        disconnectGoogleDrive,
        completeDriveOnboarding,
        sendPasswordReset,
        changeFirstTimePassword,
        createFirmAdmin,
        toggleFirmStatus,
        updateFirmDetails,
        signOutUser,
        createClient,
        updateClient,
        uploadDocument,
        verifyAndUploadClientDocument,
        triggerAIProcessingForDoc,
        createLedgerAccount,
        updateLedgerAccount,
        reviewAndModifyVoucher,
        updateAccountingProfile,
        generateTallyXmlForClient,
        simulateTallyImportForClient,
        createClientRequest,
        updateClientRequestStatus,
      }}
    >
      {children}
    </FenoraContext.Provider>
  );
};

export function useFenora(): FenoraContextValue {
  const ctx = useContext(FenoraContext);
  if (!ctx) {
    throw new Error('useFenora must be used inside a FenoraProvider');
  }
  return ctx;
}
