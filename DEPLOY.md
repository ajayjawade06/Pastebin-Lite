# Deployment Guide

This guide covers deploying Pastebin Lite to Vercel (recommended) and other platforms.

## Vercel Deployment (Recommended)

### Prerequisites

- Vercel account (free tier works)
- GitHub, GitLab, or Bitbucket repository
- Project pushed to git

### Step-by-Step

1. **Push to Git**

   ```bash
   git add .
   git commit -m "Initial commit: Pastebin Lite"
   git push origin main
   ```

2. **Import Project**

   - Visit https://vercel.com/new
   - Connect your git account
   - Select your `pastebin-lite` repository
   - Click "Import"

3. **Configure Environment**

   In Vercel project settings, add:
   ```
   NEXT_PUBLIC_DEPLOYMENT_DOMAIN=https://your-domain.vercel.app
   TEST_MODE=0
   ```

4. **Add KV Database**

   - Go to project settings → Integrations
   - Search "Storage" → Select "KV"
   - Click "Add KV Database"
   - Create new or select existing KV store
   - Vercel auto-configures `KV_REST_API_URL` and `KV_REST_API_TOKEN`

5. **Deploy**

   - Click "Deploy"
   - Wait ~2 minutes for build
   - Visit your app at `https://your-project.vercel.app`

### Custom Domain

1. Go to project settings → Domains
2. Add custom domain
3. Update DNS records (Vercel provides instructions)
4. Update `NEXT_PUBLIC_DEPLOYMENT_DOMAIN` environment variable

### Verify Deployment

```bash
# Health check
curl https://your-domain.vercel.app/api/healthz

# Create test paste
curl -X POST https://your-domain.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "Deploy test"}'
```

---

## Docker Deployment

### Build Image

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

### Build & Run

```bash
docker build -t pastebin-lite .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_DEPLOYMENT_DOMAIN=http://localhost:3000 \
  -e KV_REST_API_URL=https://your-kv.upstash.io \
  -e KV_REST_API_TOKEN=<your-token> \
  pastebin-lite
```

### Docker Compose

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_DEPLOYMENT_DOMAIN: http://localhost:3000
      KV_REST_API_URL: http://redis:6379
      KV_REST_API_TOKEN: ""
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Run with:
```bash
docker-compose up
```

---

## Railway Deployment

1. Connect GitHub repo to Railway.app
2. Add KV environment variables
3. Deploy - Railway auto-detects Next.js
4. Set custom domain

---

## Self-Hosted (VPS/EC2)

### 1. Setup Server

```bash
# Ubuntu 22.04 example
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm redis-server -y

# Clone repo
git clone <repo> /home/app/pastebin-lite
cd /home/app/pastebin-lite
npm install
npm run build
```

### 2. Configure Environment

```bash
cat > .env.production << EOF
NEXT_PUBLIC_DEPLOYMENT_DOMAIN=https://your-domain.com
KV_REST_API_URL=http://localhost:6379
KV_REST_API_TOKEN=
EOF
```

### 3. Setup Systemd Service

```bash
sudo tee /etc/systemd/system/pastebin.service << EOF
[Unit]
Description=Pastebin Lite
After=network.target redis-server.service

[Service]
Type=simple
User=app
WorkingDirectory=/home/app/pastebin-lite
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable pastebin
sudo systemctl start pastebin
```

### 4. Setup Reverse Proxy (Nginx)

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
    }
}
```

### 5. SSL/TLS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

### Production (Vercel)

```env
# Required
NEXT_PUBLIC_DEPLOYMENT_DOMAIN=https://your-domain.vercel.app

# Optional
TEST_MODE=0

# Auto-configured by Vercel KV integration
KV_REST_API_URL=<auto>
KV_REST_API_TOKEN=<auto>
```

### Self-Hosted

```env
NEXT_PUBLIC_DEPLOYMENT_DOMAIN=https://your-domain.com
KV_REST_API_URL=http://localhost:6379
KV_REST_API_TOKEN=
TEST_MODE=0
```

### Development

```env
NEXT_PUBLIC_DEPLOYMENT_DOMAIN=http://localhost:3000
KV_REST_API_URL=http://127.0.0.1:6379
KV_REST_API_TOKEN=
TEST_MODE=0
```

---

## Database Setup

### Vercel KV (Recommended)

Vercel handles all setup - just click "Add KV" in the dashboard.

### External Redis

Use Upstash, Redis Cloud, or similar:

```env
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-token-here
```

### Local Redis

```bash
# Mac
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis-server

