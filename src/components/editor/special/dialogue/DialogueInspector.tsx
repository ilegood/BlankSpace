import React, { useState } from 'react';
import {
  DialogueLineNode,
  DialogueSpeaker,
  DialogueChoice,
} from '../../../../types/dialogue';
import {
  User,
  Plus,
  Trash2,
  Copy,
  Split,
  Tag,
  X,
  MessageSquare,
  ArrowRight,
  GitBranch,
  FileText,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface DialogueInspectorProps {
  selectedDialogue: DialogueLineNode | null;
  allDialogues: DialogueLineNode[];
  speakers: DialogueSpeaker[];
  isEditMode: boolean;
  onUpdateDialogue: (id: string, updates: Partial<DialogueLineNode>) => void;
  onDeleteDialogue: (id: string) => void;
  onDuplicateDialogue: (id: string) => void;
  onAddSpeaker: (speaker: DialogueSpeaker) => void;
}

export const DialogueInspector: React.FC<DialogueInspectorProps> = ({
  selectedDialogue,
  allDialogues,
  speakers,
  isEditMode,
  onUpdateDialogue,
  onDeleteDialogue,
  onDuplicateDialogue,
  onAddSpeaker,
}) => {
  const { customConfirm, toast } = useToast();
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingSpeaker, setIsAddingSpeaker] = useState(false);
  const [customSpeakerName, setCustomSpeakerName] = useState('');
  const [customSpeakerRole, setCustomSpeakerRole] = useState('');

  if (!selectedDialogue) {
    return (
      <div className="w-80 bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border flex flex-col shrink-0 select-none overflow-hidden h-full p-6 text-center justify-center">
        <MessageSquare className="w-8 h-8 text-slate-300 dark:text-dark-textSecondary m-auto mb-2" />
        <span className="text-xs text-slate-400 dark:text-dark-textSecondary">
          대사를 선택하면 속성을 편집할 수 있습니다.
        </span>
      </div>
    );
  }

  // Tag Handling
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    if (!selectedDialogue.tags.includes(tag)) {
      onUpdateDialogue(selectedDialogue.id, {
        tags: [...selectedDialogue.tags, tag],
      });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    onUpdateDialogue(selectedDialogue.id, {
      tags: selectedDialogue.tags.filter((t) => t !== tag),
    });
  };

  // Choice Handling
  const handleAddChoice = () => {
    const newChoice: DialogueChoice = {
      id: `ch-${Date.now()}`,
      text: '새로운 선택지 내용',
      nextDialogueId: undefined,
    };
    onUpdateDialogue(selectedDialogue.id, {
      choices: [...(selectedDialogue.choices || []), newChoice],
    });
    toast.success('새 선택지가 추가되었습니다.');
  };

  const handleUpdateChoice = (choiceId: string, updates: Partial<DialogueChoice>) => {
    const nextChoices = (selectedDialogue.choices || []).map((c) =>
      c.id === choiceId ? { ...c, ...updates } : c
    );
    onUpdateDialogue(selectedDialogue.id, { choices: nextChoices });
  };

  const handleDeleteChoice = (choiceId: string) => {
    const nextChoices = (selectedDialogue.choices || []).filter((c) => c.id !== choiceId);
    onUpdateDialogue(selectedDialogue.id, { choices: nextChoices });
  };

  // Speaker Custom Addition
  const handleCreateSpeaker = () => {
    if (!customSpeakerName.trim()) return;
    const newSpk: DialogueSpeaker = {
      name: customSpeakerName.trim(),
      role: customSpeakerRole.trim() || undefined,
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    };
    onAddSpeaker(newSpk);
    onUpdateDialogue(selectedDialogue.id, {
      speakerName: newSpk.name,
      speakerRole: newSpk.role,
      speakerAvatarUrl: newSpk.avatarUrl,
    });
    setCustomSpeakerName('');
    setCustomSpeakerRole('');
    setIsAddingSpeaker(false);
    toast.success(`'${newSpk.name}' 화자가 추가되었습니다.`);
  };

  // Available target dialogues excluding self
  const candidateTargets = allDialogues.filter((d) => d.id !== selectedDialogue.id);

  return (
    <div className="w-80 bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50 dark:bg-dark-elevated">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs font-bold text-lavender-600 dark:text-lavender-400">
            #{String(selectedDialogue.order).padStart(2, '0')}
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-dark-text truncate">
            대사 속성
          </span>
        </div>

        {isEditMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onDuplicateDialogue(selectedDialogue.id)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-dark-text hover:bg-slate-200/60 dark:hover:bg-dark-surface rounded-lg"
              title="대사 복제"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteDialogue(selectedDialogue.id)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
              title="대사 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Body Scrollable Attributes */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {/* 1. Speaker Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary">
              화자 선택
            </span>
            {isEditMode && (
              <button
                type="button"
                onClick={() => setIsAddingSpeaker(!isAddingSpeaker)}
                className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline"
              >
                {isAddingSpeaker ? '취소' : '+ 새 화자'}
              </button>
            )}
          </div>

          {/* New Speaker Inline Form */}
          {isAddingSpeaker && (
            <div className="p-2.5 bg-lavender-50 dark:bg-lavender-900/20 rounded-xl border border-lavender-200 dark:border-lavender-800 flex flex-col gap-2">
              <input
                type="text"
                placeholder="화자 이름 (예: 신관, 엑스트라)"
                value={customSpeakerName}
                onChange={(e) => setCustomSpeakerName(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="역할 (선택 사항)"
                value={customSpeakerRole}
                onChange={(e) => setCustomSpeakerRole(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleCreateSpeaker}
                className="w-full py-1 bg-lavender-600 text-white font-bold rounded-lg text-xs"
              >
                화자 등록 및 적용
              </button>
            </div>
          )}

          {/* Speaker Select Dropdown */}
          {isEditMode ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedDialogue.speakerName}
                onChange={(e) => {
                  const spk = speakers.find((s) => s.name === e.target.value);
                  if (spk) {
                    onUpdateDialogue(selectedDialogue.id, {
                      speakerName: spk.name,
                      speakerRole: spk.role,
                      speakerAvatarUrl: spk.avatarUrl,
                    });
                  } else {
                    onUpdateDialogue(selectedDialogue.id, {
                      speakerName: '',
                      speakerRole: '',
                      speakerAvatarUrl: '',
                    });
                  }
                }}
                className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500"
              >
                <option value="">(화자 없음 / 나레이션)</option>
                {speakers.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} {s.role ? `(${s.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200 dark:border-dark-border">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-white dark:bg-dark-surface shrink-0 border border-slate-200 dark:border-dark-border flex items-center justify-center">
                {selectedDialogue.speakerAvatarUrl ? (
                  <img
                    src={selectedDialogue.speakerAvatarUrl}
                    alt={selectedDialogue.speakerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <span className="font-bold text-slate-800 dark:text-dark-text">
                {selectedDialogue.speakerName || '나레이션'}
              </span>
            </div>
          )}
        </div>

        {/* 2. Dialogue Speech Text */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary">
            대사 내용
          </span>
          {isEditMode ? (
            <textarea
              rows={4}
              value={selectedDialogue.text}
              onChange={(e) => onUpdateDialogue(selectedDialogue.id, { text: e.target.value })}
              placeholder="대사 내용을 입력하세요."
              className="w-full p-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs leading-relaxed resize-none focus:outline-none focus:border-lavender-500"
            />
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200/80 dark:border-dark-border text-xs leading-relaxed text-slate-800 dark:text-dark-text whitespace-pre-wrap">
              {selectedDialogue.text || '대사 내용 없음'}
            </div>
          )}
        </div>

        {/* 3. Expression Tags */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-dark-border">
          <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary">
            표현 태그
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedDialogue.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-lavender-50 dark:bg-lavender-900/40 text-lavender-700 dark:text-lavender-300 text-[11px] font-semibold border border-lavender-200/70 dark:border-lavender-800/40"
              >
                <span>#{t}</span>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-lavender-400 hover:text-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditMode && (
            <div className="flex gap-1.5 mt-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="태그 입력 후 추가"
                className="flex-1 px-2.5 py-1 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2.5 py-1 bg-lavender-100 dark:bg-lavender-900/50 text-lavender-700 dark:text-lavender-300 font-bold rounded-lg text-xs hover:bg-lavender-200"
              >
                추가
              </button>
            </div>
          )}
        </div>

        {/* 4. Choice System (Requirement 7) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary flex items-center gap-1">
              <Split className="w-3.5 h-3.5 text-amber-500" />
              <span>플레이어 선택지 ({selectedDialogue.choices?.length || 0})</span>
            </span>
            {isEditMode && (
              <button
                type="button"
                onClick={handleAddChoice}
                className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>선택지 추가</span>
              </button>
            )}
          </div>

          {/* Choices List */}
          <div className="flex flex-col gap-2">
            {(selectedDialogue.choices || []).map((c, cIdx) => (
              <div
                key={c.id}
                className="p-2.5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400">
                    선택지 #{cIdx + 1}
                  </span>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteChoice(c.id)}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {isEditMode ? (
                  <>
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => handleUpdateChoice(c.id, { text: e.target.value })}
                      placeholder="선택지 문구..."
                      className="px-2 py-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg text-xs font-semibold"
                    />

                    {/* Next Dialogue Connection Dropdown */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-500 shrink-0">이동 대상:</span>
                      <select
                        value={c.nextDialogueId || ''}
                        onChange={(e) =>
                          handleUpdateChoice(c.id, {
                            nextDialogueId: e.target.value || undefined,
                          })
                        }
                        className="flex-1 px-1.5 py-0.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded text-[11px]"
                      >
                        <option value="">(연결 없음 / 대화 종료)</option>
                        {candidateTargets.map((t) => (
                          <option key={t.id} value={t.id}>
                            #{String(t.order).padStart(2, '0')} ({t.speakerName || '나레이션'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={c.result || ''}
                      onChange={(e) => handleUpdateChoice(c.id, { result: e.target.value })}
                      placeholder="결과 / 보상 (선택 사항)"
                      className="px-2 py-0.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded text-[11px] text-slate-500"
                    />
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-800 dark:text-dark-text">
                      "{c.text}"
                    </span>
                    <span className="text-[10px] text-slate-400">
                      → 이동: {c.nextDialogueId ? `대사 #${allDialogues.find((d) => d.id === c.nextDialogueId)?.order || ''}` : '대화 종료'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5. Direct Next Flow (Only if no choices) */}
        {(!selectedDialogue.choices || selectedDialogue.choices.length === 0) && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-dark-border">
            <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary">
              다음 대사 연결 (순차 진행)
            </span>

            {isEditMode ? (
              <select
                value={selectedDialogue.nextDialogueId || ''}
                onChange={(e) =>
                  onUpdateDialogue(selectedDialogue.id, {
                    nextDialogueId: e.target.value || undefined,
                  })
                }
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-800 dark:text-dark-text focus:outline-none focus:border-lavender-500"
              >
                <option value="">(연결 없음 / 대화 종료)</option>
                {candidateTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{String(t.order).padStart(2, '0')} ({t.speakerName || '나레이션'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200 dark:border-dark-border text-xs text-slate-700 dark:text-dark-text">
                {selectedDialogue.nextDialogueId
                  ? `→ #${allDialogues.find((d) => d.id === selectedDialogue.nextDialogueId)?.order} (${allDialogues.find((d) => d.id === selectedDialogue.nextDialogueId)?.speakerName || '나레이션'})`
                  : '대화 종료 지점'}
              </div>
            )}
          </div>
        )}

        {/* 6. Memo Section */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-dark-border">
          <span className="text-[11px] font-bold text-slate-500 dark:text-dark-textSecondary flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-lavender-600" />
            <span>대사 연출 및 기획 메모</span>
          </span>
          {isEditMode ? (
            <textarea
              rows={3}
              value={selectedDialogue.memo || ''}
              onChange={(e) => onUpdateDialogue(selectedDialogue.id, { memo: e.target.value })}
              placeholder="표정 연출이나 성우 디렉팅, 기획 비고를 입력하세요."
              className="w-full p-2.5 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-xl text-xs leading-relaxed resize-none focus:outline-none focus:border-lavender-500"
            />
          ) : (
            <div className="p-2.5 bg-slate-50 dark:bg-dark-elevated rounded-xl border border-slate-200 dark:border-dark-border text-xs text-slate-600 dark:text-dark-textSecondary leading-relaxed whitespace-pre-wrap">
              {selectedDialogue.memo || '작성된 연출 메모가 없습니다.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

