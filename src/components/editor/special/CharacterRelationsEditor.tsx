import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';
import { useToast } from '../../toast/ToastContext';

interface RelNode {
  id: string;
  name: string;
  linkedDocId?: string;
}

interface RelLegend {
  id: string;
  name: string;
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

interface RelEdge {
  id: string;
  fromId: string;
  toId: string;
  label: string;
  legendId: string;
  direction: 'left' | 'right' | 'both';
  color?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  width: number;
}

interface RelationsDocState {
  nodes: RelNode[];
  legends: RelLegend[];
  edges: RelEdge[];
  showLegend: boolean;
}

const DEFAULT_REL_STATE: RelationsDocState = {
  nodes: [
    { id: 'c1', name: '캐릭터 A', linkedDocId: 'doc-char-a' },
    { id: 'c2', name: '캐릭터 B', linkedDocId: 'doc-char-b' },
    { id: 'c3', name: '캐릭터 C' },
    { id: 'c4', name: '캐릭터 D' },
    { id: 'c5', name: '캐릭터 E' },
    { id: 'c6', name: '캐릭터 F' },
  ],
  legends: [
    { id: 'leg-1', name: '관계 유형 1', color: '#6A5ACD', lineStyle: 'solid' },
    { id: 'leg-2', name: '관계 유형 2', color: '#D97724', lineStyle: 'dashed' },
    { id: 'leg-3', name: '관계 유형 3', color: '#0F766E', lineStyle: 'dotted' },
  ],
  edges: [
    { id: 'e1', fromId: 'c1', toId: 'c2', label: '관계 이름', legendId: 'leg-1', direction: 'right', width: 2.5 },
    { id: 'e2', fromId: 'c1', toId: 'c3', label: '관계 이름', legendId: 'leg-1', direction: 'right', width: 2.5 },
    { id: 'e3', fromId: 'c2', toId: 'c4', label: '관계 이름', legendId: 'leg-2', direction: 'right', width: 2.5 },
    { id: 'e4', fromId: 'c3', toId: 'c5', label: '관계 이름', legendId: 'leg-3', direction: 'right', width: 2.5 },
    { id: 'e5', fromId: 'c5', toId: 'c6', label: '관계 이름', legendId: 'leg-1', direction: 'right', width: 2.5 },
    { id: 'e6', fromId: 'c6', toId: 'c1', label: '관계 이름', legendId: 'leg-2', direction: 'right', width: 2.5 },
    { id: 'e7', fromId: 'c4', toId: 'c1', label: '관계 이름', legendId: 'leg-1', direction: 'right', width: 2.5 },
  ],
  showLegend: true,
};

export const CharacterRelationsEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [state, setState] = useState<RelationsDocState>(DEFAULT_REL_STATE);
  const [inspectorTab, setInspectorTab] = useState<'edge' | 'character' | 'legend'>('edge');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedLegendId, setSelectedLegendId] = useState<string>('leg-1');
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<'out' | 'in' | null>(null);
  const [highlightedLegendId, setHighlightedLegendId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [newCharName, setNewCharName] = useState('');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [autoLayoutNotice, setAutoLayoutNotice] = useState(false);
  const [pickStep, setPickStep] = useState<'from' | 'to' | null>(null);
  const [pickFromId, setPickFromId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHighlightNodeId(null);
        setHighlightMode(null);
        setHighlightedLegendId(null);
        setPickStep(null);
        setPickFromId(null);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.nodes)) {
          setState(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }
    setState(DEFAULT_REL_STATE);
  }, [activePage?.id]);

  const persist = (next: RelationsDocState) => {
    setState(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify(next) });
  };

  const radius = 190;
  const cx = 360;
  const cy = 270;
  const nodeSize = state.nodes.length > 8 ? 50 : 62;

  const nodePos = (idx: number) => {
    const angle = (Math.PI * 2 * idx) / Math.max(1, state.nodes.length) - Math.PI / 2;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  };

  const handleNodeClick = (nodeId: string) => {
    if (pickStep) {
      if (pickStep === 'from') {
        setPickFromId(nodeId);
        setPickStep('to');
        return;
      }
      if (nodeId === pickFromId) {
        showToast('서로 다른 두 캐릭터를 선택해 주세요', { variant: 'error' });
        return;
      }
      const existingSameDir = state.edges.find(
        (ed) => ed.fromId === pickFromId && ed.toId === nodeId
      );
      if (existingSameDir) {
        setSelectedEdgeId(existingSameDir.id);
        setInspectorTab('edge');
        setPickStep(null);
        setPickFromId(null);
        showToast('기존 관계선을 선택했습니다');
        return;
      }
      const newEdge: RelEdge = {
        id: `e-${Date.now()}`,
        fromId: pickFromId!,
        toId: nodeId,
        label: '새 관계',
        legendId: state.legends[0]?.id || 'leg-1',
        direction: 'right',
        width: 2.5,
      };
      persist({ ...state, edges: [...state.edges, newEdge] });
      setSelectedEdgeId(newEdge.id);
      setInspectorTab('edge');
      setPickStep(null);
      setPickFromId(null);
      showToast('관계선을 추가했습니다');
      return;
    }

    if (highlightNodeId !== nodeId) {
      setHighlightNodeId(nodeId);
      setHighlightMode('out');
    } else if (highlightMode === 'out') {
      setHighlightMode('in');
    } else {
      setHighlightNodeId(null);
      setHighlightMode(null);
    }
  };

  const deleteEdgeWithUndo = (edgeId: string) => {
    const snapshot = state;
    persist({ ...state, edges: state.edges.filter((ed) => ed.id !== edgeId) });
    setSelectedEdgeId(null);
    showToast('관계선을 삭제했습니다', { onUndo: () => persist(snapshot) });
  };

  const deleteCharacterWithUndo = (nodeId: string) => {
    const snapshot = state;
    const name = state.nodes.find((n) => n.id === nodeId)?.name || '캐릭터';
    const removedEdges = state.edges.filter((e) => e.fromId === nodeId || e.toId === nodeId).length;
    persist({
      ...state,
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.fromId !== nodeId && e.toId !== nodeId),
    });
    if (highlightNodeId === nodeId) {
      setHighlightNodeId(null);
      setHighlightMode(null);
    }
    showToast(`'${name}' 삭제${removedEdges ? ` (관계선 ${removedEdges}개 포함)` : ''}`, {
      onUndo: () => persist(snapshot),
    });
  };

  const selectedEdge = state.edges.find((e) => e.id === selectedEdgeId) || null;
  const selectedLegend = state.legends.find((l) => l.id === selectedLegendId) || state.legends[0];

  const dashArray = (style: 'solid' | 'dashed' | 'dotted') =>
    style === 'dashed' ? '7 5' : style === 'dotted' ? '2 4' : undefined;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '캐릭터 관계도 (템플릿)' : activeDocument?.title || '캐릭터 관계도'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="character-relations"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Canvas Stage */}
        <div
          className="flex-1 relative overflow-auto bg-[#FAF9FE] dark:bg-[#15151C]"
          onClick={() => setSelectedEdgeId(null)}
        >
          <div className="p-4 flex items-center justify-between gap-4 relative z-20">
            {isEditMode ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (state.nodes.length < 2) {
                    showToast('관계선을 만들려면 캐릭터가 2명 이상 필요합니다', { variant: 'error' });
                    return;
                  }
                  setHighlightNodeId(null);
                  setHighlightMode(null);
                  if (pickStep) {
                    setPickStep(null);
                    setPickFromId(null);
                  } else {
                    setPickStep('from');
                    setPickFromId(null);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-white text-xs font-semibold ${
                  pickStep ? 'bg-[#4E3FB5]' : 'bg-[#6A5ACD] hover:bg-[#5A49B8]'
                }`}
              >
                {pickStep === 'from'
                  ? '① 출발 캐릭터를 선택하세요 (ESC 취소)'
                  : pickStep === 'to'
                    ? `② 도착 캐릭터를 선택하세요 (${state.nodes.find((n) => n.id === pickFromId)?.name} →)`
                    : '+ 관계선 추가'}
              </button>
            ) : (
              <div />
            )}

            {highlightNodeId ? (
              <div className="px-4 py-1.5 rounded-xl bg-[#EBE8F5] dark:bg-[#2C2845] text-center">
                <div className="text-xs font-bold text-[#4E3FB5] dark:text-[#B5A9F5]">
                  {state.nodes.find((n) => n.id === highlightNodeId)?.name}{' '}
                  {highlightMode === 'out' ? '→ 모두' : '← 모두'}
                </div>
                <div className="text-[10.5px] text-[#6E6D7A] dark:text-[#9E9CAF]">
                  {highlightMode === 'out'
                    ? '한 번 더 누르면 ← 모두 · 두 번 더 누르면 기본 상태'
                    : '한 번 더 누르면 기본 상태'}
                </div>
              </div>
            ) : (
              <span className="text-[11.5px] text-[#8A8998]">
                관계선을 클릭하면 관계 이름이 표시됩니다. 프로필을 누르면 관계선을 단계별로 강조합니다.
              </span>
            )}
            <div className="w-24" />
          </div>

          {/* Circular Diagram */}
          <div
            data-export-root="true"
            className="relative mx-auto"
            style={{
              width: 720,
              height: 540,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Outer Ring */}
            <div
              className="absolute rounded-full border-[36px] border-[#F0EDF9] dark:border-[#211F33] pointer-events-none"
              style={{
                left: cx - radius,
                top: cy - radius,
                width: radius * 2,
                height: radius * 2,
              }}
            />

            {/* Edges SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                {state.legends.map((l) => (
                  <marker
                    key={l.id}
                    id={`arrow-${l.id}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L0,6 L7,3 z" fill={l.color} />
                  </marker>
                ))}
                {state.edges.map((edge) => {
                  const rev = state.edges.find(
                    (o) => o.fromId === edge.toId && o.toId === edge.fromId
                  );
                  if (!rev) return null;
                  const i1 = state.nodes.findIndex((n) => n.id === edge.fromId);
                  const i2 = state.nodes.findIndex((n) => n.id === edge.toId);
                  if (i1 < 0 || i2 < 0) return null;
                  const p1 = nodePos(i1);
                  const p2 = nodePos(i2);
                  const leg1 = state.legends.find((l) => l.id === edge.legendId) || state.legends[0];
                  const leg2 = state.legends.find((l) => l.id === rev.legendId) || state.legends[0];
                  const c1 = edge.color || leg1?.color || '#6A5ACD';
                  const c2 = rev.color || leg2?.color || '#6A5ACD';
                  return (
                    <linearGradient
                      key={`grad-${edge.id}`}
                      id={`grad-${edge.id}`}
                      gradientUnits="userSpaceOnUse"
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                    >
                      <stop offset="0%" stopColor={c1} />
                      <stop offset="100%" stopColor={c2} />
                    </linearGradient>
                  );
                })}
              </defs>

              {state.edges.map((edge) => {
                const i1 = state.nodes.findIndex((n) => n.id === edge.fromId);
                const i2 = state.nodes.findIndex((n) => n.id === edge.toId);
                if (i1 < 0 || i2 < 0) return null;
                const p1 = nodePos(i1);
                const p2 = nodePos(i2);
                const legend = state.legends.find((l) => l.id === edge.legendId) || state.legends[0];
                const color = edge.color || legend?.color || '#6A5ACD';
                const style = edge.lineStyle || legend?.lineStyle || 'solid';

                const rev = state.edges.find(
                  (o) => o.fromId === edge.toId && o.toId === edge.fromId
                );
                const revLegend = rev
                  ? state.legends.find((l) => l.id === rev.legendId) || state.legends[0]
                  : null;
                const revStyle = rev ? rev.lineStyle || revLegend?.lineStyle || 'solid' : style;
                const isPairSecondary = Boolean(rev && edge.id > rev.id);

                let dimmed = false;
                if (highlightedLegendId && edge.legendId !== highlightedLegendId) dimmed = true;
                if (highlightNodeId) {
                  const matchOut = highlightMode === 'out' && edge.fromId === highlightNodeId;
                  const matchIn = highlightMode === 'in' && edge.toId === highlightNodeId;
                  if (!matchOut && !matchIn) dimmed = true;
                }

                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2;
                const isSelected = selectedEdgeId === edge.id;

                return (
                  <g
                    key={edge.id}
                    style={{ opacity: dimmed ? 0.16 : 1, cursor: 'pointer', pointerEvents: 'auto' }}
                    className="transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId((prev) => (prev === edge.id ? null : edge.id));
                      setInspectorTab('edge');
                    }}
                  >
                    {/* Invisible hit area */}
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={14} />

                    {rev ? (
                      !isPairSecondary || highlightNodeId ? (
                        style !== revStyle ? (
                          <>
                            <line
                              x1={p1.x}
                              y1={p1.y}
                              x2={mx}
                              y2={my}
                              stroke={`url(#grad-${edge.id})`}
                              strokeWidth={isSelected ? edge.width + 1.2 : edge.width}
                              strokeDasharray={dashArray(style)}
                            />
                            <line
                              x1={mx}
                              y1={my}
                              x2={p2.x}
                              y2={p2.y}
                              stroke={`url(#grad-${edge.id})`}
                              strokeWidth={isSelected ? edge.width + 1.2 : edge.width}
                              strokeDasharray={dashArray(revStyle)}
                              markerEnd={`url(#arrow-${legend?.id || 'leg-1'})`}
                            />
                          </>
                        ) : (
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke={`url(#grad-${edge.id})`}
                            strokeWidth={isSelected ? edge.width + 1.2 : edge.width}
                            strokeDasharray={dashArray(style)}
                            markerEnd={`url(#arrow-${legend?.id || 'leg-1'})`}
                          />
                        )
                      ) : null
                    ) : (
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={color}
                        strokeWidth={isSelected ? edge.width + 1.2 : edge.width}
                        strokeDasharray={dashArray(style)}
                        markerEnd={`url(#arrow-${legend?.id || 'leg-1'})`}
                      />
                    )}

                    {/* Only render relationship label when this edge is clicked/selected */}
                    {isSelected && (
                      <g>
                        <rect
                          x={mx - 36}
                          y={my - 11}
                          width="72"
                          height="22"
                          rx="6"
                          fill="white"
                          stroke="#6A5ACD"
                          strokeWidth="1.5"
                        />
                        <text
                          x={mx}
                          y={my + 4}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#4E3FB5"
                          fontWeight="700"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {autoLayoutNotice && (
              <div className="bs-animate-popover fixed top-20 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-[#1B1B1F] text-white text-xs font-medium shadow-lg">
                캐릭터는 원형에 자동 배치됩니다. 우측 캐릭터 탭에서 순서를 변경할 수 있습니다.
              </div>
            )}

            {/* Nodes */}
            {state.nodes.map((node, idx) => {
              const p = nodePos(idx);
              const isHighlighted = highlightNodeId === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onMouseDown={(e) => {
                    const sx = e.clientX;
                    const sy = e.clientY;
                    const onMove = (ev: MouseEvent) => {
                      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
                        setAutoLayoutNotice(true);
                        window.setTimeout(() => setAutoLayoutNotice(false), 1800);
                        window.removeEventListener('mousemove', onMove);
                      }
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isEditMode && node.linkedDocId) openDocument(node.linkedDocId);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node.id);
                  }}
                  style={{
                    left: p.x - nodeSize / 2,
                    top: p.y - nodeSize / 2,
                    width: nodeSize,
                  }}
                  className="absolute flex flex-col items-center gap-1.5 group"
                >
                  <div
                    style={{ width: nodeSize, height: nodeSize }}
                    className={`rounded-full bg-[#F3F1FB] dark:bg-[#262436] border-2 transition-all ${
                      isHighlighted
                        ? 'border-[#6A5ACD] ring-4 ring-[#6A5ACD]/20'
                        : 'border-white dark:border-[#3A3850] group-hover:border-[#9A8FE6]'
                    }`}
                  />
                  <span className="text-[11.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] whitespace-nowrap">
                    {node.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom-left Legend Box */}
          {state.showLegend && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed bottom-5 left-16 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-3.5 shadow-sm flex flex-col gap-2 z-20"
            >
              <div className="text-[11px] font-bold text-[#6E6D7A]">관계 범례</div>
              {state.legends.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() =>
                    setHighlightedLegendId((prev) => (prev === l.id ? null : l.id))
                  }
                  className={`flex items-center gap-2 text-xs text-left ${
                    highlightedLegendId && highlightedLegendId !== l.id ? 'opacity-40' : ''
                  }`}
                >
                  <span
                    className="w-6 h-0.5 block"
                    style={{
                      borderTop: `2.5px ${l.lineStyle} ${l.color}`,
                    }}
                  />
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Bottom-right Zoom Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-5 right-[315px] inline-flex items-center gap-1 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] px-2 py-1 text-xs z-20"
          >
            <button type="button" onClick={() => setZoom((z) => Math.max(60, z - 10))} className="px-1.5">
              −
            </button>
            <span className="w-10 text-center font-medium">{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(140, z + 10))} className="px-1.5">
              +
            </button>
          </div>
        </div>

        {/* Right 3-Tab Inspector in Edit Mode */}
        {isEditMode && (
          <aside className="w-[290px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 overflow-y-auto select-none">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'edge', label: '관계선' },
                { id: 'character', label: '캐릭터' },
                { id: 'legend', label: '범례' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInspectorTab(t.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    inspectorTab === t.id
                      ? 'border-[#6A5ACD] bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]'
                      : 'border-[#E6E3F0] dark:border-[#323244] text-[#6E6D7A]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {inspectorTab === 'edge' && (
              selectedEdge ? (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="font-bold text-sm">
                    관계선 수정 ({state.nodes.find((n) => n.id === selectedEdge.fromId)?.name} →{' '}
                    {state.nodes.find((n) => n.id === selectedEdge.toId)?.name})
                  </div>
                  <label className="flex items-center justify-between">
                    <span>관계 이름</span>
                    <input
                      type="text"
                      value={selectedEdge.label}
                      onChange={(e) =>
                        persist({
                          ...state,
                          edges: state.edges.map((ed) =>
                            ed.id === selectedEdge.id ? { ...ed, label: e.target.value } : ed
                          ),
                        })
                      }
                      className="w-36 h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span>관계 유형</span>
                    <select
                      value={selectedEdge.legendId}
                      onChange={(e) => {
                        const leg = state.legends.find((l) => l.id === e.target.value);
                        persist({
                          ...state,
                          edges: state.edges.map((ed) =>
                            ed.id === selectedEdge.id
                              ? { ...ed, legendId: e.target.value, lineStyle: leg?.lineStyle || ed.lineStyle }
                              : ed
                          ),
                        });
                      }}
                      className="w-36 h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                    >
                      {state.legends.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <div className="text-[11px] text-[#8A8998] mb-1">선 스타일</div>
                    <div className="grid grid-cols-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5">
                      {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            persist({
                              ...state,
                              edges: state.edges.map((ed) =>
                                ed.id === selectedEdge.id ? { ...ed, lineStyle: st } : ed
                              ),
                            })
                          }
                          className={`py-1 rounded-lg ${
                            (selectedEdge.lineStyle || 'solid') === st
                              ? 'bg-[#6A5ACD] text-white font-semibold'
                              : ''
                          }`}
                        >
                          {st === 'solid' ? '실선' : st === 'dashed' ? '점선' : '파선'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick button to add or select reverse direction B -> A */}
                  <button
                    type="button"
                    onClick={() => {
                      const rev = state.edges.find(
                        (ed) =>
                          ed.fromId === selectedEdge.toId && ed.toId === selectedEdge.fromId
                      );
                      if (rev) {
                        setSelectedEdgeId(rev.id);
                      } else {
                        const newRev: RelEdge = {
                          id: `e-${Date.now()}`,
                          fromId: selectedEdge.toId,
                          toId: selectedEdge.fromId,
                          label: '반대 방향 관계',
                          legendId: state.legends[1]?.id || state.legends[0]?.id || 'leg-1',
                          direction: 'right',
                          width: 2.5,
                        };
                        persist({ ...state, edges: [...state.edges, newRev] });
                        setSelectedEdgeId(newRev.id);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-[#6A5ACD] font-semibold hover:bg-[#F3F1FB]"
                  >
                    ⇄ 반대 방향 ({state.nodes.find((n) => n.id === selectedEdge.toId)?.name} →{' '}
                    {state.nodes.find((n) => n.id === selectedEdge.fromId)?.name}) 설정
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteEdgeWithUndo(selectedEdge.id)}
                    className="self-start px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
                  >
                    관계선 삭제
                  </button>
                </div>
              ) : (
                <div className="text-xs text-[#8A8998]">
                  캔버스에서 관계선을 클릭하거나 좌측 상단 &apos;+ 관계선 추가&apos;를 눌러주세요.
                </div>
              )
            )}

            {inspectorTab === 'character' && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="font-bold text-sm">캐릭터 {state.nodes.length}명</div>
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="w-full py-2 rounded-xl bg-[#6A5ACD] text-white font-semibold"
                >
                  + 문서에서 추가
                </button>

                <div className="divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
                  {state.nodes.map((n, idx) => (
                    <div key={n.id} className="py-2 flex items-center justify-between gap-1.5">
                      <span className="font-medium truncate">{n.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          title="순서 위로"
                          onClick={() => {
                            if (idx === 0) return;
                            const nextNodes = [...state.nodes];
                            [nextNodes[idx - 1], nextNodes[idx]] = [nextNodes[idx], nextNodes[idx - 1]];
                            persist({ ...state, nodes: nextNodes });
                          }}
                          className="p-0.5 text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white disabled:opacity-25"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === state.nodes.length - 1}
                          title="순서 아래로"
                          onClick={() => {
                            if (idx >= state.nodes.length - 1) return;
                            const nextNodes = [...state.nodes];
                            [nextNodes[idx], nextNodes[idx + 1]] = [nextNodes[idx + 1], nextNodes[idx]];
                            persist({ ...state, nodes: nextNodes });
                          }}
                          className="p-0.5 text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white disabled:opacity-25"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-1.5 py-0.5 rounded bg-[#F3F1FB] dark:bg-[#2C2845] text-[10px] text-[#6A5ACD]">
                          {n.linkedDocId ? '문서' : '임시'}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteCharacterWithUndo(n.id)}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938] flex flex-col gap-2">
                  <div className="font-bold">직접 만들기</div>
                  <input
                    type="text"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="캐릭터 이름"
                    className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCharName.trim()) return;
                      persist({
                        ...state,
                        nodes: [...state.nodes, { id: `c-${Date.now()}`, name: newCharName.trim() }],
                      });
                      setNewCharName('');
                    }}
                    className="w-full py-2 rounded-xl bg-[#6A5ACD] text-white font-semibold"
                  >
                    추가
                  </button>
                </div>
              </div>
            )}

            {inspectorTab === 'legend' && (
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">관계 범례</span>
                  <button
                    type="button"
                    onClick={() => persist({ ...state, showLegend: !state.showLegend })}
                    className="text-xs text-[#6A5ACD] font-semibold"
                  >
                    {state.showLegend ? '표시 중' : '숨김'}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {state.legends.map((l, idx) => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLegendId(l.id)}
                      className={`p-2.5 rounded-xl border flex flex-col gap-2 cursor-pointer ${
                        selectedLegend?.id === l.id
                          ? 'border-[#6A5ACD] bg-[#F3F1FB]/60 dark:bg-[#2C2845]/50'
                          : 'border-[#E6E3F0] dark:border-[#2E2D3D]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={l.color}
                          onChange={(e) =>
                            persist({
                              ...state,
                              legends: state.legends.map((item) =>
                                item.id === l.id ? { ...item, color: e.target.value } : item
                              ),
                            })
                          }
                          className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent shrink-0"
                        />
                        <input
                          type="text"
                          value={l.name}
                          onChange={(e) =>
                            persist({
                              ...state,
                              legends: state.legends.map((item) =>
                                item.id === l.id ? { ...item, name: e.target.value } : item
                              ),
                            })
                          }
                          className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                        />
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (idx === 0) return;
                            const next = [...state.legends];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            persist({ ...state, legends: next });
                          }}
                          className="p-0.5 text-[#8A8998] disabled:opacity-25"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === state.legends.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (idx >= state.legends.length - 1) return;
                            const next = [...state.legends];
                            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                            persist({ ...state, legends: next });
                          }}
                          className="p-0.5 text-[#8A8998] disabled:opacity-25"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {state.legends.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const remaining = state.legends.filter((item) => item.id !== l.id);
                              persist({
                                ...state,
                                legends: remaining,
                                edges: state.edges.map((ed) =>
                                  ed.legendId === l.id
                                    ? { ...ed, legendId: remaining[0].id }
                                    : ed
                                ),
                              });
                            }}
                            className="p-0.5 text-[#8A8998] hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 rounded-lg border border-[#E6E3F0] dark:border-[#323244] p-0.5 text-[11px]">
                        {(['solid', 'dashed', 'dotted'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              persist({
                                ...state,
                                legends: state.legends.map((item) =>
                                  item.id === l.id ? { ...item, lineStyle: st } : item
                                ),
                              });
                            }}
                            className={`py-0.5 rounded ${
                              l.lineStyle === st ? 'bg-[#6A5ACD] text-white font-semibold' : ''
                            }`}
                          >
                            {st === 'solid' ? '실선' : st === 'dashed' ? '점선' : '파선'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newLeg: RelLegend = {
                        id: `leg-${Date.now()}`,
                        name: `관계 유형 ${state.legends.length + 1}`,
                        color: '#E11D48',
                        lineStyle: 'solid',
                      };
                      persist({ ...state, legends: [...state.legends, newLeg] });
                      setSelectedLegendId(newLeg.id);
                    }}
                    className="py-2 rounded-xl border border-dashed border-[#B6ACEA] text-[#6A5ACD] font-semibold hover:bg-[#F3F1FB]"
                  >
                    + 범례 추가
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      <DocumentLinkModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSelect={(doc) => {
          persist({
            ...state,
            nodes: [...state.nodes, { id: `c-${Date.now()}`, name: doc.title, linkedDocId: doc.id }],
          });
        }}
      />
    </div>
  );
};
