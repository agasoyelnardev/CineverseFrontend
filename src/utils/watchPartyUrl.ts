import { WatchParty } from '../types';
import { RoomPreviewDto } from '../api';

export interface WatchPartyRoute {
  partyId: string | null;
  inviteToken: string | null;
}

export function parseWatchPartyRoute(): WatchPartyRoute {
  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  let partyId = searchParams.get('party');
  const inviteToken = searchParams.get('invite');

  if (!partyId && pathname.includes('/watch-party/')) {
    const parts = pathname.split('/watch-party/');
    if (parts.length > 1) {
      partyId = parts[1].split('/')[0].split('?')[0] || null;
    }
  }

  return {
    partyId: partyId?.trim() || null,
    inviteToken: inviteToken?.trim() || null,
  };
}

export function getWatchPartyUrl(roomId: string, inviteToken?: string | null): string {
  const base = `${window.location.origin}/watch-party/${roomId}`;
  if (inviteToken) {
    return `${base}?invite=${encodeURIComponent(inviteToken)}`;
  }
  return base;
}

export function syncWatchPartyUrl(roomId: string, inviteToken?: string | null): void {
  window.history.replaceState({}, '', getWatchPartyUrl(roomId, inviteToken));
}

export function clearWatchPartyUrl(): void {
  if (window.location.pathname.includes('/watch-party/')) {
    window.history.replaceState({}, '', '/');
  }
}

export function mapPreviewToWatchParty(preview: RoomPreviewDto): WatchParty {
  return {
    id: preview.id,
    roomName: preview.title,
    movieId: preview.movieId || '',
    movieTitle: preview.movieTitle,
    movieDescription: preview.movieDescription,
    moviePoster: preview.moviePoster,
    movieVideoUrl: preview.movieVideoUrl,
    creator: '',
    creatorId: preview.createdByUserId,
    participants: [],
    currentTimestamp: 0,
    isPlaying: true,
    chat: [],
    viewerCount: preview.viewerCount,
    isPrivate: preview.isPrivate,
    isPremium: preview.isPremium,
    inviteToken: preview.inviteToken ?? undefined,
  };
}
