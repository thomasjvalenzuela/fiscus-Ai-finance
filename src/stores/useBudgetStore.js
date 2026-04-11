import { create } from 'zustand'
import { load, save } from './_storage.js'

export const useBudgetStore = create((set, get) => ({
  budgets: [],

  hydrate() {
    set({ budgets: load('budgets', []) })
  },

  setBudgets(budgets) {
    set({ budgets })
    save('budgets', budgets)
  },

  clearBudgets() {
    set({ budgets: [] })
    save('budgets', [])
  },
}))
