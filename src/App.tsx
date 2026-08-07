import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, Search, Bell, Heart, Bookmark, Users, MessageSquare, Shield, 
  Trash2, Plus, Star, Award, ChevronLeft, ChevronRight, User as UserIcon, Play, Pause,
  Sparkles, Check, X, LogOut, Clock, Grid, Compass, ExternalLink, Moon, Sun, Filter, Share2, MessageCircle,
  Volume2, VolumeX, Maximize2, Minimize2, Settings, Subtitles, ThumbsUp, ThumbsDown, Edit2, Loader2, RotateCcw, SearchX,
  BookOpen
} from 'lucide-react';
import { Movie, User, Collection, Discussion, Notification, Activity, Review, WatchParty, Book, BookCollection, BookVsMovie } from './types';
import { MOCK_MOVIES, MOCK_USERS, MOCK_COLLECTIONS, MOCK_DISCUSSIONS, MOCK_NOTIFICATIONS, MOCK_ACTIVITIES, MOCK_WATCH_PARTIES, MOCK_BOOKS, MOCK_BOOK_COLLECTIONS, MOCK_BOOK_VS_MOVIES } from './data';

import LoginRegister from './components/LoginRegister';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AdminPanel from './components/AdminPanel';
import WatchPartyRoom from './components/WatchPartyRoom';
import Forum from './components/Forum';
import InviteModal from './components/InviteModal';
import LiveStream from './components/LiveStream';
import SharedPlaylists from './components/SharedPlaylists';
import PremiumModal from './components/PremiumModal';
import BooksSection from './components/BooksSection';
import GamificationBadges from './components/GamificationBadges';
import EmptyState from './components/EmptyState';
import LazyImage from './components/LazyImage';
import { 
  apiGetPublicStats, 
  apiToggleMovieFavorite, 
  apiToggleMovieWatchlist, 
  apiToggleMovieLike, 
  apiMarkMovieAsWatched, 
  apiGetMovieFavorites, 
  apiGetMovieWatchlist, 
  apiGetMovieHistory,
  apiGetReviewsByMovieId,
  apiCreateMovieReview,
  apiUpdateMovieReview,
  apiDeleteMovieReview,
  apiLikeMovieReview,
  apiDislikeMovieReview,
  apiGetActiveRooms,
  apiCreateRoom,
  apiDeleteRoom,
  apiCloseRoom,
  apiTransferHost,
  apiInviteToRoom,
  apiGlobalSearch,
  apiGetActivityStream,
  apiToggleBookFavorite,
  apiToggleBookWatchlist,
  PublicStatsDto,
  GlobalSearchResultDto
} from './api';
import { 
  MovieGridSkeleton, 
  BookGridSkeleton, 
  ProfileSkeleton, 
  WatchPartyGridSkeleton, 
  HeroBannerSkeleton, 
  MovieDetailsSkeleton 
} from './components/SkeletonLoader';

