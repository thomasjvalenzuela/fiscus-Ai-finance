/**
 * Local auth — users stored in localStorage, passwords hashed with PBKDF2 + random salt.
 * Data is namespaced per user: fiscus_u_{username}_transactions, etc.
 * Session stored in sessionStorage so it clears on tab close.
 *
 * Backward compat: accounts created before the PBKDF2 upgrade have no `salt` field.
 * On successful login those accounts are automatically migrated to PBKDF2.
 */

const USERS_KEY    = 'fiscus_users'
const SESSION_KEY  = 'fiscus_session'
const ATTEMPTS_KEY = 'fiscus_auth_attempts'

const PBKDF2_ITERATIONS = 250000  // OWASP 2023 recommendation for PBKDF2-SHA-256
const MAX_ATTEMPTS      = 5
const LOCKOUT_MS        = 30 * 1000  // 30-second lockout after MAX_ATTEMPTS failures

// ── Crypto helpers ────────────────────────────────────────────────────────────

function generateSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

/** PBKDF2-SHA-256, keyed by password + salt. Returns lowercase hex string. */
async function pbkdf2Hash(password, salt) {
  const enc    = new TextEncoder()
  const keyMat = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits   = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS },
    keyMat,
    256,
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Legacy SHA-256 — used only to verify and migrate old accounts. */
async function sha256Hash(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── User store helpers ────────────────────────────────────────────────────────

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch { return {} }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// ── Brute-force protection ────────────────────────────────────────────────────

function getAttempts(key) {
  try {
    return JSON.parse(localStorage.getItem(`${ATTEMPTS_KEY}_${key}`) || '{"count":0,"until":0}')
  } catch {
    return { count: 0, until: 0 }
  }
}

function setAttempts(key, data) {
  localStorage.setItem(`${ATTEMPTS_KEY}_${key}`, JSON.stringify(data))
}

function clearAttempts(key) {
  localStorage.removeItem(`${ATTEMPTS_KEY}_${key}`)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function registerUser(username, password) {
  const users = getUsers()
  const key   = username.toLowerCase().trim()
  if (!key) throw new Error('Username is required')
  if (key.length < 3) throw new Error('Username must be at least 3 characters')
  if (users[key]) throw new Error('Username already taken')
  if (password.length < 6) throw new Error('Password must be at least 6 characters')

  const salt = generateSalt()
  const hash = await pbkdf2Hash(password, salt)
  users[key] = { username: key, displayName: username.trim(), hash, salt, createdAt: Date.now() }
  saveUsers(users)
  return users[key]
}

export async function loginUser(username, password) {
  const key      = username.toLowerCase().trim()
  const attempts = getAttempts(key)

  // Check lockout
  if (attempts.count >= MAX_ATTEMPTS && Date.now() < attempts.until) {
    const secs = Math.ceil((attempts.until - Date.now()) / 1000)
    throw new Error(`Too many failed attempts. Try again in ${secs}s.`)
  }

  const users = getUsers()
  const user  = users[key]
  if (!user) throw new Error('User not found')

  let verified = false
  if (user.salt) {
    // Modern PBKDF2 path
    const hash = await pbkdf2Hash(password, user.salt)
    verified = hash === user.hash
  } else {
    // Legacy SHA-256 path — migrate on success
    const hash = await sha256Hash(password)
    if (hash === user.hash) {
      verified = true
      // Upgrade account to PBKDF2 in-place
      const newSalt  = generateSalt()
      const newHash  = await pbkdf2Hash(password, newSalt)
      users[key]     = { ...user, hash: newHash, salt: newSalt }
      saveUsers(users)
    }
  }

  if (!verified) {
    const newCount = attempts.count + 1
    const until    = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : attempts.until
    setAttempts(key, { count: newCount, until })
    if (newCount >= MAX_ATTEMPTS) {
      throw new Error(`Too many failed attempts. Try again in ${Math.ceil(LOCKOUT_MS / 1000)}s.`)
    }
    throw new Error('Incorrect password')
  }

  clearAttempts(key)
  const session = { username: key, displayName: user.displayName, loginAt: Date.now() }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getCurrentSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * One-click demo login — creates the demo user, starts a session, and seeds
 * realistic fake data so the dashboard is immediately useful to explore.
 * No password required. Safe to call repeatedly.
 */
export async function loginAsDemo() {
  const DEMO_USER = 'demo'
  const users     = getUsers()
  if (!users[DEMO_USER]) {
    const salt = generateSalt()
    const hash = await pbkdf2Hash(crypto.randomUUID(), salt)  // random — demo login bypasses auth
    users[DEMO_USER] = {
      username:    DEMO_USER,
      displayName: 'Demo User',
      hash,
      salt,
      createdAt:   Date.now(),
    }
    saveUsers(users)
  }
  const session = { username: DEMO_USER, displayName: 'Demo User', loginAt: Date.now() }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

  // Set user namespace before seeding so data goes to the right keys
  const { setActiveUser } = await import('../stores/_storage.js')
  const { seedDemoData }  = await import('./demoSeed.js')
  setActiveUser(DEMO_USER)
  seedDemoData()

  return session
}

export function userHasData(username) {
  return !!localStorage.getItem(`fiscus_u_${username}_transactions`)
}

/** Per-user storage key prefix */
export function userKey(username, suffix) {
  return `fiscus_u_${username}_${suffix}`
}
