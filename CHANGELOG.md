# Changelog

All notable changes to Fiscus are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [1.2.0] — 2025-03

### Added
- **Branding customization** — app name, tagline, logo URL configurable from Settings
- **8 color palettes** — Forest, Ocean, Purple, Sunset, Rose, Slate, Teal, Amber (each with dark and light variants)
- **Palette switcher** in Settings with live preview swatches
- **CSS custom property theming** — `--primary`, `--accent`, `--accent-light` driven by `palettes.js`
- `applyPalette(paletteId, isDark)` utility applies palette without full re-render

### Changed
- Sidebar now reads branding from localStorage (app name, tagline, logo)
- AI Advisor bubbles use CSS variables instead of hardcoded dark styles (fixes light mode display)

---

## [1.1.0] — 2025-02

### Added
- **AI Advisor** — GPT-4o powered financial chat with full data context
- **Persistent chat history** — sessions preserved in localStorage, "New Chat" button to reset
- **Floating AI assistant** — always-accessible overlay chat
- **AI Review queue** — batch categorization by keyword group with 80% approval threshold
- **AI Budget suggestions** — auto-suggest monthly amounts based on 90-day spending history
- **Payoff ETA** — debt payoff date calculator using compound interest
- **Extra-payment scenarios** — shows time saved and interest saved for +$50, +$100, +$200/month
- **Due day field** on debts — feeds "Upcoming Bills" timeline on Dashboard
- **Weekly finance workflow checklist** — 6-step guided review, auto-resets each Monday
- **Cash flow chart** — income vs. expense line chart with 90-day trailing average
- **Paycheck allocation panel** — maps income to budgets and upcoming bills

### Fixed
- Debt tracker styling: replaced hardcoded dark-mode classes with CSS variables for correct light mode display

---

## [1.0.0] — 2025-01

### Added
- **Initial release**
- Dashboard overview with KPI cards (net savings, total income, total expenses)
- Transaction ledger — full CRUD, search, filter, inline category editing
- CSV import — drag-and-drop with auto-format detection
- Rule-based auto-categorization (`categorizer.js`)
- Budget tracking — monthly targets per category with progress bars and overspend alerts
- Debt tracker — balance, APR, monthly payment fields
- Secure local authentication — SHA-256 password hashing via SubtleCrypto
- Per-user localStorage namespacing (`fiscus_u_{username}_{key}`)
- First-run setup wizard
- Dark / light mode with system preference detection
- Demo mode — one-click login with synthetic seed data
- Responsive layout (mobile, tablet, desktop)
