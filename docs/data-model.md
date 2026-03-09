# Data Model

All data is stored in the browser's `localStorage`. This document describes the key schema for every stored record type.

---

## Key Naming Convention

```
fiscus_users              — global: array of all registered users
fiscus_session            — global: active session object
fiscus_u_{username}_{key} — per-user data, where {key} is one of the entries below
```

---

## Users and Sessions

### `fiscus_users`
```json
[
  {
    "username": "alice",
    "passwordHash": "e3b0c44298fc1c149afb..."
  }
]
```

`passwordHash` is a hex-encoded SHA-256 hash of the user's password. The plain-text password is never stored.

### `fiscus_session`
```json
{
  "username": "alice",
  "token": "random-uuid-v4"
}
```

---

## Transactions

**Key:** `fiscus_u_{username}_transactions`

```json
[
  {
    "id": "tx_1700000001000_a1b2c3",
    "date": "2025-01-15",
    "description": "Whole Foods Market",
    "amount": -87.43,
    "category": "Groceries",
    "account": "Chase Checking",
    "notes": "",
    "reviewed": true
  }
]
```

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | `tx_{timestamp}_{random}` — unique per transaction |
| `date` | `string` | ISO 8601 date (`YYYY-MM-DD`) |
| `description` | `string` | Merchant name or description as imported |
| `amount` | `number` | Negative = expense, positive = income |
| `category` | `string` | Must match a value from the categories list |
| `account` | `string` | Free-text account label |
| `notes` | `string` | Optional user notes |
| `reviewed` | `boolean` | `true` once user has confirmed category |

---

## Budgets

**Key:** `fiscus_u_{username}_budgets`

```json
[
  {
    "id": "bgt_1700000001000_d4e5f6",
    "category": "Groceries",
    "amount": 500,
    "period": "monthly"
  }
]
```

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique identifier |
| `category` | `string` | Must match a transaction category |
| `amount` | `number` | Monthly target in dollars |
| `period` | `string` | Always `"monthly"` in v1 |

---

## Debts

**Key:** `fiscus_u_{username}_debts`

```json
[
  {
    "id": "dbt_1700000001000_g7h8i9",
    "name": "Chase Sapphire Card",
    "balance": 4820.00,
    "apr": 24.99,
    "minPayment": 110,
    "dueDay": 15,
    "type": "credit_card"
  }
]
```

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique identifier |
| `name` | `string` | User-defined label |
| `balance` | `number` | Current outstanding balance |
| `apr` | `number` | Annual percentage rate (e.g., `24.99` for 24.99%) |
| `minPayment` | `number` | Minimum monthly payment |
| `dueDay` | `number` | Day of month the payment is due (1–31). Used by Dashboard "Upcoming Bills". |
| `type` | `string` | `credit_card`, `student_loan`, `auto`, `personal`, `mortgage`, `other` |

---

## Settings

**Key:** `fiscus_u_{username}_settings`

```json
{
  "openaiKey": "sk-...",
  "openaiModel": "gpt-4o-mini",
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "theme": "dark",
  "rules": [
    { "keyword": "netflix", "category": "Subscriptions" },
    { "keyword": "spotify", "category": "Subscriptions" }
  ]
}
```

---

## Branding

**Key:** `fiscus_u_{username}_branding`

```json
{
  "appName": "Fiscus",
  "tagline": "AI-Powered Finance",
  "logoUrl": "",
  "palette": "forest"
}
```

`palette` must be one of: `forest`, `ocean`, `purple`, `sunset`, `rose`, `slate`, `teal`, `amber`.

---

## Chat History

**Key:** `fiscus_u_{username}_chat_history`

```json
[
  { "role": "user",      "content": "How much did I spend on dining last month?" },
  { "role": "assistant", "content": "Last month you spent $342 on dining across 18 transactions..." }
]
```

Each entry is an OpenAI message object (`role`: `user` | `assistant`).

---

## Workflow Checklist

**Key:** `fiscus_u_{username}_workflow_checklist`

```json
{
  "week": "2025-W04",
  "done": {
    "import": true,
    "categorize": false,
    "bills": false,
    "spending": false,
    "budgets": false,
    "paycheck": false
  }
}
```

`week` is in `YYYY-WWW` format. If the stored `week` doesn't match the current week, the checklist resets automatically.

---

## Import History

**Key:** `fiscus_u_{username}_import_history`

```json
[
  {
    "id": "imp_1700000001000",
    "date": "2025-01-20T14:32:00.000Z",
    "filename": "transactions-jan.csv",
    "rowCount": 47,
    "newCount": 38,
    "duplicateCount": 9,
    "format": "bank_csv"
  }
]
```
