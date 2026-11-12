import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Images,
  Type,
  FileText,
  List,
  Hash,
  Quote,
  Table,
  Palette,
  ExternalLink,
  Video,
  Music,
  StickyNote,
  UserCheck,
  Activity,
  Users,
  GitFork,
  FolderTree,
  MapPin,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CanvasElementType, CanvasElement } from '../../../types/canvas';

export interface ComponentItem {
  id?: string;
  type: CanvasElementType;
  name: string;
  category: '공통 컴포넌트' | '캐릭터 특화' | '세계관 특화';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPreset?: Partial<CanvasElement>;
}

interface CanvasLibraryProps {
  mode: 'character' | 'world';
  onAddElement: (type: CanvasElementType, defaultPreset?: Partial<CanvasElement>) => void;
}

// ----------------------------------------------------------------------------
// 공통 컴포넌트와 템플릿 전용 컴포넌트 정의
// ----------------------------------------------------------------------------
export const ALL_COMPONENTS: ComponentItem[] = [
  // ==========================================================================
  // A. 공통 컴포넌트 (13종)
  // ==========================================================================
  // 1) 이미지 카드
  {
    type: 'image-card',
    name: '이미지 카드',
    category: '공통 컴포넌트',
    description: '단일 이미지 삽입, 비율 조절 및 캡션 입력',
    icon: ImageIcon,
    defaultPreset: {
      width: 340,
      height: 380,
      style: {
        padding: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        objectFit: 'cover',
      },
      content: {
        title: '대표 이미지',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
        alt: '대표 이미지',
        caption: '이미지 캡션을 입력하세요',
      },
    },
  },
  // 2) 이미지 갤러리
  {
    type: 'gallery-card',
    name: '이미지 갤러리',
    category: '공통 컴포넌트',
    description: '여러 장의 이미지 모음 및 캡션/슬라이드',
    icon: Images,
    defaultPreset: {
      width: 520,
      height: 280,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '이미지 갤러리',
        galleryImages: [
          {
            id: 'g-1',
            url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
            caption: '컨셉 아트 1',
          },
          {
            id: 'g-2',
            url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
            caption: '컨셉 아트 2',
          },
        ],
      },
    },
  },
  // 3) 텍스트 카드
  {
    type: 'text-card',
    name: '텍스트 카드',
    category: '공통 컴포넌트',
    description: '짧은 텍스트 및 간단한 설명 작성',
    icon: Type,
    defaultPreset: {
      width: 440,
      height: 90,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '텍스트 카드',
        text: '간단한 핵심 안내 문구나 설명을 여기에 입력하세요.',
      },
    },
  },
  // 4) 서술 카드
  {
    type: 'narrative-card',
    name: '서술 카드',
    category: '공통 컴포넌트',
    description: '긴 줄거리, 배경 설정, 문단 및 글머리 기호',
    icon: FileText,
    defaultPreset: {
      width: 540,
      height: 220,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '상세 서술',
        narrativeText:
          '• **주요 배경**: 여기에 상세한 서술형 설정을 자유롭게 작성하세요.\n• **세부 특징**: 줄바꿈 및 글머리 기호를 자유롭게 사용할 수 있습니다.',
      },
    },
  },
  // 5) 세부사항 카드
  {
    type: 'detail-card',
    name: '세부사항 카드',
    category: '공통 컴포넌트',
    description: '자유 항목명 추가/삭제 및 라벨-값 목록 정리',
    icon: List,
    defaultPreset: {
      width: 540,
      height: 220,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '세부사항 정보',
        infoDisplayMode: 'list-vertical',
        infoCardItems: [
          { id: `dt-${Date.now()}-1`, label: '이름', value: '속성값을 입력하세요' },
          { id: `dt-${Date.now()}-2`, label: '나이', value: '속성값을 입력하세요' },
          { id: `dt-${Date.now()}-3`, label: '직업', value: '속성값을 입력하세요' },
          { id: `dt-${Date.now()}-4`, label: '출신지', value: '속성값을 입력하세요' },
        ],
      },
    },
  },
  // 6) 태그 카드
  {
    type: 'tag-card',
    name: '태그 카드',
    category: '공통 컴포넌트',
    description: '키워드 태그 추가/삭제, 개별 색상 설정',
    icon: Hash,
    defaultPreset: {
      width: 440,
      height: 120,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '핵심 태그',
        tagDisplayMode: 'chips',
        tags: [
          { id: `t-1`, text: '하이 판타지', color: '#8B5CF6' },
          { id: `t-2`, text: '스팀펑크', color: '#F59E0B' },
          { id: `t-3`, text: '원소 마법', color: '#3B82F6' },
        ],
      },
    },
  },
  // 7) 인용 카드
  {
    type: 'quote-card',
    name: '인용 카드',
    category: '공통 컴포넌트',
    description: '인용문, 출처, 작성자 및 강조 스타일',
    icon: Quote,
    defaultPreset: {
      width: 480,
      height: 100,
      style: {
        backgroundColor: '#FBFBFF',
        borderColor: '#EDE9FE',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '대표 대사 & 인용구',
        quoteText: '언젠가 이 선택이 옳았다고 믿을 수 있기를.',
        quoteSituation: '과거의 결정을 회상하며',
      },
    },
  },
  // 8) 표 카드
  {
    type: 'table-card',
    name: '표 카드',
    category: '공통 컴포넌트',
    description: '행/열 동적 추가·삭제 및 셀 데이터 편집',
    icon: Table,
    defaultPreset: {
      width: 540,
      height: 200,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '데이터 표',
        tableHeaders: ['구분', '명칭', '속성', '비고'],
        tableRows: [
          ['1구역', '에테르 관측탑', '마도시설', '정상 가동 중'],
          ['2구역', '증기 비행선착장', '운송시설', '무역선 정박'],
          ['3구역', '고대 대성당', '종교시설', '출입 제한'],
        ],
      },
    },
  },
  // 9) 컬러 팔레트
  {
    type: 'palette-card',
    name: '컬러 팔레트',
    category: '공통 컴포넌트',
    description: '연결형 컬러 바, + 버튼 색상 추가, 코드 ON/OFF',
    icon: Palette,
    defaultPreset: {
      width: 460,
      height: 140,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '컬러 팔레트',
        showPaletteHex: true,
        paletteColors: [
          { id: 'p-1', color: '#6D28D9', label: '퍼플' },
          { id: 'p-2', color: '#A855F7', label: '라벤더' },
          { id: 'p-3', color: '#267B54', label: '포레스트' },
          { id: 'p-4', color: '#6EE7B7', label: '민트' },
          { id: 'p-5', color: '#F7F6F2', label: '크림화이트' },
        ],
      },
    },
  },
  // 10) 문서 링크 카드
  {
    type: 'doc-link-card',
    name: '문서 링크 카드',
    category: '공통 컴포넌트',
    description: '프로젝트 내 문서 검색/연결 및 클릭 시 해당 문서 열기',
    icon: ExternalLink,
    defaultPreset: {
      width: 420,
      height: 110,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '관련 문서 바로가기',
        targetDocumentTitle: '연결할 문서를 선택하세요',
        targetDocumentId: '',
      },
    },
  },
  // 11) 동영상 카드
  {
    type: 'video-card',
    name: '동영상 카드',
    category: '공통 컴포넌트',
    description: '동영상 URL 입력 및 플레이어/미리보기 표시',
    icon: Video,
    defaultPreset: {
      width: 480,
      height: 300,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '동영상 참고 자료',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    },
  },
  // 12) 오디오 카드
  {
    type: 'audio-card',
    name: '오디오 카드',
    category: '공통 컴포넌트',
    description: '테마곡/효과음 재생, 일시정지, 파일명 표시',
    icon: Music,
    defaultPreset: {
      width: 420,
      height: 110,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '테마 배경 음악',
        audioFileName: 'theme_track_01.mp3',
        audioUrl: '',
      },
    },
  },
  // 13) 메모 카드
  {
    type: 'memo-card',
    name: '메모 카드',
    category: '공통 컴포넌트',
    description: '가벼운 포스트잇 스타일 아이디어/미정 설정 노트',
    icon: StickyNote,
    defaultPreset: {
      width: 360,
      height: 190,
      style: {
        backgroundColor: '#FEF9C3',
        borderColor: '#FDE047',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '자유 메모',
        memoContent: '• 새로운 아이디어나 아직 확정되지 않은 설정을 자유롭게 기록하세요.',
      },
    },
  },

  // ==========================================================================
  // B. 캐릭터 시트 특화 컴포넌트 (4종)
  // ==========================================================================
  // 기존 이름 및 칭호 컴포넌트 복원
  {
    type: 'name-badge',
    name: '이름 및 칭호',
    category: '캐릭터 특화',
    description: '캐릭터의 이름과 칭호를 여러 줄로 정리',
    icon: UserCheck,
    defaultPreset: {
      width: 420,
      height: 84,
      style: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12, padding: 16 },
      content: {
        nameFields: [
          { id: `name-${Date.now()}`, label: '이름', value: '캐릭터 이름', fontSize: 24, fontWeight: 'bold', isPrimary: true },
          { id: `title-${Date.now()}`, label: '칭호', value: '칭호 또는 별명', fontSize: 14 },
        ],
      },
    },
  },
  // 14) 프로필 카드
  {
    type: 'profile-card',
    name: '프로필 카드',
    category: '캐릭터 특화',
    description: '대표 이미지 + 이름 + 별명 + 한줄 소개 올인원 통합 카드',
    icon: UserCheck,
    defaultPreset: {
      width: 540,
      height: 240,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '캐릭터 프로필',
        profileImageUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
        profileName: '아르젠 (Arjen)',
        profileNickname: '새벽의 기사 / 제7분대장',
        profileSummary: '대붕괴 이후 설립된 노바 기사단의 최연소 검술 대가.',
      },
    },
  },
  // 15) 스탯 카드
  {
    type: 'stat-card',
    name: '스탯 카드',
    category: '캐릭터 특화',
    description: '능력치 시각화 (숫자형, 막대그래프형, 레이더 차트형)',
    icon: Activity,
    defaultPreset: {
      width: 440,
      height: 280,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '능력치 스탯',
        statMode: 'bar',
        statItems: [
          { id: 'st-1', label: '공격력', value: 85, maxValue: 100, color: '#EF4444' },
          { id: 'st-2', label: '방어력', value: 70, maxValue: 100, color: '#3B82F6' },
          { id: 'st-3', label: '민첩성', value: 92, maxValue: 100, color: '#10B981' },
          { id: 'st-4', label: '마력', value: 95, maxValue: 100, color: '#8B5CF6' },
          { id: 'st-5', label: '지능', value: 80, maxValue: 100, color: '#F59E0B' },
        ],
      },
    },
  },
  // 16) 관계 요약 카드
  {
    type: 'relationship-card',
    name: '관계 요약 카드',
    category: '캐릭터 특화',
    description: '타 캐릭터 문서 연결 및 관계명/설정 요약',
    icon: Users,
    defaultPreset: {
      width: 480,
      height: 200,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '인물 관계 요약',
        relationships: [
          {
            id: 'rel-1',
            name: '엘리시아',
            relation: '동료 / 라이벌',
            description: '함께 비행선을 몰고 미답지를 탐사하는 오랜 파트너',
            color: '#8B5CF6',
          },
          {
            id: 'rel-2',
            name: '발렌슈타인',
            relation: '스승',
            description: '고대 마도 검술의 기초를 가르쳐 준 은사',
            color: '#10B981',
          },
        ],
      },
    },
  },

  // ==========================================================================
  // C. 세계관 시트 특화 컴포넌트 (3종)
  // ==========================================================================
  // 17) 계층 구조 카드
  {
    type: 'hierarchy-card',
    name: '계층 구조 카드',
    category: '세계관 특화',
    description: '국가-도시, 세력-조직 등 상하 관계 및 트리 구조',
    icon: GitFork,
    defaultPreset: {
      width: 480,
      height: 240,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '세력 및 영역 계층 구조',
        hierarchyItems: [
          { id: 'h-1', label: '7대 부유 공국 연합', description: '천공 세계 최고 의결기구', parentId: null },
          { id: 'h-2', label: '제1공국 (아스트랄리아 본성)', description: '에테르 코어 중앙 의회', parentId: 'h-1' },
          { id: 'h-3', label: '제4공국 (철공 연맹)', description: '비행선 건조창 및 채굴 기지', parentId: 'h-1' },
          { id: 'h-4', label: '하층 무법 군도 (어비스 림)', description: '공적 연합의 거점', parentId: null },
        ],
      },
    },
  },
  // 18) 분류 목록 카드
  {
    type: 'category-list-card',
    name: '분류 목록 카드',
    category: '세계관 특화',
    description: '종족, 마법 체계, 기술, 문화 등 카테고리별 목록 정리',
    icon: FolderTree,
    defaultPreset: {
      width: 520,
      height: 240,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '세계관 분류 목록',
        categoryGroups: [
          {
            id: 'cg-1',
            name: '주요 종족군',
            items: [
              { id: 'ci-1', text: '에테리얼 (인류)', subText: '마도 공학 문명' },
              { id: 'ci-2', text: '천익족 (실피드)', subText: '바람 원소 선주민' },
            ],
          },
          {
            id: 'cg-2',
            name: '마법 계통',
            items: [
              { id: 'ci-3', text: '에테르 연금술', subText: '물질 변환 및 부유 제어' },
              { id: 'ci-4', text: '기류 마법', subText: '비행선 추진 조율' },
            ],
          },
        ],
      },
    },
  },
  // 19) 구역 카드 (핵심: [A] [B] [C] [+] 버튼 및 내부 문서 연결)
  {
    type: 'zone-card',
    name: '구역 카드',
    category: '세계관 특화',
    description: '구역별 장소 버튼([A][B][+]) 등록 및 내부 문서 원클릭 이동',
    icon: MapPin,
    defaultPreset: {
      width: 520,
      height: 160,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '상층 구역 (하이 헤븐)',
        zoneLocations: [
          { id: 'loc-1', name: '중앙 대성당', icon: '⛪', documentId: '', documentTitle: '미연결' },
          { id: 'loc-2', name: '비행선 선착장', icon: '⚓', documentId: '', documentTitle: '미연결' },
          { id: 'loc-3', name: '에테르 정제소', icon: '💎', documentId: '', documentTitle: '미연결' },
        ],
      },
    },
  },

  // ==========================================================================
];

