import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  RelationCharacter,
  RelationItem,
  RelationLegendItem,
  CharacterRelationsDocData,
  AnchorPosition,
  DEFAULT_RELATION_LEGENDS,
} from '../../../../types/relations';
import {
  calculateDonutPositions,
  getProfileEdgePoints,
  getAnchorCoordinates,
} from './relationsPresets';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';
import { useTheme } from '../../../../store/ThemeContext';

interface RelationCanvasProps {
  characters: RelationCharacter[];
  relations: RelationItem[];
  legends?: RelationLegendItem[];
  legendSettings?: CharacterRelationsDocData['legendSettings'];
  selectedCharacterId: string | null;
  selectedRelationId: string | null;
  selectedGroupId?: string | null;
  highlightedLegendId?: string | null;
  isEditMode: boolean;
  activeTool?: 'pointer' | 'connect' | 'hand';
  onSelectCharacter: (id: string | null) => void;
  onSelectRelation: (id: string | null) => void;
  onSelectGroup?: (id: string | null) => void;
  onToggleLegendHighlight?: (legendId: string | null) => void;
  onUpdateLegendSettings?: (
    settings: Partial<NonNullable<CharacterRelationsDocData['legendSettings']>>
  ) => void;
  onCreateRelation: (
    sourceId: string,
    targetId: string,
    sourceAnchor?: AnchorPosition,
    targetAnchor?: AnchorPosition
  ) => void;
  onUpdateCharacterPosition?: (id: string, x: number, y: number) => void;
  onUpdateGroupPosition?: (id: string, updates: any) => void;
}

interface DragConnectingState {
  sourceId: string;
  sourceAnchor?: AnchorPosition;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const RelationCanvas: React.FC<RelationCanvasProps> = ({
  characters,
  relations,
  legends = DEFAULT_RELATION_LEGENDS,
  legendSettings = { visible: true, x: 32, y: 32, orientation: 'vertical' },
  selectedCharacterId,
  selectedRelationId,
  highlightedLegendId,
  isEditMode,
  activeTool: externalActiveTool = 'pointer',
  onSelectCharacter,
  onSelectRelation,
  onSelectGroup,
  onToggleLegendHighlight,
  onCreateRelation,
}) => {
  const { toast } = useToast();
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [activeTool, setActiveTool] = useState<'pointer' | 'connect' | 'hand'>('pointer');
  const panStartRef = useRef({ x: 0, y: 0 });

  // Floating Legend Box State
  const [legendPos, setLegendPos] = useState({
    x: legendSettings.x ?? 32,
    y: legendSettings.y ?? 32,
  });

  useEffect(() => {
    if (legendSettings.x !== undefined && legendSettings.y !== undefined) {
      setLegendPos({ x: legendSettings.x, y: legendSettings.y });
    }
  }, [legendSettings.x, legendSettings.y]);

  useEffect(() => {
    if (externalActiveTool) setActiveTool(externalActiveTool);
  }, [externalActiveTool]);

  // Drag Connection State
  const [dragConnecting, setDragConnecting] = useState<DragConnectingState | null>(null);
  const [hoveredCharId, setHoveredCharId] = useState<string | null>(null);
  const nodeDragRef = useRef<{
    charId: string;
    startClientX: number;
    startClientY: number;
    isDragging: boolean;
  } | null>(null);

  // 캔버스 중심 좌표 (도넛의 중심점)
  const canvasCenter = { x: 640, y: 460 };

  // 핵심: 캐릭터 수에 맞춰 도넛 형태로 균등 자동 배치
  const positionsMap = useMemo(() => {
    return calculateDonutPositions(characters, canvasCenter.x, canvasCenter.y);
  }, [characters, canvasCenter.x, canvasCenter.y]);

  const charMap = useMemo(() => {
    return new Map(characters.map((c) => [c.id, c]));
  }, [characters]);

  // Legend Filter: Map of connected characters
  const highlightedCharIds = useMemo(() => {
    if (!highlightedLegendId) return null;
    const set = new Set<string>();
    relations.forEach((r) => {
      if (r.legendId === highlightedLegendId) {
        set.add(r.sourceId);
        set.add(r.targetId);
      }
    });
    return set;
  }, [relations, highlightedLegendId]);

  // Native non-passive Wheel listener for Zoom & Pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
        setZoom((prev) => Math.max(0.25, Math.min(2.5, Math.round((prev + zoomDelta) * 100) / 100)));
        return;
      }

