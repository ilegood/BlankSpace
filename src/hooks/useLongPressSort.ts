import { useState, useRef, useEffect, useCallback } from 'react';

export interface LongPressDragOptions {
  holdMs?: number;
  onReorder: (fromId: string, toId: string) => void;
  onDropIntoFolder?: (docId: string, folderId: string) => void;
  onForbiddenDrop?: () => void;
}

/**
 * Snapshot current positions of all [data-sort-id] elements and animate them
 * from their old positions to their new positions after a state update (FLIP §2-2, §10).
 */
export function runFlipForSortItems(durationMs = 200, mutateFn?: () => void) {
  if (typeof window === 'undefined') {
    mutateFn?.();
    return () => {};
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    mutateFn?.();
    return () => {};
  }

  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-sort-id]'));
  const beforeRects = new Map<string, DOMRect>();
  els.forEach((el) => {
    const id = el.getAttribute('data-sort-id');
    if (id) beforeRects.set(id, el.getBoundingClientRect());
  });

  const play = () => {
    requestAnimationFrame(() => {
      const afterEls = Array.from(document.querySelectorAll<HTMLElement>('[data-sort-id]'));
      afterEls.forEach((el) => {
        const id = el.getAttribute('data-sort-id');
        if (!id) return;
        const before = beforeRects.get(id);
        if (!before) return;
        const after = el.getBoundingClientRect();
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0px, 0px)' },
          ],
          {
            duration: durationMs,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          }
        );
      });
    });
  };

  if (mutateFn) {
    mutateFn();
    play();
  }
  return play;
}

export function useLongPressSort({
  holdMs = 500,
  onReorder,
  onDropIntoFolder,
  onForbiddenDrop,
}: LongPressDragOptions) {
  const [pressingId, setPressingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<'project' | 'folder' | 'document' | 'card'>('card');
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [hoverFolderCenterId, setHoverFolderCenterId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [forbiddenShakeId, setForbiddenShakeId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const draggingTypeRef = useRef<'project' | 'folder' | 'document' | 'card'>('card');
  const hoverTargetRef = useRef<string | null>(null);
  const hoverFolderCenterRef = useRef<string | null>(null);
  const wasDraggedRef = useRef(false);

  draggingIdRef.current = draggingId;
  draggingTypeRef.current = draggingType;
  hoverTargetRef.current = hoverTargetId;
  hoverFolderCenterRef.current = hoverFolderCenterId;

  const setPlaceholderAttr = (id: string | null, enabled: boolean) => {
    if (!id) return;
    const el = document.querySelector<HTMLElement>(`[data-sort-id="${id}"]`);
    if (el) {
      if (enabled) el.setAttribute('data-sort-placeholder', 'true');
      else el.removeAttribute('data-sort-placeholder');
    }
  };

  const clearDrag = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (draggingIdRef.current) {
      setPlaceholderAttr(draggingIdRef.current, false);
    }
    setPressingId(null);
    setDraggingId(null);
    setHoverTargetId(null);
    setHoverFolderCenterId(null);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingIdRef.current) return;
      setPointer({ x: e.clientX, y: e.clientY });
      setPlaceholderAttr(draggingIdRef.current, true);

      // Proportional auto-scroll near top/bottom edge (48px threshold §2-2)
      if (e.clientY < 48) {
        const speed = Math.max(4, Math.round(((48 - e.clientY) / 48) * 18));
        window.scrollBy(0, -speed);
      } else if (window.innerHeight - e.clientY < 48) {
        const dist = 48 - (window.innerHeight - e.clientY);
        const speed = Math.max(4, Math.round((dist / 48) * 18));
        window.scrollBy(0, speed);
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const sidebarProj = el?.closest('[data-sidebar-project-id]') as HTMLElement | null;
      if (sidebarProj && draggingTypeRef.current === 'document') {
        setHoverTargetId(null);
        setHoverFolderCenterId(null);
        return;
      }

      const cardEl = el?.closest('[data-sort-id]') as HTMLElement | null;
      if (cardEl) {
        const targetId = cardEl.getAttribute('data-sort-id');
        const targetKind = cardEl.getAttribute('data-sort-kind');
        if (targetId && targetId !== draggingIdRef.current) {
          // Document dragged over a Folder -> Folder drop move target
          if (
            targetKind === 'folder' &&
            draggingTypeRef.current === 'document' &&
            onDropIntoFolder
          ) {
            setHoverFolderCenterId(targetId);
            setHoverTargetId(null);
            return;
          }
          // Only allow reordering between items of the same kind (prevents folder/doc cross-jitter)
          if (!targetKind || targetKind === draggingTypeRef.current) {
            setHoverFolderCenterId(null);
            setHoverTargetId(targetId);
            return;
          }
        }
      }
      setHoverFolderCenterId(null);
      setHoverTargetId(null);
    };

    const onUp = (e: MouseEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const activeId = draggingIdRef.current;
      if (activeId) {
        setPlaceholderAttr(activeId, false);
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const sidebarProj = el?.closest('[data-sidebar-project-id]') as HTMLElement | null;
        if (sidebarProj && draggingTypeRef.current === 'document') {
          setForbiddenShakeId(activeId);
          setTimeout(() => setForbiddenShakeId(null), 300);
          onForbiddenDrop?.();
        } else if (hoverFolderCenterRef.current && onDropIntoFolder) {
          const playFlip = runFlipForSortItems(200);
          onDropIntoFolder(activeId, hoverFolderCenterRef.current);
          playFlip();
        } else if (hoverTargetRef.current) {
          const playFlip = runFlipForSortItems(200);
          onReorder(activeId, hoverTargetRef.current);
          playFlip();
        }
        wasDraggedRef.current = true;
        setTimeout(() => {
          wasDraggedRef.current = false;
        }, 80);
      }

      clearDrag();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (draggingIdRef.current || timerRef.current)) {
        clearDrag();
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [clearDrag, onReorder, onDropIntoFolder, onForbiddenDrop]);

  const startPress = (
    e: React.MouseEvent,
    id: string,
    kind: 'project' | 'folder' | 'document' | 'card' = 'card'
  ) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, select, a')) return;
    setPressingId(id);
    setPointer({ x: e.clientX, y: e.clientY });

    timerRef.current = setTimeout(() => {
      setPressingId(null);
      setDraggingId(id);
      setDraggingType(kind);
      setPlaceholderAttr(id, true);
    }, holdMs);
  };

  return {
    pressingId,
    draggingId,
    hoverTargetId,
    hoverFolderCenterId,
    forbiddenShakeId,
    pointer,
    wasDraggedRef,
    startPress,
  };
}
