import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface ToastOptions {
  variant?: 'default' | 'error';
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastMessage {
  id: string;
  text: string;
  variant: 'default' | 'error';
  onUndo?: () => void;
  undoLabel?: string;
  duration: number;
  remaining: number;
  startedAt: number;
}

interface ToastContextType {
  showToast: (text: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const pausedRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    pausedRef.current.delete(id);
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, delay: number) => {
      const existing = timersRef.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => dismiss(id), delay);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const showToast = useCallback(
    (text: string, options?: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const duration = options?.onUndo ? 6000 : 4000;
      const item: ToastMessage = {
        id,
        text,
        variant: options?.variant || 'default',
        onUndo: options?.onUndo,
        undoLabel: options?.undoLabel || '실행 취소',
        duration,
        remaining: duration,
        startedAt: Date.now(),
      };

      setToasts((prev) => {
        const next = [...prev, item];
        if (next.length > 3) {
          const dropped = next.shift();
          if (dropped) {
            const oldTimer = timersRef.current.get(dropped.id);
            if (oldTimer) clearTimeout(oldTimer);
            timersRef.current.delete(dropped.id);
          }
        }
        return next;
      });

      scheduleDismiss(id, duration);
    },
    [scheduleDismiss]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  const handleMouseEnter = (id: string) => {
    pausedRef.current.add(id);
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, remaining: Math.max(800, item.remaining - (Date.now() - item.startedAt)) }
          : item
      )
    );
  };

  const handleMouseLeave = (id: string) => {
    pausedRef.current.delete(id);
    setToasts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          scheduleDismiss(id, item.remaining);
          return { ...item, startedAt: Date.now() };
        }
        return item;
      })
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Bottom centered stack (max 3) matching UI별 기능 정리.md §2-5 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => handleMouseEnter(t.id)}
            onMouseLeave={() => handleMouseLeave(t.id)}
            className={`pointer-events-auto bs-animate-toast px-4 py-2.5 rounded-xl text-xs font-medium shadow-xl flex items-center gap-3 border transition-all ${
              t.variant === 'error'
                ? 'bg-[#C93638] text-white border-[#E55355]'
                : 'bg-[#1B1B1F] dark:bg-[#2C2A3E] text-white border-black/10 dark:border-[#423F5C]'
            }`}
          >
            <span>{t.text}</span>
            {t.onUndo && (
              <button
                type="button"
                onClick={() => {
                  t.onUndo?.();
                  dismiss(t.id);
                }}
                className="px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-[11px] font-bold text-[#D9D5F3] transition-colors"
              >
                {t.undoLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
