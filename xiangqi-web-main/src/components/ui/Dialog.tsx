import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: 'info' | 'danger' | 'warning' | 'success'; 
}

export function Dialog({ isOpen, onClose, title, description, children, footer, variant = 'info' }: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setTimeout(() => setShow(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setShow(false);
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 dark:bg-[#0B0F19]/80 backdrop-blur-md transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      
      {/* Content */}
      <div className={`relative w-full max-w-sm bg-white/95 dark:bg-[#161b2c]/95 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden transition-all duration-300 transform ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-5">
             <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shadow-lg transition-transform duration-500 delay-100 ${show ? 'scale-100 rotate-0' : 'scale-50 rotate-12'} ${
               variant === 'danger' ? 'bg-red-500/10 text-red-500 shadow-red-500/10' :
               variant === 'success' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10' :
               variant === 'warning' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/10' :
               'bg-blue-500/10 text-blue-500 shadow-blue-500/10'
             }`}>
                {variant === 'danger' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                {variant === 'success' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>}
                {variant === 'info' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                {variant === 'warning' && <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{title}</h3>
                {description && <p className="text-sm font-medium text-slate-500 dark:text-white/50 mt-2 px-2 leading-relaxed">{description}</p>}
             </div>
          </div>
          
          {children && <div className="mt-6">{children}</div>}
        </div>

        {footer && (
          <div className="px-8 pb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

import { useTranslation } from 'react-i18next';

interface AlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'info' | 'danger' | 'warning' | 'success';
}

export function Alert({ isOpen, onClose, title, message, confirmLabel, variant = 'info' }: AlertProps) {
  const { t } = useTranslation();
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      variant={variant}
      footer={
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-10 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)]"
        >
          {confirmLabel || t('common.close')}
        </button>
      }
    />
  );
}

interface ConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'info' | 'danger' | 'warning' | 'success';
}

export function Confirm({ isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel, variant = 'warning' }: ConfirmProps) {
  const { t } = useTranslation();
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      variant={variant}
      footer={
        <>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl"
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full sm:w-auto px-12 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl relative overflow-hidden group ${
              variant === 'danger' ? 'bg-gradient-to-br from-red-600 to-red-700 text-white shadow-red-600/30 hover:shadow-red-600/50' :
              variant === 'success' ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-emerald-600/30 hover:shadow-emerald-600/50' :
              'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-600/30 hover:shadow-blue-600/50'
            }`}
          >
            <span className="relative z-10">{confirmLabel || t('common.agree')}</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </>
      }
    />
  );
}
