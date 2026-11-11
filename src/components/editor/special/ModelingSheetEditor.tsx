import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Plus,
  Image as ImageIcon,
  Check,
  Undo2,
  Redo2,
  MousePointer2,
  Hand,
  Type,
  Grid,
  Maximize2,
  ChevronDown,
  Download,
  Box,
  Tag,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface ViewSettings {
  front: boolean;
  side: boolean;
  back: boolean;
  threeQuarter: boolean;
  wireframe: boolean;
}

export const ModelingSheetEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { customPrompt, success } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [activeSheet, setActiveSheet] = useState('protagonist');
  const [sheets, setSheets] = useState([
    { id: 'protagonist', name: '주인공' },
    { id: 'npc', name: 'NPC' },
    { id: 'building', name: '건물' },
    { id: 'object', name: '오브젝트' },
    { id: 'misc', name: '기타' },
  ]);

  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    front: true,
    side: true,
    back: true,
    threeQuarter: false,
    wireframe: false,
  });

  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.viewSettings) setViewSettings(parsed.viewSettings);
        if (parsed.sheets) setSheets(parsed.sheets);
        return;
      }
    } catch {}
  }, [activePage?.id]);

  const persistData = (newViews: ViewSettings, newSheets = sheets) => {
    setViewSettings(newViews);
    setSheets(newSheets);
    if (!activePage) return;
    updatePageContent(
      activePage.id,
      JSON.stringify({ viewSettings: newViews, sheets: newSheets })
    );
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-모델링시트`,
    });
  };

  const handleAddSheet = async () => {
    const name = await customPrompt({
      title: '새 시트 추가',
      message: '생성할 모델링 시트의 이름을 입력하세요:',
      placeholder: '예: 무기/도구, 보스 몬스터',
      confirmText: '추가',
    });
    if (!name?.trim()) return;
    const newSheet = { id: `sheet-${Date.now()}`, name: name.trim() };
    const nextSheets = [...sheets, newSheet];
    persistData(viewSettings, nextSheets);
    setActiveSheet(newSheet.id);
    success('시트 추가됨', `'${name.trim()}' 시트가 추가되었습니다.`);
  };

  const toggleView = (key: keyof ViewSettings) => {
    persistData({ ...viewSettings, [key]: !viewSettings[key] });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] dark:bg-[#17171D] relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
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
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="이미지 추가"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="그리드 토글"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Grid className="w-4 h-4" />
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

      {/* Main 2-Column: Left Sidebar + Center Modeling Canvas & Detail Cuts */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Sheet List + View Settings */}
        <div className="w-48 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-6">
            {/* Sheet List */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                시트 목록
              </span>
              <div className="flex flex-col gap-1 text-xs">
                {sheets.map((s) => {
                  const isActive = activeSheet === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSheet(s.id)}
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
                      <span className="truncate">{s.name}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddSheet}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-lavender-600 hover:bg-lavender-50 rounded-xl transition-colors mt-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>시트 추가</span>
                </button>
              </div>
            </div>

            {/* View Settings */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                뷰 설정
              </span>
              <div className="flex flex-col gap-2 text-xs">
                {[
                  { key: 'front' as const, label: '정면' },
                  { key: 'side' as const, label: '측면' },
                  { key: 'back' as const, label: '후면' },
                  { key: 'threeQuarter' as const, label: '3/4' },
                  { key: 'wireframe' as const, label: '와이어프레임' },
                ].map(({ key, label }) => {
                  const isChecked = viewSettings[key];
                  return (
                    <label
                      key={key}
                      onClick={() => toggleView(key)}
                      className="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-lavender-700 transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-lavender-500 border-lavender-500 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Center Main Stage + Right Detail Panel */}
        <div
          ref={printRef}
          className="flex-1 bg-white overflow-auto p-6 flex flex-col gap-5"
        >
          {/* Header Title + Tags */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">
              주인공 모델링 시트
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                캐릭터
              </span>
              <span className="px-2.5 py-1 bg-lavender-100 text-lavender-700 rounded-lg text-xs font-semibold">
                3D
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                게임용
              </span>
            </div>
          </div>

          {/* 2-Columns Content Area: Left 4-Views & Wireframe / Right Detail Cuts */}
          <div className="flex gap-6 min-h-[500px]">
            {/* Left Main 4-View Area */}
            <div className="flex-1 flex flex-col gap-5">
              {/* Top: 4-View Color Illustrations */}
              <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-around min-h-[260px] relative overflow-hidden">
                {/* 4 Multi-view figures */}
                <div className="flex items-end justify-around w-full gap-4">
                  {/* Front View */}
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400&auto=format&fit=crop"
                      alt="Front View"
                      className="h-56 w-28 object-contain drop-shadow-sm filter rounded-lg"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">
                      정면 (Front)
                    </span>
                  </div>

                  {/* 3/4 View */}
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400&auto=format&fit=crop"
                      alt="3/4 View"
                      className="h-56 w-28 object-contain drop-shadow-sm filter rounded-lg scale-x-[-1]"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">
                      3/4 측면
                    </span>
                  </div>

                  {/* Side View */}
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400&auto=format&fit=crop"
                      alt="Side View"
                      className="h-56 w-24 object-contain drop-shadow-sm filter rounded-lg"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">
                      측면 (Side)
                    </span>
                  </div>

                  {/* Back View */}
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src="https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400&auto=format&fit=crop"
                      alt="Back View"
                      className="h-56 w-28 object-contain drop-shadow-sm filter rounded-lg brightness-95"
                    />
                    <span className="text-[11px] font-semibold text-slate-500">
                      후면 (Back)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom: 3D Wireframe 4-Views on Blueprint Grid */}
              <div
                className="bg-[#F8F9FE] border border-lavender-200 rounded-2xl p-4 flex items-center justify-around min-h-[170px] relative"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                {/* 4 Wireframe figures */}
                <div className="flex items-end justify-around w-full gap-4 opacity-75">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-32 w-20 border border-lavender-300 rounded-lg flex items-center justify-center bg-white/60 text-lavender-400 font-mono text-[10px]">
                      T-Pose Front
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Wireframe
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-32 w-20 border border-lavender-300 rounded-lg flex items-center justify-center bg-white/60 text-lavender-400 font-mono text-[10px]">
                      3/4 Side
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Wireframe
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-32 w-16 border border-lavender-300 rounded-lg flex items-center justify-center bg-white/60 text-lavender-400 font-mono text-[10px]">
                      Side View
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Wireframe
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-32 w-20 border border-lavender-300 rounded-lg flex items-center justify-center bg-white/60 text-lavender-400 font-mono text-[10px]">
                      Back View
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Wireframe
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detail Cuts & UV Map Grid */}
            <div className="w-64 flex flex-col gap-3 shrink-0">
              {/* Top Face Close-up & Eye */}
              <div className="flex gap-2">
                <div className="flex-1 h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop"
                    alt="Face Close-up"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-medium">
                    Face
                  </span>
                </div>
                <div className="w-20 h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
                    alt="Eye Detail"
                    className="w-full h-full object-cover object-top"
                  />
                  <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-medium">
                    Eye
                  </span>
                </div>
              </div>

              {/* Mid Bag & Accessory Detail cuts */}
              <div className="grid grid-cols-2 gap-2">
                <div className="h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                  <img
                    src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=200&auto=format&fit=crop"
                    alt="Bag"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-white rounded text-[8.5px]">
                    가방
                  </span>
                </div>
                <div className="h-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                  <img
                    src="https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=200&auto=format&fit=crop"
                    alt="Cloak"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-white rounded text-[8.5px]">
                    망토
                  </span>
                </div>
              </div>

              {/* Bottom UV Map Texture Grid (6 tiles) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>UV 텍스처 맵</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    2048 x 2048
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-white border border-slate-200/80 rounded-lg flex items-center justify-center font-mono text-[9px] text-slate-400 hover:border-lavender-400 transition-colors"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #F1F5F9 25%, transparent 25%), linear-gradient(-45deg, #F1F5F9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #F1F5F9 75%), linear-gradient(-45deg, transparent 75%, #F1F5F9 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                      }}
                    >
                      UV_{idx}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

