import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ListPlus, Users, Plus, Trash2, Share2, Film, Check, Play, Search,
  PlusCircle, UserPlus, Star, ChevronRight, MessageSquare, Flame, Sparkles,
  Heart, Bookmark, Globe, Lock, Edit3, ShieldAlert
} from 'lucide-react';
import { Movie, User } from '../types';
import { MOCK_USERS } from '../data';
import { 
  apiGetUserMovieCollections,
  apiGetSavedMovieCollections,
  apiGetMovieCollectionById,
  apiCreateMovieCollection,
  apiUpdateMovieCollection,
  apiDeleteMovieCollection,
  apiAddMovieToCollection,
  apiRemoveMovieFromCollection,
  apiToggleMovieCollectionLike,
  apiToggleSaveCollection,
  apiGetBookCollections,
  apiGetUserBookCollections,
  apiCreateBookCollection,
  apiUpdateBookCollection,
  apiDeleteBookCollection,
  apiAddBookToCollection,
  apiRemoveBookFromCollection,
  apiToggleBookCollectionLike,
  apiToggleSaveBookCollection
} from '../api';

interface SharedPlaylistsProps {
  currentUser: User;
  theme: 'dark' | 'light';
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  setCurrentView: (view: string) => void;
}

interface SharedPlaylist {
  id: string;
  name: string;
  description: string;
  creator: string;
  creatorAvatar: string;
  appUserId?: string;
  contributors: { username: string; avatar: string }[];
  movies: Movie[];
  createdAt: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  isSaved: boolean;
  isPublic: boolean;
  coverImageUrl?: string;
}

