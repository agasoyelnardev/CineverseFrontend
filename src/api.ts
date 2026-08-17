// API Client for CineVerse WebApi backend (ASP.NET Core / MediatR)

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('cineverse_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('cineverse_token', token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('cineverse_refresh_token');
}

export function setRefreshToken(token: string) {
  localStorage.setItem('cineverse_refresh_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('cineverse_token');
  localStorage.removeItem('cineverse_refresh_token');
}

const AUTH_NO_RETRY_PATHS = ['/auth/refresh', '/auth/login', '/auth/register'];

function isAuthNoRetryPath(endpoint: string): boolean {
  const lower = endpoint.toLowerCase();
  return AUTH_NO_RETRY_PATHS.some((path) => lower.startsWith(path));
}

let refreshPromise: Promise<boolean> | null = null;

/** Raw fetch — request() interceptorundan keçmir. */
async function performTokenRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    const accessToken = data.accessToken || data.token;
    if (accessToken) setAuthToken(accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return !!accessToken;
  } catch {
    return false;
  }
}

function ensureTokenRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Şəbəkə/qoşulma xətası — boş `{}` cavabından fərqləndirmək üçün. */
export class ApiNetworkError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, cause?: unknown) {
    super(`Şəbəkə xətası: serverə qoşulmaq mümkün olmadı (${endpoint})`);
    this.name = 'ApiNetworkError';
    this.endpoint = endpoint;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

function isNetworkFetchError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof Error && err.message.toLowerCase().includes('fetch')) return true;
  return false;
}

async function request<T>(endpoint: string, options: RequestInit = {}, hasRetried = false): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (
      response.status === 401 &&
      !hasRetried &&
      !isAuthNoRetryPath(endpoint)
    ) {
      const refreshed = await ensureTokenRefreshed();
      if (refreshed) {
        return request<T>(endpoint, options, true);
      }
      removeAuthToken();
    }

    if (!response.ok) {
      const errorText = await response.text();
      let message = `API Xətası (${response.status})`;
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.message || parsed.title || message;
      } catch {
        if (errorText) message = errorText;
      }
      throw new Error(message);
    }

    // If response is empty or 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  } catch (err: unknown) {
    if (isNetworkFetchError(err)) {
      console.debug(
        `[API] Şəbəkə sorğusu uğursuz oldu (${endpoint}):`,
        err instanceof Error ? err.message : String(err),
      );
      throw new ApiNetworkError(endpoint, err);
    }
    throw err;
  }
}

// ==================== STATS API ====================
export interface PublicStatsDto {
  onlineCount: number;
  totalReviews: number;
  activeRoomsCount: number;
}

export async function apiGetPublicStats() {
  return request<PublicStatsDto>('/stats', {
    method: 'GET',
  });
}

export async function apiGetOnlineCount() {
  return request<{ onlineCount: number }>('/stats/online-count', {
    method: 'GET',
  });
}

// ==================== SUBSCRIPTION API ====================
export enum PremiumPlan {
  Monthly = 0,
  Yearly = 1,
}

export async function apiSubscribe(plan: PremiumPlan) {
  return request<any>('/subscriptions/subscribe', {
    method: 'POST',
    body: JSON.stringify(plan),
  });
}

export async function apiCancelSubscription() {
  return request<any>('/subscriptions/cancel', {
    method: 'POST',
  });
}

// ==================== MOVIES API ====================
export interface CreateMoviePayload {
  title: string;
  originalTitle?: string;
  description: string;
  poster?: string;
  banner?: string;
  year?: number;
  duration?: string;
  director?: string;
  trailerUrl?: string;
  videoUrl?: string;
  externalUrl?: string;
  isTrending?: boolean;
  isTopRated?: boolean;
  isNewRelease?: boolean;
  genres?: string[];
  cast?: string[];
  bookSourceId?: string;
}

export async function apiGetMovies(paramsObj?: {
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
} | number, pageSizeParam: number = 20, searchTermParam?: string) {
  const params = new URLSearchParams();

  if (typeof paramsObj === 'object' && paramsObj !== null) {
    if (paramsObj.pageNumber) params.append('PageNumber', paramsObj.pageNumber.toString());
    if (paramsObj.pageSize) params.append('PageSize', paramsObj.pageSize.toString());
    if (paramsObj.searchTerm) params.append('SearchTerm', paramsObj.searchTerm);
    if (paramsObj.genre) params.append('Genre', paramsObj.genre);
    if (paramsObj.yearFilter) params.append('YearFilter', paramsObj.yearFilter);
    if (paramsObj.ratingFilter) params.append('RatingFilter', paramsObj.ratingFilter);
    if (paramsObj.isTrending !== undefined) params.append('IsTrending', paramsObj.isTrending.toString());
    if (paramsObj.isTopRated !== undefined) params.append('IsTopRated', paramsObj.isTopRated.toString());
    if (paramsObj.isNewRelease !== undefined) params.append('IsNewRelease', paramsObj.isNewRelease.toString());
    if (paramsObj.sortBy) params.append('SortBy', paramsObj.sortBy);
  } else {
    const pageNum = typeof paramsObj === 'number' ? paramsObj : 1;
    params.append('PageNumber', pageNum.toString());
    params.append('PageSize', pageSizeParam.toString());
    if (searchTermParam) params.append('SearchTerm', searchTermParam);
  }

  return request<any>(`/movies?${params.toString()}`, {
    method: 'GET',
  });
}

export async function apiGetMovieById(id: string) {
  return request<any>(`/movies/${id}`, {
    method: 'GET',
  });
}

export async function apiCreateMovie(payload: CreateMoviePayload) {
  return request<any>('/movies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateMovie(id: string, payload: CreateMoviePayload) {
  return request<any>(`/movies/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...payload }),
  });
}

export async function apiDeleteMovie(id: string) {
  return request<any>(`/movies/${id}`, {
    method: 'DELETE',
  });
}

export async function apiSearchTmdb(query: string) {
  try {
    const res = await request<any>(`/movies/tmdb/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.results)) return res.results;
    if (res && Array.isArray(res.movies)) return res.movies;
    return [];
  } catch {
    return [];
  }
}

