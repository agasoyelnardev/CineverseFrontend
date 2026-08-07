import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Send, Users as UsersIcon, Volume2, Smile, AlertCircle, 
  RefreshCw, LogOut, Heart, Flame, MessageSquare, ThumbsUp, Sparkles, 
  Popcorn, Share2, Copy, Check, Image, Search, Plus, X, UserPlus, Edit3, Trash2, Crown
} from 'lucide-react';
import { WatchParty, Movie, User } from '../types';
import { apiUpdateChatMessage, apiDeleteChatMessage, apiTransferHost } from '../api';

// Helper to parse duration string like "2saat 49dəq" or "120 min" into total seconds
function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr) return 10140; // Default 2saat 49dəq (10140s)
  
  let totalSeconds = 0;
  const hoursMatch = durationStr.match(/(\d+)\s*(saat|st|h)/i);
  const minsMatch = durationStr.match(/(\d+)\s*(dəq|deq|m|min)/i);
  
  if (hoursMatch) {
    totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
  }
  if (minsMatch) {
    totalSeconds += parseInt(minsMatch[1], 10) * 60;
  }
  
  if (totalSeconds === 0) {
    const pureNum = parseInt(durationStr.replace(/\D/g, ''), 10);
    if (!isNaN(pureNum) && pureNum > 0) {
      totalSeconds = pureNum * 60;
    } else {
      totalSeconds = 10140;
    }
  }
  
  return totalSeconds;
}

// Helper to format seconds into HH:MM:SS
function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Predefined high-quality movie reaction GIFs
const MOVIE_GIFS = [
  { id: 'gif1', name: 'Popkorn Pişik', url: 'https://media.giphy.com/media/l0HlPystfePnAI3G8/giphy.gif', category: 'Popkorn' },
  { id: 'gif2', name: 'Popkorn Eating', url: 'https://media.giphy.com/media/hVTouqFyTWWOAgCr6V/giphy.gif', category: 'Popkorn' },
  { id: 'gif3', name: 'Leo Alqış / Toast', url: 'https://media.giphy.com/media/8Iv5lYKWBC5Ve/giphy.gif', category: 'Alqış' },
  { id: 'gif4', name: 'Scorsese: Bu Kinodur', url: 'https://media.giphy.com/media/TjGFDxbbZRYjv9vpCL/giphy.gif', category: 'Heyran' },
  { id: 'gif5', name: 'Şok Reaksiya', url: 'https://media.giphy.com/media/3o7527pa7qs9kCG78A/giphy.gif', category: 'Şok' },
  { id: 'gif6', name: 'Yoda Çay İçir', url: 'https://media.giphy.com/media/Kzb1z56MpxFLTW1Lf6/giphy.gif', category: 'Sakit' },
  { id: 'gif7', name: 'Dəhşətli Qışqırıq', url: 'https://media.giphy.com/media/l46Cn7kIV3wtVyKAg/giphy.gif', category: 'Qorxu' },
  { id: 'gif8', name: 'Tony Stark Göz Süzür', url: 'https://media.giphy.com/media/qmfpjpAT2fJRK/giphy.gif', category: 'Bezmiş' },
  { id: 'gif9', name: 'Kino Başlayır', url: 'https://media.giphy.com/media/u5BzxoXkwXCHu/giphy.gif', category: 'Gözlənti' },
  { id: 'gif10', name: 'Minions Alqış', url: 'https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif', category: 'Alqış' },
  { id: 'gif11', name: 'Bred Pitt Yemək', url: 'https://media.giphy.com/media/10fS0BMK9Zp0S4/giphy.gif', category: 'Yemək' },
  { id: 'gif12', name: 'Ağlamaq Reaksiyası', url: 'https://media.giphy.com/media/2WxWfiav9b0UrXMh4S/giphy.gif', category: 'Kədər' }
];

