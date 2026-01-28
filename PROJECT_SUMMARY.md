# Pastebin Lite - Project Summary

## What You've Built

A production-ready, serverless Pastebin application with:
- ✅ Full REST API with health checks
- ✅ TTL (time-to-live) support for automatic expiration
- ✅ View limits with atomic view counting
- ✅ Deterministic time testing for CI/CD
- ✅ Professional dark-mode UI with Framer Motion
- ✅ Vercel KV persistence (Redis-compatible)
- ✅ No secrets in code, fully deployment-ready
- ✅ Complete test suite
- ✅ Comprehensive documentation

## Quick Links

- **Main README:** [README.md](./README.md) - Overview, tech stack, and persistence explanation
- **Quick Start:** [QUICK_START.md](./QUICK_START.md) - 5-minute setup and local testing
- **API Docs:** [API.md](./API.md) - Detailed endpoint reference
- **Deployment:** [DEPLOY.md](./DEPLOY.md) - Vercel, Docker, and self-hosted options

## Project Structure

```
pastebin-lite/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── healthz/          → GET /api/healthz
│   │   │   └── pastes/           → POST/GET /api/pastes[/:id]
│   │   ├── p/[id]/               → GET /p/:id (HTML viewer)
│   │   ├── page.tsx              → Home page (create UI)
│   │   ├── layout.tsx            → Root layout
│   │   └── globals.css           → Tailwind styles
│   ├── lib/
│   │   ├── kv.ts                 → Vercel KV persistence
│   │   ├── validation.ts         → Input validation
│   │   └── id.ts                 → ID generation (nanoid)
│   └── ...
├── tests/
│   └── api.test.ts               → Comprehensive test suite
├── .env.local                    → Environment (git-ignored)
├── package.json                  → Dependencies and scripts
├── tsconfig.json                 → TypeScript config
├── next.config.ts                → Next.js config
├── README.md                     → Project overview
├── QUICK_START.md                → Setup guide
├── API.md                        → API reference
└── DEPLOY.md                     → Deployment guide
```

## Running the Project

### Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Testing

```bash
# In one terminal
npm run dev

# In another
npm test

# With deterministic time
TEST_MODE=1 npm test
```

### Production

```bash
npm run build
npm start
```

## Key Features Explained

### 1. Paste Creation

```bash
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, World!", "ttl_seconds": 3600}'
```

Returns:
```json
{
  "id": "abc12345",
  "url": "http://localhost:3000/p/abc12345"
}
```

### 2. TTL (Time-to-Live)

Pastes automatically expire after specified seconds:
```bash
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "Temporary", "ttl_seconds": 10}'

# After 10 seconds, fetching returns 404
```

### 3. View Limits

Pastes auto-delete after N views:
```bash
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "One-time secret", "max_views": 1}'

# First view succeeds
# Second view returns 404
```

### 4. Deterministic Testing

For reproducible, time-independent tests:
```bash
TEST_MODE=1 npm run dev

curl http://localhost:3000/api/pastes/{id} \
  -H "x-test-now-ms: 1672531200000"
```

## Technology Choices

### Vercel KV (Redis)
- **Why:** Serverless-first, no DevOps, atomic operations prevent race conditions
- **Cost:** ~$0.2 per million operations (cheap)
- **Alternative:** Neon Postgres (slower, more complex setup)

### Next.js App Router
- **Why:** Modern, type-safe, server components native
- **API Routes:** Built-in REST endpoint support
- **Deployment:** Vercel one-click deploy

### Framer Motion
- **Why:** Subtle animations feel polished
- **Usage:** Page transitions and success feedback only
- **Philosophy:** Less is more

## API Contracts (Strict Compliance)

### Health Check
```
GET /api/healthz → { "ok": true } (200)
```

### Create
```
POST /api/pastes
{ "content": "...", "ttl_seconds": 10, "max_views": 5 }
→ { "id": "abc123", "url": "https://..." } (200)
```

### Fetch
```
GET /api/pastes/{id}
→ { "content": "...", "remaining_views": 5, "expires_at": "2026..." } (200)
   or { "error": "..." } (404)
```

