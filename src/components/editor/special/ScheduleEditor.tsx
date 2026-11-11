import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Moon,
  Sun,
  Download,
  Star,
  HelpCircle,
  Save,
  Plus,
  FolderPlus,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Percent,
  Compass,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useTheme } from '../../../store/ThemeContext';
import { exportElementAsPng } from '../../../utils/exportImage';
import { ScheduleHelpModal } from './ScheduleHelpModal';
import { ScheduleDetailModal, ScheduleItem, ScheduleGroup } from './ScheduleDetailModal';

// Sample Dummy Groups (for UI Design Preview)
const INITIAL_GROUPS: ScheduleGroup[] = [
  { id: 'group-1', title: '🎮 개인 프로젝트 (Blankspace)', color: '#8B5CF6', isCollapsed: false },
  { id: 'group-2', title: '📚 학업 및 전공 과제', color: '#10B981', isCollapsed: false },
  { id: 'group-3', title: '🌱 일상생활 & 루틴', color: '#F59E0B', isCollapsed: false },
];

// Sample Dummy Tasks / Schedule Items (7 Days: 2026-11-16 Mon ~ 2026-11-22 Sun)
const INITIAL_ITEMS: ScheduleItem[] = [
  // Group 1
  {
    id: 'item-1',
    groupId: 'group-1',
    title: '게임 기획서 및 세계관 초안 작성',
    startDate: '2026-11-16',
    endDate: '2026-11-18',
    color: '#8B5CF6',
    status: 'completed',
    progress: 100,
    description: '핵심 메카닉 및 시나리오 뼈대 구성 완료',
  },
  {
    id: 'item-2',
    groupId: 'group-1',
    title: '주인공 캐릭터 3D 모델링 스케치',
    startDate: '2026-11-17',
    endDate: '2026-11-20',
    color: '#6366F1',
    status: 'in_progress',
    progress: 65,
    description: '기본 T-Pose 모델링 및 텍스처 베이킹 작업',
  },
  {
    id: 'item-3',
    groupId: 'group-1',
    title: '인벤토리 및 스킬 UI 디자인',
    startDate: '2026-11-19',
    endDate: '2026-11-22',
    color: '#0EA5E9',
    status: 'pending',
    progress: 20,
    description: '피그마 컴포넌트 셋업 및 아이콘 리소스 배치',
  },
  // Group 2
  {
    id: 'item-4',
    groupId: 'group-2',
    title: '게임 엔진 심화 프로그래밍 과제 제출',
    startDate: '2026-11-16',
    endDate: '2026-11-17',
    color: '#10B981',
    status: 'completed',
    progress: 100,
    description: '쉐이더 파이프라인 최적화 보고서 및 빌드 제출',
  },
  {
    id: 'item-5',
    groupId: 'group-2',
    title: '전공 서적 및 GDC 아티클 레퍼런스 조사',
    startDate: '2026-11-18',
    endDate: '2026-11-21',
    color: '#059669',
    status: 'in_progress',
    progress: 50,
    description: '절차적 맵 생성 알고리즘 관련 논문 3편 요약',
  },
  {
    id: 'item-6',
    groupId: 'group-2',
    title: '기말 텀프로젝트 중간 발표 준비',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    color: '#047857',
    status: 'pending',
    progress: 0,
    description: '슬라이드 구성 및 시연 영상 녹화',
  },
  // Group 3
  {
    id: 'item-7',
    groupId: 'group-3',
    title: '주 3회 헬스 운동 루틴',
    startDate: '2026-11-16',
    endDate: '2026-11-21',
    color: '#F59E0B',
    status: 'in_progress',
    progress: 75,
    description: '월/수/금 상하체 분할 웨이트 트레이닝',
  },
  {
    id: 'item-8',
    groupId: 'group-3',
    title: '개발자 네트워킹 소모임 참석',
    startDate: '2026-11-21',
    endDate: '2026-11-21',
    color: '#D97706',
    status: 'pending',
    progress: 0,
    description: '인디 게임 개발자 오프라인 모임',
  },
  {
    id: 'item-9',
    groupId: 'group-3',
    title: '주말 휴식 & 게임 아트 전시회 관람',
    startDate: '2026-11-22',
    endDate: '2026-11-22',
    color: '#B45309',
    status: 'pending',
    progress: 0,
    description: 'DDP 디자인 전시 및 미술관 방문',
  },
];

