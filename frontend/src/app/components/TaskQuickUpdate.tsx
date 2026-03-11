import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button, ProgressBar, Badge, Avatar, cn } from './ui';
import { ChevronLeft, MessageSquare, Send, CheckCircle2, Clock, Flame, Tag, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { type Task, type TaskStatus } from '../data';

const statusConfig: Record<TaskStatus, { variant: any; color: string; bg: string; border: string }> = {
  'Not Started': { variant: 'neutral', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  'In Progress': { variant: 'teal', color: 'text-[#00927E]', bg: 'bg-[#00BFA5]/8', border: 'border-[#00BFA5]/30' },
  'Done': { variant: 'success', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Blocked': { variant: 'error', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

export function TaskQuickUpdate() {
  const location = useLocation();
  const navigate = useNavigate();
  const initTask = location.state?.task || {
    title: 'Design System Update',
    status: 'In Progress',
    progress: 50,
    priority: 'High',
    projectName: 'Website Redesign',
    assignee: 'Alice Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    dueDate: '2026-03-12',
    tags: ['Design', 'Frontend'],
  };

  const [task, setTask] = useState<Partial<Task>>(initTask);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  const [loggedTime, setLoggedTime] = useState(0);

  const handleStatusChange = (status: TaskStatus) => {
    setTask(t => ({ ...t, status, progress: status === 'Done' ? 100 : t.progress }));
  };

  const markComplete = () => {
    setTask(t => ({ ...t, status: 'Done', progress: 100 }));
    setSaved(true);
    setTimeout(() => navigate(-1), 1200);
  };

  const addTime = (minutes: number) => {
    setLoggedTime(t => t + minutes);
  };

  const sc = statusConfig[(task.status as TaskStatus) || 'Not Started'];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA] font-['Inter']">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors -ml-1"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium truncate">{task.projectName}</p>
          <h1 className="text-sm font-bold text-gray-900 truncate">{task.title}</h1>
        </div>
        <Badge variant={sc.variant}>{task.status}</Badge>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-28">

        {/* Complete Banner */}
        <AnimatePresence>
          {task.status !== 'Done' ? (
            <motion.button
              key="complete-btn"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={markComplete}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 text-white py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 size={22} />
              <span className="font-bold text-base">Mark as Complete</span>
            </motion.button>
          ) : (
            <motion.div
              key="done-banner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-emerald-50 border border-emerald-200 py-4 rounded-2xl flex flex-col items-center gap-1.5"
            >
              <CheckCircle2 size={24} className="text-emerald-500" />
              <p className="font-bold text-emerald-800">Task Completed! 🎉</p>
              {saved && <p className="text-xs text-emerald-600">Saving and returning...</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={task.avatar} alt={task.assignee} size="xs" />
              <span className="text-xs font-semibold text-gray-700">{task.assignee}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag size={11} className="text-gray-400" />
              {task.tags?.map(tag => (
                <span key={tag} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock size={11} /> Due {task.dueDate}</span>
            {loggedTime > 0 && (
              <span className="flex items-center gap-1 text-[#00BFA5] font-bold">
                <TrendingUp size={11} /> +{loggedTime}m logged
              </span>
            )}
          </div>
        </div>

        {/* Status Selector */}
        <section>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Status</p>
          <div className="grid grid-cols-2 gap-2.5">
            {(['Not Started', 'In Progress', 'Done', 'Blocked'] as TaskStatus[]).map(s => {
              const c = statusConfig[s];
              const isActive = task.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    'py-3.5 rounded-xl text-sm font-bold transition-all border-2 active:scale-[0.97]',
                    isActive
                      ? `${c.bg} ${c.border} ${c.color}`
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        {/* Progress */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</p>
            <span className="text-xl font-black text-[#00BFA5]">{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress || 0} size="md" />
          <input
            type="range" min="0" max="100"
            value={task.progress || 0}
            onChange={e => setTask(t => ({ ...t, progress: parseInt(e.target.value) }))}
            className="w-full accent-[#00BFA5] cursor-pointer"
          />
          <div className="flex gap-2">
            {[0, 25, 50, 75, 100].map(v => (
              <button
                key={v}
                onClick={() => setTask(t => ({ ...t, progress: v }))}
                className={cn(
                  'flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition-all',
                  task.progress === v
                    ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                    : 'bg-white text-gray-400 border-gray-200'
                )}
              >
                {v}%
              </button>
            ))}
          </div>
        </section>

        {/* Time Log */}
        <section>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1 flex items-center gap-2">
            <Flame size={12} className="text-orange-400" /> Quick Time Log
          </p>
          <div className="flex gap-2.5">
            {[30, 60, 120].map(m => (
              <button
                key={m}
                onClick={() => addTime(m)}
                className="flex-1 h-14 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-[#00BFA5] hover:text-[#00BFA5] hover:bg-[#00BFA5]/5 active:scale-[0.96] transition-all shadow-sm"
              >
                + {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          {loggedTime > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[#00BFA5] font-bold text-center mt-2"
            >
              {Math.floor(loggedTime / 60) > 0 ? `${Math.floor(loggedTime / 60)}h ` : ''}{loggedTime % 60 > 0 ? `${loggedTime % 60}m` : ''} logged today
            </motion.p>
          )}
        </section>

        {/* Comment */}
        <section className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={13} /> Add Comment
          </p>
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="flex-1 h-11 bg-gray-50 border border-gray-200 rounded-xl pl-3 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] transition-all"
              placeholder="Leave an update..."
            />
            <button
              className="w-11 h-11 bg-[#00BFA5] text-white rounded-xl flex items-center justify-center hover:bg-[#00A891] active:scale-95 transition-all shadow-sm"
              onClick={() => setComment('')}
            >
              <Send size={16} />
            </button>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-full h-12 bg-gradient-to-r from-[#00BFA5] to-[#00A891] text-white rounded-xl font-bold text-base shadow-lg shadow-[#00BFA5]/25 active:scale-[0.98] transition-all"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
