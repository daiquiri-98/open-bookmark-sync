Cloudflare Worker OAuth Proxy for Raindrop.io

Overview
- This Worker keeps your Raindrop OAuth client secret server‑side and provides a unified OAuth flow for all browsers/extensions.
- The Chrome/Edge/Firefox extension launches the Worker for login, which then redirects back to the extension with a one‑time session code. The extension exchanges that for tokens via the Worker.

Endpoints
- GET /auth/start?ext_redirect=<extension_redirect>
  - Creates a state in KV, redirects to Raindrop authorize URL.
- GET /auth/callback
  - Validates state, exchanges code->token with Raindrop, stores tokens in KV with a short TTL, redirects to ext_redirect with session_code.
- GET /auth/fetch?session_code=...
  - Returns tokens once, then deletes them.
- POST /token/refresh { refresh_token }
  - Exchanges refresh_token for a new access_token server‑side.

Setup
1) Create KV Namespace: SESSIONS
2) Add Secrets:
   - RAINDROP_CLIENT_ID
   - RAINDROP_CLIENT_SECRET
3) Add Env Var:
   - PUBLIC_BASE_URL = https://raindrop-oauth.yourdomain.com
4) Map custom domain (e.g., raindrop-oauth.daiquiri.dev) to the Worker.

wrangler.toml (example)
```
name = "raindrop-oauth-proxy"
main = "worker.js"
compatibility_date = "2024-09-01"

kv_namespaces = [
  { binding = "SESSIONS", id = "<kv-id>" }
]

[vars]
PUBLIC_BASE_URL = "https://raindrop-oauth.daiquiri.dev"
```

Publish
- wrangler publish

Security
- session_code is single‑use with short TTL.
- Client secret never leaves the Worker.
- Consider adding basic rate limiting.

Notes
- If Raindrop adds PKCE, you could remove secret usage entirely and still keep a single redirect.

