import React, { useState, useRef } from 'react';
import {
  RelationCharacter,
  RelationItem,
  RelationLegendItem,
  CharacterRelationsDocData,
  LineStyle,
  DEFAULT_RELATION_LEGENDS,
} from '../../../../types/relations';
import {
  ArrowRight,
  ArrowLeftRight,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  GitCommit,
  Check,
  Upload,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface RelationInspectorProps {
  selectedRelation: RelationItem | null;
  selectedCharacter: RelationCharacter | null;
  characters: RelationCharacter[];
  relations: RelationItem[];
  legends?: RelationLegendItem[];
  legendSettings?: CharacterRelationsDocData['legendSettings'];
  isEditMode: boolean;
  onUpdateRelation: (id: string, updates: Partial<RelationItem>) => void;
  onDeleteRelation: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<RelationCharacter>) => void;
  onDeleteCharacter: (id: string) => void;
  onUpdateLegend?: (id: string, updates: Partial<RelationLegendItem>) => void;
  onAddLegend?: (newLegend: RelationLegendItem) => void;
  onDeleteLegend?: (id: string) => void;
  onUpdateLegendSettings?: (
    settings: Partial<NonNullable<CharacterRelationsDocData['legendSettings']>>
  ) => void;
  onSelectRelation: (id: string | null) => void;
  onSelectCharacter: (id: string | null) => void;
}

