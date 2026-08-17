export type StreamPlaybackMode = 'iframe' | 'video';

export interface StreamPlaybackInfo {
  mode: StreamPlaybackMode;
  src: string;
}

/** YouTube embed, HLS (.m3u8) və birbaşa video faylları üçün uyğun player tipini seçir. */
export function getStreamPlaybackInfo(rawUrl: string): StreamPlaybackInfo {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { mode: 'video', src: '' };
  }

  const youtubePatterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/))([^?&/]+)/i,
    /youtube\.com\/embed\/([^?&/]+)/i,
  ];

  for (const pattern of youtubePatterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return { mode: 'iframe', src: `https://www.youtube.com/embed/${match[1]}` };
    }
  }

  if (/\.(mp4|webm|m3u8|m4v|mov)(\?.*)?$/i.test(trimmed) || trimmed.includes('mux.dev')) {
    return { mode: 'video', src: trimmed };
  }

  if (/\.(html?|php)(\?.*)?$/i.test(trimmed) || trimmed.includes('embed')) {
    return { mode: 'iframe', src: trimmed };
  }

  return { mode: 'video', src: trimmed };
}
