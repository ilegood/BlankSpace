import React, { useState, useMemo } from 'react';
import {
  X,
  UserPlus,
  FileText,
  Search,
  Check,
  Sparkles,
  Link2,
  Image as ImageIcon,
  Shield,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../../../../store/WorkspaceContext';
import {
  RelationCharacter,
  NodeShape,
  RelationGroup,
} from '../../../../types/relations';

interface AddRelationCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCharacters: RelationCharacter[];
  groups: RelationGroup[];
  onAddCharacter: (charData: Omit<RelationCharacter, 'id'>) => void;
}

// Preset Avatars for direct creation
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop',
];

const PRESET_COLORS = [
  { label: '라벤더', value: '#8B5CF6' },
  { label: '스카이블루', value: '#0EA5E9' },
  { label: '에메랄드', value: '#10B981' },
  { label: '핑크', value: '#EC4899' },
  { label: '앰버', value: '#F59E0B' },
  { label: '로즈', value: '#EF4444' },
  { label: '슬레이트', value: '#64748B' },
];

export const AddRelationCharacterModal: React.FC<AddRelationCharacterModalProps> = ({
  isOpen,
  onClose,
  existingCharacters,
  groups,
  onAddCharacter,
}) => {
  const { documents, pages } = useWorkspace();

  // Tab: 'direct' (직접 생성) vs 'sheet' (캐릭터 시트에서 가져오기)
  const [activeTab, setActiveTab] = useState<'direct' | 'sheet'>('direct');

  // Form State for Direct Creation
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_AVATARS[0]);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [shape, setShape] = useState<NodeShape>('card');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

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

  // Map of documentId -> parsed character info
  const sheetDetailsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        characterName: string;
        role: string;
        imageUrl: string;
        affiliation: string;
      }
    >();

    characterSheetDocs.forEach((doc) => {
      let charName = doc.title;
      let charRole = '';
      let charImg = PRESET_AVATARS[0];
      let charAffiliation = '';

      const docPages = pages.filter((p) => p.documentId === doc.id);
      for (const p of docPages) {
        if (p.content && p.content.startsWith('{')) {
          try {
            const data = JSON.parse(p.content);
            if (Array.isArray(data.elements)) {
              // Extract Image
              const imgEl = data.elements.find(
                (el: any) =>
                  el.type === 'character-image' && el.content?.imageUrl
              );
              if (imgEl?.content?.imageUrl) {
                charImg = imgEl.content.imageUrl;
              }

              // Extract Name Badge
              const nameEl = data.elements.find(
                (el: any) => el.type === 'name-badge'
              );
              if (nameEl?.content?.nameFields) {
                const primaryField = nameEl.content.nameFields.find(
                  (f: any) => f.isPrimary
                );
                if (primaryField?.value) {
                  charName = primaryField.value;
                }
                const subField = nameEl.content.nameFields.find(
                  (f: any) => !f.isPrimary
                );
                if (subField?.value) {
                  charRole = subField.value;
                }
              }

              // Extract Info Card
              const infoEl = data.elements.find(
                (el: any) => el.type === 'info-card'
              );
              if (infoEl?.content?.infoCardItems) {
                const affItem = infoEl.content.infoCardItems.find((i: any) =>
                  i.label?.includes('소속')
                );
                if (affItem?.value) charAffiliation = affItem.value;
              }
            }
          } catch {}
        }
      }

      map.set(doc.id, {
        characterName: charName,
        role: charRole,
        imageUrl: charImg,
        affiliation: charAffiliation,
      });
    });

    return map;
  }, [characterSheetDocs, pages]);

  // Set of linked document IDs already in relations
  const linkedDocIds = useMemo(() => {
    return new Set(
      existingCharacters
        .filter((c) => c.source === 'character-sheet' && c.sourceDocumentId)
        .map((c) => c.sourceDocumentId!)
    );
  }, [existingCharacters]);

  if (!isOpen) return null;

  // Handle direct creation submit
  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCharacter({
      name: name.trim(),
      role: role.trim() || undefined,
      affiliation: affiliation.trim() || undefined,
      imageUrl: imageUrl.trim() || PRESET_AVATARS[0],
      description: description.trim() || undefined,
      color,
      shape,
      source: 'custom',
      groupId: selectedGroupId || undefined,
    });

    // Reset form
    setName('');
    setRole('');
    setAffiliation('');
    setDescription('');
    onClose();
  };

  // Handle import from Character Sheet
  const handleImportSheet = (docId: string) => {
    const doc = characterSheetDocs.find((d) => d.id === docId);
    if (!doc) return;

    const parsed = sheetDetailsMap.get(docId) || {
      characterName: doc.title,
      role: '',
      imageUrl: PRESET_AVATARS[0],
      affiliation: '',
    };

    onAddCharacter({
      name: parsed.characterName || doc.title,
      role: parsed.role || '캐릭터',
      affiliation: parsed.affiliation || undefined,
      imageUrl: parsed.imageUrl || PRESET_AVATARS[0],
      description: `${doc.title} 문서에서 가져온 캐릭터`,
      color: '#8B5CF6',
      shape: 'card',
      source: 'character-sheet',
      sourceDocumentId: doc.id,
      sourceDocumentTitle: doc.title,
      groupId: selectedGroupId || undefined,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-[#E8E7EF] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#3A3948] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-[#F3F2F8]">
                관계도에 새 캐릭터 추가
              </h3>
              <p className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                직접 캐릭터를 만들거나 기존 캐릭터 시트에서 가져오세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A2938] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 shrink-0">
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-[#262634] border border-slate-200/80 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'direct'
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>관계도에서 직접 생성</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'sheet'
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>캐릭터 시트에서 가져오기</span>
              <span className="px-1.5 py-0.2 rounded-md bg-lavender-100 dark:bg-[#352E58] text-[10px] font-mono text-lavender-700 dark:text-lavender-300">
                {characterSheetDocs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'direct' ? (
            /* TAB 1: 직접 생성 Form */
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              {/* Profile Image & Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-2">
                  대표 이미지 / 아바타
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-[#3A3948] shadow-xs shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="이미지 URL 직접 입력..."
                      className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] focus:border-lavender-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {PRESET_AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageUrl(av)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                            imageUrl === av
                              ? 'border-lavender-500 scale-105'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={av}
                            alt={`Preset ${idx}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Character Name & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1">
                    캐릭터 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 카일 아르젠"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] focus:border-lavender-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1">
                    이명 / 직업 / 역할
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="예: 새벽의 기사"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] focus:border-lavender-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Affiliation & Group */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1">
                    소속 / 세력
                  </label>
                  <input
                    type="text"
                    value={affiliation}
                    onChange={(e) => setAffiliation(e.target.value)}
                    placeholder="예: 노바 기사단"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] focus:border-lavender-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1">
                    관계도 그룹 지정
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] focus:border-lavender-500 focus:outline-none"
                  >
                    <option value="">그룹 없음 (자유 노드)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Node Shape */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1.5">
                  노드 표시 형태
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', title: '카드형 (추천)', desc: '사진+이름+소속' },
                    { id: 'circle', title: '원형', desc: '아바타 중심' },
                    { id: 'badge', title: '배지형', desc: '미니멀 칩' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShape(s.id as NodeShape)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        shape === s.id
                          ? 'border-lavender-500 bg-lavender-50 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF]'
                          : 'border-slate-200 dark:border-[#3A3948] hover:bg-slate-50 dark:hover:bg-[#262634]'
                      }`}
                    >
                      <div className="text-xs font-bold">{s.title}</div>
                      <div className="text-[10px] text-slate-400 dark:text-[#8E8B9E] mt-0.5">
                        {s.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1.5">
                  테마 색상
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      style={{ backgroundColor: c.value }}
                      className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center text-white ${
                        color === c.value
                          ? 'scale-125 ring-2 ring-offset-2 ring-lavender-500'
                          : 'hover:scale-110'
                      }`}
                      title={c.label}
                    >
                      {color === c.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* One-line Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1">
                  간단한 설명 / 한줄 소개
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="캐릭터의 성격이나 주요 서사를 입력하세요..."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] focus:border-lavender-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-[#3A3948]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100 dark:hover:bg-[#292936] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-lavender-600 hover:bg-lavender-500 text-white shadow-xs transition-colors disabled:opacity-40"
                >
                  관계도에 추가하기
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: 캐릭터 시트에서 가져오기 */
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-[#8E8B9E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="캐릭터 시트 제목 검색..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] focus:border-lavender-500 focus:outline-none"
                />
              </div>

              {/* Sheet Document Cards List */}
              {characterSheetDocs.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-[#3A3948] rounded-2xl text-xs text-slate-400 dark:text-[#8E8B9E]">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-[#524580]" />
                  <p className="font-semibold text-slate-600 dark:text-[#C5C3D4]">
                    등록된 캐릭터 시트가 없습니다.
                  </p>
                  <p className="text-[11px] mt-1">
                    [관계도에서 직접 생성] 탭을 이용해 캐릭터를 만들어 보세요!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                  {characterSheetDocs
                    .filter((d) =>
                      d.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((doc) => {
                      const details = sheetDetailsMap.get(doc.id) || {
                        characterName: doc.title,
                        role: '',
                        imageUrl: PRESET_AVATARS[0],
                        affiliation: '',
                      };
                      const isAlreadyAdded = linkedDocIds.has(doc.id);

                      return (
                        <div
                          key={doc.id}
                          className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                            isAlreadyAdded
                              ? 'bg-slate-50/60 dark:bg-[#1A1A22] border-slate-200/60 dark:border-[#2C2C38] opacity-75'
                              : 'bg-white dark:bg-[#242432] border-slate-200 dark:border-[#3A3948] hover:border-lavender-400 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={details.imageUrl}
                              alt={details.characterName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-[#3A3948] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-[#F3F2F8] truncate">
                                  {details.characterName || doc.title}
                                </h4>
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] shrink-0">
                                  시트
                                </span>
                              </div>
                              {details.role && (
                                <p className="text-[11px] text-slate-400 dark:text-[#8E8B9E] truncate">
                                  {details.role}
                                </p>
                              )}
                              {details.affiliation && (
                                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 truncate mt-0.5 font-medium">
                                  소속: {details.affiliation}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2F2F3E]">
                            <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E] font-mono truncate max-w-[120px]">
                              {doc.title}
                            </span>
                            {isAlreadyAdded ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>추가됨</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleImportSheet(doc.id)}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-lavender-600 hover:bg-lavender-500 text-white shadow-2xs transition-colors flex items-center gap-1"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>가져오기</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