# Docker
docker run -d -p 6379:6379 redis:latest
```

---

## Monitoring & Maintenance

### Health Checks

Setup uptime monitoring:

```bash
# Every 5 minutes
*/5 * * * * curl -f https://your-domain.com/api/healthz || alert
```

### Logs

**Vercel:**
- Dashboard → Logs tab
- Filter by function/time
- Export for analysis

**Self-Hosted:**
```bash
# View service logs
sudo journalctl -u pastebin -f

# View application errors
tail -f /var/log/pastebin.log
```

### Performance Monitoring

**Vercel Analytics:**
- Dashboard → Analytics
- Track: Response time, error rate, invocations

**New Relic/Datadog:**
- Add monitoring agent
- Track: Latency, throughput, errors

### Backup

KV data is automatically backed up by Redis/Vercel. For peace of mind:

```bash
# Export KV data
redis-cli --rdb /backups/pastebin-$(date +%Y%m%d).rdb

# Restore from backup
redis-cli --rdb /path/to/backup.rdb
```

---

## Scaling

### Vercel Auto-Scaling

Vercel automatically scales based on demand. No configuration needed.

### Manual Scaling (Self-Hosted)

**Add Load Balancer (HAProxy/Nginx):**

```nginx
upstream backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

**Key Considerations:**
- All instances share same Redis
- No local state
- Horizontally scalable

---

## Cost Estimation

### Vercel

- **Functions:** Free tier (~3.2M invocations/mo)
- **KV:** $0.2 per million commands
- **Bandwidth:** Included in free tier

For 10k pastes/day:
- ~5k API calls/day = ~$0.30/month KV cost

### Self-Hosted (VPS)

- **Server:** $5-20/month (DigitalOcean/Linode)
- **Domain:** $10-15/year (Namecheap)
- **Redis:** Included or ~$20/month (managed)

---

## Troubleshooting Deployment

### Build Fails

```bash
# Check build logs
vercel logs --follow

# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Dependency conflicts
```

### KV Connection Failed

```bash
# Test KV connection
redis-cli ping

# Check credentials
echo $KV_REST_API_URL
echo $KV_REST_API_TOKEN

# Verify firewall/network access
```

### Slow Response Time

```bash
# Check API latency
curl -w "@curl-time.txt" https://your-domain.com/api/healthz

# Profile in Vercel dashboard
# Look for: Cold starts, KV latency, CPU time
```

### High Error Rate

```bash
# Check logs
vercel logs --follow

# Common causes:
# - KV quota exceeded
# - Memory limit exceeded (6MB response)
# - Timeout (30s max on Vercel)
```

---

## Production Checklist

- [ ] Environment variables set
- [ ] KV database initialized and tested
- [ ] Health check passing: `/api/healthz`
- [ ] Create/fetch/view workflows tested
- [ ] TTL logic verified
- [ ] View limits verified
- [ ] Error handling tested (404, 400)
- [ ] Monitoring/alerts configured
- [ ] HTTPS/TLS enabled
- [ ] Custom domain working
- [ ] Backups configured
- [ ] Logs accessible
- [ ] Rate limiting considered (if needed)
- [ ] Terms of Service ready (optional)

---

## Rollback Plan

### Vercel

```bash
# Revert to previous deployment
vercel rollback

# Or redeploy a specific commit
git checkout <commit-hash>
git push origin main
```

### Self-Hosted

```bash
# Revert code
git revert HEAD
npm install
npm run build

# Restart service
sudo systemctl restart pastebin
```

### Data Recovery

KV data persists - even if application is reverted, pastes remain accessible.

---

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Redis Docs: https://redis.io/documentation
- GitHub Issues: Report bugs in your repo
