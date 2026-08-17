import React, { useState } from 'react';
import { Award, Lock, CheckCircle2, Sparkles, Star, Film, Edit3, Film as FilmIcon, Flame, Crown, BookOpen, Users, Info } from 'lucide-react';

export interface BadgeItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  requiredPoints: number;
  description: string;
  criteria: string;
  color: string;
  bgGradient: string;
  borderColor: string;
}

export const BADGES_LIST: BadgeItem[] = [
  {
    id: 'film_fanatic',
    name: 'Kino Həvəskarı',
    category: 'Başlanğıc',
    icon: '🍿',
    requiredPoints: 0,
    description: 'CineVerse film dünyasına ilk addımlarını atan həvəskar.',
    criteria: 'Platformada qeydiyyatdan keçmək (0+ Xal)',
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    borderColor: 'border-cyan-500/30'
  },
  {
    id: 'top_reviewer',
    name: 'Top Rəyçi',
    category: 'Rəy & Tənqid',
    icon: '✒️',
    requiredPoints: 50,
    description: 'Filmlər haqqında dəyərli şərhlər və qiymətləndirmələr yazan aktiv rəyçi.',
    criteria: '50 Kino Xalı toplayın (Rəy yazmaq və bəyənilmək)',
    color: 'text-amber-400',
    bgGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'library_collector',
    name: 'Kino Kolleksiyaçısı',
    category: 'Kolleksiya',
    icon: '📚',
    requiredPoints: 100,
    description: 'Sevimlilər və xüsusi pleylistlər formalaşdıran arxivçi.',
    criteria: '100 Kino Xalı toplayın (Sevimlilərə film əlavə etmək)',
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'watch_party_star',
    name: 'Watch Party Ulduzu',
    category: 'Sosial',
    icon: '🎬',
    requiredPoints: 150,
    description: 'Birlikdə baxış otaqlarında və icma söhbətlərində fəal iştirakçı.',
    criteria: '150 Kino Xalı toplayın (Watch Party və Canlı Yayım iştirakı)',
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    borderColor: 'border-purple-500/30'
  },
  {
    id: 'film_critic',
    name: 'Film Tənqidçisi',
    category: 'Ekspert',
    icon: '🏆',
    requiredPoints: 250,
    description: 'Kino sənətinə dərin baxışı ilə seçilən təcrübəli analitik.',
    criteria: '250 Kino Xalı toplayın',
    color: 'text-rose-400',
    bgGradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    borderColor: 'border-rose-500/30'
  },
  {
    id: 'genre_master',
    name: 'Janr Ustası',
    category: 'Ekspert',
    icon: '⚡',
    requiredPoints: 400,
    description: 'Müxtəlif film və kitab janrlarında zəngin biliyə malik kinoman.',
    criteria: '400 Kino Xalı toplayın',
    color: 'text-sky-400',
    bgGradient: 'from-sky-500/20 via-blue-600/10 to-transparent',
    borderColor: 'border-sky-500/30'
  },
  {
    id: 'cineverse_legend',
    name: 'CineVerse Əfsanəsi',
    category: 'Elita',
    icon: '👑',
    requiredPoints: 500,
    description: 'İcmanın ən yüksək hörmətə və aktivliyə malik əfsanəvi üzvü.',
    criteria: '500 Kino Xalı toplayın',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/30 via-amber-500/15 to-transparent',
    borderColor: 'border-yellow-500/50'
  },
  {
    id: 'golden_screen_winner',
    name: 'Qızıl Ekran Qalibi',
    category: 'Qrand-Master',
    icon: '🌟',
    requiredPoints: 1000,
    description: '1000+ xal ilə platformanın ən zirvəsində dayanan ustad kinoman.',
    criteria: '1000 Kino Xalı toplayın',
    color: 'text-red-500',
    bgGradient: 'from-red-600/30 via-rose-600/20 to-transparent',
    borderColor: 'border-red-500/60'
  }
];

export function getHighestBadgeForPoints(userPoints = 0): BadgeItem {
  return [...BADGES_LIST].reverse().find(b => userPoints >= b.requiredPoints) ?? BADGES_LIST[0];
}

interface GamificationBadgesProps {
  userPoints: number;
  theme: 'dark' | 'light';
  className?: string;
}

