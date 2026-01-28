// Get deployment domain from env or auto-detect from headers
export function getDeploymentDomain(headers?: Headers): string {
  // If explicitly set, use it
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN) {
    return process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN;
  }

  // For Vercel, auto-detect from VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback to localhost
  return 'http://localhost:3000';
}

// Export as constant for backward compatibility
export const DEPLOYMENT_DOMAIN =
  process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

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
