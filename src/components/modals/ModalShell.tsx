import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

export interface OriginRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  originRect?: OriginRect | null;
  maxWidthClass?: string;
  zIndexClass?: string;
  className?: string;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  originRect,
  maxWidthClass = 'max-w-md',
  zIndexClass = 'z-50',
  className = '',
  children,
}) => {
  const [rendered, setRendered] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const lastOriginRef = useRef<OriginRect | null>(null);

  if (originRect) {
    lastOriginRef.current = originRect;
  }

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      setRendered(true);
      setClosing(false);
    } else if (rendered) {
      setClosing(true);
      const closeDuration = lastOriginRef.current ? 220 : 140;
      const timer = setTimeout(() => {
        setRendered(false);
        setClosing(false);
        lastOriginRef.current = null;
        previousFocusRef.current?.focus?.();
      }, closeDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, rendered]);

  // Card -> Modal FLIP expand (280ms) and collapse back to card (220ms) (§2-4)
  useLayoutEffect(() => {
    const el = panelRef.current;
    const orig = lastOriginRef.current;
    if (!el || !orig || !rendered) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const target = el.getBoundingClientRect();
    if (target.width === 0 || target.height === 0) return;

    const dx = orig.left + orig.width / 2 - (target.left + target.width / 2);
    const dy = orig.top + orig.height / 2 - (target.top + target.height / 2);
    const sx = Math.max(0.15, orig.width / target.width);
    const sy = Math.max(0.15, orig.height / target.height);

    if (!closing) {
      el.animate(
        [
          {
            transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
            opacity: 0.55,
          },
          {
            transform: 'translate(0px, 0px) scale(1, 1)',
            opacity: 1,
          },
        ],
        {
          duration: 280,
          easing: 'cubic-bezier(0.2, 0, 0, 1)',
          fill: 'both',
        }
      );
    } else {
      el.animate(
        [
          {
            transform: 'translate(0px, 0px) scale(1, 1)',
            opacity: 1,
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
            opacity: 0,
          },
        ],
        {
          duration: 220,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          fill: 'both',
        }
      );
    }
  }, [rendered, closing]);

  // Background scroll lock + Focus trap + ESC close (§2-3, §9)
  useEffect(() => {
    if (!rendered || closing) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      if (panel.contains(document.activeElement)) return;
      const autoFocusEl = panel.querySelector<HTMLElement>(
        '[autofocus], input:not([type="hidden"]), textarea, select, button'
      );
      autoFocusEl?.focus();
    }, 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !panelRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !panelRef.current.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [rendered, closing, onClose]);

  if (!rendered) return null;

  const hasOrigin = Boolean(lastOriginRef.current);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 ${
        closing ? 'bs-animate-backdrop-out' : 'bs-animate-backdrop'
      }`}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidthClass} rounded-2xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] shadow-2xl overflow-hidden ${
          hasOrigin ? '' : closing ? 'bs-animate-modal-out' : 'bs-animate-modal'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
