import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  EdgeProps,
  Panel,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Layers,
  Diamond,
  ArrowRight,
  FileText,
  Square,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export type FlowShapeType = 'capsule' | 'rect' | 'diamond' | 'note';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  shapeType: FlowShapeType;
  description?: string;
  color?: string;
  linkedDocTitle?: string;
  linkedDocId?: string;
}

// Custom Node for Game Flow (Death Land Example Style)
const DeathLandFlowNode = ({ data, selected }: { data: FlowNodeData; selected?: boolean }) => {
  const isCapsule = data.shapeType === 'capsule';
  const isDiamond = data.shapeType === 'diamond';
  const isNote = data.shapeType === 'note';

  if (isDiamond) {
    return (
      <div
        className={`relative w-40 h-24 flex items-center justify-center select-none cursor-grab active:cursor-grabbing transition-transform ${
          selected ? 'scale-105' : ''
        }`}
      >
        <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-lavender-500" />
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-lavender-500" />

        {/* Diamond Box */}
        <div
          className={`w-28 h-28 rotate-45 border-2 rounded-xl flex items-center justify-center shadow-xs transition-colors ${
            selected
              ? 'border-lavender-600 bg-lavender-50 ring-4 ring-lavender-200'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <div className="-rotate-45 text-center p-2">
            <span className="font-bold text-xs text-slate-800 leading-snug block">{data.label}</span>
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-lavender-500" />
        <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-lavender-500" />
      </div>
    );
  }

  return (
    <div
      className={`relative min-w-[180px] max-w-[240px] text-center select-none cursor-grab active:cursor-grabbing transition-all ${
        selected ? 'scale-105' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-lavender-500" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-lavender-500" />

      <div
        className={`p-3.5 border-2 shadow-xs transition-colors ${
          isCapsule ? 'rounded-full px-6 py-2.5 bg-lavender-100/70 border-lavender-300' : 'rounded-2xl bg-white border-slate-300'
        } ${selected ? 'ring-4 ring-lavender-200 border-lavender-600' : 'hover:border-slate-400'}`}
      >
        <h4 className="font-bold text-xs text-slate-800">{data.label}</h4>
        {data.description && !isCapsule && (
          <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{data.description}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-lavender-500" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-lavender-500" />
    </div>
  );
};

// Initial Sample Death Land Flow
const INITIAL_FLOW_NODES: Node<FlowNodeData>[] = [
  {
    id: 'f-start',
    type: 'flowNode',
    position: { x: 350, y: 50 },
    data: { label: '게임 시작', shapeType: 'capsule' },
  },
  {
    id: 'f-prologue',
    type: 'flowNode',
    position: { x: 330, y: 130 },
    data: {
      label: '프롤로그',
      shapeType: 'rect',
      description: '(주인공이 데스랜드에 도착)',
    },
  },
  {
    id: 'f-unlock',
    type: 'flowNode',
    position: { x: 345, y: 220 },
    data: { label: '마을 해금', shapeType: 'rect' },
  },
  {
    id: 'f-freeplay',
    type: 'flowNode',
    position: { x: 330, y: 300 },
    data: {
      label: '자유 플레이',
      shapeType: 'rect',
      description: '(생활 / 교류 / 의뢰 등)',
      linkedDocTitle: '생활 시스템 기획서',
    },
  },
  {
    id: 'f-choice',
    type: 'flowNode',
    position: { x: 345, y: 410 },
    data: { label: '메인 스토리 진행?', shapeType: 'diamond' },
  },
  {
    id: 'f-story',
    type: 'flowNode',
    position: { x: 550, y: 420 },
    data: {
      label: '스토리 이벤트',
      shapeType: 'rect',
      description: '(주요 캐릭터와의 시간)',
    },
  },
  {
    id: 'f-ending',
    type: 'flowNode',
    position: { x: 540, y: 510 },
    data: {
      label: '엔딩 분기',
      shapeType: 'rect',
      description: '(천국 / 지옥 / 머무름)',
    },
  },
  {
    id: 'f-end',
    type: 'flowNode',
    position: { x: 550, y: 600 },
    data: { label: '게임 종료', shapeType: 'capsule' },
  },
];

const INITIAL_FLOW_EDGES: Edge[] = [
  { id: 'fe-1', source: 'f-start', target: 'f-prologue', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'fe-2', source: 'f-prologue', target: 'f-unlock', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'fe-3', source: 'f-unlock', target: 'f-freeplay', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'fe-4', source: 'f-freeplay', target: 'f-choice', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'fe-5', source: 'f-choice', target: 'f-story', label: '예', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'fe-6', source: 'f-choice', target: 'f-freeplay', label: '아니오', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'fe-7', source: 'f-story', target: 'f-ending', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'fe-8', source: 'f-ending', target: 'f-end', markerEnd: { type: MarkerType.ArrowClosed } },
];

export const GameFlowEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { customPrompt, success, info } = useToast();
  const flowContainerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>(INITIAL_FLOW_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_FLOW_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(INITIAL_FLOW_NODES[3]);

  const nodeTypes = useMemo(() => ({ flowNode: DeathLandFlowNode }), []);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.nodes && parsed.nodes.length > 0) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges || []);
          setSelectedNode(parsed.nodes[0] || null);
          return;
        }
      }
    } catch {}
    setNodes(INITIAL_FLOW_NODES);
    setEdges(INITIAL_FLOW_EDGES);
    setSelectedNode(INITIAL_FLOW_NODES[3]);
  }, [activePage?.id]);

  const persistFlow = useCallback(
    (curNodes: Node<FlowNodeData>[], curEdges: Edge[]) => {
      if (!activePage) return;
      const payload = JSON.stringify({ nodes: curNodes, edges: curEdges });
      updatePageContent(activePage.id, payload);
    },
    [activePage, updatePageContent]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        persistFlow(next as Node<FlowNodeData>[], edges);
        return next as Node<FlowNodeData>[];
      });
    },
    [edges, persistFlow]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        persistFlow(nodes, next);
        return next;
      });
    },
    [nodes, persistFlow]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${generateId()}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        persistFlow(nodes, next);
        return next;
      });
    },
    [nodes, persistFlow]
  );

  const handleExportImage = async () => {
    if (!flowContainerRef.current || !activeDocument) return;
    await exportElementAsPng(flowContainerRef.current, {
      fileName: `${activeDocument.title}-게임플로우`,
    });
  };

  const handleAddElement = (shapeType: FlowShapeType, label: string) => {
    const newNode: Node<FlowNodeData> = {
      id: `f-${generateId()}`,
      type: 'flowNode',
      position: { x: 350 + (nodes.length % 3) * 60, y: 250 + (nodes.length % 3) * 50 },
      data: {
        label,
        shapeType,
        description: shapeType === 'rect' ? '설명을 입력하세요' : undefined,
      },
    };
    const next = [...nodes, newNode];
    setNodes(next);
    persistFlow(next, edges);
    setSelectedNode(newNode);
  };

  const updateSelectedNode = (key: keyof FlowNodeData, val: any) => {
    if (!selectedNode) return;
    const nextNodes = nodes.map((n) => {
      if (n.id === selectedNode.id) {
        return {
          ...n,
          data: {
            ...n.data,
            [key]: val,
          },
        };
      }
      return n;
    });
    setNodes(nextNodes);
    persistFlow(nextNodes, edges);
    setSelectedNode(nextNodes.find((n) => n.id === selectedNode.id) || null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader onExportImage={handleExportImage} />

      {/* Main 3-Column Layout: Left Elements + Center Canvas + Right Node Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Flow Elements (플로우 요소) */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-500 px-1">플로우 요소</span>
          <div className="flex flex-col gap-1.5 text-xs">
            <button
              onClick={() => handleAddElement('capsule', '시작/종료')}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-lavender-300 hover:bg-slate-50 text-slate-700"
            >
              <div className="w-6 h-3 rounded-full border-2 border-slate-400" />
              <span>시작/종료</span>
            </button>
            <button
              onClick={() => handleAddElement('rect', '과정 (새 단계)')}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-lavender-300 hover:bg-slate-50 text-slate-700"
            >
              <div className="w-6 h-4 rounded-md border-2 border-slate-400" />
              <span>과정</span>
            </button>
            <button
              onClick={() => handleAddElement('diamond', '결정 / 분기')}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-lavender-300 hover:bg-slate-50 text-slate-700"
            >
              <Diamond className="w-4 h-4 text-slate-500" />
              <span>결정(분기)</span>
            </button>
            <button
              onClick={() => info('연결선 안내', '노드의 연결 점을 드래그하여 다른 노드로 연결선을 그으세요.')}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-[#3A3948] hover:border-lavender-300 hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF]"
            >
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span>이동(연결)</span>
            </button>
            <button
              onClick={() => handleAddElement('note', '주석 메모')}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-[#3A3948] hover:border-lavender-300 hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF]"
            >
              <FileText className="w-4 h-4 text-amber-500" />
              <span>주석(메모)</span>
            </button>
            <button
              onClick={() => {
                handleAddElement('rect', '영역 그룹');
                success('영역 그룹 배치', '영역 그룹 박스가 배치되었습니다.');
              }}
              className="flex items-center gap-2.5 p-2 rounded-xl border border-dashed border-slate-300 dark:border-[#3A3948] hover:border-lavender-300 hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-600 dark:text-[#A5A3B5]"
            >
              <Square className="w-4 h-4 text-slate-400 stroke-dashed" />
              <span>영역 그룹</span>
            </button>
          </div>
        </div>

        {/* Center: ReactFlow Canvas */}
        <div ref={flowContainerRef} className="flex-1 relative bg-[#F8FAFD]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node as Node<FlowNodeData>)}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Background color="#CBD5E1" gap={20} size={1} />
            <Controls className="!bg-white !border !border-slate-200 !shadow-soft !rounded-xl" />
          </ReactFlow>
        </div>

        {/* Right Sidebar: Node Settings (노드 설정) */}
        <div className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <span className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
            노드 설정
          </span>

          {selectedNode ? (
            <div className="flex flex-col gap-4 text-xs">
              {/* Type */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">유형</label>
                <select
                  value={selectedNode.data.shapeType}
                  onChange={(e) => updateSelectedNode('shapeType', e.target.value as FlowShapeType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-lavender-500 !bg-white"
                >
                  <option value="rect">과정 (사각형)</option>
                  <option value="capsule">시작 / 종료 (캡슐)</option>
                  <option value="diamond">결정 / 분기 (마름모)</option>
                  <option value="note">메모</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">제목</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateSelectedNode('label', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">설명</label>
                <textarea
                  rows={3}
                  value={selectedNode.data.description || ''}
                  onChange={(e) => updateSelectedNode('description', e.target.value)}
                  placeholder="노드에 대한 상세 설명 및 실행 조건을 입력하세요."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-700 !bg-white resize-none focus:outline-none focus:border-lavender-500"
                />
              </div>

              {/* Color Swatch */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1.5">색상</label>
                <div className="flex items-center gap-2">
                  {['#EDE9FE', '#E0F2FE', '#FEF3C7', '#FEE2E2', '#DCFCE7'].map((c) => (
                    <div
                      key={c}
                      style={{ backgroundColor: c }}
                      className="w-7 h-7 rounded-xl border border-slate-300 cursor-pointer shadow-2xs hover:scale-110 transition-transform"
                    />
                  ))}
                </div>
              </div>

              {/* Linked Document (연결된 문서) */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                <span className="font-semibold text-slate-600 text-xs">연결된 문서</span>
                {selectedNode.data.linkedDocTitle ? (
                  <div className="bg-lavender-50 border border-lavender-200 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lavender-800 font-semibold text-xs truncate">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedNode.data.linkedDocTitle}</span>
                    </div>
                    <button
                      onClick={() => updateSelectedNode('linkedDocTitle', '')}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      const title = await customPrompt({
                        title: '문서 연결',
                        message: '연결할 문서 제목을 입력하세요:',
                        defaultValue: '생활 시스템 기획서',
                        placeholder: '문서 제목',
                        confirmText: '연결',
                      });
                      if (title) {
                        updateSelectedNode('linkedDocTitle', title.trim());
                        success('문서 연결됨', `'${title.trim()}' 문서가 연결되었습니다.`);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-[#3A3948] hover:border-lavender-400 dark:hover:border-lavender-500 text-slate-500 dark:text-[#A5A3B5] text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>문서 연결</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">선택된 노드가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};
