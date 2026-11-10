import React, { useState } from 'react';
import {
  RelationCharacter,
  RelationItem,
} from '../../../../types/relations';
import {
  Search,
  ArrowRight,
  MessageSquare,
  Trash2,
  Edit2,
  User,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface RelationListViewProps {
  characters: RelationCharacter[];
  relations: RelationItem[];
  selectedRelationId: string | null;
  isEditMode: boolean;
  onSelectRelation: (id: string) => void;
  onDeleteRelation: (id: string) => void;
}

export const RelationListView: React.FC<RelationListViewProps> = ({
  characters,
  relations,
  selectedRelationId,
  isEditMode,
  onSelectRelation,
  onDeleteRelation,
}) => {
  const { customConfirm, toast } = useToast();
  const [filterQuery, setFilterQuery] = useState('');

  const charMap = new Map(characters.map((c) => [c.id, c]));

  const filteredRelations = relations.filter((r) => {
    const charA = charMap.get(r.sourceId)?.name || '';
    const charB = charMap.get(r.targetId)?.name || '';
    const q = filterQuery.toLowerCase();
    return (
      charA.toLowerCase().includes(q) ||
      charB.toLowerCase().includes(q) ||
      r.relationType.toLowerCase().includes(q) ||
      (r.emotionAtoB && r.emotionAtoB.toLowerCase().includes(q)) ||
      (r.emotionBtoA && r.emotionBtoA.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (r: RelationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const charA = charMap.get(r.sourceId)?.name || 'A';
    const charB = charMap.get(r.targetId)?.name || 'B';
    const confirmed = await customConfirm({
      title: '관계선 삭제',
      message: `'${charA}'와 '${charB}' 사이의 관계를 삭제하시겠습니까?`,
      isDanger: true,
      confirmText: '삭제',
    });
    if (confirmed) {
      onDeleteRelation(r.id);
      toast.info('관계가 삭제되었습니다.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFBFD] dark:bg-dark-bg overflow-hidden p-6 select-none">
      {/* Search & Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-dark-text">
            캐릭터 관계 목록
          </h2>
          <p className="text-xs text-slate-400 dark:text-dark-textSecondary mt-0.5">
            등록된 모든 인물 간의 관계와 감정을 한눈에 확인합니다. (총 {relations.length}개)
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="인물명 또는 관계 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white dark:bg-dark-surface rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 dark:bg-dark-elevated border-b border-slate-200 dark:border-dark-border text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary uppercase tracking-wider">
          <div className="col-span-3">인물 1 ↔ 인물 2</div>
          <div className="col-span-2 text-center">관계 유형</div>
          <div className="col-span-3">A → B 감정</div>
          <div className="col-span-3">B → A 감정</div>
          <div className="col-span-1 text-center">메모</div>
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-dark-border">
          {filteredRelations.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              {filterQuery ? '검색 결과와 일치하는 관계가 없습니다.' : '등록된 관계가 없습니다.'}
            </div>
          ) : (
            filteredRelations.map((r) => {
              const charA = charMap.get(r.sourceId);
              const charB = charMap.get(r.targetId);
              const isSelected = selectedRelationId === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => onSelectRelation(r.id)}
                  className={`grid grid-cols-12 px-5 py-3.5 items-center text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-lavender-50/80 dark:bg-lavender-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-dark-elevated'
                  }`}
                >
                  {/* Characters A & B */}
                  <div className="col-span-3 flex items-center gap-2 min-w-0 pr-2">
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-white dark:border-dark-surface bg-slate-100 dark:bg-dark-elevated">
                        {charA?.imageUrl ? (
                          <img src={charA.imageUrl} alt={charA.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400 m-auto" />
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-white dark:border-dark-surface bg-slate-100 dark:bg-dark-elevated">
                        {charB?.imageUrl ? (
                          <img src={charB.imageUrl} alt={charB.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400 m-auto" />
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-dark-text truncate">
                      {charA?.name || 'A'} ↔ {charB?.name || 'B'}
                    </span>
                  </div>

                  {/* Relation Type Badge */}
                  <div className="col-span-2 flex justify-center">
                    <span
                      style={{
                        backgroundColor: `${r.color}15`,
                        color: r.color,
                        borderColor: `${r.color}40`,
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                    >
                      {r.relationType}
                    </span>
                  </div>

                  {/* Emotion A -> B */}
                  <div className="col-span-3 pr-3 text-slate-600 dark:text-dark-textSecondary truncate">
                    <span className="font-semibold text-slate-800 dark:text-dark-text mr-1">
                      {charA?.name}:
                    </span>
                    {r.emotionAtoB || '-'}
                  </div>

                  {/* Emotion B -> A */}
                  <div className="col-span-3 pr-3 text-slate-600 dark:text-dark-textSecondary truncate">
                    <span className="font-semibold text-slate-800 dark:text-dark-text mr-1">
                      {charB?.name}:
                    </span>
                    {r.emotionBtoA || '-'}
                  </div>

                  {/* Memo Indicator / Delete */}
                  <div className="col-span-1 flex items-center justify-center gap-1.5">
                    {r.memo ? (
                      <span title={r.memo} className="text-lavender-600 dark:text-lavender-400 cursor-help">
                        💬
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-dark-textSecondary">-</span>
                    )}

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(r, e)}
                        className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors ml-1"
                        title="관계 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