export default function GamificationBadges({ userPoints = 0, theme, className = '' }: GamificationBadgesProps) {
  const [hoveredBadge, setHoveredBadge] = useState<BadgeItem | null>(null);

  const currentBadge = getHighestBadgeForPoints(userPoints);
  const unlockedCount = BADGES_LIST.filter(b => userPoints >= b.requiredPoints).length;
  const totalCount = BADGES_LIST.length;

  // Next badge to unlock
  const nextBadge = BADGES_LIST.find(b => userPoints < b.requiredPoints);
  const pointsToNext = nextBadge ? nextBadge.requiredPoints - userPoints : 0;
  const nextProgress = nextBadge
    ? Math.min(100, Math.round((userPoints / nextBadge.requiredPoints) * 100))
    : 100;

  return (
    <div className={`p-6 sm:p-7 rounded-3xl border transition-all ${
      theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
    } ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-extrabold tracking-tight flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-zinc-900'
            }`}>
              <Award className="w-5 h-5 text-amber-500" />
              Qamifikasiya & Nişanlar
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              {unlockedCount}/{totalCount} Qazanılıb
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Fəaliyyət xallarınıza əsasən nişanlar qazanın. Tələbləri görmək üçün nişanın üzərinə gəlin.
          </p>
        </div>

        {/* Current Points Counter */}
        <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 shrink-0 ${
          theme === 'dark' ? 'bg-zinc-800/80 border-white/10' : 'bg-zinc-100 border-zinc-200'
        }`}>
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold block">Toplanmış Xal</span>
            <span className="text-sm font-black font-mono text-amber-400">{userPoints} Kino Xalı</span>
          </div>
        </div>
      </div>

      {currentBadge && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${
          theme === 'dark' ? 'bg-zinc-950/60 border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
        }`}>
          <span className="text-2xl">{currentBadge.icon}</span>
          <div>
            <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Cari Rütbə Nişanı</p>
            <p className={`text-sm font-bold ${currentBadge.color}`}>{currentBadge.name}</p>
          </div>
        </div>
      )}

      {/* Next Badge Progress Banner */}
      {nextBadge && (
        <div className={`mb-6 p-4 rounded-2xl border relative overflow-hidden ${
          theme === 'dark' ? 'bg-zinc-950/60 border-amber-500/20' : 'bg-amber-50/60 border-amber-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-amber-500">
              <Flame className="w-4 h-4" />
              Növbəti Nişan: <strong className="text-amber-400">{nextBadge.icon} {nextBadge.name}</strong>
            </span>
            <span className="font-mono text-[11px] text-zinc-400 font-bold">
              {pointsToNext} xal qaldı ({nextProgress}%)
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800/60 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
              style={{ width: `${nextProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {BADGES_LIST.map((badge) => {
          const isUnlocked = userPoints >= badge.requiredPoints;
          const isHovered = hoveredBadge?.id === badge.id;

          return (
            <div
              key={badge.id}
              onMouseEnter={() => setHoveredBadge(badge)}
              onMouseLeave={() => setHoveredBadge(null)}
              className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center cursor-pointer group ${
                isUnlocked
                  ? `bg-gradient-to-b ${badge.bgGradient} ${badge.borderColor} ${
                      isHovered ? 'scale-[1.03] shadow-lg shadow-amber-500/10' : ''
                    }`
                  : theme === 'dark'
                  ? 'bg-zinc-950/40 border-white/5 opacity-55 hover:opacity-80'
                  : 'bg-zinc-50 border-zinc-200 opacity-60 hover:opacity-90'
              }`}
            >
              {/* Top Status Icon */}
              <div className="absolute top-2.5 right-2.5">
                {isUnlocked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </div>

              {/* Badge Icon */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2.5 transition-transform group-hover:scale-110 shadow-inner ${
                isUnlocked
                  ? 'bg-zinc-900/80 ring-2 ring-amber-500/30'
                  : 'bg-zinc-800/40 grayscale'
              }`}>
                {badge.icon}
              </div>

              {/* Badge Title */}
              <h4 className={`text-xs font-bold leading-tight mb-1 ${
                isUnlocked ? badge.color : theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                {badge.name}
              </h4>

              {/* Points Label */}
              <span className="text-[10px] font-mono text-zinc-500">
                {badge.requiredPoints} Xal
              </span>

              {/* Hover Details Card (Absolute or Tooltip Overlay) */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3.5 rounded-2xl bg-zinc-950 border border-amber-500/30 text-white shadow-2xl z-40 text-left animate-fade-in pointer-events-none">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{badge.icon}</span>
                    <div>
                      <h5 className="text-xs font-extrabold text-amber-400">{badge.name}</h5>
                      <span className="text-[9px] font-mono text-zinc-400 uppercase">{badge.category}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug mb-2">
                    {badge.description}
                  </p>
                  <div className="pt-2 border-t border-white/10 text-[10px] font-mono flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Info className="w-3 h-3" /> Tələb:
                    </span>
                    <span className="text-zinc-200">{badge.criteria}</span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-right font-bold">
                    {isUnlocked ? (
                      <span className="text-emerald-400">✓ Açılıb</span>
                    ) : (
                      <span className="text-red-400">🔒 Qapalı ({badge.requiredPoints - userPoints} xal lazımdır)</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
