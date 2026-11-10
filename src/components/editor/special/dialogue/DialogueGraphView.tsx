import React, { useState, useRef, useMemo } from 'react';
import {
  DialogueLineNode,
} from '../../../../types/dialogue';
import {
  User,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Split,
  ArrowRight,
  MessageSquare,
  Plus,
} from 'lucide-react';

interface DialogueGraphViewProps {
  dialogues: DialogueLineNode[];
  selectedDialogueId: string | null;
  isEditMode: boolean;
  onSelectDialogue: (id: string) => void;
  onConnectNext: (sourceId: string, targetId: string, choiceId?: string) => void;
  onDisconnectNext: (sourceId: string, choiceId?: string) => void;
  onUpdatePosition: (id: string, pos: { x: number; y: number }) => void;
}

interface DragConnectingState {
  sourceId: string;
  choiceId?: string; // If connecting a specific choice
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const NODE_WIDTH = 260;

export const DialogueGraphView: React.FC<DialogueGraphViewProps> = ({
  dialogues,
  selectedDialogueId,
  isEditMode,
  onSelectDialogue,
  onConnectNext,
  onDisconnectNext,
  onUpdatePosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Dragging Node Position
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragNodeOffsetRef = useRef({ x: 0, y: 0 });

  // Dragging Connection Line
  const [dragConnecting, setDragConnecting] = useState<DragConnectingState | null>(null);
  const [hoveredTargetNodeId, setHoveredTargetNodeId] = useState<string | null>(null);

  const dialogueMap = useMemo(() => {
    return new Map(dialogues.map((d) => [d.id, d]));
  }, [dialogues]);

  // Handle Pan
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-node') || target.closest('.port-handle')) {
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

    // 2. Dragging node position
    if (draggingNodeId && containerRef.current && isEditMode) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentMouseX = (e.clientX - rect.left - pan.x) / zoom;
      const currentMouseY = (e.clientY - rect.top - pan.y) / zoom;

      onUpdatePosition(draggingNodeId, {
        x: Math.round(currentMouseX - dragNodeOffsetRef.current.x),
        y: Math.round(currentMouseY - dragNodeOffsetRef.current.y),
      });
      return;
    }

    // 3. Dragging connection line
    if (dragConnecting && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentMouseX = (e.clientX - rect.left - pan.x) / zoom;
      const currentMouseY = (e.clientY - rect.top - pan.y) / zoom;

      setDragConnecting({
        ...dragConnecting,
        currentX: currentMouseX,
        currentY: currentMouseY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);

    // If finishing a connection
    if (dragConnecting) {
      if (hoveredTargetNodeId && hoveredTargetNodeId !== dragConnecting.sourceId) {
        onConnectNext(
          dragConnecting.sourceId,
          hoveredTargetNodeId,
          dragConnecting.choiceId
        );
      }
      setDragConnecting(null);
    }
  };

  // Node Drag Start
  const handleNodeDragStart = (id: string, e: React.MouseEvent) => {
    if (!isEditMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('.port-handle')) return;

    e.stopPropagation();
    onSelectDialogue(id);

    const node = dialogueMap.get(id);
    if (!node || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const currentMouseX = (e.clientX - rect.left - pan.x) / zoom;
    const currentMouseY = (e.clientY - rect.top - pan.y) / zoom;

    dragNodeOffsetRef.current = {
      x: currentMouseX - node.position.x,
      y: currentMouseY - node.position.y,
    };
    setDraggingNodeId(id);
  };

  // Start Connection Line from an Output Port
  const handleStartConnection = (
    sourceId: string,
    choiceId: string | undefined,
    startX: number,
    startY: number,
    e: React.MouseEvent
  ) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();

    setDragConnecting({
      sourceId,
      choiceId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
  };

  // Zoom / Pan controls
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 60, y: 60 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.min(1.8, Math.max(0.4, z + delta)));
    }
  };

  // Collect all edges to render in SVG
  const edges = useMemo(() => {
    const list: Array<{
      id: string;
      sourceId: string;
      targetId: string;
      choiceId?: string;
      label?: string;
      isChoice: boolean;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }> = [];

    dialogues.forEach((d) => {
      // 1. Direct next connection
      if (d.nextDialogueId && (!d.choices || d.choices.length === 0)) {
        const target = dialogueMap.get(d.nextDialogueId);
        if (target) {
          list.push({
            id: `edge-${d.id}-${target.id}`,
            sourceId: d.id,
            targetId: target.id,
            isChoice: false,
            startX: d.position.x + NODE_WIDTH,
            startY: d.position.y + 55,
            endX: target.position.x,
            endY: target.position.y + 45,
          });
        }
      }

      // 2. Choices connections
      if (d.choices && d.choices.length > 0) {
        d.choices.forEach((c, cIdx) => {
          if (c.nextDialogueId) {
            const target = dialogueMap.get(c.nextDialogueId);
            if (target) {
              const choiceYOffset = 100 + cIdx * 34;
              list.push({
                id: `edge-${d.id}-${c.id}-${target.id}`,
                sourceId: d.id,
                targetId: target.id,
                choiceId: c.id,
                label: c.text,
                isChoice: true,
                startX: d.position.x + NODE_WIDTH,
                startY: d.position.y + choiceYOffset,
                endX: target.position.x,
                endY: target.position.y + 45,
              });
            }
          }
        });
      }
    });

    return list;
  }, [dialogues, dialogueMap]);

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
      {/* Zoom / Pan Controls Overlay */}
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
          onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
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

      {/* Canvas Transform Space */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '3000px',
          height: '2400px',
        }}
        className="relative pointer-events-auto"
      >
        {/* SVG Edge Connection Lines */}
        <svg
          width="3000"
          height="2400"
          className="absolute inset-0 pointer-events-none overflow-visible"
        >
          <defs>
            <marker
              id="graph-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#8B5CF6" />
            </marker>
            <marker
              id="graph-arrow-choice"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
            </marker>
          </defs>

