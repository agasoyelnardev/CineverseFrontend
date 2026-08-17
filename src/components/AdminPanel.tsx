import React, { useState, useEffect, useMemo } from 'react';
import { Users, Film, MessageSquare, Folder, Plus, Trash2, Edit3, BookOpen, TrendingUp, ShieldCheck, Ban, CheckCircle, BarChart3, Search, Download, RefreshCw, Globe, AlertCircle, FileText, UploadCloud, Link, FilePlus, Radio, Tv, Play, Power, Video, Layers, Wifi, X, ArrowLeft } from 'lucide-react';
import { Movie, User, Book, BookVsMovie } from '../types';
import {
  apiCreateMovie,
  apiUpdateMovie,
  apiDeleteMovie,
  apiSearchTmdb,
  apiImportTmdb,
  apiImportTmdbBatch,
  apiCreateBook,
  apiUpdateBook,
  apiDeleteBook,
  apiSearchGoogleBooks,
  apiImportGoogleBook,
  apiUploadPdf,
  apiUpdateProfile,
  apiCreateLiveStreamChannel,
  apiToggleLiveStream,
  apiUpdateLiveStreamChannel,
  apiDeleteLiveStreamChannel,
  apiGetLiveStreams,
  apiCreateBookVsMovie,
  apiDeleteBookVsMovie,
  apiGetAllBookVsMovies,
  apiDeleteAdminReview,
  apiDeleteAdminBookReview,
  apiCloseAdminRoom,
  apiGetActiveRooms,
  AdminUserDto,
  AdminStatsDto,
  RecentReviewDto,
} from '../api';
import AdminAnalyticsModeration from './AdminAnalyticsModeration';
import {
  useAdminStatsQuery,
  useAdminUsersQuery,
  useAdminActivityLogsQuery,
  useAdminRecentActivityQuery,
  useToggleBanMutation,
  useUpdateRolesMutation,
  useDeleteUserMutation,
} from '../hooks/useApiQueries';
import { mapBackendBook } from '../utils/mapBook';

interface AdminPanelProps {
  movies: Movie[];
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  theme: 'dark' | 'light';
  books?: Book[];
  setBooks?: React.Dispatch<React.SetStateAction<Book[]>>;
  bookVsMovies?: BookVsMovie[];
  setBookVsMovies?: React.Dispatch<React.SetStateAction<BookVsMovie[]>>;
}

