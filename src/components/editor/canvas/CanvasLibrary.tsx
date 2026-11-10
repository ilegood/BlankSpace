import React from 'react';
import {
  Image as ImageIcon,
  UserCheck,
  List,
  FileText,
  Hash,
  Activity,
  Users,
  Quote,
  StickyNote,
  Plus,
} from 'lucide-react';
import { CanvasElementType } from '../../../types/canvas';

interface CanvasLibraryProps {
  onAddElement: (type: CanvasElementType) => void;
}

interface ComponentItem {
  type: CanvasElementType;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const COMPONENTS: ComponentItem[] = [
  // 1. 비주얼 & 프로필
  {
    type: 'character-image',
    name: '캐릭터 이미지',
    category: '비주얼 & 프로필',
    description: '일러스트 삽입 및 자르기/프레임',
    icon: ImageIcon,
  },
  {
    type: 'name-badge',
    name: '이름 & 칭호',
    category: '비주얼 & 프로필',
    description: '본명, 칭호, 코드네임 복수 필드',
    icon: UserCheck,
  },
  {
    type: 'quote-card',
    name: '대표 대사',
    category: '비주얼 & 프로필',
    description: '캐릭터 명대사 및 말풍선/상황',
    icon: Quote,
  },

  // 2. 정보 & 서술
  {
    type: 'info-card',
    name: '공통 정보 카드',
    category: '정보 & 서술',
    description: '기본/상세 정보 (그리드, 표, 리스트)',
    icon: List,
  },
  {
    type: 'narrative-card',
    name: '서술형 상세 카드',
    category: '정보 & 서술',
    description: '성격, 배경, 외형 등 자유 서술',
    icon: FileText,
  },
  {
    type: 'keyword-card',
    name: '키워드 & 태그',
    category: '정보 & 서술',
    description: '성향, 속성, 키워드 칩/표',
    icon: Hash,
  },

  // 3. 수치 & 관계 & 메모
  {
    type: 'radar-chart',
    name: '능력치 레이더 차트',
    category: '수치 & 관계',
    description: '3~8축 다각형 능력치 그래프',
    icon: Activity,
  },
  {
    type: 'relationship-card',
    name: '관계 요약 카드',
    category: '수치 & 관계',
    description: '동료, 라이벌, 조력자 관계 리스트',
    icon: Users,
  },
  {
    type: 'memo-card',
    name: '자유 메모 카드',
    category: '수치 & 관계',
    description: '포스트잇 스타일 작업/설정 노트',
    icon: StickyNote,
  },
];

export const CanvasLibrary: React.FC<CanvasLibraryProps> = ({
  onAddElement,
}) => {
  const categories = Array.from(
    new Set(COMPONENTS.map((item) => item.category))
  );

  return (
    <div className="w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex flex-col shrink-0 overflow-y-auto select-none">
      {/* Library Header */}
      <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-800 dark:text-dark-text tracking-wide">
            컴포넌트 라이브러리
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-dark-textSecondary mt-0.5">
            클릭하여 캔버스에 추가하세요
          </p>
        </div>
        <span className="px-2 py-0.5 bg-lavender-50 dark:bg-lavender-900/40 text-lavender-700 dark:text-lavender-300 text-[10px] font-bold rounded-full">
          9종
        </span>
      </div>

      {/* Component List Grouped by Category */}
      <div className="p-3 flex flex-col gap-4">
        {categories.map((category) => (
          <div key={category} className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-textSecondary px-1.5 tracking-wider uppercase">
              {category}
            </span>
            <div className="flex flex-col gap-1">
              {COMPONENTS.filter((c) => c.category === category).map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onAddElement(item.type)}
                    className="group relative flex items-start gap-2.5 p-2 rounded-xl text-left border border-slate-100 dark:border-dark-border/60 hover:border-lavender-300 dark:hover:border-lavender-600 bg-white dark:bg-dark-elevated hover:bg-lavender-50/50 dark:hover:bg-dark-surface transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-dark-surface border border-slate-200/80 dark:border-dark-border flex items-center justify-center shrink-0 group-hover:bg-lavender-100 dark:group-hover:bg-lavender-900/50 transition-colors">
                      <IconComponent className="w-4 h-4 text-slate-600 dark:text-dark-text group-hover:text-lavender-600 dark:group-hover:text-lavender-400 transition-colors" />
                    </div>

                    <div className="flex-1 min-w-0 pr-5">
                      <div className="text-xs font-semibold text-slate-700 dark:text-dark-text group-hover:text-lavender-700 dark:group-hover:text-lavender-300 truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-dark-textSecondary truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>

                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Quick Guide */}
      <div className="mt-auto p-3 m-3 bg-slate-50 dark:bg-dark-surface border border-slate-200/70 dark:border-dark-border rounded-xl text-[11px] text-slate-500 dark:text-dark-textSecondary leading-relaxed">
        💡 <strong className="text-slate-700 dark:text-dark-text">팁:</strong> 요소를 추가한 후 드래그하여 이동하고 모서리 핸들로 크기를 조절할 수 있습니다.
      </div>
    </div>
  );
};
