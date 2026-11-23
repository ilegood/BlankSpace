import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';
import { ModalShell, OriginRect } from '../../modals/ModalShell';
import { useLongPressSort, runFlipForSortItems } from '../../../hooks/useLongPressSort';

interface GlossaryTerm {
  id: string;
  word: string;
  category: string;
  consonant: string;
  description: string;
  linkedDocId?: string;
  linkedDocTitle?: string;
}

const CONSONANTS = ['전체', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ', '기타'];

const CHOSUNG_MAP = ['ㄱ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function getChosung(str: string): string {
  const ch = str.trim().charAt(0);
  if (!ch) return '기타';
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const idx = Math.floor((code - 0xac00) / (21 * 28));
    return CHOSUNG_MAP[idx] || '기타';
  }
  return '기타';
}

const DEFAULT_TERMS: GlossaryTerm[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `term-${i + 1}`,
  word: `용어 ${i + 1}`,
  category: i % 2 === 0 ? '세계관' : '마법',
  consonant: 'ㅇ',
  description:
    '용어에 대한 전체 설명이 펼쳐져 표시됩니다. 길어도 모달 안에서 스크롤로 모두 읽을 수 있습니다.',
  linkedDocId: 'doc-world-sheet',
  linkedDocTitle: '관련 문서 1',
}));

