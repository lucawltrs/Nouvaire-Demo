import { useState, useEffect } from 'react';
import { IconCircleCheck, IconAlertCircle, IconInfoCircle, IconX } from '@tabler/icons-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type };
    
    this.toasts.push(toast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  success(message: string, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000) {
    return this.show(message, 'info', duration);
  }
}

export const toast = new ToastManager();

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => toast.dismiss(t.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast: item, onDismiss }: ToastItemProps) {
  const styles = {
    success: 'bg-brand text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  const icons = {
    success: IconCircleCheck,
    error: IconAlertCircle,
    info: IconInfoCircle,
  };

  const Icon = icons[item.type];

  return (
    <div
      className={`${styles[item.type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}
    >
      <Icon size={20} className="shrink-0" />
      <span className="font-medium flex-1">{item.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Dismiss"
      >
        <IconX size={18} />
      </button>
    </div>
  );
}
