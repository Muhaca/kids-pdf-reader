export type Book = {
    id: string;
    title: string;
    category?: string;
    coverUrl?: string;
    emoji?: string; // sekarang opsional, fallback kalau coverUrl tidak ada
    accent: string;
    progress: number;
    pdfUrl: string;
    bytes?: number; // ukuran PDF dari audit HEAD di server asal (opsional)
    origin?: string; // host server asal, mis. "budi.kemendikdasmen.go.id"
    removed?: boolean; // true = sengaja dicabut dari sumber
    verifiedAt?: string; // kapan bytes/origin terakhir dicek
    source?: string; // Frontiers: Credit Front (file .source-<id>.json di R2)
    story?: string[]; // teks per halaman (halaman ke-N = index N-1), dipakai baca nyaring
    mixedPages?: boolean; // true = PDF berisi halaman vertical & horizontal campur
};