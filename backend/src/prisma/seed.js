import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.paketProgress.deleteMany();
  await prisma.document.deleteMany();
  await prisma.paket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.opd.deleteMany();

  // Create OPDs
  const rsud = await prisma.opd.create({
    data: {
      code: "RSUD",
      name: "Rumah Sakit Umum Daerah Dr. Soegiri",
      kepala: "dr. H. Ahmad Fauzi, Sp.OG",
      contact: "0322-311234",
      address: "Jl. Dr. Soetomo No. 63, Lamongan",
    },
  });

  const dpu = await prisma.opd.create({
    data: {
      code: "DPU",
      name: "Dinas Pekerjaan Umum dan Penataan Ruang",
      kepala: "Ir. H. Budi Santoso, MT",
      contact: "0322-312345",
      address: "Jl. Basuki Rahmat No. 10, Lamongan",
    },
  });

  const disdik = await prisma.opd.create({
    data: {
      code: "DISDIK",
      name: "Dinas Pendidikan",
      kepala: "Drs. H. Suharto, M.Pd",
      contact: "0322-313456",
      address: "Jl. Veteran No. 5, Lamongan",
    },
  });

  const dinkes = await prisma.opd.create({
    data: {
      code: "DINKES",
      name: "Dinas Kesehatan",
      kepala: "dr. Hj. Siti Maryam, M.Kes",
      contact: "0322-314567",
      address: "Jl. Panglima Sudirman No. 25, Lamongan",
    },
  });

  console.log("✅ OPD created");

  // Create Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@lamongan.go.id",
      password: adminPassword,
      name: "Administrator",
      role: "ADMIN",
    },
  });

  const rsudPassword = await bcrypt.hash("rsud123", 10);
  const rsudUser = await prisma.user.create({
    data: {
      email: "rsud@lamongan.go.id",
      password: rsudPassword,
      name: "User RSUD",
      role: "OPD",
      opdId: rsud.id,
    },
  });

  const dpuPassword = await bcrypt.hash("dpu123", 10);
  const dpuUser = await prisma.user.create({
    data: {
      email: "dpu@lamongan.go.id",
      password: dpuPassword,
      name: "User DPU",
      role: "OPD",
      opdId: dpu.id,
    },
  });

  console.log("✅ Users created");

  // Create Pakets
  const currentYear = 2026;

  // RSUD - Gedung Cathlab
  const paket1 = await prisma.paket.create({
    data: {
      code: "PKT-001-2026",
      name: "Pembangunan Gedung Cathlab",
      kategori: "KONSTRUKSI",
      opdId: rsud.id,
      kegiatan: "Gedung Cathlab",
      lokasi: "RSUD Dr SOEGIRI LAMONGAN",
      nilai: 15000000000,
      nilaiRealisasi: 3750000000,
      progres: 25,
      tahun: currentYear,
      status: "ACTIVE",
      tanggalMulai: new Date("2026-01-15"),
      tanggalSelesai: new Date("2026-12-31"),
    },
  });

  // RSUD - Pagar Depan RS
  const paket2 = await prisma.paket.create({
    data: {
      code: "PKT-002-2026",
      name: "Pembangunan Pagar Depan RS",
      kategori: "KONSTRUKSI",
      opdId: rsud.id,
      kegiatan: "Pagar Depan RS",
      lokasi: "RSUD Dr SOEGIRI LAMONGAN",
      nilai: 500000000,
      nilaiRealisasi: 125000000,
      progres: 25,
      tahun: currentYear,
      status: "ACTIVE",
      tanggalMulai: new Date("2026-01-20"),
      tanggalSelesai: new Date("2026-06-30"),
    },
  });

  // RSUD - Rehabilitasi Lahan Parkir
  const paket3 = await prisma.paket.create({
    data: {
      code: "PKT-003-2026",
      name: "Rehabilitasi Lahan Parkir (Eks. Gedung Anggrek)",
      kategori: "KONSTRUKSI",
      opdId: rsud.id,
      kegiatan: "Rehabilitasi Lahan Parkir ( Eks. Gedung Anggrek)",
      lokasi: "RSUD Dr SOEGIRI LAMONGAN",
      nilai: 750000000,
      nilaiRealisasi: 0,
      progres: 0,
      tahun: currentYear,
      status: "PENDING",
      tanggalMulai: new Date("2026-03-01"),
    },
  });

  // RSUD - Drainase Lahan Parkir
  const paket4 = await prisma.paket.create({
    data: {
      code: "PKT-004-2026",
      name: "Drainase Lahan Parkir (Eks. Gedung Anggrek)",
      kategori: "KONSTRUKSI",
      opdId: rsud.id,
      kegiatan: "Drainase Lahan Parkir (Eks. Gedung Anggrek)",
      lokasi: "RSUD Dr SOEGIRI LAMONGAN",
      nilai: 300000000,
      nilaiRealisasi: 0,
      progres: 0,
      tahun: currentYear,
      status: "PENDING",
      tanggalMulai: new Date("2026-04-01"),
    },
  });

  // DPU - Jalan dan Jembatan
  const paket5 = await prisma.paket.create({
    data: {
      code: "PKT-005-2026",
      name: "Pembangunan Jalan Kabupaten",
      kategori: "KONSTRUKSI",
      opdId: dpu.id,
      kegiatan: "Peningkatan Jalan Kabupaten",
      lokasi: "Kecamatan Lamongan",
      nilai: 5000000000,
      nilaiRealisasi: 2000000000,
      progres: 40,
      tahun: currentYear,
      status: "ACTIVE",
      tanggalMulai: new Date("2026-02-01"),
      tanggalSelesai: new Date("2026-11-30"),
    },
  });

  // Disdik - Konsultansi
  const paket6 = await prisma.paket.create({
    data: {
      code: "PKT-006-2026",
      name: "Konsultansi Perencanaan Gedung Sekolah",
      kategori: "KONSULTANSI",
      opdId: disdik.id,
      kegiatan: "DED Pembangunan SD Negeri 1 Lamongan",
      lokasi: "SD Negeri 1 Lamongan",
      nilai: 250000000,
      nilaiRealisasi: 187500000,
      progres: 75,
      tahun: currentYear,
      status: "ACTIVE",
      tanggalMulai: new Date("2026-01-10"),
      tanggalSelesai: new Date("2026-05-31"),
    },
  });

  const paket7 = await prisma.paket.create({
    data: {
      code: "PKT-007-2026",
      name: "Konsultansi Pengawasan Gedung Sekolah",
      kategori: "KONSULTANSI",
      opdId: disdik.id,
      kegiatan: "Pengawasan Pembangunan SD Negeri 2 Lamongan",
      lokasi: "SD Negeri 2 Lamongan",
      nilai: 150000000,
      nilaiRealisasi: 75000000,
      progres: 50,
      tahun: currentYear,
      status: "ACTIVE",
      tanggalMulai: new Date("2026-02-15"),
    },
  });

  // Dinkes - Konsultansi
  const paket8 = await prisma.paket.create({
    data: {
      code: "PKT-008-2026",
      name: "Konsultansi Manajemen Puskesmas",
      kategori: "KONSULTANSI",
      opdId: dinkes.id,
      kegiatan: "Peningkatan Kapasitas SDM Puskesmas",
      lokasi: "Puskesmas se-Kabupaten Lamongan",
      nilai: 400000000,
      nilaiRealisasi: 120000000,
      progres: 30,
      tahun: currentYear,
      status: "ACTIVE",
      tanggalMulai: new Date("2026-01-05"),
    },
  });

  console.log("✅ Paket created");

  // Create Progress records
  await prisma.paketProgress.create({
    data: {
      paketId: paket1.id,
      progres: 25,
      nilaiRealisasi: 3750000000,
      keterangan: "Progress bulan Februari 2026",
      tanggal: new Date("2026-02-05"),
    },
  });

  await prisma.paketProgress.create({
    data: {
      paketId: paket2.id,
      progres: 25,
      nilaiRealisasi: 125000000,
      keterangan: "Progress bulan Februari 2026",
      tanggal: new Date("2026-02-05"),
    },
  });

  console.log("✅ Progress records created");

  console.log("");
  console.log("🎉 Seed completed successfully!");
  console.log("");
  console.log("📝 Default users:");
  console.log("   Admin:");
  console.log("   - Email: admin@lamongan.go.id");
  console.log("   - Password: admin123");
  console.log("");
  console.log("   RSUD User:");
  console.log("   - Email: rsud@lamongan.go.id");
  console.log("   - Password: rsud123");
  console.log("");
  console.log("   DPU User:");
  console.log("   - Email: dpu@lamongan.go.id");
  console.log("   - Password: dpu123");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
