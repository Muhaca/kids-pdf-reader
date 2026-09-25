// Semua URL & ambang batas yang mudah diubah ada di sini, bukan disebar di komponen.

// Manifest buku (R2, di-serve worker portfolio-assets). 279 buku, ±100 KB.
export const MANIFEST_URL =
    "https://portfolio-assets.muhamadcasdi.workers.dev/books/manifest.json";

// Worker relay PDF (relay passthrough, tanpa cache). Kalau belum di-deploy atau
// sedang mati, app otomatis jatuh ke URL origin — PUSTAKA TETAP HIDUP.
export const PDF_RELAY_URL = "https://maca-pdf.muhamadcasdi.workers.dev";

//// Relay sudah di-deploy (2026-09-26) dan lolos smoke test di edge: HEAD sama dengan
// origin, Range → 206, 410 untuk buku yang di-REMOVED, tidak ada cf-cache HIT.
// Kalau worker mati, app otomatis jatuh ke URL origin — pustaka tetap hidup.
export const RELAY_ENABLED = true;

// Wajib diisi: budi.kemendikdasmen.go.id memblokir User-Agent kosong/"curl/..."
// dengan 403, jadi jangan andalkan UA default Android/iOS.
export const CLIENT_UA = "Maca/1.0 (Android; reader buku anak, non-komersial)";

// Di atas ambang ini app menampilkan peringatan "pakai Wi-Fi" sebelum mengunduh.
export const MAX_WARN_BYTES = 25 * 1024 * 1024;
