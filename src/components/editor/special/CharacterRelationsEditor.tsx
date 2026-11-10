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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Plus,
  Trash2,
  UserPlus,
  Heart,
  Sparkles,
  X,
  User,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

// Emotional Color Palette for Gradient Lines
export const EMOTIONS = [
  { id: 'love', name: '호감 / 사랑', color: '#EC4899', fromColor: '#F472B6' },
  { id: 'friendship', name: '우호 / 신뢰', color: '#8B5CF6', fromColor: '#A78BFA' },
  { id: 'neutral', name: '비즈니스 / 중립', color: '#0EA5E9', fromColor: '#38BDF8' },
  { id: 'suspicion', name: '경계 / 견제', color: '#F59E0B', fromColor: '#FBBF24' },
  { id: 'hostility', name: '적대 / 집착', color: '#EF4444', fromColor: '#F87171' },
];

export interface CharacterNodeData extends Record<string, unknown> {
  name: string;
  role: string;
  imageUrl?: string;
}

// Custom Circular Character Node (Example Image Style)
const CharacterNodeComponent = ({ data, selected }: { data: CharacterNodeData; selected?: boolean }) => {
  return (
    <div
      className={`relative flex flex-col items-center select-none cursor-grab active:cursor-grabbing transition-transform ${
        selected ? 'scale-105' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-lavender-500" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-lavender-500" />

      {/* Circle Profile Container */}
      <div
        className={`w-18 h-18 rounded-full overflow-hidden border-2 bg-white flex items-center justify-center shadow-md ${
          selected ? 'border-lavender-600 ring-4 ring-lavender-200' : 'border-white ring-2 ring-slate-200'
        }`}
      >
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={data.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-lavender-100 flex items-center justify-center text-lavender-600">
            <User className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Name Label */}
      <div className="mt-1.5 flex flex-col items-center">
        <span className="font-bold text-xs text-slate-800 bg-white/95 px-2.5 py-0.5 rounded-full shadow-xs border border-slate-200 truncate max-w-[100px]">
          {data.name}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-lavender-500" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-lavender-500" />
    </div>
  );
};

// Custom Gradient Edge for Dual-end Emotions
const GradientEdgeComponent = (props: EdgeProps) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const sourceEmotion =
    EMOTIONS.find((e) => e.id === data?.sourceEmotion) || EMOTIONS[1];
  const targetEmotion =
    EMOTIONS.find((e) => e.id === data?.targetEmotion) || EMOTIONS[0];

  const gradientId = `edge-grad-${id}`;
  const relationLabel = (data?.label as string) || '';

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
          <stop offset="0%" stopColor={sourceEmotion.color} />
          <stop offset="100%" stopColor={targetEmotion.color} />
        </linearGradient>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: data?.style === 'single' ? sourceEmotion.color : `url(#${gradientId})`,
          strokeWidth: (data?.strokeWidth as number) || (selected ? 3.5 : 2.5),
          strokeDasharray: (data?.dashed as boolean) ? '4 4' : undefined,
        }}
      />

      {relationLabel && (
        <foreignObject
          width={120}
          height={32}
          x={labelX - 60}
          y={labelY - 16}
          className="pointer-events-none"
        >
          <div className="flex items-center justify-center w-full h-full">
            <span className="bg-white/95 backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 text-slate-700 shadow-xs truncate max-w-[110px]">
              {relationLabel}
            </span>
          </div>
        </foreignObject>
      )}
    </>
  );
};

