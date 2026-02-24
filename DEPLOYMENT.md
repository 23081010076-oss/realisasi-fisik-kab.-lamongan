# DEPLOYMENT GUIDE - Production

## Deployment ke VPS/Server

### Prerequisites

- VPS dengan Ubuntu 20.04+ atau Windows Server
- Node.js 18+
- PostgreSQL 14+
- Nginx (untuk reverse proxy)
- Domain (opsional)

## Option 1: Manual Deployment (Ubuntu/Debian)

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### 2. Setup PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE erp_lamongan;
CREATE USER lamongan WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE erp_lamongan TO lamongan;
\q
```

### 3. Upload Project Files

```bash
# Clone atau upload ke /var/www/erp-lamongan
cd /var/www
# Upload files melalui scp, sftp, atau git
git clone [your-repo-url] erp-lamongan
cd erp-lamongan
```

### 4. Setup Backend

```bash
cd /var/www/erp-lamongan/backend

# Install dependencies
npm install --production

# Setup environment
nano .env
# Edit sesuai production settings:
# DATABASE_URL="postgresql://lamongan:your_secure_password@localhost:5432/erp_lamongan"
# JWT_SECRET="change-this-to-random-secure-string"
# NODE_ENV="production"
# PORT=5000

# Run migrations
npx prisma generate
npx prisma migrate deploy

# Seed initial data
npx prisma db seed

# Start with PM2
pm2 start src/index.js --name erp-backend
pm2 save
pm2 startup
```

### 5. Setup Frontend

```bash
cd /var/www/erp-lamongan/frontend

# Install dependencies
npm install

# Build
npm run build

# Copy build to nginx directory
sudo cp -r dist /var/www/erp-frontend
```

### 6. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/erp-lamongan
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Ganti dengan domain Anda

    # Frontend
    root /var/www/erp-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/erp-lamongan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto renewal
sudo certbot renew --dry-run
```

### 8. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
sudo ufw enable
```

## Option 2: Docker Deployment

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Update docker-compose.yml for Production

Edit `docker-compose.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: erp-lamongan-db
    restart: always
    environment:
      POSTGRES_USER: lamongan
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: erp_lamongan
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - erp-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: erp-lamongan-backend
    restart: always
    environment:
      DATABASE_URL: postgresql://lamongan:${DB_PASSWORD}@postgres:5432/erp_lamongan
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    networks:
      - erp-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: erp-lamongan-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - erp-network

volumes:
  postgres_data:

networks:
  erp-network:
    driver: bridge
```

### 3. Create .env file

```bash
nano .env
```

```env
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
```

### 4. Deploy

```bash
# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed data
docker-compose exec backend npm run db:seed
```

## Option 3: Windows Server Deployment

### 1. Install Prerequisites

- Download dan install Node.js 18+ dari nodejs.org
- Download dan install PostgreSQL dari postgresql.org
- Download dan install IIS (Internet Information Services)

### 2. Setup PostgreSQL

```powershell
# Gunakan pgAdmin untuk membuat database
# Database name: erp_lamongan
# User: lamongan
# Password: [set secure password]
```

### 3. Setup Backend

```powershell
cd C:\inetpub\wwwroot\erp-lamongan\backend

# Install dependencies
npm install --production

# Setup .env
# Edit .env file dengan database credentials production

# Run migrations
npx prisma generate
npx prisma migrate deploy
npm run db:seed

# Install PM2 Windows
npm install -g pm2
npm install pm2-windows-startup -g
pm2-startup install

# Start backend
pm2 start src/index.js --name erp-backend
pm2 save
```

### 4. Setup Frontend with IIS

```powershell
cd C:\inetpub\wwwroot\erp-lamongan\frontend

# Build
npm run build

# Copy dist folder to IIS directory
xcopy /E /I dist C:\inetpub\wwwroot\erp-frontend
```

### 5. Configure IIS

1. Buka IIS Manager
2. Add New Website:
   - Site name: ERP Lamongan
   - Physical path: C:\inetpub\wwwroot\erp-frontend
   - Binding: http, port 80
3. Install URL Rewrite module
4. Add web.config ke C:\inetpub\wwwroot\erp-frontend:

```xml
<?xml version="1.0"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

## Security Checklist

- [ ] Ubah semua default passwords
- [ ] Set JWT_SECRET yang kuat
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall rules
- [ ] Regular database backups
- [ ] Update dependencies secara berkala
- [ ] Monitor logs
- [ ] Setup rate limiting
- [ ] Enable CORS dengan domain spesifik

## Monitoring

### PM2 Monitoring

```bash
pm2 status              # Check status
pm2 logs erp-backend    # View logs
pm2 restart erp-backend # Restart app
pm2 monit               # Live monitoring
```

### Database Backup Script

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/var/backups/erp-lamongan"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U lamongan erp_lamongan > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Tambahkan ke crontab:

```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Update Application

```bash
# Pull latest code
cd /var/www/erp-lamongan
git pull

# Update backend
cd backend
npm install
npx prisma migrate deploy
pm2 restart erp-backend

# Update frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/erp-frontend/
```

## Troubleshooting Production

### High CPU Usage

```bash
pm2 monit
# Check for infinite loops or memory leaks
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql
SELECT * FROM pg_stat_activity WHERE datname = 'erp_lamongan';
```

### Nginx Errors

```bash
# Check nginx status
sudo systemctl status nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t
```

---

**Production Deployment Complete! 🚀**
