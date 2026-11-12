import React, { useState } from 'react';
import {
  CanvasElement,
  NameField,
  InfoCardItem,
  KeywordTag,
  RelationshipItem,
  PaletteColorItem,
  GalleryImageItem,
  StatCardItem,
  HierarchyItem,
  CategoryGroupItem,
  ZoneLocationItem,
} from '../../../types/canvas';
import {
  Sparkles,
  Image as ImageIcon,
  Quote,
  FileText,
  Tag,
  Heart,
  StickyNote,
  Palette,
  Plus,
  X,
  ExternalLink,
  Film,
  Music,
  Table as TableIcon,
  FolderTree,
  Layers,
  MapPin,
  User,
  BarChart2,
  Heading,
  Trash2,
  ChevronRight,
  ChevronDown,
  Link as LinkIcon,
  Volume2,
  Play,
  Pause,
} from 'lucide-react';
import { toast } from '../../toast/ToastContext';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useTheme } from '../../../store/ThemeContext';
import { blendCanvasColorForDarkMode, getCanvasSurfaceColor } from '../../../utils/canvasTheme';

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  zoom: number;
  isViewMode?: boolean;
  isLayoutLocked?: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
}

type ResizeHandleDirection =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

// Helper for Memo Card Theme Colors (resolves issue where border/title remained yellow)
function getMemoTheme(bgColor: string = '#FEF9C3') {
  const lower = bgColor.toLowerCase();
  if (lower === '#fef9c3' || lower.includes('yellow')) {
    return { border: '#FDE047', title: '#854D0E', text: '#713F12', icon: '#EAB308' };
  }
  if (lower === '#f3e8ff' || lower.includes('purple')) {
    return { border: '#D8B4FE', title: '#6B21A8', text: '#581C87', icon: '#A855F7' };
  }
  if (lower === '#e0f2fe' || lower.includes('blue')) {
    return { border: '#7DD3FC', title: '#0369A1', text: '#0C4A6E', icon: '#0284C7' };
  }
  if (lower === '#dcfce7' || lower.includes('green')) {
    return { border: '#86EFAC', title: '#15803D', text: '#14532D', icon: '#22C55E' };
  }
  if (lower === '#fce7f3' || lower.includes('pink')) {
    return { border: '#F9A8D4', title: '#9D174D', text: '#831843', icon: '#EC4899' };
  }
  if (lower === '#292936' || lower === '#1e1e27' || lower === '#17171d') {
    return { border: '#4E4D61', title: '#E8E7EF', text: '#A5A3B5', icon: '#A995F5' };
  }
  return { border: '#E2E8F0', title: '#334155', text: '#475569', icon: '#8B5CF6' };
}