### View HTML
```
GET /p/{id}
→ <html> page with safe HTML escaping (200)
   or 404
```

## Error Handling

All errors return JSON:
```json
{
  "error": "Description of what went wrong"
}
```

**Status Codes:**
- 200 - Success
- 400 - Bad input validation
- 404 - Paste not found / expired / limit exceeded
- 500 - Unexpected server error
- 503 - Persistence unavailable

## Testing Strategy

### Unit Tests
- Input validation (empty content, invalid TTL)
- ID generation collision resistance
- Content HTML escaping

### Integration Tests
- Create → Fetch → Delete flow
- TTL expiration logic
- View limit decrement
- Concurrent access (race conditions)

### E2E Tests
- HTML page rendering
- Error states
- Time-deterministic paths

Run with: `npm test`

## Security & Production Readiness

✅ **No Secrets in Code**
- All credentials from environment
- `.env.local` git-ignored
- KV token never exposed

✅ **Input Validation**
- All request fields validated
- Content sanitized before storage
- No SQL injection (using KV)

✅ **Content Escaping**
- HTML output safely escaped
- No XSS vectors
- Pre-rendered server-side

✅ **Error Messages**
- Generic client messages
- Full stack traces only in logs
- No data leakage

✅ **Serverless Ready**
- No local state
- Stateless functions
- Horizontal scaling
- Cold start optimized

## Performance Benchmarks

**Expected on Vercel:**
| Operation | Latency |
|-----------|---------|
| Create    | ~50ms   |
| Fetch     | ~20ms   |
| View HTML | ~100ms  |
| Health    | ~15ms   |

**Capacity:**
- 10k+ pastes/day easily handled
- ~$0.50/month KV cost at scale
- Free tier Vercel functions sufficient

## Deployment Summary

### Fastest (5 minutes)
1. Push to GitHub
2. Connect to Vercel
3. Add KV integration
4. Done - auto-deploys

### Cost
- Vercel Functions: Free (3.2M calls/month)
- KV: ~$0.2 per million ops
- For 1000 pastes/day: ~$0.50/month

## Next Steps

### For Development
1. Create `/CONTRIBUTING.md` for team guidelines
2. Add rate limiting if needed
3. Monitor Vercel analytics
4. Set up CI/CD with automated tests

### For Operations
1. Set custom domain in Vercel
2. Enable HTTPS (automatic)
3. Configure monitoring alerts
4. Regular backups (KV handles this)

### For Scaling
1. Add Redis cache layer (optional)
2. CDN for static assets (Vercel handles)
3. Database migration if needed (KV → SQL)

## File Permissions & Security

**Never commit:**
- `.env.local` (credentials)
- `.next/` build artifacts
- Private keys

**Always include:**
- `.env.local.example` (template)
- README with setup instructions
- License (MIT included)

## Support & Debugging

### Health Check Failed
```bash
curl http://localhost:3000/api/healthz
# If fails, KV connection is down
```

### Build Errors
```bash
npm run build
# Shows TypeScript and Next.js compilation errors
```

### Runtime Errors
```bash
# Vercel dashboard → Logs
# Or local: npm run dev + browser console
```

### Test Failures
```bash
TEST_MODE=1 npm test
# Comprehensive test output with error details
```

## Metrics to Monitor

Production (Vercel):
- Function response time
- Error rate (4xx, 5xx)
- KV latency
- Monthly cost

Development:
- Test pass rate
- Build time
- TypeScript errors

## Final Checklist

- ✅ All tests passing
- ✅ Build succeeds
- ✅ No TypeScript errors
- ✅ API contracts verified
- ✅ TTL logic working
- ✅ View limits working
- ✅ Error handling tested
- ✅ Content safely escaped
- ✅ No secrets in code
- ✅ Ready for production

---

**Ready to deploy!** 🚀

For questions, see:
- [API.md](./API.md) - API details
- [QUICK_START.md](./QUICK_START.md) - Setup help
- [DEPLOY.md](./DEPLOY.md) - Deployment options
