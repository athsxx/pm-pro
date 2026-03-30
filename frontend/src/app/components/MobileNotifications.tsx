import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { cn } from './ui';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type ApiNotification,
} from '../api/notifications';
import { ApiError } from '../api/client';
import { STITCH } from '../stitch/tokens';

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 45) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MobileNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await getNotifications();
        if (!mounted) return;
        setNotifications(rows);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load notifications');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const markAllRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    try {
      await markAllNotificationsRead();
    } catch {
      try {
        const rows = await getNotifications();
        setNotifications(rows);
      } catch {
        setNotifications(previous);
      }
    }
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      /* best-effort */
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col min-h-full h-full font-body" style={{ backgroundColor: STITCH.bg }}>
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b bg-white shrink-0"
        style={{ borderColor: STITCH.borderSubtle }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex-1 font-display">Inbox</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-sm font-semibold shrink-0 px-2 py-1 rounded-lg transition-colors hover:bg-violet-50"
            style={{ color: STITCH.primary }}
          >
            Mark all read
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto bg-white">
        {error && (
          <div className="px-5 py-4 text-sm font-medium text-red-700 bg-red-50 border-b border-red-100">{error}</div>
        )}

        {notifications.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <p className="text-lg font-medium text-slate-400">Inbox zero.</p>
            <p className="text-sm text-slate-400 mt-1">You&apos;re all caught up.</p>
          </div>
        )}

        <div className="flex flex-col">
          {notifications.map((notif) => {
            const unread = !notif.isRead;
            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  void markRead(notif.id);
                  if (notif.taskId) {
                    navigate('/task-quick-update', { state: { taskId: notif.taskId } });
                  }
                }}
                className={cn(
                  'relative flex items-start gap-0 w-full text-left p-5 border-b transition-colors hover:bg-slate-50 active:bg-slate-100',
                  unread ? 'bg-white' : 'opacity-80'
                )}
                style={{ borderColor: STITCH.borderSubtle }}
              >
                {unread ? (
                  <div
                    className="absolute top-7 left-3 w-2 h-2 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: STITCH.primary }}
                  />
                ) : (
                  <div className="absolute top-7 left-3 w-2 h-2 shrink-0 opacity-0" aria-hidden />
                )}
                <div className="flex-1 pl-4 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={cn(
                        'text-base leading-tight truncate font-display',
                        unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'
                      )}
                    >
                      {notif.title || 'Notification'}
                    </h3>
                    <span className="text-xs font-medium text-slate-400 shrink-0 whitespace-nowrap">
                      {formatRelative(notif.createdAt)}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm line-clamp-2',
                      unread ? 'font-medium text-slate-700' : 'font-normal text-slate-500'
                    )}
                  >
                    {notif.body || ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="h-20" aria-hidden />
      </main>
    </div>
  );
}
