export type Book = {
    id: string;
    title: string;
    category?: string;
    coverUrl?: string;
    emoji?: string; // sekarang opsional, fallback kalau coverUrl tidak ada
    accent: string;
    progress: number;
    pdfUrl: string;
    story?: string[]; // teks per halaman (halaman ke-N = index N-1), dipakai baca nyaring
    mixedPages?: boolean; // true = PDF berisi halaman vertical & horizontal campur
};