          {/* Render All Existing Edges */}
          {edges.map((e) => {
            const dx = Math.abs(e.endX - e.startX) * 0.5;
            const c1x = e.startX + Math.max(40, dx);
            const c1y = e.startY;
            const c2x = e.endX - Math.max(40, dx);
            const c2y = e.endY;

            const pathD = `M ${e.startX} ${e.startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${e.endX} ${e.endY}`;
            const isHighlighted =
              selectedDialogueId === e.sourceId || selectedDialogueId === e.targetId;

            return (
              <g
                key={e.id}
                className="pointer-events-auto cursor-pointer group"
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (isEditMode) {
                    onDisconnectNext(e.sourceId, e.choiceId);
                  }
                }}
              >
                {/* Thick Invisible Area for Clicking to Disconnect */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" />

                {/* Visible Bezier Curve */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={e.isChoice ? '#F59E0B' : '#8B5CF6'}
                  strokeWidth={isHighlighted ? 3.5 : 2}
                  strokeDasharray={e.isChoice ? '6 4' : undefined}
                  markerEnd={e.isChoice ? 'url(#graph-arrow-choice)' : 'url(#graph-arrow)'}
                  className="transition-all duration-150 group-hover:stroke-rose-400 group-hover:stroke-[3]"
                />
              </g>
            );
          })}

          {/* Dragging Connection Preview Line */}
          {dragConnecting && (
            <path
              d={`M ${dragConnecting.startX} ${dragConnecting.startY} C ${
                dragConnecting.startX + 60
              } ${dragConnecting.startY}, ${dragConnecting.currentX - 60} ${
                dragConnecting.currentY
              }, ${dragConnecting.currentX} ${dragConnecting.currentY}`}
              fill="none"
              stroke="#A995F5"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              markerEnd="url(#graph-arrow)"
            />
          )}
        </svg>

