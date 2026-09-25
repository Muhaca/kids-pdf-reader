# Rencana: Worker Relay (passthrough) + Hotlink

Status: 🔵 ACCEPED — belum diimplementasikan
Dibuat: 2026-09-26 · Repo: `kids-pdf-reader` · Worker: `maca-pdf`

## Keputusan

| Fork | Dipilih | Alasan |
| --- | --- | --- |
| Bentuk worker | Relay passthrough, `Cache-Control: no-store` | Tidak ada salinan body di R2/edge → bukan "diperbanyak" (Pasal 49 UU 28/2014) |
| Lokasi | Worker baru `maca-pdf` di repo app | `portofolio/wrangler.toml` masih placeholder `<BUCKET_NAME>`; deploy CLI dari sana berisiko merusak binding portfolio |
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

## Fase 1 — Worker relay 🔲 BELUM

- [ ] `scripts/build-origin-map.js` — GET manifest live → tulis allowlist
- [ ] `worker/origins.generated.js` — GENERATED, `ORIGINS = { [id]: { url, host, bytes } }` + `REMOVED`
- [ ] `worker/index.js` — `GET|HEAD /books/pdf/:id`, `GET /health`
- [ ] `wrangler.jsonc` — `name: "maca-pdf"`, tanpa `r2_buckets`
- [ ] Smoke test:
      - HEAD bandingkan `content-length` vs origin (satu per origin)
      - id ngawur → 404 · buku mati → 410
      - `Range: bytes=0-1023` → 206 + `content-range`
      - tidak ada `cf-cache-status: HIT` di response

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

## Fase 2 — Enrichment manifest (metadata saja) 🔲 BELUM

- [ ] `kids-book-uploader/scripts/audit-sizes.js` — 279× `HEAD` (bukan GET; tidak menyimpan
      isi → bukan penggandaan), paralel 8, retry 1×, timeout 15 s
- [ ] Tambah field `bytes`, `origin`, `removed`, `verifiedAt` — **pertahankan** 6 field lama dan
      12 kategori yang sekarang (jangan regenerate dari `upload.js`, kategori akan kosong)
- [ ] Upload `books/manifest.json` ke R2 lewat S3 client yang sudah ada di `kids-book-uploader`
- [ ] Verifikasi: `curl $MANIFEST_URL | jq '.[0]'`

## Fase 3 — App 🔲 BELUM

- [ ] `src/config.ts` — `MANIFEST_URL`, `PDF_RELAY_URL`, `CLIENT_UA`, `RELAY_ENABLED`, `MAX_WARN_BYTES`
- [ ] `src/hooks/usePdfLoader.ts` (rewrite 59 → ~140 baris)
      - URL → `${PDF_RELAY_URL}/books/pdf/${id}`
      - destination eksplisit `new File(dir, \`${book.id}.pdf\`)` — membereskan bug `%20` / `?` /
        tabrakan nama
      - `createDownloadTask` + `onProgress` + `signal` (cancel) + hapus file parsial
      - fallback berjenjang: worker → retry → origin langsung (header sama), diam-diam
      - return `{ uri, error, isDownloading, progress, retry, cancel }`, `error` ber-`code`
- [ ] `src/screens/ReaderScreen.tsx` — progress bar + "6,9 MB dari 12,4 MB" + tombol batal ·
      `onError` (`:135`) dari `console.log` → overlay + **Coba Lagi** ·
      warning bila `book.bytes > MAX_WARN_BYTES`
- [ ] `src/types/book.ts` — `bytes?`, `origin?`, `removed?`, `source?` (opsional)
- [ ] `src/components/ParentSettingsModal.tsx` — sheet "Tentang sumber buku": atribusi,
      badge non-komersial, `mailto:buku@kemendikdasmen.go.id`, kanal resmi
- [ ] `package.json` — tambah `"typecheck": "tsc --noEmit"` (tidak menambah eslint)
- [ ] `npm run typecheck`

## Fase 4 — Verifikasi manual 🔲 BELUM

- [ ] Wi-Fi mati total → fallback → error UI
- [ ] Worker di-down → app tetap bisa membaca
- [ ] Buku 128 MB → progress + batal
- [ ] Cold start 2× → file cache dipakai ulang
- [ ] `git status` bersih setelah semua fase

## Di luar scope (sengaja) ⛔

Bulk download/mirror ke R2 · Ghostscript re-compress · ekstrak teks server-side · edge cache body
PDF · TTS/nyaring (`story` masih tidak ada di manifest) · progress resume & search/filter
(Workstream A/B) · bug `books.config.json` di `kids-book-uploader` (format `{"file"}` vs `{"key"}`
→ override diam-diam diabaikan).

## Risiko terbuka ⚠️

- [ ] Nama worker `maca-pdf` mungkin sudah dipakai → URL jadi `maca-pdf.<subdomain>.workers.dev`
- [ ] Tidak ada rate limit per-user; andalkan `no-store` + fallback
- [ ] `portofolio/src/lib/data.ts` masih ada perubahan belum di-commit — repo lain, tidak
      disentuh oleh rencana ini
- [ ] PDF 128 MB tetap boros kuota seluler; passthrough tidak menyelesaikan ini (konsekuensi
      drop C1). Mitigasi: warning ukuran + `MAX_WARN_BYTES`
