import React from 'react';
import {
  X,
  Share2,
  UserPlus,
  Link2,
  Move,
  Layers,
  Palette,
  Shield,
  Check,
  Compass,
} from 'lucide-react';

interface CharacterRelationsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterRelationsHelpModal: React.FC<CharacterRelationsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#1E1E27] p-6 shadow-2xl border border-slate-200 dark:border-[#3A3948] flex flex-col gap-5 text-slate-800 dark:text-[#E8E7EF] max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3A3948]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-[#F3F2F8]">
                캐릭터 관계도 템플릿 사용 가이드
              </h3>
              <p className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                인물들을 배치하고 다채로운 관계선과 세력 그룹을 자유롭게 구성하세요.
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
        <div className="space-y-3.5 text-xs leading-relaxed text-slate-600 dark:text-[#C5C3D4]">
          {/* 1. 보기 모드 vs 편집 모드 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Shield className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1 flex items-center gap-2">
                <span>보기 모드와 편집 모드 전환</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                  Ctrl + E
                </span>
              </h4>
              <p>
                <b>기본 상태는 보기 모드</b>입니다. 오탈자나 레이아웃 왜곡 없이 완성된 관계도를 열람하고 노드 정보를 확인할 수 있습니다. 상단의 <b>[편집 모드]</b> 버튼을 누르면 노드 이동, 관계선 생성, 캐릭터 및 그룹 추가가 활성화됩니다.
              </p>
            </div>
          </div>

          {/* 2. 2가지 캐릭터 생성 방식 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <UserPlus className="w-5 h-5 text-lavender-600 dark:text-[#B7A5FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                2가지 캐릭터 생성 및 연동 방식
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>
                  • <b>캐릭터 시트에서 가져오기</b>: 기존 Blankspace에 작성된 캐릭터 시트 문서의 이름과 프로필 사진을 그대로 가져와 연동합니다. 우측 패널에서 원본 캐릭터 시트로 원클릭 이동이 가능합니다.
                </li>
                <li>
                  • <b>관계도에서 직접 생성</b>: 별도 시트 없이도 관계도 내부에서 캐릭터의 이름, 직업, 아바타, 설정을 즉시 생성하여 자유롭게 배치할 수 있습니다.
                </li>
                <li>
                  • 두 방식의 캐릭터는 하나의 관계도 안에서 아무런 제약 없이 상호 연결할 수 있습니다.
                </li>
              </ul>
            </div>
          </div>

          {/* 3. 관계 연결 및 방향 설정 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Link2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                직관적인 관계선 생성 & 방향/다중 관계
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>• <b>앵커 드래그 연결</b>: 노드 테두리에 마우스를 올리면 나타나는 4방향 앵커 포인트를 드래그하여 상대 캐릭터에 떨어뜨리면 즉시 연결선이 생성됩니다.</li>
                <li>• <b>방향성 설정</b>: 양방향(↔), 단방향(A → B), 무방향을 지원하며, 화살표를 통해 짝사랑/존경/추적 등의 일방적 관계도 완벽히 표현할 수 있습니다.</li>
                <li>• <b>다중 관계 지원</b>: 동일한 두 인물 사이에 여러 관계(예: 전우이면서 라이벌)를 중복 생성할 수 있으며 선이 겹치지 않도록 곡률을 조절할 수 있습니다.</li>
              </ul>
            </div>
          </div>

          {/* 4. 그룹 및 세력 시스템 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Layers className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                그룹 & 세력 시각화 (Group Box)
              </h4>
              <p>
                가족, 기사단, 길드, 왕국 등 동일 세력에 속한 캐릭터들을 시각적 그룹 영역으로 묶을 수 있습니다. 상단 [그룹 추가] 버튼을 누르고 우측 패널에서 그룹명과 테마 색상을 지정할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 5. 캔버스 이동 및 확대/축소 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Move className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                자유로운 캔버스 탐색 (Pan & Zoom: 25% ~ 250%)
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>• <b>화면 이동</b>: <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-[#3A3948] text-slate-700 dark:text-slate-200 font-mono">Space</kbd> + 드래그, 마우스 휠 버튼 클릭 드래그, 또는 배경 빈 공간 드래그</li>
                <li>• <b>확대/축소</b>: <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-[#3A3948] text-slate-700 dark:text-slate-200 font-mono">Ctrl</kbd> + 휠 스크롤 또는 우측 하단 줌 버튼</li>
                <li>• <b>화면 맞춤</b>: <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-[#3A3948] text-slate-700 dark:text-slate-200 font-mono">Ctrl + 0</kbd> 또는 화면 맞춤 버튼으로 전체 관계도를 한눈에 맞춥니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-[#3A3948]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-500 text-white font-semibold text-xs shadow-xs transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

