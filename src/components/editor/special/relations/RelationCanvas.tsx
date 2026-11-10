import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  RelationCharacter,
  RelationItem,
  AnchorPosition,
} from '../../../../types/relations';
import {
  PROFILE_RADIUS,
  calculateCircularPositions,
  getProfileEdgePoints,
  getAnchorCoordinates,
  NodePosition,
} from './relationsPresets';
import {
  User,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface RelationCanvasProps {
  characters: RelationCharacter[];
  relations: RelationItem[];
  selectedCharacterId: string | null;
  selectedRelationId: string | null;
  isEditMode: boolean;
  onSelectCharacter: (id: string | null) => void;
  onSelectRelation: (id: string | null) => void;
  onCreateRelation: (
    sourceId: string,
    targetId: string,
    sourceAnchor?: AnchorPosition,
    targetAnchor?: AnchorPosition
  ) => void;
}

interface DragConnectingState {
  sourceId: string;
  sourceAnchor: AnchorPosition;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const ANCHORS: AnchorPosition[] = ['north', 'east', 'south', 'west'];

export const RelationCanvas: React.FC<RelationCanvasProps> = ({
  characters,
  relations,
  selectedCharacterId,
  selectedRelationId,
  isEditMode,
  onSelectCharacter,
  onSelectRelation,
  onCreateRelation,
}) => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Unity Animator Drag Connection State
  const [dragConnecting, setDragConnecting] = useState<DragConnectingState | null>(null);
  const [hoveredCharId, setHoveredCharId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<{ charId: string; anchor: AnchorPosition } | null>(null);

  // Hovered Memo Tooltip State
  const [hoveredMemo, setHoveredMemo] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  // Canvas Center Dimension
  const canvasCenter = { x: 550, y: 440 };

  // Calculate circular layout positions based on characters
  const positionsMap = useMemo(() => {
    return calculateCircularPositions(characters, canvasCenter.x, canvasCenter.y);
  }, [characters, canvasCenter.x, canvasCenter.y]);

  // Character Map
  const charMap = useMemo(() => {
    return new Map(characters.map((c) => [c.id, c]));
  }, [characters]);

  // Handle Pan Drag
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    // Only pan on left click or middle click directly on canvas background
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-node') || target.closest('.interactive-relation') || target.closest('.anchor-handle')) {
      return;
    }

    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Panning canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    // 2. Dragging connection line (Unity animator style)
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

    // If we were dragging a connection line and dropped on a target character
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

  // Start connection drag from an anchor point
  const handleStartConnect = (
    charId: string,
    anchor: AnchorPosition,
    e: React.MouseEvent
  ) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();

    const charPos = positionsMap.get(charId);
    if (!charPos) return;

    const pt = getAnchorCoordinates(charPos, anchor);
    setDragConnecting({
      sourceId: charId,
      sourceAnchor: anchor,
      startX: pt.x,
      startY: pt.y,
      currentX: pt.x,
      currentY: pt.y,
    });
  };

  // Reset zoom & pan to center
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.min(2, Math.max(0.4, prev + zoomDelta)));
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="flex-1 h-full relative overflow-hidden bg-[#17171D] select-none cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage:
          'radial-gradient(circle, #3A3948 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Floating Canvas Zoom Controls */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 bg-[#22222C]/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#3A3948] shadow-lg">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
          className="p-1.5 text-[#A5A3B5] hover:text-[#E8E7EF] hover:bg-[#292936] rounded-xl transition-colors"
          title="축소"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="px-2 py-0.5 text-xs font-mono font-bold text-[#E8E7EF] hover:text-lavender-400"
          title="화면 맞춤"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="p-1.5 text-[#A5A3B5] hover:text-[#E8E7EF] hover:bg-[#292936] rounded-xl transition-colors"
          title="확대"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-[#3A3948] mx-0.5" />
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 text-[#A5A3B5] hover:text-[#E8E7EF] hover:bg-[#292936] rounded-xl transition-colors"
          title="중앙 맞춤"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Pan/Zoom Canvas Transform Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '1100px',
          height: '880px',
        }}
        className="relative pointer-events-auto"
      >
        {/* SVG Layer: Relationship Lines & Dynamic Curves */}
        <svg
          width="1100"
          height="880"
          className="absolute inset-0 pointer-events-none overflow-visible"
        >
          <defs>
            {/* Arrow Marker for Relationship Direction */}
            <marker
              id="relation-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#8B5CF6" />
            </marker>

            {/* Glowing filter for selected line */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render All Relations */}
          {relations.map((rel) => {
            const fromPos = positionsMap.get(rel.sourceId);
            const toPos = positionsMap.get(rel.targetId);
            if (!fromPos || !toPos) return null;

            const isSelected = selectedRelationId === rel.id;
            const isRelatedToSelectedChar =
              selectedCharacterId &&
              (rel.sourceId === selectedCharacterId || rel.targetId === selectedCharacterId);

            // Opacity dimming if another character is selected
            const opacity =
              selectedCharacterId
                ? isRelatedToSelectedChar
                  ? 1
                  : 0.15
                : 1;

            const { start, end, ctrl, mid } = getProfileEdgePoints(
              fromPos,
              toPos,
              rel.sourceAnchor,
              rel.targetAnchor
            );

            const pathD = `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;

            return (
              <g
                key={rel.id}
                className="interactive-relation pointer-events-auto cursor-pointer"
                style={{ opacity, transition: 'opacity 0.2s ease' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRelation(rel.id);
                  onSelectCharacter(null);
                }}
              >
                {/* Thick Invisible Hover Area for easy clicking */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                />

                {/* Visible Curve Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={rel.color || '#8B5CF6'}
                  strokeWidth={isSelected ? (rel.strokeWidth || 3) + 2 : rel.strokeWidth || 2.5}
                  strokeDasharray={rel.style === 'dashed' ? '5 5' : undefined}
                  filter={isSelected ? 'url(#glow)' : undefined}
                  className="transition-all duration-150"
                />

                {/* Relation Type Badge on Line (Near Center) */}
                <g
                  transform={`translate(${mid.x}, ${mid.y})`}
                  className="pointer-events-auto"
                >
                  <rect
                    x="-32"
                    y="-11"
                    width="64"
                    height="22"
                    rx="11"
                    fill="#1E1E27"
                    stroke={isSelected ? rel.color : '#3A3948'}
                    strokeWidth={isSelected ? '2' : '1'}
                    className="shadow-md"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isSelected ? '#FFFFFF' : '#E8E7EF'}
                    fontSize="9.5"
                    fontWeight="700"
                    className="select-none pointer-events-none"
                  >
                    {rel.relationType}
                  </text>
                </g>

                {/* Comment Icon (💬) if relation has memo (Requirement 7) */}
                {rel.memo?.trim() && (
                  <g
                    transform={`translate(${mid.x + 36}, ${mid.y - 12})`}
                    className="cursor-pointer pointer-events-auto group"
                    onMouseEnter={() =>
                      setHoveredMemo({
                        text: rel.memo!,
                        x: mid.x + 36,
                        y: mid.y - 12,
                      })
                    }
                    onMouseLeave={() => setHoveredMemo(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRelation(rel.id);
                    }}
                  >
                    <circle
                      r="10"
                      fill="#EC4899"
                      className="shadow-sm group-hover:scale-110 transition-transform"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      💬
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Active Drag-Connection Live Preview Arrow (Unity Animator Style) */}
          {dragConnecting && (
            <g className="pointer-events-none">
              <path
                d={`M ${dragConnecting.startX} ${dragConnecting.startY} L ${dragConnecting.currentX} ${dragConnecting.currentY}`}
                fill="none"
                stroke="#A995F5"
                strokeWidth="3"
                strokeDasharray="6 4"
                markerEnd="url(#relation-arrow)"
              />
              <circle
                cx={dragConnecting.currentX}
                cy={dragConnecting.currentY}
                r="5"
                fill="#A995F5"
              />
            </g>
          )}
        </svg>

        {/* HTML Layer: Circular Character Profiles (Always auto-arranged in a circle) */}
        {characters.map((char) => {
          const pos = positionsMap.get(char.id);
          if (!pos) return null;

          const isSelected = selectedCharacterId === char.id;
          const isTargetHovered =
            dragConnecting &&
            hoveredCharId === char.id &&
            dragConnecting.sourceId !== char.id;

          return (
            <div
              key={char.id}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setHoveredCharId(char.id)}
              onMouseLeave={() => setHoveredCharId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCharacter(char.id);
                onSelectRelation(null);
              }}
              className="absolute interactive-node flex flex-col items-center cursor-pointer select-none group"
            >
              {/* Circular Avatar Container */}
              <div
                className={`relative rounded-full transition-all duration-150 flex items-center justify-center ${
                  isSelected
                    ? 'ring-4 ring-lavender-500 ring-offset-2 ring-offset-[#17171D] scale-110 shadow-xl'
                    : isTargetHovered
                    ? 'ring-4 ring-emerald-500 scale-105'
                    : 'border-2 border-[#3A3948] hover:border-lavender-400 shadow-md hover:scale-105'
                }`}
                style={{
                  width: `${PROFILE_RADIUS * 2}px`,
                  height: `${PROFILE_RADIUS * 2}px`,
                  backgroundColor: '#22222C',
                }}
              >
                {char.imageUrl ? (
                  <img
                    src={char.imageUrl}
                    alt={char.name}
                    className="w-full h-full rounded-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#292936] flex items-center justify-center text-slate-400">
                    <User className="w-8 h-8" />
                  </div>
                )}

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
                        onMouseDown={(e) => handleStartConnect(char.id, anchor, e)}
                        onMouseEnter={() => setHoveredAnchor({ charId: char.id, anchor })}
                        onMouseLeave={() => setHoveredAnchor(null)}
                        title={`${char.name}의 ${anchor === 'north' ? '북' : anchor === 'east' ? '동' : anchor === 'south' ? '남' : '서'}쪽 연결 지점 (드래그하여 연결)`}
                        className={`absolute anchor-handle w-3.5 h-3.5 rounded-full z-20 cursor-crosshair transition-all border-2 ${anchorPosStyles[anchor]} ${
                          isThisAnchorHovered
                            ? 'bg-emerald-400 border-white scale-125 ring-2 ring-emerald-500/50'
                            : 'bg-lavender-500 border-[#17171D] hover:bg-lavender-400 hover:scale-110 shadow-xs'
                        }`}
                      />
                    );
                  })}
              </div>

              {/* Character Name Label */}
              <div className="mt-2 flex flex-col items-center">
                <span className="font-bold text-xs text-[#E8E7EF] bg-[#22222C]/90 px-3 py-0.5 rounded-full border border-[#3A3948] shadow-xs truncate max-w-[120px] text-center">
                  {char.name}
                </span>
                {char.role && (
                  <span className="text-[10px] text-[#A5A3B5] mt-0.5 truncate max-w-[100px]">
                    {char.role}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Hovered Memo Tooltip Popover (Requirement 7) */}
        {hoveredMemo && (
          <div
            style={{
              left: `${hoveredMemo.x}px`,
              top: `${hoveredMemo.y - 12}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="absolute z-40 bg-[#292936] text-[#E8E7EF] text-[11px] p-2.5 rounded-xl border border-[#3A3948] shadow-2xl max-w-xs leading-relaxed pointer-events-none animate-in fade-in"
          >
            <div className="font-bold text-pink-400 mb-0.5 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>관계 메모</span>
            </div>
            <div className="line-clamp-3">{hoveredMemo.text}</div>
          </div>
        )}
      </div>
    </div>
  );
};
