import { Book, Movie } from '../types';

/** Backend Guid / string ID-ləri müqayisə üçün normallaşdırır. */
export function normalizeEntityId(id: unknown): string {
  if (id === null || id === undefined) return '';
  return String(id).trim().toLowerCase();
}

export function idsInclude(list: string[] | undefined, id: unknown): boolean {
  if (!list?.length) return false;
  const normalized = normalizeEntityId(id);
  if (!normalized) return false;
  return list.some((item) => normalizeEntityId(item) === normalized);
}

export function extractIdList(profile: Record<string, unknown>, camelKey: string, pascalKey: string): string[] {
  const raw = profile[camelKey] ?? profile[pascalKey];
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeEntityId).filter(Boolean);
}

export function mergeMoviesById(existing: Movie[], incoming: Movie[]): Movie[] {
  const map = new Map<string, Movie>();
  for (const movie of existing) {
    const key = normalizeEntityId(movie.id);
    if (key) map.set(key, movie);
  }
  for (const movie of incoming) {
    const key = normalizeEntityId(movie.id);
    if (!key) continue;
    map.set(key, { ...map.get(key), ...movie, id: key });
  }
  return Array.from(map.values());
}

export function mergeBooksById(existing: Book[], incoming: Book[]): Book[] {
  const map = new Map<string, Book>();
  for (const book of existing) {
    const key = normalizeEntityId(book.id);
    if (key) map.set(key, book);
  }
  for (const book of incoming) {
    const key = normalizeEntityId(book.id);
    if (!key) continue;
    map.set(key, { ...map.get(key), ...book, id: key });
  }
  return Array.from(map.values());
}
