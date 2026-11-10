import React, { useState } from 'react';
import { useWorkspace } from '../../../../store/WorkspaceContext';
import { TEMPLATES } from '../../../../templates/templateList';
import {
  X,
  Search,
  FileText,
  MapPin,
  Clock,
  Book,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Document } from '../../../../types';

interface LinkDocumentModalProps {
  isOpen: boolean;
  selectedDocIds: string[];
  isMultiSelect?: boolean;
  title?: string;
  onSelect: (docIds: string[]) => void;
  onClose: () => void;
}

export const LinkDocumentModal: React.FC<LinkDocumentModalProps> = ({
  isOpen,
  selectedDocIds,
  isMultiSelect = true,
  title = '연결할 문서 선택',
  onSelect,
  onClose,
}) => {
  const { documents, activeProject, activeDocument } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSelected, setCurrentSelected] = useState<string[]>(selectedDocIds);

  if (!isOpen) return null;

  // Filter current project's documents excluding self
  const projectDocs = documents.filter(
    (d) => d.projectId === activeProject?.id && d.id !== activeDocument?.id
  );

  const filteredDocs = projectDocs.filter((d) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const tDef = TEMPLATES.find((t) => t.id === d.templateType);
    return (
      d.title.toLowerCase().includes(query) ||
      (tDef && tDef.name.toLowerCase().includes(query))
    );
  });

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'world-map-factions':
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case 'world-chronicle':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'world-glossary':
        return <Book className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-lavender-500" />;
    }
  };

  const getTemplateName = (type: string) => {
    const t = TEMPLATES.find((item) => item.id === type);
    return t ? t.name : '일반 문서';
  };

  const toggleSelect = (id: string) => {
    if (!isMultiSelect) {
      setCurrentSelected([id]);
      return;
    }
    if (currentSelected.includes(id)) {
      setCurrentSelected(currentSelected.filter((docId) => docId !== id));
    } else {
      setCurrentSelected([...currentSelected, id]);
    }
  };

  const handleConfirm = () => {
    onSelect(currentSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E27] rounded-2xl border border-slate-200 dark:border-[#3A3948] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#3A3948] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">{title}</h3>
            <p className="text-[11px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              세계관 시트에서 바로 이동할 수 있는 관련 문서를 연결합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-[#3A3948] bg-slate-50 dark:bg-[#252532]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="문서 제목 또는 템플릿 유형 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[220px]">
          {filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-[#A5A3B5]">
              {searchQuery ? '검색된 문서가 없습니다.' : '연결 가능한 프로젝트 문서가 없습니다.'}
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = currentSelected.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelect(doc.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-lavender-50/80 dark:bg-[#352E58]/40 border-lavender-300 dark:border-lavender-600/60 shadow-2xs'
                      : 'bg-white dark:bg-[#252532] border-slate-200/70 dark:border-[#3A3948] hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1E1E27] flex items-center justify-center shrink-0">
                      {getTemplateIcon(doc.templateType)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                        {doc.title || '제목 없는 문서'}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5] inline-block mt-0.5">
                        {getTemplateName(doc.templateType)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-lavender-600 border-lavender-600 text-white'
                        : 'border-slate-300 dark:border-[#4E4D61] bg-white dark:bg-[#1E1E27]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-[#3A3948] bg-slate-50 dark:bg-[#252532] flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-[#A5A3B5]">
            선택된 문서: <strong className="text-lavender-600 dark:text-lavender-400">{currentSelected.length}개</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-200/60 dark:hover:bg-[#3A3948] rounded-xl font-medium transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-1.5 text-xs bg-lavender-600 hover:bg-lavender-500 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              연결 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

