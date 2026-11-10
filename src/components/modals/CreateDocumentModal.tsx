import React, { useState } from 'react';
import { X, User, Globe, Gamepad2, Image, FileText } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TemplateCategoryType } from '../../types';
import { TEMPLATE_CATEGORIES, TEMPLATES } from '../../templates/templateList';
import { getTemplateIcon } from '../../utils/iconMap';

export const CreateDocumentModal: React.FC = () => {
  const { isCreateDocumentOpen, closeCreateDocumentModal, createDocument } = useWorkspace();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategoryType>('character');
  const [docTitle, setDocTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateDocumentOpen) return null;

  const currentCategoryInfo = TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory);
  const filteredTemplates = TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = async (templateId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const template = TEMPLATES.find((t) => t.id === templateId);
      const titleToUse = docTitle.trim() || template?.defaultTitle || '새 문서';
      await createDocument(titleToUse, templateId, selectedCategory);
      setDocTitle('');
      closeCreateDocumentModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (id: TemplateCategoryType) => {
    switch (id) {
      case 'character':
        return <User className="w-4 h-4" />;
      case 'world':
        return <Globe className="w-4 h-4" />;
      case 'planning':
        return <Gamepad2 className="w-4 h-4" />;
      case 'design':
        return <Image className="w-4 h-4" />;
      case 'general':
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
      {/* 
        [중요 기획 요건]: 문서 추가 모달 크기 고정! 
        w-[640px] h-[500px] 크기가 카테고리 전환 시에도 절대 변하지 않음
      */}
      <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal w-[640px] h-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800 text-[15px]">문서 추가</h2>
          <button
            onClick={closeCreateDocumentModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex flex-1 min-h-0">
          {/* Left Column: Category Navigation */}
          <div className="w-48 bg-[#FBFBFE] border-r border-slate-100 p-3 flex flex-col gap-1 shrink-0 overflow-y-auto">
            {TEMPLATE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all text-left font-medium ${
                    isSelected
                      ? 'bg-lavender-100/90 text-lavender-800 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/70'
                  }`}
                >
                  <span className={isSelected ? 'text-lavender-600' : 'text-slate-400'}>
                    {getCategoryIcon(cat.id)}
                  </span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Template List */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Optional Title input bar */}
            <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">문서 제목:</span>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="비워둘 시 템플릿 기본 제목이 적용됩니다"
                className="w-full text-xs px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-lavender-400 text-slate-700 !bg-white"
              />
            </div>

            {/* Template Items (Inner Scroll) */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
              <div className="text-xs font-bold text-slate-700 mb-0.5">
                {currentCategoryInfo?.name} 템플릿
              </div>

              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="group p-3 rounded-xl border border-slate-200/80 hover:border-lavender-300 hover:bg-lavender-50/30 transition-all cursor-pointer flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-lavender-100 text-lavender-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getTemplateIcon(template.iconName, 'w-4 h-4')}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-lavender-700 transition-colors">
                      {template.name}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                      {template.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

