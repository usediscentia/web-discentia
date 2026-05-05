# Security Policy

## Scope

Discentia is a client-only app. All data lives in your browser's IndexedDB. API keys are encrypted with AES-GCM using a device-local key via the Web Crypto API before being written to `localStorage`. Nothing is sent to any Discentia server.

Areas relevant to security:

- `src/lib/crypto.ts` — AES-GCM key generation and encrypt/decrypt for API keys
- `src/app/api/github/` — server-side proxy routes for GitHub Copilot OAuth (the only routes with network access to external services)
- `src/services/storage/database.ts` — IndexedDB schema

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Open a [GitHub Security Advisory](https://github.com/usediscentia/web-discentia/security/advisories/new) instead. You will receive a response within 7 days.

Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix, if you have one

## Supported versions

Only the latest commit on `main` is supported.
