# Changelog

## 1.2.0 - 2025-09-28

### User Experience Enhancements
- **Sync Default Mode**: Changed default sync mode to "One-way: Raindrop → Browser" for safer first-time setup
- **Initial Setup**: "Enable Raindrop Sync" now starts disabled, requiring user to configure source and target first
- **Navigation Improvements**: Renamed "Connection" to "Connect" for clearer user action
- **Menu Structure**: Updated main menu from "Raindrop" to "Raindrop.io Sync" with new "Guide" submenu

### New Guide System
- **Setup Guide Tab**: Added comprehensive step-by-step setup instructions
- **Sync Mode Explanations**: Detailed explanations of each sync mode with recommendations
- **Best Practices**: Tips for optimal configuration and safe usage
- **User Onboarding**: Improved first-time user experience with clear guidance

### GitHub Integration & Support
- **GitHub Sponsor Button**: Added sponsor button to header and support section
- **Support Section**: Enhanced "Support the Project" section with GitHub sponsor and Buy me a coffee buttons
- **Button Styling**: Improved button alignment and visual consistency
- **Community Links**: Better integration with project repository and support channels

### Technical Improvements
- **Manual Configuration**: Merged and improved manual configuration section with better show/hide functionality
- **Section Organization**: Added proper IDs and classes to all major sections for better structure
- **UI Polish**: Refined button heights, spacing, and visual alignment throughout the interface
- **Code Organization**: Improved JavaScript handling for configuration toggles

### Turkish Summary (TR)
- **Güvenli Başlangıç**: Varsayılan sync modu "Raindrop → Browser" oldu, sync başlangıçta kapalı
- **Rehber Sistemi**: Kapsamlı kurulum rehberi ve sync modu açıklamaları eklendi
- **GitHub Entegrasyonu**: Sponsor butonu ve gelişmiş destek bölümü
- **Arayüz İyileştirmeleri**: Menü yapısı güncellendi, manuel yapılandırma birleştirildi

---

## 1.1.0 - 2025-09-28

### Chrome Web Store Compliance
- **Privacy Policy**: Added comprehensive PRIVACY.md file
- **Manifest Updates**: Added privacy_policy and homepage_url fields
- **Privacy Links**: Added Privacy Policy links to extension UI
- **Documentation**: Enhanced README with compliance information
- **Zero Telemetry**: Reinforced no-data-collection policy

### UI/UX Improvements
- **Managed OAuth**: Removed "Cloudflare" from title, moved worker status next to URL label
- **Authentication Status**: Unified user info with connection status on single line
- **Manual Configuration**: Redesigned as integrated card with Show/Hide toggle
- **Visual Separation**: Added subtle styling to manual config when expanded
- **Privacy Notice**: Moved to top with closeable design (× button)
- **Layout Optimization**: Improved section ordering and reduced visual clutter
- **Help Menu**: Renamed "Get Help" to "Support", simplified content structure
- **GitHub Links**: Added repository links to Support and Roadmap sections

### Technical Enhancements
- **OAuth URL Documentation**: Clear explanation that "not found" is normal behavior
- **Save Config Button**: Moved to manual section, hidden when not needed
- **Automatic Worker Health**: Background checking without manual intervention
- **Code Cleanup**: Removed redundant spacing and streamlined layout

### Turkish Summary (TR)
- **Chrome Web Store Uyumluluğu**: Kapsamlı privacy policy ve compliance
- **Arayüz İyileştirmeleri**: Birleşik auth durumu, yeniden tasarlanmış manuel yapılandırma
- **Görsel Düzenlemeler**: Daha temiz layout, gizlenebilir privacy bildirimi
- **GitHub Entegrasyonu**: Destek bölümlerine repository linkleri eklendi

---

## 0.4.0 - 2025-09-27
- New sidebar layout (default): header and sidebar fixed; content scrolls smoothly
- Navigation restructure: Raindrop category (Connection + Raindrop Sync), Maintenance (Import/Export + Danger Zone), Resources (Guide & Help, Buy Me a Coffee)
- Design softening: typography scale, softer borders, improved spacing, muted inactive states
- Clear All warning when sync is enabled to prevent immediate re‑import surprise
- Placeholders styled for better readability
- Flicker removed on load; initial layout renders in final state
- Guide merged into “Guide & Help” panel; Buy Me a Coffee highlighted (yellow button)

TR:
- Yeni varsayılan yan menü: sabit header ve sidebar; içerik akıcı kayıyor
- Navigasyon yeniden düzenlendi: Raindrop (Connection + Sync), Maintenance (Import/Export + Danger Zone), Resources (Guide & Help, Buy Me a Coffee)
- Tasarım yumuşatmaları: tipografi ölçeği, daha yumuşak kenarlıklar, iyileştirilmiş boşluklar, pasif durumlar daha soluk
- Sync açıkken Clear All için uyarı: otomatik geri yükleme sürprizini önleme
- Placeholder renkleri okunabilirlik için ayarlandı
- Yüklemede flicker kaldırıldı; ilk render son hal
- Guide, “Guide & Help” paneline taşındı; Buy Me a Coffee sarı butonla vurgulandı

## 0.3.0 - 2025-09-27
- Move extension code into extension/ folder; keep README at root
- Fix auth regression: options now shows Redirect URI, auth buttons work
- One-way (Raindrop ? Browser) no longer duplicates; adds missing only
- Add collection filters: Import all, Top-level only, and specific selection
- Add search/Select all/Clear to collection selection (checkbox list)
- Standardize control heights (40px) and align inputs/buttons consistently
- Tabs/cards unified: Connection/Sync/Sorting/Support all use same card UI
- Support text updated (English); buttons added inside Support panel

## 0.2.0 - earlier
- Two-way modes: additions_only/mirror/off/upload_only
- Sorting preferences for collections and bookmarks
- Rate-limited API fetch with backoff; interval and RPM in settings

## 0.1.0 - initial
- Basic Raindrop ? Bookmarks sync; OAuth2 via chrome.identity
- Add 'Include sub-collections' option for selected collections (0.3.1)
