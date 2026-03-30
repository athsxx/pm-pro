import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router';
import { FolderKanban, Settings, Bell, CheckCircle2 } from 'lucide-react';
import { Avatar, cn } from './ui';
import { getUser, setUser, type AuthUser } from '../api/storage';
import { me } from '../api/auth';
import { getNotifications } from '../api/notifications';
import { STITCH } from '../stitch/tokens';

/** Full-bleed mobile screens (no outer chrome beyond their own headers). */
const MOBILE_FULL_BLEED_ROUTES = ['/task-quick-update', '/notifications'] as const;

const deskNav = [
  { to: '/', label: 'Today', icon: CheckCircle2, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const;

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(() => getUser());

  const isMobileOnly = (MOBILE_FULL_BLEED_ROUTES as readonly string[]).includes(location.pathname);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await me();
        if (!mounted) return;
        setUser(user);
        setSessionUser(user);
      } catch {
        if (!mounted) return;
        setSessionUser(getUser());
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const notes = await getNotifications();
        if (!mounted) return;
        setUnreadCount(notes.filter((n) => !n.isRead).length);
      } catch {
        if (!mounted) return;
        setUnreadCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-body"
      style={{ backgroundColor: STITCH.bg }}
    >
      {/* Desktop sidebar — light “Clean Utility” */}
      <aside className="hidden md:flex w-56 flex-col shrink-0 border-r bg-white" style={{ borderColor: STITCH.borderSubtle }}>
        <div className="flex items-center gap-2.5 h-14 px-4 border-b" style={{ borderColor: STITCH.borderSubtle }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: STITCH.primary }}
          >
            <CheckCircle2 className="text-white" size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-slate-900">PM Pro</span>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {deskNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-white bg-[color:var(--stitch-primary)]'
                    : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t flex items-center gap-2.5" style={{ borderColor: STITCH.borderSubtle }}>
          <Avatar alt={sessionUser?.name || 'User'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{sessionUser?.name || 'Account'}</p>
            <p className="text-[10px] text-slate-500 truncate">{sessionUser?.email || ''}</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isMobileOnly && (
          <header className="hidden md:flex h-14 items-center justify-end gap-2 px-5 shrink-0 border-b bg-white/90 backdrop-blur-md" style={{ borderColor: STITCH.borderSubtle }}>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative h-10 w-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
            <Avatar alt={sessionUser?.name || 'User'} size="sm" />
          </header>
        )}

        <main className="flex-1 overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav — matches stitch today_dashboard / projects */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-white pt-2 px-2"
          style={{
            borderColor: STITCH.borderSubtle,
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            minHeight: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <MobileNavItem to="/" end icon={<CheckCircle2 size={24} />} label="Today" />
          <MobileNavItem to="/projects" icon={<FolderKanban size={24} />} label="Projects" />
          <MobileNavItem to="/settings" icon={<Settings size={24} />} label="Settings" />
        </nav>
      </div>
    </div>
  );
}

function MobileNavItem({
  to,
  end,
  icon,
  label,
}: {
  to: string;
  end?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center w-16 gap-1 py-1 text-[11px] font-semibold tracking-wide',
          isActive ? 'text-[color:var(--stitch-primary)]' : 'text-slate-400'
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
