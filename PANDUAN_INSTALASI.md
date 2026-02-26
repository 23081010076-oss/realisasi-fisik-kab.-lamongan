# 📦 PANDUAN INSTALASI

# ERP Realisasi Fisik Kabupaten Lamongan

---

## ✅ Prasyarat (Wajib Diinstall Terlebih Dahulu)

| Software       | Versi Minimum   | Download                                     |
| -------------- | --------------- | -------------------------------------------- |
| Node.js        | 18.x atau lebih | https://nodejs.org                           |
| PostgreSQL     | 14.x atau lebih | https://www.postgresql.org/download/windows/ |
| Git (opsional) | -               | https://git-scm.com                          |

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

| Role          | Email                  | Password   |
| ------------- | ---------------------- | ---------- |
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

| Item          | Nilai                       |
| ------------- | --------------------------- |
| Backend URL   | http://localhost:4000       |
| Frontend URL  | http://localhost:5173       |
| Database      | PostgreSQL — `erp_lamongan` |
| Prisma Studio | http://localhost:5555       |

---

---

# 🚢 PANDUAN DEPLOYMENT (PRODUCTION)

Ada **2 cara** untuk deploy ke server/komputer lain:

---

## 🐳 Cara A — Docker (Paling Mudah, Direkomendasikan)

### Prasyarat Server

- Docker Desktop (Windows): https://www.docker.com/products/docker-desktop/
- Docker Engine (Linux): `sudo apt install docker.io docker-compose`

### Langkah Deploy dengan Docker

**1. Salin seluruh folder project ke server**

**2. Buat file `.env` di root folder project:**

```env
DB_PASSWORD=passwordkuat123
JWT_SECRET=jwt-secret-sangat-panjang-dan-aman-minimal-32-karakter
```

**3. Edit `docker-compose.yml` — sesuaikan password:**

```yaml
# Ganti bagian ini:
POSTGRES_PASSWORD: postgres # → ganti dengan password kuat
JWT_SECRET: your-super-secret-... # → ganti dengan JWT secret kuat
DATABASE_URL: postgresql://postgres:postgres@... # → sesuaikan password
```

**4. Jalankan semua service:**

```powershell
cd D:\BErflamongan

# Build dan jalankan (pertama kali agak lama)
docker-compose up -d --build

# Cek status semua container
docker-compose ps
```

**5. Jalankan migrasi & seed (sekali saja):**

```powershell
# Migrasi database
docker-compose exec backend npx prisma migrate deploy

# Seed data awal
docker-compose exec backend npm run db:seed
```

**6. Aplikasi siap diakses:**

| Service     | URL                       |
| ----------- | ------------------------- |
| Frontend    | http://IP-SERVER          |
| Backend API | http://IP-SERVER:5000/api |
| Database    | Port 5432 (internal)      |

### Perintah Docker Berguna

```powershell
# Lihat log semua service
docker-compose logs -f

# Lihat log service tertentu
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop semua
docker-compose down

# Stop + hapus data database (HATI-HATI!)
docker-compose down -v

# Restart service tertentu
docker-compose restart backend

# Update setelah ada perubahan kode
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

---

## 🖥️ Cara B — Manual di Windows Server / VPS

### Prasyarat

- Node.js 18+ terinstall
- PostgreSQL 14+ terinstall
- PM2 (process manager): `npm install -g pm2`

### Langkah Deploy Manual

**1. Siapkan database PostgreSQL** (sama seperti Langkah 2 di atas)

**2. Konfigurasi `.env` untuk production:**

```env
DATABASE_URL="postgresql://postgres:PASSWORDKUAT@localhost:5432/erp_lamongan"
JWT_SECRET="jwt-secret-sangat-panjang-dan-aman-minimal-32-karakter"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
PORT=4000
CORS_ORIGIN="http://IP-ATAU-DOMAIN-SERVER"
```

**3. Install dependencies & setup database:**

```powershell
cd D:\BErflamongan\backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

**4. Build frontend:**

```powershell
cd D:\BErflamongan\frontend

# Edit dulu VITE_API_URL di frontend/.env
# Isi: VITE_API_URL=http://IP-SERVER:4000/api

npm install
npm run build
# Hasil build ada di folder: frontend/dist/
```

**5. Jalankan backend dengan PM2 (agar tetap hidup):**

```powershell
cd D:\BErflamongan\backend
pm2 start src/index.js --name erp-backend
pm2 save
pm2 startup   # agar auto-start saat server restart
```

**6. Serve frontend:**

Opsi A — Gunakan `serve` (simpel):

```powershell
npm install -g serve
pm2 start "serve -s D:\BErflamongan\frontend\dist -p 80" --name erp-frontend
```

Opsi B — Gunakan **Nginx** (production):

- Install Nginx: https://nginx.org/en/download.html
- Copy isi `frontend/dist/` ke folder web Nginx
- Konfigurasi proxy ke backend port 4000

### Perintah PM2 Berguna

```powershell
pm2 list              # lihat semua proses
pm2 logs erp-backend  # lihat log backend
pm2 restart erp-backend
pm2 stop erp-backend
pm2 delete erp-backend
```

---

## 🔒 Checklist Keamanan Production

Sebelum deploy ke publik, pastikan:

- [ ] Ganti `JWT_SECRET` dengan string acak panjang (min. 32 karakter)
- [ ] Ganti password PostgreSQL dari `postgres` ke password kuat
- [ ] Set `NODE_ENV=production` di `.env`
- [ ] Sesuaikan `CORS_ORIGIN` dengan domain/IP yang benar
- [ ] Aktifkan firewall — hanya buka port yang diperlukan (80, 443, 4000)
- [ ] Gunakan HTTPS jika domain publik (gunakan Let's Encrypt)
- [ ] Ganti password admin default setelah login pertama

---

## 🌐 Konfigurasi Port

| Service    | Development | Production       |
| ---------- | ----------- | ---------------- |
| Frontend   | :5173       | :80              |
| Backend    | :4000       | :4000 atau :5000 |
| PostgreSQL | :5432       | :5432 (internal) |

---

_Panduan ini dibuat untuk ERP Realisasi Fisik Kabupaten Lamongan — Februari 2026_
