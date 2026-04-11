import '@testing-library/jest-dom'

// Mock localStorage
const storage = {}
global.localStorage = {
  getItem:    (k)    => storage[k] ?? null,
  setItem:    (k, v) => { storage[k] = String(v) },
  removeItem: (k)    => { delete storage[k] },
  clear:      ()     => { Object.keys(storage).forEach(k => delete storage[k]) },
  get length()       { return Object.keys(storage).length },
  key:        (i)    => Object.keys(storage)[i] ?? null,
}

// Mock crypto.subtle for PBKDF2 (Node < 19 needs this bridged from webcrypto)
if (!global.crypto?.subtle) {
  const { webcrypto } = await import('node:crypto')
  global.crypto = webcrypto
}

// Suppress noisy React act() warnings in test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('act(')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