      e.preventDefault();
      setPan((prev) => ({
        x: Math.round(prev.x - (e.shiftKey ? e.deltaY : e.deltaX)),
        y: Math.round(prev.y - (e.shiftKey ? 0 : e.deltaY)),
      }));
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Spacebar Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool((t) => (t === 'hand' ? 'pointer' : 'hand'));
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('pointer');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTool('connect');
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault();
        handleResetView();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    const isMiddleClick = e.button === 1;
    const isHandMode = activeTool === 'hand' || isSpacePressed;
    const target = e.target as HTMLElement;
    const isBgClick =
      target.classList.contains('interactive-canvas-bg') ||
      target === containerRef.current;

    if (isMiddleClick || isHandMode || isBgClick) {
      if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        if (isBgClick) {
          onSelectCharacter(null);
          onSelectRelation(null);
          onSelectGroup?.(null);
        }

        setIsPanning(true);
        panStartRef.current = {
          x: e.clientX - pan.x,
          y: e.clientY - pan.y,
        };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: Math.round(e.clientX - panStartRef.current.x),
        y: Math.round(e.clientY - panStartRef.current.y),
      });
      return;
    }

    // 프로필 노드 드래그 감지 (5px 이상 이동 시 관계선 연결 모드 시작)
    if (nodeDragRef.current && !nodeDragRef.current.isDragging && isEditMode) {
      const dist = Math.hypot(
        e.clientX - nodeDragRef.current.startClientX,
        e.clientY - nodeDragRef.current.startClientY
      );
      if (dist > 5) {
        nodeDragRef.current.isDragging = true;
        const sourceId = nodeDragRef.current.charId;
        const pos = positionsMap.get(sourceId);
        if (pos && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const currentX = (e.clientX - rect.left - pan.x) / zoom;
          const currentY = (e.clientY - rect.top - pan.y) / zoom;
          setDragConnecting({
            sourceId,
            startX: pos.x,
            startY: pos.y,
            currentX,
            currentY,
          });
        }
      }
    }

    if (dragConnecting && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;

      setDragConnecting((prev) =>
        prev
          ? {
              ...prev,
              currentX: rawX,
              currentY: rawY,
            }
          : null
      );
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (dragConnecting) {
      if (hoveredCharId && hoveredCharId !== dragConnecting.sourceId) {
        onCreateRelation(dragConnecting.sourceId, hoveredCharId);
      }
      setDragConnecting(null);
      nodeDragRef.current = null;
      return;
    }

    if (nodeDragRef.current) {
      if (!nodeDragRef.current.isDragging) {
        // 드래그가 아니었으므로 클릭 선택 동작
        onSelectCharacter(nodeDragRef.current.charId);
        onSelectRelation(null);
        onSelectGroup?.(null);
      }
      nodeDragRef.current = null;
    }
  };

  // 프로필 노드 마우스 다운 (클릭 선택 또는 드래그 연결)
  const handleNodeMouseDown = (charId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (!isEditMode) {
      onSelectCharacter(charId);
      onSelectRelation(null);
      onSelectGroup?.(null);
      return;
    }

    nodeDragRef.current = {
      charId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      isDragging: false,
    };
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    if (characters.length === 0) {
      handleResetView();
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    characters.forEach((char) => {
      const p = positionsMap.get(char.id);
      if (p) {
        minX = Math.min(minX, p.x - 60);
        maxX = Math.max(maxX, p.x + 60);
        minY = Math.min(minY, p.y - 60);
        maxY = Math.max(maxY, p.y + 60);
      }
    });

    const boxW = Math.max(300, maxX - minX);
    const boxH = Math.max(300, maxY - minY);
    const containerW = containerRef.current?.clientWidth || 900;
    const containerH = containerRef.current?.clientHeight || 650;

    const fitZoom = Math.min(
      1.3,
      Math.max(0.4, Math.min(containerW / (boxW + 160), containerH / (boxH + 160)))
    );
    const roundedZoom = Math.round(fitZoom * 100) / 100;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(roundedZoom);
    setPan({
      x: Math.round(containerW / 2 - centerX * roundedZoom),
      y: Math.round(containerH / 2 - centerY * roundedZoom),
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        backgroundColor: isDark ? '#17171D' : '#FAFAFD',
      }}
      className={`interactive-canvas-bg relative w-full h-full overflow-hidden select-none transition-colors ${
        activeTool === 'hand' || isSpacePressed
          ? isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : activeTool === 'connect'
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
    >
      {/* ================================================================= */}
      {/* 1. FLOATING RELATION LEGEND BOX (다크모드 대응)                   */}
      {/* ================================================================= */}
      {legendSettings.visible !== false && legends.length > 0 && (
        <div
          data-export-ignore="true"
          style={{
            left: `${legendPos.x}px`,
            top: `${legendPos.y}px`,
          }}
          className="absolute z-40 select-none shadow-sm rounded-2xl bg-white/95 dark:bg-[#1E1E27]/95 border border-slate-200/90 dark:border-[#3A3948] backdrop-blur-xs min-w-[170px] transition-colors"
        >
          <div className="p-3 space-y-2">
            {legends.map((legend) => {
              const isHighlighted = highlightedLegendId === legend.id;
              const isDimmed = highlightedLegendId && !isHighlighted;

              return (
                <button
                  key={legend.id}
                  type="button"
                  onClick={() => {
                    if (highlightedLegendId === legend.id) {
                      onToggleLegendHighlight?.(null);
                    } else {
                      onToggleLegendHighlight?.(legend.id);
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-1 py-0.5 rounded-lg text-left transition-all ${
                    isHighlighted
                      ? 'font-bold text-slate-900 dark:text-white scale-[1.02]'
                      : isDimmed
                      ? 'opacity-35 text-slate-400 dark:text-[#7D7B90]'
                      : 'text-slate-800 dark:text-[#E8E7EF] hover:text-lavender-700 dark:hover:text-[#B7A5FF]'
                  }`}
                >
                  <span
                    style={{
                      backgroundColor: legend.color,
                      borderStyle: legend.style === 'dashed' ? 'dashed' : 'solid',
                    }}
                    className={`w-3.5 h-3.5 rounded-xs shrink-0 shadow-2xs ${
                      legend.style === 'dashed' ? 'border-2 border-purple-500 bg-transparent' : ''
                    }`}
                  />
                  <span className="text-xs font-semibold truncate tracking-tight">
                    {legend.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. BOTTOM FLOATING CONTROLS: Zoom, Fit, Pan Controls              */}
      {/* ================================================================= */}
      <div
        data-export-ignore="true"
        className="absolute bottom-5 right-5 z-30 flex items-center gap-1 p-1 bg-white/95 dark:bg-[#1E1E27]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-[#3A3948] shadow-md transition-colors"
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10))}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
          title="축소"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleResetView}
          className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:text-[#E8E7EF] hover:text-lavender-600 dark:hover:text-[#B7A5FF]"
          title="100% 리셋"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
          title="확대"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-slate-200 dark:bg-[#3A3948]" />

        <button
          type="button"
          onClick={handleFitToScreen}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
          title="화면 맞춤"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {(pan.x !== 0 || pan.y !== 0) && (
          <button
            type="button"
            onClick={() => setPan({ x: 0, y: 0 })}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
            title="원점(중앙) 복귀"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ================================================================= */}
      {/* 3. MAIN PAN/ZOOM CANVAS TRANSFORM CONTAINER                       */}
      {/* ================================================================= */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '2600px',
          height: '2000px',
        }}
        className="relative pointer-events-auto"
      >
        {/* Layer 1: SVG Layer (Relationship Curves, Gradients & Arrows) */}
        <svg
          width="2600"
          height="2000"
          className="absolute inset-0 pointer-events-none overflow-visible z-20"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Dynamic Linear Gradients (A와 B의 생각이 다를 때 표기: A에서 B 방향으로 그라데이션) */}
            {relations.map((rel) => {
              if (!rel.gradient) return null;
              const fromPos = positionsMap.get(rel.sourceId);
              const toPos = positionsMap.get(rel.targetId);
              if (!fromPos || !toPos) return null;

              const charA = charMap.get(rel.sourceId);
              const charB = charMap.get(rel.targetId);

              const { start, end } = getProfileEdgePoints(
                fromPos,
                toPos,
                rel.sourceAnchor,
                rel.targetAnchor,
                'circle',
                'circle',
                rel.curvature,
                charA?.size || 88,
                charB?.size || 88
              );

              return (
                <linearGradient
                  key={`grad-${rel.id}`}
                  id={`grad-${rel.id}`}
                  gradientUnits="userSpaceOnUse"
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                >
                  <stop offset="0%" stopColor={rel.gradient.fromColor} />
                  <stop offset="100%" stopColor={rel.gradient.toColor} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Render All Relationship Curves (화살표 삼각형 머리 삭제) */}
          {relations.map((rel) => {
            const charA = charMap.get(rel.sourceId);
            const charB = charMap.get(rel.targetId);
            const fromPos = positionsMap.get(rel.sourceId);
            const toPos = positionsMap.get(rel.targetId);
            if (!fromPos || !toPos) return null;

            const isSelected = selectedRelationId === rel.id;
            const isRelatedToSelectedChar =
              selectedCharacterId &&
              (rel.sourceId === selectedCharacterId || rel.targetId === selectedCharacterId);

            let opacity = 1;
            let isHighlightedByLegend = false;

            if (highlightedLegendId) {
              if (rel.legendId === highlightedLegendId) {
                opacity = 1;
                isHighlightedByLegend = true;
              } else {
                opacity = 0.12;
              }
            } else if (selectedCharacterId) {
              opacity = isRelatedToSelectedChar ? 1 : 0.15;
            }

            const { start, end, ctrl } = getProfileEdgePoints(
              fromPos,
              toPos,
              rel.sourceAnchor,
              rel.targetAnchor,
              'circle',
              'circle',
              rel.curvature,
              charA?.size || 88,
              charB?.size || 88
            );

            const pathD = `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
            const strokeColor = rel.gradient ? `url(#grad-${rel.id})` : rel.color || '#3B82F6';
            const baseColor = rel.color || rel.gradient?.fromColor || '#3B82F6';

            const strokeWidth = isSelected
              ? (rel.strokeWidth || 3.5) + 2
              : isHighlightedByLegend
              ? (rel.strokeWidth || 3.5) + 1.5
              : rel.strokeWidth || 3.5;

            return (
              <g
                key={rel.id}
                style={{
                  color: baseColor,
                  opacity,
                  transition: 'opacity 0.25s ease',
                }}
                className="interactive-relation pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRelation(rel.id);
                  onSelectCharacter(null);
                  onSelectGroup?.(null);
                }}
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                />

                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={
                    rel.style === 'dashed' ? '7 5' : rel.style === 'dotted' ? '2 4' : undefined
                  }
                  filter={isSelected || isHighlightedByLegend ? 'url(#glow)' : undefined}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {dragConnecting && (
            <g className="pointer-events-none" style={{ color: '#8B5CF6' }}>
              <path
                d={`M ${dragConnecting.startX} ${dragConnecting.startY} L ${dragConnecting.currentX} ${dragConnecting.currentY}`}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />
              <circle
                cx={dragConnecting.currentX}
                cy={dragConnecting.currentY}
                r="6"
                fill="#8B5CF6"
              />
            </g>
          )}
        </svg>

        {/* =============================================================== */}
        {/* Layer 2: Character Portrait Nodes (원형 고정 & 이름 on/off & 드래그 연결) */}
        {/* =============================================================== */}
        {characters.map((char) => {
          const pos = positionsMap.get(char.id);
          if (!pos) return null;

          const isSelected = selectedCharacterId === char.id;
          const isTargetHovered =
            dragConnecting &&
            hoveredCharId === char.id &&
            dragConnecting.sourceId !== char.id;

          const isDimmedByLegend =
            highlightedCharIds !== null && !highlightedCharIds.has(char.id);

          const size = char.size || 88;

          return (
            <div
              key={char.id}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
                width: `${size}px`,
                height: `${size}px`,
                opacity: isDimmedByLegend ? 0.3 : 1,
                transition: 'opacity 0.25s ease, transform 0.15s ease',
              }}
              onMouseEnter={() => setHoveredCharId(char.id)}
              onMouseLeave={() => setHoveredCharId(null)}
              onMouseDown={(e) => handleNodeMouseDown(char.id, e)}
              onClick={(e) => e.stopPropagation()}
              title={
                isEditMode
                  ? `${char.name} (클릭: 선택 / 드래그: 다른 캐릭터와 관계선 연결)`
                  : char.name
              }
              className={`absolute interactive-node select-none z-30 group cursor-pointer ${
                isSelected
                  ? 'ring-4 ring-lavender-500/70 shadow-2xl scale-105'
                  : isTargetHovered
                  ? 'ring-4 ring-emerald-500/80 shadow-2xl scale-105'
                  : 'hover:scale-105 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Circular Portrait Frame (원형 프로필 고정 & 모던한 단일 테두리) */}
              <div
                className={`w-full h-full rounded-full overflow-hidden shadow-md bg-white dark:bg-[#1E1E27] border-[3.5px] transition-colors ${
                  isSelected
                    ? 'border-lavender-500'
                    : isTargetHovered
                    ? 'border-emerald-500'
                    : 'border-slate-200 dark:border-[#3A3948]'
                }`}
              >
                <img
                  src={
                    char.imageUrl ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200'
                  }
                  alt={char.name}
                  className="w-full h-full object-cover rounded-full pointer-events-none select-none"
                  draggable={false}
                />
              </div>

              {/* 이름 on/off 토글 대응: char.showName !== false 일 때만 이름 표시 (보기 모드일 땐 배경/테두리 박스 완전 제거) */}
              {char.showName !== false && (
                <div
                  className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full ${
                    isEditMode
                      ? 'bg-white/95 dark:bg-[#1E1E27]/95 border border-slate-200 dark:border-[#3A3948] shadow-xs'
                      : 'bg-transparent border-transparent shadow-none'
                  } text-slate-800 dark:text-[#E8E7EF] flex items-center justify-center max-w-[110px] whitespace-nowrap z-30 transition-colors pointer-events-none`}
                >
                  <span className="text-[10.5px] font-bold truncate">
                    {char.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
