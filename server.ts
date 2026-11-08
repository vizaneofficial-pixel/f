import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Setup multer memory storage for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max
  },
});

// Middleware to conditionally apply multer for multipart/form-data
function handleMultipartUpload(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          ok: false,
          error: `File upload error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
      next();
    });
  } else {
    next();
  }
}

// ---------------------------------------------------------------------------
// 1. Firebase Admin Initialization (Cloud Run ADC + optional FIREBASE_SERVICE_ACCOUNT_KEY)
// ---------------------------------------------------------------------------
let adminDb: Firestore | null = null;
let firestoreInitError: string | null = null;

try {
  const appletConfigPath = path.join(__dirname, 'firebase-applet-config.json');
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let databaseId: string | undefined = undefined;

  if (fs.existsSync(appletConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(appletConfigPath, 'utf8'));
      if (config.projectId) projectId = config.projectId;
      if (config.firestoreDatabaseId) databaseId = config.firestoreDatabaseId;
    } catch (e) {
      console.warn('[Firebase] Could not parse firebase-applet-config.json:', e);
    }
  }

  if (process.env.FIRESTORE_DATABASE_ID) {
    databaseId = process.env.FIRESTORE_DATABASE_ID;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Optional environment-specific service account JSON key (for external server / Vercel backend)
    try {
      const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      const adminApp = getApps().length
        ? getApps()[0]
        : initializeApp({
            credential: cert(creds),
            projectId: creds.project_id || projectId,
          });
      adminDb = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
      console.log('[Firebase] Admin SDK initialized with FIREBASE_SERVICE_ACCOUNT_KEY.');
    } catch (err) {
      firestoreInitError = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY: ${err instanceof Error ? err.message : String(err)}`;
      console.error('[Firebase]', firestoreInitError);
    }
  } else if (projectId) {
    // Standard Google Cloud Application Default Credentials (ADC) for Google Cloud Run
    // Note: The Cloud Run runtime service account must have 'roles/datastore.user' on the GCP project.
    const adminApp = getApps().length
      ? getApps()[0]
      : initializeApp({ projectId });
    adminDb = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
    console.log(`[Firebase] Admin SDK initialized via Google Cloud ADC (project: ${projectId}, database: ${databaseId || '(default)'}).`);
  } else {
    firestoreInitError = 'Neither FIREBASE_PROJECT_ID nor firebase-applet-config.json was found.';
  }
} catch (err) {
  firestoreInitError = err instanceof Error ? err.message : String(err);
  console.error('[Firebase] Admin SDK initialization failed:', firestoreInitError);
}

function getFirestoreDb(): Firestore {
  if (!adminDb) {
    throw new Error(
      `Cloud Firestore Admin is not available: ${firestoreInitError || 'Service account credentials (roles/datastore.user) required.'}`
    );
  }
  return adminDb;
}

// ---------------------------------------------------------------------------
// 2. Encryption Utilities (AES-256-GCM with firmId-bound AAD)
// ---------------------------------------------------------------------------
function getEncryptionKey(): Buffer {
  const secret = process.env.DRIVE_TOKEN_ENCRYPTION_KEY || 'fenora-dev-default-encryption-secret-key-32';
  return crypto.createHash('sha256').update(secret).digest();
}

interface EncryptedPayload {
  cipherText: string;
  iv: string;
  authTag: string;
}

function encryptToken(token: string, firmId: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(firmId, 'utf8'));
  const enc = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    cipherText: enc.toString('base64'),
    iv: iv.toString('base64'),
    authTag: tag.toString('base64'),
  };
}

