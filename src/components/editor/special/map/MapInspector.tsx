import React, { useState } from 'react';
import {
  MapElement,
  TerritoryPolygon,
  MapElementType,
} from '../../../../types/mapFactions';
import { useWorkspace } from '../../../../store/WorkspaceContext';
import { LinkDocumentModal } from '../worldSheet/LinkDocumentModal';
import {
  Flag,
  Shield,
  MapPin,
  Compass,
  Pentagon,
  FileText,
  ExternalLink,
  Trash2,
  X,
  Palette,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface MapInspectorProps {
  selectedElement: MapElement | null;
  selectedTerritory: TerritoryPolygon | null;
  allElements: MapElement[];
  isEditMode: boolean;
  onUpdateElement: (id: string, updates: Partial<MapElement>) => void;
  onDeleteElement: (id: string) => void;
  onUpdateTerritory: (id: string, updates: Partial<TerritoryPolygon>) => void;
  onDeleteTerritory: (id: string) => void;
  onClose: () => void;
}

export const MapInspector: React.FC<MapInspectorProps> = ({
  selectedElement,
  selectedTerritory,
  allElements,
  isEditMode,
  onUpdateElement,
  onDeleteElement,
  onUpdateTerritory,
  onDeleteTerritory,
  onClose,
}) => {
  const { documents, setActiveDocument } = useWorkspace();
  const { customConfirm, toast } = useToast();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Helper for document navigation
  const handleNavigateToDoc = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) {
      toast.warning('해당 문서가 삭제되었거나 존재하지 않습니다.');
      return;
    }
    setActiveDocument(docId);
  };

  const factionElements = allElements.filter((e) => e.type === 'faction' || e.type === 'country');

  // If nothing is selected
  if (!selectedElement && !selectedTerritory) {
    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-[#ECEEF3] dark:border-[#3A3948] p-6 flex flex-col items-center justify-center text-center shrink-0 select-none transition-colors duration-200">
        <div className="w-12 h-12 rounded-2xl bg-lavender-50 dark:bg-[#352E58] text-lavender-500 dark:text-lavender-400 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="text-xs font-bold text-slate-700 dark:text-[#E8E7EF]">선택된 대상 없음</h4>
        <p className="text-[11px] text-slate-400 dark:text-[#A5A3B5] mt-1 leading-relaxed max-w-[200px]">
          지도 위의 마커나 세력 영토를 클릭하면 상세 정보와 설정 옵션이 표시됩니다.
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // CASE 1: 지도 요소(Marker)가 선택된 경우
  // ------------------------------------------------------------------
  if (selectedElement) {
    const linkedDoc = documents.find((d) => d.id === selectedElement.targetDocId);

    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-[#ECEEF3] dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#252532] shrink-0">
              {selectedElement.type === 'country' && <Flag className="w-4 h-4 text-rose-500" />}
              {selectedElement.type === 'faction' && <Shield className="w-4 h-4 text-purple-500" />}
              {selectedElement.type === 'region' && <MapPin className="w-4 h-4 text-emerald-500" />}
              {selectedElement.type === 'location' && <Compass className="w-4 h-4 text-blue-500" />}
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                {selectedElement.name}
              </h3>
              <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5]">지도 요소 상세 정보</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Element Image */}
          {selectedElement.imageUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] relative">
              <img
                src={selectedElement.imageUrl}
                alt={selectedElement.name}
                className="w-full h-full object-cover"
              />
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => onUpdateElement(selectedElement.id, { imageUrl: undefined })}
                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-md transition-colors"
                  title="이미지 제거"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : isEditMode ? (
            <div className="p-3 border border-dashed border-slate-200 dark:border-[#3A3948] rounded-xl text-center">
              <input
                type="text"
                placeholder="대표 이미지 URL 입력..."
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    onUpdateElement(selectedElement.id, { imageUrl: e.target.value.trim() });
                  }
                }}
                className="w-full text-xs p-1.5 bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-lg text-slate-800 dark:text-[#E8E7EF]"
              />
            </div>
          ) : null}

          {/* Name & Type */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
              요소 이름
            </label>
            {isEditMode ? (
              <input
                type="text"
                value={selectedElement.name}
                onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
                className="w-full px-3 py-1.5 font-bold text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
              />
            ) : (
              <div className="font-bold text-slate-800 dark:text-[#E8E7EF] px-1">
                {selectedElement.name}
              </div>
            )}
          </div>

          {/* Type Selector */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
              요소 유형
            </label>
            {isEditMode ? (
              <select
                value={selectedElement.type}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { type: e.target.value as MapElementType })
                }
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl text-slate-800 dark:text-[#E8E7EF]"
              >
                <option value="country">국가 (Country)</option>
                <option value="faction">세력 / 조직 (Faction)</option>
                <option value="region">지역 (Region)</option>
                <option value="location">장소 / 거점 (Location)</option>
              </select>
            ) : (
              <div className="px-1 text-slate-600 dark:text-[#A5A3B5] font-semibold">
                {selectedElement.type === 'country' && '국가'}
                {selectedElement.type === 'faction' && '세력 / 조직'}
                {selectedElement.type === 'region' && '지역'}
                {selectedElement.type === 'location' && '장소 / 거점'}
              </div>
            )}
          </div>

          {/* Marker Size */}
          {isEditMode && (
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
                마커 크기
              </label>
              <div className="flex items-center gap-1.5">
                {(['sm', 'md', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => onUpdateElement(selectedElement.id, { size: sz })}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      (selectedElement.size || 'md') === sz
                        ? 'bg-lavender-50 dark:bg-[#352E58] border-lavender-400 text-lavender-700 dark:text-lavender-300'
                        : 'bg-white dark:bg-[#252532] border-slate-200 dark:border-[#3A3948] text-slate-500'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
              간단한 설명
            </label>
            {isEditMode ? (
              <textarea
                value={selectedElement.description}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, { description: e.target.value })
                }
                rows={3}
                placeholder="해당 요소에 대한 배경 설명을 입력하세요..."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF] resize-none"
              />
            ) : (
              <p className="text-slate-600 dark:text-[#A5A3B5] leading-relaxed break-words px-1">
                {selectedElement.description || '작성된 설명이 없습니다.'}
              </p>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
              추가 기획 메모
            </label>
            {isEditMode ? (
              <textarea
                value={selectedElement.memo || ''}
                onChange={(e) => onUpdateElement(selectedElement.id, { memo: e.target.value })}
                rows={2}
                placeholder="미확정 아이디어 또는 설정 메모..."
                className="w-full p-2 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF] resize-none"
              />
            ) : selectedElement.memo ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 text-[11.5px] text-amber-900 dark:text-amber-200 break-words">
                {selectedElement.memo}
              </div>
            ) : null}
          </div>

          {/* Linked Blankspace Document */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase block">
              관련 설정 문서 연결
            </label>
            {selectedElement.targetDocId ? (
              <div className="p-2.5 rounded-xl bg-lavender-50/80 dark:bg-[#352E58]/40 border border-lavender-200 dark:border-lavender-700/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleNavigateToDoc(selectedElement.targetDocId!)}
                  className="flex items-center gap-2 text-left group min-w-0 flex-1"
                >
                  <FileText className="w-4 h-4 text-lavender-600 dark:text-lavender-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-[#E8E7EF] group-hover:text-lavender-600 truncate">
                    {linkedDoc?.title || selectedElement.targetDocTitle || '연결된 문서'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-lavender-600 shrink-0" />
                </button>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        targetDocId: undefined,
                        targetDocTitle: undefined,
                      })
                    }
                    className="p-1 text-slate-400 hover:text-rose-500 ml-1 shrink-0"
                    title="연결 해제"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 dark:text-[#A5A3B5] py-1">
                연결된 설정 문서가 없습니다.
              </div>
            )}

            {isEditMode && (
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="w-full py-1.5 px-3 bg-slate-100 dark:bg-[#252532] hover:bg-slate-200 text-slate-700 dark:text-[#E8E7EF] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{selectedElement.targetDocId ? '연결 문서 변경' : '설정 문서 연결하기'}</span>
              </button>
            )}
          </div>

          {/* Delete Button */}
          {isEditMode && (
            <div className="pt-3 border-t border-slate-100 dark:border-[#3A3948]">
              <button
                type="button"
                onClick={async () => {
                  const ok = await customConfirm({
                    title: '요소 삭제',
                    message: `'${selectedElement.name}' 요소를 지도에서 삭제하시겠습니까?`,
                    confirmText: '삭제',
                    isDanger: true,
                  });
                  if (ok) onDeleteElement(selectedElement.id);
                }}
                className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>요소 삭제</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        <LinkDocumentModal
          isOpen={isLinkModalOpen}
          selectedDocIds={selectedElement.targetDocId ? [selectedElement.targetDocId] : []}
          isMultiSelect={false}
          title="지도 요소와 연결할 문서 선택"
          onSelect={(ids) => {
            const docId = ids[0];
            const doc = documents.find((d) => d.id === docId);
            onUpdateElement(selectedElement.id, {
              targetDocId: docId,
              targetDocTitle: doc?.title,
            });
            toast.success('관련 문서가 연결되었습니다.');
          }}
          onClose={() => setIsLinkModalOpen(false)}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // CASE 2: 세력 영토 경계선(Territory Polygon)이 선택된 경우
  // ------------------------------------------------------------------
  if (selectedTerritory) {
    const linkedDoc = documents.find((d) => d.id === selectedTerritory.targetDocId);

    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-[#ECEEF3] dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              style={{
                backgroundColor: selectedTerritory.fillColor,
                borderColor: selectedTerritory.strokeColor,
              }}
              className="w-5 h-5 rounded-md border shrink-0 opacity-80"
            />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                {selectedTerritory.name}
              </h3>
              <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5]">
                세력 영토 경계선 ({selectedTerritory.points.length}개 점)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Territory Name */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
              영역 이름
            </label>
            {isEditMode ? (
              <input
                type="text"
                value={selectedTerritory.name}
                onChange={(e) => onUpdateTerritory(selectedTerritory.id, { name: e.target.value })}
                className="w-full px-3 py-1.5 font-bold text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
              />
            ) : (
              <div className="font-bold text-slate-800 dark:text-[#E8E7EF] px-1">
                {selectedTerritory.name}
              </div>
            )}
          </div>

          {/* Faction Mapping */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
              소속 세력 / 국가
            </label>
            {isEditMode ? (
              <select
                value={selectedTerritory.factionId || ''}
                onChange={(e) => {
                  const targetElem = allElements.find((elem) => elem.id === e.target.value);
                  onUpdateTerritory(selectedTerritory.id, {
                    factionId: e.target.value || undefined,
                    factionName: targetElem?.name || undefined,
                  });
                }}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl text-slate-800 dark:text-[#E8E7EF]"
              >
                <option value="">소속 세력 없음 (중립/자연 영역)</option>
                {factionElements.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.type === 'country' ? '국가' : '세력'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-1 font-semibold text-slate-700 dark:text-[#E8E7EF]">
                {selectedTerritory.factionName || '소속 세력 없음'}
              </div>
            )}
          </div>

          {/* Color & Border Styling */}
          {isEditMode && (
            <div className="p-3 bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl space-y-3">
              <div className="font-bold text-[11px] text-slate-700 dark:text-[#E8E7EF] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-lavender-500" />
                <span>영역 및 경계선 디자인</span>
              </div>

              {/* Stroke Color */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">경계선 색상</span>
                <input
                  type="color"
                  value={selectedTerritory.strokeColor}
                  onChange={(e) =>
                    onUpdateTerritory(selectedTerritory.id, { strokeColor: e.target.value })
                  }
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                />
              </div>

              {/* Fill Color */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">내부 채우기 색상</span>
                <input
                  type="color"
                  value={selectedTerritory.fillColor}
                  onChange={(e) =>
                    onUpdateTerritory(selectedTerritory.id, { fillColor: e.target.value })
                  }
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                />
              </div>

              {/* Fill Opacity Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A5A3B5]">
                  <span>내부 투명도</span>
                  <span className="font-mono font-bold">
                    {Math.round(selectedTerritory.fillOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedTerritory.fillOpacity}
                  onChange={(e) =>
                    onUpdateTerritory(selectedTerritory.id, {
                      fillOpacity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-lavender-600 cursor-pointer"
                />
              </div>

              {/* Stroke Style */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">선 스타일</span>
                <select
                  value={selectedTerritory.strokeStyle || 'solid'}
                  onChange={(e) =>
                    onUpdateTerritory(selectedTerritory.id, {
                      strokeStyle: e.target.value as any,
                    })
                  }
                  className="px-2 py-1 text-xs bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-lg"
                >
                  <option value="solid">실선 (Solid)</option>
                  <option value="dashed">점선 (Dashed)</option>
                  <option value="dotted">점 (Dotted)</option>
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase">
              영역 설명
            </label>
            {isEditMode ? (
              <textarea
                value={selectedTerritory.description || ''}
                onChange={(e) =>
                  onUpdateTerritory(selectedTerritory.id, { description: e.target.value })
                }
                rows={3}
                placeholder="영토의 역사, 영유권 분쟁, 조약 내용 등을 기록하세요..."
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF] resize-none"
              />
            ) : (
              <p className="text-slate-600 dark:text-[#A5A3B5] leading-relaxed break-words px-1">
                {selectedTerritory.description || '작성된 설명이 없습니다.'}
              </p>
            )}
          </div>

          {/* Linked Document */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
            <label className="text-[10.5px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase block">
              관련 설정 문서 연결
            </label>
            {selectedTerritory.targetDocId ? (
              <div className="p-2.5 rounded-xl bg-lavender-50/80 dark:bg-[#352E58]/40 border border-lavender-200 dark:border-lavender-700/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleNavigateToDoc(selectedTerritory.targetDocId!)}
                  className="flex items-center gap-2 text-left group min-w-0 flex-1"
                >
                  <FileText className="w-4 h-4 text-lavender-600 dark:text-lavender-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-[#E8E7EF] group-hover:text-lavender-600 truncate">
                    {linkedDoc?.title || selectedTerritory.targetDocTitle || '연결된 문서'}
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-lavender-600 shrink-0" />
                </button>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTerritory(selectedTerritory.id, {
                        targetDocId: undefined,
                        targetDocTitle: undefined,
                      })
                    }
                    className="p-1 text-slate-400 hover:text-rose-500 ml-1 shrink-0"
                    title="연결 해제"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 dark:text-[#A5A3B5] py-1">
                연결된 설정 문서가 없습니다.
              </div>
            )}

            {isEditMode && (
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(true)}
                className="w-full py-1.5 px-3 bg-slate-100 dark:bg-[#252532] hover:bg-slate-200 text-slate-700 dark:text-[#E8E7EF] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{selectedTerritory.targetDocId ? '연결 문서 변경' : '설정 문서 연결하기'}</span>
              </button>
            )}
          </div>

          {/* Delete Button */}
          {isEditMode && (
            <div className="pt-3 border-t border-slate-100 dark:border-[#3A3948]">
              <button
                type="button"
                onClick={async () => {
                  const ok = await customConfirm({
                    title: '영역 삭제',
                    message: `'${selectedTerritory.name}' 영역을 삭제하시겠습니까?`,
                    confirmText: '삭제',
                    isDanger: true,
                  });
                  if (ok) onDeleteTerritory(selectedTerritory.id);
                }}
                className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>영역 삭제</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        <LinkDocumentModal
          isOpen={isLinkModalOpen}
          selectedDocIds={selectedTerritory.targetDocId ? [selectedTerritory.targetDocId] : []}
          isMultiSelect={false}
          title="세력 영역과 연결할 문서 선택"
          onSelect={(ids) => {
            const docId = ids[0];
            const doc = documents.find((d) => d.id === docId);
            onUpdateTerritory(selectedTerritory.id, {
              targetDocId: docId,
              targetDocTitle: doc?.title,
            });
            toast.success('관련 문서가 연결되었습니다.');
          }}
          onClose={() => setIsLinkModalOpen(false)}
        />
      </div>
    );
  }

  return null;
};

