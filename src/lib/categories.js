export const CATEGORIES = [
  // Income
  'Salary',
  'Rental Income',
  'Anchor Controls Income',
  'eBay Sales',
  'Cashback & Rewards',
  'Refunds & Returns',
  // Personal
  'Auto',
  'Cash & ATM',
  'Convenience & Snacks',
  'Debt Payment',
  'Dining & Takeout',
  'Entertainment',
  'Fees & Interest',
  'Fuel',
  'Groceries',
  'Internet & Utilities',
  'Medical',
  'Rent / Housing',
  'Shopping',
  'Subscriptions',
  'Transit & Parking',
  // Rental
  'Rental Mortgage',
  'Rental Repairs & Maintenance',
  'Rental Supplies',
  'Rental Utilities',
  'Rental Platform Fees',
  // Business
  'Anchor Controls Expenses',
  'eBay Expenses',
  'Software & Tools',
  // Other
  'Transfer / Internal',
  'Skip / Uncategorized',
]

export const CAT_GROUPS = {
  Income: ['Salary', 'Rental Income', 'Anchor Controls Income', 'eBay Sales', 'Cashback & Rewards', 'Refunds & Returns'],
  Personal: ['Auto', 'Cash & ATM', 'Convenience & Snacks', 'Debt Payment', 'Dining & Takeout', 'Entertainment', 'Fees & Interest', 'Fuel', 'Groceries', 'Internet & Utilities', 'Medical', 'Rent / Housing', 'Shopping', 'Subscriptions', 'Transit & Parking'],
  Rental: ['Rental Mortgage', 'Rental Repairs & Maintenance', 'Rental Supplies', 'Rental Utilities', 'Rental Platform Fees'],
  Business: ['Anchor Controls Expenses', 'eBay Expenses', 'Software & Tools'],
  Other: ['Transfer / Internal', 'Skip / Uncategorized'],
}

export const INCOME_CATS = new Set(CAT_GROUPS.Income)
export const TRANSFER_CATS = new Set(['Transfer / Internal'])
export const SKIP_CATS = new Set(['Skip / Uncategorized'])

export const CAT_META = {
  'Salary':                       { color: '#2dd4a0', icon: '💵', group: 'Income' },
  'Rental Income':                { color: '#2dd4a0', icon: '🏠', group: 'Income' },
  'Anchor Controls Income':       { color: '#2dd4a0', icon: '🏗️', group: 'Income' },
  'eBay Sales':                   { color: '#2dd4a0', icon: '📦', group: 'Income' },
  'Cashback & Rewards':           { color: '#2dd4a0', icon: '🎁', group: 'Income' },
  'Refunds & Returns':            { color: '#2dd4a0', icon: '↩️', group: 'Income' },
  'Auto':                         { color: '#94a3b8', icon: '🔧', group: 'Personal' },
  'Cash & ATM':                   { color: '#94a3b8', icon: '🏧', group: 'Personal' },
  'Convenience & Snacks':         { color: '#f0a040', icon: '🧃', group: 'Personal' },
  'Debt Payment':                 { color: '#f06080', icon: '💳', group: 'Personal' },
  'Dining & Takeout':             { color: '#f0a040', icon: '🍽️', group: 'Personal' },
  'Entertainment':                { color: '#f06080', icon: '🎭', group: 'Personal' },
  'Fees & Interest':              { color: '#f06080', icon: '💸', group: 'Personal' },
  'Fuel':                         { color: '#f0a040', icon: '⛽', group: 'Personal' },
  'Groceries':                    { color: '#7c6af7', icon: '🛒', group: 'Personal' },
  'Internet & Utilities':         { color: '#f0a040', icon: '💡', group: 'Personal' },
  'Medical':                      { color: '#f06080', icon: '💊', group: 'Personal' },
  'Rent / Housing':               { color: '#f06080', icon: '🏦', group: 'Personal' },
  'Shopping':                     { color: '#7c6af7', icon: '🛍️', group: 'Personal' },
  'Subscriptions':                { color: '#a78bfa', icon: '📱', group: 'Personal' },
  'Transit & Parking':            { color: '#60a5fa', icon: '🚗', group: 'Personal' },
  'Rental Mortgage':              { color: '#f06080', icon: '🏦', group: 'Rental' },
  'Rental Repairs & Maintenance': { color: '#f0a040', icon: '🔨', group: 'Rental' },
  'Rental Supplies':              { color: '#f0a040', icon: '🧰', group: 'Rental' },
  'Rental Utilities':             { color: '#f0a040', icon: '💡', group: 'Rental' },
  'Rental Platform Fees':         { color: '#60a5fa', icon: '📋', group: 'Rental' },
  'Anchor Controls Expenses':     { color: '#f0a040', icon: '🏗️', group: 'Business' },
  'eBay Expenses':                { color: '#f0a040', icon: '📦', group: 'Business' },
  'Software & Tools':             { color: '#a78bfa', icon: '🖥️', group: 'Business' },
  'Transfer / Internal':          { color: '#64748b', icon: '↔️', group: 'Other' },
  'Skip / Uncategorized':         { color: '#64748b', icon: '•',  group: 'Other' },
}

export function catMeta(cat) {
  return CAT_META[cat] ?? { color: '#64748b', icon: '•', group: 'Other' }
}
