import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, Search } from 'lucide-react';
import { Badge, Card, Input, ProgressBar, cn } from './ui';
import { getProject, type ApiProjectDetail } from '../api/projects';
import { getUser } from '../api/storage';
import type { ApiTask } from '../api/tasks';
import { ApiError } from '../api/client';

function mapProjectStatus(raw: string | null | undefined): 'success' | 'warning' | 'neutral' {
  const s = (raw || 'active').toLowerCase();
  if (s === 'on_hold' || s === 'on hold') return 'warning';
  if (s === 'completed' || s === 'archived') return 'neutral';
  return 'success';
}

function projectStatusLabel(raw: string | null | undefined): string {
  const s = (raw || 'active').toLowerCase();
  if (s === 'on_hold' || s === 'on hold') return 'On Hold';
  if (s === 'completed' || s === 'archived') return 'Completed';
  return 'Active';
}

function taskStatusLabel(status: string): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'done':
      return 'Done';
    case 'blocked':
      return 'Blocked';
    default:
      return status;
  }
}

function taskStatusVariant(status: string): 'neutral' | 'teal' | 'success' | 'error' {
  switch (status) {
    case 'done':
      return 'success';
    case 'blocked':
      return 'error';
    case 'in_progress':
      return 'teal';
    default:
      return 'neutral';
  }
}

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const isMember = user?.role === 'member';

  const [data, setData] = useState<ApiProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mineOnly, setMineOnly] = useState(isMember);

  useEffect(() => {
    if (!id) return;
    let m = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await getProject(id);
        if (!m) return;
        setData(p);
      } catch (e) {
        if (!m) return;
        setError(e instanceof ApiError ? e.message : 'Failed to load project');
        setData(null);
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, [id]);

  const tasks = data?.tasks ?? [];

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (mineOnly && user?.id) {
      list = list.filter((t) => t.assigneeId === user.id);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => (t.title || '').toLowerCase().includes(q));
    }
    return list;
  }, [tasks, mineOnly, user?.id, search]);

  const progressAvg = useMemo(() => {
    if (tasks.length === 0) return 0;
    const sum = tasks.reduce((a, t) => a + Number(t.progress ?? 0), 0);
    return Math.round(sum / tasks.length);
  }, [tasks]);

  if (!id) {
    return (
      <div className="p-4 text-sm text-gray-600">
        Invalid project.
        <button
          type="button"
          className="block mt-2 font-bold text-[color:var(--stitch-primary)]"
          onClick={() => navigate('/projects')}
        >
          Back to projects
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-6 font-body" style={{ backgroundColor: 'var(--stitch-bg)' }}>
      <div className="bg-white border-b px-4 pt-4 pb-3 shrink-0" style={{ borderColor: 'var(--stitch-border-subtle)' }}>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="text-xs font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          <ChevronLeft size={14} /> Projects
        </button>
        {loading && <p className="text-sm text-gray-500">Loading project…</p>}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-800">{error}</div>
        )}
        {data && !loading && (
          <>
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: 'var(--stitch-primary)' }}
              >
                {data.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{data.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={mapProjectStatus(data.status)} dot>
                    {projectStatusLabel(data.status)}
                  </Badge>
                  {data.managerName && (
                    <span className="text-xs text-gray-500">
                      Manager: <span className="font-semibold text-gray-700">{data.managerName}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {data.description && <p className="text-sm text-gray-600 mt-3 line-clamp-3">{data.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <ProgressBar value={progressAvg} className="flex-1" size="sm" />
              <span className="text-xs font-bold text-gray-600 w-10 text-right">{progressAvg}%</span>
            </div>
          </>
        )}
      </div>

      {data && !loading && (
        <div className="flex-1 px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input
                className="pl-9 h-10"
                placeholder="Search tasks…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {!isMember && (
              <button
                type="button"
                onClick={() => setMineOnly((v) => !v)}
                className={cn(
                  'text-xs font-bold px-3 py-2 rounded-lg border shrink-0',
                  mineOnly
                    ? 'bg-violet-50 border-violet-200 text-[color:var(--stitch-primary)]'
                    : 'bg-white border-gray-200 text-gray-600'
                )}
              >
                {mineOnly ? 'My tasks only' : 'All tasks'}
              </button>
            )}
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Tasks ({filteredTasks.length}
            {mineOnly ? ' assigned to you' : ''})
          </p>

          <div className="space-y-2">
            {filteredTasks.map((t) => (
              <TaskRow key={t.id} task={t} onOpen={() => navigate('/task-quick-update', { state: { taskId: t.id } })} />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <Card className="p-6 text-center text-sm text-gray-500">No tasks match this view.</Card>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onOpen }: { task: ApiTask; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-white border rounded-lg px-4 py-3 transition-colors hover:shadow-sm active:scale-[0.99]"
      style={{ borderColor: 'var(--stitch-border-subtle)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-gray-900 line-clamp-2">{task.title}</p>
        <Badge variant={taskStatusVariant(task.status)}>{taskStatusLabel(task.status)}</Badge>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span>{Number(task.progress ?? 0)}% complete</span>
        {(task.dueDate || task.endDate) && (
          <span>Due {task.dueDate || task.endDate}</span>
        )}
      </div>
    </button>
  );
}
