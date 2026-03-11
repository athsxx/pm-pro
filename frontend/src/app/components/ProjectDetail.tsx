import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { mockProjects, mockTasks, evmData, teamMembers, type Task, type TaskStatus } from '../data';
import { Button, Input, Card, Badge, ProgressBar, ProgressRing, Avatar, Checkbox, PriorityBadge, cn } from './ui';
import {
  Search, Plus, MoreVertical, Save, Calendar as CalIcon,
  AlertTriangle, ChevronLeft, CheckCircle2, Circle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TaskModal } from './TaskModal';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'Overview' | 'Tasks' | 'Gantt' | 'EVM' | 'Baselines' | 'Calendar';

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find(p => p.id === id) || mockProjects[0];
  const [activeTab, setActiveTab] = useState<Tab>('Tasks');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const tabs: Tab[] = ['Overview', 'Tasks', 'Gantt', 'EVM', 'Baselines', 'Calendar'];
  const openTaskModal = (task?: any) => { setSelectedTask(task || null); setIsTaskModalOpen(true); };

  const projectTasks = mockTasks.filter(t => t.projectId === project.id);

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">

      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Projects
          </button>
          <span className="text-gray-200">/</span>
          <span className="text-xs font-medium text-gray-600">{project.name}</span>
        </div>

        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
            style={{ backgroundColor: project.color }}
          >
            {project.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <Badge
                variant={project.status === 'Active' ? 'success' : project.status === 'On Hold' ? 'warning' : 'neutral'}
                dot
              >
                {project.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Manager:</span> {project.manager}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">Due:</span> {project.endDate}
              </p>
              <div className="flex items-center gap-1.5">
                <ProgressBar value={project.progress} className="w-20" size="xs" />
                <span className="text-xs font-bold text-gray-600">{project.progress}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm">Edit Project</Button>
            <Button size="sm" className="gap-1.5" onClick={() => openTaskModal()}>
              <Plus size={14} /> Add Task
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pb-3.5 text-sm font-semibold transition-all whitespace-nowrap border-b-2 relative',
                activeTab === tab
                  ? 'border-[#00BFA5] text-[#00BFA5]'
                  : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab}
              {tab === 'Tasks' && projectTasks.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 px-1.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold">
                  {projectTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'Tasks' && <TasksTab onOpenModal={openTaskModal} />}
          {activeTab === 'Gantt' && <GanttTab />}
          {activeTab === 'EVM' && <EVMTab />}
          {activeTab === 'Overview' && <OverviewTab project={project} />}
          {(activeTab === 'Baselines' || activeTab === 'Calendar') && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-3">
                <CalIcon size={22} className="text-gray-300" />
              </div>
              <p className="font-semibold text-sm text-gray-600">{activeTab} view coming soon</p>
              <p className="text-xs text-gray-400 mt-1">This module is under development</p>
            </div>
          )}
        </div>
      </div>

      {isTaskModalOpen && (
        <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} task={selectedTask} />
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ project }: { project: typeof mockProjects[0] }) {
  const projectTasks = mockTasks.filter(t => t.projectId === project.id);
  const done = projectTasks.filter(t => t.status === 'Done').length;
  const blocked = projectTasks.filter(t => t.status === 'Blocked').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Project Progress</p>
          <div className="flex items-center gap-4">
            <ProgressRing value={project.progress} size={64} strokeWidth={6} color={project.color} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
              <p className="text-xs text-gray-500">{project.tasksDone}/{project.tasksTotal} tasks done</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Timeline</p>
          <p className="text-sm font-semibold text-gray-700 mb-1">{project.startDate}</p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mb-1">
            <div className="h-full bg-[#00BFA5] rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
          <p className="text-sm font-semibold text-gray-700 text-right">{project.endDate}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Task Status</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Done</span>
              <span className="font-bold text-gray-900">{done}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium flex items-center gap-1.5"><Circle size={12} className="text-blue-400" /> In Progress</span>
              <span className="font-bold text-gray-900">{projectTasks.filter(t => t.status === 'In Progress').length}</span>
            </div>
            {blocked > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium flex items-center gap-1.5"><AlertTriangle size={12} className="text-red-400" /> Blocked</span>
                <span className="font-bold text-red-500">{blocked}</span>
              </div>
            )}
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</p>
        <p className="text-sm text-gray-700">{project.description}</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Team Members</p>
        <div className="flex flex-wrap gap-3">
          {project.teamIds.map(id => {
            const member = teamMembers.find(m => m.id === id);
            if (!member) return null;
            return (
              <div key={id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <Avatar src={member.avatar} alt={member.name} size="xs" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{member.name}</p>
                  <p className="text-[10px] text-gray-400">{member.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Tasks Tab ───────────────────────────────────────────────────────────────
function TasksTab({ onOpenModal }: { onOpenModal: (task?: any) => void }) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [showCompleted, setShowCompleted] = useState(false);

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, status: t.status === 'Done' ? 'In Progress' : 'Done', progress: t.status === 'Done' ? t.progress : 100 }
          : t
      )
    );
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchDone = showCompleted || t.status !== 'Done';
    return matchSearch && matchStatus && matchDone;
  });

  const doneTasks = tasks.filter(t => t.status === 'Done');
  const activeTasks = tasks.filter(t => t.status !== 'Done');

  const statusConfig: Record<TaskStatus, { variant: any; label: string }> = {
    'Done': { variant: 'success', label: 'Done' },
    'In Progress': { variant: 'teal', label: 'In Progress' },
    'Blocked': { variant: 'error', label: 'Blocked' },
    'Not Started': { variant: 'neutral', label: 'Not Started' },
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 flex-1 max-w-lg shadow-sm">
          <Search className="ml-2 text-gray-400 shrink-0" size={14} />
          <Input
            className="border-none bg-transparent h-8 shadow-none focus:ring-0 text-sm"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex items-center">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs border-none bg-transparent text-gray-600 font-semibold focus:outline-none cursor-pointer pr-6"
            >
              <option value="All">All Status</option>
              {(['Not Started', 'In Progress', 'Done', 'Blocked'] as TaskStatus[]).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={cn(
            'px-3 h-9 rounded-lg text-xs font-semibold border transition-all',
            showCompleted
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          )}
        >
          {showCompleted ? '✓ Showing' : ''} Completed ({doneTasks.length})
        </button>

        <Button size="sm" className="gap-1.5 ml-auto" onClick={() => onOpenModal()}>
          <Plus size={14} /> Add Task
        </Button>
      </div>

      {/* Completion banner */}
      {activeTasks.length === 0 && tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">All tasks completed! 🎉</p>
            <p className="text-xs text-emerald-600">Every task in this project has been marked done.</p>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 w-10" />
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Task</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Assignee</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Cost</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            <AnimatePresence initial={false}>
              {filtered.map((task, i) => {
                const isDone = task.status === 'Done';
                const isOverdue = !isDone && new Date(task.dueDate) < new Date();
                const sc = statusConfig[task.status];
                return (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'group hover:bg-gray-50 transition-all cursor-pointer',
                      isDone && 'opacity-60'
                    )}
                    onClick={() => onOpenModal(task)}
                  >
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={isDone} onChange={() => toggleTask(task.id)} />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className={cn('font-semibold text-gray-900 transition-all', isDone && 'line-through text-gray-400')}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {task.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar src={task.avatar} alt={task.assignee} size="xs" className={isDone ? 'grayscale opacity-60' : ''} />
                        <span className="text-xs font-medium text-gray-600 truncate max-w-[90px]">{task.assignee.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 w-28">
                        <ProgressBar value={task.progress} className="flex-1" size="xs" />
                        <span className="text-xs font-bold text-gray-500 w-7 text-right">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className={cn('text-xs font-medium', isOverdue ? 'text-red-500 font-bold' : isDone ? 'text-gray-400' : 'text-gray-600')}>
                        {isOverdue && <span className="mr-1">⚠</span>}{task.dueDate}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-gray-600">
                      ${task.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <p className="font-semibold text-sm">No tasks match your search</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Gantt Tab ────────────────────────────────────────────────────────────────
function GanttTab() {
  const [tracking, setTracking] = useState(true);
  const weeks = ['Feb 28', 'Mar 7', 'Mar 14', 'Mar 21', 'Mar 28', 'Apr 4'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setTracking(!tracking)}
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors',
                tracking ? 'bg-[#00BFA5]' : 'bg-gray-200'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                tracking ? 'left-4.5' : 'left-0.5'
              )} />
            </div>
            <span className="text-sm font-semibold text-gray-700">Tracking Mode</span>
          </label>
          <div className="w-px h-5 bg-gray-200" />
          <select className="text-sm border border-gray-200 rounded-lg bg-white py-1.5 pl-3 pr-7 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30">
            {[1, 2, 3].map(n => <option key={n}>Baseline {n}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <CalIcon size={13} /> Reschedule
          </Button>
          <Button size="sm" className="gap-1.5">
            <Save size={13} /> Save Baseline
          </Button>
        </div>
      </div>

      <Card className="flex overflow-hidden h-[500px]">
        {/* Left: task names */}
        <div className="w-64 border-r border-gray-100 flex flex-col shrink-0">
          <div className="h-11 border-b border-gray-100 bg-gray-50 flex items-center px-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Task</span>
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {mockTasks.map(task => {
              const isDone = task.status === 'Done';
              return (
                <div key={task.id} className="h-14 flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', isDone ? 'bg-emerald-400' : task.status === 'Blocked' ? 'bg-red-400' : 'bg-[#00BFA5]')} />
                  <span className="text-xs font-semibold text-gray-800 truncate">{task.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: timeline */}
        <div className="flex-1 flex flex-col overflow-x-auto">
          <div className="h-11 border-b border-gray-100 bg-gray-50 flex shrink-0 min-w-[640px]">
            {weeks.map(w => (
              <div key={w} className="flex-1 border-r border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {w}
              </div>
            ))}
          </div>
          <div className="flex-1 relative min-w-[640px]">
            {/* Grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {weeks.map((_, i) => <div key={i} className="flex-1 border-r border-dashed border-gray-100" />)}
            </div>
            {/* Task bars */}
            {mockTasks.map((task, i) => {
              const left = 5 + i * 9;
              const width = 18 + (i % 3 === 0 ? 12 : i % 3 === 1 ? -4 : 6);
              const barColor = task.status === 'Done' ? '#10B981' : task.status === 'Blocked' ? '#EF4444' : '#00BFA5';
              return (
                <div key={task.id} className="h-14 border-b border-gray-50 relative flex items-center">
                  {tracking && (
                    <div
                      className="absolute h-2 rounded-full bg-gray-200"
                      style={{ left: `${left + 1}%`, width: `${width + 4}%` }}
                    />
                  )}
                  <div
                    className="absolute h-6 rounded-lg flex items-center px-2.5 cursor-pointer hover:brightness-110 transition-all shadow-sm"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: barColor }}
                    title={task.title}
                  >
                    <span className="text-[10px] text-white font-bold truncate">{task.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── EVM Tab ──────────────────────────────────────────────────────────────────
function EVMTab() {
  const kpis = [
    { label: 'CPI', value: '1.05', healthy: true, desc: 'Cost Performance' },
    { label: 'SPI', value: '0.92', healthy: false, desc: 'Schedule Performance' },
    { label: 'CV', value: '+$1,200', healthy: true, desc: 'Cost Variance' },
    { label: 'SV', value: '-$800', healthy: false, desc: 'Schedule Variance' },
    { label: 'EAC', value: '$45,000', healthy: true, desc: 'Est. at Completion' },
    { label: 'ETC', value: '$12,000', healthy: true, desc: 'Est. to Complete' },
    { label: 'TCPI', value: '0.98', healthy: true, desc: 'To Complete PI' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-7 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-4 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{kpi.label}</p>
            <p className={cn('text-lg font-black', kpi.healthy ? 'text-emerald-600' : 'text-red-500')}>
              {kpi.value}
            </p>
            <p className={cn(
              'text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded-full inline-block',
              kpi.healthy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            )}>
              {kpi.healthy ? '● Healthy' : '● At Risk'}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Earned Value S-Curve</h3>
            <p className="text-xs text-gray-400 mt-0.5">Planned Value, Earned Value, and Actual Cost over time</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />PV</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />EV</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-400 inline-block rounded" />AC</span>
          </div>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evmData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} dx={-8} />
              <RechartsTooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="pv" name="Planned Value" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="ev" name="Earned Value" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="ac" name="Actual Cost" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Task EVM Breakdown</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Task', 'PV', 'EV', 'AC', 'CPI', 'SV'].map(h => (
                <th key={h} className={cn('px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider', h !== 'Task' && 'text-right')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {mockTasks.map(task => {
              const pv = task.cost;
              const ev = (task.cost * task.progress) / 100;
              const ac = ev * (task.id === 't4' ? 1.2 : 0.9);
              const cpi = ev > 0 ? ev / ac : 1;
              const sv = ev - pv;
              return (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-800 text-sm">{task.title}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-medium text-gray-500">${pv.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-medium text-gray-500">${ev.toFixed(0)}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-medium text-gray-500">${ac.toFixed(0)}</td>
                  <td className={cn('px-5 py-3.5 text-right text-xs font-bold', cpi >= 1 ? 'text-emerald-600' : 'text-red-500')}>
                    {cpi.toFixed(2)}
                  </td>
                  <td className={cn('px-5 py-3.5 text-right text-xs font-bold', sv >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    ${sv.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}