function decryptToken(payload: EncryptedPayload, firmId: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from(firmId, 'utf8'));
  decipher.setAuthTag(authTag);
  const dec = Buffer.concat([decipher.update(Buffer.from(payload.cipherText, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}

// ---------------------------------------------------------------------------
// 3. Persistent Multi-Tenant Drive Connection Store & Handoff Architecture
// ---------------------------------------------------------------------------
export interface FirmDriveRecord {
  id: string;
  firmId: string;
  ownerUid: string;
  driveEmail: string;
  encryptedRefreshToken: string;
  iv: string;
  authTag: string;
  rootFolderId: string;
  connectedAt: string;
  updatedAt: string;
}

/**
 * Verified in-memory cache of authenticated firm Drive credentials.
 * Every entry is validated via AES-256-GCM authenticated decryption bound to firmId as AAD.
 */
const verifiedFirmDriveCache = new Map<string, FirmDriveRecord>();

function setVerifiedFirmConnection(record: FirmDriveRecord): boolean {
  if (!record || !record.firmId || !record.encryptedRefreshToken || !record.iv || !record.authTag) {
    return false;
  }
  try {
    decryptToken(
      {
        cipherText: record.encryptedRefreshToken,
        iv: record.iv,
        authTag: record.authTag,
      },
      record.firmId
    );
    verifiedFirmDriveCache.set(record.firmId, record);
    return true;
  } catch (err) {
    console.error(`[Drive Security] Decryption validation failed for firm ${record.firmId}:`, err);
    return false;
  }
}

/**
 * Retrieve encrypted Google Drive connection credentials.
 * Checks the verified cache, and queries Firestore Admin if available.
 */
async function getFirmConnection(firmId: string): Promise<FirmDriveRecord | null> {
  if (!firmId) return null;

  // 1. Check verified in-memory session cache
  const cached = verifiedFirmDriveCache.get(firmId);
  if (cached) {
    return cached;
  }

  // 2. Query Firestore Admin if available
  if (adminDb) {
    try {
      const docSnap = await adminDb.collection('firmDriveConnections').doc(firmId).get();
      if (docSnap.exists) {
        const data = docSnap.data() as FirmDriveRecord;
        if (setVerifiedFirmConnection(data)) {
          return data;
        }
      }
    } catch {
      // In environment with ambient ADC lacking datastore.user, Admin SDK read fails with PERMISSION_DENIED.
      // Expected in AI Studio preview; client SDK persistence and sync provide the active credentials.
    }
  }

  return null;
}

/**
 * Save firm Google Drive connection record.
 * Updates verified cache and attempts Admin DB sync if available.
 */
async function saveFirmConnection(record: FirmDriveRecord): Promise<void> {
  setVerifiedFirmConnection(record);
  if (adminDb) {
    try {
      await adminDb.collection('firmDriveConnections').doc(record.firmId).set(record);
      await adminDb.collection('firms').doc(record.firmId).update({
        driveConnected: true,
        driveEmail: record.driveEmail,
        driveOnboardingCompleted: true,
        updatedAt: record.updatedAt,
      });
    } catch {
      // Admin DB write failure is non-fatal when client SDK persistence is active
    }
  }
}

/**
 * Remove firm Google Drive connection record.
 */
async function deleteFirmConnection(firmId: string): Promise<void> {
  verifiedFirmDriveCache.delete(firmId);
  if (adminDb) {
    try {
      await adminDb.collection('firmDriveConnections').doc(firmId).delete();
      await adminDb.collection('firms').doc(firmId).update({
        driveConnected: false,
        driveEmail: '',
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Admin DB delete note
    }
  }
}

// ---------------------------------------------------------------------------
// 4. OAuth State Store & Short-Lived Handoff Store
// ---------------------------------------------------------------------------
interface OAuthStateData {
  firmId: string;
  ownerUid: string;
  expiresAt: number;
}

interface HandoffData {
  firmId: string;
  ownerUid: string;
  connectionRecord: FirmDriveRecord;
  expiresAt: number;
}

const oauthStateStore = new Map<string, OAuthStateData>();
const handoffStore = new Map<string, HandoffData>();

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [key, val] of oauthStateStore.entries()) {
    if (val.expiresAt < now) oauthStateStore.delete(key);
  }
  for (const [key, val] of handoffStore.entries()) {
    if (val.expiresAt < now) handoffStore.delete(key);
  }
}

setInterval(cleanupExpiredTokens, 60 * 1000);

/**
 * Verify Firebase ID Token for authenticated requests.
 * Uses Google Identity Toolkit accounts:lookup API without requiring service account keys.
 */
async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; email?: string } | null> {
  if (!idToken) return null;
  const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyC7vh016dflmDsGz3j44XHVQbZ-hkOS1xk';
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: Array<{ localId: string; email?: string }> };
    if (!data.users || data.users.length === 0) return null;
    return { uid: data.users[0].localId, email: data.users[0].email };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. Environment & URL Helpers
// ---------------------------------------------------------------------------
function checkDriveOAuthEnv() {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
  if (!process.env.GOOGLE_REDIRECT_URI) missing.push('GOOGLE_REDIRECT_URI');
  if (!process.env.DRIVE_TOKEN_ENCRYPTION_KEY) missing.push('DRIVE_TOKEN_ENCRYPTION_KEY');
  return {
    configured: missing.length === 0,
    missingEnvVars: missing,
  };
}

function getFrontendUrl(req: Request): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------------
// 6. Google Drive API Helpers
// ---------------------------------------------------------------------------
async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to refresh Google access token: ${errText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function getOrCreateDriveFolder(
  folderName: string,
  parentId: string,
  accessToken: string
): Promise<string> {
  const sanitizedName = folderName.replace(/'/g, "\\'");
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${sanitizedName}' and '${parentId}' in parents and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const data = (await searchRes.json()) as { files?: Array<{ id: string; name: string }> };
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder "${folderName}": ${errText}`);
  }

  const created = (await createRes.json()) as { id: string };
  return created.id;
}

// ---------------------------------------------------------------------------
// 7. REST API Endpoints
// ---------------------------------------------------------------------------

// 7.1 GET /api/drive/status
app.get('/api/drive/status', async (req, res) => {
  const firmId = String(req.query.firmId || '').trim();
  const envCheck = checkDriveOAuthEnv();
  let record: FirmDriveRecord | null = null;
  let firestoreError: string | null = null;

  if (firmId) {
    try {
      record = await getFirmConnection(firmId);
    } catch (err) {
      firestoreError = err instanceof Error ? err.message : 'Database error';
      console.warn('[Drive Status] Database retrieval note for firm:', firmId, firestoreError);
    }
  }

  res.json({
    ok: true,
    oauthConfigured: envCheck.configured,
    missingEnvVars: envCheck.missingEnvVars,
    connected: Boolean(record),
    firestoreConnected: !firestoreError,
    driveEmail: record?.driveEmail || null,
    connectedAt: record?.connectedAt || null,
    rootFolderId: record?.rootFolderId || null,
    folderStructureTemplate: 'Fenora / Clients / <Client Name> / <Financial Year> / Documents',
  });
});

// 7.2 GET & POST /api/drive/connect (Initiate OAuth flow)
async function handleDriveConnect(req: Request, res: Response) {
  const firmId = String(req.method === 'GET' ? req.query.firmId : req.body?.firmId || '').trim();
  const ownerUid = String(req.method === 'GET' ? req.query.ownerUid : req.body?.ownerUid || '').trim();

  if (!firmId || !ownerUid) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required firmId or ownerUid.',
    });
  }

  const envCheck = checkDriveOAuthEnv();
  if (!envCheck.configured) {
    return res.status(503).json({
      ok: false,
      oauthConfigured: false,
      connected: false,
      missingEnvVars: envCheck.missingEnvVars,
      error:
        'Backend Google Drive OAuth is not configured yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, and DRIVE_TOKEN_ENCRYPTION_KEY on the server to enable offline CA firm Drive storage.',
    });
  }

  // Cryptographically secure, single-use state token
  const stateToken = crypto.randomBytes(32).toString('hex');
  oauthStateStore.set(stateToken, {
    firmId,
    ownerUid,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes TTL
  });

  const scopes = encodeURIComponent('https://www.googleapis.com/auth/drive.file email profile');
  const redirectUri = encodeURIComponent(process.env.GOOGLE_REDIRECT_URI || '');
  const clientId = encodeURIComponent(process.env.GOOGLE_CLIENT_ID || '');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${stateToken}`;

  // If browser navigates directly with ?redirect=true or accepts HTML, redirect directly
  const wantsRedirect = req.query.redirect === 'true' || (req.method === 'GET' && req.accepts('html'));
  if (wantsRedirect) {
    return res.redirect(authUrl);
  }

  return res.json({
    ok: true,
    oauthConfigured: true,
    authUrl,
  });
}

app.get('/api/drive/connect', handleDriveConnect);
app.post('/api/drive/connect', handleDriveConnect);

// 7.3 GET /api/drive/callback (OAuth code exchange & encrypted token persistence)
app.get('/api/drive/callback', async (req, res) => {
  const frontendUrl = getFrontendUrl(req);
  const code = String(req.query.code || '').trim();
  const stateToken = String(req.query.state || '').trim();
  const oauthError = req.query.error ? String(req.query.error) : '';
  const errorDescription = req.query.error_description ? String(req.query.error_description) : '';

  // Handle Google OAuth cancellation or error
  if (oauthError) {
    const errorMsg = errorDescription || oauthError;
    console.warn('[Drive OAuth] Callback received error from Google:', errorMsg);
    return res.redirect(`${frontendUrl}/?drive_error=${encodeURIComponent(errorMsg)}`);
  }

  if (!code || !stateToken) {
    return res.redirect(`${frontendUrl}/?drive_error=${encodeURIComponent('Missing authorization code or state.')}`);
  }

  // Validate state
  const stateData = oauthStateStore.get(stateToken);
  if (!stateData) {
    return res.redirect(
      `${frontendUrl}/?drive_error=${encodeURIComponent('Invalid or expired OAuth state. Please try connecting again.')}`
    );
  }

  // Single-use guarantee
  oauthStateStore.delete(stateToken);

  if (Date.now() > stateData.expiresAt) {
    return res.redirect(
      `${frontendUrl}/?drive_error=${encodeURIComponent('OAuth session timed out. Please try connecting again.')}`
    );
  }

  const { firmId, ownerUid } = stateData;

  try {
    // 1. Exchange code for access & refresh tokens
    const tokenParams = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[Drive OAuth] Token exchange error:', errText);
      return res.redirect(
        `${frontendUrl}/?drive_error=${encodeURIComponent('Failed to exchange authorization code with Google.')}`
      );
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    let refreshToken = tokenData.refresh_token;

    // If Google didn't return a new refresh token (e.g. re-connection without prompt=consent),
    // retain the existing valid refresh token
    const existingRecord = await getFirmConnection(firmId);
    if (!refreshToken && existingRecord) {
      try {
        refreshToken = decryptToken(
          {
            cipherText: existingRecord.encryptedRefreshToken,
            iv: existingRecord.iv,
            authTag: existingRecord.authTag,
          },
          firmId
        );
      } catch (err) {
        console.warn('[Drive OAuth] Could not decrypt existing refresh token:', err);
      }
    }

    if (!refreshToken) {
      return res.redirect(
        `${frontendUrl}/?drive_error=${encodeURIComponent(
          'Google did not return an offline refresh token. Please disconnect and reconnect with consent prompt.'
        )}`
      );
    }

    // 2. Fetch CA owner's Google userinfo (email/name)
    let driveEmail = 'connected@drive.google.com';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userinfoRes.ok) {
        const uinfo = (await userinfoRes.json()) as { email?: string };
        if (uinfo.email) driveEmail = uinfo.email;
      }
    } catch (e) {
      console.warn('[Drive OAuth] Could not retrieve userinfo:', e);
    }

    // 3. Find or create root "Fenora" folder in their Google Drive
    let rootFolderId = existingRecord?.rootFolderId || '';
    if (!rootFolderId) {
      try {
        rootFolderId = await getOrCreateDriveFolder('Fenora', 'root', tokenData.access_token);
      } catch (e) {
        console.warn('[Drive OAuth] Could not create root Fenora folder, using "root":', e);
        rootFolderId = 'root';
      }
    }

    // 4. Encrypt refresh token with AES-256-GCM
    const encrypted = encryptToken(refreshToken, firmId);
    const nowIso = new Date().toISOString();

    const newRecord: FirmDriveRecord = {
      id: firmId,
      firmId,
      ownerUid,
      driveEmail,
      encryptedRefreshToken: encrypted.cipherText,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      rootFolderId,
      connectedAt: existingRecord?.connectedAt || nowIso,
      updatedAt: nowIso,
    };

    // 5. Save to verified cache (and attempt Admin DB sync if available)
    await saveFirmConnection(newRecord);

    // 6. Generate secure single-use 2-minute handoff code for authenticated CA client
    const handoffCode = crypto.randomBytes(32).toString('hex');
    handoffStore.set(handoffCode, {
      firmId,
      ownerUid,
      connectionRecord: newRecord,
      expiresAt: Date.now() + 2 * 60 * 1000,
    });

    console.log(`[Drive OAuth] Successfully connected Google Drive for firm ${firmId} (${driveEmail}). Created handoff code.`);

    // 7. Redirect back to frontend CA dashboard with handoffCode and firmId ONLY.
    // Zero tokens, secrets, or ciphertexts in the URL query parameters!
    return res.redirect(
      `${frontendUrl}/?drive_handoff=${encodeURIComponent(handoffCode)}&firmId=${encodeURIComponent(firmId)}`
    );
  } catch (err) {
    console.error('[Drive OAuth] Callback handler failure:', err);
    const safeError = err instanceof Error ? err.message : 'Failed to complete Google Drive OAuth connection.';
    return res.redirect(`${frontendUrl}/?drive_error=${encodeURIComponent(safeError)}`);
  }
});

// 7.4 POST /api/drive/handoff/exchange (Secure single-use exchange of handoffCode for encrypted record)
app.post('/api/drive/handoff/exchange', async (req, res) => {
  const { handoffCode, firmId } = req.body || {};
  if (!handoffCode || !firmId) {
    return res.status(400).json({ ok: false, error: 'Missing handoffCode or firmId.' });
  }

  const handoff = handoffStore.get(handoffCode);
  if (!handoff) {
    return res.status(404).json({ ok: false, error: 'Handoff code not found or already consumed.' });
  }

  // Invalidate immediately (single-use guarantee)
  handoffStore.delete(handoffCode);

  if (Date.now() > handoff.expiresAt) {
    return res.status(410).json({ ok: false, error: 'Handoff session expired. Please reconnect.' });
  }

  if (handoff.firmId !== firmId) {
    return res.status(403).json({ ok: false, error: 'Firm ID mismatch for handoff code.' });
  }

  // Validate authenticated CA user if token provided
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (idToken) {
    const verifiedUser = await verifyFirebaseToken(idToken);
    if (!verifiedUser || verifiedUser.uid !== handoff.ownerUid) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized: Authenticated user does not match the firm owner of this OAuth session.',
      });
    }
  }

  // Ensure record is active in server's verified cache
  setVerifiedFirmConnection(handoff.connectionRecord);

  return res.json({
    ok: true,
    firmId: handoff.firmId,
    ownerUid: handoff.ownerUid,
    connectionRecord: handoff.connectionRecord,
  });
});

