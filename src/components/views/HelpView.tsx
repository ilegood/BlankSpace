import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useToast } from '../toast/ToastContext';

interface HelpTopic {
  id: string;
  title: string;
  badge?: string;
  desc: string;
  purpose: string;
  howToUse: string;
  howToEdit: string;
  limits: string;
  related: string[];
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'project',
    title: '프로젝트',
    desc: '하나의 게임, 세계관 또는 개인 창작 단위를 관리하는 최상위 작업 공간입니다.',
    purpose: '여러 창작 프로젝트를 한 Workspace 안에서 독립적으로 분류하고 관리합니다.',
    howToUse: '메인 화면의 + 새 프로젝트 버튼을 눌러 이름, 설명, 커버 색상을 정해 생성합니다.',
    howToEdit: '카드를 길게 눌러 순서를 바꾸거나 메뉴에서 이름 변경, 복제, 휴지통 이동을 수행합니다.',
    limits: '문서는 다른 프로젝트로 직접 이동할 수 없으며, 동일 프로젝트 내부에서만 이동합니다.',
    related: ['폴더', '휴지통'],
  },
  {
    id: 'folder',
    title: '폴더',
    desc: '프로젝트 내부의 문서와 하위 폴더를 깊이 제한 없이 계층 구조로 정리합니다.',
    purpose: '캐릭터, 세계관, 기획 등 영역별로 자료를 체계적으로 분류합니다.',
    howToUse: '프로젝트 또는 폴더 내부의 + 폴더 버튼으로 새 폴더를 만듭니다.',
    howToEdit: '문서 카드를 폴더 카드 중앙으로 끌어다 놓으면 해당 폴더 안으로 이동합니다.',
    limits: '폴더를 자기 자신이나 하위 폴더 안으로 이동할 수 없습니다.',
    related: ['프로젝트', '문서'],
  },
  {
    id: 'document',
    title: '문서',
    desc: '실제 창작 작업이 이루어지는 기본 단위로 템플릿 문서, 빈 문서, 자유 작업 문서를 지원합니다.',
    purpose: '문서마다 목적에 맞는 편집 화면과 보기/편집 모드 분리를 제공합니다.',
    howToUse: '문서를 열면 기본적으로 읽기 전용인 보기 모드로 열립니다.',
    howToEdit: '상단 보기 | 편집 토글에서 편집으로 전환하면 내용을 수정할 수 있습니다.',
    limits: '보기 모드에서는 드래그, 크기 조절, 텍스트 입력 등 데이터 변경이 차단됩니다.',
    related: ['템플릿', '컴포넌트'],
  },
  {
    id: 'template',
    title: '템플릿',
    desc: '캐릭터, 세계관, 게임 기획, 디자인 및 에셋, 일반 5개 분류의 20종 템플릿을 제공합니다.',
    purpose: '문서 생성 시 기본 구조와 컴포넌트를 빠르게 구성하고 재사용합니다.',
    howToUse: '새 문서 만들기 모달에서 카테고리와 템플릿을 선택하거나 기본 템플릿을 수정합니다.',
    howToEdit: '기본 템플릿을 수정하거나 디자인 프리셋을 바꿔도 이미 만든 문서 내용은 바뀌지 않습니다.',
    limits: '디자인 프리셋은 배치와 시각 스타일만 저장하며 문서 콘텐츠는 저장하지 않습니다.',
    related: ['컴포넌트', '문서'],
  },
  {
    id: 'component',
    title: '컴포넌트',
    desc: '공통 16종과 캐릭터·세계관·게임 기획·모델링 특화 카드를 자유롭게 배치합니다.',
    purpose: '시트형 문서 안에서 필요한 정보 단위를 조립해 나만의 양식을 만듭니다.',
    howToUse: '편집 모드 우측 컴포넌트 추가 패널에서 원하는 카드를 클릭하거나 캔버스로 끌어다 놓습니다.',
    howToEdit: '정렬 스냅(Alt로 해제), 모서리 크기 조절(Shift로 비율 유지), Ctrl+D 복제, Delete 삭제를 지원합니다.',
    limits: '특수 전용 템플릿(예: 대화 스크립트)은 해당 템플릿 전용 컴포넌트만 사용합니다.',
    related: ['템플릿', '문서'],
  },
  {
    id: 'relations',
    title: '관계도',
    desc: '원형 자동 배치된 캐릭터 노드와 다양한 선 스타일·범례로 관계를 시각화합니다.',
    purpose: '인물 간의 감정선과 다중 관계를 한눈에 파악합니다.',
    howToUse: '보기 모드에서 캐릭터 노드를 클릭하면 A → 모두, A ← 모두, 기본 상태로 단계별 강조됩니다.',
    howToEdit: '편집 모드에서 관계선 추가, 방향·스타일·범례 설정, 문서 연결 캐릭터 추가가 가능합니다.',
    limits: '캐릭터 노드는 원형 균등 배치 규격에 따라 자동으로 정렬되며 수동 이동할 수 없습니다.',
    related: ['문서', '지도'],
  },
  {
    id: 'map',
    title: '지도',
    desc: '대륙 및 구역 지도 이미지 위에 마커를 배치하고 관련 문서를 연결합니다.',
    purpose: '세계관의 공간적 위치와 상세 설정 문서를 유기적으로 연결합니다.',
    howToUse: '보기 모드에서 마커를 클릭하면 요약 팝업과 접이식 설명, 문서 열기 버튼이 표시됩니다.',
    howToEdit: '편집 모드에서 지도 이미지 교체, 마커 추가·드래그 이동, 구역 페이지 추가를 수행합니다.',
    limits: '문서가 연결되지 않은 마커는 지도 위에 이름만 표시됩니다.',
    related: ['관계도', '문서'],
  },
  {
    id: 'timeline',
    title: '타임라인',
    badge: '준비 중',
    desc: '세계관과 게임의 주요 사건을 시간축 위에 시점 순서로 정렬합니다.',
    purpose: '연대기 사건과 관련 문서를 시계열로 정리합니다.',
    howToUse: '상단에서 년·월·일·직접 단위를 선택해 사건을 조회합니다.',
    howToEdit: '편집 모드에서 사건 카드를 추가하거나 가로로 드래그해 시점을 조정합니다.',
    limits: '고급 가상 달력 및 다중 트랙 기능은 준비 중입니다.',
    related: ['지도', '문서'],
  },
  {
    id: 'game-flow',
    title: '게임 플로우',
    badge: '준비 중',
    desc: '시작·끝, 처리, 조건, 입출력, 주석, 하위 시스템 노드로 게임 흐름을 설계합니다.',
    purpose: '게임 루프와 분기 로직을 순서도 형태로 명확히 정리합니다.',
    howToUse: '캔버스에서 각 노드의 설명과 연결된 하위 문서를 확인할 수 있습니다.',
    howToEdit: '노드 포트를 드래그해 연결선을 만들고 조건 분기 라벨을 지정할 수 있습니다.',
    limits: '실시간 시뮬레이션 실행 기능은 준비 중입니다.',
    related: ['문서', '템플릿'],
  },
];

