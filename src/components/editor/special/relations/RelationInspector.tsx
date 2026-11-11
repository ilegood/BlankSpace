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
  User,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface RelationInspectorProps {
  selectedRelation: RelationItem | null;
  selectedCharacter: RelationCharacter | null;
  selectedGroup?: any;
  characters: RelationCharacter[];
  relations: RelationItem[];
  groups?: any[];
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

  // 관계 정보 섹션 접기/펼치기
  const [isRelationInfoOpen, setIsRelationInfoOpen] = useState(true);

  // 캐릭터 맵
  const charMap = new Map(characters.map((c) => [c.id, c]));

  // 이미지 파일 로컬 업로드 처리 (FileReader DataURL)
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
  // 1. 관계도 설정 탭 선택 시 (범례 추가는 여기서만 가능)
  // =========================================================================
  if (topTab === 'settings') {
    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200/90 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full z-20 transition-colors">
        {renderTabBar()}

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* Legend Box Visibility Toggle */}
          <div className="p-3 bg-slate-50 dark:bg-[#262634] rounded-2xl border border-slate-200/80 dark:border-[#3A3948] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] block">
                관계 범례 박스 표시
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-[#7D7B90]">
                캔버스 화면 내 플로팅 범례 노출 여부
              </span>
            </div>
            <input
              type="checkbox"
              checked={legendSettings.visible !== false}
              onChange={(e) =>
                onUpdateLegendSettings?.({ visible: e.target.checked })
              }
              className="w-4 h-4 accent-lavender-600 cursor-pointer"
            />
          </div>

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

            {/* 범례 추가 버튼 (관계도 설정 탭에만 존재) */}
            <button
              type="button"
              onClick={() => {
                const newId = `leg-${Date.now()}`;
                onAddLegend?.({
                  id: newId,
                  name: '새로운 관계',
                  color: '#3B82F6',
                  style: 'solid',
                  strokeWidth: 3,
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
  // (A->B 생각과 B->A 생각이 다르면 자동으로 그라데이션 표기!)
  // =========================================================================
  if (selectedRelation) {
    const charA = charMap.get(selectedRelation.sourceId);
    const charB = charMap.get(selectedRelation.targetId);
    const dir = selectedRelation.direction || 'bidirectional';

    const colorA = selectedRelation.colorAtoB || selectedRelation.color || '#3B82F6';
    const colorB = selectedRelation.colorBtoA || selectedRelation.color || '#3B82F6';

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

    // A/B 감정 색상 업데이트 시 자동 그라데이션 판정
    const updateEmotionColors = (newColorA: string, newColorB: string) => {
      if (newColorA !== newColorB) {
        onUpdateRelation(selectedRelation.id, {
          colorAtoB: newColorA,
          colorBtoA: newColorB,
          color: newColorA,
          gradient: { fromColor: newColorA, toColor: newColorB },
        });
      } else {
        onUpdateRelation(selectedRelation.id, {
          colorAtoB: newColorA,
          colorBtoA: newColorB,
          color: newColorA,
          gradient: undefined,
        });
      }
    };

    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200/90 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full z-20 transition-colors">
        {renderTabBar()}

        {/* Selected Type Title Bar */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-[#2C2C38] flex items-center justify-between bg-slate-50/60 dark:bg-[#262634]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-lavender-700 dark:text-[#B7A5FF]">
            <GitCommit className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
            <span>관계선</span>
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
          {/* Section 1: 관계 기본 정보 */}
          <div className="space-y-2">
            <div
              onClick={() => setIsRelationInfoOpen((v) => !v)}
              className="flex items-center justify-between cursor-pointer text-slate-800 dark:text-[#E8E7EF] font-bold"
            >
              <span>관계 기본 정보</span>
              {isRelationInfoOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>

            {isRelationInfoOpen && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-[#A5A3B5] font-semibold block mb-1">
                    관계 이름
                  </label>
                  <input
                    type="text"
                    placeholder="예: 라이벌, 동료"
                    value={selectedRelation.label || selectedRelation.relationType || ''}
                    onChange={(e) =>
                      onUpdateRelation(selectedRelation.id, {
                        label: e.target.value,
                        relationType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 dark:text-[#A5A3B5] font-semibold block mb-1">
                    관계 설명
                  </label>
                  <textarea
                    rows={2}
                    placeholder="상세 관계 메모..."
                    value={selectedRelation.memo || ''}
                    onChange={(e) =>
                      onUpdateRelation(selectedRelation.id, { memo: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: 핵심! A와 B의 서로에 대한 생각 (다르면 그라데이션 자동 표기) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#2C2C38]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-700 dark:text-[#E8E7EF] font-bold block">
                인물 간 생각 (상이할 시 그라데이션)
              </label>
              {colorA !== colorB && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] font-bold">
                  그라데이션 ON
                </span>
              )}
            </div>

            {/* A -> B */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-200/80 dark:border-[#3A3948] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-[#E8E7EF]">
                  {charA?.name || 'A'} ➔ {charB?.name || 'B'} 생각
                </span>
                <input
                  type="color"
                  value={colorA}
                  onChange={(e) => updateEmotionColors(e.target.value, colorB)}
                  className="w-5 h-5 rounded-xs border-0 p-0 cursor-pointer"
                  title="A의 생각 색상"
                />
              </div>
              <input
                type="text"
                placeholder="예: 깊은 신뢰와 존경"
                value={selectedRelation.emotionAtoB || ''}
                onChange={(e) =>
                  onUpdateRelation(selectedRelation.id, { emotionAtoB: e.target.value })
                }
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs text-slate-800 dark:text-[#E8E7EF]"
              />
            </div>

            {/* B -> A */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-200/80 dark:border-[#3A3948] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-[#E8E7EF]">
                  {charB?.name || 'B'} ➔ {charA?.name || 'A'} 생각
                </span>
                <input
                  type="color"
                  value={colorB}
                  onChange={(e) => updateEmotionColors(colorA, e.target.value)}
                  className="w-5 h-5 rounded-xs border-0 p-0 cursor-pointer"
                  title="B의 생각 색상"
                />
              </div>
              <input
                type="text"
                placeholder="예: 넘어서고 싶은 라이벌"
                value={selectedRelation.emotionBtoA || ''}
                onChange={(e) =>
                  onUpdateRelation(selectedRelation.id, { emotionBtoA: e.target.value })
                }
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs text-slate-800 dark:text-[#E8E7EF]"
              />
            </div>
          </div>

          {/* Section 3: 관계 방향 */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#2C2C38]">
            <label className="text-[11px] text-slate-600 dark:text-[#A5A3B5] font-bold block">
              관계 방향
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateRelation(selectedRelation.id, { direction: 'bidirectional' })
                }
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  dir === 'bidirectional'
                    ? 'border-lavender-500 bg-lavender-50/70 dark:bg-[#352E58]/50 text-lavender-700 dark:text-[#B7A5FF] font-bold ring-1 ring-lavender-400'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="text-[10.5px]">양방향</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateRelation(selectedRelation.id, { direction: 'source-to-target' })
                }
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  dir === 'source-to-target'
                    ? 'border-lavender-500 bg-lavender-50/70 dark:bg-[#352E58]/50 text-lavender-700 dark:text-[#B7A5FF] font-bold ring-1 ring-lavender-400'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-[10.5px]">단방향 (→)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateRelation(selectedRelation.id, { direction: 'target-to-source' })
                }
                className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                  dir === 'target-to-source'
                    ? 'border-lavender-500 bg-lavender-50/70 dark:bg-[#352E58]/50 text-lavender-700 dark:text-[#B7A5FF] font-bold ring-1 ring-lavender-400'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                }`}
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-[10.5px]">단방향 (←)</span>
              </button>
            </div>
          </div>

          {/* Section 4: 선 스타일 (색상, 형태, 두께) */}
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
                value={selectedRelation.strokeWidth || 4}
                onChange={(e) =>
                  onUpdateRelation(selectedRelation.id, {
                    strokeWidth: Number(e.target.value),
                  })
                }
                className="w-full h-9 px-2 bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs font-semibold text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none cursor-pointer"
              >
                <option value={2}>2px</option>
                <option value={3}>3px</option>
                <option value={4}>4px</option>
                <option value={5}>5px</option>
                <option value={6}>6px</option>
              </select>
            </div>
          </div>

          {/* Section 5: 라벨 표시 토글 스위치 */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#2C2C38] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF]">
              라벨 표시
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRelation.showLabel ?? false}
                onChange={(e) =>
                  onUpdateRelation(selectedRelation.id, {
                    showLabel: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 dark:bg-[#3A3948] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lavender-600"></div>
            </label>
          </div>

          {/* Section 6: 관계 범례 목록 (요소 설정 탭에서는 추가 버튼 없음) */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2C2C38]">
            <span className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] block">
              관계 범례 프리셋
            </span>

            <div className="space-y-1">
              {legends.map((leg) => {
                const isSelected = selectedRelation.legendId === leg.id;

                return (
                  <button
                    key={leg.id}
                    type="button"
                    onClick={() => {
                      onUpdateRelation(selectedRelation.id, {
                        legendId: leg.id,
                        relationType: leg.name,
                        label: leg.name,
                        color: leg.color,
                        gradient: leg.gradient,
                        style: leg.style,
                        strokeWidth: leg.strokeWidth || 3.5,
                        colorAtoB: leg.color,
                        colorBtoA: leg.color,
                      });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-lavender-400 bg-lavender-50/60 dark:bg-[#352E58]/40 font-bold text-lavender-900 dark:text-[#B7A5FF]'
                        : 'border-slate-200/80 dark:border-[#3A3948] hover:bg-slate-50 dark:hover:bg-[#262634] text-slate-700 dark:text-[#E8E7EF]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg width="32" height="12" className="overflow-visible shrink-0">
                        <line
                          x1="0"
                          y1="6"
                          x2="26"
                          y2="6"
                          stroke={leg.color}
                          strokeWidth="2.5"
                          strokeDasharray={leg.style === 'dashed' ? '4 3' : undefined}
                        />
                        <polygon
                          points="24,3 30,6 24,9"
                          fill={leg.color}
                        />
                      </svg>
                      <span className="text-xs truncate">{leg.name}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. 요소 설정 탭: 캐릭터 선택 시
  // (프로필은 원형 고정, 이름 on/off 토글, 이미지는 파일 업로드만 제공)
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
              style={{
                borderColor: selectedCharacter.borderColor || selectedCharacter.color || '#EF4444',
                borderWidth: '4px',
              }}
              className="w-14 h-14 rounded-full object-cover shadow-sm shrink-0"
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

          {/* Form: 이름 & 이미지 파일 업로드 & 이름 on/off만 남김 */}
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

            {/* 3. 테두리 색상 */}
            <div>
              <label className="text-[11px] text-slate-500 dark:text-[#A5A3B5] font-semibold block mb-1">
                테두리 색상
              </label>
              <input
                type="color"
                value={selectedCharacter.borderColor || selectedCharacter.color || '#EF4444'}
                onChange={(e) =>
                  onUpdateCharacter(selectedCharacter.id, {
                    borderColor: e.target.value,
                    color: e.target.value,
                  })
                }
                className="w-full h-8 rounded-xl border border-slate-200 dark:border-[#3A3948] p-0.5 cursor-pointer bg-slate-50 dark:bg-[#262634]"
              />
            </div>

            {/* 4. 이름 표시 ON/OFF 토글 스위치 */}
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
  // 4. 요소 설정 탭: 아무것도 선택되지 않았을 때
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
