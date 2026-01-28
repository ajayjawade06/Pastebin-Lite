## Quick Start

Get up and running with Pastebin Lite in 5 minutes.

### 1. Clone & Install

```bash
git clone <your-repo>
cd pastebin-lite
npm install
```

### 2. Set Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_DEPLOYMENT_DOMAIN=http://localhost:3000
TEST_MODE=0
```

### 3. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Create a Paste

1. Open the home page
2. Enter content in the textarea
3. (Optional) Set TTL seconds or max views
4. Click "Create Paste"
5. Copy the shared URL and send to anyone

### 5. Deploy to Vercel

1. Push code to GitHub
2. Connect repo to Vercel dashboard
3. Add Vercel KV integration from Marketplace
4. Deploy with one click

## Local Testing

### Test with cURL

```bash
# Create a paste
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, World!"}'

# Returns:
# {"id": "abc12345", "url": "http://localhost:3000/p/abc12345"}

# Fetch paste
curl http://localhost:3000/api/pastes/abc12345

# View in browser
curl http://localhost:3000/p/abc12345
```

### Test with TTL (Deterministic Time)

```bash
# Enable TEST_MODE
TEST_MODE=1 npm run dev

# Create paste with 10s TTL
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "Expires soon", "ttl_seconds": 10}'

# Save the ID: abc12345

# Fetch immediately (works)
curl http://localhost:3000/api/pastes/abc12345

# Fetch at future time (expired)
curl http://localhost:3000/api/pastes/abc12345 \
  -H "x-test-now-ms: 1672531211000"
# Returns 404 (expired)
```

### Run Test Suite

```bash
# Start dev server in one terminal
npm run dev

# In another terminal
npm test

# For deterministic time tests
TEST_MODE=1 npm test
```

## Architecture

### Request Flow

```
User
  │
  ├─ Create: POST /api/pastes
  │   ├─ Validate input
  │   ├─ Generate ID (nanoid)
  │   ├─ Store in KV { content, ttl, views }
  │   └─ Return { id, url }
  │
  ├─ View JSON: GET /api/pastes/:id
  │   ├─ Load from KV
  │   ├─ Check TTL (if expired, delete & 404)
  │   ├─ Check views (if exceeded, delete & 404)
  │   ├─ Decrement views
  │   └─ Return { content, remaining_views, expires_at }
  │
  └─ View HTML: GET /p/:id
      ├─ Call /api/pastes/:id
      ├─ HTML escape content
      └─ Render styled HTML page
```

### Data Model

```typescript
// Stored in KV as: paste:{id}
{
  "content": "string",
  "created_at": 1672531200000,      // milliseconds
  "expires_at": 1672531210000 | null,
  "remaining_views": 5 | null
}
```

### Atomic Operations

All operations are single KV calls to prevent race conditions:
- `kv.set()` - Store with optional expiry
- `kv.get()` - Read and update in one transaction (app-level atomicity)
- `kv.del()` - Delete expired/exhausted pastes

## Deployment Considerations

### Vercel Specifics

- Cold starts: < 500ms (typical for API routes)
- KV latency: ~10ms per operation
- Memory: 512MB per function
- Max response size: 6MB (unlimited for streaming)

### Monitoring

1. Vercel Dashboard → Monitoring tab
2. Check:
   - Function response times
   - Error rates
   - KV operations/errors
   - Log tail for API errors

### Scaling

- **Read-heavy:** KV handles 10k+ ops/sec
- **Write-heavy:** Paste creation is single KV write (very fast)
- **Concurrent:** No race conditions at typical loads

### Cost

- **Vercel Functions:** Free tier ~3.2M invocations/month
- **Vercel KV:** $0.2 per million commands
- For 1000 pastes/day: ~$0.50/month KV cost

## Troubleshooting

### Dev server won't start

```bash
# Kill any stuck processes
lsof -i :3000 | grep node | awk '{print $2}' | xargs kill -9

# Clean and rebuild
rm -rf .next node_modules
npm install
npm run dev
```

### KV connection fails locally

If you see KV errors, you're running without local Redis setup:
1. Install Docker
2. Run: `docker run -d -p 6379:6379 redis:latest`
3. Set in `.env.local`:
   ```env
   KV_REST_API_URL=http://127.0.0.1:6379
   KV_REST_API_TOKEN=
   ```

### Tests fail with "Connection refused"

Make sure dev server is running:
```bash
npm run dev &   # Start in background
sleep 2          # Wait for startup
npm test        # Then run tests
```

### Build fails with TypeScript errors

```bash
# Check for errors
npm run build

# Fix if needed
npm install --save-dev @types/node@latest
```

## Development Tips

### Adding Features

1. Add validation to `/src/lib/validation.ts`
2. Update API route in `/src/app/api/`
3. Update UI in `/src/app/page.tsx`
4. Add tests to `/tests/api.test.ts`

### Environment Variables

- `NEXT_PUBLIC_*` - Available in browser
- Other vars - Server-side only
- Always use `.env.local` for secrets (git-ignored)

### Code Style

- TypeScript strict mode enabled
- ESLint configured (run `npm run lint`)
- Prettier formatting on save

## License

MIT - See LICENSE file
