# Contributing to Fiscus

Thank you for your interest in contributing! This is an open-source project and all contributions are welcome.

---

## Getting Started

```bash
git clone https://github.com/thomasjvalenzuela/fiscus-ai-finance.git
cd fiscus-ai-finance
npm install
npm run dev
```

The dev server starts at [http://localhost:5173](http://localhost:5173).

---

## How to Contribute

### Reporting Bugs

Use the **Bug Report** issue template. Please include:
- Steps to reproduce
- Expected vs. actual behavior
- Browser and OS version
- Console errors if any (F12 → Console)

### Suggesting Features

Use the **Feature Request** issue template. Describe the problem you're trying to solve, not just the solution — it helps with discussion.

### Submitting a Pull Request

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes
4. Run the build to confirm nothing is broken: `npm run build`
5. Push and open a PR against `main`

Use the PR template — it only takes a minute to fill out.

---

## Code Style

- React functional components and hooks only (no class components)
- Tailwind CSS utility classes for layout and spacing
- CSS custom properties (`var(--primary)` etc.) for theme colors — do not hardcode color values
- localStorage access must go through `storage.js` (never call `localStorage` directly in components)
- No TypeScript in this project (plain JSX/JS)

---

## Adding a New Page / Module

1. Create `src/components/YourPage.jsx`
2. Register it in `App.jsx` — follow the existing pattern for navigation items
3. If you need new storage keys, add them to `storage.js` with a getter, setter, and entry in `clearAll()`

---

## Project Philosophy

- **No backend.** Everything must work without a server. If a feature requires a backend, it should be clearly optional and documented.
- **No forced accounts.** Demo mode should always be available without sign-up.
- **Privacy by default.** No tracking, no analytics, no third-party data collection.
- **Keep it simple.** This is a personal finance tool, not enterprise software. Avoid abstractions that aren't justified by current requirements.

---

## Questions?

Open a [GitHub Discussion](https://github.com/thomasjvalenzuela/fiscus-ai-finance/discussions) or an issue tagged `question`.
