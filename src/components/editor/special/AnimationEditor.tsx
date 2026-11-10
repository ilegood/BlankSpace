import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Brush,
  BoxSelect,
  Type,
  Image as ImageIcon,
  Table as TableIcon,
  Download,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface MotionInfo {
  name: string;
  frameCount: number;
  fps: number;
  isLoop: boolean;
  notes: string[];
}

const DEFAULT_MOTION_INFO: MotionInfo = {
  name: '걷기 (Walk)',
  frameCount: 8,
  fps: 8,
  isLoop: true,
  notes: [
    '기본 이동 애니메이션',
    '8프레임 루프',
    '좌우 반전으로 방향 전환 가능',
    '1, 5프레임에 발 착지 강조',
  ],
};

// 8 Walk Cycle SVG Character Frames for Pixel / SD style
const PixelCharFrame: React.FC<{ frameIndex: number; size?: number }> = ({
  frameIndex,
  size = 72,
}) => {
  // Variations for a lively 8-frame walk animation
  // frame 0: contact, 1: recoil, 2: passing, 3: high-point, 4: contact(other foot), 5: recoil, 6: passing, 7: high-point
  const bobY = [0, 2, 0, -3, 0, 2, 0, -3][frameIndex % 8];
  const legLeft = [-10, -5, 0, 6, 10, 5, 0, -6][frameIndex % 8];
  const legRight = [10, 5, 0, -6, -10, -5, 0, 6][frameIndex % 8];
  const armLeft = [8, 4, 0, -5, -8, -4, 0, 5][frameIndex % 8];
  const armRight = [-8, -4, 0, 5, 8, 4, 0, -5][frameIndex % 8];

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center select-none"
    >
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full drop-shadow-xs"
        style={{ transform: `translateY(${bobY}px)` }}
      >
        {/* Shadow */}
        <ellipse cx="32" cy="58" rx="14" ry="4" fill="#94A3B8" opacity="0.4" />

        {/* Cape Back */}
        <path d="M22 28 Q32 38 42 28 L40 46 Q32 50 24 46 Z" fill="#6B46C1" />

        {/* Legs / Feet */}
        {/* Left Leg */}
        <rect
          x={25 + legLeft * 0.4}
          y="42"
          width="5"
          height="12"
          rx="2"
          fill="#334155"
        />
        <rect
          x={24 + legLeft * 0.5}
          y="52"
          width="7"
          height="4"
          rx="1.5"
          fill="#475569"
        />

        {/* Right Leg */}
        <rect
          x={34 + legRight * 0.4}
          y="42"
          width="5"
          height="12"
          rx="2"
          fill="#1E293B"
        />
        <rect
          x={33 + legRight * 0.5}
          y="52"
          width="7"
          height="4"
          rx="1.5"
          fill="#334155"
        />

        {/* Body Tunic */}
        <path
          d="M24 28 C24 25, 40 25, 40 28 L39 44 C39 44, 25 44, 25 44 Z"
          fill="#EDE9FE"
        />
        {/* Belt */}
        <rect x="25" y="38" width="14" height="3" fill="#8B5CF6" />
        <rect x="30" y="38" width="4" height="3" fill="#FCD34D" />

        {/* Arm Back */}
        <rect
          x={20 + armLeft * 0.3}
          y="30"
          width="4"
          height="10"
          rx="2"
          fill="#DDD6FE"
        />

        {/* Head */}
        <circle cx="32" cy="20" r="10" fill="#FFE4E6" />

        {/* Eyes (Purple) */}
        <ellipse cx="29" cy="20" rx="1.5" ry="2.2" fill="#7C3AED" />
        <ellipse cx="35" cy="20" rx="1.5" ry="2.2" fill="#7C3AED" />
        <circle cx="28.5" cy="19" r="0.6" fill="#FFFFFF" />
        <circle cx="34.5" cy="19" r="0.6" fill="#FFFFFF" />

        {/* Silver Hair */}
        <path
          d="M20 18 C20 10, 44 10, 44 18 C44 16, 42 12, 38 12 C35 12, 34 14, 32 14 C30 14, 29 12, 26 12 C22 12, 20 16, 20 18 Z"
          fill="#E2E8F0"
        />
        {/* Hair Bangs */}
        <polygon points="23,17 26,22 28,17" fill="#E2E8F0" />
        <polygon points="28,17 32,23 35,17" fill="#E2E8F0" />
        <polygon points="35,17 38,22 41,17" fill="#CBD5E1" />

        {/* Arm Front */}
        <rect
          x={40 + armRight * 0.3}
          y="30"
          width="4"
          height="10"
          rx="2"
          fill="#DDD6FE"
        />
        <circle
          cx={42 + armRight * 0.3}
          cy="40"
          r="2.5"
          fill="#FFE4E6"
        />
      </svg>
    </div>
  );
};

