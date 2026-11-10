import React from 'react';
import {
  DialogueLineNode,
  DialogueSpeaker,
} from '../../../../types/dialogue';
import {
  Plus,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  Split,
  MessageSquare,
  Tag,
  User,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

interface DialogueListViewProps {
  dialogues: DialogueLineNode[];
  selectedDialogueId: string | null;
  speakers: DialogueSpeaker[];
  isEditMode: boolean;
  onSelectDialogue: (id: string) => void;
  onAddDialogue: (afterId?: string) => void;
  onDeleteDialogue: (id: string) => void;
  onDuplicateDialogue: (id: string) => void;
  onMoveOrder: (id: string, direction: 'up' | 'down') => void;
  onUpdateDialogue: (id: string, updates: Partial<DialogueLineNode>) => void;
}

export const DialogueListView: React.FC<DialogueListViewProps> = ({
  dialogues,
  selectedDialogueId,
  speakers,
  isEditMode,
  onSelectDialogue,
  onAddDialogue,
  onDeleteDialogue,
  onDuplicateDialogue,
  onMoveOrder,
  onUpdateDialogue,
}) => {
  // Sort dialogues by order
  const sortedDialogues = [...dialogues].sort((a, b) => a.order - b.order);

  // Helper to find dialogue target label
  const getTargetLabel = (targetId?: string) => {
    if (!targetId) return '대화 종료';
    const target = dialogues.find((d) => d.id === targetId);
    if (!target) return '미연결';
    return `#${String(target.order).padStart(2, '0')} (${target.speakerName || '나레이션'})`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center bg-[#FAFBFD] dark:bg-dark-bg select-none">
      <div className="w-full max-w-3xl flex flex-col gap-3">
        {/* Top Summary Banner */}
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-dark-text">
              대사 시나리오 흐름
            </span>
            <span className="text-[11px] text-slate-400 dark:text-dark-textSecondary">
              (총 {sortedDialogues.length}개 대사)
            </span>
          </div>

          {isEditMode && (
            <button
              type="button"
              onClick={() => onAddDialogue()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 대사 추가</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {sortedDialogues.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-dark-border rounded-3xl bg-white dark:bg-dark-surface flex flex-col items-center gap-3">
            <MessageSquare className="w-10 h-10 text-slate-300 dark:text-dark-textSecondary" />
            <div className="text-xs text-slate-500 dark:text-dark-textSecondary">
              작성된 대사가 없습니다. 새 대사를 추가해보세요.
            </div>
            {isEditMode && (
              <button
                type="button"
                onClick={() => onAddDialogue()}
                className="px-4 py-2 bg-lavender-600 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                첫 대사 추가
              </button>
            )}
          </div>
        ) : (
          /* Dialogue Card List */
          sortedDialogues.map((dlg, idx) => {
            const isSelected = selectedDialogueId === dlg.id;
            const hasChoices = dlg.choices && dlg.choices.length > 0;

            return (
              <div
                key={dlg.id}
                onClick={() => onSelectDialogue(dlg.id)}
                className={`group relative bg-white dark:bg-dark-surface rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'border-lavender-500 ring-4 ring-lavender-100 dark:ring-lavender-950/60 shadow-md'
                    : 'border-slate-200/90 dark:border-dark-border hover:border-slate-300 dark:hover:border-lavender-800'
                }`}
              >
                {/* Header Row: Order Number + Speaker Avatar + Name + Flow Badge + Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Order Index */}
                    <span className="font-mono text-xs font-extrabold text-slate-400 dark:text-dark-textSecondary w-6 shrink-0">
                      #{String(dlg.order).padStart(2, '0')}
                    </span>

                    {/* Speaker Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border shrink-0 flex items-center justify-center">
                      {dlg.speakerAvatarUrl ? (
                        <img
                          src={dlg.speakerAvatarUrl}
                          alt={dlg.speakerName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    {/* Speaker Name */}
                    <span className="font-bold text-xs text-slate-800 dark:text-dark-text truncate">
                      {dlg.speakerName || '나레이션 (화자 없음)'}
                    </span>

                    {dlg.speakerRole && (
                      <span className="text-[10px] text-slate-400 dark:text-dark-textSecondary font-medium truncate">
                        • {dlg.speakerRole}
                      </span>
                    )}
                  </div>

                  {/* Flow Status Badges & Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Choice Badge */}
                    {hasChoices ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/40">
                        <Split className="w-3 h-3" />
                        <span>선택지 {dlg.choices.length}개</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-dark-elevated text-slate-500 dark:text-dark-textSecondary">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span>{getTargetLabel(dlg.nextDialogueId)}</span>
                      </span>
                    )}

                    {/* Memo Indicator */}
                    {dlg.memo?.trim() && (
                      <span title={dlg.memo} className="text-xs">
                        💬
                      </span>
                    )}

                    {/* Edit Mode Actions */}
                    {isEditMode && (
                      <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveOrder(dlg.id, 'up');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-dark-text disabled:opacity-20"
                          title="위로 이동"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === sortedDialogues.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveOrder(dlg.id, 'down');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-dark-text disabled:opacity-20"
                          title="아래로 이동"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateDialogue(dlg.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-dark-text"
                          title="대사 복제"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDialogue(dlg.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="대사 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Speech Bubble / Dialogue Text (Auto-Height, No internal scroll) */}
                <div className="bg-slate-50 dark:bg-dark-elevated rounded-xl p-3 border border-slate-100 dark:border-dark-border flex flex-col gap-2">
                  {isEditMode ? (
                    <textarea
                      rows={2}
                      value={dlg.text}
                      onChange={(e) => onUpdateDialogue(dlg.id, { text: e.target.value })}
                      placeholder="대사 내용을 입력하세요."
                      className="w-full bg-transparent text-xs text-slate-800 dark:text-dark-text font-medium leading-relaxed resize-none focus:outline-none whitespace-pre-wrap break-words"
                    />
                  ) : (
                    <p className="text-xs text-slate-800 dark:text-dark-text font-medium leading-relaxed whitespace-pre-wrap break-words">
                      {dlg.text || <span className="text-slate-400 italic">대사 내용 없음</span>}
                    </p>
                  )}

                  {/* If choices exist, display choices preview inside card */}
                  {hasChoices && (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200/60 dark:border-dark-border">
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Split className="w-3 h-3" />
                        <span>플레이어 선택지 분기:</span>
                      </span>
                      <div className="flex flex-col gap-1">
                        {dlg.choices.map((c, cIdx) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between bg-white dark:bg-dark-surface px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-dark-border text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-dark-text truncate">
                              {cIdx + 1}. {c.text}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                              → {getTargetLabel(c.nextDialogueId)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Tags List */}
                {dlg.tags && dlg.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {dlg.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-lavender-50 dark:bg-lavender-900/40 text-lavender-700 dark:text-lavender-300 border border-lavender-200/60 dark:border-lavender-800/40"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

