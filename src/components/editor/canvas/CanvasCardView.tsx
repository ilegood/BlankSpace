import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  ChevronLeft,
  X,
  Pipette,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { CanvasCardItem } from '../../../types';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';

interface SnapGuideLines {
  x: number[];
  y: number[];
}

interface CanvasCardViewProps {
  card: CanvasCardItem;
  allCards: CanvasCardItem[];
  isEditMode: boolean;
  isSelected: boolean;
  zoom?: number;
  isFlashing?: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<CanvasCardItem>) => void;
  onOpenDoc: (docId: string) => void;
  onSnapGuides?: (guides: SnapGuideLines) => void;
  fontClass?: string;
}

const MIN_CARD_W = 180;
const MIN_CARD_H = 76;

function parseRange(rangeStr?: string): [number, number] | null {
  if (!rangeStr) return null;
  const m = rangeStr.match(/(-?\d+(?:\.\d+)?)\s*[~\-]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function sampleColorAtPoint(clientX: number, clientY: number): string {
  const els = document.elementsFromPoint(clientX, clientY);
  for (const el of els) {
    if ((el as HTMLElement).dataset?.eyedropperOverlay) continue;
    if (el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0) {
      try {
        const rect = el.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.width = el.naturalWidth;
        canvas.height = el.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(el, 0, 0);
          const px = Math.floor(((clientX - rect.left) / Math.max(1, rect.width)) * el.naturalWidth);
          const py = Math.floor(((clientY - rect.top) / Math.max(1, rect.height)) * el.naturalHeight);
          const data = ctx.getImageData(
            Math.max(0, Math.min(el.naturalWidth - 1, px)),
            Math.max(0, Math.min(el.naturalHeight - 1, py)),
            1,
            1
          ).data;
          return rgbToHex(data[0], data[1], data[2]);
        }
      } catch {
        // cross-origin fallback
      }
    }
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) return rgbToHex(Number(m[1]), Number(m[2]), Number(m[3]));
    }
  }
  return '#6A5ACD';
}

