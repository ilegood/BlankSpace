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
  GitBranch,
  Flag,
  Swords,
  Layers,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export type FlowNodeType = 'start' | 'scene' | 'choice' | 'battle' | 'ending';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowNodeType;
  description?: string;
  choiceOptions?: string[];
}

const NODE_THEMES: Record<
  FlowNodeType,
  {
    name: string;
    border: string;
    bg: string;
    icon: React.ElementType;
    textColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  start: {
    name: '시작 / 타이틀',
    border: 'border-emerald-400',
    bg: 'bg-emerald-50/70',
    icon: Play,
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
  scene: {
    name: '스토리 / 씬',
    border: 'border-sky-400',
    bg: 'bg-sky-50/70',
    icon: Layers,
    textColor: 'text-sky-700',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
  },
  choice: {
    name: '선택지 분기',
    border: 'border-lavender-400',
    bg: 'bg-lavender-50/70',
    icon: GitBranch,
    textColor: 'text-lavender-700',
    badgeBg: 'bg-lavender-100',
    badgeText: 'text-lavender-800',
  },
  battle: {
    name: '이벤트 / 전투',
    border: 'border-amber-400',
    bg: 'bg-amber-50/70',
    icon: Swords,
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
  },
  ending: {
    name: '엔딩 / 결말',
    border: 'border-rose-400',
    bg: 'bg-rose-50/70',
    icon: Flag,
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
  },
};

// Custom Flow Node
const GameFlowNodeComponent = ({ data, selected }: { data: FlowNodeData; selected?: boolean }) => {
  const theme = NODE_THEMES[data.nodeType] || NODE_THEMES.scene;
  const Icon = theme.icon;

  return (
    <div
      className={`min-w-[200px] max-w-[280px] bg-white rounded-2xl border-2 transition-all shadow-sm select-none ${
        theme.border
      } ${selected ? 'ring-4 ring-lavender-200 shadow-md scale-102' : 'hover:shadow-md'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-400 hover:!bg-lavender-600 transition-colors"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-slate-400 hover:!bg-lavender-600 transition-colors"
      />

      {/* Node Header */}
      <div className={`px-4 py-2.5 rounded-t-xl border-b border-slate-100 flex items-center justify-between gap-2 ${theme.bg}`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${theme.badgeBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${theme.textColor}`} />
          </div>
          <span className="font-bold text-xs text-slate-800 truncate">{data.label}</span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} shrink-0`}>
          {theme.name}
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3 text-xs">
        {data.description ? (
          <p className="text-slate-600 line-clamp-3 leading-relaxed whitespace-pre-line text-[11.5px]">
            {data.description}
          </p>
        ) : (
          <p className="text-slate-400 italic text-[11px]">내용 없음</p>
        )}

        {/* Choice Branch Previews */}
        {data.choiceOptions && data.choiceOptions.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400">분기 선택지:</span>
            {data.choiceOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded-md">
                <ChevronRight className="w-3 h-3 text-lavender-500 shrink-0" />
                <span className="truncate">{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-400 hover:!bg-lavender-600 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-slate-400 hover:!bg-lavender-600 transition-colors"
      />
    </div>
  );
};

// Custom Labeled Edge Component
const CustomLabeledEdge = (props: EdgeProps) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = (data?.label as string) || '';

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: selected ? '#8B5CF6' : '#94A3B8',
          strokeWidth: selected ? 2.5 : 1.8,
          strokeDasharray: data?.isDashed ? '5 5' : undefined,
        }}
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-(label.length * 5 + 12)}
            y="-10"
            width={label.length * 10 + 24}
            height="20"
            rx="10"
            fill="#FFFFFF"
            stroke={selected ? '#8B5CF6' : '#CBD5E1'}
            strokeWidth="1"
            className="shadow-xs cursor-pointer"
          />
          <text
            y="3.5"
            textAnchor="middle"
            className="text-[10px] font-semibold fill-slate-700 pointer-events-none select-none"
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
};

export const GameFlowEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const flowContainerRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!flowContainerRef.current || !activeDocument) return;
    await exportElementAsPng(flowContainerRef.current, {
      fileName: `${activeDocument.title}-게임플로우`,
    });
  };

  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Selected Node / Edge for editing
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Add / Edit Node Modal
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formNodeType, setFormNodeType] = useState<FlowNodeType>('scene');
  const [formDescription, setFormDescription] = useState('');
  const [formChoices, setFormChoices] = useState<string[]>([]);
  const [newChoiceInput, setNewChoiceInput] = useState('');

  // Edge Label Modal
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');
  const [edgeIsDashed, setEdgeIsDashed] = useState(false);

  const nodeTypes = useMemo(() => ({ gameFlowNode: GameFlowNodeComponent }), []);
  const edgeTypes = useMemo(() => ({ customLabeledEdge: CustomLabeledEdge }), []);

  // Initialize or load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse flow content:', e);
    }

    // Default sample flow
    const initialNodes: Node<FlowNodeData>[] = [
      {
        id: 'flow-start',
        type: 'gameFlowNode',
        position: { x: 100, y: 150 },
        data: {
          label: '게임 시작 / 오프닝',
          nodeType: 'start',
          description: '인트로 컷신 재생 및 주인공 기억 상실 이벤트 발생.',
        },
      },
      {
        id: 'flow-tutorial',
        type: 'gameFlowNode',
        position: { x: 380, y: 150 },
        data: {
          label: '기초 튜토리얼',
          nodeType: 'scene',
          description: '기본 조작법 습득 및 첫 번째 던전 입구 도착.',
        },
      },
      {
        id: 'flow-choice-1',
        type: 'gameFlowNode',
        position: { x: 660, y: 150 },
        data: {
          label: '갈림길 선택',
          nodeType: 'choice',
          description: '던전 진입로를 선택한다.',
          choiceOptions: ['정면 돌파', '비밀 통로 탐색'],
        },
      },
      {
        id: 'flow-battle',
        type: 'gameFlowNode',
        position: { x: 960, y: 50 },
        data: {
          label: '수호신과의 보스전',
          nodeType: 'battle',
          description: '정면 돌파 선택 시 마주치는 1페이즈 보스 전투.',
        },
      },
      {
        id: 'flow-secret',
        type: 'gameFlowNode',
        position: { x: 960, y: 250 },
        data: {
          label: '고대 유적 탐험',
          nodeType: 'scene',
          description: '비밀 통로를 통해 숨겨진 보물 상자와 암호 퍼즐 발견.',
        },
      },
      {
        id: 'flow-ending-true',
        type: 'gameFlowNode',
        position: { x: 1260, y: 150 },
        data: {
          label: '챕터 1 클리어',
          nodeType: 'ending',
          description: '유적 열쇠를 획득하고 다음 대륙으로 이동.',
        },
      },
    ];

    const initialEdges: Edge[] = [
      {
        id: 'e1-2',
        source: 'flow-start',
        target: 'flow-tutorial',
        type: 'customLabeledEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
        data: { label: '튜토리얼 시작' },
      },
      {
        id: 'e2-3',
        source: 'flow-tutorial',
        target: 'flow-choice-1',
        type: 'customLabeledEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
      },
      {
        id: 'e3-4',
        source: 'flow-choice-1',
        target: 'flow-battle',
        type: 'customLabeledEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
        data: { label: '정면 돌파' },
      },
      {
        id: 'e3-5',
        source: 'flow-choice-1',
        target: 'flow-secret',
        type: 'customLabeledEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
        data: { label: '비밀 통로' },
      },
      {
        id: 'e4-6',
        source: 'flow-battle',
        target: 'flow-ending-true',
        type: 'customLabeledEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
        data: { label: '승리' },
      },
      {
        id: 'e5-6',
        source: 'flow-secret',
        target: 'flow-ending-true',
        type: 'customLabeledEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
        data: { label: '퍼즐 해결' },
      },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [activePage?.id]);

  // Autosave
  const persistFlow = useCallback(
    (curNodes: Node<FlowNodeData>[], curEdges: Edge[]) => {
      if (!activePage) return;
      setSaveStatus('saving');
      const payload = JSON.stringify({ nodes: curNodes, edges: curEdges });
      updatePageContent(activePage.id, payload);
      setTimeout(() => setSaveStatus('saved'), 400);
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
        type: 'customLabeledEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
        data: { label: '' },
      };
      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        persistFlow(nodes, next);
        return next;
      });
    },
    [nodes, persistFlow]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<FlowNodeData>);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Modal open for New Node
  const openNewNodeModal = (defaultType: FlowNodeType = 'scene') => {
    setModalNodeId(null);
    setFormLabel('');
    setFormNodeType(defaultType);
    setFormDescription('');
    setFormChoices([]);
    setNewChoiceInput('');
    setIsNodeModalOpen(true);
  };

  // Modal open for Edit Node
  const openEditNodeModal = (node: Node<FlowNodeData>) => {
    setModalNodeId(node.id);
    setFormLabel(node.data.label);
    setFormNodeType(node.data.nodeType);
    setFormDescription(node.data.description || '');
    setFormChoices(node.data.choiceOptions ? [...node.data.choiceOptions] : []);
    setNewChoiceInput('');
    setIsNodeModalOpen(true);
  };

  const handleSaveNode = () => {
    if (!formLabel.trim()) return;

    if (modalNodeId) {
      // Edit
      const nextNodes = nodes.map((n) => {
        if (n.id === modalNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              label: formLabel.trim(),
              nodeType: formNodeType,
              description: formDescription.trim(),
              choiceOptions: formChoices,
            },
          };
        }
        return n;
      });
      setNodes(nextNodes);
      persistFlow(nextNodes, edges);
      if (selectedNode?.id === modalNodeId) {
        setSelectedNode(nextNodes.find((n) => n.id === modalNodeId) || null);
      }
    } else {
      // New
      const newNode: Node<FlowNodeData> = {
        id: `flow-${generateId()}`,
        type: 'gameFlowNode',
        position: {
          x: 200 + (nodes.length % 5) * 60,
          y: 200 + (nodes.length % 5) * 50,
        },
        data: {
          label: formLabel.trim(),
          nodeType: formNodeType,
          description: formDescription.trim(),
          choiceOptions: formChoices,
        },
      };
      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      persistFlow(nextNodes, edges);
      setSelectedNode(newNode);
    }

    setIsNodeModalOpen(false);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNode) return;
    const nextNodes = nodes.filter((n) => n.id !== selectedNode.id);
    const nextEdges = edges.filter(
      (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
    );
    setNodes(nextNodes);
    setEdges(nextEdges);
    persistFlow(nextNodes, nextEdges);
    setSelectedNode(null);
  };

  // Open Edge Edit Modal
  const openEditEdgeModal = (edge: Edge) => {
    setSelectedEdge(edge);
    setEdgeLabelInput((edge.data?.label as string) || '');
    setEdgeIsDashed(Boolean(edge.data?.isDashed));
    setIsEdgeModalOpen(true);
  };

  const handleSaveEdge = () => {
    if (!selectedEdge) return;
    const nextEdges = edges.map((e) => {
      if (e.id === selectedEdge.id) {
        return {
          ...e,
          data: {
            ...e.data,
            label: edgeLabelInput.trim(),
            isDashed: edgeIsDashed,
          },
        };
      }
      return e;
    });
    setEdges(nextEdges);
    persistFlow(nodes, nextEdges);
    setIsEdgeModalOpen(false);
  };

  const handleDeleteSelectedEdge = () => {
    if (!selectedEdge) return;
    const nextEdges = edges.filter((e) => e.id !== selectedEdge.id);
    setEdges(nextEdges);
    persistFlow(nodes, nextEdges);
    setSelectedEdge(null);
    setIsEdgeModalOpen(false);
  };

  const addChoiceOption = () => {
    if (!newChoiceInput.trim()) return;
    setFormChoices([...formChoices, newChoiceInput.trim()]);
    setNewChoiceInput('');
  };

  const removeChoiceOption = (idx: number) => {
    setFormChoices(formChoices.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={() => openNewNodeModal('scene')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>노드 추가</span>
            </button>
          </div>
        }
      />

      {/* Main Flow Canvas */}
      <div ref={flowContainerRef} className="flex-1 w-full h-full relative bg-white">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="bg-slate-50/50"
        >
          <Background color="#CBD5E1" gap={20} size={1.2} />
          <Controls className="!bg-white !border !border-slate-200 !rounded-xl !shadow-soft !overflow-hidden" />

          {/* Quick Add Node Bar */}
          <Panel position="top-left" className="m-4">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-2 shadow-soft flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 px-2">빠른 노드 추가:</span>
              {(Object.keys(NODE_THEMES) as FlowNodeType[]).map((type) => {
                const theme = NODE_THEMES[type];
                const Icon = theme.icon;
                return (
                  <button
                    key={type}
                    onClick={() => openNewNodeModal(type)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Icon className={`w-3.5 h-3.5 ${theme.textColor}`} />
                    <span>{theme.name.split(' / ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* Flow Legend / Help */}
          <Panel position="bottom-left" className="m-4">
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl px-4 py-2.5 shadow-soft text-xs text-slate-500 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-lavender-500" />
                <span>노드 간 핸들을 드래그하여 분기선 연결</span>
              </div>
              <span className="text-slate-300">|</span>
              <span>선택된 노드/선 클릭 시 세부 설정</span>
            </div>
          </Panel>
        </ReactFlow>

        {/* Selected Node Inspector Sidebar */}
        {selectedNode && (
          <div className="absolute right-6 top-6 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-soft z-10 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-xl ${
                    NODE_THEMES[selectedNode.data.nodeType]?.badgeBg
                  } flex items-center justify-center`}
                >
                  {React.createElement(NODE_THEMES[selectedNode.data.nodeType]?.icon || Layers, {
                    className: `w-4 h-4 ${NODE_THEMES[selectedNode.data.nodeType]?.textColor}`,
                  })}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">{selectedNode.data.label}</h3>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {NODE_THEMES[selectedNode.data.nodeType]?.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-48 overflow-y-auto leading-relaxed">
              {selectedNode.data.description || '작성된 상세 설명이 없습니다.'}
            </div>

            {selectedNode.data.choiceOptions && selectedNode.data.choiceOptions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">분기 선택지:</span>
                <div className="flex flex-col gap-1">
                  {selectedNode.data.choiceOptions.map((opt, i) => (
                    <div
                      key={i}
                      className="text-xs text-slate-700 bg-lavender-50/60 border border-lavender-100 px-2.5 py-1 rounded-lg"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => openEditNodeModal(selectedNode)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-lavender-50 hover:bg-lavender-100 text-lavender-700 font-semibold text-xs transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>수정</span>
              </button>
              <button
                onClick={handleDeleteSelectedNode}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        )}

        {/* Selected Edge Inspector Sidebar */}
        {selectedEdge && (
          <div className="absolute right-6 top-6 w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-soft z-10 flex flex-col gap-3 animate-in fade-in slide-in-from-right-4 duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700">연결선 설정</span>
              <button
                onClick={() => setSelectedEdge(null)}
                className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-slate-600">
              <span className="text-slate-400">라벨: </span>
              <span className="font-semibold text-slate-800">
                {(selectedEdge.data?.label as string) || '(없음)'}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => openEditEdgeModal(selectedEdge)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-lavender-50 hover:bg-lavender-100 text-lavender-700 font-semibold text-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>라벨 변경</span>
              </button>
              <button
                onClick={handleDeleteSelectedEdge}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Node Modal */}
      {isNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {modalNodeId ? '플로우 노드 수정' : '새 플로우 노드 추가'}
              </h2>
              <button
                onClick={() => setIsNodeModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {/* Type Select */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">노드 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(NODE_THEMES) as FlowNodeType[]).map((type) => {
                    const theme = NODE_THEMES[type];
                    const Icon = theme.icon;
                    const isSelected = formNodeType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormNodeType(type)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? `${theme.border} ${theme.badgeBg} ring-2 ring-lavender-300`
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${theme.textColor}`} />
                        <span className="font-medium text-slate-800 text-[11px]">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Label Input */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  노드 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="예: 챕터 1 보스전, 갈림길 선택 등"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">상세 내용 및 조건</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="씬의 줄거리나 발생 조건, 획득 아이템 등을 자유롭게 작성하세요."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800 resize-none"
                />
              </div>

              {/* Choices (Optional for choice type) */}
              {formNodeType === 'choice' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">분기 선택지 항목</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newChoiceInput}
                      onChange={(e) => setNewChoiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addChoiceOption();
                        }
                      }}
                      placeholder="선택지 입력 후 엔터"
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800 text-xs"
                    />
                    <button
                      type="button"
                      onClick={addChoiceOption}
                      className="px-3 py-1.5 bg-lavender-100 text-lavender-700 rounded-xl font-semibold hover:bg-lavender-200"
                    >
                      추가
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formChoices.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px]"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => removeChoiceOption(i)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNodeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveNode}
                disabled={!formLabel.trim()}
                className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 disabled:opacity-50 text-xs font-semibold text-white shadow-soft"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Edge Modal */}
      {isEdgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">연결선 분기 조건 라벨</h2>
              <button
                onClick={() => setIsEdgeModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">분기 조건 / 라벨 텍스트</label>
                <input
                  type="text"
                  value={edgeLabelInput}
                  onChange={(e) => setEdgeLabelInput(e.target.value)}
                  placeholder="예: 승리 시, 열쇠 보유 시, 선택지 A 등"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={edgeIsDashed}
                  onChange={(e) => setEdgeIsDashed(e.target.checked)}
                  className="w-4 h-4 text-lavender-600 rounded border-slate-300 focus:ring-lavender-500"
                />
                <span className="text-slate-700 text-xs">점선 스타일 적용 (조건부/선택 경로)</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDeleteSelectedEdge}
                className="px-3 py-2 rounded-xl text-rose-600 text-xs font-semibold hover:bg-rose-50"
              >
                연결선 삭제
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEdgeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdge}
                  className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-xs font-semibold text-white shadow-soft"
                >
                  적용
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

