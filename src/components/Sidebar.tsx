import React from 'react';
import { Home, Film, Users, MessageSquare, Heart, Bookmark, User as UserIcon, Shield, X, Sparkles, Radio, ListPlus, BookOpen, UserPlus } from 'lucide-react';
import { User } from '../types';
import DigitalClock from './DigitalClock';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isAdminMode: boolean;
  setIsAdminMode: (adminMode: boolean) => void;
  user: User;
  theme: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
  onOpenPremiumModal?: () => void;
}

export default function Sidebar({
  currentView,
  setCurrentView,
  isAdminMode,
  setIsAdminMode,
  user,
  theme,
  isOpen,
  onClose,
  onOpenPremiumModal
}: SidebarProps) {
  const primaryMenu = [
    { id: 'home', label: 'Ana Səhifə', icon: Home },
    { id: 'movies', label: 'Filmlər', icon: Film },
    { id: 'books', label: 'Kitablar', icon: BookOpen },
    { id: 'live-stream', label: 'Canlı Yayım', icon: Radio, badge: 'CANLI' },
    { id: 'watch-party', label: 'Watch Party', icon: Users },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
  ];

  const personalMenu = [
    { id: 'favorites', label: 'Sevimlilər', icon: Heart },
    { id: 'watchlist', label: 'İzləmə Siyahısı', icon: Bookmark },
    { id: 'shared-playlists', label: 'Ortaq Pleylistlər', icon: ListPlus },
    { id: 'profile', label: 'Profilim', icon: UserIcon },
  ];

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    setIsAdminMode(false);
    onClose();
  };

  const handleAdminClick = () => {
    setIsAdminMode(true);
    setCurrentView('admin');
    onClose();
  };

  const sidebarClasses = `fixed inset-y-0 left-0 z-50 w-64 border-r backdrop-blur-xl transform lg:translate-x-0 lg:static lg:block transition-all duration-300 ${
    theme === 'dark'
      ? 'bg-black/20 border-white/5 text-white'
      : 'bg-zinc-50 border-zinc-200 text-zinc-900'
  } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between h-16 px-6 border-b ${
            theme === 'dark' ? 'border-white/10' : 'border-zinc-200'
          }`}>
            <div 
              onClick={() => { setCurrentView('home'); setIsAdminMode(false); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <DigitalClock theme={theme} />
            </div>
            <button
              onClick={onClose}
              className={`lg:hidden p-1.5 rounded-lg cursor-pointer ${
                theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-zinc-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
            
            {/* Primary Menu Section */}
            <section>
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-zinc-500 mb-3 px-3">Menyu</h3>
              <ul className="space-y-1">
                {primaryMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id && !isAdminMode;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm'
                              : 'bg-red-600 text-white font-bold shadow-md shadow-red-600/20'
                            : theme === 'dark'
                            ? 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            : 'text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-950 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isActive && <span className="w-1 h-3.5 bg-red-600 rounded-full"></span>}
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="flex items-center gap-1 bg-red-600/20 text-red-500 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-md border border-red-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Personal Menu Section */}
            <section>
              <h3 className={`text-[10px] font-mono uppercase tracking-[2px] mb-3 px-3 ${
                theme === 'dark' ? 'text-zinc-500' : 'text-zinc-700 font-bold'
              }`}>Sənin üçün</h3>
              <ul className="space-y-1">
                {personalMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id && !isAdminMode;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-white/10 text-white font-bold border border-white/10 shadow-sm'
                              : 'bg-red-600 text-white font-bold shadow-md shadow-red-600/20'
                            : theme === 'dark'
                            ? 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            : 'text-zinc-700 hover:bg-zinc-200/80 hover:text-zinc-950 font-semibold'
                        }`}
                      >
                        {isActive && <span className="w-1 h-3.5 bg-red-600 rounded-full"></span>}
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`} />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Admin Panel Link */}
            {user.role === 'admin' && (
              <section className="pt-4 border-t border-white/5">
                <button
                  onClick={handleAdminClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    isAdminMode
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                      : theme === 'dark'
                      ? 'text-red-400 hover:bg-red-950/20 hover:text-red-300'
                      : 'text-red-600 hover:bg-red-50/50 hover:text-red-750'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin Paneli
                </button>
              </section>
            )}

            {/* Premium Invitation Section */}
            <section className="pt-2">
              {user.isPremium ? (
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-amber-950/25 via-zinc-900 to-zinc-950 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]'
                    : 'bg-gradient-to-br from-amber-50 to-yellow-50/50 border-amber-200 shadow-sm'
                }`}>
                  <p className="text-xs font-extrabold mb-1 tracking-wide font-display flex items-center gap-1 text-amber-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 animate-pulse" /> Premium Üzvlük
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">
                    Premium statusunuz aktivdir. Reklamsız 4K video yayımından və xüsusi üstünlüklərdən həzz alın! 💎
                  </p>
                  <div className="w-full py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold text-center tracking-wider rounded-lg uppercase">
                    Aktiv Status
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-red-950/30 via-black/40 to-black/60 border-red-500/20'
                    : 'bg-gradient-to-br from-red-50/50 to-zinc-100/50 border-red-200'
                }`}>
                  <p className="text-xs font-extrabold mb-1 tracking-wide font-display flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-red-500 fill-red-500/20" /> Premium Keçid
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">
                    Bütün filmlərə reklamsız və 4K ultra-yüksək keyfiyyətlə giriş əldə edin.
                  </p>
                  <button
                    onClick={onOpenPremiumModal}
                    className="w-full py-2 bg-red-600 text-white text-[10px] font-black tracking-wider rounded-lg hover:bg-red-700 transition cursor-pointer"
                  >
                    İNDİ AKTİVLƏŞDİR
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* User Footer info */}
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
          }`}>
            <div className={`flex items-center gap-3 p-2.5 rounded-xl ${
              theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-zinc-100 border border-zinc-200/60'
            }`}>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-red-500/20"
              />
              <div className="truncate flex-1">
                <p className={`text-[11px] font-bold leading-tight truncate ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{user.name}</p>
                <p className={`text-[9px] font-mono uppercase tracking-wider mt-0.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600 font-bold'}`}>{user.role === 'admin' ? 'ADMIN' : 'Kinoçu'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
