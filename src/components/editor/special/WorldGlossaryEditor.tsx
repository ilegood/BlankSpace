import React, { useState, useEffect, useRef } from 'react';
import {
  Book,
  Search,
  Bookmark,
  BookmarkCheck,
  Plus,
  Trash2,
  Grid,
  List,
  Sparkles,
  Tag,
  Folder,
  Download,
  Scale,
  Flame,
  Feather,
  Mountain,
  CircleDot,
  Apple,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface GlossaryTerm {
  id: string;
  name: string;
  enName: string;
  category: string;
  tags: string[];
  desc: string;
  icon: string;
  isBookmarked?: boolean;
}

const DEFAULT_TERMS: GlossaryTerm[] = [
  {
    id: 'term-1',
    name: '영혼',
    enName: 'Soul',
    category: '설정',
    tags: ['설정', '핵심 개념'],
    desc: '생명의 근원이며, 사후에도 존재가 지속되는 정신적 실체.',
    icon: '✨',
    isBookmarked: false,
  },
  {
    id: 'term-2',
    name: '사신',
    enName: 'Reaper',
    category: '세력',
    tags: ['존재', '세력'],
    desc: '죽은 이의 영혼을 거두어 인도하는 존재.',
    icon: '🗡️',
    isBookmarked: false,
  },
  {
    id: 'term-3',
    name: '림보',
    enName: 'Limbo',
    category: '세계관',
    tags: ['지역', '세계관'],
    desc: '천국과 지옥 사이에 존재하는 머무름의 땅.',
    icon: '🏝️',
    isBookmarked: false,
  },
  {
    id: 'term-4',
    name: '천국',
    enName: 'Heaven',
    category: '세계관',
    tags: ['지역', '사후 세계'],
    desc: '선한 영혼이 향하는 안식의 세계.',
    icon: '🪽',
    isBookmarked: false,
  },
  {
    id: 'term-5',
    name: '지옥',
    enName: 'Hell',
    category: '세계관',
    tags: ['지역', '사후 세계'],
    desc: '죄가 무거운 영혼이 향하는 세계.',
    icon: '🔥',
    isBookmarked: false,
  },
  {
    id: 'term-6',
    name: '죄',
    enName: 'Sin',
    category: '설정',
    tags: ['개념', '설정'],
    desc: '영혼의 행선지를 결정짓는 행위와 그 무게.',
    icon: '🍎',
    isBookmarked: false,
  },
  {
    id: 'term-7',
    name: '판결',
    enName: 'Judgment',
    category: '설정',
    tags: ['설정', '시스템'],
    desc: '영혼의 죄를 심판하고, 천국 또는 지옥으로의 행로를 결정하는 과정.',
    icon: '⚖️',
    isBookmarked: false,
  },
];

const CATEGORIES = [
  '전체',
  '세계관',
  '종족',
  '지명',
  '세력',
  '문화',
  '설정',
  '기타',
];

export const WorldGlossaryEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeSidebar, setActiveSidebar] = useState<'all' | 'category' | 'tags'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [terms, setTerms] = useState<GlossaryTerm[]>(DEFAULT_TERMS);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.terms) {
          setTerms(parsed.terms);
          return;
        }
      }
    } catch {}
    setTerms(DEFAULT_TERMS);
  }, [activePage?.id]);

  const persistData = (newTerms: GlossaryTerm[]) => {
    setTerms(newTerms);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify({ terms: newTerms }));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-용어사전`,
    });
  };

  const toggleBookmark = (id: string) => {
    const next = terms.map((t) =>
      t.id === id ? { ...t, isBookmarked: !t.isBookmarked } : t
    );
    persistData(next);
  };

  const handleAddTerm = () => {
    const name = prompt('용어명 (예: 신성 제국):');
    if (!name?.trim()) return;
    const enName = prompt('영문명 (선택):') || '';
    const desc = prompt('설명:') || '용어에 대한 설명';
    const newTerm: GlossaryTerm = {
      id: `term-${Date.now()}`,
      name: name.trim(),
      enName: enName.trim(),
      category: selectedCategory === '전체' ? '설정' : selectedCategory,
      tags: [selectedCategory === '전체' ? '설정' : selectedCategory],
      desc,
      icon: '📖',
    };
    persistData([...terms, newTerm]);
  };

  const filteredTerms = terms.filter((t) => {
    const matchesCat =
      selectedCategory === '전체' ||
      t.category === selectedCategory ||
      t.tags.includes(selectedCategory);
    const matchesQuery =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.enName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
      />

      {/* Main 2-Column: Left Sidebar + Center Dictionary Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-52 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveSidebar('all')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeSidebar === 'all'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Book className="w-4 h-4 text-lavender-600" />
              <span>전체 용어</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebar('category')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeSidebar === 'category'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Folder className="w-4 h-4 text-slate-400" />
              <span>분류별 보기</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSidebar('tags')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeSidebar === 'tags'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Tag className="w-4 h-4 text-slate-400" />
              <span>태그 관리</span>
            </button>
          </div>
        </div>

        {/* Center Dictionary Stage */}
        <div
          ref={printRef}
          className="flex-1 bg-white overflow-y-auto p-6 flex flex-col gap-5"
        >
          {/* Header Banner (Book Theme matched to example image) */}
          <div className="relative rounded-2xl p-5 border border-lavender-200 bg-gradient-to-r from-lavender-100/70 via-purple-50/50 to-white overflow-hidden flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-xs border border-lavender-200 flex items-center justify-center shadow-xs">
                <Book className="w-6 h-6 text-lavender-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  용어 사전
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  세계관에서 사용되는 고유 명칭, 개념, 설정 용어를 정리합니다.
                </p>
              </div>
            </div>

            {/* Book / Quill silhouette in background */}
            <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center pr-6">
              <Book className="w-32 h-32 text-lavender-700" />
            </div>
          </div>

          {/* Search + Category Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-100">
            {/* Search Input */}
            <div className="relative w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="용어 검색..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-lavender-500 !bg-white"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                      isSelected
                        ? 'bg-lavender-500 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-lavender-100 text-lavender-700'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-lavender-100 text-lavender-700'
                    : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terms Grid (Matched to Example Image) */}
          <div
            className={`grid gap-4 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {filteredTerms.map((term) => (
              <div
                key={term.id}
                className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-lavender-400 hover:shadow-sm transition-all flex flex-col justify-between min-h-[145px] group relative"
              >
                {/* Top Row: Icon + Name + Bookmark */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-lavender-50 border border-lavender-100 flex items-center justify-center text-lg shrink-0">
                      {term.icon}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">
                        {term.name}{' '}
                        {term.enName && (
                          <span className="text-[11px] font-normal text-slate-400">
                            ({term.enName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {term.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9.5px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(term.id)}
                    className={`p-1 rounded-md transition-colors ${
                      term.isBookmarked
                        ? 'text-lavender-600'
                        : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        term.isBookmarked ? 'fill-lavender-500' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                  {term.desc}
                </p>
              </div>
            ))}

            {/* Add Term Card */}
            <button
              type="button"
              onClick={handleAddTerm}
              className="border-2 border-dashed border-slate-200 hover:border-lavender-400 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-lavender-600 transition-colors min-h-[145px] bg-slate-50/40 hover:bg-lavender-50/20"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-semibold">용어 추가</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

