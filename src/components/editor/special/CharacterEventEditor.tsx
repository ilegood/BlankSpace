import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  GitBranch,
  MapPin,
  Users,
  FileText,
  ChevronDown,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface EventData {
  title: string;
  condition: string;
  characters: string;
  location: string;
  summary: string;
  details: string;
  flowSteps: {
    label: string;
    type: 'start' | 'action' | 'choice' | 'branch' | 'end';
  }[];
}

const DEFAULT_EVENT: EventData = {
  title: '[메인] 1장. 만남',
  condition: '스토리 시작 시 자동 발생',
  characters: '아르젠, 카일',
  location: '왕도 중앙 광장',
  summary: '두 사람이 처음으로 마주치는 사건.',
  details: '왕도로 향하던 아르젠은 우연히 카일과 충돌한다. 사소한 말다툼으로 시작되지만, 과거의 단서를 지닌 서로의 문장을 확인하며 이후 두 사람의 운명적인 여정이 본격적으로 시작되는 계기가 된다.',
  flowSteps: [
    { label: '이벤트 시작', type: 'start' },
    { label: '대화 (아르젠 ↔ 카일)', type: 'action' },
    { label: '선택지 (태도 결정)', type: 'choice' },
    { label: '호의적 반응 / 경계하는 반응', type: 'branch' },
    { label: '이벤트 종료', type: 'end' },
  ],
};

export const CharacterEventEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [eventType, setEventType] = useState<'all' | 'main' | 'sub' | 'personal'>('main');
  const [data, setData] = useState<EventData>(DEFAULT_EVENT);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        setData({ ...DEFAULT_EVENT, ...parsed });
        return;
      }
    } catch {}
    setData(DEFAULT_EVENT);
  }, [activePage?.id]);

  const persistData = (next: EventData) => {
    setData(next);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(next));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${data.title}-이벤트시트`,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader saveStatus={saveStatus} onExportImage={handleExportImage} />

      {/* Main 3-Column Layout: Left Event List + Center Document + Right Event Flow */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Event List */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 px-1">이벤트 목록</span>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: 'all', label: '전체 이벤트', count: 6 },
                { id: 'main', label: '메인 이벤트', count: 3 },
                { id: 'sub', label: '서브 이벤트', count: 2 },
                { id: 'personal', label: '개인 이벤트', count: 1 },
              ].map((ev) => {
                const isSelected = eventType === ev.id;
                return (
                  <button
                    key={ev.id}
                    onClick={() => setEventType(ev.id as any)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-lavender-50 text-lavender-900 font-bold border border-lavender-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-lavender-600' : 'text-slate-400'}`} />
                      <span>{ev.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{ev.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => alert('새 이벤트 항목이 생성되었습니다.')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-lavender-400 text-slate-500 hover:text-lavender-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>이벤트 추가</span>
          </button>
        </div>

        {/* Center: Event Detail Sheet (Example Image Style) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#F8FAFD]">
          <div
            ref={printRef}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-soft max-w-2xl w-full p-8 flex flex-col gap-6"
          >
            {/* Title */}
            <div>
              <input
                type="text"
                value={data.title}
                onChange={(e) => persistData({ ...data, title: e.target.value })}
                className="text-2xl font-black text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-none w-full !bg-white"
                placeholder="이벤트 제목 입력"
              />
            </div>

            {/* Event Condition & Participants Table */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-4 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400 w-20 shrink-0">발생 조건</span>
                <input
                  type="text"
                  value={data.condition}
                  onChange={(e) => persistData({ ...data, condition: e.target.value })}
                  className="flex-1 text-slate-800 font-medium !bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400 w-20 shrink-0">참여 캐릭터</span>
                <input
                  type="text"
                  value={data.characters}
                  onChange={(e) => persistData({ ...data, characters: e.target.value })}
                  className="flex-1 text-slate-800 font-medium !bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400 w-20 shrink-0">장소</span>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => persistData({ ...data, location: e.target.value })}
                  className="flex-1 text-slate-800 font-medium !bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-400 w-20 shrink-0">요약</span>
                <input
                  type="text"
                  value={data.summary}
                  onChange={(e) => persistData({ ...data, summary: e.target.value })}
                  className="flex-1 text-slate-800 font-medium !bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Detailed Content */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700">상세 내용</span>
              <textarea
                rows={6}
                value={data.details}
                onChange={(e) => persistData({ ...data, details: e.target.value })}
                className="w-full text-xs text-slate-700 leading-relaxed border border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-lavender-500 !bg-white resize-none"
                placeholder="이벤트의 전개 과정과 인물 간 상호작용을 상세히 기술하세요."
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Event Flow (이벤트 흐름 수직 플로우차트) */}
        <div className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <span className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
            이벤트 흐름
          </span>

          <div className="flex flex-col items-center gap-2 text-xs py-2">
            {/* Step 1: Start */}
            <div className="w-full text-center py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700 shadow-2xs">
              이벤트 시작
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-slate-400" />

            {/* Step 2: Dialogue */}
            <div className="w-full text-center py-2 px-3 rounded-xl bg-sky-50 border border-sky-200 font-semibold text-sky-800 shadow-2xs">
              대화 (아르젠 ↔ 카일)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-slate-400" />

            {/* Step 3: Choice */}
            <div className="w-full text-center py-2 px-3 rounded-xl bg-lavender-50 border border-lavender-200 font-semibold text-lavender-800 shadow-2xs">
              선택지 (태도 결정)
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-slate-400" />

            {/* Step 4: Branch Pills */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="text-center py-2 px-1 rounded-xl bg-emerald-50 border border-emerald-200 font-semibold text-emerald-800 text-[11px] shadow-2xs">
                호의적 반응
              </div>
              <div className="text-center py-2 px-1 rounded-xl bg-amber-50 border border-amber-200 font-semibold text-amber-800 text-[11px] shadow-2xs">
                경계하는 반응
              </div>
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-slate-400" />

            {/* Step 5: End */}
            <div className="w-full text-center py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700 shadow-2xs">
              이벤트 종료
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
