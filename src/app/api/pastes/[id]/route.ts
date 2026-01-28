import { NextRequest, NextResponse } from 'next/server';
import { getPaste } from '@/lib/kv';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get test time if available (in TEST_MODE)
    let testNowMs: number | undefined;
    if (process.env.TEST_MODE === '1') {
      const header = req.headers.get('x-test-now-ms');
      if (header) {
        testNowMs = parseInt(header, 10);
      }
    }

    const paste = await getPaste(id, testNowMs);

    if (!paste) {
      return NextResponse.json({ error: 'Paste not found' }, { status: 404 });
    }

    return NextResponse.json({
      content: paste.content,
      remaining_views: paste.remaining_views,
      expires_at: paste.expires_at ? new Date(paste.expires_at).toISOString() : null,
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