export const RelationInspector: React.FC<RelationInspectorProps> = ({
  selectedRelation,
  selectedCharacter,
  characters,
  relations,
  legends = DEFAULT_RELATION_LEGENDS,
  legendSettings = { visible: true, x: 32, y: 32, orientation: 'vertical' },
  isEditMode,
  onUpdateRelation,
  onDeleteRelation,
  onUpdateCharacter,
  onDeleteCharacter,
  onUpdateLegend,
  onAddLegend,
  onDeleteLegend,
  onUpdateLegendSettings,
}) => {
  const { customConfirm, toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 상단 탭: 요소 설정 | 관계도 설정
  const [topTab, setTopTab] = useState<'element' | 'settings'>('element');

  // 캐릭터 맵
  const charMap = new Map(characters.map((c) => [c.id, c]));

  // 범례 맵
  const legendMap = new Map(legends.map((l) => [l.id, l]));

  // 이미지 파일 로컬 업로드 처리
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCharacter) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateCharacter(selectedCharacter.id, { imageUrl: dataUrl });
      toast.success('프로필 이미지가 변경되었습니다.');
    };
    reader.readAsDataURL(file);
  };

  const renderTabBar = () => (
    <div className="flex border-b border-slate-100 dark:border-[#2C2C38] px-3 pt-2 bg-white dark:bg-[#1E1E27]">
      <button
        type="button"
        onClick={() => setTopTab('element')}
        className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all ${
          topTab === 'element'
            ? 'border-lavender-600 text-lavender-600 dark:text-[#B7A5FF] dark:border-[#B7A5FF]'
            : 'border-transparent text-slate-400 dark:text-[#7D7B90] hover:text-slate-600 dark:hover:text-[#E8E7EF]'
        }`}
      >
        요소 설정
      </button>
      <button
        type="button"
        onClick={() => setTopTab('settings')}
        className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all ${
          topTab === 'settings'
            ? 'border-lavender-600 text-lavender-600 dark:text-[#B7A5FF] dark:border-[#B7A5FF]'
            : 'border-transparent text-slate-400 dark:text-[#7D7B90] hover:text-slate-600 dark:hover:text-[#E8E7EF]'
        }`}
      >
        관계도 설정
      </button>
    </div>
  );

  // =========================================================================
  // 1. 관계도 설정 탭 선택 시
  // =========================================================================
  if (topTab === 'settings') {
    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200/90 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full z-20 transition-colors">
        {renderTabBar()}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Relation Legends List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-[#E8E7EF] block">
              관계 범례 관리 ({legends.length})
            </span>

            <div className="space-y-1.5">
              {legends.map((leg) => (
                <div
                  key={leg.id}
                  className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-200/80 dark:border-[#3A3948] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="color"
                      value={leg.color}
                      onChange={(e) =>
                        onUpdateLegend?.(leg.id, {
                          color: e.target.value,
                          gradient: undefined,
                        })
                      }
                      className="w-5 h-5 rounded-xs border-0 p-0 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={leg.name}
                      onChange={(e) =>
                        onUpdateLegend?.(leg.id, { name: e.target.value })
                      }
                      className="w-full px-2 py-0.5 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-md text-xs font-semibold text-slate-800 dark:text-[#E8E7EF]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteLegend?.(leg.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const newId = `leg-${Date.now()}`;
                onAddLegend?.({
                  id: newId,
                  name: '새로운 관계',
                  color: '#3B82F6',
                  style: 'solid',
                  strokeWidth: 3.5,
                });
                toast.success('새 범례 항목이 추가되었습니다.');
              }}
              className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-[#3A3948] hover:border-lavender-400 text-slate-600 dark:text-[#A5A3B5] hover:text-lavender-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 범례 추가</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. 요소 설정 탭: 관계선 선택 시
  // (라벨 완전 제거, A->B와 B->A 독립 설정, 다른 범례 선택 시 자동 그라데이션)
  // =========================================================================
  if (selectedRelation) {
    const charA = charMap.get(selectedRelation.sourceId);
    const charB = charMap.get(selectedRelation.targetId);
    const dir = selectedRelation.direction || 'bidirectional';

    // A -> B 범례 및 색상
    const activeLegA = legends.find((l) => l.id === selectedRelation.legendIdAtoB) || legends[0];
    const colorA = selectedRelation.colorAtoB || activeLegA?.color || selectedRelation.color || '#3B82F6';

    // B -> A 범례 및 색상
    const activeLegB = legends.find((l) => l.id === selectedRelation.legendIdBtoA) || legends[1] || legends[0];
    const colorB = selectedRelation.colorBtoA || activeLegB?.color || selectedRelation.color || '#EF4444';

    const handleDeleteRelation = async () => {
      const confirmed = await customConfirm({
        title: '관계선 삭제',
        message: `'${charA?.name || 'A'}'와 '${charB?.name || 'B'}' 사이의 관계선을 삭제하시겠습니까?`,
        isDanger: true,
        confirmText: '삭제',
      });
      if (confirmed) {
        onDeleteRelation(selectedRelation.id);
        toast.info('관계선이 삭제되었습니다.');
      }
    };

    // A -> B 범례 변경 핸들러 (B에 절대 영향 없음!)
    const handleSelectLegendAtoB = (legend: RelationLegendItem) => {
      const newColorA = legend.color;
      const willBeGradient = dir === 'bidirectional' && newColorA !== colorB;

      onUpdateRelation(selectedRelation.id, {
        legendIdAtoB: legend.id,
        emotionAtoB: legend.name,
        colorAtoB: newColorA,
        color: newColorA,
        gradient: willBeGradient
          ? { fromColor: newColorA, toColor: colorB }
          : undefined,
      });
    };

    // B -> A 범례 변경 핸들러 (A에 절대 영향 없음!)
    const handleSelectLegendBtoA = (legend: RelationLegendItem) => {
      const newColorB = legend.color;
      const willBeGradient = dir === 'bidirectional' && colorA !== newColorB;

      onUpdateRelation(selectedRelation.id, {
        legendIdBtoA: legend.id,
        emotionBtoA: legend.name,
        colorBtoA: newColorB,
        gradient: willBeGradient
          ? { fromColor: colorA, toColor: newColorB }
          : undefined,
      });
    };

    // 방향 변경 핸들러
    const handleChangeDirection = (newDir: 'bidirectional' | 'source-to-target' | 'target-to-source') => {
      let gradient = undefined;
      let lineColor = colorA;

      if (newDir === 'bidirectional') {
        if (colorA !== colorB) {
          gradient = { fromColor: colorA, toColor: colorB };
        }
      } else if (newDir === 'source-to-target') {
        lineColor = colorA;
      } else if (newDir === 'target-to-source') {
        lineColor = colorB;
      }

      onUpdateRelation(selectedRelation.id, {
        direction: newDir,
        color: lineColor,
        gradient,
      });
    };

    const isGradActive = dir === 'bidirectional' && colorA !== colorB;

    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200/90 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full z-20 transition-colors">
        {renderTabBar()}

        {/* Selected Type Title Bar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-[#2C2C38] flex items-center justify-between bg-slate-50/60 dark:bg-[#262634]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-lavender-700 dark:text-[#B7A5FF]">
            <GitCommit className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
            <span>관계선 설정</span>
          </div>

          <button
            type="button"
            onClick={handleDeleteRelation}
            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
            title="관계선 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Section 1: 관계 방향 선택 */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-600 dark:text-[#A5A3B5] font-bold block">
              관계 방향
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleChangeDirection('bidirectional')}
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  dir === 'bidirectional'
                    ? 'border-lavender-500 bg-lavender-50/70 dark:bg-[#352E58]/50 text-lavender-700 dark:text-[#B7A5FF] font-bold ring-1 ring-lavender-400'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="text-[10px]">양방향</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangeDirection('source-to-target')}
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  dir === 'source-to-target'
                    ? 'border-lavender-500 bg-lavender-50/70 dark:bg-[#352E58]/50 text-lavender-700 dark:text-[#B7A5FF] font-bold ring-1 ring-lavender-400'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-[10px] truncate max-w-[70px]">
                  {charA?.name || 'A'} ➔ {charB?.name || 'B'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleChangeDirection('target-to-source')}
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  dir === 'target-to-source'
                    ? 'border-lavender-500 bg-lavender-50/70 dark:bg-[#352E58]/50 text-lavender-700 dark:text-[#B7A5FF] font-bold ring-1 ring-lavender-400'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                }`}
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-[10px] truncate max-w-[70px]">
                  {charB?.name || 'B'} ➔ {charA?.name || 'A'}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: A ➔ B의 관계 범례 (독립 설정) */}
          {(dir === 'bidirectional' || dir === 'source-to-target') && (
            <div className="p-3 bg-slate-50 dark:bg-[#262634] rounded-2xl border border-slate-200/80 dark:border-[#3A3948] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-[#E8E7EF] flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: colorA }}
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  />
                  <span>
                    {charA?.name || 'A'}의 태도 ({charB?.name || 'B'}에게)
                  </span>
                </span>
                <span
                  style={{ color: colorA }}
                  className="font-bold text-[11px]"
                >
                  {selectedRelation.emotionAtoB || activeLegA?.name || '범례 선택'}
                </span>
              </div>

              {/* 범례 선택 버튼 목록 */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {legends.map((leg) => {
                  const isCurrent =
                    selectedRelation.legendIdAtoB === leg.id ||
                    (!selectedRelation.legendIdAtoB && activeLegA?.id === leg.id);

                  return (
                    <button
                      key={leg.id}
                      type="button"
                      onClick={() => handleSelectLegendAtoB(leg)}
                      className={`px-2 py-1.5 rounded-xl border text-left flex items-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'border-lavender-500 bg-white dark:bg-[#1E1E27] font-bold shadow-xs'
                          : 'border-slate-200 dark:border-[#3A3948] bg-transparent text-slate-600 dark:text-[#A5A3B5] hover:bg-white dark:hover:bg-[#1E1E27]'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: leg.color }}
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                      />
                      <span className="text-[11px] truncate">{leg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: B ➔ A의 관계 범례 (독립 설정) */}
          {(dir === 'bidirectional' || dir === 'target-to-source') && (
            <div className="p-3 bg-slate-50 dark:bg-[#262634] rounded-2xl border border-slate-200/80 dark:border-[#3A3948] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 dark:text-[#E8E7EF] flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: colorB }}
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  />
                  <span>
                    {charB?.name || 'B'}의 태도 ({charA?.name || 'A'}에게)
                  </span>
                </span>
                <span
                  style={{ color: colorB }}
                  className="font-bold text-[11px]"
                >
                  {selectedRelation.emotionBtoA || activeLegB?.name || '범례 선택'}
                </span>
              </div>

              {/* 범례 선택 버튼 목록 */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {legends.map((leg) => {
                  const isCurrent =
                    selectedRelation.legendIdBtoA === leg.id ||
                    (!selectedRelation.legendIdBtoA && activeLegB?.id === leg.id);

                  return (
                    <button
                      key={leg.id}
                      type="button"
                      onClick={() => handleSelectLegendBtoA(leg)}
                      className={`px-2 py-1.5 rounded-xl border text-left flex items-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'border-lavender-500 bg-white dark:bg-[#1E1E27] font-bold shadow-xs'
                          : 'border-slate-200 dark:border-[#3A3948] bg-transparent text-slate-600 dark:text-[#A5A3B5] hover:bg-white dark:hover:bg-[#1E1E27]'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: leg.color }}
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                      />
                      <span className="text-[11px] truncate">{leg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 그라데이션 시각화 프리뷰 바 */}
          {isGradActive && (
            <div className="p-3 bg-slate-50 dark:bg-[#262634] rounded-2xl border border-slate-200/80 dark:border-[#3A3948] space-y-1.5">
              <span className="text-[10.5px] font-bold text-slate-500 dark:text-[#A5A3B5] block">
                그라데이션 연결 미리보기
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs" style={{ color: colorA }}>
                  {charA?.name} ({selectedRelation.emotionAtoB || activeLegA?.name})
                </span>
                <div
                  style={{
                    background: `linear-gradient(to right, ${colorA}, ${colorB})`,
                  }}
                  className="flex-1 h-2 rounded-full shadow-xs"
                />
                <span className="font-bold text-xs" style={{ color: colorB }}>
                  {charB?.name} ({selectedRelation.emotionBtoA || activeLegB?.name})
                </span>
              </div>
            </div>
          )}

          {/* Section 4: 선 스타일 (형태 및 두께) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#2C2C38]">
            <label className="text-[11px] text-slate-600 dark:text-[#A5A3B5] font-bold block">
              선 스타일
            </label>
            <div className="grid grid-cols-2 gap-2 items-center">
              <select
                value={selectedRelation.style || 'solid'}
                onChange={(e) =>
                  onUpdateRelation(selectedRelation.id, {
                    style: e.target.value as LineStyle,
                  })
                }
                className="w-full h-9 px-2 bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none cursor-pointer"
              >
                <option value="solid">실선 ──</option>
                <option value="dashed">점선 ┈</option>
              </select>

              <select
                value={selectedRelation.strokeWidth || 3.5}
                onChange={(e) =>
                  onUpdateRelation(selectedRelation.id, {
                    strokeWidth: Number(e.target.value),
                  })
                }
                className="w-full h-9 px-2 bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none cursor-pointer"
              >
                <option value={2}>2px</option>
                <option value={3}>3px</option>
                <option value={3.5}>3.5px</option>
                <option value={4}>4px</option>
                <option value={5}>5px</option>
                <option value={6}>6px</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. 요소 설정 탭: 캐릭터 선택 시
  // =========================================================================
  if (selectedCharacter) {
    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200/90 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full z-20 transition-colors">
        {renderTabBar()}

        <div className="px-4 py-3 border-b border-slate-100 dark:border-[#2C2C38] flex items-center justify-between bg-slate-50/60 dark:bg-[#262634]">
          <span className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF]">
            캐릭터 프로필
          </span>
          <button
            type="button"
            onClick={async () => {
              const confirmed = await customConfirm({
                title: '캐릭터 삭제',
                message: `'${selectedCharacter.name}' 캐릭터를 삭제하시겠습니까?`,
                isDanger: true,
                confirmText: '삭제',
              });
              if (confirmed) {
                onDeleteCharacter(selectedCharacter.id);
                toast.info('캐릭터가 삭제되었습니다.');
              }
            }}
            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Portrait Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#262634] rounded-2xl border border-slate-200/80 dark:border-[#3A3948]">
            <img
              src={
                selectedCharacter.imageUrl ||
                'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200'
              }
              alt={selectedCharacter.name}
              className="w-14 h-14 rounded-full object-cover shadow-sm shrink-0 border-2 border-slate-200 dark:border-[#3A3948]"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8E7EF] truncate">
                {selectedCharacter.name}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-[#7D7B90] mt-0.5">
                원형 프로필 고정
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. 이름 */}
            <div>
              <label className="text-[11px] text-slate-500 dark:text-[#A5A3B5] font-semibold block mb-1">
                이름
              </label>
              <input
                type="text"
                value={selectedCharacter.name}
                onChange={(e) =>
                  onUpdateCharacter(selectedCharacter.id, { name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none"
              />
            </div>

            {/* 2. 이미지 파일 업로드 */}
            <div>
              <label className="text-[11px] text-slate-500 dark:text-[#A5A3B5] font-semibold block mb-1">
                프로필 이미지 파일
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-[#262634] hover:bg-slate-100 dark:hover:bg-[#2F2F3F] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" />
                <span>이미지 파일 업로드/변경</span>
              </button>
            </div>

            {/* 3. 이름 표시 ON/OFF 토글 */}
            <div className="pt-2 border-t border-slate-100 dark:border-[#2C2C38] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] block">
                  이름 표시
                </span>
                <span className="text-[10px] text-slate-400 dark:text-[#7D7B90]">
                  초상화 아래 이름 라벨 on/off
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCharacter.showName ?? true}
                  onChange={(e) =>
                    onUpdateCharacter(selectedCharacter.id, {
                      showName: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 dark:bg-[#3A3948] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lavender-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. 요소 설정 탭: 미선택 시
  // =========================================================================
  return (
    <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200/90 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full z-20 transition-colors">
      {renderTabBar()}

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-[#7D7B90] text-xs">
        <Sparkles className="w-8 h-8 text-lavender-400 mb-2 stroke-[1.5]" />
        <p className="font-bold text-slate-700 dark:text-[#E8E7EF] mb-1">
          요소를 선택해주세요
        </p>
        <p className="text-[11px] text-slate-400 dark:text-[#7D7B90] leading-relaxed">
          캔버스 상의 관계선이나 캐릭터 초상화를 클릭하면 상세 설정을 진행할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
