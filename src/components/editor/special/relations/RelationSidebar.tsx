import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  User,
  Trash2,
  Edit3,
  X,
  Upload,
} from 'lucide-react';
import { RelationCharacter } from '../../../../types/relations';
import { useToast } from '../../../toast/ToastContext';

interface RelationSidebarProps {
  characters: RelationCharacter[];
  selectedCharacterId: string | null;
  isEditMode: boolean;
  onSelectCharacter: (id: string | null) => void;
  onAddCharacter: (character: Omit<RelationCharacter, 'id'>) => void;
  onDeleteCharacter: (id: string) => void;
}

export const RelationSidebar: React.FC<RelationSidebarProps> = ({
  characters,
  selectedCharacterId,
  isEditMode,
  onSelectCharacter,
  onAddCharacter,
  onDeleteCharacter,
}) => {
  const { customConfirm } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Character Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddCharacter({
      name: newName.trim(),
      role: newRole.trim() || undefined,
      imageUrl: newImage.trim() || undefined,
      description: newDesc.trim() || undefined,
      color: '#8B5CF6',
    });

    setNewName('');
    setNewRole('');
    setNewImage('');
    setNewDesc('');
    setIsAddModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteClick = async (char: RelationCharacter, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await customConfirm({
      title: '캐릭터 삭제',
      message: `'${char.name}' 캐릭터를 삭제하시겠습니까? 연결된 모든 관계선도 함께 삭제됩니다.`,
      isDanger: true,
      confirmText: '삭제',
    });
    if (confirmed) {
      onDeleteCharacter(char.id);
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800 dark:text-dark-text">캐릭터 목록</span>
          <span className="px-1.5 py-0.2 bg-lavender-100 dark:bg-lavender-900/50 text-lavender-700 dark:text-lavender-300 text-[10px] font-bold rounded-full">
            {characters.length}
          </span>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-lavender-600 hover:bg-lavender-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            <span>추가</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100 dark:border-dark-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="캐릭터 이름 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-dark-text placeholder-slate-400 focus:outline-none focus:border-lavender-500 transition-colors"
          />
        </div>
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {filteredCharacters.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-dark-textSecondary">
            {searchQuery ? '일치하는 캐릭터가 없습니다.' : '등록된 캐릭터가 없습니다.'}
          </div>
        ) : (
          filteredCharacters.map((char) => {
            const isSelected = selectedCharacterId === char.id;

            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(isSelected ? null : char.id)}
                className={`group flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-lavender-50 dark:bg-lavender-900/30 border-lavender-300 dark:border-lavender-700 shadow-2xs'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-dark-elevated'
                }`}
              >
                {/* Circular Profile Avatar */}
                <div
                  className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 bg-slate-100 dark:bg-dark-surface flex items-center justify-center transition-transform ${
                    isSelected
                      ? 'border-lavender-600 ring-2 ring-lavender-300 dark:ring-lavender-800 scale-105'
                      : 'border-slate-200 dark:border-dark-border'
                  }`}
                >
                  {char.imageUrl ? (
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-4 h-4 text-slate-400 dark:text-dark-textSecondary" />
                  )}
                </div>

                {/* Name & Role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected
                          ? 'text-lavender-900 dark:text-lavender-200 font-bold'
                          : 'text-slate-800 dark:text-dark-text'
                      }`}
                    >
                      {char.name}
                    </span>
                  </div>
                  {char.role && (
                    <span className="text-[10px] text-slate-400 dark:text-dark-textSecondary truncate block mt-0.5">
                      {char.role}
                    </span>
                  )}
                </div>

                {/* Delete button (Edit mode only) */}
                {isEditMode && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(char, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                    title="캐릭터 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Character Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 dark:border-dark-border flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text">새 캐릭터 추가</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-dark-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-dark-text block mb-1">
                  이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 카일, 세이라"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-dark-text block mb-1">
                  역할 / 직책
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="예: 마법사, 기사단장"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-dark-text block mb-1">
                  프로필 이미지 (URL 또는 파일 업로드)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500"
                  />
                  <label className="px-2.5 py-1.5 border border-slate-200 dark:border-dark-border bg-slate-100 dark:bg-dark-elevated hover:bg-slate-200 dark:hover:bg-dark-surface rounded-xl cursor-pointer flex items-center justify-center text-slate-600 dark:text-dark-text">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-dark-text block mb-1">
                  간단 소개
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="캐릭터의 성격이나 배경 한줄 요약"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-textSecondary hover:bg-slate-100 dark:hover:bg-dark-elevated"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold shadow-xs"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
