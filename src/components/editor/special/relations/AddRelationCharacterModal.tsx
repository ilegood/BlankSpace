import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  UserPlus,
  FileText,
  Search,
  Check,
  Sparkles,
  Link2,
  Upload,
} from 'lucide-react';
import { useWorkspace } from '../../../../store/WorkspaceContext';
import { RelationCharacter } from '../../../../types/relations';

interface AddRelationCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCharacters: RelationCharacter[];
  groups?: any[];
  onAddCharacter: (charData: Omit<RelationCharacter, 'id'>) => void;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop';

const PRESET_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#6B7280',
];

export const AddRelationCharacterModal: React.FC<AddRelationCharacterModalProps> = ({
  isOpen,
  onClose,
  existingCharacters,
  onAddCharacter,
}) => {
  const { documents } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab: 'direct' (직접 생성) vs 'sheet' (캐릭터 시트에서 가져오기)
  const [activeTab, setActiveTab] = useState<'direct' | 'sheet'>('direct');

  // Form State
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_AVATAR);
  const [color, setColor] = useState('#EF4444');

  // Search query for sheet import
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Character Sheet documents from the workspace
  const characterSheetDocs = useMemo(() => {
    return documents.filter(
      (doc) =>
        doc.templateType === 'character-sheet' ||
        doc.title.includes('캐릭터') ||
        doc.category === 'character'
    );
  }, [documents]);

  if (!isOpen) return null;

  // Local File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Submit Direct Creation
  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCharacter({
      name: name.trim(),
      imageUrl: imageUrl || DEFAULT_AVATAR,
      color,
      borderColor: color,
      shape: 'circle',
      size: 88,
      borderWidth: 4,
      showName: true,
      source: 'custom',
    });

    // Reset & Close
    setName('');
    setImageUrl(DEFAULT_AVATAR);
    onClose();
  };

  // Import from Character Sheet
  const handleImportSheet = (doc: any) => {
    onAddCharacter({
      name: doc.title || '새 캐릭터',
      imageUrl: DEFAULT_AVATAR,
      color: PRESET_COLORS[existingCharacters.length % PRESET_COLORS.length],
      borderColor: PRESET_COLORS[existingCharacters.length % PRESET_COLORS.length],
      shape: 'circle',
      size: 88,
      borderWidth: 4,
      showName: true,
      source: 'character-sheet',
      sourceDocumentId: doc.id,
      sourceDocumentTitle: doc.title,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E27] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#3A3948] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-[#E8E7EF] transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#2C2C38] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-lavender-600 dark:text-[#B7A5FF]" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              캐릭터 추가
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#2C2C38] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: 직접 생성 | 캐릭터 시트에서 가져오기 */}
        <div className="flex border-b border-slate-100 dark:border-[#2C2C38] bg-slate-50 dark:bg-[#262634] p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('direct')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'direct'
                ? 'bg-white dark:bg-[#1E1E27] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            직접 생성
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sheet'
                ? 'bg-white dark:bg-[#1E1E27] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>캐릭터 시트 연동</span>
          </button>
        </div>

        {/* Tab 1: 직접 생성 (이미지는 파일 업로드만) */}
        {activeTab === 'direct' && (
          <form onSubmit={handleDirectSubmit} className="p-5 space-y-4 text-xs">
            {/* Avatar File Upload Preview */}
            <div className="flex flex-col items-center justify-center py-2">
              <div
                style={{ borderColor: color, borderWidth: '4px' }}
                className="w-20 h-20 rounded-full overflow-hidden shadow-md bg-slate-100 dark:bg-[#262634] mb-3 relative group"
              >
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#262634] hover:bg-slate-200 dark:hover:bg-[#323244] text-slate-700 dark:text-[#E8E7EF] rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" />
                <span>이미지 파일 선택</span>
              </button>
            </div>

            {/* Character Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1">
                캐릭터 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: Liam"
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-2.5 bg-lavender-600 hover:bg-lavender-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                관계도에 캐릭터 추가
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: 캐릭터 시트에서 가져오기 */}
        {activeTab === 'sheet' && (
          <div className="p-4 space-y-3 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="작성된 캐릭터 시트 검색..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs text-slate-800 dark:text-[#E8E7EF] placeholder-slate-400 focus:outline-none focus:border-lavender-500"
              />
            </div>

            {/* Document List */}
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              {characterSheetDocs.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-[#7D7B90]">
                  작성된 캐릭터 시트 문서가 없습니다.
                </div>
              ) : (
                characterSheetDocs
                  .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((doc) => {
                    const isAlreadyAdded = existingCharacters.some(
                      (c) => c.sourceDocumentId === doc.id
                    );

                    return (
                      <div
                        key={doc.id}
                        onClick={() => !isAlreadyAdded && handleImportSheet(doc)}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          isAlreadyAdded
                            ? 'opacity-40 border-slate-200 dark:border-[#3A3948] cursor-not-allowed'
                            : 'border-slate-200/80 dark:border-[#3A3948] hover:border-lavender-400 hover:bg-lavender-50/40 dark:hover:bg-[#262634] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center font-bold shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-xs truncate">
                            {doc.title}
                          </span>
                        </div>

                        {isAlreadyAdded ? (
                          <span className="text-[10px] text-slate-400 font-medium">
                            이미 추가됨
                          </span>
                        ) : (
                          <span className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold">
                            + 추가하기
                          </span>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
