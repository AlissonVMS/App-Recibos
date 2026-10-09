import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-500/20 text-emerald-300',
      indicator: 'bg-emerald-500',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
      border: 'border-rose-500/40',
      badge: 'bg-rose-500/20 text-rose-300',
      indicator: 'bg-rose-500',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
      border: 'border-amber-500/40',
      badge: 'bg-amber-500/20 text-amber-300',
      indicator: 'bg-amber-500',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
      border: 'border-blue-500/40',
      badge: 'bg-blue-500/20 text-blue-300',
      indicator: 'bg-blue-500',
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 bg-slate-900/95 text-slate-100 border ${config.border} p-3.5 rounded-xl shadow-2xl backdrop-blur-md min-w-[320px] max-w-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 select-none`}
    >
      <div className="pt-0.5">{config.icon}</div>
      <div className="flex-1 pr-2">
        <h4 className="text-xs font-bold text-slate-100 tracking-wide">{toast.title}</h4>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl ${config.indicator} opacity-80`}
      />
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
