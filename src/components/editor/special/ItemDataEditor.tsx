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
  Link as LinkIcon,
  Tag,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export interface GameItem {
  id: string;
  name: string;
  category: 'item' | 'equip' | 'consumable' | 'material' | 'etc';
  categoryLabel: string;
  rarity: 'common' | 'rare' | 'epic';
  rarityLabel: string;
  icon: string;
  effect: string;
  source: string;
  description: string;
  illustrationUrl: string;
}

const DEFAULT_ITEMS: GameItem[] = [
  {
    id: 'item-carrot',
    name: '당근',
    category: 'item',
    categoryLabel: '아이템',
    rarity: 'common',
    rarityLabel: '일반',
    icon: '🥕',
    effect: '스태미나 10 회복',
    source: '재배 (봄~가을)',
    description: '신선하고 아삭한 주황색 당근. 조리에 널리 쓰인다.',
    illustrationUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'item-tomato',
    name: '토마토',
    category: 'item',
    categoryLabel: '아이템',
    rarity: 'common',
    rarityLabel: '일반',
    icon: '🍅',
    effect: '스태미나 15 회복',
    source: '재배 (여름)',
    description: '여름 햇살을 머금고 자란 붉은 토마토.',
    illustrationUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'item-sickle-old',
    name: '낡은 낫',
    category: 'equip',
    categoryLabel: '장비',
    rarity: 'common',
    rarityLabel: '일반',
    icon: '🌾',
    effect: '수확 속도 +10%',
    source: '상점 구매',
    description: '오래되어 녹이 슨 낫. 기본 수확용으로 쓰인다.',
    illustrationUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'item-sickle-silver',
    name: '은빛 낫',
    category: 'equip',
    categoryLabel: '장비',
    rarity: 'rare',
    rarityLabel: '레어',
    icon: '⚔️',
    effect: '수확 속도 +30%',
    source: '제작 (대장간 Lv.2)',
    description: '은련된 낫. 일반적인 낫보다 훨씬 효율적으로 수확할 수 있다.',
    illustrationUrl: 'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'item-potion-herb',
    name: '허브 포션',
    category: 'consumable',
    categoryLabel: '소모품',
    rarity: 'common',
    rarityLabel: '일반',
    icon: '🧪',
    effect: '체력 50 회복',
    source: '제작 / 상점',
    description: '마을 약초로 달여낸 기본 체력 회복 물약.',
    illustrationUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop',
  },
];

export const ItemDataEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const contentRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [items, setItems] = useState<GameItem[]>(DEFAULT_ITEMS);
  const [selectedItemId, setSelectedItemId] = useState<string>('item-sickle-silver');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('[')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.length > 0) {
          setItems(parsed);
          setSelectedItemId(parsed[0].id);
          return;
        }
      }
    } catch {}
    setItems(DEFAULT_ITEMS);
    setSelectedItemId('item-sickle-silver');
  }, [activePage?.id]);

  const persistItems = (newItems: GameItem[]) => {
    setItems(newItems);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(newItems));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!contentRef.current || !activeDocument) return;
    await exportElementAsPng(contentRef.current, {
      fileName: `${activeDocument.title}-아이템시트`,
    });
  };

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.effect.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [items, activeCategory, searchQuery]);

  const handleAddItem = () => {
    const newItem: GameItem = {
      id: `item-${generateId()}`,
      name: '새 아이템',
      category: 'item',
      categoryLabel: '아이템',
      rarity: 'common',
      rarityLabel: '일반',
      icon: '📦',
      effect: '효과 입력',
      source: '획득처 입력',
      description: '아이템 상세 설명을 입력하세요.',
      illustrationUrl: 'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?q=80&w=300&auto=format&fit=crop',
    };
    const next = [...items, newItem];
    persistItems(next);
    setSelectedItemId(newItem.id);
  };

  const handleDuplicate = () => {
    if (!selectedItem) return;
    const duplicated: GameItem = {
      ...selectedItem,
      id: `item-${generateId()}`,
      name: `${selectedItem.name} (복제)`,
    };
    const next = [...items, duplicated];
    persistItems(next);
    setSelectedItemId(duplicated.id);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    const next = items.filter((i) => i.id !== selectedItem.id);
    persistItems(next);
    setSelectedItemId(next[0]?.id || '');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>아이템 추가</span>
            </button>
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>복제</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-medium text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>삭제</span>
            </button>
          </div>
        }
      />

      {/* Main 2-Column Layout: Left Category Sidebar + Center Table & Detail Card */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Categories (분류) */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 px-1">분류</span>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: 'all', label: '전체' },
                { id: 'item', label: '아이템' },
                { id: 'equip', label: '장비' },
                { id: 'consumable', label: '소모품' },
                { id: 'material', label: '재료' },
                { id: 'etc', label: '기타' },
              ].map((c) => {
                const isSelected = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-lavender-50 text-lavender-900 font-bold border border-lavender-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Package className={`w-3.5 h-3.5 ${isSelected ? 'text-lavender-600' : 'text-slate-400'}`} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => alert('새 분류가 추가되었습니다.')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-lavender-400 text-slate-500 hover:text-lavender-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>분류 추가</span>
          </button>
        </div>

        {/* Center: Main Table View & Detail Card (Example Image Style) */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-[#F8FAFD]">
          {/* Top Control Bar: View Toggle & Search */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-lavender-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                테이블 보기
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'card' ? 'bg-white text-lavender-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                카드 보기
              </button>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="아이템 검색..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Table List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold select-none">
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="py-2.5 px-3">아이템명</th>
                  <th className="py-2.5 px-3 w-20">유형</th>
                  <th className="py-2.5 px-3 w-20">등급</th>
                  <th className="py-2.5 px-4">효과</th>
                  <th className="py-2.5 px-4">획득처</th>
                  <th className="py-2.5 px-3 w-20 text-center">연결 문서</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isSelected = item.id === selectedItemId;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-lavender-50/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} readOnly className="rounded" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <span className="font-bold text-slate-800">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{item.categoryLabel}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                            item.rarity === 'rare'
                              ? 'bg-lavender-100 text-lavender-700 border border-lavender-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.rarityLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{item.effect}</td>
                      <td className="py-2.5 px-4 text-slate-500">{item.source}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button className="p-1 text-slate-400 hover:text-lavender-600 rounded-lg">
                          <LinkIcon className="w-3.5 h-3.5 m-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Selected Item Detail Card (Example Image Style) */}
          {selectedItem && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-soft flex items-center justify-between gap-6">
              {/* Left Item Graphic */}
              <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center p-2 shrink-0">
                <img
                  src={selectedItem.illustrationUrl}
                  alt={selectedItem.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Middle Info */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-800">{selectedItem.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {selectedItem.categoryLabel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lavender-100 text-lavender-700">
                      {selectedItem.rarityLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <strong className="text-slate-400 mr-2">설명:</strong>
                    <span>{selectedItem.description}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 mr-2">효과:</strong>
                    <span className="font-semibold text-slate-800">{selectedItem.effect}</span>
                  </div>
                  <div>
                    <strong className="text-slate-400 mr-2">획득처:</strong>
                    <span>{selectedItem.source}</span>
                  </div>
                </div>
              </div>

              {/* Right Big Icon Graphic */}
              <div className="w-20 h-20 rounded-2xl bg-lavender-50/50 border border-lavender-100 flex items-center justify-center text-4xl shrink-0">
                {selectedItem.icon}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
