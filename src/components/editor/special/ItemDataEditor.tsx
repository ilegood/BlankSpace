import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Sword,
  Gem,
  Package,
  Scroll,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Search,
  Filter,
  LayoutGrid,
  List,
  X,
  Coins,
  ChevronDown,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface ItemStat {
  key: string;
  value: string;
}

export interface GameItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  imageUrl?: string;
  description: string;
  stats: ItemStat[];
  effect?: string;
  source?: string;
  price?: number;
}

export const CATEGORY_CONFIG: Record<
  ItemCategory,
  { name: string; icon: React.ElementType; color: string; bg: string }
> = {
  weapon: { name: '무기', icon: Sword, color: 'text-rose-500', bg: 'bg-rose-50' },
  armor: { name: '방어구', icon: Shield, color: 'text-sky-500', bg: 'bg-sky-50' },
  accessory: { name: '장신구', icon: Gem, color: 'text-amber-500', bg: 'bg-amber-50' },
  consumable: { name: '소비품', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  material: { name: '제작 재료', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50' },
  quest: { name: '퀘스트 / 키아이템', icon: Scroll, color: 'text-indigo-500', bg: 'bg-indigo-50' },
};

export const RARITY_CONFIG: Record<
  ItemRarity,
  { name: string; color: string; border: string; bg: string; badge: string }
> = {
  common: { name: '일반 (Common)', color: 'text-slate-600', border: 'border-slate-200', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-700' },
  uncommon: { name: '고급 (Uncommon)', color: 'text-emerald-600', border: 'border-emerald-300', bg: 'bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700' },
  rare: { name: '희귀 (Rare)', color: 'text-sky-600', border: 'border-sky-300', bg: 'bg-sky-50/50', badge: 'bg-sky-100 text-sky-700' },
  epic: { name: '영웅 (Epic)', color: 'text-purple-600', border: 'border-purple-300', bg: 'bg-purple-50/50', badge: 'bg-purple-100 text-purple-700' },
  legendary: { name: '전설 (Legendary)', color: 'text-amber-600', border: 'border-amber-300', bg: 'bg-amber-50/50', badge: 'bg-amber-100 text-amber-800' },
  mythic: { name: '신화 (Mythic)', color: 'text-rose-600', border: 'border-rose-300', bg: 'bg-rose-50/50', badge: 'bg-rose-100 text-rose-800' },
};

export const ItemDataEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!contentRef.current || !activeDocument) return;
    await exportElementAsPng(contentRef.current, {
      fileName: `${activeDocument.title}-아이템시트`,
    });
  };

  const [items, setItems] = useState<GameItem[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<ItemRarity | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ItemCategory>('weapon');
  const [formRarity, setFormRarity] = useState<ItemRarity>('common');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStats, setFormStats] = useState<ItemStat[]>([{ key: '공격력', value: '+10' }]);
  const [formEffect, setFormEffect] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formPrice, setFormPrice] = useState<number>(100);

  // Load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('[')) {
        const parsed = JSON.parse(activePage.content) as GameItem[];
        setItems(parsed);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse item content:', e);
    }

    // Default Sample Items
    const initialItems: GameItem[] = [
      {
        id: 'item-1',
        name: '용기사의 서약검',
        category: 'weapon',
        rarity: 'epic',
        imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=200&auto=format&fit=crop',
        description: '고대 용기사단의 단장이 수여하던 명검. 칼날에서 은은한 푸른 화염이 피어오른다.',
        stats: [
          { key: '물리 공격력', value: '+145' },
          { key: '치명타 확률', value: '+8%' },
        ],
        effect: '적중 시 15% 확률로 3초간 대상 방어력 20% 감소',
        source: '비룡의 둥지 던전 보스 드랍',
        price: 3500,
      },
      {
        id: 'item-2',
        name: '성스러운 수호자의 흉갑',
        category: 'armor',
        rarity: 'rare',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=200&auto=format&fit=crop',
        description: '단단한 미스릴로 제작되어 강력한 타격에도 흠집이 나지 않는 갑옷.',
        stats: [
          { key: '방어력', value: '+85' },
          { key: '최대 생명력', value: '+350' },
        ],
        effect: '피격 시 받는 마법 피해 10% 감소',
        source: '대장간 3단계 제작',
        price: 1800,
      },
      {
        id: 'item-3',
        name: '엘릭서 오브 라이프',
        category: 'consumable',
        rarity: 'rare',
        description: '생명의 정수를 농축하여 만든 물약. 빈사 상태의 상처를 즉시 아물게 한다.',
        stats: [],
        effect: '사용 즉시 HP/MP 100% 회복 및 모든 디버프 해제',
        source: '연금술 공방 제작 또는 필드 상자',
        price: 500,
      },
      {
        id: 'item-4',
        name: '고대 마법석 파편',
        category: 'material',
        rarity: 'legendary',
        description: '세계 창조 시 부서져 내린 신성한 돌의 파편. 장비 강화에 필수적인 핵심 재료.',
        stats: [],
        effect: '전설 등급 장비 제작 및 한계 돌파 시 소모',
        source: '심연 레이드 랭킹 보상',
        price: 12000,
      },
    ];
    setItems(initialItems);
  }, [activePage?.id]);

  // Persist
  const persistItems = (newItems: GameItem[]) => {
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(newItems));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchRar = selectedRarity === 'all' || item.rarity === selectedRarity;
      const matchQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.effect && item.effect.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchRar && matchQuery;
    });
  }, [items, selectedCategory, selectedRarity, searchQuery]);

  const openNewItemModal = () => {
    setEditingItemId(null);
    setFormName('');
    setFormCategory('weapon');
    setFormRarity('common');
    setFormImageUrl('');
    setFormDescription('');
    setFormStats([{ key: '공격력', value: '+10' }]);
    setFormEffect('');
    setFormSource('');
    setFormPrice(100);
    setIsModalOpen(true);
  };

  const openEditItemModal = (item: GameItem) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormRarity(item.rarity);
    setFormImageUrl(item.imageUrl || '');
    setFormDescription(item.description);
    setFormStats(item.stats ? item.stats.map((s) => ({ ...s })) : []);
    setFormEffect(item.effect || '');
    setFormSource(item.source || '');
    setFormPrice(item.price ?? 0);
    setIsModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!formName.trim()) return;

    const itemData: GameItem = {
      id: editingItemId || `item-${generateId()}`,
      name: formName.trim(),
      category: formCategory,
      rarity: formRarity,
      imageUrl: formImageUrl.trim() || undefined,
      description: formDescription.trim(),
      stats: formStats.filter((s) => s.key.trim() && s.value.trim()),
      effect: formEffect.trim() || undefined,
      source: formSource.trim() || undefined,
      price: formPrice,
    };

    let updated: GameItem[];
    if (editingItemId) {
      updated = items.map((it) => (it.id === editingItemId ? itemData : it));
    } else {
      updated = [itemData, ...items];
    }

    setItems(updated);
    persistItems(updated);
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('이 아이템 데이터를 삭제하시겠습니까?')) {
      const updated = items.filter((it) => it.id !== id);
      setItems(updated);
      persistItems(updated);
    }
  };

  const handleDuplicateItem = (item: GameItem) => {
    const duplicated: GameItem = {
      ...item,
      id: `item-${generateId()}`,
      name: `${item.name} (복사본)`,
    };
    const updated = [duplicated, ...items];
    setItems(updated);
    persistItems(updated);
  };

  const addStatRow = () => {
    setFormStats([...formStats, { key: '', value: '' }]);
  };

  const updateStatRow = (index: number, key: string, value: string) => {
    const next = [...formStats];
    next[index] = { key, value };
    setFormStats(next);
  };

  const removeStatRow = (index: number) => {
    setFormStats(formStats.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={openNewItemModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>아이템 추가</span>
            </button>
          </div>
        }
      />

      {/* Filter and Control Bar */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아이템 이름, 설명, 효과 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ItemCategory | 'all')}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none py-0.5 cursor-pointer"
            >
              <option value="all">모든 분류</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as ItemRarity | 'all')}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none py-0.5 cursor-pointer"
            >
              <option value="all">모든 등급</option>
              {Object.entries(RARITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle & Total Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">총 {filteredItems.length}개 항목</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-white text-lavender-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="테이블 표 보기"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-white text-lavender-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="카드 그리드 보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto bg-white">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3 mt-10">
            <div className="w-14 h-14 rounded-2xl bg-lavender-100 text-lavender-600 flex items-center justify-center">
              <Sword className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">등록된 아이템이 없습니다.</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              새로운 무기, 방어구, 소모품 등의 게임 데이터를 추가하여 능력치와 효과를 체계적으로 기획해보세요.
            </p>
            <button
              onClick={openNewItemModal}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-semibold shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>첫 아이템 추가하기</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
                  <th className="py-3 px-4 w-12 text-center">아이콘</th>
                  <th className="py-3 px-4">아이템 명칭</th>
                  <th className="py-3 px-3 w-28">분류</th>
                  <th className="py-3 px-3 w-32">등급</th>
                  <th className="py-3 px-4">주요 능력치</th>
                  <th className="py-3 px-4">사용 효과</th>
                  <th className="py-3 px-3 w-24">가격</th>
                  <th className="py-3 px-4 w-24 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.weapon;
                  const rar = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
                  const CatIcon = cat.icon;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Icon */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center mx-auto">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <CatIcon className={`w-4 h-4 ${cat.color}`} />
                          )}
                        </div>
                      </td>

                      {/* Name & Desc */}
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-800 text-xs">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${cat.bg} ${cat.color}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{cat.name}</span>
                        </span>
                      </td>

                      {/* Rarity */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${rar.badge}`}>
                          {rar.name.split(' ')[0]}
                        </span>
                      </td>

                      {/* Stats */}
                      <td className="py-2.5 px-4">
                        {item.stats && item.stats.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.stats.map((s, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10.5px]"
                              >
                                <strong className="text-slate-500">{s.key}:</strong> {s.value}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Effect */}
                      <td className="py-2.5 px-4">
                        {item.effect ? (
                          <span className="text-[11px] text-slate-600 line-clamp-2">{item.effect}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-2.5 px-3">
                        {item.price !== undefined ? (
                          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-amber-700">
                            <Coins className="w-3 h-3 text-amber-500" />
                            {item.price.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            onClick={() => handleDuplicateItem(item)}
                            title="복제"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditItemModal(item)}
                            title="수정"
                            className="p-1 rounded-lg text-slate-400 hover:text-lavender-600 hover:bg-lavender-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            title="삭제"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.weapon;
              const rar = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
              const CatIcon = cat.icon;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border-2 p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between ${rar.border}`}
                >
                  <div>
                    {/* Top Info */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <CatIcon className={`w-6 h-6 ${cat.color}`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rar.badge}`}>
                              {rar.name.split(' ')[0]}
                            </span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">{cat.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price Badge */}
                      {item.price !== undefined && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span>{item.price.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    )}

                    {/* Stats */}
                    {item.stats && item.stats.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-wrap gap-1.5 mb-3">
                        {item.stats.map((s, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700 shadow-2xs"
                          >
                            <span className="text-slate-400 font-medium">{s.key}</span>{' '}
                            <span className="font-bold text-slate-800">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Effect */}
                    {item.effect && (
                      <div className="text-[11px] text-purple-700 bg-purple-50/70 border border-purple-100 rounded-xl p-2 mb-3">
                        <span className="font-bold">효과: </span>
                        {item.effect}
                      </div>
                    )}

                    {/* Source */}
                    {item.source && (
                      <div className="text-[10.5px] text-slate-400 mb-2">
                        <span>획득처: </span>
                        <span className="text-slate-600">{item.source}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleDuplicateItem(item)}
                      title="복제"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditItemModal(item)}
                      title="수정"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-lavender-600 hover:bg-lavender-50 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      title="삭제"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-xl border border-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {editingItemId ? '아이템 데이터 수정' : '새 아이템 데이터 등록'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              {/* Name & Price */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">
                    아이템 이름 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="예: 흑요석 대검, 마나 회복 물약 등"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">가격 (골드)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Category & Rarity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">아이템 분류</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">아이템 등급</label>
                  <select
                    value={formRarity}
                    onChange={(e) => setFormRarity(e.target.value as ItemRarity)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                  >
                    {Object.entries(RARITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">아이콘 / 이미지 URL</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/icon.png (선택사항)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">아이템 설명 (플레이버 텍스트)</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="아이템의 전설이나 배경 설정을 입력하세요."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800 resize-none"
                />
              </div>

              {/* Dynamic Stats */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">능력치 스탯</label>
                  <button
                    type="button"
                    onClick={addStatRow}
                    className="text-[11px] text-lavender-600 hover:text-lavender-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>스탯 추가</span>
                  </button>
                </div>
                <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {formStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={stat.key}
                        onChange={(e) => updateStatRow(idx, e.target.value, stat.value)}
                        placeholder="스탯명 (예: 공격력, 쿨타임)"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs !bg-white text-slate-800 focus:border-lavender-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => updateStatRow(idx, stat.key, e.target.value)}
                        placeholder="수치 (예: +25, 10%)"
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs !bg-white text-slate-800 focus:border-lavender-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeStatRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {formStats.length === 0 && (
                    <p className="text-center text-[11px] text-slate-400 py-1">스탯이 없습니다.</p>
                  )}
                </div>
              </div>

              {/* Special Effect */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">사용 효과 / 패시브 효과</label>
                <input
                  type="text"
                  value={formEffect}
                  onChange={(e) => setFormEffect(e.target.value)}
                  placeholder="예: 3초간 이동속도 30% 증가, 적 처치 시 체력 5% 회복"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              {/* Acquisition / Source */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">획득처 / 드랍 몬스터</label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="예: 챕터 2 보스, 비밀 상점, 던전 보물상자"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                disabled={!formName.trim()}
                className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 disabled:opacity-50 text-xs font-semibold text-white shadow-soft"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

