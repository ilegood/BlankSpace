import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, AlignLeft, Palette, CheckCircle, Percent, Trash2 } from 'lucide-react';

export interface ScheduleItem {
  id: string;
  groupId: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  progress: number; // 0 to 100
  description?: string;
}

export interface ScheduleGroup {
  id: string;
  title: string;
  color: string;
  isCollapsed?: boolean;
}

interface ScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ScheduleItem | null;
  groups: ScheduleGroup[];
  isEditMode: boolean;
  onSave?: (updated: ScheduleItem) => void;
  onDelete?: (id: string) => void;
}

const COLOR_OPTIONS = [
  { id: 'lavender', label: '라벤더', bg: 'bg-[#8B5CF6]', hex: '#8B5CF6' },
  { id: 'indigo', label: '인디고', bg: 'bg-[#6366F1]', hex: '#6366F1' },
  { id: 'sky', label: '스카이블루', bg: 'bg-[#0EA5E9]', hex: '#0EA5E9' },
  { id: 'mint', label: '에메랄드', bg: 'bg-[#10B981]', hex: '#10B981' },
  { id: 'amber', label: '앰버/오렌지', bg: 'bg-[#F59E0B]', hex: '#F59E0B' },
  { id: 'rose', label: '로즈/핑크', bg: 'bg-[#F43F5E]', hex: '#F43F5E' },
  { id: 'slate', label: '슬레이트', bg: 'bg-[#64748B]', hex: '#64748B' },
];

const STATUS_LABELS: Record<ScheduleItem['status'], { label: string; color: string }> = {
  pending: { label: '대기', color: 'bg-slate-100 text-slate-600 dark:bg-[#2A2938] dark:text-[#A5A3B5]' },
  in_progress: { label: '진행중', color: 'bg-blue-100 text-blue-700 dark:bg-[#1E293B] dark:text-[#93C5FD]' },
  completed: { label: '완료', color: 'bg-emerald-100 text-emerald-700 dark:bg-[#132E27] dark:text-[#6EE7B7]' },
  on_hold: { label: '보류', color: 'bg-amber-100 text-amber-700 dark:bg-[#322416] dark:text-[#FCD34D]' },
};

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  groups,
  isEditMode,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  if (!isOpen || !formData) return null;

  const currentGroup = groups.find((g) => g.id === formData.groupId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1E27] p-6 shadow-2xl border border-slate-200 dark:border-[#3A3948] flex flex-col gap-5 text-slate-800 dark:text-[#E8E7EF] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3A3948]">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: formData.color || '#8B5CF6' }}
            />
            <h3 className="text-base font-bold text-slate-800 dark:text-[#F3F2F8]">
              {isEditMode ? '일정 정보 편집' : '일정 상세 정보'}
            </h3>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                STATUS_LABELS[formData.status].color
              }`}
            >
              {STATUS_LABELS[formData.status].label}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2A2938] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* 1. Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-600 dark:text-[#C5C3D4]">일정명 *</label>
            {isEditMode ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="일정명을 입력하세요"
                required
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50/60 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:border-lavender-500 focus:outline-none text-sm font-semibold"
              />
            ) : (
              <div className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] py-1">
                {formData.title}
              </div>
            )}
          </div>

          {/* 2. Group Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-600 dark:text-[#C5C3D4]">소속 그룹</label>
            {isEditMode ? (
              <select
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50/60 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:border-lavender-500 focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-slate-700 dark:text-[#E8E7EF] font-medium py-1">
                {currentGroup?.title || '기본 그룹'}
              </span>
            )}
          </div>

          {/* 3. Date Range (Start & End) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600 dark:text-[#C5C3D4] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
                <span>시작일 *</span>
              </label>
              {isEditMode ? (
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50/60 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:border-lavender-500 focus:outline-none font-mono"
                />
              ) : (
                <span className="font-mono text-slate-700 dark:text-[#E8E7EF] py-1">
                  {formData.startDate}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600 dark:text-[#C5C3D4] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
                <span>종료일 *</span>
              </label>
              {isEditMode ? (
                <input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50/60 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:border-lavender-500 focus:outline-none font-mono"
                />
              ) : (
                <span className="font-mono text-slate-700 dark:text-[#E8E7EF] py-1">
                  {formData.endDate}
                </span>
              )}
            </div>
          </div>

          {/* 4. Status & Progress */}
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600 dark:text-[#C5C3D4] flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
                <span>진행 상태</span>
              </label>
              {isEditMode ? (
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as ScheduleItem['status'],
                    })
                  }
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50/60 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:border-lavender-500 focus:outline-none"
                >
                  <option value="pending">대기</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="on_hold">보류</option>
                </select>
              ) : (
                <span className="font-semibold text-slate-700 dark:text-[#E8E7EF] py-1">
                  {STATUS_LABELS[formData.status].label}
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-600 dark:text-[#C5C3D4]">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
                  <span>진행률</span>
                </span>
                <span className="font-mono font-bold text-lavender-600 dark:text-[#B7A5FF]">
                  {formData.progress}%
                </span>
              </div>
              {isEditMode ? (
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                  className="w-full accent-lavender-600 cursor-pointer h-2 bg-slate-200 dark:bg-[#3A3948] rounded-lg mt-1.5"
                />
              ) : (
                <div className="w-full bg-slate-100 dark:bg-[#292936] rounded-full h-2.5 overflow-hidden border border-slate-200/60 dark:border-[#3A3948]">
                  <div
                    className="bg-lavender-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${formData.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 5. Color Palette */}
          {isEditMode && (
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-600 dark:text-[#C5C3D4] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
                <span>일정 막대 색상</span>
              </label>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.hex })}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      c.bg
                    } ${
                      formData.color === c.hex
                        ? 'ring-2 ring-offset-2 ring-lavender-600 dark:ring-offset-[#1E1E27] scale-110 shadow-sm'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    title={c.label}
                  >
                    {formData.color === c.hex && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Description / Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-600 dark:text-[#C5C3D4] flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
              <span>상세 메모</span>
            </label>
            {isEditMode ? (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="일정과 관련된 세부 사항이나 주의사항을 적어두세요."
                rows={3}
                className="p-3 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50/60 dark:bg-[#292936] text-slate-800 dark:text-[#F3F2F8] focus:border-lavender-500 focus:outline-none resize-none leading-relaxed"
              />
            ) : (
              <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-[#262634] text-slate-700 dark:text-[#E8E7EF] leading-relaxed min-h-[60px]">
                {formData.description || '등록된 메모가 없습니다.'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#3A3948] flex items-center justify-between">
            {isEditMode && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(formData.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#C5C3D4] hover:bg-slate-50 dark:hover:bg-[#292936] font-semibold text-xs transition-colors"
              >
                {isEditMode ? '취소' : '닫기'}
              </button>
              {isEditMode && (
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  저장
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