export const HelpView: React.FC = () => {
  const { setNavSection } = useWorkspace();
  const { showToast } = useToast();
  const [selectedId, setSelectedId] = useState('project');
  const [query, setQuery] = useState('');
  const detailRef = useRef<HTMLDivElement>(null);

  const filteredTopics = HELP_TOPICS.filter(
    (t) =>
      !query.trim() ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.desc.toLowerCase().includes(query.toLowerCase())
  );

  const current = HELP_TOPICS.find((t) => t.id === selectedId) || HELP_TOPICS[0];

  const handleSelectTopic = (topic: HelpTopic) => {
    setSelectedId(topic.id);
    detailRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (topic.badge === '준비 중') {
      showToast('준비 중인 기능입니다');
    }
  };

  return (
    <div ref={detailRef} className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] bs-animate-fade">
      <div className="max-w-[1060px] mx-auto flex flex-col gap-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavSection('settings')}
              className="px-3 py-1 rounded-full border border-[#E6E3F0] dark:border-[#2E2D3D] text-xs font-medium text-[#4E4D59] dark:text-[#B4B2C4] hover:border-[#6A5ACD]"
            >
              ‹ 설정
            </button>
            <h1 className="text-[24px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">도움말</h1>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="도움말 검색"
            className="w-64 h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-xs text-[#1B1B1F] dark:text-[#F1F0F6] focus:outline-none focus:border-[#6A5ACD]"
          />
        </div>

        <div className="flex gap-8 items-start">
          <div className="w-48 shrink-0 flex flex-col gap-1">
            {filteredTopics.map((topic) => {
              const active = topic.id === current.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSelectTopic(topic)}
                  className={`w-full px-3.5 py-2 rounded-xl text-left text-[13px] flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-[#F3F1FB] dark:bg-[#262436] text-[#1B1B1F] dark:text-[#F1F0F6] font-semibold'
                      : 'text-[#4E4D59] dark:text-[#9E9CAF] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{topic.title}</span>
                  {topic.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]">
                      {topic.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div key={current.id} className="flex-1 flex flex-col gap-5 pb-8 bs-animate-fade">
            <h2 className="text-[20px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              {current.title}
            </h2>

            {[
              { label: '기능 설명', text: current.desc },
              { label: '사용 목적', text: current.purpose },
              { label: '사용 방법', text: current.howToUse },
              { label: '편집 방법', text: current.howToEdit },
              { label: '제한 사항', text: current.limits },
            ].map((sec) => (
              <div key={sec.label} className="flex flex-col gap-1.5">
                <h3 className="text-[13px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  {sec.label}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#555464] dark:text-[#B4B2C4] bg-[#FAF9FE] dark:bg-[#1E1E29] px-4 py-3 rounded-xl border border-[#F0EEF7] dark:border-[#2E2D3D]">
                  {sec.text}
                </p>
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                관련 기능
              </h3>
              <div className="flex flex-wrap gap-2">
                {current.related.map((rel) => {
                  const target = HELP_TOPICS.find((t) => t.title === rel);
                  return (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => target && handleSelectTopic(target)}
                      className="px-3 py-1 rounded-full bg-[#EBE8F5] dark:bg-[#2C2845] text-xs font-medium text-[#6A5ACD] dark:text-[#9A8FE6]"
                    >
                      {rel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
