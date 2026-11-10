import {
  CharacterDialogueDocData,
  DialogueScenario,
  DialogueLineNode,
  DialogueSpeaker,
} from '../../../../types/dialogue';

// 프로젝트 기본 화자 목록
export const DEFAULT_SPEAKERS: DialogueSpeaker[] = [
  {
    name: '아르젠',
    role: '신입 기사',
    avatarUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: '카일',
    role: '천재 마법사',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: '세이라',
    role: '성역의 사제',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: '루인',
    role: '그림자 암살자',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
];

export const INITIAL_DIALOGUES_SCENARIO_1: DialogueLineNode[] = [
  {
    id: 'dlg-001',
    order: 1,
    speakerName: '아르젠',
    speakerRole: '신입 기사',
    speakerAvatarUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
    text: '....또 늦었네, 카일.',
    tags: ['냉정', '원칙주의'],
    memo: '약속을 중요하게 여기는 성격을 드러내는 대사.',
    nextDialogueId: 'dlg-002',
    choices: [],
    position: { x: 100, y: 150 },
  },
  {
    id: 'dlg-002',
    order: 2,
    speakerName: '카일',
    speakerRole: '천재 마법사',
    speakerAvatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    text: '네가 먼저 와서 기다리고 있을 줄은 몰랐지. 그렇게 노려보지 마.',
    tags: ['능청', '여유'],
    memo: '긴장감 없이 여유로운 태도를 보여주는 대답.',
    choices: [
      {
        id: 'choice-1',
        text: '변명은 그만두고 어서 가자.',
        nextDialogueId: 'dlg-003',
        result: '아르젠 신뢰도 유지',
      },
      {
        id: 'choice-2',
        text: '오는 길에 무슨 일이라도 있었어?',
        nextDialogueId: 'dlg-004',
        result: '카일 호감도 +10',
      },
    ],
    position: { x: 420, y: 150 },
  },
  {
    id: 'dlg-003',
    order: 3,
    speakerName: '아르젠',
    speakerRole: '신입 기사',
    speakerAvatarUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
    text: '더 늦어지면 성역의 결계가 닫혀. 잡담은 이동하면서 하지.',
    tags: ['단호', '경계'],
    memo: '선택지 A 선택 시 분기 대사.',
    nextDialogueId: 'dlg-005',
    choices: [],
    position: { x: 760, y: 80 },
  },
  {
    id: 'dlg-004',
    order: 4,
    speakerName: '카일',
    speakerRole: '천재 마법사',
    speakerAvatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    text: '숲 입구에 불온한 마수들이 모여 있더군. 떼어내고 오느라 고생 좀 했어.',
    tags: ['진지', '정보공유'],
    memo: '선택지 B 선택 시 분기 대사.',
    nextDialogueId: 'dlg-005',
    choices: [],
    position: { x: 760, y: 260 },
  },
  {
    id: 'dlg-005',
    order: 5,
    speakerName: '세이라',
    speakerRole: '성역의 사제',
    speakerAvatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    text: '두 사람 다 무사해서 다행이에요. 결계가 약해지고 있으니 서둘러요.',
    tags: ['자비', '안도'],
    memo: '두 분기가 합류하여 사건이 본격적으로 전개되는 지점.',
    nextDialogueId: undefined, // 대화 종료 지점
    choices: [],
    position: { x: 1100, y: 170 },
  },
];

export const INITIAL_SCENARIOS: DialogueScenario[] = [
  {
    id: 'scn-1',
    title: '1장. 은빛 숲에서의 재회',
    category: '메인 스토리',
    description: '성역 입구에서 합류하는 기사단 일행의 첫 대면 시나리오.',
    dialogues: INITIAL_DIALOGUES_SCENARIO_1,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
  },
  {
    id: 'scn-2',
    title: '기사단 휴게실의 오후',
    category: '일상 대화',
    description: '임무가 끝난 뒤 모여서 나누는 가벼운 만담.',
    dialogues: [
      {
        id: 'dlg-201',
        order: 1,
        speakerName: '카일',
        speakerRole: '천재 마법사',
        speakerAvatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        text: '오늘 훈련은 정말 지독했어. 차라도 한잔 마셔야겠는데.',
        tags: ['피로', '일상'],
        nextDialogueId: 'dlg-202',
        choices: [],
        position: { x: 120, y: 150 },
      },
      {
        id: 'dlg-202',
        order: 2,
        speakerName: '세이라',
        speakerRole: '성역의 사제',
        speakerAvatarUrl:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
        text: '제가 정화의 허브차를 우려드릴게요. 마음이 진정될 거예요.',
        tags: ['미소', '친절'],
        nextDialogueId: undefined,
        choices: [],
        position: { x: 450, y: 150 },
      },
    ],
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now(),
  },
];

export const INITIAL_DIALOGUE_DATA: CharacterDialogueDocData = {
  scenarios: INITIAL_SCENARIOS,
  activeScenarioId: 'scn-1',
  speakers: DEFAULT_SPEAKERS,
  settings: {
    canvasBackground: '#17171D',
    zoom: 100,
  },
};

// 구버전 1차원 배열 데이터 호환 마이그레이션 함수
export function convertLegacyToDialogueData(raw: any): CharacterDialogueDocData {
  if (!raw) return INITIAL_DIALOGUE_DATA;

  // 이미 신규 포맷인 경우
  if (Array.isArray(raw.scenarios) && raw.activeScenarioId) {
    return {
      ...raw,
      speakers: raw.speakers || DEFAULT_SPEAKERS,
    } as CharacterDialogueDocData;
  }

  // 구버전 DialogueLine[] 배열인 경우 단일 시나리오로 변환
  if (Array.isArray(raw)) {
    const dialogues: DialogueLineNode[] = raw.map((line: any, idx: number) => ({
      id: line.id || `dlg-${idx + 1}`,
      order: idx + 1,
      speakerName: line.speaker || '화자',
      speakerRole: '',
      speakerAvatarUrl: line.avatarUrl || '',
      text: line.text || '',
      tags: Array.isArray(line.tags) ? line.tags : ['기본'],
      memo: line.memo || '',
      nextDialogueId: idx < raw.length - 1 ? (raw[idx + 1].id || `dlg-${idx + 2}`) : undefined,
      choices: [],
      position: { x: 100 + idx * 300, y: 150 },
    }));

    const scenario: DialogueScenario = {
      id: 'scn-imported',
      title: '불러온 대화 시나리오',
      category: '기본',
      dialogues,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      scenarios: [scenario],
      activeScenarioId: scenario.id,
      speakers: DEFAULT_SPEAKERS,
      settings: {
        canvasBackground: '#17171D',
        zoom: 100,
      },
    };
  }

  return INITIAL_DIALOGUE_DATA;
}
