import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  UserRole,
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
import { buildInitialSeedData, SIMULATED_GST_RECONCILIATION } from '../data/seedData';

interface FenoraContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  isSigningIn: boolean;
  activeRole: UserRole;
  activePortalClientId: string;
  firm: Firm;
  clients: Client[];
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
  // Authentication methods
  signInWithEmail: (email: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, name?: string, role?: UserRole, businessName?: string) => Promise<{ ok: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle: (preferredRole?: UserRole, preferredClientId?: string) => Promise<{ ok: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  enterWorkspaceAsRole: (role: UserRole, clientId?: string) => Promise<void>;
  // Accounting actions
  createClient: (input: {
    name: string;
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
      entries: { id: string; ledgerName: string; ledgerGroup: string; entryType: 'Dr' | 'Cr'; amount: number }[];
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  updateAccountingProfile: (clientId: string, updates: Partial<AccountingProfile>) => Promise<void>;
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
    status: 'Pending Client' | 'Submitted' | 'Resolved',
    replyMessage?: string
  ) => Promise<void>;
}

const FenoraContext = createContext<FenoraContextValue | undefined>(undefined);

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'id_default';
}

export const FenoraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultSeed = buildInitialSeedData('demo_ca_user');

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<UserRole>('client');
  const [activePortalClientId, setActivePortalClientId] = useState<string>('client_aravind_tex');

  const [firm, setFirm] = useState<Firm>(defaultSeed.firm);
  const [clients, setClients] = useState<Client[]>(defaultSeed.clients);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>(defaultSeed.financialYears);
  const [documents, setDocuments] = useState<AccountingDocument[]>(defaultSeed.documents);
  const [accountingProfiles, setAccountingProfiles] = useState<AccountingProfile[]>(
    defaultSeed.accountingProfiles
  );
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>(defaultSeed.ledgerAccounts);
  const [vouchers, setVouchers] = useState<Voucher[]>(defaultSeed.vouchers);
  const [voucherEntries, setVoucherEntries] = useState<VoucherEntry[]>(defaultSeed.voucherEntries);
  const [aiProcessingJobs, setAiProcessingJobs] = useState<AIProcessingJob[]>(
    defaultSeed.aiProcessingJobs
  );
  const [validationResults, setValidationResults] = useState<ValidationResult[]>(
    defaultSeed.validationResults
  );
  const [caApprovals, setCaApprovals] = useState<CAApproval[]>(defaultSeed.caApprovals);
  const [tallySyncJobs, setTallySyncJobs] = useState<TallySyncJob[]>(defaultSeed.tallySyncJobs);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(defaultSeed.auditEvents);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>(defaultSeed.clientRequests);
  const [gstReconciliation] = useState<GSTReconciliationItem[]>(SIMULATED_GST_RECONCILIATION);

  // Seed Firestore tenant workspace if empty for authenticated user
  const ensureFirestoreSeeded = useCallback(
    async (
      user: FirebaseUser,
      preferredRole?: UserRole,
      preferredClientId?: string,
      displayName?: string,
      businessName?: string
    ) => {
      const uid = sanitizeId(user.uid);
      const seed = buildInitialSeedData(uid);
      const nowIso = new Date().toISOString().slice(0, 35);

      let currentRole: UserRole = preferredRole || 'client';

      // Check user profile
      const userRef = doc(db, 'users', uid);
      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const userEmailLower = (user.email || '').toLowerCase();
          const isCAEmail =
            userEmailLower.includes('fenoraca.in') ||
            userEmailLower.startsWith('ca@') ||
            userEmailLower.startsWith('vikram@') ||
            preferredRole === 'ca';
          const determinedRole: UserRole = isCAEmail ? 'ca' : 'client';
          currentRole = determinedRole;

          let targetClientId = preferredClientId;
          if (!targetClientId) {
            if (determinedRole === 'ca') {
              targetClientId = 'client_aravind_tex';
            } else {
              const isKnownClient =
                userEmailLower.includes('aravind') ||
                userEmailLower === 'relaxingsoundsformeditation@gmail.com' ||
                userEmailLower.includes('demo') ||
                userEmailLower.includes('client');
              targetClientId = isKnownClient ? 'client_aravind_tex' : 'pending';
            }
          }

          const fallbackName =
            determinedRole === 'ca'
              ? 'CA Vikram Deshmukh'
              : (user.displayName || (user.email ? user.email.split('@')[0] : 'Client Workspace'));

          const newProfile: UserProfile = {
            uid,
            email: (user.email || 'user@fenora.in').slice(0, 120),
            displayName: (displayName || user.displayName || fallbackName).slice(0, 100),
            ...(businessName?.trim() ? { businessName: businessName.trim().slice(0, 120) } : {}),
            role: determinedRole,
            firmId: seed.firm.id,
            clientId: targetClientId,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
          setActiveRole(newProfile.role);
          setActivePortalClientId(newProfile.clientId);
        } else {
          const existingProfile = userSnap.data() as UserProfile;
          currentRole = existingProfile.role;
          setUserProfile(existingProfile);
          setActiveRole(existingProfile.role);
          setActivePortalClientId(existingProfile.clientId);
        }
      } catch (error) {
        console.warn(`Profile load note for ${uid}:`, error);
      }

      // Only CA firm partners seed firm tenant workspace records into Firestore.
      // Client portal accounts operate safely within their client workspace without firm batch mutations.
      if (currentRole === 'ca') {
        try {
          const firmsSnap = await getDocs(query(collection(db, 'firms'), where('ownerUid', '==', uid)));
          if (firmsSnap.empty) {
            const batch = writeBatch(db);
          const idSuffix = `_${uid.slice(0, 8)}`;
          const mapId = (id: string) => sanitizeId(`${id}${idSuffix}`);

          const seededFirm: Firm = { ...seed.firm, id: mapId(seed.firm.id) };
          batch.set(doc(db, 'firms', seededFirm.id), seededFirm);

          seed.clients.forEach((c) => {
            const item: Client = { ...c, id: mapId(c.id), firmId: seededFirm.id };
            batch.set(doc(db, 'clients', item.id), item);
          });

          seed.financialYears.forEach((fy) => {
            const item: FinancialYear = {
              ...fy,
              id: mapId(fy.id),
              firmId: seededFirm.id,
              clientId: mapId(fy.clientId),
            };
            batch.set(doc(db, 'financialYears', item.id), item);
          });

          seed.documents.forEach((d) => {
            const item: AccountingDocument = {
              ...d,
              id: mapId(d.id),
              firmId: seededFirm.id,
              clientId: mapId(d.clientId),
            };
            batch.set(doc(db, 'documents', item.id), item);
          });

          seed.accountingProfiles.forEach((ap) => {
            const item: AccountingProfile = {
              ...ap,
              id: mapId(ap.id),
              firmId: seededFirm.id,
              clientId: mapId(ap.clientId),
            };
            batch.set(doc(db, 'accountingProfiles', item.id), item);
          });

          seed.ledgerAccounts.forEach((la) => {
            const item: LedgerAccount = {
              ...la,
              id: mapId(la.id),
              firmId: seededFirm.id,
              clientId: mapId(la.clientId),
            };
            batch.set(doc(db, 'ledgerAccounts', item.id), item);
          });

          seed.vouchers.forEach((v) => {
            const item: Voucher = {
              ...v,
              id: mapId(v.id),
              firmId: seededFirm.id,
              clientId: mapId(v.clientId),
              sourceDocumentId: mapId(v.sourceDocumentId),
            };
            batch.set(doc(db, 'vouchers', item.id), item);
          });

          seed.voucherEntries.forEach((ve) => {
            const item: VoucherEntry = {
              ...ve,
              id: mapId(ve.id),
              firmId: seededFirm.id,
              clientId: mapId(ve.clientId),
              voucherId: mapId(ve.voucherId),
            };
            batch.set(doc(db, 'voucherEntries', item.id), item);
          });

          seed.aiProcessingJobs.forEach((job) => {
            const item: AIProcessingJob = {
              ...job,
              id: mapId(job.id),
              firmId: seededFirm.id,
              clientId: mapId(job.clientId),
              documentId: mapId(job.documentId),
            };
            batch.set(doc(db, 'aiProcessingJobs', item.id), item);
          });

          seed.validationResults.forEach((vr) => {
            const item: ValidationResult = {
              ...vr,
              id: mapId(vr.id),
              firmId: seededFirm.id,
              clientId: mapId(vr.clientId),
              voucherId: mapId(vr.voucherId),
            };
            batch.set(doc(db, 'validationResults', item.id), item);
          });

          seed.caApprovals.forEach((ca) => {
            const item: CAApproval = {
              ...ca,
              id: mapId(ca.id),
              firmId: seededFirm.id,
              clientId: mapId(ca.clientId),
              voucherId: mapId(ca.voucherId),
            };
            batch.set(doc(db, 'caApprovals', item.id), item);
          });

          seed.tallySyncJobs.forEach((ts) => {
            const item: TallySyncJob = {
              ...ts,
              id: mapId(ts.id),
              firmId: seededFirm.id,
              clientId: mapId(ts.clientId),
            };
            batch.set(doc(db, 'tallySyncJobs', item.id), item);
          });

          seed.auditEvents.forEach((ae) => {
            const item: AuditEvent = {
              ...ae,
              id: mapId(ae.id),
              firmId: seededFirm.id,
              clientId: mapId(ae.clientId),
            };
            batch.set(doc(db, 'auditEvents', item.id), item);
          });

          seed.clientRequests.forEach((cr) => {
            const item: ClientRequest = {
              ...cr,
              id: mapId(cr.id),
              firmId: seededFirm.id,
              clientId: mapId(cr.clientId),
            };
            batch.set(doc(db, 'clientRequests', item.id), item);
          });

            await batch.commit();
          }
        } catch (error) {
          console.warn('Initial CA firm workspace seed note:', error);
        }
      }
    },
    []
  );

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await ensureFirestoreSeeded(user);
      } else {
        setUserProfile(null);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [ensureFirestoreSeeded]);

  // Attach real-time Firestore listeners when authenticated
  useEffect(() => {
    if (!authReady || !firebaseUser) return;
    const uid = sanitizeId(firebaseUser.uid);

    const unsubFirms = onSnapshot(
      query(collection(db, 'firms'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) {
          setFirm(snap.docs[0].data() as Firm);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'firms')
    );

    const unsubClients = onSnapshot(
      query(collection(db, 'clients'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Client);
          setClients(list);
          setActivePortalClientId((prev) =>
            list.some((c) => c.id === prev) ? prev : list[0].id
          );
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'clients')
    );

    const unsubFY = onSnapshot(
      query(collection(db, 'financialYears'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setFinancialYears(snap.docs.map((d) => d.data() as FinancialYear));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'financialYears')
    );

    const unsubDocs = onSnapshot(
      query(collection(db, 'documents'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setDocuments(snap.docs.map((d) => d.data() as AccountingDocument));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'documents')
    );

    const unsubProfiles = onSnapshot(
      query(collection(db, 'accountingProfiles'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty)
          setAccountingProfiles(snap.docs.map((d) => d.data() as AccountingProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'accountingProfiles')
    );

    const unsubLedgers = onSnapshot(
      query(collection(db, 'ledgerAccounts'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setLedgerAccounts(snap.docs.map((d) => d.data() as LedgerAccount));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'ledgerAccounts')
    );

    const unsubVouchers = onSnapshot(
      query(collection(db, 'vouchers'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setVouchers(snap.docs.map((d) => d.data() as Voucher));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'vouchers')
    );

    const unsubEntries = onSnapshot(
      query(collection(db, 'voucherEntries'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setVoucherEntries(snap.docs.map((d) => d.data() as VoucherEntry));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'voucherEntries')
    );

    const unsubJobs = onSnapshot(
      query(collection(db, 'aiProcessingJobs'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setAiProcessingJobs(snap.docs.map((d) => d.data() as AIProcessingJob));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'aiProcessingJobs')
    );

    const unsubValidations = onSnapshot(
      query(collection(db, 'validationResults'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty)
          setValidationResults(snap.docs.map((d) => d.data() as ValidationResult));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'validationResults')
    );

    const unsubApprovals = onSnapshot(
      query(collection(db, 'caApprovals'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setCaApprovals(snap.docs.map((d) => d.data() as CAApproval));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'caApprovals')
    );

    const unsubTally = onSnapshot(
      query(collection(db, 'tallySyncJobs'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setTallySyncJobs(snap.docs.map((d) => d.data() as TallySyncJob));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tallySyncJobs')
    );

    const unsubAudit = onSnapshot(
      query(collection(db, 'auditEvents'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) {
          const events = snap.docs.map((d) => d.data() as AuditEvent);
          events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setAuditEvents(events);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'auditEvents')
    );

    const unsubRequests = onSnapshot(
      query(collection(db, 'clientRequests'), where('ownerUid', '==', uid)),
      (snap) => {
        if (!snap.empty) setClientRequests(snap.docs.map((d) => d.data() as ClientRequest));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'clientRequests')
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
  }, [authReady, firebaseUser]);

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
      const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const evt: AuditEvent = {
        id: sanitizeId(`aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`),
        ownerUid: uid,
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

      if (firebaseUser) {
        try {
          await setDoc(doc(db, 'auditEvents', evt.id), evt);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `auditEvents/${evt.id}`);
        }
      }
    },
    [firebaseUser, firm.id]
  );

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
          return ''; // Intentionally cancelled
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

  // Email and Password Sign In
  const signInWithEmail = async (email: string, pass: string): Promise<{ ok: boolean; error?: string }> => {
    setIsSigningIn(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        await ensureFirestoreSeeded(res.user);
      }
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: formatAuthError(err) };
    } finally {
      setIsSigningIn(false);
    }
  };

  // Email and Password Sign Up
  const signUpWithEmail = async (
    email: string,
    pass: string,
    name?: string,
    role: UserRole = 'client',
    businessName?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsSigningIn(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        await ensureFirestoreSeeded(res.user, role, undefined, name?.trim(), businessName?.trim());
      }
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: formatAuthError(err) };
    } finally {
      setIsSigningIn(false);
    }
  };

  // Password Reset
  const sendPasswordReset = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: formatAuthError(err) };
    }
  };

  // Google Sign-In with Popup
  const signInWithGoogle = async (
    preferredRole?: UserRole,
    preferredClientId?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await ensureFirestoreSeeded(result.user, preferredRole, preferredClientId);
      }
      return { ok: true };
    } catch (err: unknown) {
      const formatted = formatAuthError(err);
      if (!formatted) {
        return { ok: false }; // User closed popup without error
      }
      return { ok: false, error: formatted };
    } finally {
      setIsSigningIn(false);
    }
  };

  const enterWorkspaceAsRole = async (role: UserRole, clientId?: string) => {
    const targetClientId = clientId || activePortalClientId || clients[0]?.id || 'client_aravind_tex';
    setActiveRole(role);
    setActivePortalClientId(targetClientId);

    if (firebaseUser && userProfile) {
      const uid = sanitizeId(firebaseUser.uid);
      const nowIso = new Date().toISOString().slice(0, 35);
      try {
        await updateDoc(doc(db, 'users', uid), {
          role,
          clientId: sanitizeId(targetClientId),
          updatedAt: nowIso,
        });
        setUserProfile((prev) =>
          prev ? { ...prev, role, clientId: sanitizeId(targetClientId), updatedAt: nowIso } : null
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    } else if (userProfile) {
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              role,
              clientId: targetClientId,
              displayName:
                role === 'ca'
                  ? 'CA Vikram Deshmukh'
                  : clients.find((c) => c.id === targetClientId)?.name || 'Client Finance Team',
            }
          : null
      );
    }
  };

  const signOutUser = async () => {
    if (firebaseUser) {
      await firebaseSignOut(auth);
    }
    setFirebaseUser(null);
    setUserProfile(null);
  };

  const createClient = async (input: {
    name: string;
    code: string;
    businessType: string;
    gstin: string;
    pan: string;
    financialYear: string;
    contactEmail: string;
  }) => {
    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
    const nowIso = new Date().toISOString().slice(0, 35);
    const newClient: Client = {
      id: sanitizeId(`client_${Date.now()}`),
      ownerUid: uid,
      firmId: firm.id,
      name: input.name.trim().slice(0, 120),
      code: input.code.trim().toUpperCase().slice(0, 24),
      businessType: input.businessType.trim().slice(0, 60),
      gstin: input.gstin.trim().toUpperCase().slice(0, 20),
      pan: input.pan.trim().toUpperCase().slice(0, 16),
      financialYear: input.financialYear.slice(0, 20),
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
      reverseChargeDefault: 'GTA & Legal RCM Checks Enabled',
      historicalBooksStatus: 'Simulated Baseline Initialized',
      profileCompleteness: 65,
      aiLearningStatus: 'Simulated Profile Ready (Awaiting Historical Books)',
      conventionsSummary:
        'Standard firm chart of accounts applied. Upload prior year Trial Balance or approve initial vouchers to build client-specific ledger memory.',
      updatedAt: nowIso,
    };

    setClients((prev) => [newClient, ...prev]);
    setAccountingProfiles((prev) => [newProfile, ...prev]);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'clients', newClient.id), newClient);
        await setDoc(doc(db, 'accountingProfiles', newProfile.id), newProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `clients/${newClient.id}`);
      }
    }

    await appendAuditEvent({
      clientId: newClient.id,
      clientName: newClient.name,
      financialYear: newClient.financialYear,
      reference: newClient.code,
      eventType: 'Client Onboarded',
      actor: userProfile?.displayName || 'CA Vikram Deshmukh',
      description: `Created client workspace for ${newClient.name} (GSTIN: ${newClient.gstin}).`,
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
    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
    const targetClient = clients.find((c) => c.id === input.clientId) || clients[0];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nowIso = new Date().toISOString().slice(0, 35);

    const baseAmount = input.totalAmount && input.totalAmount > 0 ? input.totalAmount : 118000;
    const taxAmt = Math.round((baseAmount * 18) / 118);

    const newDoc: AccountingDocument = {
      id: sanitizeId(`doc_${Date.now()}`),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetClient.id,
      clientName: targetClient.name.slice(0, 120),
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
      vendorOrParty: (input.vendorOrParty || 'Vendor Partner').slice(0, 120),
      invoiceNumber: `INV/${input.financialYear.slice(0, 4)}/${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceDate: new Date().toISOString().slice(0, 10),
      totalAmount: baseAmount,
      taxAmount: taxAmt,
      gstin: targetClient.gstin || '27AABCS8812G1Z3',
      uploadedByRole: activeRole,
      updatedAt: nowIso,
    };

    const newJob: AIProcessingJob = {
      id: sanitizeId(`job_${Date.now()}`),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetClient.id,
      documentId: newDoc.id,
      documentName: newDoc.fileName,
      clientName: targetClient.name.slice(0, 120),
      stage: 'Queued',
      confidence: 0,
      validationSummary: 'Queued for simulated OCR layout extraction and ledger rule matching.',
      startedAt: nowStr,
      updatedAt: nowIso,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setAiProcessingJobs((prev) => [newJob, ...prev]);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'documents', newDoc.id), newDoc);
        await setDoc(doc(db, 'aiProcessingJobs', newJob.id), newJob);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `documents/${newDoc.id}`);
      }
    }

    await appendAuditEvent({
      clientId: targetClient.id,
      clientName: targetClient.name,
      financialYear: newDoc.financialYear,
      reference: newDoc.fileName,
      eventType: 'Document Uploaded',
      actor: activeRole === 'client' ? `Client (${targetClient.name})` : 'CA Firm Staff',
      description: `Uploaded ${newDoc.category} (${newDoc.fileName}) for ${newDoc.period}.`,
    });

    return newDoc;
  };

  const triggerAIProcessingForDoc = async (docId: string) => {
    const targetDoc = documents.find((d) => d.id === docId);
    if (!targetDoc) return;

    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
    const nowIso = new Date().toISOString().slice(0, 35);
    const confidence = 96;
    const totalAmt = targetDoc.totalAmount || 118000;
    const taxAmt = targetDoc.taxAmount || Math.round((totalAmt * 18) / 118);
    const taxableAmt = totalAmt - taxAmt;

    const docUpdates = {
      processingStatus: 'Completed' as const,
      extractionStatus: 'Extracted' as const,
      accountingStatus: 'Voucher Drafted' as const,
      confidence,
      updatedAt: nowIso,
    };

    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ...docUpdates } : d))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'documents', docId), docUpdates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `documents/${docId}`);
      }
    }

    const existingJob = aiProcessingJobs.find((j) => j.documentId === docId);
    if (existingJob) {
      const jobUpdates = {
        stage: 'Completed' as const,
        confidence,
        validationSummary: `Extracted GSTIN ${targetDoc.gstin}, Taxable ₹${taxableAmt.toLocaleString('en-IN')}, GST ₹${taxAmt.toLocaleString('en-IN')}.`,
        updatedAt: nowIso,
      };
      setAiProcessingJobs((prev) =>
        prev.map((j) => (j.id === existingJob.id ? { ...j, ...jobUpdates } : j))
      );
      if (firebaseUser) {
        try {
          await updateDoc(doc(db, 'aiProcessingJobs', existingJob.id), jobUpdates);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `aiProcessingJobs/${existingJob.id}`);
        }
      }
    }

    const existingVoucher = vouchers.find((v) => v.sourceDocumentId === docId);
    if (!existingVoucher) {
      const isSales = targetDoc.category === 'Sales Invoice';
      const vType: VoucherType = isSales
        ? 'Sales'
        : targetDoc.category === 'Credit Note'
        ? 'Credit Note'
        : targetDoc.category === 'Debit Note'
        ? 'Debit Note'
        : targetDoc.category === 'Payment Receipt'
        ? 'Receipt'
        : 'Purchase';

      const newVoucher: Voucher = {
        id: sanitizeId(`vch_${Date.now()}`),
        ownerUid: uid,
        firmId: firm.id,
        clientId: targetDoc.clientId,
        clientName: targetDoc.clientName,
        financialYear: targetDoc.financialYear,
        voucherDate: targetDoc.invoiceDate,
        voucherType: vType,
        voucherNumber: `${vType.slice(0, 3).toUpperCase()}/26-27/${Math.floor(100 + Math.random() * 899)}`,
        sourceDocumentId: targetDoc.id,
        sourceDocumentName: targetDoc.fileName,
        partyLedger: targetDoc.vendorOrParty,
        primaryLedger: isSales ? 'Local Sales - Taxable (18%)' : 'Purchase - Raw Materials & Inputs (18%)',
        taxLedger: isSales ? 'Output CGST & SGST @ 18%' : 'Input IGST / CGST-SGST @ 18%',
        totalDebit: totalAmt,
        totalCredit: totalAmt,
        narration: `Being ${targetDoc.category} booked vide ${targetDoc.invoiceNumber} dated ${targetDoc.invoiceDate} from ${targetDoc.vendorOrParty}.`,
        aiExplanation: `Simulated AI extraction matched ${targetDoc.vendorOrParty} (${targetDoc.gstin}) and verified 18% GST computation.`,
        aiConfidence: confidence,
        validationStatus: 'Valid',
        approvalStatus: 'Pending Review',
        caLocked: false,
        tallySyncStatus: 'Pending',
        updatedAt: nowIso,
      };

      const entry1: VoucherEntry = {
        id: sanitizeId(`ve_${Date.now()}_1`),
        ownerUid: uid,
        firmId: firm.id,
        clientId: targetDoc.clientId,
        voucherId: newVoucher.id,
        ledgerName: isSales ? newVoucher.partyLedger : newVoucher.primaryLedger,
        ledgerGroup: isSales ? 'Sundry Debtors' : 'Purchase Accounts',
        entryType: 'Dr',
        amount: isSales ? totalAmt : taxableAmt,
      };

      const entry2: VoucherEntry = {
        id: sanitizeId(`ve_${Date.now()}_2`),
        ownerUid: uid,
        firmId: firm.id,
        clientId: targetDoc.clientId,
        voucherId: newVoucher.id,
        ledgerName: newVoucher.taxLedger,
        ledgerGroup: 'Duties and Taxes',
        entryType: isSales ? 'Cr' : 'Dr',
        amount: taxAmt,
      };

      const entry3: VoucherEntry = {
        id: sanitizeId(`ve_${Date.now()}_3`),
        ownerUid: uid,
        firmId: firm.id,
        clientId: targetDoc.clientId,
        voucherId: newVoucher.id,
        ledgerName: isSales ? newVoucher.primaryLedger : newVoucher.partyLedger,
        ledgerGroup: isSales ? 'Sales Accounts' : 'Sundry Creditors',
        entryType: 'Cr',
        amount: isSales ? taxableAmt : totalAmt,
      };

      setVouchers((prev) => [newVoucher, ...prev]);
      setVoucherEntries((prev) => [...prev, entry1, entry2, entry3]);

      if (firebaseUser) {
        try {
          await setDoc(doc(db, 'vouchers', newVoucher.id), newVoucher);
          await setDoc(doc(db, 'voucherEntries', entry1.id), entry1);
          await setDoc(doc(db, 'voucherEntries', entry2.id), entry2);
          await setDoc(doc(db, 'voucherEntries', entry3.id), entry3);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `vouchers/${newVoucher.id}`);
        }
      }

      await appendAuditEvent({
        clientId: targetDoc.clientId,
        clientName: targetDoc.clientName,
        financialYear: targetDoc.financialYear,
        reference: newVoucher.voucherNumber,
        eventType: 'AI Processing & Voucher Created',
        actor: 'Fenora Simulated AI Engine',
        description: `Processed ${targetDoc.fileName} (${confidence}% confidence) and drafted balanced ${vType} voucher ${newVoucher.voucherNumber}.`,
      });
    }
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
    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
    const targetClient = clients.find((c) => c.id === input.clientId) || clients[0];
    const nowIso = new Date().toISOString().slice(0, 35);

    const newLedger: LedgerAccount = {
      id: sanitizeId(`ldg_${Date.now()}`),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetClient.id,
      clientName: targetClient.name.slice(0, 120),
      name: input.name.trim().slice(0, 120),
      group: input.group,
      openingBalance: Number(input.openingBalance) || 0,
      balanceType: input.balanceType,
      gstApplicable: input.gstApplicable,
      gstin: input.gstin.trim().toUpperCase().slice(0, 20),
      financialYear: input.financialYear.slice(0, 20),
      tallySyncStatus: 'Pending',
      aiSuggestedKeywords: input.aiSuggestedKeywords.trim().slice(0, 200),
      updatedAt: nowIso,
    };

    setLedgerAccounts((prev) => [newLedger, ...prev]);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'ledgerAccounts', newLedger.id), newLedger);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `ledgerAccounts/${newLedger.id}`);
      }
    }

    await appendAuditEvent({
      clientId: targetClient.id,
      clientName: targetClient.name,
      financialYear: newLedger.financialYear,
      reference: newLedger.name,
      eventType: 'Ledger Master Created',
      actor: userProfile?.displayName || 'CA Vikram Deshmukh',
      description: `Added ledger "${newLedger.name}" under group ${newLedger.group}.`,
    });
  };

  const updateLedgerAccount = async (ledgerId: string, updates: Partial<LedgerAccount>) => {
    const nowIso = new Date().toISOString().slice(0, 35);
    setLedgerAccounts((prev) =>
      prev.map((l) => (l.id === ledgerId ? { ...l, ...updates, updatedAt: nowIso } : l))
    );

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
      entries: { id: string; ledgerName: string; ledgerGroup: string; entryType: 'Dr' | 'Cr'; amount: number }[];
    }
  ): Promise<{ ok: boolean; error?: string }> => {
    const targetVoucher = vouchers.find((v) => v.id === voucherId);
    if (!targetVoucher) return { ok: false, error: 'Voucher not found.' };

    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
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

    const newValidationStatus: 'Valid' | 'Imbalanced' | 'GST Warning' = isBalanced
      ? 'Valid'
      : 'Imbalanced';

    const voucherUpdates = {
      voucherDate: editedVoucher ? editedVoucher.voucherDate.slice(0, 30) : targetVoucher.voucherDate,
      voucherType: editedVoucher ? editedVoucher.voucherType : targetVoucher.voucherType,
      partyLedger: editedVoucher ? editedVoucher.partyLedger.slice(0, 120) : targetVoucher.partyLedger,
      primaryLedger: editedVoucher ? editedVoucher.primaryLedger.slice(0, 120) : targetVoucher.primaryLedger,
      taxLedger: editedVoucher ? editedVoucher.taxLedger.slice(0, 120) : targetVoucher.taxLedger,
      narration: editedVoucher ? editedVoucher.narration.slice(0, 400) : targetVoucher.narration,
      totalDebit,
      totalCredit,
      validationStatus: newValidationStatus,
      approvalStatus: decision,
      caLocked: decision === 'CA Approved',
      updatedAt: nowIso,
    };

    setVouchers((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, ...voucherUpdates } : v))
    );

    if (editedVoucher) {
      setVoucherEntries((prev) => {
        const others = prev.filter((e) => e.voucherId !== voucherId);
        const updatedLines: VoucherEntry[] = editedVoucher.entries.map((line) => ({
          id: sanitizeId(line.id),
          ownerUid: uid,
          firmId: firm.id,
          clientId: targetVoucher.clientId,
          voucherId,
          ledgerName: line.ledgerName.slice(0, 120),
          ledgerGroup: line.ledgerGroup.slice(0, 60),
          entryType: line.entryType,
          amount: Number(line.amount),
        }));
        return [...others, ...updatedLines];
      });
    }

    if (decision === 'CA Approved') {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === targetVoucher.sourceDocumentId
            ? { ...d, accountingStatus: 'CA Approved', updatedAt: nowIso }
            : d
        )
      );
    }

    const approvalRecord: CAApproval = {
      id: sanitizeId(`app_${Date.now()}`),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetVoucher.clientId,
      voucherId,
      reviewerName: (userProfile?.displayName || 'CA Vikram Deshmukh').slice(0, 100),
      decision: wasEdited && decision === 'CA Approved' ? 'Edited & Approved' : decision,
      notes: (notes || `Marked as ${decision}`).slice(0, 300),
      decidedAt: nowIso,
    };

    setCaApprovals((prev) => [approvalRecord, ...prev]);

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'vouchers', voucherId), voucherUpdates);
        await setDoc(doc(db, 'caApprovals', approvalRecord.id), approvalRecord);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `vouchers/${voucherId}`);
      }
    }

    await appendAuditEvent({
      clientId: targetVoucher.clientId,
      clientName: targetVoucher.clientName,
      financialYear: targetVoucher.financialYear,
      reference: targetVoucher.voucherNumber,
      eventType: wasEdited ? `CA Corrected & ${decision}` : `CA Decision: ${decision}`,
      actor: userProfile?.displayName || 'CA Vikram Deshmukh',
      description: `${wasEdited ? 'Modified AI lines and set status to ' : 'Set status to '}${decision} on ${targetVoucher.voucherNumber}.`,
    });

    return { ok: true };
  };

  const updateAccountingProfile = async (
    clientId: string,
    updates: Partial<AccountingProfile>
  ) => {
    const target = accountingProfiles.find((p) => p.clientId === clientId);
    if (!target) return;
    const nowIso = new Date().toISOString().slice(0, 35);

    setAccountingProfiles((prev) =>
      prev.map((p) => (p.id === target.id ? { ...p, ...updates, updatedAt: nowIso } : p))
    );

    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'accountingProfiles', target.id), {
          ...updates,
          updatedAt: nowIso,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `accountingProfiles/${target.id}`);
      }
    }
  };

  const generateTallyXmlForClient = async (clientId: string, financialYear: string) => {
    const targetClient = clients.find((c) => c.id === clientId) || clients[0];
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

    const xmlEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by Fenora Accounting Automation Platform (Simulated TallyPrime v4.0 Envelope) -->
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${targetClient.name.replace(/&/g, '&amp;')} (${financialYear})</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${xmlVouchers || '      <!-- No CA-Approved Vouchers Pending Export -->'}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    await appendAuditEvent({
      clientId: targetClient.id,
      clientName: targetClient.name,
      financialYear,
      reference: `XML-${Date.now().toString().slice(-6)}`,
      eventType: 'Tally XML Generated',
      actor: userProfile?.displayName || 'CA Vikram Deshmukh',
      description: `Generated TallyPrime XML envelope containing ${approvedVouchers.length} CA-approved vouchers for ${targetClient.name}.`,
    });

    return xmlEnvelope;
  };

  const simulateTallyImportForClient = async (clientId: string, financialYear: string) => {
    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
    const targetClient = clients.find((c) => c.id === clientId) || clients[0];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nowIso = new Date().toISOString().slice(0, 35);

    const eligibleVouchers = vouchers.filter(
      (v) =>
        (clientId === 'all' || v.clientId === clientId) &&
        v.approvalStatus === 'CA Approved' &&
        v.validationStatus === 'Valid'
    );

    const newJob: TallySyncJob = {
      id: sanitizeId(`tsync_${Date.now()}`),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetClient.id,
      clientName: targetClient.name.slice(0, 120),
      tallyCompany: `${targetClient.name.slice(0, 90)} (FY ${financialYear})`,
      financialYear: financialYear.slice(0, 20),
      vouchersCount: eligibleVouchers.length || 1,
      status: 'Simulated Import Success',
      summary: `Simulated TallyPrime XML import completed: ${eligibleVouchers.length || 1} CA-approved voucher(s) synchronized with zero duplicate voucher numbers.`,
      syncedAt: nowStr,
    };

    setTallySyncJobs((prev) => [newJob, ...prev]);
    setVouchers((prev) =>
      prev.map((v) =>
        eligibleVouchers.some((ev) => ev.id === v.id)
          ? { ...v, tallySyncStatus: 'Imported', updatedAt: nowIso }
          : v
      )
    );

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'tallySyncJobs', newJob.id), newJob);
        for (const v of eligibleVouchers) {
          await updateDoc(doc(db, 'vouchers', v.id), {
            tallySyncStatus: 'Imported',
            updatedAt: nowIso,
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `tallySyncJobs/${newJob.id}`);
      }
    }

    await appendAuditEvent({
      clientId: targetClient.id,
      clientName: targetClient.name,
      financialYear,
      reference: newJob.id,
      eventType: 'Tally Import Completed (Simulated)',
      actor: userProfile?.displayName || 'CA Vikram Deshmukh',
      description: `Simulated TallyPrime import succeeded for ${eligibleVouchers.length || 1} CA-approved vouchers in ${targetClient.name}.`,
    });
  };

  const createClientRequest = async (input: {
    clientId: string;
    financialYear: string;
    title: string;
    category: string;
    message: string;
  }) => {
    const uid = firebaseUser ? sanitizeId(firebaseUser.uid) : 'demo_ca_user';
    const targetClient = clients.find((c) => c.id === input.clientId) || clients[0];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newReq: ClientRequest = {
      id: sanitizeId(`req_${Date.now()}`),
      ownerUid: uid,
      firmId: firm.id,
      clientId: targetClient.id,
      clientName: targetClient.name.slice(0, 120),
      financialYear: input.financialYear.slice(0, 20),
      title: input.title.trim().slice(0, 150),
      category: input.category.slice(0, 50),
      status: activeRole === 'ca' ? 'Pending Client' : 'Submitted',
      senderRole: activeRole,
      message: input.message.trim().slice(0, 400),
      updatedAt: nowStr,
    };

    setClientRequests((prev) => [newReq, ...prev]);

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'clientRequests', newReq.id), newReq);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `clientRequests/${newReq.id}`);
      }
    }
  };

  const updateClientRequestStatus = async (
    reqId: string,
    status: 'Pending Client' | 'Submitted' | 'Resolved',
    replyMessage?: string
  ) => {
    const target = clientRequests.find((r) => r.id === reqId);
    if (!target) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedMsg = replyMessage
      ? `${target.message} — Reply: ${replyMessage}`.slice(0, 400)
      : target.message;

    setClientRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? { ...r, status, senderRole: activeRole, message: updatedMsg, updatedAt: nowStr }
          : r
      )
    );

    if (firebaseUser) {
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
    }
  };

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
        clients,
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
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signInWithGoogle,
        enterWorkspaceAsRole,
        signOutUser,
        createClient,
        updateClient,
        uploadDocument,
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

export function useFenora() {
  const ctx = useContext(FenoraContext);
  if (!ctx) {
    throw new Error('useFenora must be used inside FenoraProvider');
  }
  return ctx;
}
