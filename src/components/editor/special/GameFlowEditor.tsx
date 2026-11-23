import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';
import { useToast } from '../../toast/ToastContext';

type FlowNodeKind = 'start-end' | 'process' | 'condition' | 'io' | 'note' | 'subsystem';

interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  label: string;
  description?: string;
  x: number;
  y: number;
  linkedDocId?: string;
  linkedDocTitle?: string;
  targetNodeId?: string;
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

const DEFAULT_NODES: FlowNode[] = [
  { id: 'fn-1', kind: 'start-end', label: '게임 시작', x: 165, y: 170 },
  { id: 'fn-2', kind: 'io', label: '플레이어 입력', x: 295, y: 170 },
  { id: 'fn-3', kind: 'process', label: '공격 실행', x: 430, y: 170 },
  {
    id: 'fn-4',
    kind: 'subsystem',
    label: '전투 처리 시스템',
    x: 575,
    y: 170,
    linkedDocId: 'doc-overview',
    linkedDocTitle: '전투 시스템 문서',
  },
  { id: 'fn-5', kind: 'note', label: '공격 판정은 서버 기준', x: 425, y: 65, targetNodeId: 'fn-3' },
  { id: 'fn-6', kind: 'condition', label: 'HP ≤ 0?', x: 580, y: 290 },
  { id: 'fn-7', kind: 'io', label: '피해량 출력', x: 410, y: 290 },
  { id: 'fn-8', kind: 'start-end', label: '전투 종료', x: 580, y: 405 },
];

const DEFAULT_EDGES: FlowEdge[] = [
  { id: 'fe-1', from: 'fn-1', to: 'fn-2' },
  { id: 'fe-2', from: 'fn-2', to: 'fn-3' },
  { id: 'fe-3', from: 'fn-3', to: 'fn-4' },
  { id: 'fe-4', from: 'fn-4', to: 'fn-6' },
  { id: 'fe-5', from: 'fn-6', to: 'fn-7', label: '아니오' },
  { id: 'fe-6', from: 'fn-6', to: 'fn-8', label: '예' },
];

const KIND_LABELS: Record<FlowNodeKind, string> = {
  'start-end': '시작·끝',
  process: '처리',
  condition: '조건',
  io: '입력·출력',
  note: '주석',
  subsystem: '하위 시스템',
};

