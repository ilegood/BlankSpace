import { TemplateCategoryType, TemplateDefinition } from '../types';

export interface CategoryInfo {
  id: TemplateCategoryType;
  name: string;
}

export const TEMPLATE_CATEGORIES: CategoryInfo[] = [
  { id: 'character', name: '캐릭터' },
  { id: 'world', name: '세계관' },
  { id: 'planning', name: '게임 기획' },
  { id: 'design', name: '디자인 및 에셋' },
  { id: 'general', name: '일반' },
];

export const CATEGORY_LABELS: Record<TemplateCategoryType, string> = {
  character: '캐릭터',
  world: '세계관',
  planning: '게임 기획',
  design: '디자인·에셋',
  general: '일반',
};

export const TEMPLATES: TemplateDefinition[] = [
  // 1. 캐릭터
  {
    id: 'character-sheet',
    name: '캐릭터 시트',
    description: '캐릭터의 기본 프로필, 스탯, 서술, 관계 요약을 자유롭게 구성합니다.',
    category: 'character',
    docKind: 'template',
    iconName: 'User',
    defaultTitle: '새 캐릭터 시트',
    supportsDesignPreset: true,
  },
  {
    id: 'character-relations',
    name: '캐릭터 관계도',
    description: '원형 자동 배치와 관계 범례로 캐릭터 간 관계를 시각화합니다.',
    category: 'character',
    docKind: 'visual',
    iconName: 'Share2',
    defaultTitle: '캐릭터 관계도',
  },
  {
    id: 'character-qa',
    name: '캐릭터 문답',
    description: '분류별 질문과 답변을 통해 캐릭터의 성격과 말투를 구체화합니다.',
    category: 'character',
    docKind: 'template',
    iconName: 'HelpCircle',
    defaultTitle: '캐릭터 문답',
  },

  // 2. 세계관
  {
    id: 'world-sheet',
    name: '세계관 시트',
    description: '세계관 개요, 계층 구조, 분류, 구역을 카드로 조합해 정리합니다.',
    category: 'world',
    docKind: 'template',
    iconName: 'Globe',
    defaultTitle: '세계관 시트',
    supportsDesignPreset: true,
  },
  {
    id: 'world-map-factions',
    name: '지도',
    description: '지도 이미지 위에 지역 마커를 배치하고 상세 문서와 연결합니다.',
    category: 'world',
    docKind: 'visual',
    iconName: 'MapPin',
    defaultTitle: '세계 지도',
  },
  {
    id: 'world-chronicle',
    name: '타임라인',
    description: '세계관의 주요 사건을 시점 순서에 따라 시간축 위에 배치합니다.',
    category: 'world',
    docKind: 'visual',
    iconName: 'Clock',
    defaultTitle: '타임라인',
  },
  {
    id: 'world-glossary',
    name: '용어집',
    description: '세계관 고유명사와 개념을 초성 및 분류별로 검색하고 관리합니다.',
    category: 'world',
    docKind: 'template',
    iconName: 'BookOpen',
    defaultTitle: '용어집',
  },

  // 3. 게임 기획
  {
    id: 'game-design-system',
    name: '게임 기획서',
    description: 'SWOT, 규칙, 공식, 난이도 곡선으로 게임 시스템을 설계합니다.',
    category: 'planning',
    docKind: 'template',
    iconName: 'Gamepad2',
    defaultTitle: '게임 기획서',
    supportsDesignPreset: true,
  },
  {
    id: 'game-flow',
    name: '게임 플로우',
    description: '시작·처리·조건·하위 시스템 노드로 게임 진행 흐름을 구성합니다.',
    category: 'planning',
    docKind: 'visual',
    iconName: 'GitBranch',
    defaultTitle: '게임 플로우',
  },
  {
    id: 'game-ui-ux',
    name: 'UI/UX',
    description: '화면 이미지 위에 번호 마커와 기능 설명, 문서를 연결합니다.',
    category: 'planning',
    docKind: 'template',
    iconName: 'Layout',
    defaultTitle: 'UI/UX 명세',
  },
  {
    id: 'game-items-equip',
    name: '아이템 및 장비',
    description: '아이템 효과, 가격, 획득처를 분류와 등급별로 정리합니다.',
    category: 'planning',
    docKind: 'template',
    iconName: 'Shield',
    defaultTitle: '아이템 및 장비',
  },
  {
    id: 'character-dialogue',
    name: '게임 대화 스크립트',
    description: '이벤트·대사·선택지 카드를 연결하고 게임 화면으로 미리 봅니다.',
    category: 'planning',
    docKind: 'visual',
    iconName: 'MessageSquare',
    defaultTitle: '게임 대화 스크립트',
  },

  // 4. 디자인 및 에셋
  {
    id: 'design-reference-board',
    name: '레퍼런스 보드',
    description: '이미지, 출처 링크, 태그, 메모를 자유로운 보드 위에 수집합니다.',
    category: 'design',
    docKind: 'freeform',
    iconName: 'Image',
    defaultTitle: '레퍼런스 보드',
  },
  {
    id: 'design-modeling-sheet',
    name: '모델링 시트',
    description: '턴어라운드, PBR 텍스처 맵, 스포이드 팔레트와 리소스를 관리합니다.',
    category: 'design',
    docKind: 'template',
    iconName: 'Box',
    defaultTitle: '모델링 시트',
  },
  {
    id: 'design-animation-sheet',
    name: '애니메이션 시트',
    description: '모션별 프레임, 길이, 루프 여부와 프레임 스트립을 정리합니다.',
    category: 'design',
    docKind: 'template',
    iconName: 'Film',
    defaultTitle: '애니메이션 시트',
  },
  {
    id: 'design-sound-board',
    name: '사운드보드',
    description: '효과음·배경음·보이스 오디오를 분류하고 즉시 재생합니다.',
    category: 'design',
    docKind: 'template',
    iconName: 'Volume2',
    defaultTitle: '사운드보드',
  },

  // 5. 일반
  {
    id: 'general-blank',
    name: '빈 문서',
    description: '서식, 표, 체크리스트, 내부 링크를 지원하는 깔끔한 문서입니다.',
    category: 'general',
    docKind: 'blank',
    iconName: 'FileText',
    defaultTitle: '제목 없는 문서',
  },
  {
    id: 'general-idea-board',
    name: '메모',
    description: '텍스트, 이미지, 영상, 오디오, 드로잉을 자유롭게 배치하는 보드입니다.',
    category: 'general',
    docKind: 'freeform',
    iconName: 'StickyNote',
    defaultTitle: '메모',
  },
  {
    id: 'general-timeline',
    name: '일정',
    description: '그룹과 작업, 진행률을 일·주·월 간트 차트로 관리합니다.',
    category: 'general',
    docKind: 'template',
    iconName: 'Calendar',
    defaultTitle: '일정',
  },
  {
    id: 'general-files',
    name: '파일 보관함',
    description: 'PDF, PSD, FBX, WAV 등 창작 파일을 카드와 목록으로 보관합니다.',
    category: 'general',
    docKind: 'template',
    iconName: 'Archive',
    defaultTitle: '파일 보관함',
  },
];
