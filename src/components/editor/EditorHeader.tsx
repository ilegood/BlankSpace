import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Play, RotateCcw, ImageDown } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { DesignPresetItem } from '../../types';
import { useToast } from '../toast/ToastContext';
import { exportElementAsPng } from '../../utils/exportImage';
import { ModalShell } from '../modals/ModalShell';

interface EditorHeaderProps {
  title: string;
  onTitleChange?: (newTitle: string) => void;
  templateType: string;
  isEditMode: boolean;
  onChangeMode: (edit: boolean) => void;
  onExit: () => void;
  isTemplateMode?: boolean;
  onResetTemplate?: () => void;
  onPreviewClick?: () => void;
  exportTargetRef?: React.RefObject<HTMLElement | null>;
  supportsDesignPreset?: boolean;
  builtinPresets?: DesignPresetItem[];
  activePresetId?: string;
  onApplyPreset?: (preset: DesignPresetItem) => void;
  onSavePreset?: (name: string) => void;
  onResetPreset?: () => void;
  compactTitleVisible?: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title,
  onTitleChange,
  templateType,
  isEditMode,
  onChangeMode,
  onExit,
  isTemplateMode = false,
  onResetTemplate,
  onPreviewClick,
  exportTargetRef,
  supportsDesignPreset = false,
  builtinPresets = [],
  activePresetId = 'default',
  onApplyPreset,
  onSavePreset,
  onResetPreset,
  compactTitleVisible,
}) => {
  const {
    saveStatus,
    retryLastSave,
    canGoBackDoc,
    goBackDocument,
    designPresets,
    renameDesignPreset,
    duplicateDesignPreset,
    deleteDesignPreset,
  } = useWorkspace();
  const { showToast } = useToast();

  const headerRootRef = useRef<HTMLDivElement>(null);
  const [localTitle, setLocalTitle] = useState(title);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [savePresetModalOpen, setSavePresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [exportingImage, setExportingImage] = useState(false);

  const handleExportPng = async () => {
    if (exportingImage) return;
    let target: HTMLElement | null = exportTargetRef?.current || null;
    if (!target && headerRootRef.current?.parentElement) {
      target = headerRootRef.current.parentElement.querySelector('[data-export-root="true"]');
    }
    if (!target) {
      let sib = headerRootRef.current?.nextElementSibling as HTMLElement | null;
      while (sib && sib.dataset?.exportIgnore === 'true') {
        sib = sib.nextElementSibling as HTMLElement | null;
      }
      target = sib;
    }
    if (!target) {
      showToast('내보낼 화면 영역을 찾지 못했습니다', { variant: 'error' });
      return;
    }
    try {
      setExportingImage(true);
      await exportElementAsPng(target, { fileName: title || tpl?.name || 'blankspace' });
      showToast(`'${title || '문서'}'을 이미지(PNG)로 저장했습니다`);
    } catch {
      showToast('이미지 저장 중 오류가 발생했습니다', { variant: 'error' });
    } finally {
      setExportingImage(false);
    }
  };

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    if (!presetMenuOpen && !savePresetModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (savePresetModalOpen) setSavePresetModalOpen(false);
        else if (presetMenuOpen) setPresetMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [presetMenuOpen, savePresetModalOpen]);

  const tpl = TEMPLATES.find((t) => t.id === templateType);

  const customPresets = designPresets.filter((p) => p.templateType === templateType);
  const allPresets = [...builtinPresets, ...customPresets];
  const currentPreset = allPresets.find((p) => p.id === activePresetId) || builtinPresets[0];

  return (
    <div ref={headerRootRef} className="shrink-0 select-none">
      {/* Top Bar matching PDF Pages 8, 9, 14, 33, 64 */}
      <div className="h-[54px] px-4 border-b border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#15151C] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1 rounded-full border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium text-[#4E4D59] dark:text-[#B4B2C4] hover:border-[#6A5ACD] transition-colors shrink-0"
          >
            ‹ 나가기
          </button>

          {canGoBackDoc && !isTemplateMode && (
            <button
              type="button"
              onClick={goBackDocument}
              title="이전 문서로 돌아가기"
              className="px-2.5 py-1 rounded-full bg-[#F5F3FA] dark:bg-[#232231] border border-[#E6E3F0] dark:border-[#323244] text-[11px] font-medium text-[#6A5ACD] dark:text-[#A99DF0] hover:border-[#6A5ACD] transition-colors shrink-0"
            >
              ← 이전 문서
            </button>
          )}

          {isEditMode && onTitleChange && !isTemplateMode ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                if (localTitle.trim() && localTitle.trim() !== title) {
                  onTitleChange(localTitle.trim());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className={`text-[15px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] bg-transparent border-b border-transparent focus:border-[#6A5ACD] focus:outline-none px-1 min-w-[120px] max-w-[300px] truncate transition-all duration-150 ${
                compactTitleVisible === false
                  ? 'opacity-0 -translate-y-1 pointer-events-none'
                  : 'opacity-100 translate-y-0'
              }`}
            />
          ) : (
            <h1
              className={`text-[15px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate transition-all duration-150 ${
                compactTitleVisible === false
                  ? 'opacity-0 -translate-y-1 pointer-events-none'
                  : 'opacity-100 translate-y-0'
              }`}
            >
              {title}
              {isTemplateMode && !title.includes('(템플릿)') ? ' (템플릿)' : ''}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onPreviewClick && (
            <button
              type="button"
              onClick={onPreviewClick}
              className="h-8 px-3.5 rounded-xl bg-[#4E3FB5] hover:bg-[#4133A0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              미리보기
            </button>
          )}

          <button
            type="button"
            disabled={exportingImage}
            onClick={handleExportPng}
            title="현재 템플릿을 PNG 이미지로 저장"
            className="h-8 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] hover:border-[#6A5ACD] disabled:opacity-50 text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] flex items-center gap-1.5 transition-colors"
          >
            <ImageDown className="w-3.5 h-3.5 text-[#6A5ACD] dark:text-[#9A8FE6]" />
            <span>{exportingImage ? '저장 중…' : '이미지 저장'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-1.5">
            {saveStatus === 'saving' ? (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#6E6D7A] dark:text-[#A8A6BA]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6A5ACD] animate-pulse" />
                저장 중…
              </span>
            ) : saveStatus === 'error' ? (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-rose-600 dark:text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                저장 실패
                <button
                  type="button"
                  onClick={() => retryLastSave()}
                  className="ml-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-[10.5px] font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-100"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  다시 시도
                </button>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                저장됨
              </span>
            )}
          </div>

          {/* Design Preset Dropdown matching PDF Page 14 */}
          {supportsDesignPreset && isEditMode && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPresetMenuOpen((p) => !p)}
                className="h-8 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6] flex items-center gap-1.5 hover:border-[#B6ACEA]"
              >
                <span>디자인 프리셋: {currentPreset?.name || '기본'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8A8998]" />
              </button>

              {presetMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPresetMenuOpen(false)} />
                  <div className="bs-animate-popover absolute right-0 mt-2 w-72 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-3 z-50 flex flex-col gap-2">
                    <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6] px-1.5 pb-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
                      {tpl?.name || '문서'} 프리셋
                    </div>

                    <div className="text-[10.5px] font-semibold text-[#8A8998] px-1.5 pt-1">
                      기본 제공
                    </div>
                    {builtinPresets.map((p) => {
                      const active = p.id === activePresetId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onApplyPreset?.(p);
                            setPresetMenuOpen(false);
                            showToast(`디자인 프리셋 '${p.name}'을 적용했습니다`);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-colors ${
                            active
                              ? 'bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] font-semibold'
                              : 'text-[#1B1B1F] dark:text-[#F1F0F6] hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {active && <span>✓</span>}
                            <span>{p.name}</span>
                          </div>
                          {active && (
                            <div className="text-[10.5px] font-normal text-[#6A5ACD]/80 dark:text-[#9A8FE6]/80 mt-0.5 pl-4">
                              복제해서 내 프리셋으로 사용
                            </div>
                          )}
                        </button>
                      );
                    })}

                    <div className="text-[10.5px] font-semibold text-[#8A8998] px-1.5 pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938]">
                      내 프리셋
                    </div>
                    {customPresets.length === 0 ? (
                      <div className="px-2 py-1.5 text-[11px] text-[#8A8998]">
                        저장된 프리셋이 없습니다.
                      </div>
                    ) : (
                      customPresets.map((cp) => (
                        <div
                          key={cp.id}
                          className="px-2.5 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex flex-col gap-1"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onApplyPreset?.(cp);
                              setPresetMenuOpen(false);
                              showToast(`디자인 프리셋 '${cp.name}'을 적용했습니다`);
                            }}
                            className="text-left text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6]"
                          >
                            {cp.id === activePresetId ? `✓ ${cp.name}` : cp.name}
                          </button>
                          <div className="flex items-center gap-2 text-[10.5px] text-[#6A5ACD] dark:text-[#9A8FE6]">
                            <button
                              type="button"
                              onClick={() => {
                                const next = window.prompt('새 프리셋 이름', cp.name);
                                if (next?.trim()) renameDesignPreset(cp.id, next.trim());
                              }}
                              className="hover:underline"
                            >
                              이름 변경
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => duplicateDesignPreset(cp.id)}
                              className="hover:underline"
                            >
                              복제
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => deleteDesignPreset(cp.id)}
                              className="text-rose-500 hover:underline"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <div className="pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938] flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPresetMenuOpen(false);
                          setNewPresetName('');
                          setSavePresetModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6A5ACD] dark:text-[#9A8FE6] hover:bg-[#EBE8F5]/50"
                      >
                        + 현재 디자인을 프리셋으로 저장
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResetPreset?.();
                          setPresetMenuOpen(false);
                          showToast('기본 디자인 프리셋으로 복원했습니다');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#6E6D7A] dark:text-[#9E9CAF] hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        기본값으로 복원
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* View / Edit Mode Sliding Segmented Toggle (§2-9, §2-11) */}
          <div className="relative inline-grid grid-cols-2 items-center rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] p-0.5">
            <span
              aria-hidden="true"
              style={{
                transform: isEditMode ? 'translateX(100%)' : 'translateX(0%)',
              }}
              className={`pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-[9px] transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                isEditMode ? 'bg-[#6A5ACD]' : 'bg-[#3D328A]'
              }`}
            />
            <button
              type="button"
              onClick={() => onChangeMode(false)}
              className={`relative z-10 px-3 py-1 rounded-[9px] text-xs font-semibold transition-colors duration-200 ${
                !isEditMode
                  ? 'text-white'
                  : 'text-[#6E6D7A] dark:text-[#9E9CAF] hover:text-[#1B1B1F] dark:hover:text-white'
              }`}
            >
              보기
            </button>
            <button
              type="button"
              onClick={() => onChangeMode(true)}
              className={`relative z-10 px-3 py-1 rounded-[9px] text-xs font-semibold transition-colors duration-200 ${
                isEditMode
                  ? 'text-white'
                  : 'text-[#6E6D7A] dark:text-[#9E9CAF] hover:text-[#1B1B1F] dark:hover:text-white'
              }`}
            >
              편집
            </button>
          </div>

          {isEditMode && (
            <button
              type="button"
              onClick={() => onChangeMode(false)}
              className="h-8 px-3.5 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] text-white text-xs font-semibold transition-colors"
            >
              편집 완료
            </button>
          )}
        </div>
      </div>

      {/* Template Edit Banner matching PDF Page 8, 11, 13, 20, 29, 43, 44, 64 */}
      {isTemplateMode && (
        <div className="px-4 py-1.5 bg-[#F3F1FB] dark:bg-[#24213A] border-b border-[#E6E3F0] dark:border-[#332E52] text-[11.5px] text-[#5B4CC4] dark:text-[#B5A9F5] flex items-center gap-2">
          <span>기본 템플릿 편집 중 · 이미 만든 문서에는 영향을 주지 않습니다</span>
          {onResetTemplate && (
            <>
              <span>·</span>
              <button
                type="button"
                onClick={onResetTemplate}
                className="underline font-semibold hover:opacity-80"
              >
                원래 상태로 복원
              </button>
            </>
          )}
        </div>
      )}

      {/* Design Preset Save Modal matching PDF Page 16 */}
      <ModalShell
        isOpen={savePresetModalOpen}
        onClose={() => setSavePresetModalOpen(false)}
        maxWidthClass="max-w-sm"
        zIndexClass="z-[100]"
        className="p-6 flex flex-col gap-4"
      >
        <div>
          <h3 className="text-base font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
            디자인 프리셋으로 저장
          </h3>
          <p className="mt-1 text-xs text-[#8A8998]">
            {tpl?.name || '템플릿'} 프리셋에 추가됩니다.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6E6D7A] dark:text-[#9E9CAF] mb-1.5">
            프리셋 이름
          </label>
          <input
            type="text"
            autoFocus
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPresetName.trim()) {
                onSavePreset?.(newPresetName.trim());
                setSavePresetModalOpen(false);
                showToast(`디자인 프리셋 '${newPresetName.trim()}'을 저장했습니다`);
              }
            }}
            placeholder="프리셋 이름 입력"
            className="w-full h-10 px-3.5 rounded-xl border border-[#6A5ACD] bg-white dark:bg-[#15151C] text-xs text-[#1B1B1F] dark:text-[#F1F0F6] focus:outline-none"
          />
        </div>

        <div className="rounded-xl bg-[#F8F7FC] dark:bg-[#262436] p-3 text-[11px] leading-relaxed text-[#555464] dark:text-[#B4B2C4]">
          <div>
            <strong className="text-[#1B1B1F] dark:text-white">저장됨</strong> 배치 · 크기 · 간격 · 색상 · 배경 · 테두리 · 글꼴 · 이미지 영역
          </div>
          <div className="mt-0.5">
            <strong className="text-[#1B1B1F] dark:text-white">저장 안 됨</strong> 글, 이미지 등 문서 내용
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setSavePresetModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!newPresetName.trim()}
            onClick={() => {
              onSavePreset?.(newPresetName.trim());
              setSavePresetModalOpen(false);
              showToast(`디자인 프리셋 '${newPresetName.trim()}'을 저장했습니다`);
            }}
            className="px-4 py-2 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] disabled:opacity-40 text-white text-xs font-semibold"
          >
            저장
          </button>
        </div>
      </ModalShell>
    </div>
  );
};
