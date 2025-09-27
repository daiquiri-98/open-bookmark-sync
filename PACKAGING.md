Chrome Extension Packaging Guide

Overview
- The `extension/` folder is your unpacked extension. Load it in Developer Mode for local testing.
- For the Chrome Web Store, upload a ZIP of the `extension/` folder (no CRX, no PEM).
- Never include your private key (`.pem`) in the uploaded ZIP or in your public repo.

Safe workflow
1) Keep your signing key outside the repo (or at least ignored by Git). This repo’s `.gitignore` already ignores `*.pem` and `*.crx`.
2) Use the provided script to create a clean ZIP that excludes `.pem/.crx` and other junk.

Create Store ZIP
```
bash scripts/pack-extension.sh
```
- Output: `dist/open-bookmark-sync-<version>.zip`
- This ZIP is ready to upload to the Chrome Web Store.

Create CRX for local distribution (optional)
- Chrome → `chrome://extensions` → Enable Developer mode → “Pack extension…”
  - Extension root: the `extension/` folder
  - Private key file: your `.pem` (kept outside the repo)
- This produces a `.crx` and `.pem` (if new). Keep `.pem` private. You can store the `.crx` in `dist/` (ignored by Git) if you want to share manually.

Notes
- Do NOT place `.pem` inside `extension/`. If you zip that folder for the Store, your private key would be exposed.
- The Web Store does not accept `.crx` uploads; it requires a ZIP of the source.