export default function App() {
  // Session / Authentication state (Starts as null so Giriş section opens on fresh page load)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Clean up any legacy saved session so user is presented with Giriş screen on reload
  useEffect(() => {
    localStorage.removeItem('cineverse_current_user');
  }, []);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [inviteModalMovie, setInviteModalMovie] = useState<Movie | null>(null);
  const [inviteModalParty, setInviteModalParty] = useState<WatchParty | null>(null);

  // Core lists
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [collections, setCollections] = useState<Collection[]>(MOCK_COLLECTIONS);
  const [discussions, setDiscussions] = useState<Discussion[]>(MOCK_DISCUSSIONS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [watchParties, setWatchParties] = useState<WatchParty[]>(MOCK_WATCH_PARTIES);

  // Books-related states
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [bookCollections, setBookCollections] = useState<BookCollection[]>(MOCK_BOOK_COLLECTIONS);
  const [bookVsMovies, setBookVsMovies] = useState<BookVsMovie[]>(MOCK_BOOK_VS_MOVIES);
  const [selectedBookIdForModal, setSelectedBookIdForModal] = useState<string | null>(null);
  const [activeBookIdForReader, setActiveBookIdForReader] = useState<string | null>(null);

  // Active layouts
  const [currentView, setCurrentView] = useState<string>('home'); // home, movies, watch-party, forum, favorites, watchlist, profile, admin
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);
  const [activeWatchParty, setActiveWatchParty] = useState<WatchParty | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  
  // UI states
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [mainScrollY, setMainScrollY] = useState<number>(0);
  const [favTab, setFavTab] = useState<'movies' | 'books'>('movies');
  const [watchlistTab, setWatchlistTab] = useState<'movies' | 'books'>('movies');
  const scrollFactor = Math.min(mainScrollY / 300, 1);

  // Loading & Skeleton Loader states
  const [isViewLoading, setIsViewLoading] = useState<boolean>(false);
  const [isMoviesFilterLoading, setIsMoviesFilterLoading] = useState<boolean>(false);

  // Trigger smooth shimmer skeleton on view switch
  useEffect(() => {
    setIsViewLoading(true);
    const timer = setTimeout(() => {
      setIsViewLoading(false);
    }, 380);
    return () => clearTimeout(timer);
  }, [currentView, selectedMovie]);

  const targetProfileUser = selectedProfileUser || currentUser || MOCK_USERS[0];

  // Platform statistics state (fetches from /api/Stats with dynamic fallback)
  const [platformStats, setPlatformStats] = useState<{ onlineCount: number; totalReviews: number; activeRoomsCount: number }>({
    onlineCount: 142,
    totalReviews: 1894,
    activeRoomsCount: 2
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = () => {
      apiGetPublicStats()
        .then(res => {
          if (!isMounted || !res) return;
          setPlatformStats({
            onlineCount: res.onlineCount ?? 142,
            totalReviews: res.totalReviews ?? movies.reduce((acc, m) => acc + (m.reviews?.length || 0), 0),
            activeRoomsCount: res.activeRoomsCount ?? watchParties.length
          });
        })
        .catch(() => {
          if (!isMounted) return;
          const calculatedReviews = movies.reduce((acc, m) => acc + (m.reviews?.length || 0), 0);
          setPlatformStats(prev => ({
            ...prev,
            totalReviews: calculatedReviews > 0 ? calculatedReviews : prev.totalReviews,
            activeRoomsCount: watchParties.length
          }));
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // refresh stats every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [movies, watchParties]);

  // Fetch live activity stream from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchActivities = async () => {
      try {
        const streamData = await apiGetActivityStream(24);
        if (isMounted && Array.isArray(streamData) && streamData.length > 0) {
          const formattedStream: Activity[] = streamData.map((item: any) => ({
            id: item.id || `act-${Math.random()}`,
            userId: item.userId || 'u-unknown',
            username: item.username || 'Aktiv İstifadəçi',
            userAvatar: item.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            type: item.type === 'review' || item.type === 'favorite' || item.type === 'collection' || item.type === 'rate' ? item.type : 'review',
            text: item.text || item.description || 'platformada aktivlik etdi',
            movieId: item.movieId,
            movieTitle: item.movieTitle,
            createdAt: item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'İndi'
          }));
          setActivities((prev) => {
            const combined = [...formattedStream, ...prev];
            const uniqueMap = new Map();
            combined.forEach(act => uniqueMap.set(act.id, act));
            return Array.from(uniqueMap.values());
          });
        }
      } catch (e) {
        // Fallback to local state activities if backend endpoint is unavailable
      }
    };

    fetchActivities();
    const actInterval = setInterval(fetchActivities, 15000); // refresh every 15s
    return () => {
      isMounted = false;
      clearInterval(actInterval);
    };
  }, []);

  // Reset Cinema Mode when switching views
  useEffect(() => {
    setIsCinemaMode(false);
  }, [currentView]);

  // Global search API integration
  const [globalSearchResults, setGlobalSearchResults] = useState<GlobalSearchResultDto | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setGlobalSearchResults(null);
      setIsSearching(false);
      return;
    }

    let isSubscribed = true;
    setIsSearching(true);
    const timer = setTimeout(() => {
      apiGlobalSearch(searchQuery.trim(), 5)
        .then((res) => {
          if (isSubscribed && res) {
            setGlobalSearchResults(res);
            setIsSearching(false);
          }
        })
        .catch((err) => {
          if (isSubscribed) {
            console.warn('Backend global search fallback:', err);
            setIsSearching(false);
          }
        });
    }, 300);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Modals
  const [showCreatePartyModal, setShowCreatePartyModal] = useState<boolean>(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState<boolean>(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);
  const [socialModalType, setSocialModalType] = useState<'followers' | 'following'>('followers');
  const [socialModalUser, setSocialModalUser] = useState<User | null>(null);
  const [socialSearchQuery, setSocialSearchQuery] = useState<string>('');

  const socialUsersList = users.filter(u => {
    if (!socialModalUser) return false;
    const listToSearch = socialModalType === 'followers' 
      ? (socialModalUser.followers || []) 
      : (socialModalUser.following || []);
    
    const matchesId = listToSearch.includes(u.id);
    if (!matchesId) return false;

    if (socialSearchQuery.trim()) {
      const query = socialSearchQuery.toLowerCase();
      return u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
    }
    return true;
  });

  // Edit profile form state
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Create party form state
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyMovieId, setNewPartyMovieId] = useState('');
  const [useExternalMovie, setUseExternalMovie] = useState<boolean>(false);
  const [externalMovieTitle, setExternalMovieTitle] = useState('');
  const [externalMovieUrl, setExternalMovieUrl] = useState('');
  const [externalMoviePoster, setExternalMoviePoster] = useState('');
  const [isCreatingParty, setIsCreatingParty] = useState<boolean>(false);

  // TMDB Live Search state
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState<boolean>(false);
  const [selectedTmdbMovie, setSelectedTmdbMovie] = useState<any | null>(null);

  useEffect(() => {
    if (!tmdbSearchQuery.trim()) {
      setTmdbSearchResults([]);
      setIsSearchingTmdb(false);
      return;
    }

    setIsSearchingTmdb(true);
    const timer = setTimeout(() => {
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=15d2ce67543813a070063d3ae4fd1d2b&query=${encodeURIComponent(tmdbSearchQuery)}&language=tr-TR`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.results && data.results.length > 0) {
            setTmdbSearchResults(data.results.slice(0, 5));
          } else {
            const localFiltered = movies.filter((m) =>
              m.title.toLowerCase().includes(tmdbSearchQuery.toLowerCase())
            );
            setTmdbSearchResults(
              localFiltered.map((m) => ({
                id: m.id,
                title: m.title,
                release_date: m.year ? `${m.year}-01-01` : '',
                poster_path: m.poster,
                vote_average: m.rating,
                overview: m.description,
                isLocal: true,
                localMovie: m
              }))
            );
          }
        })
        .catch(() => {
          const localFiltered = movies.filter((m) =>
            m.title.toLowerCase().includes(tmdbSearchQuery.toLowerCase())
          );
          setTmdbSearchResults(
            localFiltered.map((m) => ({
              id: m.id,
              title: m.title,
              release_date: m.year ? `${m.year}-01-01` : '',
              poster_path: m.poster,
              vote_average: m.rating,
              overview: m.description,
              isLocal: true,
              localMovie: m
            }))
          );
        })
        .finally(() => {
          setIsSearchingTmdb(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [tmdbSearchQuery, movies]);

  const handleSelectTmdbMovie = async (item: any) => {
    setSelectedTmdbMovie(item);
    setUseExternalMovie(true);

    const year = item.release_date ? item.release_date.substring(0, 4) : '';
    const fullTitle = year ? `${item.title} (${year})` : item.title;
    setExternalMovieTitle(fullTitle);

    if (item.isLocal) {
      setExternalMoviePoster(item.localMovie.poster);
      setExternalMovieUrl(item.localMovie.trailerUrl || '');
      setNewPartyMovieId(item.localMovie.id);
      setUseExternalMovie(false);
    } else {
      const posterUrl = item.poster_path
        ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`)
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
      setExternalMoviePoster(posterUrl);

      try {
        const vidRes = await fetch(`https://api.themoviedb.org/3/movie/${item.id}/videos?api_key=15d2ce67543813a070063d3ae4fd1d2b&language=en-US`);
        const vidData = await vidRes.json();
        if (vidData && vidData.results && vidData.results.length > 0) {
          const ytVid = vidData.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') || vidData.results[0];
          if (ytVid && ytVid.key) {
            setExternalMovieUrl(`https://www.youtube.com/watch?v=${ytVid.key}`);
          } else {
            setExternalMovieUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(fullTitle + ' trailer')}`);
          }
        } else {
          setExternalMovieUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(fullTitle + ' trailer')}`);
        }
      } catch {
        setExternalMovieUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(fullTitle + ' trailer')}`);
      }
    }

    if (!newPartyName.trim()) {
      setNewPartyName(`${fullTitle} Otağı 🍿`);
    }
  };

  // Create collection form state
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColCover, setNewColCover] = useState('');
  const [newColMovieIds, setNewColMovieIds] = useState<string[]>([]);

  // CineTheater Player States
  const [activePlayerMode, setActivePlayerMode] = useState<'idle' | 'trailer' | 'movie'>('idle');
  const [activeServer, setActiveServer] = useState<'server_primary' | 'server_backup' | 'server_dual'>('server_primary');
  const [theaterLightsOn, setTheaterLightsOn] = useState<boolean>(false);
  const [subtitleLanguage, setSubtitleLanguage] = useState<'az' | 'en' | 'tr' | 'off'>('az');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playerVolume, setPlayerVolume] = useState<number>(0.8);
  const [playerIsMuted, setPlayerIsMuted] = useState<boolean>(false);
  const [playerIsPlaying, setPlayerIsPlaying] = useState<boolean>(false);
  const [playerCurrentTime, setPlayerCurrentTime] = useState<number>(0);
  const [playerDuration, setPlayerDuration] = useState<number>(0);
  const [playerResolution, setPlayerResolution] = useState<'1080p' | '720p' | '4k' | 'auto'>('1080p');
  const [showPlayerSettings, setShowPlayerSettings] = useState<boolean>(false);

  // Video Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAutoJoined = useRef<boolean>(false);

  // Reset player when switching movies or views
  useEffect(() => {
    setActivePlayerMode('idle');
    setPlayerIsPlaying(false);
    setTheaterLightsOn(false);
    setPlayerCurrentTime(0);
  }, [selectedMovie, currentView]);

  // Filters state (for Movies page)
  const [movieSearch, setMovieSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Hamsı');
  const [selectedYear, setSelectedYear] = useState('Hamsı');
  const [selectedRating, setSelectedRating] = useState('Hamsı');
  const [selectedSort, setSelectedSort] = useState('rating-desc'); // rating-desc, year-desc, likes-desc

  // Trigger brief shimmer loading state on movie filter updates
  useEffect(() => {
    if (currentView === 'movies') {
      setIsMoviesFilterLoading(true);
      const timer = setTimeout(() => {
        setIsMoviesFilterLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [movieSearch, selectedGenre, selectedYear, selectedRating, selectedSort]);

  // Review Form State
  const [reviewRating, setReviewRating] = useState<number>(10);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Movie Review Editing States
  const [editingMovieReviewId, setEditingMovieReviewId] = useState<string | null>(null);
  const [editingMovieReviewComment, setEditingMovieReviewComment] = useState<string>('');
  const [editingMovieReviewRating, setEditingMovieReviewRating] = useState<number>(10);

  // Chatbot State
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [chatbotMessages, setChatbotMessages] = useState<Array<{ 
    id: string; 
    sender: 'ai' | 'user'; 
    text: string; 
    recommendedMovieIds?: string[];
    recommendedBookIds?: string[];
  }>>([]);
  const [chatbotInput, setChatbotInput] = useState<string>('');
  const [isChatbotTyping, setIsChatbotTyping] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setChatbotMessages([
        {
          id: 'welcome_1',
          sender: 'ai',
          text: `Salam, ${currentUser.name}! 🎬📚\n\nMən sənin CineVerse virtual köməkçinim və süni intellekt bələdçinim - **CineAI**! 🤖✨\n\nBu rəngarəng film və kitab dünyasında sənə necə kömək edə bilərəm? Sevdiyin janrı, rejissoru, yazıçı və ya kitab adını yaz, sənə ən yaxşı təklifləri və birbaşa oxuya biləcəyin e-kitabları təqdim edim! 👇`
        }
      ]);
    }
  }, [currentUser]);

  // Deep-linking support for invite links (?party=ID or /watch-party/ID)
  useEffect(() => {
    if (hasAutoJoined.current) return;

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    let partyId = searchParams.get('party');

    if (!partyId && pathname.includes('/watch-party/')) {
      const parts = pathname.split('/watch-party/');
      if (parts.length > 1) {
        partyId = parts[1].split('/')[0];
      }
    }

    if (partyId) {
      const foundParty = watchParties.find(wp => wp.id === partyId);
      if (foundParty) {
        hasAutoJoined.current = true; // Mark as processed to prevent any loop
        
        // Handle guest session if not logged in
        let activeUser = currentUser;
        if (!activeUser) {
          const guestUser: User = {
            id: 'u_guest_' + Date.now(),
            name: 'Qonaq İzləyici',
            username: 'qonaq_' + Math.floor(100 + Math.random() * 900),
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            email: 'guest@cineverse.com',
            role: 'user',
            bio: 'CineVerse Dəvətlisi',
            followersCount: 0,
            followingCount: 0,
            favorites: [],
            watchlist: [],
            savedCollections: [],
            followers: [],
            following: []
          };
          setCurrentUser(guestUser);
          activeUser = guestUser;
        }

        const exists = foundParty.participants.some((p) => p.id === activeUser!.id);
        let updatedParticipants = [...foundParty.participants];
        if (!exists) {
          updatedParticipants.push({
            id: activeUser!.id,
            name: activeUser!.name,
            avatar: activeUser!.avatar
          });
        }

        const updatedParty = {
          ...foundParty,
          participants: updatedParticipants,
          chat: [
            ...foundParty.chat,
            {
              id: 'sys_join_' + Date.now(),
              sender: 'Sistem',
              senderAvatar: '',
              message: `${activeUser!.name} dəvət linki vasitəsilə otağa sürətlə qoşuldu! 👋🍿`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };

        setWatchParties((prev) => prev.map((p) => (p.id === foundParty.id ? updatedParty : p)));
        setActiveWatchParty(updatedParty);
        setCurrentView('watch-party-room');
      }
    }
  }, [watchParties, currentUser]);

  // AI-powered recommendation system
  const getAIRecommendations = (): { movie: Movie; score: number; reason: string }[] => {
    if (!currentUser) return [];

    const favoriteMovies = movies.filter(m => currentUser.favorites.includes(m.id) || currentUser.watchlist.includes(m.id));

    // If user has no favorites or watchlist, return top 4 high-rated movies as recommendations
    if (favoriteMovies.length === 0) {
      return movies
        .filter(m => m.id !== 'm_ext_') // skip custom external movies
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4)
        .map(m => ({
          movie: m,
          score: m.rating,
          reason: "İcma tərəfindən yüksək qiymətləndirilib"
        }));
    }

    // Calculate genre and director frequency
    const genreCounts: { [key: string]: number } = {};
    const directorCounts: { [key: string]: number } = {};

    favoriteMovies.forEach(m => {
      m.genres.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
      directorCounts[m.director] = (directorCounts[m.director] || 0) + 1;
    });

    // Score all non-favorited movies
    const recommended = movies
      .filter(m => !currentUser.favorites.includes(m.id) && !currentUser.watchlist.includes(m.id))
      .map(m => {
        let score = 0;
        let reasons: string[] = [];

        // Genre matching points
        let matchedGenres = m.genres.filter(g => genreCounts[g] > 0);
        matchedGenres.forEach(g => {
          score += genreCounts[g] * 4;
        });

        if (matchedGenres.length > 0) {
          reasons.push(`Sevdiyniz "${matchedGenres[0]}" janrında`);
        }

        // Director matching points
        if (directorCounts[m.director] > 0) {
          score += directorCounts[m.director] * 10;
          reasons.push(`Sevdiyniz rejissor ${m.director}-dan`);
        }

        // Base rating score component
        score += m.rating * 1.5;

        // Reason formulation
        let reason = reasons.join(' və ') || "Maraqlana biləcəyiniz janr";

        return {
          movie: m,
          score,
          reason
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return recommended;
  };

  const handleSendChatbotMessage = (text: string) => {
    if (!text.trim() || isChatbotTyping) return;

    const userMsg = {
      id: 'msg_user_' + Date.now(),
      sender: 'user' as const,
      text: text.trim()
    };

    setChatbotMessages(prev => [...prev, userMsg]);
    setChatbotInput('');
    setIsChatbotTyping(true);

    // Simulate AI thinking and reply
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let replyText = "";
      let recommendedMovieIds: string[] = [];
      let recommendedBookIds: string[] = [];

      if (lowerText.includes('dyun') || lowerText.includes('dune')) {
        replyText = `**Dyun (Dune)** – Frank Herbertin əfsanəvi elmi-fantastik şahəsəridir. CineVerse-in xüsusi e-oxuyucusu vasitəsilə kitabı dərhal buradan oxuya bilərsən! Kitabı oxuduqca əlavə Kino Xalları (points) qazanacaqsan! 📖🌌`;
        recommendedBookIds = ['b1'];
      } else if (lowerText.includes('əli və nino') || lowerText.includes('ali və nino') || lowerText.includes('ali and nino') || lowerText.includes('nino')) {
        replyText = `**Əli və Nino** – Qurban Səidin Bakıda cərəyan edən klassik sevgi və tarix dastanını birbaşa CineVerse rəqəmsal oxuyucusunda mütaliə edin! 🌹📖`;
        recommendedBookIds = ['b2'];
      } else if (lowerText.includes('təmiz kod') || lowerText.includes('clean code') || lowerText.includes('robert martin') || lowerText.includes('martin')) {
        replyText = `Proqramlaşdırma dünyasının stolüstü kitabı – **Clean Code (Təmiz Kod)**. Hər bir peşəkar proqramçının mütləq oxumalı olduğu bu əsəri CineVerse E-Reader-də oxu! 💻📚`;
        recommendedBookIds = ['b3'];
      } else if (lowerText.includes('1984') || lowerText.includes('orwell') || lowerText.includes('oruell')) {
        replyText = `Corc Oruell tərəfindən yazılmış dahi antiutopik əsər **"1984"** romanını buradan oxuya və totalitar bir cəmiyyətin dərinliklərinə enə bilərsən: 👁️📖`;
        recommendedBookIds = ['b4'];
      } else if (lowerText.includes('kitab') || lowerText.includes('roman') || lowerText.includes('oxu') || lowerText.includes('book') || lowerText.includes('müəllif') || lowerText.includes('yazar') || lowerText.includes('yazıçı') || lowerText.includes('kitablar')) {
        replyText = `CineVerse rəqəmsal kitabxanasına xoş gəldin! Sənin üçün sistemdə olan ən populyar və reytinqli kitabları topladım. E-Reader (E-Oxuyucu) vasitəsilə mütaliə edərək həm də Kino Xalları qazana bilərsən! 📚✨`;
        recommendedBookIds = books.slice(0, 4).map(b => b.id);
      } else if (lowerText.includes('nolan')) {
        const nolanMovies = movies.filter(m => m.director.toLowerCase().includes('nolan'));
        if (nolanMovies.length > 0) {
          replyText = `Christopher Nolan həqiqətən də kino sənətinin dahisidir! Sənin üçün sistemimizdə olan ən yaxşı Nolan şahəsərlərini tapdım. Onların ssenari quruluşu və fəlsəfəsi səni heyran edəcək! 🌌🍿`;
          recommendedMovieIds = nolanMovies.map(m => m.id);
        } else {
          replyText = `Nolan filmləri olduqca dərindir! Təəssüf ki, hazırda verilənlər bazamızda tapılmadı, lakin sizə "Dyun" və ya digər elmi-fantastik filmləri tövsiyə edə bilərəm!`;
        }
      } else if (lowerText.includes('fantastika') || lowerText.includes('elm') || lowerText.includes('kosmos') || lowerText.includes('sci-fi') || lowerText.includes('scifi')) {
        const sciFiMovies = movies.filter(m => m.genres.some(g => g.toLowerCase().includes('fantastika') || g.toLowerCase().includes('elm')));
        if (sciFiMovies.length > 0) {
          replyText = `Elmi-Fantastika janrına olan sevginiz möhtəşəmdir! Kosmos, zaman səyahəti və texnologiya mövzulu bu möhtəşəm filmlərə göz atmağınızı tövsiyə edirəm: 🛸✨`;
          recommendedMovieIds = sciFiMovies.map(m => m.id);
        } else {
          replyText = `Elmi-fantastik filmlər həmişə diqqətçəkəndir! Sistemimizdə bənzər filmləri axtarıram.`;
        }
      } else if (lowerText.includes('dram') || lowerText.includes('həyat') || lowerText.includes('hekayə')) {
        const dramMovies = movies.filter(m => m.genres.some(g => g.toLowerCase().includes('dram')));
        if (dramMovies.length > 0) {
          replyText = `Dərin hisslər, guclü hekayələr və təsirli obrazlar axtarırsınız? Bu dram filmləri sizi həm düşündürəcək, həm də duyğulandıracaq: 🎭🥺`;
          recommendedMovieIds = dramMovies.slice(0, 3).map(m => m.id);
        }
      } else if (lowerText.includes('triller') || lowerText.includes('sirr') || lowerText.includes('gərginlik')) {
        const thrillerMovies = movies.filter(m => m.genres.some(g => g.toLowerCase().includes('triller') || g.toLowerCase().includes('sirr')));
        if (thrillerMovies.length > 0) {
          replyText = `Gərginlik dolu dəqiqələr və tapmacalar! Son ana qədər nəfəsinizi kəsəcək ən güclü triller filmlərini sizin üçün seçdim: 🕵️‍♂️🔥`;
          recommendedMovieIds = thrillerMovies.slice(0, 3).map(m => m.id);
        }
      } else if (lowerText.includes('aksiyon') || lowerText.includes('döyüş') || lowerText.includes('macəra') || lowerText.includes('adventure')) {
        const actionMovies = movies.filter(m => m.genres.some(g => g.toLowerCase().includes('aksiyon') || g.toLowerCase().includes('macəra') || g.toLowerCase().includes('aksion')));
        if (actionMovies.length > 0) {
          replyText = `Adrenalin və macəra axtarırsınız? Sürətli templi, hərəkətli və macəra dolu bu filmləri qətiyyən qaçırmayın: 🏹💥`;
          recommendedMovieIds = actionMovies.slice(0, 3).map(m => m.id);
        }
      } else if (lowerText.includes('təsadüfi') || lowerText.includes('random') || lowerText.includes('film təklif') || lowerText.includes('təklif et') || lowerText.includes('tövsiyə')) {
        const randomIndex = Math.floor(Math.random() * movies.length);
        const randomMovie = movies[randomIndex];
        replyText = `Sənin bəxtinə bu gün şanslı bir film çıxdı! **"${randomMovie.title}"** sənə xoş anlar bəxş edə bilər. Rejissor ${randomMovie.director} tərəfindən çəkilmiş bu film ${randomMovie.year}-cu ilə aiddir. Buna mütləq şans ver! 🍿🎲`;
        recommendedMovieIds = [randomMovie.id];
      } else if (lowerText.includes('salam') || lowerText.includes('salamlar') || lowerText.includes('hey') || lowerText.includes('hello')) {
        replyText = `Salam, xoş gəldiniz! 😊 Mən CineAI-yam. Sizin film və kitab zövqünüzə uyğun gələcək xüsusi təkliflər etmək üçün buradayam. Mənə necə bir film və ya kitab istədiyinizi deyin (məsələn: Nolan, Dyun, Triller, Elmi-fantastika, Əli və Nino və s.).`;
      } else if (lowerText.includes('reytinq') || lowerText.includes('ən yaxşı') || lowerText.includes('yüksək')) {
        const bestMovies = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 3);
        replyText = `CineVerse icması və tənqidçilər tərəfindən ən yüksək reytinq almış, mütləq izlənməli olan TOP 3 film bunlardır: 🏆⭐`;
        recommendedMovieIds = bestMovies.map(m => m.id);
      } else if (lowerText.includes('özəl') || lowerText.includes('mənim üçün') || lowerText.includes('seçilmiş')) {
        const recs = getAIRecommendations();
        if (recs.length > 0) {
          replyText = `Sənin üçün xüsusi olaraq hazırladığım "Özəl Təkliflər" siyahısını buraya gətirdim. Sevdiyin janrlara və rejissorlara əsaslanır: 🌟🤖`;
          recommendedMovieIds = recs.map(r => r.movie.id);
        } else {
          replyText = `Zövqünüzü öyrənmək üçün hələ yetərli məlumatım yoxdur. Zəhmət olmasa bir neçə filmi sevimliyə əlavə edin!`;
        }
      } else {
        const matched = movies.filter(m => lowerText.includes(m.title.toLowerCase()) || lowerText.includes(m.originalTitle.toLowerCase()));
        if (matched.length > 0) {
          replyText = `Bəli, **"${matched[0].title}"** həqiqətən əla seçimdir! Rejissor ${matched[0].director} imzalı bu film haqqında ətraflı məlumata baxmaq istəyirsinizsə, aşağıda klikləyin: 👇`;
          recommendedMovieIds = [matched[0].id];
        } else {
          replyText = `Maraqlı fikirdir! Sənin üçün sistemdə olan ən populyar film və kitablarımızdan bəzilərini seçdim. Bəlkə bu axşam bunlardan birinə vaxt ayırasan? 🎬🍿📚`;
          recommendedMovieIds = movies.slice(0, 2).map(m => m.id);
          recommendedBookIds = books.slice(0, 2).map(b => b.id);
        }
      }

      const aiMsg = {
        id: 'msg_ai_' + Date.now(),
        sender: 'ai' as const,
        text: replyText,
        recommendedMovieIds,
        recommendedBookIds
      };

      setChatbotMessages(prev => [...prev, aiMsg]);
      setIsChatbotTyping(false);
    }, 1200);
  };

  // Handle Login
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setIsAdminMode(true);
      setCurrentView('admin');
    } else {
      setIsAdminMode(false);
      setCurrentView('home');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveWatchParty(null);
    setSelectedMovie(null);
    setIsAdminMode(false);
  };

  // Add Kino Xalları (Gamification Points) to user
  const rewardPoints = (amount: number, reason: string) => {
    if (!currentUser) return;
    const currentPoints = currentUser.points || 0;
    const newPoints = currentPoints + amount;
    
    const updatedUser = {
      ...currentUser,
      points: newPoints
    };
    
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    // Add a system notification for the user
    const newNotification: Notification = {
      id: 'notif_pts_' + Date.now(),
      type: 'system',
      title: 'Xal Qazanıldı! 🏆',
      description: `Təbrik edirik! +${amount} Kino Xalı qazandınız (${reason}). Sizin ümumi xalınız: ${newPoints}`,
      date: 'İndi',
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Player Playback Functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playerIsPlaying) {
      videoRef.current.pause();
      setPlayerIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setPlayerIsPlaying(true);
      }).catch((err) => {
        console.log("Play failed: ", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPlayerCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setPlayerDuration(videoRef.current.duration);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setPlayerCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setPlayerVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0 || playerIsMuted;
    }
  };

  const toggleMute = () => {
    const newMuted = !playerIsMuted;
    setPlayerIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowPlayerSettings(false);
  };

  const formatPlayerTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const formatNum = (num: number) => num < 10 ? `0${num}` : num;

    if (hrs > 0) {
      return `${formatNum(hrs)}:${formatNum(mins)}:${formatNum(secs)}`;
    }
    return `${formatNum(mins)}:${formatNum(secs)}`;
  };

  const getSubtitleText = (movieId: string, time: number, lang: 'az' | 'en' | 'tr' | 'off'): string => {
    if (lang === 'off') return '';
    
    // Custom translated subtitle structures for top movies
    const subs: Record<string, Array<{ start: number; end: number; az: string; en: string; tr: string }>> = {
      m1: [ // Interstellar
        { start: 0, end: 5, az: "[Musiqi] Hans Zimmer - Kosmik Səyahət Mövzusu", en: "[Music] Hans Zimmer - Cosmic Voyage Theme", tr: "[Müzik] Hans Zimmer - Kozmik Yolculuk Teması" },
        { start: 5, end: 11, az: "Cooper: Bəşəriyyət dünyada doğulmuşdu. Amma burada ölmək taleyi deyil.", en: "Cooper: Mankind was born on Earth. It was never meant to die here.", tr: "Cooper: İnsanlık dünyada doğmuştu. Ama burada ölmek kaderi değil." },
        { start: 12, end: 18, az: "Brand: Biz hələ də kəşfiyyatçıyıq. Bu bizim ən böyük səyahətimizdir.", en: "Brand: We are still pioneers. This is our greatest journey.", tr: "Brand: Biz hâlâ kaşifleriz. Bu bizim en büyük yolculuğumuz." },
        { start: 19, end: 25, az: "Cooper: Zaman nisbidir. Amma sevgi kainatın hər yerində eynidir.", en: "Cooper: Time is relative. But love is the same everywhere in the universe.", tr: "Cooper: Zaman görelidir. Ama sevgi evrenin her yerinde aynıdır." },
        { start: 26, end: 32, az: "TARS: Cazibə qüvvəsi digər ölçüləri də kəsə bilən tək qüvvədir.", en: "TARS: Gravity is the only force that can cross dimensions.", tr: "TARS: Yerçekimi, diğer boyutları da kesebilen tek güçtür." },
        { start: 33, end: 40, az: "Cooper: Mən mütləq geri dönəcəyəm, qızım. Söz verirəm.", en: "Cooper: I will definitely return, my daughter. I promise.", tr: "Cooper: Kesinlikle geri döneceğim, kızım. Söz veriyorum." },
        { start: 41, end: 60, az: "[Səyahət başlayır... Kvant məlumatları toplanır]", en: "[The journey begins... Quantum data is being collected]", tr: "[Yolculuk başlıyor... Kuantum verileri toplanıyor]" }
      ],
      m2: [ // Inception
        { start: 0, end: 5, az: "[Musiqi] Hans Zimmer - Şüuraltının Sirləri", en: "[Music] Hans Zimmer - Subconscious Secrets", tr: "[Müzik] Hans Zimmer - Bilinçaltının Sırları" },
        { start: 5, end: 11, az: "Cobb: Bir ideya nə qədər güclüdür? Bir ideya bütün dünyanı dəyişə bilər.", en: "Cobb: How powerful is an idea? An idea can change the whole world.", tr: "Cobb: Bir fikir ne kadar güçlüdür? Bir fikir tüm dünyayı değiştirebilir." },
        { start: 12, end: 18, az: "Ariadne: Bu bir yuxudur? Biz hazırda kiminsə şüuraltındayıq?", en: "Ariadne: Is this a dream? Are we in someone's subconscious right now?", tr: "Ariadne: Bu bir rüya mı? Şu anda birinin bilinçaltında mıyız?" },
        { start: 19, end: 25, az: "Cobb: Yuxunun içində yuxu... Biz daha dərinə getməliyik.", en: "Cobb: A dream within a dream... We must go deeper.", tr: "Cobb: Rüya içinde rüya... Daha derine gitmeliyik." },
        { start: 26, end: 32, az: "Arthur: Cazibə qüvvəsi yuxuda itəndə, fizika qanunları yenidən yazılır.", en: "Arthur: When gravity vanishes in a dream, the laws of physics are rewritten.", tr: "Arthur: Rüyada yerçekimi kaybolduğunda, fizik yasaları yeniden yazılır." },
        { start: 33, end: 40, az: "Cobb: Totem hələ də fırlanır... Həqiqət haradadır?", en: "Cobb: The totem is still spinning... Where is the reality?", tr: "Cobb: Totem hâlâ dönüyor... Gerçeklik nerede?" },
        { start: 41, end: 60, az: "[Başlanğıc əməliyyatı tamamlanır... Yuxudan oyanış]", en: "[Inception operation completes... Waking up from the dream]", tr: "[Başlangıç operasyonu tamamlanıyor... Rüyadan uyanış]" }
      ],
      m3: [ // Dune Part 2
        { start: 0, end: 6, az: "Paul: Atreydes xalqının gələcəyi qumların altındadır.", en: "Paul: The future of House Atreyes lies beneath the sands.", tr: "Paul: Atreydes hanedanının geleceği kumların altındadır." },
        { start: 7, end: 13, az: "Chani: Qum qurdları yalnız yerlilərə qulaq asır.", en: "Chani: Sandworms only listen to the natives.", tr: "Chani: Kum solucanları sadece yerlileri dinler." },
        { start: 14, end: 20, az: "Paul: Mən gələcəyi görürəm... Və bu çox qorxuludur.", en: "Paul: I see the future... And it is terrifying.", tr: "Paul: Geleceği görüyorum... Ve bu çok korkutucu." }
      ]
    };

    const movieSubs = subs[movieId];
    if (!movieSubs) {
      if (time < 5) return lang === 'az' ? 'CineVerse - Xoş izləmələr!' : lang === 'tr' ? 'CineVerse - İyi seyirler!' : 'CineVerse - Enjoy the movie!';
      if (time >= 5 && time < 12) return lang === 'az' ? 'Siz hazırda platformamızın xüsusi HD video serverindəsiniz.' : lang === 'tr' ? 'Şu anda platformumuzun özel HD video sunucusundasınız.' : 'You are currently on our premium HD video server.';
      if (time >= 12 && time < 20) return lang === 'az' ? 'Tam film rejimi daxili player vasitəsilə birbaşa yayımlanır.' : lang === 'tr' ? 'Tam film modu, dahili oynatıcı ile doğrudan yayınlanmaktadır.' : 'Full movie mode is directly streaming via our integrated player.';
      if (time >= 20 && time < 30) return lang === 'az' ? 'Kino işıqlarını söndürərək tam sinema ab-havasını hiss edə bilərsiniz. 🍿' : lang === 'tr' ? 'Sinema ışıklarını kapatarak gerçek sinema atmosferini yaşayabilirsiniz. 🍿' : 'You can dim the theater lights to experience a true cinema vibe. 🍿';
      return '';
    }

    const activeCue = movieSubs.find(cue => time >= cue.start && time <= cue.end);
    return activeCue ? activeCue[lang] : '';
  };

  // Handle Profile Update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editName.trim() || !editUsername.trim()) return;

    // clean username (must start with no @, only alphanumeric and underscores, e.g. like instagram nick)
    const cleanedUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanedUsername) return;

    // Update current user
    const updatedUser: User = {
      ...currentUser,
      name: editName.trim(),
      username: cleanedUsername,
      bio: editBio.trim(),
      avatar: editAvatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    };

    setCurrentUser(updatedUser);
    
    // Update users array
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    // Update username inside watch parties creators or participants
    setWatchParties((prev) => prev.map((party) => {
      const updatedParticipants = party.participants.map((p) => {
        if (p.id === currentUser.id) {
          return { ...p, name: updatedUser.name, avatar: updatedUser.avatar };
        }
        return p;
      });

      const updatedChat = party.chat.map((msg) => {
        if (msg.sender === currentUser.name) {
          return { ...msg, sender: updatedUser.name, senderAvatar: updatedUser.avatar };
        }
        return msg;
      });

      return {
        ...party,
        creator: party.creator === currentUser.username ? updatedUser.username : party.creator,
        participants: updatedParticipants,
        chat: updatedChat
      };
    }));

    // Update activities
    setActivities((prev) => prev.map((act) => {
      if (act.userId === currentUser.id) {
        return { ...act, username: updatedUser.username, userAvatar: updatedUser.avatar };
      }
      return act;
    }));

    // Update reviews in movies state
    setMovies((prev) => prev.map((m) => {
      if (!m.reviews) return m;
      const updatedReviews = m.reviews.map((r) => {
        if (r.userId === currentUser.id) {
          return { ...r, username: updatedUser.username, userAvatar: updatedUser.avatar };
        }
        return r;
      });
      return { ...m, reviews: updatedReviews };
    }));

    setShowEditProfileModal(false);
  };

  // Fetch reviews from backend when selectedMovie is opened
  useEffect(() => {
    if (!selectedMovie?.id) return;
    let isSubscribed = true;
    async function loadMovieReviews() {
      try {
        const backendReviews = await apiGetReviewsByMovieId(selectedMovie.id);
        if (isSubscribed && Array.isArray(backendReviews)) {
          const mappedReviews: Review[] = backendReviews.map((r) => ({
            id: r.id,
            movieId: r.movieId,
            movieTitle: r.movieTitle || selectedMovie.title,
            userId: r.userId,
            username: r.username || 'Anonim',
            userAvatar: r.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            rating: r.rating,
            comment: r.comment,
            likes: r.likes || 0,
            dislikes: r.dislikes || 0,
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'İndi'
          }));
          setSelectedMovie((prev) => prev && prev.id === selectedMovie.id ? { ...prev, reviews: mappedReviews } : prev);
        }
      } catch (err) {
        console.warn('Backend reviews fetch fallback:', err);
      }
    }
    loadMovieReviews();
    return () => { isSubscribed = false; };
  }, [selectedMovie?.id]);

  // Fetch active rooms from backend
  useEffect(() => {
    let isSubscribed = true;
    async function loadActiveRooms() {
      try {
        const rooms = await apiGetActiveRooms();
        if (isSubscribed && Array.isArray(rooms) && rooms.length > 0) {
          const backendParties: WatchParty[] = rooms.map((r) => {
            const movieObj = movies.find(m => m.id === r.movieId) || movies[0];
            return {
              id: r.id,
              roomName: r.title,
              movieId: r.movieId || (movieObj ? movieObj.id : ''),
              creator: r.createdByUserId || 'Sistem',
              participants: [],
              currentTimestamp: 0,
              isPlaying: r.isLive,
              chat: []
            };
          });
          setWatchParties((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = backendParties.filter(p => !existingIds.has(p.id));
            return [...newOnes, ...prev];
          });
        }
      } catch (err) {
        console.warn('Backend active rooms fetch fallback:', err);
      }
    }
    loadActiveRooms();
    return () => { isSubscribed = false; };
  }, [currentView, movies]);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Add Movie to Favorites
  const toggleFavorite = async (movieId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    let updatedFavorites = [...currentUser.favorites];
    const isFav = updatedFavorites.includes(movieId);
    const movie = movies.find(m => m.id === movieId);

    if (isFav) {
      updatedFavorites = updatedFavorites.filter((id) => id !== movieId);
    } else {
      updatedFavorites.push(movieId);
      // Append Social Activity
      if (movie) {
        const newActivity: Activity = {
          id: 'act_' + Date.now(),
          type: 'favorite',
          userId: currentUser.id,
          username: currentUser.username,
          userAvatar: currentUser.avatar,
          text: `"${movie.title}" filmini sevimli siyahısına əlavə etdi.`,
          movieTitle: movie.title,
          movieId: movie.id,
          date: 'İndi'
        };
        setActivities((prev) => [newActivity, ...prev]);
      }
    }

    const updatedUser = { ...currentUser, favorites: updatedFavorites };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    try {
      const res = await apiToggleMovieFavorite(movieId);
      if (res && typeof res.isFavorite === 'boolean') {
        const syncedFavs = res.isFavorite
          ? Array.from(new Set([...updatedFavorites, movieId]))
          : updatedFavorites.filter(id => id !== movieId);
        const syncedUser = { ...currentUser, favorites: syncedFavs };
        setCurrentUser(syncedUser);
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? syncedUser : u)));
      }
    } catch (err) {
      console.warn('Backend toggle favorite synced locally:', err);
    }
  };

  // Add Movie to Watchlist
  const toggleWatchlist = async (movieId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    let updatedWatchlist = [...currentUser.watchlist];
    const isWatch = updatedWatchlist.includes(movieId);
    const movie = movies.find(m => m.id === movieId);

    if (isWatch) {
      updatedWatchlist = updatedWatchlist.filter((id) => id !== movieId);
    } else {
      updatedWatchlist.push(movieId);
      // Append Social Activity
      if (movie) {
        const newActivity: Activity = {
          id: 'act_' + Date.now(),
          type: 'collection',
          userId: currentUser.id,
          username: currentUser.username,
          userAvatar: currentUser.avatar,
          text: `"${movie.title}" filmini İzləmə Siyahısına əlavə etdi.`,
          movieTitle: movie.title,
          movieId: movie.id,
          date: 'İndi'
        };
        setActivities((prev) => [newActivity, ...prev]);
      }
    }

    const updatedUser = { ...currentUser, watchlist: updatedWatchlist };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    try {
      const res = await apiToggleMovieWatchlist(movieId);
      if (res && typeof res.isInWatchlist === 'boolean') {
        const syncedWatchlist = res.isInWatchlist
          ? Array.from(new Set([...updatedWatchlist, movieId]))
          : updatedWatchlist.filter(id => id !== movieId);
        const syncedUser = { ...currentUser, watchlist: syncedWatchlist };
        setCurrentUser(syncedUser);
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? syncedUser : u)));
      }
    } catch (err) {
      console.warn('Backend toggle watchlist synced locally:', err);
    }
  };

  // Add Book to Favorites
  const toggleBookFavorite = async (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    const currentFavs = currentUser.favoriteBooks || [];
    const isFav = currentFavs.includes(bookId);
    const updatedFavs = isFav ? currentFavs.filter(id => id !== bookId) : [...currentFavs, bookId];

    const updatedUser = { ...currentUser, favoriteBooks: updatedFavs };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    try {
      await apiToggleBookFavorite(bookId);
    } catch (err) {
      console.warn('Backend toggle book favorite error:', err);
    }
  };

  // Add Book to Watchlist (Oxuma Siyahısı)
  const toggleBookWatchlist = async (bookId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    const currentWatchlist = currentUser.watchlistBooks || [];
    const isIn = currentWatchlist.includes(bookId);
    const updatedWatchlist = isIn ? currentWatchlist.filter(id => id !== bookId) : [...currentWatchlist, bookId];

    const updatedUser = { ...currentUser, watchlistBooks: updatedWatchlist };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    try {
      await apiToggleBookWatchlist(bookId);
    } catch (err) {
      console.warn('Backend toggle book watchlist error:', err);
    }
  };

  // Toggle Movie Like
  const toggleLike = async (movieId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    const currentLiked = currentUser.likedMovies || [];
    const isLiked = currentLiked.includes(movieId);
    const movie = movies.find(m => m.id === movieId);

    let updatedLikedMovies: string[];
    if (isLiked) {
      updatedLikedMovies = currentLiked.filter((id) => id !== movieId);
    } else {
      updatedLikedMovies = [...currentLiked, movieId];
      if (movie) {
        const newActivity: Activity = {
          id: 'act_' + Date.now(),
          type: 'favorite',
          userId: currentUser.id,
          username: currentUser.username,
          userAvatar: currentUser.avatar,
          text: `"${movie.title}" filmini bəyəndi. 👍`,
          movieTitle: movie.title,
          movieId: movie.id,
          date: 'İndi'
        };
        setActivities((prev) => [newActivity, ...prev]);
      }
    }

    // Update movies array likes count
    setMovies(prev => prev.map(m => {
      if (m.id === movieId) {
        const likes = m.likes || 0;
        return { ...m, likes: isLiked ? Math.max(0, likes - 1) : likes + 1 };
      }
      return m;
    }));

    if (selectedMovie && selectedMovie.id === movieId) {
      setSelectedMovie(prev => prev ? {
        ...prev,
        likes: isLiked ? Math.max(0, (prev.likes || 0) - 1) : (prev.likes || 0) + 1
      } : null);
    }

    const updatedUser = { ...currentUser, likedMovies: updatedLikedMovies };
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    try {
      const res = await apiToggleMovieLike(movieId);
      if (res && typeof res.isLiked === 'boolean') {
        const syncedLiked = res.isLiked
          ? Array.from(new Set([...updatedLikedMovies, movieId]))
          : updatedLikedMovies.filter(id => id !== movieId);
        const syncedUser = { ...currentUser, likedMovies: syncedLiked };
        setCurrentUser(syncedUser);
        setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? syncedUser : u)));
      }
    } catch (err) {
      console.warn('Backend toggle like synced locally:', err);
    }
  };

  // Direct Watch Party Creation with simulated loading
  const handleDirectCreateWatchParty = async () => {
    if (isCreatingParty) return;
    setIsCreatingParty(true);

    const activeUser = currentUser || {
      id: 'u_guest_' + Date.now(),
      name: 'Qonaq İzləyici',
      username: 'qonaq_' + Math.floor(100 + Math.random() * 900),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      email: 'guest@cineverse.com',
      role: 'user',
      bio: 'CineVerse Dəvətlisi',
      followersCount: 0,
      followingCount: 0,
      following: [],
      followers: [],
      favorites: [],
      watchlist: [],
      savedCollections: []
    };

    const defaultMovie = movies[0] || MOCK_MOVIES[0];
    const roomTitle = `Yayım Otağı #${watchParties.length + 1}`;
    let backendRoomId = 'wp_' + Date.now();

    try {
      const res = await apiCreateRoom({
        roomName: roomTitle,
        type: 'Movie',
        movieId: defaultMovie.id,
      });
      if (res && res.roomId) {
        backendRoomId = res.roomId;
      }
    } catch (err) {
      console.warn('Backend create room fallback to local state:', err);
    }

    const newParty: WatchParty = {
      id: backendRoomId,
      roomName: roomTitle,
      movieId: defaultMovie.id,
      creator: activeUser.username,
      participants: [
        { id: activeUser.id, name: activeUser.name, avatar: activeUser.avatar }
      ],
      currentTimestamp: 0,
      isPlaying: true,
      chat: [
        {
          id: 'sys_1',
          sender: 'Sistem',
          senderAvatar: '',
          message: `${activeUser.name} tərəfindən "${defaultMovie.title}" yayım otağı yaradıldı! 🍿`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setWatchParties((prev) => [newParty, ...prev]);
    setActiveWatchParty(newParty);
    setCurrentView('watch-party-room');
    setIsCreatingParty(false);
  };

  // Create New Watch Party
  const handleCreateWatchParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim() || !currentUser) return;
    if (!useExternalMovie && !newPartyMovieId) return;

    let finalMovieId = newPartyMovieId;
    let movie = movies.find((m) => m.id === newPartyMovieId);

    if (useExternalMovie) {
      if (!externalMovieTitle.trim()) return;
      const customMovieId = 'm_ext_' + Date.now();
      
      let determinedTrailer = 'https://www.youtube.com/embed/s7EdQ4FqbhY';
      const extUrl = externalMovieUrl.trim();
      
      const youtubeRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const ytMatch = extUrl.match(youtubeRegExp);
      if (ytMatch && ytMatch[2] && ytMatch[2].length === 11) {
        determinedTrailer = `https://www.youtube.com/embed/${ytMatch[2]}`;
      } else if (extUrl) {
        determinedTrailer = extUrl;
      }

      const customMovie: Movie = {
        id: customMovieId,
        title: externalMovieTitle.trim(),
        originalTitle: externalMovieTitle.trim(),
        description: `Xarici platformadan (${externalMovieUrl || 'Kino saytı'}) daxil edilmiş film. Link: ${externalMovieUrl || 'yoxdur'}`,
        poster: externalMoviePoster.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
        rating: 8.5,
        year: new Date().getFullYear(),
        duration: '2saat 00dəq',
        genres: ['Xarici Seçim'],
        director: 'Naməlum',
        cast: [],
        trailerUrl: determinedTrailer,
        externalUrl: extUrl || undefined,
        likes: 1,
        reviews: []
      };

      setMovies((prev) => [customMovie, ...prev]);
      movie = customMovie;
      finalMovieId = customMovieId;
    }

    if (!movie) return;

    let backendRoomId = 'wp_' + Date.now();
    try {
      const res = await apiCreateRoom({
        roomName: newPartyName.trim(),
        type: 'Movie',
        movieId: finalMovieId,
      });
      if (res && res.roomId) {
        backendRoomId = res.roomId;
      }
    } catch (err) {
      console.warn('Backend create room fallback to local state:', err);
    }

    const newParty: WatchParty = {
      id: backendRoomId,
      roomName: newPartyName.trim(),
      movieId: finalMovieId,
      creator: currentUser.username,
      participants: [
        { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }
      ],
      currentTimestamp: 0,
      isPlaying: true,
      chat: [
        {
          id: 'sys_1',
          sender: 'Sistem',
          senderAvatar: '',
          message: `${currentUser.name} tərəfindən "${movie.title}" yayım otağı yaradıldı! 🍿`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setWatchParties((prev) => [newParty, ...prev]);
    setActiveWatchParty(newParty);
    setCurrentView('watch-party-room');
    setShowCreatePartyModal(false);
    
    // Reset states
    setNewPartyName('');
    setNewPartyMovieId('');
    setUseExternalMovie(false);
    setExternalMovieTitle('');
    setExternalMovieUrl('');
    setExternalMoviePoster('');
    setTmdbSearchQuery('');
    setTmdbSearchResults([]);
    setSelectedTmdbMovie(null);
  };

  // Quick Watch Party Creation (e.g. from InviteModal)
  const handleQuickCreateWatchParty = (roomName: string, movieId: string): WatchParty | null => {
    if (!currentUser) return null;
    const movie = movies.find((m) => m.id === movieId);
    if (!movie) return null;

    const newParty: WatchParty = {
      id: 'wp_' + Date.now(),
      roomName: roomName,
      movieId: movieId,
      creator: currentUser.username,
      participants: [
        { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }
      ],
      currentTimestamp: 0,
      isPlaying: true,
      chat: [
        {
          id: 'sys_1',
          sender: 'Sistem',
          senderAvatar: '',
          message: `${currentUser.name} tərəfindən "${movie.title}" yayım otağı yaradıldı! 🍿`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setWatchParties((prev) => [newParty, ...prev]);
    setActiveWatchParty(newParty);
    return newParty;
  };

  // Send Room Invitation (Integrates backend RoomsController.InviteToRoom: POST /api/Rooms/{roomId}/invite/{recipientUserId})
  const handleSendInviteToFriend = async (recipientUserId: string, roomId: string, roomName?: string) => {
    if (!currentUser) return;

    try {
      await apiInviteToRoom(roomId, recipientUserId);
    } catch (err) {
      console.warn('Backend InviteToRoom API notice/fallback:', err);
    }

    const notif: Notification = {
      id: 'notif_invite_' + Date.now(),
      title: 'Watch Party Dəvəti 🍿',
      description: `${currentUser.name} sizi "${roomName || 'Birlikdə Filmin İzlənməsi'}" otağına dəvət etdi!`,
      type: 'party_invite',
      date: 'İndi',
      read: false,
      actionUrl: `/watch-party?room=${roomId}`
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Join Watch Party
  const handleJoinParty = (party: WatchParty) => {
    if (!currentUser) return;

    // Check if already in participants
    const exists = party.participants.some((p) => p.id === currentUser.id);
    let updatedParticipants = [...party.participants];

    if (!exists) {
      updatedParticipants.push({ id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar });
    }

    const updatedParty = {
      ...party,
      participants: updatedParticipants,
      chat: [
        ...party.chat,
        {
          id: 'sys_join_' + Date.now(),
          sender: 'Sistem',
          senderAvatar: '',
          message: `${currentUser.name} otağa qoşuldu.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setWatchParties((prev) => prev.map((p) => (p.id === party.id ? updatedParty : p)));
    setActiveWatchParty(updatedParty);
    setCurrentView('watch-party-room');
  };

  // Handle Review Submission
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || !selectedMovie || !currentUser) return;

    const tempReviewId = 'rev_' + Date.now();
    const newReview: Review = {
      id: tempReviewId,
      movieId: selectedMovie.id,
      movieTitle: selectedMovie.title,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      rating: reviewRating,
      comment: reviewComment.trim(),
      likes: 0,
      dislikes: 0,
      date: 'İndi'
    };

    const updatedReviews = [newReview, ...(selectedMovie.reviews || [])];
    
    // Recalculate movie overall rating average
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = Number((totalRating / updatedReviews.length).toFixed(1));

    const updatedMovie = {
      ...selectedMovie,
      rating: newAverage,
      reviews: updatedReviews
    };

    setMovies((prev) => prev.map((m) => (m.id === selectedMovie.id ? updatedMovie : m)));
    setSelectedMovie(updatedMovie);

    // Append Social Activity
    const newActivity: Activity = {
      id: 'act_' + Date.now(),
      type: 'review',
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      text: `"${selectedMovie.title}" filminə rəy yazdı: "${reviewComment.slice(0, 40)}..."`,
      movieTitle: selectedMovie.title,
      movieId: selectedMovie.id,
      date: 'İndi'
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Gamification reward points for writing a review
    rewardPoints(20, 'Yeni film rəyi yazdığınız üçün');

    const commentText = reviewComment.trim();
    const ratingVal = reviewRating;

    setReviewComment('');
    setReviewRating(10);

    try {
      const realId = await apiCreateMovieReview({
        movieId: selectedMovie.id,
        rating: ratingVal,
        content: commentText,
      });
      if (realId) {
        setSelectedMovie((prev) => {
          if (!prev) return prev;
          const syncedReviews = (prev.reviews || []).map((r) =>
            r.id === tempReviewId ? { ...r, id: realId } : r
          );
          return { ...prev, reviews: syncedReviews };
        });
      }
    } catch (err) {
      console.warn('Backend review create fallback to local state:', err);
    }
  };

  // Handle Like Movie Review
  const handleLikeMovieReview = async (reviewId: string) => {
    if (!selectedMovie) return;
    const updatedReviews = (selectedMovie.reviews || []).map((r) => {
      if (r.id === reviewId) {
        return { ...r, likes: (r.likes || 0) + 1 };
      }
      return r;
    });

    const updatedMovie = {
      ...selectedMovie,
      reviews: updatedReviews
    };

    setMovies((prev) => prev.map((m) => (m.id === selectedMovie.id ? updatedMovie : m)));
    setSelectedMovie(updatedMovie);

    try {
      await apiLikeMovieReview(reviewId);
    } catch (err) {
      console.warn('Backend review like fallback to local state:', err);
    }
  };

  // Handle Dislike Movie Review
  const handleDislikeMovieReview = async (reviewId: string) => {
    if (!selectedMovie) return;
    const updatedReviews = (selectedMovie.reviews || []).map((r) => {
      if (r.id === reviewId) {
        return { ...r, dislikes: (r.dislikes || 0) + 1 };
      }
      return r;
    });

    const updatedMovie = {
      ...selectedMovie,
      reviews: updatedReviews
    };

    setMovies((prev) => prev.map((m) => (m.id === selectedMovie.id ? updatedMovie : m)));
    setSelectedMovie(updatedMovie);

    try {
      await apiDislikeMovieReview(reviewId);
    } catch (err) {
      console.warn('Backend review dislike fallback to local state:', err);
    }
  };

  // Handle Delete Movie Review
  const handleDeleteMovieReview = async (reviewId: string) => {
    if (!selectedMovie) return;
    const updatedReviews = (selectedMovie.reviews || []).filter((r) => r.id !== reviewId);

    // Recalculate movie overall rating average
    let newAverage = selectedMovie.rating;
    if (updatedReviews.length > 0) {
      const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      newAverage = Number((totalRating / updatedReviews.length).toFixed(1));
    } else {
      newAverage = 0;
    }

    const updatedMovie = {
      ...selectedMovie,
      rating: newAverage,
      reviews: updatedReviews
    };

    setMovies((prev) => prev.map((m) => (m.id === selectedMovie.id ? updatedMovie : m)));
    setSelectedMovie(updatedMovie);

    try {
      await apiDeleteMovieReview(reviewId);
    } catch (err) {
      console.warn('Backend review delete fallback to local state:', err);
    }
  };

  // Handle Start Edit Movie Review
  const handleStartEditMovieReview = (review: Review) => {
    setEditingMovieReviewId(review.id);
    setEditingMovieReviewComment(review.comment);
    setEditingMovieReviewRating(review.rating);
  };

  // Handle Save Edit Movie Review
  const handleSaveEditMovieReview = async (reviewId: string) => {
    if (!selectedMovie) return;
    const commentText = editingMovieReviewComment.trim();
    const ratingVal = editingMovieReviewRating;

    const updatedReviews = (selectedMovie.reviews || []).map((r) => {
      if (r.id === reviewId) {
        return { 
          ...r, 
          comment: commentText, 
          rating: ratingVal 
        };
      }
      return r;
    });

    // Recalculate movie overall rating average
    const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const newAverage = Number((totalRating / updatedReviews.length).toFixed(1));

    const updatedMovie = {
      ...selectedMovie,
      rating: newAverage,
      reviews: updatedReviews
    };

    setMovies((prev) => prev.map((m) => (m.id === selectedMovie.id ? updatedMovie : m)));
    setSelectedMovie(updatedMovie);
    setEditingMovieReviewId(null);

    try {
      await apiUpdateMovieReview(reviewId, { rating: ratingVal, content: commentText });
    } catch (err) {
      console.warn('Backend review update fallback to local state:', err);
    }
  };

  // Delete Watch Party Room
  const handleDeleteWatchParty = async (partyId: string) => {
    setWatchParties((prev) => prev.filter((wp) => wp.id !== partyId));
    if (activeWatchParty?.id === partyId) {
      setActiveWatchParty(null);
      setCurrentView('watch-party');
    }
    try {
      await apiDeleteRoom(partyId);
    } catch (err) {
      console.warn('Backend room delete fallback to local state:', err);
    }
  };

  // Close Watch Party Room
  const handleCloseWatchParty = async (partyId: string) => {
    setWatchParties((prev) => prev.filter((wp) => wp.id !== partyId));
    if (activeWatchParty?.id === partyId) {
      setActiveWatchParty(null);
      setCurrentView('watch-party');
    }
    try {
      await apiCloseRoom(partyId);
    } catch (err) {
      console.warn('Backend room close fallback to local state:', err);
    }
  };

  // Create Collection
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim() || !currentUser) return;

    const newCol: Collection = {
      id: 'c_' + Date.now(),
      title: newColTitle.trim(),
      description: newColDesc.trim() || 'Yeni yaradılmış kolleksiya.',
      cover: newColCover.trim() || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      userId: currentUser.id,
      username: currentUser.username,
      likesCount: 0,
      movies: newColMovieIds
    };

    setCollections((prev) => [newCol, ...prev]);
    setShowCreateCollectionModal(false);
    
    // Reset
    setNewColTitle('');
    setNewColDesc('');
    setNewColCover('');
    setNewColMovieIds([]);

    // Append Social Activity
    const newActivity: Activity = {
      id: 'act_' + Date.now(),
      type: 'collection',
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      text: `yeni kolleksiya yaratdı: "${newCol.title}"`,
      collectionName: newCol.title,
      date: 'İndi'
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  // Follow/Unfollow system
  const handleFollowUser = (userId: string) => {
    if (!currentUser) return;

    const userToFollow = users.find((u) => u.id === userId);
    if (!userToFollow) return;

    const isFollowing = currentUser.following.includes(userId);
    let updatedFollowing = [...currentUser.following];
    let targetFollowers = [...userToFollow.followers];

    if (isFollowing) {
      updatedFollowing = updatedFollowing.filter((id) => id !== userId);
      targetFollowers = targetFollowers.filter((id) => id !== currentUser.id);
    } else {
      updatedFollowing.push(userId);
      targetFollowers.push(currentUser.id);

      // Append notification to target user
      const newNotif: Notification = {
        id: 'n_follow_' + Date.now(),
        type: 'follower',
        title: 'Yeni İzləyici',
        description: `@${currentUser.username} sizi izləməyə başladı.`,
        date: 'İndi',
        read: false
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }

    const updatedMe = {
      ...currentUser,
      following: updatedFollowing,
      followingCount: updatedFollowing.length
    };

    const updatedTarget = {
      ...userToFollow,
      followers: targetFollowers,
      followersCount: targetFollowers.length
    };

    setCurrentUser(updatedMe);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) return updatedMe;
        if (u.id === userId) return updatedTarget;
        return u;
      })
    );

    if (selectedProfileUser && selectedProfileUser.id === userId) {
      setSelectedProfileUser(updatedTarget);
    }
  };

  // User Profile Navigation helpers
  const navigateToUserProfileById = (userId: string) => {
    if (!currentUser) return;
    if (userId === currentUser.id) {
      setSelectedProfileUser(null);
    } else {
      const foundUser = users.find(u => u.id === userId);
      if (foundUser) {
        setSelectedProfileUser(foundUser);
      }
    }
    setCurrentView('profile');
  };

  const navigateToUserProfileByUsername = (username: string) => {
    if (!currentUser) return;
    const usernameClean = username.replace('@', '').trim().toLowerCase();
    if (usernameClean === currentUser.username.toLowerCase()) {
      setSelectedProfileUser(null);
    } else {
      const foundUser = users.find(u => u.username.toLowerCase() === usernameClean);
      if (foundUser) {
        setSelectedProfileUser(foundUser);
      }
    }
    setCurrentView('profile');
  };

  // Filter movies for Movies Grid page
  const filteredMoviesList = movies.filter((m) => {
    const matchesSearch = 
      m.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
      m.originalTitle.toLowerCase().includes(movieSearch.toLowerCase()) ||
      m.director.toLowerCase().includes(movieSearch.toLowerCase());
    
    const matchesGenre = selectedGenre === 'Hamsı' || m.genres.includes(selectedGenre);
    
    let matchesYear = true;
    if (selectedYear !== 'Hamsı') {
      if (selectedYear === '2020+') matchesYear = m.year >= 2020;
      else if (selectedYear === '2010s') matchesYear = m.year >= 2010 && m.year < 2020;
      else if (selectedYear === '2000s') matchesYear = m.year >= 2000 && m.year < 2010;
      else if (selectedYear === 'Köhnə') matchesYear = m.year < 2000;
    }

    let matchesRating = true;
    if (selectedRating !== 'Hamsı') {
      const minRat = Number(selectedRating);
      matchesRating = m.rating >= minRat;
    }

    return matchesSearch && matchesGenre && matchesYear && matchesRating;
  }).sort((a, b) => {
    if (selectedSort === 'rating-desc') return b.rating - a.rating;
    if (selectedSort === 'year-desc') return b.year - a.year;
    if (selectedSort === 'likes-desc') return b.likes - a.likes;
    return 0;
  });

  // Global search filtering for instant results popup / query focus
  const searchResults = movies.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.originalTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#08080a] text-white' : 'bg-[#fafafa] text-zinc-950'
    }`}>
      
      {/* 1. Auth Page Guard */}
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="auth-guard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full h-full"
          >
            <LoginRegister onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        ) : (
          <motion.div
            key="app-shell"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col h-screen overflow-hidden"
          >
          
          {/* Top Navbar */}
          {!isCinemaMode && (
            <Navbar 
              user={currentUser}
              onLogout={handleLogout}
              currentView={currentView}
              setCurrentView={setCurrentView}
              isAdminMode={isAdminMode}
              setIsAdminMode={setIsAdminMode}
              notifications={notifications}
              setNotifications={setNotifications}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              theme={theme}
              toggleTheme={toggleTheme}
              onSearchFocus={() => setCurrentView('movies')}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
            />
          )}

          <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar Navigation */}
            {!isCinemaMode && (
              <Sidebar 
                currentView={currentView}
                setCurrentView={setCurrentView}
                isAdminMode={isAdminMode}
                setIsAdminMode={setIsAdminMode}
                user={currentUser}
                theme={theme}
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                onOpenPremiumModal={() => setShowPremiumModal(true)}
              />
            )}

            {/* Main scrollable content view */}
            <main 
              onScroll={(e) => setMainScrollY(e.currentTarget.scrollTop)}
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative"
            >
              
              {/* Overlay Advanced Search panel if user is typing query */}
              {searchQuery.trim().length > 0 && (
                <div className={`absolute inset-0 z-30 p-6 backdrop-blur-xl overflow-y-auto ${
                  theme === 'dark' ? 'bg-zinc-950/95 text-white' : 'bg-white/95 text-zinc-900'
                }`}>
                  <div className="max-w-5xl mx-auto space-y-8 pb-12">
                    <div className="flex justify-between items-center border-b border-zinc-800/10 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-red-600/10 text-red-500 rounded-xl">
                          <Search className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold font-sans">
                            Axtarış Nəticələri: <span className="text-red-500 font-bold">"{searchQuery}"</span>
                          </h2>
                          <p className="text-xs text-zinc-400">Filmlər, kitablar, istifadəçilər, kolleksiyalar və müzakirələr üzrə global axtarış</p>
                        </div>
                        {isSearching && (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500 ml-2" />
                        )}
                      </div>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-2 rounded-xl bg-zinc-800/10 hover:bg-zinc-800/20 cursor-pointer text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <X className="w-4 h-4" /> Bağla
                      </button>
                    </div>

                    {/* 1. USERS SECTION */}
                    {globalSearchResults && globalSearchResults.users && globalSearchResults.users.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-red-500 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" /> İstifadəçilər ({globalSearchResults.users.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {globalSearchResults.users.map((u) => (
                            <div
                              key={u.id}
                              onClick={() => {
                                const foundUser = users.find(x => x.id === u.id) || {
                                  id: u.id,
                                  name: u.userName,
                                  username: u.userName,
                                  avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                                  email: `${u.userName}@cineverse.com`,
                                  role: 'user',
                                  bio: 'CineVerse üzvü',
                                  followersCount: 0,
                                  followingCount: 0,
                                  following: [],
                                  followers: [],
                                  favorites: [],
                                  watchlist: [],
                                  savedCollections: []
                                };
                                setSelectedProfileUser(foundUser as User);
                                setCurrentView('profile');
                                setSearchQuery('');
                              }}
                              className={`flex items-center gap-3 p-2.5 rounded-2xl border cursor-pointer transition hover:scale-[1.02] ${
                                theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/60 hover:border-red-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-red-500/30'
                              }`}
                            >
                              <img src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} alt={u.userName} className="w-9 h-9 rounded-full object-cover border border-red-500/20" />
                              <div className="overflow-hidden">
                                <span className="text-xs font-bold block truncate">@{u.userName}</span>
                                <span className="text-[10px] text-zinc-400">İstifadəçi Profili</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. MOVIES SECTION */}
                    {((globalSearchResults?.movies && globalSearchResults.movies.length > 0) || searchResults.length > 0) && (
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-red-500 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5" /> Filmlər ({globalSearchResults?.movies?.length || searchResults.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {(globalSearchResults?.movies && globalSearchResults.movies.length > 0 ? globalSearchResults.movies : searchResults).map((movie: any) => {
                            const matchedLocal = movies.find(m => m.id === movie.id || m.title.toLowerCase() === movie.title?.toLowerCase());
                            return (
                              <div
                                key={movie.id}
                                onClick={() => { 
                                  setSelectedMovie(matchedLocal || movie); 
                                  setCurrentView('movie-details'); 
                                  setSearchQuery(''); 
                                }}
                                className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-105 hover:border-red-500/30 ${
                                  theme === 'dark' ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-zinc-200'
                                }`}
                              >
                                <img src={movie.poster || movie.cover || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&auto=format&fit=crop&q=80'} alt={movie.title} className="w-full h-44 object-cover" />
                                <div className="p-2.5">
                                  <h4 className="font-bold text-xs truncate group-hover:text-red-500 transition">{movie.title}</h4>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">{movie.year || 'Film'} • ★ {movie.rating || 8.0}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. BOOKS SECTION */}
                    {((globalSearchResults?.books && globalSearchResults.books.length > 0) || books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase())).length > 0) && (
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Kitablar ({(globalSearchResults?.books?.length || books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase())).length)})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {(globalSearchResults?.books && globalSearchResults.books.length > 0 
                            ? globalSearchResults.books 
                            : books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase()))
                          ).map((book: any) => (
                            <div
                              key={book.id}
                              onClick={() => {
                                setSelectedBookIdForModal(book.id);
                                setCurrentView('books');
                                setSearchQuery('');
                              }}
                              className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-105 hover:border-amber-500/30 ${
                                theme === 'dark' ? 'bg-zinc-900 border-zinc-850' : 'bg-white border-zinc-200'
                              }`}
                            >
                              <img src={book.cover || book.poster || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&auto=format&fit=crop&q=80'} alt={book.title} className="w-full h-44 object-cover" />
                              <div className="p-2.5">
                                <h4 className="font-bold text-xs truncate group-hover:text-amber-500 transition">{book.title}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{book.author || 'Müəllif'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. MOVIE COLLECTIONS SECTION */}
                    {((globalSearchResults?.movieCollections && globalSearchResults.movieCollections.length > 0) || collections.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0) && (
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-500 flex items-center gap-1.5">
                          <Grid className="w-3.5 h-3.5" /> Film Kolleksiyaları ({(globalSearchResults?.movieCollections?.length || collections.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length)})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(globalSearchResults?.movieCollections && globalSearchResults.movieCollections.length > 0 
                            ? globalSearchResults.movieCollections 
                            : collections.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          ).map((col: any) => (
                            <div
                              key={col.id}
                              onClick={() => {
                                setCurrentView('shared-playlists');
                                setSearchQuery('');
                              }}
                              className={`p-3 rounded-2xl border cursor-pointer transition hover:scale-[1.02] ${
                                theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/60 hover:border-emerald-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-emerald-500/30'
                              }`}
                            >
                              <div className="h-28 rounded-xl overflow-hidden mb-2 bg-zinc-950 relative">
                                <img src={col.coverImageUrl || col.cover || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80'} alt={col.name || col.title} className="w-full h-full object-cover" />
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md text-[9px] text-white rounded font-bold font-mono">
                                  {col.movieCount ?? col.movies?.length ?? 0} FİLM
                                </span>
                              </div>
                              <h4 className="font-bold text-xs truncate">{col.name || col.title}</h4>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. BOOK COLLECTIONS SECTION */}
                    {((globalSearchResults?.bookCollections && globalSearchResults.bookCollections.length > 0) || bookCollections.filter(bc => bc.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0) && (
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-purple-500 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> Kitab Kolleksiyaları ({(globalSearchResults?.bookCollections?.length || bookCollections.filter(bc => bc.title.toLowerCase().includes(searchQuery.toLowerCase())).length)})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(globalSearchResults?.bookCollections && globalSearchResults.bookCollections.length > 0 
                            ? globalSearchResults.bookCollections 
                            : bookCollections.filter(bc => bc.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          ).map((bc: any) => (
                            <div
                              key={bc.id}
                              onClick={() => {
                                setCurrentView('books');
                                setSearchQuery('');
                              }}
                              className={`p-3 rounded-2xl border cursor-pointer transition hover:scale-[1.02] ${
                                theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/60 hover:border-purple-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-purple-500/30'
                              }`}
                            >
                              <div className="h-28 rounded-xl overflow-hidden mb-2 bg-zinc-950 relative">
                                <img src={bc.cover || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&auto=format&fit=crop&q=80'} alt={bc.title} className="w-full h-full object-cover" />
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md text-[9px] text-white rounded font-bold font-mono">
                                  {bc.bookCount ?? bc.books?.length ?? 0} KİTAB
                                </span>
                              </div>
                              <h4 className="font-bold text-xs truncate">{bc.title}</h4>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. DISCUSSIONS / FORUM SECTION */}
                    {((globalSearchResults?.discussions && globalSearchResults.discussions.length > 0) || discussions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0) && (
                      <div className="space-y-3">
                        <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-blue-500 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Müzakirələr (Forum) ({(globalSearchResults?.discussions?.length || discussions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase())).length)})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(globalSearchResults?.discussions && globalSearchResults.discussions.length > 0 
                            ? globalSearchResults.discussions 
                            : discussions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
                          ).map((disc: any) => (
                            <div
                              key={disc.id}
                              onClick={() => {
                                setCurrentView('forum');
                                setSearchQuery('');
                              }}
                              className={`p-3.5 rounded-2xl border cursor-pointer transition hover:scale-[1.01] ${
                                theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/60 hover:border-blue-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-blue-500/30'
                              }`}
                            >
                              <h4 className="font-bold text-xs line-clamp-1 mb-1 hover:text-blue-500 transition">{disc.title}</h4>
                              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                                <span>@{disc.author || 'İstifadəçi'}</span>
                                <span>💬 {disc.commentsCount ?? disc.replies?.length ?? 0} Şərh</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EMPTY SEARCH STATE */}
                    {(!globalSearchResults || (
                      (!globalSearchResults.users || globalSearchResults.users.length === 0) &&
                      (!globalSearchResults.movies || globalSearchResults.movies.length === 0) &&
                      (!globalSearchResults.books || globalSearchResults.books.length === 0) &&
                      (!globalSearchResults.movieCollections || globalSearchResults.movieCollections.length === 0) &&
                      (!globalSearchResults.bookCollections || globalSearchResults.bookCollections.length === 0) &&
                      (!globalSearchResults.discussions || globalSearchResults.discussions.length === 0)
                    )) && searchResults.length === 0 && (
                      <div className="text-center py-16 text-zinc-500 text-sm space-y-2">
                        <SearchX className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                        <p className="font-bold text-zinc-400">Heç bir uyğun nəticə tapılmadı</p>
                        <p className="text-xs text-zinc-500">Filmlər, kitablar, istifadəçilər və ya müzakirələr üçün başqa açar söz sınayın.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------- RENDER ACTIVE VIEW ----------------- */}
              <AnimatePresence mode="wait">
              
              {/* A. HOME VIEW */}
              {currentView === 'home' && !isAdminMode && (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-10"
                >
                  {isViewLoading ? (
                    <div className="space-y-10">
                      <HeroBannerSkeleton />
                      <div className="space-y-4">
                        <div className="h-6 w-48 bg-zinc-800/60 rounded-md animate-shimmer" />
                        <MovieGridSkeleton count={6} />
                      </div>
                    </div>
                  ) : (
                    <>
                  {/* Hero Trending Banner */}
                  <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[250px] shadow-2xl group border border-zinc-900">
                    <img 
                      src={movies[0].banner} 
                      alt={movies[0].title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/30" />
                    
                    <div className="absolute bottom-0 left-0 p-6 sm:p-10 space-y-3 max-w-2xl z-10 text-white">
                      <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full tracking-wider uppercase flex items-center gap-1 w-max">
                        <Sparkles className="w-3 h-3 fill-white" /> HƏFTƏNİN TRENDİ
                      </span>
                      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans">
                        {movies[0].title}
                      </h1>
                      <p className="text-zinc-300 text-xs sm:text-sm line-clamp-2 font-sans leading-relaxed">
                        {movies[0].description}
                      </p>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <button
                          onClick={() => { setSelectedMovie(movies[0]); setCurrentView('movie-details'); }}
                          className="flex items-center gap-2 py-2.5 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/20 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-white text-white" /> Ətraflı Bax
                        </button>
                        <button
                          onClick={() => toggleWatchlist(movies[0].id)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer ${
                            currentUser.watchlist.includes(movies[0].id)
                              ? 'bg-red-600/20 border-red-500 text-red-500'
                              : 'bg-black/35 border-zinc-800 text-white hover:bg-black/55'
                          }`}
                        >
                          <Bookmark className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid Content: Movies + Social Sidebar */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Left Movies Panel */}
                    <div className="lg:col-span-3 space-y-10">

                      {/* Section AI: Sənə Özəl Təkliflər (Sənin üçün seçilmiş) */}
                      <div className={`space-y-4 p-6 rounded-3xl border relative overflow-hidden shadow-xl transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-red-600/5 to-zinc-950 border-red-500/15'
                          : 'bg-gradient-to-br from-red-500/5 to-white border-red-500/20'
                      }`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-red-600/10 rounded-2xl border border-red-500/10">
                              <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
                            </div>
                            <div>
                              <h2 className="text-base font-bold tracking-tight">Sənin üçün Seçilmişlər</h2>
                              <p className={`text-[10px] font-medium leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                {currentUser.favorites.length === 0 && currentUser.watchlist.length === 0 
                                  ? 'Bəzi filmləri sevimliyə əlavə edərək film zövqünüzü daha da dəqiqləşdirin!' 
                                  : 'Sevdiyniz janrlara və rejissorlara əsaslanan süni intellekt bələdçi tövsiyələri'}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-red-550/10 border border-red-500/15 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-full font-mono animate-pulse w-max">
                            CineAI Aktivdir
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {getAIRecommendations().map(({ movie, reason }, index) => (
                            <motion.div
                              key={`rec_${movie.id}`}
                              onClick={() => { setSelectedMovie(movie); setCurrentView('movie-details'); }}
                              initial={{ opacity: 0, x: index % 2 === 0 ? -45 : 45, y: 25, scale: 0.94 }}
                              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                              className={`group cursor-pointer p-2.5 rounded-2xl transition duration-300 hover:scale-[1.02] border ${
                                theme === 'dark' ? 'bg-zinc-900/40 border-white/5 hover:border-red-500/20' : 'bg-zinc-50 border-zinc-150 hover:border-red-550/20'
                              }`}
                            >
                              <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-zinc-850/10 shadow-lg">
                                <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                                  ★ {movie.rating}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-xs p-1.5 text-center text-[9px] font-bold text-red-400 line-clamp-2">
                                  {reason}
                                </div>
                              </div>
                              <div className="mt-2.5">
                                <h3 className="font-bold text-xs truncate group-hover:text-red-500 transition">{movie.title}</h3>
                                <div className="flex items-center justify-between gap-1 mt-1">
                                  <p className="text-[10px] text-zinc-500 truncate">{movie.year} • {movie.genres[0]}</p>
                                  <span className="text-[8px] font-mono bg-red-650/10 text-red-400 px-1 py-0.2 rounded truncate max-w-[65px]" title={reason}>
                                    AI Tövsiyə
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Section 1: Populyar Filmlər */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold tracking-tight">Populyar Filmlər</h2>
                          <button onClick={() => setCurrentView('movies')} className="text-xs font-semibold text-red-500 hover:underline cursor-pointer">Hamsına bax</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {movies.slice(0, 4).map((movie, index) => (
                            <motion.div
                              key={movie.id}
                              onClick={() => { setSelectedMovie(movie); setCurrentView('movie-details'); }}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.1 }}
                              transition={{ duration: 0.4, delay: (index % 8) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                              className="group cursor-pointer space-y-2 relative rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] hover:shadow-2xl hover:z-10"
                            >
                              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800/10 shadow-lg">
                                <LazyImage src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-amber-500 flex items-center gap-0.5 z-20">
                                  ★ {movie.rating}
                                </div>
                                {/* Poster Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-end p-3 pointer-events-none z-10">
                                  <span className="text-[9px] font-bold text-red-500 tracking-wider uppercase">{movie.genres[0]}</span>
                                  <h3 className="font-extrabold text-xs text-white truncate">{movie.title}</h3>
                                  <p className="text-[10px] text-amber-400 font-bold mt-0.5">★ {movie.rating} • {movie.year}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-xs truncate group-hover:text-red-500 transition-colors duration-200">{movie.title}</h3>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{movie.year} • {movie.genres[0]}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Ən Çox Bəyənilənlər */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold tracking-tight font-sans">Ən Yaxşı Reytinqlilər</h2>
                          <button onClick={() => setCurrentView('movies')} className="text-xs font-semibold text-red-500 hover:underline cursor-pointer">Hamsına bax</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {movies.slice().sort((a, b) => b.rating - a.rating).slice(0, 4).map((movie, index) => (
                            <motion.div
                              key={movie.id}
                              onClick={() => { setSelectedMovie(movie); setCurrentView('movie-details'); }}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.1 }}
                              transition={{ duration: 0.4, delay: (index % 8) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                              className="group cursor-pointer space-y-2 relative rounded-2xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] hover:shadow-2xl hover:z-10"
                            >
                              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800/10 shadow-lg">
                                <LazyImage src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-amber-500 flex items-center gap-0.5 z-20">
                                  ★ {movie.rating}
                                </div>
                                {/* Poster Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-end p-3 pointer-events-none z-10">
                                  <span className="text-[9px] font-bold text-red-500 tracking-wider uppercase">{movie.genres[0]}</span>
                                  <h3 className="font-extrabold text-xs text-white truncate">{movie.title}</h3>
                                  <p className="text-[10px] text-amber-400 font-bold mt-0.5">★ {movie.rating} • {movie.year}</p>
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-xs truncate group-hover:text-red-500 transition-colors duration-200">{movie.title}</h3>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{movie.year} • {movie.genres[0]}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Popular User Collections */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-bold tracking-tight">Populyar İcma Kolleksiyaları</h2>
                          <button
                            onClick={() => setShowCreateCollectionModal(true)}
                            className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:underline cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Kolleksiya Yarat
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {collections.map((col, index) => (
                            <motion.div
                              key={col.id}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.1 }}
                              transition={{ duration: 0.4, delay: (index % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                              className={`p-4 rounded-3xl border relative overflow-hidden group shadow-md transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] hover:shadow-2xl hover:z-10 hover:border-red-500/30 ${
                                theme === 'dark' ? 'bg-zinc-900/60 border-zinc-850' : 'bg-white border-zinc-200'
                              }`}
                            >
                              <div className="aspect-video rounded-2xl overflow-hidden mb-3 relative bg-zinc-950">
                                <LazyImage src={col.cover} alt={col.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/70 transition-colors duration-200" />
                                <span className="absolute bottom-2 left-2 px-2.5 py-0.5 bg-black/70 backdrop-blur-md text-[10px] text-white rounded font-bold font-mono z-10 border border-white/10">
                                  {col.movies.length} FİLM
                                </span>
                              </div>
                              <h3 className="font-bold text-xs truncate group-hover:text-red-500 transition-colors duration-200">{col.title}</h3>
                              <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1 leading-relaxed">{col.description}</p>
                              
                              <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-zinc-800/10 text-[10px] text-zinc-500">
                                <span>@{col.username} tərəfindən</span>
                                <button className="flex items-center gap-1 text-red-500 font-semibold hover:scale-105 transition">
                                  ❤ {col.likesCount} Bəyəni
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Social Activity Feed */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className={`p-5 rounded-3xl border shadow-lg ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-4.5 h-4.5 text-red-500" />
                          <h3 className="font-bold text-sm tracking-tight">Sosial Aktivlik Axını</h3>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                          {activities.map((act) => (
                            <div key={act.id} className="flex gap-3 text-xs leading-normal">
                              <img 
                                src={act.userAvatar} 
                                alt={act.username} 
                                className="w-8.5 h-8.5 rounded-full object-cover ring-2 ring-red-550/10 mt-0.5 cursor-pointer hover:opacity-85 transition" 
                                onClick={() => navigateToUserProfileByUsername(act.username)}
                              />
                              <div className="flex-1 space-y-1">
                                <p 
                                  className={`font-bold text-xs cursor-pointer hover:text-red-500 transition inline-block ${
                                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-900'
                                  }`}
                                  onClick={() => navigateToUserProfileByUsername(act.username)}
                                >
                                  @{act.username}
                                </p>
                                <p className={`text-[11px] font-medium leading-tight ${
                                  theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'
                                }`}>{act.text}</p>
                                <span className={`text-[9px] font-mono block ${
                                  theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500 font-semibold'
                                }`}>{act.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live platform statistics widget */}
                      <div className={`p-5 rounded-3xl border ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h4 className={`font-bold text-xs uppercase tracking-wider mb-3 ${
                          theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700 font-extrabold'
                        }`}>CineVerse Platforma Statistikası</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700 font-medium'}>Hazırda Onlayn</span>
                            <span className="font-bold text-emerald-500 font-mono flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                              {platformStats.onlineCount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700 font-medium'}>Ümumi Rəylər</span>
                            <span className={`font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{platformStats.totalReviews.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700 font-medium'}>Aktiv İzləmə Otağı</span>
                            <span className="font-bold font-mono text-red-600">{platformStats.activeRoomsCount} Aktiv</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                  </>
                  )}
                </motion.div>
              )}

              {/* B. MOVIES VIEW */}
              {currentView === 'movies' && !isAdminMode && (
                <motion.div
                  key="movies"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-6"
                >
                  
                  {/* Filter controls container */}
                  <div className={`p-5 rounded-3xl border space-y-4 ${
                    theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/10">
                      <Filter className="w-4 h-4 text-red-500" />
                      <h3 className="font-bold text-sm">Təkmil Axtarış və Filtrlər</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {/* Input name Search */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Axtarış</label>
                        <input
                          type="text"
                          value={movieSearch}
                          onChange={(e) => setMovieSearch(e.target.value)}
                          placeholder="Film, rejissor..."
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-100 border-zinc-200 text-zinc-950'
                          }`}
                        />
                      </div>

                      {/* Category Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Janr</label>
                        <select
                          value={selectedGenre}
                          onChange={(e) => setSelectedGenre(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-100 border-zinc-200 text-zinc-950'
                          }`}
                        >
                          <option value="Hamsı">Hamsı Janrlar</option>
                          <option value="Elmi-Fantastika">Elmi-Fantastika</option>
                          <option value="Dram">Dram</option>
                          <option value="Triller">Triller</option>
                          <option value="Macəra">Macəra</option>
                          <option value="Komediya">Komediya</option>
                          <option value="Aksiyon">Aksiyon</option>
                          <option value="Animasiya">Animasiya</option>
                          <option value="Fentezi">Fentezi</option>
                        </select>
                      </div>

                      {/* Release year filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tarix</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-100 border-zinc-200 text-zinc-950'
                          }`}
                        >
                          <option value="Hamsı">İllər Hamsı</option>
                          <option value="2020+">2020 və sonrası</option>
                          <option value="2010s">2010 - 2019</option>
                          <option value="2000s">2000 - 2009</option>
                          <option value="Köhnə">Köhnə Filmlər</option>
                        </select>
                      </div>

                      {/* Rating filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reytinq</label>
                        <select
                          value={selectedRating}
                          onChange={(e) => setSelectedRating(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-100 border-zinc-200 text-zinc-950'
                          }`}
                        >
                          <option value="Hamsı">Reytinq Hamsı</option>
                          <option value="8.5">★ 8.5+</option>
                          <option value="8.0">★ 8.0+</option>
                          <option value="7.5">★ 7.5+</option>
                        </select>
                      </div>

                      {/* Sorting filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sırala</label>
                        <select
                          value={selectedSort}
                          onChange={(e) => setSelectedSort(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-100 border-zinc-200 text-zinc-950'
                          }`}
                        >
                          <option value="rating-desc">Ən Yaxşı Reytinq</option>
                          <option value="year-desc">Ən Yeni Filmlər</option>
                          <option value="likes-desc">Ən Populyar (Bəyəni)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Movie Grid Layout */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs text-zinc-500 px-1">
                      <span>Tapılan Filmlər: <strong className="font-bold">{filteredMoviesList.length} ədəd</strong></span>
                    </div>

                    {isViewLoading || isMoviesFilterLoading ? (
                      <MovieGridSkeleton count={12} />
                    ) : filteredMoviesList.length === 0 ? (
                      <EmptyState
                        icon={SearchX}
                        title="Nəticə Tapılmadı"
                        description="Axtardığınız sözə və ya seçilmiş filtrlərə uyğun heç bir film tapılmadı. Filtrləri sıfırlayaraq yenidən cəhd edin."
                        actionLabel="Filtrləri Sıfırla"
                        actionIcon={RotateCcw}
                        onAction={() => {
                          setMovieSearch('');
                          setSelectedGenre('Hamsı');
                          setSelectedYear('Hamsı');
                          setSelectedRating('Hamsı');
                          setSelectedSort('rating-desc');
                        }}
                        theme={theme}
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredMoviesList.map((movie, index) => (
                          <motion.div
                            key={movie.id}
                            onClick={() => { setSelectedMovie(movie); setCurrentView('movie-details'); }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.4, delay: (index % 10) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                            className="group cursor-pointer space-y-2.5 relative transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] hover:shadow-2xl hover:z-10 rounded-3xl"
                          >
                            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden border border-zinc-800/10 shadow-lg">
                              <LazyImage src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                              <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-xs px-2.5 py-0.5 rounded-xl text-[10px] font-bold text-amber-500 flex items-center gap-0.5 shadow-md z-20">
                                ★ {movie.rating}
                              </div>

                              {/* Hover details box with gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-end p-4 z-10 space-y-2">
                                <span className="text-[9px] font-bold text-red-500 tracking-wider uppercase">{movie.genres.slice(0, 2).join(' • ')}</span>
                                <h3 className="font-extrabold text-xs text-white truncate">{movie.title}</h3>
                                <p className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">{movie.description}</p>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={(e) => toggleLike(movie.id, e)}
                                    title="Bəyən"
                                    className={`p-1.5 rounded-lg border transition ${
                                      (currentUser?.likedMovies || []).includes(movie.id) ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-800 text-white'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => toggleFavorite(movie.id, e)}
                                    title="Sevimlilərə Əlavə Et"
                                    className={`p-1.5 rounded-lg border transition ${
                                      currentUser?.favorites.includes(movie.id) ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-800 text-white'
                                    }`}
                                  >
                                    <Heart className="w-3.5 h-3.5 fill-transparent" />
                                  </button>
                                  <button
                                    onClick={(e) => toggleWatchlist(movie.id, e)}
                                    title="İzləmə Siyahısına Əlavə Et"
                                    className={`p-1.5 rounded-lg border transition ${
                                      currentUser?.watchlist.includes(movie.id) ? 'bg-red-600/20 border-red-500 text-red-500' : 'bg-zinc-900 border-zinc-800 text-white'
                                    }`}
                                  >
                                    <Bookmark className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-bold text-xs truncate group-hover:text-red-500 transition">{movie.title}</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">{movie.year} • {movie.genres[0]}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* C. FAVORITES VIEW */}
              {currentView === 'favorites' && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Sevimlilərim</h1>
                      <p className="text-sm text-zinc-500 mt-1">Daim bəyəndiyiniz sevimli film və kitab kolleksiyanız.</p>
                    </div>

                    {/* Tabs for Movies / Books */}
                    <div className={`flex p-1 rounded-2xl border w-fit ${
                      theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                    }`}>
                      <button
                        onClick={() => setFavTab('movies')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          favTab === 'movies'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Filmlər ({currentUser?.favorites?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => setFavTab('books')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          favTab === 'books'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Kitablar ({currentUser?.favoriteBooks?.length || 0})</span>
                      </button>
                    </div>
                  </div>

                  {isViewLoading ? (
                    <MovieGridSkeleton count={6} />
                  ) : favTab === 'movies' ? (
                    (!currentUser || (currentUser.favorites || []).length === 0) ? (
                      <EmptyState
                        icon={Heart}
                        title="Sevimli Filmlər Siyahısı Boşdur"
                        description="Hələ ki heç bir filmi sevimlilərə əlavə etməmisiniz. Bəyəndiyiniz filmlərdəki ürək ikonuna basaraq kolleksiyanızı zənginləşdirin."
                        actionLabel="Filmləri Kəşf Et"
                        actionIcon={Film}
                        onAction={() => setCurrentView('movies')}
                        theme={theme}
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {movies.filter((m) => currentUser?.favorites?.includes(m.id)).map((movie, index) => (
                          <motion.div
                            key={movie.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.4, delay: (index % 8) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                            className="group space-y-2 relative"
                          >
                            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden border border-zinc-800/10 shadow-lg cursor-pointer" onClick={() => { setSelectedMovie(movie); setCurrentView('movie-details'); }}>
                              <LazyImage src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              <button
                                onClick={(e) => toggleFavorite(movie.id, e)}
                                className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-md hover:bg-red-500 transition cursor-pointer"
                                title="Sevimlilərdən Çıxar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div>
                              <h3 className="font-bold text-xs truncate">{movie.title}</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">{movie.year} • ★ {movie.rating}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  ) : (
                    (!currentUser || (currentUser.favoriteBooks || []).length === 0) ? (
                      <EmptyState
                        icon={BookOpen}
                        title="Sevimli Kitablar Siyahısı Boşdur"
                        description="Hələ ki heç bir kitabı sevimlilərə əlavə etməmisiniz. Bəyəndiyiniz kitabların üzərindəki ürək ikonuna basaraq kolleksiyanıza əlavə edə bilərsiniz."
                        actionLabel="Kitabları Kəşf Et"
                        actionIcon={BookOpen}
                        onAction={() => setCurrentView('books')}
                        theme={theme}
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {books.filter((b) => currentUser?.favoriteBooks?.includes(b.id)).map((book, index) => (
                          <motion.div
                            key={book.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.4, delay: (index % 8) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                            className="group space-y-2 relative"
                          >
                            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden border border-zinc-800/10 shadow-lg cursor-pointer" onClick={() => { setActiveBookIdForReader(book.id); setCurrentView('books'); }}>
                              <LazyImage src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              <button
                                onClick={(e) => toggleBookFavorite(book.id, e)}
                                className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-md hover:bg-red-500 transition cursor-pointer"
                                title="Sevimlilərdən Çıxar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div>
                              <h3 className="font-bold text-xs truncate">{book.title}</h3>
                              <p className="text-[10px] text-zinc-500 mt-0.5">{book.author} • ★ {book.rating}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  )}
                </motion.div>
              )}

              {/* D. WATCHLIST VIEW */}
              {currentView === 'watchlist' && (
                <motion.div
                  key="watchlist"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">İzləmə və Oxuma Siyahısı</h1>
                      <p className="text-sm text-zinc-500 mt-1">Daha sonra izləmək və ya oxumaq üçün saxladığınız kontentlər.</p>
                    </div>

                    {/* Tabs for Movies / Books */}
                    <div className={`flex p-1 rounded-2xl border w-fit ${
                      theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                    }`}>
                      <button
                        onClick={() => setWatchlistTab('movies')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          watchlistTab === 'movies'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Filmlər ({currentUser?.watchlist?.length || 0})</span>
                      </button>
                      <button
                        onClick={() => setWatchlistTab('books')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          watchlistTab === 'books'
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Kitablar ({currentUser?.watchlistBooks?.length || 0})</span>
                      </button>
                    </div>
                  </div>

                  {isViewLoading ? (
                    <MovieGridSkeleton count={6} />
                  ) : watchlistTab === 'movies' ? (
                    (!currentUser || (currentUser.watchlist || []).length === 0) ? (
                      <EmptyState
                        icon={Bookmark}
                        title="Film Siyahısı Boşdur"
                        description="İzləməyi planlaşdırdığınız heç bir film yoxdur. Filmlərin üzərindəki əlfəcin (bookmark) ikonuna klikləyərək bura əlavə edə bilərsiniz."
                        actionLabel="Kəşf Etməyə Başla"
                        actionIcon={Film}
                        onAction={() => setCurrentView('movies')}
                        theme={theme}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {movies.filter((m) => currentUser?.watchlist?.includes(m.id)).map((movie, index) => (
                          <motion.div
                            key={movie.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.1 }}
                            transition={{ duration: 0.4, delay: (index % 8) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                            className={`p-4 rounded-3xl border flex gap-4 transition hover:border-red-500/20 ${
                              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-850' : 'bg-white border-zinc-200'
                            }`}
                          >
                            <div className="w-20 h-28 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer" onClick={() => { setSelectedMovie(movie); setCurrentView('movie-details'); }}>
                              <LazyImage 
                                src={movie.poster} 
                                alt={movie.title} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h3 
                                    className="font-bold text-xs hover:text-red-500 transition cursor-pointer"
                                    onClick={() => { setSelectedMovie(movie); setCurrentView('movie-details'); }}
                                  >
                                    {movie.title}
                                  </h3>
                                  <button
                                    onClick={() => toggleWatchlist(movie.id)}
                                    className="text-zinc-500 hover:text-red-500 transition cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{movie.year} • ★ {movie.rating}</p>
                                <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-normal">{movie.description}</p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-zinc-500">
                                  <span>İzləmə Gedişatı</span>
                                  <span className="font-bold">Hələ başlanmayıb</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-800/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-600 rounded-full w-0" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  ) : (
                    (!currentUser || (currentUser.watchlistBooks || []).length === 0) ? (
                      <EmptyState
                        icon={Bookmark}
                        title="Oxuma Siyahısı Boşdur"
                        description="Oxumağı planlaşdırdığınız heç bir kitab yoxdur. Kitablar bölməsində kitabların üzərindəki əlfəcin (bookmark) ikonuna klikləyərək əlavə edin."
                        actionLabel="Kitabları Kəşf Et"
                        actionIcon={BookOpen}
                        onAction={() => setCurrentView('books')}
                        theme={theme}
                      />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {books.filter((b) => currentUser?.watchlistBooks?.includes(b.id)).map((book, index) => {
                          const progress = currentUser?.readingProgress?.[book.id] || 0;
                          return (
                            <motion.div
                              key={book.id}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, amount: 0.1 }}
                              transition={{ duration: 0.4, delay: (index % 8) * 0.07, ease: [0.16, 1, 0.3, 1] }}
                              className={`p-4 rounded-3xl border flex gap-4 transition hover:border-amber-500/20 ${
                                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-850' : 'bg-white border-zinc-200'
                              }`}
                            >
                              <div className="w-20 h-28 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer" onClick={() => { setActiveBookIdForReader(book.id); setCurrentView('books'); }}>
                                <LazyImage 
                                  src={book.cover} 
                                  alt={book.title} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <h3 
                                      className="font-bold text-xs hover:text-amber-500 transition cursor-pointer"
                                      onClick={() => { setActiveBookIdForReader(book.id); setCurrentView('books'); }}
                                    >
                                      {book.title}
                                    </h3>
                                    <button
                                      onClick={() => toggleBookWatchlist(book.id)}
                                      className="text-zinc-500 hover:text-amber-500 transition cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-zinc-500 mt-0.5">{book.author} • ★ {book.rating}</p>
                                  <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-normal">{book.description}</p>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] text-zinc-500">
                                    <span>Oxuma Tərəqqisi</span>
                                    <span className="font-bold text-amber-500 font-mono">{progress}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-zinc-800/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )
                  )}
                </motion.div>
              )}

              {/* E. WATCH PARTY VIEW */}
              {currentView === 'watch-party' && (
                <motion.div
                  key="watch-party"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/10 pb-5">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Sosial Yayım (Watch Party)</h1>
                      <p className="text-sm text-zinc-500 mt-1">Dostlarınızla eyni anda filmləri izləyin, rəy bildirin və real-time ünsiyyət qurun.</p>
                    </div>
                    <div className="relative group self-start md:self-auto">
                      {isCreatingParty && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 dark:bg-black text-zinc-100 text-[10px] rounded-lg shadow-xl border border-zinc-800/80 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 flex items-center gap-1.5 font-medium translate-y-1 group-hover:translate-y-0">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                          Otaq yaradılır...
                        </div>
                      )}
                      <motion.div
                        id="btn-create-party-container"
                        className="p-[1px] rounded-[13px] overflow-hidden relative flex items-center justify-center shadow-lg"
                        style={{
                          backgroundImage: theme === 'dark'
                            ? "linear-gradient(270deg, #ef4444, #991b1b, #ec4899, #ef4444)"
                            : "linear-gradient(270deg, #f43f5e, #f97316, #fda4af, #f43f5e)",
                          backgroundSize: '400% 400%',
                        }}
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                        }}
                        transition={{
                          backgroundPosition: {
                            repeat: Infinity,
                            duration: 4,
                            ease: "linear"
                          }
                        }}
                      >
                        <motion.button
                          onClick={() => setShowCreatePartyModal(true)}
                          disabled={isCreatingParty}
                          id="btn-create-party"
                          style={{
                            boxShadow: theme === 'dark'
                              ? `0 0 ${4 + 12 * scrollFactor}px rgba(239, 68, 68, ${0.1 + 0.35 * scrollFactor})`
                              : `0 0 ${4 + 12 * scrollFactor}px rgba(251, 113, 133, ${0.1 + 0.35 * scrollFactor})`
                          }}
                          whileHover={isCreatingParty ? {} : { 
                            scale: 1.02,
                            backgroundImage: theme === 'dark' 
                              ? "linear-gradient(135deg, #b91c1c 0%, #450a0a 100%)" 
                              : "linear-gradient(135deg, #fda4af 0%, #f97316 100%)",
                            boxShadow: theme === 'dark'
                              ? [
                                  `0 0 ${6 + 6 * scrollFactor}px rgba(239, 68, 68, ${0.2 + 0.25 * scrollFactor})`,
                                  `0 0 ${15 + 15 * scrollFactor}px rgba(239, 68, 68, ${0.4 + 0.5 * scrollFactor})`,
                                  `0 0 ${6 + 6 * scrollFactor}px rgba(239, 68, 68, ${0.2 + 0.25 * scrollFactor})`
                                ]
                              : [
                                  `0 0 ${6 + 6 * scrollFactor}px rgba(251, 113, 133, ${0.2 + 0.25 * scrollFactor})`,
                                  `0 0 ${15 + 15 * scrollFactor}px rgba(251, 113, 133, ${0.4 + 0.5 * scrollFactor})`,
                                  `0 0 ${6 + 6 * scrollFactor}px rgba(251, 113, 133, ${0.2 + 0.25 * scrollFactor})`
                                ]
                          }}
                          whileTap={isCreatingParty ? {} : { scale: 0.95 }}
                          transition={{ 
                            scale: { duration: 0.3 },
                            backgroundImage: { duration: 0.3 },
                            boxShadow: {
                              repeat: Infinity,
                              duration: 2,
                              ease: "easeInOut"
                            }
                          }}
                          className={`flex items-center gap-2 py-2.5 px-5 text-white text-xs font-semibold rounded-xl bg-gradient-to-r ${
                            isCreatingParty ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            theme === 'dark' 
                              ? 'from-red-800 to-rose-950 hover:from-red-700 hover:to-rose-900' 
                              : 'from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500'
                          }`}
                        >
                          {isCreatingParty ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {isCreatingParty ? 'Yaradılır...' : 'Yayım Otağı Yarat'}
                        </motion.button>
                      </motion.div>
                    </div>
                  </div>

                  {isViewLoading ? (
                    <WatchPartyGridSkeleton count={4} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {watchParties.map((party, index) => {
                      const movieObj = movies.find((m) => m.id === party.movieId) || movies[0];
                      return (
                        <motion.div
                          key={party.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.1 }}
                          transition={{ duration: 0.4, delay: (index % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                          className={`p-6 rounded-3xl border flex flex-col justify-between gap-4 relative group transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] ${
                            theme === 'dark' 
                              ? 'bg-zinc-950/90 border-zinc-800 hover:border-transparent' 
                              : 'bg-white border-zinc-200 hover:border-transparent'
                          }`}
                        >
                          {/* Hover Gradient Border & Glow Effect */}
                          <div className="absolute -inset-[1px] bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md -z-10" />
                          <div className="absolute -inset-[1px] bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10" />

                          {/* Inner container to ensure background stays solid/clean */}
                          <div className={`absolute inset-0 rounded-3xl -z-10 transition-colors duration-500 ${
                            theme === 'dark' ? 'bg-zinc-950/95' : 'bg-white'
                          }`} />

                          {/* Banner backdrop blur */}
                          <div className="absolute inset-0 bg-radial from-transparent via-zinc-950/10 to-black/30 pointer-events-none rounded-3xl" />

                          <div className="flex gap-4 relative z-10">
                            <img src={movieObj.poster} alt={movieObj.title} className="w-16 h-24 object-cover rounded-2xl shadow-md" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm">{party.roomName}</h3>
                                {party.isPlaying && (
                                  <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-full animate-pulse">AKTİV YAYIM</span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500">
                                Filmin Adı: <strong className="text-red-500 font-bold">{movieObj.title}</strong>
                              </p>
                              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                                {movieObj.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-800/10 pt-4 relative z-10 text-xs">
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Users className="w-4 h-4 text-red-500" />
                              <span>{party.participants.length} İştirakçı</span>
                            </div>
                            <div className="flex gap-2">
                              {currentUser && (party.creator === currentUser.username || currentUser.role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteWatchParty(party.id)}
                                  className="py-1.5 px-3 bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1"
                                  title="Otağı Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Sil
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setInviteModalMovie(movieObj);
                                  setInviteModalParty(party);
                                  setShowInviteModal(true);
                                }}
                                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1"
                              >
                                <Share2 className="w-3.5 h-3.5" /> Dəvət Et
                              </button>
                              <button
                                onClick={() => handleJoinParty(party)}
                                className="py-1.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                              >
                                Otağa Qoşul
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  )}
                </motion.div>
              )}

              {/* F. WATCH PARTY ROOM VIEW */}
              {currentView === 'watch-party-room' && activeWatchParty && (
                <motion.div
                  key="watch-party-room"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <WatchPartyRoom 
                  party={activeWatchParty}
                  currentUser={currentUser}
                  onLeave={() => { setActiveWatchParty(null); setCurrentView('watch-party'); }}
                  onCloseRoom={handleCloseWatchParty}
                  onDeleteRoom={handleDeleteWatchParty}
                  onUpdateParty={(updated) => {
                    setActiveWatchParty(updated);
                    setWatchParties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                  }}
                  movies={movies}
                  theme={theme}
                  users={users}
                  onSendInviteToFriend={handleSendInviteToFriend}
                  onInviteClick={() => {
                    const roomMovie = movies.find(m => m.id === activeWatchParty.movieId) || movies[0];
                    setInviteModalMovie(roomMovie);
                    setInviteModalParty(activeWatchParty);
                    setShowInviteModal(true);
                  }}
                />
                </motion.div>
              )}

              {/* G. COMMUNITY FORUM */}
              {currentView === 'forum' && (
                <motion.div
                  key="forum"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <Forum 
                  discussions={discussions}
                  setDiscussions={setDiscussions}
                  currentUser={currentUser}
                  theme={theme}
                />
                </motion.div>
              )}

              {/* LIVE STREAM SECTION */}
              {currentView === 'live-stream' && (
                <motion.div
                  key="live-stream"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <LiveStream 
                  currentUser={currentUser}
                  theme={theme}
                  isCinemaMode={isCinemaMode}
                  setIsCinemaMode={setIsCinemaMode}
                />
                </motion.div>
              )}

              {/* SHARED PLAYLISTS COLLABORATIVE SECTION */}
              {currentView === 'shared-playlists' && (
                <motion.div
                  key="shared-playlists"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <SharedPlaylists 
                  currentUser={currentUser}
                  theme={theme}
                  movies={movies}
                  onSelectMovie={(movie) => {
                    setSelectedMovie(movie);
                    setCurrentView('movie-details');
                  }}
                  setCurrentView={setCurrentView}
                />
                </motion.div>
              )}

              {/* H. USER PROFILE PAGE */}
              {currentView === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {isViewLoading ? (
                    <ProfileSkeleton />
                  ) : (
                    <>
                  {/* Profile Header Card */}
                  <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl ${
                    theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <img 
                        src={targetProfileUser.avatar} 
                        alt={targetProfileUser.name} 
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-red-500/20 shadow-lg"
                      />
                      <div className="text-center sm:text-left space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-sans">{targetProfileUser.name}</h1>
                          {targetProfileUser.isPremium && (
                            <span className="self-center sm:self-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-black uppercase tracking-wider animate-pulse">
                              <Sparkles className="w-3 h-3 fill-zinc-950 text-zinc-950" /> Premium
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-red-500 font-semibold font-mono">@{targetProfileUser.username}</p>
                        <p className="text-xs text-zinc-400 max-w-md leading-relaxed italic">{targetProfileUser.bio}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start pt-2">
                          <button 
                            onClick={() => {
                              setSocialModalUser(targetProfileUser);
                              setSocialModalType('followers');
                              setSocialSearchQuery('');
                              setShowSocialModal(true);
                            }}
                            className="text-center sm:text-left hover:opacity-85 transition focus:outline-none cursor-pointer"
                          >
                            <span className="block text-sm font-extrabold font-mono">{targetProfileUser.followersCount}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">İzləyici</span>
                          </button>
                          <button 
                            onClick={() => {
                              setSocialModalUser(targetProfileUser);
                              setSocialModalType('following');
                              setSocialSearchQuery('');
                              setShowSocialModal(true);
                            }}
                            className="text-center sm:text-left hover:opacity-85 transition focus:outline-none cursor-pointer"
                          >
                            <span className="block text-sm font-extrabold font-mono">{targetProfileUser.followingCount}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">İzlənilən</span>
                          </button>
                          <div className="text-center sm:text-left border-l border-zinc-800/60 pl-4">
                            <span className="block text-sm font-extrabold font-mono text-amber-500">{targetProfileUser.points || 0}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Kino Xalları 🏆</span>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] font-bold ${
                            (targetProfileUser.points || 0) >= 500
                              ? 'text-rose-500 border-rose-500/20 bg-rose-500/10'
                              : (targetProfileUser.points || 0) >= 150
                              ? 'text-amber-500 border-amber-500/20 bg-amber-500/10'
                              : 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10'
                          }`}>
                            <span>
                              {(targetProfileUser.points || 0) >= 500 ? '👑' : (targetProfileUser.points || 0) >= 150 ? '✒️' : '🍿'}
                            </span>{' '}
                            {
                              (targetProfileUser.points || 0) >= 500
                                ? 'CineVerse Əfsanəsi'
                                : (targetProfileUser.points || 0) >= 150
                                ? 'Film Tənqidçisi'
                                : 'Kino Həvəskarı'
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2">
                      {targetProfileUser.id === currentUser.id ? (
                        <>
                          <button
                            onClick={() => {
                              setEditName(currentUser.name);
                              setEditUsername(currentUser.username);
                              setEditBio(currentUser.bio || '');
                              setEditAvatar(currentUser.avatar);
                              setShowEditProfileModal(true);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-4 border text-xs font-semibold rounded-xl transition cursor-pointer ${
                              theme === 'dark' 
                                ? 'border-white/10 hover:bg-white/5 text-zinc-300' 
                                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Profili Redaktə Et
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-1.5 py-2 px-4 border border-red-500/20 hover:border-red-500/40 text-red-500 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Çıxış Et
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleFollowUser(targetProfileUser.id)}
                            className={`flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-xl transition cursor-pointer ${
                              currentUser.following.includes(targetProfileUser.id)
                                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                            }`}
                          >
                            {currentUser.following.includes(targetProfileUser.id) ? 'İzlənilir' : 'İzlə'}
                          </button>
                          <button
                            onClick={() => setSelectedProfileUser(null)}
                            className={`flex items-center justify-center gap-1.5 py-2 px-4 border text-xs font-semibold rounded-xl transition cursor-pointer ${
                              theme === 'dark'
                                ? 'border-zinc-850 hover:bg-white/5 text-zinc-400'
                                : 'border-zinc-200 hover:bg-zinc-100 text-zinc-650'
                            }`}
                          >
                            Geri Qayıt ↩
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Gamification Badges Component */}
                  <GamificationBadges userPoints={targetProfileUser.points || 0} theme={theme} />

                  {/* Profile detailed sections (favorites, watchlist, activity history) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User favorites list */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className={`p-6 rounded-3xl border ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h3 className="font-bold text-sm mb-4">Profil Sevimliləri ({targetProfileUser.favorites?.length || 0})</h3>
                        {!targetProfileUser.favorites || targetProfileUser.favorites.length === 0 ? (
                          <p className="text-xs text-zinc-500 py-6">Hələ heç bir sevimli film əlavə edilməyib.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {movies.filter(m => targetProfileUser.favorites.includes(m.id)).map(m => (
                              <div
                                key={m.id}
                                onClick={() => { setSelectedMovie(m); setCurrentView('movie-details'); }}
                                className="group cursor-pointer space-y-1.5"
                              >
                                <img src={m.poster} alt={m.title} className="w-full h-36 object-cover rounded-2xl border border-zinc-800/10 shadow-sm" />
                                <h4 className="font-bold text-[11px] truncate group-hover:text-red-500 transition">{m.title}</h4>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* User Watchlist */}
                      <div className={`p-6 rounded-3xl border ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h3 className="font-bold text-sm mb-4">Planlaşdırılan İzləmələr ({targetProfileUser.watchlist?.length || 0})</h3>
                        {!targetProfileUser.watchlist || targetProfileUser.watchlist.length === 0 ? (
                          <p className="text-xs text-zinc-500 py-6">İzləmə siyahısı boşdur.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {movies.filter(m => targetProfileUser.watchlist.includes(m.id)).map(m => (
                              <div
                                key={m.id}
                                onClick={() => { setSelectedMovie(m); setCurrentView('movie-details'); }}
                                className="group cursor-pointer space-y-1.5"
                              >
                                <img src={m.poster} alt={m.title} className="w-full h-36 object-cover rounded-2xl border border-zinc-800/10 shadow-sm" />
                                <h4 className="font-bold text-[11px] truncate group-hover:text-red-500 transition">{m.title}</h4>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right column: follow system demonstration list */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className={`p-5 rounded-3xl border ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">Tövsiyə Olunan İzləyicilər</h3>
                        
                        <div className="space-y-3">
                          {users.filter(u => u.id !== currentUser.id).slice(0, 3).map((u) => {
                            const isFollowing = currentUser.following.includes(u.id);
                            return (
                              <div key={u.id} className="flex items-center justify-between text-xs">
                                <div 
                                  onClick={() => navigateToUserProfileById(u.id)}
                                  className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition"
                                >
                                  <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                                  <div>
                                    <p className="font-semibold leading-none">{u.name}</p>
                                    <p className="text-[10px] text-zinc-500 mt-1">@{u.username}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleFollowUser(u.id)}
                                  className={`py-1 px-3 text-[10px] font-bold rounded-xl transition cursor-pointer ${
                                    isFollowing
                                      ? 'bg-zinc-800 text-zinc-400'
                                      : 'bg-red-600 text-white hover:bg-red-500'
                                  }`}
                                >
                                  {isFollowing ? 'İzlənilir' : 'İzlə'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                  </>
                  )}
                </motion.div>
              )}

              {/* BOOK SECTION VIEW */}
              {currentView === 'books' && (
                <motion.div
                  key="books"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <BooksSection
                  books={books}
                  setBooks={setBooks}
                  bookCollections={bookCollections}
                  setBookCollections={setBookCollections}
                  bookVsMovies={bookVsMovies}
                  setBookVsMovies={setBookVsMovies}
                  movies={movies}
                  currentUser={currentUser}
                  setCurrentUser={setCurrentUser}
                  onViewMovie={(movieId) => {
                    const found = movies.find(m => m.id === movieId);
                    if (found) {
                      setSelectedMovie(found);
                      setCurrentView('movie-details');
                    }
                  }}
                  theme={theme}
                  initialSelectedBookId={selectedBookIdForModal}
                  onClearInitialBookId={() => setSelectedBookIdForModal(null)}
                  initialActiveReaderBookId={activeBookIdForReader}
                  onClearInitialReaderBookId={() => setActiveBookIdForReader(null)}
                />
                </motion.div>
              )}

              {/* I. ADMIN VIEW */}
              {currentView === 'admin' && currentUser.role === 'admin' && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <AdminPanel 
                  movies={movies}
                  setMovies={setMovies}
                  users={users}
                  setUsers={setUsers}
                  theme={theme}
                  books={books}
                  setBooks={setBooks}
                  bookVsMovies={bookVsMovies}
                  setBookVsMovies={setBookVsMovies}
                />
                </motion.div>
              )}

              {/* J. MOVIE DETAILS VIEW */}
              {currentView === 'movie-details' && selectedMovie && (
                <motion.div
                  key="movie-details"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="space-y-8"
                >
                  {isViewLoading ? (
                    <MovieDetailsSkeleton />
                  ) : (
                    <>
                  {/* Theater Lights Out Dim Backdrop Overlay */}
                  {theaterLightsOn && (
                    <div className="fixed inset-0 bg-black/98 z-40 transition-opacity duration-500 flex flex-col items-center justify-center">
                      <div className="absolute top-6 left-6 text-white text-xs font-bold font-sans tracking-wide opacity-50">
                        CINEVERSE KİNO REJİMİ AKTİVDİR • Sürətli çıxış üçün 'İşıqları Yandır' düyməsinə klikləyin
                      </div>
                      <button 
                        onClick={() => setTheaterLightsOn(false)}
                        className="absolute top-6 right-6 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-white text-[11px] font-bold tracking-wider uppercase hover:border-red-500 hover:text-red-500 transition-all cursor-pointer shadow-lg"
                      >
                        💡 İşıqları Yandır
                      </button>
                    </div>
                  )}
                  
                  {/* Back Navigation */}
                  <button
                    onClick={() => setCurrentView('movies')}
                    className="text-xs font-semibold text-zinc-500 hover:text-red-500 transition cursor-pointer"
                  >
                    ← Filmlər Siyahısına Qayıt
                  </button>

                  {/* Backdrop banner details cover */}
                  <div className="relative rounded-3xl overflow-hidden aspect-[21/9] min-h-[300px] border border-zinc-900 shadow-xl">
                    <img src={selectedMovie.banner} alt={selectedMovie.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                    
                    <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex flex-col sm:flex-row items-end gap-6 z-10">
                      <img src={selectedMovie.poster} alt={selectedMovie.title} className="w-24 sm:w-36 aspect-[2/3] object-cover rounded-2xl border-2 border-white/20 shadow-2xl shrink-0" />
                      <div className="space-y-2 text-white">
                        <div className="flex gap-2 flex-wrap">
                          {selectedMovie.genres.map((g, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">{g}</span>
                          ))}
                        </div>
                        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight font-sans">{selectedMovie.title}</h1>
                        <p className="text-xs text-zinc-400 italic">Orijinal Adı: {selectedMovie.originalTitle}</p>
                        <p className="text-[11px] text-zinc-300">İl: <strong className="font-bold">{selectedMovie.year}</strong> • Müddət: <strong className="font-bold">{selectedMovie.duration}</strong> • Rejissor: <strong className="font-bold">{selectedMovie.director}</strong></p>
                        
                        {/* Interactive Play Action Buttons inside cover */}
                        <div className="flex gap-3 pt-3 flex-wrap">
                          <button
                            onClick={() => {
                              setActivePlayerMode('movie');
                              rewardPoints(15, 'Film izləməyə başladığınız üçün');
                              setTimeout(() => {
                                document.getElementById('cinetheater-player')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className="flex items-center gap-2 py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/30 cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
                          >
                            <Play className="w-3.5 h-3.5 fill-white text-white" /> Tam Filmi İzlə (Kino Rejimi)
                          </button>
                          
                          <button
                            onClick={() => {
                              setActivePlayerMode('trailer');
                              setTimeout(() => {
                                document.getElementById('cinetheater-player')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                            className="flex items-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
                          >
                            🎬 Rəsmi Treyler
                          </button>

                          <button
                            onClick={() => {
                              setInviteModalMovie(selectedMovie);
                              setInviteModalParty(null);
                              setShowInviteModal(true);
                            }}
                            className="flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-emerald-600/20"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Kino Gecəsi Planla / Dəvət Et 📅
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left: About, Cast, Trailer, Ratings */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Movie Description */}
                      <div className={`p-6 rounded-3xl border ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h3 className="font-bold text-sm mb-3">Məzmun</h3>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">{selectedMovie.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-6">
                          <button
                            onClick={() => toggleLike(selectedMovie.id)}
                            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              (currentUser?.likedMovies || []).includes(selectedMovie.id)
                                ? 'bg-red-600/20 border-red-500 text-red-500'
                                : 'bg-zinc-800/20 border-zinc-800 text-zinc-300 hover:bg-zinc-800/40'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                            {(currentUser?.likedMovies || []).includes(selectedMovie.id) ? 'Bəyənilib' : 'Bəyən'} ({selectedMovie.likes || 0})
                          </button>

                          <button
                            onClick={() => toggleFavorite(selectedMovie.id)}
                            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              currentUser?.favorites.includes(selectedMovie.id)
                                ? 'bg-red-600/20 border-red-500 text-red-500'
                                : 'bg-zinc-800/20 border-zinc-800 text-zinc-300 hover:bg-zinc-800/40'
                            }`}
                          >
                            <Heart className="w-4 h-4 fill-transparent" />
                            {currentUser?.favorites.includes(selectedMovie.id) ? 'Sevimlilərdədir' : 'Sevimlilərə Əlavə Et'}
                          </button>

                          <button
                            onClick={() => toggleWatchlist(selectedMovie.id)}
                            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              currentUser?.watchlist.includes(selectedMovie.id)
                                ? 'bg-red-600/20 border-red-500 text-red-500'
                                : 'bg-zinc-800/20 border-zinc-800 text-zinc-300 hover:bg-zinc-800/40'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                            {currentUser?.watchlist.includes(selectedMovie.id) ? 'İzləmə Siyahısındadır' : 'İzləmə Siyahısına Əlavə Et'}
                          </button>
                        </div>
                      </div>

                      {/* Book Adaptation Link block */}
                      {(() => {
                        const linkedBook = books.find(b => b.movieAdaptationId === selectedMovie.id);
                        if (!linkedBook) return null;
                        return (
                          <div className={`p-6 rounded-3xl border ${
                            theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                          } relative overflow-hidden group shadow-lg`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl group-hover:bg-red-600/10 transition-all duration-500 pointer-events-none" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                              <div className="flex gap-4 items-center">
                                <div className="w-14 h-20 shrink-0 rounded-xl overflow-hidden border border-zinc-800/30 shadow-xl shadow-black/20 group-hover:scale-105 transition-all duration-300">
                                  <img src={linkedBook.cover} alt={linkedBook.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-wider mb-1 font-mono">
                                    📖 Filmin Kitabı Var
                                  </span>
                                  <h4 className="font-extrabold text-sm text-white leading-tight">{linkedBook.title}</h4>
                                  <p className="text-[10px] text-zinc-400">
                                    Müəllif: <strong className="font-bold text-zinc-300">{linkedBook.author}</strong> • Dil: <strong className="font-bold text-zinc-300">{linkedBook.language === 'az' ? 'Azərbaycanca' : 'İngiliscə'}</strong>
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedBookIdForModal(linkedBook.id);
                                  setCurrentView('books');
                                }}
                                className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-red-600/20 hover:scale-[1.03] active:scale-[0.98]"
                              >
                                Kitabı Oxu / İncələ →
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Cast Section */}
                      <div className={`p-6 rounded-3xl border ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h3 className="font-bold text-sm mb-4">Baş Rollarda</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {selectedMovie.cast.map((actor, idx) => (
                            <div key={idx} className="p-3 bg-zinc-800/5 rounded-2xl border border-zinc-800/10 text-center">
                              <UserIcon className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                              <p className="text-xs font-bold truncate">{actor}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Aktyor</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CineTheater Pro - Integrated Media Center */}
                      <div 
                        id="cinetheater-player" 
                        className={`p-6 rounded-3xl border transition-all duration-500 scroll-mt-24 ${
                          theaterLightsOn 
                            ? 'bg-zinc-950 border-red-950 shadow-[0_0_80px_rgba(220,38,38,0.25)] z-50 relative scale-[1.02]' 
                            : theme === 'dark' 
                              ? 'bg-zinc-900/40 border-zinc-800' 
                              : 'bg-white border-zinc-200'
                        }`}
                      >
                        {/* Player Header & Mode Selectors */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-zinc-850 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <h3 className="font-bold text-sm">CineTheater Pro™ İnteqrasiya Olunmuş Media Center</h3>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Sürətli bulud serverləri vasitəsilə kəsintisiz və ləngiməsiz yayım</p>
                          </div>

                          {/* Quick server tabs */}
                          <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                            <button
                              onClick={() => {
                                setActivePlayerMode('trailer');
                                setTheaterLightsOn(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                                activePlayerMode === 'trailer'
                                  ? 'bg-red-600 text-white shadow-md'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              🎬 Rəsmi Treyler
                            </button>
                            <button
                              onClick={() => {
                                setActivePlayerMode('movie');
                                setActiveServer('server_primary');
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                                activePlayerMode === 'movie' && activeServer === 'server_primary'
                                  ? 'bg-red-600 text-white shadow-md'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              🚀 Server #1 (1080p HD)
                            </button>
                            <button
                              onClick={() => {
                                setActivePlayerMode('movie');
                                setActiveServer('server_backup');
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                                activePlayerMode === 'movie' && activeServer === 'server_backup'
                                  ? 'bg-red-600 text-white shadow-md'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              ⚡ Server #2 (Backup)
                            </button>
                            <button
                              onClick={() => {
                                setActivePlayerMode('movie');
                                setActiveServer('server_dual');
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                                activePlayerMode === 'movie' && activeServer === 'server_dual'
                                  ? 'bg-red-600 text-white shadow-md'
                                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              🎙️ Server #3 (Dublyaj)
                            </button>
                          </div>
                        </div>

                        {/* Screen Area */}
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-850 relative group">
                          {/* 1. Idle mode view */}
                          {activePlayerMode === 'idle' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                              {/* Background blurred mockup */}
                              <img src={selectedMovie.banner} alt={selectedMovie.title} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm pointer-events-none" />
                              <div className="absolute inset-0 bg-black/60" />
                              
                              <div className="relative z-10 max-w-sm space-y-4">
                                <div className="w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl cursor-pointer hover:scale-110 active:scale-95 transition"
                                     onClick={() => setActivePlayerMode('movie')}>
                                  <Play className="w-8 h-8 fill-white text-white ml-1" />
                                </div>
                                <h4 className="font-bold text-sm text-white">Böyük Ekran Rejimi Aktivdir!</h4>
                                <p className="text-[11px] text-zinc-400">İnteqrasiya olunmuş CineTheater proyektorumuz hazırdır. Tam ekran formatında tam filmi və ya rəsmi tanıtımı izləməyə başlayın.</p>
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => setActivePlayerMode('movie')} className="py-1.5 px-3.5 bg-red-600 hover:bg-red-500 rounded-lg text-[10px] font-bold text-white transition cursor-pointer">
                                    Tam Filmi Başlat
                                  </button>
                                  <button onClick={() => setActivePlayerMode('trailer')} className="py-1.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[10px] font-bold text-zinc-300 transition cursor-pointer">
                                    Treyleri Aç
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. Youtube Trailer Mode */}
                          {activePlayerMode === 'trailer' && (
                            <iframe
                              src={selectedMovie.trailerUrl}
                              title={`${selectedMovie.title} rəsmi treyler`}
                              className="w-full h-full object-cover"
                              allowFullScreen
                            />
                          )}

                          {/* 3. Custom HTML5 Video Player Mode */}
                          {activePlayerMode === 'movie' && (
                            <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
                              <video
                                ref={videoRef}
                                src={selectedMovie.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                                onClick={togglePlay}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                className="w-full h-full object-contain"
                                autoPlay
                                playsInline
                              />

                              {/* Custom Subtitles layer inside player */}
                              {subtitleLanguage !== 'off' && getSubtitleText(selectedMovie.id, playerCurrentTime, subtitleLanguage) && (
                                <div className="absolute bottom-16 inset-x-0 flex justify-center px-4 pointer-events-none z-30">
                                  <div className="bg-black/85 backdrop-blur-xs text-white px-4 py-2 rounded-xl text-center text-xs sm:text-sm font-semibold max-w-[80%] border border-white/10 shadow-lg leading-relaxed animate-fade-in font-sans">
                                    {getSubtitleText(selectedMovie.id, playerCurrentTime, subtitleLanguage)}
                                  </div>
                                </div>
                              )}

                              {/* Center play state overlay on hover */}
                              <div 
                                onClick={togglePlay}
                                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
                              >
                                <div className="w-14 h-14 bg-red-600/90 text-white rounded-full flex items-center justify-center shadow-lg transition-all transform scale-90 group-hover:scale-100 duration-300">
                                  {playerIsPlaying ? (
                                    <Pause className="w-6 h-6 fill-white text-white" />
                                  ) : (
                                    <Play className="w-6 h-6 fill-white text-white ml-1" />
                                  )}
                                </div>
                              </div>

                              {/* Controls Toolbar overlay */}
                              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-20">
                                {/* Scrub Bar */}
                                <div className="flex items-center gap-3 w-full">
                                  <span className="text-[10px] font-mono text-zinc-400">{formatPlayerTime(playerCurrentTime)}</span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={playerDuration || 100}
                                    value={playerCurrentTime}
                                    onChange={handleSeekChange}
                                    className="grow accent-red-600 h-1 rounded-lg bg-zinc-700 hover:h-1.5 transition-all cursor-pointer"
                                  />
                                  <span className="text-[10px] font-mono text-zinc-400">{formatPlayerTime(playerDuration)}</span>
                                </div>

                                {/* Controls buttons tray */}
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    {/* Play/Pause */}
                                    <button 
                                      onClick={togglePlay}
                                      className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
                                    >
                                      {playerIsPlaying ? (
                                        <Pause className="w-4 h-4 text-white" />
                                      ) : (
                                        <Play className="w-4 h-4 fill-white text-white" />
                                      )}
                                    </button>

                                    {/* Volume slider control */}
                                    <div className="flex items-center gap-1.5 group/vol">
                                      <button 
                                        onClick={toggleMute}
                                        className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
                                      >
                                        {playerIsMuted || playerVolume === 0 ? (
                                          <VolumeX className="w-4 h-4 text-zinc-400" />
                                        ) : (
                                          <Volume2 className="w-4 h-4 text-white" />
                                        )}
                                      </button>
                                      <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={playerIsMuted ? 0 : playerVolume}
                                        onChange={handleVolumeChange}
                                        className="w-16 accent-red-600 h-1 bg-zinc-700 rounded-lg cursor-pointer transition-all duration-300"
                                      />
                                    </div>
                                  </div>

                                  {/* Right tools: subtitle, theater-lights, speed, quality, fullscreen */}
                                  <div className="flex items-center gap-2.5">
                                    {/* Subtitle language switcher */}
                                    <div className="relative">
                                      <button 
                                        onClick={() => {
                                          const langs: Array<'az' | 'en' | 'tr' | 'off'> = ['az', 'en', 'tr', 'off'];
                                          const nextIdx = (langs.indexOf(subtitleLanguage) + 1) % langs.length;
                                          setSubtitleLanguage(langs[nextIdx]);
                                        }}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer"
                                        title="Altyazı Dilini Dəyiş"
                                      >
                                        <Subtitles className="w-3 h-3 text-red-500" />
                                        {subtitleLanguage === 'off' ? 'ALT: OFF' : `ALT: ${subtitleLanguage.toUpperCase()}`}
                                      </button>
                                    </div>

                                    {/* Speed cycle button */}
                                    <button
                                      onClick={() => {
                                        const speeds = [1, 1.25, 1.5, 2, 0.75];
                                        const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                                        handleSpeedChange(speeds[nextIdx]);
                                      }}
                                      className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white transition cursor-pointer"
                                      title="Oynatma Sürəti"
                                    >
                                      {playbackSpeed}x
                                    </button>

                                    {/* Theater Dim Button */}
                                    <button
                                      onClick={() => setTheaterLightsOn(!theaterLightsOn)}
                                      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                        theaterLightsOn 
                                          ? 'bg-amber-500/20 border-amber-500 text-amber-500' 
                                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                                      }`}
                                      title="Kino İşıqları"
                                    >
                                      <span>💡</span>
                                      {theaterLightsOn ? 'İşıqlı' : 'Kino İşıqları'}
                                    </button>

                                    {/* Resolution badge */}
                                    <button
                                      onClick={() => {
                                        const resList: Array<'1080p' | '720p' | '4k' | 'auto'> = ['1080p', '720p', '4k', 'auto'];
                                        const nextIdx = (resList.indexOf(playerResolution) + 1) % resList.length;
                                        setPlayerResolution(resList[nextIdx]);
                                      }}
                                      className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-extrabold text-zinc-400 hover:text-white transition uppercase cursor-pointer"
                                    >
                                      {playerResolution}
                                    </button>

                                    {/* Fullscreen Toggle */}
                                    <button
                                      onClick={() => {
                                        if (videoRef.current) {
                                          if (document.fullscreenElement) {
                                            document.exitFullscreen();
                                          } else {
                                            videoRef.current.requestFullscreen().catch(err => console.log(err));
                                          }
                                        }
                                      }}
                                      className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
                                      title="Tam Ekran"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Player Footer Helper / Metadata status bar */}
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-zinc-500">
                          <div className="flex items-center gap-3">
                            <span>Mənbə: <strong className="text-zinc-400">CineVerse Cloud CDN #1</strong></span>
                            <span>•</span>
                            <span>Sürət: <strong className="text-zinc-400">98.4 Mbps (Çox Sürətli)</strong></span>
                            <span>•</span>
                            <span>Audio: <strong className="text-zinc-400">Azərbaycan və ya Orijinal (Seçimli)</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Format: <strong className="text-zinc-400">H.264 MP4 / Dolby Atmos</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Related Movies section */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-sm">Bənzər Filmlər</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {movies.filter((m) => m.id !== selectedMovie.id && m.genres.some((g) => selectedMovie.genres.includes(g))).slice(0, 4).map((m) => (
                            <div
                              key={m.id}
                              onClick={() => setSelectedMovie(m)}
                              className="group cursor-pointer space-y-1.5"
                            >
                              <img src={m.poster} alt={m.title} className="w-full h-36 object-cover rounded-2xl border border-zinc-800/10 shadow-sm group-hover:scale-105 transition" />
                              <h4 className="font-bold text-[11px] truncate">{m.title}</h4>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right column: User ratings & reviews */}
                    <div className="lg:col-span-1 space-y-6">
                      
                      {/* Overall rating badge */}
                      <div className={`p-5 rounded-3xl border text-center ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider font-bold">CineVerse Ortaq Reytinqi</h4>
                        <p className="text-4xl font-extrabold text-amber-500 font-mono mt-2">★ {selectedMovie.rating}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">İcma tərəfindən verilən ümumi xal</p>
                      </div>

                      {/* Add Review Panel */}
                      <div className={`p-5 rounded-3xl border ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">Rəyinizi Bildirin</h4>
                        
                        <form onSubmit={handleAddReview} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Xal verin (1 - 10)</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              required
                              value={reviewRating}
                              onChange={(e) => setReviewRating(Number(e.target.value))}
                              className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                                theme === 'dark' 
                                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650' 
                                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Şərhiniz</label>
                            <textarea
                              required
                              rows={3}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Film haqqında fikirlərinizi bura yazın..."
                              className={`w-full px-3 py-2 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                                theme === 'dark' 
                                  ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650' 
                                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                              }`}
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            Rəyi Göndər
                          </button>
                        </form>
                      </div>

                      {/* User Reviews list */}
                      <div className={`p-5 rounded-3xl border space-y-4 ${
                        theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                      }`}>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">İstifadəçi Rəyləri ({selectedMovie.reviews?.length || 0})</h4>
                        
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {!selectedMovie.reviews || selectedMovie.reviews.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">Hələ heç kim bu filmlə bağlı rəy bildirməyib.</p>
                          ) : (
                            selectedMovie.reviews.map((rev) => {
                              const isAuthorOrAdmin = currentUser && (currentUser.id === rev.userId || currentUser.username === rev.username || currentUser.role === 'admin');
                              const isEditing = editingMovieReviewId === rev.id;

                              return (
                                <div key={rev.id} className="text-xs space-y-2 border-b border-zinc-800/10 pb-3">
                                  <div className="flex items-center justify-between">
                                    <div 
                                      onClick={() => navigateToUserProfileByUsername(rev.username)}
                                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                                    >
                                      <img src={rev.userAvatar} alt={rev.username} className="w-6 h-6 rounded-full object-cover" />
                                      <span className="font-bold">@{rev.username}</span>
                                    </div>
                                    {!isEditing && (
                                      <span className="font-bold text-amber-500 font-mono">★ {rev.rating}/10</span>
                                    )}
                                  </div>

                                  {isEditing ? (
                                    <div className="space-y-2 p-2 bg-zinc-800/20 rounded-xl border border-zinc-800/50">
                                      <div className="flex items-center gap-2">
                                        <label className="text-[10px] text-zinc-400 font-bold uppercase">Xal:</label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="10"
                                          value={editingMovieReviewRating}
                                          onChange={(e) => setEditingMovieReviewRating(Number(e.target.value))}
                                          className={`w-16 px-2 py-0.5 rounded text-[11px] focus:outline-none border ${
                                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                          }`}
                                        />
                                      </div>
                                      <textarea
                                        value={editingMovieReviewComment}
                                        onChange={(e) => setEditingMovieReviewComment(e.target.value)}
                                        rows={2}
                                        className={`w-full px-2 py-1.5 rounded-lg text-[11px] focus:outline-none border ${
                                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                        }`}
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button
                                          onClick={() => setEditingMovieReviewId(null)}
                                          className="p-1 text-zinc-450 hover:text-red-500 rounded transition"
                                          title="İmtina et"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleSaveEditMovieReview(rev.id)}
                                          className="p-1 text-green-500 hover:text-green-400 rounded transition"
                                          title="Yadda saxla"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-zinc-400 leading-relaxed">{rev.comment}</p>
                                  )}

                                  <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-500">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono">{rev.date}</span>
                                      
                                      {/* Like & Dislike interaction */}
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleLikeMovieReview(rev.id)}
                                          className="flex items-center gap-1 hover:text-red-500 transition cursor-pointer"
                                          title="Bəyən"
                                        >
                                          <ThumbsUp className="w-3 h-3" />
                                          <span>{rev.likes || 0}</span>
                                        </button>
                                        <button
                                          onClick={() => handleDislikeMovieReview(rev.id)}
                                          className="flex items-center gap-1 hover:text-blue-500 transition cursor-pointer"
                                          title="Bəyənmə"
                                        >
                                          <ThumbsDown className="w-3 h-3" />
                                          <span>{rev.dislikes || 0}</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Edit & Delete actions */}
                                    {isAuthorOrAdmin && !isEditing && (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleStartEditMovieReview(rev)}
                                          className="p-1 text-zinc-500 hover:text-amber-500 rounded transition cursor-pointer"
                                          title="Redaktə et"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMovieReview(rev.id)}
                                          className="p-1 text-zinc-500 hover:text-red-500 rounded transition cursor-pointer"
                                          title="Sil"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                  </>
                  )}
                </motion.div>
              )}
              </AnimatePresence>

            </main>

          </div>

          {/* Create Watch Party Modal */}
          {showCreatePartyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
              <div className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold">
                      🎬
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold font-display">Yeni İzləmə Partiyası Otağı</h3>
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        TMDB API-dən istədiyiniz filmi axtarıb seçin və ya YouTube / Video keçidi əlavə edin.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCreatePartyModal(false)}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateWatchParty} className="space-y-4 mt-4">
                  {/* TMDB API Search Box */}
                  <div className={`p-3.5 rounded-2xl border ${
                    theme === 'dark' ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-2 text-red-500 font-mono">
                      <span>TMDB Film Axtarışı (Rave Rejimi)</span>
                      <span className="text-zinc-500 lowercase font-normal">Canlı Axtarış</span>
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={tmdbSearchQuery}
                        onChange={(e) => setTmdbSearchQuery(e.target.value)}
                        placeholder="Filmin adını daxil edin (Məs. Dune, Interstellar, Matrix)..."
                        className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs focus:outline-none border transition-all ${
                          theme === 'dark'
                            ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-red-500'
                            : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                        }`}
                      />
                      {isSearchingTmdb && (
                        <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-spin" />
                      )}
                    </div>

                    {/* TMDB Search Results Dropdown List */}
                    {tmdbSearchResults.length > 0 && (
                      <div className="mt-2.5 space-y-2 max-h-52 overflow-y-auto pr-1">
                        <span className="text-[10px] font-semibold text-zinc-400 block px-1">
                          Axtarış nəticələri ({tmdbSearchResults.length}):
                        </span>
                        {tmdbSearchResults.map((item) => {
                          const year = item.release_date ? item.release_date.substring(0, 4) : '';
                          const poster = item.poster_path
                            ? (item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w185${item.poster_path}`)
                            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectTmdbMovie(item)}
                              className={`p-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                selectedTmdbMovie?.id === item.id
                                  ? 'border-red-500 bg-red-500/10'
                                  : theme === 'dark'
                                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100'
                              }`}
                            >
                              <img src={poster} alt={item.title} className="w-10 h-14 object-cover rounded-lg shadow-sm flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold truncate">{item.title}</h4>
                                  {year && <span className="text-[10px] text-zinc-500 font-mono">({year})</span>}
                                </div>
                                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                                  {item.overview || 'Xarici bazadan daxil edilmiş film.'}
                                </p>
                                {item.vote_average > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 mt-1">
                                    ⭐ {item.vote_average.toFixed(1)} / 10
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition-all flex-shrink-0"
                              >
                                Seç
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Movie Banner Preview */}
                  {externalMovieTitle && (
                    <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 animate-fade-in">
                      {externalMoviePoster ? (
                        <img src={externalMoviePoster} alt={externalMovieTitle} className="w-10 h-14 object-cover rounded-lg flex-shrink-0 shadow-md" />
                      ) : (
                        <div className="w-10 h-14 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-lg flex-shrink-0">
                          🎬
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 block font-mono">
                          ✅ Seçilən Film Məlumatları
                        </span>
                        <p className="text-xs font-bold text-white truncate">{externalMovieTitle}</p>
                        <p className="text-[10px] text-emerald-300/80 truncate mt-0.5">
                          {externalMovieUrl ? `Video Linki: ${externalMovieUrl}` : 'YouTube/Trailer keçidi avtomatik formatlandı'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Room Name Input */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>
                      Otaq Adı
                    </label>
                    <input
                      type="text"
                      required
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      placeholder="Məs. Nolan Kinoseans Otağı 🍿"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-red-500' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                      }`}
                    />
                  </div>

                  {/* Toggle Custom / External Movie */}
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="useExternalCheckbox"
                      checked={useExternalMovie}
                      onChange={(e) => setUseExternalMovie(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-950 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="useExternalCheckbox" className={`text-xs font-semibold cursor-pointer ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Fərdi YouTube / Keçid və ya başqa xarici video linki istifadə et
                    </label>
                  </div>

                  {!useExternalMovie ? (
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Kataloqdan Film Seçin</label>
                      <select
                        required={!useExternalMovie}
                        value={newPartyMovieId}
                        onChange={(e) => setNewPartyMovieId(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-red-500' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-red-500'
                        }`}
                      >
                        <option value="">Kataloqdan film seçin...</option>
                        {movies.map((m) => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-in">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Film Başlığı</label>
                        <input
                          type="text"
                          required={useExternalMovie}
                          value={externalMovieTitle}
                          onChange={(e) => setExternalMovieTitle(e.target.value)}
                          placeholder="Məs. Batman Begins (2005)"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-red-500' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>
                          YouTube / Video Linki (Google, Drive, MP4, Embed)
                        </label>
                        <input
                          type="url"
                          value={externalMovieUrl}
                          onChange={(e) => setExternalMovieUrl(e.target.value)}
                          placeholder="Məs. https://www.youtube.com/watch?v=s7EdQ4FqbhY"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-red-500' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Poster URL (Şəkil Linki)</label>
                        <input
                          type="text"
                          value={externalMoviePoster}
                          onChange={(e) => setExternalMoviePoster(e.target.value)}
                          placeholder="https://image.tmdb.org/t/p/w500/..."
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                            theme === 'dark' 
                              ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 focus:border-red-500' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreatePartyModal(false)}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-150 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      Ləğv Et
                    </button>
                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      Otağı Yarat və Qoşul
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Premium Invite & Calendar Integration Modal */}
          <InviteModal 
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            movies={movies}
            currentUser={currentUser}
            users={users}
            theme={theme}
            selectedMovie={inviteModalMovie}
            activeParty={inviteModalParty}
            onCreateWatchParty={handleQuickCreateWatchParty}
            onSendInviteToFriend={handleSendInviteToFriend}
          />

          {/* Premium Subscription / Upgrade Modal */}
          <PremiumModal 
            isOpen={showPremiumModal}
            onClose={() => setShowPremiumModal(false)}
            currentUser={currentUser}
            theme={theme}
            onUpgradeSuccess={(updatedUser) => {
              setCurrentUser(updatedUser);
              
              // Also add a custom notification for the upgrade!
              const newNotif: Notification = {
                id: 'notif_premium_' + Date.now(),
                title: 'Premium Aktiv Edildi! 💎',
                description: 'CineVerse Premium statusunuz uğurla aktivləşdirildi! 4K yayımlar və üstünlüklər sizi gözləyir.',
                type: 'system',
                date: 'İndi',
                read: false
              };
              setNotifications(prev => [newNotif, ...prev]);
            }}
          />

          {/* Edit Profile Modal */}
          {showEditProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
              <div className={`w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                <h3 className="text-base font-extrabold mb-2 font-display">Profil Məlumatlarını Yenilə</h3>
                <p className="text-[11px] text-zinc-500 mb-4">
                  İnstagram tərzi handle (@nick) və digər məlumatlarınızı daxil edərək fərdiləşdirin.
                </p>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Ad Soyad</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Məs. Elnar Ağasoy"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650 focus:border-red-650' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-455 focus:border-red-550'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>
                      İstifadəçi Adı (Instagram Nick-i)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 font-bold font-mono text-xs">@</span>
                      <input
                        type="text"
                        required
                        value={editUsername}
                        onChange={(e) => {
                          // Allow lowercase alphanumeric and underscore only, like Instagram handle
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                          setEditUsername(val);
                        }}
                        placeholder="elnar_agasoy"
                        className={`w-full pl-7 pr-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                          theme === 'dark' 
                            ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650 focus:border-red-650' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-455 focus:border-red-550'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Profil Şəkli Linki (Avatar URL)</label>
                    <input
                      type="text"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650 focus:border-red-650' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-455 focus:border-red-550'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-650'}`}>Mənim Haqqımda (Bio)</label>
                    <textarea
                      rows={2}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Filmlər haqqında qısa fikirləriniz..."
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650 focus:border-red-650' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-455 focus:border-red-550'
                      }`}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditProfileModal(false)}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        theme === 'dark' ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-150 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      Ləğv Et
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition cursor-pointer"
                    >
                      Yadda Saxla
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Social Relations (Followers/Following) Modal */}
          {showSocialModal && socialModalUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
              <div className={`w-full max-w-sm sm:max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[90vh] h-[520px] ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold font-display">
                    @{socialModalUser.username} {socialModalType === 'followers' ? 'izləyiciləri' : 'izlədikləri'}
                  </h3>
                  <button
                    onClick={() => setShowSocialModal(false)}
                    className={`p-1.5 rounded-full hover:bg-zinc-800 transition cursor-pointer ${
                      theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search box */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Axtar..."
                    value={socialSearchQuery}
                    onChange={(e) => setSocialSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none border transition-all duration-300 ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650 focus:border-red-650' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-550'
                    }`}
                  />
                </div>

                {/* Tabs to easily switch between followers/following inside modal */}
                <div className="flex border-b border-zinc-800/10 mb-4 gap-4">
                  <button
                    onClick={() => {
                      setSocialModalType('followers');
                      setSocialSearchQuery('');
                    }}
                    className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                      socialModalType === 'followers'
                        ? 'text-red-500 border-b-2 border-red-500'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    İzləyicilər ({socialModalUser.followers?.length || 0})
                  </button>
                  <button
                    onClick={() => {
                      setSocialModalType('following');
                      setSocialSearchQuery('');
                    }}
                    className={`pb-2 text-xs font-bold transition-all relative cursor-pointer ${
                      socialModalType === 'following'
                        ? 'text-red-500 border-b-2 border-red-500'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    İzlənilənlər ({socialModalUser.following?.length || 0})
                  </button>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {socialUsersList.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-8 text-center">
                      {socialSearchQuery ? 'Uyğun nəticə tapılmadı.' : 'Hələ heç kim yoxdur.'}
                    </p>
                  ) : (
                    socialUsersList.map((u) => {
                      const isCurrentUser = u.id === currentUser.id;
                      const amIFollowing = currentUser.following.includes(u.id);
                      return (
                        <div key={u.id} className="flex items-center justify-between text-xs">
                          <div 
                            onClick={() => {
                              navigateToUserProfileById(u.id);
                              setShowSocialModal(false);
                            }}
                            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition"
                          >
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="font-semibold leading-none">{u.name}</p>
                              <p className="text-[10px] text-zinc-500 mt-1">@{u.username}</p>
                            </div>
                          </div>

                          {!isCurrentUser && (
                            <button
                              onClick={() => {
                                handleFollowUser(u.id);
                                // Dynamic live update inside modal
                                if (socialModalUser.id === currentUser.id) {
                                  setSocialModalUser(prev => {
                                    if (!prev) return null;
                                    const nextFollowing = prev.following.includes(u.id)
                                      ? prev.following.filter(id => id !== u.id)
                                      : [...prev.following, u.id];
                                    return {
                                      ...prev,
                                      following: nextFollowing,
                                      followingCount: nextFollowing.length
                                    };
                                  });
                                } else if (socialModalUser.id === u.id) {
                                  setSocialModalUser(prev => {
                                    if (!prev) return null;
                                    const nextFollowers = prev.followers.includes(currentUser.id)
                                      ? prev.followers.filter(id => id !== currentUser.id)
                                      : [...prev.followers, currentUser.id];
                                    return {
                                      ...prev,
                                      followers: nextFollowers,
                                      followersCount: nextFollowers.length
                                    };
                                  });
                                }
                              }}
                              className={`py-1 px-3 text-[10px] font-bold rounded-xl transition cursor-pointer ${
                                amIFollowing
                                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/80'
                                  : 'bg-red-600 text-white hover:bg-red-500'
                              }`}
                            >
                              {amIFollowing ? 'İzlənilir' : 'İzlə'}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Collection Modal */}
          {showCreateCollectionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
              <div className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
                <h3 className="text-base font-bold mb-4">Yeni İctimai Kolleksiya Yarat</h3>

                <form onSubmit={handleCreateCollection} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Kolleksiya Başlığı</label>
                    <input
                      type="text"
                      required
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      placeholder="Məs. Ən Yaxşı Trillerlər"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Təsviri (Açıqlama)</label>
                    <textarea
                      rows={2}
                      value={newColDesc}
                      onChange={(e) => setNewColDesc(e.target.value)}
                      placeholder="Bu kolleksiyanın məqsədi və filmlər haqqında qısa izah..."
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Kolleksiya Arxa Plan (Banner) URL</label>
                    <input
                      type="text"
                      value={newColCover}
                      onChange={(e) => setNewColCover(e.target.value)}
                      placeholder="Unsplash və ya hər hansı şəkil linki..."
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Filmləri Seçin (Çoxlu seçim)</label>
                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                      {movies.map((movie) => (
                        <label key={movie.id} className="flex items-center gap-2 text-xs text-zinc-300">
                          <input
                            type="checkbox"
                            checked={newColMovieIds.includes(movie.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewColMovieIds((prev) => [...prev, movie.id]);
                              } else {
                                setNewColMovieIds((prev) => prev.filter((id) => id !== movie.id));
                              }
                            }}
                          />
                          <span className="truncate">{movie.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateCollectionModal(false)}
                      className="py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                    >
                      Ləğv Et
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition"
                    >
                      Kolleksiyanı Yarat
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CineAI Chatbot Component - Right Edge Docked */}
          {currentUser && (
            <div className="fixed bottom-24 right-0 z-50 flex flex-col items-end font-sans transition-all duration-300">
              
              {/* Chatbot Window */}
              {isChatbotOpen && (
                <div className={`mr-4 mb-2 w-[350px] sm:w-[380px] h-[500px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
                  theme === 'dark' ? 'bg-[#0f0f12] border-zinc-800 text-white shadow-black/80' : 'bg-white border-zinc-200 text-zinc-950 shadow-xl'
                }`}>
                  {/* Chatbot Header */}
                  <div className="p-3.5 bg-gradient-to-r from-red-650 via-red-600 to-red-700 text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center relative">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs flex items-center gap-1.5">
                          CineAI
                          <span className="px-1.5 py-0.5 text-[8px] bg-white/20 text-white font-black rounded-md uppercase tracking-wider">v2.0</span>
                        </h4>
                        <span className="text-[9px] text-white/80 font-medium flex items-center gap-1">● Onlayn • Virtual Bələdçi</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setIsChatbotOpen(false)}
                        title="Sağ kənara sıx və gizlət"
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        Qatla
                      </button>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatbotMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-red-600 text-white rounded-tr-none'
                            : theme === 'dark' ? 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800' : 'bg-zinc-100 text-zinc-900 rounded-tl-none border border-zinc-200'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        
                        {/* Interactive movie recommendation tags inside chat */}
                        {msg.recommendedMovieIds && msg.recommendedMovieIds.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 mt-2 w-full">
                            {msg.recommendedMovieIds.map((mid, idx) => {
                              const movie = movies.find(m => m.id === mid);
                              if (!movie) return null;
                              return (
                                <div 
                                  key={`chat_rec_${mid}_${idx}`}
                                  onClick={() => {
                                    setSelectedMovie(movie);
                                    setCurrentView('movie-details');
                                    setIsChatbotOpen(false); // optionally minimize
                                  }}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition hover:border-red-500/40 hover:scale-[1.02] ${
                                    theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                  }`}
                                >
                                  <img src={movie.poster} alt={movie.title} className="w-8 h-10 rounded object-cover" />
                                  <div className="flex-1 min-w-0">
                                    <h5 className="truncate text-xs">{movie.title}</h5>
                                    <p className="text-[9px] text-zinc-500 truncate">{movie.year} • ★ {movie.rating}</p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Interactive book recommendation tags inside chat */}
                        {msg.recommendedBookIds && msg.recommendedBookIds.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 mt-2 w-full">
                            {msg.recommendedBookIds.map((bid, idx) => {
                              const book = books.find(b => b.id === bid);
                              if (!book) return null;
                              return (
                                <div 
                                  key={`chat_rec_book_${bid}_${idx}`}
                                  onClick={() => {
                                    setActiveBookIdForReader(book.id);
                                    setCurrentView('books');
                                    setIsChatbotOpen(false);
                                  }}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition hover:border-red-500/40 hover:scale-[1.02] ${
                                    theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                  }`}
                                >
                                  <img src={book.cover} alt={book.title} className="w-8 h-10 rounded object-cover border border-zinc-800/10" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="px-1 py-[1px] bg-emerald-500/10 text-emerald-500 text-[7px] font-black rounded uppercase">Kitab</span>
                                      <h5 className="truncate text-xs">{book.title}</h5>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 truncate">{book.author} • ★ {book.rating}</p>
                                  </div>
                                  <div className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[9px] font-black shrink-0 flex items-center gap-1 transition">
                                    Oxu
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isChatbotTyping && (
                      <div className="flex items-center gap-1.5 mr-auto">
                        <div className="w-6 h-6 rounded-full bg-red-650/10 flex items-center justify-center border border-red-500/10">
                          <Sparkles className="w-3 h-3 text-red-500 animate-pulse" />
                        </div>
                        <div className={`px-3 py-2 rounded-2xl rounded-tl-none text-[10px] italic ${
                          theme === 'dark' ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          CineAI yazır...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Action Suggestions */}
                  <div className="p-2.5 border-t border-zinc-800/10 bg-zinc-950/20 flex gap-2 overflow-x-auto shrink-0">
                    <button
                      onClick={() => handleSendChatbotMessage("Mənə maraqlı bir kitab təklif et 📚")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border cursor-pointer hover:border-red-500/20 transition ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      📚 Kitab Təklifləri
                    </button>
                    <button
                      onClick={() => handleSendChatbotMessage("Əli və Nino romanı 🌹")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border cursor-pointer hover:border-red-500/20 transition ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      📖 Əli və Nino
                    </button>
                    <button
                      onClick={() => handleSendChatbotMessage("Mənə təsadüfi film təklif et 🍿")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border cursor-pointer hover:border-red-500/20 transition ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      🎲 Təsadüfi Film
                    </button>
                    <button
                      onClick={() => handleSendChatbotMessage("Nolan filmləri hansılardır?")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border cursor-pointer hover:border-red-500/20 transition ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      🎬 Nolan Filmləri
                    </button>
                    <button
                      onClick={() => handleSendChatbotMessage("Ən yüksək reytinqli filmlər")}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border cursor-pointer hover:border-red-500/20 transition ${
                        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}
                    >
                      ⭐ Ən Yaxşılar
                    </button>
                  </div>

                  {/* Input Form */}
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendChatbotMessage(chatbotInput); }}
                    className={`p-3 border-t flex gap-2 items-center ${theme === 'dark' ? 'bg-[#0b0b0e] border-zinc-850' : 'bg-zinc-50 border-zinc-200'}`}
                  >
                    <input
                      type="text"
                      value={chatbotInput}
                      onChange={(e) => setChatbotInput(e.target.value)}
                      placeholder="CineAI-dan film və ya kitab soruşun..."
                      className={`flex-1 px-3 py-2 text-xs rounded-xl focus:outline-none border transition ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500 focus:border-red-600' 
                          : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500'
                      }`}
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition shadow-md shadow-red-650/20 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Right-Edge Docked Collapsible Trigger Tab */}
              {!isChatbotOpen && (
                <button
                  onClick={() => setIsChatbotOpen(true)}
                  className="group flex items-center gap-1 py-2 pl-2.5 pr-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-l-xl shadow-lg shadow-red-950/40 border-l border-t border-b border-red-400/30 transition-all duration-200 hover:pl-3.5 cursor-pointer select-none"
                  title="CineAI Çatını Aç"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-white/90 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  <div className="relative p-1 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-red-700" />
                  </div>
                </button>
              )}

            </div>
          )}

        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
}
