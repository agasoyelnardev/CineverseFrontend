import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, Search, Star, Heart, Bookmark, List, Layers, 
  ArrowRight, Film, MessageSquare, Plus, ChevronRight, Check, 
  Trash2, Award, Sparkles, Sliders, ThumbsUp, ThumbsDown, BookOpenCheck,
  X, HelpCircle, Edit3, ArrowLeft, ChevronLeft, Settings, Type,
  Maximize2, Minimize2, FileText, Download
} from 'lucide-react';
import { Book, BookReview, BookCollection, BookVsMovie, Movie, User } from '../types';
import { BookGridSkeleton } from './SkeletonLoader';
import LazyImage from './LazyImage';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { 
  apiGetBookCollections,
  apiCreateBookCollection,
  apiAddBookToCollection,
  apiRemoveBookFromCollection,
  apiDeleteBookCollection,
  apiGetUserBookCollections,
  apiCreateBookReview,
  apiUpdateBookReview,
  apiDeleteBookReview,
  apiLikeBookReview,
  apiDislikeBookReview,
  apiGetBookReviewsByBookId,
  apiGetAllBookVsMovies,
  apiVoteBookVsMovie,
  apiUnvoteBookVsMovie,
  apiToggleBookFavorite,
  apiToggleBookWatchlist,
  apiUpdateReadingProgress
} from '../api';

interface BooksSectionProps {
  books: Book[];
  setBooks: React.Dispatch<React.SetStateAction<Book[]>>;
  bookCollections: BookCollection[];
  setBookCollections: React.Dispatch<React.SetStateAction<BookCollection[]>>;
  bookVsMovies: BookVsMovie[];
  setBookVsMovies: React.Dispatch<React.SetStateAction<BookVsMovie[]>>;
  movies: Movie[];
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  onViewMovie: (movieId: string) => void;
  theme: 'dark' | 'light';
  initialSelectedBookId?: string | null;
  onClearInitialBookId?: () => void;
  initialActiveReaderBookId?: string | null;
  onClearInitialReaderBookId?: () => void;
}

