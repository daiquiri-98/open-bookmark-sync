# Open Bookmark Sync (Chrome/Brave, MV3)

Synchronize your Raindrop.io collections with the browser Bookmarks Bar. Supports one‑way import, two‑way additions‑only, or full mirror, with sorting, rate‑limit safety and a compact toolbar popup.

Support: https://buymeacoffee.com/daiquiri

## English

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
1) Clone/download this folder
2) Open `chrome://extensions` (or Brave equivalent) and enable Developer mode
3) Click “Load unpacked” and select this folder
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

License: MIT

---

## Türkçe

Özellikler
- Doğrudan Yer İmleri Çubuğu: Koleksiyon adlarıyla klasörler çubuğun köküne oluşturulur
- Çift yön modları: sadece‑eklemeler (varsayılan), ayna (ekle/güncelle/sil), kapalı (tek yön → tarayıcı)
- Sıralama: koleksiyon klasörleri ve klasör içi yer imleri için
- Elle + zamanlanmış senkron: aralığı ayarlanabilir (1–60+ dk)
- OAuth2 (chrome.identity) ve token yenileme
- Oran sınırlaması güvenli: istek başına hız + Retry‑After/geri çekilme
- Araç çubuğu açılır menüsü: hızlı senkron, giriş/çıkış, aralık ve mod seçimi
- Ayarlar sayfası: responsive 2 sütun düzeni

Kurulum (yerel paket)
1) Klasörü indir/klonla
2) `chrome://extensions` aç ve Geliştirici modunu aç
3) “Load unpacked” ile klasörü seç
4) Açılır menüye kolay erişim için uzantıyı sabitle

OAuth Kurulumu (Raindrop.io)
- https://raindrop.io/developer adresinde bir uygulama oluştur
- Yönlendirme URI’si: `https://<EXTENSION_ID>.chromiumapp.org/`
- İstemci ID/Sır’ı Ayarlar’dan gir ve yetkilendir

Kullanım
- Popup: Hemen Senkronize Et, Yetkilendir/Çıkış, Aralığı ve Modu seç
- Ayarlar: hedef klasörü, aralığı, sıralamayı ve istek/dk değerini ayarla

Nasıl Çalışır
- Koleksiyonlar → klasörler; Raindroplar → yer imleri
- Kimlik eşlemesi yerelde tutulur (döngü önleme)
- Servis çalışanı alarm’ları; API çağrıları hız sınırı ve geri çekilme ile

Oran Sınırları
- Resmî kota bilgisi bulunamadı; varsayılan 60 istek/dk + Retry‑After destekli

İzinler
- `bookmarks`, `storage`, `alarms`, `identity`, `raindrop.io` ana makine izinleri

Sorun Giderme
- Yönlendirme URI’si `https://<EXTENSION_ID>.chromiumapp.org/` ile aynı olmalı
- `chrome://extensions` → servis çalışanı günlüklerini kontrol et

Geliştirme
- Temel dosyalar: `manifest.json`, `background.js`, `oauth.js`, `options.html/js`, `popup.html/js`

Lisans: MIT
