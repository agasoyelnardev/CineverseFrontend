import React from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export function GlobalLoadingIndicator() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isLoading = isFetching > 0 || isMutating > 0;

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Top Animated Loading Line */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-pink-500 animate-pulse" />
      
      {/* Floating Spinner Badge in top-right corner */}
      <div className="absolute top-3 right-4 bg-slate-900/90 border border-violet-500/30 backdrop-blur-md shadow-lg text-xs font-medium text-violet-300 px-3 py-1.5 rounded-full flex items-center gap-2 transition-all">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
        <span>Yüklənir ({isFetching + isMutating})</span>
      </div>
    </div>
  );
}