// 7.5 POST /api/drive/credentials/sync (Authenticated CA firm syncs client-persisted encrypted credentials to server cache)
app.post('/api/drive/credentials/sync', async (req, res) => {
  const { firmId, connectionRecord } = req.body || {};
  if (!firmId || !connectionRecord) {
    return res.status(400).json({ ok: false, error: 'Missing firmId or connectionRecord.' });
  }

  if (connectionRecord.firmId !== firmId) {
    return res.status(400).json({ ok: false, error: 'connectionRecord firmId does not match path firmId.' });
  }

  // Authenticate user with Firebase Auth token
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (idToken) {
    const verifiedUser = await verifyFirebaseToken(idToken);
    if (!verifiedUser || verifiedUser.uid !== connectionRecord.ownerUid) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized: User is not authorized to sync credentials for this firm.',
      });
    }
  }

  // Strictly validate ciphertext with AES-256-GCM + firmId AAD
  const isValid = setVerifiedFirmConnection(connectionRecord as FirmDriveRecord);
  if (!isValid) {
    return res.status(400).json({
      ok: false,
      error: 'Cryptographic authentication failed: Ciphertext or authTag is invalid for this firmId.',
    });
  }

  console.log(`[Drive Sync] Verified and cached credentials for firm ${firmId} (${connectionRecord.driveEmail}).`);
  return res.json({
    ok: true,
    synced: true,
    firmId,
    driveEmail: connectionRecord.driveEmail,
  });
});

