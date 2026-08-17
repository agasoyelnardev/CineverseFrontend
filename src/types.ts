export interface Review {
  id: string;
  movieId: string;
  movieTitle: string;
  userId: string;
  username: string;
  userAvatar: string;
  rating: number;
  comment: string;
  likes: number;
  dislikes?: number;
  date: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  description: string;
  poster: string;
  banner: string;
  rating: number;
  year: number;
  duration: string;
  genres: string[];
  director: string;
  cast: string[];
  trailerUrl: string;
  videoUrl?: string;
  externalUrl?: string;
  likes: number;
  reviews: Review[];
  isTrending?: boolean;
  isTopRated?: boolean;
  isNewRelease?: boolean;
  bookSourceId?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  role: 'admin' | 'user';
  isPremium?: boolean;
  favorites: string[]; // movie IDs
  watchlist: string[]; // movie IDs
  likedMovies?: string[]; // movie IDs
  savedCollections: string[]; // collection IDs
  followers: string[]; // user IDs
  following: string[]; // user IDs
  favoriteBooks?: string[]; // book IDs
  watchlistBooks?: string[]; // book IDs
  readingProgress?: { [bookId: string]: number }; // bookId -> percentage (0-100)
  readingLists?: { id: string; name: string; books: string[] }[];
  bookVotes?: { [adaptationId: string]: 'book' | 'movie' }; // adaptationId -> choice
  points?: number; // Kino Xalları
  badge?: string; // Backend-dən gələn rütbə nişanı
  notifications?: Notification[];
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  cover: string;
  userId: string;
  username: string;
  likesCount: number;
  movies: string[]; // movie IDs
  isSaved?: boolean;
  isLikedByCurrentUser?: boolean;
  movieCount?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderId?: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  reaction?: string;
}

export interface WatchParty {
  id: string;
  roomName: string;
  movieId: string;
  creator: string;
  creatorId?: string;
  participants: Participant[];
  currentTimestamp: number; // in seconds
  isPlaying: boolean;
  chat: ChatMessage[];
  viewerCount?: number;
  streamUrl?: string;
  movieTitle?: string;
  movieDescription?: string;
  moviePoster?: string;
  movieVideoUrl?: string;
  isPrivate?: boolean;
  isPremium?: boolean;
  inviteToken?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  date: string;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  category: 'Rəylər' | 'Tövsiyələr' | 'Yeni Filmlər' | 'Nəzəriyyələr';
  author: string;
  authorAvatar: string;
  likes: number;
  comments: Comment[];
  date: string;
  isLikedByCurrentUser?: boolean;
}

export interface Notification {
  id: string;
  type: 'follower' | 'comment' | 'like' | 'party_invite' | 'system' | 'friend_request' | 'friend_request_accepted';
  title: string;
  description: string;
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface Activity {
  id: string;
  type: 'rate' | 'favorite' | 'collection' | 'review';
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  movieTitle?: string;
  movieId?: string;
  collectionName?: string;
  date?: string;
  createdAt?: string;
}

export interface BookReview {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  username: string;
  userAvatar: string;
  rating: number;
  comment: string;
  likes: number;
  dislikes?: number;
  date: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover: string;
  rating: number;
  language: 'az' | 'en';
  genres: string[];
  year: number;
  pages: number;
  reviews: BookReview[];
  likes: number;
  movieAdaptationId?: string; // If this book has a movie adaptation in MOCK_MOVIES
  downloadUrl?: string; // Optional link to read/download or simulation
  pdfUrl?: string; // Optional PDF URL or e-book link
  customContent?: string; // Optional custom plain text if they don't have a PDF
  isTrending?: boolean;
  isTopRated?: boolean;
  isNewRelease?: boolean;
  isLikedByCurrentUser?: boolean;
}

export interface BookCollection {
  id: string;
  title: string;
  description: string;
  cover: string;
  books: string[]; // book IDs
  userId?: string;
  author?: string;
  authorAvatar?: string;
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
  isSaved?: boolean;
}

export interface BookVsMovie {
  id: string;
  title: string; // e.g., "Dyun"
  bookId: string;
  movieId: string;
  bookVotes: number;
  movieVotes: number;
  description: string; // comparison text
  bookTitle?: string;
  bookCover?: string;
  movieTitle?: string;
  moviePoster?: string;
  myVote?: number | null;
}
