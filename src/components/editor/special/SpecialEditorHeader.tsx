import React, { useState, useEffect } from 'react';
import { ChevronLeft, Save, Star, Download } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { TEMPLATES } from '../../../templates/templateList';

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
    }
  };

  const handleBack = () => {
    onBeforeBack?.();
    setActiveDocument(null);
  };

  return (
    <div className="h-14 px-6 border-b border-[#ECEEF3] flex items-center justify-between shrink-0 bg-white shadow-xs select-none">
      {/* Left: Back button + Title input + Template Badge */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
          <span>목록으로</span>
        </button>

        <div className="h-4 w-px bg-slate-200 shrink-0" />

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
          className="text-[15px] font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-none transition-colors px-1 py-0.5 truncate max-w-md !bg-white"
        />

        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 text-lavender-700 shrink-0">
          {template?.name || '특수 편집기'}
        </span>
      </div>

      {/* Center/Right extra controls if any */}
      {extraControls && <div className="flex items-center gap-2 mr-4">{extraControls}</div>}

      {/* Right: Autosave status & Favorite */}
      <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5 text-[11.5px]">
          <Save
            className={`w-3.5 h-3.5 ${
              saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : 'text-slate-400'
            }`}
          />
          <span className={saveStatus === 'saving' ? 'text-amber-600 font-medium' : 'text-slate-400'}>
            {saveStatus === 'saving' ? '저장 중...' : '자동 저장됨'}
          </span>
        </div>

        <span className="text-slate-200">|</span>

        {/* Export Image Button */}
        {onExportImage && (
          <>
            <button
              onClick={async () => {
                try {
                  setIsExporting(true);
                  await onExportImage();
                } catch (err) {
                  alert('이미지 내보내기 중 오류가 발생했습니다.');
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isExporting}
              title="편집 결과 이미지로 저장 (PNG)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-lavender-700 hover:bg-lavender-50 hover:border-lavender-200 transition-colors text-xs font-medium"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400'}`} />
              <span>{isExporting ? '저장 중...' : '이미지 저장'}</span>
            </button>
            <span className="text-slate-200">|</span>
          </>
        )}

        <button
          onClick={() => toggleFavoriteDocument(activeDocument.id)}
          title="즐겨찾기 토글"
          className={`p-1.5 rounded-lg border transition-colors ${
            activeDocument.isFavorite
              ? 'border-lavender-200 bg-lavender-50 text-lavender-600'
              : 'border-slate-200 text-slate-400 hover:text-slate-600'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${activeDocument.isFavorite ? 'fill-lavender-600' : ''}`} />
        </button>
      </div>
    </div>
  );
};

