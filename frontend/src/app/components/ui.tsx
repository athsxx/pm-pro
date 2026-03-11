import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check, ChevronUp, ChevronDown } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA5] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] select-none rounded-lg',
          {
            'bg-[#00BFA5] text-white hover:bg-[#00A891] shadow-sm hover:shadow': variant === 'primary',
            'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm': variant === 'secondary',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-900': variant === 'ghost',
            'bg-red-500 text-white hover:bg-red-600 shadow-sm': variant === 'danger',
            'bg-[#1E3A5F] text-white hover:bg-[#162d4a] shadow-sm': variant === 'teal',
            'h-7 px-2.5 text-xs': size === 'xs',
            'h-8 px-3 text-xs': size === 'sm',
            'h-9 px-4 text-sm': size === 'md',
            'h-11 px-6 text-sm': size === 'lg',
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ─── Checkbox ────────────────────────────────────────────────────────��───────
interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  size?: 'sm' | 'md';
  indeterminate?: boolean;
}

export function Checkbox({ checked, onChange, className, size = 'md', indeterminate }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={(e) => { e.stopPropagation(); onChange?.(!checked); }}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00BFA5] focus-visible:ring-offset-1',
        checked || indeterminate
          ? 'bg-[#00BFA5] border-[#00BFA5] text-white'
          : 'bg-white border-gray-300 hover:border-[#00BFA5]',
        size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
        className
      )}
    >
      {checked && <Check size={size === 'sm' ? 10 : 13} strokeWidth={3.5} />}
      {indeterminate && !checked && <div className="w-2 h-0.5 bg-white rounded" />}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5] disabled:cursor-not-allowed disabled:opacity-50 transition-all',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// ─── Textarea ────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5] disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'flat';
  padding?: boolean;
}

export function Card({ className, variant = 'default', padding, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white transition-all',
        {
          'border border-gray-200 shadow-sm': variant === 'default',
          'border border-gray-200 shadow-md hover:shadow-lg': variant === 'elevated',
          'border border-gray-100': variant === 'flat',
        },
        padding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'teal' | 'purple';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-gray-100 text-gray-600 border border-gray-200',
  teal: 'bg-[#00BFA5]/10 text-[#00927E] border border-[#00BFA5]/25',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
};

const dotVariants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
  teal: 'bg-[#00BFA5]',
  purple: 'bg-purple-500',
};

export function Badge({ className, variant = 'neutral', dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotVariants[variant])} />}
      {children}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: 'High' | 'Medium' | 'Low' }) {
  const config = {
    High: { variant: 'error' as BadgeVariant, label: 'High' },
    Medium: { variant: 'warning' as BadgeVariant, label: 'Medium' },
    Low: { variant: 'info' as BadgeVariant, label: 'Low' },
  };
  const { variant, label } = config[priority];
  return <Badge variant={variant} dot>{label}</Badge>;
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  color?: 'teal' | 'green' | 'blue' | 'red' | 'purple';
}

const progressColors = {
  teal: 'from-[#00BFA5] to-[#00D4B8]',
  green: 'from-emerald-400 to-emerald-500',
  blue: 'from-blue-400 to-blue-500',
  red: 'from-red-400 to-red-500',
  purple: 'from-purple-400 to-purple-500',
};

export function ProgressBar({ value, className, size = 'sm', color = 'teal' }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-gray-100',
        { 'h-1': size === 'xs', 'h-1.5': size === 'sm', 'h-2.5': size === 'md' },
        className
      )}
    >
      <div
        className={cn('h-full bg-gradient-to-r transition-all duration-700 ease-out rounded-full', progressColors[color])}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

// ─── Progress Ring ───────────────────────────────────────────────────────────
export function ProgressRing({ value, size = 40, strokeWidth = 4, color = '#00BFA5' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
const avatarColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

function getInitialColor(name?: string) {
  if (!name) return avatarColors[0];
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  const color = getInitialColor(alt);
  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-white',
        avatarSizes[size],
        className
      )}
      style={{ backgroundColor: src ? undefined : color }}
    >
      {src ? (
        <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-white">
          {alt?.charAt(0)?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}

// ─── Avatar Group ─────────────────────────────────────────────────────────────
export function AvatarGroup({ avatars, max = 3, size = 'sm' }: { avatars: { src?: string; alt?: string }[]; max?: number; size?: 'xs' | 'sm' | 'md' }) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;
  return (
    <div className="flex items-center">
      {visible.map((av, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar src={av.src} alt={av.alt} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          style={{ marginLeft: -8 }}
          className={cn(
            'flex items-center justify-center rounded-full ring-2 ring-white bg-gray-200 text-gray-600',
            size === 'xs' ? 'h-5 w-5 text-[9px]' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

// ─── Stat Arrow ───────────────────────────────────────────────────────────────
export function TrendIndicator({ value, label }: { value: string; label?: string }) {
  const isPositive = value.startsWith('+');
  const isNegative = value.startsWith('-');
  return (
    <div className={cn('inline-flex items-center gap-1 text-xs font-semibold', isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-500')}>
      {isPositive && <ChevronUp size={14} strokeWidth={3} />}
      {isNegative && <ChevronDown size={14} strokeWidth={3} />}
      {value} {label}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px bg-gray-100', className)} />;
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1', className)}>
      {children}
    </p>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-300 mb-4">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-[240px]">{description}</p>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/30 focus:border-[#00BFA5] disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer appearance-none',
        className
      )}
      {...props}
    />
  )
);
Select.displayName = 'Select';
