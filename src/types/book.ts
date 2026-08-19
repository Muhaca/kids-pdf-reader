export type Book = {
    id: string;
    title: string;
    category?: string;
    coverUrl?: string;
    emoji?: string; // sekarang opsional, fallback kalau coverUrl tidak ada
    accent: string;
    progress: number;
    pdfUrl: string;
};