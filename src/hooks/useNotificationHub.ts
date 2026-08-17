import { useEffect, useRef } from 'react';
import { Notification } from '../types';
import { apiGetNotifications } from '../api';
import {
  startNotificationConnection,
  onReceiveNotification,
  offReceiveNotification,
  onReceiveUnreadNotificationCount,
  offReceiveUnreadNotificationCount,
  type ReceiveNotificationPayload,
} from '../signalr';

function mapHubNotification(payload: ReceiveNotificationPayload): Notification {
  return {
    id: payload.id,
    type: (payload.type as Notification['type']) || 'system',
    title: payload.title,
    description: payload.description,
    date: payload.createdAt
      ? new Date(payload.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'İndi',
    read: payload.isRead ?? false,
  };
}

/**
 * NotificationHub — bir istifadəçi sessiyası üçün tək qoşulma.
 * REST ilə ilkin siyahı, SignalR ilə real-time push və unread count.
 */
export function useNotificationHub(
  userId: string | undefined,
  isCheckingSession: boolean,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setRealtimeUnreadCount: React.Dispatch<React.SetStateAction<number | null>>,
) {
  const connectedUserIdRef = useRef<string | null>(null);
  const setNotificationsRef = useRef(setNotifications);
  const setRealtimeUnreadCountRef = useRef(setRealtimeUnreadCount);

  setNotificationsRef.current = setNotifications;
  setRealtimeUnreadCountRef.current = setRealtimeUnreadCount;

  useEffect(() => {
    if (!userId || isCheckingSession) {
      connectedUserIdRef.current = null;
      return;
    }

    let cancelled = false;

    const handleReceiveNotification = (payload: ReceiveNotificationPayload) => {
      const mapped = mapHubNotification(payload);
      setNotificationsRef.current((prev) => {
        if (prev.some((n) => n.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
      if (!mapped.read) {
        setRealtimeUnreadCountRef.current((prev) => (prev !== null ? prev + 1 : null));
      }
    };

    const handleUnreadCount = (count: number) => {
      setRealtimeUnreadCountRef.current(count);
    };

    const connect = async () => {
      try {
        if (connectedUserIdRef.current !== userId) {
          const data = await apiGetNotifications(1, 50);
          if (!cancelled && data && Array.isArray(data.items)) {
            const backendNotifs: Notification[] = data.items.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              date: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: item.isRead,
              type: (item.type as Notification['type']) || 'system',
            }));
            setNotificationsRef.current(backendNotifs);
          }
        }

        await startNotificationConnection();
        if (cancelled) return;

        connectedUserIdRef.current = userId;
        onReceiveNotification(handleReceiveNotification);
        onReceiveUnreadNotificationCount(handleUnreadCount);
      } catch (err) {
        console.warn('NotificationHub qoşulması uğursuz (tətbiq davam edir):', err);
      }
    };

    connect();

    return () => {
      cancelled = true;
      offReceiveNotification(handleReceiveNotification);
      offReceiveUnreadNotificationCount(handleUnreadCount);
    };
  }, [userId, isCheckingSession]);
}
