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
import { Plus, Trash2, UserPlus, Heart, ShieldAlert, Sparkles, X, User } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

// Emotional Color Palette for Gradient Lines
export const EMOTIONS = [
  { id: 'love', name: '호감 / 사랑', color: '#EC4899', fromColor: '#F472B6' },
  { id: 'friendship', name: '우호 / 신뢰', color: '#8B5CF6', fromColor: '#A78BFA' },
  { id: 'neutral', name: '비즈니스 / 중립', color: '#0EA5E9', fromColor: '#38BDF8' },
  { id: 'suspicion', name: '경계 / 의심', color: '#F59E0B', fromColor: '#FBBF24' },
  { id: 'hostility', name: '적대 / 라이벌', color: '#EF4444', fromColor: '#F87171' },
];

export interface CharacterNodeData extends Record<string, unknown> {
  name: string;
  role: string;
  imageUrl?: string;
}

// Custom Circular Character Node
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
        className={`w-16 h-16 rounded-full overflow-hidden border-2 bg-white flex items-center justify-center shadow-md ${
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

      {/* Name and Role Label */}
      <div className="mt-1.5 flex flex-col items-center">
        <span className="font-bold text-xs text-slate-800 bg-white/95 px-2 py-0.5 rounded-full shadow-xs border border-slate-200 truncate max-w-[90px]">
          {data.name}
        </span>
        {data.role && (
          <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
            {data.role}
          </span>
        )}
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

  const sourceEmotion = EMOTIONS.find((e) => e.id === (data?.sourceEmotion || 'friendship')) || EMOTIONS[1];
  const targetEmotion = EMOTIONS.find((e) => e.id === (data?.targetEmotion || 'neutral')) || EMOTIONS[2];
  const relationLabel = (data?.label as string) || '';

  const gradientId = `gradient-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceEmotion.color} />
          <stop offset="100%" stopColor={targetEmotion.color} />
        </linearGradient>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: selected ? 3.5 : 2.5,
          strokeDasharray: (data?.dashed as boolean) ? '4 4' : undefined,
        }}
      />

      {/* Middle Relation Tag */}
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

