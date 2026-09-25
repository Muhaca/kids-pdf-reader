export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "?";
    if (bytes < 1024) return `${bytes} B`;
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
    if (mb < 100) return `${mb.toFixed(1).replace(".", ",")} MB`;
    return `${Math.round(mb)} MB`;
}
