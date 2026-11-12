import { QAItem, QAPreset, CharacterQADocData } from '../../../../types/characterQA';

export const DEFAULT_QA_PRESETS: QAPreset[] = [
  {
    id: 'preset-basic',
    name: '기본 캐릭터 질문',
    questions: [
      '가장 좋아하는 음식은?',
      '가장 싫어하는 사람 유형은?',
      '휴일에는 주로 무엇을 하나요?',
      '자신을 한 단어로 표현한다면?',
      '가장 아끼는 보물 1호는 무엇인가요?',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-personality',
    name: '성격 파악 질문',
    questions: [
      '화가 났을 때 어떤 행동을 하나요?',
      '슬프거나 외로울 때 어떻게 대처하나요?',
      '남들에게 보여주고 싶지 않은 약점이 있다면?',
      '칭찬을 들었을 때의 솔직한 반응은?',
      '예상치 못한 위기 상황이 닥치면 어떻게 행동하나요?',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-daily',
    name: '일상 관련 질문',
    questions: [
      '아침에 일어나서 가장 먼저 하는 일은?',
      '주로 언제 잠자리에 드나요?',
      '스트레스를 푸는 나만의 방법은?',
      '가장 자주 입거나 선호하는 옷차림은?',
      '요리를 할 줄 아나요? 가장 자신 있는 메뉴는?',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-romance',
    name: '연애 및 인간관계 질문',
    questions: [
      '호감을 느끼는 이성/사람의 첫인상은?',
      '좋아하는 사람 앞에서는 태도가 어떻게 변하나요?',
      '사랑과 일/우정 중 하나만 택해야 한다면?',
      '고백을 먼저 하는 편인가요, 기다리는 편인가요?',
      '연인이나 친구에게 절대 용서할 수 없는 배신은?',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'preset-past',
    name: '과거 및 배경 질문',
    questions: [
      '어린 시절 가장 기억에 남는 추억은?',
      '과거로 돌아갈 수 있다면 바꾸고 싶은 순간이 있나요?',
      '인생에서 가장 큰 영향을 준 인물은 누구인가요?',
      '현재의 길을 선택하게 된 결정적인 계기는?',
      '아직도 잊지 못하는 트라우마나 후회가 있나요?',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const INITIAL_QA_ITEMS: QAItem[] = [
  {
    id: 'qa-1',
    question: '가장 좋아하는 음식은?',
    answer: '따뜻한 수프를 좋아한다. 지친 하루 끝에 마시면 마음까지 편안해지니까.',
    order: 0,
  },
  {
    id: 'qa-2',
    question: '가장 싫어하는 사람 유형은?',
    answer: '거짓말을 밥 먹듯이 하는 사람. 신뢰를 저버리는 행위는 절대 용납할 수 없다.',
    order: 1,
  },
  {
    id: 'qa-3',
    question: '휴일에는 무엇을 하나요?',
    answer: '집에서 조용히 책을 읽거나 낮잠을 잔다. 가끔은 산책을 나가기도 한다.',
    order: 2,
  },
];

export const INITIAL_QA_DOC_DATA: CharacterQADocData = {
  questions: INITIAL_QA_ITEMS,
  updatedAt: Date.now(),
};

