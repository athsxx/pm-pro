import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from './ui';
import { Play, Square, FileText, ChevronDown, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { mockTasks } from '../data';

export function MobileTimer() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [selectedTask, setSelectedTask] = useState(mockTasks[0]);
  const [logHours, setLogHours] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const format = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${ss}`;
  };

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const maxSeconds = 3600; // 1 hour arc
  const progress = Math.min(time / maxSeconds, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="flex flex-col min-h-screen bg-[#0A1628] font-['Inter']">

      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-white text-base">Time Tracker</h1>
        <button className="text-[10px] font-bold text-[#00BFA5] bg-[#00BFA5]/15 px-3 py-1.5 rounded-full">
          History
        </button>
      </header>

      {/* Task Selector */}
      <div className="px-5 mb-6">
        <div className="bg-white/8 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ backgroundColor: '#00BFA5' }}
          >
            {selectedTask.projectName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 font-medium">Current Task</p>
            <p className="text-sm font-bold text-white truncate">{selectedTask.title}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        </div>
      </div>

      {/* Timer Circle */}
      <div className="flex flex-col items-center flex-1 px-6">
        <div className="relative w-[260px] h-[260px] mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
            {/* Background ring */}
            <circle cx="130" cy="130" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            {/* Progress ring */}
            <motion.circle
              cx="130" cy="130" r={radius}
              fill="none"
              stroke="#00BFA5"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="font-mono font-black text-white tracking-widest"
              style={{ fontSize: 38 }}
              animate={{ opacity: isRunning ? [1, 0.7, 1] : 1 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            >
              {format(time)}
            </motion.span>
            <span className="text-gray-500 text-xs font-medium mt-1.5">
              {isRunning ? '● Recording' : time > 0 ? 'Paused' : 'Ready to start'}
            </span>
          </div>
        </div>

        {/* Start/Stop */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => setIsRunning(!isRunning)}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-colors ${
            isRunning
              ? 'bg-red-500 shadow-red-500/30'
              : 'bg-[#00BFA5] shadow-[#00BFA5]/40'
          }`}
        >
          {isRunning
            ? <Square size={28} fill="white" className="text-white" />
            : <Play size={28} fill="white" className="text-white ml-1" />}
        </motion.button>

        {time > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setTime(0)}
            className="mt-4 text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors"
          >
            Reset Timer
          </motion.button>
        )}
      </div>

      {/* Manual Log */}
      <div className="px-5 pb-24 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-gray-500" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manual Log</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Hours</label>
              <input
                type="number"
                value={logHours}
                onChange={e => setLogHours(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full h-9 bg-white/8 border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00BFA5]/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Date</label>
              <input
                type="date"
                className="w-full h-9 bg-white/8 border border-white/10 rounded-lg px-3 text-sm text-gray-400 focus:outline-none focus:border-[#00BFA5]/50"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Note</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you work on?"
              className="w-full h-9 bg-white/8 border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00BFA5]/50"
            />
          </div>
          <button className="w-full h-11 bg-[#00BFA5] text-white rounded-xl font-bold text-sm hover:bg-[#00A891] active:scale-95 transition-all">
            Submit Log
          </button>
        </div>
      </div>
    </div>
  );
}
