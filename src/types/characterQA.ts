export interface QAItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface QAPreset {
  id: string;
  name: string;
  questions: string[]; // 프리셋에는 질문 내용만 저장 (답변 X)
  createdAt: number;
  updatedAt: number;
}

export interface CharacterQADocData {
  questions: QAItem[];
  characterName?: string;
  updatedAt?: number;
}

