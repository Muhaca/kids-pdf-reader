# Rencana: Worker Relay (passthrough) + Hotlink

Status: 🟢 Fase 1–3 SELESAI & ter-deploy — tinggal verifikasi manual di perangkat (Fase 4)
Dibuat: 2026-09-26 · Repo: `kids-pdf-reader` · Worker: `maca-pdf`
Diperbarui: 2026-09-26 · Worker live di `https://maca-pdf.muhamadcasdi.workers.dev`
(version `0cf32ac1-e10d-4080-be68-540d804174b7`) · `RELAY_ENABLED = true`

## Keputusan

| Fork | Dipilih | Alasan |
| --- | --- | --- |
| Bentuk worker | Relay passthrough, `Cache-Control: no-store` | Tidak ada salinan body di R2/edge → bukan "diperbanyak" (Pasal 49 UU 28/2014) |
| Lokasi | Worker baru `maca-pdf` di repo app | `portofolio` juga menyimpan manifest buku, jadi satu worker tidak boleh gagal karena perubahan deploy di sana (repo `portofolio` sekarang sudah sinkron, lihat temuan #4) |
| Cache edge | Tidak ada (`caches.default` tidak dipakai) | 206 dari Range tidak bisa di-cache; menyimpan salinan = risiko 🟡 → 🟠 |
| Saat worker down | Fallback otomatis ke URL origin | Worker down tidak membuat pustaka mati |
| Scope | Passthrough saja (Workstream A/B terpisah) | Batch kecil & mudah di-rollback |

## Latar belakang hukum (sudah diverifikasi ke sumber primer)

- **Pasal 36 UU 28/2014** — Pencipta & Pemegang Hak Cipta atas ciptaan yang dibuat dalam hubungan
  kerja atau atas pesanan adalah pihak yang membuat ciptaan → hak cipta milik instansi
  pemerintah, bukan penulis. Catatan: Pasal **35** bukan tentang kepemilikan; sitasi awal salah.
- **Pasal 99 ayat (3) huruf b** — pemegang hak dapat memohon putusan provisi/putusan sela untuk
  **menghentikan pendistribusian**. Ini jalur take-down yang nyata. Sitasi awal "99(2)(d)" salah.
- **UU 3/2017 Pasal 59 ayat (2)** — "buku elektronik … dapat diunduh secara gratis dan digandakan"
  hanya berlaku untuk **Buku teks utama** yang dikonversi Pemerintah, dan belum operasional
  tanpa Peraturan Menteri. Bukan lisensi bebas untuk mencerminkan semua buku.
- Bukti di dalam PDF:
  - 58 buku BPPB 2021 — *"dilarang diperbanyak dalam bentuk apa pun tanpa izin tertulis dari
    penerbit"* + `MILIK NEGARA` / `TIDAK DIPERDAGANGKAN`.
  - 220 buku SIBI/Kemendikdasmen 2024–2025 — `©2025 Kementerian Pendidikan Dasar dan Menengah`,
    `All rights reserved`.
- Risiko per aktivitas: hotlink 🟢 · TTS on-device 🟡 · bulk download → R2 🔴 (DROPPED)

## Fase 0 — Riset & keputusan ✅ SELESAI

- [x] Bukti notis hak cipta diekstrak langsung dari PDF (dua rezim berbeda)
- [x] Landasan hukum diverifikasi ke sumber primer — 3 sitasi dikoreksi
- [x] `caches.default` di `.workers.dev` diperiksa → tidak dipakai, moot
- [x] Limits Workers Free dicek: 10 ms CPU, 100k request/hari, 50 subrequest, 512 MB objek cache
- [x] Audit repo: `portfolio-assets` hanya R2 read-only, tidak ada proxying PDF
- [x] API `expo-file-system@57.0.7` diverifikasi di `node_modules`:
      `File.createDownloadTask(url, dest, { headers, onProgress, signal })` → `DownloadTask`
      (progress asli; `DownloadOptions` milik `downloadFileAsync` **tidak** punya `onProgress`)
- [x] Keputusan arsitektur diambil (tabel di atas)
- [x] Commit perubahan `src/data/books.ts` (URL manifest → worker) — `497d6e6`

## Fase 1 — Worker relay ✅ SELESAI & TER-DEPLOY

- [x] `scripts/build-origin-map.mjs` — GET manifest live → tulis allowlist
      (`.mjs` supaya tidak perlu `"type": "module"` di package.json Expo)
- [x] `worker/removed.txt` — daftar id yang dicabut (disunting manual, dibaca generator)
- [x] `worker/origins.generated.js` — GENERATED, **278 entri** + `REMOVED` (1 id)
- [x] `worker/index.js` — `GET|HEAD /books/pdf/:id`, `GET /health`
- [x] `wrangler.jsonc` — `name: "maca-pdf"`, tanpa `r2_buckets`
- [x] `npx wrangler deploy` → `https://maca-pdf.muhamadcasdi.workers.dev` (11,47 KiB gzip)
- [x] Smoke test **di edge** (semua ✅):
      | Cek | Hasil |
      | --- | --- |
      | `/health` | `x-maca-books: 278`, `x-maca-removed: 1` |
      | `HEAD /books/pdf/jangan-dekat-dekat` | `content-length: 4527430` = identik dengan `curl -I -A "Maca/1.0" <origin>` |
      | `HEAD` buku terbesar per host (3 host) | 200 `application/pdf`, ukuran = `bytes` di manifest |
      | `Range: bytes=0-1023` | 206 + `content-range: bytes 0-1023/4527430`, body `%PDF-1.5` |
      | `Range` di buku 128 MB (byte terakhir & tengah) | 206 + `content-range` benar |
      | `GET` penuh 4,5 MB | 200, 4.527.430 byte, ditutup `%%EOF` |
      | id ngawur / path ngawur / `POST` | 404 `unknown_book` / 404 `not_found` / 405 |
      | id di `REMOVED` | **410 `book_removed`** |
      | `cf-cache-status` | tidak ada di response ✅ (tidak ada cache edge) |

### Perilaku worker

```
GET /books/pdf/:id
  ├ REMOVED            → 410 { code: "book_removed" }
  ├ id tak dikenal     → 404 { code: "unknown_book" }
  ├ upstream fetch 1x  (User-Agent eksplisit, Accept: application/pdf, teruskan Range)
  ├ retry 1x saat 5xx / network error (backoff 300 ms)
  └ Response: stream body + content-type/length/range/accept-ranges/etag/last-modified
              + access-control-allow-origin: * + cache-control: no-store + x-maca-origin
```

Kunci keamanan: URL diambil dari **allowlist**, bukan query param → worker tidak bisa menjadi
open proxy (pemicu abuse report + auto-disable Cloudflare).

## Fase 2 — Enrichment manifest ✅ SELESAI & LIVE

- [x] `kids-book-uploader/scripts/audit-sizes.js` — 279× `HEAD` (bukan GET; tidak menyimpan
      isi → bukan penggandaan), paralel 8, retry 1×, timeout 15 s
- [x] Audit → `kids-book-uploader/books/manifest.json` + `books/audit-report.json`
      - 278/279 bisa diukur · total **1.825 MB** · rata-rata 6,6 MB
      - terbesar **122,3 MB** (`lari-gajah-kurcaci`) · terkecil 0,8 MB
      - 9 buku > 25 MB · 1 buku > 100 MB
      - 1 gagal: `buku-bacaan-berkualitas-untuk-menguatkan-transisi-paud-ke-sd-yang-menyenangkan`
        (`ik.imagekit.io` → DNS ke `lamanlabuh.aduankonten.id`, connection refused)
- [x] 6 field lama + 12 kategori dipertahankan (script gagal-diri kalau ada field berubah)
- [x] `npm run worker:origins -- --sizes ../kids-book-uploader/books/manifest.json`
      → kolom `bytes` terisi di `worker/origins.generated.js`
- [x] Upload ke R2 (backup: `kids-book-uploader/backup/manifest-2026-09-25T18-12-26-671Z.json`)
      → live: 279 buku, 12 kategori, field `bytes/origin/verifiedAt` ada di 278 buku
- [x] Buku `ik.imagekit.io` → masuk `worker/removed.txt` (worker balas 410, bukan 502)

## Fase 3 — App ✅ SELESAI (relay aktif)

- [x] `src/config.ts` — `MANIFEST_URL`, `PDF_RELAY_URL`, `CLIENT_UA`, `RELAY_ENABLED`, `MAX_WARN_BYTES`
- [x] `src/hooks/usePdfLoader.ts` (rewrite 59 → 195 baris)
      - URL → `${PDF_RELAY_URL}/books/pdf/${id}`
      - destination eksplisit `new File(dir, \`${book.id}.pdf\`)` — membereskan bug `%20` / `?` /
        tabrakan nama
      - `createDownloadTask` + `onProgress` + `signal` (cancel) + hapus file parsial
      - fallback berjenjang: worker → retry → origin langsung (header sama), diam-diam
      - **410 = terminal** (buku dicabut → stop, jangan retry/fallback).
        **404 bukan terminal** = `unknown_book` → fallback origin (allowlist worker bisa
        tertinggal kalau manifest nambah buku)
      - file cache dipakai ulang hanya kalau ukurannya cocok dengan `book.bytes`
      - return `{ uri, error, isDownloading, progress, retry, cancel }`, `error` ber-`code`
- [x] `src/screens/ReaderScreen.tsx` — progress bar + "6,9 MB dari 12,4 MB" + tombol batal ·
      `onError` dari `console.log` → overlay + **Coba Lagi** ·
      warning bila `book.bytes > MAX_WARN_BYTES`
- [x] `src/types/book.ts` — `bytes?`, `origin?`, `removed?`, `source?` (opsional)
- [x] `src/components/ParentSettingsModal.tsx` — sheet "Tentang sumber buku": atribusi,
      badge non-komersial, `mailto:buku@kemendikdasmen.go.id` (`formatBytes` di `src/lib/format.ts`)
- [x] `package.json` — `"typecheck": "tsc --noEmit"` (tidak menambah eslint)
- [x] `npm run typecheck` ✅ · `npx expo export --platform android` ✅
- [x] `RELAY_ENABLED = true`

## Temuan saat implementasi (perubahan dari rencana awal)

1. **`budi.kemendikdasmen.go.id` memblokir `curl/*` dengan 403.** Origin yang sama balas
   200 + `application/pdf` untuk UA okhttp/Dalvik/Maca. Konsekuensi: `CLIENT_UA` **wajib**
   diisi (config + header eksplisit di worker), dan jangan pernah smoke-test origin pakai
   `curl` polos — hasilnya 403 palsu, bikin kesimpulan "buku mati".
2. **`ik.imagekit.io` mati** (DNS → `lamanlabuh.aduankonten.id`, connection refused).
   1 dari 279 buku → masuk `worker/removed.txt`, worker balas 410.
3. **Key R2 yang sebenarnya adalah `manifest.json`, bukan `books/manifest.json`.** Worker
   `portfolio-assets` memetakan `/books/<key>` → key `<key>` di bucket `kids-books`
   (prefix dibuang). Konsekuensi:
   - `audit-sizes.js` → `R2_KEY = "manifest.json"` (sudah dikoreksi; upload pertama sempat
     menulis key `books/manifest.json` yang tidak terjangkau worker, sudah dihapus & di-backup)
    - `upload.js` di `kids-book-uploader` memang memakai key `manifest.json` — jadi **benar**
      untuk key, tapi `coverUrl`/`pdfUrl` menunjuk R2 (bukan aman). Jangan dipakai untuk
      regenerate; pakai `scripts/audit-sizes.js --upload`.
      **✅ Sudah diamankan (commit `kids-book-uploader` `10b42ce`)**: kegagalan baca manifest
      tidak lagi diperlakukan sebagai "manifest kosong" (kredensial/bucket salah → berhenti),
      key yang hilang → berhenti kecuali di-opt-in `ALLOW_EMPTY_MANIFEST=1`, total buku
      `< 50` → berhenti, dan manifest lama di-backup sebelum ditimpa.

   - Manifest bisa dibaca dari repo ini juga: `npx wrangler r2 object get "kids-books/manifest.json" --file m.json --remote`
4. Kode worker `portfolio-assets` yang ada di repo `portofolio` **tidak sama** dengan yang
   ter-deploy (repo: key = pathname apa adanya; ter-deploy: prefix `books/` dibuang).
   `portofolio/wrangler.toml` juga masih `<BUCKET_NAME>`. Jangan deploy dari sana.
   **✅ Sudah DICOCOKKAN (commit `portofolio` `52fd70d`)** — `wrangler.toml` sekarang dua
   binding (`ASSETS_BUCKET` → `portofolio`, `BOOKS_BUCKET` → `kids-books`,
   `compatibility_date = 2026-09-12`) dan `index.js` punya routing `/books/<key>`.
   Worker yang live **tetap versi dashboard** (version `949be940`, 2026-09-25 16:14,
   `Source: Upload`) — repo sudah disinkron tapi **belum dideploy**, dan itu memang
   yang diinginkan. Parity dibuktikan tanpa deploy: `wrangler dev --remote` vs live
   identik di 8 path (status, content-type, ukuran, ETag, body byte-identik untuk
   `manifest.json` & `projects.json`). Kalau nanti mau deploy dari repo, smoke test
   `/projects.json` situs portfolio dulu — worker itu melayani situs, bukan cuma app.
5. `compatibility_date` harus `≤ 2026-09-01`; `2026-09-26` ditolak workerd lokal.
6. `cache-control: public, max-age=86400` di worker `portfolio-assets` → manifest baru
   bisa terlihat device dalam ≤ 24 jam. Tidak masalah: `bytes` opsional, progress tetap jalan
   dari `content-length` saat unduhan.

## Perintah rawan (kalau perlu)
```bash
W=https://maca-pdf.muhamadcasdi.workers.dev
curl -sI $W/health | grep -i x-maca
curl -sI $W/books/pdf/jangan-dekat-dekat | grep -iE 'content-length|content-type|x-maca'
curl -sI -H 'Range: bytes=0-1023' $W/books/pdf/jangan-dekat-dekat | grep -iE 'HTTP|content-range'
curl -s  $W/books/pdf/buku-palsu-xyz     # {"code":"unknown_book",...}
curl -sI $W/books/pdf/<id-di-removed.txt> # 410 book_removed
# rollback: npx wrangler rollback  |  hapus: npx wrangler delete maca-pdf
```

## Fase 4 — Verifikasi manual di perangkat 🔲 BELUM

Butuh build baru (`npx expo run:android` / `run:ios`) — `RELAY_ENABLED` dan
`usePdfLoader` berubah setelah build terakhir.

- [ ] Wi-Fi mati total → fallback → error UI → **Coba Lagi** jalan
- [ ] Buka buku besar (122 MB) → progress bar + "X dari 122,3 MB" + **Batalkan** bekerja
- [ ] Buka buku yang sama 2× (cold start) → file cache dipakai ulang, tanpa unduhan
- [ ] Buka buku `buku-bacaan-berkualitas-...` (di `removed.txt`) → pesan "dicabut", bukan spinner
- [ ] Matikan worker (`npx wrangler delete maca-pdf`) → app tetap bisa membaca buku
- [ ] `git status` bersih

## Di luar scope (sengaja) ⛔

Bulk download/mirror ke R2 · Ghostscript re-compress · ekstrak teks server-side · edge cache body
PDF · TTS/nyaring (`story` masih tidak ada di manifest) · progress resume & search/filter
(Workstream A/B) · bug `books.config.json` di `kids-book-uploader` (format `{"file"}` vs `{"key"}`
→ override diam-diam diabaikan).

## Risiko terbuka ⚠️

- [x] Nama worker `maca-pdf` bebas dipakai ✅ → `maca-pdf.muhamadcasdi.workers.dev`
- [ ] Tidak ada rate limit per-user; andalkan `no-store` + fallback
- [ ] `portofolio/src/lib/data.ts` masih ada perubahan belum di-commit — repo lain, tidak
      disentuh oleh rencana ini
- [ ] `portofolio/wrangler.toml` masih `<BUCKET_NAME>` & kode worker di repo ≠ yang
      ter-deploy (lihat temuan #4) — jangan deploy dari repo itu
- [ ] PDF 128 MB tetap boros kuota seluler; passthrough tidak menyelesaikan ini (konsekuensi
      drop C1). Mitigasi: warning ukuran + `MAX_WARN_BYTES`
- [ ] `upload.js` di uploader tetap generates `coverUrl`/`pdfUrl` ke R2 + kategori kosong —
      pakai `audit-sizes.js`, bukan `upload.js`, untuk memperbarui manifest
