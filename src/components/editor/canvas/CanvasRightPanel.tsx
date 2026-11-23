import React, { useState } from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';
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
  const [catalogTab, setCatalogTab] = useState<'common' | 'special'>('common');

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
    const items = catalogTab === 'common' ? COMMON_CATALOG : specialItems;

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

        {/* Filter Pills matching PDF Page 8, 20, 29, 43 */}
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

        {/* 2-Column Component Cards (click or drag to canvas) */}
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
  const activeDocs = documents.filter((doc) => !doc.deletedAt);

  const handleUploadImage = (callback: (url: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') callback(reader.result);
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
          <input
            type="text"
            value={selectedCard.title}
            onChange={(e) => onUpdateCard(selectedCard.id, { title: e.target.value })}
            className="w-full text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] bg-transparent border-b border-transparent focus:border-[#6A5ACD] focus:outline-none py-0.5"
          />
        </div>
      </div>

      {/* Card-Specific Content Controls */}
      <div className="flex flex-col gap-3">
        <div className="text-[11px] font-semibold text-[#8A8998]">내용</div>

        {selectedCard.type === 'profile-card' && (
          <>
            <input
              type="text"
              value={d.name || ''}
              onChange={(e) => onUpdateCard(selectedCard.id, { data: { ...d, name: e.target.value } })}
              placeholder="캐릭터 이름"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
            />
            <input
              type="text"
              value={d.nickname || ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, nickname: e.target.value } })
              }
              placeholder="별명"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
            />
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
              프로필 이미지 업로드
            </button>
          </>
        )}

        {selectedCard.type === 'image-card' && (
          <>
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
            <input
              type="text"
              value={d.caption || ''}
              onChange={(e) =>
                onUpdateCard(selectedCard.id, { data: { ...d, caption: e.target.value } })
              }
              placeholder="캡션"
              className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
            />
          </>
        )}

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

        {selectedCard.type === 'stat-card' && (
          <>
            <div className="flex flex-col gap-2">
              {(d.stats || []).map((st: any) => (
                <div key={st.id} className="flex items-center justify-between gap-2 text-xs">
                  <input
                    type="text"
                    value={st.label}
                    onChange={(e) => {
                      const next = (d.stats || []).map((x: any) =>
                        x.id === st.id ? { ...x, label: e.target.value } : x
                      );
                      onUpdateCard(selectedCard.id, { data: { ...d, stats: next } });
                    }}
                    className="w-28 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
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
                    className="w-16 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs text-right"
                  />
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

        {selectedCard.type === 'formula-card' && (
          <div className="flex flex-col gap-2 text-xs">
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
                {formulaCards.map((fc) => (
                  <option key={fc.id} value={fc.id}>
                    {fc.title}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[10.5px] text-[#8A8998]">
              직접 입력 모드에서는 그래프 포인트를 위아래로 드래그해 조절할 수 있습니다.
            </p>
          </div>
        )}

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
          </div>
        )}

        {selectedCard.type === 'animation-card' && (
          <div className="flex flex-col gap-2 text-xs">
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
                value={d.frames ?? 24}
                onChange={(e) =>
                  onUpdateCard(selectedCard.id, { data: { ...d, frames: Number(e.target.value) } })
                }
                className="w-24 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-right"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>길이(초)</span>
              <input
                type="number"
                step="0.1"
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

        {selectedCard.type === 'texture-map-card' && (
          <div className="flex flex-col gap-2.5">
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

      {/* Collapsible Toggle matching PDF Page 11 */}
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

      {/* Style Controls matching PDF Page 11 */}
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
