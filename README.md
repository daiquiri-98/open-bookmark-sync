# Open Bookmark Sync

![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Compliant-brightgreen.svg)

> Synchronize your Raindrop.io collections with Chrome/Brave bookmarks. Features one‑way import, two‑way sync, automatic backups, and smart cleanup tools.

**Links**: [Privacy Policy](PRIVACY.md) | [Roadmap](ROADMAP.md) | [Changelog](CHANGELOG.md) | [Support](https://buymeacoffee.com/daiquiri) | [Issues](https://github.com/daiquiri-98/open-bookmark-sync/issues)

## ✨ What's New in v1.3.0

- **🎯 Chrome Web Store Compliant**: Removed all remote code dependencies
- **💾 HTML Backup Export**: Automatic JSON + HTML backup downloads (Netscape format)
- **🔧 Bug Fixes**: Fixed emergency restore, empty bookmark titles preservation
- **🎨 UI Improvements**: Reorganized sidebar with "Raindrop.io Sync" category
- **🛠 Tools Enhancement**: New Danger Zone section for advanced operations
- **📉 Streamlined**: Reduced from 6 to 5 tabs, cleaner navigation

[View full changelog →](CHANGELOG.md)

## Overview

### Core Features
- **🔄 Flexible Sync Modes**: One-way, two-way additions-only, or full mirror sync
- **📁 Smart Organization**: Creates collection-named folders in your bookmarks bar
- **⏰ Automatic Scheduling**: Configurable sync intervals (1-60+ minutes)
- **🔐 Secure OAuth2**: Chrome identity API with automatic token refresh
- **💾 Backup & Restore**: Automatic backups with JSON + HTML export
- **🧹 Cleanup Tools**: URL parameter cleaning, duplicate detection, empty folder removal
- **🎨 Modern UI**: Clean, responsive interface with 5 organized tabs
- **⚡ Performance**: Rate-limit aware with exponential backoff

## 🚀 Installation

### From Source (Development)
1. Clone or download this repository
2. Open `chrome://extensions` (or Brave equivalent) and enable **Developer mode**
3. Click **"Load unpacked"** and select the `extension/` folder
4. Pin the extension to your toolbar for quick access

### Chrome Web Store (Coming Soon)
The extension is currently under review for the Chrome Web Store.

## ⚙️ Setup

### 1. OAuth Setup (Raindrop.io)
1. Create an app at [Raindrop.io Developer Portal](https://raindrop.io/developer)
2. Set Redirect URI: `https://<EXTENSION_ID>.chromiumapp.org/`
3. Copy your Client ID and Client Secret
4. Open extension **Options** → **Connect** tab
5. Enter credentials and click **Authenticate**

### 2. Configure Sync
1. Go to **Sync Settings** tab
2. Select target bookmark folder
3. Choose collections to sync
4. Set sync mode (additions_only recommended for safety)
5. Enable automatic sync

## 📖 Usage

### Quick Actions
- **Popup**: One-click sync, view status, quick settings
- **Options**: Full configuration, backup management, cleanup tools

### Sync Modes
- **One-way (Raindrop → Browser)**: Import only, no changes to Raindrop
- **Additions Only**: Two-way sync, only adds new items (safest)
- **Mirror**: Full two-way sync with deletions (use with caution)
- **Upload Only**: Browser → Raindrop only

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
