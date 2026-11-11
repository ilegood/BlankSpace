import React from 'react';
import { X, Calendar, Layers, MoveHorizontal, CheckCircle2, Moon } from 'lucide-react';

interface ScheduleHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleHelpModal: React.FC<ScheduleHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#1E1E27] p-6 shadow-2xl border border-slate-200 dark:border-[#3A3948] flex flex-col gap-5 text-slate-800 dark:text-[#E8E7EF] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3A3948]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-[#F3F2F8]">
                일정 (간트 차트) 사용 가이드
              </h3>
              <p className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                개인 프로젝트와 일정을 한눈에 파악하고 직관적으로 관리하세요.
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

        {/* Sections */}
        <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-[#C5C3D4]">
          {/* 1. 기본 구조 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Layers className="w-5 h-5 text-lavender-600 dark:text-[#B7A5FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                좌측 업무 목록 & 우측 타임라인
              </h4>
              <p>
                왼쪽에는 업무 그룹과 작업 항목(Task)이 정리되어 있고, 오른쪽에는 시간축에 맞춘 일정 막대가 배치됩니다. 그룹을 접고 펼치며 원하는 작업에 집중할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 2. 시간 단위 전환 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Calendar className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                일간 / 주간 / 월간 보기 지원
              </h4>
              <p>
                상단 툴바에서 보기 단위를 주간(기본), 일간, 월간으로 자유롭게 전환할 수 있습니다. 오늘 날짜 기준선이 표시되어 현재 시점을 한눈에 파악할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 3. 일정 막대 조작 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <MoveHorizontal className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                직관적인 막대 드래그 & 기간 조절
              </h4>
              <p>
                편집 모드에서는 일정 막대 중앙을 드래그하여 전체 일정을 이동하거나, 양 끝 핸들을 드래그하여 시작일과 종료일을 손쉽게 조정할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 4. 개인 사용자 중심 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                불필요한 담당자 지정 없는 심플한 구성
              </h4>
              <p>
                개인 사용자의 일정 관리에 최적화되어 복잡한 협업 설정 없이 일정명, 기간, 상태, 진행률만으로 빠르고 간결하게 등록할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 5. 다크 모드 & 단축키 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Moon className="w-5 h-5 text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                보기 / 편집 모드 전환 (Ctrl + E)
              </h4>
              <p>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#3A3948] font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  Ctrl + E
                </kbd>
                를 누르면 오조작 방지를 위한 보기 모드와 자유로운 일정 편집 모드를 빠르게 오갈 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-[#3A3948]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

