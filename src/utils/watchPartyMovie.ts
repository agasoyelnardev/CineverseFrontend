import { Movie, WatchParty } from '../types';
import { normalizeEntityId } from './entityIds';
import { isDirectVideoUrl, isYouTubeUrl } from './mediaUrl';

export function findMovieInList(movies: Movie[], movieId?: string | null): Movie | undefined {
  if (!movieId) return undefined;
  const normalized = normalizeEntityId(movieId);
  return movies.find((movie) => normalizeEntityId(movie.id) === normalized);
}

export function buildMovieFromParty(party: WatchParty): Movie | null {
  if (!party.movieTitle && !party.streamUrl) return null;

  const streamUrl = party.streamUrl?.trim() || '';
  const isDirect = isDirectVideoUrl(streamUrl);
  const isYoutube = isYouTubeUrl(streamUrl);

  return {
    id: party.movieId || party.id,
    title: party.movieTitle || party.roomName,
    originalTitle: party.movieTitle || party.roomName,
    description: party.movieDescription || 'Watch Party otağı üçün seçilmiş film.',
    poster: party.moviePoster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
    banner: party.moviePoster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    rating: 0,
    year: new Date().getFullYear(),
    duration: '2saat 00dəq',
    genres: ['Watch Party'],
    director: 'Naməlum',
    cast: [],
    trailerUrl: isYoutube || (!isDirect && streamUrl) ? streamUrl : '',
    videoUrl: isDirect ? streamUrl : party.movieVideoUrl,
    externalUrl: !isDirect && !isYoutube ? streamUrl : undefined,
    likes: 0,
    reviews: [],
  };
}

export function resolvePartyMovie(party: WatchParty, movies: Movie[]): Movie {
  return (
    findMovieInList(movies, party.movieId)
    ?? buildMovieFromParty(party)
    ?? {
      id: party.movieId || party.id,
      title: party.roomName,
      originalTitle: party.roomName,
      description: 'Film məlumatı yüklənir...',
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
      rating: 0,
      year: new Date().getFullYear(),
      duration: '2saat 00dəq',
      genres: ['Watch Party'],
      director: 'Naməlum',
      cast: [],
      trailerUrl: party.streamUrl || '',
      videoUrl: party.movieVideoUrl,
      externalUrl: party.streamUrl,
      likes: 0,
      reviews: [],
    }
  );
}
