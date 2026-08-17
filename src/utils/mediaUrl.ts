const BACKEND_HOSTS = new Set(['localhost:5110', '127.0.0.1:5110']);

export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    /\.(mp4|webm|m3u8|mov)(\?.*)?$/i.test(trimmed)
    || trimmed.startsWith('/uploads/')
    || trimmed.startsWith('blob:')
    || trimmed.startsWith('data:video/')
  );
}

export function normalizeMediaUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('/uploads/')
    || trimmed.startsWith('blob:')
    || trimmed.startsWith('data:')
  ) {
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

export function extractYouTubeId(url: string): string | null {
  const match = url.trim().match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  if (match?.[2] && match[2].length === 11) {
    return match[2];
  }
  return null;
}

export function isYouTubeUrl(url?: string | null): boolean {
  if (!url) return false;
  return /youtu(\.be|be\.com)/i.test(url);
}

export function isNonEmbeddablePageUrl(url?: string | null): boolean {
  if (!url) return false;
  return /themoviedb\.org|imdb\.com|google\.com\/search|yandex\.(az|ru|com)\/search|\/search\?/i.test(url);
}

export function isKnownEmbedUrl(url?: string | null): boolean {
  if (!url) return false;
  if (isYouTubeUrl(url)) return true;
  if (isDirectVideoUrl(url)) return true;
  return /embed|player|video_ext|vimeo\.com/i.test(url);
}

function buildYoutubeEmbedUrl(videoId: string): string {
  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&controls=1&modestbranding=1&playsinline=1&origin=${origin}`;
}

export interface WatchPartyMediaSource {
  url: string;
  kind: 'direct' | 'youtube' | 'embed' | 'none';
  fallbackUrl?: string;
  youtubeWatchUrl?: string;
}

export function resolveWatchPartyMediaSource(source: {
  videoUrl?: string;
  externalUrl?: string;
  trailerUrl?: string;
  streamUrl?: string;
}): WatchPartyMediaSource {
  const videoUrl = normalizeMediaUrl(source.videoUrl);
  const externalUrl = normalizeMediaUrl(source.externalUrl);
  const trailerUrl = (source.trailerUrl || '').trim();
  const streamUrl = normalizeMediaUrl(source.streamUrl);

  if (videoUrl && isDirectVideoUrl(videoUrl)) {
    return { url: videoUrl, kind: 'direct' };
  }

  if (streamUrl && isDirectVideoUrl(streamUrl)) {
    return { url: streamUrl, kind: 'direct' };
  }

  const youtubeCandidates = [streamUrl, trailerUrl, videoUrl, externalUrl].filter(Boolean);
  for (const candidate of youtubeCandidates) {
    const youtubeId = extractYouTubeId(candidate);
    if (youtubeId) {
      return {
        url: buildYoutubeEmbedUrl(youtubeId),
        kind: 'youtube',
        fallbackUrl: videoUrl && isDirectVideoUrl(videoUrl) ? videoUrl : undefined,
        youtubeWatchUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      };
    }
  }

  if (externalUrl && isDirectVideoUrl(externalUrl)) {
    return { url: externalUrl, kind: 'direct' };
  }

  for (const candidate of [streamUrl, trailerUrl, videoUrl, externalUrl]) {
    if (!candidate || isNonEmbeddablePageUrl(candidate)) continue;
    if (candidate.includes('embed') || candidate.includes('player') || candidate.includes('video_ext') || /vimeo\.com/i.test(candidate)) {
      return { url: candidate, kind: 'embed' };
    }
  }

  if (videoUrl && !isNonEmbeddablePageUrl(videoUrl)) {
    return { url: videoUrl, kind: 'direct' };
  }

  return { url: '', kind: 'none' };
}
