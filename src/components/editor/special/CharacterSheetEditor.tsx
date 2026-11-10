import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  User,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Shield,
  Sparkles,
  Type,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Quote,
  CheckSquare,
  ChevronDown,
  MessageSquare,
  Bookmark,
  Share2,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface CharacterSheetData {
  name: string;
  affiliation: string;
  age: string;
  height: string;
  personality: string;
  imageUrl: string;
  stats: { [key: string]: string };
  quote: string;
  description: string;
}

const DEFAULT_ARZEN: CharacterSheetData = {
  name: '아르젠',
  affiliation: '노바 기사단',
  age: '19세',
  height: '168cm',
  personality: '냉정하고 이성적이나, 가까운 이에게는 다정함.',
  imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
  stats: {
    '힘': 'B',
    '민첩': 'A',
    '지능': 'A',
    '체력': 'B',
    '마력': 'S',
    '행운': 'C',
  },
  quote: '"언젠가, 이 선택이 옳았다고 믿고 싶어."',
  description: '노바 기사단 소속의 신입 기사. 뛰어난 재능으로 주목받고 있지만, 과거의 사건으로 인해 휩사리 타인에게 마음을 열지 않는다. 검술과 원소 마법의 융합에 능하며 고대 유적 탐사 임무를 맡고 있다.',
};

export const CharacterSheetEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'basic' | 'background' | 'ability' | 'extra'>('basic');
  const [data, setData] = useState<CharacterSheetData>(DEFAULT_ARZEN);

  // Load from page content or default
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        setData({ ...DEFAULT_ARZEN, ...parsed });
        return;
      }
    } catch {}
    setData(DEFAULT_ARZEN);
  }, [activePage?.id]);

  const persistData = (next: CharacterSheetData) => {
    setData(next);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(next));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${data.name || '캐릭터'}-캐릭터시트`,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader saveStatus={saveStatus} onExportImage={handleExportImage} />

      {/* Main 3-Column Layout: Left Sidebar + Center Document Sheet + Right Block Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Pages */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 px-1">페이지</span>
            <div className="flex flex-col gap-1">
              {[
                { id: 'basic', label: '기본 정보', icon: User },
                { id: 'background', label: '설정 및 배경', icon: FileText },
                { id: 'ability', label: '능력 및 특성', icon: Sparkles },
                { id: 'extra', label: '추가 자료', icon: Bookmark },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = activeTab === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveTab(p.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-lavender-50 text-lavender-800 font-bold border border-lavender-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-lavender-600' : 'text-slate-400'}`} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => alert('새 페이지가 추가되었습니다.')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-lavender-400 text-slate-500 hover:text-lavender-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>페이지 추가</span>
          </button>
        </div>

        {/* Center: Character Sheet Document Canvas */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
          <div
            ref={printRef}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-soft max-w-3xl w-full p-8 flex flex-col gap-6"
          >
            {/* Top Row: Character Portrait + Meta Info & Status */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-6 border-b border-slate-100">
              {/* Left Column: Portrait */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full aspect-[3/4] max-h-72 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs relative group">
                  <img
                    src={data.imageUrl}
                    alt={data.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const url = prompt('캐릭터 이미지 URL을 입력하세요:', data.imageUrl);
                        if (url) persistData({ ...data, imageUrl: url });
                      }}
                      className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md hover:bg-slate-50"
                    >
                      이미지 변경
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Name, Attributes, Status Table */}
              <div className="md:col-span-7 flex flex-col gap-4">
                {/* Character Name */}
                <div>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => persistData({ ...data, name: e.target.value })}
                    className="text-2xl font-black text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-none w-full !bg-white"
                    placeholder="캐릭터 이름"
                  />
                </div>

                {/* Basic Meta List */}
                <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-10">소속</span>
                    <input
                      type="text"
                      value={data.affiliation}
                      onChange={(e) => persistData({ ...data, affiliation: e.target.value })}
                      className="text-slate-800 font-semibold focus:outline-none !bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-10">나이</span>
                    <input
                      type="text"
                      value={data.age}
                      onChange={(e) => persistData({ ...data, age: e.target.value })}
                      className="text-slate-800 font-semibold focus:outline-none !bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 w-10">신장</span>
                    <input
                      type="text"
                      value={data.height}
                      onChange={(e) => persistData({ ...data, height: e.target.value })}
                      className="text-slate-800 font-semibold focus:outline-none !bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 col-span-2 mt-1">
                    <span className="font-bold text-slate-400 w-10 shrink-0">성격</span>
                    <input
                      type="text"
                      value={data.personality}
                      onChange={(e) => persistData({ ...data, personality: e.target.value })}
                      className="text-slate-800 font-medium focus:outline-none !bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 flex-1"
                    />
                  </div>
                </div>

                {/* Status Table (스테이터스) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-700">스테이터스</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(data.stats).map(([statName, val]) => (
                      <div
                        key={statName}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs shadow-2xs"
                      >
                        <span className="text-slate-400 font-medium">{statName}</span>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const nextStats = { ...data.stats, [statName]: e.target.value };
                            persistData({ ...data, stats: nextStats });
                          }}
                          className="w-7 text-right font-black text-lavender-700 focus:outline-none !bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Quote & Description */}
            <div className="flex flex-col gap-5">
              {/* One-line Quote */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">한줄 소개</span>
                <div className="bg-lavender-50/60 border border-lavender-100 rounded-2xl p-3.5 italic text-slate-700 text-xs font-medium">
                  <input
                    type="text"
                    value={data.quote}
                    onChange={(e) => persistData({ ...data, quote: e.target.value })}
                    className="w-full bg-transparent focus:outline-none text-lavender-900 font-bold"
                  />
                </div>
              </div>

              {/* Detailed Description */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-700">상세 설명</span>
                <textarea
                  rows={4}
                  value={data.description}
                  onChange={(e) => persistData({ ...data, description: e.target.value })}
                  className="w-full text-xs text-slate-700 leading-relaxed border border-slate-200 rounded-2xl p-3.5 focus:outline-none focus:border-lavender-500 !bg-white resize-none"
                  placeholder="캐릭터의 출신, 배경 스토리 및 특징을 작성하세요."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Block Tools Palette */}
        <div className="w-52 bg-white border-l border-slate-200 p-4 flex flex-col gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-400 px-1">블록 추가</span>
          <div className="flex flex-col gap-1 text-xs">
            {[
              { label: '텍스트', icon: Type },
              { label: '이미지', icon: ImageIcon },
              { label: '표', icon: TableIcon },
              { label: '구분선', icon: Minus },
              { label: '인용문', icon: Quote },
              { label: '체크리스트', icon: CheckSquare },
              { label: '접기/펼치기', icon: ChevronDown },
              { label: '콜아웃 (메모)', icon: MessageSquare },
            ].map((block) => {
              const Icon = block.icon;
              return (
                <button
                  key={block.label}
                  onClick={() => alert(`'${block.label}' 블록이 템플릿에 추가되었습니다.`)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-lavender-700 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-xs">{block.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
