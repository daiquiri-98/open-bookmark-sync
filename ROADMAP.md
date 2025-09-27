# Roadmap

This roadmap outlines upcoming features and priorities for Raindrop Browser Sync. Items emphasize safety, clarity, and scalability.

## 1) Safer Sync
- Dry‑Run / Preview: Show add/update/delete counts and collection‑level diffs before apply.
- “No‑Delete” Safe Mode: Optional no‑delete in Mirror mode.
- Automatic Snapshot: JSON backup before each sync; “Undo last sync”.

## 2) Per‑Collection Controls
- Enable/disable sync per collection.
- Collection → target folder mapping.
- Include/exclude rules by tag/domain (e.g., skip “private”, skip “youtube.com”).

## 3) Scheduling & Resilience
- Quiet hours and conditional sync (pause on low battery/metered network).
- Next sync ETA in header; quick “Retry” on failure.

## 4) Sorting & Organization
- Pinned collections and manual order overrides.
- Optional grouping headers by collection type.

## 5) Logs & Diagnostics
- Activity Log (recent actions, throttling/backoff info).
- One‑click “Copy diagnostics” for issue reports.

## 6) Onboarding & Help
- First‑run guided checklist.
- Scenario guides: Mirror vs Additions‑only, common pitfalls.

## 7) Accessibility & Localization
- Keyboard navigation, higher contrast option.
- Language toggle (EN/TR) and simplified copy.

## 8) Multi‑Profile
- Named profiles (Work/Personal) with quick switch.
- Export/import settings JSON.

## 9) Provider & Storage Architecture
- Abstract “Raindrop” into a provider interface for future sources (Pinboard/Wallabag/Pocket, etc.).
- Cloud storage backends for sync/backup: Amazon S3, Cloudflare R2, Google Drive, OneDrive, Dropbox.

---

Suggested priority: 1) Dry‑Run + No‑Delete, 2) Snapshot/Undo, 3) Per‑collection controls.

---

## Yol Haritası (TR)

Bu belge, Raindrop Browser Sync için planlanan geliştirmeleri ve öncelikleri özetler. Güvenlik, açıklık ve ölçeklenebilirlik ön plandadır.

### 1) Güvenli Senkronizasyon
- Dry‑Run / Önizleme: Uygulamadan önce ekle/güncelle/sil sayıları ve koleksiyon bazında diff.
- “No‑Delete” Güvenli Mod: Mirror modunda silme olmadan çalışma seçeneği.
- Otomatik Anlık Görüntü: Her senkron öncesi JSON yedek; “Son senkronu geri al”.

### 2) Koleksiyon Düzeyi Kontroller
- Koleksiyon başına senkron aç/kapat.
- Koleksiyon → hedef klasör eşlemesi.
- Etiket/alan adına göre dahil/haricî kuralları (ör. “private” veya “youtube.com”u atla).

### 3) Zamanlama ve Dayanıklılık
- Sessiz saatler, düşük pil/ölçülü ağda senkronu duraklat.
- Başlıkta “Sonraki Senkron” ve hatada hızlı “Yeniden Dene”.

### 4) Sıralama ve Organizasyon
- Sabitlenmiş (Pinned) koleksiyonlar, manuel sıra geçersiz kılma.
- Tipe göre isteğe bağlı grup başlıkları.

### 5) Kayıt ve Diagnostik
- “Activity Log” (son işlemler, throttling/backoff bilgisi).
- “Diagnostiği kopyala” ile kolay hata raporu.

### 6) Onboarding ve Yardım
- İlk kurulum için rehberli checklist.
- Senaryolu rehberler: Mirror vs Additions‑only, yaygın tuzaklar.

### 7) Erişilebilirlik ve Yerelleştirme
- Klavye navigasyonu, yüksek kontrast modu.
- Dil anahtarı (EN/TR) ve sade metinler.

### 8) Çoklu Profil
- Adlandırılmış profiller (Work/Personal) ve hızlı geçiş.
- Ayarları JSON olarak dışa/içe aktar.

### 9) Sağlayıcı ve Depolama Mimarisi
- “Raindrop”u sağlayıcı arayüzüne ayır; Pinboard/Wallabag/Pocket vb. kolayca eklenebilsin.
- Senkron/yedek için bulut depolama: Amazon S3, Cloudflare R2, Google Drive, OneDrive, Dropbox.

---

Öncelik önerisi: 1) Dry‑Run + No‑Delete, 2) Snapshot/Undo, 3) Koleksiyon düzeyi kontroller.
