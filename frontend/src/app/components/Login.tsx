import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button, Input } from './ui';
import { Eye, EyeOff, ArrowRight, CheckCircle2, BarChart3, Zap } from 'lucide-react';

const features = [
  { icon: <BarChart3 size={16} />, text: 'Real-time EVM and analytics' },
  { icon: <CheckCircle2 size={16} />, text: 'Frictionless task completion' },
  { icon: <Zap size={16} />, text: 'Smart scheduling & Gantt' },
];

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('alice@pmpro.app');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 900));
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex font-['Inter'] overflow-hidden">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-[520px] shrink-0 flex-col justify-between bg-[#0A1628] p-12 relative overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Gradient glow */}
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#00BFA5]/10 blur-[100px]" />
        <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-[#1E3A5F]/60 blur-[80px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00BFA5] to-[#00927E] flex items-center justify-center shadow-lg shadow-[#00BFA5]/30">
              <span className="font-black text-white text-lg">P</span>
            </div>
            <span className="font-bold text-2xl text-white tracking-tight">PM Pro</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage projects.<br />Track everything.
            </h1>
            <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-sm">
              The professional project management platform built for teams who demand clarity, speed, and control.
            </p>
            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-gray-300"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#00BFA5]/15 border border-[#00BFA5]/20 flex items-center justify-center text-[#00BFA5]">
                    {f.icon}
                  </div>
                  {f.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00BFA5]/40"
              alt="Alice Johnson"
            />
            <div>
              <p className="text-sm font-semibold text-white">Alice Johnson</p>
              <p className="text-xs text-gray-400">Project Manager · 3 active projects</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center bg-[#F5F7FA] px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00BFA5] to-[#00927E] flex items-center justify-center">
              <span className="font-black text-white">P</span>
            </div>
            <span className="font-bold text-xl text-gray-900">PM Pro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Email address</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-white border-gray-200 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs text-[#00BFA5] font-semibold hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 bg-white border-gray-200 shadow-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={isLoading}
                className="h-11 rounded-lg font-bold shadow-sm shadow-[#00BFA5]/20"
              >
                {!isLoading && (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="mt-4 space-y-2.5">
            <button className="w-full h-10 flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
              <svg viewBox="0 0 48 48" className="w-4 h-4"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.1 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.6 7.3 29.1 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21c10.5 0 19.5-7.7 20.8-18h-1.2z" /><path fill="#FF3D00" d="M6.3 15.7l6.6 4.8C14.4 16.9 18.9 14 24 14c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.6 7.3 29.1 5 24 5 16.3 5 9.7 9.6 6.3 15.7z" /><path fill="#4CAF50" d="M24 47c5 0 9.5-1.9 12.9-5l-6-4.9C29.2 38.5 26.7 39.5 24 39.5c-5.1 0-9.5-2.9-11.6-7l-6.5 5C9.5 43.3 16.3 47 24 47z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-2.8 4.9-5.1 6.5l6 4.9C39.8 36.7 44 31.8 44 26c0-1.8-.2-3.5-.4-5.5z" /></svg>
              Continue with Google
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            By signing in, you agree to our{' '}
            <span className="text-[#00BFA5] font-semibold cursor-pointer hover:underline">Terms of Service</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
