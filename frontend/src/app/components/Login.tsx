import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CheckSquare } from 'lucide-react';
import { login, logout } from '../api/auth';
import { ApiError } from '../api/client';
import { getToken } from '../api/storage';
import { registerPushNotifications } from '../push/registerPush';
import { isNativeApp } from '../platform';
import { STITCH } from '../stitch/tokens';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const routedError =
    (location.state as { adminMobileBlocked?: boolean } | null)?.adminMobileBlocked === true
      ? 'This app is for team members. Admins use the web console, not the mobile app.'
      : null;

  React.useEffect(() => {
    if (getToken()) navigate('/', { replace: true });
  }, [navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (routedError) setError(routedError);
  }, [routedError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (isNativeApp() && user.role === 'admin') {
        await logout();
        setError('This app is for team members. Admins use the web console, not the mobile app.');
        return;
      }
      void registerPushNotifications();
      navigate('/');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 0
            ? err.message
            : err.status === 401
              ? `${err.message} (Members must exist in pm-pro: run seed from ProjectManagementAPP/backend while pm-pro is on port 3001.)`
              : err.message
          : err instanceof Error
            ? err.message
            : 'Login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 antialiased font-body"
      style={{ backgroundColor: STITCH.bgLogin }}
    >
      <main className="w-full max-w-md flex flex-col min-h-screen max-h-[900px] py-10">
        <div className="flex-grow flex items-center justify-center pb-8">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
            style={{ backgroundColor: STITCH.primary }}
          >
            <CheckSquare className="text-white" size={28} strokeWidth={2} />
          </div>
        </div>

        <div className="w-full pb-12 shrink-0">
          <h1
            className="text-[32px] font-semibold text-center mb-8 font-display"
            style={{ color: STITCH.primary }}
          >
            Welcome back
          </h1>

          {error && (
            <p className="mb-4 text-[13px] font-medium text-center" style={{ color: '#ba1a1a' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-slate-700 sr-only">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-14 rounded-lg border border-[#e2e8f0] px-4 text-base text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[color:var(--stitch-primary)] focus:ring-1 focus:ring-[color:var(--stitch-primary)] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700 sr-only">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-14 rounded-lg border border-[#e2e8f0] px-4 text-base text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:border-[color:var(--stitch-primary)] focus:ring-1 focus:ring-[color:var(--stitch-primary)] transition-colors"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-lg font-semibold text-[15px] text-white active:scale-[0.99] transition-transform disabled:opacity-60 font-display"
                style={{ backgroundColor: STITCH.primary }}
              >
                {isLoading ? 'Signing in…' : 'Log In'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button type="button" className="text-[13px] font-semibold text-slate-400 hover:text-[color:var(--stitch-primary)] transition-colors">
              Forgot your password?
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
