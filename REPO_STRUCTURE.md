# Repository Structure and Purpose

This document explains what each folder and key file does in this project, so you can quickly navigate, build, and publish the extension.

## Root
- `README.md` — Overview, features, install instructions (EN + TR).
- `GUIDE.md` — In‑depth guide (architecture, flows, screens).
- `CHANGELOG.md` — Notable changes across versions.
- `ROADMAP.md` — Planned features and priorities.
- `PACKAGING.md` — Safe packaging steps for Chrome Web Store and optional CRX.
- `.gitignore` — Excludes OS junk, logs, node_modules, archives, `*.crx`, `*.pem` and the local blog post.
- `BLOG_POST.md` — Local draft; ignored by Git (won’t be pushed to GitHub).
- `dist/` — Build artifacts (generated ZIPs ready for Web Store). Not used at runtime.
- `scripts/` — Utility scripts (e.g., packaging).
- `extension/` — The actual MV3 extension source (what you load unpacked or zip for the Store).
- `cloudflare/` — WIP OAuth proxy (optional, server‑side) for a future “one‑click” auth.
- `oauth guide/` — Saved reference docs from Raindrop/MDN (for local reading only).

## scripts/
- `pack-extension.sh` — Creates a clean ZIP from `extension/` for the Chrome Web Store.
  - Excludes `*.pem`, `*.crx`, `*.zip`, `.DS_Store`, and dev tools.
  - Output goes to `dist/open-bookmark-sync-<version>.zip`.

## dist/
- `open-bookmark-sync-<timestamp>.zip` — Store‑ready source package(s). Safe to delete/regenerate.
- `.gitkeep` — Keeps the directory tracked while artifacts are ignored.

## extension/ (Manifest V3 code)
This folder is the unpacked extension. Load this in `chrome://extensions` (Developer mode → Load unpacked), or zip it for the Store.

- `manifest.json` — MV3 manifest. Declares permissions, background service worker, action popup, icons, and version.
- `background.js` — Service worker. Schedules and runs sync; talks to Raindrop API; handles duplicates/cleanup.
- `oauth.js` — OAuth2 flow with Raindrop (authorize, code exchange, refresh, connection test). Uses `chrome.identity`.
- `options.html` — Full settings UI (Raindrop connection, sync settings, maintenance, resources).
- `options.js` — Logic for the options page: loads/saves settings, triggers auth, syncs now, cleanup tools.
- `popup.html` — Compact toolbar popup UI.
- `popup.js` — Popup logic: quick auth/logout, interval/mode selection, “Sync Now”.
- `bookmarks-sync.js` — Legacy/simple one‑shot import helpers (not used by MV3 background, kept for reference).
- `raindrop-api.js` — Legacy API helpers (direct calls), superseded by `background.js`/`oauth.js` flow.
- `icon16.png`, `icon64.png`, `icon128.png` — Extension icons used by Chrome.
- `icon.png` — Source artwork you provided (basis for exported sizes).
- `icon512.png` — Large artwork (useful for the Web Store listing). Not referenced by the manifest.

### extension/assets/
- `export-icons.html` — Local tool to generate `icon16/64/128/512.png` from `icon.png` or `icon.svg` in the browser.
- `LOGO_README.md` — Notes about the logo/icon style.

## cloudflare/ (Optional, future)
- `README.md` — How to set up a Cloudflare Worker as an OAuth proxy.
- `worker.js` — Worker implementation (auth start/callback/fetch, token refresh). Disabled in the extension by default.

## oauth guide/
- `*.html` & `*_files/` — Saved documentation pages (Raindrop authentication and MDN reference). Not used by the extension.

---

## Typical Workflows

- Development (unpacked):
  1. Open `chrome://extensions` → Enable Developer mode → “Load unpacked” → pick `extension/`.
  2. Edit files in `extension/` and reload the extension.

- Package for Chrome Web Store:
  1. Update version in `extension/manifest.json`.
  2. Run `bash scripts/pack-extension.sh`.
  3. Upload the generated ZIP from `dist/` to the Chrome Web Store.

- OAuth setup (direct mode):
  1. Create an app at Raindrop Developer Console.
  2. Add the redirect URI shown in Options (`chrome.identity.getRedirectURL()`).
  3. Enter Client ID/Secret in Options and Authenticate.

- Security notes:
  - No Client ID/Secret are stored in the repo; users enter them in Options and they’re saved locally.
  - Do not store `.pem` (signing key) in the repo. Git already ignores `*.pem`.

