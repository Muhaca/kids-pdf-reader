export type Book = {
    id: string;
    title: string;
    emoji: string;
    accent: string;
    progress: number;
    pdfSource?: any; // require('../assets/pdfs/xxx.pdf')
};