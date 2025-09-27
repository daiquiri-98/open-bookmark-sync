Cloudflare Worker OAuth Proxy for Raindrop.io

Overview
- Provides a fixed OAuth redirect at `https://<PUBLIC_BASE_URL>/auth/callback` so every browser uses the same URI.
- Keeps the Raindrop OAuth client secret server-side and hands tokens back to the extension with a single-use session code.
- Adds CORS helpers so the browser extension can call the Worker for token refreshes without extra configuration.

Endpoints
- GET /auth/start?ext_redirect=<extension_redirect>
  - Stores the extension redirect URL and sends the user to the Raindrop authorize page.
- GET /auth/callback
  - Exchanges the authorization code for tokens and redirects back to the extension with `session_code`.
- GET /auth/fetch?session_code=...
  - Returns tokens once and clears the session value.
- POST /token/refresh { refresh_token }
  - Exchanges a refresh token for a new access token (supports CORS/OPTIONS).
- OPTIONS *
  - Handles preflight requests for the POST endpoint.

Setup
1. Create KV Namespace: `SESSIONS`.
2. Add Secrets:
   - `RAINDROP_CLIENT_ID`
   - `RAINDROP_CLIENT_SECRET`
3. Environment variables:
   - `PUBLIC_BASE_URL` e.g. `https://raindrop-oauth.example.com`
   - `CORS_ALLOW_ORIGIN` (optional, defaults to `*`) e.g. `chrome-extension://<extension-id>`
4. Map a custom domain (e.g. `raindrop-oauth.example.com`) to the Worker so the redirect URI is stable.

wrangler.toml (example)
```
name = "raindrop-oauth-proxy"
main = "worker.js"
compatibility_date = "2024-09-01"

kv_namespaces = [
  { binding = "SESSIONS", id = "<kv-id>" }
]

[vars]
PUBLIC_BASE_URL = "https://raindrop-oauth.example.com"
CORS_ALLOW_ORIGIN = "chrome-extension://<extension-id>"
```

Publish
- `wrangler publish`

Security
- `session_code` entries are single-use with short TTLs (2 minutes by default).
- The client secret never leaves the Worker and redirect URI remains constant.
- Consider adding rate limiting via Durable Objects or Workers for Platforms.

