export const DEPLOYMENT_DOMAIN =
  process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || 'http://localhost:3000';

export const SHORT_ID_LENGTH = 8;

/**
 * Validate paste content
 */
export function validateContent(content: unknown): string | null {
  if (typeof content !== 'string') {
    return 'content must be a string';
  }
  if (content.trim().length === 0) {
    return 'content cannot be empty';
  }
  return null;
}

/**
 * Validate TTL
 */
export function validateTTL(ttl: unknown): number | null {
  if (ttl === undefined) return null;
  if (typeof ttl !== 'number' || !Number.isInteger(ttl) || ttl < 1) {
    return -1; // error
  }
  return ttl;
}

/**
 * Validate max views
 */
export function validateMaxViews(maxViews: unknown): number | null {
  if (maxViews === undefined) return null;
  if (typeof maxViews !== 'number' || !Number.isInteger(maxViews) || maxViews < 1) {
    return -1; // error
  }
  return maxViews;
}
