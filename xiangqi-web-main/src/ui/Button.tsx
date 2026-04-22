import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 ' +
  'hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ' +
  'disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[11px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-indigo-500',
  ghost: 'bg-white dark:bg-white/5 text-slate-700 dark:text-white/90 premium-border hover:bg-slate-50 dark:hover:bg-white/10 hover:premium-shadow transition-all',
  subtle: 'bg-transparent text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:bg-white/5 hover:text-slate-900 dark:text-white',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50',
};

export function Button({ variant = 'ghost', size = 'md', className = '', ...props }: Props) {
  return <button className={[base, sizes[size], variants[variant], className].join(' ')} {...props} />;
}