export const AnimationEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeSheet, setActiveSheet] = useState('basic');
  const [sheets, setSheets] = useState([
    { id: 'basic', name: '기본 동작' },
    { id: 'combat', name: '전투 동작' },
    { id: 'interact', name: '상호작용' },
    { id: 'emotion', name: '표정 / 감정' },
    { id: 'misc', name: '기타' },
  ]);

  const [motionInfo, setMotionInfo] = useState<MotionInfo>(DEFAULT_MOTION_INFO);
  const [selectedFrame, setSelectedFrame] = useState<number>(3); // 4th frame (index 3) selected by default as in example
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animIndex, setAnimIndex] = useState<number>(0);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.motionInfo) setMotionInfo(parsed.motionInfo);
        if (parsed.sheets) setSheets(parsed.sheets);
        return;
      }
    } catch {}
  }, [activePage?.id]);

  const persistData = (newMotion: MotionInfo, newSheets = sheets) => {
    setMotionInfo(newMotion);
    setSheets(newSheets);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(
      activePage.id,
      JSON.stringify({ motionInfo: newMotion, sheets: newSheets })
    );
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = 1000 / motionInfo.fps;
    const timer = setInterval(() => {
      setAnimIndex((prev) => (prev + 1) % motionInfo.frameCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, motionInfo.fps, motionInfo.frameCount]);

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-애니메이션시트`,
    });
  };

  const handleAddSheet = () => {
    const name = prompt('새 시트 이름을 입력하세요:');
    if (!name?.trim()) return;
    const newSheet = { id: `sheet-${Date.now()}`, name: name.trim() };
    const nextSheets = [...sheets, newSheet];
    persistData(motionInfo, nextSheets);
    setActiveSheet(newSheet.id);
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
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="다시 실행"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1.5" />

          <button
            type="button"
            title="브러시"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Brush className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="영역 선택"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <BoxSelect className="w-4 h-4" />
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
            title="표"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right Play Status & Image Save Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-lavender-600 fill-lavender-600" />
            ) : (
              <Play className="w-3.5 h-3.5 text-lavender-600 fill-lavender-600" />
            )}
            <span>재생 ({motionInfo.fps} fps)</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
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

      {/* Main 2-Column: Left Sidebar + Center Animation Studio */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Sheet List + Frame Settings */}
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

            {/* Frame Settings */}
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                프레임 설정
              </span>
              <div className="flex flex-col gap-3 text-xs">
                {/* Frame count */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">프레임 수</span>
                  <select
                    value={motionInfo.frameCount}
                    onChange={(e) =>
                      persistData({
                        ...motionInfo,
                        frameCount: Number(e.target.value),
                      })
                    }
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-lavender-500 !bg-white"
                  >
                    {[4, 6, 8, 12, 16].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FPS */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">재생 속도</span>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {motionInfo.fps} fps
                  </span>
                </div>

                {/* Loop */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">루프 재생</span>
                  <button
                    type="button"
                    onClick={() =>
                      persistData({
                        ...motionInfo,
                        isLoop: !motionInfo.isLoop,
                      })
                    }
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      motionInfo.isLoop ? 'bg-lavender-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        motionInfo.isLoop ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Main Studio */}
        <div
          ref={printRef}
          className="flex-1 bg-white overflow-auto p-6 flex flex-col gap-6"
        >
          {/* Header Title */}
          <div>
            <h2 className="text-base font-bold text-slate-800">
              기본 동작 - {motionInfo.name}
            </h2>
          </div>

          {/* 8-Frame Sequence Strip (Matched to Example Image) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="grid grid-cols-8 gap-3">
              {Array.from({ length: motionInfo.frameCount }).map((_, idx) => {
                const isSelected = selectedFrame === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedFrame(idx);
                      setAnimIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex flex-col items-center gap-2 p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-lavender-500 bg-lavender-50/80 shadow-xs ring-2 ring-lavender-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold ${
                        isSelected ? 'text-lavender-700' : 'text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="w-16 h-16 flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden">
                      <PixelCharFrame frameIndex={idx} size={54} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom 3-Column Layout: Left Preview / Center Info / Right Notes */}
          <div className="grid grid-cols-12 gap-6 min-h-[220px]">
            {/* 1. Playback Preview Box (Cols 4) */}
            <div className="col-span-4 border border-slate-200 rounded-2xl p-4 bg-white flex flex-col items-center justify-between">
              {/* Checkered Canvas */}
              <div
                className="w-full h-44 rounded-xl flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #F8FAFC 25%, transparent 25%), linear-gradient(-45deg, #F8FAFC 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #F8FAFC 75%), linear-gradient(-45deg, transparent 75%, #F8FAFC 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <PixelCharFrame
                  frameIndex={isPlaying ? animIndex : selectedFrame}
                  size={100}
                />
              </div>

              {/* Playback Controls (|<  <  8/8  >  >|) */}
              <div className="flex items-center justify-center gap-3 pt-3 w-full border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFrame(0);
                    setAnimIndex(0);
                    setIsPlaying(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prev =
                      (animIndex - 1 + motionInfo.frameCount) %
                      motionInfo.frameCount;
                    setSelectedFrame(prev);
                    setAnimIndex(prev);
                    setIsPlaying(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md font-mono">
                  {(isPlaying ? animIndex : selectedFrame) + 1} /{' '}
                  {motionInfo.frameCount}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const next = (animIndex + 1) % motionInfo.frameCount;
                    setSelectedFrame(next);
                    setAnimIndex(next);
                    setIsPlaying(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const last = motionInfo.frameCount - 1;
                    setSelectedFrame(last);
                    setAnimIndex(last);
                    setIsPlaying(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Motion Information Table (Cols 4) */}
            <div className="col-span-4 border border-slate-200 rounded-2xl p-4 bg-white flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                동작 정보
              </h3>
              <div className="flex flex-col divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">동작명</span>
                  <span className="font-bold text-slate-800">
                    {motionInfo.name}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">프레임 수</span>
                  <span className="font-semibold text-slate-700">
                    {motionInfo.frameCount}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">재생 속도</span>
                  <span className="font-semibold text-slate-700">
                    {motionInfo.fps} fps
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">루프 여부</span>
                  <span className="font-bold text-lavender-600">
                    {motionInfo.isLoop ? 'O' : 'X'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Notes Card (Cols 4) */}
            <div className="col-span-4 border border-slate-200 rounded-2xl p-4 bg-white flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                메모
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                {motionInfo.notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-700">
                    <Check className="w-3.5 h-3.5 text-lavender-500 shrink-0 mt-0.5 stroke-[3]" />
                    <span className="leading-snug">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
