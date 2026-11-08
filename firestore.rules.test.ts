/**
 * Hardened Security Rules Specification Tests for Fenora
 * Verifies all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  docId: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    name: '1. Identity Spoofing on Client Creation',
    collection: 'clients',
    operation: 'create',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'client_1',
    payload: { id: 'client_1', ownerUid: 'spoofed_uid', firmId: 'firm_1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '2. Shadow Field Injection on Voucher Update',
    collection: 'vouchers',
    operation: 'update',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'vch_1',
    payload: { isSuperAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '3. Audit Trail Tampering / Update Attempt',
    collection: 'auditEvents',
    operation: 'update',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'evt_1',
    payload: { description: 'Modified history' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '4. Unverified Email Write Attempt',
    collection: 'clients',
    operation: 'create',
    authUid: 'user_ca_1',
    emailVerified: false,
    docId: 'client_1',
    payload: { id: 'client_1', ownerUid: 'user_ca_1', firmId: 'firm_1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '5. ID Poisoning / Oversized Document ID',
    collection: 'clients',
    operation: 'create',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'a'.repeat(250),
    payload: { id: 'a'.repeat(250), ownerUid: 'user_ca_1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '6. Value Poisoning on Voucher Narration',
    collection: 'vouchers',
    operation: 'update',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'vch_1',
    payload: { narration: 'x'.repeat(2000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '7. Unauthenticated Cross-Tenant List Scraping',
    collection: 'vouchers',
    operation: 'list',
    authUid: null,
    emailVerified: false,
    docId: '',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '8. User Profile Enumeration (List Users)',
    collection: 'users',
    operation: 'list',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: '',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '9. Cross-User PII Read on Users Collection',
    collection: 'users',
    operation: 'get',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'victim_user_2',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '10. Immutable Tenant Reassignment on Document',
    collection: 'documents',
    operation: 'update',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'doc_1',
    payload: { firmId: 'other_firm_id' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '11. Invalid Enum State Injection on Voucher Type',
    collection: 'vouchers',
    operation: 'create',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'vch_2',
    payload: { voucherType: 'InvalidType' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    name: '12. Type-Corrupted Numeric Field on Voucher',
    collection: 'vouchers',
    operation: 'create',
    authUid: 'user_ca_1',
    emailVerified: true,
    docId: 'vch_3',
    payload: { totalDebit: 'not_a_number' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
