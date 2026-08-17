const BACKEND_HOSTS = new Set(['localhost:5110', '127.0.0.1:5110']);

export function resolvePdfUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (BACKEND_HOSTS.has(parsed.host) && parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
    return parsed.href;
  } catch {
    return trimmed;
  }
}

export function isSameOriginPdfUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/uploads/')) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function isExternalPdfUrl(url: string): boolean {
  if (!url) return false;
  return !isSameOriginPdfUrl(url);
}

export function getGoogleViewerUrl(url: string): string {
  const resolved = resolvePdfUrl(url);
  if (!resolved) return '';

  if (resolved.includes('drive.google.com/file/d/')) {
    const match = resolved.match(/\/file\/d\/([^/]+)/);
    if (match?.[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }

  const absolute = resolved.startsWith('http')
    ? resolved
    : `${window.location.origin}${resolved.startsWith('/') ? resolved : `/${resolved}`}`;

  return `https://docs.google.com/gview?url=${encodeURIComponent(absolute)}&embedded=true`;
}

export function getDirectEmbedUrl(url: string): string {
  const resolved = resolvePdfUrl(url);
  if (!resolved) return '';
  if (resolved.startsWith('http') || resolved.startsWith('data:') || resolved.startsWith('blob:')) {
    return resolved;
  }
  return `${window.location.origin}${resolved.startsWith('/') ? resolved : `/${resolved}`}`;
}

export function getDefaultPdfViewMode(url?: string | null): 'canvas' | 'google' {
  const resolved = resolvePdfUrl(url);
  if (!resolved) return 'canvas';
  if (resolved.startsWith('data:') || resolved.startsWith('blob:') || resolved.startsWith('/uploads/')) {
    return 'canvas';
  }
  return 'google';
}
