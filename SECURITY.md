# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x | Yes |

## Security Model

Fiscus is a zero-backend, client-side-only application. Understanding what this means for security:

### What Fiscus does

- **Stores all data in `localStorage`** — scoped to your browser and domain. Data never leaves your device except as described below.
- **Hashes passwords with SHA-256** via the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto). The plain-text password is never stored or logged anywhere.
- **Makes direct API calls to `api.openai.com`** — only when AI features are used and an OpenAI key is configured. No intermediate server is involved.

### What Fiscus does NOT do

- No analytics, tracking scripts, or telemetry
- No cookies (beyond browser default behavior for the page)
- No backend server — there is nothing to breach on a server
- No third-party SDKs that phone home
- No data synchronization or cloud backup

### Known limitations

- **`localStorage` is not encrypted.** Anyone with physical access to your device and browser can read your financial data from DevTools. Do not use Fiscus on a shared computer.
- **SHA-256 is a hash, not a key derivation function.** The authentication system is designed for personal use, not multi-user enterprise environments. It protects against casual access, not determined attackers with device access.
- **OpenAI API key stored in `localStorage`.** This is readable from the DevTools console. Treat it like any other browser-stored credential and regenerate it if your device is compromised.

### Demo mode

The "Try Demo" login loads 100% synthetic, randomly generated financial data. No real transaction data, account numbers, or personal information is included.

---

## Reporting a Vulnerability

If you discover a security issue in Fiscus:

1. **Do not open a public GitHub issue.**
2. Email a description to the repository owner (see GitHub profile for contact).
3. Include steps to reproduce, the potential impact, and any suggested fix.
4. You will receive a response within 7 days.

We appreciate responsible disclosure.