export default function BooksSection({
  books,
  setBooks,
  bookCollections,
  setBookCollections,
  bookVsMovies,
  setBookVsMovies,
  movies,
  currentUser,
  setCurrentUser,
  onViewMovie,
  theme,
  initialSelectedBookId,
  onClearInitialBookId,
  initialActiveReaderBookId,
  onClearInitialReaderBookId
}: BooksSectionProps) {
  // Navigation & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<'All' | 'az' | 'en'>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'collections' | 'vs' | 'my-lists'>('all');
  const [isBooksLoading, setIsBooksLoading] = useState<boolean>(false);

  // Trigger brief shimmer loading state when tab or filters change
  useEffect(() => {
    setIsBooksLoading(true);
    const timer = setTimeout(() => {
      setIsBooksLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, selectedLanguage, activeTab]);
  
  // Modals / Details State
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeReaderBook, setActiveReaderBook] = useState<Book | null>(null);

  // Auto-open book directly in reader
  React.useEffect(() => {
    if (initialActiveReaderBookId) {
      const b = books.find(book => book.id === initialActiveReaderBookId);
      if (b) {
        setActiveReaderBook(b);
        if (onClearInitialReaderBookId) {
          onClearInitialReaderBookId();
        }
      }
    }
  }, [initialActiveReaderBookId, books, onClearInitialReaderBookId]);

  // Auto-open book when directed from movie details page
  React.useEffect(() => {
    if (initialSelectedBookId) {
      const b = books.find(book => book.id === initialSelectedBookId);
      if (b) {
        setSelectedBook(b);
      }
    }
  }, [initialSelectedBookId, books]);

  // Load reviews for selectedBook from backend
  React.useEffect(() => {
    if (!selectedBook?.id) return;
    let isMounted = true;
    async function loadReviews() {
      try {
        const rawReviews = await apiGetBookReviewsByBookId(selectedBook!.id);
        if (Array.isArray(rawReviews) && isMounted) {
          const mappedReviews: BookReview[] = rawReviews.map((r: any) => ({
            id: r.id || r.Id || '',
            bookId: selectedBook!.id,
            bookTitle: selectedBook!.title,
            userId: r.userId || r.UserId || '',
            username: r.author || r.Author || r.username || r.Username || 'Unknown',
            userAvatar: r.userAvatar || r.UserAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            rating: r.rating ?? r.Rating ?? 5,
            comment: r.comment || r.Comment || '',
            likes: r.likes ?? r.Likes ?? 0,
            dislikes: r.dislikes ?? r.Dislikes ?? 0,
            date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : (r.CreatedAt ? new Date(r.CreatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
          }));
          
          setSelectedBook(prev => {
            if (!prev || prev.id !== selectedBook!.id) return prev;
            return {
              ...prev,
              reviews: mappedReviews
            };
          });
        }
      } catch (err) {
        console.warn('Could not load book reviews from backend:', err);
      }
    }
    loadReviews();
    return () => { isMounted = false; };
  }, [selectedBook?.id]);

  // Handler to clear initialSelectedBookId when modal closes
  const handleCloseBookModal = () => {
    setSelectedBook(null);
    if (onClearInitialBookId) {
      onClearInitialBookId();
    }
  };
  const [showProgressModal, setShowProgressModal] = useState<Book | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  
  // Custom Reading Lists State
  const [newListName, setNewListName] = useState('');
  const [showAddToListModal, setShowAddToListModal] = useState<Book | null>(null);

  // Book Collection Modal State
  const [showCreateBookCollectionModal, setShowCreateBookCollectionModal] = useState(false);
  const [selectedBookCollection, setSelectedBookCollection] = useState<BookCollection | null>(null);
  const [newBookColTitle, setNewBookColTitle] = useState('');
  const [newBookColDesc, setNewBookColDesc] = useState('');
  const [newBookColCover, setNewBookColCover] = useState('');
  const [newBookColSelectedBooks, setNewBookColSelectedBooks] = useState<string[]>([]);
  const [selectedBookToAdd, setSelectedBookToAdd] = useState('');

  // Fetch backend book collections on mount
  useEffect(() => {
    const fetchBackendBookColls = async () => {
      try {
        const colls = await apiGetBookCollections();
        if (Array.isArray(colls) && colls.length > 0) {
          const mapped: BookCollection[] = colls.map((c: any) => ({
            id: c.id,
            title: c.title || c.name || 'Kitab Kolleksiyası',
            description: c.description || '',
            cover: c.cover || c.coverImageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
            books: Array.isArray(c.books) ? c.books.map((b: any) => typeof b === 'string' ? b : b.id) : []
          }));
          setBookCollections(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mapped.filter(m => !existingIds.has(m.id));
            return [...newOnes, ...prev];
          });
        }
      } catch (err) {
        // Fallback gracefully to local state
      }
    };
    fetchBackendBookColls();
  }, []);

  // Handler to Create Book Collection via API
  const handleCreateBookCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookColTitle.trim()) return;

    const tempId = 'bc_' + Date.now();
    const coverUrl = newBookColCover.trim() || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80';
    const initialBookIds = [...newBookColSelectedBooks];

    const newCollection: BookCollection = {
      id: tempId,
      title: newBookColTitle.trim(),
      description: newBookColDesc.trim() || 'CineVerse kitabsevərlərinin özəl kitab kolleksiyası.',
      cover: coverUrl,
      books: initialBookIds
    };

    setBookCollections(prev => [newCollection, ...prev]);
    setShowCreateBookCollectionModal(false);
    setNewBookColTitle('');
    setNewBookColDesc('');
    setNewBookColCover('');
    setNewBookColSelectedBooks([]);

    try {
      const res: any = await apiCreateBookCollection({
        title: newCollection.title,
        description: newCollection.description,
        cover: newCollection.cover
      });
      const returnedId = (typeof res === 'string' ? res : res?.id || res?.result) || tempId;
      if (returnedId && returnedId !== tempId) {
        setBookCollections(prev => prev.map(c => c.id === tempId ? { ...c, id: returnedId } : c));
        if (selectedBookCollection?.id === tempId) {
          setSelectedBookCollection(prev => prev ? { ...prev, id: returnedId } : null);
        }
      }
      if (initialBookIds.length > 0) {
        for (const bookId of initialBookIds) {
          try {
            await apiAddBookToCollection(returnedId, bookId);
          } catch (err) {
            console.error('Kolleksiyaya kitab əlavə xətası:', err);
          }
        }
      }
    } catch (err) {
      console.error('Kitab kolleksiyası yaratma xətası:', err);
    }
  };

  const handleDeleteBookCollection = async (colId: string) => {
    if (window.confirm('Bu kitab kolleksiyasını silmək istədiyinizdən əminsiniz?')) {
      setBookCollections(prev => prev.filter(c => c.id !== colId));
      if (selectedBookCollection?.id === colId) {
        setSelectedBookCollection(null);
      }
      try {
        await apiDeleteBookCollection(colId);
      } catch (err) {
        console.error('Kitab kolleksiyasını silmə xətası:', err);
      }
    }
  };

  const handleAddBookToBookCollection = async (colId: string, bookId: string) => {
    setBookCollections(prev => prev.map(col => {
      if (col.id === colId) {
        const currentBooks = Array.isArray(col.books) ? col.books : [];
        if (currentBooks.includes(bookId)) {
          alert('Bu kitab artıq kolleksiyadadır!');
          return col;
        }
        const updated = {
          ...col,
          books: [...currentBooks, bookId]
        };
        if (selectedBookCollection?.id === colId) {
          setSelectedBookCollection(updated);
        }
        return updated;
      }
      return col;
    }));
    setShowAddToListModal(null);
    setSelectedBookToAdd('');

    try {
      await apiAddBookToCollection(colId, bookId);
    } catch (err) {
      console.error('Kitabı kolleksiyaya əlavə etmə xətası:', err);
    }
  };

  const handleRemoveBookFromBookCollection = async (colId: string, bookId: string) => {
    setBookCollections(prev => prev.map(col => {
      if (col.id === colId) {
        const currentBooks = Array.isArray(col.books) ? col.books : [];
        const updated = {
          ...col,
          books: currentBooks.filter(id => id !== bookId)
        };
        if (selectedBookCollection?.id === colId) {
          setSelectedBookCollection(updated);
        }
        return updated;
      }
      return col;
    }));

    try {
      await apiRemoveBookFromCollection(colId, bookId);
    } catch (err) {
      console.warn('Kitabı kolleksiyadan silmə backend sinxronizasiyası (lokal yeniləndi):', err);
    }
  };

  // New Review Form State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');

  // Book Review Editing States
  const [editingBookReviewId, setEditingBookReviewId] = useState<string | null>(null);
  const [editingBookReviewComment, setEditingBookReviewComment] = useState<string>('');
  const [editingBookReviewRating, setEditingBookReviewRating] = useState<number>(5);

  // Collect all unique genres
  const allGenres = ['All', ...Array.from(new Set(books.flatMap(b => b.genres)))];

  // Filters logic
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = selectedGenre === 'All' || book.genres.includes(selectedGenre);
    const matchesLang = selectedLanguage === 'All' || book.language === selectedLanguage;
    return matchesSearch && matchesGenre && matchesLang;
  });

  const trendingBooks = filteredBooks.filter(b => b.isTrending);
  const topRatedBooks = filteredBooks.filter(b => b.isTopRated || b.rating >= 4.8);
  const newReleases = filteredBooks.filter(b => b.isNewRelease);
  const azBooks = filteredBooks.filter(b => b.language === 'az');
  const enBooks = filteredBooks.filter(b => b.language === 'en');

  // Favorite handler
  const toggleFavoriteBook = async (bookId: string) => {
    if (!currentUser) {
      alert('Zəhmət olmasa, əvvəlcə daxil olun!');
      return;
    }
    const currentFavs = currentUser.favoriteBooks || [];
    const isFav = currentFavs.includes(bookId);
    
    const updatedFavs = isFav 
      ? currentFavs.filter(id => id !== bookId)
      : [...currentFavs, bookId];

    const updatedUser: User = {
      ...currentUser,
      favoriteBooks: updatedFavs
    };
    setCurrentUser(updatedUser);

    try {
      await apiToggleBookFavorite(bookId);
    } catch (err) {
      console.warn('Backend toggle book favorite error:', err);
    }
  };

  // Watchlist (Oxuma Siyahısı) handler
  const toggleWatchlistBook = async (bookId: string) => {
    if (!currentUser) {
      alert('Zəhmət olmasa, əvvəlcə daxil olun!');
      return;
    }
    const currentWatchlist = currentUser.watchlistBooks || [];
    const isInList = currentWatchlist.includes(bookId);

    const updatedWatchlist = isInList
      ? currentWatchlist.filter(id => id !== bookId)
      : [...currentWatchlist, bookId];

    const updatedUser: User = {
      ...currentUser,
      watchlistBooks: updatedWatchlist
    };
    setCurrentUser(updatedUser);

    try {
      await apiToggleBookWatchlist(bookId);
    } catch (err) {
      console.warn('Backend toggle book watchlist error:', err);
    }
  };

  // Reading Progress Handler
  const handleOpenProgress = (book: Book) => {
    if (!currentUser) {
      alert('Zəhmət olmasa, əvvəlcə daxil olun!');
      return;
    }
    const currentProgress = currentUser.readingProgress?.[book.id] || 0;
    setProgressValue(currentProgress);
    setShowProgressModal(book);
  };

  const handleSaveProgress = async () => {
    if (!currentUser || !showProgressModal) return;

    const currentProgressMap = currentUser.readingProgress || {};
    const updatedUser: User = {
      ...currentUser,
      readingProgress: {
        ...currentProgressMap,
        [showProgressModal.id]: progressValue
      }
    };
    setCurrentUser(updatedUser);

    const targetBookId = showProgressModal.id;
    const targetValue = progressValue;
    setShowProgressModal(null);

    try {
      await apiUpdateReadingProgress(targetBookId, targetValue);
    } catch (err) {
      console.warn('Backend update reading progress error:', err);
    }
  };

  // Custom Reading List Creator
  const handleCreateReadingList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Zəhmət olmasa, əvvəlcə daxil olun!');
      return;
    }
    if (!newListName.trim()) return;

    const currentLists = currentUser.readingLists || [];
    const newList = {
      id: 'rl_' + Date.now(),
      name: newListName.trim(),
      books: []
    };

    const updatedUser: User = {
      ...currentUser,
      readingLists: [...currentLists, newList]
    };
    setCurrentUser(updatedUser);
    setNewListName('');
  };

  const handleAddBookToReadingList = (listId: string, bookId: string) => {
    if (!currentUser) return;
    const currentLists = currentUser.readingLists || [];
    
    const updatedLists = currentLists.map(list => {
      if (list.id === listId) {
        if (list.books.includes(bookId)) {
          alert('Bu kitab artıq siyahıda var!');
          return list;
        }
        return {
          ...list,
          books: [...list.books, bookId]
        };
      }
      return list;
    });

    setCurrentUser({
      ...currentUser,
      readingLists: updatedLists
    });
    setShowAddToListModal(null);
  };

  const handleDeleteReadingList = (listId: string) => {
    if (!currentUser) return;
    if (window.confirm('Bu mütaliə siyahısını silmək istədiyinizdən əminsiniz?')) {
      const currentLists = currentUser.readingLists || [];
      const updatedUser: User = {
        ...currentUser,
        readingLists: currentLists.filter(l => l.id !== listId)
      };
      setCurrentUser(updatedUser);
    }
  };

  const handleRemoveBookFromList = (listId: string, bookId: string) => {
    if (!currentUser) return;
    const currentLists = currentUser.readingLists || [];
    const updatedLists = currentLists.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          books: list.books.filter(id => id !== bookId)
        };
      }
      return list;
    });

    setCurrentUser({
      ...currentUser,
      readingLists: updatedLists
    });
  };

  // Submit Book Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedBook) {
      alert('Zəhmət olmasa, əvvəlcə daxil olun!');
      return;
    }

    const newReview: BookReview = {
      id: 'br_' + Date.now(),
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      rating: reviewRating,
      comment: reviewComment,
      likes: 0,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const serverId = await apiCreateBookReview({
        bookId: selectedBook.id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (serverId && typeof serverId === 'string') {
        newReview.id = serverId;
      }
    } catch (err) {
      console.warn('Backend book review creation failed, using local ID:', err);
    }

    const updatedReviews = [newReview, ...selectedBook.reviews];
    // Calculate new average rating
    const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Number((totalRating / updatedReviews.length).toFixed(1));

    const updatedBook = {
      ...selectedBook,
      reviews: updatedReviews,
      rating: avgRating
    };

    setBooks(prev => prev.map(b => b.id === selectedBook.id ? updatedBook : b));
    setSelectedBook(updatedBook);
    setReviewComment('');
    setReviewRating(5);
  };

  // Handle Like Book Review
  const handleLikeBookReview = async (reviewId: string) => {
    if (!selectedBook) return;
    try {
      await apiLikeBookReview(reviewId);
    } catch (err) {
      console.warn('Backend book review like failed:', err);
    }

    const updatedReviews = (selectedBook.reviews || []).map((r) => {
      if (r.id === reviewId) {
        return { ...r, likes: (r.likes || 0) + 1 };
      }
      return r;
    });

    const updatedBook = {
      ...selectedBook,
      reviews: updatedReviews
    };

    setBooks((prev) => prev.map((b) => (b.id === selectedBook.id ? updatedBook : b)));
    setSelectedBook(updatedBook);
  };

  // Handle Dislike Book Review
  const handleDislikeBookReview = async (reviewId: string) => {
    if (!selectedBook) return;
    try {
      await apiDislikeBookReview(reviewId);
    } catch (err) {
      console.warn('Backend book review dislike failed:', err);
    }

    const updatedReviews = (selectedBook.reviews || []).map((r) => {
      if (r.id === reviewId) {
        return { ...r, dislikes: (r.dislikes || 0) + 1 };
      }
      return r;
    });

    const updatedBook = {
      ...selectedBook,
      reviews: updatedReviews
    };

    setBooks((prev) => prev.map((b) => (b.id === selectedBook.id ? updatedBook : b)));
    setSelectedBook(updatedBook);
  };

  // Handle Delete Book Review
  const handleDeleteBookReview = async (reviewId: string) => {
    if (!selectedBook) return;
    try {
      await apiDeleteBookReview(reviewId);
    } catch (err) {
      console.warn('Backend book review delete failed:', err);
    }

    const updatedReviews = (selectedBook.reviews || []).filter((r) => r.id !== reviewId);

    // Recalculate average rating
    let avgRating = selectedBook.rating;
    if (updatedReviews.length > 0) {
      const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      avgRating = Number((totalRating / updatedReviews.length).toFixed(1));
    } else {
      avgRating = 0;
    }

    const updatedBook = {
      ...selectedBook,
      reviews: updatedReviews,
      rating: avgRating
    };

    setBooks((prev) => prev.map((b) => (b.id === selectedBook.id ? updatedBook : b)));
    setSelectedBook(updatedBook);
  };

  // Handle Start Edit Book Review
  const handleStartEditBookReview = (review: BookReview) => {
    setEditingBookReviewId(review.id);
    setEditingBookReviewComment(review.comment);
    setEditingBookReviewRating(review.rating);
  };

  // Handle Save Edit Book Review
  const handleSaveEditBookReview = async (reviewId: string) => {
    if (!selectedBook) return;
    try {
      await apiUpdateBookReview(reviewId, {
        rating: editingBookReviewRating,
        comment: editingBookReviewComment.trim()
      });
    } catch (err) {
      console.warn('Backend book review update failed:', err);
    }

    const updatedReviews = (selectedBook.reviews || []).map((r) => {
      if (r.id === reviewId) {
        return { 
          ...r, 
          comment: editingBookReviewComment.trim(), 
          rating: editingBookReviewRating 
        };
      }
      return r;
    });

    // Recalculate average rating
    const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Number((totalRating / updatedReviews.length).toFixed(1));

    const updatedBook = {
      ...selectedBook,
      reviews: updatedReviews,
      rating: avgRating
    };

    setBooks((prev) => prev.map((b) => (b.id === selectedBook.id ? updatedBook : b)));
    setSelectedBook(updatedBook);
    setEditingBookReviewId(null);
  };

  // Fetch Book vs Movies list from backend on mount
  useEffect(() => {
    let isSubscribed = true;
    async function loadBookVsMovies() {
      try {
        const res = await apiGetAllBookVsMovies();
        if (isSubscribed && Array.isArray(res) && res.length > 0) {
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
        console.warn('Could not load BookVsMovies from backend:', err);
      }
    }
    loadBookVsMovies();
    return () => { isSubscribed = false; };
  }, [setBookVsMovies]);

  // Vote Book vs Movie
  const handleVoteBookVsMovie = async (adaptationId: string, choice: 'book' | 'movie') => {
    if (!currentUser) {
      alert('Səs vermək üçün əvvəlcə daxil olun!');
      return;
    }

    const currentVotes = currentUser.bookVotes || {};
    const previousChoice = currentVotes[adaptationId];

    try {
      if (previousChoice === choice) {
        // User clicks the same choice -> Unvote
        await apiUnvoteBookVsMovie(adaptationId);

        setBookVsMovies(prev => prev.map(bvm => {
          if (bvm.id === adaptationId) {
            let bVotes = bvm.bookVotes;
            let mVotes = bvm.movieVotes;
            if (choice === 'book') bVotes = Math.max(0, bVotes - 1);
            else mVotes = Math.max(0, mVotes - 1);
            return {
              ...bvm,
              bookVotes: bVotes,
              movieVotes: mVotes,
              myVote: null
            };
          }
          return bvm;
        }));

        const updatedVotes = { ...currentVotes };
        delete updatedVotes[adaptationId];
        setCurrentUser({
          ...currentUser,
          bookVotes: updatedVotes
        });
        return;
      }

      // User votes or switches vote
      const numericChoice = choice === 'book' ? 0 : 1;
      await apiVoteBookVsMovie(adaptationId, numericChoice);

      setBookVsMovies(prev => prev.map(bvm => {
        if (bvm.id === adaptationId) {
          let bVotes = bvm.bookVotes;
          let mVotes = bvm.movieVotes;

          if (choice === 'book') {
            bVotes += 1;
            if (previousChoice === 'movie') mVotes = Math.max(0, mVotes - 1);
          } else {
            mVotes += 1;
            if (previousChoice === 'book') bVotes = Math.max(0, bVotes - 1);
          }

          return {
            ...bvm,
            bookVotes: bVotes,
            movieVotes: mVotes,
            myVote: choice === 'book' ? 0 : 1
          };
        }
        return bvm;
      }));

      setCurrentUser({
        ...currentUser,
        bookVotes: {
          ...currentVotes,
          [adaptationId]: choice
        }
      });
    } catch (err) {
      console.warn('Backend vote API error, applying optimistic local update:', err);
    }
  };

  const renderBookCard = (book: Book, index: number = 0) => {
    const isFav = currentUser?.favoriteBooks?.includes(book.id);
    const progress = currentUser?.readingProgress?.[book.id] || 0;

    return (
      <motion.div 
        key={book.id}
        id={`book-card-${book.id}`}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4, delay: (index % 10) * 0.07, ease: [0.16, 1, 0.3, 1] }}
        className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] hover:shadow-2xl hover:z-10 ${
          theme === 'dark' 
            ? 'bg-zinc-900/40 border-zinc-800 hover:border-red-500/30' 
            : 'bg-white border-zinc-150 hover:border-red-500/20'
        }`}
      >
        {/* Cover Container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
          <LazyImage 
            src={book.cover} 
            alt={book.title} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
          {/* Gradient Overlay with Title and Rating on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-end p-3.5 z-10 pointer-events-none">
            <span className="text-[9px] font-bold text-red-500 tracking-wider uppercase">{book.genres ? book.genres[0] : 'Kitab'}</span>
            <h4 className="font-extrabold text-xs text-white truncate">{book.title}</h4>
            <p className="text-[10px] text-zinc-300 truncate">{book.author}</p>
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mt-1.5 pt-1.5 border-t border-white/10 pointer-events-auto">
              <span>★ {book.rating}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedBook(book); }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase rounded-md transition duration-200 ease-out shadow-md cursor-pointer"
              >
                Ətraflı
              </button>
            </div>
          </div>

          {/* Badges on poster */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none z-20">
            {book.language === 'az' ? (
              <span className="px-2 py-0.5 bg-cyan-600 text-white text-[8px] font-black uppercase rounded-md shadow-md tracking-wider">AZ</span>
            ) : (
              <span className="px-2 py-0.5 bg-purple-600 text-white text-[8px] font-black uppercase rounded-md shadow-md tracking-wider">EN</span>
            )}
            {book.movieAdaptationId && (
              <span className="px-2 py-0.5 bg-red-600/95 text-white text-[8px] font-black uppercase rounded-md shadow-md flex items-center gap-0.5 tracking-wider">
                <Film className="w-2.5 h-2.5 shrink-0" /> ADAPTASİYA
              </span>
            )}
          </div>

          <div className="absolute top-2 right-2 flex gap-1 z-20">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteBook(book.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer shadow-md ${
                isFav 
                  ? 'bg-red-600 text-white' 
                  : 'bg-black/55 text-zinc-300 hover:text-white hover:bg-black/80'
              }`}
              title="Sevimlilərə əlavə et"
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            {(() => {
              const isInWatchlist = currentUser?.watchlistBooks?.includes(book.id);
              return (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatchlistBook(book.id);
                  }}
                  className={`p-1.5 rounded-full backdrop-blur-md transition cursor-pointer shadow-md ${
                    isInWatchlist 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-black/55 text-zinc-300 hover:text-white hover:bg-black/80'
                  }`}
                  title={isInWatchlist ? "Oxuma siyahısından çıxar" : "Oxuma siyahısına əlavə et"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isInWatchlist ? 'fill-current' : ''}`} />
                </button>
              );
            })()}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUser) {
                  alert('Zəhmət olmasa, əvvəlcə daxil olun!');
                  return;
                }
                setShowAddToListModal(book);
              }}
              className="p-1.5 rounded-full backdrop-blur-md bg-black/55 text-zinc-300 hover:text-white hover:bg-black/80 transition cursor-pointer shadow-md"
              title="Mütaliə siyahısına / Kolleksiyaya əlavə et"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono font-bold">
              <span>{book.author}</span>
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-3 h-3 fill-current" /> {book.rating}
              </span>
            </div>
            <h4 
              onClick={() => setSelectedBook(book)}
              className="text-xs sm:text-sm font-black tracking-tight line-clamp-1 group-hover:text-red-500 transition cursor-pointer"
            >
              {book.title}
            </h4>
            <div className="flex flex-wrap gap-1 pt-1">
              {book.genres.slice(0, 2).map((g, i) => (
                <span key={i} className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Reading progress / action */}
          {currentUser && (
            <div className={`pt-2.5 border-t ${theme === 'dark' ? 'border-zinc-850' : 'border-zinc-100'}`}>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-zinc-500 font-bold flex items-center gap-1">
                  <BookOpenCheck className="w-3 h-3 text-red-500" /> Oxu tərəqqisi:
                </span>
                <span className="font-mono font-black text-red-500">{progress}%</span>
              </div>
              
              <div className="w-full bg-zinc-800/85 rounded-full h-1.5 overflow-hidden mb-2">
                <div 
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button 
                onClick={() => handleOpenProgress(book)}
                className={`w-full py-1 text-[9px] font-bold tracking-wider rounded-md border text-center transition cursor-pointer ${
                  theme === 'dark' 
                    ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900' 
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
                }`}
              >
                Yenilə
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (activeReaderBook) {
    return (
      <BookReader 
        book={activeReaderBook}
        onClose={() => setActiveReaderBook(null)}
        theme={theme}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
    );
  }

  if (showProgressModal) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in max-w-2xl mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-800/20">
          <button
            onClick={() => setShowProgressModal(null)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-sm ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Kitablara Qayıt
          </button>
          
          <span className="text-xs font-mono text-zinc-500 font-bold hidden sm:inline">
            Tərəqqini Yenilə
          </span>
        </div>

        <div className={`w-full rounded-3xl border p-6 sm:p-8 text-center space-y-6 shadow-xl relative ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
          <div className="space-y-1.5">
            <span className="text-xs font-black uppercase text-red-500">Kino xalları qazan</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display">Tərəqqini Yenilə</h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              "{showProgressModal.title}" kitabında haradasınız?
            </p>
          </div>

          <div className="space-y-5 py-4 max-w-md mx-auto">
            <div className="text-4xl font-black font-mono text-red-500">{progressValue}%</div>
            
            <input
              type="range"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />

            <div className="flex justify-between text-xs text-zinc-500 font-mono">
              <span>Başlamaq (0%)</span>
              <span>Bitirmək (100%)</span>
            </div>
          </div>

          {progressValue === 100 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-500 font-bold flex items-center gap-2 justify-center animate-bounce max-w-md mx-auto">
              <Sparkles className="w-5 h-5 fill-amber-500/20" /> Mükəmməl! Bitirdiyiniz üçün +50 Kino Xalı qazandınız! 🎉
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowProgressModal(null)}
              className={`px-6 py-3 text-xs font-bold rounded-xl border transition cursor-pointer ${
                theme === 'dark'
                  ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              Ləğv Et
            </button>
            <button
              onClick={handleSaveProgress}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-red-600/20"
            >
              Yadda Saxla
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showAddToListModal) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in max-w-2xl mx-auto">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-800/20">
          <button
            onClick={() => setShowAddToListModal(null)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-sm ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Kitablara Qayıt
          </button>
          
          <span className="text-xs font-mono text-zinc-500 font-bold hidden sm:inline">
            Siyahıya Əlavə Et
          </span>
        </div>

        <div className={`w-full rounded-3xl border p-6 sm:p-8 space-y-6 shadow-xl relative ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight font-display">Mütaliə Siyahısına Əlavə Et</h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              "{showAddToListModal.title}" hansı siyahıya əlavə edilsin?
            </p>
          </div>

          <div className="space-y-4 py-2 max-w-md mx-auto">
            {/* BookCollections section */}
            {bookCollections.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-red-500 tracking-wider">Kitab Kolleksiyaları</span>
                {bookCollections.map(col => (
                  <button
                    key={col.id}
                    onClick={() => handleAddBookToBookCollection(col.id, showAddToListModal.id)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      theme === 'dark' 
                        ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-red-500/30' 
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-red-500" />
                      <span className="font-extrabold">{col.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))}
              </div>
            )}

            {/* Reading Lists Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Şəxsi Mütaliə Siyahıları</span>
              {(!currentUser || !currentUser.readingLists || currentUser.readingLists.length === 0) ? (
                <div className="p-4 text-center border border-dashed rounded-xl border-zinc-700/50">
                  <p className="text-xs text-zinc-500 italic">Hələ heç bir mütaliə siyahınız yoxdur.</p>
                </div>
              ) : (
                currentUser.readingLists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => handleAddBookToReadingList(list.id, showAddToListModal.id)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      theme === 'dark' 
                        ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-red-500/30' 
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-red-500/20'
                    }`}
                  >
                    <span className="font-extrabold">{list.name}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setShowAddToListModal(null)}
              className={`px-8 py-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                theme === 'dark' 
                  ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900' 
                  : 'border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              Ləğv Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedBook) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-800/20">
          <button
            onClick={handleCloseBookModal}
            className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-sm ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Kitablara Qayıt
          </button>
          
          <span className="text-xs font-mono text-zinc-500 font-bold hidden sm:inline">
            Kitab Haqqında Ətraflı Məlumat
          </span>
        </div>

        {/* Book Details Full View Layout */}
        <div className={`w-full rounded-3xl border shadow-xl relative overflow-hidden flex flex-col ${
          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white shadow-black/60' : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
        }`}>
          {/* Cover background blur */}
          <div className="absolute top-0 left-0 w-full h-48 sm:h-56 bg-zinc-950 overflow-hidden opacity-25 pointer-events-none">
            <img src={selectedBook.cover} alt="" className="w-full h-full object-cover blur-xl" />
          </div>

          <div className="p-6 sm:p-8 space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
              {/* Cover Poster */}
              <div className="w-40 sm:w-48 aspect-[2/3] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shrink-0 mx-auto md:mx-0 shadow-2xl relative">
                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white text-[9px] font-black uppercase rounded-lg shadow">
                  {selectedBook.language}
                </span>
              </div>

              {/* Main Information */}
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-[9px] font-black tracking-wider uppercase rounded-full ${
                      theme === 'dark' ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}>
                      İl: {selectedBook.year}
                    </span>
                    <span className={`px-3 py-1 text-[9px] font-black tracking-wider uppercase rounded-full ${
                      theme === 'dark' ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}>
                      Səhifə: {selectedBook.pages} s.
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight leading-tight">{selectedBook.title}</h1>
                  <p className="text-sm font-bold text-zinc-500 font-mono">Müəllif: <span className="text-red-500">{selectedBook.author}</span></p>
                </div>

                <p className={`text-sm leading-relaxed max-w-3xl ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {selectedBook.description}
                </p>

                {/* Primary E-Reader Action */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <button
                    onClick={() => {
                      setActiveReaderBook(selectedBook);
                    }}
                    className="py-3 px-6 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookOpen className="w-4 h-4" /> Kitabı Oxu (PDF / E-Reader)
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                  {selectedBook.genres.map((g, i) => (
                    <span key={i} className={`text-[10px] font-black uppercase tracking-wide px-3 py-1 rounded-lg ${
                      theme === 'dark' ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}>
                      {g}
                    </span>
                  ))}
                </div>

                {/* Rating / Likes */}
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-bold pt-2">
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <Star className="w-4 h-4 fill-current" /> {selectedBook.rating} / 5
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <ThumbsUp className="w-4 h-4" /> {selectedBook.likes} bəyənmə
                  </span>
                </div>

                {/* Movie Adaption Banner */}
                {selectedBook.movieAdaptationId && (
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-left max-w-2xl ${
                    theme === 'dark' ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-100'
                  }`}>
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-xs font-black uppercase text-red-500 flex items-center justify-center sm:justify-start gap-1.5">
                        <Film className="w-4 h-4" /> ƏSASINDA FİLM ÇƏKİLİB!
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Bu möhtəşəm əsərin kinoteatr adaptasiyası artıq CineVerse platformasındadır.
                      </p>
                    </div>
                    <button
                      onClick={() => onViewMovie(selectedBook.movieAdaptationId!)}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg shadow-red-600/20"
                    >
                      Filmi İzlə <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Area */}
            <div className={`pt-8 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'} space-y-6`}>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" /> Rəylər ({selectedBook.reviews.length})
              </h3>

              {/* Review Form */}
              {currentUser ? (
                <form onSubmit={handleSubmitReview} className="space-y-4 p-5 rounded-2xl border bg-zinc-900/10 border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Qiymət ver:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 text-amber-500 transition hover:scale-110 cursor-pointer"
                        >
                          <Star className={`w-5 h-5 ${reviewRating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    required
                    placeholder="Kitab haqqında rəyinizi və təəssüratlarınızı bura daxil edin..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-md shadow-red-600/20"
                    >
                      Rəyi Paylaş
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-zinc-500 italic text-center py-2">
                  Rəy yazmaq və qiymətləndirmək üçün zəhmət olmasa daxil olun.
                </p>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {selectedBook.reviews.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-6 text-center">Bu kitab üçün hələ rəy yazılmayıb. İlk yazan siz olun!</p>
                ) : (
                  selectedBook.reviews.map(rev => {
                    const isAuthorOrAdmin = currentUser && (currentUser.id === rev.userId || currentUser.username === rev.username || currentUser.role === 'admin');
                    const isEditing = editingBookReviewId === rev.id;

                    return (
                      <div 
                        key={rev.id} 
                        className={`p-4 rounded-2xl border text-left space-y-3 ${
                          theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={rev.userAvatar} alt={rev.username} className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-700" />
                            <div>
                              <p className="text-xs font-black">@{rev.username}</p>
                              <p className="text-[10px] text-zinc-500 font-mono">{rev.date}</p>
                            </div>
                          </div>
                          
                          {!isEditing && (
                            <div className="flex items-center gap-0.5 text-amber-500">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 p-3 bg-zinc-850/50 rounded-xl border border-zinc-800/30">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-zinc-400 font-bold uppercase">Qiymət (1-5):</label>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={editingBookReviewRating}
                                onChange={(e) => setEditingBookReviewRating(Number(e.target.value))}
                                className={`w-16 px-2 py-1 rounded text-xs focus:outline-none border ${
                                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                }`}
                              />
                            </div>
                            <textarea
                              value={editingBookReviewComment}
                              onChange={(e) => setEditingBookReviewComment(e.target.value)}
                              rows={2}
                              className={`w-full px-3 py-2 rounded-lg text-xs focus:outline-none border ${
                                theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                              }`}
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingBookReviewId(null)}
                                className="p-1.5 text-zinc-400 hover:text-red-500 rounded transition cursor-pointer"
                                title="İmtina et"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSaveEditBookReview(rev.id)}
                                className="p-1.5 text-green-500 hover:text-green-400 rounded transition cursor-pointer"
                                title="Yadda saxla"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {rev.comment}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 text-xs text-zinc-500 border-t border-zinc-800/20">
                          {/* Like & Dislike interaction */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLikeBookReview(rev.id)}
                              className="flex items-center gap-1 hover:text-red-500 transition cursor-pointer"
                              title="Bəyən"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{rev.likes || 0}</span>
                            </button>
                            <button
                              onClick={() => handleDislikeBookReview(rev.id)}
                              className="flex items-center gap-1 hover:text-blue-500 transition cursor-pointer"
                              title="Bəyənmə"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{rev.dislikes || 0}</span>
                            </button>
                          </div>

                          {/* Edit & Delete actions */}
                          {isAuthorOrAdmin && !isEditing && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartEditBookReview(rev)}
                                className="p-1 text-zinc-500 hover:text-amber-500 rounded transition cursor-pointer"
                                title="Redaktə et"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteBookReview(rev.id)}
                                className="p-1 text-zinc-500 hover:text-red-500 rounded transition cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      </div>
    );
  }

  return (
    <div id="books-section-root" className="space-y-8 pb-12 animate-fade-in">
      {/* Banner / Header Section */}
      <div className={`relative p-6 sm:p-10 rounded-3xl overflow-hidden border ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-red-950/20 via-zinc-900/90 to-zinc-950 border-zinc-800' 
          : 'bg-gradient-to-br from-red-50 via-zinc-50 to-white border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-full">
            <BookOpen className="w-3.5 h-3.5" /> CineVerse Kitabxanası
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-display">Kitablar Dünyasını Kəşf Et!</h1>
          <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Bütün dünyada sevilən romanlar, elmi-fantastik şahəsərlər, təmiz kod yazmağın qaydalarını öyrədən texnoloji kitablar və sevdiyiniz filmlərin çəkildiyi ədəbi əsərlər bir yerdə.
          </p>

          {/* Tab buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'all', label: 'Bütün Kitablar', icon: BookOpen },
              { id: 'collections', label: 'Xüsusi Kolleksiyalar', icon: Layers },
              { id: 'vs', label: 'Kitab vs Film', icon: Film },
              { id: 'my-lists', label: 'Mütaliə Siyahılarım', icon: List }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/10'
                    : theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-750 text-zinc-400 hover:text-white'
                      : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main View Grid depending on Tabs */}

      {/* TAB 1: ALL BOOKS + SEARCH + FILTERS */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 justify-between items-center ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-50 border-zinc-150'
          }`}>
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Kitab adı, müəllif və ya janr axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 border ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600'
                    : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
                }`}
              />
            </div>

            {/* Language & Genre selectors */}
            <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
              {/* Language Filters */}
              <div className={`flex rounded-xl border overflow-hidden p-1 ${
                theme === 'dark' ? 'bg-zinc-950/20 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
              }`}>
                {(['All', 'az', 'en'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition cursor-pointer ${
                      selectedLanguage === lang
                        ? 'bg-red-600 text-white shadow-sm'
                        : theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-700 hover:text-zinc-950 font-bold'
                    }`}
                  >
                    {lang === 'All' ? 'Hamısı' : lang}
                  </button>
                ))}
              </div>

              {/* Genre Filter */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={`px-3 py-1.5 text-xs rounded-xl focus:outline-none border font-semibold ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                    : 'bg-white border-zinc-200 text-zinc-700'
                }`}
              >
                {allGenres.map((genre, idx) => (
                  <option key={idx} value={genre}>
                    {genre === 'All' ? 'Bütün Janrlar' : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results list */}
          {isBooksLoading ? (
            <div className="pt-2">
              <BookGridSkeleton count={10} />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <BookOpen className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold">Axtarışınıza uyğun kitab tapılmadı</h3>
              <p className="text-xs text-zinc-500">Zəhmət olmasa, digər axtarış sözlərindən və ya filtrlərdən istifadə edin.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Trending section */}
              {trendingBooks.length > 0 && searchQuery === '' && selectedGenre === 'All' && selectedLanguage === 'All' && (
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-500/10 animate-pulse" /> TREND KİTABLAR
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {trendingBooks.map(renderBookCard)}
                  </div>
                </div>
              )}

              {/* Azerbaijani books */}
              {azBooks.length > 0 && searchQuery === '' && selectedGenre === 'All' && selectedLanguage === 'All' && (
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-cyan-500" /> AZƏRBAYCAN DİLİNDƏ
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {azBooks.map(renderBookCard)}
                  </div>
                </div>
              )}

              {/* English books */}
              {enBooks.length > 0 && searchQuery === '' && selectedGenre === 'All' && selectedLanguage === 'All' && (
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    <BookOpenCheck className="w-4.5 h-4.5 text-purple-500" /> ENGLISH LANGUAGE BOOKS
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {enBooks.map(renderBookCard)}
                  </div>
                </div>
              )}

              {/* General Grid View if filtering/searching */}
              {((searchQuery !== '' || selectedGenre !== 'All' || selectedLanguage !== 'All') || (trendingBooks.length === 0 && azBooks.length === 0)) && (
                <div className="space-y-4">
                  <h3 className="text-sm sm:text-base font-black tracking-tight uppercase">
                    Kitabların Siyahısı ({filteredBooks.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredBooks.map(renderBookCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURATED COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-zinc-900/40 border-zinc-800">
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" /> Kitab Kolleksiyaları
              </h2>
              <p className="text-xs text-zinc-400">Öz kitab kolleksiyanızı yaradın və ya mövcud kolleksiyalara göz gəzdirin.</p>
            </div>
            <button
              onClick={() => {
                setShowCreateBookCollectionModal(true);
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md shadow-red-600/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> Yeni Kitab Kolleksiyası Yarat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bookCollections.map((col, index) => {
            const colBooksList = Array.isArray(col.books) ? col.books : [];
            const colBooks = books.filter(b => colBooksList.includes(b.id));
            const canManageThisCol = !col.userId 
              ? true 
              : Boolean(currentUser && (col.userId === currentUser.id || (col.author && col.author === currentUser.username)));

            return (
              <motion.div 
                key={col.id} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: (index % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={`group rounded-2xl border overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] hover:shadow-2xl hover:z-10 relative cursor-pointer ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-red-500/30' : 'bg-white border-zinc-200 shadow-sm hover:border-red-500/20'
                }`}
                onClick={() => setSelectedBookCollection(col)}
              >
                <div 
                  className="relative h-44 bg-zinc-950 overflow-hidden"
                >
                  <LazyImage src={col.cover} alt={col.title} className="w-full h-full object-cover opacity-60 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-end p-5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-base font-black tracking-tight text-white mb-1 group-hover:text-red-400 transition-colors duration-200">{col.title}</h3>
                      {canManageThisCol && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBookCollection(col.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-red-500 transition cursor-pointer rounded-lg bg-black/40 opacity-80 hover:opacity-100 shrink-0"
                          title="Kolleksiyanı sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">{col.description}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                    <span>Kitab sayı: {colBooks.length} ədəd</span>
                    {col.author && (
                      <span className="text-[9px] text-zinc-400 font-normal truncate max-w-[120px]">
                        Yaradan: {col.author}
                      </span>
                    )}
                  </div>
                  
                  {/* Book list in collection */}
                  <div className="space-y-2">
                    {colBooks.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic text-center py-2">Bu kolleksiyada hələ kitab yoxdur.</p>
                    ) : (
                      colBooks.map(bk => (
                        <div 
                          key={bk.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBook(bk);
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                            theme === 'dark' 
                              ? 'bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 hover:border-red-500/20' 
                              : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100 hover:border-red-500/10'
                          }`}
                        >
                          <img src={bk.cover} alt={bk.title} className="w-8 h-11 object-cover rounded shadow" />
                          <div className="space-y-0.5 text-left min-w-0 flex-1">
                            <h4 className="text-xs font-black tracking-tight leading-tight truncate">{bk.title}</h4>
                            <p className="text-[9px] text-zinc-500 truncate">{bk.author}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      )}

      {/* TAB 3: BOOK VS MOVIE MATCH */}
      {activeTab === 'vs' && (
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="px-2.5 py-0.5 bg-amber-500 text-zinc-950 text-[9px] font-black uppercase rounded-full tracking-wider animate-pulse">Dualist Qarşılaşma</span>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">Hansı Daha Yaxşıdır?</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Kitab versiyası yoxsa möhtəşəm ekran adaptasiyası? Səs verin və rəyinizi icmada bölüşün!
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {bookVsMovies.map(bvm => {
              const pairedBook = books.find(b => b.id === bvm.bookId);
              const pairedMovie = movies.find(m => m.id === bvm.movieId);
              const totalVotes = bvm.bookVotes + bvm.movieVotes;
              const bookPercent = totalVotes > 0 ? Math.round((bvm.bookVotes / totalVotes) * 100) : 50;
              const moviePercent = totalVotes > 0 ? Math.round((bvm.movieVotes / totalVotes) * 100) : 50;

              const userVote = currentUser?.bookVotes?.[bvm.id];

              return (
                <div 
                  key={bvm.id}
                  className={`p-6 rounded-3xl border ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-zinc-900/60 via-zinc-950 to-black/80 border-zinc-800' 
                      : 'bg-white border-zinc-200 shadow-md'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Visual Comparison cards */}
                    <div className="flex items-center justify-center gap-4">
                      {/* Book Side */}
                      <div className="text-center space-y-2">
                        <div className="relative w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                          <img src={pairedBook?.cover} alt={pairedBook?.title} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] font-bold text-red-500">KİTAB</p>
                      </div>

                      <div className="text-zinc-600 font-black text-xl italic font-display">VS</div>

                      {/* Movie Side */}
                      <div className="text-center space-y-2">
                        <div className="relative w-28 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                          <img src={pairedMovie?.poster} alt={pairedMovie?.title} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[10px] font-bold text-cyan-500">FİLM</p>
                      </div>
                    </div>

                    {/* Voting Logic and text */}
                    <div className="space-y-4">
                      <h3 className="text-base font-black tracking-tight font-display">{bvm.title}</h3>
                      <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {bvm.description}
                      </p>

                      {/* Vote Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleVoteBookVsMovie(bvm.id, 'book')}
                          className={`py-3 px-4 rounded-xl border text-xs font-black tracking-wider transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            userVote === 'book'
                              ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/10'
                              : theme === 'dark'
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <span>📕 KİTAB</span>
                          <span className="text-[10px] opacity-80">{bvm.bookVotes} səs</span>
                        </button>

                        <button
                          onClick={() => handleVoteBookVsMovie(bvm.id, 'movie')}
                          className={`py-3 px-4 rounded-xl border text-xs font-black tracking-wider transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            userVote === 'movie'
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-600/10'
                              : theme === 'dark'
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          <span>🎬 FİLM</span>
                          <span className="text-[10px] opacity-80">{bvm.movieVotes} səs</span>
                        </button>
                      </div>

                      {/* Percentage visualization */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px] font-mono font-black">
                          <span className="text-red-500">Kitab: {bookPercent}%</span>
                          <span className="text-cyan-500">Film: {moviePercent}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden flex">
                          <div className="bg-red-500 h-2.5" style={{ width: `${bookPercent}%` }} />
                          <div className="bg-cyan-500 h-2.5" style={{ width: `${moviePercent}%` }} />
                        </div>
                        <p className="text-[9px] text-zinc-500 text-center font-mono">Ümumi səs sayı: {totalVotes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MY READING LISTS */}
      {activeTab === 'my-lists' && (
        <div className="space-y-6">
          {!currentUser ? (
            <div className="text-center py-16 space-y-3">
              <List className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold">Mütaliə siyahılarınızı görmək üçün daxil olun</h3>
              <p className="text-xs text-zinc-500">Öz şəxsi siyahılarınızı yaradın, kitabları qruplaşdırın və oxu tərəqqinizi izləyin.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Creator form */}
              <form onSubmit={handleCreateReadingList} className={`p-5 rounded-2xl border flex gap-3 max-w-xl ${
                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-850' : 'bg-zinc-50 border-zinc-150'
              }`}>
                <input
                  type="text"
                  required
                  placeholder="Yeni Mütaliə Siyahısı adı (məs: 'Yay Tətili Oxuları')"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className={`flex-1 border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 ${
                    theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-white' 
                      : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Yarat
                </button>
              </form>

              {/* Lists Grid */}
              {(!currentUser.readingLists || currentUser.readingLists.length === 0) ? (
                <div className="text-center py-12 space-y-1">
                  <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-xs font-bold">Hələ heç bir siyahınız yoxdur</h4>
                  <p className="text-[11px] text-zinc-500">Yuxarıdakı form vasitəsilə ilk siyahınızı yarada bilərsiniz!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentUser.readingLists.map(list => {
                    const listBooks = books.filter(b => list.books.includes(b.id));

                    return (
                      <div 
                        key={list.id}
                        className={`p-5 rounded-2xl border space-y-4 ${
                          theme === 'dark' ? 'bg-zinc-900/30 border-zinc-850' : 'bg-white border-zinc-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-black tracking-tight">{list.name}</h4>
                            <p className="text-[10px] text-zinc-500">Kitabların sayı: {listBooks.length}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteReadingList(list.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 transition cursor-pointer hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* books within list */}
                        {listBooks.length === 0 ? (
                          <div className={`p-4 rounded-xl border border-dashed text-center text-[11px] text-zinc-500 ${
                            theme === 'dark' ? 'bg-zinc-950/20 border-zinc-850' : 'bg-zinc-50 border-zinc-150'
                          }`}>
                            Bu siyahıda kitab yoxdur. Kitab kartındakı bookmark simvoluna klikləyərək əlavə edin.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {listBooks.map(bk => (
                              <div 
                                key={bk.id}
                                className={`p-2 rounded-xl border flex items-center justify-between gap-3 relative overflow-hidden group ${
                                  theme === 'dark' ? 'bg-zinc-950/40 border-zinc-850' : 'bg-zinc-50 border-zinc-150'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <img src={bk.cover} alt={bk.title} className="w-7 h-10 object-cover rounded shadow shrink-0" />
                                  <div className="text-left space-y-0.5">
                                    <h5 
                                      onClick={() => setSelectedBook(bk)}
                                      className="text-[11px] font-bold line-clamp-1 hover:text-red-500 cursor-pointer"
                                    >
                                      {bk.title}
                                    </h5>
                                    <p className="text-[9px] text-zinc-500 line-clamp-1">{bk.author}</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRemoveBookFromList(list.id, bk.id)}
                                  className="p-1 rounded-md text-zinc-500 hover:text-red-500 transition cursor-pointer hover:bg-red-500/15 shrink-0 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}





      {/* CREATE BOOK COLLECTION FULL PAGE VIEW */}
      {showCreateBookCollectionModal && (
        <div className="fixed inset-0 z-[100] bg-zinc-950 text-white overflow-y-auto animate-fade-in flex flex-col">
          {/* Top Header Navigation */}
          <header className="sticky top-0 z-20 px-6 py-4 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowCreateBookCollectionModal(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Kolleksiyalara Qayıt
            </button>
            <h2 className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" /> Yeni Kitab Kolleksiyası Yarat
            </h2>
            <div className="w-24" /> {/* Spacer */}
          </header>

          <main className="flex-1 max-w-4xl w-full mx-auto p-6 sm:p-10 space-y-8">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                Özəl Mütaliə Seçimi
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
                Kitab Kolleksiyası Yaradın
              </h1>
              <p className="text-xs text-zinc-400">
                Sevdiyiniz kitabları bir araya toplayın, mövzu üzrə qruplaşdırın və icma ilə bölüşün.
              </p>
            </div>

            <form onSubmit={handleCreateBookCollection} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Collection Details */}
                <div className="space-y-5 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-red-500 pb-2 border-b border-zinc-800">
                    Kolleksiya Məlumatları
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Kolleksiyanın Adı *</label>
                    <input
                      type="text"
                      required
                      placeholder="məs. Ən Yaxşı Elmi-Fantastika Şahəsərləri"
                      value={newBookColTitle}
                      onChange={(e) => setNewBookColTitle(e.target.value)}
                      className="w-full px-4 py-3 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Təsviri</label>
                    <textarea
                      rows={3}
                      placeholder="Kolleksiya haqqında qısa məlumat və ya mövzu haqqında nəsə yazın..."
                      value={newBookColDesc}
                      onChange={(e) => setNewBookColDesc(e.target.value)}
                      className="w-full px-4 py-3 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  {/* Cover presets or URL */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                      Üz Qabığı Şəkli Seçin
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80'
                      ].map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNewBookColCover(url)}
                          className={`relative h-20 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                            newBookColCover === url || (!newBookColCover && i === 0) 
                              ? 'border-red-500 ring-2 ring-red-500/30 opacity-100 scale-105' 
                              : 'border-zinc-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Preset ${i+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Və ya fərdi şəkil URL-i daxil edin (https://...)"
                      value={newBookColCover}
                      onChange={(e) => setNewBookColCover(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Right Column: Book Selector */}
                <div className="space-y-4 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <h3 className="text-xs font-black uppercase tracking-wider text-red-500">
                      Kolleksiyaya Kitablar Əlavə Et
                    </h3>
                    <span className="text-[10px] bg-red-600/20 text-red-400 font-mono px-2 py-0.5 rounded-full font-bold">
                      Seçilib: {newBookColSelectedBooks.length}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Kolleksiyaya daxil etmək istədiyiniz kitabların yanında quş işarəsi qoyun:
                  </p>

                  <div className="flex-1 max-h-[360px] overflow-y-auto p-2 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                    {books.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 p-4 text-center">Mövcud kitab yoxdur</p>
                    ) : (
                      books.map((b) => {
                        const isChecked = newBookColSelectedBooks.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition text-xs border ${
                              isChecked 
                                ? 'bg-red-950/40 border-red-500/50 text-white font-bold' 
                                : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900 text-zinc-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setNewBookColSelectedBooks(prev => 
                                  isChecked ? prev.filter(id => id !== b.id) : [...prev, b.id]
                                );
                              }}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-zinc-950 border-zinc-700"
                            />
                            <img src={b.cover} alt={b.title} className="w-8 h-11 object-cover rounded shadow shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold">{b.title}</p>
                              <p className="text-[10px] text-zinc-400 truncate">{b.author}</p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateBookCollectionModal(false)}
                  className="px-6 py-3 text-xs font-bold rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-red-600/25 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Kolleksiyanı Yarat
                </button>
              </div>
            </form>
          </main>
        </div>
      )}

      {/* SELECTED BOOK COLLECTION DETAIL FULL PAGE VIEW */}
      {selectedBookCollection && (() => {
        const canManageSelectedCol = !selectedBookCollection.userId 
          ? true 
          : Boolean(currentUser && (selectedBookCollection.userId === currentUser.id || (selectedBookCollection.author && selectedBookCollection.author === currentUser.username)));
        const colBooksIds = Array.isArray(selectedBookCollection.books) ? selectedBookCollection.books : [];

        return (
          <div className="fixed inset-0 z-[100] bg-zinc-950 text-white overflow-y-auto animate-fade-in flex flex-col">
            {/* Navigation Header */}
            <header className="sticky top-0 z-20 px-6 py-4 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedBookCollection(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Kolleksiyalara Qayıt
              </button>
              <span className="text-xs font-black tracking-wider uppercase text-red-500">
                Özəl Kitab Kolleksiyası
              </span>
              <div className="w-24" /> {/* Spacer */}
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-8">
              {/* Collection Hero Banner */}
              <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
                <LazyImage src={selectedBookCollection.cover} alt={selectedBookCollection.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent p-6 sm:p-8 flex flex-col justify-end space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                      Kolleksiya
                    </span>
                    {selectedBookCollection.author && (
                      <span className="px-3 py-1 bg-black/70 text-zinc-300 text-[10px] font-bold rounded-md border border-zinc-700/80">
                        Yaradan: {selectedBookCollection.author}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight">
                    {selectedBookCollection.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                    {selectedBookCollection.description}
                  </p>
                </div>
              </div>

              {/* Add Book to Collection Section (ONLY FOR OWNER) */}
              {canManageSelectedCol ? (
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-red-500" /> Kolleksiyaya Yeni Kitab Əlavə Et
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedBookToAdd}
                      onChange={(e) => setSelectedBookToAdd(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">-- Əlavə etmək üçün kitab seçin --</option>
                      {books
                        .filter(b => !colBooksIds.includes(b.id))
                        .map(b => (
                          <option key={b.id} value={b.id}>
                            {b.title} - {b.author}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedBookToAdd) {
                          handleAddBookToBookCollection(selectedBookCollection.id, selectedBookToAdd);
                        }
                      }}
                      disabled={!selectedBookToAdd}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl transition cursor-pointer shrink-0 shadow-md shadow-red-600/20"
                    >
                      Əlavə Et
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center">
                  <p className="text-xs text-zinc-400">
                    ℹ️ Bu kolleksiya <span className="font-bold text-white">{selectedBookCollection.author || 'baskasi'}</span> tərəfindən yaradılıb. Yalnız yaradan şəxs idarə edə bilər.
                  </p>
                </div>
              )}

              {/* Books in Collection Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300">
                    Kolleksiyadakı Kitablar ({colBooksIds.length})
                  </h3>
                </div>

                {colBooksIds.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-zinc-800 rounded-3xl space-y-3">
                    <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-500">Bu kolleksiyaya hələ kitab əlavə olunmayıb.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {books
                      .filter(b => colBooksIds.includes(b.id))
                      .map(bk => (
                        <div
                          key={bk.id}
                          className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-red-500/30 transition flex gap-4 items-center group"
                        >
                          <img src={bk.cover} alt={bk.title} className="w-14 h-20 object-cover rounded-xl shadow-md shrink-0" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="text-xs font-bold text-white truncate">{bk.title}</h4>
                            <p className="text-[10px] text-zinc-400 truncate">{bk.author}</p>
                            <span className="text-[10px] text-amber-400 font-bold block">★ {bk.rating}</span>

                            <div className="flex items-center gap-2 pt-2">
                              <button
                                onClick={() => {
                                  setSelectedBook(bk);
                                  setSelectedBookCollection(null);
                                }}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-lg transition cursor-pointer shadow-sm"
                              >
                                Mütaliə Et
                              </button>
                              {canManageSelectedCol && (
                                <button
                                  onClick={() => handleRemoveBookFromBookCollection(selectedBookCollection.id, bk.id)}
                                  className="p-1.5 text-zinc-500 hover:text-red-500 transition cursor-pointer rounded-lg hover:bg-zinc-800"
                                  title="Kolleksiyadan sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
                {canManageSelectedCol ? (
                  <button
                    onClick={() => {
                      handleDeleteBookCollection(selectedBookCollection.id);
                      setSelectedBookCollection(null);
                    }}
                    className="text-xs font-bold text-red-500 hover:text-red-400 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Kolleksiyanı Sil
                  </button>
                ) : <div />}
                <button
                  onClick={() => setSelectedBookCollection(null)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Bağla
                </button>
              </div>
            </main>
          </div>
        );
      })()}

      {/* END OF MAIN SECTION */}
    </div>
  );
}

// ==========================================
// DYNAMIC E-BOOK CONTENT GENERATOR
// ==========================================
export function getBookChapters(book: Book): { title: string; pages: string[] }[] {
  const isEn = book.language === 'en';

  if (book.customContent) {
    const content = book.customContent;
    const paragraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);
    const pages: string[] = [];
    let currentPageText = '';

    for (const para of paragraphs) {
      if ((currentPageText + '\n\n' + para).length > 800) {
        if (currentPageText) {
          pages.push(currentPageText);
        }
        currentPageText = para;
      } else {
        currentPageText = currentPageText ? currentPageText + '\n\n' + para : para;
      }
    }
    if (currentPageText) {
      pages.push(currentPageText);
    }

    if (pages.length === 0 && content.trim()) {
      pages.push(content.trim());
    }

    // group into chapters (2 pages per chapter)
    const resultChapters: { title: string; pages: string[] }[] = [];
    const pagesPerCh = 2;
    for (let i = 0; i < pages.length; i += pagesPerCh) {
      const chPages = pages.slice(i, i + pagesPerCh);
      const chNum = Math.floor(i / pagesPerCh) + 1;
      resultChapters.push({
        title: isEn ? `Chapter ${chNum}` : `Fəsil ${chNum}`,
        pages: chPages
      });
    }

    if (resultChapters.length > 0) {
      return resultChapters;
    }
  }
  
  if (book.id === 'b1' || book.title.toLowerCase().includes('dyun') || book.title.toLowerCase().includes('dune')) {
    return [
      {
        title: isEn ? "Chapter 1: The Gathering Storm" : "I Fəsil: Səhra Planetinə gəliş",
        pages: [
          isEn 
            ? "A world of endless sand, where the dry winds whipped the dunes into towering crests. Paul Atreides opened his eyes to see the red sun of Arrakis rising on the horizon. He felt the dry air instantly pulling the moisture from his lips. 'This is Dune,' he whispered, touching the cool metal of his stillsuit."
            : "Uzaq ulduzlar arasında, quru küləklərin qum təpələrini sovurduğu bir dünya var idi. Paul Atreides gözlərini açanda Arrakisin qırmızı günəşinin üfüqdə doğduğunu gördü. O, quru havanın dərhal dodaqlarındakı nəmi çəkdiyini hiss etdi. 'Bura Dyundur,' deyə pıçıldadı, distil-kostyumunun soyuq metalına toxunaraq.",
          isEn
            ? "His mother, Jessica, stood near the window of the residency, looking out at the Shield Wall. 'The Duke is busy with the spice production reports,' she said. 'The Harkonnens left this place in ruins, Paul. We must be careful.' But Paul was thinking of the Fremen, the mysterious desert dwellers who survived in the deep sands."
            : "Anası Cesika, iqamətgahın pəncərəsi önündə dayanaraq Qalxan Divarına baxırdı. 'Hersoq ədviyyat hesabatları ilə məşğuldur,' dedi. 'Harkonnenlər buranı xarabalığa çeviriblər, Paul. Ehtiyatlı olmalıyıq.' Amma Paul, dərin qumlarda sağ qalan sirli səhra sakinləri olan Fremenləri düşünürdü."
        ]
      },
      {
        title: isEn ? "Chapter 2: The Secret of Melange" : "II Fəsil: Melanjın sirri",
        pages: [
          isEn
            ? "Melange, the spice of spices. It was more than a luxury; it was the key to space travel, the substance that allowed Navigators to find paths through the stars. 'Whoever controls the spice, controls the universe,' Paul recalled his father's words. Without it, the Empire would collapse into isolated worlds."
            : "Melanj, ədviyyatların ədviyyatı. Bu sadəcə dəbdəbə deyil, ulduzlararası səyahətin açarı, Naviqatorların ulduzlar arasında yol tapmasını təmin edən yeganə maddə idi. 'Ədviyyata nəzarət edən, kainata nəzarət edər,' deyə Paul atasının sözlərini xatırladı. O olmasaydı, İmperiya təcrid olunmuş dünyalara parçalanardı.",
          isEn
            ? "In the spice sands, a giant harvester was crawling. Paul watched it from the ornithopter. Suddenly, a massive circular ripple appeared in the desert. 'Wormsign!' the pilot shouted. A colossal mouth of teeth was rising from below, ready to swallow the entire machine."
            : "Ədviyyat qumlarında nəhəng bir məhsul yığan maşın sürünürdü. Paul onu ornitopterdən izləyirdi. Birdən səhrada dairəvi dalğalanma yarandı. 'Qurd işarəsi!' deyə pilot qışqırdı. Yüzlərlə dişləri olan nəhəng bir ağız aşağıdan qalxırdı, bütün maşını udmağa hazır idi."
        ]
      },
      {
        title: isEn ? "Chapter 3: Fremen Covenant" : "III Fəsil: Fremenlərin yurdu",
        pages: [
          isEn
            ? "Deep in the caves of the desert, Paul met Stilgar, the Naib of Sietch Tabr. Stilgar looked at the boy with testing eyes. 'Can a child of the water survive the trial of the sand?' he asked. Paul didn't hesitate. He showed them he knew how to walk without rhythm, to avoid attracting the great Shai-Hulud."
            : "Səhranın dərin mağaralarında Paul, Sietç Tabrın Naibi Stilqarla qarşılaşdı. Stilqar gəncə sınaq dolu nəzərlərlə baxdı. 'Su övladı qumun sınağından sağ çıxa bilərmi?' deyə soruşdu. Paul tərəddüd etmədi. Nəhəng Şai-Huludun diqqətini çəkməmək üçün ritmsiz yeriməyi necə bildiyini onlara nümayiş etdirdi.",
          isEn
            ? "Chani, the fierce Fremen woman, smiled. 'You walk like one of us, Usul,' she whispered. That was the name they gave him. In the shadows, the Fremen were gathering water, drop by drop, dreaming of a green Arrakis. Paul realized his destiny was tied to this ancient dream."
            : "Döyüşçü fremen qızı Çani gülümsədi. 'Sən bizlərdən biri kimi yeriyirsən, Usul,' deyə pıçıldadı. Ona bu adı verdilər. Kölgələrdə fremenlər damla-damla su toplayır, yaşıl Arrakis xəyalı qururdular. Paul anladı ki, onun taleyi bu qədim xəyala möhkəm bağlanıb."
        ]
      }
    ];
  } else if (book.id === 'b2' || book.title.toLowerCase().includes('əli') || book.title.toLowerCase().includes('ali')) {
    return [
      {
        title: "I Fəsil: Bakının sarı qumları",
        pages: [
          "Bakı küləklər və neft şəhəridir. Xəzərin dalğaları sahilə çırpılarkən, Əli xan Şirvanşir məktəbin pəncərəsindən uzaqlara baxırdı. Onun qəlbində Nino Kipianiyə qarşı böyük bir sevgi alovu yanırdı. Əli şərq ruhlu, vətəninə bağlı bir gənc, Nino isə qərb mədəniyyətli, gürcü gözəli idi.",
          "Onların sevgisi təkcə iki gəncin deyil, həm də Şərq ilə Qərbin qovuşması idi. Məktəbin son günlərində, Qubernator bağında gəzişərkən Əli Ninonun əlindən tutdu. 'Nino, bizim dünyalarımız fərqli olsa da, səmamız birdir,' dedi. Nino gülümsəyərək gözlərini onun qara gözlərinə zillədi."
        ]
      },
      {
        title: "II Fəsil: Tiflis küçələrində bahar",
        pages: [
          "Tiflis baharda xüsusilə gözəl olurdu. Kür çayının coşqun suları şəhəri iki hissəyə bölür, qədim qalaların divarları isə tarixin pıçıltılarını gətirirdi. Əli Ninonun ailəsini görmək üçün Tiflisə səyahət etdi. Orada o, tamamilə fərqli bir mədəniyyətlə, Avropa tərzi rəqslərlə qarşılaşdı.",
          "Nino burada özünü daha azad hiss edirdi. Amma Əli üçün bu yad bir dünya idi. Tiflisin dar küçələrində gəzərkən Əli daxilindəki Şərq və Qərb toqquşmasını daha dərindən dərk etdi. 'Nino, mən asiyalıyam, sən isə avropalı. Bu fərqlilik bizi məhv edəcək, yoxsa ucaldacaq?'"
        ]
      },
      {
        title: "III Fəsil: Vətən uğrunda son döyüş",
        pages: [
          "Müharibə rüzgarları Azərbaycanın sərhədlərinə çatmışdı. Gənc respublika təhlükə altında idi. Əli xan Şirvanşir sevgisi və vətəni arasında seçim etməli idi. O, Ninonu təhlükəsiz yerə göndərsə də, özü Gəncə körpüsünü qorumaq üçün döyüş yoldaşları ilə qaldı.",
          "Silah səsləri şəhəri bürüdü. Əli son nəfəsinə qədər vuruşdu. O bilirdi ki, bu torpaq azad olmalıdır. Nino isə uzaqlarda, gözlərində yaşla onun yolunu gözləyirdi. Bu sevgi dastanı Azərbaycanın şanlı və kədərli tarixinin silinməz bir səhifəsinə çevrildi."
        ]
      }
    ];
  } else if (book.id === 'b3' || book.title.toLowerCase().includes('clean code') || book.title.toLowerCase().includes('təmiz kod')) {
    return [
      {
        title: "Chapter 1: The Philosophy of Clean Code",
        pages: [
          "Writing code is easy; writing clean code is craftsmanship. Bad code can bring a whole team to its knees. Over time, as bad code piles up, the development speed slows down to zero. Why do we write bad code? Usually, it's because we are in a hurry. We promise to clean it up later. But as LeBlanc's law states: Later equals never.",
          "Clean code is simple and direct. It reads like well-written prose. It never obscures the designer's intent. To write clean code, we must care about our work. We must treat our code as a form of art. Clean code is not just about syntax; it is about respecting the readers who will maintain it after you."
        ]
      },
      {
        title: "Chapter 2: Meaningful Names",
        pages: [
          "Names are everywhere in software. We name variables, functions, arguments, classes, and packages. Choosing good names takes time but saves more than it takes. A variable name should reveal its intent. If a name requires a comment to explain its purpose, then the name does not reveal intent.",
          "For example: 'int d;' is a terrible name. What does 'd' mean? 'elapsedTimeInDays' is infinitely better. Avoid using abbreviations or encodings. Use searchable names. Single-letter names should only be used as local variables inside short loops. Class names should be nouns, and function names should be verbs."
        ]
      },
      {
        title: "Chapter 3: Functions and Simplicity",
        pages: [
          "The first rule of functions is that they should be small. The second rule is that they should be smaller than that. Functions should do one thing. They should do it well. They should do it only. If a function performs multiple tasks, it becomes difficult to test, maintain, and understand.",
          "Keep your function arguments to a minimum. Zero is best, followed by one (monadic) and two (dyadic). Three arguments (triadic) should be avoided where possible. If a function needs more than three arguments, it is likely that some of those arguments should be wrapped into their own class or interface."
        ]
      }
    ];
  } else if (book.id === 'b4' || book.title.toLowerCase().includes('1984')) {
    return [
      {
        title: "I Fəsil: Böyük Qardaş səni izləyir",
        pages: [
          "Aprel ayının soyuq və parlaq bir günü idi, saatlar on üçü vururdu. Winston Smith soyuq küləkdən qorunmaq üçün çənəsini sinəsinə sıxaraq Qələbə Evlərinin şüşə qapılarından içəri süzüldü. Dəhlizdə qaynadılmış kələm və köhnə ayaqaltı iyi gəlirdi. Divarda nəhəng bir poster vurulmuşdu: BÖYÜK QARDAŞ SƏNİ İZLƏYİR.",
          "Winston otuz doqquz yaşında idi, sağ topuğunun üzərində varikoz yarası var idi. O, yavaş-yavaş pillələri qalxdı. Hər mərtəbədə, liftin qarşı divarındakı poster hərəkət edirmiş kimi görünən gözləri ilə Winstonu izləyirdi. Telemillət isə fasiləsiz olaraq rəsmi rəqəmləri səsləndirirdi."
        ]
      },
      {
        title: "II Fəsil: Düşüncə Polisi və Həqiqət",
        pages: [
          "Həqiqət Nazirliyi - Winstonun iş yeri bura idi. Bu, ağ betondan ucalan, nəhəng piramida formalı bina idi. Binanın fasadında partiyanın üç şüarı həkk olunmuşdu: MÜHARİBƏ SÜLHDÜR, AZADLIQ QULLUQDUR, CAHİLLİK GÜCDÜR. Winston masasının arxasında oturub qəzet kupürlərini və tarixi sənədləri redaktə etməyə başladı.",
          "Onun işi tarixi partiyanın indiki maraqlarına uyğun olaraq yenidən yazmaq idi. Keçmiş daim dəyişdirilir, lakin heç kim bunun sübutunu saxlaya bilmirdi. 'Keçmişə nəzarət edən indiyə nəzarət edir; indiyə nəzarət edən isə gələcəyə nəzarət edir,' deyə Winston partiyanın əsas şüarını dərindən düşündü."
        ]
      },
      {
        title: "III Fəsil: 101 nömrəli otağın qorxusu",
        pages: [
          "Qaranlıq hücrədə Winston O'Brayenin qarşısında dayanmışdı. O'Brayen ona nifrətlə deyil, elmi bir maraqla baxırdı. 'Winston, sən hələ də həqiqətin obyektiv olduğuna inanırsan?' dedi. Winston işgəncələrdən zəifləmişdi. Onu Sevgi Nazirliyinin ən qorxulu yeri olan 101 nömrəli otağa apardılar.",
          "101 nömrəli otaqda hər kəsin dünyada ən çox qorxduğu şey gizlənirdi. Winston üçün bu, siçovullar idi. O'Brayen qəfəsi onun üzünə yaxınlaşdıranda, Winston daxilindəki sonuncu insani bağı qırdı və qışqırdı: 'Bunu mənə yox, Culiaya edin! Onu cəzalandırın, məni yox!' O artıq təslim olmuşdu."
        ]
      }
    ];
  } else {
    // Dynamic rich e-book generator for newly added or imported books
    const totalBookPages = book.pages || 250;
    const desc = book.description || `${book.author} tərəfindən qələmə alınmış "${book.title}" əsəri oxuculara dərin fəlsəfi təcrübə yaşadır.`;

    return [
      {
        title: `I Fəsil: Giriş və Mühit (${book.title})`,
        pages: [
          `Siz hazırda ${book.author} tərəfindən yazılmış "${book.title}" əsərini mütaliə edirsiniz. Bu kitab ümumilikdə ${totalBookPages} səhifədən ibarətdir və ${book.year || '2024'}-cü ildə nəşr edilmişdir.\n\n${desc}`,
          `Süjet xəttinin ilk addımlarında oxucu qəhrəmanların daxili dünyası və onları əhatə edən mühitlə yaxından tanış olur. Müəllif ${book.author} təsvir etdiyi hər bir səhnədə incə detallara xüsusi diqqət yetirərək canlı mənzərə yaradır.`
        ]
      },
      {
        title: `II Fəsil: İlk Düyünlər və Ziddiyyət`,
        pages: [
          `Hadisələr inkişaf etdikcə baş qəhrəman gözlənilməz ziddiyyətlərlə qarşılaşır. Qərarlar vermək məcburiyyəti onun daxili aləmində böyük fırtınalar qoparır. Çətin seçim qarşısında qalan obraz öz prinsiplərini sınayır.`,
          `Bu fəsildə əsərin köməkçi obrazları da səhnəyə daxil olur. Onların hər biri baş qəhrəmanın dünyagörüşünə və atdığı addımlara birbaşa təsir göstərir. Təsvirlər gərginliyi daha da artırır.`
        ]
      },
      {
        title: `III Fəsil: Səyahət və Gizli Həqiqətlər`,
        pages: [
          `Qəhrəman yeni bir səyahətə çıxır. Bu fiziki səyahətlə yanaşı, həm də mənəvi bir axtarışdır. Yol boyunca qarşılaşdığı insanlar ona həyatın fərqli üzlərini göstərir və unudulmuş həqiqətləri xatırladır.`,
          `Müəllifin fəlsəfi fikirləri bu səhifələrdə daha da dərinləşir. Həyatın mənası, zamanın axışı və insan münasibətləri haqqında deyilən hər bir fikir oxucunu dərindən düşündürür.`
        ]
      },
      {
        title: `IV Fəsil: Sınaq və Dözümlülük`,
        pages: [
          `Taleyin kəskin dönüşləri baş verir. Qəhrəmanın inandığı dəyərlər sarsılır və o, gözlənilməz bir xəyanətlə və ya çətin maneə ilə üzbəüz qalır. Burada yalnız möhkəm iradəyə malik olanlar ayaqda qala bilər.`,
          `Gərginlik pik həddə çatır. Qaranlıq məqamlarda ümid işığı axtaran qəhrəman öz daxili gücünü kəşf edir. Bu sınaq onun xarakterini tamamilə yenidən formalaşdırır.`
        ]
      },
      {
        title: `V Fəsil: Mənəvi Axtarışlar və Dialoqlar`,
        pages: [
          `Fəslin mərkəzində dərin fəlsəfi dialoqlar dayanır. İki fərqli dünyagörüşün toqquşması həqiqətin axtarışı ilə nəticələnir. Müəllif oxucuya tərəf tutmadan müstəqil mühakimə yürütmək imkanı verir.`,
          `Daxili sakitlik və dinclik axtarışı davam edir. Qəhrəman keçmişdə etdiyi səhvləri təhlil edir və gələcəyə doğru daha təmkinli addım atmağa qərar verir.`
        ]
      },
      {
        title: `VI Fəsil: Dönüş Nöqtəsi`,
        pages: [
          `Süjetin ən mühüm dönüş nöqtələrindən biri baş verir. Bütün gizli qalan sirlər üzə çıxır və obrazlar öz həqiqi simalarını göstərirlər. Bu məqam əsərin axarını tamamilə dəyişir.`,
          `Oxucu üçün gərgin və həyəcanlı anlar başlayır. Hər bir cümlə növbəti səhifədə nə baş verəcəyini səbirsizliklə gözləməyə vadar edir.`
        ]
      },
      {
        title: `VII Fəsil: Kulminasiya Nöqtəsi`,
        pages: [
          `Hadisələrin zirvə nöqtəsi – kulminasiya. Bütün ziddiyyətlər, münaqişələr və gözləntilər bu fəsildə toqquşur. İradə, cəsarət və fədakarlıq imtahanı keçirilir.`,
          `Böyük qərar verilir. Bu qərar təkcə baş qəhrəmanın deyil, onun ətrafındakı hər kəsin gələcək taleyini müəyyən edir.`
        ]
      },
      {
        title: `VIII Fəsil: Nəticə və Həyat Dərsləri`,
        pages: [
          `Tufandan sonra sakitlik çökür. Dünyanın və insan ruhunun bərpası prosesi başlayır. Zərər çəkmiş hisslər sağalır, yeni ümidlər cücərir.`,
          `Mütaliənizi tamamladığınız üçün təbrik edirik! "${book.title}" əsəri haqqında öz rəy və təəssüratlarınızı CineVerse kitabxana bölməsində paylaşaraq digər oxuculara tövsiyə edə bilərsiniz.`
        ]
      }
    ];
  }
}

// ==========================================
// FULL-SCREEN INTERACTIVE E-READER / PDF COMPONENT
// ==========================================
interface BookReaderProps {
  book: Book;
  onClose: () => void;
  theme: 'dark' | 'light';
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

interface NoteItem {
  id: string;
  quote: string;
  comment: string;
  pageIndex: number;
  date: string;
}

export function BookReader({ book, onClose, theme, currentUser, setCurrentUser }: BookReaderProps) {
  const chapters = getBookChapters(book);
  
  // Flatten pages for easy scrolling/flipping
  const allPages = chapters.length > 0 ? chapters.flatMap((ch, chIdx) => 
    ch.pages.map((pText, pIdx) => ({
      chapterTitle: ch.title,
      chapterIndex: chIdx,
      pageIndex: pIdx,
      text: pText
    }))
  ) : [{ chapterTitle: 'E-Kitab / PDF', chapterIndex: 0, pageIndex: 0, text: '' }];

  // States
  const [globalPageIndex, setGlobalPageIndex] = useState<number>(() => {
    // Start where the user left off
    if (currentUser && currentUser.readingProgress && currentUser.readingProgress[book.id]) {
      const percentage = currentUser.readingProgress[book.id];
      const pageIdx = Math.min(
        Math.max(0, Math.round((percentage / 100) * allPages.length) - 1),
        allPages.length - 1
      );
      return pageIdx;
    }
    return 0;
  });

  const [readerTheme, setReaderTheme] = useState<'sepia' | 'light' | 'dark' | 'parchment'>('sepia');
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [layoutMode, setLayoutMode] = useState<'book' | 'pdf'>('book');
  const [embedViewMode, setEmbedViewMode] = useState<'google' | 'direct' | 'text'>('google');
  const [showSettings, setShowSettings] = useState(false);

  const isLocalDataPdf = book.pdfUrl?.startsWith('data:') || book.pdfUrl?.startsWith('blob:');

  useEffect(() => {
    if (isLocalDataPdf && embedViewMode === 'google') {
      setEmbedViewMode('direct');
    }
  }, [book.pdfUrl, isLocalDataPdf]);

  const getEmbeddableUrl = (url: string, mode: 'google' | 'direct') => {
    if (!url) return '';
    const trimmed = url.trim();
    
    // Base64 data URLs or local Blob URLs cannot be passed to Google Docs Viewer service.
    // They must be rendered directly in native browser iframe/object tags.
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || mode === 'direct') {
      return trimmed;
    }

    if (trimmed.includes('drive.google.com/file/d/')) {
      const match = trimmed.match(/\/file\/d\/([^\/]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    if (mode === 'google') {
      return `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`;
    }
    return trimmed;
  };
  const [showChapters, setShowChapters] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ globalIndex: number; textSnippet: string }[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem(`cineverse_notes_${book.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [newNoteComment, setNewNoteComment] = useState('');
  const [selectedQuote, setSelectedQuote] = useState('');

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    const saved = localStorage.getItem(`cineverse_bookmarks_${book.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Level progress celebration state
  const [celebration, setCelebration] = useState<{ show: boolean; type: 'mid' | 'full'; points: number } | null>(null);

  // Save notes to localStorage
  const saveNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    localStorage.setItem(`cineverse_notes_${book.id}`, JSON.stringify(updated));
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    let updated: number[];
    if (bookmarks.includes(globalPageIndex)) {
      updated = bookmarks.filter(idx => idx !== globalPageIndex);
    } else {
      updated = [...bookmarks, globalPageIndex];
    }
    setBookmarks(updated);
    localStorage.setItem(`cineverse_bookmarks_${book.id}`, JSON.stringify(updated));
  };

  // Sync reading progress
  React.useEffect(() => {
    if (!currentUser || !setCurrentUser) return;
    
    const progressPercent = Math.round(((globalPageIndex + 1) / allPages.length) * 100);
    const existingProgress = currentUser.readingProgress?.[book.id] || 0;

    if (progressPercent > existingProgress) {
      // Reward logic for reaching milestones
      let pointsReward = 0;
      let rewardReason = "";
      let celebType: 'mid' | 'full' | null = null;

      if (progressPercent === 100 && existingProgress < 100) {
        pointsReward = 30;
        rewardReason = `"${book.title}" kitabını tamamilə bitirdiniz! 🏆`;
        celebType = 'full';
      } else if (progressPercent >= 50 && existingProgress < 50) {
        pointsReward = 15;
        rewardReason = `"${book.title}" kitabının yarısına çatdınız! 📖`;
        celebType = 'mid';
      }

      const updatedProgress = {
        ...(currentUser.readingProgress || {}),
        [book.id]: progressPercent
      };

      const finalPoints = (currentUser.points || 0) + pointsReward;
      const updatedUser: User = {
        ...currentUser,
        readingProgress: updatedProgress,
        points: finalPoints
      };

      // Add notification if rewarded
      if (pointsReward > 0) {
        updatedUser.notifications = [
          {
            id: 'notif_reader_' + Date.now(),
            type: 'system',
            title: 'Mütaliə Mükafatı! 🏆',
            description: `Təbrik edirik! +${pointsReward} Kino Xalı qazandınız. Səbəb: ${rewardReason}`,
            date: 'İndi',
            read: false
          },
          ...(currentUser.notifications || [])
        ];
        setCelebration({ show: true, type: celebType!, points: pointsReward });
      }

      setCurrentUser(updatedUser);
    }
  }, [globalPageIndex, allPages.length]);

  // Handle Search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results: { globalIndex: number; textSnippet: string }[] = [];
    allPages.forEach((pg, idx) => {
      if (pg.text.toLowerCase().includes(query.toLowerCase())) {
        const index = pg.text.toLowerCase().indexOf(query.toLowerCase());
        const snippet = "..." + pg.text.substring(Math.max(0, index - 20), Math.min(pg.text.length, index + query.length + 30)) + "...";
        results.push({ globalIndex: idx, textSnippet: snippet });
      }
    });
    setSearchResults(results);
  };

  // Highlight helper
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() 
            ? <mark key={i} className="bg-yellow-300 text-zinc-950 px-1 rounded font-bold">{part}</mark> 
            : part
        )}
      </>
    );
  };

  // Add customized note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteComment.trim()) return;

    const newNote: NoteItem = {
      id: 'note_' + Date.now(),
      quote: selectedQuote || `Səhifə ${globalPageIndex + 1}-dən qeyd`,
      comment: newNoteComment,
      pageIndex: globalPageIndex,
      date: new Date().toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    saveNotes([newNote, ...notes]);
    setNewNoteComment('');
    setSelectedQuote('');
  };

  // Simulated PDF Downloader
  const triggerPdfDownload = () => {
    alert(`"${book.title}" əsəri PDF formatında hazırlanır. Cihazınıza yüklənmə tezliklə başlayacaq!`);
    const link = document.createElement('a');
    link.href = '#';
    link.setAttribute('download', `${book.title}_CineVerse.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Select text for quote
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedQuote(selection.toString().trim());
      setShowNotesPanel(true);
    }
  };

  // Theme styling definitions
  const themeStyles = {
    sepia: {
      bg: 'bg-[#f4ecd8]',
      textColor: 'text-[#3e2715]',
      border: 'border-[#e6d5b3]',
      headerText: 'text-[#6e5030]',
      panelBg: 'bg-[#eadcb9]',
      panelBorder: 'border-[#d4c196]',
      line: 'bg-[#3e2715]/10',
      activeBtn: 'bg-[#3e2715] text-[#f4ecd8]',
      inactiveBtn: 'bg-black/5 text-[#3e2715]'
    },
    light: {
      bg: 'bg-[#fcfcfc] text-zinc-900',
      textColor: 'text-zinc-900',
      border: 'border-zinc-200',
      headerText: 'text-zinc-500',
      panelBg: 'bg-zinc-50',
      panelBorder: 'border-zinc-200',
      line: 'bg-zinc-200',
      activeBtn: 'bg-zinc-900 text-white',
      inactiveBtn: 'bg-zinc-100 text-zinc-700'
    },
    dark: {
      bg: 'bg-[#121214]',
      textColor: 'text-zinc-200',
      border: 'border-zinc-850',
      headerText: 'text-zinc-400',
      panelBg: 'bg-zinc-900',
      panelBorder: 'border-zinc-850',
      line: 'bg-zinc-800',
      activeBtn: 'bg-red-600 text-white',
      inactiveBtn: 'bg-zinc-800 text-zinc-300'
    },
    parchment: {
      bg: 'bg-[#f2e6cf] bg-[radial-gradient(#eedcb3_1px,transparent_1px)] bg-[size:16px_16px]',
      textColor: 'text-[#2b1b04]',
      border: 'border-[#e0cca1]',
      headerText: 'text-[#523d1b]',
      panelBg: 'bg-[#ecd8b5]',
      panelBorder: 'border-[#dcc08e]',
      line: 'bg-[#2b1b04]/10',
      activeBtn: 'bg-[#2b1b04] text-[#f2e6cf]',
      inactiveBtn: 'bg-black/5 text-[#2b1b04]'
    }
  };

  const style = themeStyles[readerTheme];
  const currentPage = allPages[globalPageIndex];

  // Side-by-side layout logic (on desktop)
  const isBookMode = layoutMode === 'book';
  const showSecondPage = isBookMode && globalPageIndex + 1 < allPages.length;
  const secondPage = showSecondPage ? allPages[globalPageIndex + 1] : null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col font-sans transition duration-300 overflow-hidden ${style.bg} ${style.textColor}`}>
      
      {/* READER HEADER CONTROL BAR */}
      <header className={`px-4 py-3 border-b flex items-center justify-between z-10 shrink-0 ${style.border}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${style.inactiveBtn}`}
          >
            <ArrowLeft className="w-4 h-4" /> Kitabxanaya Qayıt
          </button>
          
          <div className="hidden md:block">
            <h2 className="text-sm font-black tracking-tight">{book.title}</h2>
            <p className="text-[10px] font-mono opacity-65">{book.author}</p>
          </div>
        </div>

        {/* Dynamic header title showing current chapter */}
        <div className={`hidden lg:block text-xs font-bold ${style.headerText}`}>
          {currentPage?.chapterTitle}
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-1.5">
          {/* Bookmark */}
          <button
            onClick={toggleBookmark}
            className={`p-2 rounded-xl transition cursor-pointer ${
              bookmarks.includes(globalPageIndex) 
                ? 'bg-red-600 text-white' 
                : style.inactiveBtn
            }`}
            title="Səhifəni İşarələ"
          >
            <Bookmark className={`w-4 h-4 ${bookmarks.includes(globalPageIndex) ? 'fill-current' : ''}`} />
          </button>

          {/* Search inside */}
          <button
            onClick={() => {
              setIsSearchActive(!isSearchActive);
              setShowNotesPanel(false);
              setShowChapters(false);
              setShowSettings(false);
            }}
            className={`p-2 rounded-xl transition cursor-pointer ${isSearchActive ? style.activeBtn : style.inactiveBtn}`}
            title="Daxildə Axtar"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Chapters list */}
          <button
            onClick={() => {
              setShowChapters(!showChapters);
              setIsSearchActive(false);
              setShowNotesPanel(false);
              setShowSettings(false);
            }}
            className={`p-2 rounded-xl transition cursor-pointer ${showChapters ? style.activeBtn : style.inactiveBtn}`}
            title="Mündəricat"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Notes Sidebar Toggle */}
          <button
            onClick={() => {
              setShowNotesPanel(!showNotesPanel);
              setIsSearchActive(false);
              setShowChapters(false);
              setShowSettings(false);
            }}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 ${showNotesPanel ? style.activeBtn : style.inactiveBtn}`}
            title="Mənim Qeydlərim"
          >
            <Edit3 className="w-4 h-4" />
            {notes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] font-black">{notes.length}</span>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setIsSearchActive(false);
              setShowChapters(false);
              setShowNotesPanel(false);
            }}
            className={`p-2 rounded-xl transition cursor-pointer ${showSettings ? style.activeBtn : style.inactiveBtn}`}
            title="Mütaliə Tənzimləmələri"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* PDF Download representation */}
          <button
            onClick={triggerPdfDownload}
            className={`p-2 rounded-xl transition cursor-pointer text-red-500 hover:bg-red-500/10 ${style.inactiveBtn}`}
            title="PDF kimi yüklə"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SEARCH AND NAVIGATION SUB-PANELS */}
      {isSearchActive && (
        <div className={`px-4 py-3 border-b flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between ${style.panelBg} ${style.border}`}>
          <div className="flex-1 flex items-center gap-2 max-w-lg">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Kitab mətnində axtarış edin..."
              className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 ${
                readerTheme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300'
              }`}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto text-[10px] py-1">
              <span className="font-bold shrink-0">{searchResults.length} nəticə tapıldı:</span>
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setGlobalPageIndex(res.globalIndex);
                    setIsSearchActive(false);
                  }}
                  className={`px-2 py-1 rounded-md border text-[9px] font-semibold transition cursor-pointer shrink-0 ${
                    globalPageIndex === res.globalIndex ? 'bg-red-600 border-red-600 text-white' : 'bg-black/5 hover:bg-black/10'
                  }`}
                >
                  Səh. {res.globalIndex + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MAIN LAYOUT WRAPPER (Content and Sidebars) */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* CHAPTERS MENU SIDE PANEL */}
        {showChapters && (
          <aside className={`w-80 border-r p-4 overflow-y-auto space-y-4 z-10 shrink-0 ${style.panelBg} ${style.panelBorder}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider">Mündəricat</h3>
              <button onClick={() => setShowChapters(false)} className="p-1 rounded-full hover:bg-black/10"><X className="w-3.5 h-3.5" /></button>
            </div>
            
            <div className="space-y-1">
              {chapters.map((ch, idx) => {
                // Find global index of chapter first page
                let firstPageGlobalIndex = 0;
                for (let i = 0; i < idx; i++) {
                  firstPageGlobalIndex += chapters[i].pages.length;
                }

                const isActiveChapter = currentPage?.chapterIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setGlobalPageIndex(firstPageGlobalIndex);
                      setShowChapters(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      isActiveChapter 
                        ? 'bg-red-600 text-white shadow' 
                        : 'hover:bg-black/5'
                    }`}
                  >
                    <span>{ch.title}</span>
                    <span className="text-[10px] opacity-75 font-mono">{ch.pages.length} s.</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* SETTINGS MENU DROPDOWN */}
        {showSettings && (
          <div className={`absolute top-2 right-4 w-72 rounded-2xl border p-4 shadow-2xl z-20 space-y-4 ${style.panelBg} ${style.panelBorder}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-4 h-4 text-red-500" /> Tənzimləmələr
              </span>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-black/10"><X className="w-3.5 h-3.5" /></button>
            </div>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Şrift Üslubu</label>
              <div className="grid grid-cols-3 gap-1">
                {(['serif', 'sans', 'mono'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFontStyle(f)}
                    className={`py-1.5 text-xs font-semibold capitalize rounded-lg border transition ${
                      fontStyle === f ? 'bg-red-600 text-white border-red-600' : 'bg-black/5 border-transparent'
                    }`}
                  >
                    {f === 'serif' ? 'Klassik' : f === 'sans' ? 'Modern' : 'Kod'}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Mətn Ölçüsü ({fontSize}px)</label>
              <div className="flex items-center justify-between gap-2">
                <button
                  disabled={fontSize <= 12}
                  onClick={() => setFontSize(prev => prev - 1)}
                  className={`flex-1 py-1 px-3 rounded-lg font-bold border transition text-center ${fontSize <= 12 ? 'opacity-40' : 'hover:bg-black/10'}`}
                >
                  A-
                </button>
                <button
                  disabled={fontSize >= 26}
                  onClick={() => setFontSize(prev => prev + 1)}
                  className="flex-1 py-1 px-3 rounded-lg font-bold border transition text-center hover:bg-black/10"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Background Theme */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Arxa Fon Mövzusu</label>
              <div className="grid grid-cols-4 gap-1">
                {(['sepia', 'light', 'dark', 'parchment'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setReaderTheme(t)}
                    className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg border transition text-center ${
                      readerTheme === t ? 'ring-2 ring-red-500 border-red-500' : 'border-transparent'
                    } ${
                      t === 'sepia' ? 'bg-[#f4ecd8] text-[#3e2715]' :
                      t === 'light' ? 'bg-white text-zinc-900 border-zinc-200' :
                      t === 'dark' ? 'bg-[#18181b] text-zinc-200 border-zinc-800' :
                      'bg-[#f2e6cf] text-[#2b1b04]'
                    }`}
                  >
                    {t === 'sepia' ? 'Sepiya' : t === 'light' ? 'Ağ' : t === 'dark' ? 'Gecə' : 'Kağız'}
                  </button>
                ))}
              </div>
            </div>

            {/* Display layout mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Səhifə Rejimi</label>
              <div className="grid grid-cols-2 gap-1">
                {(['book', 'pdf'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setLayoutMode(m)}
                    className={`py-1.5 text-[10px] font-bold uppercase rounded-lg border transition ${
                      layoutMode === m ? 'bg-red-600 text-white border-red-600' : 'bg-black/5 border-transparent'
                    }`}
                  >
                    {m === 'book' ? 'Kitab (2 Səh)' : 'PDF (Sürüşmə)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NOTES SIDEBAR PANEL */}
        {showNotesPanel && (
          <aside className={`w-80 border-l p-4 overflow-y-auto space-y-4 z-10 shrink-0 absolute right-0 top-0 bottom-0 shadow-2xl md:relative md:shadow-none ${style.panelBg} ${style.panelBorder}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-red-500" /> Sitatlar və Qeydlərim
              </h3>
              <button onClick={() => setShowNotesPanel(false)} className="p-1 rounded-full hover:bg-black/10"><X className="w-3.5 h-3.5" /></button>
            </div>

            {/* New note form */}
            <form onSubmit={handleAddNote} className="space-y-3 p-3 rounded-xl border bg-black/5 border-black/10">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                Mətn seçib sitat kimi əlavə edə bilərsiniz, yaxud aşağıda qeyd yazın:
              </p>
              
              {selectedQuote && (
                <div className="p-2 bg-black/10 rounded-lg text-[10px] italic border-l-2 border-red-500 relative">
                  <span className="line-clamp-2">"{selectedQuote}"</span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedQuote('')} 
                    className="absolute top-1 right-1 text-red-500 p-0.5 rounded-full hover:bg-black/20"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              <textarea
                value={newNoteComment}
                onChange={e => setNewNoteComment(e.target.value)}
                rows={2}
                placeholder="Kitab haqqında qeydləriniz..."
                className={`w-full p-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 ${
                  readerTheme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
                }`}
              />

              <button
                type="submit"
                disabled={!newNoteComment.trim()}
                className="w-full py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-[10px] uppercase rounded-lg transition"
              >
                Qeydi Saxla
              </button>
            </form>

            {/* Saved notes list */}
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic text-center py-6">Hələ heç bir şəxsi qeydiniz yoxdur.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-3 rounded-xl border border-black/5 bg-black/5 space-y-1.5 relative text-left">
                    <button
                      onClick={() => {
                        const updated = notes.filter(n => n.id !== note.id);
                        saveNotes(updated);
                      }}
                      className="absolute top-2 right-2 text-red-500 hover:bg-red-500/10 p-1 rounded-full transition"
                      title="Qeydi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-red-600/10 text-red-500 text-[8px] font-bold rounded">
                        Səh. {note.pageIndex + 1}
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono">{note.date}</span>
                    </div>

                    {note.quote && note.quote.startsWith('Səhifə') ? null : (
                      <p className="text-[10px] italic opacity-80 border-l-2 border-red-500/30 pl-1.5 line-clamp-2">
                        "{note.quote}"
                      </p>
                    )}

                    <p className="text-[11px] font-medium leading-relaxed">
                      {note.comment}
                    </p>

                    <button
                      onClick={() => setGlobalPageIndex(note.pageIndex)}
                      className="text-[9px] text-red-500 hover:underline font-bold"
                    >
                      Səhifəyə Get →
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* IMMERSIVE READER WORKSPACE */}
        <main 
          className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 md:p-6 overflow-y-auto select-text"
          onMouseUp={handleTextSelection}
        >
          {book.pdfUrl && embedViewMode !== 'text' ? (
            <div className="w-full max-w-4xl flex flex-col gap-3">
              {/* Header toolbar for PDF/Link viewer modes */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  {isLocalDataPdf ? (
                    <span className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-red-600 text-white flex items-center gap-1.5">
                      📄 Yerli PDF Sənədi (İnteraktiv)
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => setEmbedViewMode('google')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                          embedViewMode === 'google' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="Veb linkləri üçün Google Docs PDF Viewer"
                      >
                        📄 Google Viewer
                      </button>
                      <button
                        onClick={() => setEmbedViewMode('direct')}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                          embedViewMode === 'direct' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                        title="Birbaşa URL İframe"
                      >
                        🔗 Direct Iframe
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setEmbedViewMode('text')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                      embedViewMode === 'text' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="İnteraktiv E-Kitab Mətn Rejiminə Keç"
                  >
                    📖 Mətn Rejimi
                  </button>
                </div>

                <a 
                  href={book.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  download={isLocalDataPdf ? `${book.title}.pdf` : undefined}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shadow-lg shadow-red-600/10"
                >
                  Tam Ekranda / Yüklə ↗
                </a>
              </div>

              {/* PDF Container using HTML5 Canvas viewer */}
              <div className="w-full flex justify-center">
                <PdfCanvasViewer 
                  pdfUrl={book.pdfUrl} 
                  title={book.title} 
                  onSwitchToTextMode={() => setEmbedViewMode('text')} 
                />
              </div>

              {/* Fallback Banner */}
              <div className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs gap-2">
                <span className="font-medium">💡 Səhifə Chrome tərəfindən bloklandıqda və ya açılmadıqda:</span>
                <div className="flex items-center gap-2 text-xs">
                  <button 
                    onClick={() => setEmbedViewMode('google')} 
                    className="underline font-bold hover:text-white cursor-pointer"
                  >
                    Google Viewer
                  </button>
                  <span>•</span>
                  <button 
                    onClick={() => setEmbedViewMode('text')} 
                    className="underline font-bold hover:text-white cursor-pointer"
                  >
                    Mətn Rejimi
                  </button>
                  <span>•</span>
                  <a 
                    href={book.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline font-bold hover:text-white"
                  >
                    Xarici Pəncərədə Aç ↗
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* BOOK READER CANVAS */
            <div className="w-full max-w-4xl flex items-stretch justify-center gap-6 relative">
              
              {/* BOOK PAGES CONTAINER */}
              <div className={`w-full grid ${showSecondPage ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                
                {/* PAGE 1 */}
                <div 
                  className={`relative p-6 md:p-12 rounded-3xl border shadow-xl flex flex-col justify-between aspect-[3/4] min-h-[450px] md:min-h-[580px] transition-all duration-300 ${style.bg} ${style.border}`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {/* Bookmarked Ribbon Indicator */}
                  {bookmarks.includes(globalPageIndex) && (
                    <div className="absolute top-0 right-8 w-6 h-10 bg-red-600 shadow-md flex items-end justify-center pb-2 text-white font-bold text-[8px] rounded-b">
                      ★
                    </div>
                  )}

                  {/* Page Header */}
                  <div className={`flex items-center justify-between text-[10px] font-mono border-b pb-2 mb-4 ${style.line} ${style.headerText}`}>
                    <span className="uppercase tracking-widest">{book.title}</span>
                    <span className="opacity-75">{currentPage?.chapterTitle}</span>
                  </div>

                  {/* Core Reading Text Paragraphs */}
                  <div className={`flex-1 flex items-start leading-relaxed ${
                    fontStyle === 'serif' ? 'font-serif' : fontStyle === 'sans' ? 'font-sans' : 'font-mono'
                  }`}>
                    <p className="indent-6 text-justify w-full whitespace-pre-wrap">
                      {highlightText(currentPage?.text || '', searchQuery)}
                    </p>
                  </div>

                  {/* Page Footer */}
                  <div className={`flex items-center justify-between text-[10px] font-mono pt-3 border-t mt-4 ${style.line} ${style.headerText}`}>
                    <span>{book.language === 'az' ? 'AZE' : 'ENG'}</span>
                    <span className="font-bold">Səhifə {globalPageIndex + 1} / {allPages.length}</span>
                  </div>
                </div>

                {/* PAGE 2 (Side-by-side mode) */}
                {showSecondPage && secondPage && (
                  <div 
                    className={`relative p-6 md:p-12 rounded-3xl border shadow-xl flex flex-col justify-between aspect-[3/4] min-h-[450px] md:min-h-[580px] transition-all duration-300 hidden md:flex ${style.bg} ${style.border}`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {/* Bookmarked Ribbon Indicator */}
                    {bookmarks.includes(globalPageIndex + 1) && (
                      <div className="absolute top-0 right-8 w-6 h-10 bg-red-600 shadow-md flex items-end justify-center pb-2 text-white font-bold text-[8px] rounded-b">
                        ★
                      </div>
                    )}

                    {/* Page Header */}
                    <div className={`flex items-center justify-between text-[10px] font-mono border-b pb-2 mb-4 ${style.line} ${style.headerText}`}>
                      <span className="opacity-75">{secondPage.chapterTitle}</span>
                      <span className="uppercase tracking-widest">{book.title}</span>
                    </div>

                    {/* Core Reading Text Paragraphs */}
                    <div className={`flex-1 flex items-start leading-relaxed ${
                      fontStyle === 'serif' ? 'font-serif' : fontStyle === 'sans' ? 'font-sans' : 'font-mono'
                    }`}>
                      <p className="indent-6 text-justify w-full whitespace-pre-wrap">
                        {highlightText(secondPage.text, searchQuery)}
                      </p>
                    </div>

                    {/* Page Footer */}
                    <div className={`flex items-center justify-between text-[10px] font-mono pt-3 border-t mt-4 ${style.line} ${style.headerText}`}>
                      <span className="font-bold">Səhifə {globalPageIndex + 2} / {allPages.length}</span>
                      <span>{book.language === 'az' ? 'AZE' : 'ENG'}</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </main>
      </div>

      {/* READER FOOTER BAR CONTROLS */}
      <footer className={`px-4 py-3.5 border-t flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0 ${style.border} ${style.panelBg}`}>
        {book.pdfUrl && embedViewMode !== 'text' ? (
          <div className="w-full flex items-center justify-between gap-4 text-xs font-mono">
            <span className="text-zinc-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              📄 PDF / Xarici Link Mütaliə Rejimi
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEmbedViewMode('text')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-600/15"
              >
                📖 İnteraktiv Mətn Rejiminə Keç
              </button>
              <a
                href={book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition"
              >
                Tam Ekranda Aç ↗
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Previous page */}
            <button
              disabled={globalPageIndex === 0}
              onClick={() => setGlobalPageIndex(prev => Math.max(0, isBookMode ? prev - 2 : prev - 1))}
              className={`w-full sm:w-auto py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                globalPageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Əvvəlki Səhifə
            </button>

            {/* Progress display bar and slider */}
            <div className="flex-1 flex items-center gap-4 w-full px-4">
              <span className="text-[10px] font-mono font-bold shrink-0">{Math.round(((globalPageIndex + 1) / allPages.length) * 100)}% oxunub</span>
              
              <input
                type="range"
                min={0}
                max={allPages.length - 1}
                value={globalPageIndex}
                onChange={e => setGlobalPageIndex(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer h-1 rounded-lg"
              />

              <span className="text-[10px] font-mono font-bold shrink-0">Səhifə {globalPageIndex + 1} / {allPages.length}</span>
            </div>

            {/* Next page */}
            <button
              disabled={isBookMode ? globalPageIndex >= allPages.length - 2 : globalPageIndex === allPages.length - 1}
              onClick={() => setGlobalPageIndex(prev => Math.min(allPages.length - 1, isBookMode ? prev + 2 : prev + 1))}
              className={`w-full sm:w-auto py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                (isBookMode ? globalPageIndex >= allPages.length - 2 : globalPageIndex === allPages.length - 1) 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-black/10'
              }`}
            >
              Növbəti Səhifə <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </footer>

      {/* MILESTONE CELEBRATION / GAMIFICATION OVERLAY MODAL */}
      {celebration && celebration.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-white">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-tr from-amber-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-4 border-zinc-900">
              <Award className="w-12 h-12 text-white animate-bounce" />
            </div>

            <div className="pt-8 space-y-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-1 mx-auto w-fit">
                <Sparkles className="w-3.5 h-3.5" /> Mütaliə Mükafatı!
              </span>
              <h3 className="text-lg font-black tracking-tight text-white">
                {celebration.type === 'full' ? 'Təbrik edirik! 🎉' : 'Möhtəşəm İrəliləyiş! 📖'}
              </h3>
              <p className="text-xs text-zinc-400">
                Siz "{book.title}" əsərinin {celebration.type === 'full' ? '100%-ni (hamısını)' : '50%-ni (yarısını)'} tamamladınız!
              </p>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-850/60">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Qazanılan Xal</p>
              <p className="text-3xl font-black text-amber-500 font-display mt-1">+{celebration.points} XAL</p>
              <p className="text-[10px] text-zinc-400 mt-1">CineVerse Kino Xalları</p>
            </div>

            <button
              onClick={() => setCelebration(null)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition cursor-pointer shadow-lg shadow-red-600/15"
            >
              Mütaliəyə Davam Et
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
