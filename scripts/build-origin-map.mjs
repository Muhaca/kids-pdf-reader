#!/usr/bin/env node
// GENERATOR — jangan edit worker/origins.generated.js secara manual.
//
// Ambil manifest live dari R2, lalu tulis allowlist { id -> { url, host, bytes } }.
// Allowlist ini yang membuat worker relay TIDAK bisa jadi open proxy: worker hanya
// boleh meneruskan URL yang ada di daftar ini, bukan dari query param.
//
//   node scripts/build-origin-map.mjs                 # pakai MANIFEST_URL default
//   MANIFEST_URL=... node scripts/build-origin-map.mjs # manifest lain (mis. lokal)
//   node scripts/build-origin-map.mjs --offline       # pakai salinan /tmp/manifest.json
//   node scripts/build-origin-map.mjs --sizes ../kids-book-uploader/books/manifest.json
//
// --sizes mengisi kolom `bytes` dari manifest yang sudah diaudit (hasil
// kids-book-uploader/scripts/audit-sizes.js). Tanpa flag itu bytes = 0 (unknown).
//
// Daftar REMOVED dibaca dari worker/removed.txt (file yang disunting manual) lalu
// digabung dengan REMOVED dari generate sebelumnya. Id yang ada di REMOVED TIDAK
// ikut masuk ORIGINS — kalau ikut, lookup di worker/index.js akan menemukan
// ORIGINS lebih dulu dan tetap melayaninya, bukan membalas 410.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "worker", "origins.generated.js");
const REMOVED_LIST = path.join(ROOT, "worker", "removed.txt");
const OFFLINE_COPY = "/tmp/manifest.json";
const DEFAULT_MANIFEST =
    "https://portfolio-assets.muhamadcasdi.workers.dev/books/manifest.json";

function flag(name, fallback) {
    const argv = process.argv.slice(2);
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
}

const manifestUrl = process.env.MANIFEST_URL || DEFAULT_MANIFEST;
const offline = process.argv.includes("--offline");
const sizesPath = flag("sizes", null);

