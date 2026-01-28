'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function CreatePage() {
  const [content, setContent] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  const handleCreate = async () => {
    setError('');
    setCreatedId('');

    if (!content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = { content };
      if (ttlSeconds) {
        payload.ttl_seconds = Math.max(1, parseInt(ttlSeconds, 10));
      }
      if (maxViews) {
        payload.max_views = Math.max(1, parseInt(maxViews, 10));
      }

      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to create paste');
        return;
      }

      const data = await res.json();
      setCreatedId(data.id);
      setShareUrl(data.url);
      setContent('');
      setTtlSeconds('');
      setMaxViews('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Pastebin Lite</h1>
          <p className="text-slate-400">Share code, notes, and text instantly</p>
        </motion.div>

        {createdId ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-6"
          >
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">Your paste created successfully:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 font-mono text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setCreatedId('');
                setShareUrl('');
              }}
              className="w-full py-2 bg-slate-600 hover:bg-slate-500 rounded font-medium transition-colors"
            >
              Create Another
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-700/50 border border-slate-600 rounded-lg p-6"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Paste Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your text here..."
                disabled={loading}
                className="w-full h-64 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  TTL Seconds{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={ttlSeconds}
                  onChange={(e) => setTtlSeconds(e.target.value)}
                  placeholder="e.g., 3600"
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Auto-delete after this time
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Views{' '}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  placeholder="e.g., 5"
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Delete after N views
                </p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-100 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              onClick={handleCreate}
              disabled={loading || !content.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Paste'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
