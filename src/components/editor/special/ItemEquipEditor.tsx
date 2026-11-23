import React, { useState, useEffect } from 'react';
import { X, Pencil, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';
import { ModalShell, OriginRect } from '../../modals/ModalShell';
import { useLongPressSort, runFlipForSortItems } from '../../../hooks/useLongPressSort';

interface GameItemRecord {
  id: string;
  name: string;
  category: string;
  rarity: string;
  summary: string;
  effects: { label: string; value: string }[];
  buyPrice: string;
  sellPrice: string;
  sources: { name: string; info: string }[];
  description: string;
  linkedDocId?: string;
  linkedDocTitle?: string;
}

const CATEGORIES = ['전체', '무기', '방어구', '소모품', '재료', '기타'];

const DEFAULT_ITEMS: GameItemRecord[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `itm-${i + 1}`,
  name: `아이템 ${i + 1}`,
  category: i % 2 === 0 ? '무기' : '소모품',
  rarity: '등급',
  summary: '등급, 효과, 가격 요약이 여기에 표시됩니다. 길면 두 줄까지만 보입니다.',
  effects: [
    { label: '효과 1', value: '값' },
    { label: '효과 2', value: '값' },
  ],
  buyPrice: '값',
  sellPrice: '값',
  sources: [
    { name: '몬스터 · 전리품', info: '확률' },
    { name: '상점', info: '구매' },
  ],
  description: '아이템 상세 설명입니다.',
  linkedDocId: 'doc-overview',
  linkedDocTitle: '관련 문서',
}));

