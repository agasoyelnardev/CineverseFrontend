import React, { useEffect, useState } from 'react';
import { BarChart3, ShieldCheck, Trash2, RefreshCw, Film, Users, MessageSquare } from 'lucide-react';
import {
  apiGetAdminTopContentAnalytics,
  apiGetAdminModerationContent,
  apiDeleteAdminReview,
  apiDeleteAdminBookReview,
  apiDeleteDiscussion,
  TopContentAnalytics,
  ModerationContent,
} from '../api';

interface AdminAnalyticsModerationProps {
  mode: 'analytics' | 'moderation';
  theme: 'dark' | 'light';
  formatAdminDate: (value?: string) => string;
}

export default function AdminAnalyticsModeration({
  mode,
  theme,
  formatAdminDate,
}: AdminAnalyticsModerationProps) {
  const [analytics, setAnalytics] = useState<TopContentAnalytics | null>(null);
  const [moderation, setModeration] = useState<ModerationContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'analytics') {
        const data = await apiGetAdminTopContentAnalytics(10);
        setAnalytics(data);
      } else {
        const data = await apiGetAdminModerationContent(40, 40);
        setModeration(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Məlumat yüklənə bilmədi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [mode]);

  const handleDeleteReview = async (review: { id: string; type: string }) => {
    if (!window.confirm('Bu rəyi silməyə əminsiniz?')) return;
    setBusyId(review.id);
    try {
      if (review.type === 'Book') {
        await apiDeleteAdminBookReview(review.id);
      } else {
        await apiDeleteAdminReview(review.id);
      }
      setModeration((prev) =>
        prev
          ? { ...prev, reviews: prev.reviews.filter((r) => r.id !== review.id) }
          : prev,
      );
    } catch (err: any) {
      setError(err?.message || 'Rəy silinə bilmədi.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteDiscussion = async (id: string) => {
    if (!window.confirm('Bu forum mövzusunu silməyə əminsiniz?')) return;
    setBusyId(id);
    try {
      await apiDeleteDiscussion(id);
      setModeration((prev) =>
        prev
          ? { ...prev, discussions: prev.discussions.filter((d) => d.id !== id) }
          : prev,
      );
    } catch (err: any) {
      setError(err?.message || 'Forum mövzusu silinə bilmədi.');
    } finally {
      setBusyId(null);
    }
  };

  const cardClass = `rounded-3xl border p-6 ${
    theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
  }`;

  if (isLoading) {
    return (
      <div className={`${cardClass} flex items-center justify-center py-16 text-zinc-500 text-sm gap-2`}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        Yüklənir...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardClass} text-center py-12`}>
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button
          type="button"
          onClick={() => void loadData()}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Yenidən cəhd et
        </button>
      </div>
    );
  }

  if (mode === 'analytics') {
    const topMovies = analytics?.topMovies ?? [];
    const topRooms = analytics?.topRooms ?? [];
    const maxMovieViews = Math.max(1, ...topMovies.map((m) => m.viewCount));
    const maxRoomPeak = Math.max(1, ...topRooms.map((r) => r.peakViewerCount));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold">Analitika — Ən Çox Baxılan</h2>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Yenilə
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-sm">Top Filmlər (baxış sayı)</h3>
            </div>
            {topMovies.length === 0 ? (
              <p className="text-xs text-zinc-500">Hələ baxış statistikası yoxdur.</p>
            ) : (
              <div className="space-y-3">
                {topMovies.map((movie, index) => (
                  <div key={movie.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold truncate">
                        {index + 1}. {movie.title}
                      </span>
                      <span className="text-cyan-400 font-mono shrink-0">{movie.viewCount} baxış</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-red-500 rounded-full transition-all"
                        style={{ width: `${(movie.viewCount / maxMovieViews) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500">
                      ★ {movie.rating} · {movie.likes} bəyənmə
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-red-400" />
              <h3 className="font-semibold text-sm">Top Watch Party Otaqları</h3>
            </div>
            {topRooms.length === 0 ? (
              <p className="text-xs text-zinc-500">Hələ otaq statistikası yoxdur.</p>
            ) : (
              <div className="space-y-3">
                {topRooms.map((room, index) => (
                  <div key={room.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold truncate">
                        {index + 1}. {room.title}
                        {room.isLive && (
                          <span className="ml-1 text-[9px] text-red-400 font-bold">CANLI</span>
                        )}
                      </span>
                      <span className="text-red-400 font-mono shrink-0">
                        pik {room.peakViewerCount}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full"
                        style={{ width: `${(room.peakViewerCount / maxRoomPeak) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate">
                      Hazırda {room.currentViewerCount} · {room.movieTitle || 'Film məlum deyil'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const reviews = moderation?.reviews ?? [];
  const discussions = moderation?.discussions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold">Moderasiya Paneli</h2>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Yenilə
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardClass}>
          <h3 className="font-semibold text-sm mb-4">Film / Kitab Rəyləri ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-zinc-500">Rəy tapılmadı.</p>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {reviews.map((review) => (
                <div
                  key={`${review.type}-${review.id}`}
                  className={`p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold truncate">@{review.username}</p>
                    <span className="text-[9px] uppercase font-mono text-zinc-500">{review.type}</span>
                  </div>
                  <p className="text-[11px] font-medium truncate">{review.targetTitle}</p>
                  <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1">{review.content}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-[10px] text-zinc-500">
                      ★ {review.rating} · {formatAdminDate(review.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteReview(review)}
                      disabled={busyId === review.id}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-600/15 text-red-400 hover:bg-red-600/25 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {busyId === review.id ? '...' : 'Sil'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-sm">Forum Mövzuları ({discussions.length})</h3>
          </div>
          {discussions.length === 0 ? (
            <p className="text-xs text-zinc-500">Forum mövzusu tapılmadı.</p>
          ) : (
            <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className={`p-3 rounded-xl border ${
                    theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold truncate">{discussion.title}</p>
                    <span className="text-[9px] uppercase font-mono text-zinc-500">{discussion.category}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">@{discussion.author}</p>
                  <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1">{discussion.content}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-[10px] text-zinc-500">
                      {discussion.commentsCount} şərh · {discussion.likes} bəyənmə
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDiscussion(discussion.id)}
                      disabled={busyId === discussion.id}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-600/15 text-red-400 hover:bg-red-600/25 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {busyId === discussion.id ? '...' : 'Sil'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
