/**
 * Per-user localStorage helpers shared by all Zustand stores.
 *
 * Call setActiveUser(username) after login; call setActiveUser(null) after logout.
 * All stores read/write through these helpers so every key is automatically
 * namespaced as  fiscus_u_{username}_{suffix} — identical to the old storage.js
 * format, so no existing user data is lost.
 */

let _username = null

export function setActiveUser(username) { _username = username }
export function getActiveUser()         { return _username }

export function load(suffix, fallback) {
  if (!_username) return fallback
  try {
    const raw = localStorage.getItem(`fiscus_u_${_username}_${suffix}`)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export function save(suffix, value) {
  if (!_username) return
  localStorage.setItem(`fiscus_u_${_username}_${suffix}`, JSON.stringify(value))
}

export function remove(suffix) {
  if (!_username) return
  localStorage.removeItem(`fiscus_u_${_username}_${suffix}`)
}

/** Estimate total localStorage usage in bytes (2 bytes per UTF-16 char). */
export function estimateStorageSize() {
  let total = 0
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      total += localStorage[key].length * 2
    }
  }
  return total
}
