import React, { useState, useEffect, useRef } from 'react';
import {
  Hourglass,
  Calendar,
  BookOpen,
  Scroll,
  FileText,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  Sparkles,
  Download,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface EraItem {
  id: string;
  name: string;
  period: string;
}

interface EventItem {
  id: string;
  year: string;
  title: string;
  desc: string;
  icon: string;
}

interface ChronicleData {
  eraRange: string;
  unit: 'all' | 'era' | 'century' | 'decade';
  eras: EraItem[];
  events: EventItem[];
}

const DEFAULT_CHRONICLE_DATA: ChronicleData = {
  eraRange: '전체 시대',
  unit: 'all',
  eras: [
    { id: 'era-1', name: '고대 시대', period: '(~ 0년)' },
    { id: 'era-2', name: '제1시대', period: '(0년 ~ 499년)' },
    { id: 'era-3', name: '제2시대', period: '(500년 ~ 999년)' },
    { id: 'era-4', name: '제3시대', period: '(1000년 ~ )' },
  ],
  events: [
    {
      id: 'ev-1',
      year: '· ???년',
      title: '세계의 시작',
      desc: '세계가 형성되다.',
      icon: '🔮',
    },
    {
      id: 'ev-2',
      year: '0년',
      title: '제1시대의 개막',
      desc: '새로운 시대가 시작된다.',
      icon: '🚩',
    },
    {
      id: 'ev-3',
      year: '327년',
      title: '대전쟁',
      desc: '대륙 전역의 전쟁이 발발.',
      icon: '⚔️',
    },
    {
      id: 'ev-4',
      year: '752년',
      title: '왕국의 성립',
      desc: '에르젠 왕국이 수립된다.',
      icon: '👑',
    },
    {
      id: 'ev-5',
      year: '1,103년',
      title: '대재앙',
      desc: '세계를 뒤흔든 재앙이 발생.',
      icon: '☄️',
    },
  ],
};

export const WorldChronicleEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'eraSummary' | 'events' | 'detail'>('timeline');
  const [data, setData] = useState<ChronicleData>(DEFAULT_CHRONICLE_DATA);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        setData({ ...DEFAULT_CHRONICLE_DATA, ...parsed });
        return;
      }
    } catch {}
    setData(DEFAULT_CHRONICLE_DATA);
  }, [activePage?.id]);

  const persistData = (next: ChronicleData) => {
    setData(next);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(next));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-역사및연대기`,
    });
  };

  const handleAddEvent = () => {
    const title = prompt('사건 명칭 (예: 대전쟁):');
    if (!title?.trim()) return;
    const year = prompt('연도 (예: 1,200년):') || '미상';
    const desc = prompt('사건 설명:') || '사건에 대한 설명';
    const newEv: EventItem = {
      id: `ev-${Date.now()}`,
      year,
      title: title.trim(),
      desc,
      icon: '📜',
    };
    persistData({ ...data, events: [...data.events, newEv] });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
      />

      {/* Main 2-Column: Left Sidebar + Center Timeline Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-52 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-lavender-600" />
              <span>연대표</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('eraSummary')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'eraSummary'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>시대별 개요</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'events'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Scroll className="w-4 h-4 text-slate-400" />
              <span>주요 사건</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'detail'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>사건 상세</span>
            </button>
          </div>
        </div>

        {/* Center Timeline Stage */}
        <div
          ref={printRef}
          className="flex-1 bg-white overflow-y-auto p-6 flex flex-col gap-5"
        >
          {/* Header Banner (Hourglass Theme matched to example image) */}
          <div className="relative rounded-2xl p-5 border border-lavender-200 bg-gradient-to-r from-lavender-100/70 via-purple-50/50 to-white overflow-hidden flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-xs border border-lavender-200 flex items-center justify-center shadow-xs">
                <Hourglass className="w-6 h-6 text-lavender-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  역사 및 연대기
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  세계의 주요 사건과 시대의 흐름을 시간의 흐름에 따라 정리합니다.
                </p>
              </div>
            </div>

            {/* Classical pillars silhouette in background */}
            <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center pr-6">
              <Scroll className="w-32 h-32 text-lavender-700" />
            </div>
          </div>

          {/* Sub Toolbar: Filter Range + Display Unit + Zoom Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            {/* Left: Range Select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">연표 범위</span>
              <select
                value={data.eraRange}
                onChange={(e) =>
                  persistData({ ...data, eraRange: e.target.value })
                }
                className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-lavender-500 !bg-white"
              >
                <option value="전체 시대">전체 시대</option>
                <option value="고대 시대">고대 시대</option>
                <option value="제1시대">제1시대</option>
                <option value="제2시대">제2시대</option>
                <option value="제3시대">제3시대</option>
              </select>
            </div>

            {/* Center: Display Unit Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium mr-1">표시 단위</span>
              {[
                { id: 'all' as const, label: '전체' },
                { id: 'era' as const, label: '시대별' },
                { id: 'century' as const, label: '세기별' },
                { id: 'decade' as const, label: '년대별' },
              ].map((u) => {
                const isSelected = data.unit === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => persistData({ ...data, unit: u.id })}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-lavender-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {u.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Zoom controls */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-slate-600">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg ml-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Era Horizontal Chevron Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {data.eras.map((era, idx) => (
              <div
                key={era.id}
                className="bg-[#F3F4FE] border border-lavender-200/80 rounded-xl px-4 py-3 text-center transition-all hover:bg-lavender-100/60 shadow-2xs relative"
              >
                <div className="font-bold text-xs text-slate-800">
                  {era.name}
                </div>
                <div className="text-[10.5px] text-lavender-600 font-mono mt-0.5">
                  {era.period}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Events Track */}
          <div className="relative pt-6 pb-4 overflow-x-auto">
            {/* Horizontal Timeline Center Axis Line */}
            <div className="absolute top-11 inset-x-4 h-0.5 bg-lavender-300 z-0" />

            {/* Event Cards Row */}
            <div className="flex items-start gap-4 min-w-[850px] relative z-10 px-2">
              {data.events.map((ev, idx) => (
                <div
                  key={ev.id}
                  className="w-44 flex flex-col items-center shrink-0 group"
                >
                  {/* Timeline Dot Node */}
                  <div className="w-5 h-5 rounded-full bg-white border-4 border-lavender-500 shadow-xs mb-3 group-hover:scale-125 transition-transform" />

                  {/* Event Card */}
                  <div className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs hover:border-lavender-400 hover:shadow-md transition-all flex flex-col gap-1.5 text-center">
                    <div className="text-xl mx-auto">{ev.icon}</div>
                    <div className="text-[11px] font-bold text-lavender-700 font-mono">
                      {ev.year}
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {ev.title}
                    </div>
                    <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                      {ev.desc}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add Event Card */}
              <div className="w-40 flex flex-col items-center shrink-0">
                <div className="w-5 h-5 rounded-full bg-slate-200 border-4 border-white mb-3" />
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="w-full min-h-[125px] border-2 border-dashed border-slate-200 hover:border-lavender-400 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-lavender-600 transition-colors bg-slate-50/50 hover:bg-lavender-50/20"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-semibold">사건 추가</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
