import { describe, it, expect, beforeEach } from 'vitest'
import { setActiveUser } from '../stores/_storage.js'
import { useTransactionStore } from '../stores/useTransactionStore.js'

const TX = (overrides = {}) => ({
  id: 'tx1',
  date: '2024-03-01',
  description: 'AMAZON MKTPL',
  amount: 42.99,
  isIncome: false,
  isTransfer: false,
  category: '',
  account: 'Checking',
  ...overrides,
})

beforeEach(() => {
  setActiveUser('testuser')
  localStorage.clear()
  useTransactionStore.setState({ transactions: [], storageWarning: false })
})

describe('useTransactionStore', () => {
  it('starts empty', () => {
    expect(useTransactionStore.getState().transactions).toHaveLength(0)
  })

  it('setTransactions stores and retrieves', () => {
    const txs = [TX({ id: 'a' }), TX({ id: 'b' })]
    useTransactionStore.getState().setTransactions(txs)
    expect(useTransactionStore.getState().transactions).toHaveLength(2)
  })

  it('importTransactions skips duplicate ids (preserves user edits)', () => {
    useTransactionStore.getState().setTransactions([TX({ id: 'a', category: 'Groceries' })])
    useTransactionStore.getState().importTransactions([TX({ id: 'a', description: 'updated' }), TX({ id: 'b' })])
    const txs = useTransactionStore.getState().transactions
    expect(txs).toHaveLength(2)
    // Existing tx 'a' keeps original data (category edits preserved)
    expect(txs.find(t => t.id === 'a')?.category).toBe('Groceries')
  })

  it('updateCategory changes a single transaction', () => {
    useTransactionStore.getState().setTransactions([TX({ id: 'x', category: '' })])
    useTransactionStore.getState().updateCategory('x', 'Groceries')
    const tx = useTransactionStore.getState().transactions.find(t => t.id === 'x')
    expect(tx?.category).toBe('Groceries')
  })

  it('clearTransactions empties the store', () => {
    useTransactionStore.getState().setTransactions([TX()])
    useTransactionStore.getState().clearTransactions()
    expect(useTransactionStore.getState().transactions).toHaveLength(0)
  })
})
