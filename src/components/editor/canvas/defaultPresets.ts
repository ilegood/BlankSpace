import { CanvasDocumentData, CanvasElement } from '../../../types/canvas';

export const DEFAULT_CHARACTER_CANVAS: CanvasDocumentData = {
  canvasWidth: 860,
  canvasHeight: 660,
  zoom: 100,
  elements: [
    // 1. 캐릭터 이미지
    {
      id: 'el-char-img',
      type: 'image',
      x: 40,
      y: 40,
      width: 280,
      height: 420,
      zIndex: 2,
      style: {
        borderRadius: 16,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
      content: {
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
        alt: '아르젠 일러스트',
        aspectRatio: true,
      },
    },
    // 2. 캐릭터 이름
    {
      id: 'el-char-name',
      type: 'heading',
      x: 340,
      y: 40,
      width: 480,
      height: 42,
      zIndex: 2,
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
      },
      content: {
        text: '아르젠 (Arjen)',
      },
    },
    // 3. 한줄 소개 인용구
    {
      id: 'el-char-quote',
      type: 'text',
      x: 340,
      y: 88,
      width: 480,
      height: 32,
      zIndex: 2,
      style: {
        fontSize: 13,
        fontWeight: '500',
        color: '#7C3AED',
      },
      content: {
        text: '"언젠가, 이 선택이 옳았다고 믿고 싶어."',
      },
    },
    // 4. 기본 정보 카드
    {
      id: 'el-char-info',
      type: 'info-field',
      x: 340,
      y: 130,
      width: 480,
      height: 140,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      },
      content: {
        infoItems: [
          { id: 'inf-1', label: '소속', value: '노바 기사단' },
          { id: 'inf-2', label: '나이', value: '19세' },
          { id: 'inf-3', label: '신장', value: '168cm' },
          { id: 'inf-4', label: '성격', value: '냉정하고 이성적이나, 가까운 이에게는 다정함.' },
        ],
      },
    },
    // 5. 스테이터스 카드
    {
      id: 'el-char-stats',
      type: 'status-chart',
      x: 340,
      y: 285,
      width: 480,
      height: 175,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      },
      content: {
        statDisplayType: 'card',
        stats: [
          { id: 'st-1', label: '힘', value: 'B', numValue: 70 },
          { id: 'st-2', label: '민첩', value: 'A', numValue: 88 },
          { id: 'st-3', label: '지능', value: 'A', numValue: 85 },
          { id: 'st-4', label: '체력', value: 'B', numValue: 72 },
          { id: 'st-5', label: '마력', value: 'S', numValue: 98 },
          { id: 'st-6', label: '행운', value: 'C', numValue: 55 },
        ],
      },
    },
    // 6. 하단 배경 컨테이너 박스
    {
      id: 'el-desc-bg',
      type: 'container',
      x: 40,
      y: 480,
      width: 780,
      height: 145,
      zIndex: 1,
      style: {
        backgroundColor: '#FAFBFD',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 16,
      },
      content: {},
    },
    // 7. 상세 설명 텍스트
    {
      id: 'el-char-desc',
      type: 'text',
      x: 60,
      y: 495,
      width: 740,
      height: 115,
      zIndex: 2,
      style: {
        fontSize: 13,
        color: '#334155',
      },
      content: {
        text: '노바 기사단 소속의 신입 기사. 뛰어난 재능으로 주목받고 있지만, 과거의 사건으로 인해 쉽사리 타인에게 마음을 열지 않는다. 검술과 원소 마법의 융합에 능하며 고대 유적 탐사 임무를 맡고 있다.',
      },
    },
  ],
};

// 기존 CharacterSheetData 호환 변환기
export const convertOldDataToCanvas = (raw: any): CanvasDocumentData => {
  if (raw && Array.isArray(raw.elements)) {
    return {
      canvasWidth: raw.canvasWidth || 860,
      canvasHeight: raw.canvasHeight || 660,
      zoom: raw.zoom || 100,
      elements: raw.elements,
    };
  }

  // 만약 이전 버전의 { name, affiliation, stats ... } 형식이라면
  const name = raw?.name || '아르젠';
  const quote = raw?.quote || '"언젠가, 이 선택이 옳았다고 믿고 싶어."';
  const imageUrl =
    raw?.imageUrl ||
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop';
  const desc =
    raw?.description ||
    '노바 기사단 소속의 신입 기사. 뛰어난 재능으로 주목받고 있지만, 과거의 사건으로 인해 쉽사리 타인에게 마음을 열지 않는다.';

  const infoItems = [
    { id: '1', label: '소속', value: raw?.affiliation || '노바 기사단' },
    { id: '2', label: '나이', value: raw?.age || '19세' },
    { id: '3', label: '신장', value: raw?.height || '168cm' },
    { id: '4', label: '성격', value: raw?.personality || '냉정하고 이성적이나, 가까운 이에게는 다정함.' },
  ];

  const stats = raw?.stats
    ? Object.entries(raw.stats).map(([k, v], idx) => ({
        id: `s-${idx}`,
        label: k,
        value: String(v),
        numValue: v === 'S' ? 98 : v === 'A' ? 88 : v === 'B' ? 75 : 60,
      }))
    : DEFAULT_CHARACTER_CANVAS.elements.find((e) => e.id === 'el-char-stats')?.content.stats || [];

  return {
    ...DEFAULT_CHARACTER_CANVAS,
    elements: DEFAULT_CHARACTER_CANVAS.elements.map((el) => {
      if (el.id === 'el-char-name') return { ...el, content: { text: name } };
      if (el.id === 'el-char-quote') return { ...el, content: { text: quote } };
      if (el.id === 'el-char-img') return { ...el, content: { ...el.content, imageUrl } };
      if (el.id === 'el-char-desc') return { ...el, content: { text: desc } };
      if (el.id === 'el-char-info') return { ...el, content: { infoItems } };
      if (el.id === 'el-char-stats') return { ...el, content: { ...el.content, stats } };
      return el;
    }),
  };
};
