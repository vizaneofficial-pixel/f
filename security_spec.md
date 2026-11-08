# Fenora Security Specification (Phase 0 & Phase 5 Audit)

## 1. Data Invariants

1. **Tenant & Owner Isolation (`ownerUid` & `firmId`)**: Every record across `firms`, `clients`, `financialYears`, `documents`, `accountingProfiles`, `ledgerAccounts`, `vouchers`, `voucherEntries`, `aiProcessingJobs`, `validationResults`, `caApprovals`, `tallySyncJobs`, `auditEvents`, and `clientRequests` must carry `ownerUid == request.auth.uid` and a valid `firmId`.
2. **PII Isolation (`users/{userId}`)**: User profiles contain email addresses and role bindings (`ca` or `client`). Only the authenticated owner (`request.auth.uid == userId`) can read or write their profile. Blanket `list` on `/users` is strictly denied (`allow list: if false;`).
3. **Append-Only Audit Trail (`auditEvents/{eventId}`)**: Audit events can only be created (`allow create`) with verified identity and strict schema validation. Updates and deletions (`allow update, delete: if false;`) are permanently prohibited.
4. **CA Approval Lock Invariant (`vouchers/{voucherId}`)**: All writes to vouchers validate schema bounds and require `ownerUid == request.auth.uid`. Immutable keys (`id`, `ownerUid`, `firmId`, `clientId`) cannot be mutated on update.
5. **Query Enforcer on List Operations**: Every `allow list` rule enforces `isSignedIn() && resource.data.ownerUid == request.auth.uid` without any `get()` or `exists()` calls inside `list`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Client Creation)**: `{ id: "c1", ownerUid: "other_user_uid", firmId: "f1", ... }` -> Denied by `incoming().ownerUid == request.auth.uid`.
2. **Payload 2 (Shadow Field Injection on Voucher Update)**: Adding `{ isSuperAdmin: true }` to `vouchers/{voucherId}` -> Denied by `isValidVoucher(incoming())` `.keys().hasOnly(...)` and `affectedKeys().hasOnly(...)`.
3. **Payload 3 (Audit Trail Tampering / Deletion)**: `updateDoc` or `deleteDoc` on `/auditEvents/evt_1` -> Denied by `allow update, delete: if false;`.
4. **Payload 4 (Unverified Email Write Attempt)**: Authenticated user with `email_verified: false` attempting `setDoc` on `/clients/c1` -> Denied by `isVerifiedUser()`.
5. **Payload 5 (ID Poisoning / 2KB Path Variable)**: Path `/clients/` + 500-char string -> Denied by `isValidId(clientId)` (`id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
6. **Payload 6 (Value Poisoning on Narration)**: Updating `vouchers/{voucherId}` with a 50,000-char `narration` -> Denied by `isValidVoucher(incoming())` (`data.narration.size() <= 400`).
7. **Payload 7 (Cross-Tenant List Scraping)**: Querying `collection(db, 'vouchers')` without `where('ownerUid', '==', auth.uid)` -> Denied by `allow list: if isSignedIn() && resource.data.ownerUid == request.auth.uid;`.
8. **Payload 8 (User Profile Enumeration)**: Calling `getDocs(collection(db, 'users'))` -> Denied by `allow list: if false;`.
9. **Payload 9 (Cross-User PII Read)**: Calling `getDoc(doc(db, 'users', 'victim_uid'))` -> Denied by `request.auth.uid == userId`.
10. **Payload 10 (Immutable Tenant Reassignment)**: Updating `firmId` or `ownerUid` on an existing `AccountingDocument` -> Denied by `incoming().ownerUid == existing().ownerUid && incoming().firmId == existing().firmId`.
11. **Payload 11 (Invalid Enum State Injection)**: Setting `Voucher.voucherType` to `"CryptoSwap"` -> Denied by `data.voucherType in ['Purchase', 'Sales', 'Payment', 'Receipt', 'Journal', 'Credit Note', 'Debit Note']`.
12. **Payload 12 (Negative or Type-Corrupted Amount)**: Setting `Voucher.totalDebit` to `"10000"` (string instead of number) -> Denied by `data.totalDebit is number`.

## 3. Red Team Conflict Report

- **Shadow Update Test**: Passed across all 15 collections via `hasAll` + `hasOnly` in `isValid[Entity]()` and `affectedKeys().hasOnly()` in `allow update`.
- **Email Spoofing Test**: Passed via `isVerifiedUser()` (`request.auth.token.email_verified == true`) required on all write operations.
- **PII Blanket Test**: Passed; `/users/{userId}` restricts `get` to `request.auth.uid == userId` and blocks `list`.
- **Query Trust Test**: Passed; all `allow list` rules check `resource.data.ownerUid == request.auth.uid` with zero `get()`/`exists()` calls.