export const ItemEquipEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [items, setItems] = useState<GameItemRecord[]>(DEFAULT_ITEMS);
  const [selectedCat, setSelectedCat] = useState('전체');
  const [selectedRarity, setSelectedRarity] = useState('전체');
  const [search, setSearch] = useState('');
  const [detailItem, setDetailItem] = useState<GameItemRecord | null>(null);
  const [detailOrigin, setDetailOrigin] = useState<OriginRect | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('무기');
  const [newRarity, setNewRarity] = useState('일반');
  const [newDesc, setNewDesc] = useState('');
  const [newEffects, setNewEffects] = useState<{ label: string; value: string }[]>([
    { label: '공격력', value: '+10' },
  ]);
  const [newSources, setNewSources] = useState<{ name: string; info: string }[]>([
    { name: '상점', info: '구매' },
  ]);
  const [buyOpen, setBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [newBuyPrice, setNewBuyPrice] = useState('');
  const [newSellPrice, setNewSellPrice] = useState('');
  const [newLinked, setNewLinked] = useState<{ id: string; title: string } | null>(null);
  const [isDocLinkOpen, setIsDocLinkOpen] = useState(false);

  const openEditItemModal = (item: GameItemRecord) => {
    setEditingItemId(item.id);
    setNewName(item.name);
    setNewCat(item.category);
    setNewRarity(item.rarity);
    setNewDesc(item.description || item.summary);
    setNewEffects(item.effects?.length ? item.effects : [{ label: '효과 1', value: '값' }]);
    setNewSources(item.sources?.length ? item.sources : [{ name: '상점', info: '구매' }]);
    setNewBuyPrice(item.buyPrice || '');
    setNewSellPrice(item.sellPrice || '');
    setBuyOpen(Boolean(item.buyPrice));
    setSellOpen(Boolean(item.sellPrice));
    setNewLinked(
      item.linkedDocId ? { id: item.linkedDocId, title: item.linkedDocTitle || '관련 문서' } : null
    );
    setDetailItem(null);
    setIsAddOpen(true);
  };

  const sort = useLongPressSort({
    onReorder: (fromId, toId) => {
      const fromIdx = items.findIndex((x) => x.id === fromId);
      const toIdx = items.findIndex((x) => x.id === toId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      const copy = [...items];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      persist(copy);
    },
  });

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.items)) {
          setItems(parsed.items);
          return;
        }
      } catch {
        // ignore
      }
    }
    setItems(DEFAULT_ITEMS);
  }, [activePage?.id]);

  const persist = (next: GameItemRecord[]) => {
    setItems(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ items: next }) });
  };

  const rarities = ['전체', ...Array.from(new Set(items.map((it) => it.rarity).filter(Boolean)))];

  const filtered = items.filter((it) => {
    if (selectedCat !== '전체' && it.category !== selectedCat) return false;
    if (selectedRarity !== '전체' && it.rarity !== selectedRarity) return false;
    if (search.trim() && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '아이템 및 장비 (템플릿)' : activeDocument?.title || '아이템 및 장비'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="game-items-equip"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Category Rail */}
        <aside className="w-40 shrink-0 border-r border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-4 flex flex-col gap-1">
          <div className="px-2 pb-1 text-[11px] font-semibold text-[#8A8998]">분류</div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                const playFlip = runFlipForSortItems(240);
                setSelectedCat(cat);
                playFlip();
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                selectedCat === cat
                  ? 'bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] font-semibold'
                  : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </aside>

        <div
          data-export-root="true"
          className="flex-1 overflow-y-auto p-6 bg-[#FAF9FE] dark:bg-[#15151C]"
        >
          <div className="max-w-5xl mx-auto flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="아이템 검색"
                className="w-64 h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
              />
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs text-[#6E6D7A]"
              >
                {rarities.map((r) => (
                  <option key={r} value={r}>
                    등급: {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  data-sort-id={item.id}
                  data-sort-kind="card"
                  onMouseDown={(e) => isEditMode && sort.startPress(e, item.id, 'card')}
                  onClick={(e) => {
                    if (sort.wasDraggedRef.current) return;
                    if (isEditMode) {
                      openEditItemModal(item);
                      return;
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDetailOrigin({
                      left: rect.left,
                      top: rect.top,
                      width: rect.width,
                      height: rect.height,
                    });
                    setDetailItem(item);
                  }}
                  className="bs-card-interactive rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-4 cursor-pointer hover:border-[#B6ACEA] flex flex-col justify-between min-h-[104px]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-bold">{item.name}</span>
                      {isEditMode && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="아이템 수정"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditItemModal(item);
                            }}
                            className="p-1 text-[#8A8998] hover:text-[#6A5ACD]"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="아이템 삭제"
                            onClick={(e) => {
                              e.stopPropagation();
                              persist(items.filter((x) => x.id !== item.id));
                            }}
                            className="p-1 text-[#8A8998] hover:text-rose-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-[#6E6D7A] dark:text-[#9E9CAF] line-clamp-2">
                      {item.summary}
                    </p>
                  </div>
                </div>
              ))}

              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingItemId(null);
                    setNewName('');
                    setNewCat('무기');
                    setNewRarity('일반');
                    setNewDesc('');
                    setNewEffects([{ label: '효과 1', value: '값' }]);
                    setNewSources([{ name: '상점', info: '구매' }]);
                    setNewBuyPrice('');
                    setNewSellPrice('');
                    setBuyOpen(false);
                    setSellOpen(false);
                    setNewLinked(null);
                    setIsAddOpen(true);
                  }}
                  className="min-h-[104px] rounded-2xl border border-dashed border-[#DCD8EC] dark:border-[#323244] text-lg text-[#6A5ACD] hover:bg-[#F3F1FB]/50"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <ModalShell
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        originRect={detailOrigin}
        maxWidthClass="max-w-md"
        className="p-6 flex flex-col gap-4 text-xs"
      >
        {detailItem && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{detailItem.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#EBE8F5] text-[#6A5ACD] font-semibold">
                  {detailItem.rarity}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#F3F1FB] text-[#6E6D7A]">
                  {detailItem.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditItemModal(detailItem)}
                  className="px-2.5 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#6A5ACD]"
                >
                  수정
                </button>
                <button type="button" onClick={() => setDetailItem(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {detailItem.description && (
              <p className="text-xs text-[#4E4D59] dark:text-[#B4B2C4] leading-relaxed">
                {detailItem.description}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] text-[#8A8998]">효과</div>
              {detailItem.effects.map((ef, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
                  <span className="font-semibold">{ef.label}</span>
                  <span className="text-[#8A8998]">{ef.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] text-[#8A8998]">가격</div>
              <div className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
                <span className="font-semibold">구매</span>
                <span className="text-[#8A8998]">{detailItem.buyPrice}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold">판매</span>
                <span className="text-[#8A8998]">{detailItem.sellPrice}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] text-[#8A8998]">획득처</div>
              {detailItem.sources.map((s, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[#8A8998]">{s.info}</span>
                </div>
              ))}
            </div>

            {detailItem.linkedDocId && (
              <div>
                <div className="text-[11px] text-[#8A8998] mb-1.5">관련 문서</div>
                <button
                  type="button"
                  onClick={() => {
                    const id = detailItem.linkedDocId!;
                    setDetailItem(null);
                    openDocument(id);
                  }}
                  className="flex items-center gap-2 font-semibold hover:text-[#6A5ACD]"
                >
                  <span className="px-1.5 py-0.5 rounded bg-[#EBE8F5] text-[#6A5ACD] text-[10px]">
                    문서
                  </span>
                  <span>{detailItem.linkedDocTitle}</span>
                </button>
              </div>
            )}
          </>
        )}
      </ModalShell>

      {/* Add / Edit Item Modal */}
      <ModalShell
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItemId(null);
        }}
        maxWidthClass="max-w-md"
        className="p-6 flex flex-col gap-3.5 text-xs max-h-[85vh] overflow-y-auto"
      >
        <h3 className="text-base font-bold">{editingItemId ? '아이템 수정' : '아이템 추가'}</h3>
        <input
          type="text"
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="아이템 이름"
          className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <input
            type="text"
            value={newRarity}
            onChange={(e) => setNewRarity(e.target.value)}
            placeholder="등급 입력"
            className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
          />
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
          >
            {CATEGORIES.filter((c) => c !== '전체').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <textarea
          rows={3}
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="설명을 입력하세요"
          className="p-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C] resize-none"
        />

        {/* Effects Editor */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#F0EEF7] dark:border-[#2A2938]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A8998]">효과</span>
            <button
              type="button"
              onClick={() => setNewEffects([...newEffects, { label: '새 효과', value: '+0' }])}
              className="text-[#6A5ACD] font-semibold hover:underline"
            >
              + 효과 추가
            </button>
          </div>
          {newEffects.map((ef, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={ef.label}
                placeholder="효과 이름 (예: 공격력)"
                onChange={(e) => {
                  const next = [...newEffects];
                  next[idx] = { ...next[idx], label: e.target.value };
                  setNewEffects(next);
                }}
                className="flex-1 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
              />
              <input
                type="text"
                value={ef.value}
                placeholder="수치 (예: +15)"
                onChange={(e) => {
                  const next = [...newEffects];
                  next[idx] = { ...next[idx], value: e.target.value };
                  setNewEffects(next);
                }}
                className="w-28 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
              />
              <button
                type="button"
                onClick={() => setNewEffects(newEffects.filter((_, i) => i !== idx))}
                className="p-1 text-[#8A8998] hover:text-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Sources Editor */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-[#F0EEF7] dark:border-[#2A2938]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8A8998]">획득처</span>
            <button
              type="button"
              onClick={() => setNewSources([...newSources, { name: '획득처', info: '방법/확률' }])}
              className="text-[#6A5ACD] font-semibold hover:underline"
            >
              + 획득처 추가
            </button>
          </div>
          {newSources.map((src, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <input
                type="text"
                value={src.name}
                placeholder="장소/몬스터"
                onChange={(e) => {
                  const next = [...newSources];
                  next[idx] = { ...next[idx], name: e.target.value };
                  setNewSources(next);
                }}
                className="flex-1 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
              />
              <input
                type="text"
                value={src.info}
                placeholder="조건/확률"
                onChange={(e) => {
                  const next = [...newSources];
                  next[idx] = { ...next[idx], info: e.target.value };
                  setNewSources(next);
                }}
                className="w-28 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
              />
              <button
                type="button"
                onClick={() => setNewSources(newSources.filter((_, i) => i !== idx))}
                className="p-1 text-[#8A8998] hover:text-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1 border-t border-[#F0EEF7] dark:border-[#2A2938]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBuyOpen((p) => !p)}
              className="text-[#6A5ACD] font-semibold hover:underline"
            >
              {buyOpen ? '− 구매 가격' : '+ 구매 가격'}
            </button>
            <button
              type="button"
              onClick={() => setSellOpen((p) => !p)}
              className="text-[#6A5ACD] font-semibold hover:underline"
            >
              {sellOpen ? '− 판매 가격' : '+ 판매 가격'}
            </button>
          </div>
          <div className="bs-collapse-grid" data-open={buyOpen || sellOpen ? 'true' : 'false'}>
            <div className="bs-collapse-inner grid grid-cols-2 gap-2 pt-1">
              {buyOpen && (
                <input
                  type="text"
                  value={newBuyPrice}
                  onChange={(e) => setNewBuyPrice(e.target.value)}
                  placeholder="구매 가격 (예: 200G)"
                  className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
                />
              )}
              {sellOpen && (
                <input
                  type="text"
                  value={newSellPrice}
                  onChange={(e) => setNewSellPrice(e.target.value)}
                  placeholder="판매 가격 (예: 80G)"
                  className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsDocLinkOpen(true)}
            className="self-start text-[#6A5ACD] font-semibold hover:underline"
          >
            {newLinked ? `연결됨: ${newLinked.title}` : '+ 문서 연결'}
          </button>
          {newLinked && (
            <button
              type="button"
              onClick={() => setNewLinked(null)}
              className="text-rose-500 font-semibold hover:underline"
            >
              연결 해제
            </button>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setIsAddOpen(false);
              setEditingItemId(null);
            }}
            className="px-4 py-2 rounded-xl border border-[#E6E3F0]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (!newName.trim()) return;
              const record: GameItemRecord = {
                id: editingItemId || `itm-${Date.now()}`,
                name: newName.trim(),
                category: newCat,
                rarity: newRarity.trim() || '일반',
                summary:
                  newDesc.trim() ||
                  newEffects.map((e) => `${e.label} ${e.value}`).join(', ') ||
                  '새 아이템',
                effects: newEffects.length ? newEffects : [{ label: '효과 1', value: '값' }],
                buyPrice: newBuyPrice.trim() || '100G',
                sellPrice: newSellPrice.trim() || '50G',
                sources: newSources.length ? newSources : [{ name: '상점', info: '구매' }],
                description: newDesc.trim(),
                linkedDocId: newLinked?.id,
                linkedDocTitle: newLinked?.title,
              };
              if (editingItemId) {
                persist(items.map((it) => (it.id === editingItemId ? record : it)));
              } else {
                persist([...items, record]);
              }
              setIsAddOpen(false);
              setEditingItemId(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#6A5ACD] text-white font-semibold"
          >
            {editingItemId ? '저장' : '추가'}
          </button>
        </div>
      </ModalShell>

      <DocumentLinkModal
        isOpen={isDocLinkOpen}
        onClose={() => setIsDocLinkOpen(false)}
        onSelect={(d) => setNewLinked(d)}
      />
    </div>
  );
};
