import React, { useState, useEffect } from 'react';
import {
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Palette,
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Plus,
  Minus,
  MoveUp,
  MoveDown,
  Upload,
  Bookmark,
  Sparkles,
  Layout,
  Layers,
  Settings2,
  Check,
  Grid,
} from 'lucide-react';
import {
  CanvasDocumentData,
  CanvasElement,
  CanvasElementType,
  CustomCharacterTemplate,
  InfoCardItem,
  NameField,
  RadarAxis,
  RelationshipItem,
} from '../../../types/canvas';
import {
  BUILTIN_TEMPLATES,
  DEFAULT_CHARACTER_CANVAS,
  MODERN_PROFILE_CANVAS,
  MINIMAL_VISUAL_CANVAS,
} from './defaultPresets';
import { useToast } from '../../toast/ToastContext';
import { NumberInput } from './NumberInput';

interface CanvasInspectorProps {
  selectedElement: CanvasElement | null;
  canvasData: CanvasDocumentData;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onUpdateCanvas: (updates: Partial<CanvasDocumentData>) => void;
  onLoadCanvasData: (data: CanvasDocumentData) => void;
}

const TEMPLATE_STORAGE_KEY = 'blankspace_custom_character_templates';

export const CanvasInspector: React.FC<CanvasInspectorProps> = ({
  selectedElement,
  canvasData,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
  onUpdateCanvas,
  onLoadCanvasData,
}) => {
  const { toast, customPrompt, customConfirm } = useToast();
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
  const [globalTab, setGlobalTab] = useState<'canvas' | 'templates'>('canvas');
  const [customTemplates, setCustomTemplates] = useState<CustomCharacterTemplate[]>([]);

  // Load custom templates from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (raw) {
        setCustomTemplates(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load custom templates', e);
    }
  }, []);

  // Save current layout as custom template
  const handleSaveAsTemplate = async () => {
    const templateName = await customPrompt({
      title: '템플릿으로 저장',
      message: '현재 캔버스 레이아웃과 구성 요소를 저장할 템플릿 이름을 입력하세요.',
      defaultValue: '내 캐릭터 시트 템플릿',
      placeholder: '템플릿 이름...',
      confirmText: '저장',
    });

    if (!templateName || !templateName.trim()) return;

    const newTemplate: CustomCharacterTemplate = {
      id: `tmpl-${Date.now()}`,
      name: templateName.trim(),
      createdAt: Date.now(),
      canvasData: JSON.parse(JSON.stringify(canvasData)),
    };

    const nextList = [newTemplate, ...customTemplates];
    setCustomTemplates(nextList);
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(nextList));
      toast.success('템플릿이 성공적으로 저장되었습니다.');
    } catch {
      toast.error('템플릿 저장 용량이 초과되었습니다.');
    }
  };

  // Delete custom template
  const handleDeleteTemplate = async (id: string, name: string) => {
    const confirmed = await customConfirm({
      title: '템플릿 삭제',
      message: `'${name}' 템플릿을 정말 삭제하시겠습니까?`,
      isDanger: true,
      confirmText: '삭제',
    });

    if (!confirmed) return;

    const nextList = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(nextList);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(nextList));
    toast.info('템플릿이 삭제되었습니다.');
  };

  // Load custom or builtin template
  const handleApplyTemplate = async (targetCanvas: CanvasDocumentData, name: string) => {
    const confirmed = await customConfirm({
      title: '템플릿 불러오기',
      message: `'${name}' 템플릿을 적용하시겠습니까? 현재 작성 중인 내용이 템플릿으로 변경됩니다.`,
      confirmText: '적용',
    });

    if (!confirmed) return;

    onLoadCanvasData(JSON.parse(JSON.stringify(targetCanvas)));
    toast.success(`'${name}' 템플릿이 적용되었습니다.`);
  };

  // Handle image upload from file
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedElement || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateElement(selectedElement.id, {
        content: {
          ...selectedElement.content,
          imageUrl: dataUrl,
        },
      });
      toast.success('이미지가 성공적으로 적용되었습니다.');
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // 1. If NO element is selected -> Canvas Settings & Templates
  // ==========================================
  if (!selectedElement) {
    return (
      <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full">
        {/* Global Inspector Header Tabs */}
        <div className="h-11 border-b border-slate-200 dark:border-[#3A3948] flex items-center px-3 bg-slate-50 dark:bg-[#292936]">
          <button
            type="button"
            onClick={() => setGlobalTab('canvas')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              globalTab === 'canvas'
                ? 'bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] shadow-2xs'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-lavender-600" />
            <span>캔버스 설정</span>
          </button>
          <button
            type="button"
            onClick={() => setGlobalTab('templates')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              globalTab === 'templates'
                ? 'bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] shadow-2xs'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-lavender-600" />
            <span>템플릿 & 프리셋</span>
          </button>
        </div>

        {/* Global Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-xs">
          {globalTab === 'canvas' ? (
            <>
              {/* Canvas Size */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                  캔버스 크기
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 dark:text-[#A5A3B5]">너비 (px)</span>
                    <NumberInput
                      value={canvasData.canvasWidth}
                      step={20}
                      min={600}
                      max={3000}
                      onChange={(val) => onUpdateCanvas({ canvasWidth: val })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 dark:text-[#A5A3B5]">높이 (px)</span>
                    <NumberInput
                      value={canvasData.canvasHeight}
                      step={20}
                      min={400}
                      max={4000}
                      onChange={(val) => onUpdateCanvas({ canvasHeight: val })}
                    />
                  </div>
                </div>
              </div>

              {/* Background Color & Gradient */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                  배경 색상
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={canvasData.backgroundColor || '#FFFFFF'}
                    onChange={(e) =>
                      onUpdateCanvas({ backgroundColor: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-[#3A3948] shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={canvasData.backgroundColor || '#FFFFFF'}
                    onChange={(e) =>
                      onUpdateCanvas({ backgroundColor: e.target.value })
                    }
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg font-mono text-slate-800 dark:text-[#E8E7EF] text-xs"
                  />
                </div>

                {/* Preset Canvas Backgrounds */}
                <div className="flex items-center gap-1.5 mt-1">
                  {['#FFFFFF', '#FAFBFD', '#F8FAFC', '#F3F4F6', '#22222C', '#17171D'].map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => onUpdateCanvas({ backgroundColor: bg })}
                      title={bg}
                      style={{ backgroundColor: bg }}
                      className={`w-6 h-6 rounded-md border transition-transform ${
                        canvasData.backgroundColor === bg
                          ? 'ring-2 ring-lavender-500 scale-110'
                          : 'border-slate-300 dark:border-[#3A3948]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Background Pattern */}
              <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-[#3A3948]">
                <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                  배경 패턴
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['none', 'dots', 'grid'] as const).map((patternType) => (
                    <button
                      key={patternType}
                      type="button"
                      onClick={() =>
                        onUpdateCanvas({
                          pattern: {
                            type: patternType,
                            color: canvasData.pattern?.color || '#94A3B8',
                            size: canvasData.pattern?.size || 1,
                            gap: canvasData.pattern?.gap || 20,
                          },
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                        (canvasData.pattern?.type || 'none') === patternType
                          ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300'
                          : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                      }`}
                    >
                      {patternType === 'none' ? '없음' : patternType === 'dots' ? '도트 (점)' : '격자 (모눈)'}
                    </button>
                  ))}
                </div>

                {canvasData.pattern?.type && canvasData.pattern.type !== 'none' && (
                  <div className="flex flex-col gap-2 mt-1 p-2.5 bg-slate-50 dark:bg-[#292936] rounded-xl border border-slate-200/80 dark:border-[#3A3948]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">패턴 색상</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={canvasData.pattern.color}
                          onChange={(e) =>
                            onUpdateCanvas({
                              pattern: {
                                ...canvasData.pattern!,
                                color: e.target.value,
                              },
                            })
                          }
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-[10px] text-slate-500 dark:text-[#A5A3B5]">
                          {canvasData.pattern.color}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">패턴 간격</span>
                      <div className="flex items-center gap-1">
                        {[16, 20, 24, 32].map((gap) => (
                          <button
                            key={gap}
                            type="button"
                            onClick={() =>
                              onUpdateCanvas({
                                pattern: {
                                  ...canvasData.pattern!,
                                  gap,
                                },
                              })
                            }
                            className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                              canvasData.pattern?.gap === gap
                                ? 'bg-lavender-500 text-white font-bold'
                                : 'bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                            }`}
                          >
                            {gap}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Template Save Banner */}
              <div className="mt-4 p-3.5 bg-lavender-50/70 dark:bg-lavender-900/20 border border-lavender-200/80 dark:border-lavender-800/40 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-lavender-800 dark:text-lavender-300 font-bold text-xs">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>현재 시트를 템플릿으로 저장</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-[#A5A3B5] leading-relaxed">
                  구성한 레이아웃과 카드 디자인을 저장해두고 언제든 다른 캐릭터 시트에 재사용할 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  className="mt-1 w-full py-2 bg-lavender-600 hover:bg-lavender-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>템플릿으로 저장</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Builtin Presets */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                    추천 기본 프리셋 3종
                  </span>
                  <span className="text-[10px] text-lavender-600 font-medium">원클릭 적용</span>
                </div>

                <div className="flex flex-col gap-2">
                  {BUILTIN_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="p-3 bg-slate-50 dark:bg-[#292936] rounded-xl border border-slate-200/80 dark:border-[#3A3948] flex flex-col gap-1.5 hover:border-lavender-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-[#E8E7EF] text-xs">
                          {tmpl.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tmpl.canvasData, tmpl.name)}
                          className="px-2.5 py-1 bg-lavender-600 hover:bg-lavender-700 text-white font-semibold rounded-lg text-[10px] transition-colors"
                        >
                          적용하기
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#A5A3B5]">
                        {tmpl.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Templates */}
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-[#3A3948]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                    내가 저장한 템플릿 ({customTemplates.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    className="text-[11px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>추가</span>
                  </button>
                </div>

                {customTemplates.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-[#292936] border border-dashed border-slate-200 dark:border-[#3A3948] rounded-xl text-center text-[11px] text-slate-400 dark:text-[#A5A3B5]">
                    저장된 커스텀 템플릿이 없습니다.<br />현재 레이아웃을 템플릿으로 저장해보세요.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                    {customTemplates.map((ct) => (
                      <div
                        key={ct.id}
                        className="p-2.5 bg-slate-50 dark:bg-[#292936] rounded-xl border border-slate-200/80 dark:border-[#3A3948] flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 dark:text-[#E8E7EF] text-xs truncate">
                            {ct.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-[#A5A3B5]">
                            요소 {ct.canvasData.elements?.length || 0}개 · {new Date(ct.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplyTemplate(ct.canvasData, ct.name)}
                            className="px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] hover:border-lavender-400 text-slate-700 dark:text-[#E8E7EF] rounded-md text-[10px] font-medium"
                          >
                            적용
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(ct.id, ct.name)}
                            className="p-1 text-rose-400 hover:text-rose-600 rounded"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. If an element IS SELECTED -> Element Inspector
  // ==========================================
  const content = selectedElement.content || {};
  const style = selectedElement.style || {};

  return (
    <div className="w-80 bg-white dark:bg-[#1E1E27] border-l border-slate-200 dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Element Header & Quick Actions */}
      <div className="p-3 border-b border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#292936] flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-lavender-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
            {getElementTypeName(selectedElement.type)}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            title="복제 (Ctrl+D)"
            onClick={() => onDuplicateElement(selectedElement.id)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-dark-text hover:bg-slate-200/60 dark:hover:bg-dark-surface rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="맨 앞으로"
            onClick={() => onBringToFront(selectedElement.id)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-dark-text hover:bg-slate-200/60 dark:hover:bg-dark-surface rounded-lg transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="맨 뒤로"
            onClick={() => onSendToBack(selectedElement.id)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-dark-text hover:bg-slate-200/60 dark:hover:bg-dark-surface rounded-lg transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="삭제 (Del)"
            onClick={() => onDeleteElement(selectedElement.id)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs: Content vs Style */}
      <div className="h-10 border-b border-slate-200 dark:border-[#3A3948] flex items-center px-3 bg-white dark:bg-[#1E1E27]">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'content'
              ? 'bg-lavender-50 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300'
              : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800'
          }`}
        >
          내용 편집
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'style'
              ? 'bg-lavender-50 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300'
              : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800'
          }`}
        >
          디자인 & 스타일
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 text-xs">
        {activeTab === 'content' ? (
          /* ================= CONTENT TAB ================= */
          <div className="flex flex-col gap-4">
            {/* 1. Character Image */}
            {(selectedElement.type === 'character-image' || selectedElement.type === 'image') && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    이미지 URL
                  </span>
                  <input
                    type="text"
                    value={content.imageUrl || ''}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, imageUrl: e.target.value },
                      })
                    }
                    placeholder="https://..."
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                  />
                </div>

                {/* Local File Upload Button */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    또는 내 컴퓨터에서 파일 올리기
                  </span>
                  <label className="flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-lavender-300 dark:border-lavender-700 bg-lavender-50/50 dark:bg-lavender-900/20 text-lavender-700 dark:text-lavender-300 rounded-xl cursor-pointer hover:bg-lavender-100/50 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">이미지 파일 선택</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Image Fit */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    이미지 비율 및 채우기
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['cover', 'contain', 'fill'] as const).map((fit) => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            style: { ...style, objectFit: fit },
                          })
                        }
                        className={`py-1 rounded-lg border text-[11px] font-medium capitalize ${
                          (style.objectFit || 'cover') === fit
                            ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/40 text-lavender-700 dark:text-lavender-300 font-bold'
                            : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                        }`}
                      >
                        {fit === 'cover' ? '자르기(채움)' : fit === 'contain' ? '전체표시' : '늘리기'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Name Badge */}
            {selectedElement.type === 'name-badge' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    이름 및 호칭 필드
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const prevFields = content.nameFields || [];
                      const newField: NameField = {
                        id: `nf-${Date.now()}`,
                        label: '새 항목',
                        value: '내용 입력',
                        fontSize: 14,
                        color: '#64748B',
                      };
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, nameFields: [...prevFields, newField] },
                      });
                    }}
                    className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>필드 추가</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {(content.nameFields || []).map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-2.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          필드 #{idx + 1} {field.isPrimary ? '(대표)' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (content.nameFields || []).filter(
                              (f) => f.id !== field.id
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, nameFields: next },
                            });
                          }}
                          className="text-rose-400 hover:text-rose-600 p-0.5"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={field.label}
                          placeholder="라벨 (예: 칭호)"
                          onChange={(e) => {
                            const next = (content.nameFields || []).map((f) =>
                              f.id === field.id ? { ...f, label: e.target.value } : f
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, nameFields: next },
                            });
                          }}
                          className="px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                        />
                        <input
                          type="text"
                          value={field.value}
                          placeholder="값 (예: 새벽의 기사)"
                          onChange={(e) => {
                            const next = (content.nameFields || []).map((f) =>
                              f.id === field.id ? { ...f, value: e.target.value } : f
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, nameFields: next },
                            });
                          }}
                          className="px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs font-semibold"
                        />
                      </div>

                      {/* Font size & color for this field */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-[#3A3948]">
                        <span className="text-slate-400 dark:text-[#A5A3B5]">크기</span>
                        <NumberInput
                          value={field.fontSize || 14}
                          min={10}
                          max={48}
                          step={1}
                          suffix="px"
                          onChange={(val) => {
                            const next = (content.nameFields || []).map((f) =>
                              f.id === field.id ? { ...f, fontSize: val } : f
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, nameFields: next },
                            });
                          }}
                          className="w-24"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Common Info Card */}
            {selectedElement.type === 'info-card' && (
              <div className="flex flex-col gap-3">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    카드 제목
                  </span>
                  <input
                    type="text"
                    value={content.title || ''}
                    placeholder="예: 기본 프로필 정보"
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, title: e.target.value },
                      })
                    }
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                  />
                </div>

                {/* Display Mode 4 choices */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    표시 레이아웃 모드
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: 'grid-2col', label: '2열 그리드' },
                      { key: 'table', label: '표 (Table)' },
                      { key: 'list-vertical', label: '세로 리스트' },
                      { key: 'list-horizontal', label: '가로 리스트' },
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            content: {
                              ...content,
                              infoDisplayMode: mode.key as any,
                            },
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg border text-center text-xs font-medium ${
                          (content.infoDisplayMode || 'grid-2col') === mode.key
                            ? 'border-lavender-500 bg-lavender-50 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300 font-bold'
                            : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items List */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                      항목 목록 ({(content.infoCardItems || []).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const prev = content.infoCardItems || [];
                        const newItem: InfoCardItem = {
                          id: `it-${Date.now()}`,
                          label: '새 항목',
                          value: '내용 입력',
                        };
                        onUpdateElement(selectedElement.id, {
                          content: { ...content, infoCardItems: [...prev, newItem] },
                        });
                      }}
                      className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>항목 추가</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                    {(content.infoCardItems || []).map((item, index) => (
                      <div
                        key={item.id}
                        className="p-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl flex items-center gap-1.5"
                      >
                        {/* Order buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              const items = [...(content.infoCardItems || [])];
                              const temp = items[index - 1];
                              items[index - 1] = items[index];
                              items[index] = temp;
                              onUpdateElement(selectedElement.id, {
                                content: { ...content, infoCardItems: items },
                              });
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="위로 이동"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === (content.infoCardItems?.length || 0) - 1}
                            onClick={() => {
                              const items = [...(content.infoCardItems || [])];
                              const temp = items[index + 1];
                              items[index + 1] = items[index];
                              items[index] = temp;
                              onUpdateElement(selectedElement.id, {
                                content: { ...content, infoCardItems: items },
                              });
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="아래로 이동"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Label & Value input */}
                        <input
                          type="text"
                          value={item.label}
                          placeholder="항목명"
                          onChange={(e) => {
                            const items = (content.infoCardItems || []).map((it) =>
                              it.id === item.id ? { ...it, label: e.target.value } : it
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, infoCardItems: items },
                            });
                          }}
                          className="w-20 px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-md text-xs"
                        />
                        <input
                          type="text"
                          value={item.value}
                          placeholder="내용"
                          onChange={(e) => {
                            const items = (content.infoCardItems || []).map((it) =>
                              it.id === item.id ? { ...it, value: e.target.value } : it
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, infoCardItems: items },
                            });
                          }}
                          className="flex-1 px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-md text-xs font-semibold"
                        />

                        {/* Delete item */}
                        <button
                          type="button"
                          onClick={() => {
                            const items = (content.infoCardItems || []).filter(
                              (it) => it.id !== item.id
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, infoCardItems: items },
                            });
                          }}
                          className="p-1 text-rose-400 hover:text-rose-600 rounded shrink-0"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Narrative Card */}
            {selectedElement.type === 'narrative-card' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    카드 제목
                  </span>
                  <input
                    type="text"
                    value={content.title || ''}
                    placeholder="예: 성격 및 특징"
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, title: e.target.value },
                      })
                    }
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    서술 텍스트 내용
                  </span>
                  <textarea
                    rows={6}
                    value={content.narrativeText || ''}
                    placeholder="캐릭터의 설정을 입력해주세요."
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, narrativeText: e.target.value },
                      })
                    }
                    className="p-2.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs leading-relaxed resize-none focus:outline-none focus:border-lavender-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    텍스트 정렬
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#292936] p-1 rounded-lg">
                    {[
                      { align: 'left', icon: AlignLeft },
                      { align: 'center', icon: AlignCenter },
                      { align: 'right', icon: AlignRight },
                      { align: 'justify', icon: AlignJustify },
                    ].map(({ align, icon: Icon }) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            style: { ...style, textAlign: align as any },
                          })
                        }
                        className={`p-1.5 rounded ${
                          (style.textAlign || 'left') === align
                            ? 'bg-white dark:bg-[#1E1E27] shadow-2xs text-lavender-600'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. Keyword Card */}
            {selectedElement.type === 'keyword-card' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    카드 제목
                  </span>
                  <input
                    type="text"
                    value={content.title || ''}
                    placeholder="예: 캐릭터 키워드"
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, title: e.target.value },
                      })
                    }
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                  />
                </div>

                {/* Tag List */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                      키워드 태그 ({(content.tags || []).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const prev = content.tags || [];
                        const newTag = {
                          id: `tag-${Date.now()}`,
                          text: '새 키워드',
                        };
                        onUpdateElement(selectedElement.id, {
                          content: { ...content, tags: [...prev, newTag] },
                        });
                      }}
                      className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>태그 추가</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {(content.tags || []).map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-[#292936] rounded-xl border border-slate-200 dark:border-[#3A3948]"
                      >
                        <span className="text-slate-400 text-xs font-bold pl-1">#</span>
                        <input
                          type="text"
                          value={tag.text}
                          onChange={(e) => {
                            const next = (content.tags || []).map((t) =>
                              t.id === tag.id ? { ...t, text: e.target.value } : t
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, tags: next },
                            });
                          }}
                          className="flex-1 px-2 py-0.5 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-md text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = (content.tags || []).filter(
                              (t) => t.id !== tag.id
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, tags: next },
                            });
                          }}
                          className="p-1 text-rose-400 hover:text-rose-600 rounded shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Radar Chart */}
            {selectedElement.type === 'radar-chart' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    차트 제목
                  </span>
                  <input
                    type="text"
                    value={content.title || ''}
                    placeholder="예: 종합 능력치"
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, title: e.target.value },
                      })
                    }
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                  />
                </div>

                {/* Radar Fill Color & Opacity */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    차트 색상
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={content.radarColor || '#8B5CF6'}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, {
                          content: { ...content, radarColor: e.target.value },
                        })
                      }
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-xs">{content.radarColor || '#8B5CF6'}</span>
                  </div>
                </div>

                {/* Axes Configuration (3 to 8 axes) */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                      능력치 축 목록 ({(content.radarAxes || []).length}개)
                    </span>
                    <button
                      type="button"
                      disabled={(content.radarAxes || []).length >= 8}
                      onClick={() => {
                        const axes = content.radarAxes || [];
                        if (axes.length >= 8) return;
                        const newAxis: RadarAxis = {
                          id: `ax-${Date.now()}`,
                          label: '새 능력치',
                          value: 70,
                        };
                        onUpdateElement(selectedElement.id, {
                          content: { ...content, radarAxes: [...axes, newAxis] },
                        });
                      }}
                      className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline disabled:opacity-30"
                    >
                      + 축 추가 (최대 8)
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {(content.radarAxes || []).map((axis) => (
                      <div
                        key={axis.id}
                        className="p-2 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={axis.label}
                            onChange={(e) => {
                              const axes = (content.radarAxes || []).map((a) =>
                                a.id === axis.id ? { ...a, label: e.target.value } : a
                              );
                              onUpdateElement(selectedElement.id, {
                                content: { ...content, radarAxes: axes },
                              });
                            }}
                            className="w-24 px-1.5 py-0.5 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded text-xs font-semibold"
                          />
                          <span className="font-mono text-xs font-bold text-lavender-600">
                            {axis.value} / {content.radarMaxValue || 100}
                          </span>
                          {(content.radarAxes || []).length > 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                const axes = (content.radarAxes || []).filter(
                                  (a) => a.id !== axis.id
                                );
                                onUpdateElement(selectedElement.id, {
                                  content: { ...content, radarAxes: axes },
                                });
                              }}
                              className="text-rose-400 hover:text-rose-600 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={content.radarMaxValue || 100}
                          value={axis.value}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const axes = (content.radarAxes || []).map((a) =>
                              a.id === axis.id ? { ...a, value: val } : a
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, radarAxes: axes },
                            });
                          }}
                          className="w-full accent-lavender-600 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 7. Relationship Card */}
            {selectedElement.type === 'relationship-card' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    카드 제목
                  </span>
                  <input
                    type="text"
                    value={content.title || ''}
                    placeholder="예: 주요 인물 관계도"
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, title: e.target.value },
                      })
                    }
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                      관계 목록 ({(content.relationships || []).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const prev = content.relationships || [];
                        const newItem: RelationshipItem = {
                          id: `rel-${Date.now()}`,
                          name: '인물명',
                          relation: '동료',
                          description: '관계에 대한 설명 입력',
                        };
                        onUpdateElement(selectedElement.id, {
                          content: { ...content, relationships: [...prev, newItem] },
                        });
                      }}
                      className="text-[10px] text-lavender-600 dark:text-lavender-400 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>관계 추가</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {(content.relationships || []).map((rel) => (
                      <div
                        key={rel.id}
                        className="p-2 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <input
                            type="text"
                            value={rel.name}
                            placeholder="인물명"
                            onChange={(e) => {
                              const list = (content.relationships || []).map((r) =>
                                r.id === rel.id ? { ...r, name: e.target.value } : r
                              );
                              onUpdateElement(selectedElement.id, {
                                content: { ...content, relationships: list },
                              });
                            }}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={rel.relation}
                            placeholder="관계(예: 동료)"
                            style={{ color: rel.color || '#8B5CF6' }}
                            onChange={(e) => {
                              const list = (content.relationships || []).map((r) =>
                                r.id === rel.id ? { ...r, relation: e.target.value } : r
                              );
                              onUpdateElement(selectedElement.id, {
                                content: { ...content, relationships: list },
                              });
                            }}
                            className="w-24 px-1.5 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded text-xs font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = (content.relationships || []).filter(
                                (r) => r.id !== rel.id
                              );
                              onUpdateElement(selectedElement.id, {
                                content: { ...content, relationships: list },
                              });
                            }}
                            className="text-rose-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Relationship Badge Color Selector */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>상태 배지 색상</span>
                          <div className="flex items-center gap-1">
                            {[
                              { col: '#8B5CF6', title: '보라' },
                              { col: '#F43F5E', title: '로즈' },
                              { col: '#0284C7', title: '하늘' },
                              { col: '#10B981', title: '초록' },
                              { col: '#F59E0B', title: '앰버' },
                              { col: '#64748B', title: '슬레이트' },
                            ].map((preset) => (
                              <button
                                key={preset.col}
                                type="button"
                                title={preset.title}
                                style={{ backgroundColor: preset.col }}
                                onClick={() => {
                                  const list = (content.relationships || []).map((r) =>
                                    r.id === rel.id ? { ...r, color: preset.col } : r
                                  );
                                  onUpdateElement(selectedElement.id, {
                                    content: { ...content, relationships: list },
                                  });
                                }}
                                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                                  (rel.color || '#8B5CF6') === preset.col
                                    ? 'ring-2 ring-slate-400 scale-125'
                                    : 'opacity-80 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={rel.description}
                          placeholder="한줄 관계 설명"
                          onChange={(e) => {
                            const list = (content.relationships || []).map((r) =>
                              r.id === rel.id ? { ...r, description: e.target.value } : r
                            );
                            onUpdateElement(selectedElement.id, {
                              content: { ...content, relationships: list },
                            });
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded text-xs text-slate-600 dark:text-[#A5A3B5]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. Quote Card */}
            {selectedElement.type === 'quote-card' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    대표 대사 내용
                  </span>
                  <textarea
                    rows={4}
                    value={content.quoteText || ''}
                    placeholder="캐릭터의 대사를 입력해주세요."
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, quoteText: e.target.value },
                      })
                    }
                    className="p-2.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs italic leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    화자 / 발언 상황 캡션
                  </span>
                  <input
                    type="text"
                    value={content.quoteSituation || ''}
                    placeholder="예: 2부 최종결전 중에서"
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, quoteSituation: e.target.value },
                      })
                    }
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* 9. Memo Card */}
            {selectedElement.type === 'memo-card' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    메모 제목
                  </span>
                  <input
                    type="text"
                    value={content.title || ''}
                    placeholder="예: 기획 노트"
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, title: e.target.value },
                      })
                    }
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    메모 본문
                  </span>
                  <textarea
                    rows={5}
                    value={content.memoContent || ''}
                    placeholder="자유롭게 설정이나 메모를 남기세요."
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...content, memoContent: e.target.value },
                      })
                    }
                    className="p-2.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl text-xs leading-relaxed"
                  />
                </div>

                {/* Quick Post-It Color Presets */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-[#A5A3B5]">
                    메모지 색상 테마 (테두리 및 제목 함께 반영)
                  </span>
                  <div className="flex items-center gap-2">
                    {[
                      { bg: '#FEF9C3', border: '#FDE047', name: '노랑' },
                      { bg: '#F3E8FF', border: '#D8B4FE', name: '연보라' },
                      { bg: '#E0F2FE', border: '#7DD3FC', name: '하늘' },
                      { bg: '#DCFCE7', border: '#86EFAC', name: '연초록' },
                      { bg: '#FCE7F3', border: '#F9A8D4', name: '분홍' },
                      { bg: '#292936', border: '#4E4D61', name: '다크' },
                    ].map((theme) => (
                      <button
                        key={theme.bg}
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            style: {
                              ...style,
                              backgroundColor: theme.bg,
                              borderColor: theme.border,
                            },
                          })
                        }
                        title={theme.name}
                        style={{ backgroundColor: theme.bg }}
                        className={`w-6 h-6 rounded-lg border transition-transform ${
                          style.backgroundColor === theme.bg
                            ? 'ring-2 ring-lavender-500 scale-110'
                            : 'border-slate-300 dark:border-[#3A3948]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= STYLE & DESIGN TAB ================= */
          <div className="flex flex-col gap-4">
            {/* Coordinates & Dimensions */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                위치 및 크기
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <NumberInput
                  prefix="X"
                  value={Math.round(selectedElement.x)}
                  step={5}
                  onChange={(val) => onUpdateElement(selectedElement.id, { x: val })}
                />
                <NumberInput
                  prefix="Y"
                  value={Math.round(selectedElement.y)}
                  step={5}
                  onChange={(val) => onUpdateElement(selectedElement.id, { y: val })}
                />
                <NumberInput
                  prefix="W"
                  value={Math.round(selectedElement.width)}
                  step={10}
                  min={100}
                  onChange={(val) => onUpdateElement(selectedElement.id, { width: val })}
                />
                {['name-badge', 'info-card', 'narrative-card', 'keyword-card', 'relationship-card'].includes(
                  selectedElement.type
                ) ? (
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#292936] p-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948]">
                    <span className="text-slate-400 text-[10px] dark:text-[#A5A3B5] font-bold">H</span>
                    <span className="text-[10px] text-lavender-600 dark:text-lavender-400 font-sans font-semibold">
                      자동 조절됨
                    </span>
                  </div>
                ) : (
                  <NumberInput
                    prefix="H"
                    value={Math.round(selectedElement.height)}
                    step={10}
                    min={40}
                    onChange={(val) => onUpdateElement(selectedElement.id, { height: val })}
                  />
                )}
              </div>
            </div>

            {/* Requirement 3: Text Color Option for All Elements */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                  글자 색상 (텍스트)
                </span>
                {style.color && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        style: { ...style, color: undefined },
                      })
                    }
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-dark-text underline"
                  >
                    기본값 복원
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.color || '#1E293B'}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: { ...style, color: e.target.value },
                    })
                  }
                  className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 dark:border-[#3A3948] shrink-0 bg-transparent"
                />
                <input
                  type="text"
                  placeholder="기본 테마 색상"
                  value={style.color || ''}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: { ...style, color: e.target.value },
                    })
                  }
                  className="flex-1 px-2.5 py-1 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg font-mono text-slate-800 dark:text-[#E8E7EF] text-xs"
                />
              </div>

              {/* Text color chips */}
              <div className="flex items-center gap-1.5 mt-0.5">
                {[
                  { col: '#1E293B', title: '다크 블랙' },
                  { col: '#E8E7EF', title: '라이트 화이트' },
                  { col: '#64748B', title: '슬레이트' },
                  { col: '#8B5CF6', title: '라벤더' },
                  { col: '#D97706', title: '앰버' },
                  { col: '#E11D48', title: '로즈' },
                  { col: '#0284C7', title: '스카이' },
                  { col: '#10B981', title: '에메랄드' },
                ].map(({ col, title }) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        style: { ...style, color: col },
                      })
                    }
                    title={title}
                    style={{ backgroundColor: col }}
                    className={`w-5 h-5 rounded-md border transition-transform ${
                      style.color === col
                        ? 'ring-2 ring-lavender-500 scale-110'
                        : 'border-slate-300 dark:border-[#3A3948]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Background Style: Solid vs Gradient vs Transparent */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
              <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                배경 채우기
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : '#FFFFFF'}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: { ...style, backgroundColor: e.target.value, gradient: undefined },
                    })
                  }
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-[#3A3948] shrink-0 bg-transparent"
                />
                <input
                  type="text"
                  value={style.backgroundColor || '#FFFFFF'}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: { ...style, backgroundColor: e.target.value },
                    })
                  }
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg font-mono text-slate-800 dark:text-[#E8E7EF] text-xs"
                />
              </div>

              {/* Color chips */}
              <div className="flex items-center gap-1.5 mt-1">
                {[
                  'transparent',
                  '#FFFFFF',
                  '#FAFBFD',
                  '#F8FAFC',
                  '#EDE9FE',
                  '#FCE7F3',
                  '#292936',
                  '#1E1E27',
                ].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        style: { ...style, backgroundColor: col, gradient: undefined },
                      })
                    }
                    title={col}
                    style={{ backgroundColor: col === 'transparent' ? '#F1F5F9' : col }}
                    className={`w-5 h-5 rounded-md border transition-transform ${
                      style.backgroundColor === col
                        ? 'ring-2 ring-lavender-500 scale-110'
                        : 'border-slate-300 dark:border-[#3A3948]'
                    }`}
                  />
                ))}
              </div>

              {/* Gradient Toggle */}
              <div className="mt-2 p-2.5 bg-slate-50 dark:bg-[#292936] rounded-xl border border-slate-200/80 dark:border-[#3A3948] flex flex-col gap-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-[#E8E7EF]">그라데이션 효과</span>
                  <input
                    type="checkbox"
                    checked={!!style.gradient?.enabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onUpdateElement(selectedElement.id, {
                          style: {
                            ...style,
                            gradient: {
                              enabled: true,
                              startColor: '#FAF5FF',
                              endColor: '#EDE9FE',
                              direction: 'to-b',
                            },
                          },
                        });
                      } else {
                        onUpdateElement(selectedElement.id, {
                          style: { ...style, gradient: undefined },
                        });
                      }
                    }}
                    className="accent-lavender-600 rounded"
                  />
                </label>

                {style.gradient?.enabled && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/60 dark:border-[#3A3948]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">시작 / 끝 색상</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={style.gradient.startColor}
                          onChange={(e) =>
                            onUpdateElement(selectedElement.id, {
                              style: {
                                ...style,
                                gradient: {
                                  ...style.gradient!,
                                  startColor: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-[10px] text-slate-400">→</span>
                        <input
                          type="color"
                          value={style.gradient.endColor}
                          onChange={(e) =>
                            onUpdateElement(selectedElement.id, {
                              style: {
                                ...style,
                                gradient: {
                                  ...style.gradient!,
                                  endColor: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Borders & Radius */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
              <span className="text-[11px] font-bold text-slate-400 dark:text-[#A5A3B5] tracking-wider uppercase">
                테두리 & 둥근 모서리
              </span>

              {/* Border Width */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-[#A5A3B5]">테두리 두께</span>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 4].map((bw) => (
                    <button
                      key={bw}
                      type="button"
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          style: { ...style, borderWidth: bw },
                        })
                      }
                      className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                        (style.borderWidth ?? 1) === bw
                          ? 'bg-lavender-500 text-white font-bold'
                          : 'bg-slate-100 dark:bg-[#292936] text-slate-600 dark:text-[#A5A3B5]'
                      }`}
                    >
                      {bw}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Color */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-[#A5A3B5]">테두리 색상</span>
                <input
                  type="color"
                  value={style.borderColor || '#E2E8F0'}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: { ...style, borderColor: e.target.value },
                    })
                  }
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>

              {/* Border Radius */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-[#A5A3B5]">모서리 곡률</span>
                <div className="flex items-center gap-1">
                  {[0, 8, 16, 24, 999].map((br) => (
                    <button
                      key={br}
                      type="button"
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          style: { ...style, borderRadius: br },
                        })
                      }
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                        (style.borderRadius ?? 16) === br
                          ? 'bg-lavender-500 text-white font-bold'
                          : 'bg-slate-100 dark:bg-[#292936] text-slate-600 dark:text-[#A5A3B5]'
                      }`}
                    >
                      {br === 999 ? '원형' : `${br}px`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Padding */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-[#A5A3B5]">내부 여백</span>
                <div className="flex items-center gap-1">
                  {[8, 12, 16, 20, 24].map((pad) => (
                    <button
                      key={pad}
                      type="button"
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          style: { ...style, padding: pad },
                        })
                      }
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                        (style.padding ?? 16) === pad
                          ? 'bg-lavender-500 text-white font-bold'
                          : 'bg-slate-100 dark:bg-[#292936] text-slate-600 dark:text-[#A5A3B5]'
                      }`}
                    >
                      {pad}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getElementTypeName(type: CanvasElementType): string {
  switch (type) {
    case 'character-image':
      return '캐릭터 이미지';
    case 'name-badge':
      return '이름 & 칭호 배지';
    case 'info-card':
      return '공통 정보 카드';
    case 'narrative-card':
      return '서술형 상세 카드';
    case 'keyword-card':
      return '키워드 & 태그';
    case 'radar-chart':
      return '능력치 레이더 차트';
    case 'relationship-card':
      return '관계 요약 카드';
    case 'quote-card':
      return '대표 대사 카드';
    case 'memo-card':
      return '자유 메모 카드';
    case 'image':
      return '이미지';
    case 'heading':
      return '제목';
    case 'text':
      return '본문 텍스트';
    case 'info-field':
      return '기본 정보';
    case 'status-chart':
      return '스테이터스';
    case 'container':
      return '배경 박스';
    case 'divider':
      return '구분선';
    default:
      return '구성 요소';
  }
}