export const GlossaryEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [terms, setTerms] = useState<GlossaryTerm[]>(DEFAULT_TERMS);
  const [selectedConsonant, setSelectedConsonant] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [search, setSearch] = useState('');
  const [detailTerm, setDetailTerm] = useState<GlossaryTerm | null>(null);
  const [detailOrigin, setDetailOrigin] = useState<OriginRect | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newCategory, setNewCategory] = useState('세계관');
  const [newDesc, setNewDesc] = useState('');
  const [newLinked, setNewLinked] = useState<{ id: string; title: string } | null>(null);
  const [isDocLinkOpen, setIsDocLinkOpen] = useState(false);

  const sort = useLongPressSort({
    onReorder: (fromId, toId) => {
      const fromIdx = terms.findIndex((t) => t.id === fromId);
      const toIdx = terms.findIndex((t) => t.id === toId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      const copy = [...terms];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      persist(copy);
    },
  });

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.terms)) {
          setTerms(parsed.terms);
          return;
        }
      } catch {
        // ignore
      }
    }
    setTerms(DEFAULT_TERMS);
  }, [activePage?.id]);

  const persist = (next: GlossaryTerm[]) => {
    setTerms(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ terms: next }) });
  };

  const categories = ['전체', ...Array.from(new Set(terms.map((t) => t.category).filter(Boolean)))];

  const filtered = terms.filter((t) => {
    const c = getChosung(t.word) || t.consonant;
    if (selectedConsonant !== '전체' && c !== selectedConsonant) return false;
    if (selectedCategory !== '전체' && t.category !== selectedCategory) return false;
    if (search.trim() && !t.word.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '용어집 (템플릿)' : activeDocument?.title || '용어집'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="world-glossary"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Hangul Consonant Index matching PDF Pages 23 & 27 */}
        <aside className="w-16 shrink-0 border-r border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] py-4 px-2 flex flex-col items-center gap-1 overflow-y-auto">
          {CONSONANTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                const playFlip = runFlipForSortItems(240);
                setSelectedConsonant(c);
                playFlip();
              }}
              className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedConsonant === c
                  ? 'bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD]'
                  : 'text-[#6E6D7A] hover:bg-black/5'
              }`}
            >
              {c}
            </button>
          ))}
        </aside>

        {/* Main Grid */}
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
                placeholder="용어 검색"
                className="w-64 h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs text-[#6E6D7A] dark:text-[#B4B2C4]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    분류: {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {filtered.map((term) => (
                <div
                  key={term.id}
                  data-sort-id={term.id}
                  data-sort-kind="card"
                  onMouseDown={(e) => isEditMode && sort.startPress(e, term.id, 'card')}
                  onClick={(e) => {
                    if (sort.wasDraggedRef.current || isEditMode) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDetailOrigin({
                      left: rect.left,
                      top: rect.top,
                      width: rect.width,
                      height: rect.height,
                    });
                    setDetailTerm(term);
                  }}
                  className="bs-card-interactive rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-4 cursor-pointer hover:border-[#B6ACEA] flex flex-col justify-between min-h-[104px]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                        {term.word}
                      </div>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            persist(terms.filter((x) => x.id !== term.id));
                          }}
                          className="text-[#8A8998] hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-[#6E6D7A] dark:text-[#9E9CAF] line-clamp-2">
                      {term.description}
                    </p>
                  </div>
                </div>
              ))}

              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    setNewWord('');
                    setNewDesc('');
                    setNewLinked(null);
                    setIsAddOpen(true);
                  }}
                  className="min-h-[104px] rounded-2xl border border-dashed border-[#DCD8EC] dark:border-[#323244] text-lg text-[#6A5ACD] hover:bg-[#F3F1FB]/50"
                >
                  +
                </button>
              )}
            </div>

            {!isEditMode && (
              <p className="text-xs text-[#8A8998]">카드를 누르면 설명이 크게 열립니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* Term Detail Modal matching PDF Page 26 (Card -> Modal 280ms FLIP zoom §2-4) */}
      <ModalShell
        isOpen={Boolean(detailTerm)}
        onClose={() => setDetailTerm(null)}
        originRect={detailOrigin}
        maxWidthClass="max-w-md"
        className="p-6 flex flex-col gap-4"
      >
        {detailTerm && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{detailTerm.word}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#EBE8F5] text-[#6A5ACD] font-semibold">
                  {detailTerm.category}
                </span>
              </div>
              <button type="button" onClick={() => setDetailTerm(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-[#4E4D59] dark:text-[#B4B2C4] max-h-48 overflow-y-auto">
              {detailTerm.description}
            </p>
            {detailTerm.linkedDocId && (
              <div className="pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938]">
                <div className="text-[11px] text-[#8A8998] mb-2">관련 문서</div>
                <button
                  type="button"
                  onClick={() => {
                    const id = detailTerm.linkedDocId!;
                    setDetailTerm(null);
                    openDocument(id);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold hover:text-[#6A5ACD]"
                >
                  <span className="px-1.5 py-0.5 rounded bg-[#EBE8F5] text-[#6A5ACD] text-[10px]">
                    문서
                  </span>
                  <span>{detailTerm.linkedDocTitle || '관련 문서'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </ModalShell>

      {/* Add Term Modal matching PDF Page 28 */}
      <ModalShell
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        maxWidthClass="max-w-md"
        className="p-6 flex flex-col gap-4 text-xs"
      >
        <h3 className="text-base font-bold">용어 추가</h3>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            autoFocus
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="용어를 입력하세요"
            className="col-span-2 h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
          />
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="분류"
            className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
          />
        </div>
        <textarea
          rows={4}
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="설명을 입력하세요"
          className="p-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] resize-none"
        />
        <div>
          <button
            type="button"
            onClick={() => setIsDocLinkOpen(true)}
            className="text-[#6A5ACD] font-semibold hover:underline"
          >
            {newLinked ? `연결됨: ${newLinked.title}` : '+ 문서 연결'}
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsAddOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#E6E3F0]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              if (!newWord.trim()) return;
              persist([
                ...terms,
                {
                  id: `term-${Date.now()}`,
                  word: newWord.trim(),
                  category: newCategory.trim() || '세계관',
                  consonant: getChosung(newWord),
                  description: newDesc.trim() || '설명 없음',
                  linkedDocId: newLinked?.id,
                  linkedDocTitle: newLinked?.title,
                },
              ]);
              setIsAddOpen(false);
            }}
            className="px-4 py-2 rounded-xl bg-[#6A5ACD] text-white font-semibold"
          >
            추가
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
