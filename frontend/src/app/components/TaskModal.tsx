import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Paperclip, Send, CheckCircle2, Clock, DollarSign, MessageSquare, UploadCloud, FileText } from 'lucide-react';
import { Button, Input, Textarea, Avatar, Badge, ProgressBar, PriorityBadge, cn } from './ui';
import { type Task } from '../data';

type ModalTab = 'DETAILS' | 'SCHEDULE' | 'COST' | 'COMMENTS' | 'FILES';

const tabs: { id: ModalTab; icon: React.ReactNode; label: string }[] = [
  { id: 'DETAILS', icon: <FileText size={14} />, label: 'Details' },
  { id: 'SCHEDULE', icon: <Clock size={14} />, label: 'Schedule' },
  { id: 'COST', icon: <DollarSign size={14} />, label: 'Cost' },
  { id: 'COMMENTS', icon: <MessageSquare size={14} />, label: 'Comments' },
  { id: 'FILES', icon: <Paperclip size={14} />, label: 'Files' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task?: Partial<Task>;
}

export function TaskModal({ isOpen, onClose, task }: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>('DETAILS');
  const [progress, setProgress] = useState(task?.progress || 0);
  const [status, setStatus] = useState(task?.status || 'Not Started');
  const [comment, setComment] = useState('');

  const mockComments = [
    { id: 1, user: 'Bob Smith', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', text: 'Can we get an update on the designs? The deadline is approaching.', time: '2h ago' },
    { id: 2, user: 'Alice Johnson', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', text: 'Working on it now, should be done by EOD.', time: '1h ago' },
  ];

  const mockFiles = [
    { name: 'design-mockup-v2.figma', size: '4.2 MB', type: 'figma' },
    { name: 'requirements.pdf', size: '1.1 MB', type: 'pdf' },
  ];

  const statusConfig: Record<string, { variant: any }> = {
    'Done': { variant: 'success' },
    'In Progress': { variant: 'teal' },
    'Blocked': { variant: 'error' },
    'Not Started': { variant: 'neutral' },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-[520px] bg-white z-50 flex flex-col font-['Inter'] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1">
                  <Badge variant={(statusConfig[status]?.variant) || 'neutral'}>
                    {status}
                  </Badge>
                  {task?.priority && <PriorityBadge priority={task.priority} />}
                </div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">
                  {task ? task.title : 'New Task'}
                </h2>
                {task?.projectName && (
                  <p className="text-xs text-gray-400 mt-0.5">{task.projectName}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Status Row */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {(['Not Started', 'In Progress', 'Done', 'Blocked'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      status === s
                        ? s === 'Done' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : s === 'Blocked' ? 'bg-red-50 border-red-300 text-red-700'
                          : s === 'In Progress' ? 'bg-[#00BFA5]/10 border-[#00BFA5]/30 text-[#00927E]'
                          : 'bg-gray-100 border-gray-300 text-gray-700'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    )}
                  >
                    {s === 'Done' && status === 'Done' && <CheckCircle2 size={11} />}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-100 px-5 shrink-0 bg-white">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 py-3 px-2 mr-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-[#00BFA5] text-[#00BFA5]'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'DETAILS' && (
                <div className="p-5 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Title</label>
                    <Input defaultValue={task?.title} placeholder="Task name" className="font-semibold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Description</label>
                    <Textarea defaultValue={task?.description} placeholder="Add more details..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Assignee</label>
                      <select className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5]">
                        <option>{task?.assignee || 'Select assignee'}</option>
                        <option>Alice Johnson</option>
                        <option>Bob Smith</option>
                        <option>Charlie Davis</option>
                        <option>Diana Lee</option>
                        <option>Eric Wong</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Priority</label>
                      <select className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5]">
                        <option>{task?.priority || 'Medium'}</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Progress</label>
                      <span className="text-sm font-black text-[#00BFA5]">{progress}%</span>
                    </div>
                    <div className="space-y-2">
                      <ProgressBar value={progress} size="md" />
                      <input
                        type="range" min="0" max="100" value={progress}
                        onChange={e => setProgress(parseInt(e.target.value))}
                        className="w-full h-1.5 accent-[#00BFA5] cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between gap-2">
                      {[0, 25, 50, 75, 100].map(v => (
                        <button
                          key={v}
                          onClick={() => setProgress(v)}
                          className={cn(
                            'flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all',
                            progress === v
                              ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {task?.tags && task.tags.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tags</label>
                      <div className="flex flex-wrap gap-1.5">
                        {task.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 border border-gray-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'SCHEDULE' && (
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Start Date</label>
                      <Input type="date" defaultValue={task?.startDate || '2026-03-10'} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">End Date</label>
                      <Input type="date" defaultValue={task?.dueDate} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Estimated Hours</label>
                    <Input type="number" defaultValue={task?.estimatedHours || 8} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Scheduling Mode</label>
                    <div className="flex p-1 bg-gray-100 rounded-lg gap-1">
                      {['Auto Scheduled', 'Manually Scheduled'].map(mode => (
                        <button
                          key={mode}
                          className="flex-1 py-2 rounded-md text-xs font-semibold transition-all bg-white text-gray-900 shadow-sm"
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Constraint Type</label>
                    <select className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30">
                      <option>As Soon As Possible</option>
                      <option>Must Start On</option>
                      <option>Must Finish On</option>
                      <option>Start No Earlier Than</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'COST' && (
                <div className="p-5 space-y-5">
                  {[
                    { label: 'Estimated Cost ($)', value: task?.cost },
                    { label: 'Cost Per Hour ($)', value: task?.cost ? Math.round(task.cost / (task?.estimatedHours || 1)) : 75 },
                    { label: 'Fixed Cost ($)', value: 0 },
                    { label: 'Actual Cost ($)', value: task?.cost ? Math.round(task.cost * 0.8) : 0 },
                  ].map(field => (
                    <div key={field.label} className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{field.label}</label>
                      <Input type="number" defaultValue={field.value} />
                    </div>
                  ))}
                  {task?.cost && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cost Summary</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Budget</span>
                          <span className="font-bold text-gray-900">${task.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Spent</span>
                          <span className="font-bold text-gray-900">${Math.round(task.cost * 0.8).toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-gray-200 my-1" />
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Remaining</span>
                          <span className="font-bold text-emerald-600">${Math.round(task.cost * 0.2).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'COMMENTS' && (
                <div className="flex flex-col h-full p-5 gap-4">
                  <div className="space-y-4">
                    {mockComments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar src={c.avatar} alt={c.user} size="sm" />
                        <div className="flex-1 bg-gray-50 rounded-xl rounded-tl-none p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-800">{c.user}</span>
                            <span className="text-[10px] text-gray-400">{c.time}</span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Me" size="sm" />
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Write a comment..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="pr-10 bg-white"
                      />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-[#00BFA5] text-white rounded-lg hover:bg-[#00A891] transition-colors">
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'FILES' && (
                <div className="p-5 space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#00BFA5] hover:bg-[#00BFA5]/5 transition-all cursor-pointer group">
                    <UploadCloud size={28} className="text-gray-300 group-hover:text-[#00BFA5] transition-colors mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Click to upload or drag & drop</p>
                    <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG, PDF (max. 10MB)</p>
                  </div>
                  <div className="space-y-2">
                    {mockFiles.map((file, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                          <FileText size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-400">{file.size}</p>
                        </div>
                        <button className="text-xs font-semibold text-[#00BFA5] hover:underline">Download</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button fullWidth className="flex-1 shadow-sm" onClick={onClose}>
                <CheckCircle2 size={15} /> Save Changes
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