export const CanvasElementRenderer: React.FC<CanvasElementRendererProps> = ({
  element,
  isSelected,
  zoom,
  isViewMode = false,
  isLayoutLocked = false,
  onSelect,
  onUpdate,
}) => {
  const { currentDocuments, setActiveDocument } = useWorkspace();
  const { isDark } = useTheme();

  // Elements that automatically adjust height based on content
  const isAutoHeightType = [
    'name-badge',
    'info-card',
    'detail-card',
    'narrative-card',
    'keyword-card',
    'tag-card',
    'palette-card',
    'relationship-card',
    'profile-card',
    'stat-card',
    'hierarchy-card',
    'category-list-card',
    'zone-card',
    'table-card',
    'doc-link-card',
    'video-card',
    'audio-card',
    'gallery-card',
    'text-card',
    'section-heading',
    'group-container',
  ].includes(element.type);
  const isCardSurface = !['divider', 'spacer', 'section-heading', 'heading'].includes(element.type);

  // 1. Drag to Move (disabled in view mode or when layout is locked)
  const handleMouseDownMove = (e: React.MouseEvent) => {
    if (isViewMode || isLayoutLocked) return;

    const tagName = (e.target as HTMLElement).tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'BUTTON' || tagName === 'A') {
      return;
    }

    e.stopPropagation();
    onSelect(element.id, e);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = element.x;
    const initialY = element.y;
    const scale = zoom / 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      onUpdate(element.id, {
        x: Math.round(initialX + dx),
        y: Math.round(initialY + dy),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 2. Drag Resize Handles (horizontal only for auto-height cards)
  const handleMouseDownResize = (
    dir: ResizeHandleDirection,
    e: React.MouseEvent
  ) => {
    if (isViewMode || isLayoutLocked) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y, width, height } = element;
    const scale = zoom / 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      let newX = x;
      let newY = y;
      let newW = width;
      let newH = height;

      // Width resizing (always allowed)
      if (dir.includes('e')) newW = Math.max(120, width + dx);
      if (dir.includes('w')) {
        const potentialW = width - dx;
        if (potentialW >= 120) {
          newW = potentialW;
          newX = x + dx;
        }
      }

      // Height resizing (only for non-auto-height cards)
      if (!isAutoHeightType) {
        if (dir.includes('s')) newH = Math.max(40, height + dy);
        if (dir.includes('n')) {
          const potentialH = height - dy;
          if (potentialH >= 40) {
            newH = potentialH;
            newY = y + dy;
          }
        }
      }

      onUpdate(element.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Helper: compute background style (solid vs gradient)
  const getContainerBackground = () => {
    const { style } = element;
    if (style?.gradient?.enabled) {
      const dirMap: Record<string, string> = {
        'to-b': 'to bottom',
        'to-r': 'to right',
        'to-br': 'to bottom right',
        'to-tr': 'to top right',
      };
      const dir = dirMap[style.gradient.direction] || 'to bottom';
      const start = isDark ? blendCanvasColorForDarkMode(style.gradient.startColor, 0.58) : style.gradient.startColor;
      const end = isDark ? blendCanvasColorForDarkMode(style.gradient.endColor, 0.58) : style.gradient.endColor;
      return `linear-gradient(${dir}, ${start}, ${end})`;
    }
    return getCanvasSurfaceColor(style?.backgroundColor, isDark);
  };

  // Global custom text color from element style
  const customTextColor = element.style?.color;

  // -------------------------------------------------------------
  // Sub-renderers for Meaningful Character Sheet Components
  // -------------------------------------------------------------

  // 1. Character Image
  const renderCharacterImage = () => {
    const { content, style } = element;
    const fit = style?.objectFit || 'cover';

    return (
      <div className="w-full h-full relative overflow-hidden flex items-center justify-center rounded-[inherit] pointer-events-none select-none">
        {content.imageUrl ? (
          <img
            src={content.imageUrl}
            alt={content.alt || '캐릭터 이미지'}
            style={{ objectFit: fit }}
            className="w-full h-full rounded-[inherit]"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
            <ImageIcon className="w-10 h-10 text-slate-300" />
            <span className="text-xs font-semibold">캐릭터 이미지 등록</span>
            <span className="text-[11px] text-slate-400">
              우측 패널에서 URL을 입력하거나 이미지를 업로드하세요
            </span>
          </div>
        )}
      </div>
    );
  };

  // 2. Name Badge (Hide label, display ONLY the name value)
  const renderNameBadge = () => {
    const { content } = element;
    const fields: NameField[] = content.nameFields || [
      {
        id: '1',
        label: '이름',
        value: content.text || '캐릭터 이름',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        isPrimary: true,
      },
    ];

    return (
      <div className="w-full flex flex-col justify-center gap-1.5 py-1">
        {fields.map((f) => {
          // Requirement 2: Clean up any prefix like "이름 : " and show ONLY the value
          const rawVal = f.value || '';
          const cleanValue = rawVal.replace(/^(이름|본명|칭호|코드네임|성명)\s*[:：]\s*/i, '');
          const storedColor = f.color || customTextColor || (f.isPrimary ? undefined : '#64748B');
          const displayColor = isDark && (storedColor === '#1E293B' || storedColor === '#64748B')
            ? (f.isPrimary ? '#E8E7EF' : '#A5A3B5')
            : storedColor;

          return (
            <div key={f.id} className="flex items-baseline flex-wrap gap-1">
              <span
                style={{
                  fontSize: f.fontSize ? `${f.fontSize}px` : f.isPrimary ? '24px' : '13px',
                  fontWeight: f.fontWeight || (f.isPrimary ? 'bold' : 'normal'),
                  color: displayColor,
                }}
                className={`truncate ${!displayColor ? 'text-slate-800' : ''}`}
              >
                {cleanValue || (f.isPrimary ? '캐릭터 이름 입력' : '호칭 입력')}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // 3. Info Card (Unified Common Info Card: Auto-Height, NO internal scroll, line-wrap)
  const renderInfoCard = () => {
    const { content } = element;
    const title = content.title || '기본 정보';
    const items: InfoCardItem[] = content.infoCardItems || [
      { id: '1', label: '항목 1', value: '내용 1' },
      { id: '2', label: '항목 2', value: '내용 2' },
    ];
    const mode = content.infoDisplayMode || 'grid-2col';

    return (
      <div className="w-full flex flex-col">
        {title && (
          <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-slate-100 shrink-0">
            <div className="w-2 h-3.5 rounded-xs bg-lavender-500" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800' : ''}`}
            >
              {title}
            </h4>
            <span className="text-[10px] text-slate-400 ml-auto">
              {items.length}개
            </span>
          </div>
        )}

        {/* Removed overflow-y-auto so height adjusts automatically to content */}
        <div className="w-full">
          {mode === 'grid-2col' && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex flex-col bg-slate-50/70 p-2 rounded-xl border border-slate-100 min-w-0"
                >
                  <span className="text-[10.5px] font-semibold text-slate-400 truncate">
                    {it.label}
                  </span>
                  <span
                    style={{ color: customTextColor }}
                    className={`text-xs font-medium mt-0.5 break-words whitespace-pre-wrap ${!customTextColor ? 'text-slate-800' : ''}`}
                  >
                    {it.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {mode === 'table' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {items.map((it) => (
                <div key={it.id} className="flex items-stretch">
                  <span className="w-24 shrink-0 px-3 py-1.5 font-semibold bg-slate-50 text-slate-500 border-r border-slate-100 truncate flex items-center">
                    {it.label}
                  </span>
                  <span
                    style={{ color: customTextColor }}
                    className={`flex-1 px-3 py-1.5 font-medium break-words whitespace-pre-wrap ${!customTextColor ? 'text-slate-800' : ''}`}
                  >
                    {it.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {mode === 'list-horizontal' && (
            <div className="flex flex-col gap-1.5 text-xs">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start justify-between gap-2 py-1 border-b border-dashed border-slate-100"
                >
                  <span className="text-slate-400 font-semibold truncate shrink-0">
                    {it.label}
                  </span>
                  <span
                    style={{ color: customTextColor }}
                    className={`font-medium text-right break-words whitespace-pre-wrap ${!customTextColor ? 'text-slate-800' : ''}`}
                  >
                    {it.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {mode === 'list-vertical' && (
            <div className="flex flex-col gap-2 text-xs">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="p-2 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {it.label}
                  </span>
                  <span
                    style={{ color: customTextColor }}
                    className={`font-semibold block mt-0.5 break-words whitespace-pre-wrap ${!customTextColor ? 'text-slate-800' : ''}`}
                  >
                    {it.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 4. Narrative Card (Auto-Height, NO scroll, line-wrap)
  const renderNarrativeCard = () => {
    const { content, style } = element;
    const title = content.title || '상세 설정';
    const text = content.narrativeText || '캐릭터의 설정을 입력해주세요.';

    return (
      <div className="w-full flex flex-col">
        {title && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 shrink-0">
            <FileText className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800' : ''}`}
            >
              {title}
            </h4>
          </div>
        )}
        <div
          style={{
            textAlign: style?.textAlign || 'left',
            fontSize: style?.fontSize ? `${style.fontSize}px` : '12.5px',
            color: customTextColor,
          }}
          className={`w-full leading-relaxed whitespace-pre-wrap break-words ${!customTextColor ? 'text-slate-700' : ''}`}
        >
          {text}
        </div>
      </div>
    );
  };

  // 5. Keyword Card (Auto-Height, NO scroll, chips ONLY with line-wrap)
  const renderKeywordCard = () => {
    const { content } = element;
    const title = content.title || '특징 키워드';
    const tags: KeywordTag[] = content.tags || [
      { id: '1', text: '정의로움' },
      { id: '2', text: '책임감' },
    ];

    return (
      <div className="w-full flex flex-col">
        {title && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 shrink-0">
            <Tag className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800' : ''}`}
            >
              {title}
            </h4>
            <span className="text-[10px] text-slate-400 ml-auto">
              {tags.length}개
            </span>
          </div>
        )}

        {/* Flexible Chips with line-wrapping; no overflow scroll */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const tagColor = t.color || customTextColor;
            return (
              <span
                key={t.id}
                style={{
                  backgroundColor: tagColor ? `${tagColor}18` : undefined,
                  color: tagColor || undefined,
                  borderColor: tagColor ? `${tagColor}40` : undefined,
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border break-words ${
                  !tagColor
                    ? 'bg-lavender-50 text-lavender-700 border-lavender-200/60'
                    : ''
                }`}
              >
                #{t.text}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  // 5.5. Palette Card (Seamless Contiguous Color Strip with + button and Code ON/OFF)
  const renderPaletteCard = () => {
    const { content } = element;
    const title = content.title || '컬러 팔레트';
    const colors: PaletteColorItem[] = content.paletteColors || [
      { id: '1', color: '#6D28D9', label: '퍼플' },
      { id: '2', color: '#A855F7', label: '라벤더' },
      { id: '3', color: '#267B54', label: '포레스트' },
      { id: '4', color: '#6EE7B7', label: '민트' },
      { id: '5', color: '#F7F6F2', label: '크림화이트' },
    ];
    const showHex = content.showPaletteHex !== false;

    const handleCopyColor = (colorHex: string) => {
      navigator.clipboard?.writeText(colorHex);
      toast.success('색상 코드 복사됨', `${colorHex}`);
    };

    const handleUpdateColorHex = (idx: number, nextHex: string) => {
      const nextColors = [...colors];
      nextColors[idx] = { ...nextColors[idx], color: nextHex };
      onUpdate(element.id, {
        content: { ...content, paletteColors: nextColors },
      });
    };

    const handleUpdateColorLabel = (idx: number, nextLabel: string) => {
      const nextColors = [...colors];
      nextColors[idx] = { ...nextColors[idx], label: nextLabel };
      onUpdate(element.id, {
        content: { ...content, paletteColors: nextColors },
      });
    };

    const handleAddColor = () => {
      const defaultHexList = [
        '#6D28D9',
        '#A855F7',
        '#267B54',
        '#6EE7B7',
        '#F7F6F2',
        '#3B82F6',
        '#EC4899',
        '#F59E0B',
      ];
      const nextHex = defaultHexList[colors.length % defaultHexList.length] || '#8B5CF6';
      const nextColors = [
        ...colors,
        { id: `col-${Date.now()}`, color: nextHex, label: `색상 ${colors.length + 1}` },
      ];
      onUpdate(element.id, {
        content: { ...content, paletteColors: nextColors },
      });
      toast.success('색상이 추가되었습니다.');
    };

    const handleDeleteColor = (idx: number) => {
      if (colors.length <= 1) {
        toast.info('알림', '최소 1개 이상의 색상이 필요합니다.');
        return;
      }
      const nextColors = colors.filter((_, i) => i !== idx);
      onUpdate(element.id, {
        content: { ...content, paletteColors: nextColors },
      });
    };

    const handleToggleHex = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUpdate(element.id, {
        content: { ...content, showPaletteHex: !showHex },
      });
    };

    return (
      <div className="w-full flex flex-col justify-start">
        {/* Header: Title */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Palette className="w-3.5 h-3.5 text-lavender-600 shrink-0" />
            {!isViewMode ? (
              <input
                type="text"
                value={title}
                onChange={(e) =>
                  onUpdate(element.id, {
                    content: { ...content, title: e.target.value },
                  })
                }
                style={{ color: customTextColor }}
                className={`text-xs font-bold bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 -mx-1 truncate w-full ${
                  !customTextColor ? 'text-slate-800 dark:text-slate-100' : ''
                }`}
              />
            ) : (
              <h4
                style={{ color: customTextColor }}
                className={`text-xs font-bold truncate ${
                  !customTextColor ? 'text-slate-800 dark:text-slate-100' : ''
                }`}
              >
                {title}
              </h4>
            )}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E] shrink-0 font-mono">
            {colors.length} colors
          </span>
        </div>

        {/* Seamless Contiguous Color Palette Strip (Attached side-by-side with + button on the right in Edit Mode) */}
        <div className="flex items-stretch w-full rounded-xl overflow-hidden border border-slate-200/80 dark:border-[#3A3948] shadow-xs bg-white dark:bg-[#1E1E27]">
          {colors.map((c, idx) => (
            <div
              key={c.id || idx}
              className="group relative flex-1 min-w-[36px] h-14 md:h-16 flex items-center justify-center cursor-pointer transition-all"
              style={{ backgroundColor: c.color }}
              onClick={() => handleCopyColor(c.color)}
              title={isViewMode ? `${c.color} (클릭하여 코드 복사)` : '클릭하여 색상 변경 / 복사'}
            >
              {/* Native Color Picker for direct click in Edit Mode */}
              {!isViewMode && (
                <input
                  type="color"
                  value={c.color.startsWith('#') && c.color.length === 7 ? c.color : '#8B5CF6'}
                  onChange={(e) => handleUpdateColorHex(idx, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="색상 변경"
                />
              )}

              {/* Hover Delete Button in Edit Mode */}
              {!isViewMode && colors.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteColor(idx);
                  }}
                  title="이 색상 삭제"
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}

          {/* Plus (+) Button at the right end of the UI in Edit Mode */}
          {!isViewMode && (
            <button
              type="button"
              onClick={handleAddColor}
              title="오른쪽에 새 색상 추가 (+)"
              className="w-12 h-14 md:h-16 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#262634] hover:bg-lavender-50 dark:hover:bg-[#352E58] text-slate-400 hover:text-lavender-600 border-l border-slate-200 dark:border-[#3A3948] transition-colors shrink-0 group select-none"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold mt-0.5 tracking-tight">추가</span>
            </button>
          )}
        </div>

        {/* Color Codes Section Below the Strip */}
        <div className="flex flex-col gap-1.5 mt-2">
          {/* HEX Codes Row (Shown when ON) */}
          {showHex && (
            <div className="flex items-start w-full">
              {colors.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="flex-1 min-w-[36px] flex flex-col items-center text-center px-0.5 truncate cursor-pointer hover:text-lavender-600 transition-colors"
                  onClick={() => handleCopyColor(c.color)}
                  title={`${c.color} 클릭하여 복사`}
                >
                  <span className="text-[10.5px] font-mono font-bold text-slate-700 dark:text-[#E8E7EF] truncate">
                    {c.color.toUpperCase()}
                  </span>
                  {!isViewMode ? (
                    <input
                      type="text"
                      placeholder="라벨"
                      value={c.label || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdateColorLabel(idx, e.target.value)}
                      className="text-[9.5px] text-slate-500 dark:text-[#A5A3B5] text-center bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-0.5 w-full truncate mt-0.5"
                    />
                  ) : c.label ? (
                    <span className="text-[9.5px] text-slate-400 dark:text-[#8E8B9E] truncate mt-0.5">
                      {c.label}
                    </span>
                  ) : null}
                </div>
              ))}
              {/* Spacer matching the + button on the right in Edit mode */}
              {!isViewMode && <div className="w-12 shrink-0" />}
            </div>
          )}

          {/* Color Code ON/OFF Toggle Control below the palette */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
            <span className="text-[10.5px] text-slate-400 dark:text-[#8E8B9E]">
              {showHex ? '색상 코드 표시 중 (클릭 시 복사)' : '색상 코드 숨김 상태'}
            </span>
            <button
              type="button"
              onClick={handleToggleHex}
              title={`색상 코드 ${showHex ? '끄기' : '켜기'}`}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all border ${
                showHex
                  ? 'bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] border-lavender-300 dark:border-[#554884]'
                  : 'bg-slate-100 dark:bg-[#262634] text-slate-500 dark:text-[#8E8B9E] border-slate-200 dark:border-[#3A3948]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showHex ? 'bg-lavender-600 dark:bg-[#B7A5FF]' : 'bg-slate-400'}`} />
              <span>색상 코드 {showHex ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 6. Radar Chart (SVG Polygon Visualizer: 3 to 8 axes)
  const renderRadarChart = () => {
    const { content } = element;
    const title = content.title || '능력치 레이더 차트';
    const axes = content.radarAxes || [
      { id: '1', label: '공격력', value: 80 },
      { id: '2', label: '방어력', value: 70 },
      { id: '3', label: '민첩성', value: 90 },
      { id: '4', label: '지능', value: 85 },
      { id: '5', label: '마력', value: 75 },
    ];
    const maxVal = content.radarMaxValue || 100;
    const mainColor = content.radarColor || '#8B5CF6';
    const fillOpacity = content.radarFillOpacity ?? 0.35;

    const N = Math.max(3, axes.length);
    const w = element.width;
    const h = element.height;
    const headerHeight = title ? 28 : 0;
    const availH = Math.max(40, h - headerHeight);
    const size = Math.min(w, availH);
    const R = Math.max(20, (size - 48) / 2);
    const cx = w / 2;
    const cy = headerHeight + availH / 2;

    const getCoord = (idx: number, ratio: number) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / N;
      return {
        x: cx + R * ratio * Math.cos(angle),
        y: cy + R * ratio * Math.sin(angle),
      };
    };

    const levels = [0.25, 0.5, 0.75, 1.0];
    const polygonPts = axes
      .map((ax, i) => {
        const ratio = Math.max(0.08, Math.min(1, (ax.value || 0) / maxVal));
        const pt = getCoord(i, ratio);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');

    return (
      <div className="w-full h-full flex flex-col justify-between overflow-hidden">
        {title && (
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800' : ''}`}
            >
              {title}
            </h4>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center relative min-h-0">
          <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
            {levels.map((lvl, lIdx) => {
              const pts = Array.from({ length: N })
                .map((_, i) => {
                  const pt = getCoord(i, lvl);
                  return `${pt.x},${pt.y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={lIdx}
                  points={pts}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth={lIdx === levels.length - 1 ? 1.5 : 1}
                  strokeDasharray={lIdx === levels.length - 1 ? 'none' : '3 3'}
                  className=""
                />
              );
            })}
            {axes.map((ax, i) => {
              const outer = getCoord(i, 1.0);
              const lblPt = getCoord(i, 1.22);
              return (
                <g key={ax.id}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    className=""
                  />
                  <text
                    x={lblPt.x}
                    y={lblPt.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9.5"
                    fontWeight="600"
                    fill={customTextColor || '#64748B'}
                    className={!customTextColor ? '' : ''}
                  >
                    {ax.label} ({ax.value})
                  </text>
                </g>
              );
            })}
            <polygon
              points={polygonPts}
              fill={mainColor}
              fillOpacity={fillOpacity}
              stroke={mainColor}
              strokeWidth="2"
            />
            {axes.map((ax, i) => {
              const ratio = Math.max(0.08, Math.min(1, (ax.value || 0) / maxVal));
              const pt = getCoord(i, ratio);
              return (
                <circle
                  key={ax.id}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#FFFFFF"
                  stroke={mainColor}
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // 7. Relationship Card (Auto-Height, NO scroll, custom relationship badge color, internal document link)
  const renderRelationshipCard = () => {
    const { content } = element;
    const title = content.title || '주요 관계 요약';
    const rels: RelationshipItem[] = content.relationships || [
      { id: '1', name: '인물 A', relation: '동료', description: '생사를 함께 넘나든 든든한 전우' },
    ];

    const handleAddRelationship = () => {
      const next: RelationshipItem = {
        id: `rel-${Date.now()}`,
        name: `새 인물 ${rels.length + 1}`,
        relation: '동료',
        description: '관계에 대한 설명을 입력하세요.',
        color: '#8B5CF6',
      };
      onUpdate(element.id, {
        content: { ...content, relationships: [...rels, next] },
      });
      toast.success('관계 항목이 추가되었습니다.');
    };

    const handleDeleteRelationship = (idx: number) => {
      if (rels.length <= 1) {
        toast.info('알림', '최소 1개의 관계 항목이 필요합니다.');
        return;
      }
      onUpdate(element.id, {
        content: { ...content, relationships: rels.filter((_, i) => i !== idx) },
      });
    };

    const handleJumpToDoc = (docId?: string, name?: string) => {
      if (docId) {
        setActiveDocument(docId);
        toast.success(`캐릭터 문서로 이동`, `"${name || '인물'}" 문서로 이동했습니다.`);
      }
    };

    return (
      <div className="w-full flex flex-col">
        {title && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <h4
                style={{ color: customTextColor }}
                className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
              >
                {title}
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {rels.length}명
            </span>
          </div>
        )}

        {/* Removed overflow-y-auto so height adjusts automatically */}
        <div className="flex flex-col gap-2">
          {rels.map((r, idx) => {
            const relColor = r.color || '#8B5CF6';
            const hasDoc = !!r.documentId;

            return (
              <div
                key={r.id || idx}
                className={`group p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs transition-all ${
                  hasDoc ? 'cursor-pointer hover:border-lavender-300 dark:hover:border-lavender-700' : ''
                }`}
                onClick={() => hasDoc && handleJumpToDoc(r.documentId, r.name)}
              >
                <div
                  style={{
                    backgroundColor: `${relColor}20`,
                    color: relColor,
                  }}
                  className="w-7 h-7 rounded-lg font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs"
                >
                  {r.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{ color: customTextColor }}
                      className={`font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
                    >
                      {r.name}
                    </span>
                    <span
                      style={{
                        backgroundColor: `${relColor}15`,
                        color: relColor,
                        borderColor: `${relColor}30`,
                      }}
                      className="px-1.5 py-0.5 rounded-md font-semibold text-[10px] border"
                    >
                      {r.relation}
                    </span>
                    {hasDoc && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-lavender-100 dark:bg-lavender-900/50 text-lavender-600 dark:text-lavender-300 font-semibold flex items-center gap-0.5">
                        <LinkIcon className="w-2.5 h-2.5" />
                        연결됨
                      </span>
                    )}
                  </div>
                  <p
                    style={{ color: customTextColor }}
                    className={`text-[11px] mt-0.5 break-words whitespace-pre-wrap ${!customTextColor ? 'text-slate-500 dark:text-slate-400' : ''}`}
                  >
                    {r.description}
                  </p>

                  {/* Connect Document Dropdown in Edit Mode */}
                  {!isViewMode && (
                    <div
                      className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[9.5px] text-slate-400 shrink-0">캐릭터 문서:</span>
                      <select
                        value={r.documentId || ''}
                        onChange={(e) => {
                          const doc = currentDocuments.find((d) => d.id === e.target.value);
                          const next = [...rels];
                          next[idx] = {
                            ...next[idx],
                            documentId: e.target.value || undefined,
                            documentTitle: doc?.title || undefined,
                            name: next[idx].name || doc?.title || '인물',
                          };
                          onUpdate(element.id, {
                            content: { ...content, relationships: next },
                          });
                        }}
                        className="text-[9.5px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-600 dark:text-slate-300 w-full truncate"
                      >
                        <option value="">문서 미연결 (이름만 사용)</option>
                        {currentDocuments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title || '제목 없음'}
                          </option>
                        ))}
                      </select>
                      {rels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRelationship(idx)}
                          className="text-slate-400 hover:text-red-500 shrink-0 p-0.5"
                          title="삭제"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Relationship in Edit Mode */}
        {!isViewMode && (
          <button
            type="button"
            onClick={handleAddRelationship}
            className="mt-2 py-1 px-2 border border-dashed border-slate-200 dark:border-slate-700 hover:border-lavender-400 hover:bg-lavender-50/50 dark:hover:bg-lavender-950/20 text-slate-400 hover:text-lavender-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>관계 추가</span>
          </button>
        )}
      </div>
    );
  };

  // 8. Quote Card (Signature Line)
  const renderQuoteCard = () => {
    const { content, style } = element;
    const title = content.title || '대표 대사';
    const quote = content.quoteText || '캐릭터의 대사를 입력해주세요.';
    const situation = content.quoteSituation;

    return (
      <div className="w-full h-full flex flex-col justify-between overflow-hidden">
        {title && (
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 shrink-0">
            <Quote className="w-3.5 h-3.5 text-lavender-600" />
            <span
              style={{ color: customTextColor }}
              className={`text-[11px] font-bold uppercase truncate ${!customTextColor ? 'text-slate-600' : ''}`}
            >
              {title}
            </span>
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center px-1 py-0.5 overflow-hidden">
          <p
            style={{
              fontSize: style?.fontSize ? `${style.fontSize}px` : '13px',
              fontStyle: 'italic',
              color: customTextColor,
            }}
            className={`font-medium leading-relaxed break-words line-clamp-3 ${!customTextColor ? 'text-slate-800' : ''}`}
          >
            "{quote}"
          </p>
          {situation && (
            <span className="text-[10.5px] text-slate-400 mt-1 text-right truncate">
              — {situation}
            </span>
          )}
        </div>
      </div>
    );
  };

  // 9. Memo Card (Theme-aligned border, title, icon, text)
  const renderMemoCard = () => {
    const { content, style } = element;
    const title = content.title || '메모';
    const text = content.memoContent || '자유롭게 메모를 작성하세요.';

    // Requirement 8: Resolve fixed yellow issue when switching color theme
    const theme = getMemoTheme(style?.backgroundColor || '#FEF9C3');
    const titleColor = customTextColor || theme.title;
    const bodyColor = customTextColor || theme.text;

    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div
          style={{ borderColor: `${theme.border}80` }}
          className="flex items-center gap-1.5 pb-2 mb-2 border-b shrink-0"
        >
          <StickyNote style={{ color: theme.icon }} className="w-3.5 h-3.5" />
          <h4
            style={{ color: titleColor }}
            className="text-xs font-bold truncate"
          >
            {title}
          </h4>
        </div>
        <div
          style={{ color: bodyColor }}
          className="flex-1 overflow-y-auto pr-1 text-xs leading-relaxed whitespace-pre-wrap break-words custom-scrollbar"
        >
          {text}
        </div>
      </div>
    );
  };

  // 10. Profile Card (Avatar + Name + Nickname + Bio)
  const renderProfileCard = () => {
    const { content } = element;
    const title = content.title || '프로필';
    const name = content.profileName || '이름을 입력하세요';
    const nickname = content.profileNickname || '칭호 / 별명';
    const summary = content.profileSummary || '간단한 인물 소개를 입력하세요.';
    const imageUrl = content.profileImageUrl;

    return (
      <div className="w-full flex flex-col">
        {title && (
          <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <User className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
        )}
        <div className="flex items-start gap-3.5">
          {/* Avatar Box */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center group shadow-xs">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            )}
            {!isViewMode && (
              <button
                type="button"
                onClick={() => {
                  const nextUrl = window.prompt('프로필 이미지 URL을 입력하세요:', imageUrl || '');
                  if (nextUrl !== null) {
                    onUpdate(element.id, {
                      content: { ...content, profileImageUrl: nextUrl.trim() },
                    });
                  }
                }}
                title="이미지 URL 변경"
                className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                변경
              </button>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              {!isViewMode ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      content: { ...content, profileName: e.target.value },
                    })
                  }
                  className="text-base font-extrabold text-slate-900 dark:text-slate-50 bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 -mx-1 truncate max-w-full"
                />
              ) : (
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 truncate">
                  {name}
                </h3>
              )}

              {/* Nickname / Title Badge */}
              {!isViewMode ? (
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) =>
                    onUpdate(element.id, {
                      content: { ...content, profileNickname: e.target.value },
                    })
                  }
                  className="text-[11px] font-semibold text-lavender-600 dark:text-lavender-400 bg-lavender-50 dark:bg-lavender-950/40 border border-lavender-200 dark:border-lavender-800/60 rounded-full px-2 py-0.5 outline-hidden truncate"
                />
              ) : (
                <span className="text-[11px] font-semibold text-lavender-600 dark:text-lavender-400 bg-lavender-50 dark:bg-lavender-950/40 border border-lavender-200 dark:border-lavender-800/60 rounded-full px-2 py-0.5 truncate">
                  {nickname}
                </span>
              )}
            </div>

            {/* Summary */}
            {!isViewMode ? (
              <textarea
                value={summary}
                rows={2}
                onChange={(e) =>
                  onUpdate(element.id, {
                    content: { ...content, profileSummary: e.target.value },
                  })
                }
                className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1 -mx-1 resize-none leading-relaxed"
              />
            ) : (
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                {summary}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 11. Stat Card (Number / Bar / Radar Chart Modes)
  const renderStatCard = () => {
    const { content } = element;
    const title = content.title || '스탯 및 능력치';
    const mode = content.statMode || 'bar';
    const items: StatCardItem[] = content.statItems || [
      { id: '1', label: '근력', value: 85, maxValue: 100, color: '#EF4444' },
      { id: '2', label: '민첩', value: 92, maxValue: 100, color: '#F59E0B' },
      { id: '3', label: '지능', value: 78, maxValue: 100, color: '#3B82F6' },
      { id: '4', label: '매력', value: 88, maxValue: 100, color: '#EC4899' },
    ];

    if (mode === 'radar') {
      return renderRadarChart();
    }

    const handleAddItem = () => {
      const next: StatCardItem = {
        id: `stat-${Date.now()}`,
        label: `스탯 ${items.length + 1}`,
        value: 70,
        maxValue: 100,
        color: '#8B5CF6',
      };
      onUpdate(element.id, {
        content: { ...content, statItems: [...items, next] },
      });
      toast.success('스탯 항목이 추가되었습니다.');
    };

    const handleDeleteItem = (idx: number) => {
      if (items.length <= 1) {
        toast.info('알림', '최소 1개의 스탯 항목이 필요합니다.');
        return;
      }
      onUpdate(element.id, {
        content: { ...content, statItems: items.filter((_, i) => i !== idx) },
      });
    };

    return (
      <div className="w-full flex flex-col">
        {/* Header with Mode Badge */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
            {mode === 'bar' ? '막대 그래프' : '수치형'}
          </span>
        </div>

        {/* Bar Mode */}
        {mode === 'bar' && (
          <div className="flex flex-col gap-2.5">
            {items.map((it, idx) => {
              const max = it.maxValue || 100;
              const pct = Math.max(0, Math.min(100, (it.value / max) * 100));
              const barColor = it.color || '#8B5CF6';

              return (
                <div key={it.id || idx} className="group relative flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {it.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                        {it.value} / {max}
                      </span>
                      {!isViewMode && items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                          title="삭제"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Gauge Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Number Mode */}
        {mode === 'number' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {items.map((it, idx) => (
              <div
                key={it.id || idx}
                className="group relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center"
              >
                {!isViewMode && items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                    title="삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <span
                  style={{ color: it.color || '#8B5CF6' }}
                  className="text-lg font-black font-mono leading-none mb-1"
                >
                  {it.value}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate w-full">
                  {it.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Add Item in Edit Mode */}
        {!isViewMode && (
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2.5 py-1 px-2 border border-dashed border-slate-200 dark:border-slate-700 hover:border-lavender-400 hover:bg-lavender-50/50 dark:hover:bg-lavender-950/20 text-slate-400 hover:text-lavender-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>스탯 항목 추가</span>
          </button>
        )}
      </div>
    );
  };

  // 12. Zone Card ([ A ] [ B ] [ C ] [ + ] Buttons with Internal Document Jump)
  const renderZoneCard = () => {
    const { content } = element;
    const title = content.title || '구역 정보';
    const locations: ZoneLocationItem[] = content.zoneLocations || [
      { id: '1', name: '중앙 광장' },
      { id: '2', name: '아카데미' },
      { id: '3', name: '상업 지구' },
    ];

    const handleLocationClick = (loc: ZoneLocationItem) => {
      if (loc.documentId) {
        setActiveDocument(loc.documentId);
        toast.success(`문서로 이동`, `"${loc.name}" 연결 문서로 이동했습니다.`);
      } else {
        toast.info(loc.name, '연결된 내부 문서가 없습니다. (편집 모드에서 문서를 연결할 수 있습니다)');
      }
    };

    const handleAddLocation = () => {
      const next: ZoneLocationItem = {
        id: `loc-${Date.now()}`,
        name: `새 장소 ${locations.length + 1}`,
      };
      onUpdate(element.id, {
        content: { ...content, zoneLocations: [...locations, next] },
      });
      toast.success('새 장소가 추가되었습니다.');
    };

    const handleDeleteLocation = (idx: number) => {
      onUpdate(element.id, {
        content: { ...content, zoneLocations: locations.filter((_, i) => i !== idx) },
      });
    };

    const handleConnectDoc = (idx: number, docId: string) => {
      const targetDoc = currentDocuments.find((d) => d.id === docId);
      const nextList = [...locations];
      nextList[idx] = {
        ...nextList[idx],
        documentId: docId || undefined,
        documentTitle: targetDoc?.title || undefined,
        name: nextList[idx].name || targetDoc?.title || '장소',
      };
      onUpdate(element.id, {
        content: { ...content, zoneLocations: nextList },
      });
      toast.success('문서가 연결되었습니다.');
    };

    return (
      <div className="w-full flex flex-col">
        {/* Header: Title */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-lavender-600 shrink-0" />
            {!isViewMode ? (
              <input
                type="text"
                value={title}
                onChange={(e) =>
                  onUpdate(element.id, {
                    content: { ...content, title: e.target.value },
                  })
                }
                style={{ color: customTextColor }}
                className={`text-xs font-bold bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 -mx-1 truncate w-full ${
                  !customTextColor ? 'text-slate-800 dark:text-slate-100' : ''
                }`}
              />
            ) : (
              <h4
                style={{ color: customTextColor }}
                className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
              >
                {title}
              </h4>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {locations.length}개 장소
          </span>
        </div>

        {/* Zone Buttons Strip: [ A ] [ B ] [ C ] [ + ] */}
        <div className="flex items-start gap-2.5 overflow-x-auto pb-1.5 custom-scrollbar">
          {locations.map((loc, idx) => {
            const letter = String.fromCharCode(65 + (idx % 26)); // A, B, C...
            const hasDoc = !!loc.documentId;

            return (
              <div
                key={loc.id || idx}
                className="group relative flex flex-col items-center min-w-[64px] max-w-[120px] shrink-0"
              >
                {/* Location Button */}
                <button
                  type="button"
                  onClick={() => handleLocationClick(loc)}
                  title={hasDoc ? `클릭 시 연결된 문서("${loc.documentTitle || loc.name}")로 이동` : `${loc.name} (문서 미연결)`}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center font-bold text-sm transition-colors ${
                    hasDoc
                      ? 'bg-lavender-600 hover:bg-lavender-700 text-white ring-2 ring-lavender-300 dark:ring-lavender-800 scale-100 hover:scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {loc.imageUrl ? (
                    <>
                      <img src={loc.imageUrl} alt={loc.name} className="absolute inset-0 w-full h-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/30 text-white">{letter}</span>
                    </>
                  ) : loc.icon || letter}
                </button>

                {/* Location Name Label */}
                {!isViewMode ? (
                  <input
                    type="text"
                    value={loc.name}
                    onChange={(e) => {
                      const next = [...locations];
                      next[idx] = { ...next[idx], name: e.target.value };
                      onUpdate(element.id, {
                        content: { ...content, zoneLocations: next },
                      });
                    }}
                    className="text-[11px] font-semibold text-center text-slate-700 dark:text-slate-300 bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-0.5 mt-1.5 truncate w-full"
                  />
                ) : (
                  <span className="text-[11px] font-semibold text-center text-slate-700 dark:text-slate-300 mt-1.5 truncate w-full">
                    {loc.name}
                  </span>
                )}

                {(loc.summary || loc.features) && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 text-center mt-1 line-clamp-2 w-full">
                    {[loc.summary, loc.features].filter(Boolean).join(' · ')}
                  </span>
                )}

                {/* Document Connection Selector in Edit Mode */}
                {!isViewMode && (
                  <div className="w-full mt-1 flex items-center justify-center">
                    <select
                      value={loc.documentId || ''}
                      onChange={(e) => handleConnectDoc(idx, e.target.value)}
                      className="text-[9px] w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-slate-500 truncate"
                      title="문서 연결"
                    >
                      <option value="">문서 미연결</option>
                      {currentDocuments.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title || '제목 없음'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delete Button on Hover in Edit Mode */}
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLocation(idx);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                    title="장소 삭제"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Plus (+) Button to Add Location */}
          {!isViewMode && (
            <div className="flex flex-col items-center min-w-[56px] shrink-0">
              <button
                type="button"
                onClick={handleAddLocation}
                title="새 장소 추가 (+)"
                className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-lavender-500 text-slate-400 hover:text-lavender-600 hover:bg-lavender-50 dark:hover:bg-lavender-950/20 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
              <span className="text-[10px] text-slate-400 font-semibold mt-1.5">
                추가
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 13. Hierarchy Card (Tree Structure for Organizations, Territories, Classes)
  const renderHierarchyCard = () => {
    const { content } = element;
    const title = content.title || '계층 및 소속 구조';
    const items: HierarchyItem[] = content.hierarchyItems || [
      { id: '1', label: '제국 황실 (최상위)', parentId: null, isOpen: true },
      { id: '2', label: '수도 에스페란자 (직속)', parentId: '1', isOpen: true },
      { id: '3', label: '노바 기사단 (직속 무력)', parentId: '1', isOpen: true },
      { id: '4', label: '제1기사단 북부 파견대', parentId: '3', isOpen: true },
    ];

    const handleAddItem = (parentId: string | null = null) => {
      const next: HierarchyItem = {
        id: `h-${Date.now()}`,
        label: parentId ? '하위 소속 항목' : '새 계층 항목',
        parentId,
        isOpen: true,
      };
      onUpdate(element.id, {
        content: { ...content, hierarchyItems: [...items, next] },
      });
      toast.success('계층 항목이 추가되었습니다.');
    };

    const handleDeleteItem = (id: string) => {
      onUpdate(element.id, {
        content: { ...content, hierarchyItems: items.filter((it) => it.id !== id && it.parentId !== id) },
      });
    };

    // Helper to render tree nodes recursively
    const renderTreeNodes = (parentId: string | null, depth = 0) => {
      const children = items.filter((it) => (it.parentId || null) === parentId);
      if (children.length === 0) return null;

      return (
        <div className={`flex flex-col gap-1.5 ${depth > 0 ? 'pl-4 ml-2 border-l-2 border-lavender-200 dark:border-lavender-900/60' : ''}`}>
          {children.map((child) => (
            <div key={child.id} className="group flex flex-col gap-1">
              <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <FolderTree className="w-3.5 h-3.5 text-lavender-500 shrink-0" />
                  {!isViewMode ? (
                    <input
                      type="text"
                      value={child.label}
                      onChange={(e) => {
                        const next = items.map((it) =>
                          it.id === child.id ? { ...it, label: e.target.value } : it
                        );
                        onUpdate(element.id, {
                          content: { ...content, hierarchyItems: next },
                        });
                      }}
                      className="font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-0 outline-hidden hover:bg-slate-200/60 rounded px-1 -mx-1 w-full truncate"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {child.label}
                    </span>
                  )}
                </div>

                {!isViewMode && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAddItem(child.id)}
                      title="하위 항목 추가"
                      className="px-1 py-0.5 text-[10px] rounded bg-lavender-100 dark:bg-lavender-900/50 text-lavender-700 dark:text-lavender-300 font-bold"
                    >
                      + 하위
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(child.id)}
                      title="삭제"
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              {renderTreeNodes(child.id, depth + 1)}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
          {!isViewMode && (
            <button
              type="button"
              onClick={() => handleAddItem(null)}
              className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline"
            >
              + 최상위 추가
            </button>
          )}
        </div>
        {renderTreeNodes(null, 0)}
      </div>
    );
  };

  // 14. Category List Card (Classification: Races, Magic Systems, Factions)
  const renderCategoryListCard = () => {
    const { content } = element;
    const title = content.title || '분류 목록';
    const groups: CategoryGroupItem[] = content.categoryGroups || [
      {
        id: '1',
        name: '종족 분류',
        description: '대륙의 3대 지적 생명체',
        items: [
          { id: 'i1', text: '인간', subText: '적응력이 높고 문명을 주도함' },
          { id: 'i2', text: '엘프', subText: '정령과의 친화력이 뛰어남' },
        ],
      },
    ];

    const handleAddGroup = () => {
      const next: CategoryGroupItem = {
        id: `cg-${Date.now()}`,
        name: `새 분류 ${groups.length + 1}`,
        description: '분류 설명을 입력하세요',
        items: [{ id: `item-${Date.now()}`, text: '항목 1' }],
      };
      onUpdate(element.id, {
        content: { ...content, categoryGroups: [...groups, next] },
      });
      toast.success('분류 그룹이 추가되었습니다.');
    };

    const handleAddItem = (groupIdx: number) => {
      const nextGroups = [...groups];
      nextGroups[groupIdx] = {
        ...nextGroups[groupIdx],
        items: [
          ...nextGroups[groupIdx].items,
          { id: `item-${Date.now()}`, text: `새 항목 ${nextGroups[groupIdx].items.length + 1}` },
        ],
      };
      onUpdate(element.id, {
        content: { ...content, categoryGroups: nextGroups },
      });
    };

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
          {!isViewMode && (
            <button
              type="button"
              onClick={handleAddGroup}
              className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline"
            >
              + 분류 추가
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {groups.map((grp, gIdx) => (
            <div
              key={grp.id || gIdx}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                  {grp.name}
                </span>
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => handleAddItem(gIdx)}
                    className="text-[10px] text-lavender-600 hover:underline font-bold"
                  >
                    + 항목
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grp.items.map((it, itIdx) => (
                  <div
                    key={it.id || itIdx}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-[11px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>{it.text}</span>
                    {it.subText && (
                      <span className="text-[9.5px] text-slate-400">({it.subText})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 15. Table Card (Grid Table with Add Row/Column)
  const renderTableCard = () => {
    const { content } = element;
    const title = content.title || '표 카드';
    const headers = content.tableHeaders || ['구분', '항목', '내용'];
    const rows = content.tableRows || [
      ['1', '기본 항목 A', '상세 내용을 작성하세요'],
      ['2', '기본 항목 B', '상세 내용을 작성하세요'],
    ];

    const handleAddRow = () => {
      const emptyRow = headers.map(() => '');
      onUpdate(element.id, {
        content: { ...content, tableRows: [...rows, emptyRow] },
      });
    };

    const handleAddCol = () => {
      const nextHeaders = [...headers, `열 ${headers.length + 1}`];
      const nextRows = rows.map((r) => [...r, '']);
      onUpdate(element.id, {
        content: { ...content, tableHeaders: nextHeaders, tableRows: nextRows },
      });
    };

    const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
      const nextRows = [...rows];
      nextRows[rIdx] = [...nextRows[rIdx]];
      nextRows[rIdx][cIdx] = val;
      onUpdate(element.id, {
        content: { ...content, tableRows: nextRows },
      });
    };

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <TableIcon className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
          {!isViewMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="text-[10px] text-lavender-600 font-bold hover:underline"
              >
                + 행 추가
              </button>
              <button
                type="button"
                onClick={handleAddCol}
                className="text-[10px] text-lavender-600 font-bold hover:underline"
              >
                + 열 추가
              </button>
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-bold">
                {headers.map((h, i) => (
                  <th key={i} className="p-2 text-center border-r border-slate-200 dark:border-slate-700 last:border-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="p-1.5 border-r border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      {!isViewMode ? (
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className="w-full bg-transparent border-0 outline-hidden text-xs text-slate-800 dark:text-slate-200 px-1"
                        />
                      ) : (
                        <span className="text-slate-800 dark:text-slate-200 px-1">{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 16. Document Link Card (Jump to Blankspace Document)
  const renderDocLinkCard = () => {
    const { content } = element;
    const title = content.title || '연결된 문서';
    const docId = content.targetDocumentId;
    const targetDoc = currentDocuments.find((d) => d.id === docId);

    const handleJump = () => {
      if (docId) {
        setActiveDocument(docId);
        toast.success('문서로 이동했습니다.', targetDoc?.title || '');
      } else {
        toast.info('알림', '연결할 문서를 선택해주세요.');
      }
    };

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <LinkIcon className="w-3.5 h-3.5 text-lavender-600" />
          <h4
            style={{ color: customTextColor }}
            className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
          >
            {title}
          </h4>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-lavender-100 dark:bg-lavender-900/50 text-lavender-600 dark:text-lavender-300 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {targetDoc?.title || content.targetDocumentTitle || '문서 미선택'}
              </span>
              <span className="text-[10px] text-slate-400">
                {targetDoc ? `${targetDoc.templateType || '일반'} 문서` : '클릭하여 문서 연결'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleJump}
            disabled={!docId}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              docId
                ? 'bg-lavender-600 hover:bg-lavender-700 text-white shadow-xs'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>문서 열기</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {!isViewMode && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 shrink-0">연결 문서 변경:</span>
            <select
              value={docId || ''}
              onChange={(e) => {
                const selected = currentDocuments.find((d) => d.id === e.target.value);
                onUpdate(element.id, {
                  content: {
                    ...content,
                    targetDocumentId: e.target.value || undefined,
                    targetDocumentTitle: selected?.title || undefined,
                  },
                });
              }}
              className="text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 w-full"
            >
              <option value="">문서를 선택하세요</option>
              {currentDocuments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title || '제목 없음'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  // 17. Video Card (Embed / URL Video Player)
  const renderVideoCard = () => {
    const { content } = element;
    const title = content.title || '동영상 카드';
    const videoUrl = content.videoUrl;

    const getYoutubeEmbed = (url: string) => {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
    };

    const embedUrl = videoUrl ? getYoutubeEmbed(videoUrl) : null;

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
        </div>

        {embedUrl ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-black shadow-xs">
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : videoUrl ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
            <video src={videoUrl} controls className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-3 text-center">
            <Film className="w-8 h-8 text-slate-400 mb-1" />
            <span className="text-xs text-slate-500 font-medium">동영상 URL을 입력해주세요</span>
          </div>
        )}

        {!isViewMode && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="text"
              placeholder="동영상 URL (유튜브 또는 비디오 링크)"
              value={videoUrl || ''}
              onChange={(e) =>
                onUpdate(element.id, {
                  content: { ...content, videoUrl: e.target.value.trim() },
                })
              }
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>
    );
  };

  // 18. Audio Card (Audio Player)
  const renderAudioCard = () => {
    const { content } = element;
    const title = content.title || '오디오 카드';
    const audioUrl = content.audioUrl;
    const fileName = content.audioFileName || '오디오 파일';

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-lavender-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
              {fileName}
            </span>
          </div>
          {audioUrl ? (
            <audio src={audioUrl} controls className="w-full h-8 mt-1" />
          ) : (
            <span className="text-[11px] text-slate-400">오디오 파일 URL을 입력해주세요.</span>
          )}
        </div>

        {!isViewMode && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="text"
              placeholder="오디오 URL 입력 (.mp3, .wav 등)"
              value={audioUrl || ''}
              onChange={(e) =>
                onUpdate(element.id, {
                  content: { ...content, audioUrl: e.target.value.trim() },
                })
              }
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
            />
          </div>
        )}
      </div>
    );
  };

  // 19. Image Gallery Card
  const renderGalleryCard = () => {
    const { content } = element;
    const title = content.title || '이미지 갤러리';
    const images: GalleryImageItem[] = content.galleryImages || [
      { id: '1', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80', caption: '갤러리 1' },
      { id: '2', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80', caption: '갤러리 2' },
    ];

    const handleAddImage = () => {
      const url = window.prompt('이미지 URL을 입력하세요:');
      if (url && url.trim()) {
        const next: GalleryImageItem = {
          id: `img-${Date.now()}`,
          url: url.trim(),
          caption: `이미지 ${images.length + 1}`,
        };
        onUpdate(element.id, {
          content: { ...content, galleryImages: [...images, next] },
        });
      }
    };

    const handleDeleteImage = (idx: number) => {
      onUpdate(element.id, {
        content: { ...content, galleryImages: images.filter((_, i) => i !== idx) },
      });
    };

    return (
      <div className="w-full flex flex-col">
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {images.length}장
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className="group relative rounded-xl overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
              {(img.caption || img.tag) && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] p-1 text-center">
                  <div className="truncate">{img.caption}</div>
                  {img.tag && <div className="text-[9px] opacity-80 truncate">{img.tag}</div>}
                </div>
              )}
              {!isViewMode && (
                <button
                  type="button"
                  onClick={() => handleDeleteImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="삭제"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {!isViewMode && (
            <button
              type="button"
              onClick={handleAddImage}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-lavender-500 hover:bg-lavender-50 dark:hover:bg-lavender-950/20 text-slate-400 hover:text-lavender-600 flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-semibold">추가</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // 20. Short Text Card
  const renderTextCard = () => {
    const { content, style } = element;
    const title = content.title || '텍스트 카드';
    const text = content.text || '여기에 텍스트를 입력하세요.';

    return (
      <div className="w-full flex flex-col">
        {title && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <FileText className="w-3.5 h-3.5 text-lavender-600" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800 dark:text-slate-100' : ''}`}
            >
              {title}
            </h4>
          </div>
        )}
        {!isViewMode ? (
          <textarea
            value={text}
            rows={3}
            onChange={(e) =>
              onUpdate(element.id, {
                content: { ...content, text: e.target.value },
              })
            }
            style={{
              textAlign: style?.textAlign || 'left',
              fontSize: style?.fontSize ? `${style.fontSize}px` : '12px',
            }}
            className="w-full bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1 -mx-1 text-slate-700 dark:text-slate-200 resize-none leading-relaxed"
          />
        ) : (
          <p
            style={{
              textAlign: style?.textAlign || 'left',
              fontSize: style?.fontSize ? `${style.fontSize}px` : '12px',
            }}
            className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words"
          >
            {text}
          </p>
        )}
      </div>
    );
  };

  // 21. Section Heading (Layout Element)
  const renderSectionHeading = () => {
    const { content } = element;
    const title = content.title || '섹션 제목';

    return (
      <div className="w-full flex flex-col justify-center">
        {!isViewMode ? (
          <input
            type="text"
            value={title}
            onChange={(e) =>
              onUpdate(element.id, {
                content: { ...content, title: e.target.value },
              })
            }
            className="text-lg font-black text-slate-900 dark:text-slate-100 bg-transparent border-0 outline-hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 -mx-1"
          />
        ) : (
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        )}
        <div className="w-12 h-1 rounded-full bg-lavender-500 mt-1" />
      </div>
    );
  };

  // 22. Spacer (Layout Element)
  const renderSpacer = () => {
    const height = element.content.spacerHeight || element.height || 30;
    return (
      <div
        style={{ height: `${height}px` }}
        className={`w-full flex items-center justify-center ${
          !isViewMode ? 'border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-[10px]' : ''
        }`}
      >
        {!isViewMode && `여백 (${height}px)`}
      </div>
    );
  };

  // 23. Group Container (Layout Element)
  const renderGroupContainer = () => {
    const { content } = element;
    const title = content.title || '그룹 컨테이너';
    return (
      <div className="w-full h-full rounded-[inherit] relative pointer-events-none">
        <div className="absolute top-1.5 left-2 px-2 py-0.5 rounded-md bg-lavender-100/90 dark:bg-lavender-950/70 border border-lavender-200 dark:border-lavender-800 text-lavender-700 dark:text-lavender-300 text-[10px] font-bold">
          {title}
        </div>
      </div>
    );
  };

  // 24. Divider (Layout Element)
  const renderDivider = () => {
    const style = element.style;
    const borderStyle = element.content.lineStyle || 'solid';
    const borderColor = style?.borderColor || '#CBD5E1';
    const borderWidth = style?.borderWidth || 1;

    return (
      <div className="w-full h-full flex items-center justify-center">
        <hr
          style={{
            borderStyle,
            borderColor,
            borderWidth: `${borderWidth}px 0 0 0`,
          }}
          className="w-full"
        />
      </div>
    );
  };

  // 10. Legacy Components
  const renderLegacyContent = () => {
    const { type, content } = element;
    if (type === 'image') return renderCharacterImage();
    if (type === 'heading') {
      return (
        <div
          style={{ color: customTextColor }}
          className={`w-full h-full flex items-center select-none font-bold text-lg truncate ${!customTextColor ? 'text-slate-800' : ''}`}
        >
          {content.text || '제목'}
        </div>
      );
    }
    if (type === 'text') {
      return (
        <div
          style={{ color: customTextColor }}
          className={`w-full h-full text-xs leading-relaxed whitespace-pre-wrap break-words overflow-y-auto ${!customTextColor ? 'text-slate-700' : ''}`}
        >
          {content.text || '내용을 입력하세요.'}
        </div>
      );
    }
    if (type === 'info-field') return renderInfoCard();
    if (type === 'status-chart') return renderRadarChart();
    if (type === 'container') {
      return <div className="w-full h-full rounded-[inherit]" />;
    }
    if (type === 'divider') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <hr className="w-full border-slate-300" />
        </div>
      );
    }
    return null;
  };

  // Main Element Content Switcher
  const renderContent = () => {
    switch (element.type) {
      // A. 공통 컴포넌트 (13종)
      case 'image-card':
      case 'character-image':
      case 'image':
        return renderCharacterImage();
      case 'gallery-card':
        return renderGalleryCard();
      case 'text-card':
      case 'text':
        return renderTextCard();
      case 'narrative-card':
        return renderNarrativeCard();
      case 'detail-card':
      case 'info-card':
      case 'info-field':
        return renderInfoCard();
      case 'tag-card':
      case 'keyword-card':
        return renderKeywordCard();
      case 'quote-card':
        return renderQuoteCard();
      case 'table-card':
        return renderTableCard();
      case 'palette-card':
        return renderPaletteCard();
      case 'doc-link-card':
        return renderDocLinkCard();
      case 'video-card':
        return renderVideoCard();
      case 'audio-card':
        return renderAudioCard();
      case 'memo-card':
        return renderMemoCard();

      // B. 캐릭터 특화 컴포넌트 (3종)
      case 'profile-card':
        return renderProfileCard();
      case 'stat-card':
      case 'status-chart':
      case 'radar-chart':
        return renderStatCard();
      case 'relationship-card':
        return renderRelationshipCard();

      // C. 세계관 특화 컴포넌트 (3종)
      case 'hierarchy-card':
        return renderHierarchyCard();
      case 'category-list-card':
        return renderCategoryListCard();
      case 'zone-card':
        return renderZoneCard();

      // D. 레이아웃 요소 (4종)
      case 'section-heading':
      case 'heading':
        return renderSectionHeading();
      case 'divider':
        return renderDivider();
      case 'spacer':
        return renderSpacer();
      case 'group-container':
      case 'container':
        return renderGroupContainer();

      // 레거시 호환
      case 'name-badge':
        return renderNameBadge();

      default:
        return renderLegacyContent();
    }
  };

  // Effective styles
  const memoTheme = element.type === 'memo-card' ? getMemoTheme(element.style?.backgroundColor) : null;
  const rawBorderColor = element.style?.borderColor || memoTheme?.border || (isDark ? '#3A3948' : '#E5E7EB');
  const effectiveBorderColor = isDark ? blendCanvasColorForDarkMode(rawBorderColor, 0.7) : rawBorderColor;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        // Requirement 4, 5, 6, 7, 9: Auto-height for content-driven cards
        height: isAutoHeightType ? 'auto' : `${element.height}px`,
        minHeight: `${element.height || 60}px`,
        zIndex: element.zIndex,
        background: getContainerBackground(),
        borderColor: effectiveBorderColor,
        borderWidth:
          element.style?.borderWidth !== undefined
            ? `${element.style.borderWidth}px`
            : isCardSurface
            ? '1px'
            : '0px',
        borderRadius: `${element.style?.borderRadius ?? 12}px`,
        padding:
          element.style?.padding !== undefined
            ? `${element.style.padding}px`
            : element.type === 'character-image' || element.type === 'image'
            ? '0px'
            : undefined,
        boxShadow: element.style?.boxShadow || undefined,
        opacity: element.style?.opacity !== undefined ? element.style.opacity : 1,
      }}
      onMouseDown={handleMouseDownMove}
      onClick={(e) => {
        if (isViewMode) return;
        e.stopPropagation();
        onSelect(element.id, e);
      }}
      className={`blankspace-canvas-card group ${isCardSurface ? 'border' : ''} transition-colors duration-150 ${
        isViewMode
          ? 'cursor-default'
          : isLayoutLocked
          ? 'cursor-pointer hover:ring-1 hover:ring-lavender-400'
          : 'cursor-move hover:ring-1 hover:ring-lavender-300'
      } ${
        !isViewMode && isSelected
          ? 'ring-2 ring-lavender-500 ring-offset-1 shadow-lg'
          : ''
      }`}
    >
      {/* Element Inner Rendered Content */}
      {renderContent()}

      {/* Resize Handles - Shown ONLY when selected, NOT in view mode, and NOT layout-locked */}
      {!isViewMode && !isLayoutLocked && isSelected && (
        <>
          {/* For auto-height cards, provide ONLY horizontal ('e', 'w') resize handles */}
          {(isAutoHeightType
            ? (['e', 'w'] as ResizeHandleDirection[])
            : (['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as ResizeHandleDirection[])
          ).map((dir) => {
            const posStyles: Record<ResizeHandleDirection, string> = {
              nw: '-top-1.5 -left-1.5 cursor-nwse-resize',
              n: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
              ne: '-top-1.5 -right-1.5 cursor-nesw-resize',
              e: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize',
              se: '-bottom-1.5 -right-1.5 cursor-nwse-resize',
              s: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
              sw: '-bottom-1.5 -left-1.5 cursor-nesw-resize',
              w: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize',
            };

            return (
              <div
                key={dir}
                onMouseDown={(e) => handleMouseDownResize(dir, e)}
                className={`absolute w-3 h-3 bg-white border-2 border-lavender-600 rounded-full z-30 shadow-xs ${posStyles[dir]}`}
              />
            );
          })}
        </>
      )}
    </div>
  );
};
