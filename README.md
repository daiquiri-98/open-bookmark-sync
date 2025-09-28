# Open Bookmark Sync (Chrome/Brave, MV3)

Synchronize your Raindrop.io collections with the browser Bookmarks Bar. Supports one‑way import, two‑way additions‑only, or full mirror, with sorting, rate‑limit safety and a compact toolbar popup.

**Links**: [Privacy Policy](PRIVACY.md) | [Support](https://buymeacoffee.com/daiquiri) | [Issues](https://github.com/daiquiri-98/open-bookmark-sync/issues)

## Overview

Features
- Direct to Bookmarks Bar: Creates collection‑named folders at the root of the bar
- Two‑way modes: additions_only (default), mirror (add/update/delete), off (one‑way → browser)
- Sorting: per‑folder bookmark order and collection folder order
- Manual + scheduled sync: interval configurable (1–60+ min)
- OAuth2 via chrome.identity with token refresh
- Rate‑limit aware: paced requests + Retry‑After/exponential backoff
- Toolbar popup: quick sync, auth/logout, interval and mode selectors
- Options page: full settings with responsive 2‑column layout

Install (unpacked)
1) Clone or download this repository
2) Open `chrome://extensions` (or Brave equivalent) and enable Developer mode
3) Click “Load unpacked” and select the `extension/` folder
4) Pin the extension to access the popup easily

OAuth Setup (Raindrop.io)
- Create an app at https://raindrop.io/developer
- Redirect URI: `https://<EXTENSION_ID>.chromiumapp.org/`
- Enter Client ID/Secret in Options and authenticate

Usage
- Popup: Sync Now, Authenticate/Logout, set Interval, choose Two‑way Mode
- Options: choose target folder, interval, sorting, max requests/min

How It Works
- Collections → folders; Raindrops → bookmarks
- ID mapping saved locally to prevent loops
- Background alarms schedule sync; API calls paced with backoff

Rate Limits
- No official public quotas found; configurable RPM (default 60) + Retry‑After/backoff

Permissions
- `bookmarks`, `storage`, `alarms`, `identity`, host permissions for `raindrop.io`

Troubleshooting
- Ensure Redirect URI matches `https://<EXTENSION_ID>.chromiumapp.org/`
- Check service worker logs in `chrome://extensions`

Development
- Key files: `manifest.json`, `background.js`, `oauth.js`, `options.html/js`, `popup.html/js`

## Privacy & Compliance

This extension is designed with privacy-first principles:

- **No data collection**: Zero telemetry, analytics, or user tracking
- **Local-only storage**: All data stored securely in Chrome's local storage
- **Minimal permissions**: Only requests necessary permissions for functionality
- **Transparent**: Open source with comprehensive privacy policy
- **Chrome Web Store compliant**: Meets all CWS developer program policies

See [PRIVACY.md](PRIVACY.md) for the complete privacy policy.

## Chrome Web Store Submission

For Chrome Web Store compliance:
- ✅ Privacy policy: [PRIVACY.md](PRIVACY.md)
- ✅ Manifest V3 compliance
- ✅ Minimal permission usage
- ✅ No data collection/telemetry
- ✅ Clear privacy disclosures
- ✅ GitHub homepage and support links

License: MIT
