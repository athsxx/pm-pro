import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Check } from 'lucide-react';
import { cn } from './ui';
import { getMyTasks, memberUpdateTask, type ApiTask, type MemberTaskUpdate } from '../api/tasks';
import { getNotifications } from '../api/notifications';
import { ApiError } from '../api/client';
import { STITCH } from '../stitch/tokens';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseLocalDate(s: string | null | undefined): Date | null {
  if (!s || typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function taskDueDate(t: ApiTask): Date | null {
  return parseLocalDate(t.endDate ?? t.dueDate ?? null);
}

function isDoneTask(t: ApiTask): boolean {
  return t.status === 'done' || (t.progress ?? 0) >= 100;
}

type TaskGroupKey = 'open' | 'done';

function bucketForTask(t: ApiTask, today: Date): TaskGroupKey {
  if (isDoneTask(t)) return 'done';
  return 'open';
}

function formatDueLine(d: Date, today: Date): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86400000);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff < 7) return `Due in ${diff}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const today = useMemo(() => new Date(), []);

  const doneCount = useMemo(() => tasks.filter((t) => isDoneTask(t)).length, [tasks]);
  const progressPct = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((doneCount / tasks.length) * 100);
  }, [tasks.length, doneCount]);

  const grouped = useMemo(() => {
    const open: ApiTask[] = [];
    const done: ApiTask[] = [];
    for (const t of tasks) {
      (bucketForTask(t, today) === 'done' ? done : open).push(t);
    }
    return { open, done };
  }, [tasks, today]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const rows = await getMyTasks();
      setTasks(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const notes = await getNotifications();
        if (!m) return;
        setUnreadCount(notes.filter((n) => !n.isRead).length);
      } catch {
        if (m) setUnreadCount(0);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  async function quickSetStatus(
    taskId: string,
    status: 'not_started' | 'in_progress' | 'done',
    prior?: ApiTask
  ) {
    const before = prior ?? tasks.find((x) => x.id === taskId);
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        if (status === 'done') return { ...t, status, progress: 100 };
        if (status === 'in_progress') {
          const p =
            before && (before.status === 'done' || (before.progress ?? 0) >= 100)
              ? 50
              : t.progress;
          return { ...t, status, progress: p };
        }
        return { ...t, status, progress: (t.progress ?? 0) >= 100 ? 0 : t.progress };
      })
    );
    try {
      const body: MemberTaskUpdate = { status };
      if (status === 'done') body.progress = 100;
      if (
        status === 'in_progress' &&
        before &&
        (before.status === 'done' || (before.progress ?? 0) >= 100)
      ) {
        body.progress = 50;
      }
      await memberUpdateTask(taskId, body);
    } catch {
      void load();
    }
  }

  async function toggleDone(t: ApiTask) {
    if (isDoneTask(t)) {
      await quickSetStatus(t.id, 'in_progress', t);
    } else {
      await quickSetStatus(t.id, 'done', t);
    }
  }

  return (
    <div className="min-h-full font-body pb-safe" style={{ backgroundColor: STITCH.bg }}>
      <header
        className="sticky top-0 z-40 bg-[color:var(--stitch-bg)]/90 backdrop-blur-md border-b"
        style={{ borderColor: STITCH.borderSubtle }}
      >
        <div className="flex items-center justify-between px-6 h-16">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 font-display">Today</h1>
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative p-2 -mr-2 rounded-full text-slate-700 hover:text-[color:var(--stitch-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stitch-primary)]/40"
            aria-label="Notifications"
          >
            <Bell size={26} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[color:var(--stitch-bg)]" />
            )}
          </button>
        </div>
        <div className="w-full h-1" style={{ backgroundColor: STITCH.borderSubtle }} role="presentation">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, backgroundColor: STITCH.primary }}
          />
        </div>
      </header>

      <main className="px-4 pt-4 pb-24 space-y-3 hide-scrollbar overflow-y-auto">
        {loading && (
          <p className="px-2 text-sm" style={{ color: STITCH.textMuted }}>
            Loading…
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div
            className="rounded-lg border bg-white p-6 text-center"
            style={{ borderColor: STITCH.borderSubtle }}
          >
            <p className="font-semibold text-slate-900">No tasks assigned</p>
            <p className="text-sm mt-1" style={{ color: STITCH.textMuted }}>
              Assigned work will appear here.
            </p>
          </div>
        )}

        {!loading && !error && grouped.open.length > 0 && (
          <section>
            <h2 className="px-2 mb-2 text-sm font-semibold uppercase tracking-wider" style={{ color: STITCH.textMuted }}>
              Open
            </h2>
            <div className="space-y-2.5">
              {grouped.open.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  today={today}
                  onOpenDetail={() => navigate('/task-quick-update', { state: { taskId: t.id } })}
                  onToggleDone={() => void toggleDone(t)}
                />
              ))}
            </div>
          </section>
        )}

        {!loading && !error && grouped.done.length > 0 && (
          <section className="pt-2">
            <h2 className="px-2 mb-2 text-sm font-semibold uppercase tracking-wider" style={{ color: STITCH.textMuted }}>
              Completed
            </h2>
            <div className="space-y-2.5">
              {grouped.done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  today={today}
                  onOpenDetail={() => navigate('/task-quick-update', { state: { taskId: t.id } })}
                  onToggleDone={() => void toggleDone(t)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function TaskRow({
  task: t,
  today,
  onOpenDetail,
  onToggleDone,
}: {
  task: ApiTask;
  today: Date;
  onOpenDetail: () => void;
  onToggleDone: () => void;
}) {
  const due = taskDueDate(t);
  const done = isDoneTask(t);
  const overdue = due && !done && startOfDay(due) < startOfDay(today);

  return (
    <div
      className={cn(
        'rounded-lg border p-4 flex items-center gap-4 transition-all cursor-pointer group',
        done ? 'opacity-60 bg-[#fcf9f8]/80 border-[#e2e8f0]/80' : 'bg-[#fcf9f8] border-[#e2e8f0] hover:shadow-sm active:scale-[0.98]'
      )}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone();
        }}
        aria-label={done ? `Mark ${t.title} incomplete` : `Mark ${t.title} complete`}
        className={cn(
          'flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stitch-primary)]/30',
          done ? 'bg-[color:var(--stitch-primary)] border-[color:var(--stitch-primary)] text-white' : 'border-slate-400 text-transparent hover:border-[color:var(--stitch-primary)]'
        )}
      >
        {done && <Check size={14} strokeWidth={3} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0 text-left">
        <h3
          className={cn(
            'text-base font-semibold text-slate-900 truncate font-display',
            done && 'line-through text-slate-400'
          )}
        >
          {t.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {t.status === 'blocked' && (
            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700">Blocked</span>
          )}
          {due && (
            <span
              className={cn(
                'text-xs font-medium flex items-center gap-1',
                overdue ? 'text-red-500' : 'text-slate-500'
              )}
            >
              {formatDueLine(due, today)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
