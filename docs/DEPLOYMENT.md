# SmartQR — Production Deployment Guide

This document outlines the architecture, environment configuration, database migrations, containerization, and platform deployment procedures for SmartQR in production environments.

---

## 1. System Requirements & Architecture

SmartQR is built on modern web and database standards:
- **Runtime**: Node.js `>= 20.x LTS`
- **Framework**: Next.js 16 (App Router) & React 19
- **ORM / Database**: Prisma ORM with PostgreSQL `>= 14`
- **Authentication**: Auth.js v5 (NextAuth.js) with JWT sessions and bcrypt password hashing
- **Storage Layer**: Local filesystem (`LocalStorageProvider`) with interchangeable abstraction for AWS S3 / Cloud Object Storage
- **Reverse Proxy**: NGINX / Cloudflare / Vercel Edge / AWS ALB with HTTPS/TLS termination

---

## 2. Environment Variables

Create `.env.production` or configure secrets in your hosting environment:

```env
# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------
# PostgreSQL connection string with SSL mode required in production
DATABASE_URL="postgres://username:strong_password@db-host.example.com:5432/smartqr?sslmode=require"

# -----------------------------------------------------------------------------
# Authentication (Auth.js v5)
# -----------------------------------------------------------------------------
# 32+ byte cryptographic secret (generate with: `openssl rand -base64 32`)
AUTH_SECRET="your-32-character-random-auth-secret-key"

# Trust reverse proxy X-Forwarded-* headers
AUTH_TRUST_HOST=true

# Canonical public base URL
AUTH_URL="https://smartqr.example.com"
APP_URL="https://smartqr.example.com"
NEXT_PUBLIC_APP_URL="https://smartqr.example.com"

# -----------------------------------------------------------------------------
# Storage Subsystem
# -----------------------------------------------------------------------------
STORAGE_PROVIDER="local"
LOCAL_STORAGE_PATH="./storage"
MAX_FILE_SIZE_MB=10

# -----------------------------------------------------------------------------
# Analytics & Logging
# -----------------------------------------------------------------------------
ANALYTICS_ENABLED=true
NODE_ENV="production"
```

---

## 3. Database Setup & Migration Strategy

### Automated Migration Pipeline
Always run migrations as part of your CI/CD deployment step:

```bash
# Generate Prisma Client
npm run db:generate

# Apply pending production migrations safely
npx prisma migrate deploy

# Seed initial system configuration/demo tenant (optional)
npm run db:seed
```

### PostgreSQL Connection Pooling
For serverless or containerized high-traffic deployments:
- Configure **PgBouncer** or managed connection pooling (e.g. Supabase Connection Pooler, Neon Pooler, Aiven Connection Pool).
- Ensure `connection_limit` aligns with your container replicas (`max_connections = replicas * 5`).

---

## 4. Docker Deployment

### Multi-Stage Dockerfile
A lightweight, secure, non-root multi-stage Docker build is provided in `Dockerfile`:

```bash
# Build the production image
docker build -t smartqr:latest -f Dockerfile .

# Run with docker-compose
docker compose -f docker-compose.prod.yml up -d
```

### Health Check & Orchestration
The production container exposes a health check endpoint at `/api/health`. Docker, Kubernetes, and ECS can monitor service health:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:3000/api/health | grep -q '\"status\":\"healthy\"' || exit 1"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

---

## 5. Platform Deployment Guides

### A. Vercel / Next.js Managed Hosting
1. Connect GitHub repository to Vercel.
2. Under **Environment Variables**, set:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST` = `true`
   - `AUTH_URL` = `https://your-domain.vercel.app`
   - `APP_URL` = `https://your-domain.vercel.app`
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`
   - `STORAGE_PROVIDER` = `local` (or cloud storage)
3. Set **Build Command**: `prisma generate && next build`
4. Deploy.

### B. Linux VPS / EC2 / Render / Railway
1. Clone the repository on the target server.
2. Copy and configure `.env.production`.
3. Install dependencies and build:
   ```bash
   npm ci --production=false
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```
4. Start process manager (e.g. PM2 or Systemd):
   ```bash
   pm2 start npm --name "smartqr" -- run start
   pm2 save
   ```
5. Configure NGINX reverse proxy with SSL certificate (Certbot / Let's Encrypt).

---

## 6. NGINX Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name smartqr.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartqr.example.com;

    ssl_certificate /etc/letsencrypt/live/smartqr.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartqr.example.com/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384";

    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

---

## 7. Backup & Disaster Recovery

### Database Backup
Automate daily PostgreSQL dumps:
```bash
pg_dump -Fc --no-acl --no-owner -h $DB_HOST -U $DB_USER -d $DB_NAME > /backups/smartqr_$(date +%Y%m%d_%H%M%S).dump
```

### File Storage Backup
Ensure the `./storage` directory is mounted on persistent network storage (e.g. AWS EBS, AWS EFS, Docker Volume) and backed up via snapshots:
```bash
tar -czf /backups/storage_$(date +%Y%m%d).tar.gz ./storage/
```

---

## 8. Monitoring & Observability

- **Uptime Monitoring**: Configure external ping against `https://smartqr.example.com/api/health`.
- **Application Logs**: Monitored via stdout/stderr in Docker or PM2 (`pm2 logs smartqr`).
- **Error Tracking**: Global error boundaries configured in `app/error.tsx` and `app/global-error.tsx`.
