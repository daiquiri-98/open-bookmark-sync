Developers Guide — Open Bookmark Sync

Overview
- Chrome/Brave MV3 extension that syncs Raindrop.io collections with the browser Bookmarks Bar.
- Modes: one‑way import, additions‑only (default), mirror (add/update/delete), upload‑only.
- OAuth2 via `chrome.identity`, rate‑limit friendly API calls, local ID mapping to prevent loops.

Repository Structure
- Root
  - `README.md` — Public user guide (English). Install, usage, permissions.
  - `CHANGELOG.md` — Version history and notable changes.
  - `ROADMAP.md` — Planned features and priorities.
  - `scripts/` — Utility scripts (e.g., packaging).
  - `dist/` — Build artifacts (Store‑ready ZIPs). Safe to delete.
  - `extension/` — MV3 source loaded as unpacked or zipped for the Store.
- extension/
  - `manifest.json` — MV3 manifest (permissions, background, action/popup, icons, version).
  - `background.js` — Service worker: schedules/runs sync, API calls, add/update/delete, cleanup.
  - `oauth.js` — OAuth2 (authorize, exchange, refresh, test) via `chrome.identity`.
  - `options.html` / `options.js` — Settings UI and logic (connection, sync, sorting, maintenance, resources).
  - `popup.html` / `popup.js` — Toolbar popup: quick sync, auth/logout, interval/mode.
  - `bookmarks-sync.js`, `raindrop-api.js` — Legacy helpers (kept for reference).
  - `icon16.png`, `icon64.png`, `icon128.png` — Declared icons. `icon512.png` for listing visuals.

Extension Architecture
- Core components
  - Background (`background.js`): orchestrates sync via chrome.alarms; handles rate limits, retries, token refresh; supports modes `additions_only`, `mirror`, `off`, `upload_only`; collection filtering and sorting.
  - OAuth (`oauth.js`): authorization code flow; stores/refreshes tokens; connection tests.
  - Options (`options.js/html`): configuration UI; collection selection, target folder, interval/RPM, maintenance tools.
  - Popup (`popup.js/html`): quick actions and status.
- Authentication flow
  1) User enters Client ID/Secret from Raindrop Developer Console.
  2) `chrome.identity.launchWebAuthFlow` for OAuth; redirect URI is `https://<EXTENSION_ID>.chromiumapp.org/`.
  3) Tokens saved; refresh handled automatically.
- Sync model
  - One‑way (Raindrop → Browser) when mode is `off`.
  - Additions‑only (default): never deletes.
  - Mirror: add/update/delete; treats browser as mirror of Raindrop.
  - Upload‑only: Browser → Raindrop.
- Data mapping
  - Collections → bookmark folders; raindrops → bookmarks.
  - Local ID mapping prevents loops/duplication.
- Rate limiting
  - Configurable RPM (default ~60); respects Retry‑After; exponential backoff for 429/503.

Development Guidelines
- Code style: ES6+, class‑based where applicable; async/await; focused, minimal diffs; match existing naming.
- Storage: `chrome.storage.sync` for settings/tokens; `chrome.storage.local` for mapping/ephemeral state.
- UI: responsive layout; consistent control sizes; debounce noisy inputs.
- Errors: user‑friendly messages; graceful recovery; refresh on 401; paced retries.

Local Setup & Testing
- Load unpacked: `chrome://extensions` → Developer mode → “Load unpacked” → select `extension/`.
- Use Popup for quick actions; Options for full configuration.
- Inspect service worker logs from the extensions page for debugging.

Workflow & Release
- File focus order: background (sync logic) → oauth (auth) → options/popup (UI) → manifest (permissions/version).
- Testing checklist: OAuth flow; each sync mode; rate‑limit handling; error recovery; settings persistence.
- Release steps:
  1) Bump `version` in `extension/manifest.json`.
  2) Update `CHANGELOG.md`.
  3) Sanity test on a fresh profile.

Packaging & Publishing (Chrome Web Store)
- Preferred packaging
  - Run: `bash scripts/pack-extension.sh`
  - Output: `dist/open-bookmark-sync-<version>.zip` (upload this ZIP to the Chrome Web Store).
  - Script excludes junk, archives, and any keys (`*.pem`, `*.crx`).
- Manual alternative
  - Zip the contents of `extension/` only; exclude `.pem`, `.crx`, `.zip`, `.DS_Store`.
- OAuth setup
  - Create app at https://raindrop.io/developer.
  - Redirect URI must match `https://<EXTENSION_ID>.chromiumapp.org/` (visible in Options).
  - Users enter Client ID/Secret in Options; nothing is committed to the repo.
- Permissions
  - Keep minimal: `bookmarks`, `storage`, `alarms`, `identity`; host access for `https://api.raindrop.io/*` as needed.
- Pre‑publish checklist
  - [ ] Manifest version bumped
  - [ ] Fresh packaging ZIP in `dist/`
  - [ ] Auth + “Sync Now” work; chosen mode behaves as expected
  - [ ] No secrets in source; `.pem` stored outside the repo
  - [ ] Listing text/screenshots updated (use `icon512.png` for visuals)

Notes & Guardrails (for automation/AI)
- Do not add large dependencies or build tooling.
- Avoid storing secrets; never include `.pem` under `extension/`.
- Keep patches focused; document permission or packaging changes in `CHANGELOG.md`.

Meta
- Maintainer: @dagkan
- Last updated: 2025‑09‑27
