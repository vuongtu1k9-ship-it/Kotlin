import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert, Confirm, Dialog } from './Dialog';

interface DialogConfig {
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'info' | 'danger' | 'warning' | 'success';
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
  defaultValue?: string;
}

interface DialogContextType {
  showAlert: (title: string, message: string, variant?: DialogConfig['variant']) => Promise<void>;
  showConfirm: (title: string, message: string, variant?: DialogConfig['variant'], confirmLabel?: string) => Promise<boolean>;
  showPrompt: (title: string, message: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within a DialogProvider');
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setConfig(null), 300);
  }, []);

  const showAlert = useCallback((title: string, message: string, variant: DialogConfig['variant'] = 'info') => {
    return new Promise<void>((resolve) => {
      setConfig({
        type: 'alert',
        title,
        message,
        variant,
        onConfirm: () => {
          close();
          resolve();
        }
      });
      setIsOpen(true);
    });
  }, [close]);

  const showConfirm = useCallback((title: string, message: string, variant: DialogConfig['variant'] = 'warning', confirmLabel?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        type: 'confirm',
        title,
        message,
        variant,
        confirmLabel,
        onConfirm: () => {
          close();
          resolve(true);
        },
        onCancel: () => {
          close();
          resolve(false);
        }
      });
      setIsOpen(true);
    });
  }, [close]);

  const showPrompt = useCallback((title: string, message: string, defaultValue: string = '') => {
    setPromptValue(defaultValue);
    return new Promise<string | null>((resolve) => {
      setConfig({
        type: 'prompt',
        title,
        message,
        defaultValue,
        onConfirm: (value) => {
          close();
          resolve(value || '');
        },
        onCancel: () => {
          close();
          resolve(null);
        }
      });
      setIsOpen(true);
    });
  }, [close]);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {config?.type === 'alert' && (
        <Alert
          isOpen={isOpen}
          onClose={config.onConfirm as any}
          title={config.title}
          message={config.message}
          variant={config.variant}
          confirmLabel={config.confirmLabel}
        />
      )}
      {config?.type === 'confirm' && (
        <Confirm
          isOpen={isOpen}
          onClose={config.onCancel as any}
          onConfirm={config.onConfirm as any}
          title={config.title}
          message={config.message}
          variant={config.variant}
          confirmLabel={config.confirmLabel}
          cancelLabel={config.cancelLabel}
        />
      )}
      {config?.type === 'prompt' && (
        <Dialog
          isOpen={isOpen}
          onClose={config.onCancel as any}
          title={config.title}
          description={config.message}
          footer={
            <>
              <button
                onClick={config.onCancel}
                className="px-6 py-3 text-slate-400 hover:text-slate-900 dark:hover:text-white text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => config.onConfirm?.(promptValue)}
                className="px-10 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg"
              >
                Xác nhận
              </button>
            </>
          }
        >
          <input
            type="text"
            className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold text-slate-900 dark:text-white transition-all mt-2"
            value={promptValue}
            onChange={(e) => setPromptValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') config.onConfirm?.(promptValue);
              if (e.key === 'Escape') config.onCancel?.();
            }}
          />
        </Dialog>
      )}
    </DialogContext.Provider>
  );
}
