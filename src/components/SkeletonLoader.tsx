import React from 'react';

// Base Skeleton element with shimmer effect
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-shimmer bg-zinc-800/60 rounded-lg ${className}`} />
);

// Single Movie Card Skeleton
export const MovieCardSkeleton: React.FC = () => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden shadow-lg flex flex-col h-full animate-pulse">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full bg-zinc-800/80 overflow-hidden">
        <SkeletonBlock className="absolute inset-0 w-full h-full" />
        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10">
          <SkeletonBlock className="h-5 w-12 rounded-md" />
          <SkeletonBlock className="h-5 w-10 rounded-full" />
        </div>
      </div>

      {/* Content Body */}
      <div className="p-3.5 flex flex-col flex-1 justify-between space-y-2.5">
        <div className="space-y-2">
          {/* Title */}
          <SkeletonBlock className="h-4 w-5/6 rounded-sm" />
          <SkeletonBlock className="h-3 w-1/2 rounded-sm" />
        </div>

        {/* Footer info: Genres & Likes */}
        <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between">
          <div className="flex gap-1.5">
            <SkeletonBlock className="h-4 w-12 rounded-md" />
            <SkeletonBlock className="h-4 w-10 rounded-md" />
          </div>
          <SkeletonBlock className="h-4 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
};

// Grid of Movie Cards
export const MovieGridSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Single Book Card Skeleton
export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden p-3.5 flex flex-col space-y-3 h-full animate-pulse">
      {/* Book Cover */}
      <div className="relative aspect-[3/4] w-full bg-zinc-800/80 rounded-lg overflow-hidden">
        <SkeletonBlock className="absolute inset-0 w-full h-full" />
      </div>

      {/* Details */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <SkeletonBlock className="h-4 w-11/12 rounded-sm mb-1.5" />
          <SkeletonBlock className="h-3 w-2/3 rounded-sm" />
        </div>

        {/* Progress bar or rating */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center">
            <SkeletonBlock className="h-3 w-12 rounded-sm" />
            <SkeletonBlock className="h-3 w-8 rounded-sm" />
          </div>
          <SkeletonBlock className="h-1.5 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Grid of Book Cards
export const BookGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Watch Party Card Skeleton
export const WatchPartyCardSkeleton: React.FC = () => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl overflow-hidden p-3.5 space-y-3 animate-pulse">
      <div className="relative aspect-video w-full rounded-lg overflow-hidden">
        <SkeletonBlock className="absolute inset-0 w-full h-full" />
        <div className="absolute top-2 right-2">
          <SkeletonBlock className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-3/4 rounded-sm" />
        <div className="flex items-center space-x-2">
          <SkeletonBlock className="w-6 h-6 rounded-full" />
          <SkeletonBlock className="h-3 w-1/3 rounded-sm" />
        </div>
      </div>
    </div>
  );
};

export const WatchPartyGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <WatchPartyCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Hero Banner Skeleton
export const HeroBannerSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[320px] sm:h-[400px] md:h-[460px] rounded-2xl md:rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-900/80 p-6 md:p-10 flex flex-col justify-end space-y-4 animate-pulse">
      <SkeletonBlock className="absolute inset-0 w-full h-full opacity-40" />
      <div className="relative z-10 max-w-2xl space-y-3">
        <div className="flex items-center space-x-2">
          <SkeletonBlock className="h-6 w-20 rounded-full" />
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>
        <SkeletonBlock className="h-8 md:h-12 w-3/4 rounded-lg" />
        <SkeletonBlock className="h-4 w-full rounded-sm" />
        <SkeletonBlock className="h-4 w-4/5 rounded-sm" />
        <div className="flex items-center space-x-3 pt-3">
          <SkeletonBlock className="h-11 w-32 rounded-xl" />
          <SkeletonBlock className="h-11 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

// Profile Page Skeleton
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Cover Banner & Profile Header */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-900/60">
        <div className="h-44 sm:h-56 w-full relative">
          <SkeletonBlock className="w-full h-full" />
        </div>
        <div className="p-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <SkeletonBlock className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-zinc-900 shadow-2xl" />
            <div className="space-y-2 pb-2">
              <SkeletonBlock className="h-6 w-44 rounded-md mx-auto sm:mx-0" />
              <SkeletonBlock className="h-4 w-28 rounded-md mx-auto sm:mx-0" />
              <SkeletonBlock className="h-3 w-64 rounded-md mx-auto sm:mx-0" />
            </div>
          </div>
          <div className="flex gap-2 justify-center pb-2">
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-t border-zinc-800/60 bg-zinc-900/40">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1 text-center">
              <SkeletonBlock className="h-6 w-12 mx-auto rounded-md" />
              <SkeletonBlock className="h-3 w-20 mx-auto rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex space-x-3 border-b border-zinc-800/80 pb-3">
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-28 rounded-lg" />
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
      </div>

      {/* Grid Content */}
      <MovieGridSkeleton count={5} />
    </div>
  );
};

// Movie Details Skeleton
export const MovieDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-900/80 p-6 md:p-10 min-h-[420px] flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden relative">
          <SkeletonBlock className="w-full h-full" />
        </div>
        <div className="flex-1 space-y-4">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-10 w-3/4 rounded-xl" />
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-6 w-16 rounded-md" />
            <SkeletonBlock className="h-6 w-16 rounded-md" />
            <SkeletonBlock className="h-6 w-20 rounded-md" />
          </div>
          <SkeletonBlock className="h-4 w-full rounded-md" />
          <SkeletonBlock className="h-4 w-11/12 rounded-md" />
          <SkeletonBlock className="h-4 w-4/5 rounded-md" />

          <div className="pt-4 flex flex-wrap gap-3">
            <SkeletonBlock className="h-12 w-36 rounded-xl" />
            <SkeletonBlock className="h-12 w-32 rounded-xl" />
            <SkeletonBlock className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
