#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read version from manifest.json
const manifestPath = path.join(__dirname, '..', 'extension', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Output filename with version
const zipFileName = `open-bookmark-sync-v${version}.zip`;
const zipPath = path.join(distDir, zipFileName);

// Remove old zip if exists
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
  console.log(`Removed existing: ${zipFileName}`);
}

console.log(`Building Chrome Web Store package...`);
console.log(`Version: ${version}`);

// Create zip using system zip command (preserves permissions)
try {
  // Change to extension directory and zip contents
  const rootDir = path.join(__dirname, '..');
  execSync(`cd "${path.join(rootDir, 'extension')}" && zip -r "${zipPath}" . -x "*.DS_Store" -x "__MACOSX/*"`, {
    stdio: 'inherit'
  });

  console.log(`\n✓ Package created: dist/${zipFileName}`);

  // Show file size
  const stats = fs.statSync(zipPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  Size: ${fileSizeInMB} MB`);

  console.log(`\nReady to upload to Chrome Web Store!`);
} catch (error) {
  console.error('Error creating zip:', error.message);
  process.exit(1);
}