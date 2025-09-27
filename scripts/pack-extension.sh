#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXT_DIR="$ROOT_DIR/extension"
DIST_DIR="$ROOT_DIR/dist"

mkdir -p "$DIST_DIR"

# Extract version from manifest.json
VERSION=$(sed -n 's/^\s*"version"\s*:\s*"\([^"]\+\)".*/\1/p' "$EXT_DIR/manifest.json" | head -n1)
if [[ -z "${VERSION:-}" ]]; then
  VERSION="$(date +%Y%m%d%H%M%S)"
fi

OUT_ZIP="$DIST_DIR/open-bookmark-sync-$VERSION.zip"

echo "Packing extension/ -> $OUT_ZIP"

cd "$EXT_DIR"
zip -r "$OUT_ZIP" . \
  -x "*.DS_Store" \
     "*.crx" \
     "*.pem" \
     "*.zip" \
     "assets/export-icons.html" \
     "oauth guide/*"

echo "Done: $OUT_ZIP"