export async function apiImportTmdb(tmdbId: number) {
  return request<any>(`/movies/tmdb/import/${tmdbId}`, {
    method: 'POST',
  });
}

export interface BatchImportItemResult {
  externalId: number | string;
  success: boolean;
  entityId?: string;
  error?: string;
}

export interface BatchImportResult {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchImportItemResult[];
}

export async function apiImportTmdbBatch(tmdbIds: number[]) {
  return request<BatchImportResult>('/movies/tmdb/import/batch', {
    method: 'POST',
    body: JSON.stringify({ tmdbIds }),
  });
}

// ==================== BOOKS API ====================
export interface CreateBookPayload {
  title: string;
  author: string;
  description?: string;
  cover?: string;
  language?: string;
  year?: number;
  pages?: number;
  downloadUrl?: string;
  pdfUrl?: string;
  pdfFile?: File;
  customContent?: string;
  isTrending?: boolean;
  isTopRated?: boolean;
  isNewRelease?: boolean;
  genres?: string[];
}

function buildBookFormData(payload: CreateBookPayload, id?: string): FormData {
  const formData = new FormData();
  if (id) formData.append('Id', id);
  if (payload.title) formData.append('Title', payload.title);
  if (payload.author) formData.append('Author', payload.author);
  if (payload.description) formData.append('Description', payload.description);
  if (payload.cover) formData.append('Cover', payload.cover);
  if (payload.language) formData.append('Language', payload.language);
  if (payload.year !== undefined) formData.append('Year', payload.year.toString());
  if (payload.pages !== undefined) formData.append('Pages', payload.pages.toString());
  if (payload.downloadUrl) formData.append('DownloadUrl', payload.downloadUrl);
  if (payload.pdfUrl) formData.append('PdfUrl', payload.pdfUrl);
  if (payload.pdfFile) formData.append('PdfFile', payload.pdfFile);
  if (payload.customContent) formData.append('CustomContent', payload.customContent);
  if (payload.isTrending !== undefined) formData.append('IsTrending', payload.isTrending.toString());
  if (payload.isTopRated !== undefined) formData.append('IsTopRated', payload.isTopRated.toString());
  if (payload.isNewRelease !== undefined) formData.append('IsNewRelease', payload.isNewRelease.toString());

  if (Array.isArray(payload.genres)) {
    payload.genres.forEach((genre, index) => {
      formData.append(`Genres[${index}]`, genre);
      formData.append('Genres', genre);
    });
  }

  return formData;
}

async function submitBookFormData(url: string, method: 'POST' | 'PUT', formData: FormData): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method,
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let message = `API Xətası (${response.status})`;
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.message || parsed.title || message;
      } catch {
        if (errorText) message = errorText;
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return {};
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  } catch (err: unknown) {
    if (isNetworkFetchError(err)) {
      throw new ApiNetworkError(url, err);
    }
    throw err;
  }
}

export async function apiGetBooks(paramsObj?: {
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
  const params = new URLSearchParams();
  if (paramsObj?.pageNumber) params.append('PageNumber', paramsObj.pageNumber.toString());
  if (paramsObj?.pageSize) params.append('PageSize', paramsObj.pageSize.toString());
  if (paramsObj?.searchTerm) params.append('SearchTerm', paramsObj.searchTerm);
  if (paramsObj?.language) params.append('Language', paramsObj.language);
  if (paramsObj?.year) params.append('Year', paramsObj.year.toString());
  if (paramsObj?.minRating !== undefined) params.append('MinRating', paramsObj.minRating.toString());
  if (paramsObj?.isTrending !== undefined) params.append('IsTrending', paramsObj.isTrending.toString());
  if (paramsObj?.isTopRated !== undefined) params.append('IsTopRated', paramsObj.isTopRated.toString());
  if (paramsObj?.isNewRelease !== undefined) params.append('IsNewRelease', paramsObj.isNewRelease.toString());
  if (paramsObj?.genre) params.append('Genre', paramsObj.genre);
  if (paramsObj?.sortBy) params.append('SortBy', paramsObj.sortBy);

  const res = await request<any>(`/books?${params.toString()}`, {
    method: 'GET',
  });
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  if (res && Array.isArray(res.data)) return res.data;
  return res || [];
}

export async function apiGetBookById(id: string) {
  return request<any>(`/books/${id}`, {
    method: 'GET',
  });
}

export async function apiCreateBook(payload: CreateBookPayload) {
  const formData = buildBookFormData(payload);
  return submitBookFormData('/books', 'POST', formData);
}

export async function apiUpdateBook(id: string, payload: CreateBookPayload) {
  const formData = buildBookFormData(payload, id);
  return submitBookFormData(`/books/${id}`, 'PUT', formData);
}

export async function apiDeleteBook(id: string) {
  return request<any>(`/books/${id}`, {
    method: 'DELETE',
  });
}

export interface GoogleBooksSearchItem {
  id: string;
  googleBooksId?: string;
  title?: string;
  author?: string;
  coverUrl?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: { thumbnail?: string };
  };
}

export interface GoogleBooksSearchResponse {
  items: GoogleBooksSearchItem[];
  warning?: string;
}

function normalizeGoogleBooksItem(raw: any): GoogleBooksSearchItem | null {
  if (!raw) return null;

  const id = String(raw.id ?? raw.googleBooksId ?? raw.GoogleBooksId ?? '');
  if (!id) return null;

  if (raw.volumeInfo) {
    return {
      id,
      googleBooksId: id,
      volumeInfo: raw.volumeInfo,
    };
  }

  const title = raw.title ?? raw.Title ?? 'Adsız kitab';
  const author = raw.author ?? raw.Author ?? '';
  const coverUrl = raw.coverUrl ?? raw.CoverUrl ?? '';

  return {
    id,
    googleBooksId: id,
    title,
    author,
    coverUrl,
    volumeInfo: {
      title,
      authors: author ? [author] : [],
      imageLinks: coverUrl ? { thumbnail: coverUrl } : undefined,
    },
  };
}

