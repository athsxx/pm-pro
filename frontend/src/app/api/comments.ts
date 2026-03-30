import { apiFetch } from './client';

export type ApiComment = {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string;
  userName?: string | null;
  userEmail?: string | null;
};

export async function getComments(taskId: string) {
  const q = new URLSearchParams({ taskId });
  return apiFetch<ApiComment[]>(`/api/comments?${q.toString()}`);
}

export async function postComment(taskId: string, text: string) {
  return apiFetch<{ id: string }>('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ taskId, text }),
  });
}
