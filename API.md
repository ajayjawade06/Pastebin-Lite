# API Documentation

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** Your Vercel domain

## Endpoints

### Health Check

Check if the service and persistence layer are healthy.

```http
GET /api/healthz
```

**Response (200):**
```json
{ "ok": true }
```

**Response (503):**
```json
{ "ok": false }
```

**Notes:**
- Required before any paste operations
- Verifies KV connectivity
- Use for uptime monitoring

---

### Create Paste

Create a new paste with optional TTL and view limits.

```http
POST /api/pastes
Content-Type: application/json

{
  "content": "string (required, non-empty)",
  "ttl_seconds": number (optional, >= 1),
  "max_views": number (optional, >= 1)
}
```

**Success (201):**
```json
{
  "id": "abc12345",
  "url": "https://example.com/p/abc12345"
}
```

**Validation Errors (400):**
```json
{
  "error": "content cannot be empty"
}
```

**Possible Errors:**
- `content cannot be empty` - Content is missing or whitespace-only
- `content must be a string` - Content type is not a string
- `ttl_seconds must be an integer >= 1` - TTL is invalid
- `max_views must be an integer >= 1` - Max views is invalid
- `Internal server error` - Unexpected server error (500)

**Examples:**

Create basic paste:
```bash
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, World!"}'
```

Create with 1-hour TTL:
```bash
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Secret sauce",
    "ttl_seconds": 3600
  }'
```

Create with view limit:
```bash
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{
    "content": "One-time code: 12345",
    "max_views": 1
  }'
```

Create with both TTL and view limit:
```bash
curl -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Temporary secret",
    "ttl_seconds": 1800,
    "max_views": 5
  }'
```

---

### Fetch Paste (JSON)

Retrieve paste content, decrementing view count.

```http
GET /api/pastes/{id}
```

**Optional Headers (TEST_MODE only):**
```
x-test-now-ms: <milliseconds since epoch>
```

**Success (200):**
```json
{
  "content": "Your paste content",
  "remaining_views": 4,
  "expires_at": "2026-01-29T10:30:00.000Z"
}
```

**Unlimited Views:**
```json
{
  "content": "Your paste content",
  "remaining_views": null,
  "expires_at": null
}
```

**Not Found (404):**
```json
{
  "error": "Paste not found"
}
```

**When 404 is returned:**
- Paste ID doesn't exist
- Paste has expired (TTL exceeded)
- View limit was reached

**Behavior:**
- Each fetch **decrements** `remaining_views` by 1
- When `remaining_views` reaches 0, next fetch returns 404
- Expired pastes are deleted and return 404
- Content is returned as-is (no escaping at API level)

**Examples:**

Fetch paste:
```bash
curl http://localhost:3000/api/pastes/abc12345
```

Fetch with test time (when TEST_MODE=1):
```bash
curl http://localhost:3000/api/pastes/abc12345 \
  -H "x-test-now-ms: 1672531200000"
```

---

### View Paste (HTML)

Get a formatted HTML page for the paste.

```http
GET /p/{id}
```

**Success (200):**
Returns HTML page with:
- Paste ID and metadata
- Content safely HTML-escaped
- Expiry time if applicable
- View count if limited
- Professional dark-mode styling

**Not Found (404):**
Returns 404 page if:
- Paste doesn't exist
- Paste has expired
- View limit exceeded

**Notes:**
- Content is HTML-escaped to prevent script injection
- Page is responsive (mobile-friendly)
- No JavaScript required for display
- Suitable for sharing via browser

---

## Time-Based Testing (Deterministic Mode)

For reproducible testing with time-dependent logic.

### Enable TEST_MODE

Set environment variable:
```bash
export TEST_MODE=1
npm run dev
```

### Time Header

When TEST_MODE=1, include this header to mock current time:

```http
x-test-now-ms: <milliseconds since epoch>
```

### Example: Test TTL Expiry

```bash
# Create paste with 10-second TTL
PASTE_ID=$(curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "test", "ttl_seconds": 10}' | jq -r '.id')

# Get current time
NOW=$(date +%s)000

# Fetch now (should work)
curl http://localhost:3000/api/pastes/$PASTE_ID \
  -H "x-test-now-ms: $NOW"
# Response: 200 OK

# Fetch 11 seconds later (should expire)
LATER=$((NOW + 11000))
curl http://localhost:3000/api/pastes/$PASTE_ID \
  -H "x-test-now-ms: $LATER"
# Response: 404 Not Found
```

### Example: Test View Limits

```bash
# Create paste with max 2 views
PASTE_ID=$(curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content": "limited", "max_views": 2}' | jq -r '.id')

# First fetch: remaining_views = 1
curl http://localhost:3000/api/pastes/$PASTE_ID | jq '.remaining_views'
# Output: 1

# Second fetch: remaining_views = 0
curl http://localhost:3000/api/pastes/$PASTE_ID | jq '.remaining_views'
# Output: 0

# Third fetch: 404
curl http://localhost:3000/api/pastes/$PASTE_ID
# Response: 404 Not Found
```

---

## Error Handling

All errors return JSON with `error` field:

```json
{
  "error": "Description of what went wrong"
}
```

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Paste fetched/health OK |
| 201 | Created | Paste created (not used, 200 returned) |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Paste doesn't exist / expired |
| 500 | Server Error | Unexpected error, contact support |
| 503 | Unavailable | KV connection failed |

### Common Errors

**Invalid Content:**
```json
{
  "error": "content cannot be empty"
}
```

**Invalid TTL:**
```json
{
  "error": "ttl_seconds must be an integer >= 1"
}
```

**Paste Expired:**
```json
{
  "error": "Paste not found"
}
```

**Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently **no rate limiting** is enforced. Plan for future limits:
- 10 pastes/minute per IP (optional)
- 100 views/minute per IP (optional)

---

## CORS Policy

**For HTML requests:** CORS is not applicable (same-origin).

**For API requests from browsers:**
- Same origin: ✅ Works
- Cross-origin: Depends on CORS headers (currently allows all)

---

## Authentication

No authentication required. Pastes are:
- Protected by **URL obscurity** (8-char random ID)
- Not indexed by search engines
- Not listed or discoverable

**Security note:** Do not store sensitive credentials in pastes. Anyone with the URL can access it.

---

## Content Limits

- **Maximum paste size:** 6MB (Next.js response limit)
- **ID length:** 8 characters
- **TTL maximum:** 2,147,483,647 seconds (~68 years, practical max)
- **Max views maximum:** 2,147,483,647 (practical max)

---

## Performance

Expected performance on Vercel:

| Operation | Latency | Notes |
|-----------|---------|-------|
| Create | ~50ms | ID generation + KV write |
| Fetch | ~20ms | KV read + view decrement |
| View HTML | ~100ms | API call + page render |
| Health check | ~15ms | KV ping |

---

## Webhook/Callbacks

Not implemented. Monitor via:
- Vercel logs dashboard
- External monitoring tools
- Health check endpoint polling

---

## Versioning

Current API version: **1.0** (stable)

No breaking changes planned. All updates will be backward-compatible.
