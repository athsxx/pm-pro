import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ProgressBar, Badge, Avatar, cn } from './ui';
import {
  ChevronLeft,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Paperclip,
  Trash2,
  Loader2,
  MoreHorizontal,
  Folder,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiError } from '../api/client';
import { getComments, postComment, type ApiComment } from '../api/comments';
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  type ApiAttachment,
} from '../api/attachments';
import { listProjects } from '../api/projects';
import { getUser } from '../api/storage';
import {
  getTask,
  memberUpdateTask,
  postTaskTimeLog,
  type ApiTask,
} from '../api/tasks';
import { STITCH } from '../stitch/tokens';

type TaskStatusApi = 'not_started' | 'in_progress' | 'done' | 'blocked';

type LocationState = { taskId?: string };

function statusLabel(status: string): string {
  switch (status) {
    case 'not_started':
      return 'Not Started';
    case 'in_progress':
      return 'In Progress';
    case 'done':
      return 'Done';
    case 'blocked':
      return 'Blocked';
    default:
      return status;
  }
}

function normalizeStatus(raw: string): TaskStatusApi {
  if (raw === 'not_started' || raw === 'in_progress' || raw === 'done' || raw === 'blocked') {
    return raw;
  }
  return 'not_started';
}

function statusVariant(status: TaskStatusApi): 'neutral' | 'teal' | 'success' | 'error' {
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

const statusConfig: Record<
  TaskStatusApi,
  { variant: 'neutral' | 'teal' | 'success' | 'error'; color: string; bg: string; border: string }
> = {
  not_started: {
    variant: 'neutral',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
  },
  in_progress: {
    variant: 'teal',
    color: 'text-[#5530a8]',
    bg: 'bg-violet-100/80',
    border: 'border-violet-200',
  },
  done: {
    variant: 'success',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  blocked: {
    variant: 'error',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

const STATUS_ORDER: TaskStatusApi[] = ['not_started', 'in_progress', 'done', 'blocked'];

export function TaskQuickUpdate() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;
  const taskId = state.taskId;

  const [task, setTask] = useState<ApiTask | null>(null);
  const [projectName, setProjectName] = useState('');
  const [status, setStatus] = useState<TaskStatusApi>('not_started');
  const [progress, setProgress] = useState(0);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [attachments, setAttachments] = useState<ApiAttachment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [timeLogBusy, setTimeLogBusy] = useState(false);
  const [sessionLoggedMinutes, setSessionLoggedMinutes] = useState(0);
  const [attachBusy, setAttachBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = getUser();

  const refreshComments = useCallback(async () => {
    if (!taskId) return;
    try {
      const rows = await getComments(taskId);
      setComments(rows);
    } catch {
      setComments([]);
    }
  }, [taskId]);

  const refreshAttachments = useCallback(async () => {
    if (!taskId) return;
    try {
      const rows = await listAttachments(taskId);
      setAttachments(rows);
    } catch {
      setAttachments([]);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [t, projects] = await Promise.all([getTask(taskId), listProjects()]);
        if (cancelled) return;
        setTask(t);
        setStatus(normalizeStatus(t.status));
        setProgress(Number(t.progress ?? 0));
        const proj = projects.find((p) => p.id === t.projectId);
        setProjectName(proj?.name || 'Project');
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : 'Failed to load task');
          setTask(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    if (!taskId || loading) return;
    void refreshComments();
    void refreshAttachments();
  }, [taskId, loading, refreshComments, refreshAttachments]);

  function handleStatusChange(next: TaskStatusApi) {
    setStatus(next);
    if (next === 'done') setProgress(100);
  }

  async function save() {
    if (!taskId) return;
    setSaving(true);
    setError(null);
    try {
      await memberUpdateTask(taskId, { status, progress });
      setSaved(true);
      setTimeout(() => navigate(-1), 700);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function markComplete() {
    if (!taskId) return;
    setCompleting(true);
    setError(null);
    try {
      await memberUpdateTask(taskId, { status: 'done', progress: 100 });
      setStatus('done');
      setProgress(100);
      setSaved(true);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete task');
    } finally {
      setCompleting(false);
    }
  }

  async function quickLogMinutes(minutes: number) {
    if (!taskId) return;
    const hours = minutes / 60;
    setTimeLogBusy(true);
    setError(null);
    try {
      await postTaskTimeLog(taskId, { hours, note: 'Quick log' });
      setSessionLoggedMinutes((m) => m + minutes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to log time');
    } finally {
      setTimeLogBusy(false);
    }
  }

  async function sendComment() {
    if (!taskId || !commentText.trim()) return;
    setCommentBusy(true);
    setError(null);
    try {
      await postComment(taskId, commentText.trim());
      setCommentText('');
      await refreshComments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to post comment');
    } finally {
      setCommentBusy(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!taskId || !file) return;
    setAttachBusy(true);
    setError(null);
    try {
      await uploadAttachment(taskId, file);
      await refreshAttachments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload');
    } finally {
      setAttachBusy(false);
    }
  }

  async function removeAttachment(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteAttachment(id);
      await refreshAttachments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete attachment');
    } finally {
      setDeletingId(null);
    }
  }

  if (!taskId) {
    return (
      <div className="min-h-screen font-body p-4 flex flex-col" style={{ backgroundColor: STITCH.bg }}>
        <p className="text-sm" style={{ color: STITCH.textMain }}>
          No task selected. Open this screen from a task with a valid ID.
        </p>
        <button
          type="button"
          className="mt-3 text-sm font-bold self-start"
          style={{ color: STITCH.primary }}
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-body items-center justify-center gap-3 p-6" style={{ backgroundColor: STITCH.bg }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: STITCH.primary }} />
        <p className="text-sm font-semibold text-gray-500">Loading task…</p>
      </div>
    );
  }

  if (loadError || !task) {
    return (
      <div className="min-h-screen font-body p-4 flex flex-col" style={{ backgroundColor: STITCH.bg }}>
        <p className="text-sm text-red-700 font-semibold">{loadError || 'Task not found'}</p>
        <button
          type="button"
          className="mt-3 text-sm font-bold self-start"
          style={{ color: STITCH.primary }}
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  const assigneeLabel =
    task.assigneeId && currentUser?.id === task.assigneeId
      ? currentUser.name
      : task.assigneeId
        ? 'Assignee'
        : 'Unassigned';
  const due =
    task.dueDate || task.endDate
      ? String(task.dueDate || task.endDate).slice(0, 10)
      : null;

  return (
    <div className="flex flex-col min-h-screen font-body" style={{ backgroundColor: STITCH.bg }}>
      <header
        className="sticky top-0 z-20 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b bg-[color:var(--stitch-bg)]/90"
        style={{ borderColor: STITCH.borderSubtle }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-200/80"
          aria-label="Go back"
        >
          <ChevronLeft size={22} className="text-slate-700" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-200/80 text-slate-600"
          aria-label="More options"
        >
          <MoreHorizontal size={22} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 pb-36 max-w-2xl mx-auto w-full">
        <article>
          <h1 className="text-[32px] font-bold leading-tight text-slate-900 mb-6 tracking-tight font-display">
            {task.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
              <Folder size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{projectName}</span>
            </div>
            {due && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                <Clock size={16} className="text-red-500" />
                <span className="text-sm font-medium text-red-600">Due {due}</span>
              </div>
            )}
            <Badge variant={statusVariant(status)} className="ml-auto">
              {statusLabel(status)}
            </Badge>
          </div>

          {task.description ? (
            <p className="text-base text-slate-700 leading-relaxed mb-8 whitespace-pre-wrap">{task.description}</p>
          ) : null}
        </article>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence>
          {status !== 'done' ? (
            <motion.button
              key="complete-btn"
              type="button"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              disabled={completing}
              onClick={() => void markComplete()}
              className="relative w-full overflow-hidden text-white py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm border border-transparent disabled:opacity-60 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--stitch-primary)]/30 font-bold text-base"
              style={{
                background: `linear-gradient(180deg, ${STITCH.primaryContainer} 0%, ${STITCH.primary} 100%)`,
              }}
            >
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-50"
                aria-hidden
              />
              {completing ? <Loader2 className="animate-spin relative z-10" size={22} /> : <CheckCircle2 size={22} className="relative z-10" />}
              <span className="relative z-10">Mark Complete</span>
            </motion.button>
          ) : (
            <motion.div
              key="done-banner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full border py-4 rounded-xl flex flex-col items-center gap-1.5 bg-violet-50/90"
              style={{ borderColor: STITCH.borderSubtle }}
            >
              <CheckCircle2 size={24} style={{ color: STITCH.primary }} />
              <p className="font-bold font-display" style={{ color: STITCH.primaryDark }}>
                Task completed
              </p>
              {saved && <p className="text-xs" style={{ color: STITCH.textMuted }}>Saving and returning…</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-sm text-slate-600 py-1">
          <Avatar alt={assigneeLabel} size="xs" />
          <span className="font-medium truncate">{assigneeLabel}</span>
          {sessionLoggedMinutes > 0 && (
            <span className="ml-auto text-xs font-semibold" style={{ color: STITCH.primary }}>
              +{sessionLoggedMinutes}m logged
            </span>
          )}
        </div>

        <section>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Status</p>
          <div className="grid grid-cols-2 gap-2.5">
            {STATUS_ORDER.map((s) => {
              const c = statusConfig[s];
              const isActive = status === s;
              const label = statusLabel(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    'py-3.5 rounded-xl text-sm font-bold transition-all border-2 active:scale-[0.97]',
                    isActive ? `${c.bg} ${c.border} ${c.color}` : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white border rounded-xl p-4 space-y-4" style={{ borderColor: STITCH.borderSubtle }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</p>
            <span className="text-xl font-black font-display" style={{ color: STITCH.primary }}>
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} size="md" />
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value, 10))}
            className="w-full cursor-pointer"
            style={{ accentColor: STITCH.primary }}
          />
          <div className="flex gap-2">
            {[0, 25, 50, 75, 100].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setProgress(v)}
                className={cn(
                  'flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all',
                  progress === v ? 'text-white' : 'bg-white text-gray-400'
                )}
                style={
                  progress === v
                    ? { backgroundColor: STITCH.primary, borderColor: STITCH.primary }
                    : { borderColor: STITCH.borderSubtle }
                }
              >
                {v}%
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-2">
            <Flame size={12} className="text-orange-400" /> Quick Time Log
          </p>
          <div className="flex gap-2.5">
            {[30, 60, 120].map((m) => (
              <button
                key={m}
                type="button"
                disabled={timeLogBusy}
                onClick={() => void quickLogMinutes(m)}
                className="flex-1 h-14 bg-white border rounded-xl text-sm font-bold text-gray-700 active:scale-[0.96] transition-all shadow-sm disabled:opacity-50 hover:bg-violet-50/90 hover:border-[color:var(--stitch-primary)] hover:text-[color:var(--stitch-primary)]"
                style={{ borderColor: STITCH.borderSubtle }}
              >
                + {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          {sessionLoggedMinutes > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold text-center mt-2"
              style={{ color: STITCH.primary }}
            >
              {(() => {
                const h = Math.floor(sessionLoggedMinutes / 60);
                const m = sessionLoggedMinutes % 60;
                const parts: string[] = [];
                if (h > 0) parts.push(`${h}h`);
                if (m > 0) parts.push(`${m}m`);
                return `${parts.join(' ')} logged this session`;
              })()}
            </motion.p>
          )}
        </section>

        <section className="bg-white border rounded-xl p-4 space-y-3" style={{ borderColor: STITCH.borderSubtle }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Paperclip size={13} /> Attachments
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => void onPickFile(e)}
          />
          <button
            type="button"
            disabled={attachBusy}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl border border-dashed text-xs font-bold text-gray-500 transition-colors disabled:opacity-50 hover:border-[color:var(--stitch-primary)] hover:text-[color:var(--stitch-primary)]"
            style={{ borderColor: STITCH.borderSubtle }}
          >
            {attachBusy ? 'Uploading…' : 'Upload file'}
          </button>
          <ul className="space-y-2">
            {attachments.length === 0 && (
              <li className="text-xs text-gray-400">No attachments yet.</li>
            )}
            {attachments.map((a) => {
              const canDelete = currentUser?.id === a.userId;
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2"
                >
                  <Paperclip size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800 truncate flex-1">{a.filename}</span>
                  {canDelete && (
                    <button
                      type="button"
                      disabled={deletingId === a.id}
                      onClick={() => void removeAttachment(a.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Delete attachment"
                    >
                      {deletingId === a.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="bg-white border rounded-xl p-4 space-y-3" style={{ borderColor: STITCH.borderSubtle }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={13} /> Comments
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {comments.length === 0 && <p className="text-xs text-gray-400">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                <p className="text-[10px] font-bold text-gray-400">
                  {c.userName || 'Teammate'}{' '}
                  <span className="font-normal">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                  </span>
                </p>
                <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 h-11 bg-gray-50 border rounded-xl pl-3 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: STITCH.borderSubtle }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = STITCH.primary;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${STITCH.primary}26`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = STITCH.borderSubtle;
                e.currentTarget.style.boxShadow = '';
              }}
              placeholder="Leave an update…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendComment();
                }
              }}
            />
            <button
              type="button"
              disabled={commentBusy || !commentText.trim()}
              onClick={() => void sendComment()}
              className="w-11 h-11 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-sm disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: STITCH.primary }}
            >
              {commentBusy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </section>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-50 border-t bg-white/95 backdrop-blur-md"
        style={{ borderColor: STITCH.borderSubtle }}
      >
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className={cn(
            'w-full h-12 rounded-xl font-bold text-base shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-white',
            saving && 'opacity-70'
          )}
          style={
            saved
              ? { backgroundColor: STITCH.primaryDark }
              : {
                  background: `linear-gradient(90deg, ${STITCH.primaryContainer} 0%, ${STITCH.primary} 100%)`,
                }
          }
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : null}
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
