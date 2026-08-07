import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, Play, Pause, Send, Volume2, Users, Maximize, MessageSquare, 
  Sparkles, Flame, Eye, Film, Tv, Trophy, Shield, VolumeX, AlertTriangle, ScreenShare, Calendar, Edit3, Trash2
} from 'lucide-react';
import { User } from '../types';
import { 
  apiGetLiveStreams, 
  apiGetLiveStreamChatHistory, 
  apiSendLiveStreamMessage, 
  apiGetLiveStreamSchedule,
  apiUpdateChatMessage,
  apiDeleteChatMessage,
  LiveStreamScheduleDto 
} from '../api';

interface LiveStreamProps {
  currentUser: User;
  theme: 'dark' | 'light';
  isCinemaMode: boolean;
  setIsCinemaMode: (val: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  colorClass: string;
  timestamp: string;
  badge?: string;
}

const LIVE_STREAMS = [
  {
    id: 'stream_1',
    channelKey: 'nolan-marathon',
    title: 'Xüsusi Christopher Nolan Marafonu 🎬',
    description: 'Nolanın şah əsərləri ard-arda və kəsintisiz yayımda: Interstellar, Inception, Tenet, Oppenheimer.',
    streamUrl: 'https://www.youtube.com/embed/coYw-b1_NIs', // Interstellar trailer theme
    category: 'Film Marafonu',
    views: '1,450',
    ambientColor: 'rgba(147, 51, 234, 0.4)', // Purple
    banner: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&auto=format&fit=crop&q=80',
    typeIcon: Film
  },
  {
    id: 'stream_2',
    channelKey: 'affa-derby',
    title: 'AFFA Çempionlar Liqası Finalı: Qarabağ FK - Neftçi PFK 🏆⚽',
    description: 'Azərbaycan futbolunun möhtəşəm canlı derbi qarşıdurması. CineVerse platformasında eksklüziv canlı yayım!',
    streamUrl: 'https://www.youtube.com/embed/8vOaE-3qTIs', // Stadium scene or soccer theme
    category: 'İdman Canlı',
    views: '4,890',
    ambientColor: 'rgba(16, 185, 129, 0.4)', // Green
    banner: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
    typeIcon: Trophy
  },
  {
    id: 'stream_3',
    channelKey: 'cinemax-4k',
    title: 'CineMax 4K Canlı TV Yayımı 🍿',
    description: 'Dünya şöhrətli blokbasterlər, kinofilm xəbərləri, xüsusi intervyular və ən son məlumatlar 24/7 canlı yayımda.',
    streamUrl: 'https://www.youtube.com/embed/6_fAtx6e_Z8', // Movie clips
    category: 'Canlı TV',
    views: '830',
    ambientColor: 'rgba(239, 68, 68, 0.4)', // Red
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
    typeIcon: Tv
  }
];

const MOCK_NAMES = [
  'Elvin_H', 'Leyla_Aliyeva', 'Kanan_K', 'Aysel_99', 'Nurlan_FK', 'Gunel_S', 
  'Murad_Baku', 'Camil_A', 'Sabina_M', 'Emin_NolanFan', 'Rauf_Cinephile', 'Zahra_K'
];

const MOCK_MESSAGES_POOL = [
  'Vallah əla yayındır, keyfiyyətə söz ola bilməz! 👍',
  'Bu səhnəni neçənci dəfə izləyirəm hələ də tüklərim ürpəşir..',
  'Səsi bir az artıra bilərsiniz?',
  'Qarabağ irəli! Çempion kim olacaq görəsən?',
  'Nolan həqiqətən dahi rejissordur, hər kadrı sənətdir.',
  'Kinoteatr rejimi düyməsini basanda parıltı effekti möhtəşəm görünür, sınaqdan keçirin mütləq!',
  'CineVerse komandasına təşəkkürlər belə marafonlara görə.',
  'Dostlarımı da bura dəvət elədim, indi hamımız burdayıq 😂🍻',
  'Interstellar musiqisi Hans Zimmerin ən pik işidir.',
  'Uşaqlar, kim bilir növbəti film nə olacaq yayımda?',
  'Bu gün bura yığışmaq lap əla oldu, xüsusilə də canli çat olması.',
  'Yayımı bəyənin, hamı görsün canlını!'
];

const USERNAME_COLORS = [
  'text-rose-400', 'text-amber-400', 'text-emerald-400', 'text-sky-400',
  'text-indigo-400', 'text-purple-400', 'text-pink-400', 'text-yellow-400',
  'text-cyan-400', 'text-lime-400', 'text-orange-400'
];

export default function LiveStream({
  currentUser,
  theme,
  isCinemaMode,
  setIsCinemaMode
}: LiveStreamProps) {
  const [streamsList, setStreamsList] = useState(LIVE_STREAMS);
  const [selectedStream, setSelectedStream] = useState<any>(LIVE_STREAMS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [ambientGlowEnabled, setAmbientGlowEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');
  const [schedules, setSchedules] = useState<LiveStreamScheduleDto[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSaveEditMessage = async (msgId: string) => {
    if (!editingMsgText.trim()) return;
    const trimmed = editingMsgText.trim();
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, message: trimmed } : m));
    setEditingMsgId(null);
    setEditingMsgText('');
    try {
      await apiUpdateChatMessage(msgId, trimmed);
    } catch (err) {
      console.error('Mesaj redaktə edilərkən xəta:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await apiDeleteChatMessage(msgId);
    } catch (err) {
      console.error('Mesaj silinərkən xəta:', err);
    }
  };

  // Fetch LiveStreams from API on mount
  useEffect(() => {
    async function loadStreams() {
      try {
        const apiStreams = await apiGetLiveStreams();
        if (Array.isArray(apiStreams) && apiStreams.length > 0) {
          const mapped = apiStreams.map((s) => ({
            id: s.id,
            channelKey: s.channelKey,
            title: s.title,
            description: s.description || 'Canlı yayım',
            streamUrl: s.streamUrl.includes('youtube') ? s.streamUrl : 'https://www.youtube.com/embed/coYw-b1_NIs',
            category: s.category || 'Canlı',
            views: s.viewerCount ? s.viewerCount.toLocaleString() : '1,200',
            ambientColor: 'rgba(239, 68, 68, 0.4)',
            banner: s.thumbnailUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
            typeIcon: Tv
          }));
          setStreamsList(mapped);
          setSelectedStream(mapped[0]);
        }
      } catch (err) {
        console.log('Backend streams fetch notice (using fallback streams):', err);
      }
    }

    async function loadSchedule() {
      try {
        const sched = await apiGetLiveStreamSchedule();
        if (Array.isArray(sched)) {
          setSchedules(sched);
        }
      } catch (err) {
        // quiet fallback
      }
    }

    loadStreams();
    loadSchedule();
  }, []);

  // Initialize with chat history from API or mock chat history
  useEffect(() => {
    let isCancelled = false;

    async function loadChatHistory() {
      try {
        const history = await apiGetLiveStreamChatHistory(selectedStream.id);
        if (!isCancelled && Array.isArray(history) && history.length > 0) {
          const mapped: ChatMessage[] = history.map((m, idx) => ({
            id: m.id || `hist_${idx}`,
            sender: m.userName || 'Anonim',
            avatar: m.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80',
            message: m.message,
            colorClass: USERNAME_COLORS[idx % USERNAME_COLORS.length],
            timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'İndi',
            badge: m.userId ? 'Aktiv' : undefined
          }));
          setChatMessages(mapped);
          return;
        }
      } catch {
        // Fallback to mock messages
      }

      if (!isCancelled) {
        const initialMessages: ChatMessage[] = [];
        const now = new Date();
        for (let i = 5; i > 0; i--) {
          const timeStr = new Date(now.getTime() - i * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const randomName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
          const randomMsg = MOCK_MESSAGES_POOL[Math.floor(Math.random() * MOCK_MESSAGES_POOL.length)];
          const randomColor = USERNAME_COLORS[Math.floor(Math.random() * USERNAME_COLORS.length)];
          initialMessages.push({
            id: `init_${i}`,
            sender: randomName,
            avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=60&auto=format&fit=crop&q=80`,
            message: randomMsg,
            colorClass: randomColor,
            timestamp: timeStr,
            badge: Math.random() > 0.7 ? 'Premium' : undefined
          });
        }
        setChatMessages(initialMessages);
      }
    }

    loadChatHistory();

    return () => {
      isCancelled = true;
    };
  }, [selectedStream]);

  // Simulate active viewers talking in chat
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const randomName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      const randomMsg = MOCK_MESSAGES_POOL[Math.floor(Math.random() * MOCK_MESSAGES_POOL.length)];
      const randomColor = USERNAME_COLORS[Math.floor(Math.random() * USERNAME_COLORS.length)];
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `sim_${Date.now()}`,
          sender: randomName,
          avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=60&auto=format&fit=crop&q=80`,
          message: randomMsg,
          colorClass: randomColor,
          timestamp: nowStr,
          badge: Math.random() > 0.8 ? 'CineFan' : undefined
        }
      ].slice(-100)); // Keep last 100 messages for performance
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Scroll to bottom of chat whenever messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const msgContent = newMessageText.trim();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: currentUser.name,
      avatar: currentUser.avatar,
      message: msgContent,
      colorClass: 'text-red-500 font-bold',
      timestamp: nowStr,
      badge: 'Sən'
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessageText('');

    // Attempt backend API call to persist live stream message
    try {
      await apiSendLiveStreamMessage({
        liveStreamId: selectedStream.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        message: msgContent
      });
    } catch (err) {
      console.log('Send message live stream notice:', err);
    }
  };

  const currentIcon = selectedStream.typeIcon;

  return (
    <div className={`space-y-6 max-w-7xl mx-auto p-1 transition-all duration-500 ${isCinemaMode ? 'bg-black p-4 rounded-3xl border border-zinc-900 shadow-2xl relative z-40' : ''}`}>
      
      {/* Top Banner details (only show when not in Cinema Mode) */}
      {!isCinemaMode && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-xl ${
          theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-zinc-200 shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 rounded-full text-red-500">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black font-display tracking-tight">{selectedStream.title}</h2>
                <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  CANLI
                </span>
                <span className="text-[10px] bg-zinc-800/50 text-zinc-400 px-2 py-0.5 rounded font-mono">
                  {selectedStream.category}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {selectedStream.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-full">
              <Eye className="w-4 h-4 animate-pulse" />
              <span>{selectedStream.views} Baxır</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Stream Player & Emojis on Left, Live Chat on Right */}
      <div className={`grid grid-cols-1 ${isCinemaMode ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        
        {/* Left Column: Stream Player & Controls & Ambient Glow Option */}
        <div className={`${isCinemaMode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4 relative`}>
          
          {/* Ambient Glow Wrapper */}
          <div 
            className="relative transition-all duration-700 rounded-3xl"
            style={{
              boxShadow: ambientGlowEnabled 
                ? `0 25px 60px -15px ${selectedStream.ambientColor}, 0 0 40px -10px ${selectedStream.ambientColor}`
                : 'none'
            }}
          >
            <div className="relative aspect-video rounded-3xl bg-black border border-zinc-900 overflow-hidden shadow-2xl flex flex-col justify-between">
              {/* Overlay shadow mask */}
              <div className="absolute inset-0 bg-radial from-transparent to-black/60 pointer-events-none z-10" />

              {/* Glowing Indicator for Cinema Mode */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 pointer-events-none">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="bg-black/60 backdrop-blur-md text-[9px] font-black text-red-500 tracking-widest px-2 py-0.5 rounded border border-red-500/25">
                  LIVE STREAM
                </span>
              </div>

              {/* Video Playback IFrame */}
              {isPlaying ? (
                <iframe
                  src={`${selectedStream.streamUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1`}
                  title="CineVerse Stream Player"
                  className="w-full h-full object-cover absolute inset-0 pointer-events-auto"
                  allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
                  <img src={selectedStream.banner} alt="Stream banner" className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs" />
                  <div className="bg-red-600/20 p-5 rounded-full border border-red-500/30 mb-3 animate-pulse">
                    <Pause className="w-10 h-10 text-red-500 fill-red-500" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-1 tracking-tight">Yayım Dayandırıldı</h3>
                  <p className="text-zinc-400 text-xs max-w-sm">
                    Canlı yayımı davam etdirmək üçün alt paneldəki başlat düyməsinə basın.
                  </p>
                </div>
              )}

              {/* Dynamic bottom controls inside player */}
              <div className="w-full p-4 z-20 bg-gradient-to-t from-black via-black/40 to-transparent flex items-center justify-between mt-auto">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition cursor-pointer shadow-lg shadow-red-600/15"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isMuted 
                        ? 'bg-zinc-800/80 border-zinc-700 text-zinc-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-white'
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Ambient Glow Switcher */}
                  <button
                    type="button"
                    onClick={() => setAmbientGlowEnabled(!ambientGlowEnabled)}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
                      ambientGlowEnabled
                        ? 'bg-purple-600/20 border-purple-500/30 text-purple-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400'
                    }`}
                    title="Ambient Glow parıltı effekti"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {ambientGlowEnabled ? 'Ambient: AKTİV' : 'Ambient: QAPALI'}
                  </button>

                  {/* Cinema Mode Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsCinemaMode(!isCinemaMode)}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 ${
                      isCinemaMode
                        ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-600/20 animate-pulse'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-white'
                    }`}
                  >
                    <ScreenShare className="w-3.5 h-3.5" />
                    {isCinemaMode ? 'Normala Qayıt' : 'Kinoteatr Rejimi'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Virtual Cinema Seating Silhouette when Cinema Mode is ACTIVE */}
          {isCinemaMode && (
            <div className="w-full relative mt-1 select-none animate-fade-in pointer-events-none">
              <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-black/90 to-transparent" />
              
              {/* Theater Silhouette Graphic */}
              <div className="w-full bg-gradient-to-t from-zinc-950 to-zinc-900/60 p-4 rounded-b-2xl border-x border-b border-zinc-900/80 flex flex-col items-center">
                <span className="text-[10px] font-mono tracking-[4px] uppercase text-zinc-500 mb-2 font-bold animate-pulse text-center">
                  🍿 VİRTUAL KİNOTEATR ZALI (SƏSİZ REJİM)
                </span>
                
                {/* SVG silhouette representing rows of cinema chairs and viewer shadows */}
                <svg viewBox="0 0 800 60" className="w-full max-w-2xl opacity-60 fill-zinc-950">
                  {/* Back Row Seats */}
                  <g>
                    <path d="M 20 50 Q 30 35 40 50 Z" />
                    <path d="M 80 50 Q 90 35 100 50 Z" />
                    <path d="M 140 50 Q 150 35 160 50 Z" />
                    <path d="M 200 50 Q 210 35 220 50 Z" />
                    <path d="M 260 50 Q 270 35 280 50 Z" />
                    <path d="M 320 50 Q 330 35 340 50 Z" />
                    <path d="M 380 50 Q 390 35 400 50 Z" />
                    <path d="M 440 50 Q 450 35 460 50 Z" />
                    <path d="M 500 50 Q 510 35 520 50 Z" />
                    <path d="M 560 50 Q 570 35 580 50 Z" />
                    <path d="M 620 50 Q 630 35 640 50 Z" />
                    <path d="M 680 50 Q 690 35 700 50 Z" />
                    <path d="M 740 50 Q 750 35 760 50 Z" />
                  </g>
                  {/* Front Row Shadows / Heads */}
                  <g className="fill-black">
                    <circle cx="50" cy="55" r="12" />
                    <circle cx="110" cy="55" r="13" />
                    <circle cx="170" cy="54" r="11" />
                    <circle cx="230" cy="56" r="12" />
                    <circle cx="290" cy="55" r="14" />
                    <circle cx="350" cy="54" r="12" />
                    <circle cx="410" cy="55" r="11" />
                    <circle cx="470" cy="56" r="13" />
                    <circle cx="530" cy="54" r="12" />
                    <circle cx="590" cy="55" r="12" />
                    <circle cx="650" cy="56" r="13" />
                    <circle cx="710" cy="54" r="12" />
                    <circle cx="770" cy="55" r="11" />
                  </g>
                </svg>
              </div>
            </div>
          )}

          {/* List of other available streams (only show when not in Cinema Mode) */}
          {!isCinemaMode && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-[2px] text-zinc-500 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-red-500" /> Digər Canlı Yayım Kanalları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {streamsList.map((s: any, index: number) => {
                    const IconComponent = s.typeIcon || Tv;
                    const isCurrent = s.id === selectedStream.id;
                    return (
                      <motion.button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStream(s);
                          setIsPlaying(true);
                        }}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -45 : 45, y: 25, scale: 0.94 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-28 cursor-pointer transition duration-300 relative overflow-hidden group ${
                          isCurrent 
                            ? 'bg-red-600/15 border-red-500 shadow-lg shadow-red-600/5' 
                            : theme === 'dark' 
                            ? 'bg-white/[0.01] border-white/5 hover:bg-white/[0.04]' 
                            : 'bg-white border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/5 rounded-bl-full transform translate-x-3 -translate-y-3 group-hover:scale-110 transition duration-300 pointer-events-none" />
                        <div className="flex items-start justify-between w-full">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider ${
                            isCurrent ? 'bg-red-600 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {s.category}
                          </span>
                          <IconComponent className={`w-4 h-4 ${isCurrent ? 'text-red-500' : 'text-zinc-500'}`} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-tight line-clamp-1 group-hover:text-red-500 transition duration-300">
                            {s.title}
                          </h4>
                          <p className="text-[9px] text-zinc-500 line-clamp-1 mt-1 font-mono">
                            {s.views} baxıcı qoşulub
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* TV Program Schedule */}
              {schedules.length > 0 && (
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <h4 className="text-xs font-bold font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-500" /> TV Yayım Proqramı (Schedule)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {schedules.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex items-start gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded text-[10px] font-mono font-bold shrink-0">
                          {new Date(item.airTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-[11px] truncate">{item.programTitle}</p>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Chat Panel with Red Neon Borders */}
        <div className={`flex flex-col h-[400px] lg:h-[500px] rounded-3xl border transition-all duration-500 ${
          isCinemaMode && 'lg:h-full lg:min-h-[300px]'
        } ${
          theme === 'dark' 
            ? 'bg-zinc-950/80 border-red-600/30 shadow-[0_0_20px_-5px_rgba(239,68,68,0.25)]' 
            : 'bg-white border-zinc-200 shadow-lg'
        }`}>
          {/* Live Chat Title bar */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-red-500" />
              <span className="text-xs font-black tracking-wider uppercase font-display">Canlı Çat</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono uppercase font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>{selectedStream.views} Aktiv</span>
            </div>
          </div>

          {/* Messages window with smooth scroll-to-bottom */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 select-text select-none scrollbar-thin">
            {chatMessages.map((msg) => {
              const isMe = msg.sender === currentUser.name;
              const canEdit = isMe || currentUser.role === 'admin';
              return (
                <div key={msg.id} className="flex items-start gap-2.5 animate-fade-in text-xs">
                  <img src={msg.avatar} alt={msg.sender} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-black font-display tracking-tight hover:underline cursor-pointer truncate max-w-[120px] ${msg.colorClass}`}>
                        {msg.sender}
                      </span>
                      {msg.badge && (
                        <span className="text-[7px] font-mono font-black uppercase tracking-widest px-1 bg-red-600/10 text-red-400 border border-red-500/15 rounded-md leading-none py-0.5">
                          {msg.badge}
                        </span>
                      )}
                      <span className="text-[8px] text-zinc-500 font-mono shrink-0 ml-auto">{msg.timestamp}</span>
                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          {isMe && (
                            <button
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditingMsgText(msg.message);
                              }}
                              title="Mesajı redaktə et"
                              className="text-zinc-500 hover:text-white p-0.5 transition cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Mesajı sil"
                            className="text-zinc-500 hover:text-red-400 p-0.5 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editingMsgId === msg.id ? (
                      <div className="mt-1 space-y-1.5">
                        <input
                          type="text"
                          value={editingMsgText}
                          onChange={(e) => setEditingMsgText(e.target.value)}
                          className={`w-full p-1.5 rounded-lg text-xs border ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                          }`}
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                          >
                            Ləğv Et
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditMessage(msg.id)}
                            className="px-2 py-0.5 rounded text-[10px] bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                          >
                            Yadda Saxla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`mt-0.5 font-sans leading-relaxed break-words pr-2 ${
                        theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'
                      }`}>
                        {msg.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input text field bar */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800/10 bg-zinc-800/5 flex gap-2">
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Real-time söhbətə qoşul..."
              className={`flex-1 px-3 py-2 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 border transition ${
                theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' 
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
              }`}
            />
            <button
              type="submit"
              className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition cursor-pointer flex items-center justify-center shadow-md shadow-red-600/10 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
