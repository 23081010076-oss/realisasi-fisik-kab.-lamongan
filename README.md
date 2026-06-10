# Sistem ERP Realisasi Pembangunan Fisik Kabupaten Lamongan

Aplikasi web untuk monitoring, pendataan, dan pelaporan realisasi pembangunan fisik di Kabupaten Lamongan. Project ini terdiri dari backend Laravel sebagai REST API dan frontend React/Vite sebagai aplikasi web.

## Teknologi

### Backend

- PHP 8.3+
- Laravel 13
- Laravel Sanctum
- MySQL/MariaDB atau SQLite untuk development
- Maatwebsite Excel untuk import/export Excel

### Frontend

- React 18
- Vite 5
- Tailwind CSS
- Axios
- React Router
- Zustand
- Chart.js
- jsPDF dan SheetJS

## Struktur Project

```text
BErflamongan/
+-- backend-laravel/       # Backend Laravel REST API
|   +-- app/
|   +-- database/
|   +-- routes/
|   +-- storage/
|   +-- artisan
|   +-- composer.json
+-- frontend/              # Frontend React/Vite
|   +-- src/
|   +-- public/
|   +-- vite.config.js
|   +-- package.json
+-- package.json           # Script root untuk development
+-- DEPLOYMENT.md
+-- README.md
```

## Fitur Utama

- Dashboard statistik realisasi pembangunan fisik.
- Grafik kategori pekerjaan, status paket, dan performa OPD.
- Manajemen paket pekerjaan.
- Detail paket, progres, nilai kontrak, nilai realisasi, dan dokumen pendukung.
- Import data paket dari Excel.
- Export data paket ke Excel.
- Rekap fisik OPD.
- Manajemen OPD.
- Manajemen pengguna.
- Autentikasi berbasis token menggunakan Laravel Sanctum.
- Role pengguna: `ADMIN`, `OPD`, dan `VIEWER`.

## Prasyarat Development

Pastikan sudah tersedia:

- PHP 8.3 atau lebih baru
- Composer
- Node.js 18 atau lebih baru
- npm 9 atau lebih baru
- MySQL/MariaDB, atau SQLite untuk development sederhana

## Instalasi Lokal

Clone atau buka folder project:

```bash
cd d:\BErflamongan
```

Install dependency root, backend, dan frontend:

```bash
npm run install:all
```

Jika ingin install manual:

```bash
npm install
cd backend-laravel
composer install
cd ../frontend
npm install
```

## Konfigurasi Backend

Masuk ke folder backend:

```bash
cd backend-laravel
```

Buat file `.env`:

```bash
cp .env.example .env
```

Contoh konfigurasi MySQL/MariaDB:

```env
APP_NAME="ERP Lamongan"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=erp_lamongan
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public
```

Generate key aplikasi:

```bash
php artisan key:generate
```

Jalankan migrasi dan seeder:

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

## Konfigurasi Frontend

Masuk ke folder frontend:

```bash
cd frontend
```

Buat file `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Frontend membaca `VITE_API_URL` saat proses build atau saat dev server dijalankan.

## Menjalankan Aplikasi

Dari root project:

```bash
npm run dev
```

Atau jalankan terpisah:

```bash
npm run dev:laravel
npm run dev:frontend
```

URL development:

- Backend API: `http://127.0.0.1:8000/api`
- Frontend: `http://localhost:5173`

## Akun Default

Seeder membuat akun admin:

```text
Email    : admin@lamongan.go.id
Password : admin123
Role     : ADMIN
```

Seeder juga mengisi data OPD Kabupaten Lamongan.

> Untuk production, segera ubah password default setelah deploy.

## Script Penting

Dari root project:

```bash
npm run install:all
npm run dev
npm run dev:laravel
npm run dev:frontend
npm run build
npm run migrate
npm run seed
```

Dari folder backend:

```bash
php artisan serve
php artisan migrate
php artisan db:seed
php artisan test
php artisan optimize:clear
```

Dari folder frontend:

```bash
npm run dev
npm run build
npm run preview
```

## API Endpoint

Base URL development:

```text
http://127.0.0.1:8000/api
```

### Auth

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `POST /auth/change-password`

### Dashboard

- `GET /dashboard/stats`
- `GET /dashboard/chart`
- `GET /dashboard/recent`
- `GET /dashboard/rekap`

### Paket

