import React from 'react';
import { X, HelpCircle, Keyboard, Link2, Image, FileText, CheckSquare, Sparkles } from 'lucide-react';

interface DocumentHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentHelpModal: React.FC<DocumentHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1E1E27] rounded-3xl border border-slate-200 dark:border-[#3A3948] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-[#3A3948] flex items-center justify-between bg-slate-50/50 dark:bg-[#252532]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">
                빈 문서 템플릿 사용 안내
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-[#A5A3B5]">
                자유롭게 노트를 작성하고 아이디어를 발전시키는 기본 백지 문서입니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-600 dark:text-[#A5A3B5] leading-relaxed">
          {/* Section 1: Modes */}
          <div className="p-3.5 rounded-2xl bg-lavender-50/60 dark:bg-[#28243D]/60 border border-lavender-100 dark:border-[#433A6B] flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-lavender-600 dark:text-[#B7A5FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-xs">
                보기 모드와 편집 모드
              </h4>
              <p className="mt-1 text-[11.5px]">
                상단의 <span className="font-semibold text-lavender-600 dark:text-[#B7A5FF]">[편집/보기]</span> 토글로 모드를 전환할 수 있습니다. 보기 모드에서는 서식 도구가 숨겨져 독서와 열람에 집중할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Section 2: Markdown shortcuts */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-[#E8E7EF] flex items-center gap-1.5 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-lavender-500" />
              <span>빠른 입력 단축키</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#252532] border border-slate-100 dark:border-[#3A3948]">
                <code className="text-lavender-600 dark:text-[#B7A5FF] font-mono font-bold"># + 스페이스</code>
                <p className="text-slate-500 dark:text-[#8E8B9E] mt-0.5">큰 제목 (H1)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#252532] border border-slate-100 dark:border-[#3A3948]">
                <code className="text-lavender-600 dark:text-[#B7A5FF] font-mono font-bold">## + 스페이스</code>
                <p className="text-slate-500 dark:text-[#8E8B9E] mt-0.5">중간 제목 (H2)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#252532] border border-slate-100 dark:border-[#3A3948]">
                <code className="text-lavender-600 dark:text-[#B7A5FF] font-mono font-bold">- + 스페이스</code>
                <p className="text-slate-500 dark:text-[#8E8B9E] mt-0.5">글머리 기호 목록</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#252532] border border-slate-100 dark:border-[#3A3948]">
                <code className="text-lavender-600 dark:text-[#B7A5FF] font-mono font-bold">[ ] + 스페이스</code>
                <p className="text-slate-500 dark:text-[#8E8B9E] mt-0.5">할 일 체크박스</p>
              </div>
            </div>
          </div>

          {/* Section 3: Internal Links */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-[#E8E7EF] flex items-center gap-1.5 mb-2">
              <Link2 className="w-3.5 h-3.5 text-lavender-500" />
              <span>문서 간 연결 (내부 링크)</span>
            </h4>
            <p className="text-[11.5px]">
              편집 모드 툴바의 <strong>[내부 링크]</strong> 아이콘을 누르면 다른 캐릭터 시트, 세계관 설정, 게임 기획 문서와 손쉽게 연결할 수 있습니다. 연결된 문서는 하단 백링크 패널에서 양방향으로 추적됩니다.
            </p>
          </div>

          {/* Section 4: Export */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-[#E8E7EF] flex items-center gap-1.5 mb-2">
              <Image className="w-3.5 h-3.5 text-lavender-500" />
              <span>이미지 내보내기</span>
            </h4>
            <p className="text-[11.5px]">
              우측 상단의 <strong>[이미지 저장]</strong> 버튼을 누르면 현재 페이지의 본문이 깨끗한 고해상도 PNG 이미지로 저장됩니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-[#3A3948] bg-slate-50/50 dark:bg-[#252532]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-soft transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

