import { Book } from "../types/book";

const MANIFEST_URL = "https://pub-1d459e9fb99a4971b924e584c7cd30a5.r2.dev/manifest.json";

export async function fetchBooks(): Promise<Book[]> {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`);

    return res.json();
}