async function fetchGoogleBooksDirect(query: string): Promise<GoogleBooksSearchItem[]> {
  const encoded = encodeURIComponent(query.trim());
  const delays = [0, 1500, 3000];

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
    }

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=20`);
      if (!response.ok) continue;
      const data = await response.json();
      if (!Array.isArray(data?.items)) return [];
      return data.items
        .map(normalizeGoogleBooksItem)
        .filter((item): item is GoogleBooksSearchItem => item !== null);
    } catch {
      // növbəti cəhd
    }
  }

  return [];
}

export async function apiSearchGoogleBooks(query: string): Promise<GoogleBooksSearchResponse> {
  try {
    const res = await request<any>(`/books/googlebooks/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
    });

    const rawItems = Array.isArray(res)
      ? res
      : (res?.items ?? res?.books ?? res?.results ?? []);

    const items = rawItems
      .map(normalizeGoogleBooksItem)
      .filter((item): item is GoogleBooksSearchItem => item !== null);

    if (items.length > 0) {
      return { items };
    }
  } catch {
    // backend fallback
  }

  const directItems = await fetchGoogleBooksDirect(query);
  if (directItems.length > 0) {
    return { items: directItems };
  }

  return {
    items: [],
    warning:
      'Google Books hazırda cavab vermir. Bir neçə dəqiqə sonra yenidən cəhd edin və ya kitabı PDF/link ilə əl ilə əlavə edin.',
  };
}

export async function apiImportGoogleBook(googleBooksId: string) {
  const importedId = await request<string>(`/books/googlebooks/import/${googleBooksId}`, {
    method: 'POST',
  });

  const bookId = typeof importedId === 'string'
    ? importedId
    : String((importedId as any)?.id ?? (importedId as any)?.Id ?? importedId);

  return apiGetBookById(bookId);
}

export async function apiUploadPdf(file: File): Promise<{ pdfUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/books/upload-pdf`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `PDF yüklənmə xətası (${response.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || parsed.title || message;
    } catch {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }

  const data = await response.json();
  return {
    pdfUrl: data.pdfUrl || data.PdfUrl || (typeof data === 'string' ? data : ''),
  };
}

// ==================== USER PROFILE & MANAGEMENT API ====================
export interface UserProfileDto {
  id: string;
  userName: string;
  fullName: string;
  avatar: string;
  bio: string;
  points: number;
  badge: string;
  isPremium: boolean;
  followersCount: number;
  followingCount: number;
}

export interface AdminUserDto {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  role: string;
  isPremium: boolean;
  points: number;
  isBlocked: boolean;
  banReason?: string;
  bannedAt?: string;
}

export interface SetRoleRequest {
  role: string;
}

export interface SetStatusRequest {
  isBlocked: boolean;
  reason?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  avatar: string;
  bio: string;
}

export async function apiGetUserProfile(id: string) {
  return request<UserProfileDto>(`/users/${id}`, {
    method: 'GET',
  });
}

export async function apiGetUser(id: string) {
  return apiGetUserProfile(id);
}

export async function apiUpdateProfile(payload: { fullName?: string; avatar?: string; bio?: string; userId?: string }) {
  return request<void>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      fullName: payload.fullName || '',
      avatar: payload.avatar || '',
      bio: payload.bio || '',
    }),
  });
}

export async function apiAddMyPoints(points: number) {
  return request<{ points: number }>('/users/me/points', {
    method: 'POST',
    body: JSON.stringify(points),
  });
}

export async function apiGetAllUsers(searchTerm?: string, role?: string, page: number = 1, pageSize: number = 20) {
  const params = new URLSearchParams();
  if (searchTerm) params.append('searchTerm', searchTerm);
  if (role) params.append('role', role);
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  return request<AdminUserDto[]>(`/users?${params.toString()}`, {
    method: 'GET',
  });
}

export async function apiGetUsers(searchTerm?: string, role?: string, page: number = 1, pageSize: number = 20) {
  return apiGetAllUsers(searchTerm, role, page, pageSize);
}

