import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, Share2, Copy, Check, X, Download, 
  MessageSquare, Sparkles, Popcorn, Clock, Send, Link, Video, Search
} from 'lucide-react';
import { Movie, WatchParty, User } from '../types';
import { getWatchPartyUrl } from '../utils/watchPartyUrl';

function resolvePartyShareUrl(party?: WatchParty | null) {
  if (!party) return window.location.origin;
  return getWatchPartyUrl(party.id, party.isPrivate ? party.inviteToken : undefined);
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  currentUser: User | null;
  users?: User[];
  inviteDirectory?: User[];
  theme: 'dark' | 'light';
  selectedMovie?: Movie | null;
  activeParty?: WatchParty | null;
  onCreateWatchParty?: (roomName: string, movieId: string) => WatchParty | null | Promise<WatchParty | null>;
  onSendInviteToFriend?: (friendId: string, partyId: string, roomName?: string) => void;
}

export default function InviteModal({
  isOpen,
  onClose,
  movies,
  currentUser,
  users = [],
  inviteDirectory,
  theme,
  selectedMovie,
  activeParty,
  onCreateWatchParty,
  onSendInviteToFriend
}: InviteModalProps) {
  // Navigation State inside modal
  const [activeTab, setActiveTab] = useState<'calendar' | 'party' | 'friends'>('calendar');
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');

  // Common Event States
  const [chosenMovieId, setChosenMovieId] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('');
  const [inviteNotes, setInviteNotes] = useState<string>('Birlikdə möhtəşəm bir film izləyək, popkornları hazırlayın! 🍿🎥');
  
  // Watch party details
  const [partyRoomName, setPartyRoomName] = useState<string>('');
  const [createdParty, setCreatedParty] = useState<WatchParty | null>(null);

  // Sharing states
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [customLink, setCustomLink] = useState('');

  // Set default date to today or tomorrow
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    
    const dateString = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
    setEventDate(dateString);
    setEventTime('21:00'); // default prime time
  }, []);

  // Pre-populate movie if provided
  useEffect(() => {
    if (selectedMovie) {
      setChosenMovieId(selectedMovie.id);
      setPartyRoomName(`${selectedMovie.title} Gecəsi 🍿`);
    } else if (movies.length > 0) {
      setChosenMovieId(movies[0].id);
      setPartyRoomName(`${movies[0].title} Gecəsi 🍿`);
    }
  }, [selectedMovie, movies]);

  // Update room name when chosen movie changes
  useEffect(() => {
    const m = movies.find(movie => movie.id === chosenMovieId);
    if (m) {
      setPartyRoomName(`${m.title} Gecəsi 🍿`);
    }
  }, [chosenMovieId, movies]);

  if (!isOpen) return null;

  const inviteList = (inviteDirectory && inviteDirectory.length > 0)
    ? inviteDirectory
    : users.filter((u) => u.id !== currentUser?.id);

  const currentMovie = movies.find(m => m.id === chosenMovieId) || selectedMovie || movies[0];

  // Helper: Format Google Calendar Template URL
  const getGoogleCalendarUrl = () => {
    if (!currentMovie) return '#';
    const title = `CineVerse Film Gecəsi: ${currentMovie.title}`;
    const description = `${inviteNotes}\n\nFilm: ${currentMovie.title}\nRejissor: ${currentMovie.director}\nMüddət: ${currentMovie.duration}\nPlatforma: ${window.location.origin}`;
    const location = activeParty
      ? resolvePartyShareUrl(activeParty)
      : (createdParty ? resolvePartyShareUrl(createdParty) : window.location.origin);

    // Date calculations
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dt = new Date(`${eventDate}T${eventTime}:00`);
    if (isNaN(dt.getTime())) return '#';
    
    const formatGoogleDate = (d: Date) => {
      const year = d.getUTCFullYear();
      const month = pad(d.getUTCMonth() + 1);
      const day = pad(d.getUTCDate());
      const hours = pad(d.getUTCHours());
      const minutes = pad(d.getUTCMinutes());
      return `${year}${month}${day}T${hours}${minutes}00Z`;
    };

    const start = formatGoogleDate(dt);
    const end = formatGoogleDate(new Date(dt.getTime() + 2 * 60 * 60 * 1000)); // default 2 hours

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
  };

  // Helper: Download ICS File
  const handleDownloadICS = () => {
    if (!currentMovie) return;
    const title = `CineVerse: ${currentMovie.title} Gecəsi`;
    const description = inviteNotes;
    const location = activeParty
      ? resolvePartyShareUrl(activeParty)
      : (createdParty ? resolvePartyShareUrl(createdParty) : window.location.origin);

    const dt = new Date(`${eventDate}T${eventTime}:00`);
    if (isNaN(dt.getTime())) return;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatICSDate = (d: Date) => {
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    };

    const start = formatICSDate(dt);
    const end = formatICSDate(new Date(dt.getTime() + 2 * 60 * 60 * 1000)); 
    const stamp = formatICSDate(new Date());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CineVerse//Movie Night Event//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${Date.now()}@cineverse.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description} - Yayım Keçidi: ${location}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${currentMovie.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_kino_gecesi.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  // Helper: Get generated invitation text
  const getInvitationText = () => {
    if (!currentMovie) return '';
    const dateFormatted = eventDate ? new Date(eventDate).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const timeFormatted = eventTime || '';
    const location = activeParty
      ? `CineVerse Watch Party 🔴 (${resolvePartyShareUrl(activeParty)})`
      : (createdParty ? `CineVerse Watch Party 🔴 (${resolvePartyShareUrl(createdParty)})` : `CineVerse Kinoteatrı 🎬 (${window.location.origin})`);

    return `🍿 Film Gecəsi Dəvəti! 🍿\n\nSəni birlikdə film izləməyə dəvət edirəm!\n\n🎬 Film: ${currentMovie.title}\n📅 Tarix: ${dateFormatted}\n⏰ Saat: ${timeFormatted}\n📍 Platforma: ${location}\n\n💬 Qeyd: "${inviteNotes}"\n\nTəqviminizə əlavə etməyi və popkornları hazırlamağı unutmayın! 🎥✨`;
  };

  // Handle watch party creation in-place inside modal
  const handleQuickCreateParty = async () => {
    if (!partyRoomName.trim() || !chosenMovieId || !onCreateWatchParty) return;
    const newParty = await onCreateWatchParty(partyRoomName.trim(), chosenMovieId);
    if (newParty) {
      setCreatedParty(newParty);
      setInviteNotes(`Gəl CineVerse-də birbaşa eyni anda canlı söhbət edərək "${currentMovie?.title || 'Film'}" izləyək! 🍿🔴`);
    }
  };

  // Share via WhatsApp, Telegram
  const getWhatsAppShareUrl = () => {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(getInvitationText())}`;
  };

  const getTelegramShareUrl = () => {
    const shareUrl = activeParty
      ? resolvePartyShareUrl(activeParty)
      : (createdParty ? resolvePartyShareUrl(createdParty) : window.location.origin);
    return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(getInvitationText())}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className={`w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh] transition ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600/15 rounded-xl text-red-500">
              <Share2 className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold font-display">Kino Gecəsinə Dəvət Et</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Təqvimə film gecəsi əlavə edin, Watch Party otağı yaradın və dostlarınızı dəvət edin.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs (Calendar Schedule vs Watch Party Live Room) */}
        {!activeParty && (
          <div className="flex border-b border-zinc-800/10 bg-zinc-800/5 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-red-600 text-white shadow-md'
                  : theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Təqvim Gecəsi Planla
            </button>
            <button
              onClick={() => setActiveTab('party')}
              className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'party'
                  ? 'bg-red-600 text-white shadow-md'
                  : theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Watch Party Yaradaraq Dəvət
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold tracking-wide transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-red-600 text-white shadow-md'
                  : theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Təqib Etdiyim Dostları Dəvət Et
            </button>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Active Watch Party Warning Header if opened from Room */}
          {activeParty && (
            <div className="p-4 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <span className="text-xl">🍿</span>
              <div>
                <h4 className="text-xs font-bold text-red-500">Mövcud Canlı Yayım Otağından Dəvət</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">Dostlarınız birbaşa bu otağa ({activeParty.roomName}) qoşulacaqlar.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left side: Form Settings */}
            <div className="space-y-4">
              
              {/* Movie Selection */}
              {!selectedMovie && !activeParty && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider">İzlənəcək Film</label>
                  <select
                    value={chosenMovieId}
                    onChange={(e) => setChosenMovieId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 transition ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  >
                    {movies.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.year})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Movie info snippet */}
              {currentMovie && (
                <div className={`p-3 rounded-2xl border flex gap-3 ${
                  theme === 'dark' ? 'bg-zinc-950/40 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <img src={currentMovie.poster} alt={currentMovie.title} className="w-10 h-14 object-cover rounded-xl shadow-md" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black leading-tight">{currentMovie.title}</h4>
                    <p className="text-[10px] text-zinc-500">{currentMovie.year} • {currentMovie.duration} • {currentMovie.director}</p>
                    <div className="flex gap-1">
                      {currentMovie.genres.slice(0, 2).map((g, idx) => (
                        <span key={idx} className="text-[8px] bg-red-600/10 text-red-500 px-1.5 py-0.5 rounded-full font-bold uppercase">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Date & Time selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Tarix</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 transition ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Saat</label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 transition ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              {/* Custom Invitation Note */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Özəl Qeyd və ya Dəvət Mesajı</label>
                <textarea
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  placeholder="Məsələn: Birlikdə maraqlı film müzakirəsi edək!🍿"
                  rows={2}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 transition resize-none ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              {/* Tab B específico: Live Watch Party Creation settings */}
              {activeTab === 'party' && !activeParty && !createdParty && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-150'
                }`}>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                    <Video className="w-4 h-4 animate-pulse" />
                    <span>Canlı Watch Party Yarat</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase text-zinc-500">Yayım Otağının Adı</label>
                    <input
                      type="text"
                      value={partyRoomName}
                      onChange={(e) => setPartyRoomName(e.target.value)}
                      placeholder="Məsələn: Həftəsonu Sinema Gecəsi"
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 transition ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleQuickCreateParty}
                    className="w-full py-2 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-600/10 cursor-pointer"
                  >
                    🚀 Watch Party Otağı Yarat
                  </button>
                </div>
              )}

              {/* Tab C: Followed Friends Direct Invitation */}
              {activeTab === 'friends' && (
                <div className={`p-4 rounded-2xl border space-y-3.5 ${
                  theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span>Təqib Etdiyiniz Dostların Siyahısı</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold">
                      {inviteList.length} Dost
                    </span>
                  </div>

                  {/* Friend Search Box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      placeholder="Dostunun adını və ya @istifadəçi adını axtar..."
                      className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition ${
                        theme === 'dark'
                          ? 'bg-zinc-900 border-zinc-700/80 text-white focus:border-red-500'
                          : 'bg-white border-zinc-300 text-zinc-900 focus:border-red-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {(() => {
                      const query = friendSearchQuery.trim().toLowerCase();
                      const listToDisplay = query
                        ? inviteList.filter(u => u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query))
                        : inviteList;

                      if (listToDisplay.length === 0) {
                        return (
                          <div className="text-center py-6 text-xs text-zinc-500">
                            {query ? 'Axtarışa uyğun dost tapılmadı.' : 'Dəvət siyahınız boşdur. Sosial bölməsindən dost əlavə edin!'}
                          </div>
                        );
                      }

                      return listToDisplay.map((friend) => {
                        const isInvited = invitedUserIds.includes(friend.id);

                        return (
                          <div
                            key={friend.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                              theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={friend.avatar} alt={friend.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700/40" />
                              <div>
                                <h5 className="text-xs font-bold leading-tight">{friend.name}</h5>
                                <span className="text-[10px] text-red-500 font-mono block">@{friend.username}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setInvitedUserIds(prev => [...prev, friend.id]);
                                const partyId = activeParty?.id || createdParty?.id || 'room_general';
                                const partyName = activeParty?.roomName || createdParty?.roomName || `${currentMovie?.title} Gecəsi`;
                                if (onSendInviteToFriend) {
                                  onSendInviteToFriend(friend.id, partyId, partyName);
                                }
                              }}
                              disabled={isInvited}
                              className={`py-1 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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
                                  <Send className="w-3 h-3" />
                                  Dəvət Et
                                </>
                              )}
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Show details if Watch Party is successfully created inside modal */}
              {createdParty && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Check className="w-4 h-4" />
                    <span>Watch Party Otağı Uğurla Yaradıldı!</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">Dostlarınız CineVerse platformasında daxil olaraq bu canlı otağa qoşula bilərlər.</p>
                  <p className="text-[10px] font-mono text-zinc-500">Otaq Adı: <strong className="text-zinc-300 font-bold">{createdParty.roomName}</strong></p>
                </div>
              )}

            </div>

            {/* Right side: Live Preview & Action triggers */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Dəvət Kartı Önizləməsi</label>
              
              {/* Premium Preview Card */}
              <div className={`p-5 rounded-3xl border relative overflow-hidden flex flex-col justify-between h-[230px] shadow-lg ${
                theme === 'dark' 
                  ? 'bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-zinc-950 border-zinc-800' 
                  : 'bg-gradient-to-b from-zinc-50 via-white to-zinc-50 border-zinc-200'
              }`}>
                {/* Visual decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full filter blur-xl pointer-events-none" />
                
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold tracking-widest text-red-500 uppercase font-mono">CINEVERSE DƏVƏTNAMƏ</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="block text-[9px] text-zinc-500 font-bold">IZLƏNƏCƏK FILM:</span>
                    <h3 className="text-sm font-black tracking-tight leading-none">{currentMovie?.title}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div>
                      <span className="block text-[8px] text-zinc-500 font-bold uppercase">📅 Tarix:</span>
                      <span className="font-semibold">{eventDate ? new Date(eventDate).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long' }) : 'Planlaşdırılmayıb'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-zinc-500 font-bold uppercase">⏰ Saat:</span>
                      <span className="font-semibold">{eventTime || 'Planlaşdırılmayıb'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/10">
                    <p className="text-[10px] text-zinc-400 italic line-clamp-2">"{inviteNotes}"</p>
                  </div>
                </div>

                <div className="text-[9px] text-zinc-500 pt-2 border-t border-zinc-800/5 flex items-center justify-between">
                  <span>Sistem tərəfindən tənzimlənib</span>
                  <span className="font-mono text-red-500">CINEVERSE.COM</span>
                </div>
              </div>

              {/* Action buttons (Add to Calendar, copy text, quick social sharing) */}
              <div className="space-y-2">
                
                {/* 1. Add to Calendar Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/10 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Google Təqvim
                  </a>
                  <button
                    onClick={handleDownloadICS}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-zinc-800 hover:bg-zinc-750 text-white border-zinc-750' 
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 text-red-500" />
                    iCal (.ICS) Yüklə
                  </button>
                </div>

                {/* 2. Copy invite details & social shortcuts */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getInvitationText());
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      copiedText 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? 'Dəvət Kopyalandı' : 'Bütün Dəvəti Kopyala'}
                  </button>
                </div>

                {/* 3. Direct Whatsapp & Telegram shortcuts */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={getWhatsAppShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[10px] font-bold rounded-xl transition border cursor-pointer ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:bg-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-emerald-500 text-sm font-black leading-none">WA</span>
                    <span>WhatsApp-da göndər</span>
                  </a>
                  <a
                    href={getTelegramShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[10px] font-bold rounded-xl transition border cursor-pointer ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:bg-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="text-sky-400 text-sm font-black leading-none">TG</span>
                    <span>Telegram-da göndər</span>
                  </a>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/10 bg-zinc-800/5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            Tamamla / Bağla
          </button>
        </div>

      </div>
    </div>
  );
}
