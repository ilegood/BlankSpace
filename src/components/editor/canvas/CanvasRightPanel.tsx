import React, { useState } from 'react';
import { Upload, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { CanvasCardItem } from '../../../types';
import { COMMON_CATALOG, SPECIAL_CATALOG, CatalogComponentDef } from './canvasCatalog';
import { CATEGORY_LABELS, TEMPLATES } from '../../../templates/templateList';
import { useWorkspace } from '../../../store/WorkspaceContext';

interface CanvasRightPanelProps {
  templateType: string;
  selectedCard: CanvasCardItem | null;
  allCards: CanvasCardItem[];
  onClearSelection: () => void;
  onAddComponent: (def: CatalogComponentDef) => void;
  onUpdateCard: (id: string, patch: Partial<CanvasCardItem>) => void;
  onDuplicateCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
}

export const CanvasRightPanel: React.FC<CanvasRightPanelProps> = ({
  templateType,
  selectedCard,
  allCards,
  onClearSelection,
  onAddComponent,
  onUpdateCard,
  onDuplicateCard,
  onDeleteCard,
}) => {
  const { documents } = useWorkspace();
  const [catalogTab, setCatalogTab] = useState<string>('common');

  const tpl = TEMPLATES.find((t) => t.id === templateType);
  const specialItems = SPECIAL_CATALOG[templateType] || [];
  const specialTabName =
    templateType === 'game-design-system'
      ? '게임 기획서'
      : templateType === 'design-modeling-sheet'
        ? '모델링'
        : templateType === 'design-animation-sheet'
          ? '애니메이션'
          : tpl
            ? CATEGORY_LABELS[tpl.category]
            : '전용';

  if (!selectedCard) {
    const isBlankCanvas = templateType === 'custom-blank-canvas';
    const customTabs = [
      { id: 'common', label: '공통', items: COMMON_CATALOG },
      { id: 'character-sheet', label: '캐릭터', items: SPECIAL_CATALOG['character-sheet'] || [] },
      { id: 'world-sheet', label: '세계관', items: SPECIAL_CATALOG['world-sheet'] || [] },
      { id: 'game-design-system', label: '게임 기획서', items: SPECIAL_CATALOG['game-design-system'] || [] },
      { id: 'design-modeling-sheet', label: '모델링', items: SPECIAL_CATALOG['design-modeling-sheet'] || [] },
      { id: 'design-animation-sheet', label: '애니메이션', items: SPECIAL_CATALOG['design-animation-sheet'] || [] },
    ];
    const items = isBlankCanvas
      ? customTabs.find((t) => t.id === catalogTab)?.items || COMMON_CATALOG
      : catalogTab === 'common'
        ? COMMON_CATALOG
        : specialItems;

    return (
      <aside
        key="catalog-panel"
        className="bs-animate-fade w-[290px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 overflow-y-auto select-none"
      >
        <div>
          <h2 className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">컴포넌트 추가</h2>
          <p className="mt-1 text-[11.5px] text-[#8A8998] leading-snug">
            클릭하거나 캔버스로 드래그해 배치하세요.
          </p>
        </div>

        {/* Filter Pills */}
        {isBlankCanvas ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {customTabs.map((ct) => (
              <button
                key={ct.id}
                type="button"
                onClick={() => setCatalogTab(ct.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  catalogTab === ct.id
                    ? 'border-[#6A5ACD] bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]'
                    : 'border-[#E6E3F0] dark:border-[#323244] text-[#6E6D7A] dark:text-[#9E9CAF]'
                }`}
              >
                {ct.label} {ct.items.length}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCatalogTab('common')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                catalogTab === 'common'
                  ? 'border-[#6A5ACD] bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]'
                  : 'border-[#E6E3F0] dark:border-[#323244] text-[#6E6D7A] dark:text-[#9E9CAF]'
              }`}
            >
              공통 {COMMON_CATALOG.length}
            </button>
            {specialItems.length > 0 && (
              <button
                type="button"
                onClick={() => setCatalogTab('special')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  catalogTab === 'special'
                    ? 'border-[#6A5ACD] bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]'
                    : 'border-[#E6E3F0] dark:border-[#323244] text-[#6E6D7A] dark:text-[#9E9CAF]'
                }`}
              >
                {specialTabName} {specialItems.length}
              </button>
            )}
          </div>
        )}

        {/* 2-Column Component Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((def) => (
            <button
              key={def.type}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-blankspace-component', def.type);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => onAddComponent(def)}
              className="bs-card-interactive rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] hover:border-[#6A5ACD] overflow-hidden text-left group cursor-grab active:cursor-grabbing"
            >
              <div className="h-14 bg-[#F5F4FB] dark:bg-[#242334] group-hover:bg-[#EBE8F5] dark:group-hover:bg-[#2E2A48] transition-colors flex items-center justify-center">
                <span className="text-[10px] font-semibold text-[#9A8FE6] opacity-0 group-hover:opacity-100 transition-opacity">
                  + 배치
                </span>
              </div>
              <div className="px-2.5 py-2 text-[11.5px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                {def.label}
              </div>
            </button>
          ))}
        </div>
      </aside>
    );
  }

  const d = selectedCard.data || {};
  const formulaCards = allCards.filter((c) => c.type === 'formula-card');
  const frameStripCards = allCards.filter((c) => c.type === 'frame-strip-card');
  const activeDocs = documents.filter((doc) => !doc.deletedAt);

  const handleUploadImage = (callback: (url: string, file?: File) => void, accept = 'image/*') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') callback(reader.result, file);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <aside
      key={`inspector-${selectedCard.id}`}
      className="bs-animate-fade w-[290px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-5 overflow-y-auto select-none"
    >
      <div>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-xs font-medium text-[#6A5ACD] dark:text-[#9A8FE6] hover:underline"
        >
          ← 컴포넌트 추가
        </button>
        <div className="mt-2 flex items-center gap-2">
          <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] py-0.5">
            {selectedCard.title}
          </div>
        </div>
      </div>

      {/* Card-Specific Content Controls */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-semibold text-[#8A8998]">내용</div>

        {/* 1. Profile Card */}
        {selectedCard.type === 'profile-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <input
              type="text"
              value={d.name || ''}
              onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, name: e.target.value } })}
              placeholder="캐릭터 이름"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
            <input
              type="text"
              value={d.nickname || ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, nickname: e.target.value } })
              }
              placeholder="별명"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleUploadImage((url) =>
                    onUpdateCard(selectedCard.id, { data: { ...d, imageUrl: url } })
                  )
                }
                className="flex-1 h-8 px-3 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-[#6A5ACD]"
              >
                <Upload className="w-3.5 h-3.5" />
                프로필 이미지 업로드
              </button>
              {d.imageUrl && (
                <button
                  type="button"
                  onClick={() => onUpdateCard(selectedCard.id, { data: { ...d, imageUrl: '' } })}
                  className="px-2.5 h-8 rounded-lg border border-rose-200 text-rose-500 text-xs font-semibold"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938] flex flex-col gap-2">
              <div className="text-[11px] font-semibold text-[#8A8998]">추가 프로필 정보</div>
              {(d.fields || []).map((f: any, idx: number) => (
                <div key={f.id || idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={f.label || ''}
                    placeholder="항목명"
                    onChange={(e) => {
                      const next = [...(d.fields || [])];
                      next[idx] = { ...next[idx], label: e.target.value };
                      onUpdateCard(selectedCard.id, { data: { ...d, fields: next } });
                    }}
                    className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                  />
                  <input
                    type="text"
                    value={f.value || ''}
                    placeholder="값"
                    onChange={(e) => {
                      const next = [...(d.fields || [])];
                      next[idx] = { ...next[idx], value: e.target.value };
                      onUpdateCard(selectedCard.id, { data: { ...d, fields: next } });
                    }}
                    className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (d.fields || []).filter((_: any, i: number) => i !== idx);
                      onUpdateCard(selectedCard.id, { data: { ...d, fields: next } });
                    }}
                    className="p-1 text-[#8A8998] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const next = [
                    ...(d.fields || []),
                    { id: `pf-${Date.now()}`, label: '항목', value: '내용' },
                  ];
                  onUpdateCard(selectedCard.id, { data: { ...d, fields: next } });
                }}
                className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
              >
                + 프로필 정보 추가
              </button>
            </div>
          </div>
        )}

        {/* 2. Image Card (photo only, no caption) */}
        {selectedCard.type === 'image-card' && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() =>
                handleUploadImage((url) =>
                  onUpdateCard(selectedCard.id, { data: { ...d, imageUrl: url } })
                )
              }
              className="h-8 px-3 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold flex items-center justify-center gap-1.5 hover:border-[#6A5ACD]"
            >
              <Upload className="w-3.5 h-3.5" />
              이미지 업로드
            </button>
            {d.imageUrl && (
              <button
                type="button"
                onClick={() => onUpdateCard(selectedCard.id, { data: { ...d, imageUrl: '' } })}
                className="h-8 px-3 rounded-lg border border-rose-200 text-rose-500 text-xs font-semibold"
              >
                이미지 제거
              </button>
            )}
          </div>
        )}

        {/* 3. Gallery Card */}
        {selectedCard.type === 'gallery-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                handleUploadImage((url) => {
                  const imgs = d.images || [];
                  onUpdateCard(selectedCard.id, { data: { ...d, images: [...imgs, url] } });
                })
              }
              className="h-8 px-3 rounded-lg border border-[#E6E3F0] dark:border-[#323244] font-semibold flex items-center justify-center gap-1.5 hover:border-[#6A5ACD]"
            >
              <Plus className="w-3.5 h-3.5" />
              사진 추가
            </button>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {(d.images || []).map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {img ? (
                      <img src={img} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#EBE8F5] dark:bg-[#2C2845] shrink-0" />
                    )}
                    <span className="truncate">사진 #{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleUploadImage((url) => {
                          const next = [...(d.images || [])];
                          next[idx] = url;
                          onUpdateCard(selectedCard.id, { data: { ...d, images: next } });
                        })
                      }
                      className="px-2 py-1 rounded bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] text-[10.5px] font-semibold"
                    >
                      변경
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (d.images || []).filter((_: string, i: number) => i !== idx);
                        onUpdateCard(selectedCard.id, { data: { ...d, images: next } });
                      }}
                      className="p-1 text-[#8A8998] hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Narrative Card */}
        {selectedCard.type === 'narrative-card' && (
          <>
            <input
              type="text"
              value={d.subtitle || ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, subtitle: e.target.value } })
              }
              placeholder="소제목"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
            />
            <textarea
              rows={4}
              value={d.text || ''}
              onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, text: e.target.value } })}
              className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs resize-none"
            />
          </>
        )}

        {/* 5. Section Heading */}
        {selectedCard.type === 'section-heading' && (
          <div className="flex flex-col gap-2 text-xs">
            <input
              type="text"
              value={d.heading ?? '구획 제목'}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, heading: e.target.value } })
              }
              placeholder="제목"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
            <input
              type="text"
              value={d.subheading ?? ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, subheading: e.target.value } })
              }
              placeholder="소제목"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
          </div>
        )}

        {/* 6. Detail Card */}
        {selectedCard.type === 'detail-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {(d.items || []).map((it: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={it.label || ''}
                  placeholder="항목"
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], label: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <input
                  type="text"
                  value={it.value || ''}
                  placeholder="값"
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], value: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (d.items || []).filter((_: any, i: number) => i !== idx);
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(d.items || []),
                  { label: `항목 ${(d.items?.length || 0) + 1}`, value: '값' },
                ];
                onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 항목 추가
            </button>
          </div>
        )}

        {/* 7. Tag Card */}
        {selectedCard.type === 'tag-card' && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(d.tags || []).map((t: string, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] text-[11px]"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => {
                      const next = (d.tags || []).filter((_: string, idx: number) => idx !== i);
                      onUpdateCard(selectedCard.id, { data: { ...d, tags: next } });
                    }}
                    className="hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('newTag') as HTMLInputElement;
                if (!input?.value.trim()) return;
                onUpdateCard(selectedCard.id, {
                  data: { ...d, tags: [...(d.tags || []), input.value.trim()] },
                });
                input.value = '';
              }}
              className="flex gap-1.5"
            >
              <input
                name="newTag"
                type="text"
                placeholder="새 태그"
                className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
              />
              <button
                type="submit"
                className="px-2.5 h-7 rounded-lg bg-[#6A5ACD] text-white text-xs font-semibold"
              >
                추가
              </button>
            </form>
          </div>
        )}

        {/* 8. Checklist Card */}
        {selectedCard.type === 'checklist-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {(d.items || []).map((it: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={Boolean(it.done)}
                  onChange={() => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], done: !next[idx].done };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="accent-[#6A5ACD]"
                />
                <input
                  type="text"
                  value={it.text || ''}
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], text: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (d.items || []).filter((_: any, i: number) => i !== idx);
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(d.items || []),
                  { text: `할 일 ${(d.items?.length || 0) + 1}`, done: false },
                ];
                onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 할 일 추가
            </button>
          </div>
        )}

        {/* 9. File Card */}
        {selectedCard.type === 'file-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                handleUploadImage(
                  (url, file) => {
                    if (!file) return;
                    const kb = file.size / 1024;
                    const sizeStr =
                      kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
                    const next = [
                      ...(d.files || []),
                      { name: file.name, size: sizeStr, dataUrl: url },
                    ];
                    onUpdateCard(selectedCard.id, { data: { ...d, files: next } });
                  },
                  '*/*'
                )
              }
              className="h-8 px-3 rounded-lg border border-[#E6E3F0] dark:border-[#323244] font-semibold flex items-center justify-center gap-1.5 hover:border-[#6A5ACD]"
            >
              <Upload className="w-3.5 h-3.5" />
              파일 업로드
            </button>
            {(d.files || []).map((f: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={f.name || ''}
                  onChange={(e) => {
                    const next = [...(d.files || [])];
                    next[idx] = { ...next[idx], name: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, files: next } });
                  }}
                  className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <span className="text-[10.5px] text-[#8A8998] shrink-0">{f.size}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = (d.files || []).filter((_: any, i: number) => i !== idx);
                    onUpdateCard(selectedCard.id, { data: { ...d, files: next } });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 10. Link Preview Card */}
        {selectedCard.type === 'link-preview-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <label className="text-[11px] text-[#8A8998]">연결할 문서</label>
            <select
              value={d.targetDocId || ''}
              onChange={(e) => {
                const chosen = activeDocs.find((x) => x.id === e.target.value);
                onUpdateCard(selectedCard.id, {
                  data: {
                    ...d,
                    targetDocId: e.target.value,
                    targetDocTitle: chosen?.title || '',
                  },
                });
              }}
              className="h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
            >
              <option value="">문서 선택 안 됨</option>
              {activeDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 11. External Link Card */}
        {selectedCard.type === 'external-link-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <input
              type="text"
              value={d.title || ''}
              onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, title: e.target.value } })}
              placeholder="링크 제목"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
            <input
              type="text"
              value={d.url || ''}
              onChange={(e) => {
                const urlVal = e.target.value;
                let domain = d.domain || '';
                try {
                  const u = new URL(urlVal.startsWith('http') ? urlVal : `https://${urlVal}`);
                  domain = u.hostname;
                } catch {
                  // ignore
                }
                onUpdateCard(selectedCard.id, { data: { ...d, url: urlVal, domain } });
              }}
              placeholder="https://example.com"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
          </div>
        )}

        {/* 12. Table Card */}
        {selectedCard.type === 'table-card' && (() => {
          const cols: string[] = d.columns || ['열 1', '열 2', '열 3'];
          const rows: string[][] = d.rows || [
            ['데이터 1', '100', '비고'],
            ['데이터 2', '250', '비고'],
          ];
          return (
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8A8998]">열 ({cols.length}개)</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextCols = [...cols, `열 ${cols.length + 1}`];
                    const nextRows = rows.map((r) => [...r, '']);
                    onUpdateCard(selectedCard.id, {
                      data: { ...d, columns: nextCols, rows: nextRows },
                    });
                  }}
                  className="text-[#6A5ACD] font-semibold hover:underline"
                >
                  + 열 추가
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {cols.map((c, ci) => (
                  <div key={ci} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={c}
                      onChange={(e) => {
                        const nextCols = [...cols];
                        nextCols[ci] = e.target.value;
                        onUpdateCard(selectedCard.id, { data: { ...d, columns: nextCols } });
                      }}
                      className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                    />
                    {cols.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextCols = cols.filter((_, i) => i !== ci);
                          const nextRows = rows.map((r) => r.filter((_, i) => i !== ci));
                          onUpdateCard(selectedCard.id, {
                            data: { ...d, columns: nextCols, rows: nextRows },
                          });
                        }}
                        className="p-1 text-[#8A8998] hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8A8998]">행 ({rows.length}개)</span>
                <button
                  type="button"
                  onClick={() => {
                    const nextRows = [...rows, cols.map(() => '새 데이터')];
                    onUpdateCard(selectedCard.id, { data: { ...d, rows: nextRows } });
                  }}
                  className="text-[#6A5ACD] font-semibold hover:underline"
                >
                  + 행 추가
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                {rows.map((r, ri) => (
                  <div
                    key={ri}
                    className="p-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-semibold text-[#8A8998]">행 #{ri + 1}</span>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextRows = rows.filter((_, i) => i !== ri);
                            onUpdateCard(selectedCard.id, { data: { ...d, rows: nextRows } });
                          }}
                          className="text-[10.5px] text-rose-500 hover:underline"
                        >
                          행 삭제
                        </button>
                      )}
                    </div>
                    {cols.map((colName, ci) => (
                      <div key={ci} className="flex items-center gap-1.5">
                        <span className="w-16 truncate text-[10.5px] text-[#8A8998]">{colName}</span>
                        <input
                          type="text"
                          value={r[ci] ?? ''}
                          onChange={(e) => {
                            const nextRows = rows.map((row, idx) =>
                              idx === ri
                                ? row.map((cell, cIdx) => (cIdx === ci ? e.target.value : cell))
                                : row
                            );
                            onUpdateCard(selectedCard.id, { data: { ...d, rows: nextRows } });
                          }}
                          className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 13. Quote Card */}
        {selectedCard.type === 'quote-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <textarea
              rows={3}
              value={d.quote || ''}
              onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, quote: e.target.value } })}
              placeholder="인용문 또는 대사"
              className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] resize-none"
            />
            <input
              type="text"
              value={d.source || ''}
              onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, source: e.target.value } })}
              placeholder="출처 / 화자"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
          </div>
        )}

        {/* 14. Video Card */}
        {selectedCard.type === 'video-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                handleUploadImage(
                  (url, file) =>
                    onUpdateCard(selectedCard.id, {
                      data: { ...d, videoUrl: url, title: file?.name || d.title || '동영상' },
                    }),
                  'video/*'
                )
              }
              className="h-8 px-3 rounded-lg border border-[#E6E3F0] dark:border-[#323244] font-semibold flex items-center justify-center gap-1.5 hover:border-[#6A5ACD]"
            >
              <Upload className="w-3.5 h-3.5" />
              동영상 파일 업로드
            </button>
            <input
              type="text"
              value={d.videoUrl?.startsWith('data:') ? '' : d.videoUrl || ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, videoUrl: e.target.value } })
              }
              placeholder="또는 동영상 URL 입력 (mp4, webm 등)"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
            <input
              type="text"
              value={d.title || ''}
              onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, title: e.target.value } })}
              placeholder="동영상 제목"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
          </div>
        )}

        {/* 15. Audio Card */}
        {selectedCard.type === 'audio-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <button
              type="button"
              onClick={() =>
                handleUploadImage(
                  (url, file) => {
                    const tempAudio = new Audio(url);
                    tempAudio.onloadedmetadata = () => {
                      const sec = Math.max(1, Math.round(tempAudio.duration || 0));
                      const m = Math.floor(sec / 60);
                      const s = String(sec % 60).padStart(2, '0');
                      onUpdateCard(selectedCard.id, {
                        data: {
                          ...d,
                          audioUrl: url,
                          fileName: file?.name || 'audio.mp3',
                          duration: `${m}:${s}`,
                        },
                      });
                    };
                    tempAudio.onerror = () => {
                      onUpdateCard(selectedCard.id, {
                        data: {
                          ...d,
                          audioUrl: url,
                          fileName: file?.name || 'audio.mp3',
                        },
                      });
                    };
                  },
                  'audio/*'
                )
              }
              className="h-8 px-3 rounded-lg border border-[#E6E3F0] dark:border-[#323244] font-semibold flex items-center justify-center gap-1.5 hover:border-[#6A5ACD]"
            >
              <Upload className="w-3.5 h-3.5" />
              오디오 파일 업로드
            </button>
            <input
              type="text"
              value={d.fileName || ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, fileName: e.target.value } })
              }
              placeholder="표시할 파일 이름"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
          </div>
        )}

        {/* 16. Memo Card */}
        {selectedCard.type === 'memo-card' && (
          <textarea
            rows={4}
            value={d.text || ''}
            onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, text: e.target.value } })}
            placeholder="메모 내용"
            className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs resize-none"
          />
        )}

        {/* Stat Card (with delete button per stat) */}
        {selectedCard.type === 'stat-card' && (
          <>
            <div className="flex flex-col gap-2">
              {(d.stats || []).map((st: any) => (
                <div key={st.id} className="flex items-center justify-between gap-1.5 text-xs">
                  <input
                    type="text"
                    value={st.label}
                    onChange={(e) => {
                      const next = (d.stats || []).map((x: any) =>
                        x.id === st.id ? { ...x, label: e.target.value } : x
                      );
                      onUpdateCard(selectedCard.id, { data: { ...d, stats: next } });
                    }}
                    className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={st.value}
                    onChange={(e) => {
                      const next = (d.stats || []).map((x: any) =>
                        x.id === st.id ? { ...x, value: Number(e.target.value) } : x
                      );
                      onUpdateCard(selectedCard.id, { data: { ...d, stats: next } });
                    }}
                    className="w-14 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs text-right"
                  />
                  <button
                    type="button"
                    title="항목 삭제"
                    onClick={() => {
                      const next = (d.stats || []).filter((x: any) => x.id !== st.id);
                      onUpdateCard(selectedCard.id, { data: { ...d, stats: next } });
                    }}
                    className="p-1 text-[#8A8998] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const next = [
                    ...(d.stats || []),
                    { id: `s-${Date.now()}`, label: `스탯 ${(d.stats?.length || 0) + 1}`, value: 50 },
                  ];
                  onUpdateCard(selectedCard.id, { data: { ...d, stats: next } });
                }}
                className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
              >
                + 항목 추가
              </button>
            </div>

            <div className="pt-2">
              <div className="text-[11px] font-semibold text-[#8A8998] mb-1.5">표시 방식</div>
              <div className="grid grid-cols-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5">
                {[
                  { id: 'number', label: '숫자' },
                  { id: 'bar', label: '막대' },
                  { id: 'radar', label: '레이더' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateCard(selectedCard.id, { data: { ...d, mode: m.id } })}
                    className={`py-1 rounded-[9px] text-xs font-semibold transition-colors ${
                      (d.mode || 'bar') === m.id
                        ? 'bg-[#6A5ACD] text-white'
                        : 'text-[#6E6D7A] dark:text-[#9E9CAF]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Relationship Summary Card */}
        {selectedCard.type === 'relationship-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {(d.items || []).map((it: any, idx: number) => (
              <div
                key={idx}
                className="p-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={it.name || ''}
                    placeholder="대상 이름"
                    onChange={(e) => {
                      const next = [...(d.items || [])];
                      next[idx] = { ...next[idx], name: e.target.value };
                      onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                    }}
                    className="w-24 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                  />
                  <input
                    type="text"
                    value={it.relation || ''}
                    placeholder="관계 설명"
                    onChange={(e) => {
                      const next = [...(d.items || [])];
                      next[idx] = { ...next[idx], relation: e.target.value };
                      onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                    }}
                    className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (d.items || []).filter((_: any, i: number) => i !== idx);
                      onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                    }}
                    className="p-1 text-[#8A8998] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <select
                  value={it.targetDocId || ''}
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], targetDocId: e.target.value || undefined };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                >
                  <option value="">연결 문서 없음</option>
                  {activeDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(d.items || []),
                  { name: '새 인물', relation: '관계' },
                ];
                onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 관계 추가
            </button>
          </div>
        )}

        {/* Chronicle Card */}
        {selectedCard.type === 'chronicle-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {(d.events || []).map((ev: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={ev.time || ''}
                  placeholder="시점"
                  onChange={(e) => {
                    const next = [...(d.events || [])];
                    next[idx] = { ...next[idx], time: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, events: next } });
                  }}
                  className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <input
                  type="text"
                  value={ev.title || ''}
                  placeholder="사건 내용"
                  onChange={(e) => {
                    const next = [...(d.events || [])];
                    next[idx] = { ...next[idx], title: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, events: next } });
                  }}
                  className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (d.events || []).filter((_: any, i: number) => i !== idx);
                    onUpdateCard(selectedCard.id, { data: { ...d, events: next } });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(d.events || []),
                  { time: `시점 ${(d.events?.length || 0) + 1}`, title: '새 사건' },
                ];
                onUpdateCard(selectedCard.id, { data: { ...d, events: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 사건 추가
            </button>
          </div>
        )}

        {/* Hierarchy Card */}
        {selectedCard.type === 'hierarchy-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {(d.items || []).map((it: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <select
                  value={it.level ?? 0}
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], level: Number(e.target.value) };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="w-16 h-7 px-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                >
                  <option value={0}>상위</option>
                  <option value={1}>중위</option>
                  <option value={2}>하위</option>
                  <option value={3}>말단</option>
                </select>
                <input
                  type="text"
                  value={it.label || ''}
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], label: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (d.items || []).filter((_: any, i: number) => i !== idx);
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...(d.items || []), { label: '새 계층 항목', level: 1 }];
                onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 계층 항목 추가
            </button>
          </div>
        )}

        {/* Category List Card */}
        {selectedCard.type === 'category-list-card' && (
          <div className="flex flex-col gap-2.5 text-xs">
            {(d.categories || []).map((cat: any, cIdx: number) => (
              <div
                key={cIdx}
                className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] flex flex-col gap-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={cat.name || ''}
                    placeholder="분류명"
                    onChange={(e) => {
                      const next = [...(d.categories || [])];
                      next[cIdx] = { ...next[cIdx], name: e.target.value };
                      onUpdateCard(selectedCard.id, { data: { ...d, categories: next } });
                    }}
                    className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (d.categories || []).filter((_: any, i: number) => i !== cIdx);
                      onUpdateCard(selectedCard.id, { data: { ...d, categories: next } });
                    }}
                    className="p-1 text-[#8A8998] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {(cat.items || []).map((itemText: string, iIdx: number) => (
                  <div key={iIdx} className="flex items-center gap-1.5 pl-2">
                    <input
                      type="text"
                      value={itemText}
                      onChange={(e) => {
                        const next = [...(d.categories || [])];
                        const nextItems = [...(next[cIdx].items || [])];
                        nextItems[iIdx] = e.target.value;
                        next[cIdx] = { ...next[cIdx], items: nextItems };
                        onUpdateCard(selectedCard.id, { data: { ...d, categories: next } });
                      }}
                      className="flex-1 h-6 px-2 rounded border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...(d.categories || [])];
                        next[cIdx] = {
                          ...next[cIdx],
                          items: (next[cIdx].items || []).filter((_: string, i: number) => i !== iIdx),
                        };
                        onUpdateCard(selectedCard.id, { data: { ...d, categories: next } });
                      }}
                      className="text-[#8A8998] hover:text-rose-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(d.categories || [])];
                    next[cIdx] = {
                      ...next[cIdx],
                      items: [...(next[cIdx].items || []), '새 항목'],
                    };
                    onUpdateCard(selectedCard.id, { data: { ...d, categories: next } });
                  }}
                  className="text-left text-[11px] font-semibold text-[#6A5ACD] pl-2 hover:underline"
                >
                  + 하위 항목 추가
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(d.categories || []),
                  { name: `분류 ${(d.categories?.length || 0) + 1}`, items: ['항목 1'] },
                ];
                onUpdateCard(selectedCard.id, { data: { ...d, categories: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 새 분류 추가
            </button>
          </div>
        )}

        {/* Zone Card */}
        {selectedCard.type === 'zone-card' && (
          <div className="flex flex-col gap-2.5 text-xs">
            <input
              type="text"
              value={d.zoneTitle || ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, zoneTitle: e.target.value } })
              }
              placeholder="지역군 제목"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
            />
            {(d.places || []).map((pl: any, idx: number) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <input
                    type="text"
                    value={pl.label || ''}
                    placeholder="장소 이름"
                    onChange={(e) => {
                      const next = [...(d.places || [])];
                      next[idx] = { ...next[idx], label: e.target.value };
                      onUpdateCard(selectedCard.id, { data: { ...d, places: next } });
                    }}
                    className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (d.places || []).filter((_: any, i: number) => i !== idx);
                      onUpdateCard(selectedCard.id, { data: { ...d, places: next } });
                    }}
                    className="p-1 text-[#8A8998] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={pl.description || ''}
                  placeholder="장소 설명"
                  onChange={(e) => {
                    const next = [...(d.places || [])];
                    next[idx] = { ...next[idx], description: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, places: next } });
                  }}
                  className="h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleUploadImage((url) => {
                        const next = [...(d.places || [])];
                        next[idx] = { ...next[idx], imageUrl: url };
                        onUpdateCard(selectedCard.id, { data: { ...d, places: next } });
                      })
                    }
                    className="px-2.5 h-7 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-[11px] font-semibold hover:border-[#6A5ACD]"
                  >
                    사진 업로드
                  </button>
                  <select
                    value={pl.linkedDocId || ''}
                    onChange={(e) => {
                      const next = [...(d.places || [])];
                      next[idx] = { ...next[idx], linkedDocId: e.target.value || undefined };
                      onUpdateCard(selectedCard.id, { data: { ...d, places: next } });
                    }}
                    className="flex-1 min-w-0 h-7 px-1.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-[11px]"
                  >
                    <option value="">문서 연결 없음</option>
                    {activeDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(d.places || []),
                  { label: `구역 ${(d.places?.length || 0) + 1}`, description: '구역 설명' },
                ];
                onUpdateCard(selectedCard.id, { data: { ...d, places: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 구역 추가
            </button>
          </div>
        )}

        {/* SWOT Card */}
        {selectedCard.type === 'swot-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {[
              { key: 'strength', label: '강점 (S)' },
              { key: 'weakness', label: '약점 (W)' },
              { key: 'opportunity', label: '기회 (O)' },
              { key: 'threat', label: '위협 (T)' },
            ].map((item) => (
              <label key={item.key} className="flex flex-col gap-1">
                <span className="text-[11px] text-[#8A8998]">{item.label}</span>
                <input
                  type="text"
                  value={d[item.key] || ''}
                  onChange={(e) =>
                    onUpdateCard(selectedCard.id, {
                      data: { ...d, [item.key]: e.target.value },
                    })
                  }
                  className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
              </label>
            ))}
          </div>
        )}

        {/* Rule Card */}
        {selectedCard.type === 'rule-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {[
              { key: 'ruleName', label: '규칙 이름' },
              { key: 'condition', label: '발동 조건' },
              { key: 'result', label: '결과' },
              { key: 'exception', label: '예외' },
            ].map((item) => (
              <label key={item.key} className="flex flex-col gap-1">
                <span className="text-[11px] text-[#8A8998]">{item.label}</span>
                <input
                  type="text"
                  value={d[item.key] || ''}
                  onChange={(e) =>
                    onUpdateCard(selectedCard.id, {
                      data: { ...d, [item.key]: e.target.value },
                    })
                  }
                  className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
              </label>
            ))}
          </div>
        )}

        {/* Formula Card */}
        {selectedCard.type === 'formula-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[#8A8998]">공식 표기</span>
              <input
                type="text"
                value={d.formulaText || ''}
                onChange={(e) =>
                  onUpdateCard(selectedCard.id, { data: { ...d, formulaText: e.target.value } })
                }
                placeholder="피해량 = 공격력 × 계수"
                className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>변수 A</span>
              <input
                type="number"
                value={d.varA ?? 10}
                onChange={(e) =>
                  onUpdateCard(selectedCard.id, { data: { ...d, varA: Number(e.target.value) } })
                }
                className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>변수 B</span>
              <input
                type="number"
                step="0.1"
                value={d.varB ?? 1.5}
                onChange={(e) =>
                  onUpdateCard(selectedCard.id, { data: { ...d, varB: Number(e.target.value) } })
                }
                className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
              />
            </label>
          </div>
        )}

        {/* Difficulty Curve Card */}
        {selectedCard.type === 'difficulty-curve-card' && (
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="text-[11px] font-semibold text-[#8A8998]">실측 값 출처</div>
            <div className="grid grid-cols-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateCard(selectedCard.id, { data: { ...d, actualSource: 'manual' } })
                }
                className={`py-1 rounded-[9px] text-xs font-semibold ${
                  d.actualSource === 'manual' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                }`}
              >
                직접 입력
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateCard(selectedCard.id, {
                    data: {
                      ...d,
                      actualSource: 'formula',
                      linkedFormulaId: d.linkedFormulaId || formulaCards[0]?.id || '',
                    },
                  })
                }
                className={`py-1 rounded-[9px] text-xs font-semibold ${
                  d.actualSource !== 'manual' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                }`}
              >
                공식 연결
              </button>
            </div>
            {d.actualSource !== 'manual' && formulaCards.length > 0 && (
              <select
                value={d.linkedFormulaId || formulaCards[0]?.id || ''}
                onChange={(e) =>
                  onUpdateCard(selectedCard.id, {
                    data: { ...d, linkedFormulaId: e.target.value },
                  })
                }
                className="h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
              >
                {formulaCards.map((fc, idx) => (
                  <option key={fc.id} value={fc.id}>
                    수치 공식 #{idx + 1} ({fc.data?.formulaText || fc.title})
                  </option>
                ))}
              </select>
            )}
            <p className="text-[10.5px] text-[#8A8998]">
              직접 입력 모드에서는 그래프 포인트를 위아래로 드래그해 조절할 수 있으며, 공식 연결 시 같은 색 테두리로 표시됩니다.
            </p>
          </div>
        )}

        {/* Probability Card */}
        {selectedCard.type === 'probability-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {(d.items || []).map((it: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1">
                <input
                  type="text"
                  value={it.name || ''}
                  placeholder="이름"
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], name: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <input
                  type="text"
                  value={it.value || ''}
                  placeholder="값"
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], value: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <input
                  type="text"
                  value={it.prob || ''}
                  placeholder="확률"
                  onChange={(e) => {
                    const next = [...(d.items || [])];
                    next[idx] = { ...next[idx], prob: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="w-16 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (d.items || []).filter((_: any, i: number) => i !== idx);
                    onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [
                  ...(d.items || []),
                  { name: `등급 ${(d.items?.length || 0) + 1}`, value: '보상', prob: '10%' },
                ];
                onUpdateCard(selectedCard.id, { data: { ...d, items: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 확률 행 추가
            </button>
          </div>
        )}

        {/* Turnaround Card */}
        {selectedCard.type === 'turnaround-card' && (
          <div className="flex flex-col gap-2 text-xs">
            {(d.views || []).map((v: any, idx: number) => (
              <div
                key={idx}
                className="p-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] flex items-center justify-between gap-1.5"
              >
                <input
                  type="text"
                  value={typeof v === 'string' ? v : v.label || ''}
                  onChange={(e) => {
                    const next = [...(d.views || [])];
                    const cur = typeof next[idx] === 'string' ? { label: next[idx] } : next[idx];
                    next[idx] = { ...cur, label: e.target.value };
                    onUpdateCard(selectedCard.id, { data: { ...d, views: next } });
                  }}
                  className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleUploadImage((url) => {
                      const next = [...(d.views || [])];
                      const cur = typeof next[idx] === 'string' ? { label: next[idx] } : next[idx];
                      next[idx] = { ...cur, imageUrl: url };
                      onUpdateCard(selectedCard.id, { data: { ...d, views: next } });
                    })
                  }
                  className="px-2.5 h-7 rounded-lg bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] text-[11px] font-semibold"
                >
                  이미지 업로드
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = (d.views || []).filter((_: any, i: number) => i !== idx);
                    onUpdateCard(selectedCard.id, { data: { ...d, views: next } });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...(d.views || []), { label: '추가 뷰', imageUrl: '' }];
                onUpdateCard(selectedCard.id, { data: { ...d, views: next } });
              }}
              className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 뷰 슬롯 추가
            </button>
          </div>
        )}

        {/* Palette Card */}
        {selectedCard.type === 'palette-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8A8998]">색상 수: {(d.colors || []).length}</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateCard(selectedCard.id, {
                    data: { ...d, colors: [...(d.colors || []), '#6A5ACD'] },
                  })
                }
                className="inline-flex items-center gap-1 text-[#6A5ACD] font-semibold hover:underline"
              >
                <Plus className="w-3 h-3" />
                색상 추가
              </button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
              {(d.colors || []).map((c: string, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span
                    className="w-6 h-6 rounded-md border border-black/15 dark:border-white/15 shrink-0"
                    style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(c) ? c : '#6A5ACD' }}
                  />
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => {
                      const next = [...(d.colors || [])];
                      next[idx] = e.target.value;
                      onUpdateCard(selectedCard.id, { data: { ...d, colors: next } });
                    }}
                    className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs font-mono"
                  />
                  <button
                    type="button"
                    disabled={idx === 0}
                    title="위로 이동"
                    onClick={() => {
                      if (idx === 0) return;
                      const next = [...(d.colors || [])];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      onUpdateCard(selectedCard.id, { data: { ...d, colors: next } });
                    }}
                    className="p-0.5 rounded text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white disabled:opacity-25"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === (d.colors || []).length - 1}
                    title="아래로 이동"
                    onClick={() => {
                      const list = d.colors || [];
                      if (idx >= list.length - 1) return;
                      const next = [...list];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      onUpdateCard(selectedCard.id, { data: { ...d, colors: next } });
                    }}
                    className="p-0.5 rounded text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white disabled:opacity-25"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="색상 삭제"
                    onClick={() => {
                      const next = (d.colors || []).filter((_: string, i: number) => i !== idx);
                      onUpdateCard(selectedCard.id, { data: { ...d, colors: next } });
                    }}
                    className="p-1 rounded text-[#8A8998] hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Animation Card */}
        {selectedCard.type === 'animation-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[#8A8998]">연결할 프레임 스트립</span>
              <select
                value={d.linkedStripId || ''}
                onChange={(e) => {
                  const stripId = e.target.value;
                  const targetStrip = frameStripCards.find((s) => s.id === stripId);
                  onUpdateCard(selectedCard.id, {
                    data: {
                      ...d,
                      linkedStripId: stripId || undefined,
                      frames: targetStrip?.data?.frameCount ?? d.frames ?? 6,
                    },
                  });
                }}
                className="h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
              >
                <option value="">프레임 스트립 선택 안 됨</option>
                {frameStripCards.map((sc, idx) => (
                  <option key={sc.id} value={sc.id}>
                    프레임 스트립 #{idx + 1} ({sc.data?.frameCount || 6}프레임)
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center justify-between">
              <span>이름</span>
              <input
                type="text"
                value={d.name || ''}
                onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, name: e.target.value } })}
                className="w-32 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>프레임 수</span>
              <input
                type="number"
                min={1}
                max={64}
                value={d.frames ?? 6}
                onChange={(e) => {
                  const nextFrames = Math.max(1, Number(e.target.value) || 1);
                  onUpdateCard(selectedCard.id, { data: { ...d, frames: nextFrames } });
                  const linkedStrip =
                    frameStripCards.find((s) => s.id === d.linkedStripId) || frameStripCards[0];
                  if (linkedStrip) {
                    onUpdateCard(linkedStrip.id, {
                      data: { ...linkedStrip.data, frameCount: nextFrames },
                    });
                  }
                }}
                className="w-24 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>길이(초)</span>
              <input
                type="number"
                step="0.1"
                min={0.1}
                value={d.durationSec ?? 1}
                onChange={(e) =>
                  onUpdateCard(selectedCard.id, {
                    data: { ...d, durationSec: Number(e.target.value) },
                  })
                }
                className="w-24 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
              />
            </label>
            <label className="flex items-center justify-between pt-1">
              <span>반복</span>
              <input
                type="checkbox"
                checked={Boolean(d.loop)}
                onChange={(e) =>
                  onUpdateCard(selectedCard.id, { data: { ...d, loop: e.target.checked } })
                }
                className="accent-[#6A5ACD]"
              />
            </label>
          </div>
        )}

        {/* Frame Strip Card */}
        {selectedCard.type === 'frame-strip-card' && (
          <div className="flex flex-col gap-2 text-xs">
            <label className="flex items-center justify-between">
              <span>프레임 수</span>
              <input
                type="number"
                min={1}
                max={64}
                value={d.frameCount ?? 6}
                onChange={(e) => {
                  const nextCount = Math.max(1, Number(e.target.value) || 1);
                  onUpdateCard(selectedCard.id, { data: { ...d, frameCount: nextCount } });
                }}
                className="w-20 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
              />
            </label>
            <p className="text-[10.5px] text-[#8A8998]">
              캔버스의 각 프레임 슬롯을 클릭해 프레임별 이미지를 업로드할 수 있습니다.
            </p>
          </div>
        )}

        {/* Texture Map Card */}
        {selectedCard.type === 'texture-map-card' && (
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="text-[11px] font-semibold text-[#8A8998]">표시 방식</div>
            <div className="grid grid-cols-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5">
              <button
                type="button"
                onClick={() => onUpdateCard(selectedCard.id, { data: { ...d, displayMode: 'row' } })}
                className={`py-1 rounded-[9px] text-xs font-semibold ${
                  d.displayMode !== 'grid' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                }`}
              >
                나란히
              </button>
              <button
                type="button"
                onClick={() => onUpdateCard(selectedCard.id, { data: { ...d, displayMode: 'grid' } })}
                className={`py-1 rounded-[9px] text-xs font-semibold ${
                  d.displayMode === 'grid' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                }`}
              >
                격자
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
              {(d.maps || []).map((m: any, idx: number) => (
                <div
                  key={m.id || idx}
                  className="p-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={m.name || ''}
                      onChange={(e) => {
                        const next = [...(d.maps || [])];
                        next[idx] = { ...next[idx], name: e.target.value };
                        onUpdateCard(selectedCard.id, { data: { ...d, maps: next } });
                      }}
                      className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] font-semibold"
                    />
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        const next = [...(d.maps || [])];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        onUpdateCard(selectedCard.id, { data: { ...d, maps: next } });
                      }}
                      className="p-0.5 text-[#8A8998] disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (d.maps || []).length - 1}
                      onClick={() => {
                        const list = d.maps || [];
                        if (idx >= list.length - 1) return;
                        const next = [...list];
                        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                        onUpdateCard(selectedCard.id, { data: { ...d, maps: next } });
                      }}
                      className="p-0.5 text-[#8A8998] disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (d.maps || []).filter((_: any, i: number) => i !== idx);
                        onUpdateCard(selectedCard.id, { data: { ...d, maps: next } });
                      }}
                      className="p-1 text-[#8A8998] hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUploadImage((url, file) => {
                        const next = [...(d.maps || [])];
                        next[idx] = {
                          ...next[idx],
                          imageUrl: url,
                          fileName: file?.name || next[idx].fileName,
                        };
                        onUpdateCard(selectedCard.id, { data: { ...d, maps: next } });
                      })
                    }
                    className="h-7 rounded-lg bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] text-[11px] font-semibold"
                  >
                    이미지 업로드
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const maps = d.maps || [];
                const presets = ['BaseColor', 'Normal', 'Roughness', 'Metallic', 'AO', 'Emissive'];
                const nextName = presets[maps.length % presets.length];
                const colors = ['#787BFF', '#5B64EC', '#9BA1D1', '#6A5ACD', '#888DA8', '#F59E0B'];
                onUpdateCard(selectedCard.id, {
                  data: {
                    ...d,
                    maps: [
                      ...maps,
                      {
                        id: `m-${Date.now()}`,
                        name: nextName,
                        resolution: '2048×2048',
                        fileName: `${nextName.toLowerCase()}.png`,
                        color: colors[maps.length % colors.length],
                      },
                    ],
                  },
                });
              }}
              className="h-8 rounded-lg border border-dashed border-[#B6ACEA] text-xs font-semibold text-[#6A5ACD] hover:bg-[#F3F1FB]"
            >
              + 텍스처 맵 슬롯 추가
            </button>
          </div>
        )}
      </div>

      {/* Collapsible Toggle */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938]">
        <div className="flex items-center justify-between text-xs">
          <span>접기 가능</span>
          <button
            type="button"
            onClick={() =>
              onUpdateCard(selectedCard.id, { collapsible: !selectedCard.collapsible })
            }
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
              selectedCard.collapsible ? 'bg-[#6A5ACD]' : 'bg-[#DCD8EC] dark:bg-[#323244]'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                selectedCard.collapsible ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-[#6E6D7A]">
          <span>처음 열 때 접힌 상태</span>
          <button
            type="button"
            onClick={() => onUpdateCard(selectedCard.id, { collapsed: !selectedCard.collapsed })}
            className="text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6]"
          >
            {selectedCard.collapsed ? '켜짐' : '끄기'}
          </button>
        </div>
      </div>

      {/* Style Controls */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938] text-xs">
        <div className="text-[11px] font-semibold text-[#8A8998]">스타일</div>
        <label className="flex items-center justify-between gap-2">
          <span>모서리 ({selectedCard.style?.borderRadius ?? 12}px)</span>
          <input
            type="range"
            min={0}
            max={28}
            value={selectedCard.style?.borderRadius ?? 12}
            onChange={(e) =>
              onUpdateCard(selectedCard.id, {
                style: { ...selectedCard.style, borderRadius: Number(e.target.value) },
              })
            }
            className="w-24 accent-[#6A5ACD]"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>테두리 ({selectedCard.style?.borderWidth ?? 1}px)</span>
          <input
            type="range"
            min={0}
            max={4}
            value={selectedCard.style?.borderWidth ?? 1}
            onChange={(e) =>
              onUpdateCard(selectedCard.id, {
                style: { ...selectedCard.style, borderWidth: Number(e.target.value) },
              })
            }
            className="w-24 accent-[#6A5ACD]"
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span>여백 ({selectedCard.style?.padding ?? 14}px)</span>
          <input
            type="range"
            min={8}
            max={28}
            value={selectedCard.style?.padding ?? 14}
            onChange={(e) =>
              onUpdateCard(selectedCard.id, {
                style: { ...selectedCard.style, padding: Number(e.target.value) },
              })
            }
            className="w-24 accent-[#6A5ACD]"
          />
        </label>
      </div>

      {/* Duplicate & Delete Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => onDuplicateCard(selectedCard.id)}
          className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold hover:border-[#6A5ACD]"
        >
          복제
        </button>
        <button
          type="button"
          onClick={() => onDeleteCard(selectedCard.id)}
          className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 inline-flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          삭제
        </button>
      </div>
    </aside>
  );
};
