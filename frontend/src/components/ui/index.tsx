import { ReactNode, ButtonHTMLAttributes, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ExecutionStatus } from '../../types';
import { STATUS_COLOR, STATUS_BG } from '../../utils';

export { Card } from './Card';
export { Skeleton, SkeletonCards } from './Skeleton';

// Button
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  loading?: boolean;
}
export function Button({ variant = 'primary', size = 'md', loading, children, disabled, style, className = '', ...props }: BtnProps) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants: Record<string, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700',
    ghost: 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
    outline: 'bg-transparent text-slate-300 border border-slate-700 hover:border-slate-500 hover:bg-white/5',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant] || variants.primary} ${className}`} disabled={disabled || loading} style={style} {...props}>
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25"/>
          <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3"/>
        </svg>
      )}
      {children}
    </button>
  );
}

// Status badge
export function StatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <span style={{ color: STATUS_COLOR[status], background: STATUS_BG[status], border: `1px solid ${STATUS_COLOR[status]}40` }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium">
      <span style={{ background: STATUS_COLOR[status] }} className="w-1.5 h-1.5 rounded-full" />
      {status}
    </span>
  );
}

// Modal
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string; }
export function Modal({ open, onClose, title, children, width = '480px' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--forge-surface)', border: '1px solid var(--forge-border)', width, maxHeight: '90vh' }}
        className="rounded-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--forge-border)' }}>
          <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded cursor-pointer bg-transparent border-0">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>}
      <input
        style={{ background: 'var(--forge-surface-2)', border: `1px solid ${error ? '#ef4444' : 'var(--forge-border)'}`, color: 'var(--forge-text)' }}
        className={`rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 placeholder:text-slate-600 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; }
export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>}
      <textarea
        style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)', color: 'var(--forge-text)' }}
        className={`rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-500 placeholder:text-slate-600 resize-none ${className}`}
        {...props}
      />
    </div>
  );
}

// Empty state
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div style={{ color: 'var(--forge-muted)' }} className="opacity-50">{icon}</div>
      <div>
        <p className="text-white font-medium mb-1">{title}</p>
        <p style={{ color: 'var(--forge-muted)' }} className="text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

// Tooltip
export function Tooltip({ children, tip }: { children: ReactNode; tip: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ background: '#1e2330', border: '1px solid var(--forge-border)' }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-md text-xs text-white whitespace-nowrap z-50 pointer-events-none">
          {tip}
        </div>
      )}
    </div>
  );
}
