import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  Eye,
  Edit3,
  Moon,
  Sun,
  Download,
  Star,
  HelpCircle,
  Save,
  Plus,
  Search,
  User,
  Heart,
  Sparkles,
  Shield,
  Palette,
  BookOpen,
  Camera,
  Trash2,
  MoreHorizontal,
  Compass,
  Zap,
  Tag,
  Quote,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useTheme } from '../../../store/ThemeContext';
import { exportElementAsPng } from '../../../utils/exportImage';
import { CharacterSheetHelpModal } from './CharacterSheetHelpModal';

// Character Data Interface
export interface CharacterProfile {
  id: string;
  name: string;
  nameEn?: string;
  titleOrAlias?: string; // 이명 / 별명
  quote?: string; // 대표 대사
  avatarUrl: string;
  roleTag: string; // 주인공, 조력자, 라이벌 등
  themeColor: string;

  // 1. Basic Info
  gender: string;
  age: string;
  birthday: string;
  race: string; // 종족
  occupation: string; // 직업 / 소속
  heightWeight: string; // 신장 / 체중
  bloodType: string;

  // 2. Preferences & Daily
  likes: string;
  dislikes: string;
  hobbies: string;

  // 3. Visuals & Appearance
  hairAndEyes: string;
  outfit: string;
  physicalFeatures: string; // 흉터, 문신, 체형 등
  referenceImages: string[]; // 외형 참고 이미지 목록
  colorPalette: string[];

  // 4. Personality & Traits
  personalitySummary: string;
  strengths: string;
  weaknesses: string;
  speechAndHabits: string; // 말투 및 행동 특징

  // 5. Lore & Story
  originAndBackground: string; // 출신 및 성장 배경
  pastStory: string; // 과거 이야기
  currentStatusAndGoal: string; // 현재 상황 및 목표
  secretLore: string; // 비밀 및 숨겨진 설정

  // 6. Abilities & Gear
  abilities: string; // 대표 능력 / 기술
  inventory: string; // 전용 무기 / 소지품
  relationshipsNote: string; // 인간관계 메모
}