export async function apiSetUserRole(userId: string, role: string) {
  return request<boolean>(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export async function apiSetUserStatus(userId: string, isBlocked: boolean, reason?: string) {
  return request<boolean>(`/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isBlocked, reason }),
  });
}

export async function apiToggleUserRole(userId: string) {
  return request<void>(`/users/${userId}/toggle-role`, {
    method: 'PUT',
  });
}

export async function apiDeleteUser(userId: string) {
  return request<void>(`/users/${userId}`, {
    method: 'DELETE',
  });
}

// ==================== AUTH & ACCOUNT API ====================
export async function apiLogin(email: string, passwordHash: string) {
  const data = await request<{ accessToken?: string; refreshToken?: string; token?: string; user?: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password: passwordHash }),
  });
  const token = data.accessToken || data.token;
  if (token) {
    setAuthToken(token);
  }
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  return data;
}

export async function apiRegister(payload: { email: string; passwordHash: string; username?: string; fullName?: string }) {
  const data = await request<{ accessToken?: string; refreshToken?: string; token?: string; user?: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      fullName: payload.fullName || '',
      userName: payload.username || payload.email.split('@')[0],
      email: payload.email.trim(),
      password: payload.passwordHash,
    }),
  });
  const token = data.accessToken || data.token;
  if (token) {
    setAuthToken(token);
  }
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  return data;
}

export async function apiExternalLogin(payload: { provider: string; idToken: string; fullName?: string }) {
  const data = await request<{ accessToken?: string; refreshToken?: string; token?: string; user?: any }>('/auth/external-login', {
    method: 'POST',
    body: JSON.stringify({
      provider: payload.provider,
      idToken: payload.idToken,
      fullName: payload.fullName || '',
    }),
  });
  const token = data.accessToken || data.token;
  if (token) {
    setAuthToken(token);
  }
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  return data;
}

export async function apiRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Refresh token yoxdur.');

  const ok = await performTokenRefresh();
  if (!ok) throw new Error('Token yenilənmədi.');
  return {
    accessToken: getAuthToken() ?? undefined,
    refreshToken: getRefreshToken() ?? undefined,
  };
}

export async function apiGetMe() {
  return request<any>('/auth/me', {
    method: 'GET',
  });
}

export async function apiLogout() {
  const refreshToken = getRefreshToken() || '';
  try {
    if (refreshToken) {
      await request<any>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    removeAuthToken();
  }
}

export async function apiChangePassword(payload: { currentPassword?: string; newPassword?: string; userId?: string }) {
  return request<any>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    }),
  });
}

// ==================== AI CHAT API ====================
export async function apiAskAiChat(prompt: string) {
  return request<{
    reply: string;
    text?: string;
    response?: string;
    recommendedMovieIds?: string[];
    recommendedBookIds?: string[];
  }>('/aichat/ask', {
    method: 'POST',
    body: JSON.stringify({ prompt, message: prompt }),
  });
}

// ==================== ADMIN API ====================
export interface AdminStatsDto {
  totalMovies: number;
  totalBooks: number;
  totalUsers: number;
  activeUsersCount: number;
  blockedUsersCount: number;
  activeRoomsCount: number;
  totalReviews: number;
  totalBookReviews: number;
  totalDiscussions: number;
  premiumUsersCount: number;
  monthlyPlanUsersCount: number;
  yearlyPlanUsersCount: number;
  vipRevenue: number;
  ticketRevenue: number;
}

export interface AdminActivityLogDto {
  id: string;
  adminUsername: string;
  action: string;
  description: string;
  targetEntityType?: string;
  targetEntityId?: string;
  createdAt: string;
}

export interface AdminUserDto {
  id: string;
  username: string;
  email: string;
  avatar: string;
  roles: string[];
  isBanned: boolean;
  banReason?: string;
  isPremium: boolean;
  premiumEndDate?: string;
  points: number;
  createdAt: string;
  reviewCount: number;
}

export interface RecentUserDto {
  id: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

export interface RecentReviewDto {
  id: string;
  type?: string;
  targetTitle?: string;
  movieTitle?: string;
  username: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface RecentActivityDto {
  recentUsers: RecentUserDto[];
  recentReviews: RecentReviewDto[];
}

export async function apiGetAdminStats() {
  return request<AdminStatsDto>('/admin/stats', {
    method: 'GET',
  });
}

export async function apiGetAdminRecentActivity(userCount: number = 10, reviewCount: number = 10) {
  return request<RecentActivityDto>(`/admin/recent-activity?userCount=${userCount}&reviewCount=${reviewCount}`, {
    method: 'GET',
  });
}

export async function apiGetAdminUsers(search?: string, role?: string, page: number = 1, pageSize: number = 20) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (role) params.append('role', role);
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  return request<{ items: AdminUserDto[]; totalCount: number; pageIndex: number; totalPages: number } | AdminUserDto[]>(
    `/admin/users?${params.toString()}`,
    { method: 'GET' }
  );
}

export async function apiToggleAdminUserBan(userId: string, banReason?: string) {
  return request<{ isBanned: boolean }>(`/admin/users/${userId}/toggle-ban`, {
    method: 'POST',
    body: JSON.stringify(banReason || ''),
  });
}

export async function apiUpdateAdminUserRoles(userId: string, roles: string[]) {
  return request<void>(`/admin/users/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify(roles),
  });
}

export async function apiAddAdminUserPoints(userId: string, points: number) {
  return request<{ points: number }>(`/admin/users/${userId}/add-points`, {
    method: 'POST',
    body: JSON.stringify(points),
  });
}

export async function apiDeleteAdminUser(userId: string) {
  return request<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function apiGetAdminActivityLogs() {
  return request<AdminActivityLogDto[]>('/admin/activity-logs', {
    method: 'GET',
  });
}

export async function apiDeleteAdminReview(id: string) {
  return request<void>(`/admin/reviews/${id}`, {
    method: 'DELETE',
  });
}

export async function apiDeleteAdminBookReview(id: string) {
  return request<void>(`/admin/book-reviews/${id}`, {
    method: 'DELETE',
  });
}

export async function apiCloseAdminRoom(id: string) {
  return request<void>(`/admin/rooms/${id}/close`, {
    method: 'POST',
  });
}

export interface TopMovieAnalyticsItem {
  id: string;
  title: string;
  poster: string;
  viewCount: number;
  likes: number;
  rating: number;
}

export interface TopRoomAnalyticsItem {
  id: string;
  title: string;
  currentViewerCount: number;
  peakViewerCount: number;
  isLive: boolean;
  movieTitle?: string;
}

export interface TopContentAnalytics {
  topMovies: TopMovieAnalyticsItem[];
  topRooms: TopRoomAnalyticsItem[];
}

export async function apiGetAdminTopContentAnalytics(limit = 10) {
  return request<TopContentAnalytics>(`/admin/analytics/top-content?limit=${limit}`, {
    method: 'GET',
  });
}

export interface ModerationReviewItem {
  id: string;
  type: string;
  targetTitle: string;
  username: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ModerationDiscussionItem {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  commentsCount: number;
  likes: number;
  createdAt: string;
}

export interface ModerationContent {
  reviews: ModerationReviewItem[];
  discussions: ModerationDiscussionItem[];
}

export async function apiGetAdminModerationContent(reviewLimit = 30, discussionLimit = 30) {
  return request<ModerationContent>(
    `/admin/moderation?reviewLimit=${reviewLimit}&discussionLimit=${discussionLimit}`,
    { method: 'GET' },
  );
}

export async function apiImportGoogleBookBatch(googleBooksIds: string[]) {
  return request<BatchImportResult>('/books/googlebooks/import/batch', {
    method: 'POST',
    body: JSON.stringify({ googleBooksIds }),
  });
}

// ==================== MOVIE LISTS API ====================
export async function apiToggleMovieFavorite(movieId: string) {
  const res = await request<any>(`/movielists/favorites/${movieId}/toggle`, {
    method: 'POST',
  });
  let isFav = false;
  if (res && typeof res === 'object') {
    if (typeof res.isFavorite === 'boolean') isFav = res.isFavorite;
    else if (typeof res.IsFavorite === 'boolean') isFav = res.IsFavorite;
  } else if (typeof res === 'boolean') {
    isFav = res;
  }
  return { isFavorite: isFav };
}

export async function apiGetMovieFavorites() {
  const res = await request<any[]>('/movielists/favorites', {
    method: 'GET',
  });
  return Array.isArray(res) ? res : [];
}

export async function apiToggleMovieWatchlist(movieId: string) {
  const res = await request<any>(`/movielists/watchlist/${movieId}/toggle`, {
    method: 'POST',
  });
  let inWl = false;
  if (res && typeof res === 'object') {
    if (typeof res.isInWatchlist === 'boolean') inWl = res.isInWatchlist;
    else if (typeof res.IsInWatchlist === 'boolean') inWl = res.IsInWatchlist;
  } else if (typeof res === 'boolean') {
    inWl = res;
  }
  return { isInWatchlist: inWl };
}

export async function apiGetMovieWatchlist() {
  const res = await request<any[]>('/movielists/watchlist', {
    method: 'GET',
  });
  return Array.isArray(res) ? res : [];
}

export async function apiToggleMovieLike(movieId: string) {
  const res = await request<any>(`/movielists/likes/${movieId}/toggle`, {
    method: 'POST',
  });
  let liked = false;
  if (res && typeof res === 'object') {
    if (typeof res.isLiked === 'boolean') liked = res.isLiked;
    else if (typeof res.IsLiked === 'boolean') liked = res.IsLiked;
  } else if (typeof res === 'boolean') {
    liked = res;
  }
  return { isLiked: liked };
}

export async function apiMarkMovieAsWatched(movieId: string) {
  return request<{ message: string }>(`/movielists/start-watching/${movieId}`, {
    method: 'POST',
  });
}

export async function apiGetMovieHistory() {
  const res = await request<any[]>('/movielists/history', {
    method: 'GET',
  });
  return Array.isArray(res) ? res : [];
}

// ==================== BOOK COLLECTIONS API ====================
export async function apiGetBookCollections(page: number = 1, pageSize: number = 20) {
  return request<any[] | { items: any[]; totalCount: number }>(`/bookcollections?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
  });
}

export async function apiCreateBookCollection(payload: { title: string; description: string; cover: string }) {
  return request<string>('/bookcollections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateBookCollection(id: string, payload: { title: string; description: string; cover: string }) {
  return request<any>(`/bookcollections/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...payload }),
  });
}

