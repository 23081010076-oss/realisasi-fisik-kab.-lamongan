/**
 * Parse file .sql MySQL dump → jalankan importFisik secara batch
 *
 * Cara pakai:
 *   1. Simpan file .sql dump MySQL di path di bawah
 *   2. node src/prisma/importFisikFromSql.js
 */

import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ← Ganti path ini sesuai lokasi file .sql kamu
const SQL_FILE = "D:/BErflamongan/backend/fisik_full.sql";

// ─── HELPERS ──────────────────────────────────────────────────────────
function parseAngka(str) {
  if (!str) return 0;
  const num = parseFloat(String(str).replace(/,/g, "").trim());
  return isNaN(num) ? 0 : num;
}

function mapKategori(jasa) {
  const j = (jasa || "").toLowerCase();
  if (j.includes("konstruksi")) return "KONSTRUKSI";
  if (j.includes("konsultan") || j.includes("konsultasi")) return "KONSULTANSI";
  if (j.includes("barang")) return "BARANG";
  return "JASA_LAINNYA";
}

function mapStatus(pct) {
  if (pct >= 100) return "COMPLETED";
  if (pct > 0) return "ACTIVE";
  return "PENDING";
}

async function findOpd(skpdName, cache) {
  if (cache[skpdName]) return cache[skpdName];
  let opd = await prisma.opd.findFirst({
    where: { name: { equals: skpdName, mode: "insensitive" } },
  });
  if (!opd) {
    const words = skpdName.split(/\s+/).filter((w) => w.length >= 5);
    for (const word of words) {
      opd = await prisma.opd.findFirst({
        where: { name: { contains: word, mode: "insensitive" } },
      });
      if (opd) break;
    }
  }
  if (opd) cache[skpdName] = opd;
  return opd;
}

/**
 * Parse blok INSERT INTO `fisik` (...) VALUES (...) dari SQL dump
 * Mengembalikan array of plain objects sesuai urutan kolom
 */
