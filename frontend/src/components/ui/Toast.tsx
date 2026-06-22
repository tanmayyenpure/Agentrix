import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle, Info, TriangleAlert, X, XCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info' | 'warning';
type Toast = { id: number; kind: ToastKind; title: string; message?: string };

const ToastContext = createContext<{ pushToast: (toast: Omit<Toast, 'id'>) => void } | null>(null);

const ICONS = { success: CheckCircle, error: XCircle, info: Info, warning: TriangleAlert };
const COLORS = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { ...toast, id }]);
    window.setTimeout(() => remove(id), 4000);
  }, [remove]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind];
          return (
            <div key={toast.id} className="rounded-lg p-4 shadow-xl" style={{ background: 'var(--forge-surface)', border: '1px solid var(--forge-border)' }}>
              <div className="flex gap-3">
                <Icon size={18} style={{ color: COLORS[toast.kind] }} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{toast.title}</p>
                  {toast.message && <p className="mt-1 text-xs text-slate-500">{toast.message}</p>}
                </div>
                <button className="border-0 bg-transparent p-0 text-slate-500 hover:text-white" onClick={() => remove(toast.id)}>
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
