import { Book } from '../types';
import { normalizeEntityId } from './entityIds';

export function mapBackendBook(b: any): Book {
  return {
    id: normalizeEntityId(b.id ?? b.Id),
    title: b.title ?? b.Title ?? 'Adsız kitab',
    author: b.author ?? b.Author ?? 'Naməlum Müəllif',
    description: b.description ?? b.Description ?? '',
    cover: b.cover ?? b.Cover ?? '',
    rating: b.rating ?? b.Rating ?? 0,
    language: (b.language ?? b.Language) === 'en' ? 'en' : 'az',
    genres: b.genres ?? b.Genres ?? [],
    year: b.year ?? b.Year ?? new Date().getFullYear(),
    pages: b.pages ?? b.Pages ?? 0,
    reviews: [],
    likes: b.likes ?? b.Likes ?? 0,
    isLikedByCurrentUser: !!(b.isLikedByCurrentUser ?? b.IsLikedByCurrentUser),
    movieAdaptationId: b.movieAdaptationId ?? b.MovieAdaptationId,
    downloadUrl: b.downloadUrl ?? b.DownloadUrl,
    pdfUrl: b.pdfUrl ?? b.PdfUrl,
    customContent: b.customContent ?? b.CustomContent,
    isTrending: b.isTrending ?? b.IsTrending,
    isTopRated: b.isTopRated ?? b.IsTopRated,
    isNewRelease: b.isNewRelease ?? b.IsNewRelease,
  };
}