        {/* Dialogue Nodes (HTML Cards) */}
        {dialogues.map((dlg) => {
          const isSelected = selectedDialogueId === dlg.id;
          const isHoveredTarget =
            dragConnecting &&
            hoveredTargetNodeId === dlg.id &&
            dragConnecting.sourceId !== dlg.id;

          const hasChoices = dlg.choices && dlg.choices.length > 0;

          return (
            <div
              key={dlg.id}
              style={{
                left: `${dlg.position.x}px`,
                top: `${dlg.position.y}px`,
                width: `${NODE_WIDTH}px`,
              }}
              onMouseDown={(e) => handleNodeDragStart(dlg.id, e)}
              onMouseEnter={() => setHoveredTargetNodeId(dlg.id)}
              onMouseLeave={() => setHoveredTargetNodeId(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDialogue(dlg.id);
              }}
              className={`absolute interactive-node rounded-2xl bg-[#22222C] border-2 shadow-lg transition-shadow duration-150 flex flex-col ${
                isSelected
                  ? 'border-lavender-500 ring-4 ring-lavender-500/20 shadow-xl'
                  : isHoveredTarget
                  ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                  : 'border-[#3A3948] hover:border-slate-500'
              } ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
            >
              {/* Left Input Port (Target) */}
              <div
                title="다음 대사 연결 입력점"
                className={`port-handle absolute -left-2 top-10 w-4 h-4 rounded-full border-2 border-[#17171D] bg-lavender-500 z-10 transition-transform ${
                  isHoveredTarget ? 'scale-125 bg-emerald-400' : ''
                }`}
              />

              {/* Node Header */}
              <div className="p-3 border-b border-[#3A3948] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-lavender-400">
                    #{String(dlg.order).padStart(2, '0')}
                  </span>
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-[#292936] shrink-0 border border-[#3A3948]">
                    {dlg.speakerAvatarUrl ? (
                      <img src={dlg.speakerAvatarUrl} alt={dlg.speakerName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3 h-3 text-slate-400 m-auto mt-0.5" />
                    )}
                  </div>
                  <span className="font-bold text-xs text-[#E8E7EF] truncate">
                    {dlg.speakerName || '나레이션'}
                  </span>
                </div>

                {/* Right Output Port (Next Dialogue Port if NO choices) */}
                {!hasChoices && (
                  <div
                    title="다음 대사로 연결 (드래그)"
                    onMouseDown={(e) =>
                      handleStartConnection(
                        dlg.id,
                        undefined,
                        dlg.position.x + NODE_WIDTH,
                        dlg.position.y + 55,
                        e
                      )
                    }
                    className={`port-handle absolute -right-2 top-12 w-4 h-4 rounded-full border-2 border-[#17171D] bg-lavender-500 cursor-crosshair hover:scale-125 transition-transform z-10 ${
                      dlg.nextDialogueId ? 'bg-lavender-400' : 'bg-[#4E4D61]'
                    }`}
                  />
                )}
              </div>

              {/* Node Body: Speech Text Snippet */}
              <div className="p-3 text-xs text-[#A5A3B5] leading-relaxed line-clamp-3">
                "{dlg.text || '대사 내용 없음'}"
              </div>

              {/* Node Choices Outputs List (if choices exist) */}
              {hasChoices && (
                <div className="border-t border-[#3A3948] bg-[#1E1E27]/90 rounded-b-2xl p-2.5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Split className="w-3 h-3" />
                    <span>선택지 분기:</span>
                  </span>

                  {dlg.choices.map((c, cIdx) => {
                    const choiceY = dlg.position.y + 100 + cIdx * 34;
                    return (
                      <div
                        key={c.id}
                        className="relative flex items-center justify-between px-2 py-1 bg-[#292936] rounded-lg border border-[#3A3948] text-[11px]"
                      >
                        <span className="truncate font-medium text-[#E8E7EF] pr-4">
                          {cIdx + 1}. {c.text}
                        </span>

                        {/* Choice Output Port */}
                        <div
                          title={`선택지 '${c.text}' 연결 (드래그)`}
                          onMouseDown={(e) =>
                            handleStartConnection(
                              dlg.id,
                              c.id,
                              dlg.position.x + NODE_WIDTH,
                              choiceY,
                              e
                            )
                          }
                          className="port-handle absolute -right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#17171D] bg-amber-500 cursor-crosshair hover:scale-125 transition-transform z-10"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

