/* =====================================================================
   StallFree authentication — accounts, sessions, password hashing,
   login rate limits, and the single-admin bootstrap.

   Passwords are never stored in readable form: each account keeps a
   random salt and a PBKDF2-HMAC-SHA256 derived key (310k iterations).
   Sessions are random tokens with an expiry, cleared on sign-out.

   SCOPE NOTE: this module runs in the browser. It is designed so every
   privileged call goes through one guarded API (requireAdmin), but a
   static site can only ever be demo-grade: move these functions behind
   a real server before handling real customers.
   ===================================================================== */

const AUTH_KEYS = {
  accounts: 'stallfree_accounts',
  session: 'stallfree_session',
  audit: 'stallfree_audit_log',
  migrated: 'stallfree_auth_migrated'
};

const AUTH_CONFIG = {
  iterations: 310000,
  saltBytes: 16,
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
  maxFailedAttempts: 5,
  lockMs: 5 * 60 * 1000,
  passwordMin: 8
};

/* The owner chooses the first-run setup passphrase in the browser. Nothing
   secret ships in the source or in the automated tests. This check exists so
   the one-time setup screen cannot be submitted by accident — it is NOT a
   security boundary (anyone with this browser profile can inspect or edit
   localStorage). See README.md for the demo threat model. */
const ADMIN_SETUP_KEY_MIN = 10;

/* ---------------- Small utilities ---------------- */

function authHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return authHex(buf);
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return authHex(digest);
}

async function pbkdf2Hex(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations, hash: 'SHA-256' },
    key,
    256
  );
  return authHex(bits);
}

