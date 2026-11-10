import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Plus,
  Image as ImageIcon,
  Type,
  Square,
  Sparkles,
  MessageSquare,
  Check,
  Undo2,
  Redo2,
  MousePointer2,
  Hand,
  Link as LinkIcon,
  Palette,
  Maximize2,
  ChevronDown,
  Download,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface BoardItem {
  id: string;
  type: 'image' | 'palette' | 'tape' | 'postit' | 'sketch' | 'sticker';
  title?: string;
  url?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  content?: string;
  checklist?: { text: string; done: boolean }[];
  colors?: string[];
  rotate?: number;
}

const DEFAULT_BOARD_ITEMS: BoardItem[] = [
  // 1. 마스킹 테이프 라벨
  {
    id: 'tape-1',
    type: 'tape',
    x: 48,
    y: 20,
    w: 160,
    h: 56,
    content: '무드보드\n(Moodboard)',
    rotate: -4,
  },
  // 2. 5색 컬러 팔레트 칩
  {
    id: 'palette-1',
    type: 'palette',
    x: 230,
    y: 28,
    w: 220,
    h: 46,
    colors: ['#2A2744', '#595079', '#9C7A99', '#DDA49C', '#F7E3DA'],
  },
  // 3. 중앙 큰 환상 마을 야경 컨셉아트
  {
    id: 'img-main',
    type: 'image',
    title: '마을 전경 야경',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=900&auto=format&fit=crop',
    x: 130,
    y: 86,
    w: 360,
    h: 215,
  },
  // 4. 가로등 랜턴 불빛 클로즈업
  {
    id: 'img-lantern',
    type: 'image',
    title: '가로등 랜턴 레퍼런스',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=500&auto=format&fit=crop',
    x: 508,
    y: 28,
    w: 140,
    h: 170,
  },
  // 5. 스테인드글라스 창문
  {
    id: 'img-stained',
    type: 'image',
    title: '스테인드글라스 창문',
    url: 'https://images.unsplash.com/photo-1548625361-195fe5787e98?q=80&w=500&auto=format&fit=crop',
    x: 664,
    y: 28,
    w: 140,
    h: 170,
  },
  // 6. 좌측 나뭇가지 잎사귀 스티커
  {
    id: 'sticker-leaf',
    type: 'sticker',
    x: 95,
    y: 155,
    w: 34,
    h: 110,
    content: '🌿',
  },
  // 7. 좌측 하단 상점 야경 사진
  {
    id: 'img-market',
    type: 'image',
    title: '상점가 야경 레퍼런스',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format&fit=crop',
    x: 100,
    y: 315,
    w: 180,
    h: 180,
  },
  // 8. 중앙 하단 핀 고정 캐릭터 원화/스케치 시트
  {
    id: 'sketch-char',
    type: 'sketch',
    title: '주인공 아르젠 원화 시트',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
    x: 295,
    y: 310,
    w: 240,
    h: 195,
    rotate: -1,
  },
  // 9. 우측 체크리스트 포스트잇
  {
    id: 'postit-check',
    type: 'postit',
    x: 650,
    y: 215,
    w: 165,
    h: 160,
    checklist: [
      { text: '전체 분위기', done: true },
      { text: '컬러 팔레트', done: true },
      { text: '건축 스타일', done: true },
      { text: '오브젝트 레퍼런스', done: false },
    ],
  },
  // 10. 우측 하단 건축 펜화 스케치
  {
    id: 'sketch-arch',
    type: 'image',
    title: '건축물 스케치',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=500&auto=format&fit=crop',
    x: 650,
    y: 388,
    w: 155,
    h: 125,
  },
];

