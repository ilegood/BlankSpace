import React from 'react';
import { X, HelpCircle, MousePointer, PenTool, StickyNote, Image, Video, Music, PlaySquare, Eye } from 'lucide-react';

interface IdeaBoardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IdeaBoardHelpModal: React.FC<IdeaBoardHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#252433] rounded-3xl w-full max-w-lg shadow-xl border border-slate-100 dark:border-[#3A3948] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#3A3948] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">메모 & 아이디어 보드 사용법</h2>
              <p className="text-[11px] text-slate-400 dark:text-[#8E8B9E]">자유로운 캔버스에 영감을 스케치하고 모아보세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#1E1E27] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-[#A5A3B5]">
          {/* Section 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E1E27] border border-slate-200/60 dark:border-[#3A3948] flex flex-col gap-2">
            <h3 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-xs flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
              <span>캔버스 탐색 및 기본 조작</span>
            </h3>
            <ul className="space-y-1 text-[11px] leading-relaxed list-disc list-inside">
              <li><strong>선택 툴</strong>로 배치된 메모나 미디어 카드를 드래그하여 자유롭게 이동합니다.</li>
              <li>빈 공간을 마우스로 드래그하면 캔버스 전체를 상하좌우로 이동(Pan)할 수 있습니다.</li>
              <li>우측 상단의 <strong>줌 인/아웃</strong> 또는 마우스 휠로 캔버스를 확대/축소합니다.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E1E27] border border-slate-200/60 dark:border-[#3A3948] flex flex-col gap-2">
            <h3 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-xs flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
              <span>자유 드로잉 (그림 그리기)</span>
            </h3>
            <p className="text-[11px] leading-relaxed">
              상단 툴바에서 <strong>펜 도구</strong>를 선택하면 캔버스 위에 자유롭게 선을 스케치하고 메모할 수 있습니다. 색상 칩과 굵기(얇음, 보통, 굵음)를 조절할 수 있으며, <strong>지우개 도구</strong>로 그린 선을 지울 수 있습니다.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E1E27] border border-slate-200/60 dark:border-[#3A3948] flex flex-col gap-2">
            <h3 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-xs flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span>지원 요소 (기준서 준수)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                <StickyNote className="w-3 h-3 text-amber-500" />
                <span>텍스트 메모 (포스트잇)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Image className="w-3 h-3 text-blue-500" />
                <span>이미지 / GIF 첨부</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Video className="w-3 h-3 text-indigo-500" />
                <span>동영상 파일 카드</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Music className="w-3 h-3 text-emerald-500" />
                <span>사운드 (오디오 재생바)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PlaySquare className="w-3 h-3 text-rose-500" />
                <span>YouTube 임베드 영상</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PenTool className="w-3 h-3 text-lavender-500" />
                <span>자유 드로잉 스케치</span>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E1E27] border border-slate-200/60 dark:border-[#3A3948] flex flex-col gap-2">
            <h3 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-xs flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>보기 모드 & 단축키</span>
            </h3>
            <ul className="space-y-1 text-[11px] leading-relaxed list-disc list-inside">
              <li><kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2A2938] text-[10px] font-mono">Ctrl + E</kbd>: 보기 모드 / 편집 모드 즉시 전환</li>
              <li>보기 모드에서는 도구 모음이 숨겨지고 깔끔한 감상용 아이디어 무드보드가 됩니다.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-[#1E1E27]/50 border-t border-slate-100 dark:border-[#3A3948] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-soft transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
