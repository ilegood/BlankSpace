import React from 'react';
import {
  X,
  Globe,
  Sparkles,
  Image,
  BookOpen,
  Shield,
  Layers,
  Palette,
  Check,
  Compass,
  Landmark,
  ShieldAlert,
  Hash,
  StickyNote,
} from 'lucide-react';

interface WorldSheetHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorldSheetHelpModal: React.FC<WorldSheetHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1E1E27] p-6 shadow-2xl border border-slate-200 dark:border-[#3A3948] flex flex-col gap-5 text-slate-800 dark:text-[#E8E7EF] max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3A3948]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-[#F3F2F8]">
                세계관 시트(World Sheet) 사용 가이드
              </h3>
              <p className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                캐릭터 시트와 동일한 자유형 캔버스 위에서 10종의 세계관 카드를 자유롭게 구성하세요.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A2938] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Components */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-[#E8E7EF] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-lavender-500" />
            23종 통합 컴포넌트 시스템 & 세계관 특화 구성
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-100 dark:border-[#3A3948] flex items-start gap-2">
              <Compass className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-slate-800 dark:text-[#E8E7EF]">1. 구역 카드 [특화]</strong>
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">[A][B][C][+] 버튼 UI & 내부 장소 문서 원클릭 이동</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-100 dark:border-[#3A3948] flex items-start gap-2">
              <Layers className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-slate-800 dark:text-[#E8E7EF]">2. 계층 구조 카드 [특화]</strong>
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">국가-도시, 조직-부서, 계급 등의 트리 구조</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-100 dark:border-[#3A3948] flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-slate-800 dark:text-[#E8E7EF]">3. 분류 목록 카드 [특화]</strong>
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">종족, 마법 체계, 문화권 등 카테고리별 그룹 정리</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-100 dark:border-[#3A3948] flex items-start gap-2">
              <Palette className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-slate-800 dark:text-[#E8E7EF]">4. 컬러 팔레트 바 [공통]</strong>
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">연속형 컬러 바, + 추가, 색상 코드 ON/OFF & 복사</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-100 dark:border-[#3A3948] flex items-start gap-2">
              <Image className="w-4 h-4 text-lavender-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-slate-800 dark:text-[#E8E7EF]">5. 이미지 및 갤러리</strong>
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">여백 0 기본값 지원 단일 이미지 & 다중 갤러리</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-[#262634] rounded-xl border border-slate-100 dark:border-[#3A3948] flex items-start gap-2">
              <Landmark className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold text-slate-800 dark:text-[#E8E7EF]">6. 표, 문서링크, 미디어</strong>
                <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">그리드 표, 내부 문서 연결 카드, 동영상 및 오디오</span>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-[#E8E7EF]">
            단축키 안내
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#262634]">
              <span className="text-slate-600 dark:text-[#A5A3B5]">보기/편집 모드 전환</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded">
                Ctrl + E
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#262634]">
              <span className="text-slate-600 dark:text-[#A5A3B5]">선택 요소 복제</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded">
                Ctrl + D
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#262634]">
              <span className="text-slate-600 dark:text-[#A5A3B5]">실행 취소 / 다시 실행</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded">
                Ctrl + Z / Ctrl + Y
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#262634]">
              <span className="text-slate-600 dark:text-[#A5A3B5]">캔버스 팬 (이동)</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded">
                Space + 드래그
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#262634]">
              <span className="text-slate-600 dark:text-[#A5A3B5]">배율 확대 / 축소</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded">
                Ctrl + + / -
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#262634]">
              <span className="text-slate-600 dark:text-[#A5A3B5]">배율 100% 초기화</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded">
                Ctrl + 0
              </kbd>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#3A3948] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