function parseSqlInserts(sql) {
  const COLUMNS = [
    "id",
    "jasa",
    "th_anggaran",
    "skpd",
    "kegiatan",
    "lokasi",
    "no_kontrak",
    "tgl_kontrak",
    "nilai_kontrak",
    "no_spnk",
    "tgl_spnk",
    "nilai_spnk",
    "pagu",
    "hps",
    "pelaksana",
    "rencana",
    "realisasi",
    "deviasi",
    "foto1",
    "foto2",
    "foto3",
    "foto4",
    "tgl_update",
    "prosentase",
  ];

  const rows = [];
  // Cocokkan setiap baris INSERT multi-value
  const insertRegex = /INSERT INTO `fisik`[^;]+;/gs;
  const matches = sql.match(insertRegex) || [];

  for (const block of matches) {
    // Ambil bagian VALUES
    const valPart = block.replace(/INSERT INTO `fisik`.*?VALUES\s*/is, "");
    // Split per tuple (...)
    const tupleRegex = /\(([^)]*(?:'[^']*'[^)]*)*)\)/g;
    let tupleMatch;
    while ((tupleMatch = tupleRegex.exec(valPart)) !== null) {
      const raw = tupleMatch[1];
      // Parse CSV dengan memperhatikan string dalam tanda kutip
      const values = [];
      let inStr = false;
      let cur = "";
      for (let i = 0; i < raw.length; i++) {
        const c = raw[i];
        if (c === "'" && raw[i - 1] !== "\\") {
          inStr = !inStr;
        } else if (c === "," && !inStr) {
          values.push(cur.trim().replace(/^'|'$/g, ""));
          cur = "";
        } else {
          cur += c;
        }
      }
      values.push(cur.trim().replace(/^'|'$/g, ""));

      const obj = {};
      COLUMNS.forEach((col, i) => {
        obj[col] = values[i] ?? "";
      });
      rows.push(obj);
    }
  }

  return rows;
}

// ─── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`📂 Membaca file: ${SQL_FILE}`);
  const sql = readFileSync(SQL_FILE, { encoding: "latin1" }); // charset MySQL dump
  const rows = parseSqlInserts(sql);
  console.log(`📊 Ditemukan ${rows.length} baris\n`);

  const opdCache = {};
  const defaultOpd = await prisma.opd.findFirst({ where: { isActive: true } });

  let rawOk = 0,
    rawFail = 0,
    paketOk = 0,
    paketFail = 0;
  const BATCH = 50;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // ── Raw insert fisik ──
    try {
      await prisma.fisik.upsert({
        where: { id: parseInt(row.id) },
        update: {},
        create: {
          id: parseInt(row.id),
          jasa: row.jasa,
          thAnggaran: row.th_anggaran,
          skpd: row.skpd,
          kegiatan: row.kegiatan,
          lokasi: row.lokasi,
          noKontrak: row.no_kontrak,
          tglKontrak: new Date(row.tgl_kontrak),
          nilaiKontrak: row.nilai_kontrak,
          noSpnk: row.no_spnk,
          tglSpnk: new Date(row.tgl_spnk),
          nilaiSpnk: new Date(row.nilai_spnk || row.tgl_spnk),
          pagu: row.pagu,
          hps: row.hps,
          pelaksana: row.pelaksana,
          rencana: row.rencana,
          realisasi: row.realisasi,
          deviasi: row.deviasi,
          foto1: row.foto1 || "",
          foto2: row.foto2 || "",
          foto3: row.foto3 || "",
          foto4: row.foto4 || "",
          tglUpdate: new Date(row.tgl_update),
          prosentase: row.prosentase,
        },
      });
      rawOk++;
    } catch (e) {
      rawFail++;
    }

    // ── Konversi ke paket ──
    const opd = await findOpd(row.skpd, opdCache);
    const targetOpd = opd || defaultOpd;
    if (!targetOpd) {
      paketFail++;
      continue;
    }

    const nilai = parseAngka(row.nilai_kontrak);
    const pagu = parseAngka(row.pagu);
    const progres = parseFloat(row.prosentase) || 0;
    const nilaiRealisasi = Math.round((progres / 100) * nilai);
    const tahun = parseInt(row.th_anggaran) || 2026;
    const code =
      `${row.no_kontrak}-${tahun}`
        .replace(/[^a-zA-Z0-9\-_\/]/g, "")
        .slice(0, 50) || `FISIK-${row.id}`;

    try {
      await prisma.paket.upsert({
        where: { code },
        update: { progres, nilaiRealisasi, status: mapStatus(progres) },
        create: {
          code,
          name: row.kegiatan,
          kategori: mapKategori(row.jasa),
          opdId: targetOpd.id,
          kegiatan: row.kegiatan,
          lokasi: row.lokasi,
          nilai,
          pagu,
          nilaiRealisasi,
          progres,
          tahun,
          status: mapStatus(progres),
          nomorKontrak: row.no_kontrak,
          noSPMK: row.no_spnk,
          pelaksana: row.pelaksana,
          sumberDana: row.hps || "APBD",
          tanggalMulai: new Date(row.tgl_kontrak),
          tanggalSelesai: new Date(row.nilai_spnk || row.tgl_spnk),
          createdAt: new Date(row.tgl_update),
          updatedAt: new Date(row.tgl_update),
        },
      });
      paketOk++;
    } catch (e) {
      paketFail++;
    }

    // Progress setiap 50 baris
    if ((i + 1) % BATCH === 0) {
      process.stdout.write(`\r  Diproses: ${i + 1}/${rows.length} ...`);
    }
  }

  console.log(`\n
═══════════════════════════════════════════════════
 Tabel fisik  → ✅ ${rawOk}   ❌ ${rawFail} gagal
 Tabel paket  → ✅ ${paketOk}   ❌ ${paketFail} gagal
═══════════════════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
