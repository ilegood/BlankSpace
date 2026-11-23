import React, { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { useWorkspace } from '../../../../store/WorkspaceContext';
import { EditorHeader } from '../../EditorHeader';
import { DocumentLinkModal } from '../../../modals/DocumentLinkModal';
import { useToast } from '../../../toast/ToastContext';

interface QACategory {
  id: string;
  name: string;
  questions: { id: string; question: string; answer: string }[];
}

interface QADocState {
  linkedCharDocId?: string;
  linkedCharName?: string;
  characterAvatarUrl?: string;
  categories: QACategory[];
}

const DEFAULT_QA_STATE: QADocState = {
  linkedCharDocId: 'doc-char-a',
  linkedCharName: '캐릭터 이름',
  categories: [
    { id: 'cat-basic', name: '기본 정보', questions: [{ id: 'q1', question: '이름의 유래는?', answer: '' }] },
    { id: 'cat-pers', name: '성격', questions: [{ id: 'q2', question: '평소 말투는 어떤가요?', answer: '' }] },
    { id: 'cat-past', name: '과거', questions: [{ id: 'q3', question: '가장 후회하는 기억은?', answer: '' }] },
    {
      id: 'cat-taste',
      name: '취향',
      questions: [
        { id: 'q4', question: '좋아하는 것은?', answer: '따뜻한 수프를 좋아한다.' },
        { id: 'q5', question: '싫어하는 것은?', answer: '거짓말을 밥 먹듯이 하는 사람.' },
        { id: 'q6', question: '가장 소중한 물건은?', answer: '' },
        { id: 'q7', question: '질문 4', answer: '휴일에는 조용히 책을 읽는다.' },
      ],
    },
    { id: 'cat-rel', name: '관계', questions: [{ id: 'q8', question: '가장 신뢰하는 동료는?', answer: '' }] },
  ],
};

const RECOMMENDED_QUESTIONS = [
  '좋아하는 음식은?',
  '잘하는 것은?',
  '무서워하는 것은?',
  '버릇이 있다면?',
];

export const CharacterQAEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();
  const { showToast } = useToast();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [state, setState] = useState<QADocState>(DEFAULT_QA_STATE);
  const [activeCatId, setActiveCatId] = useState('cat-taste');
  const [customQ, setCustomQ] = useState('');
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.categories)) {
          setState(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }
    setState(DEFAULT_QA_STATE);
  }, [activePage?.id]);

  const persist = (next: QADocState) => {
    setState(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify(next) });
  };

  const activeCategory =
    state.categories.find((c) => c.id === activeCatId) || state.categories[0];

  const addQuestion = (text: string) => {
    if (!text.trim() || !activeCategory) return;
    persist({
      ...state,
      categories: state.categories.map((c) =>
        c.id === activeCategory.id
          ? {
              ...c,
              questions: [
                ...c.questions,
                { id: `q-${Date.now()}`, question: text.trim(), answer: '' },
              ],
            }
          : c
      ),
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '캐릭터 문답 (템플릿)' : activeDocument?.title || '캐릭터 문답'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="character-qa"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Question Categories */}
        <aside className="w-48 shrink-0 border-r border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-4 flex flex-col gap-1.5 overflow-y-auto">
          <div className="px-2 pb-1 text-[11px] font-semibold text-[#8A8998]">질문 분류</div>
          {state.categories.map((cat) => {
            const active = cat.id === activeCategory?.id;
            return (
              <div key={cat.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveCatId(cat.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-xl text-xs transition-colors truncate ${
                    active
                      ? 'bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] font-semibold'
                      : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5'
                  }`}
                >
                  {isEditMode && <span className="mr-1.5 text-[#9E9CAF]">⋮⋮</span>}
                  {cat.name}
                </button>
                {isEditMode && state.categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextCats = state.categories.filter((c) => c.id !== cat.id);
                      persist({ ...state, categories: nextCats });
                      if (activeCatId === cat.id) setActiveCatId(nextCats[0].id);
                      showToast(`'${cat.name}' 분류를 삭제했습니다`);
                    }}
                    className="p-1 text-[#8A8998] hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          {isEditMode && (
            isAddingCat ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newCatName.trim()) return;
                  const newCat: QACategory = {
                    id: `cat-${Date.now()}`,
                    name: newCatName.trim(),
                    questions: [],
                  };
                  persist({ ...state, categories: [...state.categories, newCat] });
                  setActiveCatId(newCat.id);
                  setNewCatName('');
                  setIsAddingCat(false);
                  showToast(`'${newCat.name}' 분류를 추가했습니다`);
                }}
                className="mt-1 flex flex-col gap-1.5"
              >
                <input
                  type="text"
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="새 분류 이름"
                  className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
                />
                <div className="flex gap-1">
                  <button
                    type="submit"
                    className="flex-1 py-1 rounded-lg bg-[#6A5ACD] text-white text-xs font-semibold"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCat(false);
                      setNewCatName('');
                    }}
                    className="px-2 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingCat(true)}
                className="mt-1 px-3 py-2 text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
              >
                + 분류 추가
              </button>
            )
          )}
        </aside>

        {/* Center 2-Column Q&A Grid */}
        <div
          data-export-root="true"
          className="flex-1 overflow-y-auto p-7 bg-[#FAF9FE] dark:bg-[#15151C]"
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[20px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                {activeCategory?.name}
              </h2>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isEditMode) {
                      avatarInputRef.current?.click();
                    } else if (state.linkedCharDocId) {
                      openDocument(state.linkedCharDocId);
                    }
                  }}
                  title={isEditMode ? '프로필 이미지 업로드' : '연결된 캐릭터 문서 열기'}
                  className="w-10 h-10 rounded-full bg-[#EBE8F5] dark:bg-[#2C2845] overflow-hidden flex items-center justify-center border border-[#E6E3F0] dark:border-[#323244] shrink-0 relative group"
                >
                  {state.characterAvatarUrl ? (
                    <img
                      src={state.characterAvatarUrl}
                      alt={state.linkedCharName || '캐릭터'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-[#6A5ACD] opacity-60 group-hover:opacity-100" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        persist({ ...state, characterAvatarUrl: reader.result });
                      }
                    };
                    reader.readAsDataURL(f);
                  }}
                />
                <div className="flex flex-col">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={state.linkedCharName || ''}
                      onChange={(e) => persist({ ...state, linkedCharName: e.target.value })}
                      placeholder="캐릭터 이름 직접 입력"
                      className="h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs font-bold"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => state.linkedCharDocId && openDocument(state.linkedCharDocId)}
                      className="text-left text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6] hover:text-[#6A5ACD]"
                    >
                      {state.linkedCharName || '캐릭터 이름'}
                    </button>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {isEditMode ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsLinkOpen(true)}
                          className="text-[11px] text-[#6A5ACD] font-semibold hover:underline"
                        >
                          {state.linkedCharDocId ? '연결 문서 변경' : '+ 캐릭터 문서 연결'}
                        </button>
                        {state.linkedCharDocId && (
                          <button
                            type="button"
                            onClick={() =>
                              persist({ ...state, linkedCharDocId: undefined })
                            }
                            className="text-[11px] text-rose-500 hover:underline"
                          >
                            연결 해제
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-[#8A8998]">
                        {state.linkedCharDocId ? '캐릭터 문서 연결됨' : '직접 설정된 캐릭터'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeCategory?.questions || []).map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-4 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => {
                          persist({
                            ...state,
                            categories: state.categories.map((c) =>
                              c.id === activeCategory.id
                                ? {
                                    ...c,
                                    questions: c.questions.map((item) =>
                                      item.id === q.id ? { ...item, question: e.target.value } : item
                                    ),
                                  }
                                : c
                            ),
                          });
                        }}
                        className="flex-1 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-bold"
                      />
                    ) : (
                      <div className="text-[13.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                        {q.question}
                      </div>
                    )}

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() =>
                          persist({
                            ...state,
                            categories: state.categories.map((c) =>
                              c.id === activeCategory.id
                                ? { ...c, questions: c.questions.filter((i) => i.id !== q.id) }
                                : c
                            ),
                          })
                        }
                        className="p-1 text-[#8A8998] hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isEditMode ? (
                    <textarea
                      rows={2}
                      value={q.answer}
                      onChange={(e) =>
                        persist({
                          ...state,
                          categories: state.categories.map((c) =>
                            c.id === activeCategory.id
                              ? {
                                  ...c,
                                  questions: c.questions.map((item) =>
                                    item.id === q.id ? { ...item, answer: e.target.value } : item
                                  ),
                                }
                              : c
                          ),
                        })
                      }
                      placeholder="답변을 입력하세요"
                      className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs resize-none"
                    />
                  ) : (
                    <p
                      className={`text-xs leading-relaxed ${
                        q.answer
                          ? 'text-[#4E4D59] dark:text-[#B4B2C4]'
                          : 'italic text-[#9E9CAF]'
                      }`}
                    >
                      {q.answer || '아직 답변이 없습니다'}
                    </p>
                  )}
                </div>
              ))}

              {isEditMode && (
                <button
                  type="button"
                  onClick={() => addQuestion('새 질문')}
                  className="min-h-[110px] rounded-2xl border border-dashed border-[#DCD8EC] dark:border-[#323244] text-xs font-semibold text-[#6A5ACD] hover:bg-[#F3F1FB]/50"
                >
                  + 질문 추가
                </button>
              )}
            </div>

            {!isEditMode && (
              <p className="text-[11.5px] text-[#8A8998]">
                질문 문구는 예시입니다. 편집 모드에서 질문을 추가·수정·삭제할 수 있습니다.
              </p>
            )}
          </div>
        </div>

        {/* Right Panel in Edit Mode */}
        {isEditMode && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 select-none">
            <div>
              <h3 className="text-sm font-bold">질문 추가</h3>
              <p className="text-[11px] text-[#8A8998] mt-0.5">
                현재 분류: {activeCategory?.name}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] text-[#8A8998]">직접 입력</div>
              <input
                type="text"
                value={customQ}
                onChange={(e) => setCustomQ(e.target.value)}
                placeholder="질문을 입력하세요"
                className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  addQuestion(customQ);
                  setCustomQ('');
                }}
                className="py-2 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
              >
                질문 추가
              </button>
            </div>

            <div className="pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938] flex flex-col gap-2">
              <div className="text-[11px] text-[#8A8998]">추천 질문</div>
              {RECOMMENDED_QUESTIONS.map((rq) => (
                <div key={rq} className="flex items-center justify-between text-xs py-1">
                  <span>{rq}</span>
                  <button
                    type="button"
                    onClick={() => addQuestion(rq)}
                    className="text-[#6A5ACD] font-semibold hover:underline"
                  >
                    + 추가
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      <DocumentLinkModal
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
        onSelect={(doc) => {
          persist({
            ...state,
            linkedCharDocId: doc.id,
            linkedCharName: doc.title,
          });
          showToast(`'${doc.title}' 문서를 연결했습니다`);
        }}
      />
    </div>
  );
};
