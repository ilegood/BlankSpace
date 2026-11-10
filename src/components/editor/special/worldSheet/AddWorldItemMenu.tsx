import React, { useRef, useEffect } from 'react';
import {
  ListPlus,
  Tag,
  FileText,
  StickyNote,
  MapPin,
  Image as ImageIcon,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { WorldSheetItemType } from '../../../../types/worldSheet';

interface AddWorldItemMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItemType: (type: WorldSheetItemType) => void;
}

export const AddWorldItemMenu: React.FC<AddWorldItemMenuProps> = ({
  isOpen,
  onClose,
  onSelectItemType,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-2xl shadow-xl z-30 p-2 text-xs overflow-hidden animate-in fade-in zoom-in-95"
    >
      {/* Group 1: 기본 카드 유형 */}
      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase tracking-wider">
        기본 카드 유형
      </div>
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onSelectItemType('detail-card');
            onClose();
          }}
          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-lavender-50 dark:bg-[#352E58] text-lavender-600 dark:text-lavender-300 shrink-0">
            <ListPlus className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">세부사항 카드</div>
            <div className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              장르, 시대, 문명 수준 등 속성-값 쌍 목록
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectItemType('category-card');
            onClose();
          }}
          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 shrink-0">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">카테고리 카드</div>
            <div className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              주요 종족, 마법 체계, 핵심 세력 태그 칩
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectItemType('narrative-card');
            onClose();
          }}
          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">서술형 카드</div>
            <div className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              세계관 개요, 창조 신화 등 장문 텍스트 서술
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectItemType('memo-card');
            onClose();
          }}
          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 shrink-0">
            <StickyNote className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">메모 카드</div>
            <div className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              기획 아이디어, 설정 보완용 메모 노트
            </div>
          </div>
        </button>
      </div>

      <div className="my-1.5 border-t border-slate-100 dark:border-[#3A3948]" />

      {/* Group 2: 세계관 전용 확장 항목 */}
      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-[#A5A3B5] uppercase tracking-wider">
        세계관 특화 항목
      </div>
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => {
            onSelectItemType('location-intro');
            onClose();
          }}
          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">지역 소개</div>
            <div className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              대표 지역/명소 간략 소개 및 전용 문서 링크
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectItemType('image-gallery');
            onClose();
          }}
          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 shrink-0">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">이미지 / 레퍼런스</div>
            <div className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              풍경, 건축 양식, 색감 등 시각적 갤러리 관리
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onSelectItemType('linked-documents');
            onClose();
          }}
          className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] transition-colors"
        >
          <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 shrink-0">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold">관련 문서 연결</div>
            <div className="text-[10.5px] text-slate-400 dark:text-[#A5A3B5] mt-0.5">
              지역·세력, 연대기, 용어사전 문서 바로가기
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