export const CanvasCardView: React.FC<CanvasCardViewProps> = ({
  card,
  allCards,
  isEditMode,
  isSelected,
  zoom = 1,
  isFlashing = false,
  onSelect,
  onUpdate,
  onOpenDoc,
  onSnapGuides,
  fontClass = '',
}) => {
  const { documents, getDocumentStatus, restoreItems } = useWorkspace();
  const { showToast } = useToast();

  // Live drag / resize local rectangle so mousemove doesn't spam DB saves
  const [liveRect, setLiveRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [resizingSize, setResizingSize] = useState<{ w: number; h: number; clamped: boolean } | null>(
    null
  );

  // Lightbox & Swatch & Popover states
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeSwatchIdx, setActiveSwatchIdx] = useState<number | null>(null);
  const [hexDraft, setHexDraft] = useState('');
  const [eyedropper, setEyedropper] = useState<{
    idx: number;
    x: number;
    y: number;
    color: string;
  } | null>(null);

  // Zone / Link popovers
  const [unlinkedZoneTipId, setUnlinkedZoneTipId] = useState<string | null>(null);
  const [deletedDocNotice, setDeletedDocNotice] = useState<{
    docId: string;
    status: 'trashed' | 'deleted';
    label: string;
  } | null>(null);

  // Difficulty curve interactive drag state
  const [curveDragIdx, setCurveDragIdx] = useState<number | null>(null);
  const [curveLivePts, setCurveLivePts] = useState<
    { step: number; actual: number; target: number }[] | null
  >(null);
  const [formulaLockTip, setFormulaLockTip] = useState(false);
  const svgCurveRef = useRef<SVGSVGElement | null>(null);

  // Animation preview playback
  const [animPlaying, setAnimPlaying] = useState(false);
  const [animFrame, setAnimFrame] = useState(0);

  // Texture Lightbox keyboard navigation & ESC
  useEffect(() => {
    if (lightboxIdx === null) return;
    const maps: any[] = card.data?.maps || [];
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      else if (e.key === 'ArrowLeft' && maps.length > 0) {
        setLightboxIdx((prev) => (prev === null ? null : (prev - 1 + maps.length) % maps.length));
      } else if (e.key === 'ArrowRight' && maps.length > 0) {
        setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % maps.length));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIdx, card.data?.maps]);

  // Eyedropper Escape cancel
  useEffect(() => {
    if (!eyedropper) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEyedropper(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [eyedropper]);

  // Animation playback loop
  useEffect(() => {
    if (!animPlaying) return;
    const totalFrames = Math.max(1, Number(card.data?.frames ?? 24));
    const durationMs = Math.max(200, Number(card.data?.durationSec ?? 1) * 1000);
    const intervalMs = Math.max(24, durationMs / totalFrames);
    const timer = window.setInterval(() => {
      setAnimFrame((prev) => {
        const next = prev + 1;
        if (next >= totalFrames) {
          if (!card.data?.loop) {
            setAnimPlaying(false);
            return 0;
          }
          return 0;
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [animPlaying, card.data?.frames, card.data?.durationSec, card.data?.loop]);

  const startDrag = (e: React.MouseEvent) => {
    if (!isEditMode || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, select, [data-no-card-drag]')) {
      return;
    }
    e.stopPropagation();
    onSelect();

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = card.x;
    const origY = card.y;
    const origW = card.w;
    const origH = card.h;
    let moved = false;
    let finalX = origX;
    let finalY = origY;

    const others = allCards.filter((c) => c.id !== card.id);

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
      moved = true;

      let nx = Math.max(8, Math.round(origX + dx));
      let ny = Math.max(8, Math.round(origY + dy));
      const guidesX: number[] = [];
      const guidesY: number[] = [];

      // 8px magnetic snap unless Alt held
      if (!ev.altKey) {
        const SNAP = 8;
        for (const o of others) {
          if (Math.abs(nx - o.x) <= SNAP) {
            nx = o.x;
            guidesX.push(o.x);
          } else if (Math.abs(nx + origW - (o.x + o.w)) <= SNAP) {
            nx = o.x + o.w - origW;
            guidesX.push(o.x + o.w);
          } else if (Math.abs(nx - (o.x + o.w + 16)) <= SNAP) {
            nx = o.x + o.w + 16;
            guidesX.push(o.x + o.w + 16);
          }

          if (Math.abs(ny - o.y) <= SNAP) {
            ny = o.y;
            guidesY.push(o.y);
          } else if (Math.abs(ny + origH - (o.y + o.h)) <= SNAP) {
            ny = o.y + o.h - origH;
            guidesY.push(o.y + o.h);
          }
        }
      }

      finalX = nx;
      finalY = ny;
      setLiveRect({ x: nx, y: ny, w: origW, h: origH });
      onSnapGuides?.({ x: guidesX, y: guidesY });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setLiveRect(null);
      onSnapGuides?.({ x: [], y: [] });
      if (moved && (finalX !== origX || finalY !== origY)) {
        onUpdate({ x: finalX, y: finalY });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startResize = (e: React.MouseEvent) => {
    if (!isEditMode || e.button !== 0) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const origW = card.w;
    const origH = card.h;
    const ratio = origW / Math.max(1, origH);
    let finalW = origW;
    let finalH = origH;

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let nextW = Math.round(origW + dx);
      let nextH = Math.round(origH + dy);
      if (ev.shiftKey) {
        nextH = Math.round(nextW / ratio);
      }
      const clampedW = Math.max(MIN_CARD_W, nextW);
      const clampedH = Math.max(MIN_CARD_H, nextH);
      const clamped = clampedW !== nextW || clampedH !== nextH;

      finalW = clampedW;
      finalH = clampedH;
      setLiveRect({ x: card.x, y: card.y, w: clampedW, h: clampedH });
      setResizingSize({ w: clampedW, h: clampedH, clamped });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setLiveRect(null);
      setResizingSize(null);
      if (finalW !== origW || finalH !== origH) {
        onUpdate({ w: finalW, h: finalH });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const openLinkedDocSafely = (docId: string, label: string) => {
    const status = getDocumentStatus(docId);
    if (status === 'active') {
      onOpenDoc(docId);
    } else {
      setDeletedDocNotice({ docId, status, label });
    }
  };

  const renderCardBody = () => {
    const d = card.data || {};

    switch (card.type) {
      case 'profile-card':
        return (
          <div className="flex flex-col gap-3 h-full">
            <div className="flex-1 min-h-[140px] rounded-xl bg-[#EBE8F5] dark:bg-[#2B2844] overflow-hidden flex items-center justify-center">
              {d.imageUrl ? (
                <img
                  src={d.imageUrl}
                  alt={d.name}
                  className="bs-animate-fade w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] text-[#8A8998]">프로필 이미지</span>
              )}
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                {d.name || '캐릭터 이름'}
              </div>
              <div className="text-xs text-[#8A8998] mt-0.5">{d.nickname || '별명'}</div>
            </div>
          </div>
        );

      case 'stat-card': {
        const stats: { id: string; label: string; value: number }[] = d.stats || [];
        const mode = d.mode || 'bar';

        if (mode === 'radar') {
          const cx = 60;
          const cy = 54;
          const r = 38;
          const count = Math.max(3, stats.length);
          const pts = Array.from({ length: count }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
            const val = Math.min(100, Math.max(10, stats[i]?.value ?? 60)) / 100;
            return `${cx + Math.cos(angle) * r * val},${cy + Math.sin(angle) * r * val}`;
          });
          const outerPts = Array.from({ length: count }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          });

          return (
            <div className="bs-animate-fade flex flex-col items-center justify-center gap-1 pt-1">
              <svg width="120" height="106" viewBox="0 0 120 106">
                <polygon
                  points={outerPts.join(' ')}
                  fill="#F3F1FB"
                  stroke="#D9D5EC"
                  strokeWidth="1.5"
                />
                <polygon
                  points={pts.join(' ')}
                  fill="rgba(106,90,205,0.28)"
                  stroke="#6A5ACD"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
              </svg>
              <span className="text-[11px] text-[#8A8998]">항목과 수치 사용자 지정</span>
            </div>
          );
        }

        return (
          <div className="bs-animate-fade flex flex-col gap-2.5 pt-1">
            {stats.map((st) => (
              <div key={st.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#4E4D59] dark:text-[#C5C3D4]">{st.label}</span>
                  <span className="font-bold text-[#6A5ACD] dark:text-[#9A8FE6] tabular-nums">
                    {st.value}
                  </span>
                </div>
                {mode !== 'number' && (
                  <div className="h-2 rounded-full bg-[#EBE8F5] dark:bg-[#2B2844] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6A5ACD] transition-[width] duration-200 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, st.value))}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }

      case 'narrative-card':
        return (
          <div className="flex flex-col gap-1.5">
            {d.subtitle && (
              <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">{d.subtitle}</div>
            )}
            <p className="text-xs leading-relaxed text-[#4E4D59] dark:text-[#B4B2C4] whitespace-pre-wrap">
              {d.text || '내용을 입력하세요.'}
            </p>
          </div>
        );

      case 'tag-card':
        return (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(d.tags || []).map((t: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] text-[11.5px] font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        );

      case 'relationship-card':
        return (
          <div className="flex flex-col divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
            {(d.items || []).map((item: any) => {
              const target = documents.find((doc) => doc.id === item.targetDocId);
              const status = item.targetDocId ? getDocumentStatus(item.targetDocId) : 'active';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    if (!isEditMode && item.targetDocId) {
                      e.stopPropagation();
                      openLinkedDocSafely(item.targetDocId, target?.title || item.name);
                    }
                  }}
                  className="py-2 flex items-center justify-between gap-2 text-left text-xs hover:opacity-80"
                >
                  <span
                    className={`truncate font-semibold ${
                      status !== 'active'
                        ? 'line-through text-[#8A8998]'
                        : 'text-[#1B1B1F] dark:text-[#F1F0F6]'
                    }`}
                  >
                    {target?.title || item.name}
                  </span>
                  <span className="text-[11px] text-[#8A8998] shrink-0">{item.relation}</span>
                </button>
              );
            })}
          </div>
        );

      case 'image-card':
        return (
          <div className="flex flex-col gap-2 h-full">
            <div className="flex-1 min-h-[100px] rounded-xl bg-[#EBE8F5] dark:bg-[#2B2844] overflow-hidden flex items-center justify-center">
              {d.imageUrl ? (
                <img
                  src={d.imageUrl}
                  alt={d.caption || ''}
                  className="bs-animate-fade w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] text-[#8A8998]">이미지</span>
              )}
            </div>
            {d.caption && <span className="text-[11px] text-[#8A8998]">{d.caption}</span>}
          </div>
        );

      case 'link-preview-card': {
        const linked = documents.find((doc) => doc.id === d.targetDocId);
        const status = d.targetDocId ? getDocumentStatus(d.targetDocId) : 'active';
        return (
          <div className="flex flex-col gap-2.5 h-full relative">
            <div className="flex-1 min-h-[70px] rounded-xl bg-[#EBE8F5] dark:bg-[#2B2844] flex items-center justify-center">
              {status !== 'active' && (
                <span className="text-[10.5px] font-semibold text-rose-500">
                  {status === 'trashed' ? '휴지통에 있음' : '삭제됨'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold truncate ${
                  status !== 'active'
                    ? 'line-through text-[#8A8998]'
                    : 'text-[#1B1B1F] dark:text-[#F1F0F6]'
                }`}
              >
                {linked?.title || d.targetDocTitle || '연결된 문서 이름'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD]">
                {d.docLabel || '문서'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                if (!isEditMode && d.targetDocId) {
                  e.stopPropagation();
                  openLinkedDocSafely(
                    d.targetDocId,
                    linked?.title || d.targetDocTitle || '연결된 문서'
                  );
                }
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] dark:text-[#9A8FE6] hover:underline"
            >
              문서 열기 ›
            </button>
          </div>
        );
      }

      case 'hierarchy-card':
        return (
          <div className="flex flex-col gap-1.5 pt-1 text-xs">
            {(d.items || []).map((it: any) => (
              <div
                key={it.id}
                style={{ paddingLeft: `${(it.level || 0) * 14}px` }}
                className={`${
                  it.level === 0
                    ? 'font-bold text-[#1B1B1F] dark:text-[#F1F0F6]'
                    : 'text-[#555464] dark:text-[#B4B2C4]'
                }`}
              >
                {it.label}
              </div>
            ))}
          </div>
        );

      case 'category-list-card':
        return (
          <div className="flex flex-col gap-2.5 pt-1 text-xs">
            {(d.categories || []).map((cat: any) => (
              <div key={cat.id} className="flex flex-col gap-1">
                <div className="font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">{cat.name}</div>
                {(cat.items || []).map((txt: string, idx: number) => (
                  <div key={idx} className="pl-3 text-[#6E6D7A] dark:text-[#9E9CAF]">
                    {txt}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case 'zone-card':
        return (
          <div className="flex flex-col gap-2.5 pt-1 relative">
            <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              {d.zoneTitle || '구역 제목'}
            </div>
            <div className="flex flex-wrap gap-2">
              {(d.places || []).map((p: any) => {
                const isLinked = Boolean(p.linkedDocId);
                return (
                  <div key={p.id} className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        if (!isEditMode) {
                          e.stopPropagation();
                          if (p.linkedDocId) {
                            openLinkedDocSafely(p.linkedDocId, p.label);
                          } else {
                            setUnlinkedZoneTipId(unlinkedZoneTipId === p.id ? null : p.id);
                            window.setTimeout(() => setUnlinkedZoneTipId(null), 2000);
                          }
                        }
                      }}
                      className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all ${
                        isLinked
                          ? 'bg-[#6A5ACD] text-white hover:bg-[#5A49B8]'
                          : 'border border-[#DCD8EC] dark:border-[#3A3850] text-[#4E4D59] dark:text-[#B4B2C4] hover:border-[#B6ACEA]'
                      }`}
                    >
                      {p.label}
                    </button>
                    {unlinkedZoneTipId === p.id && (
                      <div className="bs-animate-popover absolute left-0 top-9 z-40 whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#1B1B1F] text-white text-[10.5px] shadow-lg">
                        연결된 문서가 없습니다
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'chronicle-card':
        return (
          <div className="flex flex-col gap-2.5 pt-1">
            {(d.events || []).map((ev: any) => (
              <div key={ev.id} className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#6A5ACD] mt-1.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-semibold text-[#6A5ACD] dark:text-[#9A8FE6]">
                    {ev.time}
                  </div>
                  <div className="text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]">
                    {ev.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'section-heading':
        return (
          <div className="flex flex-col justify-center h-full">
            <div className="text-[16px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              {d.heading || '제목'}
            </div>
            {d.subheading && <div className="text-xs text-[#8A8998]">{d.subheading}</div>}
          </div>
        );

      case 'swot-card':
        return (
          <div className="grid grid-cols-2 gap-2 pt-1 h-[calc(100%-24px)]">
            {[
              { key: 'strength', label: '강점', val: d.strength },
              { key: 'weakness', label: '약점', val: d.weakness },
              { key: 'opportunity', label: '기회', val: d.opportunity },
              { key: 'threat', label: '위협', val: d.threat },
            ].map((q) => (
              <div
                key={q.key}
                className="rounded-xl bg-[#F8F7FC] dark:bg-[#262436] p-2.5 flex flex-col gap-1"
              >
                <span className="text-[11px] font-bold text-[#6A5ACD] dark:text-[#9A8FE6]">
                  {q.label}
                </span>
                <span className="text-[11px] text-[#555464] dark:text-[#B4B2C4] line-clamp-2">
                  {q.val || '내용 입력'}
                </span>
              </div>
            ))}
          </div>
        );

      case 'rule-card':
        return (
          <div className="flex flex-col gap-1.5 pt-1 text-xs">
            <div className="font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">{d.ruleName}</div>
            <div className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
              <span className="text-[#8A8998]">조건</span>
              <span>{d.condition}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
              <span className="text-[#8A8998]">결과</span>
              <span>{d.result}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#8A8998]">예외</span>
              <span>{d.exception}</span>
            </div>
          </div>
        );

      case 'formula-card': {
        const valA = Number(d.varA || 0);
        const valB = Number(d.varB || 0);
        const rangeA = parseRange(d.varARange);
        const rangeB = parseRange(d.varBRange);
        const aOut = rangeA ? valA < rangeA[0] || valA > rangeA[1] : false;
        const bOut = rangeB ? valB < rangeB[0] || valB > rangeB[1] : false;
        const result = Number((valA * valB).toFixed(2));
        return (
          <div className="flex flex-col gap-2 pt-1 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-[#F6F5FB] dark:bg-[#262436] font-mono text-[11.5px] text-[#1B1B1F] dark:text-[#F1F0F6]">
              {d.formulaText || '결과 = 변수 A × 변수 B'}
            </div>
            <div className="grid grid-cols-3 text-[11px] text-[#8A8998] px-1">
              <span>변수</span>
              <span>값</span>
              <span className="text-right">범위</span>
            </div>
            <div className="grid grid-cols-3 text-xs px-1 items-center">
              <span>변수 A</span>
              <span className={`font-semibold ${aOut ? 'text-amber-600' : ''}`}>
                {d.varA}
                {aOut && ' ⚠'}
              </span>
              <span className="text-right text-[#8A8998]">{d.varARange}</span>
            </div>
            <div className="grid grid-cols-3 text-xs px-1 items-center">
              <span>변수 B</span>
              <span className={`font-semibold ${bOut ? 'text-amber-600' : ''}`}>
                {d.varB}
                {bOut && ' ⚠'}
              </span>
              <span className="text-right text-[#8A8998]">{d.varBRange}</span>
            </div>
            {(aOut || bOut) && (
              <div className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10.5px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                허용 범위를 벗어난 변수가 있습니다
              </div>
            )}
            <div className="mt-1 px-3 py-1.5 rounded-lg bg-[#EBE8F5] dark:bg-[#2C2845] flex items-center justify-between font-bold text-[#6A5ACD] dark:text-[#9A8FE6]">
              <span>계산 결과</span>
              <span className="tabular-nums">{result}</span>
            </div>
          </div>
        );
      }

      case 'difficulty-curve-card': {
        const linkedFormula = allCards.find((c) => c.id === d.linkedFormulaId);
        const basePts: { step: number; actual: number; target: number }[] =
          curveLivePts || d.points || [];
        const formulaFactor = linkedFormula ? Number(linkedFormula.data?.varB || 1) : 1;
        const isFormulaLocked = d.actualSource === 'formula' && Boolean(linkedFormula);
        const computedPts = basePts.map((p, idx) => ({
          ...p,
          actual: isFormulaLocked
            ? Math.round((idx + 1) * Number(linkedFormula?.data?.varA || 8) * formulaFactor * 0.45)
            : p.actual,
        }));
        const maxY = Math.max(100, ...computedPts.map((p) => Math.max(p.actual, p.target)));
        const w = 320;
        const h = 115;
        const toX = (i: number) => 22 + (i / Math.max(1, computedPts.length - 1)) * (w - 40);
        const toY = (v: number) => h - 18 - (v / maxY) * (h - 32);

        const startPointDrag = (idx: number, e: React.MouseEvent) => {
          e.stopPropagation();
          if (!isEditMode) return;
          if (isFormulaLocked) {
            setFormulaLockTip(true);
            window.setTimeout(() => setFormulaLockTip(false), 1800);
            return;
          }
          const svgEl = svgCurveRef.current;
          if (!svgEl) return;

          setCurveDragIdx(idx);
          let latestPts = [...basePts];

          const onMove = (ev: MouseEvent) => {
            const rect = svgEl.getBoundingClientRect();
            const relY = ((ev.clientY - rect.top) / Math.max(1, rect.height)) * h;
            const norm = 1 - (relY - 14) / Math.max(1, h - 32);
            const nextVal = Math.max(0, Math.min(maxY, Math.round(norm * maxY)));
            latestPts = latestPts.map((pt, i) => (i === idx ? { ...pt, actual: nextVal } : pt));
            setCurveLivePts(latestPts);
          };

          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            setCurveDragIdx(null);
            setCurveLivePts(null);
            onUpdate({ data: { ...d, points: latestPts } });
          };

          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        };

        return (
          <div className="flex flex-col gap-1.5 pt-1 relative" data-no-card-drag>
            <svg
              ref={svgCurveRef}
              viewBox={`0 0 ${w} ${h}`}
              className="w-full h-28 overflow-visible"
            >
              <line x1="20" y1="10" x2="20" y2={h - 16} stroke="#DCD8EC" />
              <line x1="20" y1={h - 16} x2={w - 10} y2={h - 16} stroke="#DCD8EC" />
              <polyline
                fill="none"
                stroke="#C97B2A"
                strokeWidth="1.75"
                strokeDasharray="4 3"
                points={computedPts.map((p, i) => `${toX(i)},${toY(p.target)}`).join(' ')}
              />
              <polyline
                fill="none"
                stroke="#6A5ACD"
                strokeWidth="2.2"
                points={computedPts.map((p, i) => `${toX(i)},${toY(p.actual)}`).join(' ')}
              />
              {computedPts.map((p, i) => (
                <React.Fragment key={p.step}>
                  <circle cx={toX(i)} cy={toY(p.target)} r="2.8" fill="#C97B2A" />
                  <circle
                    cx={toX(i)}
                    cy={toY(p.actual)}
                    r={curveDragIdx === i ? '5.5' : isEditMode ? '4.5' : '3.2'}
                    fill="#6A5ACD"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    className={isEditMode ? (isFormulaLocked ? 'cursor-not-allowed' : 'cursor-ns-resize') : ''}
                    onMouseDown={(e) => startPointDrag(i, e)}
                  />
                </React.Fragment>
              ))}
            </svg>

            {curveDragIdx !== null && computedPts[curveDragIdx] && (
              <div className="absolute top-1 right-1 px-2 py-0.5 rounded-md bg-[#1B1B1F] text-white text-[10px] font-semibold">
                {curveDragIdx + 1}단계: {computedPts[curveDragIdx].actual}
              </div>
            )}

            {formulaLockTip && (
              <div className="bs-animate-popover bs-animate-shake absolute top-1 left-1 px-2 py-0.5 rounded-md bg-[#6A5ACD] text-white text-[10px] font-semibold">
                공식에서 자동 계산됨
              </div>
            )}

            <div className="flex items-center justify-between text-[10.5px] text-[#6E6D7A] dark:text-[#9E9CAF]">
              <div className="flex items-center gap-3">
                <span className="text-[#6A5ACD] font-semibold">■ 실측</span>
                <span className="text-[#C97B2A] font-semibold">● 목표</span>
              </div>
              {isFormulaLocked && (
                <span className="text-[10px] text-[#6A5ACD] font-medium">공식 연동 중</span>
              )}
            </div>
          </div>
        );
      }

      case 'detail-card':
        return (
          <div className="flex flex-col divide-y divide-[#F0EEF7] dark:divide-[#2A2938] text-xs">
            {(d.items || []).map((it: any) => (
              <div key={it.id} className="py-1.5 flex items-center justify-between gap-2">
                <span className="font-medium text-[#1B1B1F] dark:text-[#F1F0F6]">{it.label}</span>
                <span className="text-[#8A8998]">{it.value}</span>
              </div>
            ))}
          </div>
        );

      case 'palette-card': {
        const colors: string[] = d.colors || [];
        return (
          <div className="relative pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {colors.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditMode) {
                      setActiveSwatchIdx(activeSwatchIdx === idx ? null : idx);
                      setHexDraft(c);
                    }
                  }}
                  title={c}
                  className={`w-8 h-8 rounded-lg border border-black/10 transition-transform ${
                    activeSwatchIdx === idx ? 'ring-2 ring-[#6A5ACD] scale-105' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {isEditMode && activeSwatchIdx !== null && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="bs-animate-popover mt-2 p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] shadow-lg flex items-center gap-1.5 flex-wrap"
              >
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(hexDraft) ? hexDraft : '#6A5ACD'}
                  onChange={(e) => setHexDraft(e.target.value.toUpperCase())}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={hexDraft}
                  onChange={(e) => setHexDraft(e.target.value)}
                  className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C] text-xs font-mono"
                />
                <button
                  type="button"
                  title="화면에서 색상 추출 (스포이트)"
                  onClick={() => {
                    setEyedropper({
                      idx: activeSwatchIdx,
                      x: window.innerWidth / 2,
                      y: window.innerHeight / 2,
                      color: colors[activeSwatchIdx] || '#6A5ACD',
                    });
                  }}
                  className="w-7 h-7 rounded-lg border border-[#E6E3F0] dark:border-[#323244] flex items-center justify-center text-[#6A5ACD] hover:bg-[#F3F1FB]"
                >
                  <Pipette className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prevColors = [...colors];
                    const targetIdx = activeSwatchIdx;
                    const next = [...colors];
                    next[targetIdx] = hexDraft;
                    onUpdate({ data: { ...d, colors: next } });
                    setActiveSwatchIdx(null);
                    showToast('팔레트 색상을 변경했습니다', {
                      onUndo: () => onUpdate({ data: { ...d, colors: prevColors } }),
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#6A5ACD] text-white text-[11px] font-semibold"
                >
                  적용
                </button>
              </div>
            )}

            {/* Eyedropper Magnifier Overlay (§5-3) */}
            {eyedropper && (
              <div
                data-eyedropper-overlay="true"
                onMouseMove={(ev) => {
                  const sampled = sampleColorAtPoint(ev.clientX, ev.clientY);
                  setEyedropper((prev) =>
                    prev ? { ...prev, x: ev.clientX, y: ev.clientY, color: sampled } : null
                  );
                }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  const sampled = sampleColorAtPoint(ev.clientX, ev.clientY);
                  const prevColors = [...colors];
                  const targetIdx = eyedropper.idx;
                  const next = [...colors];
                  next[targetIdx] = sampled;
                  onUpdate({ data: { ...d, colors: next } });
                  setHexDraft(sampled);
                  setEyedropper(null);
                  setActiveSwatchIdx(null);
                  showToast(`색상 ${sampled}을 추출했습니다`, {
                    onUndo: () => onUpdate({ data: { ...d, colors: prevColors } }),
                  });
                }}
                className="fixed inset-0 z-[200] cursor-crosshair"
              >
                <div
                  style={{ left: eyedropper.x + 18, top: eyedropper.y + 18 }}
                  className="fixed w-24 h-24 rounded-full border-4 border-white shadow-2xl pointer-events-none flex flex-col items-center justify-end pb-2 overflow-hidden"
                >
                  <div className="absolute inset-0" style={{ backgroundColor: eyedropper.color }} />
                  <div className="relative z-10 w-3 h-3 border border-white/90 rounded-xs mb-3" />
                  <span className="relative z-10 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
                    {eyedropper.color}
                  </span>
                </div>
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#1B1B1F]/90 text-white text-xs shadow-lg pointer-events-none">
                  클릭하여 색상 추출 · ESC로 취소
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'turnaround-card':
        return (
          <div className="grid grid-cols-4 gap-2 pt-1 h-[calc(100%-24px)]">
            {(d.views || []).map((v: any) => (
              <div key={v.id} className="flex flex-col items-center gap-1 h-full">
                <div className="flex-1 w-full rounded-xl bg-[#EBE8F5] dark:bg-[#2B2844] overflow-hidden flex items-center justify-center">
                  {v.url && (
                    <img src={v.url} alt={v.label} className="bs-animate-fade w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-[11px] text-[#6E6D7A] dark:text-[#9E9CAF]">{v.label}</span>
              </div>
            ))}
          </div>
        );

      case 'texture-map-card': {
        const maps: any[] = d.maps || [];
        return (
          <div className="flex flex-col gap-1.5 pt-1">
            <div
              className={`grid gap-2 ${
                d.displayMode === 'grid' ? 'grid-cols-3' : 'grid-cols-6'
              }`}
            >
              {maps.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(idx);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div
                    className="w-full aspect-square rounded-xl border border-black/10 group-hover:ring-2 group-hover:ring-[#6A5ACD] transition-all"
                    style={{
                      backgroundColor: m.color || '#9A8FE6',
                      backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 3px, transparent 3px 6px)',
                    }}
                  />
                  <span className="text-[10.5px] text-[#6E6D7A] dark:text-[#9E9CAF] truncate max-w-full">
                    {m.name}
                  </span>
                </button>
              ))}
            </div>
            <span className="text-[10.5px] text-[#8A8998]">
              맵을 누르면 크게 볼 수 있습니다 · ← / → 로 전환
            </span>

            {lightboxIdx !== null && maps[lightboxIdx] && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIdx(null);
                }}
                className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="bs-animate-modal w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E29] p-5 shadow-2xl flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#1B1B1F] dark:text-white">
                        {maps[lightboxIdx].name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#EBE8F5] text-[#6A5ACD] font-semibold">
                        {maps[lightboxIdx].resolution}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLightboxIdx(null)}
                      className="p-1 text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setLightboxIdx((lightboxIdx - 1 + maps.length) % maps.length)}
                      className="w-8 h-8 rounded-lg border border-[#E6E3F0] dark:border-[#323244] flex items-center justify-center hover:border-[#6A5ACD]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div
                      className="w-64 h-64 rounded-xl border border-black/10 transition-colors duration-200"
                      style={{ backgroundColor: maps[lightboxIdx].color || '#787BFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxIdx((lightboxIdx + 1) % maps.length)}
                      className="w-8 h-8 rounded-lg border border-[#E6E3F0] dark:border-[#323244] flex items-center justify-center hover:border-[#6A5ACD]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between text-xs text-[#8A8998]">
                    <span>{maps[lightboxIdx].fileName}</span>
                    <span>
                      {lightboxIdx + 1} / {maps.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'animation-card': {
        const totalFrames = Math.max(1, Number(d.frames ?? 24));
        const pct = ((animFrame % totalFrames) / totalFrames) * 100;
        return (
          <div className="flex flex-col gap-2 text-xs">
            <div className="relative h-24 rounded-xl bg-[#EBE8F5] dark:bg-[#2B2844] flex items-center justify-center overflow-hidden">
              <div
                className="w-6 h-6 rounded-lg bg-[#9A8FE6]/60 transition-transform duration-100"
                style={{
                  transform: animPlaying
                    ? `translateX(${Math.sin((animFrame / totalFrames) * Math.PI * 2) * 32}px) scale(${1 + 0.1 * Math.cos((animFrame / totalFrames) * Math.PI * 4)})`
                    : undefined,
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAnimPlaying((p) => !p);
                }}
                className="absolute w-9 h-9 rounded-full bg-[#6A5ACD] hover:bg-[#5A49B8] text-white flex items-center justify-center shadow"
              >
                {animPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
              </button>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-black/10">
                <div className="h-full bg-[#6A5ACD]" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              <span>{d.name || '대기'}</span>
              <span className="text-[10.5px] font-mono text-[#6A5ACD]">
                {animFrame + 1}/{totalFrames}f
              </span>
            </div>
            <div className="flex justify-between text-[11px] border-t border-[#F0EEF7] dark:border-[#2A2938] pt-1">
              <span className="text-[#8A8998]">길이</span>
              <span>{d.durationSec ?? 1.0}초 · {d.loop ? '반복' : '1회'}</span>
            </div>
          </div>
        );
      }

      case 'frame-strip-card':
        return (
          <div className="grid grid-cols-7 gap-2 pt-1 h-[calc(100%-24px)]">
            {Array.from({ length: d.frameCount || 7 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-[#EBE8F5] dark:bg-[#2B2844] min-h-[48px]" />
            ))}
          </div>
        );

      case 'file-card':
        return (
          <div className="flex flex-col divide-y divide-[#F0EEF7] dark:divide-[#2A2938] text-xs">
            {(d.files || []).map((f: any) => (
              <div key={f.id} className="py-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] text-[10px] font-semibold">
                    파일
                  </span>
                  <span className="truncate font-medium">{f.name}</span>
                </div>
                <span className="text-[#8A8998] shrink-0">{f.size}</span>
              </div>
            ))}
          </div>
        );

      case 'checklist-card':
        return (
          <div className="flex flex-col gap-1.5 pt-1 text-xs">
            {(d.items || []).map((it: any) => (
              <label
                key={it.id}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean(it.done)}
                  disabled={!isEditMode}
                  onChange={() => {
                    const next = (d.items || []).map((x: any) =>
                      x.id === it.id ? { ...x, done: !x.done } : x
                    );
                    onUpdate({ data: { ...d, items: next } });
                  }}
                  className="accent-[#6A5ACD] w-3.5 h-3.5 rounded"
                />
                <span className={it.done ? 'line-through text-[#8A8998]' : ''}>{it.text}</span>
              </label>
            ))}
          </div>
        );

      case 'quote-card':
        return (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="text-xl leading-none text-[#9A8FE6] font-serif">“</div>
            <p className="text-xs text-[#4E4D59] dark:text-[#B4B2C4] italic">{d.quote}</p>
            <span className="text-[11px] text-[#8A8998]">— {d.source || '출처'}</span>
          </div>
        );

      case 'table-card': {
        const headers: string[] = d.headers || [];
        const rows: string[][] = d.rows || [];
        return (
          <div className="flex flex-col gap-1.5 pt-1 overflow-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#E6E3F0] dark:border-[#2E2D3D]">
                  {headers.map((h, i) => (
                    <th key={i} className="py-1 px-1.5 text-left font-bold">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => {
                            const next = headers.map((v, idx) => (idx === i ? e.target.value : v));
                            onUpdate({ data: { ...d, headers: next } });
                          }}
                          className="w-full bg-transparent font-bold focus:outline-none focus:border-b focus:border-[#6A5ACD]"
                        />
                      ) : (
                        h
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[#F0EEF7] dark:border-[#2A2938]">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-1 px-1.5 text-[#555464] dark:text-[#B4B2C4]">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const nextRows = rows.map((r, ri) =>
                                ri === rIdx
                                  ? r.map((cv, ci) => (ci === cIdx ? e.target.value : cv))
                                  : r
                              );
                              onUpdate({ data: { ...d, rows: nextRows } });
                            }}
                            className="w-full bg-transparent focus:outline-none focus:border-b focus:border-[#6A5ACD]"
                          />
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {isEditMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const emptyRow = headers.map(() => '');
                  onUpdate({ data: { ...d, rows: [...rows, emptyRow] } });
                }}
                className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#6A5ACD] hover:underline self-start"
              >
                <Plus className="w-3 h-3" />
                행 추가
              </button>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="text-xs text-[#8A8998] pt-1">
            {d.text || d.fileName || d.url || card.title}
          </div>
        );
    }
  };

  const renderRect = liveRect || { x: card.x, y: card.y, w: card.w, h: card.h };

  return (
    <div
      onMouseDown={startDrag}
      onClick={(e) => {
        e.stopPropagation();
        if (isEditMode) onSelect();
      }}
      style={{
        left: renderRect.x,
        top: renderRect.y,
        width: renderRect.w,
        height: card.collapsed ? 44 : renderRect.h,
        borderRadius: `${card.style?.borderRadius ?? 12}px`,
        borderWidth: `${card.style?.borderWidth ?? (isSelected && isEditMode ? 2 : 1)}px`,
        padding: `${card.style?.padding ?? 14}px`,
      }}
      className={`absolute bg-white dark:bg-[#1E1E29] border transition-shadow flex flex-col overflow-hidden ${fontClass} ${
        isFlashing ? 'bs-animate-flash' : ''
      } ${
        isSelected && isEditMode
          ? 'border-[#6A5ACD] shadow-md z-20'
          : 'border-[#E6E3F0] dark:border-[#2E2D3D] shadow-2xs z-10'
      } ${isEditMode ? 'cursor-move' : 'cursor-default'}`}
    >
      {/* Card Header */}
      {card.type !== 'section-heading' && (
        <div className="flex items-center justify-between gap-2 shrink-0 mb-1.5">
          <span className="text-[11px] font-medium text-[#8A8998] dark:text-[#8E8C9F] truncate">
            {card.title}
            {card.collapsed ? ' (접힘)' : ''}
          </span>
          {card.collapsible && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({ collapsed: !card.collapsed });
              }}
              className="p-0.5 rounded text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white"
            >
              {card.collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Smooth collapsible body */}
      <div className="bs-collapse-grid flex-1 min-h-0" data-open={card.collapsed ? 'false' : 'true'}>
        <div className="bs-collapse-inner h-full overflow-hidden">{renderCardBody()}</div>
      </div>

      {/* Trashed / Deleted target doc popover */}
      {deletedDocNotice && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bs-animate-popover absolute inset-x-2 bottom-2 z-40 rounded-xl bg-white dark:bg-[#1E1E29] border border-rose-300 dark:border-rose-800 p-2.5 shadow-xl flex flex-col gap-1.5 text-[11px]"
        >
          <div className="font-semibold text-[#1B1B1F] dark:text-white truncate">
            '{deletedDocNotice.label}' 문서는{' '}
            {deletedDocNotice.status === 'trashed' ? '휴지통에 있습니다.' : '영구 삭제되었습니다.'}
          </div>
          <div className="flex items-center gap-2">
            {deletedDocNotice.status === 'trashed' && (
              <button
                type="button"
                onClick={() => {
                  restoreItems([{ type: 'document', id: deletedDocNotice.docId }]);
                  showToast(`'${deletedDocNotice.label}' 문서를 복원했습니다`);
                  setDeletedDocNotice(null);
                  onOpenDoc(deletedDocNotice.docId);
                }}
                className="px-2 py-0.5 rounded-md bg-[#6A5ACD] text-white font-semibold"
              >
                복원 후 열기
              </button>
            )}
            <button
              type="button"
              onClick={() => setDeletedDocNotice(null)}
              className="px-2 py-0.5 rounded-md border border-[#E6E3F0] dark:border-[#323244] text-[#8A8998]"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Live Resize Dimensions Chip (§4-2) */}
      {resizingSize && (
        <div
          className={`fixed pointer-events-none z-[120] px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold shadow ${
            resizingSize.clamped
              ? 'bs-animate-shake bg-rose-600 text-white'
              : 'bg-[#1B1B1F] text-white'
          }`}
          style={{ right: 24, bottom: 24 }}
        >
          {resizingSize.w} × {resizingSize.h}
          {resizingSize.clamped ? ' (최소)' : ''}
        </div>
      )}

      {/* 4-corner handles in Edit Mode when selected */}
      {isEditMode && isSelected && (
        <>
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-[#6A5ACD] rounded-xs pointer-events-none" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-[#6A5ACD] rounded-xs pointer-events-none" />
          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-[#6A5ACD] rounded-xs pointer-events-none" />
          <span
            onMouseDown={startResize}
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-[#6A5ACD] rounded-xs cursor-nwse-resize z-30"
          />
        </>
      )}
    </div>
  );
};