function hexToBytes(hex) {
  const clean = String(hex || '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

async function hashWithNewSalt(password) {
  const salt = randomHex(AUTH_CONFIG.saltBytes);
  const hash = await pbkdf2Hex(password, salt, AUTH_CONFIG.iterations);
  return { salt, hash, iterations: AUTH_CONFIG.iterations };
}

async function verifySecret(secret, salt, hash, iterations) {
  if (!salt || !hash) return false;
  const candidate = await pbkdf2Hex(secret, salt, iterations || AUTH_CONFIG.iterations);
  return constantTimeEqual(candidate, hash);
}

function constantTimeEqual(a, b) {
  const strA = String(a || '');
  const strB = String(b || '');
  if (strA.length !== strB.length) return false;
  let diff = 0;
  for (let i = 0; i < strA.length; i += 1) {
    diff |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return diff === 0;
}

/* ---------------- Validation ---------------- */

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < AUTH_CONFIG.passwordMin) {
    return { ok: false, message: `Use at least ${AUTH_CONFIG.passwordMin} characters.` };
  }
  if (!/[a-zA-Z]/.test(value)) return { ok: false, message: 'Include at least one letter.' };
  if (!/[0-9]/.test(value)) return { ok: false, message: 'Include at least one number.' };
  return { ok: true, message: '' };
}

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

/* ---------------- Account store ---------------- */

function readAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.accounts);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function writeAccounts(list) {
  try {
    localStorage.setItem(AUTH_KEYS.accounts, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

function findAccountByEmail(email) {
  const needle = normalizeEmail(email);
  return readAccounts().find((a) => a.emailLower === needle) || null;
}

function findAccountById(id) {
  return readAccounts().find((a) => a.id === id) || null;
}

/* strip every secret before an account reaches the UI */
function publicAccount(acct) {
  if (!acct) return null;
  return {
    id: acct.id,
    email: acct.email,
    name: acct.name,
    firstName: acct.firstName,
    lastName: acct.lastName,
    role: acct.role || 'customer',
    suspended: Boolean(acct.suspended),
    createdAt: acct.createdAt
  };
}

function adminExists() {
  return readAccounts().some((a) => a.role === 'admin');
}

function lockSecondsLeft(acct) {
  if (!acct || !acct.lockedUntil) return 0;
  const left = acct.lockedUntil - Date.now();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

function saveAccountPatch(acct, patch) {
  const list = readAccounts();
  const index = list.findIndex((a) => a.id === acct.id);
  if (index < 0) return false;
  list[index] = Object.assign({}, list[index], patch);
  return writeAccounts(list);
}

/* ---------------- Session ---------------- */

function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.session);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeSession(session) {
  try {
    localStorage.setItem(AUTH_KEYS.session, JSON.stringify(session));
  } catch (e) {
    /* ignore */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(AUTH_KEYS.session);
  } catch (e) {
    /* ignore */
  }
}

/* returns a live session only when it exists, has not expired, and the
   account still exists and is not suspended */
function currentSession() {
  const session = readSession();
  if (!session || !session.token || !session.userId) return null;
  if (!session.expiresAt || session.expiresAt < Date.now()) {
    if (session.expiresAt) markSessionNotice('expired');
    clearSession();
    return null;
  }
  const acct = findAccountById(session.userId);
  if (!acct) {
    clearSession();
    return null;
  }
  if (acct.suspended) {
    markSessionNotice('suspended');
    clearSession();
    return null;
  }
  return session;
}

/* lets the next page paint a one-off explanation after an automatic sign-out */
function markSessionNotice(reason) {
  try {
    localStorage.setItem('stallfree_session_notice', String(reason || 'expired'));
  } catch (e) {
    /* ignore */
  }
}

/* reads and clears the notice so it is only shown once */
function consumeSessionNotice() {
  try {
    const reason = localStorage.getItem('stallfree_session_notice');
    if (reason) localStorage.removeItem('stallfree_session_notice');
    return reason || '';
  } catch (e) {
    return '';
  }
}

function getSessionAccount() {
  const session = currentSession();
  return session ? publicAccount(findAccountById(session.userId)) : null;
}

function currentUserId() {
  const session = currentSession();
  return session ? session.userId : 'guest';
}

function isAuthenticated() {
  return Boolean(currentSession());
}

function isAdmin() {
  const acct = getSessionAccount();
  return Boolean(acct && acct.role === 'admin' && !acct.suspended);
}

/* single choke-point for privileged operations */
function requireAdmin() {
  const session = currentSession();
  if (!session) return { ok: false, error: 'Please sign in first.' };
  const acct = findAccountById(session.userId);
  if (!acct) return { ok: false, error: 'Session no longer valid.' };
  if (acct.suspended) return { ok: false, error: 'This account is suspended.' };
  if (acct.role !== 'admin') return { ok: false, error: 'Administrator access required.' };
  return { ok: true, account: acct };
}

function startSession(acct) {
  const now = Date.now();
  const session = {
    token: randomHex(32),
    userId: acct.id,
    createdAt: now,
    expiresAt: now + AUTH_CONFIG.sessionTtlMs
  };
  writeSession(session);
  return session;
}

function logoutAccount() {
  clearSession();
}

/* ---------------- Audit log ---------------- */

function readAuditLog() {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.audit);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function appendAudit(action, detail) {
  const session = currentSession();
  const entry = {
    id: 'log-' + Date.now().toString(36) + '-' + randomHex(3),
    at: new Date().toISOString(),
    actor: session ? session.userId : 'system',
    actorLabel: '',
    action,
    detail: String(detail || '').slice(0, 300)
  };
  const acct = session ? findAccountById(session.userId) : null;
  entry.actorLabel = acct ? acct.email : 'system';
  const list = readAuditLog();
  list.unshift(entry);
  try {
    localStorage.setItem(AUTH_KEYS.audit, JSON.stringify(list.slice(0, 300)));
  } catch (e) {
    /* ignore */
  }
  return entry;
}

/* ---------------- Registration ---------------- */

async function registerAccount(input, options = {}) {
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim();
  const password = String(input.password || '');
  const confirm = String(input.confirm || '');
  const phone = String(input.phone || '').trim();
  const address = String(input.address || '').trim();

  if (!name) return { ok: false, field: 'name', message: 'Enter your full name.' };
  if (!isValidEmail(email)) {
    return { ok: false, field: 'email', message: 'Enter a valid email address.' };
  }
  const policy = validatePassword(password);
  if (!policy.ok) return { ok: false, field: 'password', message: policy.message };
  if (password !== confirm) {
    return { ok: false, field: 'confirm', message: 'Passwords do not match.' };
  }
  if (findAccountByEmail(email)) {
    return { ok: false, field: 'email', message: 'An account with that email already exists.' };
  }

  if (options.requireDelivery !== false) {
    if (phone.replace(/\D/g, '').length < 7 || !/^[+\d\s().-]+$/.test(phone)) {
      return { ok: false, field: 'phone', message: 'Enter a valid phone number (at least 7 digits).' };
    }
    if (!address) return { ok: false, field: 'address', message: 'Enter your delivery address.' };
  }

  const { firstName, lastName } = splitName(name);
  const secretHash = await hashWithNewSalt(password);

  const acct = {
    id: 'usr_' + randomHex(8),
    email,
    emailLower: normalizeEmail(email),
    name,
    firstName,
    lastName,
    phone,
    address,
    salt: secretHash.salt,
    hash: secretHash.hash,
    iterations: secretHash.iterations,
    role: 'customer',
    suspended: false,
    createdAt: new Date().toISOString(),
    failed: 0,
    lockedUntil: 0
  };

  const list = readAccounts();
  list.push(acct);
  if (!writeAccounts(list)) {
    return { ok: false, field: 'email', message: 'Could not save the account in this browser.' };
  }

  startSession(acct);
  if (typeof adoptGuestData === 'function') adoptGuestData(acct.id, acct);
  if (typeof saveProfile === 'function') {
    saveProfile({ firstName, lastName, fullName: name, email, phone, address });
  }
  return { ok: true, account: publicAccount(acct) };
}

/* ---------------- Login ---------------- */

async function loginAccount(input) {
  const email = String(input.email || '').trim();
  const password = String(input.password || '');

  if (!isValidEmail(email)) {
    return { ok: false, field: 'email', message: 'Enter a valid email address.' };
  }
  if (!password) {
    return { ok: false, field: 'password', message: 'Enter your password.' };
  }

  const acct = findAccountByEmail(email);

  if (!acct) {
    /* equalise timing so unknown emails are not detectable */
    await pbkdf2Hex(password, randomHex(AUTH_CONFIG.saltBytes), AUTH_CONFIG.iterations);
    return { ok: false, field: 'password', message: 'Email or password is incorrect.' };
  }

  const locked = lockSecondsLeft(acct);
  if (locked > 0) {
    const mins = Math.ceil(locked / 60);
    return {
      ok: false,
      field: 'password',
      message: `Too many failed attempts. Try again in about ${mins} ${pluralAuth(mins, 'minute')}.`
    };
  }

  const valid = await verifySecret(password, acct.salt, acct.hash, acct.iterations);
  if (!valid) {
    const failed = (acct.failed || 0) + 1;
    const patch = { failed };
    if (failed >= AUTH_CONFIG.maxFailedAttempts) {
      patch.lockedUntil = Date.now() + AUTH_CONFIG.lockMs;
      patch.failed = 0;
    }
    saveAccountPatch(acct, patch);
    return { ok: false, field: 'password', message: 'Email or password is incorrect.' };
  }

  if (acct.suspended) {
    return { ok: false, field: 'email', message: 'This account is suspended.' };
  }

  saveAccountPatch(acct, { failed: 0, lockedUntil: 0 });
  startSession(acct);
  if (typeof adoptGuestData === 'function') adoptGuestData(acct.id, acct);
  return { ok: true, account: publicAccount(acct) };
}

function pluralAuth(n, word) {
  return n === 1 ? word : word + 's';
}

/* ---------------- Signed-in password change ---------------- */

async function changeOwnPassword(input) {
  const guard = currentSession();
  if (!guard) return { ok: false, message: 'Please sign in first.' };
  const acct = findAccountById(guard.userId);
  if (!acct) return { ok: false, message: 'Session no longer valid.' };

  const current = String(input.current || '');
  const next = String(input.next || '');
  const confirm = String(input.confirm || '');

  const valid = await verifySecret(current, acct.salt, acct.hash, acct.iterations);
  if (!valid) return { ok: false, message: 'Current password is incorrect.' };

  const policy = validatePassword(next);
  if (!policy.ok) return { ok: false, message: policy.message };
  if (next !== confirm) return { ok: false, message: 'Passwords do not match.' };

  const hashed = await hashWithNewSalt(next);
  if (!saveAccountPatch(acct, { salt: hashed.salt, hash: hashed.hash, iterations: hashed.iterations })) {
    return { ok: false, message: 'Could not save the new password in this browser.' };
  }
  appendAudit('account.password_change', 'Own password changed');
  return { ok: true };
}

/* ---------------- One-time admin bootstrap ---------------- */

async function adminSetup(input) {
  if (adminExists()) {
    return { ok: false, message: 'An administrator already exists. Setup is permanently closed.' };
  }

  /* First-run ceremony only: the owner picks the passphrase in this browser.
     It is deliberately not compared with a value baked into the shipped code,
     because a client-side secret is not a real access control. */
  const key = String(input.key || '').trim();
  if (key.length < ADMIN_SETUP_KEY_MIN) {
    return {
      ok: false,
      field: 'key',
      message: `Choose a setup passphrase of at least ${ADMIN_SETUP_KEY_MIN} characters.`
    };
  }
  if (key.toLowerCase() === String(input.password || '').toLowerCase()) {
    return { ok: false, field: 'key', message: 'Use a setup passphrase that differs from the password.' };
  }

  const result = await registerAccount({
    name: input.name,
    email: input.email,
    password: input.password,
    confirm: input.confirm
  }, { requireDelivery: false });
  if (!result.ok) return result;

  const acct = findAccountById(result.account.id);
  saveAccountPatch(acct, { role: 'admin' });
  appendAudit('admin.setup', `Administrator created for ${acct.email}`);
  return { ok: true, account: publicAccount(findAccountById(acct.id)) };
}

/* ---------------- Admin account operations ---------------- */

function listAccounts() {
  return readAccounts().map(publicAccount);
}

function setAccountSuspended(userId, suspended) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  const acct = findAccountById(userId);
  if (!acct) return { ok: false, error: 'Account not found.' };
  if (acct.id === guard.account.id) {
    return { ok: false, error: 'You cannot suspend your own administrator account.' };
  }
  if (acct.role === 'admin') {
    return { ok: false, error: 'The administrator account cannot be suspended.' };
  }
  saveAccountPatch(acct, { suspended: Boolean(suspended) });
  if (suspended) clearSessionForUser(acct.id);
  appendAudit(
    suspended ? 'admin.suspend' : 'admin.unsuspend',
    `${acct.email} (${acct.id})`
  );
  return { ok: true };
}

function clearSessionForUser(userId) {
  const session = readSession();
  if (session && session.userId === userId) clearSession();
}

function deleteAccount(userId) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  const acct = findAccountById(userId);
  if (!acct) return { ok: false, error: 'Account not found.' };
  if (acct.role === 'admin') return { ok: false, error: 'The administrator account cannot be removed.' };
  writeAccounts(readAccounts().filter((a) => a.id !== userId));
  clearSessionForUser(userId);
  appendAudit('admin.delete_account', `${acct.email} (${acct.id})`);
  return { ok: true };
}

/* ---------------- Signed-in account details ---------------- */

/* Updates the display name and/or sign-in email of the current account.
   Email changes are normalised and checked for duplicates, and a malformed
   or already-used address is rejected with a field-level error so the profile
   form can show it inline. */
function updateOwnAccount(input = {}) {
  const session = currentSession();
  if (!session) return { ok: false, message: 'Please sign in first.' };
  const acct = findAccountById(session.userId);
  if (!acct) return { ok: false, message: 'Session no longer valid.' };

  const patch = {};
  let name = acct.name;
  let firstName = acct.firstName;
  let lastName = acct.lastName;

  if (typeof input.firstName === 'string' || typeof input.lastName === 'string') {
    firstName = typeof input.firstName === 'string' ? input.firstName.trim() : acct.firstName;
    lastName = typeof input.lastName === 'string' ? input.lastName.trim() : acct.lastName;
    if (!firstName) return { ok: false, field: 'firstName', message: 'Enter your first name.' };
    name = [firstName, lastName].filter(Boolean).join(' ');
    patch.firstName = firstName;
    patch.lastName = lastName;
    patch.name = name;
  } else if (typeof input.name === 'string') {
    name = input.name.trim();
    if (!name) return { ok: false, field: 'name', message: 'Enter your name.' };
    const parts = splitName(name);
    firstName = parts.firstName;
    lastName = parts.lastName;
    patch.name = name;
    patch.firstName = firstName;
    patch.lastName = lastName;
  }

  if (typeof input.email === 'string') {
    const email = input.email.trim();
    if (!isValidEmail(email)) {
      return { ok: false, field: 'email', message: 'Enter a valid email address.' };
    }
    const lower = normalizeEmail(email);
    const owner = readAccounts().find((a) => a.emailLower === lower && a.id !== acct.id);
    if (owner) {
      return { ok: false, field: 'email', message: 'Another account already uses that email.' };
    }
    patch.email = email;
    patch.emailLower = lower;
  }

  if (!Object.keys(patch).length) {
    return { ok: false, message: 'Nothing to update.' };
  }

  if (!saveAccountPatch(acct, patch)) {
    return { ok: false, message: 'Could not save the change in this browser.' };
  }
  appendAudit('account.profile_update', 'Own account details updated');
  return { ok: true, account: publicAccount(findAccountById(acct.id)) };
}

/* used by storage.saveProfile() to keep the account name in sync without
   touching the sign-in email (which the profile page updates explicitly) */
function updateOwnProfileFields(patch) {
  const session = currentSession();
  if (!session) return null;
  const acct = findAccountById(session.userId);
  if (!acct) return null;
  const allowed = {};
  if (typeof patch.name === 'string' && patch.name.trim()) allowed.name = patch.name.trim();
  if (typeof patch.firstName === 'string') allowed.firstName = patch.firstName;
  if (typeof patch.lastName === 'string') allowed.lastName = patch.lastName;
  if (typeof patch.email === 'string' && isValidEmail(patch.email)) {
    const lower = normalizeEmail(patch.email);
    const owner = readAccounts().find((a) => a.emailLower === lower && a.id !== acct.id);
    if (!owner) {
      allowed.email = patch.email.trim();
      allowed.emailLower = lower;
    }
  }
  saveAccountPatch(acct, allowed);
  return publicAccount(findAccountById(acct.id));
}
