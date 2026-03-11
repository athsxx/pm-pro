import React from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ProjectsList } from './components/Projects';
import { ProjectDetail } from './components/ProjectDetail';
import { Login } from './components/Login';
import { MobileTimer } from './components/MobileTimer';
import { MobileNotifications } from './components/MobileNotifications';
import { TaskQuickUpdate } from './components/TaskQuickUpdate';
import { BarChart3, Settings as SettingsIcon, Construction } from 'lucide-react';

function PlaceholderPage({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 font-['Inter']">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300 mb-4">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-gray-700 mb-1">{title}</h2>
      <p className="text-sm text-gray-400">This module is under development</p>
      <div className="flex items-center gap-2 mt-4 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
        <Construction size={13} className="text-amber-500" />
        <span className="text-xs font-semibold text-amber-600">Coming Soon</span>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'projects', Component: ProjectsList },
      { path: 'projects/:id', Component: ProjectDetail },
      {
        path: 'reports',
        Component: () => <PlaceholderPage title="Reports & Analytics" icon={<BarChart3 size={28} />} />,
      },
      {
        path: 'settings',
        Component: () => <PlaceholderPage title="Settings & Preferences" icon={<SettingsIcon size={28} />} />,
      },
      { path: 'timer', Component: MobileTimer },
      { path: 'notifications', Component: MobileNotifications },
      { path: 'task-quick-update', Component: TaskQuickUpdate },
    ],
  },
]);
