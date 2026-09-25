import { useCallback, useEffect, useRef, useState } from "react";
import { Directory, File, Paths } from "expo-file-system";
import { Book } from "../types/book";
import { CLIENT_UA, PDF_RELAY_URL, RELAY_ENABLED } from "../config";

export type PdfError = {
    code: "no_url" | "cancelled" | "gone" | "not_found" | "network" | "unknown";
    message: string;
};

export type PdfProgress = { written: number; total: number };

// Status dirantai di beberapa origin (403/404) tidak selalu muncul di pesan error
// native, jadistatus ini dikorek dari teks error.
function statusFromError(e: unknown): number | null {
    const text = `${(e as { message?: string })?.message ?? e}`;
    const match = text.match(/\b(4\d\d|5\d\d)\b/);
    return match ? Number(match[1]) : null;
}

function abortError(): Error {
    return Object.assign(new Error("Dibatalkan"), { name: "AbortError" });
}

function errorFrom(e: unknown): PdfError {
    if ((e as { name?: string })?.name === "AbortError") {
        return { code: "cancelled", message: "Unduhan dibatalkan." };
    }
    const status = statusFromError(e);
    if (status === 410) {
        return {
            code: "gone",
            message: "Buku ini sudah dicabut dari sumber aslinya. Pilih buku lain ya.",
        };
    }
    if (status === 404) {
        return { code: "not_found", message: "Berkas PDF-nya tidak ada di server asal." };
    }
    return {
        code: "network",
        message: "Gagal mengunduh buku. Cek koneksi internet, lalu coba lagi.",
    };
}

function cacheNameFor(id: string): string {
    return `${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`;
}

function pdfDirectory(): Directory {
    const dir = new Directory(Paths.cache, "pdfs");
    dir.create({ intermediates: true, idempotent: true });
    return dir;
}

//
// Urutan sumber: worker relay dulu (kalau aktif), lalu URL origin sebagai
// jaring pengaman. Fallback diam-diam: kalau worker mati, orang tua/anak tidak
// perlu tahu, buku tetap terbuka.
function sourcesFor(book: Book): string[] {
    if (!book.pdfUrl) return [];
    const list: string[] = [];
    if (RELAY_ENABLED) list.push(`${PDF_RELAY_URL}/books/pdf/${encodeURIComponent(book.id)}`);
    list.push(book.pdfUrl);
    return list;
}

async function download(
    file: File,
    url: string,
    controller: AbortController,
    onProgress: (p: PdfProgress) => void
): Promise<void> {
    const task = File.createDownloadTask(url, file, {
        headers: { "user-agent": CLIENT_UA, accept: "application/pdf" },
        signal: controller.signal,
        onProgress: ({ bytesWritten, totalBytes }) => {
            onProgress({ written: bytesWritten, total: totalBytes > 0 ? totalBytes : 0 });
        },
    });
    await task.downloadAsync();
}

export function usePdfLoader(book: Book) {
    const [uri, setUri] = useState<string | null>(null);
    const [error, setError] = useState<PdfError | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState<PdfProgress>({ written: 0, total: 0 });
    const [attempt, setAttempt] = useState(0);

    const controllerRef = useRef<AbortController | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            controllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        const sources = sourcesFor(book);

        setUri(null);
        setError(null);
        setProgress({ written: 0, total: book.bytes ?? 0 });

        if (sources.length === 0) {
            setError({ code: "no_url", message: "PDF untuk buku ini belum tersedia." });
            return;
        }

        let active = true;
        const controller = new AbortController();
        controllerRef.current = controller;

        async function resolveSource() {
            const file = new File(pdfDirectory(), cacheNameFor(book.id));

            // Pakai file cache kalau ada. Ukurannya dicek against manifest supaya
            // unduhan setengah yang tertinggal crash tidak dianggap buku utuh.
            if (file.exists && file.size > 0) {
                const expected = book.bytes;
                if (!expected || file.size === expected) {
                    if (active && mountedRef.current) setUri(file.uri);
                    return;
                }
                file.delete();
            }

            if (active && mountedRef.current) setIsDownloading(true);

            let lastError: unknown = null;
            for (const url of sources) {
                // 2 percobaan per sumber: 1x retry sebelum pindah ke sumber berikutnya.
                for (let attemptInSource = 0; attemptInSource < 2; attemptInSource++) {
                    if (controller.signal.aborted) throw abortError();
                    try {
                        if (active && mountedRef.current) {
                            setProgress({ written: 0, total: book.bytes ?? 0 });
                        }
                        await download(file, url, controller, (p) => {
                            if (active && mountedRef.current) {
                                setProgress({
                                    written: p.written,
                                    total: p.total || book.bytes || 0,
                                });
                            }
                        });
                        if (file.exists && file.size > 0) {
                            if (active && mountedRef.current) setUri(file.uri);
                            return;
                        }
                        lastError = new Error("Unduhan kosong (HTTP 200 tanpa isi).");
                    } catch (e) {
                        lastError = e;
                        if ((e as { name?: string })?.name === "AbortError") throw e;
                        // 410 = buku dicabut dari sumber (worker menyalin REMOVED).
                        // Terminal: retry maupun fallback ke origin tidak akan
                        // menolong, jangan sia-sia kuota & waktu pengguna.
                        // 404 sengaja BUKAN terminal: itu "unknown_book" kalau
                        // allowlist worker belum di-regenerate setelah manifest
                        // nambah buku, dan origin masih bisa melayaninya.
                        if (statusFromError(e) === 410) throw e;
                        // File parsial jangan disimpan: sisa unduhan bisa terbaca
                        // sebagai PDF utuh di percobaan berikutnya.
                        if (file.exists) {
                            try {
                                file.delete();
                            } catch {}
                        }
                    }
                }
            }
            throw lastError ?? new Error("Tidak ada sumber yang berhasil.");
        }

        resolveSource()
            .catch((e) => {
                if (!active || !mountedRef.current) return;
                setError(errorFrom(e));
            })
            .finally(() => {
                if (active && mountedRef.current) setIsDownloading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [book, attempt]);

    const retry = useCallback(() => setAttempt((n) => n + 1), []);
    const cancel = useCallback(() => controllerRef.current?.abort(), []);

    return { uri, error, isDownloading, progress, retry, cancel };
}
