import React, { useState, useEffect } from 'react';
import { Film, Bell, Search, LogOut, User as UserIcon, Shield, Moon, Sun, Menu, X, Check, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { User, Notification } from '../types';
import { apiMarkAllNotificationsAsRead, apiToggleNotificationRead, apiDeleteNotification, apiGetNotifications } from '../api';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (adminMode: boolean) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSearchFocus: () => void;
  onOpenMobileMenu: () => void;
}

export default function Navbar({
  user,
  onLogout,
  currentView,
  setCurrentView,
  isAdminMode,
  setIsAdminMode,
  notifications,
  setNotifications,
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
  onSearchFocus,
  onOpenMobileMenu
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');
  const [notifPage, setNotifPage] = useState(1);
  const notifsPerPage = 4;

  useEffect(() => {
    if (!user) return;
    async function loadNotifications() {
      try {
        const data = await apiGetNotifications(1, 50);
        if (data && Array.isArray(data.items)) {
          const backendNotifs: Notification[] = data.items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            date: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: item.isRead,
            type: (item.type as any) || 'system',
          }));
          setNotifications(backendNotifs);
        }
      } catch (err) {
        console.warn('Backend notifications fetch fallback to local state:', err);
      }
    }
    loadNotifications();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiMarkAllNotificationsAsRead();
    } catch (err) {
      console.warn('Backend mark all notifications read synced locally:', err);
    }
  };

  const handleToggleSingleRead = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: !n.read } : n))
    );
    try {
      await apiToggleNotificationRead(notifId);
    } catch (err) {
      console.warn('Backend toggle notification read synced locally:', err);
    }
  };

  const handleNotificationClick = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    setShowNotifications(false);

    try {
      await apiToggleNotificationRead(notifId);
    } catch (err) {
      // ignore
    }
    
    // Auto route for specific notifications
    const clickedNotif = notifications.find(n => n.id === notifId);
    if (clickedNotif?.type === 'party_invite') {
      setCurrentView('watch-party');
      setIsAdminMode(false);
    } else if (clickedNotif?.type === 'follower' || clickedNotif?.type === 'friend_request' || clickedNotif?.type === 'friend_request_accepted') {
      setCurrentView('social');
      setIsAdminMode(false);
    }
  };

  // Filter & Paginate
  const filteredNotifs = notifications.filter((n) => {
    if (notifFilter === 'unread') return !n.read;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNotifs.length / notifsPerPage));
  
  // Ensure current page is valid when filter changes or items are deleted/marked
  useEffect(() => {
    if (notifPage > totalPages) {
      setNotifPage(totalPages);
    }
  }, [filteredNotifs.length, totalPages, notifPage]);

  const startIndex = (notifPage - 1) * notifsPerPage;
  const visibleNotifs = filteredNotifs.slice(startIndex, startIndex + notifsPerPage);

  return (
    <nav className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-black/40 border-white/10 text-white' 
        : 'bg-white/45 border-zinc-200/80 text-zinc-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenMobileMenu}
              className={`lg:hidden p-2 rounded-full cursor-pointer ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-zinc-200'
              }`}
              id="btn-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div 
              onClick={() => { setCurrentView('home'); setIsAdminMode(false); }}
              className="flex items-center gap-1.5 cursor-pointer font-display"
            >
              <div className="text-xl font-black tracking-tighter text-red-600">
                CINE<span className={theme === 'dark' ? 'text-white' : 'text-zinc-900'}>VERSE</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onSearchFocus}
                placeholder="Film, janr, rejissor..."
                className={`w-full pl-10 pr-4 py-1.5 text-xs rounded-full border focus:outline-none focus:ring-1 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-zinc-500 focus:border-red-600 focus:ring-red-600'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-red-500 focus:ring-red-500'
                }`}
              />
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all duration-300 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
              title="Mövzunu Dəyiş"
              id="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserDropdown(false);
                }}
                className={`p-2 rounded-full border relative transition-all duration-300 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                    : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200'
                }`}
                id="btn-notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 mt-3 w-80 rounded-2xl border shadow-xl p-4 backdrop-blur-xl transition-all duration-300 z-50 ${
                  theme === 'dark'
                    ? 'bg-black/95 border-white/10 text-white'
                    : 'bg-white/95 border-zinc-200 text-zinc-900'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-2 ${
                    theme === 'dark' ? 'border-white/10' : 'border-zinc-100'
                  }`}>
                    <span className="font-bold text-xs uppercase tracking-wider font-mono text-zinc-400">Bildirişlər</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer font-bold transition-all duration-200"
                      >
                        <Check className="w-3 h-3" /> Hamısını oxundu et
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className={`flex border-b text-[11px] font-semibold mt-1.5 ${
                    theme === 'dark' ? 'border-white/10' : 'border-zinc-100'
                  }`}>
                    <button
                      onClick={() => { setNotifFilter('all'); setNotifPage(1); }}
                      className={`flex-1 pb-1.5 pt-1 text-center border-b-2 transition-all duration-200 cursor-pointer ${
                        notifFilter === 'all'
                          ? 'border-red-500 text-red-500 font-bold'
                          : 'border-transparent text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      Hamısı ({notifications.length})
                    </button>
                    <button
                      onClick={() => { setNotifFilter('unread'); setNotifPage(1); }}
                      className={`flex-1 pb-1.5 pt-1 text-center border-b-2 transition-all duration-200 cursor-pointer ${
                        notifFilter === 'unread'
                          ? 'border-red-500 text-red-500 font-bold'
                          : 'border-transparent text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      Oxunmamışlar ({unreadCount})
                    </button>
                  </div>

                  {/* List Container */}
                  <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
                    {visibleNotifs.length === 0 ? (
                      <div className="text-center py-8 text-xs text-zinc-500">
                        Hələlik bildiriş yoxdur.
                      </div>
                    ) : (
                      visibleNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n.id)}
                          className={`p-2.5 rounded-xl text-xs transition duration-200 cursor-pointer flex flex-col gap-1 relative group border ${
                            n.read
                              ? 'opacity-60 hover:opacity-100 border-transparent bg-transparent'
                              : theme === 'dark'
                              ? 'bg-white/5 border-white/5 hover:bg-white/10'
                              : 'bg-zinc-100/70 border-zinc-200/50 hover:bg-zinc-200'
                          }`}
                        >
                          <div className="flex items-center justify-between pr-6">
                            <span className="font-semibold text-red-500 text-[10px]">
                              {n.type === 'party_invite' ? '🎉 Dəvət' : n.type === 'follower' ? '👥 İzləyici' : n.type === 'like' ? '❤️ Bəyənmə' : n.type === 'comment' ? '💬 Şərh' : '⚙️ Sistem'}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">{n.date}</span>
                          </div>
                          <p className={`font-bold text-[11px] leading-tight pr-6 ${
                            theme === 'dark' ? 'text-white' : 'text-zinc-900'
                          }`}>{n.title}</p>
                          <p className={`text-[10px] leading-snug pr-6 ${
                            theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600 font-medium'
                          }`}>{n.description}</p>

                          {/* Inline Mark Read / Unread Action */}
                          <button
                            onClick={(e) => handleToggleSingleRead(e, n.id)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:scale-105 ${
                              theme === 'dark'
                                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                                : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 hover:text-zinc-900'
                            }`}
                            title={n.read ? 'Oxunmamış et' : 'Oxundu et'}
                          >
                            {n.read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-between pt-2.5 mt-2.5 border-t text-[11px] ${
                      theme === 'dark' ? 'border-white/10' : 'border-zinc-100'
                    }`}>
                      <button
                        onClick={() => setNotifPage(prev => Math.max(1, prev - 1))}
                        disabled={notifPage === 1}
                        className={`p-1 rounded-md transition duration-200 cursor-pointer flex items-center gap-0.5 font-semibold ${
                          notifPage === 1
                            ? 'opacity-30 cursor-not-allowed'
                            : theme === 'dark'
                            ? 'hover:bg-white/5 text-zinc-300'
                            : 'hover:bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Geri
                      </button>
                      
                      <span className="font-mono text-zinc-500">
                        Səhifə {notifPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setNotifPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={notifPage === totalPages}
                        className={`p-1 rounded-md transition duration-200 cursor-pointer flex items-center gap-0.5 font-semibold ${
                          notifPage === totalPages
                            ? 'opacity-30 cursor-not-allowed'
                            : theme === 'dark'
                            ? 'hover:bg-white/5 text-zinc-300'
                            : 'hover:bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        İrəli <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dynamic Admin / User Switcher */}
            {user.role === 'admin' && (
              <button
                onClick={() => {
                  setIsAdminMode(!isAdminMode);
                  setCurrentView(isAdminMode ? 'home' : 'admin');
                }}
                className={`hidden lg:flex items-center gap-1.5 py-1.5 px-3.5 text-[10px] font-bold tracking-widest uppercase rounded-full border transition-all duration-300 cursor-pointer ${
                  isAdminMode
                    ? 'bg-red-600 border-red-500 text-white hover:bg-red-700'
                    : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-red-400 hover:bg-white/10 hover:text-red-300'
                    : 'bg-zinc-100 border-zinc-200 text-red-600 hover:bg-zinc-200 hover:text-red-500'
                }`}
                id="btn-admin-switch"
              >
                <Shield className="w-3 h-3" />
                {isAdminMode ? 'İstifadəçi' : 'Admin Panel'}
              </button>
            )}

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 cursor-pointer focus:outline-none"
                id="btn-profile-dropdown"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-red-500/20 hover:ring-red-500 transition duration-300"
                />
                <span className="hidden sm:block text-xs font-semibold tracking-wide max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>

              {showUserDropdown && (
                <div className={`absolute right-0 mt-3 w-56 rounded-2xl border shadow-xl p-2 backdrop-blur-xl z-50 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-black/95 border-white/10 text-white'
                    : 'bg-white/95 border-zinc-200 text-zinc-900'
                }`}>
                  <div className={`px-3 py-2 border-b mb-1 ${
                    theme === 'dark' ? 'border-white/10' : 'border-zinc-100'
                  }`}>
                    <p className="text-xs font-bold font-sans">{user.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user.email}</p>
                  </div>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setIsAdminMode(!isAdminMode);
                        setCurrentView(isAdminMode ? 'home' : 'admin');
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-left text-red-500 font-semibold cursor-pointer ${
                        theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-red-50'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {isAdminMode ? 'İstifadəçi Paneli' : 'Admin Paneli'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setCurrentView('profile');
                      setIsAdminMode(false);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-left cursor-pointer font-medium ${
                      theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-zinc-100 text-zinc-900'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Profilim
                  </button>

                  <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-xl text-red-500 text-left cursor-pointer border-t mt-1 ${
                      theme === 'dark' ? 'hover:bg-red-950/20 border-white/5' : 'hover:bg-red-50 border-zinc-100'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Çıxış Et
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
