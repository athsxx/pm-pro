import { apiFetch } from './client';

export type ApiTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  status: string;
  progress: number;
  remainingDays?: number | null;
  startDate: string | null;
  endDate: string | null;
  dueDate?: string | null;
};

export async function getMyTasks() {
  return apiFetch<ApiTask[]>('/api/tasks/my');
}

export async function getTask(taskId: string) {
  return apiFetch<ApiTask>(`/api/tasks/${taskId}`);
}

export async function updateTaskProgress(taskId: string, progress: number) {
  return apiFetch<{ ok: true }>(`/api/tasks/${taskId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ progress }),
  });
}

export type MemberTaskUpdate = {
  status?: 'not_started' | 'in_progress' | 'done' | 'blocked';
  progress?: number;
  remainingDays?: number;
};

export async function postTaskTimeLog(
  taskId: string,
  body: { hours: number; note?: string | null; loggedAt?: string }
) {
  return apiFetch<{ id: string }>(`/api/tasks/${taskId}/time-log`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function memberUpdateTask(taskId: string, update: MemberTaskUpdate) {
  return apiFetch<{ ok: true }>(`/api/tasks/${taskId}/member-update`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
}