export default function AdminPanel({ 
  movies, 
  setMovies, 
  users, 
  setUsers, 
  theme, 
  books = [], 
  setBooks,
  bookVsMovies = [],
  setBookVsMovies
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'movies' | 'users' | 'books' | 'livestreams' | 'bookVsMovies' | 'analytics' | 'moderation'>('stats');

  const statsEnabled = activeTab === 'stats';
  const usersTabEnabled = activeTab === 'users';

  const {
    data: adminStats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useAdminStatsQuery(statsEnabled);

  const {
    data: recentActivity,
    isLoading: isRecentActivityLoading,
    isError: isRecentActivityError,
    refetch: refetchRecentActivity,
  } = useAdminRecentActivityQuery(statsEnabled);

  const {
    data: activityLogs,
    isLoading: isActivityLogsLoading,
    isError: isActivityLogsError,
    refetch: refetchActivityLogs,
  } = useAdminActivityLogsQuery(statsEnabled);

  const {
    data: adminUsersResponse,
    isLoading: isAdminUsersLoading,
    isError: isAdminUsersError,
    error: adminUsersError,
    refetch: refetchAdminUsers,
  } = useAdminUsersQuery(undefined, undefined, 1, 50, usersTabEnabled);

  const toggleBanMutation = useToggleBanMutation();
  const updateRolesMutation = useUpdateRolesMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const adminUsers = useMemo((): AdminUserDto[] => {
    if (!adminUsersResponse) return [];
    if (Array.isArray(adminUsersResponse)) return adminUsersResponse;
    return adminUsersResponse.items ?? [];
  }, [adminUsersResponse]);

  const formatAdminDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAdminUserRoleLabel = (roles: string[]) =>
    roles.some((role) => role.toLowerCase() === 'admin') ? 'admin' : 'user';

  const handleRefreshAdminData = () => {
    if (activeTab === 'stats') {
      refetchStats();
      refetchRecentActivity();
      refetchActivityLogs();
    } else if (activeTab === 'users') {
      refetchAdminUsers();
    }
  };

  const isAdminDataLoading =
    statsEnabled &&
    (isStatsLoading || isRecentActivityLoading || isActivityLogsLoading);

  const hasAdminDataError =
    statsEnabled &&
    (isStatsError || isRecentActivityError || isActivityLogsError);

  const stats: AdminStatsDto | null = adminStats ?? null;
  const recentUsers = recentActivity?.recentUsers ?? [];
  const recentReviews = recentActivity?.recentReviews ?? [];
  const logs = activityLogs ?? [];
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [moderationBusyId, setModerationBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!statsEnabled) return;
    let cancelled = false;
    const loadActiveRooms = async () => {
      setIsRoomsLoading(true);
      try {
        const rooms = await apiGetActiveRooms();
        if (!cancelled && Array.isArray(rooms)) {
          setActiveRooms(rooms);
        }
      } catch (err) {
        console.warn('Aktiv otaqlar yüklənə bilmədi:', err);
      } finally {
        if (!cancelled) setIsRoomsLoading(false);
      }
    };
    loadActiveRooms();
    return () => { cancelled = true; };
  }, [statsEnabled]);

  const handleDeleteRecentReview = async (review: RecentReviewDto) => {
    if (!window.confirm('Bu rəyi silmək istədiyinizdən əminsiniz?')) return;
    const reviewId = String(review.id);
    setModerationBusyId(reviewId);
    try {
      if (review.type === 'Book') {
        await apiDeleteAdminBookReview(reviewId);
      } else {
        await apiDeleteAdminReview(reviewId);
      }
      await refetchRecentActivity();
    } catch (err) {
      console.error('Rəy silinmədi:', err);
      alert('Rəy silinərkən xəta baş verdi.');
    } finally {
      setModerationBusyId(null);
    }
  };

  const handleCloseActiveRoom = async (roomId: string) => {
    if (!window.confirm('Bu watch party otağını bağlamaq istədiyinizdən əminsiniz?')) return;
    setModerationBusyId(roomId);
    try {
      await apiCloseAdminRoom(roomId);
      setActiveRooms((prev) => prev.filter((room) => String(room.id) !== String(roomId)));
    } catch (err) {
      console.error('Otaq bağlanmadı:', err);
      alert('Otaq bağlanarkən xəta baş verdi.');
    } finally {
      setModerationBusyId(null);
    }
  };

  // Book vs Movie Creation State
  const [isCreatingBvm, setIsCreatingBvm] = useState(false);
  const [isSubmittingBvm, setIsSubmittingBvm] = useState(false);
  const [newBvmTitle, setNewBvmTitle] = useState('');
  const [newBvmDesc, setNewBvmDesc] = useState('');
  const [newBvmBookId, setNewBvmBookId] = useState('');
  const [newBvmCustomBookTitle, setNewBvmCustomBookTitle] = useState('');
  const [newBvmMovieId, setNewBvmMovieId] = useState('');
  const [newBvmCustomMovieTitle, setNewBvmCustomMovieTitle] = useState('');
  
  // Live Stream Form State
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [isLiveStreamsLoading, setIsLiveStreamsLoading] = useState(false);
  const [isCreatingLiveStreamPage, setIsCreatingLiveStreamPage] = useState(false);
  const [isSubmittingLiveStream, setIsSubmittingLiveStream] = useState(false);

  const [newLiveStream, setNewLiveStream] = useState({
    channelKey: '',
    title: '',
    description: '',
    streamUrl: '',
    thumbnailUrl: '',
    category: 'Futbol' as string
  });
  const [editingLiveStreamId, setEditingLiveStreamId] = useState<string | null>(null);
  const [editLiveStream, setEditLiveStream] = useState({
    channelKey: '',
    title: '',
    description: '',
    streamUrl: '',
    thumbnailUrl: '',
    category: 'Futbol' as string
  });
  const [isSubmittingLiveStreamEdit, setIsSubmittingLiveStreamEdit] = useState(false);

  const fetchLiveStreams = async () => {
    setIsLiveStreamsLoading(true);
    try {
      const res = await apiGetLiveStreams();
      if (Array.isArray(res)) {
        setLiveStreams(res);
      }
    } catch (err) {
      console.log('LiveStreams fetch notice:', err);
    } finally {
      setIsLiveStreamsLoading(false);
    }
  };

  const fetchBookVsMovies = async () => {
    try {
      const res = await apiGetAllBookVsMovies();
      if (Array.isArray(res) && res.length > 0 && setBookVsMovies) {
        const mapped: BookVsMovie[] = res.map((item: any) => ({
          id: item.id || item.Id || '',
          title: item.title || item.Title || '',
          description: item.description || item.Description || '',
          bookId: item.bookId || item.BookId || '',
          movieId: item.movieId || item.MovieId || '',
          bookVotes: item.bookVotes ?? item.BookVotes ?? 0,
          movieVotes: item.movieVotes ?? item.MovieVotes ?? 0,
          bookTitle: item.bookTitle || item.BookTitle,
          bookCover: item.bookCover || item.BookCover,
          movieTitle: item.movieTitle || item.MovieTitle,
          moviePoster: item.moviePoster || item.MoviePoster,
          myVote: item.myVote ?? item.MyVote
        }));
        setBookVsMovies(mapped);
      }
    } catch (err) {
      console.log('BookVsMovies fetch notice:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'livestreams') {
      fetchLiveStreams();
    } else if (activeTab === 'bookVsMovies') {
      fetchBookVsMovies();
    }
  }, [activeTab]);

  const handleCreateBookVsMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBvmTitle.trim()) {
      setApiMessage({ type: 'error', text: 'Zəhmət olmasa müqayisə başlığını daxil edin.' });
      return;
    }

    if (!newBvmBookId && !newBvmCustomBookTitle.trim()) {
      setApiMessage({ type: 'error', text: 'Zəhmət olmasa bir kitab seçin və ya yeni kitabın adını daxil edin.' });
      return;
    }

    if (!newBvmMovieId && !newBvmCustomMovieTitle.trim()) {
      setApiMessage({ type: 'error', text: 'Zəhmət olmasa bir film seçin və ya yeni filmin adını daxil edin.' });
      return;
    }

    setIsSubmittingBvm(true);
    setApiMessage(null);

    try {
      let finalBookId = newBvmBookId;
      let selectedBookObj = books.find(b => b.id === newBvmBookId);

      // Handle custom book title entry if user chose 'custom' or entered a new book title
      if (newBvmBookId === 'custom' || (!newBvmBookId && newBvmCustomBookTitle.trim())) {
        const trimmedCustomBookTitle = newBvmCustomBookTitle.trim();
        const existingBook = books.find(b => b.title.toLowerCase() === trimmedCustomBookTitle.toLowerCase());

        if (existingBook) {
          finalBookId = existingBook.id;
          selectedBookObj = existingBook;
        } else {
          let createdRes: any = null;
          try {
            createdRes = await apiCreateBook({
              title: trimmedCustomBookTitle,
              author: 'Məlum deyil',
              description: `${trimmedCustomBookTitle} kitabı`,
              cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
              language: 'az',
              year: new Date().getFullYear(),
              pages: 200,
              genres: ['Bədii']
            });
          } catch (bErr) {
            console.warn('Could not create book in backend, generating local ID:', bErr);
          }

          const createdBookId = (createdRes && typeof createdRes === 'string')
            ? createdRes
            : (createdRes?.id || `book_${Date.now()}`);

          const newBookObj: Book = {
            id: createdBookId,
            title: trimmedCustomBookTitle,
            author: 'Məlum deyil',
            description: `${trimmedCustomBookTitle} kitabı`,
            cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
            rating: 8.0,
            language: 'az',
            genres: ['Bədii'],
            year: new Date().getFullYear(),
            pages: 200,
            reviews: [],
            likes: 0
          };

          if (setBooks) {
            setBooks(prev => [newBookObj, ...prev]);
          }

          finalBookId = createdBookId;
          selectedBookObj = newBookObj;
        }
      }

      let finalMovieId = newBvmMovieId;
      let selectedMovieObj = movies.find(m => m.id === newBvmMovieId);

      // Handle custom movie title entry if user chose 'custom' or entered a new title
      if (newBvmMovieId === 'custom' || (!newBvmMovieId && newBvmCustomMovieTitle.trim())) {
        const trimmedCustomTitle = newBvmCustomMovieTitle.trim();
        const existingMovie = movies.find(m => m.title.toLowerCase() === trimmedCustomTitle.toLowerCase());

        if (existingMovie) {
          finalMovieId = existingMovie.id;
          selectedMovieObj = existingMovie;
        } else {
          // Automatically create new movie entry
          let createdRes: any = null;
          try {
            createdRes = await apiCreateMovie({
              title: trimmedCustomTitle,
              description: `${trimmedCustomTitle} filmi`,
              genres: ['Dram'],
              duration: '120 dəq',
              poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
              banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
              year: new Date().getFullYear(),
              director: 'Məlum deyil'
            });
          } catch (mErr) {
            console.warn('Could not create movie in backend, generating local ID:', mErr);
          }

          const createdMovieId = (createdRes && typeof createdRes === 'string')
            ? createdRes
            : (createdRes?.id || `movie_${Date.now()}`);

          const newMovieObj: Movie = {
            id: createdMovieId,
            title: trimmedCustomTitle,
            originalTitle: trimmedCustomTitle,
            description: `${trimmedCustomTitle} filmi`,
            genres: ['Dram'],
            duration: '120 dəq',
            rating: 8.0,
            poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
            banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
            year: new Date().getFullYear(),
            director: 'Məlum deyil',
            cast: [],
            trailerUrl: '',
            likes: 0,
            reviews: []
          };

          if (setMovies) {
            setMovies(prev => [newMovieObj, ...prev]);
          }

          finalMovieId = createdMovieId;
          selectedMovieObj = newMovieObj;
        }
      }

      const createdId = await apiCreateBookVsMovie({
        title: newBvmTitle.trim(),
        description: newBvmDesc.trim(),
        bookId: finalBookId,
        movieId: finalMovieId
      });

      const createdBvm: BookVsMovie = {
        id: (createdId && typeof createdId === 'string') ? createdId : `bvm_${Date.now()}`,
        title: newBvmTitle.trim(),
        description: newBvmDesc.trim(),
        bookId: finalBookId,
        movieId: finalMovieId,
        bookVotes: 0,
        movieVotes: 0,
        bookTitle: selectedBookObj?.title || newBvmCustomBookTitle.trim(),
        bookCover: selectedBookObj?.cover,
        movieTitle: selectedMovieObj?.title || newBvmCustomMovieTitle.trim(),
        moviePoster: selectedMovieObj?.poster
      };

      if (setBookVsMovies) {
        setBookVsMovies(prev => [createdBvm, ...prev]);
      }

      setApiMessage({ type: 'success', text: 'Kitab vs Film müqayisəsi uğurla yaradıldı!' });
      setNewBvmTitle('');
      setNewBvmDesc('');
      setNewBvmBookId('');
      setNewBvmCustomBookTitle('');
      setNewBvmMovieId('');
      setNewBvmCustomMovieTitle('');
      setIsCreatingBvm(false);
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err?.message || 'Müqayisə yaradılarkən xəta baş verdi.' });
    } finally {
      setIsSubmittingBvm(false);
    }
  };

  const handleDeleteBookVsMovie = async (id: string) => {
    if (!window.confirm('Bu Kitab vs Film müqayisəsini silməyə əminsiniz?')) return;
    try {
      await apiDeleteBookVsMovie(id);
      if (setBookVsMovies) {
        setBookVsMovies(prev => prev.filter(b => b.id !== id));
      }
      setApiMessage({ type: 'success', text: 'Müqayisə uğurla silindi.' });
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err?.message || 'Müqayisə silinərkən xəta baş verdi.' });
    }
  };

  const handleCreateLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiveStream.channelKey.trim() || !newLiveStream.title.trim() || !newLiveStream.streamUrl.trim()) {
      setApiMessage({ type: 'error', text: 'Zəhmət olmasa Kanal Açarı, Başlıq və Yayım URL sahələrini doldurun.' });
      return;
    }

    setIsSubmittingLiveStream(true);
    setApiMessage(null);

    try {
      const res = await apiCreateLiveStreamChannel({
        channelKey: newLiveStream.channelKey.trim(),
        title: newLiveStream.title.trim(),
        description: newLiveStream.description.trim(),
        streamUrl: newLiveStream.streamUrl.trim(),
        thumbnailUrl: newLiveStream.thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
        category: newLiveStream.category
      });

      const generatedId = res?.id || 'ls_' + Date.now();
      const newStreamObj = {
        id: generatedId,
        channelKey: newLiveStream.channelKey.trim(),
        title: newLiveStream.title.trim(),
        description: newLiveStream.description.trim(),
        streamUrl: newLiveStream.streamUrl.trim(),
        thumbnailUrl: newLiveStream.thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
        category: newLiveStream.category,
        isLive: false
      };

      setLiveStreams(prev => [newStreamObj, ...prev]);
      setApiMessage({ 
        type: 'success', 
        text: `"${newLiveStream.title}" kanalı uğurla yaradıldı! (ID: ${generatedId}). İlkin status: Passiv (IsLive: false). Yayımı başlatmaq üçün düyməni sıxın.` 
      });
      setIsCreatingLiveStreamPage(false);
      setNewLiveStream({
        channelKey: '',
        title: '',
        description: '',
        streamUrl: '',
        thumbnailUrl: '',
        category: 'Futbol'
      });
    } catch (err: any) {
      const errMsg = err?.message || 'Xəta baş verdi';
      if (errMsg.includes('409') || errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('mövcuddur')) {
        setApiMessage({ type: 'error', text: 'Xəta (409): Bu ChannelKey artıq istifadə olunur. Başqa unikal açar daxil edin.' });
      } else if (errMsg.includes('400')) {
        setApiMessage({ type: 'error', text: 'Xəta (400): Daxil edilən məlumatların düzgünlüyünü yoxlayın.' });
      } else {
        setApiMessage({ type: 'error', text: `POST /api/livestreams/admin xətası: ${errMsg}` });
      }
    } finally {
      setIsSubmittingLiveStream(false);
    }
  };

  const handleToggleLiveStream = async (id: string, currentStatus: boolean) => {
    setApiMessage(null);
    try {
      const res = await apiToggleLiveStream(id);
      const newStatus = res?.isLive ?? !currentStatus;
      setLiveStreams(prev => prev.map(s => (s.id === id || s.channelKey === id) ? { ...s, isLive: newStatus } : s));
      setApiMessage({
        type: 'success',
        text: newStatus ? 'Yayım UĞURLA BAŞLADILDI! (IsLive: true)' : 'Yayım DAYANDIRILDI. (IsLive: false)'
      });
    } catch (err: any) {
      console.log('Toggle live stream error:', err);
      setApiMessage({
        type: 'error',
        text: err?.message || 'Yayım statusu yenilənə bilmədi. Zəhmət olmasa yenidən cəhd edin.',
      });
    }
  };

  const openEditLiveStream = (stream: any) => {
    setEditingLiveStreamId(stream.id || stream.channelKey);
    setEditLiveStream({
      channelKey: stream.channelKey || '',
      title: stream.title || '',
      description: stream.description || '',
      streamUrl: stream.streamUrl || '',
      thumbnailUrl: stream.thumbnailUrl || '',
      category: stream.category || 'Futbol',
    });
  };

  const handleUpdateLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLiveStreamId) return;
    if (!editLiveStream.channelKey.trim() || !editLiveStream.title.trim() || !editLiveStream.streamUrl.trim()) {
      setApiMessage({ type: 'error', text: 'Zəhmət olmasa Kanal Açarı, Başlıq və Yayım URL sahələrini doldurun.' });
      return;
    }

    setIsSubmittingLiveStreamEdit(true);
    setApiMessage(null);

    try {
      await apiUpdateLiveStreamChannel(editingLiveStreamId, {
        channelKey: editLiveStream.channelKey.trim(),
        title: editLiveStream.title.trim(),
        description: editLiveStream.description.trim(),
        streamUrl: editLiveStream.streamUrl.trim(),
        thumbnailUrl: editLiveStream.thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
        category: editLiveStream.category,
      });

      setLiveStreams(prev => prev.map(s => {
        if (s.id !== editingLiveStreamId && s.channelKey !== editingLiveStreamId) return s;
        return {
          ...s,
          channelKey: editLiveStream.channelKey.trim(),
          title: editLiveStream.title.trim(),
          description: editLiveStream.description.trim(),
          streamUrl: editLiveStream.streamUrl.trim(),
          thumbnailUrl: editLiveStream.thumbnailUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80',
          category: editLiveStream.category,
        };
      }));

      setApiMessage({ type: 'success', text: `"${editLiveStream.title}" kanalı uğurla yeniləndi (PUT /api/livestreams/admin/${editingLiveStreamId}).` });
      setEditingLiveStreamId(null);
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err?.message || 'Kanal yenilənərkən xəta baş verdi.' });
    } finally {
      setIsSubmittingLiveStreamEdit(false);
    }
  };

  const handleDeleteLiveStream = async (id: string) => {
    if (!window.confirm('Bu canlı yayım kanalını silməyə əminsiniz?')) return;

    setApiMessage(null);
    try {
      await apiDeleteLiveStreamChannel(id);
      setLiveStreams(prev => prev.filter(s => s.id !== id && s.channelKey !== id));
      if (editingLiveStreamId === id) {
        setEditingLiveStreamId(null);
      }
      setApiMessage({ type: 'success', text: 'Canlı yayım kanalı uğurla silindi.' });
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err?.message || 'Kanal silinərkən xəta baş verdi.' });
    }
  };
  
  // TMDB Import State
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [importingTmdbId, setImportingTmdbId] = useState<number | null>(null);
  const [selectedTmdbIds, setSelectedTmdbIds] = useState<number[]>([]);
  const [tmdbBulkProgress, setTmdbBulkProgress] = useState<{ current: number; total: number; running: boolean } | null>(null);

  // Google Books Import State
  const [googleBooksQuery, setGoogleBooksQuery] = useState('');
  const [googleBooksResults, setGoogleBooksResults] = useState<any[]>([]);
  const [isSearchingGoogleBooks, setIsSearchingGoogleBooks] = useState(false);
  const [importingGoogleBooksId, setImportingGoogleBooksId] = useState<string | null>(null);
  const [selectedGoogleBookIds, setSelectedGoogleBookIds] = useState<string[]>([]);
  const [googleBooksQueueProgress, setGoogleBooksQueueProgress] = useState<{
    current: number;
    total: number;
    running: boolean;
    succeeded: number;
    failed: number;
  } | null>(null);

  const [apiMessage, setApiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Genres preset list
  const PREDEFINED_GENRES = [
    'Dram', 'Triller', 'Aksiya', 'Komediya', 'Elmi-Fantastika', 'Qorxu',
    'Macəra', 'Fantaziya', 'Romantik', 'Sənədli', 'Klassik', 'Detektiv',
    'Tarixi', 'Psixoloji', 'Uşaq', 'Animasiya', 'Kriminal'
  ];

  // Book Form State
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookGenreInput, setBookGenreInput] = useState('');
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    description: '',
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80',
    language: 'az' as 'az' | 'en',
    genres: ['Dram', 'Klassik'] as string[],
    year: 2026,
    pages: 350,
    downloadUrl: '',
    pdfUrl: '',
    selectedPdfFile: undefined as File | undefined,
    customContent: '',
    isTrending: false,
    isTopRated: false,
    isNewRelease: true
  });

  const handleOpenCreateBookModal = () => {
    setEditingBookId(null);
    setNewBook({
      title: '',
      author: '',
      description: '',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80',
      language: 'az',
      genres: ['Dram', 'Klassik'],
      year: 2026,
      pages: 350,
      downloadUrl: '',
      pdfUrl: '',
      selectedPdfFile: undefined,
      customContent: '',
      isTrending: false,
      isTopRated: false,
      isNewRelease: true
    });
    setShowAddBookModal(true);
  };

  const handleEditBookClick = (b: Book) => {
    setEditingBookId(b.id);
    setNewBook({
      title: b.title || '',
      author: b.author || '',
      description: b.description || '',
      cover: b.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80',
      language: (b.language as 'az' | 'en') || 'az',
      genres: b.genres || ['Dram', 'Klassik'],
      year: b.year || 2026,
      pages: b.pages || 350,
      downloadUrl: (b as any).downloadUrl || '',
      pdfUrl: b.pdfUrl || '',
      selectedPdfFile: undefined,
      customContent: b.customContent || '',
      isTrending: b.isTrending || false,
      isTopRated: b.isTopRated || false,
      isNewRelease: b.isNewRelease || false
    });
    setShowAddBookModal(true);
  };

  // Dedicated PDF Book Form State
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfForm, setPdfForm] = useState({
    title: '',
    author: '',
    pdfUrl: '',
    pdfFileName: '',
    selectedPdfFile: undefined as File | undefined,
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    description: '',
    language: 'az' as 'az' | 'en',
    pages: 250,
    year: 2026,
    genres: ['PDF Sənəd', 'Klassik'] as string[]
  });

  const handlePdfFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setApiMessage({ type: 'error', text: 'Zəhmət olmasa yalnız .pdf formatlı fayl seçin.' });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setApiMessage({ type: 'error', text: 'Fayl ölçüsü maksimum 50MB ola bilər.' });
      return;
    }

    setIsUploadingPdf(true);
    setApiMessage(null);

    // 1. Attempt uploading directly to ASP.NET Core backend API (POST /api/Books/upload-pdf)
    try {
      const res = await apiUploadPdf(file);
      if (res && res.pdfUrl) {
        setPdfForm(prev => ({
          ...prev,
          pdfUrl: res.pdfUrl,
          pdfFileName: file.name,
          selectedPdfFile: file
        }));
        setApiMessage({ type: 'success', text: `"${file.name}" serverə uğurla yükləndi! URL: ${res.pdfUrl}` });
        setIsUploadingPdf(false);
        return;
      }
    } catch (err: any) {
      console.log('Backend upload-pdf notice (falling back to client Data URL):', err?.message || err);
    }

    // 2. Client-side fallback to Data URL (Base64) if backend API is offline or unconfigured
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setPdfForm(prev => ({
        ...prev,
        pdfUrl: result,
        pdfFileName: file.name,
        selectedPdfFile: file
      }));
      setApiMessage({ type: 'success', text: `"${file.name}" seçildi və istifadəyə hazırdır.` });
      setIsUploadingPdf(false);
    };
    reader.onerror = () => {
      setApiMessage({ type: 'error', text: 'Fayl oxunarkən xəta baş verdi.' });
      setIsUploadingPdf(false);
    };
    reader.readAsDataURL(file);
  };

  const handleQuickPdfAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfForm.title || !pdfForm.author || !pdfForm.pdfUrl || !setBooks) {
      setApiMessage({ type: 'error', text: 'Zəhmət olmasa kitabın adını, müəllifini və PDF faylını/linkini daxil edin.' });
      return;
    }

    const newPdfBook: Book = {
      id: 'b_pdf_' + Date.now(),
      title: pdfForm.title,
      author: pdfForm.author,
      description: pdfForm.description || `${pdfForm.author} tərəfindən qələmə alınmış "${pdfForm.title}" PDF sənədi.`,
      cover: pdfForm.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      rating: 5.0,
      language: pdfForm.language,
      genres: pdfForm.genres,
      year: Number(pdfForm.year),
      pages: Number(pdfForm.pages),
      pdfUrl: pdfForm.pdfUrl,
      reviews: [],
      likes: 0
    };

    try {
      await apiCreateBook({
        title: pdfForm.title,
        author: pdfForm.author,
        description: pdfForm.description || undefined,
        cover: pdfForm.cover || undefined,
        language: pdfForm.language,
        year: Number(pdfForm.year),
        pages: Number(pdfForm.pages),
        pdfUrl: pdfForm.pdfUrl,
        pdfFile: pdfForm.selectedPdfFile,
        genres: pdfForm.genres,
        isNewRelease: true
      });
      setApiMessage({ type: 'success', text: `"${pdfForm.title}" PDF kitabı uğurla kitabxanaya əlavə edildi!` });
    } catch (err: any) {
      console.log('Backend create PDF book notice:', err.message);
    }

    setBooks(prev => [newPdfBook, ...prev]);

    // Reset PDF Form
    setPdfForm({
      title: '',
      author: '',
      pdfUrl: '',
      pdfFileName: '',
      selectedPdfFile: undefined,
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
      description: '',
      language: 'az',
      pages: 250,
      year: 2026,
      genres: ['PDF Sənəd', 'Klassik']
    });
  };

  // Movie Form State
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);
  const [movieGenreInput, setMovieGenreInput] = useState('');
  const [newMovie, setNewMovie] = useState({
    title: '',
    originalTitle: '',
    description: '',
    year: 2026,
    duration: '',
    director: '',
    genres: ['Elmi-Fantastika', 'Dram'] as string[],
    cast: '',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
    trailerUrl: '',
    videoUrl: '',
    externalUrl: '',
    isTrending: false,
    isTopRated: false,
    isNewRelease: true,
    bookSourceId: ''
  });

  const handleOpenCreateMovieModal = () => {
    setEditingMovieId(null);
    setNewMovie({
      title: '',
      originalTitle: '',
      description: '',
      year: 2026,
      duration: '',
      director: '',
      genres: ['Elmi-Fantastika', 'Dram'],
      cast: '',
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: '',
      videoUrl: '',
      externalUrl: '',
      isTrending: false,
      isTopRated: false,
      isNewRelease: true,
      bookSourceId: ''
    });
    setShowAddMovieModal(true);
  };

  const handleEditMovieClick = (m: Movie) => {
    setEditingMovieId(m.id);
    setNewMovie({
      title: m.title || '',
      originalTitle: m.originalTitle || m.title || '',
      description: m.description || '',
      year: m.year || 2026,
      duration: m.duration || '',
      director: m.director || '',
      genres: m.genres || ['Elmi-Fantastika', 'Dram'],
      cast: Array.isArray(m.cast) ? m.cast.join(', ') : (m.cast || ''),
      poster: m.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
      banner: m.banner || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: m.trailerUrl || '',
      videoUrl: m.videoUrl || '',
      externalUrl: (m as any).externalUrl || '',
      isTrending: m.isTrending || false,
      isTopRated: m.isTopRated || false,
      isNewRelease: m.isNewRelease || false,
      bookSourceId: (m as any).bookSourceId || ''
    });
    setShowAddMovieModal(true);
  };

  // TMDB Handlers
  const handleSearchTmdb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbQuery.trim()) return;
    setIsSearchingTmdb(true);
    setApiMessage(null);
    try {
      const results = await apiSearchTmdb(tmdbQuery);
      const items = Array.isArray(results) ? results : (results?.results || []);
      setTmdbResults(items);
    } catch (err: any) {
      setTmdbResults([]);
      setApiMessage({ type: 'error', text: err.message || 'TMDB axtarışında xəta baş verdi' });
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  const handleLoadTmdbToModal = (item: any) => {
    const posterUrl = item.poster_path 
      ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
      : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';
      
    const bannerUrl = item.backdrop_path 
      ? (item.backdrop_path.startsWith('http') ? item.backdrop_path : `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`)
      : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80';

    const releaseYear = item.release_date ? parseInt(item.release_date.slice(0, 4)) : 2026;

    setNewMovie({
      title: item.title || item.original_title || '',
      originalTitle: item.original_title || item.title || '',
      description: item.overview || item.description || 'TMDB-dən idxal olunan film.',
      year: isNaN(releaseYear) ? 2026 : releaseYear,
      duration: item.duration || '2saat 10dəq',
      director: item.director || 'TMDB Import',
      genres: item.genres && item.genres.length > 0 ? item.genres : ['Elmi-Fantastika', 'Dram'],
      cast: Array.isArray(item.cast) ? item.cast.join(', ') : (item.cast || ''),
      poster: posterUrl,
      banner: bannerUrl,
      trailerUrl: item.trailerUrl || 'https://www.youtube.com/embed/zSWdZVtXT7E',
      videoUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      externalUrl: `https://www.themoviedb.org/movie/${item.id}`,
      isTrending: false,
      isTopRated: false,
      isNewRelease: true, // Automatik olaraq 'Yeni Filmlər' (New Release) kateqoriyası
      bookSourceId: ''
    });

    setShowAddMovieModal(true);
    setApiMessage({ 
      type: 'success', 
      text: `"${item.title || item.original_title}" məlumatları modal pəncərəyə yükləndi. Avtomatik 'Yeni Filmlər' kateqoriyasına təyin edildi.` 
    });
  };

  const handleImportTmdb = async (tmdbId: number, tmdbItem?: any) => {
    setImportingTmdbId(tmdbId);
    setApiMessage(null);
    try {
      const importedMovie = await apiImportTmdb(tmdbId);
      if (importedMovie) {
        const movieWithNewRelease = typeof importedMovie === 'object' && importedMovie !== null
          ? { ...importedMovie, isNewRelease: true }
          : {
              id: 'm_tmdb_' + tmdbId,
              title: tmdbItem?.title || tmdbItem?.original_title || 'TMDB Film',
              originalTitle: tmdbItem?.original_title || '',
              description: tmdbItem?.overview || 'TMDB-dən idxal olunub.',
              year: tmdbItem?.release_date ? parseInt(tmdbItem.release_date.slice(0, 4)) : 2026,
              duration: '2saat 15dəq',
              director: 'TMDB Import',
              rating: tmdbItem?.vote_average || 8.0,
              genres: ['Dram', 'Aksiya'],
              cast: [],
              poster: tmdbItem?.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
              banner: tmdbItem?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbItem.backdrop_path}` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
              isNewRelease: true,
              likes: 0
            };
        setMovies(prev => [movieWithNewRelease, ...prev]);
        setApiMessage({ type: 'success', text: 'Film TMDB-dən Uğurla İdxal Edildi və "Yeni Filmlər" (New Release) kateqoriyasına əlavə olundu!' });
      }
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err.message || 'TMDB-dən idxal zamanı xəta baş verdi' });
    } finally {
      setImportingTmdbId(null);
    }
  };

  const toggleTmdbSelection = (tmdbId: number) => {
    setSelectedTmdbIds((prev) =>
      prev.includes(tmdbId) ? prev.filter((id) => id !== tmdbId) : [...prev, tmdbId],
    );
  };

  const handleBulkImportTmdb = async () => {
    if (selectedTmdbIds.length === 0) {
      setApiMessage({ type: 'error', text: 'Ən azı bir film seçin.' });
      return;
    }
    setTmdbBulkProgress({ current: 0, total: selectedTmdbIds.length, running: true });
    setApiMessage(null);
    try {
      const result = await apiImportTmdbBatch(selectedTmdbIds);
      setTmdbBulkProgress({ current: result.total, total: result.total, running: false });
      setApiMessage({
        type: result.failed > 0 ? 'error' : 'success',
        text: `Toplu idxal: ${result.succeeded}/${result.total} uğurlu, ${result.failed} uğursuz.`,
      });
      setSelectedTmdbIds([]);
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err?.message || 'Toplu TMDB idxalı uğursuz oldu.' });
      setTmdbBulkProgress(null);
    }
  };

  // Google Books Handlers
  const handleSearchGoogleBooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleBooksQuery.trim()) return;
    setIsSearchingGoogleBooks(true);
    setApiMessage(null);
    try {
      const { items, warning } = await apiSearchGoogleBooks(googleBooksQuery);
      setGoogleBooksResults(items);
      if (warning) {
        setApiMessage({ type: 'error', text: warning });
      } else if (items.length === 0) {
        setApiMessage({ type: 'error', text: 'Axtarış üzrə nəticə tapılmadı.' });
      }
    } catch (err: any) {
      setGoogleBooksResults([]);
      setApiMessage({
        type: 'error',
        text: err.message || 'Google Books axtarışında xəta baş verdi. PDF panelindən əl ilə əlavə edə bilərsiniz.',
      });
    } finally {
      setIsSearchingGoogleBooks(false);
    }
  };

  const handleImportGoogleBook = async (googleBooksId: string) => {
    setImportingGoogleBooksId(googleBooksId);
    setApiMessage(null);
    try {
      const importedRaw = await apiImportGoogleBook(googleBooksId);
      const importedBook = mapBackendBook(importedRaw);
      if (importedBook.id && setBooks) {
        setBooks(prev => [importedBook, ...prev.filter(b => b.id !== importedBook.id)]);
        setApiMessage({ type: 'success', text: 'Kitab Google Books-dan uğurla idxal edildi!' });
      }
    } catch (err: any) {
      const raw = err?.message || '';
      const friendly = raw.includes('Google Books')
        ? 'Google Books hazırda əlçatan deyil. Kitab məlumatlarını və PDF-i yuxarıdakı formadan əl ilə əlavə edin.'
        : (raw || 'Google Books idxalında xəta baş verdi.');
      setApiMessage({ type: 'error', text: friendly });
    } finally {
      setImportingGoogleBooksId(null);
    }
  };

  const toggleGoogleBookSelection = (bookId: string) => {
    setSelectedGoogleBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId],
    );
  };

  const handleGoogleBooksQueueImport = async () => {
    if (selectedGoogleBookIds.length === 0) {
      setApiMessage({ type: 'error', text: 'Ən azı bir kitab seçin.' });
      return;
    }
    const queue = [...selectedGoogleBookIds];
    setGoogleBooksQueueProgress({
      current: 0,
      total: queue.length,
      running: true,
      succeeded: 0,
      failed: 0,
    });
    setApiMessage(null);

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < queue.length; i++) {
      const bookId = queue[i];
      try {
        const importedRaw = await apiImportGoogleBook(bookId);
        const importedBook = mapBackendBook(importedRaw);
        if (importedBook.id && setBooks) {
          setBooks((prev) => [importedBook, ...prev.filter((b) => b.id !== importedBook.id)]);
        }
        succeeded++;
      } catch {
        failed++;
      }
      setGoogleBooksQueueProgress({
        current: i + 1,
        total: queue.length,
        running: i + 1 < queue.length,
        succeeded,
        failed,
      });
    }

    setSelectedGoogleBookIds([]);
    setApiMessage({
      type: failed > 0 ? 'error' : 'success',
      text: `Google Books növbəsi: ${succeeded}/${queue.length} uğurlu, ${failed} uğursuz.`,
    });
  };

  // Handle Add / Edit Movie
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMovie.title || !newMovie.description) return;

    const payload = {
      title: newMovie.title,
      originalTitle: newMovie.originalTitle || undefined,
      description: newMovie.description,
      poster: newMovie.poster || undefined,
      banner: newMovie.banner || undefined,
      year: Number(newMovie.year) || undefined,
      duration: newMovie.duration || undefined,
      director: newMovie.director || undefined,
      trailerUrl: newMovie.trailerUrl || undefined,
      videoUrl: newMovie.videoUrl || undefined,
      externalUrl: newMovie.externalUrl || undefined,
      isTrending: newMovie.isTrending,
      isTopRated: newMovie.isTopRated,
      isNewRelease: newMovie.isNewRelease,
      genres: newMovie.genres,
      cast: newMovie.cast.split(',').map(c => c.trim()).filter(Boolean),
      bookSourceId: newMovie.bookSourceId || undefined
    };

    if (editingMovieId) {
      // UPDATE MOVIE (PUT /api/Movies/{id})
      try {
        await apiUpdateMovie(editingMovieId, payload);
        setApiMessage({ type: 'success', text: `"${newMovie.title}" filmi backend bazasında uğurla yeniləndi (PUT /api/Movies/${editingMovieId}).` });
      } catch (err: any) {
        console.log('Backend API update movie error:', err.message);
        setApiMessage({ type: 'success', text: `"${newMovie.title}" filmi lokal olaraq yeniləndi.` });
      }

      setMovies(prev => prev.map(m => {
        if (m.id === editingMovieId) {
          return {
            ...m,
            title: newMovie.title,
            originalTitle: newMovie.originalTitle || newMovie.title,
            description: newMovie.description,
            year: Number(newMovie.year),
            duration: newMovie.duration || m.duration,
            director: newMovie.director || m.director,
            genres: newMovie.genres,
            cast: newMovie.cast.split(',').map(c => c.trim()).filter(Boolean),
            poster: newMovie.poster,
            banner: newMovie.banner,
            trailerUrl: newMovie.trailerUrl || m.trailerUrl,
            videoUrl: newMovie.videoUrl || m.videoUrl,
            externalUrl: newMovie.externalUrl || (m as any).externalUrl,
            isTrending: newMovie.isTrending,
            isTopRated: newMovie.isTopRated,
            isNewRelease: newMovie.isNewRelease
          };
        }
        return m;
      }));
    } else {
      // CREATE MOVIE (POST /api/Movies)
      const newId = 'm_' + Date.now();
      const formattedMovie: Movie = {
        id: newId,
        title: newMovie.title,
        originalTitle: newMovie.originalTitle || newMovie.title,
        description: newMovie.description,
        year: Number(newMovie.year),
        duration: newMovie.duration || '2saat 15dəq',
        director: newMovie.director || 'Naməlum Rejissor',
        rating: 0,
        genres: newMovie.genres,
        cast: newMovie.cast.split(',').map(c => c.trim()).filter(Boolean),
        poster: newMovie.poster,
        banner: newMovie.banner,
        trailerUrl: newMovie.trailerUrl || 'https://www.youtube.com/embed/zSWdZVtXT7E',
        videoUrl: newMovie.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        likes: 0,
        reviews: [],
        isTrending: newMovie.isTrending,
        isTopRated: newMovie.isTopRated,
        isNewRelease: newMovie.isNewRelease
      };

      try {
        const res = await apiCreateMovie(payload);
        if (res && res.id) {
          formattedMovie.id = res.id;
        }
        setApiMessage({ type: 'success', text: `"${newMovie.title}" filmi backend bazasına əlavə olundu (POST /api/Movies).` });
      } catch (err: any) {
        console.log('Backend API offline or error, saving locally:', err.message);
      }

      setMovies(prev => [formattedMovie, ...prev]);
    }

    setShowAddMovieModal(false);
    setEditingMovieId(null);
    // Reset form
    setNewMovie({
      title: '',
      originalTitle: '',
      description: '',
      year: 2026,
      duration: '',
      director: '',
      genres: ['Elmi-Fantastika', 'Dram'],
      cast: '',
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: '',
      videoUrl: '',
      externalUrl: '',
      isTrending: false,
      isTopRated: false,
      isNewRelease: true,
      bookSourceId: ''
    });
  };

  // Handle Delete Movie
  const handleDeleteMovie = async (movieId: string) => {
    if (window.confirm('Bu filmi silmək istədiyinizdən əminsiniz?')) {
      try {
        await apiDeleteMovie(movieId);
      } catch (err: any) {
        console.log('Backend delete movie error:', err.message);
      }
      setMovies(prev => prev.filter(m => m.id !== movieId));
    }
  };

  // Handle Add / Edit Book
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || !setBooks) return;

    const payload = {
      title: newBook.title,
      author: newBook.author,
      description: newBook.description || undefined,
      cover: newBook.cover || undefined,
      language: newBook.language || undefined,
      year: Number(newBook.year) || undefined,
      pages: Number(newBook.pages) || undefined,
      downloadUrl: newBook.downloadUrl || undefined,
      pdfUrl: newBook.pdfUrl || undefined,
      pdfFile: newBook.selectedPdfFile,
      customContent: newBook.customContent || undefined,
      isTrending: newBook.isTrending,
      isTopRated: newBook.isTopRated,
      isNewRelease: newBook.isNewRelease,
      genres: newBook.genres
    };

    if (editingBookId) {
      // UPDATE BOOK (PUT /api/Books/{id})
      try {
        await apiUpdateBook(editingBookId, payload);
        setApiMessage({ type: 'success', text: `"${newBook.title}" kitabı backend bazasında uğurla yeniləndi (PUT /api/Books/${editingBookId}).` });
      } catch (err: any) {
        console.log('Backend API update book error:', err.message);
        setApiMessage({ type: 'success', text: `"${newBook.title}" kitabı lokal olaraq yeniləndi.` });
      }

      setBooks(prev => prev.map(b => {
        if (b.id === editingBookId) {
          return {
            ...b,
            title: newBook.title,
            author: newBook.author,
            description: newBook.description || b.description,
            cover: newBook.cover || b.cover,
            language: newBook.language,
            genres: newBook.genres,
            year: Number(newBook.year),
            pages: Number(newBook.pages),
            pdfUrl: newBook.pdfUrl || b.pdfUrl,
            customContent: newBook.customContent || b.customContent,
            isTrending: newBook.isTrending,
            isTopRated: newBook.isTopRated,
            isNewRelease: newBook.isNewRelease
          };
        }
        return b;
      }));
    } else {
      // CREATE BOOK (POST /api/Books)
      const newId = 'b_' + Date.now();
      const formattedBook: Book = {
        id: newId,
        title: newBook.title,
        author: newBook.author,
        description: newBook.description || 'Bu kitab üçün təsvir əlavə edilməyib.',
        cover: newBook.cover,
        rating: 0,
        language: newBook.language,
        genres: newBook.genres,
        year: Number(newBook.year),
        pages: Number(newBook.pages),
        pdfUrl: newBook.pdfUrl || undefined,
        customContent: newBook.customContent || undefined,
        reviews: [],
        likes: 0,
        isTrending: newBook.isTrending,
        isTopRated: newBook.isTopRated,
        isNewRelease: newBook.isNewRelease
      };

      try {
        const res = await apiCreateBook(payload);
        if (res && res.id) {
          formattedBook.id = res.id;
        }
        setApiMessage({ type: 'success', text: `"${newBook.title}" kitabı backend bazasına əlavə olundu (POST /api/Books).` });
      } catch (err: any) {
        console.log('Backend API create book error:', err.message);
      }

      setBooks(prev => [formattedBook, ...prev]);
    }

    setShowAddBookModal(false);
    setEditingBookId(null);
    // Reset form
    setNewBook({
      title: '',
      author: '',
      description: '',
      cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=80',
      language: 'az',
      genres: ['Dram', 'Klassik'],
      year: 2026,
      pages: 350,
      downloadUrl: '',
      pdfUrl: '',
      selectedPdfFile: undefined,
      customContent: '',
      isTrending: false,
      isTopRated: false,
      isNewRelease: true
    });
  };

  // Handle Delete Book
  const handleDeleteBook = async (bookId: string) => {
    if (!setBooks) return;
    if (window.confirm('Bu kitabı silmək istədiyinizdən əminsiniz?')) {
      try {
        await apiDeleteBook(bookId);
      } catch (err: any) {
        console.log('Backend delete book error:', err.message);
      }
      setBooks(prev => prev.filter(b => b.id !== bookId));
    }
  };

  // Handle User Role Change
  const toggleUserRole = async (userId: string) => {
    const targetUser = adminUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const isCurrentlyAdmin = targetUser.roles.some((role) => role.toLowerCase() === 'admin');
    const newRoles = isCurrentlyAdmin ? ['User'] : ['Admin'];

    try {
      await updateRolesMutation.mutateAsync({ userId, roles: newRoles });
      setApiMessage({
        type: 'success',
        text: `İstifadəçi rolu ${isCurrentlyAdmin ? 'User' : 'Admin'} olaraq yeniləndi.`,
      });
      refetchAdminUsers();
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err?.message || 'Rol yenilənmədi.' });
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bu istifadəçini silmək istədiyinizdən əminsiniz?')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
        setApiMessage({ type: 'success', text: 'İstifadəçi bazadan silindi.' });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        refetchAdminUsers();
      } catch (err: any) {
        setApiMessage({ type: 'error', text: err?.message || 'İstifadəçi silinmədi.' });
      }
    }
  };

  const toggleBanUser = async (userId: string) => {
    const targetUser = adminUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    if (!targetUser.isBanned && !window.confirm('Bu istifadəçini bloklamaq istəyirsiniz?')) {
      return;
    }

    try {
      await toggleBanMutation.mutateAsync({
        userId,
        banReason: targetUser.isBanned ? undefined : 'Admin tərəfindən bloklandı',
      });
      setApiMessage({
        type: 'success',
        text: targetUser.isBanned
          ? 'İstifadəçinin bloku ləğv edildi.'
          : 'İstifadəçi uğurla bloklandı.',
      });
      refetchAdminUsers();
    } catch (err: any) {
      setApiMessage({ type: 'error', text: err?.message || 'Bloklama statusu yenilənmədi.' });
    }
  };

  if (isCreatingLiveStreamPage) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Navigation Header / Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <button
              type="button"
              onClick={() => setIsCreatingLiveStreamPage(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition cursor-pointer mb-3 border border-zinc-700/60 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4 text-red-500" />
              Geri Qayıt
            </button>
            <h1 className="text-xl font-extrabold flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-red-500 animate-pulse" />
              Yeni Canlı Yayım Kanalı Yarat
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Göstərilən forma vasitəsilə backend-ə (<code className="text-cyan-400 font-mono">POST /api/livestreams/admin</code>) yeni HLS TV kanalı və ya canlı yayım əlavə edin.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
              Admin Səlahiyyəti
            </span>
          </div>
        </div>

        {/* Global API Message Notification Banner */}
        {apiMessage && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
            apiMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center gap-2.5 text-xs font-medium">
              {apiMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{apiMessage.text}</span>
            </div>
            <button 
              onClick={() => setApiMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Form & Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Container */}
          <div className={`lg:col-span-2 rounded-3xl border p-6 sm:p-8 ${
            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <form onSubmit={handleCreateLiveStream} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    ChannelKey (Unikal Açar) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLiveStream.channelKey}
                    onChange={e => setNewLiveStream(prev => ({ ...prev, channelKey: e.target.value }))}
                    placeholder="məs: cinema-plus və ya futbol-tv"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-cyan-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Sistemdə unikal id/açar kimi istifadə olunacaq.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Kategoriya (Sərbəst Mətn) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLiveStream.category}
                    onChange={e => setNewLiveStream(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Futbol, Movie, Book, Discussion və s."
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Futbol', 'Movie', 'Book', 'Discussion', 'Gaming', 'İdman', 'Musiqi'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewLiveStream(prev => ({ ...prev, category: cat }))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                          newLiveStream.category.toLowerCase() === cat.toLowerCase()
                            ? 'bg-red-600/30 text-red-300 border-red-500/50'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {cat === 'Futbol' && '⚽ '}
                        {cat === 'Movie' && '🎬 '}
                        {cat === 'Book' && '📚 '}
                        {cat === 'Discussion' && '💬 '}
                        {cat === 'Gaming' && '🎮 '}
                        {cat === 'İdman' && '🏆 '}
                        {cat === 'Musiqi' && '🎵 '}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Kanal Başlığı (Title) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLiveStream.title}
                  onChange={e => setNewLiveStream(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Məs. CineVerse Cinema Plus 4K Canlı"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Təsviri (Description)</label>
                <textarea
                  rows={3}
                  value={newLiveStream.description}
                  onChange={e => setNewLiveStream(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kanalın məzmunu, verilişləri və ya yayım proqramı haqqında ətraflı məlumat..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Yayım Linki (StreamUrl - HLS .m3u8) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLiveStream.streamUrl}
                  onChange={e => setNewLiveStream(prev => ({ ...prev, streamUrl: e.target.value }))}
                  placeholder="https://example.com/live/stream.m3u8"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Kiçik Şəkil URL (ThumbnailUrl)</label>
                <input
                  type="text"
                  value={newLiveStream.thumbnailUrl}
                  onChange={e => setNewLiveStream(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={isSubmittingLiveStream}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmittingLiveStream ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Kanal Yaradılır...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Kanalı Yarat (POST /api/livestreams/admin)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Card Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Tv className="w-4 h-4 text-red-500" />
              Kanal Kartı Önizləməsi
            </h3>

            <div className={`rounded-3xl border overflow-hidden p-4 ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 relative border border-zinc-800 mb-3">
                <img
                  src={newLiveStream.thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80'}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-900/80 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/30">
                    IsLive: false (Passiv)
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/80 text-white backdrop-blur-md">
                    {newLiveStream.category || 'Futbol'}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-sm text-white line-clamp-1 mb-1">
                {newLiveStream.title || 'Kanal Başlığı Mətni'}
              </h4>
              <p className="text-xs text-cyan-400 font-mono mb-2">
                Key: {newLiveStream.channelKey || 'cinema-plus'}
              </p>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {newLiveStream.description || 'Kanal təsviri burada görünəcək...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5 ${
        theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
      }`}>
        <div>
          <h1 className="text-xl font-bold tracking-tight font-display">İdarəetmə Paneli (Admin)</h1>
          <p className="text-xs text-zinc-500 mt-1">Platformanın statistikası, istifadəçi, film və kitabların idarə olunması.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(activeTab === 'stats' || activeTab === 'users') && (
            <button
              type="button"
              onClick={handleRefreshAdminData}
              disabled={isAdminDataLoading || (usersTabEnabled && isAdminUsersLoading)}
              className={`py-1.5 px-3 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
              } disabled:opacity-50`}
              title="Backend məlumatlarını yenilə"
            >
              <RefreshCw className={`w-3 h-3 ${isAdminDataLoading || (usersTabEnabled && isAdminUsersLoading) ? 'animate-spin' : ''}`} />
              Yenilə
            </button>
          )}
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition ${
              activeTab === 'stats'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            Statistikalar
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition ${
              activeTab === 'movies'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            Filmlərin İdarəsi
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition ${
              activeTab === 'users'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            İstifadəçilər
          </button>
          <button
            onClick={() => setActiveTab('books')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition ${
              activeTab === 'books'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            Kitabların İdarəsi
          </button>
          <button
            onClick={() => setActiveTab('livestreams')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'livestreams'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            Canlı Yayımlar
          </button>
          <button
            onClick={() => setActiveTab('bookVsMovies')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'bookVsMovies'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3 text-red-500" />
            Kitab vs Film
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            Analitika
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`py-1.5 px-3.5 rounded-full text-[10px] uppercase tracking-wider font-bold cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'moderation'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : theme === 'dark'
                ? 'bg-white/5 hover:bg-white/10 text-zinc-350 border border-white/5'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Moderasiya
          </button>
        </div>
      </div>

      {/* Global API Message Notification Banner */}
      {apiMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
          apiMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {apiMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{apiMessage.text}</span>
          </div>
          <button 
            onClick={() => setApiMessage(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview stats */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-fade-in">
          {hasAdminDataError && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Admin məlumatları yüklənə bilmədi
                  {statsError instanceof Error ? `: ${statsError.message}` : '.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefreshAdminData}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 font-bold transition"
              >
                Yenidən cəhd et
              </button>
            </div>
          )}

          {/* Statistics widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
              theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">İstifadəçilər</span>
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
              <p className="text-2xl font-black mt-3 font-mono tracking-tight">
                {isStatsLoading ? '...' : (stats?.totalUsers ?? 0)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-green-500 text-[10px] font-mono">
                <TrendingUp className="w-3 h-3" />
                <span>
                  {isStatsLoading
                    ? 'Yüklənir...'
                    : `${stats?.activeUsersCount ?? 0} aktiv • ${stats?.blockedUsersCount ?? 0} blok`}
                </span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border backdrop-blur-xl ${
              theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Ümumi Film</span>
                <Film className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-black mt-3 font-mono tracking-tight">
                {isStatsLoading ? '...' : (stats?.totalMovies ?? 0)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-green-500 text-[10px] font-mono">
                <TrendingUp className="w-3 h-3" />
                <span>
                  {isStatsLoading
                    ? 'Yüklənir...'
                    : `${stats?.activeRoomsCount ?? 0} aktiv otaq`}
                </span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border backdrop-blur-md ${
              theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Yazılan Rəylər</span>
                <MessageSquare className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold mt-3 font-mono">
                {isStatsLoading
                  ? '...'
                  : (stats?.totalReviews ?? 0) + (stats?.totalBookReviews ?? 0)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-green-500 text-[10px] font-semibold">
                <TrendingUp className="w-3 h-3" />
                <span>
                  {isStatsLoading
                    ? 'Yüklənir...'
                    : `${stats?.totalReviews ?? 0} film • ${stats?.totalBookReviews ?? 0} kitab`}
                </span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border backdrop-blur-md ${
              theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Ümumi Kitab</span>
                <BookOpen className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold mt-3 font-mono">
                {isStatsLoading ? '...' : (stats?.totalBooks ?? 0)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-green-500 text-[10px] font-semibold">
                <span>
                  {isStatsLoading
                    ? 'Yüklənir...'
                    : `${stats?.totalDiscussions ?? 0} müzakirə • ${stats?.premiumUsersCount ?? 0} premium`}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity & Activity Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-6 rounded-3xl border ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4.5 h-4.5 text-indigo-500" />
                <h3 className="font-semibold text-sm">Son Fəaliyyət</h3>
              </div>

              {isRecentActivityLoading ? (
                <div className="flex items-center justify-center py-16 text-zinc-500 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Son fəaliyyət yüklənir...
                </div>
              ) : isRecentActivityError ? (
                <div className="py-10 text-center text-xs text-red-400">
                  Son fəaliyyət yüklənə bilmədi.
                </div>
              ) : (
                <div className="space-y-5 max-h-72 overflow-y-auto pr-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Yeni İstifadəçilər</p>
                    {recentUsers.length === 0 ? (
                      <p className="text-xs text-zinc-500">Hələ qeydiyyat yoxdur.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                              theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                            }`}
                          >
                            <img
                              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                              alt={user.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">@{user.username}</p>
                              <p className="text-[10px] text-zinc-500">{formatAdminDate(user.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Son Rəylər</p>
                    {recentReviews.length === 0 ? (
                      <p className="text-xs text-zinc-500">Hələ rəy yoxdur.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentReviews.map((review) => (
                          <div
                            key={String(review.id)}
                            className={`p-2.5 rounded-xl border ${
                              theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold truncate">@{review.username}</p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-amber-500 font-bold">★ {review.rating}</span>
                                <span className="text-[9px] uppercase font-mono text-zinc-500">{review.type || 'Movie'}</span>
                              </div>
                            </div>
                            <p className="text-[11px] font-medium truncate">
                              {(review.targetTitle || review.movieTitle || '—')}
                            </p>
                            <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1">{review.content}</p>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <p className="text-[10px] text-zinc-500">{formatAdminDate(review.createdAt)}</p>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecentReview(review)}
                                disabled={moderationBusyId === String(review.id)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-600/15 text-red-400 hover:bg-red-600/25 transition cursor-pointer disabled:opacity-50"
                              >
                                {moderationBusyId === String(review.id) ? 'Silinir...' : 'Rəyi Sil'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Aktiv Watch Party Otaqları</p>
                    {isRoomsLoading ? (
                      <p className="text-xs text-zinc-500">Otaqlar yüklənir...</p>
                    ) : activeRooms.length === 0 ? (
                      <p className="text-xs text-zinc-500">Hazırda aktiv otaq yoxdur.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeRooms.map((room) => (
                          <div
                            key={String(room.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                              theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{room.name || room.title || 'Watch Party'}</p>
                              <p className="text-[10px] text-zinc-500 truncate">Host: {room.hostName || room.creator || '—'}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCloseActiveRoom(String(room.id))}
                              disabled={moderationBusyId === String(room.id)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-600/15 text-red-400 hover:bg-red-600/25 transition cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {moderationBusyId === String(room.id) ? 'Bağlanır...' : 'Otağı Bağla'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={`p-6 rounded-3xl border ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4.5 h-4.5 text-red-500" />
                <h3 className="font-semibold text-sm">Admin Fəaliyyət Jurnalı</h3>
              </div>

              {isActivityLogsLoading ? (
                <div className="flex items-center justify-center py-16 text-zinc-500 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Jurnal yüklənir...
                </div>
              ) : isActivityLogsError ? (
                <div className="py-10 text-center text-xs text-red-400">
                  Fəaliyyət jurnalı yüklənə bilmədi.
                </div>
              ) : logs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-10 text-center">Hələ admin fəaliyyəti qeydə alınmayıb.</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border ${
                        theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-red-400">@{log.adminUsername}</p>
                        <span className="text-[10px] text-zinc-500 shrink-0">{formatAdminDate(log.createdAt)}</span>
                      </div>
                      <p className="text-[11px] font-semibold">{log.action}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">{log.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Movie management tab */}
      {activeTab === 'movies' && (
        <div className="space-y-6">
          {showAddMovieModal ? (
            <div className="space-y-6 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setShowAddMovieModal(false);
                  setEditingMovieId(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-zinc-700/50 shadow-md"
              >
                <ArrowLeft className="w-4 h-4 text-red-500" />
                <span>Geri Qayıt (Filmlər Siyahısına)</span>
              </button>

              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/20">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Film className="w-5 h-5 text-red-500" />
                      <span>{editingMovieId ? 'Filmi Redaktə Et (PUT /api/Movies/{id})' : 'Yeni Film Əlavə Et (POST /api/Movies)'}</span>
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Film məlumatlarını doldurun, janrları, tizer/video linklərini və kateqoriyaları təyin edin.</p>
                  </div>
                  {editingMovieId && (
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      ID: {editingMovieId}
                    </span>
                  )}
                </div>

                <form onSubmit={handleAddMovie} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Film Adı (Azərbaycan dilində)</label>
                      <input
                        type="text"
                        required
                        value={newMovie.title}
                        onChange={e => setNewMovie(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Məs. Başlanğıc"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Orijinal Adı</label>
                      <input
                        type="text"
                        value={newMovie.originalTitle}
                        onChange={e => setNewMovie(prev => ({ ...prev, originalTitle: e.target.value }))}
                        placeholder="Məs. Inception"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Təsviri (Məzmun)</label>
                    <textarea
                      required
                      rows={3}
                      value={newMovie.description}
                      onChange={e => setNewMovie(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Filmin qısa süjet xətti..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">İl</label>
                      <input
                        type="number"
                        required
                        value={newMovie.year}
                        onChange={e => setNewMovie(prev => ({ ...prev, year: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Müddət</label>
                      <input
                        type="text"
                        value={newMovie.duration}
                        onChange={e => setNewMovie(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="Məs. 2saat 15dəq"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Rejissor</label>
                      <input
                        type="text"
                        value={newMovie.director}
                        onChange={e => setNewMovie(prev => ({ ...prev, director: e.target.value }))}
                        placeholder="Christopher Nolan"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Mənbə Kitab (Əgər bu film kitabdan adaptasiya olunubsa)</label>
                      <select
                        value={newMovie.bookSourceId}
                        onChange={e => setNewMovie(prev => ({ ...prev, bookSourceId: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Yoxdur / Əlaqəsiz</option>
                        {books.map(b => (
                          <option key={b.id} value={b.id}>{b.title} ({b.author})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Janrlar</label>
                    
                    {/* Selected genre tags */}
                    {newMovie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                        {newMovie.genres.map((genre) => (
                          <span key={genre} className="inline-flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                            {genre}
                            <button
                              type="button"
                              onClick={() => setNewMovie(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }))}
                              className="text-red-400 hover:text-white cursor-pointer ml-1 text-xs"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Preset buttons */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {PREDEFINED_GENRES.map((g) => {
                        const isSelected = newMovie.genres.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setNewMovie(prev => ({
                                ...prev,
                                genres: isSelected
                                  ? prev.genres.filter(item => item !== g)
                                  : [...prev.genres, g]
                              }));
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                              isSelected
                                ? 'bg-red-600 text-white border-red-500 font-semibold shadow-xs'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            {isSelected ? `✓ ${g}` : `+ ${g}`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Manual input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={movieGenreInput}
                        onChange={e => setMovieGenreInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (movieGenreInput.trim() && !newMovie.genres.includes(movieGenreInput.trim())) {
                              setNewMovie(prev => ({ ...prev, genres: [...prev.genres, movieGenreInput.trim()] }));
                              setMovieGenreInput('');
                            }
                          }
                        }}
                        placeholder="Başqa janr yazın VƏ YA yuxarıdakılardan seçin..."
                        className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (movieGenreInput.trim() && !newMovie.genres.includes(movieGenreInput.trim())) {
                            setNewMovie(prev => ({ ...prev, genres: [...prev.genres, movieGenreInput.trim()] }));
                            setMovieGenreInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl transition cursor-pointer font-medium"
                      >
                        + Əlavə et
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Aktyor Heyəti (Vergüllə ayırın)</label>
                    <input
                      type="text"
                      value={newMovie.cast}
                      onChange={e => setNewMovie(prev => ({ ...prev, cast: e.target.value }))}
                      placeholder="Leonardo DiCaprio, Tom Hardy"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Poster URL (Afişa)</label>
                      <input
                        type="text"
                        value={newMovie.poster}
                        onChange={e => setNewMovie(prev => ({ ...prev, poster: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Banner URL (Arxa Plan)</label>
                      <input
                        type="text"
                        value={newMovie.banner}
                        onChange={e => setNewMovie(prev => ({ ...prev, banner: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Trailer Embed URL</label>
                      <input
                        type="text"
                        value={newMovie.trailerUrl}
                        onChange={e => setNewMovie(prev => ({ ...prev, trailerUrl: e.target.value }))}
                        placeholder="https://www.youtube.com/embed/..."
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Tam Film Video URL</label>
                      <input
                        type="text"
                        value={newMovie.videoUrl}
                        onChange={e => setNewMovie(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Xarici Link (IMDB / TMDB)</label>
                      <input
                        type="text"
                        value={newMovie.externalUrl}
                        onChange={e => setNewMovie(prev => ({ ...prev, externalUrl: e.target.value }))}
                        placeholder="https://www.themoviedb.org/movie/..."
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Category Flags */}
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                    <span className="block text-xs font-bold text-zinc-400">Kateqoriya və Status Təyini:</span>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMovie.isNewRelease}
                          onChange={e => setNewMovie(prev => ({ ...prev, isNewRelease: e.target.checked }))}
                          className="rounded text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-700"
                        />
                        <span className="font-semibold text-emerald-400">✨ Yeni Filmlər (New Release)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMovie.isTrending}
                          onChange={e => setNewMovie(prev => ({ ...prev, isTrending: e.target.checked }))}
                          className="rounded text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-700"
                        />
                        <span className="font-semibold text-amber-400">⚡ Trenddə olanlar (Trending)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMovie.isTopRated}
                          onChange={e => setNewMovie(prev => ({ ...prev, isTopRated: e.target.checked }))}
                          className="rounded text-red-600 focus:ring-red-500 bg-zinc-900 border-zinc-700"
                        />
                        <span className="font-semibold text-indigo-400">⭐ Top Reytinqli (Top Rated)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMovieModal(false);
                        setEditingMovieId(null);
                      }}
                      className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Ləğv Et
                    </button>
                    <button
                      type="submit"
                      className={`py-2.5 px-5 rounded-xl text-xs font-semibold text-white transition cursor-pointer ${
                        editingMovieId ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-red-600 hover:bg-red-500'
                      }`}
                    >
                      {editingMovieId ? 'Yeniləmələri Yadda Saxla (PUT)' : 'Filmi Əlavə Et (POST)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* TMDB Auto Import Section */}
              <div className={`p-5 rounded-2xl border ${
                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-cyan-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">TMDB Avto-İdxal (Film Axtar və Baza Əlavə Et)</h3>
                </div>
                <form onSubmit={handleSearchTmdb} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      value={tmdbQuery}
                      onChange={e => setTmdbQuery(e.target.value)}
                      placeholder="TMDB-dən film axtar (məs. Inception, Avatar...)"
                      className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none transition ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingTmdb}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSearchingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    TMDB Axtar
                  </button>
                </form>

                {Array.isArray(tmdbResults) && tmdbResults.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTmdbIds(tmdbResults.map((item: any) => item.id))}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      Hamısını seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTmdbIds([])}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      Seçimi təmizlə
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBulkImportTmdb()}
                      disabled={selectedTmdbIds.length === 0 || tmdbBulkProgress?.running}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Seçilənləri idxal et ({selectedTmdbIds.length})
                    </button>
                    {tmdbBulkProgress && (
                      <div className="flex-1 min-w-[180px]">
                        <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                          <div
                            className="h-full bg-red-500 transition-all"
                            style={{ width: `${(tmdbBulkProgress.current / Math.max(tmdbBulkProgress.total, 1)) * 100}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                          {tmdbBulkProgress.running
                            ? `Idxal edilir... ${tmdbBulkProgress.current}/${tmdbBulkProgress.total}`
                            : `Tamamlandı ${tmdbBulkProgress.current}/${tmdbBulkProgress.total}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TMDB Results Grid */}
                {Array.isArray(tmdbResults) && tmdbResults.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {tmdbResults.map((item: any) => (
                      <div key={item.id} className={`p-3 rounded-xl border flex gap-3 items-center ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
                      } ${selectedTmdbIds.includes(item.id) ? 'ring-1 ring-red-500/50' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedTmdbIds.includes(item.id)}
                          onChange={() => toggleTmdbSelection(item.id)}
                          className="w-4 h-4 accent-red-600 shrink-0 cursor-pointer"
                          aria-label={`${item.title} seç`}
                        />
                        {item.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title} className="w-10 h-14 object-cover rounded shadow" />
                        ) : (
                          <div className="w-10 h-14 bg-zinc-800 rounded flex items-center justify-center text-[10px] text-zinc-500">Afişa Yoxdur</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate">{item.title || item.original_title}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{item.release_date?.slice(0, 4) || 'İl məlum deyil'}</p>
                          <p className="text-[10px] text-amber-500 font-bold mt-0.5">★ {item.vote_average?.toFixed(1) || '0.0'}</p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => handleLoadTmdbToModal(item)}
                            className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition text-[10px] font-bold cursor-pointer flex items-center gap-1"
                            title="Yeni Film Səhifəsinə Yüklə"
                          >
                            <Edit3 className="w-3 h-3" /> Yüklə
                          </button>
                          <button
                            onClick={() => handleImportTmdb(item.id, item)}
                            disabled={importingTmdbId === item.id}
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition text-[10px] font-bold cursor-pointer flex items-center gap-1"
                            title="İdxal Et Və Baza Əlavə Et"
                          >
                            {importingTmdbId === item.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} İdxal Et
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Filmlərin Siyahısı</h3>
                <button
                  onClick={handleOpenCreateMovieModal}
                  id="btn-add-movie-modal"
                  className="flex items-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Film Əlavə Et
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-800/10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'} text-xs font-semibold uppercase`}>
                      <th className="p-4">Afişa & Başlıq</th>
                      <th className="p-4">Rejissor</th>
                      <th className="p-4">İl</th>
                      <th className="p-4">Janrlar</th>
                      <th className="p-4">Reytinq</th>
                      <th className="p-4 text-right">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/10 text-sm">
                    {movies.map(m => (
                      <tr key={m.id} className="hover:bg-zinc-800/5 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img src={m.poster} alt={m.title} className="w-10 h-14 object-cover rounded-md" />
                          <div>
                            <p className="font-semibold">{m.title}</p>
                            <p className="text-[11px] text-zinc-500 italic">{m.originalTitle}</p>
                          </div>
                        </td>
                        <td className="p-4">{m.director}</td>
                        <td className="p-4 font-mono">{m.year}</td>
                        <td className="p-4">
                          <div className="flex gap-1 flex-wrap">
                            {m.genres.slice(0, 2).map((g, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-zinc-800/10 text-[10px] rounded font-medium">{g}</span>
                            ))}
                            {m.genres.length > 2 && <span className="text-[10px] text-zinc-500">+{m.genres.length - 2}</span>}
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-500">★ {m.rating}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditMovieClick(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition cursor-pointer flex items-center gap-1 font-semibold text-xs"
                              title="Redaktə Et (PUT /api/Movies/{id})"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Redaktə Et
                            </button>
                            <button
                              onClick={() => handleDeleteMovie(m.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* User management tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Qeydiyyatlı İstifadəçilər</h3>

          {isAdminUsersError && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              theme === 'dark' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  İstifadəçilər yüklənə bilmədi
                  {adminUsersError instanceof Error ? `: ${adminUsersError.message}` : '.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => refetchAdminUsers()}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 font-bold transition"
              >
                Yenidən cəhd et
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-zinc-800/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'} text-xs font-semibold uppercase`}>
                  <th className="p-4">İstifadəçi</th>
                  <th className="p-4">E-poçt</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Rəylər</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/10 text-sm">
                {isAdminUsersLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                      İstifadəçilər yüklənir...
                    </td>
                  </tr>
                ) : adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 text-xs">
                      İstifadəçi tapılmadı.
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((u) => {
                    const roleLabel = getAdminUserRoleLabel(u.roles);
                    return (
                      <tr key={u.id} className="hover:bg-zinc-800/5 transition">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                            alt={u.username}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold">{u.username}</p>
                            <p className="text-[11px] text-zinc-500">@{u.username}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs">{u.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            roleLabel === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {roleLabel}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{u.reviewCount}</td>
                        <td className="p-4">
                          {u.isBanned ? (
                            <span className="flex items-center gap-1 text-red-500 text-xs font-semibold">
                              <Ban className="w-3.5 h-3.5" /> Bloklanıb
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> Aktiv
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleUserRole(u.id)}
                              disabled={updateRolesMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500 transition text-xs font-medium cursor-pointer disabled:opacity-50"
                              title="Rolunu Dəyiş"
                            >
                              Rolu Dəyiş
                            </button>
                            <button
                              onClick={() => toggleBanUser(u.id)}
                              disabled={toggleBanMutation.isPending}
                              className={`p-1.5 rounded-lg transition text-xs font-medium cursor-pointer disabled:opacity-50 ${
                                u.isBanned ? 'hover:bg-green-500/10 text-green-500' : 'hover:bg-amber-500/10 text-amber-500'
                              }`}
                              title={u.isBanned ? 'Blokdan çıxart' : 'Blokla'}
                            >
                              {u.isBanned ? 'Blokdan Çıxart' : 'Blokla'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={deleteUserMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition cursor-pointer disabled:opacity-50"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book management tab */}
      {activeTab === 'books' && (
        <div className="space-y-6 animate-fade-in">
          {showAddBookModal ? (
            <div className="space-y-6 animate-fade-in">
              <button
                type="button"
                onClick={() => {
                  setShowAddBookModal(false);
                  setEditingBookId(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-zinc-700/50 shadow-md"
              >
                <ArrowLeft className="w-4 h-4 text-red-500" />
                <span>Geri Qayıt (Kitablar Siyahısına)</span>
              </button>

              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/20">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-red-500" />
                      <span>{editingBookId ? 'Kitabı Redaktə Et (PUT /api/Books/{id})' : 'Yeni Kitab Məlumatları (POST /api/Books)'}</span>
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">Kitab məlumatlarını, müəllifi, janrları, PDF/Elektron versiyanı və təsviri daxil edin.</p>
                  </div>
                  {editingBookId && (
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      ID: {editingBookId}
                    </span>
                  )}
                </div>

                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Kitab Adı</label>
                      <input
                        type="text"
                        required
                        value={newBook.title}
                        onChange={e => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Məs. Səfillər"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Müəllif</label>
                      <input
                        type="text"
                        required
                        value={newBook.author}
                        onChange={e => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Məs. Viktor Hüqo"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Təsviri (Məzmun)</label>
                    <textarea
                      required
                      rows={3}
                      value={newBook.description}
                      onChange={e => setNewBook(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Kitabın qısa məzmunu və mövzusu..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Dil</label>
                      <select
                        value={newBook.language}
                        onChange={e => setNewBook(prev => ({ ...prev, language: e.target.value as 'az' | 'en' }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      >
                        <option value="az">Azərbaycanca</option>
                        <option value="en">İngiliscə</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Səhifə Sayı</label>
                      <input
                        type="number"
                        required
                        value={newBook.pages}
                        onChange={e => setNewBook(prev => ({ ...prev, pages: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Nəşr İli</label>
                      <input
                        type="number"
                        required
                        value={newBook.year}
                        onChange={e => setNewBook(prev => ({ ...prev, year: Number(e.target.value) }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Janrlar</label>
                    
                    {/* Selected genre tags */}
                    {newBook.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                        {newBook.genres.map((genre) => (
                          <span key={genre} className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-medium">
                            {genre}
                            <button
                              type="button"
                              onClick={() => setNewBook(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }))}
                              className="text-amber-400 hover:text-white cursor-pointer ml-1 text-xs"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Preset buttons */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {PREDEFINED_GENRES.map((g) => {
                        const isSelected = newBook.genres.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => {
                              setNewBook(prev => ({
                                ...prev,
                                genres: isSelected
                                  ? prev.genres.filter(item => item !== g)
                                  : [...prev.genres, g]
                              }));
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-500 font-semibold shadow-xs'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            {isSelected ? `✓ ${g}` : `+ ${g}`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Manual input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bookGenreInput}
                        onChange={e => setBookGenreInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (bookGenreInput.trim() && !newBook.genres.includes(bookGenreInput.trim())) {
                              setNewBook(prev => ({ ...prev, genres: [...prev.genres, bookGenreInput.trim()] }));
                              setBookGenreInput('');
                            }
                          }
                        }}
                        placeholder="Başqa janr yazın VƏ YA yuxarıdakılardan seçin..."
                        className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bookGenreInput.trim() && !newBook.genres.includes(bookGenreInput.trim())) {
                            setNewBook(prev => ({ ...prev, genres: [...prev.genres, bookGenreInput.trim()] }));
                            setBookGenreInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl transition cursor-pointer font-medium"
                      >
                        + Əlavə et
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Üz Qabığı Şəkli URL</label>
                    <input
                      type="text"
                      required
                      value={newBook.cover}
                      onChange={e => setNewBook(prev => ({ ...prev, cover: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">PDF / E-kitab URL (İstəyə bağlı)</label>
                      <input
                        type="text"
                        value={newBook.pdfUrl}
                        onChange={e => setNewBook(prev => ({ ...prev, pdfUrl: e.target.value }))}
                        placeholder="Məs. https://arxiv.org/pdf/xxxx.pdf və ya digər link"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">Daxil etsəniz, E-reader bunu interaktiv PDF olaraq göstərəcək.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Kompyuterdən PDF Faylı Yüklə (FormData POST /api/Books)</label>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewBook(prev => ({
                              ...prev,
                              selectedPdfFile: file,
                              pdfUrl: prev.pdfUrl || URL.createObjectURL(file)
                            }));
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-red-600 file:text-white"
                      />
                      {newBook.selectedPdfFile && (
                        <p className="text-[10px] text-emerald-400 mt-1 font-mono font-bold">
                          ✓ Fayl seçildi: {newBook.selectedPdfFile.name} ({(newBook.selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddBookModal(false);
                        setEditingBookId(null);
                      }}
                      className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Ləğv Et
                    </button>
                    <button
                      type="submit"
                      className={`py-2.5 px-5 rounded-xl text-xs font-semibold text-white transition cursor-pointer ${
                        editingBookId ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-red-600 hover:bg-red-500'
                      }`}
                    >
                      {editingBookId ? 'Yeniləmələri Yadda Saxla (PUT)' : 'Kitabı Əlavə Et (POST)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* DEDICATED PDF BOOK UPLOADER & MANAGEMENT SECTION */}
              <div className={`p-6 rounded-3xl border shadow-xl transition ${
                theme === 'dark' ? 'bg-gradient-to-br from-zinc-900 via-zinc-900 to-red-950/30 border-red-500/25' : 'bg-gradient-to-br from-white via-white to-red-50/60 border-red-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600/15 rounded-2xl border border-red-500/30 text-red-500 shadow-md">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
                        PDF Sənədləri & E-Kitab Yükləmə Paneli
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-[10px] font-mono text-red-400 border border-red-500/20">Xüsusi Rejim</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Kitabın adını, müəllifini və PDF faylını kompüterdən yükləyin və ya PDF linkini daxil edərək kitabxanaya dərhal əlavə edin.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleQuickPdfAdd} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-red-400" /> Kitabın Adı *
                      </label>
                      <input
                        type="text"
                        required
                        value={pdfForm.title}
                        onChange={e => setPdfForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Məs. Səfillər, Dyun, 1984"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-red-500' : 'bg-white border-zinc-200 text-zinc-900 focus:border-red-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-red-400" /> Müəllif *
                      </label>
                      <input
                        type="text"
                        required
                        value={pdfForm.author}
                        onChange={e => setPdfForm(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Məs. Viktor Hüqo, Frank Herbert"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-red-500' : 'bg-white border-zinc-200 text-zinc-900 focus:border-red-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-red-400" /> Mütaliə Dili
                      </label>
                      <select
                        value={pdfForm.language}
                        onChange={e => setPdfForm(prev => ({ ...prev, language: e.target.value as 'az' | 'en' }))}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      >
                        <option value="az">🇦🇿 Azərbaycan Dili</option>
                        <option value="en">🇬🇧 İngilis Dili</option>
                      </select>
                    </div>
                  </div>

                  {/* PDF FILE UPLOAD / LINK BOX */}
                  <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4" /> PDF Faylı Və ya Şəbəkə Linki *
                      </span>
                      {pdfForm.pdfFileName ? (
                        <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Yükləndi: {pdfForm.pdfFileName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">
                          Faylı seçin və ya aşağıdakı xanaya PDF linkini yapışdırın
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Local File Picker */}
                      <div className="relative border-2 border-dashed border-zinc-800 hover:border-red-500/60 rounded-2xl p-4 text-center transition cursor-pointer bg-zinc-900/60 group">
                        <input
                          type="file"
                          accept="application/pdf"
                          disabled={isUploadingPdf}
                          onChange={handlePdfFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-col items-center justify-center gap-1 text-zinc-400 group-hover:text-white transition">
                          {isUploadingPdf ? (
                            <>
                              <RefreshCw className="w-7 h-7 text-red-500 animate-spin" />
                              <span className="text-xs font-bold text-red-400">Backend Serverə Yüklənir...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-7 h-7 text-red-500 group-hover:scale-110 transition duration-200" />
                              <span className="text-xs font-bold text-zinc-200">Kompüterdən PDF Faylı Seçin</span>
                              <span className="text-[10px] text-zinc-500">(.pdf - max 50MB)</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* PDF Direct URL Input */}
                      <div className="flex flex-col justify-center gap-2">
                        <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                          <Link className="w-3.5 h-3.5 text-red-400" /> VƏ YA PDF Linkini Daxil Edin (Google Drive, Arxiv, Direct URL)
                        </label>
                        <input
                          type="text"
                          value={pdfForm.pdfUrl}
                          onChange={e => setPdfForm(prev => ({ ...prev, pdfUrl: e.target.value, pdfFileName: '' }))}
                          placeholder="https://drive.google.com/file/d/... və ya https://arxiv.org/pdf/..."
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none transition ${
                            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white focus:border-red-500' : 'bg-white border-zinc-200 text-zinc-900'
                          }`}
                        />
                        <p className="text-[10px] text-zinc-500">
                          💡 Google Drive linkləri avtomatik olaraq e-reader interaktiv rejimində göstəriləcək.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Optional Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Üz Qabığı Şəkli URL (İstəyə bağlı)</label>
                      <input
                        type="text"
                        value={pdfForm.cover}
                        onChange={e => setPdfForm(prev => ({ ...prev, cover: e.target.value }))}
                        placeholder="https://..."
                        className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Təxmini Səhifə Sayı</label>
                      <input
                        type="number"
                        value={pdfForm.pages}
                        onChange={e => setPdfForm(prev => ({ ...prev, pages: Number(e.target.value) }))}
                        className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">Nəşr İli</label>
                      <input
                        type="number"
                        value={pdfForm.year}
                        onChange={e => setPdfForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                        className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="submit"
                      className="py-3 px-6 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-red-600/25 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <FilePlus className="w-4 h-4" /> PDF Kitabını Kitabxanaya Əlavə Et
                    </button>
                  </div>
                </form>
              </div>

              {/* Google Books Auto Import Section */}
              <div className={`p-5 rounded-2xl border ${
                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Google Books Avto-İdxal (Kitab Axtar və Baza Əlavə Et)</h3>
                </div>
                <form onSubmit={handleSearchGoogleBooks} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                    <input
                      type="text"
                      value={googleBooksQuery}
                      onChange={e => setGoogleBooksQuery(e.target.value)}
                      placeholder="Google Books-dan kitab axtar (məs. Les Miserables, Dostoevsky...)"
                      className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none transition ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearchingGoogleBooks}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSearchingGoogleBooks ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Google Books Axtar
                  </button>
                </form>

                {Array.isArray(googleBooksResults) && googleBooksResults.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const ids = googleBooksResults.map((item: any) =>
                          item.id ?? item.googleBooksId ?? item.GoogleBooksId,
                        ).filter(Boolean);
                        setSelectedGoogleBookIds(ids);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      Hamısını seç
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGoogleBookIds([])}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      Seçimi təmizlə
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleGoogleBooksQueueImport()}
                      disabled={selectedGoogleBookIds.length === 0 || googleBooksQueueProgress?.running}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Növbəyə əlavə et ({selectedGoogleBookIds.length})
                    </button>
                    {googleBooksQueueProgress && (
                      <div className="flex-1 min-w-[200px]">
                        <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                          <div
                            className="h-full bg-indigo-500 transition-all"
                            style={{
                              width: `${(googleBooksQueueProgress.current / Math.max(googleBooksQueueProgress.total, 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                          {googleBooksQueueProgress.running
                            ? `Növbə: ${googleBooksQueueProgress.current}/${googleBooksQueueProgress.total} · ✓${googleBooksQueueProgress.succeeded} ✗${googleBooksQueueProgress.failed}`
                            : `Bitdi: ${googleBooksQueueProgress.succeeded} uğurlu, ${googleBooksQueueProgress.failed} uğursuz`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Books Results Grid */}
                {Array.isArray(googleBooksResults) && googleBooksResults.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {googleBooksResults.map((item: any) => {
                      const info = item.volumeInfo || item;
                      const bookId = item.id ?? item.googleBooksId ?? item.GoogleBooksId;
                      return (
                        <div key={bookId} className={`p-3 rounded-xl border flex gap-3 items-center ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'
                        } ${selectedGoogleBookIds.includes(bookId) ? 'ring-1 ring-indigo-500/50' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedGoogleBookIds.includes(bookId)}
                            onChange={() => toggleGoogleBookSelection(bookId)}
                            className="w-4 h-4 accent-indigo-600 shrink-0 cursor-pointer"
                            aria-label={`${info.title} seç`}
                          />
                          {info.imageLinks?.thumbnail ? (
                            <img src={info.imageLinks.thumbnail} alt={info.title} className="w-10 h-14 object-cover rounded shadow" />
                          ) : (
                            <div className="w-10 h-14 bg-zinc-800 rounded flex items-center justify-center text-[10px] text-zinc-500">Üz Yoxdur</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{info.title}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{info.authors?.join(', ') || 'Müəllif məlum deyil'}</p>
                            <p className="text-[10px] text-indigo-400 font-bold mt-0.5">{info.pageCount ? `${info.pageCount} səh.` : ''}</p>
                          </div>
                          <button
                            onClick={() => handleImportGoogleBook(bookId)}
                            disabled={importingGoogleBooksId === bookId}
                            className="p-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                            title="İdxal Et"
                          >
                            {importingGoogleBooksId === bookId ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Mövcud Kitablar Siyahısı</h3>
                  <p className="text-xs text-zinc-500 mt-1">Platformadakı kitabların siyahısı, adaptasiyaları və idarəçiliyi.</p>
                </div>
                <button
                  onClick={handleOpenCreateBookModal}
                  className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/15 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" /> Yeni Kitab Əlavə Et
                </button>
              </div>

              <div className={`overflow-x-auto rounded-3xl border ${
                theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className={`border-b text-zinc-400 font-semibold uppercase tracking-wider ${
                      theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'
                    }`}>
                      <th className="p-4">Kitab</th>
                      <th className="p-4">Müəllif</th>
                      <th className="p-4">Dil</th>
                      <th className="p-4">Səhifə / İl</th>
                      <th className="p-4">Janrlar</th>
                      <th className="p-4">Reytinq</th>
                      <th className="p-4">Adaptasiya Filmi</th>
                      <th className="p-4 text-right">Əməliyyatlar</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
                    {books.map(b => {
                      const linkedMovie = movies.find(m => m.id === b.movieAdaptationId);
                      return (
                        <tr key={b.id} className="hover:bg-zinc-800/10 transition duration-150">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={b.cover} alt={b.title} className="w-8 h-12 object-cover rounded shadow-md shrink-0 border border-zinc-800/10" />
                              <div>
                                <span className="font-extrabold text-sm block">{b.title}</span>
                                {b.pdfUrl ? (
                                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/25 text-[10px] font-mono font-bold">
                                    <FileText className="w-3 h-3" /> PDF Sənədi Var
                                  </span>
                                ) : b.downloadUrl ? (
                                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] font-mono font-bold">
                                    Google Ön Baxış
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 text-[10px] font-mono">
                                    Mətn Rejimi
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-300 font-medium">{b.author}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              b.language === 'az' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {b.language === 'az' ? 'AZE' : 'ENG'}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-400">{b.pages} səh. / {b.year}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {b.genres.map((g, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-medium">{g}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-amber-500">★ {b.rating}</td>
                          <td className="p-4">
                            {linkedMovie ? (
                              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {linkedMovie.title}
                              </div>
                            ) : (
                              <span className="text-zinc-500 italic">Yoxdur</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditBookClick(b)}
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 transition cursor-pointer flex items-center gap-1 font-semibold text-xs"
                                title="Redaktə Et (PUT /api/Books/{id})"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Redaktə Et
                              </button>
                              <button
                                onClick={() => handleDeleteBook(b.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Live Streams management tab */}
      {activeTab === 'livestreams' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                Canlı Yayım Kanalları və Yayımların İdarəsi
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                TV kanalları, premyera xüsusi yayımları və idman kanallarının idarə olunması. (GET / POST / PUT /api/livestreams)
              </p>
            </div>
            <button
              onClick={() => setIsCreatingLiveStreamPage(true)}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Yeni Canlı Yayım Kanalı Əlavə Et
            </button>
          </div>

          <div className={`overflow-x-auto rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className={`border-b text-zinc-400 font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'
                }`}>
                  <th className="p-4">Kanal / Yayım</th>
                  <th className="p-4">Açar (ChannelKey)</th>
                  <th className="p-4">Kateqoriya</th>
                  <th className="p-4">Yayım Mənbəyi (StreamUrl)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
                {liveStreams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                      Hələ heç bir canlı yayım kanalı əlavə olunmayıb.
                    </td>
                  </tr>
                ) : (
                  liveStreams.map((stream) => (
                    <tr key={stream.id || stream.channelKey} className="hover:bg-zinc-800/10 transition duration-150">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={stream.thumbnailUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80'}
                            alt={stream.title}
                            className="w-12 h-8 object-cover rounded-md border border-zinc-800 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-sm block line-clamp-1">{stream.title}</span>
                            <span className="text-[10px] text-zinc-400 line-clamp-1">{stream.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-cyan-400">
                        {stream.channelKey}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          {stream.category || 'Ümumi'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-zinc-400 max-w-[200px] truncate" title={stream.streamUrl}>
                        {stream.streamUrl}
                      </td>
                      <td className="p-4">
                        {stream.isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-600/20 text-red-500 border border-red-500/40 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            CANLI YAYIMDA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <span className="w-2 h-2 rounded-full bg-zinc-500" />
                            PASSİV
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditLiveStream(stream)}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700'
                                : 'bg-zinc-100 hover:bg-zinc-200 text-cyan-600 border border-zinc-200'
                            }`}
                            title="Redaktə et"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLiveStream(stream.id || stream.channelKey)}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-zinc-800 hover:bg-red-600/80 text-red-400 hover:text-white border border-zinc-700'
                                : 'bg-zinc-100 hover:bg-red-100 text-red-600 border border-zinc-200'
                            }`}
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleLiveStream(stream.id || stream.channelKey, !!stream.isLive)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                              stream.isLive
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {stream.isLive ? 'Dayandır' : 'Başlat'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {editingLiveStreamId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                <div className={`flex items-center justify-between p-5 border-b ${
                  theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'
                }`}>
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-cyan-400" />
                      Canlı Yayım Kanalını Redaktə Et
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">PUT /api/livestreams/admin/{editingLiveStreamId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingLiveStreamId(null)}
                    className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateLiveStream} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">ChannelKey <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={editLiveStream.channelKey}
                        onChange={e => setEditLiveStream(prev => ({ ...prev, channelKey: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-cyan-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">Kateqoriya <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={editLiveStream.category}
                        onChange={e => setEditLiveStream(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Başlıq <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={editLiveStream.title}
                      onChange={e => setEditLiveStream(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Təsvir</label>
                    <textarea
                      rows={3}
                      value={editLiveStream.description}
                      onChange={e => setEditLiveStream(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">StreamUrl <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={editLiveStream.streamUrl}
                      onChange={e => setEditLiveStream(prev => ({ ...prev, streamUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">ThumbnailUrl</label>
                    <input
                      type="text"
                      value={editLiveStream.thumbnailUrl}
                      onChange={e => setEditLiveStream(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    />
                  </div>

                  <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
                    theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setEditingLiveStreamId(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                    >
                      Ləğv et
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingLiveStreamEdit}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingLiveStreamEdit ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Yenilənir...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Yeniləmələri Yadda Saxla
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book vs Movie management tab */}
      {activeTab === 'bookVsMovies' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" />
                Kitab vs Film Müqayisələrinin İdarəsi
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                İstifadəçilərin səs verə biləcəyi Kitab və Film müqayisələrinin yaradılması və silinməsi.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingBvm(!isCreatingBvm)}
              className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isCreatingBvm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isCreatingBvm ? 'Formu Bağla' : 'Yeni Müqayisə Əlavə Et'}
            </button>
          </div>

          {/* Creation Form */}
          {isCreatingBvm && (
            <div className={`p-6 rounded-3xl border space-y-4 ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <h4 className="text-sm font-bold text-red-500 uppercase tracking-wider">Yeni Kitab vs Film Müqayisəsi Yarat</h4>
              <form onSubmit={handleCreateBookVsMovie} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Müqayisə Başlığı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Məsələn: Dune: Kitab yoxsa Film?"
                    value={newBvmTitle}
                    onChange={(e) => setNewBvmTitle(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 focus:border-red-500' : 'bg-zinc-50 border-zinc-200 focus:border-red-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Təsvir / Müqayisə Haqqında</label>
                  <textarea
                    rows={3}
                    placeholder="Məsələn: Frenk Herbertin klassik əsəri ilə Denis Villeneuve-in möhtəşəm adaptasiyasını müqayisə edin."
                    value={newBvmDesc}
                    onChange={(e) => setNewBvmDesc(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 focus:border-red-500' : 'bg-zinc-50 border-zinc-200 focus:border-red-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Kitab Seçin / Və ya Əllə Daxil Edin *</label>
                    <select
                      value={newBvmBookId}
                      onChange={(e) => {
                        setNewBvmBookId(e.target.value);
                        if (e.target.value !== 'custom') {
                          setNewBvmCustomBookTitle('');
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-red-500' : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-red-500'
                      }`}
                    >
                      <option value="">-- Siyahıdan kitab seçin --</option>
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b.author})
                        </option>
                      ))}
                      <option value="custom">➕ Yeni Kitab (Siyahıda Yoxdur - Əllə Daxil Et)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Film Seçin / Və ya Əllə Daxil Edin *</label>
                    <select
                      value={newBvmMovieId}
                      onChange={(e) => {
                        setNewBvmMovieId(e.target.value);
                        if (e.target.value !== 'custom') {
                          setNewBvmCustomMovieTitle('');
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-red-500' : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-red-500'
                      }`}
                    >
                      <option value="">-- Siyahıdan film seçin --</option>
                      {movies.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.year})
                        </option>
                      ))}
                      <option value="custom">➕ Yeni Film (Siyahıda Yoxdur - Əllə Daxil Et)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(newBvmBookId === 'custom' || !newBvmBookId || newBvmCustomBookTitle) ? (
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Kitabın Adı (Əgər kitab dropdown siyahısında yoxdursa daxil edin)
                      </label>
                      <input
                        type="text"
                        placeholder="Məsələn: Səfillər (Viktor Hüqo)"
                        value={newBvmCustomBookTitle}
                        onChange={(e) => setNewBvmCustomBookTitle(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 focus:border-red-500' : 'bg-zinc-50 border-zinc-200 focus:border-red-500'
                        }`}
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Siyahıda olmayan yeni kitab adı daxil etdikdə sistem həmin kitabı avtomatik bazaya əlavə edəcək.
                      </p>
                    </div>
                  ) : <div />}

                  {(newBvmMovieId === 'custom' || !newBvmMovieId || newBvmCustomMovieTitle) ? (
                    <div>
                      <label className="block text-xs font-bold mb-1">
                        Filmin Adı (Əgər film dropdown siyahısında yoxdursa daxil edin)
                      </label>
                      <input
                        type="text"
                        placeholder="Məsələn: Oppenheimer (2023)"
                        value={newBvmCustomMovieTitle}
                        onChange={(e) => setNewBvmCustomMovieTitle(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none transition ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 focus:border-red-500' : 'bg-zinc-50 border-zinc-200 focus:border-red-500'
                        }`}
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">
                        Siyahıda olmayan yeni film adı daxil etdikdə sistem həmin filmi avtomatik bazaya əlavə edəcək.
                      </p>
                    </div>
                  ) : <div />}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingBvm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Ləğv Et
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBvm}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-red-600/20 cursor-pointer"
                  >
                    {isSubmittingBvm ? 'Yaradılır...' : 'Müqayisəni Yarat'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List Table */}
          <div className={`overflow-x-auto rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className={`border-b text-zinc-400 font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-100'
                }`}>
                  <th className="p-4">Müqayisə</th>
                  <th className="p-4">Seçilmiş Kitab</th>
                  <th className="p-4">Seçilmiş Film</th>
                  <th className="p-4 text-center">Kitab Səsləri</th>
                  <th className="p-4 text-center">Film Səsləri</th>
                  <th className="p-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-zinc-800/40' : 'divide-zinc-100'}`}>
                {bookVsMovies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                      Hələ heç bir Kitab vs Film müqayisəsi mövcud deyil.
                    </td>
                  </tr>
                ) : (
                  bookVsMovies.map((bvm) => {
                    const matchedBook = books.find(b => b.id === bvm.bookId);
                    const matchedMovie = movies.find(m => m.id === bvm.movieId);

                    const bookTitle = matchedBook?.title || bvm.bookTitle || 'Kitab';
                    const bookCover = matchedBook?.cover || bvm.bookCover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80';
                    const movieTitle = matchedMovie?.title || bvm.movieTitle || 'Film';
                    const moviePoster = matchedMovie?.poster || bvm.moviePoster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80';

                    return (
                      <tr key={bvm.id} className="hover:bg-zinc-800/10 transition duration-150">
                        <td className="p-4">
                          <span className="font-bold text-sm block line-clamp-1">{bvm.title}</span>
                          <span className="text-[10px] text-zinc-400 line-clamp-2">{bvm.description}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img src={bookCover} alt={bookTitle} className="w-8 h-11 object-cover rounded border border-zinc-800 shrink-0" />
                            <span className="font-semibold text-xs line-clamp-1">{bookTitle}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <img src={moviePoster} alt={movieTitle} className="w-8 h-11 object-cover rounded border border-zinc-800 shrink-0" />
                            <span className="font-semibold text-xs line-clamp-1">{movieTitle}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-red-500">
                          {bvm.bookVotes}
                        </td>
                        <td className="p-4 text-center font-bold text-cyan-400">
                          {bvm.movieVotes}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteBookVsMovie(bvm.id)}
                            className="p-2 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition cursor-pointer ml-auto"
                            title="Müqayisəni Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <AdminAnalyticsModeration mode="analytics" theme={theme} formatAdminDate={formatAdminDate} />
      )}

      {activeTab === 'moderation' && (
        <AdminAnalyticsModeration mode="moderation" theme={theme} formatAdminDate={formatAdminDate} />
      )}
    </div>
  );
}
