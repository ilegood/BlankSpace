import React, { useState } from 'react';
import {
  DialogueLineNode,
} from '../../../../types/dialogue';
import {
  X,
  Play,
  RotateCcw,
  User,
  ArrowRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface DialoguePreviewModalProps {
  dialogues: DialogueLineNode[];
  isOpen: boolean;
  onClose: () => void;
}

export const DialoguePreviewModal: React.FC<DialoguePreviewModalProps> = ({
  dialogues,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const sortedDialogues = [...dialogues].sort((a, b) => a.order - b.order);
  const firstDialogue = sortedDialogues[0] || null;

  const [currentId, setCurrentId] = useState<string | null>(firstDialogue ? firstDialogue.id : null);
  const [historyTrail, setHistoryTrail] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentDialogue = dialogues.find((d) => d.id === currentId) || null;

  const handleNext = () => {
    if (!currentDialogue) return;

    // If has choices, user MUST click a choice
    if (currentDialogue.choices && currentDialogue.choices.length > 0) {
      return;
    }

    if (currentDialogue.nextDialogueId) {
      setHistoryTrail((prev) => [...prev, currentDialogue.id]);
      setCurrentId(currentDialogue.nextDialogueId);
    } else {
      setIsFinished(true);
    }
  };

  const handleSelectChoice = (nextId?: string) => {
    if (!currentDialogue) return;
    setHistoryTrail((prev) => [...prev, currentDialogue.id]);

    if (nextId) {
      setCurrentId(nextId);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentId(firstDialogue ? firstDialogue.id : null);
    setHistoryTrail([]);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="bg-[#17171D] border border-[#3A3948] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#3A3948] flex items-center justify-between bg-[#1E1E27]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-lavender-400" />
            <span className="font-bold text-xs text-[#E8E7EF]">
              인게임 대화 미리보기 시뮬레이터
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRestart}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#292936] text-[#A5A3B5] hover:text-[#E8E7EF] border border-[#3A3948]"
              title="처음부터 다시 시작"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>재시작</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[#A5A3B5] hover:text-[#E8E7EF]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Screen Simulation Area */}
        <div className="p-8 min-h-[380px] flex flex-col justify-between relative bg-gradient-to-b from-[#1E1E27]/50 to-[#17171D]">
          {/* Top Stage Scene (Avatars in Conversation) */}
          <div className="flex-1 flex items-center justify-center">
            {isFinished ? (
              <div className="flex flex-col items-center gap-3 text-center py-12 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#E8E7EF]">대화가 종료되었습니다</h4>
                  <p className="text-xs text-[#A5A3B5] mt-1">
                    총 {historyTrail.length + 1}개의 대사가 진행되었습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="mt-2 px-4 py-2 bg-lavender-600 hover:bg-lavender-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  다시 시작하기
                </button>
              </div>
            ) : currentDialogue ? (
              <div className="flex flex-col items-center gap-3 animate-in fade-in duration-200">
                {/* Speaker Avatar Standee */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-lavender-500/80 shadow-2xl bg-[#22222C] flex items-center justify-center">
                  {currentDialogue.speakerAvatarUrl ? (
                    <img
                      src={currentDialogue.speakerAvatarUrl}
                      alt={currentDialogue.speakerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-[#64748B]" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#E8E7EF]">
                    {currentDialogue.speakerName || '나레이션'}
                  </span>
                  {currentDialogue.tags && currentDialogue.tags.length > 0 && (
                    <span className="text-[10px] bg-[#292936] text-lavender-300 px-2 py-0.5 rounded-full border border-[#3A3948]">
                      {currentDialogue.tags.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#A5A3B5]">진행할 대사가 없습니다.</div>
            )}
          </div>

          {/* Bottom Game Dialogue Box */}
          {!isFinished && currentDialogue && (
            <div className="flex flex-col gap-3 mt-6">
              {/* Choices Buttons (If choices exist) */}
              {currentDialogue.choices && currentDialogue.choices.length > 0 && (
                <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2">
                  {currentDialogue.choices.map((c, cIdx) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectChoice(c.nextDialogueId)}
                      className="w-full text-left p-3 rounded-2xl bg-[#292936] hover:bg-lavender-900/50 border border-[#3A3948] hover:border-lavender-500 text-[#E8E7EF] font-semibold text-xs shadow-md transition-all flex items-center justify-between group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                          {cIdx + 1}
                        </span>
                        <span>{c.text}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-lavender-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Dialogue Speech Box */}
              <div
                onClick={handleNext}
                className={`p-5 rounded-3xl bg-[#22222C]/95 border border-[#3A3948] shadow-2xl flex flex-col gap-2 ${
                  (!currentDialogue.choices || currentDialogue.choices.length === 0)
                    ? 'cursor-pointer hover:border-lavender-500/60'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-lavender-400">
                    {currentDialogue.speakerName || '나레이션'}
                  </span>
                  <span className="text-[10px] text-[#A5A3B5] font-mono">
                    #{String(currentDialogue.order).padStart(2, '0')}
                  </span>
                </div>

                <p className="text-xs text-[#E8E7EF] leading-relaxed whitespace-pre-wrap font-medium">
                  {currentDialogue.text}
                </p>

                {(!currentDialogue.choices || currentDialogue.choices.length === 0) && (
                  <div className="flex justify-end pt-1">
                    <span className="text-[10px] text-lavender-400/80 animate-pulse flex items-center gap-1 font-semibold">
                      <span>클릭하여 계속</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
