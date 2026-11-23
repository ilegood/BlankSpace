import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';

interface RefBoardItem {
  id: string;
  caption: string;
  sourceUrl: string;
  tags: string[];
  memo: string;
  imageUrl?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

const DEFAULT_REF_ITEMS: RefBoardItem[] = [
  { id: 'rf-1', caption: '이미지', sourceUrl: 'https://...', tags: ['태그 1'], memo: '', x: 32, y: 56, w: 220, h: 165, zIndex: 1 },
  { id: 'rf-2', caption: '이미지', sourceUrl: 'https://...', tags: [], memo: '', x: 268, y: 56, w: 160, h: 205, zIndex: 2 },
  { id: 'rf-3', caption: '이미지', sourceUrl: 'https://...', tags: [], memo: '', x: 444, y: 56, w: 185, h: 120, zIndex: 3 },
  { id: 'rf-4', caption: '이미지', sourceUrl: 'https://...', tags: [], memo: '', x: 646, y: 56, w: 120, h: 170, zIndex: 4 },
  { id: 'rf-5', caption: '이미지', sourceUrl: 'https://...', tags: ['태그 1', '태그 2'], memo: '', x: 268, y: 278, w: 160, h: 135, zIndex: 5 },
];

export const ReferenceBoardEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [items, setItems] = useState<RefBoardItem[]>(DEFAULT_REF_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>('rf-5');
  const [lightboxItem, setLightboxItem] = useState<RefBoardItem | null>(null);
  const [liveItem, setLiveItem] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const img = Array.from(files).find((f) => f.type.startsWith('image/'));
      if (!img) return;
      const r = new FileReader();
      r.onload = () => {
        if (typeof r.result === 'string') addImageFromDataUrl(r.result, '붙여넣은 이미지');
      };
      r.readAsDataURL(img);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.items)) {
          setItems(parsed.items);
          return;
        }
      } catch {
        // ignore
      }
    }
    setItems(DEFAULT_REF_ITEMS);
  }, [activePage?.id]);

  const persist = (next: RefBoardItem[]) => {
    setItems(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ items: next }) });
  };

  const selected = items.find((i) => i.id === selectedId) || null;

  const addImageFromDataUrl = (url: string, caption = '새 이미지') => {
    const ni: RefBoardItem = {
      id: `rf-${Date.now()}`,
      caption,
      sourceUrl: 'https://',
      tags: ['레퍼런스'],
      memo: '',
      imageUrl: url,
      x: 48 + (items.length % 4) * 28,
      y: 68 + (items.length % 4) * 28,
      w: 210,
      h: 160,
      zIndex: items.length + 1,
    };
    persist([...items, ni]);
    setSelectedId(ni.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '레퍼런스 보드 (템플릿)' : activeDocument?.title || '레퍼런스 보드'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="design-reference-board"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div
          onClick={() => setSelectedId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            if (!isEditMode) return;
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith('image/')) {
              const r = new FileReader();
              r.onload = () => typeof r.result === 'string' && addImageFromDataUrl(r.result, f.name);
              r.readAsDataURL(f);
            }
          }}
          className="flex-1 relative overflow-auto canvas-dot-grid p-4"
        >
          {isEditMode && (
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
              >
                + 이미지
              </button>
              <span className="text-xs text-[#8A8998]">붙여넣기나 끌어다 놓기로도 추가</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => typeof r.result === 'string' && addImageFromDataUrl(r.result, f.name);
                  r.readAsDataURL(f);
                }}
                className="hidden"
              />
            </div>
          )}

          <div data-export-root="true" className="relative min-w-[820px] min-h-[540px]">
            {[...items]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((item) => {
                const isSel = selectedId === item.id;
                const rx = liveItem?.id === item.id ? liveItem.x : item.x;
                const ry = liveItem?.id === item.id ? liveItem.y : item.y;
                const rw = liveItem?.id === item.id ? liveItem.w : item.w;
                const rh = liveItem?.id === item.id ? liveItem.h : item.h;

                const startDrag = (e: React.MouseEvent) => {
                  if (!isEditMode || e.button !== 0) return;
                  if ((e.target as HTMLElement).dataset?.resizeHandle) return;
                  e.stopPropagation();
                  setSelectedId(item.id);
                  const sx = e.clientX;
                  const sy = e.clientY;
                  const ox = item.x;
                  const oy = item.y;
                  let moved = false;
                  let fx = ox;
                  let fy = oy;

                  const onMove = (ev: MouseEvent) => {
                    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
                    moved = true;
                    fx = Math.max(8, Math.round(ox + ev.clientX - sx));
                    fy = Math.max(8, Math.round(oy + ev.clientY - sy));
                    setLiveItem({ id: item.id, x: fx, y: fy, w: item.w, h: item.h });
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    setLiveItem(null);
                    if (moved) persist(items.map((x) => (x.id === item.id ? { ...x, x: fx, y: fy } : x)));
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                };

                const startResize = (e: React.MouseEvent) => {
                  if (!isEditMode || e.button !== 0) return;
                  e.stopPropagation();
                  const sx = e.clientX;
                  const sy = e.clientY;
                  const ow = item.w;
                  const oh = item.h;
                  let fw = ow;
                  let fh = oh;
                  const onMove = (ev: MouseEvent) => {
                    fw = Math.max(96, Math.round(ow + ev.clientX - sx));
                    fh = Math.max(80, Math.round(oh + ev.clientY - sy));
                    setLiveItem({ id: item.id, x: item.x, y: item.y, w: fw, h: fh });
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    setLiveItem(null);
                    if (fw !== ow || fh !== oh) {
                      persist(items.map((x) => (x.id === item.id ? { ...x, w: fw, h: fh } : x)));
                    }
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                };

                return (
                  <div
                    key={item.id}
                    onMouseDown={startDrag}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isEditMode) setSelectedId(item.id);
                      else setLightboxItem(item);
                    }}
                    style={{
                      left: rx,
                      top: ry,
                      width: rw,
                      height: rh,
                      zIndex: item.zIndex,
                    }}
                    className={`absolute rounded-2xl bg-[#EBE8F5] dark:bg-[#262438] overflow-hidden flex items-end p-2.5 ${
                      isEditMode ? 'cursor-move' : 'cursor-pointer'
                    } ${
                      isSel && isEditMode ? 'ring-2 ring-[#6A5ACD]' : 'border border-[#DCD8EC] dark:border-[#35334C]'
                    }`}
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.caption}
                        className="bs-animate-fade absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <span className="relative z-10 px-2 py-0.5 rounded-md bg-white/85 dark:bg-[#1E1E29]/85 text-[10.5px] font-semibold">
                      {item.caption}
                    </span>
                    {isEditMode && isSel && (
                      <span
                        data-resize-handle="true"
                        onMouseDown={startResize}
                        className="absolute bottom-1 right-1 z-20 w-3 h-3 rounded-xs bg-white border-2 border-[#6A5ACD] cursor-nwse-resize"
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Inspector matching 수정사항.md: caption + image upload/replace, no sourceUrl or memo */}
        {isEditMode && selected && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-3.5 select-none text-xs">
            <div className="text-sm font-bold">항목 수정 · 이미지</div>
            <label className="flex items-center justify-between gap-2">
              <span>캡션</span>
              <input
                type="text"
                value={selected.caption}
                onChange={(e) =>
                  persist(items.map((i) => (i.id === selected.id ? { ...i, caption: e.target.value } : i)))
                }
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = () => {
                  const f = input.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => {
                    if (typeof r.result === 'string') {
                      persist(
                        items.map((i) =>
                          i.id === selected.id ? { ...i, imageUrl: r.result as string } : i
                        )
                      );
                    }
                  };
                  r.readAsDataURL(f);
                };
                input.click();
              }}
              className="h-8 px-3 rounded-xl bg-[#6A5ACD] text-white font-semibold hover:bg-[#5A49B8]"
            >
              이미지 업로드 / 교체
            </button>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const maxZ = Math.max(...items.map((i) => i.zIndex));
                  persist(items.map((i) => (i.id === selected.id ? { ...i, zIndex: maxZ + 1 } : i)));
                }}
                className="py-1.5 rounded-xl border border-[#E6E3F0] font-semibold"
              >
                맨 앞으로
              </button>
              <button
                type="button"
                onClick={() =>
                  persist(items.map((i) => (i.id === selected.id ? { ...i, zIndex: 0 } : i)))
                }
                className="py-1.5 rounded-xl border border-[#E6E3F0] font-semibold"
              >
                맨 뒤로
              </button>
              <button
                type="button"
                onClick={() => setLightboxItem(selected)}
                className="py-1.5 rounded-xl border border-[#E6E3F0] font-semibold"
              >
                원본 보기
              </button>
              <button
                type="button"
                onClick={() => {
                  persist(items.filter((i) => i.id !== selected.id));
                  setSelectedId(null);
                }}
                className="py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
              >
                삭제
              </button>
            </div>
          </aside>
        )}
      </div>

      {lightboxItem && (
        <div
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bs-animate-modal max-w-lg w-full rounded-2xl bg-white dark:bg-[#1E1E29] p-5 flex flex-col gap-3 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{lightboxItem.caption}</span>
              <button type="button" onClick={() => setLightboxItem(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64 rounded-xl bg-[#EBE8F5] dark:bg-[#2C2845] overflow-hidden flex items-center justify-center">
              {lightboxItem.imageUrl ? (
                <img src={lightboxItem.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-[#8A8998]">레퍼런스 이미지</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