type ViewScale = 'day' | 'week' | 'month';

// Date Helper Functions
const formatDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
};

const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export const ScheduleEditor: React.FC = () => {
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

  // Time Scale View (Day, Week, Month) - Default: Week
  const [viewScale, setViewScale] = useState<ViewScale>('week');
  const [showTodayMarker, setShowTodayMarker] = useState(true);

  // Dynamic Base Date for whole timeline (전체 날짜 직접 수정 지원)
  const [baseDate, setBaseDate] = useState<Date>(() => new Date(2026, 10, 16)); // 2026-11-16 (월)

  // Groups and Schedule Items (UI Preview Data)
  const [groups, setGroups] = useState<ScheduleGroup[]>(INITIAL_GROUPS);
  const [items, setItems] = useState<ScheduleItem[]>(INITIAL_ITEMS);

  // Active / Selected Item for Detail Modal
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Hover sync between task list and timeline bar
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Container refs for export & date picker
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const datePickerInputRef = useRef<HTMLInputElement>(null);

  // Open native Date Picker safely
  const handleOpenDatePicker = () => {
    if (datePickerInputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          datePickerInputRef.current.showPicker();
        } else {
          datePickerInputRef.current.focus();
        }
      } catch {
        datePickerInputRef.current?.focus();
      }
    }
  };

  // Document Title state
  const [docTitle, setDocTitle] = useState(activeDocument?.title || '주간 프로젝트 간트 차트');
  useEffect(() => {
    if (activeDocument) setDocTitle(activeDocument.title);
  }, [activeDocument]);

  const handleTitleBlur = () => {
    if (activeDocument && docTitle.trim() && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
    }
  };

  // Shortcut Ctrl+E for View/Edit mode
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

  // Time Axis Days dynamically computed from baseDate and viewScale
  const daysInView = useMemo(() => {
    const list = [];
    const todayStr = formatDateKey(new Date());

    if (viewScale === 'week') {
      const monday = getMonday(baseDate);
      for (let i = 0; i < 7; i++) {
        const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        const dateStr = formatDateKey(cur);
        const dayOfWeek = cur.getDay();
        list.push({
          date: cur,
          dateStr,
          year: cur.getFullYear(),
          month: cur.getMonth() + 1,
          dayNum: cur.getDate(),
          dayLabel: DAY_LABELS[dayOfWeek],
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isToday: dateStr === todayStr,
        });
      }
    } else if (viewScale === 'day') {
      // 7 days around baseDate (-3 to +3)
      for (let i = -3; i <= 3; i++) {
        const cur = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
        const dateStr = formatDateKey(cur);
        const dayOfWeek = cur.getDay();
        list.push({
          date: cur,
          dateStr,
          year: cur.getFullYear(),
          month: cur.getMonth() + 1,
          dayNum: cur.getDate(),
          dayLabel: DAY_LABELS[dayOfWeek],
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isToday: dateStr === todayStr,
        });
      }
    } else {
      // month: 1st to last day of baseDate month
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= lastDay; d++) {
        const cur = new Date(year, month, d);
        const dateStr = formatDateKey(cur);
        const dayOfWeek = cur.getDay();
        list.push({
          date: cur,
          dateStr,
          year: cur.getFullYear(),
          month: cur.getMonth() + 1,
          dayNum: cur.getDate(),
          dayLabel: DAY_LABELS[dayOfWeek],
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isToday: dateStr === todayStr,
        });
      }
    }

    return list;
  }, [baseDate, viewScale]);

  // Navigate Period (< / Today / >)
  const handlePrevPeriod = () => {
    setBaseDate((prev) => {
      const next = new Date(prev);
      if (viewScale === 'week') next.setDate(prev.getDate() - 7);
      else if (viewScale === 'day') next.setDate(prev.getDate() - 1);
      else next.setMonth(prev.getMonth() - 1);
      return next;
    });
  };

  const handleNextPeriod = () => {
    setBaseDate((prev) => {
      const next = new Date(prev);
      if (viewScale === 'week') next.setDate(prev.getDate() + 7);
      else if (viewScale === 'day') next.setDate(prev.getDate() + 1);
      else next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const handleTodayClick = () => {
    setBaseDate(new Date());
  };

  // Period label for toolbar: '00월 00주차' 없이 오직 순수 기간만 표시
  const periodRangeStr = useMemo(() => {
    if (daysInView.length === 0) return '';
    const first = daysInView[0];
    const last = daysInView[daysInView.length - 1];

    const fYear = first.year;
    const fMonth = String(first.month).padStart(2, '0');
    const fDay = String(first.dayNum).padStart(2, '0');

    const lYear = last.year;
    const lMonth = String(last.month).padStart(2, '0');
    const lDay = String(last.dayNum).padStart(2, '0');

    return `${fYear}.${fMonth}.${fDay} ~ ${lYear}.${lMonth}.${lDay}`;
  }, [daysInView]);

  // Column width per day (px)
  const columnWidth = viewScale === 'day' ? 140 : viewScale === 'month' ? 48 : 100;
  const totalTimelineWidth = columnWidth * daysInView.length;

  // Today marker index
  const todayColumnIndex = daysInView.findIndex((d) => d.isToday);

  // Toggle group collapse
  const handleToggleCollapse = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g))
    );
  };

  // Toggle all groups
  const handleToggleAllGroups = () => {
    const hasUncollapsed = groups.some((g) => !g.isCollapsed);
    setGroups((prev) => prev.map((g) => ({ ...g, isCollapsed: hasUncollapsed })));
  };

  // Export as PNG
  const handleExportImage = async () => {
    if (!scheduleContainerRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPng(scheduleContainerRef.current, {
        fileName: `${activeDocument?.title || 'schedule-gantt'}-${new Date().toISOString().slice(0, 10)}.png`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate Bar Left & Width based on dates
  const calculateBarPosition = (startDate: string, endDate: string) => {
    if (daysInView.length === 0) return { left: -9999, width: 0, isVisible: false };

    const firstViewDate = daysInView[0].dateStr;
    const lastViewDate = daysInView[daysInView.length - 1].dateStr;

    // Check if item overlaps with current view
    if (endDate < firstViewDate || startDate > lastViewDate) {
      return { left: -9999, width: 0, isVisible: false };
    }

    let startIndex = daysInView.findIndex((d) => d.dateStr === startDate);
    let endIndex = daysInView.findIndex((d) => d.dateStr === endDate);

    if (startIndex === -1) {
      startIndex = startDate < firstViewDate ? 0 : daysInView.length - 1;
    }
    if (endIndex === -1) {
      endIndex = endDate > lastViewDate ? daysInView.length - 1 : 0;
    }

    const safeStart = Math.min(startIndex, endIndex);
    const safeEnd = Math.max(startIndex, endIndex);

    const left = safeStart * columnWidth + 8;
    const width = Math.max(32, (safeEnd - safeStart + 1) * columnWidth - 16);

    return { left, width, isVisible: true };
  };

  if (!activeDocument) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] dark:bg-[#15151D] relative select-none overflow-hidden transition-colors duration-200">
      {/* 1. Global Navigation & Action Header (통합 표준 규격) */}
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
              placeholder="제목 없는 일정"
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-slate-100/70 dark:bg-[#2A2938] border border-slate-200 dark:border-[#3A3948] px-2.5 py-1 rounded-lg focus:border-lavender-500 focus:outline-none cursor-text truncate max-w-xs md:max-w-md transition-all"
            />
          ) : (
            <span
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-transparent border-0 px-1 py-1 truncate max-w-xs md:max-w-md select-text cursor-default"
            >
              {docTitle || '제목 없는 일정'}
            </span>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Template Badge (파일 형식) */}
          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/60 dark:border-[#524580] shrink-0">
            일정 (간트 차트)
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
            onClick={handleExportImage}
            disabled={isExporting}
            title="간트 차트 이미지로 저장 (PNG)"
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
            title="일정 템플릿 사용법 및 도움말"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] text-slate-500 hover:text-lavender-600 dark:text-[#A5A3B5] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Gantt Secondary Toolbar (기간 이동, 시간 단위 전환, 오늘 표시, 항목 추가) */}
      <div className="h-13 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] bg-white/70 dark:bg-[#1E1E27]/70 backdrop-blur-md flex items-center justify-between shrink-0 z-20 transition-colors">
        {/* Left: Date Period Navigator & Direct Date Editor */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#292936] p-0.5 rounded-xl border border-slate-200/60 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={handlePrevPeriod}
              className="p-1 rounded-lg text-slate-500 dark:text-[#A5A3B5] hover:bg-white dark:hover:bg-[#1E1E27] hover:text-slate-800 dark:hover:text-white transition-all shadow-2xs"
              title="이전 기간"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTodayClick}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-lavender-700 dark:text-[#B7A5FF] hover:bg-white dark:hover:bg-[#1E1E27] transition-all shadow-2xs"
              title="오늘 날짜/주차로 이동"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={handleNextPeriod}
              className="p-1 rounded-lg text-slate-500 dark:text-[#A5A3B5] hover:bg-white dark:hover:bg-[#1E1E27] hover:text-slate-800 dark:hover:text-white transition-all shadow-2xs"
              title="다음 기간"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Date Picker Button & Period Label (클릭 시 브라우저 날짜 픽커 즉시 호출) */}
          <button
            type="button"
            onClick={handleOpenDatePicker}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] hover:bg-lavender-50 dark:hover:bg-[#352E58]/60 hover:border-lavender-300 dark:hover:border-[#524580] transition-all cursor-pointer group shadow-2xs"
            title="클릭하여 전체 기간 기준 날짜 선택"
          >
            <Calendar className="w-4 h-4 text-lavender-600 dark:text-[#B7A5FF] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 dark:text-[#F3F2F8] tracking-tight">
              {periodRangeStr}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E] group-hover:text-lavender-600 dark:group-hover:text-[#B7A5FF] transition-colors ml-0.5">
              ▼
            </span>

            {/* Hidden Native Date Input for showPicker() */}
            <input
              ref={datePickerInputRef}
              type="date"
              value={formatDateKey(baseDate)}
              onChange={(e) => {
                if (e.target.value) {
                  const parts = e.target.value.split('-').map(Number);
                  setBaseDate(new Date(parts[0], parts[1] - 1, parts[2]));
                }
              }}
              className="absolute left-0 bottom-0 w-1 h-1 opacity-0 pointer-events-none"
              tabIndex={-1}
            />
          </button>
        </div>

        {/* Center: View Scale (Day / Week / Month) */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#292936] border border-slate-200/80 dark:border-[#3A3948]">
          {(['day', 'week', 'month'] as const).map((scale) => {
            const isScaleActive = viewScale === scale;
            const labelMap = { day: '일간', week: '주간', month: '월간' };
            return (
              <button
                key={scale}
                type="button"
                onClick={() => setViewScale(scale)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isScaleActive
                    ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                    : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
                }`}
              >
                {labelMap[scale]}
              </button>
            );
          })}
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Today line toggle */}
          <button
            type="button"
            onClick={() => setShowTodayMarker((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-colors ${
              showTodayMarker
                ? 'bg-lavender-50 dark:bg-[#352E58]/50 border-lavender-300 dark:border-[#524580] text-lavender-700 dark:text-[#B7A5FF]'
                : 'bg-white dark:bg-[#292936] border-slate-200 dark:border-[#3A3948] text-slate-400 dark:text-[#A5A3B5]'
            }`}
            title="오늘 날짜 기준선 토글"
          >
            <div className={`w-2 h-2 rounded-full ${showTodayMarker ? 'bg-lavender-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <span>오늘 기준선</span>
          </button>

          {/* Toggle all groups */}
          <button
            type="button"
            onClick={handleToggleAllGroups}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#292936] text-xs font-medium text-slate-600 dark:text-[#C5C3D4] hover:bg-slate-50 dark:hover:bg-[#1E1E27] transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5]" />
            <span>그룹 접기/펼치기</span>
          </button>

          {/* Edit Mode Actions (Group & Task creation) */}
          {isEditMode && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-[#3A3948]">
              <button
                type="button"
                onClick={() => {
                  const newGroup: ScheduleGroup = {
                    id: `group-${Date.now()}`,
                    title: '새 업무 그룹',
                    color: '#8B5CF6',
                    isCollapsed: false,
                  };
                  setGroups((prev) => [...prev, newGroup]);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#292936] dark:hover:bg-[#333346] text-slate-700 dark:text-[#E8E7EF] font-semibold text-xs transition-colors shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
                <span>+ 그룹 추가</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const newItem: ScheduleItem = {
                    id: `item-${Date.now()}`,
                    groupId: groups[0]?.id || 'group-1',
                    title: '새 일정 작업',
                    startDate: '2026-11-18',
                    endDate: '2026-11-20',
                    color: '#8B5CF6',
                    status: 'pending',
                    progress: 0,
                    description: '',
                  };
                  setItems((prev) => [...prev, newItem]);
                  setSelectedItem(newItem);
                  setIsDetailModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 새 일정</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Gantt Chart Workspace (Split View) */}
      <div
        ref={scheduleContainerRef}
        className="flex-1 flex overflow-hidden bg-[#F8F9FC] dark:bg-[#15151D]"
      >
        {/* ============================================================== */}
        {/* Left Side: Tasks & Groups Panel (Fixed width, sync vertical) */}
        {/* ============================================================== */}
        <div className="w-80 md:w-96 flex flex-col shrink-0 border-r border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] z-10 transition-colors">
          {/* Table Header */}
          <div className="h-12 px-4 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between bg-slate-50/70 dark:bg-[#262634] text-xs font-bold text-slate-500 dark:text-[#A5A3B5]">
            <span className="flex-1">업무 그룹 / 작업 목록</span>
            <div className="flex items-center gap-4 shrink-0 text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E]">
              <span className="w-12 text-center">상태</span>
              <span className="w-14 text-right">진행률</span>
            </div>
          </div>

          {/* Group & Task Rows List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2D2D3D]">
            {groups.map((group) => {
              const groupItems = items.filter((item) => item.groupId === group.id);

              return (
                <div key={group.id} className="flex flex-col">
                  {/* Group Header Row */}
                  <div
                    onClick={() => handleToggleCollapse(group.id)}
                    className="h-10 px-4 flex items-center justify-between bg-slate-100/60 dark:bg-[#23232F] hover:bg-slate-200/50 dark:hover:bg-[#2A2A38] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          group.isCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      {isEditMode ? (
                        <input
                          type="text"
                          value={group.title}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setGroups((prev) =>
                              prev.map((g) => (g.id === group.id ? { ...g, title: val } : g))
                            );
                          }}
                          className="font-bold text-xs bg-transparent border-0 p-0 text-slate-800 dark:text-[#F3F2F8] focus:outline-none focus:ring-1 focus:ring-lavender-500 rounded px-1 w-full truncate"
                        />
                      ) : (
                        <span className="font-bold text-xs text-slate-800 dark:text-[#F3F2F8] truncate">
                          {group.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-[#353546] text-slate-600 dark:text-[#A5A3B5]">
                        {groupItems.length}개
                      </span>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newItem: ScheduleItem = {
                              id: `item-${Date.now()}`,
                              groupId: group.id,
                              title: '새 작업',
                              startDate: '2026-11-16',
                              endDate: '2026-11-18',
                              color: group.color,
                              status: 'pending',
                              progress: 0,
                            };
                            setItems((prev) => [...prev, newItem]);
                            setSelectedItem(newItem);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-lavender-600 hover:bg-slate-200 dark:hover:bg-[#3A3948] transition-colors"
                          title="이 그룹에 작업 추가"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tasks under this Group */}
                  {!group.isCollapsed &&
                    groupItems.map((item) => {
                      const isHovered = hoveredItemId === item.id;
                      const statusMap = {
                        pending: { text: '대기', bg: 'bg-slate-100 text-slate-600 dark:bg-[#2A2938] dark:text-[#A5A3B5]' },
                        in_progress: { text: '진행중', bg: 'bg-blue-50 text-blue-700 dark:bg-[#1E293B] dark:text-[#93C5FD]' },
                        completed: { text: '완료', bg: 'bg-emerald-50 text-emerald-700 dark:bg-[#132E27] dark:text-[#6EE7B7]' },
                        on_hold: { text: '보류', bg: 'bg-amber-50 text-amber-700 dark:bg-[#322416] dark:text-[#FCD34D]' },
                      };

                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredItemId(item.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailModalOpen(true);
                          }}
                          className={`h-11 px-4 pl-8 flex items-center justify-between border-b border-slate-100/70 dark:border-[#2D2D3D] cursor-pointer transition-colors ${
                            isHovered
                              ? 'bg-lavender-50/60 dark:bg-[#2D2845]'
                              : 'hover:bg-slate-50/80 dark:hover:bg-[#242432]'
                          }`}
                        >
                          {/* Task Name */}
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-[#E8E7EF] truncate">
                              {item.title}
                            </span>
                          </div>

                          {/* Status and Progress */}
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Status Tag */}
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                statusMap[item.status].bg
                              }`}
                            >
                              {statusMap[item.status].text}
                            </span>

                            {/* Progress bar / percent */}
                            <div className="w-14 flex items-center gap-1.5 justify-end">
                              <div className="w-8 h-1.5 bg-slate-200 dark:bg-[#353546] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${item.progress}%`,
                                    backgroundColor: item.color || '#8B5CF6',
                                  }}
                                />
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 dark:text-[#8E8B9E] w-6 text-right">
                                {item.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* Right Side: Timeline Gantt Bars Workspace (Horizontal Scroll) */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-auto relative bg-[#FAFBFD] dark:bg-[#171720]">
          {/* Inner Canvas with Computed Width */}
          <div style={{ width: `${Math.max(totalTimelineWidth, 700)}px` }} className="relative flex flex-col min-h-full">
            {/* Timeline Header (Days & Dates) */}
            <div className="h-12 border-b border-[#ECEEF3] dark:border-[#3A3948] bg-slate-50/70 dark:bg-[#262634] flex shrink-0 sticky top-0 z-20">
              {daysInView.map((day, idx) => (
                <div
                  key={day.dateStr}
                  style={{ width: `${columnWidth}px` }}
                  className={`h-full border-r border-slate-200/70 dark:border-[#3A3948] flex flex-col items-center justify-center text-xs shrink-0 transition-colors ${
                    day.isWeekend
                      ? 'bg-slate-100/40 dark:bg-[#1E1E28]/40'
                      : day.isToday
                      ? 'bg-lavender-50/50 dark:bg-[#352E58]/40'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-bold ${
                        day.isToday
                          ? 'text-lavender-600 dark:text-[#B7A5FF]'
                          : day.isWeekend
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-slate-700 dark:text-[#E8E7EF]'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-[#8E8B9E]">
                      ({day.dayLabel})
                    </span>
                  </div>
                  {day.isToday && (
                    <span className="text-[9px] font-bold text-lavender-600 dark:text-[#B7A5FF] -mt-0.5">
                      오늘
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Vertical Grid Lines & Today Marker Background Layer */}
            <div className="absolute inset-0 top-12 pointer-events-none flex">
              {daysInView.map((day, idx) => (
                <div
                  key={`grid-${day.dateStr}`}
                  style={{ width: `${columnWidth}px` }}
                  className={`h-full border-r border-slate-200/50 dark:border-[#2D2D3D] shrink-0 ${
                    day.isWeekend ? 'bg-slate-100/20 dark:bg-[#1F1F2B]/30' : ''
                  }`}
                />
              ))}

              {/* Today Red/Purple Vertical Line Marker */}
              {showTodayMarker && todayColumnIndex !== -1 && (
                <div
                  style={{
                    left: `${todayColumnIndex * columnWidth + columnWidth / 2}px`,
                  }}
                  className="absolute top-0 bottom-0 w-0.5 bg-lavender-500 z-10 flex flex-col items-center pointer-events-none"
                >
                  <span className="px-1.5 py-0.5 -mt-2 rounded-full text-[9px] font-bold bg-lavender-600 text-white shadow-sm">
                    오늘
                  </span>
                </div>
              )}
            </div>

            {/* Gantt Bars Rows (Corresponding 1:1 to Left Groups & Tasks) */}
            <div className="flex flex-col relative z-10 divide-y divide-slate-100 dark:divide-[#2D2D3D]">
              {groups.map((group) => {
                const groupItems = items.filter((item) => item.groupId === group.id);

                return (
                  <div key={`gantt-group-${group.id}`} className="flex flex-col">
                    {/* Empty spacer row matching group header height */}
                    <div className="h-10 border-b border-transparent bg-slate-100/20 dark:bg-[#23232F]/30" />

                    {/* Task Rows matching item height 44px */}
                    {!group.isCollapsed &&
                      groupItems.map((item) => {
                        const { left, width, isVisible } = calculateBarPosition(item.startDate, item.endDate);
                        const isHovered = hoveredItemId === item.id;

                        return (
                          <div
                            key={`gantt-row-${item.id}`}
                            onMouseEnter={() => setHoveredItemId(item.id)}
                            onMouseLeave={() => setHoveredItemId(null)}
                            className={`h-11 border-b border-slate-100/70 dark:border-[#2D2D3D] relative flex items-center transition-colors ${
                              isHovered
                                ? 'bg-lavender-50/40 dark:bg-[#2D2845]/30'
                                : 'hover:bg-slate-50/40 dark:hover:bg-[#242432]/30'
                            }`}
                          >
                            {/* Gantt Schedule Bar (Only rendered if in view) */}
                            {isVisible && (
                              <div
                                onClick={() => {
                                  setSelectedItem(item);
                                  setIsDetailModalOpen(true);
                                }}
                                style={{
                                  left: `${left}px`,
                                  width: `${width}px`,
                                  backgroundColor: item.color,
                                }}
                                className={`absolute h-7 rounded-xl shadow-xs px-2.5 flex items-center justify-between text-white text-xs font-semibold cursor-pointer select-none transition-all duration-150 overflow-hidden ${
                                  isHovered
                                    ? 'ring-2 ring-lavender-400 dark:ring-lavender-300 scale-[1.02] shadow-md z-20'
                                    : 'hover:shadow-sm z-10'
                                } ${isEditMode ? 'cursor-move' : 'cursor-pointer'}`}
                              >
                                {/* Inner Progress fill bar overlay */}
                                <div
                                  style={{ width: `${item.progress}%` }}
                                  className="absolute left-0 top-0 bottom-0 bg-black/15 pointer-events-none rounded-l-xl transition-all"
                                />

                                {/* Left Resize Handle (Edit Mode) */}
                                {isEditMode && (
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-2 hover:bg-black/20 cursor-w-resize z-20"
                                    title="시작일 드래그 조절"
                                  />
                                )}

                                {/* Bar Content */}
                                <span className="truncate relative z-10 text-[11px] font-bold drop-shadow-2xs">
                                  {item.title}
                                </span>

                                <div className="flex items-center gap-1.5 relative z-10 shrink-0 text-[10px] opacity-95">
                                  <span className="font-mono">{item.progress}%</span>
                                </div>

                                {/* Right Resize Handle (Edit Mode) */}
                                {isEditMode && (
                                  <div
                                    className="absolute right-0 top-0 bottom-0 w-2 hover:bg-black/20 cursor-e-resize z-20"
                                    title="종료일 드래그 조절"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Schedule Item Detail / Add Modal */}
      <ScheduleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        groups={groups}
        isEditMode={isEditMode}
        onSave={(updated) => {
          setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
        }}
        onDelete={(id) => {
          setItems((prev) => prev.filter((it) => it.id !== id));
        }}
      />

      {/* 5. Schedule Help Guide Modal */}
      <ScheduleHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
