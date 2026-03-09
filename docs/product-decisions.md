# Product Decisions

This document explains the "why" behind key design choices in Fiscus. These aren't rationalizations after the fact — they reflect trade-offs that were deliberately evaluated.

---

## Why no backend?

**Decision:** All data stored in `localStorage`. No server, no database, no accounts to create.

**Why:**
- Personal finance data is sensitive. Removing the server removes an entire attack surface.
- No backend means no hosting costs, no server maintenance, and no data breach liability.
- Users who distrust "yet another finance app with a server" can verify the network tab themselves — the only outbound calls are to `api.openai.com`.
- Static deployment is trivial (Vercel, Netlify, GitHub Pages in minutes).

**Trade-off:** Data is not synced across devices. This is an acceptable limitation for a personal tool. Multi-device sync is planned as an optional feature (via encrypted export/import), not a default.

---

## Why SHA-256 instead of bcrypt/scrypt?

**Decision:** Passwords hashed with `SubtleCrypto SHA-256` (browser-native).

**Why:**
- `bcrypt` and `scrypt` are not available in the Web Crypto API without a third-party library.
- Adding a crypto library adds bundle size and a dependency attack surface.
- The auth system is designed to protect against casual access (someone sitting at your computer), not against offline dictionary attacks on a stolen `localStorage` dump.

**Trade-off:** SHA-256 without a salt or work factor is weaker than bcrypt for an offline attacker with device access. This is documented in `SECURITY.md`. For the single-user, personal-device use case this targets, the trade-off is acceptable.

---

## Why Recharts instead of D3?

**Decision:** Recharts for all charts.

**Why:**
- D3 has a steep learning curve and is designed for maximum flexibility, not for building standard chart types quickly.
- Recharts wraps D3 in React-friendly components with sensible defaults. The line chart, donut, and bar chart needed here are all standard types.
- Recharts integrates cleanly with React re-renders; D3 requires manual DOM management in a React app.

**Trade-off:** Less flexibility for custom or exotic chart types. Not a concern for this app's use case.

---

## Why no Redux / Zustand / Context for data?

**Decision:** `App.jsx` owns state; data passed via props.

**Why:**
- The app has one authenticated user, one active page, and a handful of data arrays (transactions, budgets, debts). Global state management adds complexity that isn't justified at this scale.
- Prop drilling is only 1–2 levels deep. This is readable and debuggable without tooling.
- Avoiding a state management library keeps the bundle smaller and the architecture easier to onboard to.

**Trade-off:** If the app grows significantly in scope (many nested components needing data), this pattern would need to be revisited. React Context would be the first step before reaching for a library.

---

## Why localStorage, not IndexedDB?

**Decision:** `localStorage` for all storage.

**Why:**
- `localStorage` has a synchronous, simple API that doesn't require async/await threading through every data access.
- For the data volume expected in personal finance (hundreds to low thousands of transactions), `localStorage` performs fine.
- The 5–10 MB `localStorage` limit is unlikely to be hit for this use case.

**Trade-off:** `localStorage` blocks the main thread on large reads/writes. IndexedDB would be appropriate if the transaction count regularly exceeded ~10,000 rows. This is noted as a v2 migration path.

---

## Why Papa Parse instead of a custom CSV parser?

**Decision:** Papa Parse for CSV import.

**Why:**
- CSV is deceptively complex (quoted fields, escaped commas, different line endings, BOM characters, encoding edge cases).
- Papa Parse handles all of these reliably and is battle-tested across millions of real-world files.
- A custom parser would re-solve a solved problem while introducing bugs for edge-case files.

**Trade-off:** Bundle size. Papa Parse is ~25 KB minified. Worth it.

---

## Why no TypeScript?

**Decision:** Plain JavaScript with JSX.

**Why:**
- This project was built iteratively, focusing on product functionality over type infrastructure.
- Adding TypeScript to a completed project requires a large, high-risk migration that doesn't add features.
- The codebase is small enough that function signatures are readable from the code itself.

**Trade-off:** No compile-time type checking. TypeScript support is listed as a future refactor candidate for a v2 rewrite.

---

## Why a demo mode instead of sample screenshots?

**Decision:** Click "Try Demo" to load a fully functional app with realistic synthetic data.

**Why:**
- Screenshots go stale. A live demo always shows the actual current state of the app.
- Letting someone interact with the real app in 30 seconds is more convincing than any screenshot.
- The demo seed (`demoSeed.js`) provides a controlled, realistic dataset that exercises every feature — budgets, debts with payoff ETAs, transactions across categories, AI advisor history, and checklist state.

**Trade-off:** Slightly larger bundle (demo data adds ~5 KB). Worth it.
