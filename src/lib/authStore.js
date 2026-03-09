/**
 * Local auth — users stored in localStorage, passwords hashed with SubtleCrypto SHA-256.
 * Data is namespaced per user: fiscus_u_{username}_transactions, etc.
 * Session stored in sessionStorage so it clears on tab close.
 */

const USERS_KEY = 'fiscus_users'
const SESSION_KEY = 'fiscus_session'

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}') } catch { return {} }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export async function registerUser(username, password) {
  const users = getUsers()
  const key = username.toLowerCase().trim()
  if (!key) throw new Error('Username is required')
  if (key.length < 3) throw new Error('Username must be at least 3 characters')
  if (users[key]) throw new Error('Username already taken')
  if (password.length < 6) throw new Error('Password must be at least 6 characters')
  const hash = await hashPassword(password)
  users[key] = { username: key, displayName: username.trim(), hash, createdAt: Date.now() }
  saveUsers(users)
  return users[key]
}

export async function loginUser(username, password) {
  const users = getUsers()
  const key = username.toLowerCase().trim()
  const user = users[key]
  if (!user) throw new Error('User not found')
  const hash = await hashPassword(password)
  if (hash !== user.hash) throw new Error('Incorrect password')
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
  const DEMO_PASS = 'demo-pass-internal'
  const users = getUsers()
  if (!users[DEMO_USER]) {
    const hash = await hashPassword(DEMO_PASS)
    users[DEMO_USER] = {
      username:    DEMO_USER,
      displayName: 'Demo User',
      hash,
      createdAt:   Date.now(),
    }
    saveUsers(users)
  }
  const session = { username: DEMO_USER, displayName: 'Demo User', loginAt: Date.now() }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))

  // Set user namespace before seeding so data goes to the right keys
  const { storage } = await import('./storage.js')
  storage.setUser(DEMO_USER)
  const { seedDemoData } = await import('./demoSeed.js')
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