// Predefined fun sticker badges for CineVerse watch party
const MOVIE_STICKERS = [
  { id: 'st1', emoji: '🍿', text: 'Popkorn Combo', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500' },
  { id: 'st2', emoji: '🎬', text: 'Kamera Çəkiliş', bg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300' },
  { id: 'st3', emoji: '🏆', text: 'Oskar Qalibi', bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' },
  { id: 'st4', emoji: '🎫', text: 'Qızıl Bilet', bg: 'bg-yellow-600/10 border-yellow-600/20 text-yellow-600' },
  { id: 'st5', emoji: '👻', text: 'Dəhşət Seansı', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  { id: 'st6', emoji: '👽', text: 'Kosmos Səyahət', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  { id: 'st7', emoji: '🧟', text: 'Zombi Hücumu', bg: 'bg-lime-600/10 border-lime-600/20 text-lime-500' },
  { id: 'st8', emoji: '🔥', text: 'Əfsanə Səhnə', bg: 'bg-red-500/10 border-red-500/20 text-red-500' },
  { id: 'st9', emoji: '🦖', text: 'Yurasik Park', bg: 'bg-green-600/10 border-green-600/20 text-green-500' },
  { id: 'st10', emoji: '🥤', text: 'Soyuq İçiçək', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  { id: 'st11', emoji: '🎭', text: 'Əsl Dram', bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
  { id: 'st12', emoji: '🚀', text: 'Gələcəyə Səyahət', bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' }
];

interface WatchPartyRoomProps {
  party: WatchParty;
  currentUser: User;
  onLeave: () => void;
  onCloseRoom?: (partyId: string) => void;
  onDeleteRoom?: (partyId: string) => void;
  onUpdateParty: (updatedParty: WatchParty) => void;
  movies: Movie[];
  theme: 'dark' | 'light';
  users?: User[];
  onInviteClick?: () => void;
  onSendInviteToFriend?: (friendId: string, partyId: string, roomName?: string) => void;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
}

// Smart Helper to detect and convert video links into embeddable player URLs
function getEmbedUrl(url: string): { embedUrl: string; isEmbeddable: boolean; isDirectVideo: boolean; reason?: string } {
  if (!url) return { embedUrl: '', isEmbeddable: false, isDirectVideo: false };

  const trimmed = url.trim();

  // Direct video file (.mp4, .webm, .m3u8)
  if (trimmed.match(/\.(mp4|webm|m3u8)(\?.*)?$/i)) {
    return { embedUrl: trimmed, isEmbeddable: true, isDirectVideo: true };
  }

  // YouTube match: watch?v=ID or youtu.be/ID or youtube.com/embed/ID
  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const ytMatch = trimmed.match(ytRegExp);
  if (ytMatch && ytMatch[2] && ytMatch[2].length === 11) {
    const videoId = ytMatch[2];
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&controls=1`,
      isEmbeddable: true,
      isDirectVideo: false,
    };
  }

  // Vimeo match
  const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/\d+\/video\/|)(\d+)/;
  const vimeoMatch = trimmed.match(vimeoRegExp);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      isEmbeddable: true,
      isDirectVideo: false,
    };
  }

  // Known embed/player URLs (e.g. ok.ru/videoembed, vk.com/video_ext, rutube.ru/play/embed, Dailymotion embed, etc.)
  if (trimmed.includes('embed') || trimmed.includes('player') || trimmed.includes('video_ext') || trimmed.includes('/v/')) {
    let srcUrl = trimmed;
    if (!srcUrl.includes('?')) {
      srcUrl += '?autoplay=1&mute=0';
    } else if (!srcUrl.includes('autoplay=')) {
      srcUrl += '&autoplay=1&mute=0';
    }
    return { embedUrl: srcUrl, isEmbeddable: true, isDirectVideo: false };
  }

  // General search engine result pages (Yandex search, Google search) that are not direct movie pages
  if (trimmed.includes('/search?') || trimmed.includes('yandex.ru/search') || trimmed.includes('yandex.az/search') || trimmed.includes('google.com/search')) {
    return { 
      embedUrl: trimmed, 
      isEmbeddable: false, 
      isDirectVideo: false,
      reason: 'Axtarış motorunun axtarış nəticələri səhifəsi brauzer təhlükəsizliyinə (X-Frame-Options) görə iframe daxilində açılmır. Zəhmət olmasa axtarışdan sonra filmin öz səhifəsinin və ya pleyerinin linkini kopyalayıb yapışdırın.'
    };
  }

  // Default fallback
  let srcUrl = trimmed;
  if (!srcUrl.includes('?')) {
    srcUrl += '?autoplay=1&mute=0';
  } else if (!srcUrl.includes('autoplay=')) {
    srcUrl += '&autoplay=1&mute=0';
  }
  return { embedUrl: srcUrl, isEmbeddable: true, isDirectVideo: false };
}

export default function WatchPartyRoom({
  party,
  currentUser,
  onLeave,
  onCloseRoom,
  onDeleteRoom,
  onUpdateParty,
  movies,
  theme,
  users = [],
  onInviteClick,
  onSendInviteToFriend
}: WatchPartyRoomProps) {
  const [messageText, setMessageText] = useState('');
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('Sinxronizasiya tamamlandı.');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuickInviteModal, setShowQuickInviteModal] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'gif' | 'sticker'>('gif');
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSaveEditMsg = async (msgId: string) => {
    if (!editingMsgText.trim()) return;
    const trimmed = editingMsgText.trim();
    const updatedChat = party.chat.map(m => m.id === msgId ? { ...m, message: trimmed } : m);
    onUpdateParty({ ...party, chat: updatedChat });
    setEditingMsgId(null);
    setEditingMsgText('');
    try {
      await apiUpdateChatMessage(msgId, trimmed);
    } catch (err) {
      console.error('Mesaj redaktə edilərkən xəta:', err);
    }
  };

  const handleDeleteMsg = async (msgId: string) => {
    const updatedChat = party.chat.filter(m => m.id !== msgId);
    onUpdateParty({ ...party, chat: updatedChat });
    try {
      await apiDeleteChatMessage(msgId);
    } catch (err) {
      console.error('Mesaj silinərkən xəta:', err);
    }
  };

  const handleTransferHost = async (targetUserId: string, targetUsername: string) => {
    if (!window.confirm(`Host statusunu @${targetUsername} istifadəçisinə ötürmək istədiyinizdən əminsiniz?`)) return;
    
    const updatedParty = { ...party, creator: targetUsername };
    onUpdateParty(updatedParty);

    try {
      await apiTransferHost(party.id, targetUserId);
    } catch (err) {
      console.error('Host statusu ötürülərkən xəta:', err);
    }
  };

  const movie = movies.find((m) => m.id === party.movieId) || movies[0];

  const totalDuration = useMemo(() => parseDurationToSeconds(movie?.duration), [movie?.duration]);
  const [currentTime, setCurrentTime] = useState<number>(party.currentTimestamp ?? 2535);

  // Sync state if party props update from external
  useEffect(() => {
    if (typeof party.currentTimestamp === 'number') {
      setCurrentTime(party.currentTimestamp);
    }
  }, [party.currentTimestamp]);

  // Live timer ticker when party is playing
  useEffect(() => {
    let timer: any = null;
    if (party.isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev + 1 >= totalDuration) {
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [party.isPlaying, totalDuration]);

  // Handle timeline seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = Math.floor(percentage * totalDuration);
    setCurrentTime(newTime);

    const updatedParty: WatchParty = {
      ...party,
      currentTimestamp: newTime
    };
    onUpdateParty(updatedParty);
  };

  // Helper to lookup participant Instagram-like username tag
  const getParticipantUsername = (pId: string, pName: string) => {
    const found = users.find((u) => u.id === pId);
    if (found) return found.username;
    // fallback clean string
    return pName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'kinoçu';
  };

  // Helper to lookup sender Instagram-like username tag
  const getSenderUsername = (senderName: string) => {
    const found = users.find((u) => u.name === senderName);
    if (found) return found.username;
    // fallback clean string
    return senderName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'kinoçu';
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [party.chat]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    const isPlayingNext = !party.isPlaying;
    const statusMsg = isPlayingNext 
      ? `${currentUser.name} yayımı başlatdı.` 
      : `${currentUser.name} yayımı dayandırdı.`;
    
    setSyncStatus(statusMsg);
    setTimeout(() => setSyncStatus('Sinxronizasiya tamamlandı.'), 3000);

    const updatedParty: WatchParty = {
      ...party,
      isPlaying: isPlayingNext,
      currentTimestamp: currentTime,
      chat: [
        ...party.chat,
        {
          id: 'sys_' + Date.now(),
          sender: 'Sistem',
          senderAvatar: '',
          message: statusMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    onUpdateParty(updatedParty);
  };

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const updatedParty: WatchParty = {
      ...party,
      chat: [
        ...party.chat,
        {
          id: 'msg_' + Date.now(),
          sender: currentUser.name,
          senderAvatar: currentUser.avatar,
          message: messageText.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    onUpdateParty(updatedParty);
    setMessageText('');
  };

  // Handle Send GIF or Sticker
  const handleSendMedia = (type: 'gif' | 'sticker', content: string) => {
    const mediaMessage = type === 'gif' ? `[GIF]: ${content}` : `[STICKER]: ${content}`;
    const updatedParty: WatchParty = {
      ...party,
      chat: [
        ...party.chat,
        {
          id: 'msg_' + Date.now(),
          sender: currentUser.name,
          senderAvatar: currentUser.avatar,
          message: mediaMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    onUpdateParty(updatedParty);
    setShowMediaPicker(false);
  };

  // Trigger Emoji Reaction
  const handleEmojiReaction = (emoji: string) => {
    // Add floating emoji
    const newEmoji: FloatingEmoji = {
      id: 'emoji_' + Math.random(),
      emoji: emoji,
      left: Math.random() * 80 + 10 // random percentage position
    };
    setFloatingEmojis((prev) => [...prev, newEmoji]);

    // Send emoji system message
    const updatedParty: WatchParty = {
      ...party,
      chat: [
        ...party.chat,
        {
          id: 'sys_emoji_' + Date.now(),
          sender: 'Sistem',
          senderAvatar: '',
          message: `${currentUser.name} reaksiya verdi: ${emoji}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    onUpdateParty(updatedParty);

    // Remove emoji after 3 seconds
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 animate-fade-in">
      
      {/* Top Meta Details bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-xl ${
        theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-zinc-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600/10 rounded-full text-red-500">
            <UsersIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-display">{party.roomName}</h2>
              <span className="px-2 py-0.5 bg-red-600/10 text-red-500 text-[8px] tracking-widest rounded-full font-mono font-bold uppercase animate-pulse">Canlı</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">
              Hazırda izlənilir: <strong className="text-red-500 font-bold">{movie.title}</strong> • Otaq Sahibi: <strong className={theme === 'dark' ? 'text-zinc-300 font-bold' : 'text-zinc-600 font-bold'}>@{party.creator === currentUser.username ? currentUser.username : party.creator}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono uppercase tracking-wider rounded-full">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>{syncStatus}</span>
          </div>
          <button
            onClick={() => onInviteClick ? onInviteClick() : setShowShareModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-4 text-[10px] uppercase tracking-wider font-mono font-bold rounded-full transition cursor-pointer bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/10"
          >
            <Share2 className="w-3.5 h-3.5" />
            Otağı Paylaş / Dəvət Et 📅
          </button>
          {(party.creator === currentUser.username || currentUser.role === 'admin') && onCloseRoom && (
            <button
              onClick={() => onCloseRoom(party.id)}
              className="flex items-center gap-1.5 py-1.5 px-4 text-[10px] uppercase tracking-wider font-mono font-bold rounded-full transition cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20"
              title="Otağı Bağla (CineVerse API)"
            >
              <AlertCircle className="w-3 h-3" />
              Otağı Bağla
            </button>
          )}
          {(party.creator === currentUser.username || currentUser.role === 'admin') && onDeleteRoom && (
            <button
              onClick={() => onDeleteRoom(party.id)}
              className="flex items-center gap-1.5 py-1.5 px-4 text-[10px] uppercase tracking-wider font-mono font-bold rounded-full transition cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
              title="Otağı Sil (CineVerse API)"
            >
              <LogOut className="w-3 h-3" />
              Otağı Sil
            </button>
          )}
          <button
            onClick={onLeave}
            className={`flex items-center gap-1.5 py-1.5 px-4 text-[10px] uppercase tracking-wider font-mono font-bold rounded-full transition cursor-pointer ${
              theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            <LogOut className="w-3 h-3" />
            Otaqdan Çıx
          </button>
        </div>
      </div>

      {/* Main Container: Player on left, Chat on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Video Player & Emojis */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl bg-black border border-zinc-900 overflow-hidden shadow-2xl flex flex-col justify-between">
            
            {/* Overlay background details */}
            <div className="absolute inset-0 bg-radial from-transparent to-black/80 pointer-events-none z-10" />

            {/* Video or Cinema Placeholder Backdrop */}
            {(() => {
              if (!party.isPlaying) {
                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                    <img src={movie.banner} alt="Cinematic poster" className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs" />
                    <div className="bg-red-600/20 p-4 rounded-full border border-red-500/30 mb-3 animate-pulse">
                      <Play className="w-10 h-10 text-red-500 fill-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1 font-display">Yayım Müvəqqəti Dayandırılıb</h3>
                    <p className="text-zinc-400 text-xs max-w-sm">
                      Otaqdakı hər kəs üçün eyni vaxtda sinxronlaşdırılmış şəkildə dayandırıldı. Davam etmək üçün "Başlat" düyməsini sıxın.
                    </p>
                  </div>
                );
              }

              const rawUrl = movie.trailerUrl || '';
              const { embedUrl, isEmbeddable, isDirectVideo, reason } = getEmbedUrl(rawUrl);

              if (isDirectVideo) {
                return (
                  <video
                    src={embedUrl}
                    autoPlay
                    controls
                    className="w-full h-full object-contain absolute inset-0 pointer-events-auto"
                  />
                );
              }

              if (isEmbeddable) {
                return (
                  <div className="relative w-full h-full">
                    <iframe
                      src={embedUrl}
                      title="Cinematic stream player"
                      className="w-full h-full object-cover absolute inset-0 pointer-events-auto"
                      allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    {/* Floating Info Banner for Web Pages */}
                    {!embedUrl.includes('youtube') && !embedUrl.includes('vimeo') && !isDirectVideo && (
                      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-auto flex items-center justify-between gap-2 p-2.5 px-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white shadow-xl backdrop-blur-md">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-300 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                          <span className="truncate">Sayt brauzer təhlükəsizliyinə görə qara görünərsə:</span>
                        </div>
                        <a
                          href={rawUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition-all flex-shrink-0 flex items-center gap-1"
                        >
                          Saytda Aç ↗
                        </a>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10 bg-zinc-950/90 backdrop-blur-md">
                  <img src={movie.banner || movie.poster} alt="Poster" className="absolute inset-0 w-full h-full object-cover opacity-15 filter blur-md" />
                  <div className="relative z-20 max-w-md bg-zinc-900/90 border border-amber-500/40 p-5 rounded-2xl shadow-2xl">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                      🔒
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1 font-display">İframe Təhlükəsizlik Bloku</h3>
                    <p className="text-zinc-300 text-[11px] leading-relaxed mb-4">
                      {reason || 'Axtarış motorları və bəzi web saytlar brauzer təhlükəsizlik qaydalarına (X-Frame-Options) görə öz səhifələrinin pəncərədə (iframe) açılmasını bloklayır.'}
                    </p>
                    <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-left mb-3">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-mono mb-1">
                        💡 Həll Yolu (Tövsiyə olunur):
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-snug">
                        İstədiyiniz filmin və ya videonun <strong>YouTube keçidini</strong> yapışdırın — sistemimiz onu <strong>avtomatik olaraq otaqda kəsintisiz pleyer kimi açacaq!</strong>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Floating Emojis Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
              {floatingEmojis.map((e) => (
                <div
                  key={e.id}
                  style={{ left: `${e.left}%` }}
                  className="absolute bottom-10 text-4xl animate-bounce-float select-none opacity-90 transition-all duration-1000"
                >
                  {e.emoji}
                </div>
              ))}
            </div>

            {/* Simulated Live Top Banner */}
            <div className="w-full flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black to-transparent">
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full tracking-wider uppercase">RAVE CANLI SİNXR</span>
              <div className="flex items-center gap-1 text-[11px] text-zinc-300 font-mono">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <span>MÜZAHİRƏ REJİMİ</span>
              </div>
            </div>

            {/* Control bar */}
            <div className="w-full p-4 z-20 bg-gradient-to-t from-black to-transparent flex flex-col gap-3">
              {/* Progress Slider (live dynamic timer & seekable progress bar) */}
              <div className="space-y-1">
                <div 
                  onClick={handleSeek}
                  className="w-full h-2 bg-zinc-800 hover:h-2.5 rounded-full overflow-hidden cursor-pointer relative group transition-all"
                  title="Gedişat xəttinə klikləyərək vaxtı dəyişdirin"
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all duration-300 group-hover:bg-red-500" 
                    style={{ width: `${Math.min(100, Math.max(0, (currentTime / (totalDuration || 1)) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="font-bold text-red-500 flex items-center gap-1">
                    {party.isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />}
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-zinc-400">{formatTime(totalDuration)}</span>
                </div>
              </div>

              {/* Player Button and Reaction Trigger */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePlay}
                    className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg transition cursor-pointer"
                  >
                    {party.isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                  <span className="text-xs font-semibold text-white">
                    {party.isPlaying ? 'Canlı Yayım Başladıldı' : 'Yayım Dayandırılıb'}
                  </span>
                </div>

                {/* Live Floating Reaction Buttons */}
                <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 p-1.5 rounded-2xl">
                  {[
                    { emoji: '🍿', label: 'Popkorn' },
                    { emoji: '❤️', label: 'Ürək' },
                    { emoji: '🔥', label: 'Alov' },
                    { emoji: '😂', label: 'Gülüş' },
                    { emoji: '😢', label: 'Kədər' },
                    { emoji: '👍', label: 'Bəyənmə' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleEmojiReaction(item.emoji)}
                      className="p-1.5 text-base hover:scale-130 transition cursor-pointer"
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Room Participants section */}
          <div className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-zinc-400" />
                Otaqdakı İzləyicilər ({party.participants.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickInviteModal(true)}
                className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold flex items-center justify-center transition cursor-pointer shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95"
                title="Odaya Dost Dəvət Et"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {party.participants.map((p) => {
                const username = getParticipantUsername(p.id, p.name);
                const isHost = username === party.creator || p.name === party.creator;
                const canTransfer = (party.creator === currentUser.username || currentUser.role === 'admin') && !isHost;

                return (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/10 rounded-2xl border border-zinc-800/10">
                    <img src={p.avatar} alt={p.name} className="w-6.5 h-6.5 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold block leading-tight">{p.name}</span>
                        {isHost && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" /> Host
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-red-500 font-bold block font-mono">@{username}</span>
                    </div>
                    {canTransfer && (
                      <button
                        type="button"
                        onClick={() => handleTransferHost(p.id, username)}
                        title="Host statusunu bu istifadəçiyə ötür"
                        className="ml-1 p-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setShowQuickInviteModal(true)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border border-dashed transition cursor-pointer hover:border-red-500 hover:text-red-500 ${
                  theme === 'dark'
                    ? 'bg-zinc-900/60 border-zinc-700 text-zinc-400'
                    : 'bg-zinc-100 border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center font-bold text-xs">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold">+ Dəvət Et</span>
              </button>
            </div>
          </div>

          {movie.externalUrl && (
            <div className={`p-4 border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl transition-all ${
              theme === 'dark' 
                ? 'bg-gradient-to-r from-red-950/20 to-zinc-950/40 border-red-900/30' 
                : 'bg-gradient-to-r from-red-50/50 to-zinc-50 border-red-200/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-600/20 shrink-0">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-red-500 font-mono">Xarici İzləmə Linki Aktivdir</h4>
                  <p className={`text-[11px] mt-0.5 leading-relaxed font-sans ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Bu film üçün otaq sahibi tərəfindən daxil edilən xarici keçid mövcuddur. Hər kəs eyni keçiddən istifadə edə bilər.
                  </p>
                </div>
              </div>
              <a 
                href={movie.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-red-600/10 whitespace-nowrap"
              >
                Filmi Saytda Aç 🌐
              </a>
            </div>
          )}
        </div>

        {/* Right column: Chat Panel */}
        <div className="lg:col-span-1">
          <div className={`h-[520px] rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl ${
            theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            {/* Chat header */}
            <div className="p-4 border-b border-zinc-800/10 flex justify-between items-center bg-zinc-800/5">
              <span className="font-bold text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-500" />
                Söhbət Paneli
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">CANLI CHAT</span>
            </div>

            {/* Chat messages area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {party.chat.map((msg) => {
                const isSystem = msg.sender === 'Sistem';
                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center py-1">
                      <span className="px-3 py-1 bg-zinc-800/30 border border-zinc-800/10 rounded-full text-[10px] text-zinc-500 font-medium">
                        {msg.message}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.sender === currentUser.name;
                const isGif = msg.message.startsWith('[GIF]:');
                const isSticker = msg.message.startsWith('[STICKER]:');
                let stickerObj = null;
                if (isSticker) {
                  const stickerText = msg.message.replace('[STICKER]:', '').trim();
                  stickerObj = MOVIE_STICKERS.find(s => `${s.emoji} ${s.text}` === stickerText || s.text === stickerText);
                }

                return (
                  <div key={msg.id} className={`flex items-start gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                    <img src={msg.senderAvatar} alt={msg.sender} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <div className={`flex items-baseline gap-1.5 mb-1 ${isMe ? 'justify-end' : ''}`}>
                        <span className="text-[10px] font-bold text-zinc-400">@{getSenderUsername(msg.sender)}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">{msg.timestamp}</span>
                        {(isMe || currentUser.role === 'admin') && (
                          <div className="flex items-center gap-1 ml-1 opacity-80 hover:opacity-100 transition">
                            {!isGif && !isSticker && isMe && (
                              <button
                                onClick={() => {
                                  setEditingMsgId(msg.id);
                                  setEditingMsgText(msg.message);
                                }}
                                title="Mesajı redaktə et"
                                className="text-zinc-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMsg(msg.id)}
                              title="Mesajı sil"
                              className="text-zinc-400 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingMsgId === msg.id ? (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <input
                            type="text"
                            value={editingMsgText}
                            onChange={(e) => setEditingMsgText(e.target.value)}
                            className={`p-2 rounded-xl text-xs focus:outline-none border ${
                              theme === 'dark' ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                            }`}
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingMsgId(null)}
                              className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                            >
                              Ləğv Et
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditMsg(msg.id)}
                              className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                            >
                              Yadda Saxla
                            </button>
                          </div>
                        </div>
                      ) : isGif ? (
                        <div className="overflow-hidden rounded-2xl border border-zinc-800/10 shadow-md">
                          <img 
                            src={msg.message.replace('[GIF]:', '').trim()} 
                            alt="Movie Reaction GIF" 
                            className="max-w-[150px] max-h-[150px] object-cover rounded-2xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : isSticker ? (
                        <div className={`flex flex-col items-center p-3 rounded-2xl border ${
                          stickerObj 
                            ? stickerObj.bg 
                            : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-300'
                        } max-w-[140px] shadow-sm select-none animate-fade-in`}>
                          <span className="text-4xl filter drop-shadow-md mb-1.5 transform hover:scale-115 transition-all duration-300">
                            {stickerObj ? stickerObj.emoji : '🍿'}
                          </span>
                          <span className="text-[9px] font-black tracking-wider uppercase text-center leading-none font-mono">
                            {stickerObj ? stickerObj.text : 'Stiker'}
                          </span>
                        </div>
                      ) : (
                        <div className={`p-2.5 rounded-2xl text-xs font-sans ${
                          isMe
                            ? 'bg-red-600 text-white rounded-tr-none'
                            : theme === 'dark'
                            ? 'bg-zinc-950 text-white border border-zinc-850 rounded-tl-none'
                            : 'bg-zinc-100 text-zinc-900 border border-zinc-200/50 rounded-tl-none'
                        }`}>
                          {msg.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Collapsible GIF & Sticker Picker */}
            {showMediaPicker && (
              <div className={`p-3 border-t border-zinc-800/10 flex flex-col gap-2.5 transition-all max-h-[220px] overflow-hidden shrink-0 ${
                theme === 'dark' ? 'bg-zinc-950/80' : 'bg-zinc-50'
              }`}>
                {/* Header / Tabs */}
                <div className="flex items-center justify-between border-b border-zinc-800/5 pb-1.5">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPickerTab('gif')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition cursor-pointer ${
                        pickerTab === 'gif'
                          ? 'bg-red-600 text-white'
                          : theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:text-zinc-900'
                      }`}
                    >
                      🎥 GIF-lər
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab('sticker')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase transition cursor-pointer ${
                        pickerTab === 'sticker'
                          ? 'bg-red-600 text-white'
                          : theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-white text-zinc-600 border border-zinc-200 hover:text-zinc-900'
                      }`}
                    >
                      ✨ Stikerlər
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(false)}
                    className="text-[10px] text-zinc-500 hover:text-red-500 font-bold uppercase cursor-pointer"
                  >
                    Bağla
                  </button>
                </div>

                {/* Tab content 1: GIFs */}
                {pickerTab === 'gif' && (
                  <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                    {/* Search bar inside pickers */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={gifSearchQuery}
                        onChange={(e) => setGifSearchQuery(e.target.value)}
                        placeholder="GIF axtar... (popkorn, alqış, şok...)"
                        className={`w-full pl-7 pr-3 py-1 text-[10px] rounded-lg border focus:outline-none focus:ring-1 focus:ring-red-500 transition ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />
                    </div>
                    {/* GIFs horizontal scroll view */}
                    <div className="flex gap-2 overflow-x-auto pb-1 select-none scrollbar-thin">
                      {MOVIE_GIFS.filter(gif => 
                        gif.name.toLowerCase().includes(gifSearchQuery.toLowerCase()) || 
                        gif.category.toLowerCase().includes(gifSearchQuery.toLowerCase())
                      ).map(gif => (
                        <button
                          key={gif.id}
                          type="button"
                          onClick={() => handleSendMedia('gif', gif.url)}
                          className="shrink-0 relative group rounded-xl overflow-hidden border border-zinc-800/10 hover:border-red-500 transition cursor-pointer"
                        >
                          <img 
                            src={gif.url} 
                            alt={gif.name} 
                            className="w-18 h-18 object-cover rounded-xl group-hover:scale-105 transition duration-300" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white py-0.5 text-center truncate group-hover:bg-red-600/90 font-medium">
                            {gif.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab content 2: Stickers */}
                {pickerTab === 'sticker' && (
                  <div className="flex-1 overflow-x-auto pb-1 select-none scrollbar-thin flex gap-3.5 items-center py-2">
                    {MOVIE_STICKERS.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSendMedia('sticker', `${st.emoji} ${st.text}`)}
                        className={`shrink-0 flex flex-col items-center p-2 rounded-xl border ${st.bg} hover:scale-105 active:scale-95 transition cursor-pointer w-20 shadow-xs`}
                      >
                        <span className="text-2xl filter drop-shadow-sm mb-1">{st.emoji}</span>
                        <span className="text-[8px] font-black tracking-wide text-center uppercase truncate w-full">{st.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Chat input panel */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-800/10 bg-zinc-800/5 flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowMediaPicker(!showMediaPicker)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                  showMediaPicker
                    ? 'bg-red-600 border-red-600 text-white'
                    : theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white' 
                    : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
                title="GIF və Stikerlər ✨"
              >
                <Smile className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Mesajınızı bura yazın..."
                className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              />
              <button
                type="submit"
                className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>

      </div>

      {/* Share Modal overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl relative ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <h3 className="text-base font-extrabold mb-2 font-display">Otaq Linkini Paylaş 🚀</h3>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              Dostlarınızı, Instagram nick-ləri olan kinoçuları CineVerse platformasındakı bu otağa dəvət edin və birlikdə izləyin!
            </p>

            {/* Copy link widget */}
            <div className="space-y-1.5 mb-5">
              <label className="block text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Unikal Otaq Linki</label>
              <div className={`flex items-center gap-2 p-2 rounded-xl border ${
                theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <input
                  type="text"
                  readOnly
                  value={`https://cineverse.com/watch-party/${party.id}`}
                  className="bg-transparent border-none text-xs font-mono text-zinc-400 flex-1 focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://cineverse.com/watch-party/${party.id}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>

            {/* Social Share grid */}
            <div className="space-y-3">
              <span className="block text-[9px] font-bold uppercase text-zinc-500 tracking-wider">Sosial Şəbəkələrdə Paylaş</span>
              <div className="grid grid-cols-3 gap-2">
                <a 
                  href={`https://api.whatsapp.com/send?text=Gəl%20birlikdə%20"${movie.title}"%20filmini%20izləyək!%20🍿🎥%20https://cineverse.com/watch-party/${party.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-855 hover:bg-zinc-900 text-zinc-300' : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <span className="text-emerald-500 text-sm font-black mb-1">WA</span>
                  <span className="text-[9px] font-bold">WhatsApp</span>
                </a>

                <a 
                  href={`https://t.me/share/url?url=https://cineverse.com/watch-party/${party.id}&text=Gəl%20birlikdə%20"${movie.title}"%20filmini%20izləyək!%20🍿🎥`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-855 hover:bg-zinc-900 text-zinc-300' : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <span className="text-sky-400 text-sm font-black mb-1">TG</span>
                  <span className="text-[9px] font-bold">Telegram</span>
                </a>

                <a 
                  href={`https://twitter.com/intent/tweet?text=CineVerse-də%20"${movie.title}"%20filmini%20izləyirik,%20sən%20də%20qoşul!%20🍿🎥%20https://cineverse.com/watch-party/${party.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-855 hover:bg-zinc-900 text-zinc-300' : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <span className="text-zinc-400 text-sm font-black mb-1">X</span>
                  <span className="text-[9px] font-bold">Twitter / X</span>
                </a>
              </div>

              {/* Instagram story note */}
              <div className="p-3.5 bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-purple-500/10 rounded-2xl">
                <span className="block text-[10px] font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 uppercase font-mono mb-1">
                  📸 Instagram Story Tövsiyəsi
                </span>
                <p className="text-[9px] text-zinc-500 leading-relaxed font-sans">
                  İnstagram Story paylaşıb <strong>"Link" stikeri</strong> vasitəsilə bu linki yerləşdirə, dostlarınızın niki tag edərək yayım partiyasına səsləyə bilərsiniz!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className={`w-full py-2.5 mt-4 rounded-xl text-xs font-bold transition cursor-pointer ${
                theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-350' : 'bg-zinc-150 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              Bağla
            </button>
          </div>
        </div>
      )}

      {/* Quick Invite Modal overlay */}
      {showQuickInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border p-5 shadow-2xl relative space-y-4 ${
            theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-600/10 text-red-500">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-display">Odaya Dost Dəvət Et 🍿</h3>
                  <p className="text-[10px] text-zinc-500">Dostlarının adını və ya @username-ini axtarıb otağa çağır.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickInviteModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="İstifadəçi adı və ya ad daxil et..."
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border outline-none transition ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-700/80 text-white focus:border-red-500'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-red-500'
                }`}
                autoFocus
              />
            </div>

            {/* Friend List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(() => {
                const query = friendSearch.trim().toLowerCase();
                const filteredUsers = users.filter(u => u.id !== currentUser.id && (
                  !query || 
                  u.name.toLowerCase().includes(query) || 
                  u.username.toLowerCase().includes(query)
                ));

                if (filteredUsers.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-zinc-500">
                      {query ? 'Axtarışa uyğun istifadəçi tapılmadı.' : 'Dost siyahınız boşdur.'}
                    </div>
                  );
                }

                return filteredUsers.map((u) => {
                  const isInvited = invitedIds.includes(u.id);
                  const isFollowed = currentUser.following?.includes(u.id);

                  return (
                    <div
                      key={u.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700/40 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold truncate leading-tight">{u.name}</h5>
                            {isFollowed && (
                              <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                                Təqib olunur
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-red-500 font-mono block truncate">@{u.username}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInvitedIds(prev => [...prev, u.id]);
                          
                          if (onSendInviteToFriend) {
                            onSendInviteToFriend(u.id, party.id, party.roomName);
                          }

                          const sysMessage = {
                            id: 'msg_invite_' + Date.now(),
                            sender: 'Sistem',
                            senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
                            message: `🍿 ${currentUser.name}, @${u.username} istifadəçisinə otaq dəvəti göndərdi!`,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          };

                          onUpdateParty({
                            ...party,
                            chat: [...party.chat, sysMessage]
                          });
                        }}
                        disabled={isInvited}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                          isInvited
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/10'
                        }`}
                      >
                        {isInvited ? (
                          <>
                            <Check className="w-3 h-3" />
                            Dəvət Olundu
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Dəvət Et
                          </>
                        )}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-2 border-t border-zinc-800/10 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowQuickInviteModal(false);
                  if (onInviteClick) onInviteClick();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'dark' ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Sosial Keçid Linkini Kopyala
              </button>
              <button
                type="button"
                onClick={() => setShowQuickInviteModal(false)}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
