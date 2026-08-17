const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
      if (entity.startsWith('#x') || entity.startsWith('#X')) {
        const code = parseInt(entity.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      if (entity.startsWith('#')) {
        const code = parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return HTML_ENTITY_MAP[`&${entity};`] ?? match;
    });
}

export function stripHtml(html?: string | null): string {
  if (!html) return '';

  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n\n')
    .replace(/<\s*p[^>]*>/gi, '');

  const withoutTags = withBreaks.replace(/<[^>]+>/g, ' ');
  const decoded = decodeHtmlEntities(withoutTags);
  return decoded.replace(/\uFFFD/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

export function truncateText(text: string, maxLength = 480): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function isGoogleBooksPreviewUrl(url?: string | null): boolean {
  if (!url) return false;
  return /books\.google\./i.test(url) || /googleusercontent\.com/i.test(url);
}