async function readManifest() {
    if (offline) {
        if (!existsSync(OFFLINE_COPY)) {
            throw new Error(`--offline tapi ${OFFLINE_COPY} tidak ada`);
        }
        return JSON.parse(await readFile(OFFLINE_COPY, "utf8"));
    }
    const res = await fetch(manifestUrl, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Manifest HTTP ${res.status} dari ${manifestUrl}`);
    return await res.json();
}

async function readJson(file) {
    return JSON.parse(await readFile(file, "utf8"));
}

// Gabungan: worker/removed.txt (disunting manual) + REMOVED dari generate sebelumnya.
async function readRemoved() {
    const ids = new Set();
    if (existsSync(REMOVED_LIST)) {
        const raw = await readFile(REMOVED_LIST, "utf8");
        for (const line of raw.split("\n")) {
            const id = line.trim();
            if (id && !id.startsWith("#")) ids.add(id);
        }
    }
    if (existsSync(OUT)) {
        const src = await readFile(OUT, "utf8");
        const match = src.match(/export const REMOVED = \[([\s\S]*?)\];/);
        if (match) for (const m of match[1].matchAll(/"([^"]+)"/g)) ids.add(m[1]);
    }
    return [...ids];
}

function hostOf(url) {
    try {
        return new URL(url).host;
    } catch {
        return null;
    }
}

async function main() {
    const manifest = await readManifest();
    if (!Array.isArray(manifest) || manifest.length === 0) {
        throw new Error("Manifest bukan array / kosong");
    }

    // Kolom bytes opsional: diisi dari manifest hasil audit ukuran.
    let sizes = null;
    if (sizesPath) {
        if (!existsSync(sizesPath)) throw new Error(`--sizes: ${sizesPath} tidak ada`);
        sizes = new Map(
            (await readJson(sizesPath)).map((b) => [b.id, Number(b.bytes) || 0])
        );
    }

    const origins = {};
    const problems = [];
    const hosts = new Map();
    const withoutSize = [];

    const removed = await readRemoved();
    const removedSet = new Set(removed);
    const stillListed = [];

    for (const book of manifest) {
        const id = book?.id;
        const url = book?.pdfUrl;
        if (!id || !url) {
            problems.push(`buku tanpa id/pdfUrl: ${JSON.stringify(book).slice(0, 80)}`);
            continue;
        }
        if (removedSet.has(id)) {
            // Masih ada di manifest tapi sudah dicabut: worker harus balas 410.
            stillListed.push(id);
            continue;
        }
        const host = hostOf(url);
        if (!host) {
            problems.push(`URL tidak valid untuk "${id}": ${url}`);
            continue;
        }
        if (!url.startsWith("https://")) {
            problems.push(`bukan https untuk "${id}": ${url}`);
            continue;
        }
        if (origins[id]) {
            problems.push(`id duplikat: "${id}" — entri kedua diabaikan`);
            continue;
        }
        const bytes = sizes?.get(id) ?? 0;
        if (bytes <= 0) withoutSize.push(id);
        origins[id] = { url, host, bytes };
        hosts.set(host, (hosts.get(host) ?? 0) + 1);
    }

    // Buku yang ada di audit tapi hilang dari manifest sumber dicurigai tidak
    // sengaja dihapus, bukan REMOVED. Yang di REMOVED sengaja, jadi jangan dilaporkan.
    if (sizes) {
        const liveIds = new Set([...Object.keys(origins), ...removedSet]);
        const missing = [...sizes.keys()].filter((id) => !liveIds.has(id));
        if (missing.length) {
            console.warn(`⚠️  ${missing.length} id ada di audit tapi tidak di manifest live:`);
            for (const id of missing.slice(0, 20)) console.warn(`   - ${id}`);
        }
    }

    const sizesSource = sizesPath
        ? `// bytes : ${sizesPath}`
        : "// bytes : 0 (belum diaudit — jalankan ulang dengan --sizes)";

    const lines = [
        "// ---------------------------------------------------------------------------",
        "// GENERATED OLEM scripts/build-origin-map.mjs — JANGAN EDIT MANUAL.",
        `// Sumber: ${offline ? OFFLINE_COPY : manifestUrl}`,
        `// Dibuat: ${new Date().toISOString()}`,
        "//",
        "// Allowlist id -> URL asal. Worker relay hanya boleh meneruskan URL dari sini,",
        "// tidak dari query param — tanpa itu worker jadi open proxy.",
        sizesSource,
        "// ---------------------------------------------------------------------------",
        "",
        `export const GENERATED_AT = ${JSON.stringify(new Date().toISOString())};`,
        `export const MANIFEST_SOURCE = ${JSON.stringify(offline ? OFFLINE_COPY : manifestUrl)};`,
        "",
        `export const ORIGINS = {`,
        ...Object.keys(origins)
            .sort()
            .map((id) => {
                const { url, host, bytes } = origins[id];
                return `    ${JSON.stringify(id)}: { url: ${JSON.stringify(url)}, host: ${JSON.stringify(host)}, bytes: ${bytes} },`;
            }),
        `};`,
        "",
        "// id yang sengaja dicabut dari sumber. Worker membalas 410 (bukan 404) supaya",
        "// app bisa menampilkan pesan yang tepat, bukan 'buku tidak ditemukan'.",
        `export const REMOVED = [`,
        ...removed.map((id) => `    ${JSON.stringify(id)},`),
        `];`,
        "",
    ].join("\n");

    await writeFile(OUT, lines, "utf8");

    const allBytes = Object.values(origins).map((o) => o.bytes);
    console.log(`✅ ${OUT}`);
    console.log(`   sumber     : ${offline ? OFFLINE_COPY : manifestUrl}`);
    console.log(`   entri      : ${Object.keys(origins).length} buku`);
    console.log(`   removed    : ${removed.length} id`);
    if (stillListed.length) {
        console.log(`   ⚠️  masih ada di manifest tapi di-REMOVED: ${stillListed.join(", ")}`);
    }
    console.log(`   host aktif : ${hosts.size}`);
    for (const [host, count] of [...hosts].sort((a, b) => b[1] - a[1])) {
        console.log(`     - ${host} (${count})`);
    }
    if (sizes) {
        const known = allBytes.filter((b) => b > 0);
        const total = known.reduce((a, b) => a + b, 0);
        console.log(
            `   bytes      : ${known.length} buku terukur · total ${(total / 1024 / 1024).toFixed(0)} MB · ` +
                `terbesar ${(Math.max(...known, 0) / 1024 / 1024).toFixed(1)} MB`
        );
        if (withoutSize.length) {
            console.log(`   tanpa size : ${withoutSize.length} → ${withoutSize.slice(0, 5).join(", ")}`);
        }
    }
    if (problems.length) {
        console.warn(`\n⚠️  ${problems.length} masalah:`);
        for (const p of problems) console.warn(`   - ${p}`);
        process.exitCode = 1;
    }
}

main().catch((e) => {
    console.error(`❌ ${e.message}`);
    process.exit(1);
});
