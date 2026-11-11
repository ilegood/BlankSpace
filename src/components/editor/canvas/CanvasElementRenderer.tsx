import React from 'react';
import {
  CanvasElement,
  NameField,
  InfoCardItem,
  KeywordTag,
  RelationshipItem,
} from '../../../types/canvas';
import {
  Sparkles,
  Image as ImageIcon,
  Quote,
  FileText,
  Tag,
  Heart,
  StickyNote,
} from 'lucide-react';

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
  // Elements that automatically adjust height based on content
  const isAutoHeightType = [
    'name-badge',
    'info-card',
    'narrative-card',
    'keyword-card',
    'relationship-card',
  ].includes(element.type);

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
      return `linear-gradient(${dir}, ${style.gradient.startColor}, ${style.gradient.endColor})`;
    }
    return style?.backgroundColor || undefined;
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
          const displayColor = f.color || customTextColor || (f.isPrimary ? undefined : '#64748B');

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

  // 7. Relationship Card (Auto-Height, NO scroll, custom relationship badge color)
  const renderRelationshipCard = () => {
    const { content } = element;
    const title = content.title || '주요 관계 요약';
    const rels: RelationshipItem[] = content.relationships || [
      { id: '1', name: '인물 A', relation: '동료', description: '생사를 함께 넘나든 든든한 전우' },
    ];

    return (
      <div className="w-full flex flex-col">
        {title && (
          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 shrink-0">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <h4
              style={{ color: customTextColor }}
              className={`text-xs font-bold truncate ${!customTextColor ? 'text-slate-800' : ''}`}
            >
              {title}
            </h4>
            <span className="text-[10px] text-slate-400 ml-auto">
              {rels.length}명
            </span>
          </div>
        )}

        {/* Removed overflow-y-auto so height adjusts automatically */}
        <div className="flex flex-col gap-2">
          {rels.map((r) => {
            // Requirement 7: Customizable relationship badge color (remove fixed red)
            const relColor = r.color || '#8B5CF6';

            return (
              <div
                key={r.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs"
              >
                <div
                  style={{
                    backgroundColor: `${relColor}20`,
                    color: relColor,
                  }}
                  className="w-7 h-7 rounded-lg font-bold flex items-center justify-center shrink-0 text-xs"
                >
                  {r.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{ color: customTextColor }}
                      className={`font-bold truncate ${!customTextColor ? 'text-slate-800' : ''}`}
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
                  </div>
                  <p
                    style={{ color: customTextColor }}
                    className={`text-[11px] mt-0.5 break-words whitespace-pre-wrap ${!customTextColor ? 'text-slate-500' : ''}`}
                  >
                    {r.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
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
      case 'character-image':
        return renderCharacterImage();
      case 'name-badge':
        return renderNameBadge();
      case 'info-card':
        return renderInfoCard();
      case 'narrative-card':
        return renderNarrativeCard();
      case 'keyword-card':
        return renderKeywordCard();
      case 'radar-chart':
        return renderRadarChart();
      case 'relationship-card':
        return renderRelationshipCard();
      case 'quote-card':
        return renderQuoteCard();
      case 'memo-card':
        return renderMemoCard();
      default:
        return renderLegacyContent();
    }
  };

  // Effective styles
  const memoTheme = element.type === 'memo-card' ? getMemoTheme(element.style?.backgroundColor) : null;
  const effectiveBorderColor = element.style?.borderColor || memoTheme?.border || undefined;

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
            : memoTheme
            ? '1px'
            : undefined,
        borderRadius:
          element.style?.borderRadius !== undefined
            ? `${element.style.borderRadius}px`
            : undefined,
        padding:
          element.style?.padding !== undefined
            ? `${element.style.padding}px`
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
      className={`group transition-shadow duration-100 ${
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