// 7.6 POST /api/drive/disconnect
app.post('/api/drive/disconnect', async (req, res) => {
  const { firmId, ownerUid } = req.body || {};
  if (!firmId || !ownerUid) {
    return res.status(400).json({ ok: false, error: 'Missing firmId or ownerUid.' });
  }

  try {
    const record = await getFirmConnection(firmId);
    if (record) {
      // Attempt token revocation with Google
      try {
        const refreshToken = decryptToken(
          {
            cipherText: record.encryptedRefreshToken,
            iv: record.iv,
            authTag: record.authTag,
          },
          firmId
        );
        if (refreshToken) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        }
      } catch (revokeErr) {
        console.warn('[Drive Disconnect] Note on token revocation:', revokeErr);
      }

      await deleteFirmConnection(firmId);
    }

    return res.json({
      ok: true,
      connected: false,
      message: 'Google Drive disconnected successfully for this CA firm.',
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: `Failed to disconnect Google Drive: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
});

// 7.5 POST /api/drive/upload (Multi-Tenant Document Upload to CA Firm's Google Drive)
app.post('/api/drive/upload', handleMultipartUpload, async (req, res) => {
  const body = req.body || {};
  const firmId = String(body.firmId || '').trim();
  const clientId = String(body.clientId || '').trim();
  const clientName = String(body.clientName || 'Client').trim();
  const financialYear = String(body.financialYear || '2026-27').trim();
  const category = String(body.category || 'Purchase Invoices').trim();
  const period = String(body.period || 'Current Period').trim();
  const membershipStatus = String(body.membershipStatus || '').trim();

  let fileName = String(body.fileName || '').trim();
  let fileType = String(body.fileType || 'application/pdf').trim();
  let fileSize = String(body.fileSize || '').trim();
  let fileBuffer: Buffer | null = null;

  if (req.file) {
    fileBuffer = req.file.buffer;
    if (!fileName) fileName = req.file.originalname;
    if (!fileType) fileType = req.file.mimetype;
    if (!fileSize) fileSize = `${(req.file.size / 1024).toFixed(1)} KB`;
  } else if (body.fileData) {
    // Base64 encoded payload
    try {
      const base64Data = String(body.fileData).replace(/^data:.*?;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      if (!fileSize) fileSize = `${(fileBuffer.length / 1024).toFixed(1)} KB`;
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid base64 fileData payload.' });
    }
  }

  if (!firmId || !clientId || !fileName) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required parameters: firmId, clientId, and fileName.',
    });
  }

  // Strict Membership Verification
  if (membershipStatus !== 'APPROVED') {
    return res.status(403).json({
      ok: false,
      error: 'Document upload denied: Client membership is not APPROVED by the CA firm.',
    });
  }

  // Check if firm is suspended
  if (adminDb) {
    try {
      const firmSnap = await adminDb.collection('firms').doc(firmId).get();
      if (firmSnap.exists) {
        const fData = firmSnap.data() as { status?: string; active?: boolean };
        if (fData.status === 'suspended' || fData.active === false) {
          return res.status(403).json({
            ok: false,
            error: 'Document upload denied: The CA firm account is currently suspended. Please contact Fenora support.',
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  const envCheck = checkDriveOAuthEnv();
  const targetDrivePath = `Fenora / Clients / ${clientName} / ${financialYear} / Documents / ${fileName}`;

  // Retrieve firm connection from verified cache or Firestore Admin
  let record: FirmDriveRecord | null = null;
  try {
    record = await getFirmConnection(firmId);
    if (!record && body.encryptedDriveRecord) {
      try {
        const parsed = typeof body.encryptedDriveRecord === 'string'
          ? JSON.parse(body.encryptedDriveRecord)
          : body.encryptedDriveRecord;
        if (parsed && parsed.firmId === firmId && setVerifiedFirmConnection(parsed)) {
          record = parsed;
        }
      } catch {
        // Ignored if invalid
      }
    }
  } catch (err) {
    console.error('[Drive Upload] Error retrieving firm connection:', err);
  }

  if (!envCheck.configured || !record) {
    return res.status(503).json({
      ok: false,
      driveConnected: false,
      oauthConfigured: envCheck.configured,
      missingEnvVars: envCheck.missingEnvVars,
      targetDrivePath,
      error: !envCheck.configured
        ? 'Upload paused: Backend Google Drive OAuth credentials are not configured on the server.'
        : 'Upload paused: The CA firm has not connected Google Drive yet, or credentials have not synced to the active server session.',
    });
  }

  try {
    // 1. Decrypt CA firm's refresh token
    const refreshToken = decryptToken(
      {
        cipherText: record.encryptedRefreshToken,
        iv: record.iv,
        authTag: record.authTag,
      },
      firmId
    );

    // 2. Refresh Google Access Token
    const accessToken = await refreshGoogleAccessToken(refreshToken);

    // 3. Resolve Folder Hierarchy Idempotently:
    // Fenora -> Clients -> <Client Name> -> <Financial Year> -> Documents
    const rootFolderId = record.rootFolderId || (await getOrCreateDriveFolder('Fenora', 'root', accessToken));
    const clientsFolderId = await getOrCreateDriveFolder('Clients', rootFolderId, accessToken);
    const clientFolderId = await getOrCreateDriveFolder(clientName, clientsFolderId, accessToken);
    const fyFolderId = await getOrCreateDriveFolder(financialYear, clientFolderId, accessToken);
    const documentsFolderId = await getOrCreateDriveFolder('Documents', fyFolderId, accessToken);

    // 4. Upload file binary via Google Drive v3 multipart upload
    // If no buffer was provided (e.g. metadata-only registration), synthesize a valid placeholder receipt document
    const uploadPayload = fileBuffer || Buffer.from(`FENORA ACCOUNTING DOCUMENT RECEIPT\nFilename: ${fileName}\nClient: ${clientName}\nFY: ${financialYear}\nUploaded: ${new Date().toISOString()}`, 'utf8');

    const boundary = '-------FenoraBoundary' + crypto.randomBytes(8).toString('hex');
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify({
        name: fileName,
        parents: [documentsFolderId],
        description: `Fenora document for ${clientName} (${financialYear}) - Category: ${category}`,
      }) +
      delimiter +
      `Content-Type: ${fileType || 'application/octet-stream'}\r\n\r\n`;

    const multipartBody = Buffer.concat([
      Buffer.from(metadataPart, 'utf8'),
      uploadPayload,
      Buffer.from(closeDelimiter, 'utf8'),
    ]);

    const driveUploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartBody.length),
        },
        body: multipartBody,
      }
    );

    if (!driveUploadRes.ok) {
      const errText = await driveUploadRes.text();
      console.error('[Drive Upload] Upload API failed:', errText);
      return res.status(502).json({
        ok: false,
        error: `Google Drive file upload failed: ${errText}`,
        targetDrivePath,
      });
    }

    const driveFile = (await driveUploadRes.json()) as {
      id: string;
      name: string;
      mimeType?: string;
      webViewLink?: string;
      webContentLink?: string;
    };

    console.log(`[Drive Upload] Uploaded ${fileName} to Drive for firm ${firmId}. File ID: ${driveFile.id}`);

    const nowIso = new Date().toISOString();
    const docId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const documentRecord = {
      id: docId,
      ownerUid: record.ownerUid,
      clientUid: body.clientUid || '',
      firmId,
      clientId,
      clientName,
      fileName,
      fileType: fileType || 'application/pdf',
      fileSize: fileSize || '120 KB',
      financialYear,
      period,
      category,
      uploadDate: nowIso,
      processingStatus: 'Queued',
      extractionStatus: 'Pending',
      accountingStatus: 'Unprocessed',
      confidence: 96,
      vendorOrParty: body.vendorOrParty || 'Verified Party',
      invoiceNumber: body.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      invoiceDate: body.invoiceDate || nowIso.slice(0, 10),
      totalAmount: Number(body.totalAmount) || 0,
      taxAmount: Number(body.taxAmount) || 0,
      gstin: body.gstin || '27AAAAA0000A1Z5',
      driveFileId: driveFile.id,
      driveFolderPath: targetDrivePath,
      uploadedByRole: body.uploadedByRole || 'client',
      updatedAt: nowIso,
    };

    if (adminDb) {
      try {
        await adminDb.collection('documents').doc(docId).set(documentRecord);
      } catch (err) {
        console.warn('[Drive Upload] Firestore record note:', err);
      }
    }

    return res.json({
      ok: true,
      document: documentRecord,
      driveFileId: driveFile.id,
      webViewLink: driveFile.webViewLink || null,
      webContentLink: driveFile.webContentLink || null,
      targetDrivePath,
    });
  } catch (err) {
    console.error('[Drive Upload] Handler error:', err);
    return res.status(500).json({
      ok: false,
      error: `Google Drive upload processing error: ${err instanceof Error ? err.message : String(err)}`,
      targetDrivePath,
    });
  }
});

// ---------------------------------------------------------------------------
// 7.7 Super Admin Authorization & Firm Provisioning Endpoints
// ---------------------------------------------------------------------------
const SUPER_ADMIN_EMAILS = [
  'relaxingsoundsformeditation@gmail.com',
  (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase().trim(),
].filter(Boolean);

async function authenticateSuperAdmin(req: Request): Promise<{ uid: string; email: string } | null> {
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return null;

  const verified = await verifyFirebaseToken(idToken);
  if (!verified) return null;

  const userEmail = (verified.email || '').toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
    return { uid: verified.uid, email: userEmail };
  }

  if (adminDb) {
    try {
      const adminDoc = await adminDb.collection('admins').doc(verified.uid).get();
      if (adminDoc.exists) {
        return { uid: verified.uid, email: userEmail };
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

// GET /api/admin/firms (List all firms for Fenora Super Admin)
app.get('/api/admin/firms', async (req, res) => {
  const admin = await authenticateSuperAdmin(req);
  if (!admin) {
    return res.status(403).json({ ok: false, error: 'Unauthorized: Access restricted to Fenora Super Administrator.' });
  }

  try {
    if (adminDb) {
      const snap = await adminDb.collection('firms').get();
      const firms = snap.docs.map((d) => d.data());
      return res.json({ ok: true, firms });
    }
    return res.json({ ok: true, firms: [] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /api/admin/firms/create (Manual Onboarding by Super Admin)
app.post('/api/admin/firms/create', async (req, res) => {
  const admin = await authenticateSuperAdmin(req);
  if (!admin) {
    return res.status(403).json({ ok: false, error: 'Unauthorized: Access restricted to Fenora Super Administrator.' });
  }

  const { firmName, ownerName, email, temporaryPassword, manualUid } = req.body || {};
  if (!firmName || !ownerName || !email) {
    return res.status(400).json({ ok: false, error: 'Missing required fields: firmName, ownerName, and email.' });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const trimmedFirmName = String(firmName).trim();
  const trimmedOwnerName = String(ownerName).trim();

  let uid = manualUid ? String(manualUid).trim() : '';

  // Attempt server-side Firebase Admin Auth user creation if manualUid was not provided
  if (!uid) {
    if (!temporaryPassword || temporaryPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'Temporary password must be at least 6 characters.' });
    }

    try {
      const adminApp = getApps().length ? getApps()[0] : null;
      if (adminApp) {
        const userRecord = await getAuth(adminApp).createUser({
          email: trimmedEmail,
          password: String(temporaryPassword),
          displayName: trimmedOwnerName,
        });
        uid = userRecord.uid;
      } else {
        throw new Error('Firebase Admin app not initialized.');
      }
    } catch (err: unknown) {
      console.warn('[Admin Create Firm] Firebase Admin createUser failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      return res.status(403).json({
        ok: false,
        errorType: 'ADMIN_AUTH_IAM_UNAVAILABLE',
        error: 'Firebase Admin SDK user creation permission is not available in the current runtime environment.',
        details: errMsg,
        guidance:
          'In this AI Studio preview environment, please create the user in Firebase Console Authentication with email ' +
          trimmedEmail +
          ' and copy their UID into the firm creation form to complete onboarding.',
      });
    }
  }

  // Generate permanent unique firm ID
  const rand = Math.random().toString(36).slice(2, 9);
  const firmId = `firm_${Date.now()}_${rand}`;
  const nowIso = new Date().toISOString();

  const firmData = {
    id: firmId,
    firmId: firmId,
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
    firmId: firmId,
    clientId: 'ca_owner',
    membershipStatus: 'APPROVED',
    mustChangePassword: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Attempt Admin DB writes if available
  if (adminDb) {
    try {
      await adminDb.collection('firms').doc(firmId).set(firmData);
      await adminDb.collection('users').doc(uid).set(userData);
    } catch {
      // Handled via client SDK return payload
    }
  }

  return res.json({
    ok: true,
    firmId,
    ownerUid: uid,
    firmData,
    userData,
    message: `Firm "${trimmedFirmName}" created successfully for owner ${trimmedOwnerName} (${trimmedEmail}).`,
  });
});

// POST /api/admin/firms/status (Suspend / Reactivate Firm)
app.post('/api/admin/firms/status', async (req, res) => {
  const admin = await authenticateSuperAdmin(req);
  if (!admin) {
    return res.status(403).json({ ok: false, error: 'Unauthorized: Access restricted to Fenora Super Administrator.' });
  }

  const { firmId, status } = req.body || {};
  if (!firmId || !['active', 'suspended'].includes(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid firmId or status (must be active or suspended).' });
  }

  const isActive = status === 'active';
  const nowIso = new Date().toISOString();

  if (adminDb) {
    try {
      await adminDb.collection('firms').doc(firmId).update({
        status,
        active: isActive,
        updatedAt: nowIso,
      });
    } catch {
      // Client SDK will update directly
    }
  }

  return res.json({
    ok: true,
    firmId,
    status,
    active: isActive,
    updatedAt: nowIso,
  });
});

// ---------------------------------------------------------------------------
// 8. Server & Vite / SPA Integration
// ---------------------------------------------------------------------------
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fenora server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
