import { apiFetch, apiUpload } from './client';

export type ApiAttachment = {
  id: string;
  taskId: string;
  userId: string;
  filename: string;
  filepath: string;
  mimetype: string | null;
  size: number | null;
  uploadedAt: string;
  userName?: string | null;
  userEmail?: string | null;
};

export async function listAttachments(taskId: string) {
  const q = new URLSearchParams({ taskId });
  return apiFetch<ApiAttachment[]>(`/api/attachments?${q.toString()}`);
}

export async function uploadAttachment(taskId: string, file: File) {
  const fd = new FormData();
  fd.append('taskId', taskId);
  fd.append('file', file);
  return apiUpload<{ id: string }>('/api/attachments', fd);
}

export async function deleteAttachment(id: string) {
  return apiFetch<{ ok: true }>(`/api/attachments/${id}`, { method: 'DELETE' });
}
