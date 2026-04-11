import { create } from 'zustand'
import { load, save } from './_storage.js'

export const useDebtStore = create((set, get) => ({
  debts: [],

  hydrate() {
    set({ debts: load('debts', []) })
  },

  setDebts(debts) {
    set({ debts })
    save('debts', debts)
  },

  clearDebts() {
    set({ debts: [] })
    save('debts', [])
  },
}))
