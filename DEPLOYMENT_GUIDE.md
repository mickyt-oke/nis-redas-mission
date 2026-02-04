# REDAS Deployment Guide

## Overview

This guide covers the deployment process for the REDAS (Remote Deployment and Support) application, including both frontend (Next.js) and backend (Laravel) components.

## Prerequisites

### System Requirements

- **Node.js:** v18.x or higher
- **PHP:** 8.2 or higher
- **Composer:** Latest version
- **PostgreSQL:** 14.x or higher (Supabase)
- **Web Server:** Nginx or Apache
- **SSL Certificate:** For HTTPS (recommended)

### Required Tools

- Git
- PM2 (for Node.js process management)
- Supervisor (for Laravel queue workers)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/nis-redas-mission.git
cd nis-redas-mission
```

### 2. Backend Setup (Laravel)

#### Install Dependencies

```bash
cd backend
composer install --optimize-autoloader --no-dev
```

#### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file with production settings:

```env
APP_NAME="REDAS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database (Supabase)
DB_CONNECTION=pgsql
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password

# Cache
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Session
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Queue
QUEUE_CONNECTION=redis

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=redis

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-username
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

#### Generate Application Key

```bash
php artisan key:generate
```

#### Run Migrations

```bash
php artisan migrate --force
```

#### Optimize Application

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

#### Set Permissions

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 3. Frontend Setup (Next.js)

#### Install Dependencies

```bash
cd ..
pnpm install --frozen-lockfile
```

#### Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### Build Application

```bash
pnpm build
```

## Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Backend (Laravel with Nginx)

1. **Install Nginx:**

```bash
sudo apt update
sudo apt install nginx
```

2. **Configure Nginx:**

Create `/etc/nginx/sites-available/redas-api`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    root /var/www/redas/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

3. **Enable Site:**

```bash
sudo ln -s /etc/nginx/sites-available/redas-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Setup SSL with Let's Encrypt:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

5. **Setup Queue Worker:**

Create `/etc/supervisor/conf.d/redas-worker.conf`:

```ini
[program:redas-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/redas/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/redas/backend/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start redas-worker:*
```

6. **Setup Scheduler:**

Add to crontab (`sudo crontab -e`):

```cron
* * * * * cd /var/www/redas/backend && php artisan schedule:run >> /dev/null 2>&1
```

#### Frontend (Next.js with PM2)

1. **Install PM2:**

```bash
npm install -g pm2
```

2. **Create PM2 Ecosystem File:**

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'redas-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/redas',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

3. **Start Application:**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

4. **Configure Nginx for Frontend:**

Create `/etc/nginx/sites-available/redas-frontend`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

5. **Enable and Setup SSL:**

```bash
sudo ln -s /etc/nginx/sites-available/redas-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Vercel (Frontend Only)

1. **Install Vercel CLI:**

```bash
npm i -g vercel
```

2. **Deploy:**

```bash
vercel --prod
```

3. **Configure Environment Variables:**

In Vercel dashboard, add:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`

### Option 3: Docker Deployment

#### Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application
COPY . .

# Install dependencies
RUN composer install --optimize-autoloader --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www

EXPOSE 9000
CMD ["php-fpm"]
```

#### Create Dockerfile for Frontend

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "9000:9000"
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/storage:/var/www/storage

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://nginx/api
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./backend/public:/var/www/public
    depends_on:
      - backend
      - frontend

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: redas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Post-Deployment

### 1. Verify Installation

```bash
# Check backend
curl https://api.your-domain.com/api/health

# Check frontend
curl https://your-domain.com
```

### 2. Setup Monitoring

#### Install Monitoring Tools

```bash
# Install New Relic (optional)
# Follow: https://docs.newrelic.com/docs/apm/agents/php-agent/installation/php-agent-installation-overview/

# Install Laravel Telescope (development only)
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

#### Setup Log Rotation

Create `/etc/logrotate.d/redas`:

```
/var/www/redas/backend/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### 3. Backup Strategy

#### Database Backup Script

Create `backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/redas"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h your-supabase-host.supabase.co -U postgres -d postgres > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
```

Add to crontab:

```cron
0 2 * * * /var/www/redas/backup-db.sh
```

### 4. Performance Optimization

```bash
# Enable OPcache
sudo nano /etc/php/8.2/fpm/php.ini
```

Add:

```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.2-fpm
```

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check Laravel logs: `tail -f backend/storage/logs/laravel.log`
   - Check Nginx error logs: `tail -f /var/log/nginx/error.log`
   - Verify file permissions

2. **Database Connection Failed**
   - Verify Supabase credentials
   - Check firewall rules
   - Test connection: `php artisan tinker` then `DB::connection()->getPdo();`

3. **Rate Limiting Not Working**
   - Verify Redis is running: `redis-cli ping`
   - Check cache configuration: `php artisan config:cache`

4. **Frontend Build Fails**
   - Clear cache: `pnpm clean` or `rm -rf .next`
   - Check Node.js version: `node -v`
   - Verify environment variables

## Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Firewall configured (UFW/iptables)
- [ ] Database credentials secured
- [ ] `.env` files not publicly accessible
- [ ] File permissions set correctly
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers configured
- [ ] Regular backups scheduled
- [ ] Monitoring and alerting setup

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Backend
cd backend
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
cd ..
pnpm install --frozen-lockfile
pnpm build
pm2 restart redas-frontend

# Restart services
sudo supervisorctl restart redas-worker:*
```

### Monitor Application

```bash
# Check PM2 status
pm2 status

# Check supervisor status
sudo supervisorctl status

# Check logs
pm2 logs redas-frontend
tail -f backend/storage/logs/laravel.log

# Monitor system resources
htop
```

## Support

For deployment issues, contact the DevOps team or refer to the troubleshooting guide.
