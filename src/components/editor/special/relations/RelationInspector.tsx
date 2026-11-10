import React, { useState } from 'react';
import {
  RelationCharacter,
  RelationItem,
  RELATION_TYPE_PRESETS,
} from '../../../../types/relations';
import {
  ArrowRight,
  ArrowLeftRight,
  Heart,
  Trash2,
  Edit2,
  FileText,
  Sliders,
  Settings2,
  MessageSquare,
  Sparkles,
  User,
  Eye,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface RelationInspectorProps {
  selectedRelation: RelationItem | null;
  selectedCharacter: RelationCharacter | null;
  characters: RelationCharacter[];
  relations: RelationItem[];
  isEditMode: boolean;
  onUpdateRelation: (id: string, updates: Partial<RelationItem>) => void;
  onDeleteRelation: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<RelationCharacter>) => void;
  onDeleteCharacter: (id: string) => void;
  onSelectRelation: (id: string | null) => void;
  onSelectCharacter: (id: string | null) => void;
}

export const RelationInspector: React.FC<RelationInspectorProps> = ({
  selectedRelation,
  selectedCharacter,
  characters,
  relations,
  isEditMode,
  onUpdateRelation,
  onDeleteRelation,
  onUpdateCharacter,
  onDeleteCharacter,
  onSelectRelation,
  onSelectCharacter,
}) => {
  const { customConfirm, toast } = useToast();

  // Perspective View Tab for Selected Character
  const [perspectiveTab, setPerspectiveTab] = useState<'fromMe' | 'toMe'>('fromMe');

  // Character Map
  const charMap = new Map(characters.map((c) => [c.id, c]));

  // 1. If Relation is Selected
  if (selectedRelation) {
    const charA = charMap.get(selectedRelation.sourceId);
    const charB = charMap.get(selectedRelation.targetId);

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

    return (
      <div className="w-80 bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border flex flex-col shrink-0 select-none overflow-hidden h-full">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50 dark:bg-dark-elevated">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              style={{ backgroundColor: selectedRelation.color }}
              className="w-2.5 h-2.5 rounded-full shrink-0"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-dark-text truncate">
              관계 상세 정보
            </span>
          </div>

          {isEditMode && (
            <button
              type="button"
              onClick={handleDeleteRelation}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="관계선 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
          {/* Connected Pair Card */}
          <div className="p-3 bg-slate-50 dark:bg-dark-elevated rounded-2xl border border-slate-200/80 dark:border-dark-border flex items-center justify-between">
            {/* Char A */}
            <div
              onClick={() => charA && onSelectCharacter(charA.id)}
              className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
                {charA?.imageUrl ? (
                  <img src={charA.imageUrl} alt={charA.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400 m-auto mt-2" />
                )}
              </div>
              <span className="font-bold text-slate-800 dark:text-dark-text group-hover:text-lavender-600 truncate">
                {charA?.name || '캐릭터 A'}
              </span>
            </div>

            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 mx-2 shrink-0" />

            {/* Char B */}
            <div
              onClick={() => charB && onSelectCharacter(charB.id)}
              className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0 justify-end"
            >
              <span className="font-bold text-slate-800 dark:text-dark-text group-hover:text-lavender-600 truncate text-right">
                {charB?.name || '캐릭터 B'}
              </span>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-dark-border shrink-0 bg-white dark:bg-dark-surface">
                {charB?.imageUrl ? (
                  <img src={charB.imageUrl} alt={charB.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-400 m-auto mt-2" />
                )}
              </div>
            </div>
          </div>

          {/* Connection Target Switcher (Edit Mode Only) */}
          {isEditMode && (
            <div className="p-3 bg-lavender-50/50 dark:bg-lavender-900/10 rounded-xl border border-lavender-200/60 dark:border-lavender-800/30 flex flex-col gap-2">
              <span className="text-[10.5px] font-bold text-lavender-800 dark:text-lavender-300">
                연결 대상 변경
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">시작 캐릭터</span>
                  <select
                    value={selectedRelation.sourceId}
                    onChange={(e) => {
                      if (e.target.value === selectedRelation.targetId) {
                        toast.warning('동일한 캐릭터끼리는 연결할 수 없습니다.');
                        return;
                      }
                      onUpdateRelation(selectedRelation.id, { sourceId: e.target.value });
                    }}
                    className="w-full px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === selectedRelation.targetId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">도착 캐릭터</span>
                  <select
                    value={selectedRelation.targetId}
                    onChange={(e) => {
                      if (e.target.value === selectedRelation.sourceId) {
                        toast.warning('동일한 캐릭터끼리는 연결할 수 없습니다.');
                        return;
                      }
                      onUpdateRelation(selectedRelation.id, { targetId: e.target.value });
                    }}
                    className="w-full px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs"
                  >
                    {characters.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === selectedRelation.sourceId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Relation Type Preset Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary">
              관계 유형
            </span>
            {isEditMode ? (
              <div className="flex flex-col gap-2">
                <select
                  value={selectedRelation.relationType}
                  onChange={(e) => {
                    const preset = RELATION_TYPE_PRESETS.find((p) => p.name === e.target.value);
                    onUpdateRelation(selectedRelation.id, {
                      relationType: e.target.value,
                      color: preset ? preset.color : selectedRelation.color,
                      style: preset ? preset.style : selectedRelation.style,
                    });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500"
                >
                  {RELATION_TYPE_PRESETS.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="직접 입력..."
                  value={selectedRelation.relationType}
                  onChange={(e) =>
                    onUpdateRelation(selectedRelation.id, { relationType: e.target.value })
                  }
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs"
                />
              </div>
            ) : (
              <div className="px-3 py-2 bg-slate-50 dark:bg-dark-elevated rounded-xl font-bold text-slate-800 dark:text-dark-text border border-slate-200/60 dark:border-dark-border">
                {selectedRelation.relationType}
              </div>
            )}
          </div>

          {/* Directional Emotions (A -> B & B -> A) */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-dark-border">
            <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary">
              방향별 감정 설정
            </span>

            {/* A -> B */}
            <div className="p-2.5 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/80 dark:border-dark-border flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 dark:text-dark-text">
                <span className="text-lavender-600 dark:text-lavender-400">{charA?.name}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-800 dark:text-dark-text">{charB?.name}</span>
              </div>
              {isEditMode ? (
                <input
                  type="text"
                  value={selectedRelation.emotionAtoB || ''}
                  placeholder="관계에 대한 감정을 입력해주세요."
                  onChange={(e) =>
                    onUpdateRelation(selectedRelation.id, { emotionAtoB: e.target.value })
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs"
                />
              ) : (
                <span className="text-xs text-slate-700 dark:text-dark-text font-medium mt-0.5">
                  {selectedRelation.emotionAtoB || '감정 기록 없음'}
                </span>
              )}
            </div>

            {/* B -> A */}
            <div className="p-2.5 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/80 dark:border-dark-border flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 dark:text-dark-text">
                <span className="text-lavender-600 dark:text-lavender-400">{charB?.name}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-800 dark:text-dark-text">{charA?.name}</span>
              </div>
              {isEditMode ? (
                <input
                  type="text"
                  value={selectedRelation.emotionBtoA || ''}
                  placeholder="관계에 대한 감정을 입력해주세요."
                  onChange={(e) =>
                    onUpdateRelation(selectedRelation.id, { emotionBtoA: e.target.value })
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs"
                />
              ) : (
                <span className="text-xs text-slate-700 dark:text-dark-text font-medium mt-0.5">
                  {selectedRelation.emotionBtoA || '감정 기록 없음'}
                </span>
              )}
            </div>
          </div>

          {/* Relation Memo & Comment Icon trigger */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-lavender-600" />
                <span>관계 세부 메모</span>
              </span>
              {selectedRelation.memo && (
                <span className="text-[10px] text-lavender-600 dark:text-lavender-400 font-medium">
                  💬 관계선에 표시됨
                </span>
              )}
            </div>

            {isEditMode ? (
              <textarea
                rows={3}
                value={selectedRelation.memo || ''}
                placeholder="서사적 비고나 메모를 작성하세요. 작성 시 관계선 위에 댓글 아이콘이 표시됩니다."
                onChange={(e) =>
                  onUpdateRelation(selectedRelation.id, { memo: e.target.value })
                }
                className="w-full p-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs leading-relaxed resize-none focus:outline-none focus:border-lavender-500"
              />
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/60 dark:border-dark-border text-xs text-slate-700 dark:text-dark-text whitespace-pre-wrap leading-relaxed">
                {selectedRelation.memo || '작성된 세부 메모가 없습니다.'}
              </div>
            )}
          </div>

          {/* Style Controls (Color & Stroke Width) - Edit Mode Only */}
          {isEditMode && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-dark-border">
              <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary">
                관계선 스타일
              </span>

              {/* Color Picker & Preset Chips */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">선 색상</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={selectedRelation.color}
                    onChange={(e) =>
                      onUpdateRelation(selectedRelation.id, { color: e.target.value })
                    }
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  {['#EC4899', '#8B5CF6', '#0EA5E9', '#EF4444', '#10B981', '#64748B'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => onUpdateRelation(selectedRelation.id, { color: col })}
                      style={{ backgroundColor: col }}
                      className={`w-4 h-4 rounded-full ${
                        selectedRelation.color === col ? 'ring-2 ring-slate-400 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Line Style (Solid vs Dashed) */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">선 종류</span>
                <div className="flex items-center gap-1">
                  {(['solid', 'dashed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => onUpdateRelation(selectedRelation.id, { style: st })}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                        selectedRelation.style === st
                          ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/30 text-lavender-700 font-bold'
                          : 'border-slate-200 dark:border-dark-border text-slate-500'
                      }`}
                    >
                      {st === 'solid' ? '실선' : '점선'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stroke Width Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">선 두께</span>
                  <span className="font-mono text-slate-600 dark:text-dark-text font-bold">
                    {selectedRelation.strokeWidth}px
                  </span>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={6}
                  step={0.5}
                  value={selectedRelation.strokeWidth}
                  onChange={(e) =>
                    onUpdateRelation(selectedRelation.id, { strokeWidth: Number(e.target.value) })
                  }
                  className="w-full accent-lavender-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. If Character is Selected (Requirement 8: Perspective Switching)
  if (selectedCharacter) {
    // Relations related to this character
    const myRelations = relations.filter(
      (r) => r.sourceId === selectedCharacter.id || r.targetId === selectedCharacter.id
    );

    // Perspective 1: What I think of others (Me -> Others)
    const perspectiveFromMe = myRelations.map((r) => {
      const isSource = r.sourceId === selectedCharacter.id;
      const otherCharId = isSource ? r.targetId : r.sourceId;
      const otherChar = charMap.get(otherCharId);
      const emotion = isSource ? r.emotionAtoB : r.emotionBtoA;
      return { relation: r, otherChar, emotion, direction: 'fromMe' };
    });

    // Perspective 2: What others think of me (Others -> Me)
    const perspectiveToMe = myRelations.map((r) => {
      const isSource = r.sourceId === selectedCharacter.id;
      const otherCharId = isSource ? r.targetId : r.sourceId;
      const otherChar = charMap.get(otherCharId);
      const emotion = isSource ? r.emotionBtoA : r.emotionAtoB;
      return { relation: r, otherChar, emotion, direction: 'toMe' };
    });

    return (
      <div className="w-80 bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border flex flex-col shrink-0 select-none overflow-hidden h-full">
        {/* Character Profile Header */}
        <div className="p-4 border-b border-slate-100 dark:border-dark-border flex flex-col items-center gap-2 text-center bg-slate-50 dark:bg-dark-elevated">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-lavender-500 shadow-md bg-white dark:bg-dark-surface flex items-center justify-center">
            {selectedCharacter.imageUrl ? (
              <img src={selectedCharacter.imageUrl} alt={selectedCharacter.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-800 dark:text-dark-text truncate">
              {selectedCharacter.name}
            </h3>
            {selectedCharacter.role && (
              <span className="text-[11px] text-lavender-600 dark:text-lavender-400 font-semibold block mt-0.5">
                {selectedCharacter.role}
              </span>
            )}
          </div>
        </div>

        {/* Perspective View Switcher Tabs (Requirement 8) */}
        <div className="p-2 border-b border-slate-100 dark:border-dark-border bg-white dark:bg-dark-surface">
          <div className="flex bg-slate-100 dark:bg-dark-elevated p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPerspectiveTab('fromMe')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                perspectiveTab === 'fromMe'
                  ? 'bg-white dark:bg-dark-surface text-lavender-700 dark:text-lavender-300 shadow-2xs'
                  : 'text-slate-500 dark:text-dark-textSecondary hover:text-slate-800'
              }`}
            >
              내 시점 (내가 생각하는)
            </button>
            <button
              type="button"
              onClick={() => setPerspectiveTab('toMe')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                perspectiveTab === 'toMe'
                  ? 'bg-white dark:bg-dark-surface text-lavender-700 dark:text-lavender-300 shadow-2xs'
                  : 'text-slate-500 dark:text-dark-textSecondary hover:text-slate-800'
              }`}
            >
              상대 시점 (나를 향한)
            </button>
          </div>
        </div>

        {/* Perspective Items List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {perspectiveTab === 'fromMe' ? (
            <>
              <span className="text-[10px] font-bold text-slate-400 dark:text-dark-textSecondary px-1 tracking-wider uppercase">
                {selectedCharacter.name} → 다른 인물들 ({perspectiveFromMe.length})
              </span>

              {perspectiveFromMe.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">등록된 관계가 없습니다.</div>
              ) : (
                perspectiveFromMe.map(({ relation, otherChar, emotion }) => (
                  <div
                    key={relation.id}
                    onClick={() => onSelectRelation(relation.id)}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated hover:border-lavender-400 cursor-pointer transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-dark-text">
                          → {otherChar?.name || '상대'}
                        </span>
                        <span
                          style={{ backgroundColor: `${relation.color}15`, color: relation.color }}
                          className="px-1.5 py-0.2 rounded-md font-semibold text-[10px]"
                        >
                          {relation.relationType}
                        </span>
                      </div>
                      {relation.memo && <span className="text-xs">💬</span>}
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-dark-textSecondary bg-white dark:bg-dark-surface p-2 rounded-lg border border-slate-100 dark:border-dark-border">
                      "{emotion || '별도의 감정 기록이 없습니다.'}"
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-slate-400 dark:text-dark-textSecondary px-1 tracking-wider uppercase">
                다른 인물들 → {selectedCharacter.name} ({perspectiveToMe.length})
              </span>

              {perspectiveToMe.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">등록된 관계가 없습니다.</div>
              ) : (
                perspectiveToMe.map(({ relation, otherChar, emotion }) => (
                  <div
                    key={relation.id}
                    onClick={() => onSelectRelation(relation.id)}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated hover:border-lavender-400 cursor-pointer transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800 dark:text-dark-text">
                          {otherChar?.name || '상대'} →
                        </span>
                        <span
                          style={{ backgroundColor: `${relation.color}15`, color: relation.color }}
                          className="px-1.5 py-0.2 rounded-md font-semibold text-[10px]"
                        >
                          {relation.relationType}
                        </span>
                      </div>
                      {relation.memo && <span className="text-xs">💬</span>}
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-dark-textSecondary bg-white dark:bg-dark-surface p-2 rounded-lg border border-slate-100 dark:border-dark-border">
                      "{emotion || '별도의 감정 기록이 없습니다.'}"
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // 3. Default: Nothing Selected (Overview & Settings)
  const relationsWithMemo = relations.filter((r) => !!r.memo?.trim());

  return (
    <div className="w-80 bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border flex flex-col shrink-0 select-none overflow-hidden h-full">
      <div className="p-3.5 border-b border-slate-100 dark:border-dark-border flex items-center gap-1.5 bg-slate-50 dark:bg-dark-elevated">
        <Settings2 className="w-3.5 h-3.5 text-lavender-600" />
        <span className="text-xs font-bold text-slate-800 dark:text-dark-text">관계도 설정 & 요약</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/80 dark:border-dark-border text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">캐릭터</span>
            <span className="font-mono text-base font-bold text-slate-800 dark:text-dark-text">
              {characters.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/80 dark:border-dark-border text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">관계선</span>
            <span className="font-mono text-base font-bold text-lavender-600 dark:text-lavender-400">
              {relations.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/80 dark:border-dark-border text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">메모</span>
            <span className="font-mono text-base font-bold text-pink-600 dark:text-pink-400">
              {relationsWithMemo.length}
            </span>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="p-3.5 bg-lavender-50/60 dark:bg-lavender-900/20 rounded-2xl border border-lavender-200/60 dark:border-lavender-800/40 flex flex-col gap-2 leading-relaxed text-slate-600 dark:text-dark-textSecondary">
          <span className="font-bold text-xs text-lavender-800 dark:text-lavender-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>관계도 사용 안내</span>
          </span>
          <p className="text-[11px]">
            • <strong>자동 원형 배치:</strong> 캐릭터 프로필은 시스템이 자동으로 최적의 원형 둘레에 배치합니다.
          </p>
          <p className="text-[11px]">
            • <strong>유니티 스타일 연결:</strong> [편집] 모드에서 프로필 주변의 동서남북 앵커 지점을 드래그하여 다른 캐릭터에 놓으면 관계선이 생성됩니다.
          </p>
          <p className="text-[11px]">
            • <strong>관점별 감정 확인:</strong> 캐릭터를 클릭하면 해당 캐릭터를 둘러싼 양방향 감정을 손쉽게 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