const INITIAL_PLAYLISTS: SharedPlaylist[] = [
  {
    id: 'playlist_1',
    name: 'Həftəsonu Qorxu və Triller Marafonu 🍿',
    description: 'Dostlarla gecə izləmək üçün ən yaxşı ssenariyə malik trillerlər.',
    creator: 'Ali_98',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    contributors: [
      { username: 'Ali_98', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80' },
      { username: 'Leyla_K', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
      { username: 'Samir_H', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80' }
    ],
    movies: [], // will populate with a couple of movies
    createdAt: '2026-07-01',
    likesCount: 14,
    isLikedByCurrentUser: false,
    isSaved: false,
    isPublic: true
  },
  {
    id: 'playlist_2',
    name: 'Nolan Şah Əsərləri və Elm Kurgu 🚀',
    description: 'Ağlasığmaz süjet xətti, fizika nəzəriyyələri və kosmos mövzulu əfsanələr.',
    creator: 'Emin_Fan',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    contributors: [
      { username: 'Emin_Fan', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' },
      { username: 'Gunay_L', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' }
    ],
    movies: [], // will populate with a couple of movies
    createdAt: '2026-07-04',
    likesCount: 28,
    isLikedByCurrentUser: false,
    isSaved: true,
    isPublic: true
  }
];

export default function SharedPlaylists({
  currentUser,
  theme,
  movies,
  onSelectMovie,
  setCurrentView
}: SharedPlaylistsProps) {
  // Populate initial playlists with real movies
  const getInitialPlaylists = (): SharedPlaylist[] => {
    const list = [...INITIAL_PLAYLISTS];
    if (movies.length > 0) {
      // First playlist gets 1st and 2nd movies
      list[0].movies = [movies[0], movies[Math.min(movies.length - 1, 2)]].filter(Boolean);
      // Second playlist gets 3rd and 4th movies
      list[1].movies = [movies[Math.min(movies.length - 1, 1)], movies[Math.min(movies.length - 1, 3)]].filter(Boolean);
    }
    return list;
  };

  const [playlists, setPlaylists] = useState<SharedPlaylist[]>(getInitialPlaylists());
  const [selectedPlaylist, setSelectedPlaylist] = useState<SharedPlaylist | null>(null);
  
  // Create / Edit Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isPublicCollection, setIsPublicCollection] = useState(true);

  // Filter Tab state ('all' | 'my' | 'saved')
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'saved'>('all');
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Add Movie selector state
  const [showAddMovieDropdown, setShowAddMovieDropdown] = useState(false);
  const [movieSearchQuery, setMovieSearchQuery] = useState('');

  // Invite Friend selector state
  const [showInviteDropdown, setShowInviteDropdown] = useState(false);

  // Success Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Fetch collections from backend on mount if available
  useEffect(() => {
    const fetchBackendCollections = async () => {
      try {
        const userColls = await apiGetUserMovieCollections(currentUser.id || 'me');
        if (Array.isArray(userColls) && userColls.length > 0) {
          const mapped: SharedPlaylist[] = userColls.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            creator: currentUser.username,
            creatorAvatar: currentUser.avatar,
            appUserId: c.appUserId,
            contributors: [{ username: currentUser.username, avatar: currentUser.avatar }],
            movies: [],
            createdAt: 'Yeni',
            likesCount: c.likesCount || 0,
            isLikedByCurrentUser: !!c.isLikedByCurrentUser,
            isSaved: !!c.isSaved,
            isPublic: c.isPublic !== false,
            coverImageUrl: c.coverImageUrl
          }));
          setPlaylists(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mapped.filter(m => !existingIds.has(m.id));
            return [...newOnes, ...prev];
          });
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    fetchBackendCollections();
  }, [currentUser]);

  // Create or Update Collection Handler (CreateMovieCollectionCommandHandler / UpdateMovieCollectionCommandHandler)
  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    if (editingPlaylistId) {
      // Update Collection
      const payload = {
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim() || 'CineVerse üzvlərinin ortaq pleylisti.',
        coverImageUrl: coverImageUrl.trim() || undefined,
        isPublic: isPublicCollection
      };

      setPlaylists(prev => prev.map(p => p.id === editingPlaylistId ? {
        ...p,
        name: payload.name,
        description: payload.description,
        coverImageUrl: payload.coverImageUrl,
        isPublic: payload.isPublic
      } : p));

      if (selectedPlaylist && selectedPlaylist.id === editingPlaylistId) {
        setSelectedPlaylist(prev => prev ? {
          ...prev,
          name: payload.name,
          description: payload.description,
          coverImageUrl: payload.coverImageUrl,
          isPublic: payload.isPublic
        } : null);
      }

      setShowCreateModal(false);
      setEditingPlaylistId(null);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setCoverImageUrl('');
      triggerToast(`"${payload.name}" kolleksiyası yeniləndi! ✏️`);

      try {
        await apiUpdateMovieCollection(editingPlaylistId, payload);
      } catch (err) {
        console.warn('Kolleksiya yeniləmə xətası (lokal rejim):', err);
      }
    } else {
      // Create Collection
      const tempId = 'playlist_' + Date.now();
      const payload = {
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim() || 'CineVerse üzvlərinin ortaq pleylisti.',
        coverImageUrl: coverImageUrl.trim() || undefined,
        isPublic: isPublicCollection
      };

      const newPlaylist: SharedPlaylist = {
        id: tempId,
        name: payload.name,
        description: payload.description,
        coverImageUrl: payload.coverImageUrl,
        creator: currentUser.username,
        creatorAvatar: currentUser.avatar,
        appUserId: currentUser.id,
        contributors: [
          { username: currentUser.username, avatar: currentUser.avatar }
        ],
        movies: [],
        createdAt: new Date().toISOString().split('T')[0],
        likesCount: 0,
        isLikedByCurrentUser: false,
        isSaved: false,
        isPublic: payload.isPublic
      };

      setPlaylists((prev) => [newPlaylist, ...prev]);
      setSelectedPlaylist(newPlaylist);
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setCoverImageUrl('');
      triggerToast(`"${newPlaylist.name}" uğurla yaradıldı! 🎉`);

      try {
        const createdGuid = await apiCreateMovieCollection(payload);
        if (createdGuid) {
          setPlaylists(prev => prev.map(p => p.id === tempId ? { ...p, id: createdGuid } : p));
          setSelectedPlaylist(prev => prev && prev.id === tempId ? { ...prev, id: createdGuid } : prev);
        }
      } catch (err) {
        console.warn('Kolleksiya yaratma xətası (lokal rejim):', err);
      }
    }
  };

  // Tab change handler for GetSavedMovieCollectionsQuery / GetUserMovieCollectionsQuery
  const handleTabChange = async (tab: 'all' | 'my' | 'saved') => {
    setActiveTab(tab);
    if (tab === 'saved') {
      setIsLoadingSaved(true);
      try {
        const savedColls = await apiGetSavedMovieCollections();
        if (Array.isArray(savedColls) && savedColls.length > 0) {
          const mapped: SharedPlaylist[] = savedColls.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            creator: 'İstifadəçi',
            creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            appUserId: c.appUserId,
            contributors: [],
            movies: [],
            createdAt: 'Yadda Saxlanılıb',
            likesCount: c.likesCount || 0,
            isLikedByCurrentUser: !!c.isLikedByCurrentUser,
            isSaved: true,
            isPublic: c.isPublic !== false,
            coverImageUrl: c.coverImageUrl
          }));
          setPlaylists(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mapped.filter(m => !existingIds.has(m.id));
            return [...newOnes, ...prev.map(p => {
              const found = savedColls.find(s => s.id === p.id);
              if (found) return { ...p, isSaved: true };
              return p;
            })];
          });
        }
      } catch (e) {
        console.warn('Yadda saxlanılan kolleksiyalar xətası (lokal rejim):', e);
      } finally {
        setIsLoadingSaved(false);
      }
    }
  };

  const displayedPlaylists = playlists.filter(p => {
    if (activeTab === 'my') {
      return p.creator === currentUser.username || p.appUserId === currentUser.id;
    }
    if (activeTab === 'saved') {
      return p.isSaved;
    }
    return true;
  });

  // GetMovieCollectionByIdQueryHandler integration
  const handleOpenPlaylist = async (p: SharedPlaylist) => {
    setSelectedPlaylist(p);
    try {
      const detail = await apiGetMovieCollectionById(p.id);
      if (detail && detail.id) {
        const detailedPlaylist: SharedPlaylist = {
          ...p,
          name: detail.name || p.name,
          description: detail.description || p.description,
          isPublic: detail.isPublic !== undefined ? detail.isPublic : p.isPublic,
          likesCount: detail.likesCount !== undefined ? detail.likesCount : p.likesCount,
          isLikedByCurrentUser: detail.isLikedByCurrentUser !== undefined ? detail.isLikedByCurrentUser : p.isLikedByCurrentUser,
          isSaved: detail.isSaved !== undefined ? detail.isSaved : p.isSaved,
          coverImageUrl: detail.coverImageUrl || p.coverImageUrl,
          movies: detail.movies && detail.movies.length > 0
            ? detail.movies.map((m: any) => ({
                id: m.id,
                title: m.title || '',
                originalTitle: m.originalTitle || m.title || '',
                description: m.description || m.synopsis || '',
                poster: m.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
                banner: m.banner || m.backdrop || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
                rating: m.rating || 8.0,
                year: m.year || 2024,
                duration: m.duration || '120 dəq',
                genres: m.genres || (m.genre ? [m.genre] : ['Dram']),
                director: m.director || '',
                cast: m.cast || [],
                trailerUrl: m.trailerUrl || '',
                likes: m.likes || 0,
                reviews: m.reviews || []
              }))
            : p.movies
        };
        setSelectedPlaylist(detailedPlaylist);
        setPlaylists(prev => prev.map(item => item.id === p.id ? detailedPlaylist : item));
      }
    } catch (err) {
      console.warn('Kolleksiya ətraflı məlumatı yüklənmə xətası (lokal rejim):', err);
    }
  };
  const isPlaylistOwnerOrContributor = (p: SharedPlaylist | null) => {
    if (!p || !currentUser) return false;
    return (
      p.creator === currentUser.username ||
      p.creator === currentUser.name ||
      p.appUserId === currentUser.id ||
      p.contributors?.some(c => c.username === currentUser.username) ||
      currentUser.role === 'admin'
    );
  };

  const handleDeletePlaylist = async (collectionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = playlists.find(p => p.id === collectionId);
    if (target && !isPlaylistOwnerOrContributor(target)) {
      triggerToast('Yalnız müəllif və ya həmmüəlliflər bu siyahını silə bilər!');
      return;
    }
    if (!window.confirm('Bu kolleksiyanı silmək istədiyinizdən əminsiniz?')) return;

    setPlaylists(prev => prev.filter(p => p.id !== collectionId));
    if (selectedPlaylist && selectedPlaylist.id === collectionId) {
      setSelectedPlaylist(null);
    }
    triggerToast('Kolleksiya silindi.');

    try {
      await apiDeleteMovieCollection(collectionId);
    } catch (err) {
      console.warn('Kolleksiya silmə xətası (lokal rejim):', err);
    }
  };

  // Toggle Like Collection Handler (ToggleMovieCollectionLikeCommandHandler)
  const handleToggleLike = async (collectionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    let previousIsLiked = false;
    let previousCount = 0;

    setPlaylists(prev => prev.map(p => {
      if (p.id === collectionId) {
        previousIsLiked = p.isLikedByCurrentUser;
        previousCount = p.likesCount;
        const nextLiked = !previousIsLiked;
        return {
          ...p,
          isLikedByCurrentUser: nextLiked,
          likesCount: nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1)
        };
      }
      return p;
    }));

    if (selectedPlaylist && selectedPlaylist.id === collectionId) {
      setSelectedPlaylist(prev => {
        if (!prev) return null;
        const nextLiked = !prev.isLikedByCurrentUser;
        return {
          ...prev,
          isLikedByCurrentUser: nextLiked,
          likesCount: nextLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1)
        };
      });
    }

    try {
      const serverResLiked = await apiToggleMovieCollectionLike(collectionId);
      if (typeof serverResLiked === 'boolean') {
        setPlaylists(prev => prev.map(p => {
          if (p.id === collectionId) {
            return {
              ...p,
              isLikedByCurrentUser: serverResLiked
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Bəyənmə xətası:', err);
      // Rollback
      setPlaylists(prev => prev.map(p => p.id === collectionId ? { ...p, isLikedByCurrentUser: previousIsLiked, likesCount: previousCount } : p));
      if (selectedPlaylist && selectedPlaylist.id === collectionId) {
        setSelectedPlaylist(prev => prev ? { ...prev, isLikedByCurrentUser: previousIsLiked, likesCount: previousCount } : null);
      }
    }
  };

  // Toggle Save Collection Handler (ToggleSaveCollectionCommandHandler)
  const handleToggleSave = async (collectionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    let previousSaved = false;

    setPlaylists(prev => prev.map(p => {
      if (p.id === collectionId) {
        previousSaved = p.isSaved;
        return { ...p, isSaved: !previousSaved };
      }
      return p;
    }));

    if (selectedPlaylist && selectedPlaylist.id === collectionId) {
      setSelectedPlaylist(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null);
    }

    try {
      const isNowSaved = await apiToggleSaveCollection(collectionId);
      if (typeof isNowSaved === 'boolean') {
        setPlaylists(prev => prev.map(p => p.id === collectionId ? { ...p, isSaved: isNowSaved } : p));
        if (selectedPlaylist && selectedPlaylist.id === collectionId) {
          setSelectedPlaylist(prev => prev ? { ...prev, isSaved: isNowSaved } : null);
        }
        triggerToast(isNowSaved ? 'Kolleksiya yadda saxlanıldı! 🔖' : 'Kolleksiya yaddaşdan çıxarıldı.');
      }
    } catch (err) {
      console.error('Yadda saxlama xətası:', err);
      // Rollback
      setPlaylists(prev => prev.map(p => p.id === collectionId ? { ...p, isSaved: previousSaved } : p));
    }
  };

  // Add Movie to Collection Handler (AddMovieToCollectionCommandHandler)
  const handleAddMovieToPlaylist = async (movie: Movie) => {
    if (!selectedPlaylist) return;
    if (!isPlaylistOwnerOrContributor(selectedPlaylist)) {
      triggerToast('Yalnız müəllif və ya həmmüəlliflər bu pleylistə film əlavə edə bilər!');
      return;
    }

    // Check if movie already in playlist
    if (selectedPlaylist.movies.some(m => m.id === movie.id)) {
      triggerToast('Bu film artıq pleylistdə mövcuddur!');
      return;
    }

    const updatedPlaylist = {
      ...selectedPlaylist,
      movies: [...selectedPlaylist.movies, movie]
    };

    setPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);
    setShowAddMovieDropdown(false);
    setMovieSearchQuery('');
    triggerToast(`"${movie.title}" siyahıya əlavə edildi! 🎬`);

    try {
      await apiAddMovieToCollection(selectedPlaylist.id, movie.id);
    } catch (err) {
      console.error('Filmi kolleksiyaya əlavə etmə xətası:', err);
    }
  };

  // Remove Movie from Collection Handler (RemoveMovieFromCollectionCommandHandler)
  const handleRemoveMovieFromPlaylist = async (movieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPlaylist) return;
    if (!isPlaylistOwnerOrContributor(selectedPlaylist)) {
      triggerToast('Yalnız müəllif və ya həmmüəlliflər filmi siyahıdan çıxara bilər!');
      return;
    }

    const collectionId = selectedPlaylist.id;

    const updatedPlaylist = {
      ...selectedPlaylist,
      movies: selectedPlaylist.movies.filter(m => m.id !== movieId)
    };

    setPlaylists(prev => prev.map(p => p.id === collectionId ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);
    triggerToast('Film pleylistdən çıxarıldı.');

    try {
      await apiRemoveMovieFromCollection(collectionId, movieId);
    } catch (err) {
      console.warn('Filmi kolleksiyadan çıxarma backend sinxronizasiyası (lokal yeniləndi):', err);
    }
  };

  const handleInviteContributor = (contributor: typeof MOCK_USERS[0]) => {
    if (!selectedPlaylist) return;
    if (!isPlaylistOwnerOrContributor(selectedPlaylist)) {
      triggerToast('Yalnız müəllif və ya həmmüəlliflər başqalarını dəvət edə bilər!');
      return;
    }

    // Check if already a contributor
    if (selectedPlaylist.contributors.some(c => c.username === contributor.username)) {
      triggerToast('Bu istifadəçi artıq dəvət olunub!');
      return;
    }

    const updatedPlaylist = {
      ...selectedPlaylist,
      contributors: [...selectedPlaylist.contributors, { username: contributor.username, avatar: contributor.avatar }]
    };

    setPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);
    setShowInviteDropdown(false);
    triggerToast(`@${contributor.username} pleylistə dəvət edildi! 🤝`);

    // Simulate collaborative action: Friend adding a movie after 4 seconds
    setTimeout(() => {
      // Find a movie not in the playlist
      const movieToAdd = movies.find(m => !updatedPlaylist.movies.some(pm => pm.id === m.id));
      if (movieToAdd) {
        const finalPlaylist = {
          ...updatedPlaylist,
          movies: [...updatedPlaylist.movies, movieToAdd]
        };
        setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? finalPlaylist : p));
        if (selectedPlaylist && selectedPlaylist.id === updatedPlaylist.id) {
          setSelectedPlaylist(finalPlaylist);
        }
        triggerToast(`@${contributor.username} yeni bir film əlavə etdi: "${movieToAdd.title}" 🍿`);
      }
    }, 4500);
  };

  const openEditModal = (p: SharedPlaylist, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isPlaylistOwnerOrContributor(p)) {
      triggerToast('Yalnız müəllif və ya həmmüəlliflər bu pleylisti redaktə edə bilər!');
      return;
    }
    setEditingPlaylistId(p.id);
    setNewPlaylistName(p.name);
    setNewPlaylistDesc(p.description);
    setCoverImageUrl(p.coverImageUrl || '');
    setIsPublicCollection(p.isPublic);
    setShowCreateModal(true);
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(movieSearchQuery.toLowerCase()) ||
    m.genres.some(g => g.toLowerCase().includes(movieSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-red-500/40 text-white text-xs px-5 py-3 rounded-2xl shadow-[0_0_20px_-3px_rgba(239,68,68,0.3)] animate-bounce flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5 ${
        theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
      }`}>
        <div>
          <h1 className="text-xl font-bold tracking-tight font-display flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-red-500" /> Ortaq Pleylistlər (Shared Playlists)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Dostlarınızla eyni siyahını idarə edin. Hər kəs siyahıya sevdiyi filmləri əlavə edə bilər.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPlaylistId(null);
            setNewPlaylistName('');
            setNewPlaylistDesc('');
            setIsPublicCollection(true);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-wider font-bold rounded-full shadow-lg shadow-red-600/10 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Yeni Ortaq Pleylist
        </button>
      </div>

      {selectedPlaylist ? (
        /* Detailed Playlist Viewer & Editor */
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-red-500 transition cursor-pointer"
          >
            ← Bütün Siyahılara Qayıt
          </button>

          {/* Playlist Details Board with Neon design */}
          <div className={`p-6 rounded-3xl border backdrop-blur-xl relative ${
            theme === 'dark' ? 'bg-gradient-to-br from-zinc-900/30 to-black/30 border-red-500/10' : 'bg-white border-zinc-200 shadow-sm'
          }`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-bl-full rounded-tr-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl font-black font-display tracking-tight ${
                    theme === 'dark' ? 'text-white' : 'text-zinc-900'
                  }`}>{selectedPlaylist.name}</h2>
                  {selectedPlaylist.isPublic ? (
                    <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      <Globe className="w-3 h-3" /> İctimai
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                      <Lock className="w-3 h-3" /> Şəxsi
                    </span>
                  )}
                </div>

                <p className={`text-xs max-w-xl leading-relaxed ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                }`}>{selectedPlaylist.description}</p>
                
                <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 font-mono pt-1">
                  <span>Yaradan: <strong>@{selectedPlaylist.creator}</strong></span>
                  <span>•</span>
                  <span>{selectedPlaylist.createdAt}</span>
                </div>
              </div>

              {/* Contributors & Quick Actions */}
              <div className="flex items-center gap-4">
                {/* Like & Save buttons */}
                <div className="flex items-center gap-2 border-r border-zinc-800/40 pr-4">
                  <button
                    onClick={(e) => handleToggleLike(selectedPlaylist.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      selectedPlaylist.isLikedByCurrentUser
                        ? 'bg-red-600/20 text-red-500 border-red-500/40'
                        : 'bg-zinc-800/20 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                    title="Bəyən"
                  >
                    <Heart className={`w-3.5 h-3.5 ${selectedPlaylist.isLikedByCurrentUser ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{selectedPlaylist.likesCount}</span>
                  </button>

                  <button
                    onClick={(e) => handleToggleSave(selectedPlaylist.id, e)}
                    className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                      selectedPlaylist.isSaved
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-zinc-800/20 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                    title="Yadda saxla"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${selectedPlaylist.isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  {isPlaylistOwnerOrContributor(selectedPlaylist) && (
                    <>
                      <button
                        onClick={(e) => openEditModal(selectedPlaylist, e)}
                        className="p-2 rounded-xl border bg-zinc-800/20 border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Kolleksiyanı Redaktə Et"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeletePlaylist(selectedPlaylist.id, e)}
                        className="p-2 rounded-xl border bg-red-950/20 border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition cursor-pointer"
                        title="Kolleksiyanı Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Contributors / Collaboration layout */}
                <div className="space-y-1 shrink-0">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Həmmüəlliflər ({selectedPlaylist.contributors.length})</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-2.5 overflow-hidden">
                      {selectedPlaylist.contributors.map((c, i) => (
                        <img
                          key={i}
                          src={c.avatar}
                          alt={c.username}
                          title={`@${c.username}`}
                          className="w-8 h-8 rounded-full border-2 border-zinc-950 object-cover"
                        />
                      ))}
                    </div>

                    {/* Invite collaborator button */}
                    {isPlaylistOwnerOrContributor(selectedPlaylist) && (
                      <div className="relative">
                        <button
                          onClick={() => setShowInviteDropdown(!showInviteDropdown)}
                          className="w-8 h-8 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                          title="Dostunu Dəvət et 👥"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>

                        {showInviteDropdown && (
                          <>
                            <div 
                              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
                              onClick={() => setShowInviteDropdown(false)}
                            />
                            <div className={`absolute top-10 right-0 z-50 w-56 p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1 border ${
                              theme === 'dark' 
                                ? 'bg-zinc-900 border-zinc-700 text-white shadow-2xl shadow-black/80' 
                                : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
                            }`}>
                              <p className="text-[10px] font-mono uppercase text-zinc-400 p-1 tracking-wider">Kinoçuları Dəvət et</p>
                              {MOCK_USERS.filter(u => u.username !== currentUser.username).slice(0, 5).map((u) => (
                                <button
                                  key={u.id}
                                  onClick={() => handleInviteContributor(u)}
                                  className={`w-full p-2 flex items-center justify-between gap-2 rounded-xl text-left text-xs font-semibold cursor-pointer ${
                                    theme === 'dark' 
                                      ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white' 
                                      : 'hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                    <span className="truncate">@{u.username}</span>
                                  </div>
                                  <span className="text-[10px] text-red-500 font-bold">+ Dəvət</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons inside detail view */}
            {isPlaylistOwnerOrContributor(selectedPlaylist) && (
              <div className="mt-6 border-t border-zinc-800/10 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddMovieDropdown(!showAddMovieDropdown)}
                    className={`flex items-center gap-1.5 py-2 px-4 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md ${
                      showAddMovieDropdown 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' 
                        : 'bg-red-600 hover:bg-red-500 shadow-red-600/10'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    {showAddMovieDropdown ? 'Axtarışı Bağla' : 'Filmlər Əlavə Et'}
                  </button>
                </div>
              </div>
            )}

              {/* Inline Add Movie Panel - pushes content down naturally without overlapping */}
              {showAddMovieDropdown && (
                <div className={`mt-4 p-4 sm:p-5 rounded-2xl space-y-3.5 border transition-all ${
                  theme === 'dark' 
                    ? 'bg-zinc-950/90 border-zinc-800 text-white shadow-xl' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/20">
                    <span className="text-xs font-bold font-display flex items-center gap-2 uppercase tracking-wider text-red-500">
                      <Film className="w-4 h-4" /> Siyahıya Film Əlavə Et
                    </span>
                    <button
                      onClick={() => setShowAddMovieDropdown(false)}
                      className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 transition cursor-pointer"
                    >
                      ✕ Bağla
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={movieSearchQuery}
                      onChange={(e) => setMovieSearchQuery(e.target.value)}
                      placeholder="Filmin adı və ya janrına görə axtar..."
                      autoFocus
                      className={`w-full rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 ${
                        theme === 'dark' 
                          ? 'bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500' 
                          : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {filteredMovies.length === 0 ? (
                      <div className="col-span-full py-6 text-center text-xs text-zinc-500">Axtarışa uyğun film tapılmadı</div>
                    ) : (
                      filteredMovies.map((movie) => {
                        const isAlreadyAdded = selectedPlaylist.movies.some(m => m.id === movie.id);
                        return (
                          <button
                            key={movie.id}
                            disabled={isAlreadyAdded}
                            onClick={() => handleAddMovieToPlaylist(movie)}
                            className={`p-2 flex items-center justify-between gap-2.5 rounded-xl text-left text-xs transition cursor-pointer border ${
                              isAlreadyAdded 
                                ? 'opacity-50 bg-zinc-900/30 border-transparent cursor-not-allowed'
                                : theme === 'dark' 
                                  ? 'bg-zinc-900/60 border-zinc-800/60 hover:bg-zinc-800 hover:border-zinc-700 text-white' 
                                  : 'bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={movie.poster} alt={movie.title} className="w-8 h-10 rounded object-cover shrink-0 shadow-xs" />
                              <div className="truncate min-w-0">
                                <p className="font-bold truncate leading-tight">{movie.title}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{movie.year} • {movie.genres.slice(0, 2).join(', ')}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2.5 py-1 rounded-lg shrink-0 font-semibold ${
                              isAlreadyAdded
                                ? 'bg-zinc-800 text-zinc-500'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-xs'
                            }`}>
                              {isAlreadyAdded ? 'Əlavə edilib' : '+ Əlavə et'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

          {/* Collaborative playlist movies rendering list */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-[2px] text-zinc-500 flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" /> Pleylistdəki Filmlər ({selectedPlaylist.movies.length})
            </h3>

            {selectedPlaylist.movies.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl space-y-3">
                <p className="text-sm text-zinc-500">Bu siyahı hazırda boşdur.</p>
                <button
                  onClick={() => setShowAddMovieDropdown(true)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-850 cursor-pointer"
                >
                  İlk Filmi Sən Əlavə Et 🍿
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPlaylist.movies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => onSelectMovie(movie)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-4 cursor-pointer hover:border-red-500/25 transition duration-300 relative group ${
                      theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200/60'
                    }`}
                  >
                    <img 
                      src={movie.poster} 
                      alt={movie.title} 
                      className="w-12 h-16 rounded-xl object-cover shrink-0 shadow-lg group-hover:scale-105 transition duration-300" 
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-zinc-500">{movie.year}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="text-[10px] text-red-400 font-mono flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-red-500/20 text-red-500" />
                          {movie.rating}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold truncate mt-1 group-hover:text-red-500 transition duration-300">
                        {movie.title}
                      </h4>
                      <p className="text-[9px] text-zinc-500 mt-1 truncate">{movie.genres.join(' • ')}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Delete from playlist (RemoveMovieFromCollectionCommandHandler) */}
                      {isPlaylistOwnerOrContributor(selectedPlaylist) && (
                        <button
                          onClick={(e) => handleRemoveMovieFromPlaylist(movie.id, e)}
                          className="p-2 bg-zinc-800/20 hover:bg-red-950/20 border border-zinc-800 text-zinc-500 hover:text-red-500 rounded-xl transition cursor-pointer"
                          title="Siyahıdan Çıxart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:translate-x-1 transition duration-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid Playlists Dashboard feed list */
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-800/40 pb-3">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-zinc-800/30 text-zinc-400 hover:text-white border border-zinc-800/60'
              }`}
            >
              Bütün Kolleksiyalar
            </button>
            <button
              onClick={() => handleTabChange('my')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'my'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-zinc-800/30 text-zinc-400 hover:text-white border border-zinc-800/60'
              }`}
            >
              Mənim Kolleksiyalarım
            </button>
            <button
              onClick={() => handleTabChange('saved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-zinc-800/30 text-zinc-400 hover:text-white border border-zinc-800/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Yadda Saxlanılanlar
            </button>
          </div>

          {isLoadingSaved ? (
            <div className="py-12 text-center text-xs text-zinc-500">Kolleksiyalar yüklənir...</div>
          ) : displayedPlaylists.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">
              {activeTab === 'saved' ? 'Hələ heç bir kolleksiyanı yadda saxlamamısınız.' : 'Heç bir kolleksiya tapılmadı.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedPlaylists.map((p, index) => (
                <motion.div
                  key={p.id}
                  onClick={() => handleOpenPlaylist(p)}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -45 : 45, y: 25, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className={`p-5 rounded-3xl border cursor-pointer hover:border-red-500/25 transition duration-300 relative group flex flex-col justify-between h-[230px] ${
                    theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition duration-300" />
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1.5 overflow-hidden">
                    {p.contributors.map((c, idx) => (
                      <img
                        key={idx}
                        src={c.avatar}
                        alt={c.username}
                        title={`@${c.username}`}
                        className="w-6 h-6 rounded-full border border-zinc-950 object-cover shrink-0"
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Like button in feed */}
                    <button
                      onClick={(e) => handleToggleLike(p.id, e)}
                      className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        p.isLikedByCurrentUser
                          ? 'bg-red-600/20 text-red-500 border-red-500/40'
                          : 'bg-zinc-800/20 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                      title="Bəyən"
                    >
                      <Heart className={`w-3 h-3 ${p.isLikedByCurrentUser ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{p.likesCount}</span>
                    </button>

                    {/* Bookmark button in feed */}
                    <button
                      onClick={(e) => handleToggleSave(p.id, e)}
                      className={`p-1 rounded-full border text-[10px] transition cursor-pointer ${
                        p.isSaved
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-zinc-800/20 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                      title="Yadda saxla"
                    >
                      <Bookmark className={`w-3 h-3 ${p.isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>

                    <span className="text-[9px] font-mono text-zinc-500 bg-zinc-800/20 px-2 py-0.5 rounded border border-zinc-800/40">
                      {p.movies.length} FİLM
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold font-display tracking-tight mt-3 group-hover:text-red-500 transition duration-300 leading-snug line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/10 pt-3 mt-3 text-[10px] font-mono text-zinc-500">
                <span>Yaradan: <strong className="text-zinc-400">@{p.creator}</strong></span>
                <span className="flex items-center gap-1 text-red-500 font-bold group-hover:underline">
                  Siyahıya bax →
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )}

      {/* New / Edit Shared Playlist modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl relative ${
            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <h3 className="text-sm font-bold font-display tracking-tight mb-4 flex items-center gap-2">
              <ListPlus className="w-4 h-4 text-red-500" />
              {editingPlaylistId ? 'Kolleksiyanı Redaktə Et' : 'Yeni Ortaq Pleylist Yarat'}
            </h3>

            <form onSubmit={handleSavePlaylist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Siyahı Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Məsələn: Dostlarla qorxu gecəsi... 👻"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Təsviri (İstəyə görə)</label>
                <textarea
                  placeholder="Bu pleylist haqqında qısa məlumat..."
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Örtük Şəkli URL-i (İstəyə görə)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublicCheckbox"
                  checked={isPublicCollection}
                  onChange={(e) => setIsPublicCollection(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <label htmlFor="isPublicCheckbox" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Hər kəsə açıq (İctimai) kolleksiya kimi yayımla
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold hover:bg-white/5 text-zinc-400 transition cursor-pointer"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg transition cursor-pointer"
                >
                  {editingPlaylistId ? 'Yenilə ✨' : 'Pleylisti Yarat 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

