// Fallback in-memory store for local development
class InMemoryKV {
  private store = new Map<string, string>();

  async set(key: string, value: string, options?: { ex: number }): Promise<void> {
    this.store.set(key, value);
    // Simulate expiry for health check
    if (options?.ex) {
      setTimeout(() => this.store.delete(key), options.ex * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Lazy-loaded KV instance
let kvInstance: any = null;

async function getKv() {
  if (!kvInstance) {
    if (process.env.KV_REST_API_URL) {
      const mod = await import('@vercel/kv');
      kvInstance = mod.kv;
    } else {
      kvInstance = new InMemoryKV();
    }
  }
  return kvInstance;
}

export interface PasteData {
  content: string;
  created_at: number;
  expires_at: number | null;
  remaining_views: number | null;
}

/**
 * Store a paste with optional TTL and view limit
 */
export async function setPaste(
  id: string,
  content: string,
  ttl_seconds?: number,
  max_views?: number,
  now?: number
): Promise<void> {
  const currentTime = now ?? getCurrentTime();
  const expires_at = ttl_seconds ? currentTime + ttl_seconds * 1000 : null;
  const remaining_views = max_views ?? null;

  const data: PasteData = {
    content,
    created_at: currentTime,
    expires_at,
    remaining_views,
  };

  await (await getKv()).set(`paste:${id}`, JSON.stringify(data));
}

/**
 * Retrieve paste and decrement view count if available
 * @param id - Paste ID
 * @param testNowMs - Optional test time in milliseconds
 */
export async function getPaste(id: string, testNowMs?: number): Promise<PasteData | null> {
  const now = testNowMs ?? getCurrentTime();
  const raw = await (await getKv()).get<string>(`paste:${id}`);

  if (!raw) return null;

  const data: PasteData = JSON.parse(raw);

  // Check if expired
  if (data.expires_at !== null && now > data.expires_at) {
    // Delete expired paste
    await (await getKv()).del(`paste:${id}`);
    return null;
  }

  // Check if view limit exceeded
  if (data.remaining_views !== null && data.remaining_views <= 0) {
    await (await getKv()).del(`paste:${id}`);
    return null;
  }

  // Decrement views if tracked
  if (data.remaining_views !== null) {
    const updated = { ...data, remaining_views: data.remaining_views - 1 };
    await (await getKv()).set(`paste:${id}`, JSON.stringify(updated));
    return updated;
  }

  return data;
}

/**
 * Get current time in milliseconds
 * Respects TEST_MODE and x-test-now-ms header
 */
export function getCurrentTime(): number {
  if (typeof window === 'undefined' && process.env.TEST_MODE === '1') {
    // Server-side: will be overridden by request context
    return Date.now();
  }
  return Date.now();
}

/**
 * Get time from test header if in TEST_MODE
 */
export function getTimeFromRequest(testNowMs?: string): number {
  if (process.env.TEST_MODE === '1' && testNowMs) {
    return parseInt(testNowMs, 10);
  }
  return Date.now();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const testKey = '__health_check__';
    await (await getKv()).set(testKey, 'ok', { ex: 1 });
    const result = await (await getKv()).get(testKey);
    return result === 'ok';
  } catch (error) {
    return false;
  }
}
