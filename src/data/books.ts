import { Book } from "../types/book";
import { readManifestCache, writeManifestCache } from "../services/storage";

const MANIFEST_URL = "https://portfolio-assets.muhamadcasdi.workers.dev/books/manifest.json";

// Kalau server tidak mengirim ETag, jangan nge-fetch lebih sering dari jeda ini.
const REVALIDATE_COOLDOWN_MS = 15 * 60 * 1000;

export async function fetchBooks(): Promise<Book[]> {
    const cached = readManifestCache();

    // Safety net tanpa ETag: cukup pakai cache selama masih dalam periode cooldown.
    if (cached && !cached.etag && Date.now() - cached.fetchedAt < REVALIDATE_COOLDOWN_MS) {
        return cached.books;
    }

    const headers: Record<string, string> = {};
    if (cached?.etag) headers["If-None-Match"] = cached.etag;

    try {
        const res = await fetch(MANIFEST_URL, { headers });

        // 304 = tidak ada perubahan; pakai cache lokal tanpa mengunduh ulang body.
        if (res.status === 304) {
            if (cached) return cached.books;
            throw new Error("Manifest cache tidak tersedia.");
        }

        if (!res.ok) throw new Error(`Gagal memuat manifest (HTTP ${res.status})`);

        const books = (await res.json()) as Book[];
        if (!Array.isArray(books)) throw new Error("Format manifest tidak valid.");

        const etag = res.headers.get("etag") ?? res.headers.get("ETag") ?? null;
        writeManifestCache(books, etag);
        return books;
    } catch (e) {
        // Offline / gagal sinkronisasi → tampilkan versi cache biar tidak blank.
        if (cached) return cached.books;
        throw e;
    }
}