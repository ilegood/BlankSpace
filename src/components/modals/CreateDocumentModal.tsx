import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../../templates/templateList';
import { TemplateCategoryType } from '../../types';
import { useToast } from '../toast/ToastContext';

export const CreateDocumentModal: React.FC = () => {
  const {
    isCreateDocumentOpen,
    setIsCreateDocumentOpen,
    createDocument,
    openDocument,
    userTemplates,
    createUserTemplate,
    deleteUserTemplate,
    openTemplateEditor,
  } = useWorkspace();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<TemplateCategoryType | 'user'>('character');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('character-sheet');
  const [selectedUserTemplateId, setSelectedUserTemplateId] = useState<string | null>(null);
  const [isCreatingUserTpl, setIsCreatingUserTpl] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplBase, setNewTplBase] = useState('character-sheet');

  useEffect(() => {
    if (isCreateDocumentOpen) {
      setSelectedCategory('character');
      setSelectedTemplateId('character-sheet');
      setSelectedUserTemplateId(null);
      setIsCreatingUserTpl(false);
    }
  }, [isCreateDocumentOpen]);

  useEffect(() => {
    if (!isCreateDocumentOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCreateDocumentOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCreateDocumentOpen, setIsCreateDocumentOpen]);

  if (!isCreateDocumentOpen) return null;

  const categoryTemplates =
    selectedCategory === 'user'
      ? []
      : TEMPLATES.filter((t) => !t.hidden && t.category === selectedCategory);

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId);
  const selectedUserTpl = userTemplates.find((u) => u.id === selectedUserTemplateId);

  const handleCategorySelect = (cat: TemplateCategoryType | 'user') => {
    setSelectedCategory(cat);
    setIsCreatingUserTpl(false);
    if (cat === 'user') {
      setSelectedUserTemplateId(userTemplates[0]?.id || null);
    } else {
      setSelectedUserTemplateId(null);
      const first = TEMPLATES.find((t) => !t.hidden && t.category === cat);
      if (first) setSelectedTemplateId(first.id);
    }
  };

  const handleCreate = () => {
    if (selectedCategory === 'user' && selectedUserTpl) {
      const doc = createDocument(
        selectedUserTpl.name,
        selectedUserTpl.baseTemplateType,
        selectedUserTpl.category,
        selectedUserTpl.content
      );
      setIsCreateDocumentOpen(false);
      openDocument(doc.id);
      showToast(`'${doc.title}' 문서를 만들었습니다`);
      return;
    }

    if (!selectedTemplate) return;
    const doc = createDocument(
      selectedTemplate.defaultTitle,
      selectedTemplate.id,
      selectedTemplate.category
    );
    setIsCreateDocumentOpen(false);
    openDocument(doc.id);
    showToast(`'${doc.title}' 문서를 만들었습니다`);
  };

  const handleCreateUserTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;
    const base = TEMPLATES.find((t) => t.id === newTplBase);
    const created = createUserTemplate(
      newTplName,
      `${base?.name || '기본'} 기반 사용자 템플릿`,
      base?.category || 'general',
      newTplBase,
      base?.defaultContent || ''
    );
    setNewTplName('');
    setIsCreatingUserTpl(false);
    setSelectedCategory('user');
    setSelectedUserTemplateId(created.id);
    showToast(`사용자 템플릿 '${created.name}'이 추가되었습니다`);
  };

  const ctaLabel =
    selectedCategory === 'user'
      ? selectedUserTpl
        ? `${selectedUserTpl.name}로 만들기`
        : '템플릿 선택'
      : `${selectedTemplate?.name || '템플릿'}로 만들기`;

  return (
    <div
      onClick={() => setIsCreateDocumentOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bs-animate-modal w-full max-w-[780px] rounded-[22px] bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-7 pt-6 pb-3">
          <h2 className="text-[19px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">새 문서 만들기</h2>
        </div>

        <div className="flex flex-1 min-h-[340px] max-h-[420px] px-7 pb-4 gap-6">
          <div className="w-[155px] shrink-0 flex flex-col gap-1">
            {TEMPLATE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id && !isCreatingUserTpl;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-[13px] transition-all duration-150 ${
                    active
                      ? 'bg-[#F8F7FC] dark:bg-[#262436] text-[#1B1B1F] dark:text-[#F1F0F6] font-semibold border border-[#E6E3F0] dark:border-[#38344E]'
                      : 'text-[#555464] dark:text-[#9E9CAF] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}

            <div className="mt-3 pt-3 border-t border-[#EAE7F2] dark:border-[#2E2D3D] flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleCategorySelect('user')}
                className={`w-full text-left px-3.5 py-1.5 rounded-xl text-[11.5px] font-medium transition-colors ${
                  selectedCategory === 'user' && !isCreatingUserTpl
                    ? 'bg-[#F8F7FC] dark:bg-[#262436] text-[#1B1B1F] dark:text-[#F1F0F6] font-semibold'
                    : 'text-[#8A8998] dark:text-[#787689] hover:text-[#1B1B1F] dark:hover:text-white'
                }`}
              >
                내 템플릿 ({userTemplates.length})
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingUserTpl(true)}
                className={`w-full text-left px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-colors ${
                  isCreatingUserTpl
                    ? 'bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] font-semibold'
                    : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:text-[#6A5ACD]'
                }`}
              >
                + 사용자 템플릿
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {isCreatingUserTpl ? (
              <form
                onSubmit={handleCreateUserTemplate}
                className="bs-animate-fade p-5 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-[#FAF9FE] dark:bg-[#171720] flex flex-col gap-4"
              >
                <h3 className="text-sm font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  새 사용자 템플릿 만들기
                </h3>
                <div>
                  <label className="block text-xs font-medium text-[#6E6D7A] dark:text-[#9E9CAF] mb-1">
                    템플릿 이름
                  </label>
                  <input
                    type="text"
                    required
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    placeholder="예: 내 캐릭터 설정집"
                    className="w-full h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6E6D7A] dark:text-[#9E9CAF] mb-1">
                    기반 템플릿 복제
                  </label>
                  <select
                    value={newTplBase}
                    onChange={(e) => setNewTplBase(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
                  >
                    {TEMPLATES.filter((t) => !t.hidden).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingUserTpl(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
                  >
                    템플릿 저장
                  </button>
                </div>
              </form>
            ) : selectedCategory === 'user' ? (
              userTemplates.length === 0 ? (
                <div className="h-44 rounded-2xl border border-dashed border-[#DCD8EC] dark:border-[#323244] flex flex-col items-center justify-center text-center p-6 gap-2">
                  <p className="text-xs text-[#6E6D7A] dark:text-[#9E9CAF]">
                    아직 저장된 사용자 템플릿이 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingUserTpl(true)}
                    className="text-xs font-semibold text-[#6A5ACD] dark:text-[#9A8FE6] hover:underline"
                  >
                    + 사용자 템플릿 만들기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3.5 bs-animate-fade">
                  {userTemplates.map((tpl) => {
                    const selected = selectedUserTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedUserTemplateId(tpl.id)}
                        className={`group relative rounded-2xl border overflow-hidden cursor-pointer transition-all ${
                          selected
                            ? 'border-[#6A5ACD] ring-1 ring-[#6A5ACD]/30'
                            : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                        }`}
                      >
                        <div className="h-24 bg-[#F6F5FB] dark:bg-[#242334] relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUserTemplate(tpl.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md bg-white/80 dark:bg-black/40 text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="px-3.5 py-2.5 bg-white dark:bg-[#1E1E29]">
                          <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                            {tpl.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div key={selectedCategory} className="bs-animate-fade">
                <div className="grid grid-cols-3 gap-3.5">
                  {categoryTemplates.map((tpl) => {
                    const selected = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        onDoubleClick={handleCreate}
                        className={`rounded-2xl border overflow-hidden cursor-pointer transition-all duration-150 ${
                          selected
                            ? 'border-[#6A5ACD] ring-1 ring-[#6A5ACD]/30 shadow-xs'
                            : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                        }`}
                      >
                        <div className="h-24 bg-[#F5F4FB] dark:bg-[#242334] flex items-center justify-center">
                          <div className="w-12 h-8 rounded-lg bg-[#EBE8F5] dark:bg-[#312D4B]" />
                        </div>
                        <div className="px-3.5 py-2.5 bg-white dark:bg-[#1E1E29] flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                            {tpl.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11.5px] text-[#8A8998] dark:text-[#787689]">
                  <span>기본 템플릿은 수정하거나 원래 상태로 복원할 수 있습니다.</span>
                  {selectedTemplate && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateDocumentOpen(false);
                        openTemplateEditor(selectedTemplate.id);
                      }}
                      className="text-[#6A5ACD] dark:text-[#9A8FE6] font-medium hover:underline shrink-0 ml-2"
                    >
                      기본 템플릿 수정
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-7 py-4 flex items-center justify-end gap-2.5 border-t border-[#EAE7F2]/60 dark:border-[#2E2D3D]/60">
          <button
            type="button"
            onClick={() => setIsCreateDocumentOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5 dark:hover:bg-white/5"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={selectedCategory === 'user' && !selectedUserTpl}
            className="px-5 py-2 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] disabled:opacity-40 text-white text-xs font-semibold transition-colors"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