- `GET /paket`
- `POST /paket`
- `GET /paket/{id}`
- `PUT /paket/{id}`
- `DELETE /paket/{id}`
- `PATCH /paket/{id}/status`
- `POST /paket/{id}/progress`
- `POST /paket/import`
- `GET /paket/export`
- `POST /paket/{id}/documents`
- `DELETE /paket/{id}/documents/{documentId}`
- `GET /documents/{documentId}/file`

### OPD

- `GET /opd`
- `POST /opd`
- `GET /opd/{id}`
- `PUT /opd/{id}`
- `DELETE /opd/{id}`
- `PATCH /opd/{id}/toggle-status`

### Users

- `GET /users`
- `POST /users`
- `GET /users/{id}`
- `PUT /users/{id}`
- `DELETE /users/{id}`
- `PATCH /users/{id}/toggle-status`

Endpoint yang berada di dalam middleware `auth:sanctum` membutuhkan header:

```text
Authorization: Bearer <token>
```

## Build Production

Build frontend:

```bash
cd frontend
npm install
npm run build
```

Hasil build tersedia di:

```text
frontend/dist
```

Optimasi backend:

```bash
cd backend-laravel
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Deploy ke cPanel

Rekomendasi deployment:

- Frontend: `https://domainkamu.com`
- Backend API: `https://api.domainkamu.com`

### 1. Buat Database

Di cPanel buka **MySQL Databases**:

1. Buat database, contoh `cpuser_erp_lamongan`.
2. Buat user database, contoh `cpuser_erp_user`.
3. Assign user ke database dengan privilege penuh.

### 2. Upload Backend

Upload folder `backend-laravel` ke luar `public_html`, misalnya:

```text
/home/cpuser/backend-laravel
```

Buat subdomain `api.domainkamu.com` dan arahkan document root ke:

```text
/home/cpuser/backend-laravel/public
```

### 3. Konfigurasi `.env` Production

Buat atau edit:

```text
backend-laravel/.env
```

Contoh:

```env
APP_NAME="ERP Lamongan"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.domainkamu.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=cpuser_erp_lamongan
DB_USERNAME=cpuser_erp_user
DB_PASSWORD=password_database

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public
LOG_CHANNEL=stack
LOG_LEVEL=error
```

Jalankan melalui Terminal cPanel atau SSH:

```bash
cd ~/backend-laravel
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Jika hosting tidak menyediakan Composer/SSH, jalankan `composer install --no-dev --optimize-autoloader` di lokal lalu upload folder `vendor`.

### 4. Build dan Upload Frontend

Di lokal, buat `frontend/.env.production`:

```env
VITE_API_URL=https://api.domainkamu.com/api
```

Build:

```bash
cd frontend
npm install
npm run build
```

Upload semua isi folder:

```text
frontend/dist
```

ke:

```text
public_html
```

### 5. `.htaccess` Frontend

Buat file:

```text
public_html/.htaccess
```

Isi:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^ index.html [L]
</IfModule>
```

File ini diperlukan agar route React seperti `/paket`, `/opd`, dan `/rekap` tetap berjalan saat halaman di-refresh.

### 6. CORS Production

Untuk production, ubah `backend-laravel/config/cors.php`:

```php
'allowed_origins' => ['https://domainkamu.com'],
```

Lalu jalankan:

```bash
php artisan config:cache
```

### 7. Cek Hasil Deploy

Cek backend:

```text
https://api.domainkamu.com/api/dashboard/stats
```

Cek frontend:

```text
https://domainkamu.com
```

## Troubleshooting

### Error 500 Laravel

Cek log:

```text
backend-laravel/storage/logs/laravel.log
```

Bersihkan cache:

```bash
php artisan optimize:clear
```

### Frontend tidak bisa mengakses API

Pastikan:

- `VITE_API_URL` sudah benar.
- Frontend sudah di-build ulang setelah mengubah `.env.production`.
- CORS backend mengizinkan domain frontend.
- SSL aktif di domain frontend dan subdomain API.

### Upload dokumen tidak muncul

Jalankan:

```bash
php artisan storage:link
```

Pastikan folder `storage` dan `bootstrap/cache` writable.

### Route React 404 saat refresh

Pastikan file `.htaccess` di `public_html` sudah sesuai bagian deploy frontend.

## Catatan Keamanan

- Ubah password default admin setelah deploy.
- Gunakan `APP_DEBUG=false` di production.
- Gunakan HTTPS.
- Batasi CORS ke domain frontend production.
- Jangan upload file `.env` lokal ke repository publik.
- Lakukan backup database secara berkala.

## Lisensi

Project ini digunakan untuk kebutuhan Sistem ERP Realisasi Pembangunan Fisik Kabupaten Lamongan.
