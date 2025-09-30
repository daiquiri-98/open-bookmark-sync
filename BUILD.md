# Build Instructions

## Chrome Web Store Package

To create a Chrome Web Store ready ZIP package:

```bash
npm run build
```

This will:
- Read the version from `extension/manifest.json`
- Create `dist/` directory if needed
- Generate `dist/open-bookmark-sync-v{VERSION}.zip`
- Exclude system files (.DS_Store, __MACOSX)
- Show package size

**Output**: `dist/open-bookmark-sync-v1.3.0.zip`

## Manual Build

If you prefer to build manually:

```bash
cd extension
zip -r ../dist/open-bookmark-sync-v1.3.0.zip . -x "*.DS_Store" -x "__MACOSX/*"
```

## Upload to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select your extension
3. Click "Package" → "Upload new package"
4. Upload the ZIP file from `dist/`
5. Fill in store listing details
6. Submit for review

## Version Management

The version is automatically read from `extension/manifest.json`. To release a new version:

1. Update version in `extension/manifest.json`
2. Run `npm run build`
3. Upload new ZIP to Chrome Web Store

## Package Contents

The ZIP includes:
- manifest.json
- All JavaScript files (background.js, popup.js, options.js, oauth.js)
- All HTML files (popup.html, options.html)
- All icons (icon16.png, icon64.png, icon128.png, icon512.png)
- SVG icons directory (icons/)

## Notes

- The `dist/` directory is excluded from git (see `.gitignore`)
- Only the `extension/` folder contents are packaged
- System files are automatically excluded
- Package size should be under 5MB (Chrome Web Store limit)