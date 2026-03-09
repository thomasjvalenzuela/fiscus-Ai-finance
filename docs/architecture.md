# Architecture

## Overview

Fiscus is a **zero-backend single-page application (SPA)** built with React 18 and Vite. There is no server, no database, and no API layer — all state is stored in the browser's `localStorage`.

The app is designed to be deployed as a static site on any CDN or file host.

---

## System Diagram

```
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│                                                   │
│  ┌────────────────────────────────────────────┐   │
│  │           React SPA (Vite build)           │   │
│  │                                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────┐  │   │
│  │  │  Auth    │  │   UI     │  │ Theming │  │   │
│  │  │ layer    │  │ layer    │  │ layer   │  │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬────┘  │   │
│  │       │             │             │        │   │
│  │  ┌────▼─────────────▼─────────────▼────┐  │   │
│  │  │          Storage layer               │  │   │
│  │  │        (storage.js)                  │  │   │
│  │  └──────────────────┬───────────────────┘  │   │
│  │                     │                      │   │
│  └─────────────────────┼──────────────────────┘   │
│                        │                          │
│  ┌─────────────────────▼──────────────────────┐   │
│  │            localStorage                     │   │
│  │  fiscus_u_{user}_transactions               │   │
│  │  fiscus_u_{user}_budgets                    │   │
│  │  fiscus_u_{user}_debts                      │   │
│  │  fiscus_u_{user}_settings                   │   │
│  │  fiscus_u_{user}_chat_history               │   │
│  │  fiscus_users   (hashed credentials)        │   │
│  │  fiscus_session (active session token)      │   │
│  └─────────────────────────────────────────────┘   │
│                                                   │
└──────────────────────────────────────────────────┘
                          │
                (optional) │ HTTPS
                          ▼
              ┌───────────────────────┐
              │   api.openai.com      │
              │  (GPT-4o, AI features)│
              └───────────────────────┘
```

---

## Layer Descriptions

### Auth Layer (`src/lib/authStore.js`)

Handles user registration, login, and session management.

- Passwords are hashed with `SubtleCrypto.digest('SHA-256', ...)` before storage
- User records stored as `{ username, passwordHash }` in `fiscus_users`
- Active session stored in `fiscus_session` as `{ username, token }`
- Demo mode creates a special `__demo__` session that bypasses password validation

### Storage Layer (`src/lib/storage.js`)

Single abstraction over `localStorage`. Components never call `localStorage` directly.

- `storage.setUser(username)` sets the active user prefix
- All data reads/writes use `fiscus_u_{username}_{key}` when a user is active
- Falls back to `fiscus_{key}` for global (non-user-scoped) settings
- `storage.clearAll()` removes all user-scoped keys for the active user

### UI Layer (`src/components/`)

React functional components using hooks. No class components.

- `App.jsx` — root component, manages auth state, active page, date range, theme
- `Dashboard.jsx` — aggregated summary view; derives all display data from `transactions`, `budgets`, `debts` props
- Other pages receive data via props from `App.jsx` (no global state management library)

### Theming Layer (`src/lib/palettes.js`)

8 color palettes, each with a `light` and `dark` variant.

- `applyPalette(paletteId, isDark)` calls `document.documentElement.style.setProperty()` to override CSS variables
- Inline styles have higher specificity than class-level CSS, ensuring palette colors always win
- CSS variables used: `--primary`, `--primary-hover`, `--accent`, `--accent-light`
- Dark/light mode controlled via `class="dark"` on `<html>` (Tailwind dark mode strategy)

---

## Data Flow

```
User action (e.g., add transaction)
  → Component calls storage.saveTransactions([...])
  → storage.js writes to localStorage
  → App.jsx re-reads via storage.getTransactions()
  → State update triggers re-render
  → Dashboard / charts receive new props
```

No Redux, no Zustand, no Context for data. `App.jsx` owns state, passes it down as props. This keeps the architecture simple and easy to follow.

---

## CSV Import Flow

```
User drops CSV file
  → Papa Parse parses raw text → array of row objects
  → Format detected from column headers
  → Rows mapped to internal Transaction shape
  → Deduplication by transaction ID
  → storage.saveTransactions([...existing, ...new])
```

---

## AI Integration

AI features are entirely optional and additive:

- **AI Categorization** — sends uncategorized transaction descriptions to OpenAI; returns suggested categories
- **AI Advisor** — sends current financial summary + chat history to OpenAI; returns conversational response
- **AI Budget** — sends 90-day category spending totals; returns suggested monthly budget amounts

All calls go directly from the browser to `api.openai.com` using the `Authorization: Bearer {key}` header. No proxy, no server middleware.

---

## Build Output

`npm run build` produces a `dist/` directory containing:
- `index.html` (entry point for all routes — SPA)
- `assets/` (hashed JS and CSS bundles)

All routes are handled client-side. When deploying, configure your host to serve `index.html` for all paths (see `docs/deployment.md`).
