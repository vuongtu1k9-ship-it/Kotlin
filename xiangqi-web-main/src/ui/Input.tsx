import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = '', ...props }: Props) {
  return (
    <input
      className={
        'h-10 w-full rounded-xl border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-4 text-sm text-slate-900 dark:text-white ' +
        'placeholder:text-slate-600 dark:text-white/40 outline-none transition-all duration-200 ' +
        'focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 focus:bg-slate-200 dark:bg-white/10 ' +
        className
      }
      {...props}
    />
  );
}
