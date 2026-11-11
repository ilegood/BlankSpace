import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  UserPlus,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { RelationCharacter } from '../../../../types/relations';
import { useToast } from '../../../toast/ToastContext';

interface RelationSidebarProps {
  characters: RelationCharacter[];
  selectedCharacterId: string | null;
  isEditMode: boolean;
  onSelectCharacter: (id: string | null) => void;
  onOpenAddModal?: () => void;
  onDeleteCharacter: (id: string) => void;
}

export const RelationSidebar: React.FC<RelationSidebarProps> = ({
  characters,
  selectedCharacterId,
  isEditMode,
  onSelectCharacter,
  onOpenAddModal,
  onDeleteCharacter,
}) => {
  const { customConfirm } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuCharId, setActiveMenuCharId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuCharId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = async (char: RelationCharacter, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuCharId(null);
    const confirmed = await customConfirm({
      title: '캐릭터 삭제',
      message: `'${char.name}' 캐릭터를 관계도에서 삭제하시겠습니까? 연결된 모든 관계선도 함께 삭제되며, 도넛 형태가 자동으로 재정렬됩니다.`,
      isDanger: true,
      confirmText: '삭제',
    });
    if (confirmed) {
      onDeleteCharacter(char.id);
    }
  };

  return (
    <div className="w-60 bg-white dark:bg-[#1E1E27] border-r border-slate-200/90 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full z-20 transition-colors">
      {/* 1. Header (그룹탭 삭제 완료) */}
      <div className="p-3 border-b border-slate-100 dark:border-[#2C2C38] flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-[#E8E7EF]">
          <span>캐릭터 목록</span>
          <span className="px-1.5 py-0.2 bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] text-[10px] rounded-full">
            {characters.length}
          </span>
        </div>
      </div>

      {/* 2. + 캐릭터 추가 버튼 (보기모드일 땐 안 보이게 처리!) */}
      {isEditMode && onOpenAddModal && (
        <div className="p-3 pb-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-full py-2 px-3 bg-lavender-600 hover:bg-lavender-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ 캐릭터 추가</span>
          </button>
        </div>
      )}

      {/* 3. Search Input */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="캐릭터 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#262634] border border-slate-200/80 dark:border-[#3A3948] rounded-xl text-xs text-slate-800 dark:text-[#E8E7EF] placeholder-slate-400 focus:outline-none focus:border-lavender-500 transition-colors"
          />
        </div>
      </div>

      {/* 4. Character List Items */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
        {filteredCharacters.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-[#7D7B90]">
            {searchQuery ? '일치하는 인물이 없습니다.' : '등록된 인물이 없습니다.'}
          </div>
        ) : (
          filteredCharacters.map((char) => {
            const isSelected = selectedCharacterId === char.id;

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-lavender-50 dark:bg-[#352E58]/40 text-lavender-700 dark:text-[#B7A5FF] font-bold'
                    : 'text-slate-700 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#262634]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      char.imageUrl ||
                      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200'
                    }
                    alt={char.name}
                    style={{
                      borderColor: char.borderColor || char.color || '#EF4444',
                    }}
                    className="w-7 h-7 rounded-full object-cover border-2 shrink-0 shadow-2xs"
                  />
                  <span className="text-xs font-semibold truncate tracking-tight">
                    {char.name}
                  </span>
                </div>

                {/* More Options (⋮) Button (Edit mode only) */}
                {isEditMode && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuCharId(activeMenuCharId === char.id ? null : char.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuCharId === char.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl shadow-lg py-1 z-50 text-xs font-medium"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(char, e)}
                          className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-100 dark:border-[#2C2C38] text-center text-[11px] text-slate-400 dark:text-[#7D7B90]">
        <span>캐릭터 {characters.length}명 • 도넛 자동 정렬</span>
      </div>
    </div>
  );
};
