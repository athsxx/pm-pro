import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, FolderKanban, BarChart3, Settings,
  Bell, Search, CheckSquare, Clock, ChevronRight, Plus,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { Avatar, Badge, SectionLabel, cn } from './ui';
import { mockUser, mockProjects, mockNotifications } from '../data';

const unreadCount = mockNotifications.filter(n => !n.read).length;

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isMobileOnly = ['/timer', '/task-quick-update', '/notifications'].includes(location.pathname);

  return (
    <div className="flex h-screen w-full bg-[#F5F7FA] font-['Inter'] overflow-hidden">

      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-[#0A1628] text-white shrink-0 transition-all duration-300 ease-in-out overflow-hidden',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo row */}
        <div className={cn('flex items-center h-14 px-4 border-b border-white/5', collapsed ? 'justify-center' : 'gap-3 justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00BFA5] to-[#00927E] flex items-center justify-center shrink-0">
                <span className="font-black text-white text-sm">P</span>
              </div>
              <span className="font-bold text-[15px] tracking-tight text-white">PM Pro</span>
            </div>
          )}
          {collapsed && (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00BFA5] to-[#00927E] flex items-center justify-center">
              <span className="font-black text-white text-sm">P</span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center h-10 mx-2 mt-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
          {navGroups.map(group => (
            <div key={group.label}>
              {!collapsed && <SectionLabel className="px-2">{group.label}</SectionLabel>}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    icon={<item.icon size={17} />}
                    label={item.label}
                    collapsed={collapsed}
                    exact={item.exact}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Active projects quick access */}
          {!collapsed && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1">
                <SectionLabel className="px-0">Projects</SectionLabel>
                <button className="p-0.5 text-gray-500 hover:text-white rounded transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-0.5">
                {mockProjects.filter(p => p.status === 'Active').slice(0, 3).map(proj => (
                  <NavLink
                    key={proj.id}
                    to={`/projects/${proj.id}`}
                    className={({ isActive }) => cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: proj.color }}
                    />
                    <span className="truncate">{proj.name}</span>
                    <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User row */}
        <div className={cn('p-3 border-t border-white/5 flex items-center gap-2.5', collapsed && 'justify-center')}>
          <Avatar src={mockUser.avatar} alt={mockUser.name} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{mockUser.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{mockUser.role}</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Desktop Top Bar */}
        {!isMobileOnly && (
          <header className="hidden md:flex h-14 items-center justify-between border-b border-gray-200 bg-white px-5 shrink-0 gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                placeholder="Search projects, tasks, people..."
                className="w-full h-9 pl-9 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5] transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/notifications')}
                className="relative h-9 w-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Avatar src={mockUser.avatar} alt={mockUser.name} size="sm" />
                <span className="text-sm font-semibold text-gray-700 hidden lg:block">{mockUser.name.split(' ')[0]}</span>
              </button>
            </div>
          </header>
        )}

        {/* Mobile Header */}
        {!isMobileOnly && (
          <header className="md:hidden flex h-13 items-center justify-between bg-white px-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00BFA5] to-[#00927E] flex items-center justify-center">
                <span className="font-black text-white text-sm">P</span>
              </div>
              <span className="font-bold text-base text-gray-900">PM Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/notifications')}
                className="relative h-9 w-9 flex items-center justify-center text-gray-500"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Avatar src={mockUser.avatar} alt={mockUser.name} size="sm" />
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 z-50">
          <MobileNavItem to="/" icon={<CheckSquare size={22} />} label="Tasks" />
          <MobileNavItem to="/timer" icon={<Clock size={22} />} label="Timer" />
          <MobileNavItem to="/notifications" icon={<Bell size={22} />} label="Alerts" badge={unreadCount} />
          <MobileNavItem to="/settings" icon={<Settings size={22} />} label="Profile" />
        </nav>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, collapsed, exact }: {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  exact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      title={collapsed ? label : undefined}
      className={({ isActive }) => cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
        collapsed ? 'justify-center' : '',
        isActive
          ? 'bg-[#00BFA5]/15 text-[#00BFA5]'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

function MobileNavItem({ to, icon, label, badge }: {
  to: string; icon: React.ReactNode; label: string; badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => cn(
        'flex flex-col items-center justify-center w-16 h-full gap-0.5 relative text-[11px] font-semibold',
        isActive ? 'text-[#00BFA5]' : 'text-gray-400'
      )}
    >
      <div className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-white">
            {badge}
          </span>
        )}
      </div>
      {label}
    </NavLink>
  );
}