// Initial Sample Nodes (Arzen, Kyle, Seira, Ruin)
const INITIAL_NODES: Node[] = [
  {
    id: 'node-arzen',
    type: 'characterNode',
    position: { x: 420, y: 260 },
    data: {
      name: '아르젠',
      role: '신입 기사',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'node-kyle',
    type: 'characterNode',
    position: { x: 250, y: 100 },
    data: {
      name: '카일',
      role: '마법사',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'node-seira',
    type: 'characterNode',
    position: { x: 600, y: 100 },
    data: {
      name: '세이라',
      role: '사제',
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    },
  },
  {
    id: 'node-ruin',
    type: 'characterNode',
    position: { x: 650, y: 360 },
    data: {
      name: '루인',
      role: '암살자',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'edge-kyle-seira',
    source: 'node-kyle',
    target: 'node-seira',
    type: 'gradientEdge',
    data: {
      label: '경쟁·견제',
      sourceEmotion: 'suspicion',
      targetEmotion: 'suspicion',
      relationType: '라이벌',
      style: 'gradient',
      strokeWidth: 2.5,
    },
  },
  {
    id: 'edge-arzen-kyle',
    source: 'node-arzen',
    target: 'node-kyle',
    type: 'gradientEdge',
    data: {
      label: '신뢰',
      sourceEmotion: 'friendship',
      targetEmotion: 'neutral',
      relationType: '동료',
      style: 'gradient',
      strokeWidth: 2.5,
    },
  },
  {
    id: 'edge-arzen-seira',
    source: 'node-arzen',
    target: 'node-seira',
    type: 'gradientEdge',
    data: {
      label: '호감',
      sourceEmotion: 'love',
      targetEmotion: 'love',
      relationType: '연인',
      style: 'gradient',
      strokeWidth: 3,
      emotionAtoB: '호감, 의지',
      emotionBtoA: '집착, 소유욕',
      memo: '서로에게 강한 감정을 가지고 있음.',
    },
  },
  {
    id: 'edge-arzen-ruin',
    source: 'node-arzen',
    target: 'node-ruin',
    type: 'gradientEdge',
    data: {
      label: '보호',
      sourceEmotion: 'friendship',
      targetEmotion: 'hostility',
      relationType: '보호 대상',
      style: 'gradient',
      strokeWidth: 2.5,
    },
  },
];

export const CharacterRelationsEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const canvasRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-arzen');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>('edge-arzen-seira');

  // Add Character Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('');
  const [newCharImage, setNewCharImage] = useState('');

  const nodeTypes = useMemo(() => ({ characterNode: CharacterNodeComponent }), []);
  const edgeTypes = useMemo(() => ({ gradientEdge: GradientEdgeComponent }), []);

  // Parse Initial Graph Data from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.nodes && parsed.nodes.length > 0) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges || []);
          return;
        }
      }
    } catch {}
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);
  }, [activePage?.id]);

  // Autosave
  const persistGraph = useCallback(
    (curNodes: Node[], curEdges: Edge[]) => {
      if (!activePage) return;
      setSaveStatus('saving');
      const payload = JSON.stringify({ nodes: curNodes, edges: curEdges });
      updatePageContent(activePage.id, payload);
      setTimeout(() => setSaveStatus('saved'), 350);
    },
    [activePage, updatePageContent]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        persistGraph(next, edges);
        return next;
      });
    },
    [edges, persistGraph]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        persistGraph(nodes, next);
        return next;
      });
    },
    [nodes, persistGraph]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${generateId()}`,
        type: 'gradientEdge',
        data: {
          label: '호감',
          sourceEmotion: 'friendship',
          targetEmotion: 'love',
          relationType: '동료',
          style: 'gradient',
          strokeWidth: 2.5,
          emotionAtoB: '호감',
          emotionBtoA: '신뢰',
          memo: '',
        },
      };
      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        persistGraph(nodes, next);
        return next;
      });
      setSelectedEdgeId(newEdge.id);
    },
    [nodes, persistGraph]
  );

  const handleExportImage = async () => {
    if (!canvasRef.current || !activeDocument) return;
    await exportElementAsPng(canvasRef.current, {
      fileName: `${activeDocument.title}-캐릭터관계도`,
    });
  };

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const handleUpdateEdgeData = (key: string, value: any) => {
    if (!selectedEdgeId) return;
    const nextEdges = edges.map((ed) => {
      if (ed.id === selectedEdgeId) {
        return {
          ...ed,
          data: {
            ...ed.data,
            [key]: value,
          },
        };
      }
      return ed;
    });
    setEdges(nextEdges);
    persistGraph(nodes, nextEdges);
  };

  const handleAddCharacter = () => {
    if (!newCharName.trim()) return;
    const newNode: Node = {
      id: `node-${generateId()}`,
      type: 'characterNode',
      position: { x: 350 + (nodes.length % 3) * 80, y: 200 + (nodes.length % 3) * 60 },
      data: {
        name: newCharName.trim(),
        role: newCharRole.trim() || '캐릭터',
        imageUrl: newCharImage.trim() || undefined,
      },
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    persistGraph(nextNodes, edges);
    setIsAddModalOpen(false);
    setNewCharName('');
    setNewCharRole('');
    setNewCharImage('');
    setSelectedNodeId(newNode.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader saveStatus={saveStatus} onExportImage={handleExportImage} />

      {/* Main 3-Column Layout: Left Character List + Center Canvas + Right Edge Settings */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Character List */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500">캐릭터 목록</span>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-6 h-6 rounded-lg bg-lavender-50 hover:bg-lavender-100 text-lavender-700 flex items-center justify-center transition-colors"
                title="새 캐릭터 추가"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[calc(100vh-220px)] overflow-y-auto">
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const nodeData = node.data as CharacterNodeData;
                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all text-left ${
                      isSelected
                        ? 'bg-lavender-50 text-lavender-900 font-bold border border-lavender-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {nodeData.imageUrl ? (
                        <img src={nodeData.imageUrl} alt={nodeData.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400 m-auto mt-1" />
                      )}
                    </div>
                    <span className="truncate flex-1">{nodeData.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Node Graph Canvas */}
        <div ref={canvasRef} className="flex-1 relative bg-[#F8FAFD]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
            }}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Background color="#CBD5E1" gap={20} size={1} />
            <Controls className="!bg-white !border !border-slate-200 !shadow-soft !rounded-xl" />
          </ReactFlow>
        </div>

        {/* Right Sidebar: Relation Line Settings (우측 패널: 관계선 설정) */}
        <div className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <span className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
            관계선 설정
          </span>

          {selectedEdge ? (
            <div className="flex flex-col gap-4 text-xs">
              {/* Relation Type */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">관계 유형</label>
                <select
                  value={(selectedEdge.data?.relationType as string) || '연인'}
                  onChange={(e) => {
                    handleUpdateEdgeData('relationType', e.target.value);
                    handleUpdateEdgeData('label', e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-lavender-500 !bg-white"
                >
                  <option value="연인">연인</option>
                  <option value="라이벌">라이벌 / 경쟁</option>
                  <option value="동료">동료 / 협력</option>
                  <option value="보호">보호 / 수호</option>
                  <option value="적대">적대 / 반목</option>
                </select>
              </div>

              {/* Style Toggle (단색 vs 그라데이션) */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1.5">스타일</label>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => handleUpdateEdgeData('style', 'single')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedEdge.data?.style === 'single'
                        ? 'bg-white text-slate-800 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    단색
                  </button>
                  <button
                    onClick={() => handleUpdateEdgeData('style', 'gradient')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedEdge.data?.style !== 'single'
                        ? 'bg-white text-lavender-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    그라데이션
                  </button>
                </div>
              </div>

              {/* Stroke Width Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-600">굵기</label>
                  <span className="text-[11px] text-slate-400 font-bold">
                    {(selectedEdge.data?.strokeWidth as number) || 2.5}px
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.5"
                  value={(selectedEdge.data?.strokeWidth as number) || 2.5}
                  onChange={(e) => handleUpdateEdgeData('strokeWidth', Number(e.target.value))}
                  className="w-full accent-lavender-600 cursor-pointer"
                />
              </div>

              {/* Dual Emotions (방향별 감정) */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 text-xs">방향별 감정</span>
                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">A → B</span>
                    <input
                      type="text"
                      value={(selectedEdge.data?.emotionAtoB as string) || '호감, 의지'}
                      onChange={(e) => handleUpdateEdgeData('emotionAtoB', e.target.value)}
                      placeholder="예: 호감, 의지"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 !bg-white focus:outline-none focus:border-lavender-500"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">B → A</span>
                    <input
                      type="text"
                      value={(selectedEdge.data?.emotionBtoA as string) || '집착, 소유욕'}
                      onChange={(e) => handleUpdateEdgeData('emotionBtoA', e.target.value)}
                      placeholder="예: 집착, 소유욕"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 !bg-white focus:outline-none focus:border-lavender-500"
                    />
                  </div>
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">메모</label>
                <textarea
                  rows={2}
                  value={(selectedEdge.data?.memo as string) || '서로에게 강한 감정을 가지고 있음.'}
                  onChange={(e) => handleUpdateEdgeData('memo', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 !bg-white resize-none focus:outline-none focus:border-lavender-500"
                  placeholder="관계에 대한 비고나 서사적 설명을 입력하세요."
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center leading-relaxed">
              캔버스에서 관계선을 클릭하면 속성을 변경할 수 있습니다.
            </p>
          )}
        </div>
      </div>

      {/* Add Character Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">새 캐릭터 추가</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">캐릭터 이름</label>
                <input
                  type="text"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="예: 카일, 세이라"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">역할 / 신분</label>
                <input
                  type="text"
                  value={newCharRole}
                  onChange={(e) => setNewCharRole(e.target.value)}
                  placeholder="예: 마법사, 기사단장"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">프로필 이미지 URL</label>
                <input
                  type="text"
                  value={newCharImage}
                  onChange={(e) => setNewCharImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleAddCharacter}
                className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-xs font-semibold text-white shadow-soft"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
