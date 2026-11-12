import React from 'react';
import {
  X,
  User,
  Sparkles,
  Image,
  BookOpen,
  Shield,
  Layers,
  Palette,
  Check,
  Activity,
  List,
  Move,
} from 'lucide-react';

interface CharacterSheetHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterSheetHelpModal: React.FC<CharacterSheetHelpModalProps> = ({
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-[#F3F2F8]">
                캐릭터 시트 템플릿 사용 가이드
              </h3>
              <p className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                캔버스 위에서 9종의 카드 요소를 자유롭게 배치하고 나만의 캐릭터 설정을 완성하세요.
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
                <b>기본 상태는 보기 모드</b>입니다. 오탈자나 불필요한 레이아웃 왜곡 없이 완성된 프로필을 열람할 수 있습니다. 상단의 <b>[편집 모드]</b> 버튼을 누르면 좌측 구성 요소 추가 패널과 우측 인스펙터가 활성화되어 자유롭게 배치하고 수정할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 2. 캔버스 이동 및 확대/축소 (Pan & Zoom) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Move className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                캔버스 이동 & 자유로운 확대/축소 (25% ~ 250%)
              </h4>
              <p className="mb-1.5">
                대형 캐릭터 시트도 화면 어디든 자유롭게 탐색하고 확대할 수 있습니다:
              </p>
              <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <li>• <b>화면 이동(Pan)</b>: <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-[#3A3948] text-slate-700 dark:text-slate-200 font-mono">Space</kbd> + 마우스 드래그, 또는 마우스 휠 클릭(가운데 버튼) 드래그, 손 도구(<kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-[#3A3948] text-slate-700 dark:text-slate-200 font-mono">H</kbd>) 활성화 후 드래그</li>
                <li>• <b>화면 확대/축소(Zoom)</b>: <kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-[#3A3948] text-slate-700 dark:text-slate-200 font-mono">Ctrl</kbd> + 마우스 휠 스크롤 또는 우측 하단 줌 컨트롤 버튼</li>
                <li>• <b>화면 맞춤 & 리셋</b>: 우측 하단 또는 상단 툴바의 <b>화면 맞춤</b> 버튼을 누르면 캔버스가 화면 중앙에 한눈에 맞추어집니다 (<kbd className="px-1 py-0.2 rounded bg-slate-200 dark:bg-[#3A3948] text-slate-700 dark:text-slate-200 font-mono">Ctrl + 0</kbd>).</li>
              </ul>
            </div>
          </div>

          {/* 2. 23종 통합 컴포넌트 시스템 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Layers className="w-5 h-5 text-lavender-600 dark:text-[#B7A5FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                23종 통합 컴포넌트 라이브러리 & 캐릭터 특화 구성
              </h4>
              <p className="mb-2">
                좌측 패널에서 원하는 카드를 클릭하여 캔버스에 즉시 추가할 수 있습니다:
              </p>
              <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>• <b>프로필 카드 [특화]</b>: 아바타, 이름, 칭호 배지, 소개 통합</li>
                <li>• <b>스탯 카드 [특화]</b>: 막대 그래프 / 수치형 / 레이더 차트</li>
                <li>• <b>관계 요약 카드 [특화]</b>: 내부 캐릭터 문서 연결 및 바로가기</li>
                <li>• <b>컬러 팔레트 [공통]</b>: 일체형 컬러 바, + 추가, 코드 ON/OFF</li>
                <li>• <b>이미지 & 갤러리</b>: 단일 이미지 (여백 0 기본) & 다중 갤러리</li>
                <li>• <b>세계관 & 레이아웃</b>: 계층 구조, 분류 목록, 구역 카드, 표, 구분선</li>
              </ul>
            </div>
          </div>

          {/* 3. 자동 높이 조절 & 텍스트 오버플로 방지 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <List className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                스마트 높이 자동 확장 (내부 스크롤 방지)
              </h4>
              <p>
                공통 정보 카드, 서술형 상세 카드, 태그 카드, 관계 요약 카드는 내용이 길어지면 카드 높이가 <b>자동으로 자연스럽게 늘어나며</b> 내부 스크롤바가 생기지 않고 전체 텍스트가 시원하게 표시됩니다. 가로 너비는 좌우 핸들로 자유롭게 조절할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 4. 우측 인스펙터 & 속성 커스터마이징 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Palette className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                우측 속성 패널을 통한 완벽한 커스터마이징
              </h4>
              <p>
                카드를 선택하면 우측 패널에서 <b>내부 항목 추가/삭제/순서 이동</b>, <b>배경색/테두리/폰트</b>를 세밀하게 조정할 수 있습니다. 카드를 선택하지 않았을 때는 <b>캔버스 크기, 배경색, 점무늬/격자무늬 패턴</b>을 변경할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 5. 나만의 시트 템플릿 저장 & 추천 프리셋 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#262634] border border-slate-100 dark:border-[#3A3948] flex gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-[#F3F2F8] text-[13px] mb-1">
                사용자 정의 템플릿 저장 및 프리셋
              </h4>
              <p>
                우측 패널의 [템플릿 & 프리셋] 탭에서 현재 구성한 멋진 캐릭터 시트 레이아웃을 <b>나만의 템플릿으로 영구 저장</b>하여 다른 캐릭터 시트에서도 바로 불러와 재사용할 수 있습니다. Blankspace에서 기본 제공하는 3종 프리셋(클래식 RPG, 모던 프로필, 미니멀 비주얼)도 원클릭으로 적용 가능합니다.
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