export async function apiDeleteBookCollection(id: string) {
  return request<any>(`/bookcollections/${id}`, {
    method: 'DELETE',
  });
}

export async function apiAddBookToCollection(bookCollectionId: string, bookId: string) {
  return request<any>(`/bookcollections/${bookCollectionId}/books/${bookId}`, {
    method: 'POST',
  });
}

export async function apiRemoveBookFromCollection(bookCollectionId: string, bookId: string) {
  return request<any>(`/bookcollections/${bookCollectionId}/books/${bookId}`, {
    method: 'DELETE',
  });
}

export async function apiToggleBookCollectionLike(bookCollectionId: string) {
  return request<{ isLiked: boolean }>(`/bookcollections/${bookCollectionId}/like`, {
    method: 'POST',
  });
}

export async function apiToggleSaveBookCollection(bookCollectionId: string) {
  return request<{ isSaved: boolean }>(`/bookcollections/${bookCollectionId}/save`, {
    method: 'POST',
  });
}

export async function apiGetBookCollectionById(id: string) {
  return request<any>(`/bookcollections/${id}`, {
    method: 'GET',
  });
}

export async function apiGetUserBookCollections(userId: string) {
  return request<any[]>(`/bookcollections/user/${userId}`, {
    method: 'GET',
  });
}

export async function apiGetSavedBookCollections() {
  return request<any[]>('/bookcollections/saved', {
    method: 'GET',
  });
}

// ==================== BOOK LISTS API (FAVORITES, LIKES, WATCHLIST) ====================
export async function apiToggleBookFavorite(bookId: string) {
  return request<{ isFavorite: boolean }>(`/booklists/favorites/${bookId}/toggle`, {
    method: 'POST',
  });
}

export async function apiGetUserBookFavorites() {
  return request<any[]>('/booklists/favorites', {
    method: 'GET',
  });
}

export async function apiToggleBookLike(bookId: string) {
  return request<{ isLiked: boolean }>(`/booklists/likes/${bookId}/toggle`, {
    method: 'POST',
  });
}

export async function apiToggleBookWatchlist(bookId: string) {
  return request<{ isInWatchlist: boolean }>(`/booklists/watchlist/${bookId}/toggle`, {
    method: 'POST',
  });
}

export async function apiGetUserBookWatchlist() {
  return request<any[]>('/booklists/watchlist', {
    method: 'GET',
  });
}

