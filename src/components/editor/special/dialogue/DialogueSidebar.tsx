import React, { useState } from 'react';
import {
  DialogueScenario,
} from '../../../../types/dialogue';
import {
  Search,
  Plus,
  MessageSquare,
  Copy,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface DialogueSidebarProps {
  scenarios: DialogueScenario[];
  activeScenarioId: string;
  isEditMode: boolean;
  onSelectScenario: (id: string) => void;
  onAddScenario: (category: string, title?: string) => void;
  onDuplicateScenario: (id: string) => void;
  onRenameScenario: (id: string, newTitle: string) => void;
  onDeleteScenario: (id: string) => void;
  onUpdateCategory: (id: string, newCategory: string) => void;
}

export const DialogueSidebar: React.FC<DialogueSidebarProps> = ({
  scenarios,
  activeScenarioId,
  isEditMode,
  onSelectScenario,
  onAddScenario,
  onDuplicateScenario,
  onRenameScenario,
  onDeleteScenario,
}) => {
  const { customConfirm, toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newScenarioCategory, setNewScenarioCategory] = useState('메인 스토리');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newScenarioTitle, setNewScenarioTitle] = useState('');

  // Group scenarios by category
  const categories = Array.from(new Set(scenarios.map((s) => s.category || '일반')));

  const filteredScenarios = scenarios.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const startRenaming = (s: DialogueScenario, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const submitRenaming = (id: string) => {
    if (editTitle.trim()) {
      onRenameScenario(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = async (s: DialogueScenario, e: React.MouseEvent) => {
    e.stopPropagation();
    if (scenarios.length <= 1) {
      toast.warning('최소 1개의 대화 시나리오가 유지되어야 합니다.');
      return;
    }

    const confirmed = await customConfirm({
      title: '대화 시나리오 삭제',
      message: `'${s.title}' 대화 시나리오를 삭제하시겠습니까? 포함된 모든 대사와 분기가 삭제됩니다.`,
      isDanger: true,
      confirmText: '삭제',
    });

    if (confirmed) {
      onDeleteScenario(s.id);
      toast.info('대화 시나리오가 삭제되었습니다.');
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicateScenario(id);
    toast.success('대화 시나리오가 복제되었습니다.');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScenarioTitle.trim()) return;
    onAddScenario(newScenarioCategory, newScenarioTitle.trim());
    setNewScenarioTitle('');
    setIsAddOpen(false);
    toast.success('새 대화가 추가되었습니다.');
  };

  return (
    <div className="w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800 dark:text-dark-text">대화 목록</span>
          <span className="px-1.5 py-0.2 bg-lavender-100 dark:bg-lavender-900/50 text-lavender-700 dark:text-lavender-300 text-[10px] font-bold rounded-full">
            {scenarios.length}
          </span>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 px-2 py-1 bg-lavender-600 hover:bg-lavender-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>추가</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-100 dark:border-dark-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="시나리오 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-dark-text placeholder-slate-400 focus:outline-none focus:border-lavender-500 transition-colors"
          />
        </div>
      </div>

      {/* Scenario List Grouped by Category */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3">
        {categories.map((cat) => {
          const catScenarios = filteredScenarios.filter((s) => (s.category || '일반') === cat);
          if (catScenarios.length === 0) return null;

          return (
            <div key={cat} className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-dark-textSecondary px-2 tracking-wider uppercase">
                {cat}
              </span>

              <div className="flex flex-col gap-0.5">
                {catScenarios.map((s) => {
                  const isActive = s.id === activeScenarioId;

                  if (editingId === s.id) {
                    return (
                      <div
                        key={s.id}
                        className="p-1.5 bg-lavender-50 dark:bg-lavender-900/30 rounded-xl border border-lavender-300 dark:border-lavender-700 flex items-center gap-1"
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') submitRenaming(s.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs font-semibold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => submitRenaming(s.id)}
                          className="p-1 text-lavender-700 hover:text-lavender-900"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={s.id}
                      onClick={() => onSelectScenario(s.id)}
                      className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-lavender-50 dark:bg-lavender-900/30 border-lavender-200 dark:border-lavender-800 text-lavender-900 dark:text-lavender-200 font-bold shadow-2xs'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-dark-elevated text-slate-700 dark:text-dark-text'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <MessageSquare
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-lavender-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs truncate">{s.title}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5 rounded bg-slate-100 dark:bg-dark-elevated">
                          {s.dialogues?.length || 0}
                        </span>

                        {isEditMode && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => startRenaming(s, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-dark-text"
                              title="이름 변경"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDuplicate(s.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-dark-text"
                              title="복제"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(s, e)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                              title="삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Scenario Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 dark:border-dark-border flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text">새 대화 추가</h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-dark-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-dark-text block mb-1">
                  대화 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newScenarioTitle}
                  onChange={(e) => setNewScenarioTitle(e.target.value)}
                  placeholder="예: 2장. 결전의 서막"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-elevated text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-dark-text block mb-1">
                  카테고리
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {['메인 스토리', '일상 대화', '서브 퀘스트', '특수 이벤트'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewScenarioCategory(c)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                        newScenarioCategory === c
                          ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300'
                          : 'border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-textSecondary'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-dark-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-textSecondary hover:bg-slate-100 dark:hover:bg-dark-elevated"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold shadow-xs"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
