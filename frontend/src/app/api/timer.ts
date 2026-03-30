import { apiFetch } from './client';

export type ActiveTimer = {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  stoppedAt: string | null;
  hours: number | null;
};

export async function getActiveTimer() {
  return apiFetch<ActiveTimer | null>('/api/timer/active');
}

export async function startTimer(taskId: string) {
  return apiFetch<{ id: string }>('/api/timer/start', {
    method: 'POST',
    body: JSON.stringify({ taskId }),
  });
}

export async function stopTimer() {
  return apiFetch<{ ok: true; hours: number }>('/api/timer/stop', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
