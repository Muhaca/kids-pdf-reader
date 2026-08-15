import { Book } from "../types/book";

export const mockBooks: Book[] = [
    {
        id: "1",
        title: "Aku Sudah Besar",
        emoji: "🐊",
        accent: "#4CAF7D",
        progress: 0.6,
        pdfSource: require("../../assets/pdfs/aku-sudah-besar.pdf"),
    },
    {
        id: "2",
        title: "Apa Itu",
        emoji: "🌽",
        accent: "#FFC857",
        progress: 1,
        // pdfSource: require("../../assets/pdfs/apa-itu.pdf"),
    },
    {
        id: "3",
        title: "Ini Atau Itu",
        emoji: "🧅",
        accent: "#FF6B6B",
        progress: 0,
        pdfSource: require("../../assets/pdfs/ini-atau-itu.pdf"),
    },
    { id: "4", title: "Malin Kundang", emoji: "⛵", accent: "#3E7CB1", progress: 0.3 },
    { id: "5", title: "Legenda Danau Toba", emoji: "🐟", accent: "#6C5CE7", progress: 0 },
    { id: "6", title: "Keong Mas", emoji: "🐚", accent: "#F0932B", progress: 0.85 },
    { id: "7", title: "Sangkuriang", emoji: "🐕", accent: "#22A6B3", progress: 0 },
    { id: "8", title: "Asal Reog\nPonorogo", emoji: "🦁", accent: "#EB4D4B", progress: 0 },
];