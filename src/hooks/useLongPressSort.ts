import { useState, useRef, useEffect, useCallback } from 'react';

export interface LongPressDragOptions {
  holdMs?: number;
  onReorder: (fromId: string, toId: string) => void;
  onDropIntoFolder?: (docId: string, folderId: string) => void;
  onForbiddenDrop?: () => void;
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

  const clearDrag = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
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

      // Auto-scroll near top/bottom edge (48px threshold §2-2)
      if (e.clientY < 48) window.scrollBy(0, -10);
      else if (window.innerHeight - e.clientY < 48) window.scrollBy(0, 10);

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
          if (
            targetKind === 'folder' &&
            draggingTypeRef.current === 'document' &&
            onDropIntoFolder
          ) {
            const rect = cardEl.getBoundingClientRect();
            const inCenter =
              e.clientX > rect.left + rect.width * 0.22 &&
              e.clientX < rect.right - rect.width * 0.22 &&
              e.clientY > rect.top + rect.height * 0.2 &&
              e.clientY < rect.bottom - rect.height * 0.2;
            if (inCenter) {
              setHoverFolderCenterId(targetId);
              setHoverTargetId(null);
              return;
            }
          }
          setHoverFolderCenterId(null);
          setHoverTargetId(targetId);
          return;
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
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const sidebarProj = el?.closest('[data-sidebar-project-id]') as HTMLElement | null;
        if (sidebarProj && draggingTypeRef.current === 'document') {
          setForbiddenShakeId(activeId);
          setTimeout(() => setForbiddenShakeId(null), 300);
          onForbiddenDrop?.();
        } else if (hoverFolderCenterRef.current && onDropIntoFolder) {
          onDropIntoFolder(activeId, hoverFolderCenterRef.current);
        } else if (hoverTargetRef.current) {
          onReorder(activeId, hoverTargetRef.current);
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
