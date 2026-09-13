import { useEffect, useState } from "react";
import { Directory, File, Paths } from "expo-file-system";
import { Book } from "../types/book";

function filenameFromUrl(url: string): string {
    const segments = url.split("/");
    return segments[segments.length - 1] || `book-${Date.now()}.pdf`;
}

export function usePdfLoader(book: Book) {
    const [uri, setUri] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        let mounted = true;

        setUri(null);
        setError(null);

        async function resolveSource() {
            if (!book.pdfUrl) {
                setError("PDF untuk buku ini belum tersedia.");
                return;
            }

            try {
                const destination = new Directory(Paths.cache, "pdfs");
                destination.create({ intermediates: true, idempotent: true });

                const localFile = new File(destination, filenameFromUrl(book.pdfUrl));

                if (localFile.exists) {
                    if (mounted) setUri(localFile.uri);
                    return;
                }

                if (mounted) setIsDownloading(true);
                const output = await File.downloadFileAsync(book.pdfUrl, destination);

                if (mounted && output.exists) {
                    setUri(output.uri);
                }
            } catch (e) {
                console.log("DOWNLOAD ERROR:", e);
                if (mounted) setError("Gagal mengunduh PDF. Cek koneksi internet kamu.");
            } finally {
                if (mounted) setIsDownloading(false);
            }
        }

        resolveSource();
        return () => {
            mounted = false;
        };
    }, [book]);

    return { uri, error, isDownloading };
}