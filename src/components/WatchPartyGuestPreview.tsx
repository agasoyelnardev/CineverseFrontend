import React, { useState } from 'react';
import { Users, Lock, Film, LogIn, Loader2, Sparkles } from 'lucide-react';
import { RoomPreviewDto } from '../api';
import { User } from '../types';
import LoginRegister from './LoginRegister';

interface WatchPartyGuestPreviewProps {
  preview: RoomPreviewDto | null;
  isLoading: boolean;
  inviteToken?: string | null;
  onLoginSuccess: (user: User) => void;
}

export default function WatchPartyGuestPreview({
  preview,
  isLoading,
  inviteToken,
  onLoginSuccess,
}: WatchPartyGuestPreviewProps) {
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <LoginRegister onLoginSuccess={onLoginSuccess} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080a] text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-sm">Watch Party yüklənir...</p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080a] p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <Lock className="w-12 h-12 text-zinc-600 mx-auto" />
          <h1 className="text-xl font-bold text-white">Otaq tapılmadı</h1>
          <p className="text-sm text-zinc-500">
            Bu link etibarsızdır, otaq bağlanıb və ya məxfi otaq üçün dəvət tokeni tələb olunur.
          </p>
          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Daxil ol
          </button>
        </div>
      </div>
    );
  }

  const canShowDetails = preview.canPreviewDetails;
  const poster = preview.moviePoster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080a] p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-6">
          <span className="text-2xl font-black tracking-tighter text-red-600 font-display">
            CINE<span className="text-white">VERSE</span>
          </span>
          <p className="text-zinc-500 text-xs mt-1">Watch Party — Qonaq Önizləmə</p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
          {canShowDetails && preview.moviePoster && (
            <div className="relative h-48 overflow-hidden">
              <img src={poster} alt={preview.movieTitle || preview.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-white">{preview.title}</h1>
                {preview.isPrivate && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded-full">
                    <Lock className="w-3 h-3" /> Məxfi otaq
                  </span>
                )}
                {preview.isPremium && (
                  <span className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] font-bold rounded-full">
                    <Sparkles className="w-3 h-3" /> Premium otaq
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs shrink-0">
                <Users className="w-4 h-4 text-red-500" />
                <span>{preview.viewerCount}</span>
              </div>
            </div>

            {canShowDetails && preview.movieTitle ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <Film className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">İzlənilən film</p>
                  <p className="text-sm font-bold text-white">{preview.movieTitle}</p>
                  {preview.movieDescription && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{preview.movieDescription}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Bu məxfi otaqdır. Tam məlumat və qoşulmaq üçün etibarlı dəvət linki və ya daxil olmaq lazımdır.
              </p>
            )}

            {preview.isPremium && !preview.canJoinWithAuth && (
              <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                Bu Premium Watch Party otağıdır. Qoşulmaq üçün Premium abunəlik lazımdır.
              </p>
            )}

            {inviteToken && (
              <p className="text-[10px] text-emerald-400/90 font-mono">
                Dəvət linki aktiv — daxil olduqdan sonra avtomatik qoşulacaqsınız.
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-lg shadow-red-600/20"
            >
              <LogIn className="w-4 h-4" />
              Qoşulmaq üçün daxil ol
            </button>

            <p className="text-center text-[10px] text-zinc-600">
              Hesabınız yoxdur? Daxil ol ekranından qeydiyyatdan keçə bilərsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
