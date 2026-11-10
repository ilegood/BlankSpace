import { TemplateCategoryType, TemplateDefinition } from '../types';

export interface CategoryInfo {
  id: TemplateCategoryType;
  name: string;
  iconName: string;
}

export const TEMPLATE_CATEGORIES: CategoryInfo[] = [
  { id: 'character', name: '캐릭터', iconName: 'User' },
  { id: 'world', name: '세계관', iconName: 'Globe' },
  { id: 'planning', name: '게임 기획', iconName: 'Gamepad2' },
  { id: 'design', name: '디자인 및 자료', iconName: 'Image' },
  { id: 'general', name: '일반', iconName: 'FileText' },
];

export const TEMPLATES: TemplateDefinition[] = [
  // 1. 캐릭터
  {
    id: 'character-sheet',
    name: '캐릭터 시트',
    description: '캐릭터의 설정과 정보를 정리합니다.',
    category: 'character',
    iconName: 'FileText',
    defaultTitle: '새 캐릭터 시트',
    defaultContent: '## 기본 정보\n\n- **이름**: \n- **나이 / 성별**: \n- **역할/직업**: \n\n## 외형 및 성격\n\n- 외형 특징:\n- 성격 키워드:\n\n## 배경 스토리\n\n- '
  },
  {
    id: 'character-relations',
    name: '캐릭터 관계도',
    description: '캐릭터 간의 관계를 시각적으로 표현합니다.',
    category: 'character',
    iconName: 'Share2',
    defaultTitle: '캐릭터 관계도',
    defaultContent: '캐릭터 간의 관계와 감정을 연결하여 시각화합니다.'
  },
  {
    id: 'character-dialogue',
    name: '캐릭터 다이얼로그',
    description: '캐릭터 간의 대화를 작성하고 관리합니다.',
    category: 'character',
    iconName: 'MessageSquare',
    defaultTitle: '캐릭터 대사 스크립트',
    defaultContent: '주요 씬별 캐릭터 대사와 지문'
  },

  // 2. 세계관
  {
    id: 'world-sheet',
    name: '세계관 시트',
    description: '세계관의 기본 법칙, 배경 설정 등을 정리합니다.',
    category: 'world',
    iconName: 'Globe',
    defaultTitle: '세계관 기본 설정',
    defaultContent: '## 세계관 개요\n\n세계의 기원 및 기본 법칙에 대한 설명'
  },
  {
    id: 'world-map-factions',
    name: '지도 및 세력',
    description: '지도 이미지 위에 국가, 지역, 세력 거점을 배치하고 영토 경계선을 관리합니다.',
    category: 'world',
    iconName: 'MapPin',
    defaultTitle: '세계 지도 및 세력도',
    defaultContent: '대륙 지도 및 주요 국가/거점 정보'
  },
  {
    id: 'world-chronicle',
    name: '역사 및 연대기',
    description: '세계관의 주요 사건을 시간순으로 정리합니다.',
    category: 'world',
    iconName: 'Clock',
    defaultTitle: '역사 연대표',
    defaultContent: '주요 연대기 사건 목록'
  },
  {
    id: 'world-glossary',
    name: '용어 사전',
    description: '세계관 및 게임 내 고유 용어를 정리합니다.',
    category: 'world',
    iconName: 'Book',
    defaultTitle: '용어 사전',
    defaultContent: '용어 목록 및 해설'
  },

  // 3. 게임 기획
  {
    id: 'game-design-system',
    name: '게임 기획 + 시스템 기획',
    description: '핵심 시스템 및 게임 플레이 규칙을 설계합니다.',
    category: 'planning',
    iconName: 'Gamepad2',
    defaultTitle: '게임 시스템 기획서',
    defaultContent: '## 핵심 메카닉\n\n플레이어가 수행하는 주요 액션 및 루프'
  },
  {
    id: 'game-flow',
    name: '게임 플로우',
    description: '게임 진행 순서와 분기 구조를 플로우 차트로 구성합니다.',
    category: 'planning',
    iconName: 'GitBranch',
    defaultTitle: '게임 진행 플로우',
    defaultContent: '타이틀 -> 튜토리얼 -> 인게임 루프'
  },
  {
    id: 'game-ui-ux',
    name: 'UI/UX',
    description: '화면 이미지 위에 마커와 설명을 배치합니다.',
    category: 'planning',
    iconName: 'Layout',
    defaultTitle: 'UI/UX 와이어프레임',
    defaultContent: '화면 배치 및 유저 인터랙션 명세'
  },
  {
    id: 'game-items-equip',
    name: '아이템 및 장비',
    description: '게임 내 아이템 및 장비 데이터를 관리합니다.',
    category: 'planning',
    iconName: 'Shield',
    defaultTitle: '아이템 데이터 시트',
    defaultContent: '아이템 ID, 명칭, 효과, 획득처'
  },

  // 4. 디자인 및 자료
  {
    id: 'design-reference-board',
    name: '레퍼런스 보드 + 무드보드 + 컨셉아트',
    description: '영감을 주는 이미지와 자료를 자유롭게 배치합니다.',
    category: 'design',
    iconName: 'Palette',
    defaultTitle: '컨셉 레퍼런스 보드',
    defaultContent: '무드보드 및 레퍼런스 이미지 모음'
  },
  {
    id: 'design-modeling-sheet',
    name: '모델링 시트',
    description: '3D 모델링을 위한 다각도 뷰 및 레퍼런스를 정리합니다.',
    category: 'design',
    iconName: 'Box',
    defaultTitle: '모델링 3면도 시트',
    defaultContent: '정면, 측면, 후면 레퍼런스'
  },
  {
    id: 'design-animation-sheet',
    name: '애니메이션 시트',
    description: '프레임 애니메이션 및 모션 시퀀스를 관리합니다.',
    category: 'design',
    iconName: 'Film',
    defaultTitle: '모션 애니메이션 시트',
    defaultContent: '달리기, 공격, 피격 프레임'
  },
  {
    id: 'design-sound-board',
    name: '사운드 보드',
    description: '배경음 및 효과음 오디오 리소스를 수집하고 미리 듣습니다.',
    category: 'design',
    iconName: 'Volume2',
    defaultTitle: 'BGM & SFX 리스트',
    defaultContent: '사운드 파일 및 연출 용도 정리'
  },

  // 5. 일반
  {
    id: 'general-blank',
    name: '빈 문서',
    description: '자유롭게 노트를 작성할 수 있는 기본 백지 문서입니다.',
    category: 'general',
    iconName: 'FileText',
    defaultTitle: '새 문서',
    defaultContent: ''
  },
  {
    id: 'general-checklist',
    name: '체크리스트',
    description: '개발 일정 및 완료할 작업 목록을 체크합니다.',
    category: 'general',
    iconName: 'CheckSquare',
    defaultTitle: '개발 체크리스트',
    defaultContent: '- [ ] 기획서 초안 검토\n- [ ] 메인 컨셉 아트 확정\n- [ ] 프로토타입 빌드 테스트'
  },
  {
    id: 'general-meeting-notes',
    name: '회의록',
    description: '팀 미팅 및 논의 사항, 결정된 사항을 기록합니다.',
    category: 'general',
    iconName: 'Users',
    defaultTitle: '개발 주간 회의록',
    defaultContent: '## 참석자\n\n## 안건\n\n## 결정 사항'
  },
  {
    id: 'general-idea-board',
    name: '메모 + 아이디어 보드',
    description: '번뜩이는 아이디어와 스케치, 빠른 메모를 남깁니다.',
    category: 'general',
    iconName: 'Lightbulb',
    defaultTitle: '아이디어 메모',
    defaultContent: '떠오른 영감과 아이디어 브레인스토밍'
  },
  {
    id: 'general-timeline',
    name: '일정 및 타임라인',
    description: '프로젝트의 마일스톤과 주요 일정을 정리합니다.',
    category: 'general',
    iconName: 'Calendar',
    defaultTitle: '개발 마일스톤 타임라인',
    defaultContent: 'Phase별 마일스톤 및 릴리즈 일정'
  },
  {
    id: 'general-file-cabinet',
    name: '파일 보관함',
    description: '관련 원본 파일 및 리소스를 안전하게 보관합니다.',
    category: 'general',
    iconName: 'FolderArchive',
    defaultTitle: '자료 보관함',
    defaultContent: '외부 드라이브 링크 및 원본 소스 파일 링크'
  },
];

