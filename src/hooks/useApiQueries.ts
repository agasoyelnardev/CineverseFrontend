import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

// ==================== QUERY KEYS ====================
export const QUERY_KEYS = {
  movies: ['movies'] as const,
  movieDetails: (id: string) => ['movies', id] as const,
  books: ['books'] as const,
  bookDetails: (id: string) => ['books', id] as const,
  adminStats: ['admin', 'stats'] as const,
  adminUsers: (search?: string, role?: string, page?: number) => ['admin', 'users', { search, role, page }] as const,
  adminActivityLogs: ['admin', 'activityLogs'] as const,
  adminRecentActivity: ['admin', 'recentActivity'] as const,
  currentUser: ['user', 'current'] as const,
  userFavorites: ['user', 'favorites'] as const,
  userWatchlist: ['user', 'watchlist'] as const,
  streamRooms: ['streamRooms'] as const,
};

// ==================== MOVIES HOOKS ====================
export function useMoviesQuery(paramsObj?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  genre?: string;
  yearFilter?: string;
  ratingFilter?: string;
  isTrending?: boolean;
  isTopRated?: boolean;
  isNewRelease?: boolean;
  sortBy?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.movies, paramsObj],
    queryFn: () => api.apiGetMovies(paramsObj),
  });
}

export function useMovieDetailsQuery(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.movieDetails(id),
    queryFn: () => api.apiGetMovieById(id),
    enabled: !!id,
  });
}

// ==================== BOOKS HOOKS ====================
export function useBooksQuery(paramsObj?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  language?: string;
  year?: number;
  minRating?: number;
  isTrending?: boolean;
  isTopRated?: boolean;
  isNewRelease?: boolean;
  genre?: string;
  sortBy?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.books, paramsObj],
    queryFn: () => api.apiGetBooks(paramsObj),
  });
}

export function useBookDetailsQuery(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.bookDetails(id),
    queryFn: () => api.apiGetBookById(id),
    enabled: !!id,
  });
}

// ==================== ADMIN HOOKS ====================
export function useAdminStatsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminStats,
    queryFn: () => api.apiGetAdminStats(),
  });
}

export function useAdminUsersQuery(search?: string, role?: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.adminUsers(search, role, page),
    queryFn: () => api.apiGetAdminUsers(search, role, page, pageSize),
  });
}

export function useAdminActivityLogsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminActivityLogs,
    queryFn: () => api.apiGetAdminActivityLogs(),
  });
}

export function useAdminRecentActivityQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.adminRecentActivity,
    queryFn: () => api.apiGetAdminRecentActivity(),
  });
}

// ==================== MUTATIONS ====================
export function useToggleBanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, banReason }: { userId: string; banReason?: string }) =>
      api.apiToggleAdminUserBan(userId, banReason),
    meta: {
      successMessage: 'İstifadəçi bloklama statusu yeniləndi',
      errorMessage: 'Bloklama əməliyyatında xəta baş verdi',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useUpdateRolesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      api.apiUpdateAdminUserRoles(userId, roles),
    meta: {
      successMessage: 'İstifadəçi rolları uğurla yeniləndi',
      errorMessage: 'Rolların yenilənməsində xəta baş verdi',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useAddPointsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, points }: { userId: string; points: number }) =>
      api.apiAddAdminUserPoints(userId, points),
    meta: {
      successMessage: 'İstifadəçiyə bal əlavə edildi',
      errorMessage: 'Bal əlavə edilərkən xəta baş verdi',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.apiDeleteAdminUser(userId),
    meta: {
      successMessage: 'İstifadəçi hesabı uğurla silindi',
      errorMessage: 'İstifadəçi silinərkən xəta baş verdi',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });
}

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movieId: string) => api.apiToggleMovieFavorite(movieId),
    meta: {
      successMessage: 'Sevimli filmlər siyahısı yeniləndi',
      errorMessage: 'Sevimli filmlər yenilənərkən xəta baş verdi',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userFavorites });
    },
  });
}

export function useToggleWatchlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movieId: string) => api.apiToggleMovieWatchlist(movieId),
    meta: {
      successMessage: 'İzləmə siyahısı yeniləndi',
      errorMessage: 'İzləmə siyahısı yenilənərkən xəta baş verdi',
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userWatchlist });
    },
  });
}