// Sample Initial Characters (Rich Korean Fantasy Setting)
const INITIAL_CHARACTERS: CharacterProfile[] = [
  {
    id: 'char-1',
    name: '아르젠 크로웰',
    nameEn: 'Arzen Crowell',
    titleOrAlias: '푸른 바람의 조타수',
    quote: '바람의 방향을 읽는 자만이 추락하지 않는 법이지.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    roleTag: '주인공',
    themeColor: '#6366F1',

    gender: '남성',
    age: '21세',
    birthday: '10월 24일 (전갈자리)',
    race: '인간',
    occupation: '아에테리아 부유선단 제3순찰대 조타수',
    heightWeight: '178cm / 68kg',
    bloodType: 'O형',

    likes: '높은 곳에서 바람 쐬기, 사과파이, 오래된 마력 나침반',
    dislikes: '밀폐된 지하 감옥, 부당한 명령, 비린 생선',
    hobbies: '비행선 부품 조립, 천공 기류 예측, 지도 스케치',

    hairAndEyes: '바람에 흩날리는 짙은 네이비 블루의 숏 헤어, 청록색의 날카롭지만 호기심 많은 눈매',
    outfit: '가벼운 가죽 비행 재킷, 방풍 고글, 고대 나침반 펜던트, 기동성이 뛰어난 카고 팬츠',
    physicalFeatures: '왼쪽 손목에 어릴 적 비행선 불시착 사고로 생긴 옅은 번개 모양 흉터',
    referenceImages: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    ],
    colorPalette: ['#1E1B4B', '#4F46E5', '#06B6D4', '#E0E7FF'],

    personalitySummary: '자유롭고 호기심이 넘치며, 동료가 위험에 처하면 무모할 정도로 헌신적인 외유내강형 성향.',
    strengths: '위기 상황에서의 냉철한 직관과 결단력, 어떤 절망적인 상황에서도 잃지 않는 낙천적 유머.',
    weaknesses: '엄격한 군율을 답답해하며 감정에 이끌려 단독 행동을 벌이는 충동성.',
    speechAndHabits: '평소엔 장난기 넘치는 반말 투이지만 집중할 때는 침착해짐. 고민할 때 목걸이 펜던트를 만지작거리는 버릇.',

    originAndBackground: '하층 안개 숲 변방 마을 출신으로, 부유선단에 거두어져 어릴 적부터 비행 조타술을 익힘.',
    pastStory: '3년 전 고대 유적 발굴선이 정체불명의 폭풍에 휘말려 실종되었을 때 유일하게 살아남았음.',
    currentStatusAndGoal: '어머니의 유품인 마력 나침반이 가리키는 잃어버린 천공 도시의 비밀을 밝혀내는 것.',
    secretLore: '그가 지닌 펜던트는 단순한 유품이 아니라 고대 기계 제국의 중앙 동력을 기동하는 마지막 마스터 키이다.',

    abilities: '[바람의 조율사] - 주변 공기 흐름을 미세하게 읽고 글라이더의 양력을 3배 이상 증폭시킴.',
    inventory: '접이식 에어로 글라이더 윙, 증기 압축식 와이어 훅 건, 고대 마력 나침반',
    relationshipsNote: '루나엘라(신뢰하는 마도사 파트너), 발렌타인(기체 정비 스승이자 잔소리꾼), 칼리스타(라이벌)',
  },
  {
    id: 'char-2',
    name: '루나엘라 실피드',
    nameEn: 'Lunaella Sylphid',
    titleOrAlias: '달빛의 영창자',
    quote: '별들이 속삭이는 진실은 거짓을 말하지 않아요.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    roleTag: '동료',
    themeColor: '#8B5CF6',

    gender: '여성',
    age: '19세',
    birthday: '3월 15일 (물고기자리)',
    race: '하이엘프 혼혈',
    occupation: '아에테리아 천문학회 연구원 겸 마도사',
    heightWeight: '165cm / 50kg',
    bloodType: 'A형',

    likes: '도서관의 고서 냄새, 홍차, 별자리 관측',
    dislikes: '시끄러운 소음, 먼지투성이 창고, 무례한 태도',
    hobbies: '고대 마법 서적 번역, 식물 표본 수집',

    hairAndEyes: '달빛을 닮은 은백색 롱 스트레이트 헤어, 신비로운 보랏빛 눈동자',
    outfit: '남색 마도사 로브, 은빛 깃털 머리장식, 별빛 문양의 크리스탈 지팡이',
    physicalFeatures: '양쪽 귀 끝이 살짝 뾰족하며, 마력을 사용할 때 손끝에 은은한 푸른빛이 감돎',
    referenceImages: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    ],
    colorPalette: ['#2E1065', '#8B5CF6', '#DDD6FE', '#F5F3FF'],

    personalitySummary: '차분하고 이성적이며 지적 호기심이 풍부함. 감정 표현은 서툴지만 속마음은 매우 다정함.',
    strengths: '방대한 고대 지식과 고위 원소 마법 영창 능력, 뛰어난 분석력.',
    weaknesses: '체력이 매우 약하고 장거리 도보 이동에 쥐약. 예상치 못한 돌발 상황에 당황함.',
    speechAndHabits: '언제나 정중한 높임말을 구사함. 당황하면 소매 끝을 꼭 쥐는 버릇.',

    originAndBackground: '고대 정령의 숲 깊은 곳에서 태어나 대현자의 가르침을 받고 자람.',
    pastStory: '숲의 결계가 무너지며 가족과 헤어져 부유섬으로 망명하게 됨.',
    currentStatusAndGoal: '잃어버린 정령석의 파편을 찾아 고향의 결계를 복원하는 것.',
    secretLore: '그녀의 체내에는 고대 마력 엔진의 폭주를 잠재울 수 있는 순수한 정령의 핵이 깃들어 있음.',

    abilities: '[달빛 결계 & 정령 소환] - 적의 마법 공격을 굴절시키는 프리즘 실드 전개 및 하급 정령 지휘.',
    inventory: '영겁의 서(마법서), 별빛 크리스탈 완드, 고농축 마나 앰플 3병',
    relationshipsNote: '아르젠(무모하지만 가장 신뢰하는 친구), 칼리스타(과거 왕립 아카데미 동문)',
  },
  {
    id: 'char-3',
    name: '발렌타인 카터',
    nameEn: 'Valentine Carter',
    titleOrAlias: '강철의 장인',
    quote: '기계는 거짓말을 안 해. 닦고 조인 만큼 움직일 뿐이지.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    roleTag: '조력자',
    themeColor: '#F59E0B',

    gender: '남성',
    age: '28세',
    birthday: '8월 8일 (사자자리)',
    race: '드워프 혼혈',
    occupation: '부유선단 수석 기관장 겸 거너',
    heightWeight: '172cm / 82kg',
    bloodType: 'B형',

    likes: '기름 냄새, 독한 증류주, 개조된 대구경 리볼버',
    dislikes: '정밀 점검을 건너뛰는 조타수, 헐거운 볼트',
    hobbies: '고철 무기 개조, 주점 다트 내기',

    hairAndEyes: '갈색 곱슬머리와 덥수룩한 턱수염, 금빛이 도는 갈색 눈동자',
    outfit: '기름때 묻은 멜빵 작업복, 두꺼운 가죽 토시, 다기능 확대경 고글',
    physicalFeatures: '오른쪽 팔이 정교하게 제작된 황동제 증기 의수로 대체되어 있음',
    referenceImages: [],
    colorPalette: ['#451A03', '#D97706', '#FBBF24', '#FEF3C7'],

    personalitySummary: '호탕하고 털털하며 입은 거칠지만 동료를 누구보다 아끼는 든든한 맏형 같은 인물.',
    strengths: '어떤 고장 난 기계도 10분 안에 임시 기동시키는 천재적 기계 공학 기술.',
    weaknesses: '술을 마시면 고집이 세지고, 돈 계산에 어두워 사기를 자주 당함.',
    speechAndHabits: '걸걸한 사투리와 호탕한 웃음소리. 틈만 나면 몽키스패너를 손가락으로 돌림.',

    originAndBackground: '지하 광산 도시의 대장간 가문에서 태어나 증기 기관 기술을 독학함.',
    pastStory: '시험 비행 도중 폭발 사고로 오른팔을 잃었으나 스스로 의수를 제작해 장착함.',
    currentStatusAndGoal: '자신만의 전함 "기간틱호"를 완성하여 대륙 끝 미지의 영역을 탐험하는 것.',
    secretLore: '그의 의수 속에는 제국 비밀 연구소에서 탈취한 프로토타입 에너지 코어가 내장되어 있음.',

    abilities: '[증기 폭주시스템 & 초정밀 사격] - 의수의 증기압을 한계까지 끌어올려 강펀치를 날리거나 중화기 반동을 0으로 억제.',
    inventory: '커스텀 대구경 증기 리볼버 "타이탄", 만능 렌치 키트, 휴대용 용접기',
    relationshipsNote: '아르젠(비행선 조종을 가르친 제자), 루나엘라(마력 공학 자문을 구하는 학문 파트너)',
  },
];

