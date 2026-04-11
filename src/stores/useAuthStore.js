import { create } from 'zustand'
import { setActiveUser } from './_storage.js'
import {
  getCurrentSession,
  loginUser,
  registerUser,
  loginAsDemo,
  logout as doLogout,
} from '../lib/authStore.js'

export const useAuthStore = create((set) => ({
  session: null,

  /** Re-hydrate from sessionStorage on app boot. */
  init() {
    const session = getCurrentSession()
    if (session) {
      setActiveUser(session.username)
      set({ session })
    }
  },

  async login(username, password) {
    const session = await loginUser(username, password)
    setActiveUser(session.username)
    set({ session })
    return session
  },

  async loginDemo() {
    const session = await loginAsDemo()
    setActiveUser(session.username)
    set({ session })
    return session
  },

  async register(username, password) {
    return registerUser(username, password)
  },

  logout() {
    doLogout()
    setActiveUser(null)
    set({ session: null })
  },
}))