// ==================== BOOK REVIEWS API ====================
export async function apiCreateBookReview(payload: { bookId: string; rating: number; comment: string }) {
  return request<string>('/bookreviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateBookReview(id: string, payload: { rating: number; comment: string }) {
  return request<any>(`/bookreviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...payload }),
  });
}

export async function apiDeleteBookReview(id: string) {
  return request<any>(`/bookreviews/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetBookReviewsByBookId(bookId: string) {
  return request<any[]>(`/bookreviews/book/${bookId}`, {
    method: 'GET',
  });
}

export async function apiLikeBookReview(id: string) {
  const res = await request<any>(`/bookreviews/${id}/like`, {
    method: 'POST',
  });
  if (res && typeof res === 'object') {
    if (typeof res.active === 'boolean') return res.active;
    if (typeof res.Active === 'boolean') return res.Active;
  }
  return res;
}

export async function apiDislikeBookReview(id: string) {
  const res = await request<any>(`/bookreviews/${id}/dislike`, {
    method: 'POST',
  });
  if (res && typeof res === 'object') {
    if (typeof res.active === 'boolean') return res.active;
    if (typeof res.Active === 'boolean') return res.Active;
  }
  return res;
}

// ==================== BOOK VS MOVIES API ====================
export interface CreateBookVsMoviePayload {
  title: string;
  description?: string;
  bookId: string;
  movieId: string;
}

export async function apiGetAllBookVsMovies() {
  return request<any[]>('/bookvsmovies', {
    method: 'GET',
  });
}

export async function apiGetBookVsMovieById(id: string) {
  return request<any>(`/bookvsmovies/${id}`, {
    method: 'GET',
  });
}

export async function apiCreateBookVsMovie(payload: CreateBookVsMoviePayload) {
  return request<string>('/bookvsmovies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteBookVsMovie(id: string) {
  return request<any>(`/bookvsmovies/${id}`, {
    method: 'DELETE',
  });
}

export async function apiVoteBookVsMovie(id: string, choice: 0 | 1 | 'Book' | 'Movie') {
  return request<{ message: string }>(`/bookvsmovies/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify(choice),
  });
}

export async function apiUnvoteBookVsMovie(id: string) {
  return request<{ message: string }>(`/bookvsmovies/${id}/vote`, {
    method: 'DELETE',
  });
}

// ==================== CHAT API ====================
export interface ChatMessageDto {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl: string;
  messageText: string;
  isSystemMessage: boolean;
  createdAt: string;
}

export interface SendChatMessagePayload {
  roomId: string;
  messageText: string;
}

export async function apiGetRoomMessages(roomId: string) {
  return request<ChatMessageDto[]>(`/chats/room/${roomId}`, {
    method: 'GET',
  });
}

export async function apiSendChatMessage(payload: SendChatMessagePayload) {
  return request<{ message: string; messageId: string }>('/chats/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteChatMessage(id: string) {
  return request<any>(`/chats/${id}`, {
    method: 'DELETE',
  });
}



export async function apiUpdateChatMessage(id: string, messageText: string) {
  return request<any>(`/chats/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, messageText }),
  });
}

// ==================== MOVIE COLLECTIONS API ====================
export interface MovieSummaryDto {
  id: string;
  title: string;
  poster: string;
  rating: number;
}

export interface MovieCollectionDto {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  appUserId: string;
  movieCount: number;
  isSaved: boolean;
  likesCount: number;
  isLikedByCurrentUser: boolean;
}

export interface MovieCollectionDetailDto extends MovieCollectionDto {
  movies: MovieSummaryDto[];
}

export interface CreateMovieCollectionPayload {
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
}

export async function apiGetUserMovieCollections(targetUserId: string) {
  return request<MovieCollectionDto[]>(`/moviecollections/user/${targetUserId}`, {
    method: 'GET',
  });
}

export async function apiGetSavedMovieCollections() {
  return request<MovieCollectionDto[]>('/moviecollections/saved', {
    method: 'GET',
  });
}

export async function apiGetMovieCollectionById(id: string) {
  return request<MovieCollectionDetailDto>(`/moviecollections/${id}`, {
    method: 'GET',
  });
}

export async function apiCreateMovieCollection(payload: CreateMovieCollectionPayload) {
  return request<string>('/moviecollections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateMovieCollection(id: string, payload: CreateMovieCollectionPayload) {
  return request<any>(`/moviecollections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteMovieCollection(id: string) {
  return request<any>(`/moviecollections/${id}`, {
    method: 'DELETE',
  });
}

export async function apiAddMovieToCollection(collectionId: string, movieId: string) {
  return request<any>(`/moviecollections/${collectionId}/movies/${movieId}`, {
    method: 'POST',
  });
}

export async function apiRemoveMovieFromCollection(collectionId: string, movieId: string) {
  return request<any>(`/moviecollections/${collectionId}/movies/${movieId}`, {
    method: 'DELETE',
  });
}

export async function apiToggleMovieCollectionLike(collectionId: string) {
  const res = await request<any>(`/moviecollections/${collectionId}/like`, {
    method: 'POST',
  });
  if (res && typeof res === 'object') {
    if (typeof res.isLiked === 'boolean') return res.isLiked;
    if (typeof res.IsLiked === 'boolean') return res.IsLiked;
  }
  return res as boolean;
}

export async function apiToggleSaveCollection(collectionId: string) {
  const res = await request<any>(`/moviecollections/${collectionId}/save`, {
    method: 'POST',
  });
  if (res && typeof res === 'object') {
    if (typeof res.isSaved === 'boolean') return res.isSaved;
    if (typeof res.IsSaved === 'boolean') return res.IsSaved;
  }
  return res as boolean;
}

export async function apiGetAllMovieCollections(page: number = 1, pageSize: number = 20) {
  return request<any>(`/moviecollections?page=${page}&pageSize=${pageSize}`, {
    method: 'GET',
  });
}

export interface DiscussionDto {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  author: string;
  authorAvatar: string;
  likes: number;
  isLikedByCurrentUser?: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface CommentDto {
  id: string;
  authorId: string;
  author: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface DiscussionDetailDto extends DiscussionDto {
  comments: CommentDto[];
}

export interface CreateDiscussionPayload {
  title: string;
  content: string;
  category: number | string;
}

export async function apiGetDiscussions(category?: string | number, page: number = 1, pageSize: number = 20) {
  const params = new URLSearchParams();
  if (category !== undefined && category !== null && category !== '') {
    params.append('category', category.toString());
  }
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());

  return request<DiscussionDto[]>(`/discussions?${params.toString()}`, {
    method: 'GET',
  });
}



export async function apiGetDiscussionById(id: string) {
  return request<DiscussionDetailDto>(`/discussions/${id}`, {
    method: 'GET',
  });
}

export async function apiCreateDiscussion(payload: CreateDiscussionPayload) {
  return request<string>('/discussions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateDiscussion(id: string, payload: CreateDiscussionPayload) {
  return request<any>(`/discussions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteDiscussion(id: string) {
  return request<any>(`/discussions/${id}`, {
    method: 'DELETE',
  });
}

export async function apiToggleDiscussionLike(id: string) {
  return request<{ isLiked: boolean }>(`/discussions/${id}/like`, {
    method: 'POST',
  });
}

export async function apiAddDiscussionComment(discussionId: string, content: string) {
  return request<string>(`/discussions/${discussionId}/comments`, {
    method: 'POST',
    body: JSON.stringify(content),
  });
}

export async function apiDeleteDiscussionComment(commentId: string) {
  return request<any>(`/discussions/comments/${commentId}`, {
    method: 'DELETE',
  });
}

export async function apiUpdateDiscussionComment(commentId: string, content: string) {
  return request<any>(`/discussions/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ id: commentId, content }),
  });
}

// ==================== NOTIFICATIONS API ====================
export async function apiGetNotifications(page: number = 1, pageSize: number = 20, unreadOnly: boolean = false) {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  if (unreadOnly) params.append('unreadOnly', 'true');

  return request<{
    items: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      isRead: boolean;
      createdAt: string;
      relatedEntityId?: string;
    }>;
    totalCount: number;
    unreadCount: number;
    pageNumber: number;
    pageSize: number;
  }>(`/notifications?${params.toString()}`, {
    method: 'GET',
  });
}

export async function apiGetUnreadNotificationsCount() {
  return request<number>('/notifications/unread-count', {
    method: 'GET',
  });
}

export async function apiToggleNotificationRead(id: string) {
  return request<any>(`/notifications/${id}/toggle-read`, {
    method: 'PUT',
  });
}

export async function apiMarkAllNotificationsAsRead() {
  return request<any>('/notifications/mark-all-read', {
    method: 'PUT',
  });
}

export async function apiDeleteNotification(id: string) {
  return request<any>(`/notifications/${id}`, {
    method: 'DELETE',
  });
}

// ==================== REVIEWS API (MOVIE REVIEWS) ====================
export interface MovieReviewDto {
  id: string;
  movieId: string;
  movieTitle: string;
  userId: string;
  username: string;
  userAvatar: string;
  rating: number;
  comment: string;
  likes: number;
  dislikes: number;
  createdAt: string;
}

export interface CreateMovieReviewPayload {
  movieId: string;
  rating: number;
  content: string;
}

export interface UpdateMovieReviewPayload {
  rating: number;
  content: string;
}

export async function apiGetReviewsByMovieId(movieId: string) {
  return request<MovieReviewDto[]>(`/reviews/movie/${movieId}`, {
    method: 'GET',
  });
}

export async function apiCreateMovieReview(payload: CreateMovieReviewPayload) {
  return request<string>('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateMovieReview(id: string, payload: UpdateMovieReviewPayload) {
  return request<void>(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...payload }),
  });
}

export async function apiDeleteMovieReview(id: string) {
  return request<void>(`/reviews/${id}`, {
    method: 'DELETE',
  });
}

export async function apiLikeMovieReview(id: string) {
  return request<{ active: boolean }>(`/reviews/${id}/like`, {
    method: 'POST',
  });
}

export async function apiDislikeMovieReview(id: string) {
  return request<{ active: boolean }>(`/reviews/${id}/dislike`, {
    method: 'POST',
  });
}

// ==================== READING PROGRESS API ====================
export interface ReadingProgressDetailDto {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  pages: number;
  percentageComplete: number;
  updatedAt?: string;
}

export async function apiUpdateReadingProgress(bookId: string, percentageComplete: number) {
  return request<void>(`/readingprogress/${bookId}`, {
    method: 'PUT',
    body: JSON.stringify(percentageComplete),
  });
}

export async function apiGetReadingProgress(bookId: string) {
  return request<number>(`/readingprogress/${bookId}`, {
    method: 'GET',
  });
}

export async function apiGetAllReadingProgress() {
  return request<Record<string, number>>('/readingprogress', {
    method: 'GET',
  });
}

export async function apiGetReadingHistory() {
  return request<ReadingProgressDetailDto[]>('/readingprogress/history', {
    method: 'GET',
  });
}
// ==================== SOCIAL API ====================
export interface FriendDto {
  id: string;
  userName: string;
  avatar: string;
}

export interface FriendRequestDto {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  createdAt: string;
}

export interface ActivityDto {
  id: string;
  type: string; // "review", "favorite", "collection", "rate"
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  movieId?: string;
  movieTitle?: string;
  createdAt: string;
}

export async function apiFollowUser(userId: string) {
  return request<{ message: string }>(`/social/follow/${userId}`, {
    method: 'POST',
  });
}

export async function apiUnfollowUser(userId: string) {
  return request<{ message: string }>(`/social/follow/${userId}`, {
    method: 'DELETE',
  });
}

export async function apiGetFollowers(userId: string) {
  return request<UserPreviewDto[]>(`/social/followers/${userId}`, {
    method: 'GET',
  });
}

export async function apiGetFollowing(userId: string) {
  return request<UserPreviewDto[]>(`/social/following/${userId}`, {
    method: 'GET',
  });
}

export async function apiGetFriends(userId: string) {
  return request<FriendDto[]>(`/social/friends/${userId}`, {
    method: 'GET',
  });
}

export async function apiGetPendingFriendRequests() {
  return request<FriendRequestDto[]>('/social/friend-requests', {
    method: 'GET',
  });
}

export async function apiSendFriendRequest(userId: string) {
  return request<{ message: string }>(`/social/friend-request/${userId}`, {
    method: 'POST',
  });
}

export async function apiAcceptFriendRequest(friendshipId: string) {
  return request<{ message: string }>(`/social/friend-request/${friendshipId}/accept`, {
    method: 'PUT',
  });
}

export async function apiDeclineFriendRequest(friendshipId: string) {
  return request<{ message: string }>(`/social/friend-request/${friendshipId}/decline`, {
    method: 'PUT',
  });
}

export async function apiRemoveFriend(userId: string) {
  return request<{ message: string }>(`/social/friend/${userId}`, {
    method: 'DELETE',
  });
}

export async function apiGetActivityStream(hours: number = 2) {
  return request<ActivityDto[]>(`/social/activity-stream?hours=${hours}`, {
    method: 'GET',
  });
}

// ==================== GLOBAL SEARCH API ====================
export interface UserPreviewDto {
  id: string;
  userName: string;
  avatar: string;
}

export interface GlobalSearchResultDto {
  movies: any[];
  books: any[];
  users: UserPreviewDto[];
  movieCollections: any[];
  bookCollections: any[];
  discussions: any[];
}

export async function apiGlobalSearch(query: string, limit: number = 5) {
  const params = new URLSearchParams({ q: query, limit: limit.toString() });
  return request<GlobalSearchResultDto>(`/search?${params.toString()}`, {
    method: 'GET',
  });
}

export interface RoomDto {
  id: string;
  title: string;
  streamUrl?: string;
  type: string;
  isLive: boolean;
  isPremium: boolean;
  viewerCount: number;
  coverImageUrl?: string;
  createdByUserId: string;
  movieId?: string;
  movieTitle?: string;
  movieDescription?: string;
  moviePoster?: string;
  movieTrailerUrl?: string;
  movieVideoUrl?: string;
  isPrivate?: boolean;
}

export interface RoomPreviewDto {
  id: string;
  title: string;
  isPrivate: boolean;
  isPremium: boolean;
  isLive: boolean;
  viewerCount: number;
  canPreviewDetails: boolean;
  canJoinWithAuth: boolean;
  movieId?: string;
  movieTitle?: string;
  movieDescription?: string;
  moviePoster?: string;
  movieTrailerUrl?: string;
  movieVideoUrl?: string;
  createdByUserId: string;
  inviteToken?: string | null;
}

export interface CreateRoomPayload {
  roomName: string;
  type?: string;
  movieId?: string;
  streamUrl?: string;
  isPrivate?: boolean;
  isPremium?: boolean;
}

export async function apiGetActiveRooms() {
  return request<RoomDto[]>('/rooms', {
    method: 'GET',
  });
}

export async function apiCreateRoom(payload: CreateRoomPayload) {
  return request<{ message: string; roomId: string; inviteToken?: string }>('/rooms/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetRoomById(roomId: string, inviteToken?: string) {
  const params = inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : '';
  return request<RoomPreviewDto>(`/rooms/${roomId}${params}`, {
    method: 'GET',
  });
}

export async function apiJoinRoomWithInviteToken(roomId: string, inviteToken: string) {
  return request<{ message: string }>(`/rooms/${roomId}/join-with-token`, {
    method: 'POST',
    body: JSON.stringify({ inviteToken }),
  });
}

export async function apiDeleteRoom(roomId: string) {
  return request<{ message: string }>(`/rooms/${roomId}`, {
    method: 'DELETE',
  });
}

export async function apiCloseRoom(roomId: string) {
  return request<{ message: string }>(`/rooms/${roomId}/close`, {
    method: 'PUT',
  });
}

export async function apiTransferHost(roomId: string, newHostUserId: string) {
  return request<{ message: string }>(`/rooms/${roomId}/transfer-host/${newHostUserId}`, {
    method: 'PUT',
  });
}

export async function apiInviteToRoom(roomId: string, recipientUserId: string) {
  return request<{ message: string }>(`/rooms/${roomId}/invite/${recipientUserId}`, {
    method: 'POST',
  });
}

// ==================== LIVESTREAMS API ====================
export interface LiveStreamDto {
  id: string;
  channelKey: string;
  title: string;
  description: string;
  streamUrl: string;
  thumbnailUrl: string;
  isLive: boolean;
  viewerCount: number;
  category: string;
  startedAt?: string;
}

export interface LiveStreamMessageDto {
  id: string;
  liveStreamId: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  message: string;
  createdAt: string;
}

export interface LiveStreamScheduleDto {
  id: string;
  channelKey: string;
  programTitle: string;
  description: string;
  airTime: string;
  durationMinutes: number;
}

export interface CreateLiveStreamPayload {
  channelKey: string;
  title: string;
  description?: string;
  streamUrl: string;
  thumbnailUrl?: string;
  category: string;
}

export interface SendLiveStreamMessagePayload {
  liveStreamId: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  message: string;
}

export async function apiGetLiveStreams() {
  return request<LiveStreamDto[]>('/livestreams', {
    method: 'GET',
  });
}

export async function apiGetLiveStreamById(id: string) {
  return request<LiveStreamDto>(`/livestreams/${id}`, {
    method: 'GET',
  });
}

export async function apiGetLiveStreamChatHistory(id: string) {
  return request<LiveStreamMessageDto[]>(`/livestreams/${id}/chat-history`, {
    method: 'GET',
  });
}

export async function apiSendLiveStreamMessage(payload: SendLiveStreamMessagePayload) {
  return request<LiveStreamMessageDto>('/livestreams/chat-message', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateLiveStreamMessage(id: string, messageText: string) {
  return request<void>(`/livestreams/chat-message/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, messageText }),
  });
}

export async function apiDeleteLiveStreamMessage(id: string) {
  return request<void>(`/livestreams/chat-message/${id}`, {
    method: 'DELETE',
  });
}

export async function apiGetLiveStreamSchedule() {
  return request<LiveStreamScheduleDto[]>('/livestreams/schedule', {
    method: 'GET',
  });
}

export async function apiCreateLiveStreamChannel(payload: CreateLiveStreamPayload) {
  return request<{ id: string }>('/livestreams/admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiToggleLiveStream(id: string) {
  return request<{ isLive: boolean }>('/livestreams/admin/toggle-live', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function apiUpdateLiveStreamChannel(id: string, payload: Partial<CreateLiveStreamPayload>) {
  return request<any>(`/livestreams/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...payload }),
  });
}

export async function apiDeleteLiveStreamChannel(id: string) {
  return request<any>(`/livestreams/admin/${id}`, {
    method: 'DELETE',
  });
}