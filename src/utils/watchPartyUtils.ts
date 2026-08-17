import { User, WatchParty } from '../types';
import { normalizeEntityId } from './entityIds';

export const DEFAULT_CHAT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

export function coalesceAvatar(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return DEFAULT_CHAT_AVATAR;
}

export function resolveChatAvatar(
  msg: { senderId?: string; sender?: string; senderAvatar?: string },
  options: {
    users?: User[];
    currentUser?: User | null;
    profileCache?: Map<string, { avatar?: string; username?: string }>;
  } = {},
): string {
  const { users = [], currentUser = null, profileCache } = options;

  const direct = msg.senderAvatar?.trim();
  if (direct) return direct;

  const senderId = msg.senderId?.trim();
  if (senderId) {
    if (currentUser && normalizeEntityId(senderId) === normalizeEntityId(currentUser.id)) {
      return coalesceAvatar(currentUser.avatar);
    }
    const cached = profileCache?.get(senderId)?.avatar;
    if (cached?.trim()) return cached.trim();
    const fromDirectory = users.find((u) => normalizeEntityId(u.id) === normalizeEntityId(senderId));
    if (fromDirectory?.avatar?.trim()) return fromDirectory.avatar.trim();
  }

  const sender = msg.sender?.trim();
  if (sender) {
    if (currentUser && (currentUser.username === sender || currentUser.name === sender)) {
      return coalesceAvatar(currentUser.avatar);
    }
    const fromDirectory = users.find((u) => u.username === sender || u.name === sender);
    if (fromDirectory?.avatar?.trim()) return fromDirectory.avatar.trim();
    if (profileCache) {
      for (const profile of profileCache.values()) {
        if (profile.username === sender && profile.avatar?.trim()) {
          return profile.avatar.trim();
        }
      }
    }
  }

  return DEFAULT_CHAT_AVATAR;
}

export function isUuidLike(value: string | undefined | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

export function isRoomHost(party: WatchParty, user: User): boolean {
  if (party.creatorId && normalizeEntityId(party.creatorId) === normalizeEntityId(user.id)) {
    return true;
  }
  return party.creator === user.username || party.creator === user.name;
}

export function isOwnChatMessage(
  msg: { sender?: string; senderId?: string },
  user: User,
): boolean {
  if (msg.senderId && normalizeEntityId(msg.senderId) === normalizeEntityId(user.id)) {
    return true;
  }
  return msg.sender === user.username || msg.sender === user.name;
}

export function resolveLocalUsername(
  userId: string,
  directory: User[],
  currentUser: User | null,
): string | null {
  const normalized = normalizeEntityId(userId);
  const fromDirectory = directory.find((u) => normalizeEntityId(u.id) === normalized);
  if (fromDirectory?.username) return fromDirectory.username;
  if (currentUser && normalizeEntityId(currentUser.id) === normalized) {
    return currentUser.username;
  }
  return null;
}

export function mapRoomChatMessage(raw: Record<string, unknown>) {
  const createdAt = raw.createdAt ?? raw.CreatedAt;
  return {
    id: String(raw.id ?? raw.Id ?? ''),
    senderId: String(raw.userId ?? raw.UserId ?? ''),
    sender: String(raw.username ?? raw.Username ?? 'Anonim'),
    senderAvatar: coalesceAvatar(String(raw.userAvatarUrl ?? raw.UserAvatarUrl ?? '')),
    message: String(raw.messageText ?? raw.MessageText ?? ''),
    timestamp: createdAt
      ? new Date(String(createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
