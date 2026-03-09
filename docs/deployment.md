# Deployment Guide

Fiscus is a static SPA — build once, host anywhere.

---

## Building

```bash
npm run build
```

This creates a `dist/` folder containing `index.html` and `assets/` (hashed JS/CSS bundles). The entire `dist/` folder is your deployable artifact.

---

## Option 1: Vercel (Recommended)

Vercel auto-detects Vite projects and handles everything.

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Framework preset: **Vite** (auto-detected)
5. Click **Deploy**

Vercel handles SPA routing automatically. No extra configuration needed.

**Adding an environment variable (OpenAI key):**
- Dashboard → Your Project → Settings → Environment Variables
- Add `VITE_OPENAI_API_KEY` = your key

---

## Option 2: Netlify

### Via drag-and-drop (fastest)

```bash
npm run build
# Drag the dist/ folder to app.netlify.com/drop
```

### Via GitHub repo

1. Connect repo at [app.netlify.com](https://app.netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`

**Required: SPA redirect rule**

Create `public/_redirects` with:
```
/*    /index.html   200
```

This ensures deep links work (e.g., navigating directly to `/budget`).

---

## Option 3: GitHub Pages

1. Install the deploy helper:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json` scripts:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```

3. Add `base` to `vite.config.js`:
   ```js
   export default {
     base: '/fiscus-ai-finance/',   // your repo name
   }
   ```

4. Build and deploy:
   ```bash
   npm run build
   npm run deploy
   ```

5. In your GitHub repo → **Settings → Pages** → Source: `gh-pages` branch → `/ (root)`

---

## Option 4: Any static file host (S3, Cloudflare Pages, etc.)

```bash
npm run build
# Upload the contents of dist/ to your host
```

Configure your host to serve `index.html` for all 404 responses (required for client-side routing).

---

## Local Production Preview

```bash
npm run build
npm run preview
```

Opens a local server at `http://localhost:4173` serving the production build. Useful for testing before deploying.

---

## Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

For production, set environment variables in your hosting platform's dashboard (not in a committed `.env` file).

Only variables prefixed with `VITE_` are exposed to the browser bundle.

---

## Performance Notes

The production build is ~400–600 KB (gzipped ~150–200 KB) depending on tree-shaking results. Main bundle contributors:
- Recharts + D3 internals: ~120 KB
- React + React DOM: ~45 KB
- Everything else: ~50 KB

No lazy loading is implemented in v1. Adding `React.lazy()` for page components is a straightforward v1.x improvement if initial load performance matters for your deployment.