export const CharacterSheetEditor: React.FC = () => {
  const {
    activeDocument,
    setActiveDocument,
    updateDocumentTitle,
    toggleFavoriteDocument,
    saveStatus,
  } = useWorkspace();
  const { theme, toggleTheme } = useTheme();

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // View / Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Character State & Active Character
  const [characters, setCharacters] = useState<CharacterProfile[]>(INITIAL_CHARACTERS);
  const [activeCharacterId, setActiveCharacterId] = useState<string>(INITIAL_CHARACTERS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Character Object
  const activeChar = useMemo(() => {
    return characters.find((c) => c.id === activeCharacterId) || characters[0];
  }, [characters, activeCharacterId]);

  // Document Title state
  const [docTitle, setDocTitle] = useState(activeDocument?.title || '주요 등장인물 캐릭터 시트');
  useEffect(() => {
    if (activeDocument) setDocTitle(activeDocument.title);
  }, [activeDocument]);

  const handleTitleBlur = () => {
    if (activeDocument && docTitle.trim() && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
    }
  };

  // Keyboard shortcut Ctrl+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setIsEditMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered Characters for Sidebar
  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return characters;
    const q = searchQuery.toLowerCase();
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
        (c.titleOrAlias && c.titleOrAlias.toLowerCase().includes(q)) ||
        c.roleTag.toLowerCase().includes(q)
    );
  }, [characters, searchQuery]);

  // Container ref for PNG export
  const profilePrintRef = useRef<HTMLDivElement>(null);

  const handleExportPng = async () => {
    if (!profilePrintRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPng(profilePrintRef.current, {
        fileName: `${activeChar?.name || 'character'}-profile-${new Date().toISOString().slice(0, 10)}.png`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Add new dummy character
  const handleAddNewCharacter = () => {
    const newChar: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: '새로운 등장인물',
      nameEn: 'New Character',
      titleOrAlias: '칭호 / 이명',
      quote: '캐릭터를 상징하는 인상적인 한 줄 대사를 입력하세요.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      roleTag: '조연',
      themeColor: '#8B5CF6',
      gender: '미정',
      age: '20세',
      birthday: '1월 1일',
      race: '인간',
      occupation: '소속 / 직업',
      heightWeight: '170cm / 60kg',
      bloodType: 'A형',
      likes: '좋아하는 것들을 적어보세요',
      dislikes: '싫어하는 것들을 적어보세요',
      hobbies: '취미 / 특기',
      hairAndEyes: '헤어스타일 및 눈동자 색상 특징',
      outfit: '의상 및 전용 악세서리',
      physicalFeatures: '신체적 특징 (흉터, 체격 등)',
      referenceImages: [],
      colorPalette: ['#8B5CF6', '#DDD6FE', '#4C1D95'],
      personalitySummary: '성격의 핵심 요약을 작성하세요.',
      strengths: '장점과 매력 포인트',
      weaknesses: '약점 및 극복해야 할 과제',
      speechAndHabits: '말투 및 무의식적인 행동 습관',
      originAndBackground: '출신 및 성장 배경',
      pastStory: '인물에게 결정적 영향을 준 과거 사건',
      currentStatusAndGoal: '현재 상황과 이루고자 하는 목표',
      secretLore: '아직 밝혀지지 않은 비밀 설정',
      abilities: '대표 능력 및 마법 / 스킬',
      inventory: '소지품 및 전용 무기',
      relationshipsNote: '타 인물들과의 관계 메모',
    };
    setCharacters((prev) => [...prev, newChar]);
    setActiveCharacterId(newChar.id);
  };

  // Update active character field helper
  const updateField = (field: keyof CharacterProfile, value: any) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === activeChar.id ? { ...c, [field]: value } : c))
    );
  };

  if (!activeDocument) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] dark:bg-[#15151D] relative select-none overflow-hidden transition-colors duration-200">
      {/* 1. Global Navigation & Action Header (통합 표준 규격 100% 준수) */}
      <header className="h-14 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] flex items-center justify-between shrink-0 z-30 shadow-xs transition-colors">
        {/* Left: 목록으로 | 이름 | 파일 형식 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setActiveDocument(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#292936] transition-colors shrink-0"
            title="목록으로 나가기"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
            <span>목록으로</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Document Title: 보기 모드일 때는 연한 배경을 완전히 없애고 헤더 배경과 100% 동일하게 순수 텍스트로 표시 */}
          {isEditMode ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="제목 없는 캐릭터 시트"
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-slate-100/70 dark:bg-[#2A2938] border border-slate-200 dark:border-[#3A3948] px-2.5 py-1 rounded-lg focus:border-lavender-500 focus:outline-none cursor-text truncate max-w-xs md:max-w-md transition-all"
            />
          ) : (
            <span
              onClick={() => setIsEditMode(true)}
              title="클릭하여 편집 모드로 전환"
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-transparent border-0 px-1 py-1 truncate max-w-xs md:max-w-md cursor-pointer select-text"
            >
              {docTitle || '제목 없는 캐릭터 시트'}
            </span>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Template Badge (파일 형식) */}
          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/60 dark:border-[#524580] shrink-0">
            캐릭터 시트
          </span>
        </div>

        {/* Right: 보기/편집 | 자동 저장됨 | 다크모드 | 이미지 저장 | 즐겨찾기 | 도움말 */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-[#A5A3B5] shrink-0">
          {/* 1. 보기 / 편집 스위치 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#292936] border border-slate-200/80 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isEditMode
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>보기</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isEditMode
                  ? 'bg-lavender-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>편집</span>
            </button>
          </div>

          <span className="text-slate-200 dark:text-[#3A3948]">|</span>

          {/* 2. 자동 저장됨 배지 */}
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <Save
              className={`w-3.5 h-3.5 ${
                saveStatus === 'saving'
                  ? 'text-amber-500 animate-pulse'
                  : 'text-slate-400 dark:text-[#A5A3B5]'
              }`}
            />
            <span
              className={
                saveStatus === 'saving'
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-slate-400 dark:text-[#A5A3B5]'
              }
            >
              {saveStatus === 'saving' ? '저장 중...' : '자동 저장됨'}
            </span>
          </div>

          <span className="text-slate-200 dark:text-[#3A3948]">|</span>

          {/* 3. 다크 모드 토글 */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] transition-colors"
            title="다크 모드 토글"
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-[#A995F5]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </button>

          {/* 4. 이미지 저장 버튼 */}
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            title="캐릭터 프로필 시트 이미지 저장 (PNG)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#E8E7EF] hover:text-lavender-700 dark:hover:text-[#B7A5FF] hover:bg-lavender-50 dark:hover:bg-[#292936] hover:border-lavender-200 transition-colors text-xs font-medium"
          >
            <Download
              className={`w-3.5 h-3.5 ${
                isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400 dark:text-[#A5A3B5]'
              }`}
            />
            <span>{isExporting ? '저장 중...' : '이미지 저장'}</span>
          </button>

          {/* 5. 즐겨찾기 버튼 */}
          <button
            onClick={() => toggleFavoriteDocument(activeDocument.id)}
            title="즐겨찾기 토글"
            className={`p-1.5 rounded-lg border transition-colors ${
              activeDocument.isFavorite
                ? 'border-lavender-200 dark:border-[#554884] bg-lavender-50 dark:bg-[#352E58] text-lavender-600 dark:text-[#A995F5]'
                : 'border-slate-200 dark:border-[#3A3948] text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-[#E8E7EF]'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                activeDocument.isFavorite ? 'fill-lavender-600 dark:fill-[#A995F5]' : ''
              }`}
            />
          </button>

          {/* 6. 도움말 버튼 */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            title="캐릭터 시트 사용법 및 도움말"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] text-slate-500 hover:text-lavender-600 dark:text-[#A5A3B5] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main 2-Column Split Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================== */}
        {/* Left Side: Character List Sidebar (280px ~ 300px) */}
        {/* ============================================================== */}
        <aside className="w-72 md:w-80 border-r border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] flex flex-col shrink-0 transition-colors z-10">
          {/* Top Search & Add Header */}
          <div className="p-3.5 border-b border-[#ECEEF3] dark:border-[#3A3948] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-lavender-600 dark:text-[#B7A5FF]" />
                <span className="text-xs font-bold text-slate-800 dark:text-[#F3F2F8]">
                  등장인물 목록 ({characters.length})
                </span>
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleAddNewCharacter}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-[11px] shadow-xs transition-all"
                  title="새 캐릭터 추가"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>새 인물</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="인물명, 역할, 이명 검색..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-xs text-slate-800 dark:text-[#F3F2F8] placeholder-slate-400 focus:border-lavender-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Character Cards List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {filteredCharacters.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-[#8E8B9E]">
                검색 결과와 일치하는 인물이 없습니다.
              </div>
            ) : (
              filteredCharacters.map((char) => {
                const isActive = char.id === activeCharacterId;

                return (
                  <div
                    key={char.id}
                    onClick={() => setActiveCharacterId(char.id)}
                    className={`group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-lavender-50/90 dark:bg-[#2E2849] border border-lavender-300 dark:border-[#594B88] shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-[#252533] border border-transparent'
                    }`}
                  >
                    {/* Avatar Thumbnail */}
                    <div className="relative shrink-0">
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-11 h-11 rounded-xl object-cover border border-black/10 dark:border-white/10 shadow-2xs"
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#1E1E27]"
                        style={{ backgroundColor: char.themeColor || '#6366F1' }}
                      />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isActive
                              ? 'text-lavender-900 dark:text-[#F3F2F8]'
                              : 'text-slate-800 dark:text-[#E8E7EF]'
                          }`}
                        >
                          {char.name}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 ${
                            isActive
                              ? 'bg-lavender-200/70 dark:bg-[#43376E] text-lavender-800 dark:text-[#DDD6FE]'
                              : 'bg-slate-100 dark:bg-[#2A2938] text-slate-500 dark:text-[#A5A3B5]'
                          }`}
                        >
                          {char.roleTag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-[#8E8B9E] truncate">
                        {char.titleOrAlias || char.occupation || `${char.race} • ${char.age}`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ============================================================== */}
        {/* Right Side: Detailed Profile Showcase (Scrollable Canvas) */}
        {/* ============================================================== */}
        <main
          ref={profilePrintRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-5xl mx-auto"
        >
          {/* 1. Hero Profile Banner Card (대형 비주얼 + 핵심 소개) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] p-6 shadow-soft overflow-hidden relative transition-colors">
            {/* Top Accent Gradient Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-2"
              style={{
                background: `linear-gradient(90deg, ${activeChar.themeColor || '#6366F1'}, #8B5CF6, #06B6D4)`,
              }}
            />

            <div className="flex flex-col md:flex-row gap-6 items-start mt-2">
              {/* Large Representative Portrait */}
              <div className="relative group/avatar shrink-0 w-full sm:w-52 h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-[#3A3948] shadow-md bg-slate-100 dark:bg-[#292936]">
                <img
                  src={activeChar.avatarUrl}
                  alt={activeChar.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
                />
                {isEditMode && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-semibold">대표 이미지 교체</span>
                  </div>
                )}
              </div>

              {/* Character Main Titles & Quote */}
              <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: activeChar.themeColor || '#6366F1' }}
                    >
                      {isEditMode ? (
                        <input
                          type="text"
                          value={activeChar.roleTag}
                          onChange={(e) => updateField('roleTag', e.target.value)}
                          className="bg-transparent border-0 text-white font-bold text-[11px] w-16 focus:outline-none"
                        />
                      ) : (
                        activeChar.roleTag
                      )}
                    </span>

                    {/* Alias / Title */}
                    <span className="text-xs font-semibold text-lavender-600 dark:text-[#B7A5FF]">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={activeChar.titleOrAlias || ''}
                          placeholder="이명 / 별칭"
                          onChange={(e) => updateField('titleOrAlias', e.target.value)}
                          className="bg-slate-100 dark:bg-[#2A2938] px-2 py-0.5 rounded border border-slate-200 dark:border-[#3A3948] focus:outline-none text-xs"
                        />
                      ) : (
                        `「${activeChar.titleOrAlias || '칭호 없음'}」`
                      )}
                    </span>
                  </div>

                  {/* Character Name (KO & EN) */}
                  <div className="flex items-baseline gap-3">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={activeChar.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="text-2xl font-black text-slate-800 dark:text-[#F3F2F8] bg-slate-100 dark:bg-[#2A2938] px-2.5 py-0.5 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none"
                      />
                    ) : (
                      <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-[#F3F2F8] tracking-tight">
                        {activeChar.name}
                      </h2>
                    )}

                    {isEditMode ? (
                      <input
                        type="text"
                        value={activeChar.nameEn || ''}
                        placeholder="English Name"
                        onChange={(e) => updateField('nameEn', e.target.value)}
                        className="text-sm font-semibold text-slate-400 bg-slate-100 dark:bg-[#2A2938] px-2 py-0.5 rounded border border-slate-200 dark:border-[#3A3948] focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-400 dark:text-[#8E8B9E] font-mono">
                        {activeChar.nameEn}
                      </span>
                    )}
                  </div>

                  {/* Quote / Catchphrase */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#242432] border border-slate-100 dark:border-[#2D2D3D] flex items-start gap-2.5">
                    <Quote className="w-4 h-4 text-lavender-500 shrink-0 mt-0.5" />
                    {isEditMode ? (
                      <input
                        type="text"
                        value={activeChar.quote || ''}
                        placeholder="캐릭터를 상징하는 대표 대사나 좌우명을 적어주세요."
                        onChange={(e) => updateField('quote', e.target.value)}
                        className="text-xs italic text-slate-700 dark:text-[#C5C3D4] bg-transparent border-0 w-full focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs italic font-medium text-slate-700 dark:text-[#C5C3D4] leading-relaxed">
                        "{activeChar.quote || '등록된 대표 대사가 없습니다.'}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Spec Pills Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-[#2E2E3E] text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E]">나이 / 성별</span>
                    <span className="font-semibold text-slate-700 dark:text-[#E8E7EF]">
                      {activeChar.age} • {activeChar.gender}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E]">종족</span>
                    <span className="font-semibold text-slate-700 dark:text-[#E8E7EF]">
                      {activeChar.race}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E]">신장 / 체중</span>
                    <span className="font-semibold text-slate-700 dark:text-[#E8E7EF]">
                      {activeChar.heightWeight}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E]">소속 및 직업</span>
                    <span className="font-semibold text-slate-700 dark:text-[#E8E7EF] truncate">
                      {activeChar.occupation}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Section: 기본 인적사항 & 성향 (Profile Details Card) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] p-6 shadow-soft space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#3A3948]">
              <User className="w-4 h-4 text-lavender-600 dark:text-[#B7A5FF]" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8]">
                기본 인적사항 및 프로필
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                    생일 및 별자리
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={activeChar.birthday}
                      onChange={(e) => updateField('birthday', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                    />
                  ) : (
                    <p className="font-semibold text-slate-800 dark:text-[#E8E7EF]">
                      {activeChar.birthday || '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                    혈액형
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={activeChar.bloodType}
                      onChange={(e) => updateField('bloodType', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                    />
                  ) : (
                    <p className="font-semibold text-slate-800 dark:text-[#E8E7EF]">
                      {activeChar.bloodType || '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                    취미 및 특기
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={activeChar.hobbies}
                      onChange={(e) => updateField('hobbies', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                    />
                  ) : (
                    <p className="font-medium text-slate-700 dark:text-[#C5C3D4]">
                      {activeChar.hobbies || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                    좋아하는 것
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={activeChar.likes}
                      onChange={(e) => updateField('likes', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                    />
                  ) : (
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">
                      {activeChar.likes || '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                    싫어하는 것
                  </label>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={activeChar.dislikes}
                      onChange={(e) => updateField('dislikes', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                    />
                  ) : (
                    <p className="font-medium text-rose-600 dark:text-rose-400">
                      {activeChar.dislikes || '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                    상징 퍼스널 컬러
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-lg border border-black/10 dark:border-white/10 shadow-xs"
                      style={{ backgroundColor: activeChar.themeColor || '#6366F1' }}
                    />
                    <span className="font-mono text-xs text-slate-600 dark:text-[#A5A3B5]">
                      {activeChar.themeColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Section: 외형 및 비주얼 디자인 (Appearance & Design Card) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] p-6 shadow-soft space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#3A3948]">
              <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8]">
                외형 및 비주얼 디자인
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  헤어스타일 & 눈 / 인상
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.hairAndEyes}
                    onChange={(e) => updateField('hairAndEyes', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.hairAndEyes || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  의상 스타일 & 소품
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.outfit}
                    onChange={(e) => updateField('outfit', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.outfit || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  신체적 특징 (흉터, 체형, 문신 등)
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={activeChar.physicalFeatures}
                    onChange={(e) => updateField('physicalFeatures', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF]">
                    {activeChar.physicalFeatures || '-'}
                  </p>
                )}
              </div>

              {/* Design Palette Chips */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1.5">
                  디자인 컬러 팔레트
                </label>
                <div className="flex items-center gap-2">
                  {activeChar.colorPalette.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#292936] border border-slate-200/80 dark:border-[#3A3948]"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-md shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-mono text-[10px] text-slate-600 dark:text-[#A5A3B5]">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Section: 성격 및 행동 특성 (Personality & Traits Card) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] p-6 shadow-soft space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#3A3948]">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8]">
                성격 및 행동 특성
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  성격 요약
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.personalitySummary}
                    onChange={(e) => updateField('personalitySummary', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.personalitySummary || '-'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                    장점 및 매력
                  </label>
                  {isEditMode ? (
                    <textarea
                      rows={2}
                      value={activeChar.strengths}
                      onChange={(e) => updateField('strengths', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none"
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                      {activeChar.strengths || '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1">
                    단점 및 약점
                  </label>
                  {isEditMode ? (
                    <textarea
                      rows={2}
                      value={activeChar.weaknesses}
                      onChange={(e) => updateField('weaknesses', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none"
                    />
                  ) : (
                    <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                      {activeChar.weaknesses || '-'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  말투 및 무의식적 행동 습관
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={activeChar.speechAndHabits}
                    onChange={(e) => updateField('speechAndHabits', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF]">
                    {activeChar.speechAndHabits || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 5. Section: 배경 스토리 및 과거사 (Story & Lore Card) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] p-6 shadow-soft space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#3A3948]">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8]">
                배경 스토리 및 서사 설정
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  출신 및 성장 배경
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.originAndBackground}
                    onChange={(e) => updateField('originAndBackground', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.originAndBackground || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  과거 결정적 사건 (전환점)
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.pastStory}
                    onChange={(e) => updateField('pastStory', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.pastStory || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  현재 상황 및 궁극적 목표
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.currentStatusAndGoal}
                    onChange={(e) => updateField('currentStatusAndGoal', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.currentStatusAndGoal || '-'}
                  </p>
                )}
              </div>

              {/* Secret Lore Alert Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40">
                <label className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>비밀 및 숨겨진 설정</span>
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.secretLore}
                    onChange={(e) => updateField('secretLore', e.target.value)}
                    className="w-full p-2 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-[#201F29] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none"
                  />
                ) : (
                  <p className="text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                    {activeChar.secretLore || '등록된 비밀 설정이 없습니다.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 6. Section: 능력, 소지품 및 인간관계 (Abilities & Gear Card) */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] p-6 shadow-soft space-y-4 transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#3A3948]">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8]">
                능력 및 소지품 / 인간관계
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  대표 능력 및 기술
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.abilities}
                    onChange={(e) => updateField('abilities', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none leading-relaxed"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.abilities || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  전용 장비 및 주요 소지품
                </label>
                {isEditMode ? (
                  <input
                    type="text"
                    value={activeChar.inventory}
                    onChange={(e) => updateField('inventory', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF]">
                    {activeChar.inventory || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] block mb-1">
                  주요 인간관계 메모
                </label>
                {isEditMode ? (
                  <textarea
                    rows={2}
                    value={activeChar.relationshipsNote}
                    onChange={(e) => updateField('relationshipsNote', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:outline-none text-xs resize-none"
                  />
                ) : (
                  <p className="text-slate-700 dark:text-[#E8E7EF] leading-relaxed">
                    {activeChar.relationshipsNote || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 3. Help Modal */}
      <CharacterSheetHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
