/**
 * Test suite for Pastebin Lite API
 * Run with: npm test
 *
 * For deterministic time testing:
 * TEST_MODE=1 npm test
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  passed: number;
  failed: number;
  tests: { name: string; passed: boolean; error?: string }[];
}

const results: TestResult = { passed: 0, failed: 0, tests: [] };

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, passed: true });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`✗ ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function request(
  path: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  return {
    status: res.status,
    ok: res.ok,
    body: isJson ? await res.json() : await res.text(),
  };
}

async function runTests() {
  console.log('🧪 Testing Pastebin Lite API\n');

  let testPasteId: string;

  // 1. Health Check
  await test('Health check returns 200', async () => {
    const res = await request('/api/healthz');
    assert(res.ok, `Expected 200, got ${res.status}`);
    assert(res.body.ok === true, 'Expected ok: true');
  });

  // 2. Create Paste
  await test('Create paste returns id and url', async () => {
    const res = await request('/api/pastes', {
      method: 'POST',
      body: { content: 'Hello, World!' },
    });
    assert(res.ok, `Expected 200, got ${res.status}`);
    assert(res.body.id, 'No id returned');
    assert(res.body.url, 'No url returned');
    assert(res.body.url.includes('/p/'), 'URL format incorrect');
    testPasteId = res.body.id;
  });

  // 3. Fetch paste
  await test('Fetch paste returns content', async () => {
    const res = await request(`/api/pastes/${testPasteId}`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    assert(res.body.content === 'Hello, World!', 'Content mismatch');
  });

  // 4. Invalid input validation
  await test('Create with empty content returns 400', async () => {
    const res = await request('/api/pastes', {
      method: 'POST',
      body: { content: '' },
    });
    assert(!res.ok, `Expected 4xx, got ${res.status}`);
    assert(res.body.error, 'No error message');
  });

  await test('Create without content returns 400', async () => {
    const res = await request('/api/pastes', {
      method: 'POST',
      body: {},
    });
    assert(!res.ok, `Expected 4xx, got ${res.status}`);
  });

  // 5. TTL validation
  await test('Invalid TTL returns 400', async () => {
    const res = await request('/api/pastes', {
      method: 'POST',
      body: { content: 'Test', ttl_seconds: 0 },
    });
    assert(!res.ok, 'Expected 400 for TTL < 1');
  });

  // 6. Max views validation
  await test('Invalid max_views returns 400', async () => {
    const res = await request('/api/pastes', {
      method: 'POST',
      body: { content: 'Test', max_views: -1 },
    });
    assert(!res.ok, 'Expected 400 for max_views < 1');
  });

  // 7. Missing paste returns 404
  await test('Fetch non-existent paste returns 404', async () => {
    const res = await request('/api/pastes/nonexistent123');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // 8. View limit test
  let limitTestPasteId: string;
  await test('Create paste with max_views=2', async () => {
    const res = await request('/api/pastes', {
      method: 'POST',
      body: { content: 'Limit test', max_views: 2 },
    });
    assert(res.ok, `Create failed: ${res.status}`);
    limitTestPasteId = res.body.id;
  });

  await test('First fetch returns remaining_views=1', async () => {
    const res = await request(`/api/pastes/${limitTestPasteId}`);
    assert(res.ok, `Fetch failed: ${res.status}`);
    assert(res.body.remaining_views === 1, `Expected 1, got ${res.body.remaining_views}`);
  });

  await test('Second fetch returns remaining_views=0', async () => {
    const res = await request(`/api/pastes/${limitTestPasteId}`);
    assert(res.ok, `Fetch failed: ${res.status}`);
    assert(res.body.remaining_views === 0, `Expected 0, got ${res.body.remaining_views}`);
  });

  await test('Third fetch returns 404 (limit exceeded)', async () => {
    const res = await request(`/api/pastes/${limitTestPasteId}`);
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // 9. TTL test (if TEST_MODE enabled)
  if (process.env.TEST_MODE === '1') {
    let ttlPasteId: string;
    const now = Date.now();

    await test('Create paste with 5s TTL', async () => {
      const res = await request('/api/pastes', {
        method: 'POST',
        body: { content: 'TTL test', ttl_seconds: 5 },
      });
      assert(res.ok, `Create failed: ${res.status}`);
      ttlPasteId = res.body.id;
    });

    await test('Paste is available before expiry', async () => {
      const res = await request(`/api/pastes/${ttlPasteId}`, {
        headers: { 'x-test-now-ms': String(now) },
      });
      assert(res.ok, `Fetch failed: ${res.status}`);
    });

    await test('Paste expires after TTL', async () => {
      const futureTime = now + 6000; // 6 seconds later
      const res = await request(`/api/pastes/${ttlPasteId}`, {
        headers: { 'x-test-now-ms': String(futureTime) },
      });
      assert(res.status === 404, `Expected 404 after expiry, got ${res.status}`);
    });
  }

  // 10. HTML page rendering
  await test('HTML page for valid paste returns 200', async () => {
    const res = await request(`/p/${testPasteId}`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    assert(typeof res.body === 'string', 'Expected HTML response');
  });

  await test('HTML page for invalid paste returns 404', async () => {
    const res = await request('/p/nonexistent123');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Tests passed: ${results.passed}/${results.passed + results.failed}`);
  console.log(`Tests failed: ${results.failed}/${results.passed + results.failed}`);

  if (results.failed > 0) {
    console.log('\nFailed tests:');
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => console.log(`  - ${t.name}: ${t.error}`));
    process.exit(1);
  } else {
    console.log('All tests passed! ✨');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