export const CanvasLibrary: React.FC<CanvasLibraryProps> = ({
  mode,
  onAddElement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categoryOrder: ComponentItem['category'][] =
    mode === 'character'
      ? ['캐릭터 특화', '공통 컴포넌트']
      : ['세계관 특화', '공통 컴포넌트'];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // 검색 필터링
  const filteredComponents = ALL_COMPONENTS.filter((item) => {
    if (!categoryOrder.includes(item.category)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-68 bg-white dark:bg-[#1E1E27] border-r border-slate-200 dark:border-[#3A3948] flex flex-col shrink-0 overflow-hidden select-none transition-colors duration-150">
      {/* 1. Library Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-[#3A3948] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] tracking-wide">
              컴포넌트 라이브러리
            </h2>
          </div>
          <span className="px-2 py-0.5 bg-lavender-50 dark:bg-lavender-950/60 text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/60 dark:border-lavender-800/50 text-[10px] font-bold rounded-full">
            {filteredComponents.length}종
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="컴포넌트 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#262634] border border-slate-200/80 dark:border-[#3A3948] rounded-xl outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF] placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 2. Categorized Components Accordion List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {categoryOrder.map((category) => {
          const itemsInCat = filteredComponents.filter((c) => c.category === category);
          if (itemsInCat.length === 0) return null;

          const isCollapsed = !!collapsedCategories[category];
          const isRecommended =
            (mode === 'character' && category === '캐릭터 특화') ||
            (mode === 'world' && category === '세계관 특화');

          return (
            <div key={category} className="flex flex-col gap-1">
              {/* Category Header Accordion Button */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                  isRecommended
                    ? 'bg-lavender-50/70 dark:bg-[#2F2F40] text-lavender-700 dark:text-[#B7A5FF]'
                    : 'text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#262634]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold tracking-tight truncate">
                    {category}
                  </span>
                  {isRecommended && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-lavender-100 dark:bg-lavender-900/50 text-lavender-700 dark:text-[#B7A5FF] font-semibold shrink-0">
                      추천
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {itemsInCat.length}
                </span>
              </button>

              {/* Items in this Category */}
              {!isCollapsed && (
                <div className="flex flex-col gap-1 pl-1">
                  {itemsInCat.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => onAddElement(item.type, item.defaultPreset)}
                        className="group relative flex items-start gap-2.5 p-2 rounded-xl text-left border border-slate-100 dark:border-[#3A3948] hover:border-lavender-300 dark:hover:border-lavender-500 bg-white dark:bg-[#262634] hover:bg-lavender-50/50 dark:hover:bg-[#2F2F40] transition-all duration-150 active:scale-[0.99]"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-[#1E1E27] border border-slate-200/80 dark:border-[#3A3948] flex items-center justify-center shrink-0 group-hover:bg-lavender-100 dark:group-hover:bg-lavender-900/50 transition-colors mt-0.5">
                          <IconComponent className="w-3.5 h-3.5 text-slate-600 dark:text-[#A5A3B5] group-hover:text-lavender-600 dark:group-hover:text-lavender-400 transition-colors" />
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] group-hover:text-lavender-700 dark:group-hover:text-lavender-300 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-[#8E8B9E] truncate mt-0.5">
                            {item.description}
                          </div>
                        </div>

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Footer Guide */}
      <div className="p-2.5 m-2 bg-slate-50 dark:bg-[#262634] border border-slate-200/70 dark:border-[#3A3948] rounded-xl text-[10.5px] text-slate-500 dark:text-[#A5A3B5] leading-relaxed shrink-0">
        💡 <strong className="text-slate-700 dark:text-[#E8E7EF]">안내:</strong> 컴포넌트를 클릭하면 현재 캔버스에 추가됩니다.
      </div>
    </div>
  );
};
