import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Plus,
  Trash2,
  FileText,
  Link as LinkIcon,
  Check,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface UiMarker {
  id: number;
  label: string;
  desc: string;
  x: number;
  y: number;
}

const DEFAULT_UI_DATA = {
  screenName: '메인 UI - 게임 내 HUD',
  screenshotUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
  guidelines: [
    '정보는 간결하게 표시하여 가독성을 높인다.',
    '주요 상호작용(UI)은 우측 하단에 배치해 조작 동선을 최소화한다.',
    '해상도 16:9 기준으로 레이아웃을 구성한다.',
  ],
  markers: [
    { id: 1, label: '플레이어 정보', desc: '체력, 스테미나 등 상태 표시', x: 18, y: 15 },
    { id: 2, label: '날짜 및 시간', desc: '현재 날짜, 요일, 시간 (봄 3일 AM 08:20)', x: 78, y: 14 },
    { id: 3, label: '미니맵', desc: '마을 내 위치와 주요 지점 표시', x: 82, y: 38 },
    { id: 4, label: '퀵슬롯', desc: '자주 사용하는 도구/아이템 등록 슬롯', x: 30, y: 88 },
    { id: 5, label: '메뉴 버튼', desc: '가방, 도감, 설정 등 주요 메뉴', x: 86, y: 88 },
  ],
  linkedDocs: ['인벤토리 UI', '호감도 UI', '메뉴 구조도'],
};

export const GameUiUxEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeScreen, setActiveScreen] = useState('hud');
  const [data, setData] = useState(DEFAULT_UI_DATA);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        setData({ ...DEFAULT_UI_DATA, ...parsed });
        return;
      }
    } catch {}
    setData(DEFAULT_UI_DATA);
  }, [activePage?.id]);

  const persistData = (next: typeof DEFAULT_UI_DATA) => {
    setData(next);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(next));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${data.screenName}-UIUX명세`,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader saveStatus={saveStatus} onExportImage={handleExportImage} />

      {/* Main 3-Column Layout: Left Screen List + Center Canvas + Right Description */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Screen List (화면 목록) */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 px-1">화면 목록</span>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: 'hud', label: '게임 내 HUD' },
                { id: 'main', label: '메인 UI' },
                { id: 'title', label: '타이틀 화면' },
                { id: 'inventory', label: '메뉴 (인벤토리)' },
                { id: 'dialogue', label: '대화 화면' },
                { id: 'affinity', label: '호감도 화면' },
              ].map((s) => {
                const isSelected = activeScreen === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveScreen(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-lavender-50 text-lavender-900 font-bold border border-lavender-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Layout className={`w-3.5 h-3.5 ${isSelected ? 'text-lavender-600' : 'text-slate-400'}`} />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => alert('새 화면 항목이 추가되었습니다.')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-lavender-400 text-slate-500 hover:text-lavender-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>화면 추가</span>
          </button>
        </div>

        {/* Center: UI Screenshot & Markers Canvas (Example Image Style) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#F8FAFD]">
          <div
            ref={printRef}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-soft max-w-3xl w-full p-8 flex flex-col gap-6"
          >
            {/* Title */}
            <div>
              <input
                type="text"
                value={data.screenName}
                onChange={(e) => persistData({ ...data, screenName: e.target.value })}
                className="text-xl font-black text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-none w-full !bg-white"
              />
            </div>

            {/* Screenshot with Number Pins */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 aspect-video shadow-md">
              <img
                src={data.screenshotUrl}
                alt="UI Screenshot"
                className="w-full h-full object-cover opacity-90"
              />

              {/* Number Markers */}
              {data.markers.map((m) => (
                <div
                  key={m.id}
                  style={{ top: `${m.y}%`, left: `${m.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-lavender-600 border-2 border-white text-white font-black text-xs flex items-center justify-center shadow-lg hover:scale-125 transition-transform cursor-pointer"
                  title={`${m.id}. ${m.label}`}
                >
                  {m.id}
                </div>
              ))}
            </div>

            {/* Screen Guidelines (화면 구성 및 유의사항) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700">화면 구성 및 유의사항</span>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-xs text-slate-700">
                {data.guidelines.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-lavender-600 font-bold">✓</span>
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: UI Explanations & Linked Docs (UI 설명 & 연관 문서) */}
        <div className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col gap-6 shrink-0 overflow-y-auto">
          {/* UI Explanations */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
              UI 설명
            </span>
            <div className="flex flex-col gap-3 text-xs">
              {data.markers.map((m) => (
                <div key={m.id} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-lavender-100 text-lavender-700 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {m.id}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800">{m.label}</span>
                    <span className="text-[11px] text-slate-500 leading-snug">{m.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked Documents (연관 문서) */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800">연관 문서</span>
            <div className="flex flex-col gap-1.5">
              {data.linkedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-lavender-50/70 border border-lavender-200 text-lavender-800 text-xs font-semibold hover:bg-lavender-100 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-lavender-600" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
