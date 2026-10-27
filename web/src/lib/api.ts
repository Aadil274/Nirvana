/**
 * Nirvana Civic Climate Resilience Platform
 * Centralized API Client & URL Normalization Utility
 *
 * Ensures consistent /api/v1 resolution, eliminates duplicated paths,
 * safely handles production fallbacks, and standardizes fetch calls.
 */

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    // Strip trailing slashes
    const sanitized = envUrl.replace(/\/+$/, '');
    // If it already ends with /api/v1, preserve it; otherwise append it
    if (sanitized.endsWith('/api/v1')) {
      return sanitized;
    }
    // If it ends with /api, append /v1
    if (sanitized.endsWith('/api')) {
      return `${sanitized}/v1`;
    }
    return `${sanitized}/api/v1`;
  }

  // Fallback when NEXT_PUBLIC_API_URL is unset:
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      return 'http://127.0.0.1:8000/api/v1';
    }

    // In production web deployment (e.g. Vercel, municipal domain)
    // use a relative path so reverse proxies / serverless rewrites handle the route
    return '/api/v1';
  }

  // Server-side fallback during static pre-rendering
  if (process.env.NODE_ENV === 'production') {
    return '/api/v1';
  }

  return 'http://127.0.0.1:8000/api/v1';
}

export const API_BASE = getApiBaseUrl();

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Prevent /api/v1/api/v1 if the path passed in accidentally contains /api/v1
  if (cleanPath.startsWith('/api/v1/')) {
    const stripped = cleanPath.replace(/^\/api\/v1/, '');
    return `${base}${stripped}`;
  }
  return `${base}${cleanPath}`;
}
