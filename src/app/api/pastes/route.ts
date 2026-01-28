import { NextRequest, NextResponse } from 'next/server';
import { setPaste, getTimeFromRequest } from '@/lib/kv';
import { generatePasteId } from '@/lib/id';
import { validateContent, validateTTL, validateMaxViews, DEPLOYMENT_DOMAIN } from '@/lib/validation';

interface CreatePasteRequest {
  content?: unknown;
  ttl_seconds?: unknown;
  max_views?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreatePasteRequest = await req.json();

    // Get test time if available (in TEST_MODE)
    let testNowMs: number | undefined;
    if (process.env.TEST_MODE === '1') {
      const header = req.headers.get('x-test-now-ms');
      if (header) {
        testNowMs = parseInt(header, 10);
      }
    }

    // Validate content
    const contentError = validateContent(body.content);
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    // Validate TTL
    const ttl = validateTTL(body.ttl_seconds);
    if (ttl === -1) {
      return NextResponse.json(
        { error: 'ttl_seconds must be an integer >= 1' },
        { status: 400 }
      );
    }

    // Validate max_views
    const maxViews = validateMaxViews(body.max_views);
    if (maxViews === -1) {
      return NextResponse.json(
        { error: 'max_views must be an integer >= 1' },
        { status: 400 }
      );
    }

    // Generate paste ID
    const id = generatePasteId();

    // Store paste
    await setPaste(id, body.content as string, ttl ?? undefined, maxViews ?? undefined, testNowMs);

    return NextResponse.json({
      id,
      url: `${DEPLOYMENT_DOMAIN}/p/${id}`,
    });
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
