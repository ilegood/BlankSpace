import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Star, Download, Sun, Moon } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useTheme } from '../../../store/ThemeContext';
import { TEMPLATES } from '../../../templates/templateList';
import { toast } from '../../toast/ToastContext';

interface SpecialEditorHeaderProps {
  saveStatus: 'saved' | 'saving';
  onBeforeBack?: () => void;
  extraControls?: React.ReactNode;
  onExportImage?: () => Promise<void> | void;
}

export const SpecialEditorHeader: React.FC<SpecialEditorHeaderProps> = ({
  saveStatus,
  onBeforeBack,
  extraControls,
  onExportImage,
}) => {
  const {
    activeDocument,
    setActiveDocument,
    updateDocumentTitle,
    toggleFavoriteDocument,
  } = useWorkspace();

  const { isDark, toggleTheme, theme } = useTheme();

  const [docTitle, setDocTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (activeDocument) {
      setDocTitle(activeDocument.title);
    }
  }, [activeDocument]);

  if (!activeDocument) return null;

  const template = TEMPLATES.find((t) => t.id === activeDocument.templateType);

  const handleTitleBlurOrEnter = () => {
    if (docTitle.trim() && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
      toast.success('제목 변경 완료', `'${docTitle.trim()}'으로 저장되었습니다.`);
    }
  };

  const handleBack = () => {
    onBeforeBack?.();
    setActiveDocument(null);
  };

  return (
    <div className="h-14 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between shrink-0 bg-white dark:bg-[#1E1E27] shadow-xs select-none transition-colors duration-200">
      {/* Left: Back button + Title input + Template Badge */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-medium text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#292936] transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
          <span>목록으로</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

        {/* Document Title (Editable) */}
        <input
          type="text"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          onBlur={handleTitleBlurOrEnter}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="제목 없는 문서"
          className="text-[15px] font-bold text-slate-800 dark:text-[#E8E7EF] border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-lavender-500 focus:outline-none transition-colors px-1 py-0.5 truncate max-w-md bg-white dark:bg-[#1E1E27]"
        />

        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] shrink-0">
          {template?.name || '특수 편집기'}
        </span>
      </div>

      {/* Center/Right extra controls if any */}
      {extraControls && <div className="flex items-center gap-2 mr-4">{extraControls}</div>}

      {/* Right: Autosave status & Theme & Favorite */}
      <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-[#A5A3B5] shrink-0">
        <div className="flex items-center gap-1.5 text-[11.5px]">
          <Save
            className={`w-3.5 h-3.5 ${
              saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : 'text-slate-400 dark:text-[#A5A3B5]'
            }`}
          />
          <span className={saveStatus === 'saving' ? 'text-amber-600 font-medium' : 'text-slate-400 dark:text-[#A5A3B5]'}>
            {saveStatus === 'saving' ? '저장 중...' : '자동 저장됨'}
          </span>
        </div>

        <span className="text-slate-200 dark:text-[#3A3948]">|</span>

        {/* Theme Quick Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`테마 전환 (현재: ${isDark ? '다크' : '라이트'})`}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-500 dark:text-[#A5A3B5] transition-colors"
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-[#A995F5]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </button>

        {/* Export Image Button */}
        {onExportImage && (
          <>
            <button
              onClick={async () => {
                try {
                  setIsExporting(true);
                  await onExportImage();
                  toast.success('이미지 저장 완료', '편집 결과가 PNG 이미지로 저장되었습니다.');
                } catch (err) {
                  toast.error('이미지 저장 실패', '이미지 내보내기 중 오류가 발생했습니다.');
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
              title="편집 결과 이미지로 저장 (PNG)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5] hover:text-lavender-700 dark:hover:text-[#B7A5FF] hover:bg-lavender-50 dark:hover:bg-[#292936] hover:border-lavender-200 transition-colors text-xs font-medium"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400 dark:text-[#A5A3B5]'}`} />
              <span>{isExporting ? '저장 중...' : '이미지 저장'}</span>
            </button>
            <span className="text-slate-200 dark:text-[#3A3948]">|</span>
          </>
        )}

        <button
          onClick={() => toggleFavoriteDocument(activeDocument.id)}
          title="즐겨찾기 토글"
          className={`p-1.5 rounded-lg border transition-colors ${
            activeDocument.isFavorite
              ? 'border-lavender-200 dark:border-[#554884] bg-lavender-50 dark:bg-[#352E58] text-lavender-600 dark:text-[#A995F5]'
              : 'border-slate-200 dark:border-[#3A3948] text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-[#E8E7EF]'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${activeDocument.isFavorite ? 'fill-lavender-600 dark:fill-[#A995F5]' : ''}`} />
        </button>
      </div>
    </div>
  );
};
