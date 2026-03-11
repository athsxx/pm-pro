import React, { useState } from 'react';
import {
  Card, Badge, ProgressBar, ProgressRing, Avatar, AvatarGroup, Button,
  Checkbox, TrendIndicator, Divider, cn,
} from './ui';
import {
  FolderKanban, CheckSquare, AlertTriangle, Users, Plus, PlayCircle,
  ArrowRight, Clock, TrendingUp, Flame, Star,
} from 'lucide-react';
import { mockProjects, mockTasks, mockRecentActivity, mockUser, teamMembers, type Task } from '../data';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

const activityIconMap: Record<string, { color: string; bg: string }> = {
  complete: { color: 'text-emerald-600', bg: 'bg-emerald-50' },
  upload: { color: 'text-blue-600', bg: 'bg-blue-50' },
  create: { color: 'text-purple-600', bg: 'bg-purple-50' },
  status: { color: 'text-amber-600', bg: 'bg-amber-50' },
  comment: { color: 'text-gray-600', bg: 'bg-gray-100' },
};

export function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [activeTab, setActiveTab] = useState<'Today' | 'Upcoming' | 'Done'>('Today');

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, status: t.status === 'Done' ? 'In Progress' : 'Done', progress: t.status === 'Done' ? t.progress : 100 }
          : t
      )
    );
  };

  const doneTasks = tasks.filter(t => t.status === 'Done');
  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const overdueCount = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length;
  const completionRate = Math.round((doneTasks.length / tasks.length) * 100);

  const filteredTasks =
    activeTab === 'Today' ? pendingTasks.slice(0, 5) :
    activeTab === 'Upcoming' ? pendingTasks.filter(t => new Date(t.dueDate) > new Date()) :
    doneTasks;

  return (
    <>
      {/* ── Desktop ─────────────────────────────────────── */}
      <div className="hidden md:block p-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Good morning, {mockUser.name.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Clock size={14} /> Log Time
            </Button>
            <Button size="sm" className="gap-1.5 shadow-sm shadow-[#00BFA5]/20">
              <Plus size={14} /> New Task
            </Button>
          </div>
        </div>

        {/* Today's Progress Bar */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <ProgressRing value={completionRate} size={52} strokeWidth={5} color="#00BFA5" />
            <div>
              <p className="text-lg font-bold text-gray-900">{completionRate}%</p>
              <p className="text-xs text-gray-500">Today complete</p>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-gray-500">{doneTasks.length} of {tasks.length} tasks complete</span>
              {doneTasks.length === tasks.length && (
                <Badge variant="success" dot>All done today!</Badge>
              )}
            </div>
            <ProgressBar value={completionRate} size="md" />
          </div>
          <div className="hidden lg:flex items-center gap-6 ml-4">
            <StatChip icon={<Flame size={14} className="text-orange-500" />} label="Streak" value="5 days" />
            <StatChip icon={<Star size={14} className="text-amber-500" />} label="Score" value="92 pts" />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            icon={<FolderKanban size={18} />}
            iconBg="bg-blue-50 text-blue-600"
            title="Active Projects"
            value={mockProjects.filter(p => p.status === 'Active').length.toString()}
            trend="1 this month"
            trendUp
          />
          <KpiCard
            icon={<CheckSquare size={18} />}
            iconBg="bg-teal-50 text-[#00BFA5]"
            title="Tasks Remaining"
            value={pendingTasks.length.toString()}
            trend={`${doneTasks.length} completed`}
            trendUp
          />
          <KpiCard
            icon={<AlertTriangle size={18} />}
            iconBg="bg-red-50 text-red-500"
            title="Overdue Tasks"
            value={overdueCount.toString()}
            trend="1 from last week"
            trendUp={false}
          />
          <KpiCard
            icon={<Users size={18} />}
            iconBg="bg-purple-50 text-purple-600"
            title="Team Members"
            value={teamMembers.length.toString()}
            trend="2 new members"
            trendUp
          />
        </div>

        {/* Main 3-col grid */}
        <div className="grid grid-cols-3 gap-5">

          {/* Task List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">My Tasks</h2>
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
                {(['Today', 'Upcoming', 'Done'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                      activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="divide-y divide-gray-50">
                <AnimatePresence initial={false}>
                  {filteredTasks.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-10 flex flex-col items-center gap-2 text-gray-400"
                    >
                      <CheckSquare size={28} className="text-gray-200" />
                      <p className="text-xs font-semibold">No tasks here</p>
                    </motion.div>
                  )}
                  {filteredTasks.map((task, i) => {
                    const isDone = task.status === 'Done';
                    const isOverdue = !isDone && new Date(task.dueDate) < new Date();
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, height: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={cn(
                          'group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer',
                          isDone && 'opacity-60'
                        )}
                        onClick={() => navigate('/task-quick-update', { state: { task } })}
                      >
                        <div onClick={e => e.stopPropagation()}>
                          <Checkbox checked={isDone} onChange={() => toggleTask(task.id)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-semibold truncate transition-all',
                            isDone ? 'line-through text-gray-400' : 'text-gray-800'
                          )}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400 truncate">{task.projectName}</span>
                            <span className="text-gray-300">·</span>
                            <span className={cn('text-xs font-semibold', isOverdue ? 'text-red-500' : isDone ? 'text-gray-400' : 'text-gray-500')}>
                              {isOverdue ? '⚠ Overdue' : task.dueDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <PriorityDot priority={task.priority} />
                          <button
                            onClick={e => { e.stopPropagation(); navigate('/timer'); }}
                            className="p-1.5 text-gray-300 hover:text-[#00BFA5] opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-[#00BFA5]/8"
                            title="Start Timer"
                          >
                            <PlayCircle size={16} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <Divider />
              <button className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-gray-400 hover:text-[#00BFA5] hover:bg-gray-50 transition-colors group">
                <Plus size={14} className="group-hover:text-[#00BFA5]" />
                Add new task
              </button>
            </Card>
          </div>

          {/* Active Projects */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Active Projects</h2>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-gray-500" onClick={() => navigate('/projects')}>
                View all <ArrowRight size={13} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {mockProjects.filter(p => p.status === 'Active').slice(0, 4).map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card
                    className="p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.name.substring(0, 2).toUpperCase()}
                      </div>
                      <Badge
                        variant={project.status === 'Active' ? 'success' : project.status === 'On Hold' ? 'warning' : 'neutral'}
                        dot
                      >
                        {project.status}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-[#00BFA5] transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">Due {project.endDate}</p>

                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">{project.tasksDone}/{project.tasksTotal} tasks</span>
                      <span className="text-xs font-bold text-gray-700">{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} size="sm" />

                    <div className="mt-3 flex items-center justify-between">
                      <AvatarGroup
                        avatars={project.teamIds.map(id => {
                          const m = teamMembers.find(t => t.id === id);
                          return { src: m?.avatar, alt: m?.name };
                        })}
                        max={3}
                        size="xs"
                      />
                      <span className="text-[10px] font-semibold text-gray-400">
                        {100 - project.progress}% remaining
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="mt-1">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                <TrendingUp size={15} className="text-gray-300" />
              </div>
              <div className="divide-y divide-gray-50">
                {mockRecentActivity.slice(0, 4).map(item => {
                  const style = activityIconMap[item.type] || activityIconMap.comment;
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <Avatar src={item.avatar} alt={item.user} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 truncate">
                          <span className="font-semibold">{item.user.split(' ')[0]}</span>
                          {' '}{item.action}{' '}
                          <span className="font-semibold text-gray-900">{item.target}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Mobile ─────────────────────────────────────────── */}
      <MobileDashboard tasks={tasks} toggleTask={toggleTask} />
    </>
  );
}

function MobileDashboard({ tasks, toggleTask }: { tasks: Task[]; toggleTask: (id: string) => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Today' | 'Upcoming' | 'Done'>('Today');
  const doneTasks = tasks.filter(t => t.status === 'Done');
  const pendingTasks = tasks.filter(t => t.status !== 'Done');

  const filtered =
    activeTab === 'Today' ? pendingTasks :
    activeTab === 'Upcoming' ? pendingTasks :
    doneTasks;

  return (
    <div className="md:hidden flex flex-col min-h-full bg-[#F5F7FA]">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">Good morning,</p>
            <h1 className="text-xl font-bold text-gray-900">{mockUser.name.split(' ')[0]} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <ProgressRing value={Math.round((doneTasks.length / tasks.length) * 100)} size={44} strokeWidth={4} />
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{doneTasks.length}/{tasks.length}</p>
              <p className="text-[10px] text-gray-400">done today</p>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          {(['Today', 'Upcoming', 'Done'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              )}
            >
              {tab}
              {tab === 'Done' && doneTasks.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                  {doneTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((task, i) => {
            const isDone = task.status === 'Done';
            const isOverdue = !isDone && new Date(task.dueDate) < new Date();
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className={cn(
                    'p-4 active:scale-[0.98] transition-all',
                    isDone && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Checkbox checked={isDone} onChange={() => toggleTask(task.id)} size="md" />
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate('/task-quick-update', { state: { task } })}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={cn(
                          'text-sm font-bold truncate',
                          isDone ? 'line-through text-gray-400' : 'text-gray-900'
                        )}>
                          {task.title}
                        </p>
                        <PriorityDot priority={task.priority} />
                      </div>
                      <p className="text-xs text-gray-400 mb-2.5 flex items-center gap-1.5">
                        <span className="truncate">{task.projectName}</span>
                        <span className="text-gray-300">·</span>
                        <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>{task.dueDate}</span>
                      </p>
                      {!isDone && task.progress > 0 && (
                        <div className="flex items-center gap-2">
                          <ProgressBar value={task.progress} className="flex-1" />
                          <span className="text-[10px] font-bold text-gray-500 w-7 text-right">{task.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <button className="fixed bottom-20 right-5 w-13 h-13 bg-[#00BFA5] text-white rounded-2xl shadow-lg shadow-[#00BFA5]/40 flex items-center justify-center hover:bg-[#00A891] active:scale-95 transition-all z-40">
        <Plus size={24} />
      </button>
    </div>
  );
}

function KpiCard({ icon, iconBg, title, value, trend, trendUp }: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string;
  trend: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs font-medium text-gray-500 mb-1.5">{title}</p>
      <TrendIndicator value={trendUp ? `+${trend.replace(/^[+-]/, '')}` : trend} />
    </Card>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[10px] text-gray-400 leading-none">{label}</p>
        <p className="text-xs font-bold text-gray-800 leading-tight mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function PriorityDot({ priority }: { priority: 'High' | 'Medium' | 'Low' }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full shrink-0 mt-1',
        priority === 'High' ? 'bg-red-400' : priority === 'Medium' ? 'bg-amber-400' : 'bg-blue-300'
      )}
      title={`${priority} priority`}
    />
  );
}