export const GameFlowEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const { showToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [nodes, setNodes] = useState<FlowNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<FlowEdge[]>(DEFAULT_EDGES);
  const [selectedId, setSelectedId] = useState<string | null>('fn-4');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isDocLinkOpen, setIsDocLinkOpen] = useState(false);
  const [liveDragNode, setLiveDragNode] = useState<{ id: string; x: number; y: number } | null>(null);
  const [connecting, setConnecting] = useState<{
    fromId: string;
    x: number;
    y: number;
    hoverTargetId?: string | null;
  } | null>(null);
  const [conditionEdgePicker, setConditionEdgePicker] = useState<string | null>(null);
  const canvasBoxRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') {
        setConnecting(null);
        setConditionEdgePicker(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && isEditMode && selectedEdgeId) {
        e.preventDefault();
        persist(
          nodes,
          edges.filter((ed) => ed.id !== selectedEdgeId)
        );
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [edges, isEditMode, nodes, selectedEdgeId]);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.nodes)) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges || []);
          return;
        }
      } catch {
        // ignore
      }
    }
    setNodes(DEFAULT_NODES);
    setEdges(DEFAULT_EDGES);
  }, [activePage?.id]);

  const persist = (nextNodes: FlowNode[], nextEdges = edges) => {
    setNodes(nextNodes);
    setEdges(nextEdges);
    if (activePage) {
      updatePage(activePage.id, {
        content: JSON.stringify({ nodes: nextNodes, edges: nextEdges }),
      });
    }
  };

  const selected = nodes.find((n) => n.id === selectedId) || null;

  const startDrag = (e: React.MouseEvent, node: FlowNode) => {
    if (!isEditMode || e.button !== 0) return;
    if ((e.target as HTMLElement).dataset?.portHandle) return;
    e.stopPropagation();
    setSelectedId(node.id);
    setSelectedEdgeId(null);
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = node.x;
    const oy = node.y;
    const scale = zoom / 100;
    let fx = ox;
    let fy = oy;
    let moved = false;
    const onMove = (ev: MouseEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return;
      moved = true;
      fx = Math.max(20, Math.round(ox + (ev.clientX - sx) / scale));
      fy = Math.max(20, Math.round(oy + (ev.clientY - sy) / scale));
      setLiveDragNode({ id: node.id, x: fx, y: fy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setLiveDragNode(null);
      if (moved) {
        persist(nodes.map((n) => (n.id === node.id ? { ...n, x: fx, y: fy } : n)));
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startConnectPort = (e: React.MouseEvent, fromNode: FlowNode) => {
    if (!isEditMode || e.button !== 0) return;
    e.stopPropagation();
    const box = canvasBoxRef.current;
    if (!box) return;
    const scale = zoom / 100;
    const rect = box.getBoundingClientRect();
    setConnecting({
      fromId: fromNode.id,
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    });

    const onMove = (ev: MouseEvent) => {
      const r = box.getBoundingClientRect();
      const cx = (ev.clientX - r.left) / scale;
      const cy = (ev.clientY - r.top) / scale;
      const near = nodes.find(
        (n) =>
          n.id !== fromNode.id &&
          cx >= n.x - 18 &&
          cx <= n.x + 138 &&
          cy >= n.y - 18 &&
          cy <= n.y + 62
      );
      setConnecting({
        fromId: fromNode.id,
        x: near ? near.x + 56 : cx,
        y: near ? near.y + 20 : cy,
        hoverTargetId: near?.id || null,
      });
    };

    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const r = box.getBoundingClientRect();
      const dropX = (ev.clientX - r.left) / scale;
      const dropY = (ev.clientY - r.top) / scale;
      const target = nodes.find(
        (n) =>
          n.id !== fromNode.id &&
          dropX >= n.x - 18 &&
          dropX <= n.x + 138 &&
          dropY >= n.y - 18 &&
          dropY <= n.y + 62
      );
      setConnecting(null);
      if (target) {
        if (fromNode.kind === 'note') {
          persist(
            nodes.map((n) => (n.id === fromNode.id ? { ...n, targetNodeId: target.id } : n)),
            edges
          );
          showToast(`주석을 '${target.label}' 노드에 연결했습니다`);
          return;
        }
        if (edges.some((ed) => ed.from === fromNode.id && ed.to === target.id)) {
          showToast('이미 연결된 노드입니다', { variant: 'error' });
          return;
        }
        const edgeId = `fe-${Date.now()}`;
        const newEdge: FlowEdge = {
          id: edgeId,
          from: fromNode.id,
          to: target.id,
          label: fromNode.kind === 'condition' ? '예' : undefined,
        };
        persist(nodes, [...edges, newEdge]);
        if (fromNode.kind === 'condition') {
          setConditionEdgePicker(edgeId);
        }
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '게임 플로우 (템플릿)' : activeDocument?.title || '게임 플로우'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="game-flow"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div
          className="flex-1 relative overflow-auto canvas-dot-grid"
          onDragOver={(e) => {
            if (isEditMode && e.dataTransfer.types.includes('application/x-blankspace-flow-node')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={(e) => {
            if (!isEditMode) return;
            const kind = e.dataTransfer.getData('application/x-blankspace-flow-node') as FlowNodeKind;
            const box = canvasBoxRef.current;
            if (!kind || !box) return;
            e.preventDefault();
            const rect = box.getBoundingClientRect();
            const scale = zoom / 100;
            const n: FlowNode = {
              id: `fn-${Date.now()}`,
              kind,
              label: KIND_LABELS[kind],
              x: Math.max(20, Math.round((e.clientX - rect.left) / scale - 56)),
              y: Math.max(20, Math.round((e.clientY - rect.top) / scale - 20)),
            };
            persist([...nodes, n]);
            setSelectedId(n.id);
          }}
        >
          {/* Left Floating Node Palette matching PDF Page 30 */}
          {isEditMode && (
            <div
              data-export-ignore="true"
              className="fixed top-20 left-16 z-20 w-32 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-3 shadow-md flex flex-col gap-1.5 text-xs"
            >
              <div className="text-[11px] font-bold text-[#8A8998] px-1">노드 (드래그 가능)</div>
              {(Object.keys(KIND_LABELS) as FlowNodeKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-blankspace-flow-node', k);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    const n: FlowNode = {
                      id: `fn-${Date.now()}`,
                      kind: k,
                      label: KIND_LABELS[k],
                      x: 260,
                      y: 120 + (nodes.length % 5) * 40,
                    };
                    persist([...nodes, n]);
                    setSelectedId(n.id);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845] font-medium"
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          )}

          {/* Flow Nodes & SVG Edges */}
          <div
            ref={canvasBoxRef}
            data-export-root="true"
            onClick={() => {
              setSelectedId(null);
              setSelectedEdgeId(null);
              setConditionEdgePicker(null);
            }}
            style={{
              width: 900,
              height: 540,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
            className="relative"
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L7,3 z" fill="#6A5ACD" />
                </marker>
              </defs>
              {/* Dashed links from Note nodes to their target nodes (§6-6) */}
              {nodes
                .filter((n) => n.kind === 'note' && n.targetNodeId)
                .map((noteNode) => {
                  const targetNode = nodes.find((t) => t.id === noteNode.targetNodeId);
                  if (!targetNode) return null;
                  const nx = (liveDragNode?.id === noteNode.id ? liveDragNode.x : noteNode.x) + 56;
                  const ny = (liveDragNode?.id === noteNode.id ? liveDragNode.y : noteNode.y) + 20;
                  const tx =
                    (liveDragNode?.id === targetNode.id ? liveDragNode.x : targetNode.x) + 56;
                  const ty =
                    (liveDragNode?.id === targetNode.id ? liveDragNode.y : targetNode.y) + 20;
                  return (
                    <line
                      key={`note-link-${noteNode.id}`}
                      x1={nx}
                      y1={ny}
                      x2={tx}
                      y2={ty}
                      stroke="#9A8FE6"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  );
                })}

              {edges.map((ed) => {
                const rawA = nodes.find((n) => n.id === ed.from);
                const rawB = nodes.find((n) => n.id === ed.to);
                if (!rawA || !rawB) return null;
                const ax = liveDragNode?.id === rawA.id ? liveDragNode.x : rawA.x;
                const ay = liveDragNode?.id === rawA.id ? liveDragNode.y : rawA.y;
                const bx = liveDragNode?.id === rawB.id ? liveDragNode.x : rawB.x;
                const by = liveDragNode?.id === rawB.id ? liveDragNode.y : rawB.y;
                const x1 = ax + 56;
                const y1 = ay + 20;
                const x2 = bx + 56;
                const y2 = by + 20;
                const isSelEdge = selectedEdgeId === ed.id;
                return (
                  <g
                    key={ed.id}
                    style={{ pointerEvents: 'auto', cursor: isEditMode ? 'pointer' : 'default' }}
                    onClick={(e) => {
                      if (!isEditMode) return;
                      e.stopPropagation();
                      setSelectedEdgeId(ed.id);
                      setSelectedId(null);
                      setConditionEdgePicker(ed.id);
                    }}
                  >
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="12" />
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isSelEdge ? '#4E3FB5' : '#6A5ACD'}
                      strokeWidth={isSelEdge ? '3' : '1.8'}
                      markerEnd="url(#flow-arrow)"
                    />
                    {ed.label && (
                      <text
                        x={(x1 + x2) / 2 + 8}
                        y={(y1 + y2) / 2 - 4}
                        fontSize="10.5"
                        fontWeight="600"
                        fill="#4E4D59"
                      >
                        {ed.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {connecting && (() => {
                const src = nodes.find((n) => n.id === connecting.fromId);
                if (!src) return null;
                return (
                  <line
                    x1={src.x + 56}
                    y1={src.y + 20}
                    x2={connecting.x}
                    y2={connecting.y}
                    stroke="#6A5ACD"
                    strokeDasharray="5 4"
                    strokeWidth="2"
                  />
                );
              })()}
            </svg>

            {conditionEdgePicker && (() => {
              const ed = edges.find((x) => x.id === conditionEdgePicker);
              const a = ed && nodes.find((n) => n.id === ed.from);
              const b = ed && nodes.find((n) => n.id === ed.to);
              if (!ed || !a || !b) return null;
              return (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ left: (a.x + b.x) / 2 + 40, top: (a.y + b.y) / 2 + 12 }}
                  className="bs-animate-popover absolute z-40 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-xl p-1.5 flex items-center gap-1 text-[11px]"
                >
                  {['예', '아니오', ''].map((lbl) => (
                    <button
                      key={lbl || 'none'}
                      type="button"
                      onClick={() => {
                        persist(
                          nodes,
                          edges.map((item) =>
                            item.id === ed.id ? { ...item, label: lbl || undefined } : item
                          )
                        );
                        setConditionEdgePicker(null);
                      }}
                      className="px-2 py-0.5 rounded-lg hover:bg-[#EBE8F5] dark:hover:bg-[#2C2845] font-semibold"
                    >
                      {lbl || '라벨 없음'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      persist(
                        nodes,
                        edges.filter((item) => item.id !== ed.id)
                      );
                      setConditionEdgePicker(null);
                    }}
                    className="px-2 py-0.5 rounded-lg text-rose-500 hover:bg-rose-50 font-semibold"
                  >
                    삭제
                  </button>
                </div>
              );
            })()}

            {nodes.map((node) => {
              const isSel = selectedId === node.id;
              const rx = liveDragNode?.id === node.id ? liveDragNode.x : node.x;
              const ry = liveDragNode?.id === node.id ? liveDragNode.y : node.y;
              const shapeClass =
                node.kind === 'start-end'
                  ? 'rounded-full'
                  : node.kind === 'note'
                    ? 'rounded-xl border-dashed'
                    : node.kind === 'io'
                      ? '-skew-x-12 rounded-lg'
                      : 'rounded-xl';

              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => startDrag(e, node)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(node.id);
                    setSelectedEdgeId(null);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isEditMode && node.linkedDocId) openDocument(node.linkedDocId);
                  }}
                  style={{ left: rx, top: ry }}
                  className={`group absolute min-w-[112px] px-3.5 py-2.5 bg-white dark:bg-[#1E1E29] border text-center text-xs font-semibold cursor-pointer select-none transition-shadow ${shapeClass} ${
                    isSel && isEditMode
                      ? 'border-[#6A5ACD] border-2 shadow-md z-20'
                      : 'border-[#B6ACEA] dark:border-[#494375] z-10'
                  }`}
                >
                  <span className={node.kind === 'io' ? 'skew-x-12 inline-block' : ''}>
                    {node.label}
                  </span>
                  {node.kind === 'subsystem' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#EBE8F5] text-[#6A5ACD] text-[9.5px]">
                      문서
                    </span>
                  )}

                  {/* 4 Edge Connection Ports in Edit Mode (magnetically scale up when hovered as connection target, §6-6) */}
                  {isEditMode && (() => {
                    const isMagnetTarget = connecting?.hoverTargetId === node.id;
                    const portClass = isMagnetTarget
                      ? 'opacity-100 scale-150 bg-[#4E3FB5] ring-2 ring-[#9A8FE6]'
                      : 'opacity-0 group-hover:opacity-100 bg-[#6A5ACD]';
                    return (
                      <>
                        <span
                          data-port-handle="true"
                          onMouseDown={(e) => startConnectPort(e, node)}
                          title="드래그해 연결"
                          className={` ${portClass} absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white cursor-crosshair transition-all duration-120`}
                        />
                        <span
                          data-port-handle="true"
                          onMouseDown={(e) => startConnectPort(e, node)}
                          title="드래그해 연결"
                          className={` ${portClass} absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white cursor-crosshair transition-all duration-120`}
                        />
                        <span
                          data-port-handle="true"
                          onMouseDown={(e) => startConnectPort(e, node)}
                          title="드래그해 연결"
                          className={` ${portClass} absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white cursor-crosshair transition-all duration-120`}
                        />
                        <span
                          data-port-handle="true"
                          onMouseDown={(e) => startConnectPort(e, node)}
                          title="드래그해 연결"
                          className={` ${portClass} absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white cursor-crosshair transition-all duration-120`}
                        />
                      </>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-5 right-[315px] inline-flex items-center gap-1 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] px-2 py-1 text-xs z-20">
            <button type="button" onClick={() => setZoom((z) => Math.max(70, z - 10))} className="px-1.5">
              −
            </button>
            <span className="w-10 text-center">{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(140, z + 10))} className="px-1.5">
              +
            </button>
          </div>
        </div>

        {/* Right Node Inspector matching PDF Page 30 */}
        {isEditMode && selected && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 select-none text-xs">
            <div>
              <div className="text-sm font-bold">노드 수정</div>
              <div className="text-[11px] text-[#8A8998] mt-0.5">{selected.label}</div>
            </div>

            <label className="flex items-center justify-between gap-2">
              <span>이름</span>
              <input
                type="text"
                value={selected.label}
                onChange={(e) =>
                  persist(nodes.map((n) => (n.id === selected.id ? { ...n, label: e.target.value } : n)))
                }
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              />
            </label>

            <label className="flex items-center justify-between gap-2">
              <span>유형</span>
              <select
                value={selected.kind}
                onChange={(e) =>
                  persist(
                    nodes.map((n) =>
                      n.id === selected.id ? { ...n, kind: e.target.value as FlowNodeKind } : n
                    )
                  )
                }
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              >
                {(Object.keys(KIND_LABELS) as FlowNodeKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>

            <textarea
              rows={3}
              value={selected.description || ''}
              onChange={(e) =>
                persist(
                  nodes.map((n) => (n.id === selected.id ? { ...n, description: e.target.value } : n))
                )
              }
              placeholder="노드 설명"
              className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] resize-none"
            />

            {selected.kind === 'note' && (
              <label className="flex items-center justify-between gap-2">
                <span>대상 노드</span>
                <select
                  value={selected.targetNodeId || ''}
                  onChange={(e) =>
                    persist(
                      nodes.map((n) =>
                        n.id === selected.id ? { ...n, targetNodeId: e.target.value || undefined } : n
                      )
                    )
                  }
                  className="w-36 h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                >
                  <option value="">연결 안 함</option>
                  {nodes
                    .filter((n) => n.id !== selected.id && n.kind !== 'note')
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                </select>
              </label>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#8A8998]">연결 문서</span>
              {selected.linkedDocId ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7FC] dark:bg-[#262436]">
                  <span className="font-semibold truncate">{selected.linkedDocTitle}</span>
                  <button
                    type="button"
                    onClick={() =>
                      persist(
                        nodes.map((n) =>
                          n.id === selected.id
                            ? { ...n, linkedDocId: undefined, linkedDocTitle: undefined }
                            : n
                        )
                      )
                    }
                    className="text-rose-500"
                  >
                    해제
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDocLinkOpen(true)}
                  className="text-left text-[#6A5ACD] font-semibold hover:underline"
                >
                  + 문서 연결
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  persist([
                    ...nodes,
                    { ...selected, id: `fn-${Date.now()}`, x: selected.x + 25, y: selected.y + 25 },
                  ])
                }
                className="px-3.5 py-1.5 rounded-xl border border-[#E6E3F0] font-semibold"
              >
                복제
              </button>
              <button
                type="button"
                onClick={() => {
                  persist(
                    nodes.filter((n) => n.id !== selected.id),
                    edges.filter((ed) => ed.from !== selected.id && ed.to !== selected.id)
                  );
                  setSelectedId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
              >
                삭제
              </button>
            </div>
          </aside>
        )}
      </div>

      <DocumentLinkModal
        isOpen={isDocLinkOpen}
        onClose={() => setIsDocLinkOpen(false)}
        onSelect={(doc) => {
          if (selected) {
            persist(
              nodes.map((n) =>
                n.id === selected.id
                  ? { ...n, linkedDocId: doc.id, linkedDocTitle: doc.title }
                  : n
              )
            );
          }
        }}
      />
    </div>
  );
};
