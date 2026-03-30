import { apiFetch } from './client';
import type { ApiTask } from './tasks';

export type ApiProject = {
  id: string;
  name: string;
  description: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
};

export async function listProjects() {
  return apiFetch<ApiProject[]>('/api/projects');
}

export type ApiProjectDetail = ApiProject & {
  tasks: ApiTask[];
};

export async function getProject(projectId: string) {
  return apiFetch<ApiProjectDetail>(`/api/projects/${projectId}`);
}
