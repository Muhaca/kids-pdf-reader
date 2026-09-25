// Worker relay passthrough untuk PDF buku anak.
//
// Sifat penting: TIDAK MENYIMPAN body PDF di mana pun (tidak ada R2, tidak ada
// caches.default). Worker hanya meneruskan stream dari server asal ke app dengan
// `cache-control: no-store`. Tidak ada salinan → tidak ada "penggandaan".
//
// Alamat tujuan SELALU diambil dari allowlist (worker/origins.generated.js),
// bukan dari query param. Tanpa itu worker ini akan jadi open proxy dan
// Cloudflare bisa menonaktifkannya otomatis karena laporan abuse.

import { ORIGINS, REMOVED, GENERATED_AT } from "./origins.generated.js";

// Identitas polite saat menyentuh server govt/kampus. Ganti kalau ada kontak resmi.
const UPSTREAM_UA = "Maca-PdfRelay/1.0 (+https://github.com/muhamadcasdi; educational reader)";

// Header upstream yang diteruskan apa adanya (Range & friends = 206, acak-acakan
// kalau dibuang). If-None-Match sengaja TIDAK diteruskan: relay ini no-store, jadi
// revalidasi tidak ada gunanya dan bisa menghasilkan 304 tanpa body.
const FORWARD_REQUEST_HEADERS = ["range", "if-range"];

// Header response yang diteruskan ke app.
const FORWARD_RESPONSE_HEADERS = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
];

const RETRY_DELAY_MS = 300;
const PDF_PATH = /^\/books\/pdf\/([^/]+)$/;

function json(status, code, message, extraHeaders = {}) {
    return new Response(JSON.stringify({ code, message }), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
            ...extraHeaders,
        },
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function lookup(id) {
    if (Object.prototype.hasOwnProperty.call(ORIGINS, id)) {
        return { kind: "ok", entry: ORIGINS[id] };
    }
    if (REMOVED.includes(id)) return { kind: "removed" };
    return { kind: "unknown" };
}

async function fetchUpstream(url, request) {
    const headers = new Headers({
        "user-agent": UPSTREAM_UA,
        accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.5",
        "accept-encoding": "identity",
    });
    for (const name of FORWARD_REQUEST_HEADERS) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
    }

    // Method diteruskan apa adanya: HEAD ke worker harus HEAD ke origin juga,
    // kalau tidak kita menyedot 100+ MB hanya untuk mengambil Content-Length.
    const method = request.method === "HEAD" ? "HEAD" : "GET";

    let lastError = null;
    // 2 percobaan: 1x retry saat 5xx / error jaringan.
    for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await sleep(RETRY_DELAY_MS);
        try {
            const upstream = await fetch(url, { method, headers, redirect: "follow" });
            if (upstream.status >= 500) {
                lastError = new Error(`upstream ${upstream.status}`);
                continue;
            }
            return upstream;
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError ?? new Error("upstream gagal");
}

function relayResponse(upstream, origin) {
    const headers = new Headers();
    for (const name of FORWARD_RESPONSE_HEADERS) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
    }
    headers.set("cache-control", "no-store");
    headers.set("access-control-allow-origin", "*");
    headers.set("access-control-expose-headers", FORWARD_RESPONSE_HEADERS.join(", "));
    headers.set("x-maca-origin", origin);

    // Method HEAD: bodynya sudah kosong dari upstream, header tetap sama seperti GET.
    return new Response(upstream.body, { status: upstream.status, headers });
}

async function handlePdf(request, id) {
    const found = lookup(id);

    if (found.kind === "removed") {
        return json(410, "book_removed", "Buku ini sudah tidak tersedia dari sumber aslinya.");
    }
    if (found.kind === "unknown") {
        return json(404, "unknown_book", "ID buku tidak dikenal.");
    }

    const { url, host, bytes } = found.entry;

    let upstream;
    try {
        upstream = await fetchUpstream(url, request);
    } catch (e) {
        return json(502, "upstream_failed", `Gagal menghubungi ${host}.`, {
            "x-maca-origin": host,
        });
    }

    // 404/410 dari server asal diteruskan apa adanya; app membedakan
    // "buku mati" dari "worker salah".
    if (upstream.status === 404 || upstream.status === 410) {
        return json(upstream.status, upstream.status === 410 ? "book_removed" : "origin_404", `Buku tidak ada di ${host}.`, {
            "x-maca-origin": host,
        });
    }

    const response = relayResponse(upstream, host);
    if (bytes > 0) response.headers.set("x-maca-bytes", String(bytes));
    return response;
}

export default {
    async fetch(request) {
        const { method } = request;
        if (method !== "GET" && method !== "HEAD") {
            return json(405, "method_not_allowed", "Hanya GET/HEAD.", { allow: "GET, HEAD" });
        }

        const url = new URL(request.url);

        if (url.pathname === "/health") {
            return json(200, "ok", "Maca PDF relay siap.", {
                "x-maca-generated-at": GENERATED_AT,
                "x-maca-books": String(Object.keys(ORIGINS).length),
                "x-maca-removed": String(REMOVED.length),
            });
        }

        const match = url.pathname.match(PDF_PATH);
        if (!match) {
            return json(404, "not_found", "Gunakan /books/pdf/:id atau /health.");
        }

        let id;
        try {
            id = decodeURIComponent(match[1]);
        } catch {
            return json(404, "unknown_book", "ID buku tidak dikenal.");
        }

        return handlePdf(request, id);
    },
};
