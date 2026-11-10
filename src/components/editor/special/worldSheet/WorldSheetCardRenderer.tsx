import React, { useState } from 'react';
import {
  WorldSheetItem,
  WorldDetailItem,
  WorldCategoryTag,
  WorldLocationItem,
  WorldReferenceImage,
} from '../../../../types/worldSheet';
import { useWorkspace } from '../../../../store/WorkspaceContext';
import { TEMPLATES } from '../../../../templates/templateList';
import { LinkDocumentModal } from './LinkDocumentModal';
import {
  ListPlus,
  Tag,
  FileText,
  StickyNote,
  MapPin,
  Image as ImageIcon,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  X,
  Edit2,
  ArrowRight,
  Maximize2,
  Palette,
  Check,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface WorldSheetCardRendererProps {
  item: WorldSheetItem;
  isEditMode: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<WorldSheetItem>) => void;
}

export const WorldSheetCardRenderer: React.FC<WorldSheetCardRendererProps> = ({
  item,
  isEditMode,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate,
}) => {
  const { documents, setActiveDocument, activeProject } = useWorkspace();
  const { customConfirm, toast } = useToast();

  // Document link modal state for location item or linked-docs card
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [targetLocationId, setTargetLocationId] = useState<string | null>(null);

  // Lightbox for image reference
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // New item inputs
  const [newTagInput, setNewTagInput] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');

  // ------------------------------------------------------------------
  // Header Icon Helper
  // ------------------------------------------------------------------
  const getItemIcon = () => {
    switch (item.type) {
      case 'detail-card':
        return <ListPlus className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />;
      case 'category-card':
        return <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'narrative-card':
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'memo-card':
        return <StickyNote className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'location-intro':
        return <MapPin className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'image-gallery':
        return <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'linked-documents':
        return <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getItemTypeBadge = () => {
    switch (item.type) {
      case 'detail-card':
        return '세부사항';
      case 'category-card':
        return '카테고리';
      case 'narrative-card':
        return '서술형';
      case 'memo-card':
        return '메모';
      case 'location-intro':
        return '지역 소개';
      case 'image-gallery':
        return '이미지 레퍼런스';
      case 'linked-documents':
        return '관련 문서';
    }
  };

  // ------------------------------------------------------------------
  // 1. Detail Card Handlers
  // ------------------------------------------------------------------
  const handleAddDetailItem = () => {
    const next: WorldDetailItem[] = [
      ...(item.detailItems || []),
      { id: `dt-${Date.now()}`, label: '새 항목', value: '내용을 입력하세요' },
    ];
    onUpdate({ detailItems: next });
  };

  const handleUpdateDetailItem = (id: string, updates: Partial<WorldDetailItem>) => {
    const next = (item.detailItems || []).map((it) =>
      it.id === id ? { ...it, ...updates } : it
    );
    onUpdate({ detailItems: next });
  };

  const handleDeleteDetailItem = (id: string) => {
    const next = (item.detailItems || []).filter((it) => it.id !== id);
    onUpdate({ detailItems: next });
  };

  // ------------------------------------------------------------------
  // 2. Category Card Handlers
  // ------------------------------------------------------------------
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const colors = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#6366F1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const next: WorldCategoryTag[] = [
      ...(item.categoryTags || []),
      { id: `tag-${Date.now()}`, text: newTagInput.trim(), color: randomColor },
    ];
    onUpdate({ categoryTags: next });
    setNewTagInput('');
  };

  const handleDeleteTag = (id: string) => {
    const next = (item.categoryTags || []).filter((t) => t.id !== id);
    onUpdate({ categoryTags: next });
  };

  // ------------------------------------------------------------------
  // 3. Location Intro Handlers
  // ------------------------------------------------------------------
  const handleAddLocation = () => {
    const next: WorldLocationItem[] = [
      ...(item.locations || []),
      {
        id: `loc-${Date.now()}`,
        name: '새 지역 명칭',
        imageUrl:
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
        summary: '해당 지역의 한 줄 소개를 입력하세요.',
        features: '지형 및 기후, 주요 특징',
      },
    ];
    onUpdate({ locations: next });
    toast.success('지역 항목이 추가되었습니다.');
  };

  const handleUpdateLocation = (id: string, updates: Partial<WorldLocationItem>) => {
    const next = (item.locations || []).map((loc) =>
      loc.id === id ? { ...loc, ...updates } : loc
    );
    onUpdate({ locations: next });
  };

  const handleDeleteLocation = (id: string) => {
    const next = (item.locations || []).filter((loc) => loc.id !== id);
    onUpdate({ locations: next });
  };

  const handleOpenLinkForLocation = (locId: string) => {
    setTargetLocationId(locId);
    setIsLinkModalOpen(true);
  };

  // ------------------------------------------------------------------
  // 4. Image Gallery Handlers
  // ------------------------------------------------------------------
  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast.warning('이미지 URL을 입력해주세요.');
      return;
    }
    const next: WorldReferenceImage[] = [
      ...(item.images || []),
      {
        id: `img-${Date.now()}`,
        imageUrl: newImageUrl.trim(),
        caption: newImageCaption.trim() || '세계관 레퍼런스 이미지',
        tag: '풍경 & 무드',
      },
    ];
    onUpdate({ images: next });
    setNewImageUrl('');
    setNewImageCaption('');
    toast.success('레퍼런스 이미지가 추가되었습니다.');
  };

  const handleDeleteImage = (id: string) => {
    const next = (item.images || []).filter((img) => img.id !== id);
    onUpdate({ images: next });
  };

  const handleUpdateImage = (id: string, updates: Partial<WorldReferenceImage>) => {
    const next = (item.images || []).map((img) =>
      img.id === id ? { ...img, ...updates } : img
    );
    onUpdate({ images: next });
  };

  // ------------------------------------------------------------------
  // 5. Linked Documents Card Handlers
  // ------------------------------------------------------------------
  const handleOpenLinkModalForCard = () => {
    setTargetLocationId(null);
    setIsLinkModalOpen(true);
  };

  const handleRemoveLinkedDoc = (docId: string) => {
    const next = (item.linkedDocIds || []).filter((id) => id !== docId);
    onUpdate({ linkedDocIds: next });
  };

  const handleApplyLinkedDocs = (docIds: string[]) => {
    if (targetLocationId) {
      // Connect to specific location
      const selectedId = docIds[0] || undefined;
      const targetDoc = documents.find((d) => d.id === selectedId);
      handleUpdateLocation(targetLocationId, {
        linkedDocId: selectedId,
        linkedDocTitle: targetDoc?.title,
      });
      toast.success('지역에 관련 문서가 연결되었습니다.');
    } else {
      // Connect to linked-documents card
      onUpdate({ linkedDocIds: docIds });
      toast.success('관련 문서 연결이 갱신되었습니다.');
    }
  };

  // Safe Document Link Navigator
  const handleNavigateToDoc = (docId: string) => {
    const docExists = documents.some((d) => d.id === docId);
    if (!docExists) {
      toast.warning('해당 문서가 삭제되었거나 존재하지 않습니다.');
      return;
    }
    setActiveDocument(docId);
  };

  // Memo Theme Colors
  const memoThemes = {
    yellow: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-700/50', text: 'text-amber-900 dark:text-amber-200' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-700/50', text: 'text-purple-900 dark:text-purple-200' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-700/50', text: 'text-blue-900 dark:text-blue-200' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-700/50', text: 'text-emerald-900 dark:text-emerald-200' },
    pink: { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-700/50', text: 'text-rose-900 dark:text-rose-200' },
  };

  const currentMemoTheme = memoThemes[item.memoTheme || 'yellow'];

  return (
    <div className="bg-white dark:bg-[#1E1E27] border border-slate-200/80 dark:border-[#3A3948] rounded-2xl p-5 shadow-xs transition-colors duration-200 flex flex-col gap-4">
      {/* 1. Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3A3948] gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#292936] shrink-0">
            {getItemIcon()}
          </div>

          {/* Card Title (Editable in Edit Mode) */}
          {isEditMode ? (
            <input
              type="text"
              value={item.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF] bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 hover:border-lavender-500 focus:border-lavender-500 focus:outline-hidden px-1 py-0.5 min-w-0 flex-1 truncate transition-colors"
              placeholder="카드 제목 입력"
            />
          ) : (
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
              {item.title}
            </h3>
          )}

          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#292936] text-slate-500 dark:text-[#A5A3B5] shrink-0">
            {getItemTypeBadge()}
          </span>
        </div>

        {/* Edit Controls: Reorder & Delete */}
        {isEditMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              title="위로 이동"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-md transition-colors disabled:opacity-20"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              title="아래로 이동"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-md transition-colors disabled:opacity-20"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="h-3.5 w-px bg-slate-200 dark:bg-[#3A3948] mx-0.5" />
            <button
              type="button"
              onClick={async () => {
                const confirmed = await customConfirm({
                  title: '항목 삭제',
                  message: `'${item.title}' 카드를 삭제하시겠습니까?`,
                  confirmText: '삭제',
                  isDanger: true,
                });
                if (confirmed) {
                  onDelete();
                  toast.info('항목이 삭제되었습니다.');
                }
              }}
              title="카드 삭제"
              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Card Content Body by Type */}
      <div className="flex-1 min-w-0">
        {/* ======================================================== */}
        {/* TYPE 1: 세부사항 카드 (Detail Card) */}
        {/* ======================================================== */}
        {item.type === 'detail-card' && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(item.detailItems || []).map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#252532] border border-slate-100 dark:border-[#3A3948] text-xs gap-3"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={it.label}
                        onChange={(e) =>
                          handleUpdateDetailItem(it.id, { label: e.target.value })
                        }
                        placeholder="속성명"
                        className="w-24 font-bold text-slate-500 dark:text-[#A5A3B5] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-hidden px-1 shrink-0"
                      />
                    ) : (
                      <span className="w-24 font-bold text-slate-500 dark:text-[#A5A3B5] shrink-0 truncate">
                        {it.label}
                      </span>
                    )}

                    <span className="text-slate-300 dark:text-[#4E4D61] shrink-0">|</span>

                    {isEditMode ? (
                      <input
                        type="text"
                        value={it.value}
                        onChange={(e) =>
                          handleUpdateDetailItem(it.id, { value: e.target.value })
                        }
                        placeholder="값 입력"
                        className="flex-1 font-semibold text-slate-800 dark:text-[#E8E7EF] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-hidden px-1 min-w-0"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800 dark:text-[#E8E7EF] break-words whitespace-pre-wrap flex-1">
                        {it.value}
                      </span>
                    )}
                  </div>

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDetailItem(it.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      title="속성 삭제"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={handleAddDetailItem}
                className="w-full py-2 border border-dashed border-slate-300 dark:border-[#3A3948] hover:border-lavender-400 text-slate-500 dark:text-[#A5A3B5] hover:text-lavender-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>속성 항목 추가</span>
              </button>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TYPE 2: 카테고리 카드 (Category Card) */}
        {/* ======================================================== */}
        {item.type === 'category-card' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(item.categoryTags || []).map((t) => (
                <span
                  key={t.id}
                  style={{
                    backgroundColor: t.color ? `${t.color}15` : undefined,
                    borderColor: t.color ? `${t.color}35` : undefined,
                    color: t.color || undefined,
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 break-words shadow-2xs"
                >
                  <span>#{t.text}</span>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(t.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}

              {(!item.categoryTags || item.categoryTags.length === 0) && (
                <div className="text-xs text-slate-400 dark:text-[#A5A3B5] py-1">
                  등록된 태그 키워드가 없습니다.
                </div>
              )}
            </div>

            {isEditMode && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
                <input
                  type="text"
                  placeholder="새 키워드 태그 입력 (예: 고대 정령술, 제국 연합)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-lavender-600 hover:bg-lavender-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                >
                  태그 추가
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TYPE 3: 서술형 카드 (Narrative Card) */}
        {/* ======================================================== */}
        {item.type === 'narrative-card' && (
          <div>
            {isEditMode ? (
              <textarea
                value={item.narrativeText || ''}
                onChange={(e) => onUpdate({ narrativeText: e.target.value })}
                placeholder="세계관의 개요, 창조 신화, 마법과 법칙 등을 서술하세요..."
                rows={6}
                className="w-full p-3.5 text-xs leading-relaxed bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF] resize-y"
              />
            ) : (
              <div className="text-xs leading-relaxed text-slate-700 dark:text-[#E8E7EF] whitespace-pre-wrap break-words py-1">
                {item.narrativeText || '내용이 작성되지 않았습니다.'}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TYPE 4: 메모 카드 (Memo Card) */}
        {/* ======================================================== */}
        {item.type === 'memo-card' && (
          <div className={`p-4 rounded-xl border ${currentMemoTheme.bg} ${currentMemoTheme.border} space-y-2.5`}>
            {isEditMode ? (
              <>
                <textarea
                  value={item.memoContent || ''}
                  onChange={(e) => onUpdate({ memoContent: e.target.value })}
                  placeholder="설정 아이디어 및 기획 메모를 자유롭게 작성하세요..."
                  rows={4}
                  className="w-full p-2.5 text-xs leading-relaxed bg-white/70 dark:bg-[#1E1E27]/70 border border-slate-200/50 dark:border-[#3A3948] rounded-lg focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF] resize-none"
                />
                {/* Theme Selector */}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-[#A5A3B5]">
                  <Palette className="w-3.5 h-3.5" />
                  <span>테마 색상:</span>
                  {(['yellow', 'purple', 'blue', 'green', 'pink'] as const).map((thm) => (
                    <button
                      key={thm}
                      type="button"
                      onClick={() => onUpdate({ memoTheme: thm })}
                      className={`w-4 h-4 rounded-full border ${
                        item.memoTheme === thm ? 'ring-2 ring-lavender-500 scale-110' : ''
                      } ${
                        thm === 'yellow'
                          ? 'bg-amber-300 border-amber-400'
                          : thm === 'purple'
                          ? 'bg-purple-300 border-purple-400'
                          : thm === 'blue'
                          ? 'bg-blue-300 border-blue-400'
                          : thm === 'green'
                          ? 'bg-emerald-300 border-emerald-400'
                          : 'bg-rose-300 border-rose-400'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${currentMemoTheme.text}`}>
                {item.memoContent || '작성된 메모가 없습니다.'}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TYPE 5: 추가 항목 1 - 지역 소개 (Location Intro) */}
        {/* ======================================================== */}
        {item.type === 'location-intro' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(item.locations || []).map((loc) => {
                const linkedDoc = documents.find((d) => d.id === loc.linkedDocId);

                return (
                  <div
                    key={loc.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#252532] border border-slate-100 dark:border-[#3A3948] flex flex-col gap-2.5 text-xs transition-shadow hover:shadow-xs relative"
                  >
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                        title="지역 삭제"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Image + Header Row */}
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-[#1E1E27] shrink-0 border border-slate-200 dark:border-[#3A3948] relative">
                        {loc.imageUrl ? (
                          <img
                            src={loc.imageUrl}
                            alt={loc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <MapPin className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={loc.name}
                            onChange={(e) =>
                              handleUpdateLocation(loc.id, { name: e.target.value })
                            }
                            placeholder="지역/장소 이름"
                            className="w-full font-bold text-slate-800 dark:text-[#E8E7EF] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-hidden px-1 text-xs"
                          />
                        ) : (
                          <h4 className="font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                            {loc.name}
                          </h4>
                        )}

                        {isEditMode ? (
                          <input
                            type="text"
                            value={loc.imageUrl || ''}
                            onChange={(e) =>
                              handleUpdateLocation(loc.id, { imageUrl: e.target.value })
                            }
                            placeholder="이미지 URL"
                            className="w-full text-[10px] text-slate-400 dark:text-[#A5A3B5] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-hidden px-1 mt-1 truncate"
                          />
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-[#A5A3B5] mt-1 line-clamp-2 break-words">
                            {loc.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Edit mode: Summary & Features Textarea */}
                    {isEditMode && (
                      <div className="space-y-1.5 mt-1">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-[#A5A3B5] block">
                            한 줄 소개
                          </label>
                          <input
                            type="text"
                            value={loc.summary}
                            onChange={(e) =>
                              handleUpdateLocation(loc.id, { summary: e.target.value })
                            }
                            placeholder="지역의 대표적인 한 줄 소개..."
                            className="w-full px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs text-slate-800 dark:text-[#E8E7EF]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 dark:text-[#A5A3B5] block">
                            주요 특징
                          </label>
                          <input
                            type="text"
                            value={loc.features}
                            onChange={(e) =>
                              handleUpdateLocation(loc.id, { features: e.target.value })
                            }
                            placeholder="지형, 랜드마크 등 주요 특징..."
                            className="w-full px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs text-slate-800 dark:text-[#E8E7EF]"
                          />
                        </div>
                      </div>
                    )}

                    {/* View mode: Features Badge */}
                    {!isEditMode && loc.features && (
                      <div className="text-[11px] text-slate-600 dark:text-[#A5A3B5] bg-slate-100/80 dark:bg-[#1E1E27] px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-[#3A3948] break-words">
                        <strong className="text-slate-700 dark:text-[#E8E7EF]">주요 특징:</strong>{' '}
                        {loc.features}
                      </div>
                    )}

                    {/* Linked Document Button / Navigator */}
                    <div className="pt-2 border-t border-slate-100 dark:border-[#3A3948] flex items-center justify-between">
                      {loc.linkedDocId ? (
                        <button
                          type="button"
                          onClick={() => handleNavigateToDoc(loc.linkedDocId!)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-lavender-600 dark:text-lavender-400 hover:text-lavender-700 transition-colors group"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[180px]">
                            {linkedDoc?.title || loc.linkedDocTitle || '지역 상세 문서'}
                          </span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <span className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5]">
                          연결된 상세 문서 없음
                        </span>
                      )}

                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleOpenLinkForLocation(loc.id)}
                          className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-200/60 dark:bg-[#3A3948] text-slate-600 dark:text-[#E8E7EF] hover:bg-lavender-100 dark:hover:bg-[#352E58] hover:text-lavender-700 transition-colors shrink-0"
                        >
                          {loc.linkedDocId ? '문서 변경' : '+ 문서 연결'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={handleAddLocation}
                className="w-full py-2.5 border border-dashed border-slate-300 dark:border-[#3A3948] hover:border-lavender-400 text-slate-500 dark:text-[#A5A3B5] hover:text-lavender-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>대표 지역 항목 추가</span>
              </button>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TYPE 6: 추가 항목 2 - 이미지 / 레퍼런스 (Image Gallery) */}
        {/* ======================================================== */}
        {item.type === 'image-gallery' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(item.images || []).map((img) => (
                <div
                  key={img.id}
                  className="group rounded-xl overflow-hidden border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#252532] flex flex-col relative transition-all hover:shadow-xs"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-[#1E1E27]">
                    <img
                      src={img.imageUrl}
                      alt={img.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onClick={() => setPreviewImageUrl(img.imageUrl)}
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewImageUrl(img.imageUrl)}
                      title="크게 보기"
                      className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        title="이미지 삭제"
                        className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 flex flex-col gap-1 text-xs">
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          value={img.caption}
                          onChange={(e) =>
                            handleUpdateImage(img.id, { caption: e.target.value })
                          }
                          placeholder="이미지 설명/캡션"
                          className="w-full font-bold text-slate-800 dark:text-[#E8E7EF] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-hidden text-xs"
                        />
                        <input
                          type="text"
                          value={img.tag || ''}
                          onChange={(e) =>
                            handleUpdateImage(img.id, { tag: e.target.value })
                          }
                          placeholder="분류 태그 (예: 건축, 풍경)"
                          className="w-full text-[10px] text-slate-400 dark:text-[#A5A3B5] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-hidden"
                        />
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                          {img.caption}
                        </div>
                        {img.tag && (
                          <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5]">
                            {img.tag}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Image Controls in Edit Mode */}
            {isEditMode && (
              <div className="p-3.5 bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="이미지 URL을 입력하세요 (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
                />
                <input
                  type="text"
                  placeholder="이미지 설명 (캡션)"
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                  className="w-full sm:w-48 px-3 py-1.5 text-xs bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="w-full sm:w-auto px-4 py-1.5 bg-lavender-600 hover:bg-lavender-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                >
                  이미지 추가
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TYPE 7: 추가 항목 3 - 관련 문서 연결 (Linked Documents) */}
        {/* ======================================================== */}
        {item.type === 'linked-documents' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(item.linkedDocIds || []).map((docId) => {
                const doc = documents.find((d) => d.id === docId);
                const tDef = doc ? TEMPLATES.find((t) => t.id === doc.templateType) : null;

                return (
                  <div
                    key={docId}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#252532] border border-slate-200/80 dark:border-[#3A3948] flex items-center justify-between text-xs group hover:border-lavender-300 dark:hover:border-lavender-600/60 transition-all cursor-pointer"
                    onClick={() => handleNavigateToDoc(docId)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-[#E8E7EF] truncate group-hover:text-lavender-600 dark:group-hover:text-lavender-400 transition-colors">
                          {doc ? doc.title : '삭제된 문서'}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5] block mt-0.5">
                          {tDef?.name || '문서'}
                        </span>
                      </div>
                    </div>

                    {isEditMode ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLinkedDoc(docId);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                        title="연결 해제"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-lavender-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    )}
                  </div>
                );
              })}

              {(!item.linkedDocIds || item.linkedDocIds.length === 0) && (
                <div className="col-span-full py-4 text-center text-xs text-slate-400 dark:text-[#A5A3B5] bg-slate-50 dark:bg-[#252532] rounded-xl border border-dashed border-slate-200 dark:border-[#3A3948]">
                  연결된 설정 문서가 없습니다.
                </div>
              )}
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={handleOpenLinkModalForCard}
                className="w-full py-2.5 border border-dashed border-slate-300 dark:border-[#3A3948] hover:border-lavender-400 text-slate-500 dark:text-[#A5A3B5] hover:text-lavender-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>관련 문서 연결 관리 (선택 및 검색)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Common Link Document Modal */}
      <LinkDocumentModal
        isOpen={isLinkModalOpen}
        selectedDocIds={
          targetLocationId
            ? (item.locations?.find((l) => l.id === targetLocationId)?.linkedDocId ? [item.locations.find((l) => l.id === targetLocationId)!.linkedDocId!] : [])
            : (item.linkedDocIds || [])
        }
        isMultiSelect={!targetLocationId}
        title={targetLocationId ? '지역과 연결할 상세 문서 선택' : '세계관 시트와 연결할 문서 선택'}
        onSelect={handleApplyLinkedDocs}
        onClose={() => {
          setIsLinkModalOpen(false);
          setTargetLocationId(null);
        }}
      />

      {/* 4. Lightbox Image Viewer */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img
              src={previewImageUrl}
              alt="확대 보기"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
