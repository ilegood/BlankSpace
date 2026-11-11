import React from 'react';
import { X, User, Sparkles, Image, BookOpen, Shield, Moon } from 'lucide-react';

interface CharacterSheetHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterSheetHelpModal: React.FC<CharacterSheetHelpModalProps> = ({ isOpen, onClose }) => {
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-[#F3F2F8]">
                캐릭터 시트 사용 가이드
              </h3>
              <p className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                인물의 프로필, 외형, 성격, 배경 스토리를 체계적으로 정리하세요.
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

        {/* Content Sections */}
        <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-[#C5C3D4]">
          {/* 1. 좌우 2단 분할 구조 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <User className="w-5 h-5 text-lavender-600 dark:text-[#B7A5FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                좌측 캐릭터 목록 & 우측 상세 프로필
              </h4>
              <p>
                왼쪽 사이드바에서 생성된 모든 캐릭터를 한눈에 탐색하고 검색할 수 있으며, 오른쪽에서는 선택한 캐릭터의 상세 프로필과 설정집을 열람하고 관리할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 2. 체계적인 5대 정보 섹션 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                기본 정보, 외형, 성격, 스토리의 명확한 구분
              </h4>
              <p>
                인적사항, 비주얼 디자인, 내면적 성격과 말투, 출신과 과거 배경 스토리, 능력 및 전용 소지품까지 분류별 전용 카드로 구성되어 있어 설정 충돌 없이 깔끔하게 정리됩니다.
              </p>
            </div>
          </div>

          {/* 3. 대표 이미지 중심 비주얼 설계 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Image className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                눈에 띄는 프로필 이미지 & 디자인 갤러리
              </h4>
              <p>
                상단의 대형 대표 이미지와 외형 참고 갤러리를 통해 캐릭터의 시각적 인상을 가장 먼저 확인하고 몰입감을 극대화할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 4. 보기 모드 vs 편집 모드 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                오조작 방지 보기 모드 & 단축키 (Ctrl + E)
              </h4>
              <p>
                <b>보기 모드</b>에서는 깔끔한 설정집처럼 오탈자 걱정 없이 감상할 수 있고, <b>편집 모드</b>로 전환하면 텍스트 필드와 이미지 변경 인터페이스가 즉시 활성화됩니다.
              </p>
            </div>
          </div>

          {/* 5. 다크 모드 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Moon className="w-5 h-5 text-purple-500 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                눈이 편안한 다크 모드 완벽 지원
              </h4>
              <p>
                어두운 환경에서도 프로필 카드, 뱃지, 입력창, 이미지 대비가 선명하고 조화롭게 유지됩니다.
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

