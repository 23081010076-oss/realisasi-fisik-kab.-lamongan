# 📦 PANDUAN INSTALASI
# ERP Realisasi Fisik Kabupaten Lamongan

---

## ✅ Prasyarat (Wajib Diinstall Terlebih Dahulu)

| Software | Versi Minimum | Download |
|----------|--------------|---------|
| Node.js | 18.x atau lebih | https://nodejs.org |
| PostgreSQL | 14.x atau lebih | https://www.postgresql.org/download/windows/ |
| Git (opsional) | - | https://git-scm.com |

> **Catatan:** Saat install PostgreSQL, catat username dan password yang dibuat. Default biasanya `postgres` / `postgres`.

---

## 🗂️ Langkah 1 — Siapkan Folder Project

Ekstrak atau salin folder project ke lokasi yang diinginkan, misalnya:
```
D:\BErflamongan\
```

Pastikan struktur folder seperti ini:
```
BErflamongan/
├── backend/
├── frontend/
├── package.json
└── PANDUAN_INSTALASI.md
```

---

## 🗄️ Langkah 2 — Buat Database PostgreSQL

### Menggunakan pgAdmin (GUI)
1. Buka **pgAdmin**
2. Klik kanan **Databases** → **Create** → **Database**
3. Isi nama: `erp_lamongan`
4. Klik **Save**

### Menggunakan Command Line
```powershell
psql -U postgres
```
```sql
CREATE DATABASE erp_lamongan;
\q
```

---

## ⚙️ Langkah 3 — Konfigurasi Environment Backend

Buka file `backend\.env` (buat jika belum ada), isi dengan:

```env
DATABASE_URL="postgresql://postgres:PASSWORDANDA@localhost:5432/erp_lamongan"
JWT_SECRET="erp-lamongan-super-secret-key-change-in-production-2026"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

> **Ganti `PASSWORDANDA`** dengan password PostgreSQL Anda.
> Contoh jika password `postgres`: `postgresql://postgres:postgres@localhost:5432/erp_lamongan`

---

## 📦 Langkah 4 — Install Dependencies

Buka **PowerShell** atau **Command Prompt**, jalankan:

```powershell
# Install dependencies backend
cd D:\BErflamongan\backend
npm install

# Install dependencies frontend
cd D:\BErflamongan\frontend
npm install
```

---

## 🗃️ Langkah 5 — Setup Database (Migrasi & Seed)

```powershell
cd D:\BErflamongan\backend

# Generate Prisma Client
npx prisma generate

# Jalankan migrasi (buat semua tabel di database)
npx prisma migrate deploy

# Isi data awal (admin, OPD contoh, paket contoh)
npm run db:seed
```

Setelah selesai, database akan memiliki:
- User **admin** untuk login pertama kali
- Beberapa OPD contoh
- Beberapa paket pekerjaan contoh

---

## 🚀 Langkah 6 — Jalankan Aplikasi

Buka **2 terminal terpisah**:

**Terminal 1 — Backend:**
```powershell
cd D:\BErflamongan\backend
npm run dev
```
Backend berjalan di: `http://localhost:4000`

**Terminal 2 — Frontend:**
```powershell
cd D:\BErflamongan\frontend
npm run dev
```
Frontend berjalan di: `http://localhost:5173`

---

## 🔑 Langkah 7 — Login Pertama Kali

Buka browser, akses: **http://localhost:5173**

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@lamongan.go.id` | `admin123` |

> Segera ganti password setelah login pertama!

---

## 🛠️ Troubleshooting

### ❌ Error: `prisma generate` gagal
```powershell
cd D:\BErflamongan\backend
npm install
npx prisma generate
```

### ❌ Error: Cannot connect to database
- Pastikan service PostgreSQL sedang berjalan
- Buka **Services** Windows → cari `postgresql` → Start
- Atau via PowerShell:
```powershell
net start postgresql-x64-18
# (sesuaikan angka versi PostgreSQL Anda)
```

### ❌ Error: Port already in use
```powershell
# Cek proses di port 4000
netstat -ano | findstr :4000
# Matikan proses (ganti PID_NUMBER dengan angka dari output di atas)
taskkill /PID PID_NUMBER /F

# Cek proses di port 5173
netstat -ano | findstr :5173
taskkill /PID PID_NUMBER /F
```

### ❌ Error: Module not found
```powershell
# Hapus node_modules dan install ulang
cd D:\BErflamongan\backend
Remove-Item -Recurse -Force node_modules
npm install

cd D:\BErflamongan\frontend
Remove-Item -Recurse -Force node_modules
npm install
```

### ❌ Error: Invalid DATABASE_URL
- Cek file `backend\.env`
- Pastikan format: `postgresql://username:password@localhost:5432/erp_lamongan`
- Pastikan tidak ada spasi di dalam URL

---

## 🖥️ Melihat & Mengelola Database

### Via Prisma Studio (Rekomendasi)
```powershell
cd D:\BErflamongan\backend
npx prisma studio
```
Buka: `http://localhost:5555`

### Via pgAdmin
- Buka pgAdmin → Servers → PostgreSQL → Databases → `erp_lamongan` → Schemas → Tables

---

## 📁 Struktur Folder Penting

```
BErflamongan/
├── backend/
│   ├── .env                    ← Konfigurasi database & JWT
│   ├── prisma/
│   │   └── schema.prisma       ← Definisi tabel database
│   ├── src/
│   │   ├── controllers/        ← Logic API
│   │   ├── routes/             ← Endpoint URL
│   │   ├── services/           ← Business logic
│   │   └── prisma/
│   │       └── seed.js         ← Data awal
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              ← Halaman-halaman
│   │   ├── components/         ← Komponen reusable
│   │   ├── services/           ← Koneksi ke API
│   │   └── stores/             ← State management
│   └── package.json
└── PANDUAN_INSTALASI.md        ← File ini
```

---

## 📞 Informasi Teknis

| Item | Nilai |
|------|-------|
| Backend URL | http://localhost:4000 |
| Frontend URL | http://localhost:5173 |
| Database | PostgreSQL — `erp_lamongan` |
| Prisma Studio | http://localhost:5555 |

---

*Panduan ini dibuat untuk ERP Realisasi Fisik Kabupaten Lamongan — Februari 2026*
