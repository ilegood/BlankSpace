// 캐릭터 대사 스크립트 템플릿 데이터 모델

export interface DialogueSpeaker {
  id?: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

// 1. 선택지 데이터
export interface DialogueChoice {
  id: string;
  text: string;               // 선택지 내용
  nextDialogueId?: string;    // 선택 시 이동할 다음 대사 ID
  condition?: string;         // 선택 조건 (예: '호감도 50 이상')
  result?: string;            // 선택 시 결과 / 플래그 변경
  memo?: string;              // 선택지 메모
}

// 2. 조건 분기 데이터
export interface DialogueBranch {
  id: string;
  conditionType: 'affinity' | 'quest' | 'item' | 'flag' | 'variable' | 'custom';
  conditionKey?: string;      // 변수명, 퀘스트ID 등
  conditionOperator?: '>' | '>=' | '==' | '<=' | '<' | 'has' | 'completed';
  conditionValue?: string;    // 조건 값 (예: '50', 'true')
  nextDialogueId?: string;    // 조건 충족 시 이동할 대사 ID
  description?: string;       // 사람이 읽는 조건 설명
}

// 3. 개별 대사 노드
export interface DialogueLineNode {
  id: string;                 // 고유 ID (예: 'dlg-1', '001')
  order: number;              // 목록 상의 순서
  speakerName: string;        // 화자 이름 (비어있으면 나레이션/화자 없음)
  speakerRole?: string;       // 화자 역할
  speakerAvatarUrl?: string;  // 화자 프로필 이미지
  text: string;               // 대사 내용
  tags: string[];             // 표현 태그 (예: '냉정', '당황', '외침')
  memo?: string;              // 대사 연출 및 기획 메모

  // 흐름 제어 (선택지가 없을 때 기본 다음 대사)
  nextDialogueId?: string;

  // 선택지 목록 (존재할 경우 선택지별로 분기)
  choices: DialogueChoice[];

  // 조건 분기 목록
  branches?: DialogueBranch[];
  defaultBranchNextId?: string; // 조건 미충족 시 기본 대사 ID

  // 그래프 노드 위치
  position: { x: number; y: number };
}

// 4. 대화 시나리오
export interface DialogueScenario {
  id: string;
  title: string;              // 대화 제목 (예: '1장. 운명적인 재회')
  category: string;           // 카테고리 (예: '메인 스토리', '일상', '서브 퀘스트')
  description?: string;
  dialogues: DialogueLineNode[];
  createdAt: number;
  updatedAt: number;
}

// 5. 전체 문서 데이터
export interface CharacterDialogueDocData {
  scenarios: DialogueScenario[];
  activeScenarioId: string;
  speakers?: DialogueSpeaker[];
  settings?: {
    canvasBackground?: string;
    zoom?: number;
  };
}
