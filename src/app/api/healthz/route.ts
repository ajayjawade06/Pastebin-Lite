import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/kv';

export async function GET(req: NextRequest) {
  try {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
