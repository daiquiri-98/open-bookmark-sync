# Changelog

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
