import React from 'react';
import {
  MousePointer,
  Hand,
  MapPin,
  Pentagon,
  Edit2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Undo2,
  Redo2,
  Check,
  Edit3,
  Image as ImageIcon,
  Download,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
} from 'lucide-react';
import { MapSettings } from '../../../../types/mapFactions';

export type MapToolMode =
  | 'select'
  | 'pan'
  | 'add-element'
  | 'draw-boundary'
  | 'edit-boundary'
  | 'delete';

interface MapToolbarProps {
  toolMode: MapToolMode;
  isEditMode: boolean;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  settings: MapSettings;
  isFullscreen: boolean;
  onSetToolMode: (mode: MapToolMode) => void;
  onToggleEditMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenMapImageModal: () => void;
  onToggleSetting: (key: keyof MapSettings) => void;
  onExportImage: () => void;
  onToggleFullscreen: () => void;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  toolMode,
  isEditMode,
  zoom,
  canUndo,
  canRedo,
  settings,
  isFullscreen,
  onSetToolMode,
  onToggleEditMode,
  onZoomIn,
  onZoomOut,
  onResetView,
  onUndo,
  onRedo,
  onOpenMapImageModal,
  onToggleSetting,
  onExportImage,
  onToggleFullscreen,
}) => {
  return (
    <div className="h-12 px-5 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#1E1E27]/95 backdrop-blur-xs transition-colors duration-200 z-20 shadow-2xs">
      {/* Left: Tool Selection (Only active or selectable in Edit Mode) */}
      <div className="flex items-center gap-1.5">
        {isEditMode ? (
          <div className="flex items-center bg-slate-100 dark:bg-[#292936] p-0.5 rounded-xl border border-slate-200/60 dark:border-[#3A3948] gap-0.5">
            <button
              type="button"
              onClick={() => onSetToolMode('select')}
              title="선택 도구 (V) - 요소 및 영역 선택"
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                toolMode === 'select'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">선택</span>
            </button>

            <button
              type="button"
              onClick={() => onSetToolMode('pan')}
              title="지도 이동 도구 (H) - 캔버스 드래그 이동"
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                toolMode === 'pan'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">지도 이동</span>
            </button>

            <button
              type="button"
              onClick={() => onSetToolMode('add-element')}
              title="요소 추가 도구 (E) - 지도 위 클릭하여 국가/지역/세력/장소 마커 배치"
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                toolMode === 'add-element'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">요소 추가</span>
            </button>

            <button
              type="button"
              onClick={() => onSetToolMode('draw-boundary')}
              title="경계선 그리기 도구 (B) - 여러 점을 클릭하여 세력 영토/경계선 다각형 생성"
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                toolMode === 'draw-boundary'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Pentagon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">경계선 그리기</span>
            </button>

            <button
              type="button"
              onClick={() => onSetToolMode('edit-boundary')}
              title="경계선 점 편집 도구 (P) - 완성된 영역의 각 점(Vertex)을 드래그하여 형태 조절"
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                toolMode === 'edit-boundary'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">경계선 점 편집</span>
            </button>

            <button
              type="button"
              onClick={() => onSetToolMode('delete')}
              title="삭제 도구 (D) - 클릭한 마커 또는 영역 즉시 삭제"
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                toolMode === 'delete'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-rose-600'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">삭제</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A5A3B5]">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#292936] font-medium">
              🗺️ 지도 탐색 모드 (드래그하여 이동, 휠로 확대/축소)
            </span>
          </div>
        )}

        {/* Undo / Redo in Edit Mode */}
        {isEditMode && (
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              title="실행 취소 (Ctrl+Z)"
              disabled={!canUndo}
              onClick={onUndo}
              className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="다시 실행 (Ctrl+Y)"
              disabled={!canRedo}
              onClick={onRedo}
              className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Center: View Mode vs Edit Mode Toggle */}
      <div className="flex items-center gap-2">
        {isEditMode ? (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 px-3 py-1 rounded-full text-xs animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="font-bold text-emerald-700 dark:text-emerald-300">편집 모드 활성</span>
            <button
              type="button"
              onClick={onToggleEditMode}
              className="ml-1.5 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] shadow-2xs flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>완료</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 dark:text-[#A5A3B5] font-medium hidden sm:inline">
              읽기 전용 상태
            </span>
            <button
              type="button"
              onClick={onToggleEditMode}
              className="flex items-center gap-1.5 px-3 py-1 bg-lavender-600 hover:bg-lavender-500 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>편집 모드</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Map Image Modal, Display Options, Zoom & Fullscreen */}
      <div className="flex items-center gap-2">
        {/* Map Image Settings */}
        {isEditMode && (
          <button
            type="button"
            onClick={onOpenMapImageModal}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] bg-slate-100 dark:bg-[#292936] hover:bg-slate-200 dark:hover:bg-[#353444] rounded-xl transition-colors"
            title="지도 이미지 업로드 및 교체"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">지도 이미지</span>
          </button>
        )}

        {/* Labels Display Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#292936] p-0.5 rounded-xl border border-slate-200/60 dark:border-[#3A3948]">
          <button
            type="button"
            onClick={() => onToggleSetting('showElementLabels')}
            title={settings.showElementLabels ? '요소 이름 라벨 숨기기' : '요소 이름 라벨 표시'}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              settings.showElementLabels
                ? 'bg-white dark:bg-[#1E1E27] text-lavender-700 dark:text-lavender-300 shadow-2xs'
                : 'text-slate-400 dark:text-[#A5A3B5]'
            }`}
          >
            마커 라벨
          </button>
          <button
            type="button"
            onClick={() => onToggleSetting('showTerritoryLabels')}
            title={settings.showTerritoryLabels ? '영역 이름 라벨 숨기기' : '영역 이름 라벨 표시'}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              settings.showTerritoryLabels
                ? 'bg-white dark:bg-[#1E1E27] text-lavender-700 dark:text-lavender-300 shadow-2xs'
                : 'text-slate-400 dark:text-[#A5A3B5]'
            }`}
          >
            영역 라벨
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-0.5" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={onZoomOut}
            title="축소"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-[#E8E7EF] rounded-md transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-[#A5A3B5] w-9 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            title="확대"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-[#E8E7EF] rounded-md transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetView}
            title="원래 위치로 복원 / 화면 맞춤"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-[#E8E7EF] rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-0.5" />

        {/* Export Image PNG */}
        <button
          type="button"
          onClick={onExportImage}
          title="지도 및 세력도 PNG 저장"
          className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? '전체화면 종료' : '전체화면 전환'}
          className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
