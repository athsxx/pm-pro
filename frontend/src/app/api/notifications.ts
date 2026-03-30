import { apiFetch } from './client';

export type ApiNotification = {
  id: string;
  userId: string;
  type: string | null;
  title: string | null;
  body: string | null;
  taskId: string | null;
  isRead: number;
  createdAt: string;
};

export async function getNotifications() {
  return apiFetch<ApiNotification[]>('/api/notifications');
}

export async function markNotificationRead(id: string) {
  return apiFetch<{ ok: true }>(`/api/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return apiFetch<{ ok: true }>('/api/notifications/read-all', { method: 'PATCH' });
}
