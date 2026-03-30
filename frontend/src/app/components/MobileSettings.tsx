import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { me, logout } from '../api/auth';
import type { AuthUser } from '../api/storage';
import { STITCH } from '../stitch/tokens';

/** Account / sign out — matches Settings tab in stitch today & projects HTML. */
export function MobileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setUserLoading(true);
      setUserError(null);
      try {
        const u = await me();
        if (!cancelled) setUser(u);
      } catch {
        if (!cancelled) setUserError('Could not load profile');
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-full font-body pb-safe" style={{ backgroundColor: STITCH.bg }}>
      <header
        className="sticky top-0 z-40 px-4 pt-3 pb-3 backdrop-blur-md border-b"
        style={{ backgroundColor: `${STITCH.bg}e6`, borderColor: STITCH.borderSubtle }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Settings</h1>
      </header>

      <div className="px-4 pt-4 pb-28 space-y-4">
        <section
          className="rounded-lg bg-white border p-4"
          style={{ borderColor: STITCH.borderSubtle }}
        >
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Signed in as</h2>
          {userLoading && <p className="text-sm text-slate-500">Loading…</p>}
          {userError && <p className="text-sm font-semibold text-red-700">{userError}</p>}
          {!userLoading && !userError && user && (
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900 font-display">{user.name}</p>
              <p className="text-sm text-slate-600">{user.email}</p>
              <p className="text-xs font-semibold text-slate-400 capitalize mt-2">Role: {user.role}</p>
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-3.5 font-bold text-white shadow-sm"
          style={{ backgroundColor: STITCH.primary }}
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}
