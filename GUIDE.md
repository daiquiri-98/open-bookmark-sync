# Open Bookmark Sync – Developer & User Guide

## Project Overview
Open Bookmark Sync is a Chrome/Brave (MV3) extension that synchronizes Raindrop.io collections with your browser bookmarks. It supports multiple sync modes, OAuth2 authentication, and rate‑limit friendly API interactions.

## Current Codebase Structure

### Directory Layout
```
raindrop-bookmarks-sync/
├── README.md                    # Bilingual project documentation (EN/TR)
├── CHANGELOG.md                 # Version history and changes
├── ai-instruction.md           # This file - AI development guide
└── extension/                  # Main extension code
    ├── manifest.json           # Extension manifest (MV3)
    ├── background.js           # Service worker - core sync logic
    ├── oauth.js               # OAuth2 authentication flow
    ├── popup.html/js          # Extension popup interface
    ├── options.html/js        # Options page
    ├── bookmarks-sync.js      # (deprecated/legacy)
    ├── raindrop-api.js        # (deprecated/legacy)
    ├── icon16/48/128.png      # Extension icons
    └── assets/
        ├── logo.svg           # Brand logo
        └── LOGO_README.md     # Logo usage guidelines
```

### Core Components

#### 1. Service Worker (`background.js`)
- **Class**: `RaindropSync`
- **Purpose**: Main sync orchestration, API calls, bookmark management
- **Key Features**:
  - Scheduled sync via chrome.alarms API
  - Rate-limited API requests (60 RPM default)
  - Token refresh handling
  - Multiple sync modes: `additions_only`, `mirror`, `off`, `upload_only`
  - Collection filtering and sorting
  - Bidirectional sync with conflict resolution

#### 2. OAuth Handler (`oauth.js`)
- **Class**: `RaindropOAuth`
- **Purpose**: Raindrop.io API authentication
- **Features**:
  - OAuth2 authorization code flow
  - Token refresh mechanism
  - Connection testing
  - Secure token storage

#### 3. Options Page (`options.js`)
- **Class**: `OptionsManager`
- **Purpose**: User configuration interface
- **Features**:
  - Sidebar layout (default): Header + sol menü sabit; içerik alanı kayar
  - Kategoriler: Raindrop (Connection + Sync), Maintenance (Import/Export + Danger Zone), Resources (Guide & Help, Buy Me a Coffee)
  - Koleksiyon seçimi (arama/seç/temizle), gerçek zamanlı doğrulama, kullanıcı bilgisi

#### 4. Popup Interface (`popup.js`)
- **Purpose**: Quick access toolbar popup
- **Features**:
  - Manual sync trigger
  - Auth status display
  - Basic settings controls

## Technical Architecture

### Authentication Flow
1. User configures Client ID/Secret from Raindrop.io developer console
2. OAuth2 flow via `chrome.identity.launchWebAuthFlow`
3. Token storage in `chrome.storage.sync`
4. Automatic refresh using refresh tokens

### Sync Mechanisms
- **One-way (Raindrop → Browser)**: `mode: "off"`
- **Additions Only**: `mode: "additions_only"` (default)
- **Full Mirror**: `mode: "mirror"` (add/update/delete/reorder)
- **Upload Only**: `mode: "upload_only"` (Browser → Raindrop)

### Data Mapping
- Collections → Bookmark folders
- Raindrops → Individual bookmarks
- ID mapping stored in `chrome.storage.local` for sync state tracking

### Rate Limiting
- Configurable RPM (default: 60)
- Exponential backoff for 429/503 responses
- Retry-After header respect

## Development Guidelines

### Code Style
- ES6+ modern JavaScript
- Class-based architecture
- Async/await for asynchronous operations
- Error handling with try/catch blocks
- Console logging for debugging

### Storage Strategy
- `chrome.storage.sync`: User settings, tokens (synced across devices)
- `chrome.storage.local`: ID mappings, temporary state (device-specific)

