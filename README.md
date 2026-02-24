# Sistem ERP Realisasi Pembangunan Fisik Kabupaten Lamongan

Sistem informasi manajemen berbasis web modern untuk monitoring dan pelaporan realisasi pembangunan fisik di Kabupaten Lamongan.

## � Teknologi

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Web framework
- **Prisma** - Modern ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Zod** - Validation

### Frontend

- **React 18** - UI Library
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **React Router** - Routing
- **Zustand** - State management

## 📁 Struktur Proyek

```
erp-lamongan/
├── backend/           # API Server
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── prisma/
│   └── package.json
├── frontend/          # React App
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── stores/
│   └── package.json
├── docker-compose.yml
└── package.json
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### 1. Clone & Install Dependencies

```bash
cd d:\BErflamongan
npm run install:all
```

### 2. Setup Database

```bash
# Buat database PostgreSQL
createdb erp_lamongan

# Atau gunakan Docker
docker-compose up -d postgres
```

### 3. Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env dengan database credentials Anda

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env dengan API URL
```

### 4. Database Migration

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 5. Run Development Server

```bash
# Dari root directory
npm run dev

# Atau jalankan terpisah:
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

Backend akan berjalan di: `http://localhost:5000`
Frontend akan berjalan di: `http://localhost:5173`

## 📊 Fitur Utama

### 1. Dashboard

- Overview statistik proyek (Konstruksi, Konsultansi, Barang, Jasa)
- Chart progres realisasi bulanan
- Update terbaru proyek

### 2. Manajemen Proyek

- CRUD Paket Pekerjaan
- Kategori: Konstruksi, Konsultansi, Barang, Jasa Lainnya
- Tracking progres dan nilai realisasi

### 3. Manajemen OPD

- Data Organisasi Perangkat Daerah
- Kepala OPD dan kontak

### 4. Manajemen Kegiatan

- Detail kegiatan per paket
- Lokasi dan nilai proyek
- Status progres

### 5. Pelaporan

- Laporan per periode
- Export Excel/PDF
- Filter by OPD, kategori, periode

### 6. User Management

- Role-based access (Admin, OPD, Viewer)
- Authentication & Authorization
- Audit log

### 7. Import/Export

- Import data dari Excel
- Export laporan ke Excel/PDF
- Template import

## 🔐 Default Users

Setelah seeding database:

**Admin:**

- Email: `admin@lamongan.go.id`
- Password: `admin123`

**OPD User:**

- Email: `rsud@lamongan.go.id`
- Password: `rsud123`

## 🐳 Docker Deployment

```bash
# Build dan jalankan semua services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 📱 API Documentation

API endpoint tersedia di: `http://localhost:5000/api`

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Paket Pekerjaan

- `GET /api/paket` - List paket
- `POST /api/paket` - Create paket
- `GET /api/paket/:id` - Get detail
- `PUT /api/paket/:id` - Update paket
- `DELETE /api/paket/:id` - Delete paket

### Dashboard

- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/chart` - Get chart data
- `GET /api/dashboard/recent` - Get recent updates

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Production Build

```bash
# Build semua
npm run build

# Build backend saja
npm run build:backend

# Build frontend saja
npm run build:frontend
```

## 🔧 Troubleshooting

### Database connection error

- Pastikan PostgreSQL sudah running
- Check credentials di `.env`
- Pastikan database sudah dibuat

### Port already in use

- Ubah port di `.env` (backend) dan `vite.config.js` (frontend)

### Prisma migration error

- Reset database: `npx prisma migrate reset`
- Generate client: `npx prisma generate`

## 📄 License

MIT License - Pemerintah Kabupaten Lamongan

## 👥 Support

Untuk pertanyaan atau issue, hubungi:

- Email: it@lamongan.go.id
- Website: https://lamongan.go.id

---

Dibuat dengan ❤️ untuk Kabupaten Lamongan
