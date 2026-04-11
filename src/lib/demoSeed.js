/**
 * Demo seed data — injected into localStorage when "Try Demo" is used.
 * All data is fictional. No real personal or financial information.
 */

import { load, save } from '../stores/_storage.js'

// ── Helpers ────────────────────────────────────────────────────────────────

function d(offset = 0) {
  const dt = new Date()
  dt.setDate(dt.getDate() - offset)
  return dt.toISOString().slice(0, 10)
}

let _id = 1
const id = () => String(_id++)

// ── Transactions ───────────────────────────────────────────────────────────
// ~120 realistic transactions across 4 months

const TX = [
  // ── Income ─────────────────────────────────────────────────
  { id: id(), date: d(2),   description: 'DIRECT DEPOSIT - ACME CORP PAYROLL',          amount: 3240.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Salary & Wages' },
  { id: id(), date: d(16),  description: 'DIRECT DEPOSIT - ACME CORP PAYROLL',          amount: 3240.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Salary & Wages' },
  { id: id(), date: d(32),  description: 'DIRECT DEPOSIT - ACME CORP PAYROLL',          amount: 3240.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Salary & Wages' },
  { id: id(), date: d(46),  description: 'DIRECT DEPOSIT - ACME CORP PAYROLL',          amount: 3240.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Salary & Wages' },
  { id: id(), date: d(62),  description: 'DIRECT DEPOSIT - ACME CORP PAYROLL',          amount: 3240.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Salary & Wages' },
  { id: id(), date: d(76),  description: 'DIRECT DEPOSIT - ACME CORP PAYROLL',          amount: 3240.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Salary & Wages' },
  { id: id(), date: d(10),  description: 'VENMO PAYMENT FROM JAKE M.',                  amount:  450.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Other Income' },
  { id: id(), date: d(38),  description: 'FREELANCE - WEBSITE PROJECT',                 amount:  800.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Freelance' },
  { id: id(), date: d(55),  description: 'TAX REFUND - IRS TREAS',                      amount: 1240.00, isIncome: true,  isExpense: false, isTransfer: false, category: 'Other Income' },
  { id: id(), date: d(70),  description: 'INTEREST - SAVINGS ACCOUNT',                  amount:   18.42, isIncome: true,  isExpense: false, isTransfer: false, category: 'Interest & Dividends' },

  // ── Housing ────────────────────────────────────────────────
  { id: id(), date: d(1),   description: 'RENT PAYMENT - PARKVIEW APTS',                amount: 1850.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Housing & Rent' },
  { id: id(), date: d(31),  description: 'RENT PAYMENT - PARKVIEW APTS',                amount: 1850.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Housing & Rent' },
  { id: id(), date: d(61),  description: 'RENT PAYMENT - PARKVIEW APTS',                amount: 1850.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Housing & Rent' },
  { id: id(), date: d(15),  description: 'XCEL ENERGY - ELECTRIC & GAS',                amount:   87.40, isIncome: false, isExpense: true,  isTransfer: false, category: 'Internet & Utilities' },
  { id: id(), date: d(45),  description: 'XCEL ENERGY - ELECTRIC & GAS',                amount:   94.20, isIncome: false, isExpense: true,  isTransfer: false, category: 'Internet & Utilities' },
  { id: id(), date: d(75),  description: 'XCEL ENERGY - ELECTRIC & GAS',                amount:  102.10, isIncome: false, isExpense: true,  isTransfer: false, category: 'Internet & Utilities' },
  { id: id(), date: d(12),  description: 'COMCAST XFINITY INTERNET',                    amount:   75.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Internet & Utilities' },
  { id: id(), date: d(42),  description: 'COMCAST XFINITY INTERNET',                    amount:   75.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Internet & Utilities' },
  { id: id(), date: d(72),  description: 'COMCAST XFINITY INTERNET',                    amount:   75.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Internet & Utilities' },

  // ── Groceries ──────────────────────────────────────────────
  { id: id(), date: d(3),   description: 'TRADER JOES #142',                            amount:   96.38, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(10),  description: 'WHOLE FOODS MARKET',                          amount:  142.77, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(17),  description: 'TRADER JOES #142',                            amount:   88.14, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(24),  description: 'KROGER #0824',                                amount:  113.22, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(33),  description: 'WHOLE FOODS MARKET',                          amount:   79.55, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(40),  description: 'TRADER JOES #142',                            amount:  104.92, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(50),  description: 'KROGER #0824',                                amount:   91.33, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(60),  description: 'TRADER JOES #142',                            amount:  118.60, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(68),  description: 'WHOLE FOODS MARKET',                          amount:   87.44, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },
  { id: id(), date: d(78),  description: 'KROGER #0824',                                amount:   99.11, isIncome: false, isExpense: true,  isTransfer: false, category: 'Groceries' },

  // ── Dining ─────────────────────────────────────────────────
  { id: id(), date: d(2),   description: 'CHIPOTLE MEXICAN GRILL',                      amount:   13.85, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(5),   description: 'DOORDASH - THAI ORCHID',                      amount:   34.60, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(8),   description: 'STARBUCKS #04821',                            amount:    7.25, isIncome: false, isExpense: true,  isTransfer: false, category: 'Coffee & Drinks' },
  { id: id(), date: d(11),  description: 'PANERA BREAD',                                amount:   16.40, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(14),  description: 'UBER EATS - PIZZA HUT',                       amount:   28.90, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(18),  description: 'STARBUCKS #04821',                            amount:    6.75, isIncome: false, isExpense: true,  isTransfer: false, category: 'Coffee & Drinks' },
  { id: id(), date: d(22),  description: 'MCDONALDS #10042',                            amount:   11.30, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(27),  description: 'CHIPOTLE MEXICAN GRILL',                      amount:   14.60, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(35),  description: 'DOORDASH - SUSHI PLACE',                      amount:   42.15, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(44),  description: 'LOCAL COFFEE SHOP',                           amount:    5.50, isIncome: false, isExpense: true,  isTransfer: false, category: 'Coffee & Drinks' },
  { id: id(), date: d(53),  description: 'PANERA BREAD',                                amount:   17.20, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(64),  description: 'CHIPOTLE MEXICAN GRILL',                      amount:   13.45, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },
  { id: id(), date: d(74),  description: 'UBER EATS - BURGERS',                         amount:   31.80, isIncome: false, isExpense: true,  isTransfer: false, category: 'Dining & Takeout' },

  // ── Subscriptions ──────────────────────────────────────────
  { id: id(), date: d(5),   description: 'NETFLIX.COM',                                 amount:   15.49, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(35),  description: 'NETFLIX.COM',                                 amount:   15.49, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(65),  description: 'NETFLIX.COM',                                 amount:   15.49, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(5),   description: 'SPOTIFY AB',                                  amount:   10.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(35),  description: 'SPOTIFY AB',                                  amount:   10.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(65),  description: 'SPOTIFY AB',                                  amount:   10.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(7),   description: 'AMAZON PRIME MEMBERSHIP',                     amount:   14.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(37),  description: 'AMAZON PRIME MEMBERSHIP',                     amount:   14.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(67),  description: 'AMAZON PRIME MEMBERSHIP',                     amount:   14.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(8),   description: 'APPLE ICLOUD+',                               amount:    2.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(38),  description: 'APPLE ICLOUD+',                               amount:    2.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(68),  description: 'APPLE ICLOUD+',                               amount:    2.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(12),  description: 'HULU + LIVE TV',                              amount:   76.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(42),  description: 'HULU + LIVE TV',                              amount:   76.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },
  { id: id(), date: d(72),  description: 'HULU + LIVE TV',                              amount:   76.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Subscriptions' },

  // ── Transportation ─────────────────────────────────────────
  { id: id(), date: d(4),   description: 'SHELL OIL - GAS STATION',                     amount:   58.20, isIncome: false, isExpense: true,  isTransfer: false, category: 'Gas & Transportation' },
  { id: id(), date: d(20),  description: 'SHELL OIL - GAS STATION',                     amount:   61.40, isIncome: false, isExpense: true,  isTransfer: false, category: 'Gas & Transportation' },
  { id: id(), date: d(48),  description: 'BP GAS STATION',                              amount:   55.80, isIncome: false, isExpense: true,  isTransfer: false, category: 'Gas & Transportation' },
  { id: id(), date: d(66),  description: 'SHELL OIL - GAS STATION',                     amount:   63.10, isIncome: false, isExpense: true,  isTransfer: false, category: 'Gas & Transportation' },
  { id: id(), date: d(9),   description: 'UBER TRIP',                                   amount:   18.40, isIncome: false, isExpense: true,  isTransfer: false, category: 'Gas & Transportation' },
  { id: id(), date: d(29),  description: 'UBER TRIP',                                   amount:   22.75, isIncome: false, isExpense: true,  isTransfer: false, category: 'Gas & Transportation' },
  { id: id(), date: d(19),  description: 'CITY PARKING RAMP',                           amount:   12.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Gas & Transportation' },

  // ── Health & Fitness ───────────────────────────────────────
  { id: id(), date: d(6),   description: 'PLANET FITNESS - MONTHLY DUES',               amount:   24.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Health & Fitness' },
  { id: id(), date: d(36),  description: 'PLANET FITNESS - MONTHLY DUES',               amount:   24.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Health & Fitness' },
  { id: id(), date: d(66),  description: 'PLANET FITNESS - MONTHLY DUES',               amount:   24.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Health & Fitness' },
  { id: id(), date: d(23),  description: 'CVS PHARMACY #4821',                          amount:   34.60, isIncome: false, isExpense: true,  isTransfer: false, category: 'Medical & Pharmacy' },
  { id: id(), date: d(49),  description: 'WALGREENS PHARMACY',                          amount:   18.90, isIncome: false, isExpense: true,  isTransfer: false, category: 'Medical & Pharmacy' },
  { id: id(), date: d(58),  description: 'DR SMITH MD - COPAY',                         amount:   40.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Medical & Pharmacy' },

  // ── Shopping ───────────────────────────────────────────────
  { id: id(), date: d(13),  description: 'AMAZON.COM - ORDER',                          amount:   48.39, isIncome: false, isExpense: true,  isTransfer: false, category: 'Shopping' },
  { id: id(), date: d(21),  description: 'TARGET - STORE PURCHASE',                     amount:   76.22, isIncome: false, isExpense: true,  isTransfer: false, category: 'Shopping' },
  { id: id(), date: d(30),  description: 'AMAZON.COM - ORDER',                          amount:   29.99, isIncome: false, isExpense: true,  isTransfer: false, category: 'Shopping' },
  { id: id(), date: d(43),  description: 'BEST BUY - PURCHASE',                         amount:  189.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Electronics' },
  { id: id(), date: d(54),  description: 'AMAZON.COM - ORDER',                          amount:   62.15, isIncome: false, isExpense: true,  isTransfer: false, category: 'Shopping' },
  { id: id(), date: d(69),  description: 'TARGET - STORE PURCHASE',                     amount:   44.88, isIncome: false, isExpense: true,  isTransfer: false, category: 'Shopping' },

  // ── Debt payments ──────────────────────────────────────────
  { id: id(), date: d(4),   description: 'CHASE SAPPHIRE PAYMENT',                      amount:  350.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Debt Payment' },
  { id: id(), date: d(34),  description: 'CHASE SAPPHIRE PAYMENT',                      amount:  350.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Debt Payment' },
  { id: id(), date: d(64),  description: 'CHASE SAPPHIRE PAYMENT',                      amount:  350.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Debt Payment' },
  { id: id(), date: d(15),  description: 'NAVIENT STUDENT LOAN PMT',                    amount:  280.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Debt Payment' },
  { id: id(), date: d(45),  description: 'NAVIENT STUDENT LOAN PMT',                    amount:  280.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Debt Payment' },
  { id: id(), date: d(75),  description: 'NAVIENT STUDENT LOAN PMT',                    amount:  280.00, isIncome: false, isExpense: true,  isTransfer: false, category: 'Debt Payment' },

  // ── Savings & transfers ────────────────────────────────────
  { id: id(), date: d(17),  description: 'TRANSFER TO SAVINGS',                         amount:  500.00, isIncome: false, isExpense: false, isTransfer: true,  category: 'Transfer / Internal' },
  { id: id(), date: d(47),  description: 'TRANSFER TO SAVINGS',                         amount:  500.00, isIncome: false, isExpense: false, isTransfer: true,  category: 'Transfer / Internal' },
  { id: id(), date: d(77),  description: 'TRANSFER TO SAVINGS',                         amount:  500.00, isIncome: false, isExpense: false, isTransfer: true,  category: 'Transfer / Internal' },
]

// ── Budgets ────────────────────────────────────────────────────────────────

const BUDGETS = [
  { id: 'b1', category: 'Groceries',            amount: 450,  spent: 0, period: 'monthly' },
  { id: 'b2', category: 'Dining & Takeout',     amount: 250,  spent: 0, period: 'monthly' },
  { id: 'b3', category: 'Gas & Transportation', amount: 200,  spent: 0, period: 'monthly' },
  { id: 'b4', category: 'Subscriptions',        amount: 150,  spent: 0, period: 'monthly' },
  { id: 'b5', category: 'Shopping',             amount: 200,  spent: 0, period: 'monthly' },
  { id: 'b6', category: 'Health & Fitness',     amount: 100,  spent: 0, period: 'monthly' },
  { id: 'b7', category: 'Coffee & Drinks',      amount:  60,  spent: 0, period: 'monthly' },
  { id: 'b8', category: 'Debt Payment',         amount: 630,  spent: 0, period: 'monthly' },
]

// ── Debts ──────────────────────────────────────────────────────────────────

const DEBTS = [
  {
    id: 'd1',
    name:            'Chase Sapphire Card',
    balance:         4820.00,
    originalBalance: 7500.00,
    apr:             21.99,
    monthlyPayment:  350,
    dueDay:          4,
  },
  {
    id: 'd2',
    name:            'Navient Student Loan',
    balance:         18340.00,
    originalBalance: 24000.00,
    apr:             5.75,
    monthlyPayment:  280,
    dueDay:          15,
  },
  {
    id: 'd3',
    name:            'Auto Loan - Honda Civic',
    balance:         9120.00,
    originalBalance: 14500.00,
    apr:             6.49,
    monthlyPayment:  298,
    dueDay:          20,
  },
]

// ── Seed function ──────────────────────────────────────────────────────────

/**
 * Seeds the demo user's localStorage with realistic fake data.
 * Called once on first demo login; subsequent logins reuse existing data.
 */
export function seedDemoData() {
  // Only seed if no transactions exist yet for this user
  const existing = load('transactions', [])
  if (existing.length > 0) return

  save('transactions', TX)
  save('budgets', BUDGETS)
  save('debts', DEBTS)
  save('wizard', { completed: true, skipped: false, profile: { name: 'Demo User' } })
  save('settings', {
    openaiKey:   '',
    openaiModel: 'gpt-4o-mini',
    pageSize:    50,
    customRules: [
      { keyword: 'NAVIENT', category: 'Debt Payment' },
      { keyword: 'NETFLIX', category: 'Subscriptions' },
    ],
    theme: 'dark',
  })
}
