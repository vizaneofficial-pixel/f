import type { Request, Response } from 'express';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const SUPER_ADMIN_EMAILS = [
  'relaxingsoundsformeditation@gmail.com',
  'vizaneofficial@gmail.com',
  (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_PROJECT_ID || 'key-course-zhh41';
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    const credentials = JSON.parse(serviceAccountKey);
    return initializeApp({
      credential: cert(credentials),
      projectId: credentials.project_id || projectId,
    });
  }

  // This fallback works only where Application Default Credentials are configured.
  return initializeApp({ projectId });
}

function sendError(res: Response, status: number, error: string, errorType?: string, extra: Record<string, unknown> = {}) {
  return res.status(status).json({ ok: false, error, ...(errorType ? { errorType } : {}), ...extra });
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed.');
  }

  try {
    const authorization = String(req.headers.authorization || '');
    const idToken = authorization.replace(/^Bearer\s+/i, '').trim();
    if (!idToken) return sendError(res, 401, 'Missing Firebase ID token.');

    const adminApp = getAdminApp();
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    const email = String(decodedToken.email || '').toLowerCase().trim();

    let isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
    if (!isSuperAdmin) {
      const adminDoc = await getFirestore(adminApp).collection('admins').doc(decodedToken.uid).get();
      isSuperAdmin = adminDoc.exists;
    }
    if (!isSuperAdmin) {
      return sendError(res, 403, 'Unauthorized: Access restricted to Fenora Super Administrator.');
    }

    const { firmName, ownerName, email: ownerEmail, temporaryPassword, manualUid } = req.body || {};
    if (!firmName || !ownerName || !ownerEmail) {
      return sendError(res, 400, 'Missing required fields: firmName, ownerName, and email.');
    }

    const trimmedEmail = String(ownerEmail).trim().toLowerCase();
    const trimmedFirmName = String(firmName).trim();
    const trimmedOwnerName = String(ownerName).trim();
    if (!trimmedFirmName || !trimmedOwnerName || !trimmedEmail) {
      return sendError(res, 400, 'Firm name, owner name, and email cannot be blank.');
    }

    const auth = getAuth(adminApp);
    let uid = String(manualUid || '').trim();

    if (!uid) {
      return sendError(
        res,
        400,
        'Please create the user in Firebase Console Authentication and provide their UID for free-tier onboarding.',
        'MANUAL_UID_REQUIRED'
      );
    }

    const db = getFirestore(adminApp);
    const firmId = `firm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const nowIso = new Date().toISOString();

    const firmData = {
      id: firmId,
      firmId,
      name: trimmedFirmName,
      firmName: trimmedFirmName,
      ownerName: trimmedOwnerName,
      ownerUid: uid,
      email: trimmedEmail,
      role: 'firm_owner',
      status: 'active',
      active: true,
      mustChangePassword: true,
      driveConnected: false,
      driveEmail: '',
      driveOnboardingCompleted: false,
      registrationNo: 'CA-REG',
      gstin: 'Pending',
      city: 'India',
      defaultFinancialYear: '2026-27',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const userData = {
      uid,
      email: trimmedEmail,
      displayName: trimmedOwnerName,
      fullName: trimmedOwnerName,
      role: 'firm_owner',
      firmId,
      clientId: 'ca_owner',
      membershipStatus: 'APPROVED',
      mustChangePassword: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const firmRef = db.collection('firms').doc(firmId);
    const userRef = db.collection('users').doc(uid);

    await db.runTransaction(async (transaction) => {
      const [firmSnap, userSnap] = await Promise.all([
        transaction.get(firmRef),
        transaction.get(userRef),
      ]);

      if (firmSnap.exists) throw new Error('FIRM_ID_ALREADY_EXISTS');
      if (userSnap.exists) {
        const existingUser = userSnap.data() || {};
        if (String(existingUser.email || '').toLowerCase().trim() !== trimmedEmail) {
          throw new Error('UID_ALREADY_LINKED_TO_DIFFERENT_EMAIL');
        }
        if (existingUser.firmId && existingUser.firmId !== firmId) {
          throw new Error('UID_ALREADY_LINKED_TO_ANOTHER_FIRM');
        }
        throw new Error('USER_PROFILE_ALREADY_EXISTS');
      }

      transaction.create(firmRef, firmData);
      transaction.create(userRef, userData);
    });

    const [savedFirm, savedUser] = await Promise.all([firmRef.get(), userRef.get()]);
    if (!savedFirm.exists || !savedUser.exists || savedFirm.data()?.ownerUid !== uid || savedUser.data()?.firmId !== firmId) {
      return sendError(res, 500, 'Firestore provisioning could not be verified. Do not provide login credentials yet.', 'PROVISIONING_VERIFICATION_FAILED', { ownerUid: uid, firmId });
    }

    return res.status(201).json({
      ok: true,
      firmId,
      ownerUid: uid,
      firmData,
      userData,
      message: `Firm "${trimmedFirmName}" created successfully for owner ${trimmedOwnerName} (${trimmedEmail}).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === 'FIRM_ID_ALREADY_EXISTS' || message === 'UID_ALREADY_LINKED_TO_DIFFERENT_EMAIL' ||
      message === 'UID_ALREADY_LINKED_TO_ANOTHER_FIRM' || message === 'USER_PROFILE_ALREADY_EXISTS' ? 409 : 500;
    console.error('[Vercel Firm Onboarding API]', message);
    return sendError(res, status, 'Firm provisioning failed. No success was reported; verify Firebase records before retrying.', 'FIRM_PROVISIONING_FAILED', { details: message });
  }
}
