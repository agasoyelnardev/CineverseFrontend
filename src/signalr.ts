// SignalR Client - CineVerse WebApi backend hub-ları üçün
// Backend: ChatHub (/chathub), LiveStreamHub (/livestreamhub), NotificationHub (/notificationhub)
// Bütün hub-lar [Authorize] tələb edir — token JWT Bearer kimi query-də ötürülür (Program.cs-də belə konfiqurasiya olunub)

import * as signalR from '@microsoft/signalr';
import { getAuthToken } from './api';

// API_BASE_URL = '/api' (default) və ya .env-dən gəlir; hub-lar /api altında DEYİL, kök domendədir
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const HUB_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '') || '';

function createHubConnection(hubPath: string): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_ROOT_URL}${hubPath}`, {
      accessTokenFactory: () => getAuthToken() || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

// ==================== CHAT HUB (Watch Party otaqları) ====================
export interface ViewerCountChangedPayload {
  count: number;
}
export interface ParticipantsChangedPayload {
  count: number;
  userIds: string[];
}
export interface HostChangedPayload {
  newHostUserId: string;
}
export interface PlaybackSyncPayload {
  action: string;
  timestamp: number;
}
export interface ChatMessageReceivedPayload {
  id: string;
  userId: string;
  username: string;
  userAvatarUrl?: string;
  messageText: string;
  isSystemMessage: boolean;
  createdAt: string;
}
export interface ChatMessageUpdatedPayload {
  id: string;
  messageText: string;
}
export interface ChatMessageDeletedPayload {
  id: string;
}

let chatConnection: signalR.HubConnection | null = null;

export function getChatConnection(): signalR.HubConnection {
  if (!chatConnection) {
    chatConnection = createHubConnection('/chathub');
  }
  return chatConnection;
}

export async function startChatConnection(): Promise<signalR.HubConnection> {
  const conn = getChatConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
  return conn;
}

export async function stopChatConnection(): Promise<void> {
  if (chatConnection && chatConnection.state !== signalR.HubConnectionState.Disconnected) {
    await chatConnection.stop();
  }
}

export async function joinChatRoom(roomId: string): Promise<void> {
  const conn = await startChatConnection();
  await conn.invoke('JoinRoom', roomId);
}

export async function leaveChatRoom(roomId: string): Promise<void> {
  const conn = getChatConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    try {
      await conn.invoke('LeaveRoom', roomId);
    } catch {
      // Bağlantı bağlanarkən leave çağırışı uğursuz ola bilər; disconnect handler sayı düzəldir.
    }
  }
}

export async function sendChatMessage(roomId: string, messageText: string): Promise<void> {
  const conn = getChatConnection();
  await conn.invoke('SendMessage', roomId, messageText);
}

export async function sendPlaybackControl(roomId: string, action: 'play' | 'pause' | 'seek', timestamp: number): Promise<void> {
  const conn = getChatConnection();
  await conn.invoke('PlaybackControl', roomId, action, timestamp);
}

export interface ChatReactionPayload {
  reactionType: 'heart' | 'fire' | 'clap';
  username: string;
}

export async function sendChatReaction(roomId: string, reactionType: 'heart' | 'fire' | 'clap'): Promise<void> {
  const conn = await startChatConnection();
  await conn.invoke('SendReaction', roomId, reactionType);
}

export function onReceiveChatReaction(callback: (payload: ChatReactionPayload) => void) {
  getChatConnection().on('ReceiveReaction', callback);
}
export function offReceiveChatReaction(callback?: (payload: ChatReactionPayload) => void) {
  getChatConnection().off('ReceiveReaction', callback as any);
}

export function onViewerCountChanged(callback: (count: number) => void) {
  getChatConnection().on('ViewerCountChanged', callback);
}
export function onParticipantsChanged(callback: (payload: ParticipantsChangedPayload) => void) {
  getChatConnection().on('ParticipantsChanged', callback);
}
export function onHostChanged(callback: (payload: HostChangedPayload) => void) {
  getChatConnection().on('HostChanged', callback);
}
export function onPlaybackSync(callback: (payload: PlaybackSyncPayload) => void) {
  getChatConnection().on('PlaybackSync', callback);
}
// Qeyd: backend mesajı hansı event adı ilə yayımlayır SendMessageCommand handler-indən asılıdır.
// Handler faylını göndərsən dəqiqləşdirərəm, hələlik ən geniş yayılmış konvensiya:
export function onChatMessageReceived(callback: (payload: ChatMessageReceivedPayload) => void) {
  getChatConnection().on('ReceiveMessage', callback);
}
export function offChatMessageReceived(callback?: (payload: ChatMessageReceivedPayload) => void) {
  getChatConnection().off('ReceiveMessage', callback as any);
}
export function onChatMessageUpdated(callback: (payload: ChatMessageUpdatedPayload) => void) {
  getChatConnection().on('MessageUpdated', callback);
}
export function offChatMessageUpdated(callback?: (payload: ChatMessageUpdatedPayload) => void) {
  getChatConnection().off('MessageUpdated', callback as any);
}
export function onChatMessageDeleted(callback: (payload: ChatMessageDeletedPayload) => void) {
  getChatConnection().on('MessageDeleted', callback);
}
export function offChatMessageDeleted(callback?: (payload: ChatMessageDeletedPayload) => void) {
  getChatConnection().off('MessageDeleted', callback as any);
}
export function offViewerCountChanged(callback?: (count: number) => void) {
  getChatConnection().off('ViewerCountChanged', callback as any);
}
export function offParticipantsChanged(callback?: (payload: ParticipantsChangedPayload) => void) {
  getChatConnection().off('ParticipantsChanged', callback as any);
}
export function offHostChanged(callback?: (payload: HostChangedPayload) => void) {
  getChatConnection().off('HostChanged', callback as any);
}
export function offPlaybackSync(callback?: (payload: PlaybackSyncPayload) => void) {
  getChatConnection().off('PlaybackSync', callback as any);
}

// ==================== LIVESTREAM HUB ====================
export interface StreamReactionPayload {
  reactionType: 'heart' | 'fire' | 'clap';
  username: string;
}

let liveStreamConnection: signalR.HubConnection | null = null;

export function getLiveStreamConnection(): signalR.HubConnection {
  if (!liveStreamConnection) {
    liveStreamConnection = createHubConnection('/livestreamhub');
  }
  return liveStreamConnection;
}

export async function startLiveStreamConnection(): Promise<signalR.HubConnection> {
  const conn = getLiveStreamConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
  return conn;
}

export async function stopLiveStreamConnection(): Promise<void> {
  if (liveStreamConnection && liveStreamConnection.state !== signalR.HubConnectionState.Disconnected) {
    await liveStreamConnection.stop();
  }
}

export async function joinStreamGroup(streamId: string): Promise<void> {
  const conn = await startLiveStreamConnection();
  await conn.invoke('JoinStreamGroup', streamId);
}

export async function leaveStreamGroup(streamId: string): Promise<void> {
  const conn = getLiveStreamConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke('LeaveStreamGroup', streamId);
  }
}

export async function sendStreamMessage(streamId: string, message: string): Promise<void> {
  const conn = getLiveStreamConnection();
  await conn.invoke('SendStreamMessage', streamId, message);
}

export async function sendStreamReaction(streamId: string, reactionType: 'heart' | 'fire' | 'clap'): Promise<void> {
  const conn = getLiveStreamConnection();
  await conn.invoke('SendStreamReaction', streamId, reactionType);
}

export function onUpdateViewerCount(callback: (count: number) => void) {
  getLiveStreamConnection().on('UpdateViewerCount', callback);
}
export function onReceiveStreamMessage(callback: (payload: any) => void) {
  getLiveStreamConnection().on('ReceiveStreamMessage', callback);
}
export function onStreamMessageUpdated(callback: (payload: { id?: string; Id?: string; message?: string; Message?: string }) => void) {
  getLiveStreamConnection().on('StreamMessageUpdated', callback);
}
export function onStreamMessageDeleted(callback: (payload: { id?: string; Id?: string }) => void) {
  getLiveStreamConnection().on('StreamMessageDeleted', callback);
}
export function onReceiveReaction(callback: (payload: StreamReactionPayload) => void) {
  getLiveStreamConnection().on('ReceiveReaction', callback);
}
export function offUpdateViewerCount(callback?: (count: number) => void) {
  getLiveStreamConnection().off('UpdateViewerCount', callback as any);
}
export function offReceiveStreamMessage(callback?: (payload: any) => void) {
  getLiveStreamConnection().off('ReceiveStreamMessage', callback as any);
}
export function offStreamMessageUpdated(callback?: (payload: any) => void) {
  getLiveStreamConnection().off('StreamMessageUpdated', callback as any);
}
export function offStreamMessageDeleted(callback?: (payload: any) => void) {
  getLiveStreamConnection().off('StreamMessageDeleted', callback as any);
}
export function offReceiveReaction(callback?: (payload: StreamReactionPayload) => void) {
  getLiveStreamConnection().off('ReceiveReaction', callback as any);
}

// ==================== NOTIFICATION HUB ====================
// Bu hub qoşulan kimi (OnConnectedAsync) avtomatik unread-count göndərir və
// online/offline hadisələrini bütün istifadəçilərə yayımlayır — App-ın kökündə (məs. App.tsx-də login sonrası) başladılmalıdır.

export interface ReceiveNotificationPayload {
  id: string;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string | null;
}

let notificationConnection: signalR.HubConnection | null = null;
let notificationStartPromise: Promise<signalR.HubConnection> | null = null;

export function getNotificationConnection(): signalR.HubConnection {
  if (!notificationConnection) {
    notificationConnection = createHubConnection('/notificationhub');
  }
  return notificationConnection;
}

export async function startNotificationConnection(): Promise<signalR.HubConnection> {
  const conn = getNotificationConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    return conn;
  }
  if (notificationStartPromise) {
    return notificationStartPromise;
  }

  notificationStartPromise = (async () => {
    const activeConn = getNotificationConnection();
    if (activeConn.state === signalR.HubConnectionState.Disconnected) {
      await activeConn.start();
    }
    return activeConn;
  })().finally(() => {
    notificationStartPromise = null;
  });

  return notificationStartPromise;
}

export async function stopNotificationConnection(): Promise<void> {
  notificationStartPromise = null;
  if (notificationConnection && notificationConnection.state !== signalR.HubConnectionState.Disconnected) {
    await notificationConnection.stop();
  }
  notificationConnection = null;
}

export async function markNotificationAsReadRealtime(notificationId: string): Promise<void> {
  const conn = await startNotificationConnection();
  await conn.invoke('MarkNotificationAsRead', notificationId);
}

export function onReceiveUnreadNotificationCount(callback: (count: number) => void) {
  getNotificationConnection().on('ReceiveUnreadNotificationCount', callback);
}
export function onReceiveNotification(callback: (payload: ReceiveNotificationPayload) => void) {
  getNotificationConnection().on('ReceiveNotification', callback);
}
export function onUserOnline(callback: (userId: string) => void) {
  getNotificationConnection().on('UserOnline', callback);
}
export function onUserOffline(callback: (userId: string) => void) {
  getNotificationConnection().on('UserOffline', callback);
}
export function onOnlineCountChanged(callback: (count: number) => void) {
  getNotificationConnection().on('OnlineCountChanged', callback);
}
export function offReceiveUnreadNotificationCount(callback?: (count: number) => void) {
  getNotificationConnection().off('ReceiveUnreadNotificationCount', callback as any);
}
export function offReceiveNotification(callback?: (payload: ReceiveNotificationPayload) => void) {
  getNotificationConnection().off('ReceiveNotification', callback as any);
}
export function offUserOnline(callback?: (userId: string) => void) {
  getNotificationConnection().off('UserOnline', callback as any);
}
export function offUserOffline(callback?: (userId: string) => void) {
  getNotificationConnection().off('UserOffline', callback as any);
}
export function offOnlineCountChanged(callback?: (count: number) => void) {
  getNotificationConnection().off('OnlineCountChanged', callback as any);
}