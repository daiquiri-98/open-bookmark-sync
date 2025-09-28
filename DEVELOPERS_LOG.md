Developers Log — Open Bookmark Sync

Purpose
- Track operational changes (Workers, OAuth, UI) so future sessions with Codex/Claude have full context.

2025-09-28
- Cloudflare Worker (cloudflare/worker.js)
  - Added endpoints: /env-ok, /env-keys, /health for diagnostics.
  - Implemented Managed OAuth flow: /auth/start, /auth/callback, /auth/fetch, /token/refresh.
  - Session codes are HMAC-signed using SESSION_SECRET (no persistent storage).
  - Added compatibility shim to read bindings from both Module `env` and Service-Worker globals.
- Cloudflare config
  - Added cloudflare/wrangler.toml with name = "login-with-raindrop", main = "worker.js".
  - Added [vars] X_CHECK="1" (non-secret) to verify env bindings appear at runtime in Git deployments.
  - Note: Git-managed Workers require matching `name` to project; variables must be attached to the Production deployment.
- Extension (Managed OAuth)
  - extension/oauth.js: Enabled Managed OAuth; default base set to https://login-with-raindrop.hello-a71.workers.dev; respects stored `redirectUri` override.
  - extension/options.html/js: 
    - Managed toggle made selectable; Client ID/Secret disabled when Managed is ON.
    - Managed Base URL field is locked by default; added Edit/Lock button to override.
    - Redirect URI is now editable; default auto-filled via chrome.identity.
    - Added “Check Worker” button that calls /env-ok and shows inline status.
    - Visually softened disabled controls.
- Docs
  - Consolidated developer docs into DEVELOPERS_GUIDE.md.
  - Updated README to English-only and clarified unpacked install path (`extension/`).

Known Issue (under investigation)
- On the live Worker URL, /env-ok reports all bindings as false. Likely a Git-managed deployment binding scope issue, not code.
- Next remediation paths:
  1) Ensure variables are defined in Deployments → Environment variables (Production) for the project `login-with-raindrop`, then Redeploy.
  2) If still missing, use Wrangler CLI to bind secrets directly:
     - `cd cloudflare`
     - `wrangler secret put RAINDROP_CLIENT_ID` (enter value)
     - `wrangler secret put RAINDROP_CLIENT_SECRET` (enter value)
     - `wrangler secret put SESSION_SECRET` (enter value)
     - `wrangler deploy`
  3) As a sanity check, add a non-secret variable (e.g., `X_CHECK=1`) in the Dashboard → Environment variables and verify it appears in `/env-keys`.

Notes
- Managed mode requires Worker secrets; Direct mode requires local Client ID/Secret + identity Redirect URI.
- Avoid committing secrets in wrangler.toml; use Cloudflare variables or Wrangler secrets.
