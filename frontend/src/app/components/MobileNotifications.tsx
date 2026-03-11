import React, { useState } from 'react';
import { mockNotifications } from '../data';
import { cn } from './ui';
import { Bell, CheckCheck, AlertTriangle, CheckCircle2, Info, Clock, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

const typeConfig = {
  error: {
    icon: <AlertTriangle size={16} />,
    iconBg: 'bg-red-50 text-red-500',
    border: 'border-l-red-400',
  },
  success: {
    icon: <CheckCircle2 size={16} />,
    iconBg: 'bg-emerald-50 text-emerald-500',
    border: 'border-l-emerald-400',
  },
  info: {
    icon: <Info size={16} />,
    iconBg: 'bg-blue-50 text-blue-500',
    border: 'border-l-blue-400',
  },
  warning: {
    icon: <Clock size={16} />,
    iconBg: 'bg-amber-50 text-amber-500',
    border: 'border-l-amber-400',
  },
};

export function MobileNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA] font-['Inter']">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-[#00BFA5] bg-[#00BFA5]/10 px-3 py-1.5 rounded-full transition-colors hover:bg-[#00BFA5]/15"
            >
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>

        {/* Unread indicator */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 bg-[#00BFA5]/8 border border-[#00BFA5]/15 rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-[#00BFA5] animate-pulse" />
            <span className="text-xs font-semibold text-[#00927E]">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        <AnimatePresence initial={false}>
          {notifications.map((notif, i) => {
            const cfg = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.info;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => markRead(notif.id)}
                className={cn(
                  'relative flex gap-3 px-5 py-4 transition-colors border-l-4 cursor-pointer',
                  !notif.read ? 'bg-white' : 'bg-[#F5F7FA]',
                  cfg.border
                )}
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', cfg.iconBg)}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className={cn('text-sm font-bold leading-tight', notif.read ? 'text-gray-700' : 'text-gray-900')}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00BFA5] shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-1.5">{notif.body}</p>
                  <span className="text-[10px] font-semibold text-gray-400">{notif.time}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notifications.every(n => n.read) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Bell size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No new notifications</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
