import { notFound } from 'next/navigation';

export default async function ViewPastePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch the paste via API
  try {
    const baseUrl = process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/pastes/${id}`, {
      cache: 'no-store', // Don't cache, TTL and views are dynamic
    });

    if (!res.ok) {
      notFound();
    }

    const paste = await res.json();

    // HTML escape content
    const escapedContent = paste.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', padding: '2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Pastebin Lite
          </h1>

          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                ID: {id}
              </p>
              {paste.expires_at && (
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Expires: {new Date(paste.expires_at).toLocaleString()}
                </p>
              )}
              {paste.remaining_views !== null && (
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Views remaining: {paste.remaining_views}
                </p>
              )}
            </div>

            <pre
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.375rem',
                padding: '1rem',
                overflowX: 'auto',
                fontFamily: 'Courier New, monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              <code>{escapedContent}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching paste:', error);
    notFound();
  }
}
