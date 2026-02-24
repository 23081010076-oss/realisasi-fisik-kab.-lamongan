# SETUP GUIDE - ERP Realisasi Fisik Lamongan

## Persiapan Awal

### 1. Install Dependencies yang Diperlukan

- Node.js versi 18 atau lebih tinggi
- PostgreSQL versi 14 atau lebih tinggi
- Git (opsional)

### 2. Download/Extract Project

Pastikan folder `d:\BErflamongan` berisi semua file project.

## Setup Backend

### 1. Install Dependencies Backend

```powershell
cd d:\BErflamongan\backend
npm install
```

### 2. Setup Database PostgreSQL

#### Opsi A: PostgreSQL Terinstall Local

```powershell
# Buat database baru
createdb erp_lamongan

# Atau melalui psql
psql -U postgres
CREATE DATABASE erp_lamongan;
\q
```

#### Opsi B: Menggunakan Docker

```powershell
# Dari folder root project
docker-compose up -d postgres
```

### 3. Konfigurasi Environment Variables

File `.env` sudah dibuat di `backend\.env`. Pastikan isinya sesuai:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/erp_lamongan?schema=public"
JWT_SECRET="erp-lamongan-super-secret-key-change-in-production-2026"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=5000
CORS_ORIGIN="http://localhost:5173"
```

**PENTING:** Ubah `postgres:postgres` sesuai username dan password PostgreSQL Anda.

### 4. Generate Prisma Client & Migration

```powershell
cd d:\BErflamongan\backend
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Seed Database (Data Awal)

```powershell
npm run db:seed
```

### 6. Jalankan Backend Server

```powershell
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

## Setup Frontend

### 1. Install Dependencies Frontend

```powershell
cd d:\BErflamongan\frontend
npm install
```

### 2. Konfigurasi Environment

File `.env` sudah dibuat di `frontend\.env`. Pastikan isinya:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Jalankan Frontend Development Server

```powershell
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## Menjalankan Kedua Server Sekaligus

Dari folder root:

```powershell
cd d:\BErflamongan
npm install
npm run dev
```

## Akses Aplikasi

1. Buka browser dan akses: `http://localhost:5173`
2. Login dengan akun demo:

**Admin:**

- Email: `admin@lamongan.go.id`
- Password: `admin123`

**OPD (RSUD):**

- Email: `rsud@lamongan.go.id`
- Password: `rsud123`

**OPD (DPU):**

- Email: `dpu@lamongan.go.id`
- Password: `dpu123`

## Troubleshooting

### Error: Port already in use

```powershell
# Cek port yang digunakan
netstat -ano | findstr :5000
netstat -ano | findstr :5173

# Matikan process yang menggunakan port
taskkill /PID [PID_NUMBER] /F
```

### Error: Database connection failed

- Pastikan PostgreSQL sudah running
- Cek username, password, dan database name di `.env`
- Pastikan port 5432 tidak diblokir firewall

### Error: Prisma Client tidak ditemukan

```powershell
cd backend
npx prisma generate
```

### Error: Module not found

```powershell
# Hapus node_modules dan install ulang
Remove-Item -Recurse -Force node_modules
npm install
```

## Development Commands

### Backend

```powershell
cd backend

# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Database commands
npx prisma migrate dev          # Create & run migration
npx prisma migrate deploy       # Deploy migration (production)
npx prisma studio              # Open Prisma Studio (database GUI)
npx prisma db seed             # Run seeder
```

### Frontend

```powershell
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Menggunakan Docker

```powershell
# Build dan jalankan semua services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment ke Server

#### Backend

```powershell
cd backend
npm install --production
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
node src/index.js
```

#### Frontend

```powershell
cd frontend
npm install
npm run build
# Deploy folder 'dist' ke web server (Nginx/Apache)
```

## Struktur Database

### Tables:

- **users** - Pengguna sistem (Admin, OPD, Viewer)
- **opd** - Organisasi Perangkat Daerah
- **paket** - Paket pekerjaan
- **paket_progress** - Riwayat progress paket
- **documents** - Dokumen paket
- **audit_logs** - Log aktivitas

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication

- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /auth/me` - Get current user
- `POST /auth/change-password` - Change password

### Dashboard

- `GET /dashboard/stats?tahun=2026` - Statistik
- `GET /dashboard/chart?tahun=2026` - Data chart
- `GET /dashboard/recent?limit=10` - Update terbaru

### Paket

- `GET /paket` - List paket (with filters)
- `GET /paket/:id` - Detail paket
- `POST /paket` - Create paket
- `PUT /paket/:id` - Update paket
- `DELETE /paket/:id` - Delete paket
- `POST /paket/:id/progress` - Update progress

### OPD

- `GET /opd` - List OPD
- `GET /opd/:id` - Detail OPD
- `POST /opd` - Create OPD (Admin only)
- `PUT /opd/:id` - Update OPD (Admin only)
- `DELETE /opd/:id` - Delete OPD (Admin only)

### Users

- `GET /users` - List users (Admin only)
- `GET /users/:id` - Detail user (Admin only)
- `POST /users` - Create user (Admin only)
- `PUT /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

## Fitur Utama

### 1. Dashboard

- Statistik per kategori (Konstruksi, Konsultansi, Barang, Jasa)
- Chart progres bulanan
- Total nilai dan realisasi
- Update terbaru

### 2. Manajemen Paket Pekerjaan

- CRUD Paket
- Update progress real-time
- Track nilai realisasi
- History progress
- Filter dan pencarian

### 3. Manajemen OPD

- CRUD OPD
- Data kepala dan kontak
- Statistik paket per OPD

### 4. Manajemen User

- Role-based: Admin, OPD, Viewer
- User per OPD
- Status active/inactive

### 5. Authorization

- Admin: Full access
- OPD: CRUD paket untuk OPD sendiri
- Viewer: Read only

## Tips Penggunaan

1. **Sebagai Admin:**
   - Kelola semua OPD dan users
   - Monitor semua paket
   - Hapus data jika diperlukan

2. **Sebagai OPD:**
   - Input dan update paket milik OPD sendiri
   - Update progress secara berkala
   - View statistik OPD

3. **Sebagai Viewer:**
   - Monitoring semua data
   - Export laporan

## Keamanan

1. Password di-hash menggunakan bcrypt
2. JWT token untuk authentication
3. Role-based authorization
4. Audit log untuk tracking aktivitas
5. CORS protection
6. SQL injection protection (Prisma ORM)

## Maintenance

### Backup Database

```powershell
pg_dump -U postgres erp_lamongan > backup.sql
```

### Restore Database

```powershell
psql -U postgres erp_lamongan < backup.sql
```

### Update Dependencies

```powershell
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

## Support

Untuk bantuan lebih lanjut, hubungi:

- Email: it@lamongan.go.id
- Website: https://lamongan.go.id

---

**Selamat menggunakan ERP Realisasi Fisik Kabupaten Lamongan! 🎉**
