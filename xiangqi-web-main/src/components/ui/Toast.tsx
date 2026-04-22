import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface ToastOptions {
  duration?: number;
  actions?: ToastAction[];
}

interface ToastMessage {
  id: string;
  type: ToastType;
  message: ReactNode;
  actions?: ToastAction[];
  show: boolean;
}

interface ToastContextType {
  showToast: (message: ReactNode, type?: ToastType, options?: ToastOptions) => void;
  success: (message: ReactNode, options?: ToastOptions) => void;
  error: (message: ReactNode, options?: ToastOptions) => void;
  info: (message: ReactNode, options?: ToastOptions) => void;
  warning: (message: ReactNode, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((message: ReactNode, type: ToastType = 'info', options?: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 9);
    const newToast: ToastMessage = {
      id,
      type,
      message,
      actions: options?.actions,
      show: false
    };

    setToasts(prev => [...prev, newToast]);
    
    // Trigger entrance animation
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: true } : t));
    }, 10);

    if (!options?.actions || options.duration) {
       setTimeout(() => {
         removeToast(id);
       }, options?.duration || 5000);
    }
  }, [removeToast]);

  const success = (msg: ReactNode, opt?: ToastOptions) => showToast(msg, 'success', opt);
  const error = (msg: ReactNode, opt?: ToastOptions) => showToast(msg, 'error', opt);
  const info = (msg: ReactNode, opt?: ToastOptions) => showToast(msg, 'info', opt);
  const warning = (msg: ReactNode, opt?: ToastOptions) => showToast(msg, 'warning', opt);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-24 right-2 sm:right-8 z-[100] flex flex-col gap-4 pointer-events-none items-end w-[calc(100vw-1rem)] sm:w-auto">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex flex-col gap-3 p-5 rounded-[24px] border backdrop-blur-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 transform w-full sm:min-w-[340px] sm:max-w-sm ${
              toast.show ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            } ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
              toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' :
              toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-xq-gold' :
              'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                toast.type === 'success' ? 'bg-emerald-500/20' :
                toast.type === 'error' ? 'bg-red-500/20' :
                toast.type === 'warning' ? 'bg-amber-500/20' :
                'bg-blue-500/20'
              }`}>
                 {toast.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>}
                 {toast.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>}
                 {toast.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                 {toast.type === 'warning' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
              </div>
              <div className="flex-1 mt-1 font-black text-[13px] leading-tight flex items-center min-h-[32px]">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="mt-1 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 dark:text-white/20 hover:text-slate-900 dark:text-white transition-all active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {toast.actions && toast.actions.length > 0 && (
              <div className="flex gap-2">
                {toast.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      action.onClick();
                      removeToast(toast.id);
                    }}
                    disabled={action.disabled}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                      action.disabled ? 'bg-slate-500/10 text-slate-500 cursor-not-allowed' :
                      action.variant === 'primary' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500' :
                      action.variant === 'danger' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/30' :
                      'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