export const CharacterRelationsEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!canvasRef.current || !activeDocument) return;
    await exportElementAsPng(canvasRef.current, {
      fileName: `${activeDocument.title}-캐릭터관계도`,
    });
  };

  // Node & Edge States
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Character Add Modal State
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
        setNodes(parsed.nodes || []);
        setEdges(parsed.edges || []);
      } else {
        // Initial Default sample nodes for relations
        const defaultNodes: Node[] = [
          {
            id: 'char-1',
            type: 'characterNode',
            position: { x: 180, y: 150 },
            data: { name: '루미나', role: '주인공 / 성령기사', imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' },
          },
          {
            id: 'char-2',
            type: 'characterNode',
            position: { x: 480, y: 150 },
            data: { name: '카엘', role: '라이벌 / 마도학자', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
          },
        ];
        const defaultEdges: Edge[] = [
          {
            id: 'edge-1-2',
            type: 'gradientEdge',
            source: 'char-1',
            target: 'char-2',
            data: {
              label: '경쟁적 신뢰',
              sourceEmotion: 'friendship',
              targetEmotion: 'hostility',
            },
          },
        ];
        setNodes(defaultNodes);
        setEdges(defaultEdges);
      }
    } catch {
      setNodes([]);
      setEdges([]);
    }
  }, [activePage?.id]);

  // Save Graph Data Helper
  const saveGraph = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      if (!activePage) return;
      setSaveStatus('saving');
      const json = JSON.stringify({ nodes: newNodes, edges: newEdges });
      updatePageContent(activePage.id, json);
      setTimeout(() => setSaveStatus('saved'), 400);
    },
    [activePage, updatePageContent]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        saveGraph(next, edges);
        return next;
      });
    },
    [edges, saveGraph]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        saveGraph(nodes, next);
        return next;
      });
    },
    [nodes, saveGraph]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: generateId('edge'),
        type: 'gradientEdge',
        data: {
          label: '관계',
          sourceEmotion: 'friendship',
          targetEmotion: 'neutral',
        },
      };
      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        saveGraph(nodes, next);
        return next;
      });
    },
    [nodes, saveGraph]
  );

  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const newNode: Node = {
      id: generateId('char'),
      type: 'characterNode',
      position: { x: 300 + Math.random() * 80, y: 200 + Math.random() * 80 },
      data: {
        name: newCharName.trim(),
        role: newCharRole.trim() || '등장인물',
        imageUrl: newCharImage.trim() || undefined,
      },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    saveGraph(nextNodes, edges);

    setNewCharName('');
    setNewCharRole('');
    setNewCharImage('');
    setIsAddModalOpen(false);
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      const nextNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const nextEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
      setNodes(nextNodes);
      setEdges(nextEdges);
      saveGraph(nextNodes, nextEdges);
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      const nextEdges = edges.filter((e) => e.id !== selectedEdgeId);
      setEdges(nextEdges);
      saveGraph(nodes, nextEdges);
      setSelectedEdgeId(null);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // Update selected edge emotions
  const handleUpdateEdgeData = (key: string, value: any) => {
    if (!selectedEdgeId) return;
    const nextEdges = edges.map((ed) =>
      ed.id === selectedEdgeId ? { ...ed, data: { ...ed.data, [key]: value } } : ed
    );
    setEdges(nextEdges);
    saveGraph(nodes, nextEdges);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9FAFD] overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>캐릭터 추가</span>
            </button>
            {(selectedNodeId || selectedEdgeId) && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택 삭제</span>
              </button>
            )}
          </div>
        }
      />

      {/* Main Flow Canvas */}
      <div ref={canvasRef} className="flex-1 relative bg-white">
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
          onPaneClick={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#CBD5E1" gap={18} size={1} />
          <Controls className="!bg-white !border-slate-200 !shadow-soft !rounded-xl" />

          {/* Quick Guidance Panel */}
          <Panel position="top-left" className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-[#ECEEF3] shadow-soft max-w-xs text-xs text-slate-500">
            <p className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-lavender-600" />
              <span>캐릭터 관계도 편집 안내</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              원형 노드를 드래그하여 배치하고, 노드의 핸들을 연결해 관계선을 만드세요. 연결선을 클릭하면 양방향 감정 그라데이션을 설정할 수 있습니다.
            </p>
          </Panel>

          {/* Edge Inspector Panel (When an edge is clicked) */}
          {selectedEdge && (
            <Panel position="top-right" className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal p-4 w-72 flex flex-col gap-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">관계선 감정 설정</span>
                <button onClick={() => setSelectedEdgeId(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">관계 라벨</label>
                <input
                  type="text"
                  value={(selectedEdge.data?.label as string) || ''}
                  onChange={(e) => handleUpdateEdgeData('label', e.target.value)}
                  placeholder="예: 라이벌, 연인, 소꿉친구"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  시작 캐릭터 감정
                </label>
                <select
                  value={(selectedEdge.data?.sourceEmotion as string) || 'friendship'}
                  onChange={(e) => handleUpdateEdgeData('sourceEmotion', e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                >
                  {EMOTIONS.map((emo) => (
                    <option key={emo.id} value={emo.id}>
                      {emo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  도착 캐릭터 감정
                </label>
                <select
                  value={(selectedEdge.data?.targetEmotion as string) || 'neutral'}
                  onChange={(e) => handleUpdateEdgeData('targetEmotion', e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                >
                  {EMOTIONS.map((emo) => (
                    <option key={emo.id} value={emo.id}>
                      {emo.name}
                    </option>
                  ))}
                </select>
              </div>
            </Panel>
          )}

          {/* Node Inspector Panel */}
          {selectedNode && (
            <Panel position="top-right" className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal p-4 w-72 flex flex-col gap-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-800">캐릭터 프로필</span>
                <button onClick={() => setSelectedNodeId(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={(selectedNode.data.imageUrl as string) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'}
                  alt={selectedNode.data.name as string}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{selectedNode.data.name as string}</h4>
                  <span className="text-slate-400 text-xs">{(selectedNode.data.role as string) || '등장인물'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px] text-slate-500">
                <span>이 캐릭터와 연결된 관계선 수: {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length}개</span>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Add Character Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal w-full max-w-sm p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">새 캐릭터 추가</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCharacter} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">캐릭터 이름 *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="예: 루미나, 아르테미스"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">역할 / 직업</label>
                <input
                  type="text"
                  value={newCharRole}
                  onChange={(e) => setNewCharRole(e.target.value)}
                  placeholder="예: 주인공, 마법사, 기사단장"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">프로필 이미지 URL (선택)</label>
                <input
                  type="url"
                  value={newCharImage}
                  onChange={(e) => setNewCharImage(e.target.value)}
                  placeholder="비워두면 기본 아바타가 지정됩니다"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!newCharName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-lavender-600 hover:bg-lavender-700 rounded-xl"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

