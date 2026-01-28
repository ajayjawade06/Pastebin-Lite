# Pastebin Lite

A minimal, production-ready pastebin application built with Next.js, TypeScript, and Vercel KV.

## Overview

Pastebin Lite allows you to instantly share code, notes, and text. Create pastes with optional TTL (time-to-live) and view limits. Each paste gets a unique, shareable URL.

**Key Features:**
- Create and share text pastes with unique short IDs
- Optional TTL: Auto-delete pastes after X seconds
- Optional view limits: Auto-delete after N views
- REST API for programmatic access
- Deterministic time testing for CI/CD
- Zero secrets in code, deployment-ready for Vercel
- Dark-mode UI with subtle animations

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Runtime:** Node.js
- **Persistence:** Vercel KV (Redis-compatible key-value store)
- **Styling:** Tailwind CSS + Framer Motion
- **ID Generation:** nanoid
- **Deployment:** Vercel (serverless)

### Persistence Layer: Vercel KV

We use **Vercel KV** for persistence. It's a Redis-compatible service provided by Vercel, ideal for serverless environments because:
- No cold-start overhead for small operations
- Atomic key operations prevent race conditions
- Managed by Vercel, zero DevOps
- Automatic persistence across deployments
- Pay-per-operation, suitable for variable load

**Alternative:** You could swap to Neon Postgres by replacing `/src/lib/kv.ts` with SQL queries, but KV is simpler for this use case.

## How to Run Locally

### Prerequisites
- Node.js 18+
- npm (included with Node.js)

### Setup

1. Clone and install:
   ```bash
   npm install
   ```

2. Create a `.env.local` file (development only):
   ```env
   NEXT_PUBLIC_DEPLOYMENT_DOMAIN=http://localhost:3000
   TEST_MODE=0
   ```

3. For local Vercel KV emulation (optional):
   - Install Redis locally or use Docker:
     ```bash
     docker run -d -p 6379:6379 redis:latest
     ```
   - Set in `.env.local`:
     ```env
     KV_REST_API_URL=http://127.0.0.1:6379
     KV_REST_API_TOKEN=
     ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Production Deployment

1. Push to GitHub and connect to Vercel
2. Vercel automatically detects Next.js
3. Link a Vercel KV database:
   - Go to your Vercel project settings
   - Add KV integration from Marketplace
4. Deploy:
   ```bash
   vercel
   ```

## API Reference

### Health Check
```
GET /api/healthz
```
Returns `{ "ok": true }` if persistence layer is healthy.

### Create Paste
```
POST /api/pastes
Content-Type: application/json

{
  "content": "string (required, non-empty)",
  "ttl_seconds": number >= 1 (optional),
  "max_views": number >= 1 (optional)
}
```

**Response (200):**
```json
{
  "id": "abc12345",
  "url": "https://pastebin-lite.vercel.app/p/abc12345"
}
```

### Fetch Paste (JSON)
```
GET /api/pastes/{id}
```

**Response (200):**
```json
{
  "content": "Your paste content",
  "remaining_views": 4,
  "expires_at": "2026-01-28T23:00:00Z"
}
```

- `remaining_views`: Integer or `null` if unlimited
- `expires_at`: ISO 8601 timestamp or `null` if no expiry
- Each fetch decrements `remaining_views`
- Returns 404 if paste is expired or views exceeded

### View Paste (HTML)
```
GET /p/{id}
```

Returns an HTML page with the paste content. Content is safely HTML-escaped.
Returns 404 if paste not found or expired.

## Design Decisions

### TTL & View Limits
- **TTL Logic:** Checked on every fetch. If `current_time > expires_at`, paste is deleted and 404 returned.
- **View Limits:** Decremented atomically on successful fetch. When `remaining_views <= 0`, paste is deleted and 404 returned.
- **Atomic Operations:** Both KV set/get operations prevent race conditions under typical serverless load.

### Deterministic Time for Testing
Set `TEST_MODE=1` in environment to enable test time injection:
```bash
TEST_MODE=1 npm run dev
```

Then in tests, send the `x-test-now-ms` header with millisecond timestamp:
```
GET /api/pastes/abc123 HTTP/1.1
x-test-now-ms: 1672531200000
```

This allows reproducible, time-independent tests without flakiness.

### Short ID Generation
Uses `nanoid(8)` for 8-character, URL-safe, collision-resistant IDs:
- 62^8 possible combinations (~218 trillion)
- URL-safe characters only
- No UUID length bloat

### No Client-Side Secrets
- All API calls use public endpoints
- No JWT or session tokens needed for paste creation
- KV credentials live only on server (via Vercel environment)
- Safe for browser-based clients

### Error Handling
- **4xx errors:** Return JSON with `{ "error": "description" }`
- **5xx errors:** Return 500 with generic message
- Never expose stack traces to clients
- Always validate input before processing

## File Structure

```
pastebin-lite/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── healthz/
│   │   │   │   └── route.ts              # Health check endpoint
│   │   │   └── pastes/
│   │   │       ├── route.ts              # POST /api/pastes (create)
│   │   │       └── [id]/route.ts         # GET /api/pastes/:id (fetch)
│   │   ├── p/
│   │   │   └── [id]/page.tsx             # GET /p/:id (view HTML)
│   │   ├── page.tsx                      # Home page (create UI)
│   │   ├── layout.tsx                    # Root layout
│   │   └── globals.css                   # Tailwind styles
│   ├── lib/
│   │   ├── kv.ts                         # KV persistence layer
│   │   ├── validation.ts                 # Input validation & constants
│   │   └── id.ts                         # Paste ID generation
│   └── ...
├── public/                               # Static assets
├── .env.local                            # Local environment (git-ignored)
├── next.config.ts                        # Next.js config
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
├── package.json
└── README.md                             # This file
```

## Testing

Run tests with:
```bash
npm test
```

For deterministic time-based tests:
```bash
TEST_MODE=1 npm test
```

Example test (using `curl` or similar):
```bash
# Create a paste with 10s TTL
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, World!", "ttl_seconds": 10}'

# Immediately fetch (should work)
curl http://localhost:3000/api/pastes/abc12345

# With deterministic time, jump forward 11 seconds
curl http://localhost:3000/api/pastes/abc12345 \
  -H "x-test-now-ms: 1672531200000"
# Should return 404 (expired)
```

## Security & Quality

- **Input Validation:** All API inputs validated before processing
- **Content Escaping:** HTML output safely escapes all user input
- **No Secrets in Code:** KV credentials from Vercel environment only
- **Correct Headers:** All endpoints return appropriate Content-Type
- **Serverless Ready:** No local file storage, no global state
- **Error Handling:** Defensive, non-leaking error messages

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_DEPLOYMENT_DOMAIN` to your Vercel domain
- [ ] Link Vercel KV integration
- [ ] Test health check: `GET /api/healthz`
- [ ] Create a test paste and verify TTL logic
- [ ] Test view limits
- [ ] Verify content HTML escaping
- [ ] Load test for race conditions
- [ ] Monitor Vercel dashboard for cold starts

## License

MIT. Built with care for production use.
# Pastebin-Lite
