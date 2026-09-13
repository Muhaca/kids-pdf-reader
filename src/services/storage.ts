import { File, Paths } from "expo-file-system";
import { Book } from "../types/book";

const DATA_FILE = "kids-reader-data.json";

type ManifestCache = {
    etag: string | null;
    fetchedAt: number;
    books: Book[];
};

type AppData = {
    values: Record<string, string>;
    manifest?: ManifestCache;
    progress?: Record<string, number>;
};

function dataFile(): File {
    return new File(Paths.document, DATA_FILE);
}

function readData(): AppData {
    const file = dataFile();
    if (!file.exists) return { values: {} };
    try {
        const parsed = JSON.parse(file.textSync()) as Partial<AppData>;
        return { values: {}, ...parsed };
    } catch {
        return { values: {} };
    }
}

function writeData(data: AppData): void {
    const file = dataFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(data));
}

export function getItem(key: string): string | null {
    const data = readData();
    return data.values[key] ?? null;
}

export function setItem(key: string, value: string): void {
    const data = readData();
    data.values[key] = value;
    writeData(data);
}

export function readManifestCache(): ManifestCache | null {
    return readData().manifest ?? null;
}

export function writeManifestCache(books: Book[], etag: string | null): void {
    const data = readData();
    data.manifest = { etag, fetchedAt: Date.now(), books };
    writeData(data);
}

export function getAllProgress(): Record<string, number> {
    return readData().progress ?? {};
}

export function setProgress(bookId: string, fraction: number): void {
    const data = readData();
    data.progress = { ...(data.progress ?? {}), [bookId]: Math.min(Math.max(fraction, 0), 1) };
    writeData(data);
}