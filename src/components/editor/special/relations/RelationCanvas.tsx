import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  RelationCharacter,
  RelationItem,
  RelationGroup,
  RelationLegendItem,
  CharacterRelationsDocData,
  AnchorPosition,
  DEFAULT_RELATION_LEGENDS,
} from '../../../../types/relations';
import {
  calculateDonutPositions,
  getProfileEdgePoints,
  getAnchorCoordinates,
  getNodeDimensions,
  PROFILE_RADIUS,
} from './relationsPresets';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Hand,
  MousePointer2,
  GitCommit,
  Link2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';
import { useTheme } from '../../../../store/ThemeContext';

interface RelationCanvasProps {
  characters: RelationCharacter[];
  relations: RelationItem[];
  groups?: RelationGroup[];
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
  onUpdateGroupPosition?: (
    id: string,
    updates: Partial<RelationGroup>
  ) => void;
}

interface DragConnectingState {
  sourceId: string;
  sourceAnchor?: AnchorPosition;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const ANCHORS: AnchorPosition[] = ['north', 'east', 'south', 'west'];

export const RelationCanvas: React.FC<RelationCanvasProps> = ({
  characters,
  relations,
  groups = [],
  legends = DEFAULT_RELATION_LEGENDS,
  legendSettings = { visible: true, x: 32, y: 32, orientation: 'vertical' },
  selectedCharacterId,
  selectedRelationId,
  selectedGroupId,
  highlightedLegendId,
  isEditMode,
  activeTool: externalActiveTool = 'pointer',
  onSelectCharacter,
  onSelectRelation,
  onSelectGroup,
  onToggleLegendHighlight,
  onUpdateLegendSettings,
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
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  useEffect(() => {
    if (legendSettings.x !== undefined && legendSettings.y !== undefined) {
      setLegendPos({ x: legendSettings.x, y: legendSettings.y });
    }
  }, [legendSettings.x, legendSettings.y]);

  // Sync external tool
  useEffect(() => {
    if (externalActiveTool) setActiveTool(externalActiveTool);
  }, [externalActiveTool]);

  // Drag Connection State (캐릭터 간 관계선 연결)
  const [dragConnecting, setDragConnecting] = useState<DragConnectingState | null>(null);
  const [hoveredCharId, setHoveredCharId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<{ charId: string; anchor: AnchorPosition } | null>(null);

  // 캔버스 중심 좌표 (도넛의 중심점)
  const canvasCenter = { x: 620, y: 460 };

  // 핵심: 캐릭터 목록이 늘어나거나 줄어들 때 항상 완벽한 도넛 형태로 자동 재배치!
  const positionsMap = useMemo(() => {
    return calculateDonutPositions(characters, canvasCenter.x, canvasCenter.y);
  }, [characters, canvasCenter.x, canvasCenter.y]);

  // Character Map
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

  // Native non-passive Wheel listener for Zoom (Ctrl+Wheel) and Pan
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

  // Handle Pan Drag Start
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
    // 1. Panning canvas
    if (isPanning) {
      setPan({
        x: Math.round(e.clientX - panStartRef.current.x),
        y: Math.round(e.clientY - panStartRef.current.y),
      });
      return;
    }

    // 2. Dragging connection line
    if (dragConnecting && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;

      setDragConnecting({
        ...dragConnecting,
        currentX: rawX,
        currentY: rawY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    // If dragging connection line dropped on another character
    if (dragConnecting) {
      if (hoveredCharId && hoveredCharId !== dragConnecting.sourceId) {
        onCreateRelation(
          dragConnecting.sourceId,
          hoveredCharId,
          dragConnecting.sourceAnchor,
          hoveredAnchor?.anchor
        );
      }
      setDragConnecting(null);
    }
  };

  // 노드 클릭 (핵심: 편집 모드여도 프로필 위치 이동 불가, 선택만 가능!)
  const handleNodeClick = (charId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCharacter(charId);
    onSelectRelation(null);
    onSelectGroup?.(null);
  };

  // 편집 모드에서 노드 본체 또는 앵커를 드래그하여 관계선 연결 시작
  const handleStartNodeConnect = (charId: string, anchor?: AnchorPosition, e?: React.MouseEvent) => {
    if (!isEditMode) return;
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const pos = positionsMap.get(charId);
    if (!pos) return;

    const char = charMap.get(charId);
    const startCoord = anchor
      ? getAnchorCoordinates(pos, anchor, char?.shape, char?.size)
      : { x: pos.x, y: pos.y };

    setDragConnecting({
      sourceId: charId,
      sourceAnchor: anchor,
      startX: startCoord.x,
      startY: startCoord.y,
      currentX: startCoord.x,
      currentY: startCoord.y,
    });
  };

  // Canvas View Controls
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
        backgroundColor: '#FAFAFD',
      }}
      className={`interactive-canvas-bg relative w-full h-full overflow-hidden select-none ${
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
      {/* 1. FLOATING RELATION LEGEND BOX (이미지 좌측 상단 범례 박스)        */}
      {/* ================================================================= */}
      {legendSettings.visible !== false && legends.length > 0 && (
        <div
          data-export-ignore="true"
          style={{
            left: `${legendPos.x}px`,
            top: `${legendPos.y}px`,
          }}
          className="absolute z-40 select-none shadow-sm rounded-2xl bg-white/95 border border-slate-200/90 backdrop-blur-xs min-w-[170px]"
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
                      ? 'font-bold text-slate-900 scale-[1.02]'
                      : isDimmed
                      ? 'opacity-35 text-slate-400'
                      : 'text-slate-800 hover:text-lavender-700'
                  }`}
                >
                  {/* Square color swatch matching user's image */}
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
        className="absolute bottom-5 right-5 z-30 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md"
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10))}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title="축소"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleResetView}
          className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 hover:text-lavender-600"
          title="100% 리셋"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title="확대"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={handleFitToScreen}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title="화면 맞춤"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {(pan.x !== 0 || pan.y !== 0) && (
          <button
            type="button"
            onClick={() => setPan({ x: 0, y: 0 })}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
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
        {/* Layer 1: SVG Layer (Relationship Curves & Arrows) */}
        <svg
          width="2600"
          height="2000"
          className="absolute inset-0 pointer-events-none overflow-visible z-20"
        >
          <defs>
            {/* Arrow Marker for Relationship Direction (End Arrow) */}
            <marker
              id="rel-arrow-end"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
            </marker>

            {/* Arrow Marker for Relationship Direction (Start Arrow) */}
            <marker
              id="rel-arrow-start"
              viewBox="0 0 10 10"
              refX="2"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
            </marker>

            {/* Glowing filter for selected line */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Dynamic Linear Gradients */}
            {relations.map((rel) => {
              if (!rel.gradient) return null;
              return (
                <linearGradient
                  key={`grad-${rel.id}`}
                  id={`grad-${rel.id}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={rel.gradient.fromColor} />
                  <stop offset="100%" stopColor={rel.gradient.toColor} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Render All Relationship Curves */}
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

            // Opacity Logic
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

            const { start, end, ctrl, mid } = getProfileEdgePoints(
              fromPos,
              toPos,
              rel.sourceAnchor,
              rel.targetAnchor,
              charA?.shape,
              charB?.shape,
              rel.curvature,
              charA?.size || 88,
              charB?.size || 88
            );

            const pathD = `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
            const strokeColor = rel.gradient ? `url(#grad-${rel.id})` : rel.color || '#EF4444';
            const baseColor = rel.color || rel.gradient?.fromColor || '#EF4444';

            // Direction arrow configuration
            const dir = rel.direction || 'bidirectional';
            const showStartArrow = dir === 'bidirectional' || dir === 'target-to-source';
            const showEndArrow = dir === 'bidirectional' || dir === 'source-to-target';

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
                {/* Thick Invisible Hover Area */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="24"
                />

                {/* Visible Curve Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={
                    rel.style === 'dashed' ? '7 5' : rel.style === 'dotted' ? '2 4' : undefined
                  }
                  markerStart={showStartArrow ? 'url(#rel-arrow-start)' : undefined}
                  markerEnd={showEndArrow ? 'url(#rel-arrow-end)' : undefined}
                  filter={isSelected || isHighlightedByLegend ? 'url(#glow)' : undefined}
                  className="transition-all duration-150"
                />

                {/* Optional Relation Type Badge on Line (Center) */}
                {rel.showLabel && (
                  <g
                    transform={`translate(${mid.x}, ${mid.y})`}
                    className="pointer-events-auto select-none"
                  >
                    <rect
                      x="-36"
                      y="-11"
                      width="72"
                      height="22"
                      rx="11"
                      fill="#FFFFFF"
                      stroke={isSelected ? baseColor : '#CBD5E1'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="shadow-xs"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={baseColor}
                      fontSize="9.5"
                      fontWeight="800"
                      className="select-none pointer-events-none"
                    >
                      {rel.label || rel.relationType}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Active Drag-Connection Live Preview Arrow */}
          {dragConnecting && (
            <g className="pointer-events-none" style={{ color: '#8B5CF6' }}>
              <path
                d={`M ${dragConnecting.startX} ${dragConnecting.startY} L ${dragConnecting.currentX} ${dragConnecting.currentY}`}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                markerEnd="url(#rel-arrow-end)"
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
        {/* Layer 2: Character Portrait Nodes (완벽한 도넛 형태 고정 배치)   */}
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
          const borderWidth = char.borderWidth || 4;
          const borderColor = char.borderColor || char.color || '#EF4444';

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
              onClick={(e) => handleNodeClick(char.id, e)}
              className={`absolute interactive-node select-none z-30 group cursor-pointer ${
                isSelected
                  ? 'ring-4 ring-lavender-500/70 shadow-2xl scale-105'
                  : isTargetHovered
                  ? 'ring-4 ring-emerald-500/80 shadow-2xl scale-105'
                  : 'hover:scale-105 shadow-md hover:shadow-xl'
              }`}
            >
              {/* Circular Portrait Frame (이미지 스타일: 굵은 컬러 원형 프레임) */}
              <div
                style={{
                  borderWidth: `${borderWidth}px`,
                  borderColor: isSelected ? '#8B5CF6' : borderColor,
                }}
                className="w-full h-full rounded-full overflow-hidden shadow-md bg-white transition-colors"
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

              {/* 4 Direction Anchor Points (North, East, South, West) - Edit Mode Only */}
              {isEditMode &&
                ANCHORS.map((anchor) => {
                  const anchorPosStyles: Record<AnchorPosition, string> = {
                    north: '-top-2 left-1/2 -translate-x-1/2',
                    east: 'top-1/2 -right-2 -translate-y-1/2',
                    south: '-bottom-2 left-1/2 -translate-x-1/2',
                    west: 'top-1/2 -left-2 -translate-y-1/2',
                  };

                  const isThisAnchorHovered =
                    hoveredAnchor?.charId === char.id && hoveredAnchor.anchor === anchor;

                  return (
                    <div
                      key={anchor}
                      onMouseDown={(e) => handleStartNodeConnect(char.id, anchor, e)}
                      onMouseEnter={() => setHoveredAnchor({ charId: char.id, anchor })}
                      onMouseLeave={() => setHoveredAnchor(null)}
                      title={`${char.name}의 ${
                        anchor === 'north' ? '상' : anchor === 'east' ? '우' : anchor === 'south' ? '하' : '좌'
                      }쪽 앵커 (드래그하여 관계선 연결)`}
                      className={`absolute anchor-handle w-3.5 h-3.5 rounded-full z-40 cursor-crosshair transition-all border-2 ${
                        anchorPosStyles[anchor]
                      } ${
                        isThisAnchorHovered
                          ? 'bg-emerald-400 border-white scale-125 ring-2 ring-emerald-500/50'
                          : 'bg-lavender-500 border-white hover:bg-lavender-400 hover:scale-125 shadow-xs opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
