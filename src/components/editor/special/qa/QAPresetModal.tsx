import React, { useState } from 'react';
import { X, BookmarkPlus, FolderDown, Trash2, Edit2, Copy, Check, AlertCircle } from 'lucide-react';
import { QAPreset, QAItem } from '../../../../types/characterQA';
import { useToast } from '../../../toast/ToastContext';

interface QAPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: QAPreset[];
  currentQuestions: QAItem[];
  onApplyPreset: (preset: QAPreset, mode: 'replace' | 'append') => void;
  onSavePreset: (name: string, questions: string[]) => void;
  onRenamePreset: (id: string, newName: string) => void;
  onDuplicatePreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
}

export const QAPresetModal: React.FC<QAPresetModalProps> = ({
  isOpen,
  onClose,
  presets,
  currentQuestions,
  onApplyPreset,
  onSavePreset,
  onRenamePreset,
  onDuplicatePreset,
  onDeletePreset,
}) => {
  const { toast, customConfirm } = useToast();

  // Tab: 'load' (프리셋 불러오기) vs 'save' (현재 질문 저장)
  const [activeTab, setActiveTab] = useState<'load' | 'save'>('load');

  // New Preset Name State
  const [newPresetName, setNewPresetName] = useState('');

  // Selected Preset for Load
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    presets[0]?.id || null
  );

  // Apply Mode: 'replace' | 'append'
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>('replace');

  // Inline editing of preset name
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  // Save handler
  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      toast.warning('프리셋 이름을 입력해주세요.');
      return;
    }

    const validQuestions = currentQuestions
      .map((q) => q.question.trim())
      .filter((q) => q.length > 0);

    if (validQuestions.length === 0) {
      toast.error('저장할 질문이 없습니다.', '문서에 질문을 먼저 1개 이상 작성해주세요.');
      return;
    }

    onSavePreset(newPresetName.trim(), validQuestions);
    toast.success('프리셋 저장 완료', `'${newPresetName.trim()}' 질문 프리셋이 저장되었습니다.`);
    setNewPresetName('');
    setActiveTab('load');
  };

  // Apply handler
  const handleApply = async () => {
    if (!selectedPreset) return;

    if (applyMode === 'replace' && currentQuestions.length > 0) {
      const confirmed = await customConfirm({
        title: '질문 전체 교체',
        message: '현재 작성된 기존 질문과 답변이 모두 삭제되고 새 프리셋으로 교체됩니다. 계속하시겠습니까?',
        confirmText: '교체하기',
        isDanger: true,
      });
      if (!confirmed) return;
    }

    onApplyPreset(selectedPreset, applyMode);
    toast.success(
      '프리셋 적용 완료',
      applyMode === 'replace'
        ? `'${selectedPreset.name}' 프리셋으로 전체 교체되었습니다.`
        : `'${selectedPreset.name}' 질문들이 목록 끝에 추가되었습니다.`
    );
    onClose();
  };

  const handleStartRename = (preset: QAPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPresetId(preset.id);
    setEditingName(preset.name);
  };

  const handleFinishRename = (id: string) => {
    if (editingName.trim()) {
      onRenamePreset(id, editingName.trim());
      toast.info('프리셋 이름이 변경되었습니다.');
    }
    setEditingPresetId(null);
  };

  const handleDelete = async (preset: QAPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await customConfirm({
      title: '프리셋 삭제',
      message: `'${preset.name}' 프리셋을 삭제하시겠습니까? (기존에 작성된 문서에는 영향을 주지 않습니다)`,
      confirmText: '삭제',
      isDanger: true,
    });
    if (confirmed) {
      onDeletePreset(preset.id);
      if (selectedPresetId === preset.id) {
        setSelectedPresetId(null);
      }
      toast.info('프리셋이 삭제되었습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E27] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-[#3A3948] shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-[#E8E7EF] transition-colors max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#2C2C38] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookmarkPlus className="w-5 h-5 text-lavender-600 dark:text-[#B7A5FF]" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              질문 프리셋 관리
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-[#2C2C38] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-[#2C2C38] bg-slate-50 dark:bg-[#262634] p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('load')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'load'
                ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            프리셋 불러오기
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'save'
                ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            현재 질문을 프리셋으로 저장
          </button>
        </div>

        {/* Tab Content: 불러오기 */}
        {activeTab === 'load' && (
          <div className="flex-1 flex overflow-hidden min-h-[380px]">
            {/* Left: Preset List */}
            <div className="w-1/2 border-r border-slate-100 dark:border-[#2C2C38] p-4 overflow-y-auto space-y-2 custom-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 dark:text-[#8E8B9E] px-1 uppercase tracking-wider block mb-2">
                저장된 프리셋 목록 ({presets.length})
              </span>

              {presets.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-[#8E8B9E] text-xs">
                  저장된 프리셋이 없습니다.
                </div>
              ) : (
                presets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  const isEditing = editingPresetId === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`group p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-lavender-500 bg-lavender-50/60 dark:bg-[#352E58]/50 shadow-2xs'
                          : 'border-slate-200/80 dark:border-[#3A3948] hover:bg-slate-50 dark:hover:bg-[#262634]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleFinishRename(preset.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename(preset.id);
                            }}
                            className="w-full px-2 py-0.5 text-xs font-bold bg-white dark:bg-[#1E1E27] border border-lavender-500 rounded-lg outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                              {preset.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#2A2938] text-slate-500 dark:text-[#A5A3B5] font-semibold shrink-0">
                              {preset.questions.length}문항
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(preset, e)}
                          title="이름 변경"
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicatePreset(preset.id);
                            toast.info('프리셋이 복제되었습니다.');
                          }}
                          title="프리셋 복제"
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(preset, e)}
                          title="프리셋 삭제"
                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Preset Preview & Apply Options */}
            <div className="w-1/2 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
              {selectedPreset ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedPreset.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-[#8E8B9E] mt-0.5">
                        총 {selectedPreset.questions.length}개의 질문 미리보기
                      </p>
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto p-2.5 bg-slate-50 dark:bg-[#262634] rounded-2xl border border-slate-200/80 dark:border-[#3A3948] text-xs">
                      {selectedPreset.questions.map((q, idx) => (
                        <div key={idx} className="flex gap-2 text-slate-700 dark:text-[#E8E7EF]">
                          <span className="font-bold text-lavender-600 dark:text-[#B7A5FF] shrink-0">
                            Q{idx + 1}.
                          </span>
                          <span className="truncate">{q}</span>
                        </div>
                      ))}
                    </div>

                    {/* Apply Mode Selector */}
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-[#A5A3B5] block mb-1.5">
                        적용 방식 선택
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-0.5 transition-all ${
                            applyMode === 'replace'
                              ? 'border-lavender-500 bg-lavender-50/50 dark:bg-[#352E58]/40 font-bold'
                              : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>1. 전체 교체</span>
                            <input
                              type="radio"
                              name="applyMode"
                              checked={applyMode === 'replace'}
                              onChange={() => setApplyMode('replace')}
                              className="accent-lavender-600"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            기존 질문을 지우고 새로 설정
                          </span>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border cursor-pointer flex flex-col gap-0.5 transition-all ${
                            applyMode === 'append'
                              ? 'border-lavender-500 bg-lavender-50/50 dark:bg-[#352E58]/40 font-bold'
                              : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>2. 질문 추가</span>
                            <input
                              type="radio"
                              name="applyMode"
                              checked={applyMode === 'append'}
                              onChange={() => setApplyMode('append')}
                              className="accent-lavender-600"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            기존 답변 유지 + 끝에 추가
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-[#2C2C38] flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-bold text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#262634] transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      className="flex-1 py-2 bg-lavender-600 hover:bg-lavender-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>선택한 프리셋 적용</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs">
                  불러올 프리셋을 왼쪽 목록에서 선택해주세요.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: 현재 질문 프리셋으로 저장 */}
        {activeTab === 'save' && (
          <form onSubmit={handleSaveCurrentAsPreset} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#E8E7EF] mb-1.5">
                새 프리셋 이름
              </label>
              <input
                type="text"
                required
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="예: 최애캐 심층 문답 20제"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#262634] border border-slate-200 dark:border-[#3A3948] text-slate-800 dark:text-[#E8E7EF] focus:border-lavender-500 focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-700/40 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-0.5 text-[11px] leading-relaxed">
                <span className="font-bold block text-xs">안내 사항</span>
                <p>프리셋에는 <strong>질문 목록</strong>만 저장되며, 캐릭터의 <strong>답변 내용은 절대 저장되지 않습니다.</strong></p>
                <p>저장된 프리셋은 다른 캐릭터 문답 문서에서도 언제든지 불러와 재사용할 수 있습니다.</p>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5] block mb-1.5">
                저장될 질문 미리보기 ({currentQuestions.length}문항)
              </span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto p-3 bg-slate-50 dark:bg-[#262634] rounded-2xl border border-slate-200/80 dark:border-[#3A3948] text-xs">
                {currentQuestions.map((q, idx) => (
                  <div key={q.id} className="flex gap-2 text-slate-700 dark:text-[#E8E7EF]">
                    <span className="font-bold text-lavender-600 dark:text-[#B7A5FF] shrink-0">
                      Q{idx + 1}.
                    </span>
                    <span className="truncate">{q.question || '(빈 질문)'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-bold text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#262634] transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!newPresetName.trim() || currentQuestions.length === 0}
                className="flex-1 py-2.5 bg-lavender-600 hover:bg-lavender-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                프리셋으로 저장하기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