### UI Patterns
- Responsive design with CSS Grid/Flexbox
- Tabbed interfaces for complex settings
- Real-time status indicators
- Debounced input handlers for performance

### Error Handling
- Graceful degradation for API failures
- User-friendly error messages
- Automatic token refresh on 401 errors
- Rate limit backoff strategies

## Future Development Considerations

### Planned Features
- Improved sub-collection handling
- Enhanced conflict resolution
- Performance optimizations for large collections
- Better error reporting and logging

### Architecture Improvements
- Modular service architecture
- TypeScript migration potential
- Enhanced testing framework
- Performance monitoring

### Compatibility
- Chrome Extensions API v3 compliance
- Cross-browser compatibility (Edge, Firefox)
- Backward compatibility for settings migration

## Development Workflow

### File Modification Priority
1. **Core Logic**: `background.js` for sync behavior changes
2. **Authentication**: `oauth.js` for API integration updates
3. **UI Updates**: `options.js`/`popup.js` for interface changes
4. **Documentation**: Update `CHANGELOG.md` for version tracking

### Testing Checklist
- OAuth flow functionality
- Sync mode verification
- Rate limit handling
- Error recovery mechanisms
- Settings persistence
- Cross-device sync behavior

### Release Process
1. Update version in `manifest.json`
2. Document changes in `CHANGELOG.md`
3. Test all sync modes and edge cases
4. Verify OAuth flow with fresh credentials
5. Package extension for distribution

## Known Issues & Limitations
- No official Raindrop.io API rate limits documented
- Chrome extension size limitations for large bookmark sets
- OAuth redirect URI must match extension ID exactly
- Sync conflicts in rapid bidirectional changes

## Support & Maintenance
- User support via GitHub issues
- Documentation maintained in both English and Turkish
- Buy Me a Coffee support link integration
- Extension published as unpacked for now (consider Chrome Web Store)

---

---

## User Guide (Quick Start)

Bu bölüm, eklentiyi kısa sürede doğru şekilde kurup kullanabilmeniz için hazırlanmıştır.

### 1) Raindrop.io Bağlantısı
- Raindrop menüsünden “Connection”’ı açın.
- Raindrop.io geliştirici panelinden aldığınız Client ID/Secret değerlerini girin.
- “Authenticate with Raindrop.io” ile oturum açın, “Test Connection” ile doğrulayın.

### 2) Senkron Modu ve Ayarları
- Sync: “Enable Raindrop Sync” açık olduğunda periyodik senkron çalışır.
- Sync Mode:
  - Additions only: Güvenli varsayılan; yalnızca ekleme.
  - Mirror: Tam yansıtma (ekle/güncelle/sil). Dikkat: silme içerir.
  - Upload only: Tarayıcı → Raindrop.
  - Off: Raindrop → Tarayıcı (tek yönlü içe aktarma).
- Interval ve RPM değerleriyle temposunu ayarlayın (ağ/sınır dostu).

### 3) Koleksiyonlar ve Hedef Klasör
- “Top-level only” ile üst düzey koleksiyonları alın; gerekirse arama/çoklu seçimle özelleştirin.
- Hedef klasör: Yer imlerinin hangi köke yazılacağını seçin (varsayılan: Bookmarks Bar).

### 4) Sıralama ve Bakım
- Koleksiyonlar ve yer imleri için sıralama seçeneklerini belirleyin (alfabetik, tarih vb.).
- Maintenance → Import/Export ile yedek alın veya içe aktarın.
- Danger Zone: “Clear ALL Bookmarks” kullanmadan önce “Export” ile mutlaka yedek alın.
  - Not: Sync açıkken temizlerseniz, yer imleri Raindrop’tan geri gelebilir. Gerekirse “Enable Raindrop Sync”i kapatın.

### İpuçları
- Senkron kapalıyken büyük temizlik/taşıma işlemleri daha kontrollü ilerler.
- Büyük koleksiyonlarda düşük RPM ve daha uzun interval tercih edin.

---

**Last Updated**: 2025-09-27
**Version**: 0.4.0
**Maintainer**: @dagkan