export const ReferenceBoardEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeBoard, setActiveBoard] = useState('main');
  const [boards, setBoards] = useState([
    { id: 'main', name: '메인 보드' },
    { id: 'ref', name: '레퍼런스' },
    { id: 'mood', name: '무드보드' },
    { id: 'concept', name: '컨셉 아트' },
  ]);

  const [items, setItems] = useState<BoardItem[]>(DEFAULT_BOARD_ITEMS);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.items) {
          setItems(parsed.items);
        }
        if (parsed.boards) {
          setBoards(parsed.boards);
        }
        return;
      }
    } catch {}
    setItems(DEFAULT_BOARD_ITEMS);
  }, [activePage?.id]);

  const persistData = (newItems: BoardItem[], newBoards = boards) => {
    setItems(newItems);
    setBoards(newBoards);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(
      activePage.id,
      JSON.stringify({ items: newItems, boards: newBoards })
    );
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-레퍼런스보드`,
    });
  };

  const toggleCheck = (itemId: string, checkIndex: number) => {
    const updated = items.map((it) => {
      if (it.id === itemId && it.checklist) {
        const nextList = [...it.checklist];
        nextList[checkIndex] = {
          ...nextList[checkIndex],
          done: !nextList[checkIndex].done,
        };
        return { ...it, checklist: nextList };
      }
      return it;
    });
    persistData(updated);
  };

  const handleAddBoard = () => {
    const name = prompt('새 보드 이름을 입력하세요:');
    if (!name?.trim()) return;
    const newBoard = { id: `board-${Date.now()}`, name: name.trim() };
    const nextBoards = [...boards, newBoard];
    persistData(items, nextBoards);
    setActiveBoard(newBoard.id);
  };

  const handleAddItem = (type: BoardItem['type']) => {
    const newItem: BoardItem = {
      id: `item-${Date.now()}`,
      type,
      x: 100 + Math.random() * 80,
      y: 100 + Math.random() * 80,
      w: type === 'postit' ? 160 : type === 'palette' ? 200 : 180,
      h: type === 'postit' ? 150 : type === 'palette' ? 45 : 160,
      content: type === 'tape' ? '새 메모' : undefined,
      checklist:
        type === 'postit'
          ? [
              { text: '새 항목 1', done: false },
              { text: '새 항목 2', done: false },
            ]
          : undefined,
      colors:
        type === 'palette'
          ? ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
          : undefined,
      url:
        type === 'image'
          ? 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop'
          : undefined,
    };
    persistData([...items, newItem]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
      />

      {/* Sub Toolbar (Matched to Example Image) */}
      <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left Undo / Redo / Drawing Tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="실행 취소"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="다시 실행"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1.5" />

          <button
            type="button"
            title="선택"
            className="p-1.5 bg-lavender-50 text-lavender-600 rounded-lg"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="화면 이동"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="텍스트"
            onClick={() => handleAddItem('tape')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="이미지 추가"
            onClick={() => handleAddItem('image')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="링크"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="팔레트"
            onClick={() => handleAddItem('palette')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>

        {/* Right Zoom + Image Save Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <span>{zoomLevel}%</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <button
            type="button"
            title="전체 화면"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleExportImage}
            className="flex items-center gap-1.5 px-3 py-1 bg-lavender-500 hover:bg-lavender-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>이미지로 저장</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column: Left Sidebars (Board List + Add Element) & Center Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-48 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-5">
            {/* 1. Board List */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                보드 목록
              </span>
              <div className="flex flex-col gap-1 text-xs">
                {boards.map((b) => {
                  const isActive = activeBoard === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveBoard(b.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium transition-all ${
                        isActive
                          ? 'bg-lavender-100 text-lavender-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Folder
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-lavender-600 fill-lavender-300'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{b.name}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddBoard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-lavender-600 hover:bg-lavender-50 rounded-xl transition-colors mt-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>보드 추가</span>
                </button>
              </div>
            </div>

            {/* 2. Add Element Panel */}
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                요소 추가
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddItem('image')}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors border border-slate-200/60"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>이미지</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('tape')}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors border border-slate-200/60"
                >
                  <Type className="w-4 h-4 text-slate-500" />
                  <span>텍스트</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('palette')}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors border border-slate-200/60"
                >
                  <Square className="w-4 h-4 text-slate-500" />
                  <span>도형 / 팔레트</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('sticker')}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors border border-slate-200/60"
                >
                  <Sparkles className="w-4 h-4 text-slate-500" />
                  <span>스티커</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('postit')}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors border border-slate-200/60"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>메모 / 체크리스트</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Board Canvas */}
        <div
          ref={printRef}
          className="flex-1 bg-[#F5F6FA] relative overflow-auto p-8"
          style={{
            backgroundImage:
              'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="relative min-w-[920px] min-h-[580px] bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            {/* Render Items */}
            {items.map((it) => {
              // 1. Masking Tape Title
              if (it.type === 'tape') {
                return (
                  <div
                    key={it.id}
                    style={{
                      left: it.x,
                      top: it.y,
                      transform: it.rotate ? `rotate(${it.rotate}deg)` : undefined,
                    }}
                    className="absolute z-20 group"
                  >
                    <div className="bg-[#FAF2DE] border-y border-[#E0D1B5] text-[#4A3E31] px-4 py-2 shadow-sm rounded-xs font-serif text-center select-text">
                      <div className="text-sm font-bold leading-tight">
                        무드보드
                      </div>
                      <div className="text-[11px] text-[#7A6B5B] font-mono">
                        (Moodboard)
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. Palette Chip
              if (it.type === 'palette' && it.colors) {
                return (
                  <div
                    key={it.id}
                    style={{ left: it.x, top: it.y }}
                    className="absolute z-20 flex items-center gap-2 bg-white/80 backdrop-blur-xs p-1.5 rounded-2xl shadow-xs border border-slate-200"
                  >
                    {it.colors.map((c, idx) => (
                      <div
                        key={idx}
                        style={{ backgroundColor: c }}
                        title={c}
                        className="w-8 h-8 rounded-xl shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                      />
                    ))}
                  </div>
                );
              }

              // 3. Post-it Checklist
              if (it.type === 'postit' && it.checklist) {
                return (
                  <div
                    key={it.id}
                    style={{
                      left: it.x,
                      top: it.y,
                      width: it.w,
                    }}
                    className="absolute z-20 bg-[#F0F2FD] border border-lavender-200 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-2.5">
                      {it.checklist.map((c, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleCheck(it.id, idx)}
                          className="flex items-center gap-2.5 text-left text-xs font-medium text-slate-700 hover:text-lavender-700 transition-colors"
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                              c.done
                                ? 'bg-lavender-500 border-lavender-500 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {c.done && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span
                            className={
                              c.done ? 'line-through text-slate-400' : ''
                            }
                          >
                            {c.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              // 4. Character Sketch Sheet with pins
              if (it.type === 'sketch') {
                return (
                  <div
                    key={it.id}
                    style={{
                      left: it.x,
                      top: it.y,
                      width: it.w,
                      height: it.h,
                      transform: it.rotate ? `rotate(${it.rotate}deg)` : undefined,
                    }}
                    className="absolute z-10 bg-white border border-slate-200 rounded-xl p-2.5 shadow-md flex flex-col group"
                  >
                    {/* Push Pin */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-lavender-500 border-2 border-white shadow-xs z-30" />
                    <img
                      src={it.url}
                      alt={it.title}
                      className="w-full h-full object-cover rounded-lg border border-slate-100"
                    />
                  </div>
                );
              }

              // 5. Sticker (leaves)
              if (it.type === 'sticker') {
                return (
                  <div
                    key={it.id}
                    style={{ left: it.x, top: it.y }}
                    className="absolute z-10 text-2xl filter drop-shadow-xs select-none pointer-events-none"
                  >
                    {it.content}
                  </div>
                );
              }

              // 6. General Reference Images
              return (
                <div
                  key={it.id}
                  style={{
                    left: it.x,
                    top: it.y,
                    width: it.w,
                    height: it.h,
                  }}
                  className="absolute z-10 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100 group transition-transform hover:shadow-md"
                >
                  <img
                    src={it.url}
                    alt={it.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-[11px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                    <span className="truncate">{it.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

