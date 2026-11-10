import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  RotateCcw,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onRetry?: () => void;
  createdAt: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export interface PromptDialogOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ToastContextType {
  addToast: (
    type: ToastType,
    title: string,
    description?: string,
    duration?: number,
    onRetry?: () => void
  ) => void;
  removeToast: (id: string) => void;
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  prompt: (options: PromptDialogOptions) => Promise<string | null>;
}

export const ToastContext = createContext<ToastContextType | null>(null);

// Global reference for toast calls outside React component lifecycle
let globalToastHandler: ToastContextType | null = null;

export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    globalToastHandler?.addToast('success', title, description, duration ?? 2000);
  },
  error: (title: string, description?: string, onRetry?: () => void, duration?: number) => {
    globalToastHandler?.addToast('error', title, description, duration ?? 5000, onRetry);
  },
  warning: (title: string, description?: string, duration?: number) => {
    globalToastHandler?.addToast('warning', title, description, duration ?? 4000);
  },
  info: (title: string, description?: string, duration?: number) => {
    globalToastHandler?.addToast('info', title, description, duration ?? 3000);
  },
};

export const customConfirm = (options: ConfirmDialogOptions): Promise<boolean> => {
  if (globalToastHandler) {
    return globalToastHandler.confirm(options);
  }
  return Promise.resolve(window.confirm(options.message || options.title));
};

export const customPrompt = (options: PromptDialogOptions): Promise<string | null> => {
  if (globalToastHandler) {
    return globalToastHandler.prompt(options);
  }
  return Promise.resolve(window.prompt(options.message || options.title, options.defaultValue));
};

export const useToast = () => {
  const context = useContext(ToastContext);
  return {
    ...toast,
    toast,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    customConfirm,
    customPrompt,
    addToast: context?.addToast,
    confirm: context?.confirm || customConfirm,
    prompt: context?.prompt || customPrompt,
  };
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ title: string; time: number }>({ title: '', time: 0 });

  // Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptDialogOptions;
    inputValue: string;
    resolve: (val: string | null) => void;
  } | null>(null);

  const addToast = (
    type: ToastType,
    title: string,
    description?: string,
    duration?: number,
    onRetry?: () => void
  ) => {
    // Duplicate check: avoid spamming identical toast within 1.5s
    const now = Date.now();
    if (
      lastToastRef.current.title === title &&
      now - lastToastRef.current.time < 1500
    ) {
      return;
    }
    lastToastRef.current = { title, time: now };

    const newToast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      description,
      duration: duration ?? (type === 'success' ? 2000 : type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000),
      onRetry,
      createdAt: now,
    };

    setToasts((current) => {
      if (current.length < 3) {
        return [...current, newToast];
      } else {
        // Enqueue if active toasts >= 3
        setQueue((q) => [...q, newToast]);
        return current;
      }
    });
  };

  const removeToast = (id: string) => {
    setToasts((current) => {
      const filtered = current.filter((t) => t.id !== id);
      // If queue has items and we now have < 3 toasts, promote next from queue
      if (queue.length > 0 && filtered.length < 3) {
        const [next, ...rest] = queue;
        setQueue(rest);
        return [...filtered, next];
      }
      return filtered;
    });
  };

  // Promise-based Dialog methods
  const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve: (val: boolean) => {
          setConfirmState(null);
          resolve(val);
        },
      });
    });
  };

  const prompt = (options: PromptDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        inputValue: options.defaultValue || '',
        resolve: (val: string | null) => {
          setPromptState(null);
          resolve(val);
        },
      });
    });
  };

  // Register global handler
  useEffect(() => {
    globalToastHandler = { addToast, removeToast, confirm, prompt };
    return () => {
      globalToastHandler = null;
    };
  }, [queue]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, confirm, prompt }}>
      {children}

      {/* Toast Notification Container (Bottom Right) */}
      <div
        className="fixed bottom-6 right-6 sm:right-6 sm:bottom-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <ToastCard
            key={item.id}
            item={item}
            onClose={() => removeToast(item.id)}
          />
        ))}
      </div>

      {/* Custom Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-2xl shadow-modal max-w-sm w-full p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-sm">
                {confirmState.options.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A5A3B5] leading-relaxed whitespace-pre-wrap">
                {confirmState.options.message}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-semibold text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#1E1E27] transition-colors"
              >
                {confirmState.options.cancelText || '취소'}
              </button>
              <button
                type="button"
                onClick={() => confirmState.resolve(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors ${
                  confirmState.options.isDanger
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-lavender-500 hover:bg-lavender-600 dark:bg-[#A995F5] dark:hover:bg-[#9781EB]'
                }`}
              >
                {confirmState.options.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Prompt Modal */}
      {promptState && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-2xl shadow-modal max-w-sm w-full p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-sm">
                {promptState.options.title}
              </h3>
              {promptState.options.message && (
                <p className="text-xs text-slate-500 dark:text-[#A5A3B5] leading-relaxed">
                  {promptState.options.message}
                </p>
              )}
            </div>
            <input
              type="text"
              autoFocus
              value={promptState.inputValue}
              onChange={(e) =>
                setPromptState({ ...promptState, inputValue: e.target.value })
              }
              placeholder={promptState.options.placeholder || '입력하세요'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  promptState.resolve(promptState.inputValue.trim() || null);
                } else if (e.key === 'Escape') {
                  promptState.resolve(null);
                }
              }}
              className="w-full px-3 py-2 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] text-slate-800 dark:text-[#E8E7EF] rounded-xl text-xs focus:outline-none focus:border-lavender-500"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => promptState.resolve(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-semibold text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#1E1E27] transition-colors"
              >
                {promptState.options.cancelText || '취소'}
              </button>
              <button
                type="button"
                onClick={() =>
                  promptState.resolve(promptState.inputValue.trim() || null)
                }
                className="px-3.5 py-1.5 bg-lavender-500 hover:bg-lavender-600 dark:bg-[#A995F5] dark:hover:bg-[#9781EB] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                {promptState.options.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

// Individual Toast Card Component with Hover Pause & Animation
const ToastCard: React.FC<{ item: ToastItem; onClose: () => void }> = ({
  item,
  onClose,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const remainingTimeRef = useRef(item.duration || 3000);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (isHovered) return;

    startTimeRef.current = Date.now();
    const timer = setTimeout(() => {
      onClose();
    }, remainingTimeRef.current);

    return () => {
      clearTimeout(timer);
      remainingTimeRef.current -= Date.now() - startTimeRef.current;
    };
  }, [isHovered, onClose]);

  // Style by type
  const getBadgeIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-lavender-500 dark:text-[#A995F5] shrink-0" />;
    }
  };

  return (
    <div
      role={item.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pointer-events-auto bg-white dark:bg-[#292936] border border-slate-200/90 dark:border-[#3A3948] rounded-2xl p-3.5 shadow-lg shadow-black/5 dark:shadow-black/20 flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in select-none group"
    >
      {/* Icon Badge */}
      <div className="mt-0.5">{getBadgeIcon()}</div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] leading-snug truncate">
          {item.title}
        </div>
        {item.description && (
          <div className="text-[11px] text-slate-500 dark:text-[#A5A3B5] mt-0.5 leading-relaxed break-words">
            {item.description}
          </div>
        )}
        {item.onRetry && (
          <button
            type="button"
            onClick={item.onRetry}
            className="flex items-center gap-1 text-[11px] font-semibold text-lavender-600 dark:text-[#B7A5FF] hover:underline mt-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>다시 시도</span>
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E1E27] transition-colors shrink-0"
        title="닫기"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
