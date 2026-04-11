import { create } from 'zustand'
import { load, save, estimateStorageSize } from './_storage.js'

const STORAGE_WARN_BYTES = 4_500_000 // ~4.5 MB — warn before the 5 MB browser limit

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  storageWarning: false,

  /** Load this user's transactions from localStorage. */
  hydrate() {
    set({ transactions: load('transactions', []) })
  },

  /** Replace the full list and persist. */
  setTransactions(transactions) {
    set({ transactions })
    save('transactions', transactions)
    if (estimateStorageSize() > STORAGE_WARN_BYTES) {
      set({ storageWarning: true })
    }
  },

  /** Merge incoming transactions, skipping ids already present. */
  importTransactions(incoming) {
    const { transactions, setTransactions } = get()
    const ids = new Set(transactions.map((t) => t.id))
    setTransactions([...transactions, ...incoming.filter((t) => !ids.has(t.id))])
  },

  /** Update the category of a single transaction by id. */
  updateCategory(id, category) {
    const { transactions, setTransactions } = get()
    setTransactions(transactions.map((t) => (t.id === id ? { ...t, category } : t)))
  },

  /** Clear all transactions for the current user. */
  clearTransactions() {
    set({ transactions: [] })
    save('transactions', [])
  },

  dismissStorageWarning() {
    set({ storageWarning: false })
  },
}))
