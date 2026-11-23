import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Pipette, X } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { EditorHeader } from './EditorHeader';
import { useToast } from '../toast/ToastContext';

const TextColorMark = Mark.create({
  name: 'textColorMark',
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.color || null,
        renderHTML: (attrs) => (attrs.color ? { style: `color: ${attrs.color}` } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="color"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

const BgColorMark = Mark.create({
  name: 'bgColorMark',
  addAttributes() {
    return {
      bgColor: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.backgroundColor || null,
        renderHTML: (attrs) =>
          attrs.bgColor
            ? { style: `background-color: ${attrs.bgColor}; border-radius: 3px; padding: 0 2px;` }
            : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style*="background-color"]' }, { tag: 'mark' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (el) => (el as HTMLElement).style.width || el.getAttribute('width') || '100%',
        renderHTML: (attrs) => ({
          style: `width: ${attrs.width || '100%'}; max-width: 100%; height: auto;`,
        }),
      },
    };
  },
});

const DEFAULT_TEMPLATE_DESC = '서식, 표, 체크리스트, 내부 링크를 지원하는 깔끔한 문서입니다.';

const ICON_PRESETS = ['📄', '📝', '✨', '⚔️', '🏰', '🗺️', '🎮', '🎨', '🎵', '💡', '📌', '🔥'];

export const BlankDocumentEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const {
    activeDocument,
    activePage,
    documents,
    openDocument,
    openTemplateEditor,
    updateDocument,
    updatePage,
    getDocumentPath,
    getBacklinksForDocument,
    getDocumentStatus,
    restoreItems,
    pendingSearchHighlight,
    setPendingSearchHighlight,
  } = useWorkspace();
  const { showToast } = useToast();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [compactTitleVisible, setCompactTitleVisible] = useState(false);
  const [searchPulseActive, setSearchPulseActive] = useState(false);
  const [, setSelectionTick] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const titleBlockRef = useRef<HTMLDivElement | null>(null);

  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [colorPopover, setColorPopover] = useState<'text' | 'bg' | null>(null);
  const [pickedColor, setPickedColor] = useState('#6A5ACD');
  const [recentColors, setRecentColors] = useState<string[]>(['#6A5ACD', '#FEF08A']);
  const [eyedropper, setEyedropper] = useState<{
    mode: 'text' | 'bg';
    x: number;
    y: number;
    color: string;
  } | null>(null);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkTab, setLinkTab] = useState<'internal' | 'external'>('internal');
  const [linkText, setLinkText] = useState('');
  const [linkSearch, setLinkSearch] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [tableMenu, setTableMenu] = useState<{ x: number; y: number } | null>(null);
  const [tableGridOpen, setTableGridOpen] = useState(false);
  const [tableRowsInput, setTableRowsInput] = useState(3);
  const [tableColsInput, setTableColsInput] = useState(3);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [deletedLinkPopover, setDeletedLinkPopover] = useState<{
    docId: string;
    title: string;
    status: 'trashed' | 'deleted';
    x: number;
    y: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const activePageIdRef = useRef<string | undefined>(activePage?.id);
  activePageIdRef.current = activePage?.id;

  const editor = useEditor({
    editable: isEditMode,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      TextColorMark,
      BgColorMark,
      Placeholder.configure({ placeholder: '여기에 문서 내용을 작성하세요...' }),
      Link.configure({
        openOnClick: false,
      }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
        onReadOnlyChecked: () => true,
      }),
    ],
    content: activePage?.content || '<p></p>',
    onUpdate: ({ editor: ed }) => {
      const pageId = activePageIdRef.current;
      if (pageId) {
        updatePage(pageId, { content: ed.getHTML() });
      }
      setSelectionTick((t) => t + 1);
    },
    onSelectionUpdate: () => {
      setSelectionTick((t) => t + 1);
    },
    onTransaction: () => {
      setSelectionTick((t) => t + 1);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditMode);
    }
  }, [editor, isEditMode]);

  useEffect(() => {
    if (editor && activePage) {
      const currentHtml = editor.getHTML();
      if (activePage.content && activePage.content !== currentHtml) {
        editor.commands.setContent(activePage.content, { emitUpdate: false });
      }
    }
  }, [activePage?.id, editor]);

  useEffect(() => {
    if (!pendingSearchHighlight) return;
    const query = pendingSearchHighlight.toLowerCase();
    const timer = window.setTimeout(() => {
      const container = scrollAreaRef.current;
      if (container) {
        const blocks = Array.from(
          container.querySelectorAll('h1, h2, h3, p, li, td, th, span')
        ) as HTMLElement[];
        const target = blocks.find((el) => (el.textContent || '').toLowerCase().includes(query));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('bs-search-pulse');
          window.setTimeout(() => target.classList.remove('bs-search-pulse'), 1250);
        } else {
          setSearchPulseActive(true);
          window.setTimeout(() => setSearchPulseActive(false), 1250);
        }
      }
      setPendingSearchHighlight(null);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [pendingSearchHighlight, setPendingSearchHighlight]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHeadingMenuOpen(false);
        setColorPopover(null);
        setLinkPopoverOpen(false);
        setTableMenu(null);
        setTableGridOpen(false);
        setDeletedLinkPopover(null);
        setEyedropper(null);
        setIconPickerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLinkClick = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) {
      setDeletedLinkPopover(null);
      return;
    }
    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('#blankspace-doc:')) {
      e.preventDefault();
      const targetId = href.replace('#blankspace-doc:', '').split(':')[0];
      const status = getDocumentStatus(targetId);
      if (status === 'active') {
        openDocument(targetId);
      } else {
        const targetDoc = documents.find((d) => d.id === targetId);
        const rect = anchor.getBoundingClientRect();
        setDeletedLinkPopover({
          docId: targetId,
          title: targetDoc?.title || anchor.textContent || '문서',
          status,
          x: rect.left,
          y: rect.bottom + 6,
        });
      }
    } else if (href && !isEditMode) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTableContextMenu = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    const cell = (e.target as HTMLElement).closest('td, th');
    if (cell) {
      e.preventDefault();
      setTableMenu({ x: e.clientX, y: e.clientY });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        editor.chain().focus().setImage({ src: reader.result }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  const applyHighlightOrText = (color: string, explicitMode?: 'text' | 'bg') => {
    if (!editor) return;
    const mode = explicitMode || colorPopover;
    setRecentColors((prev) => [color, ...prev.filter((c) => c !== color)].slice(0, 6));
    if (mode === 'bg') {
      editor.chain().focus().setMark('bgColorMark', { bgColor: color }).run();
    } else {
      editor.chain().focus().setMark('textColorMark', { color }).run();
    }
    setColorPopover(null);
  };

  const applyBlockAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!editor) return;
    editor.chain().focus().run();
    document.execCommand(
      align === 'left'
        ? 'justifyLeft'
        : align === 'center'
          ? 'justifyCenter'
          : align === 'right'
            ? 'justifyRight'
            : 'justifyFull'
    );
  };

  const samplePointColor = (x: number, y: number): string => {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      if ((el as HTMLElement).dataset?.eyedropperOverlay) continue;
      const bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const hex = (n: string) => Number(n).toString(16).padStart(2, '0');
          return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`.toUpperCase();
        }
      }
    }
    return '#6A5ACD';
  };

  const backlinks = activeDocument ? getBacklinksForDocument(activeDocument.id) : [];
  const isInsideTable = Boolean(editor?.isActive('table'));
  const isImageSelected = Boolean(editor?.isActive('image'));
  const currentHeadingLabel = editor?.isActive('heading', { level: 1 })
    ? '제목 1'
    : editor?.isActive('heading', { level: 2 })
      ? '제목 2'
      : editor?.isActive('heading', { level: 3 })
        ? '제목 3'
        : '본문';

  const cleanDescription =
    activeDocument?.description === DEFAULT_TEMPLATE_DESC
      ? ''
      : activeDocument?.description || '';

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#FAF9FE] dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '빈 문서 (템플릿)' : activeDocument?.title || '빈 문서'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="general-blank"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
        compactTitleVisible={compactTitleVisible}
      />

      {/* Formatting Toolbar in Edit Mode */}
      {isEditMode && editor && (
        <div
          data-export-ignore="true"
          className="relative px-4 py-2 border-b border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] flex flex-wrap items-center gap-1 select-none z-20"
        >
          {/* Block Type Dropdown */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setHeadingMenuOpen((p) => !p)}
              className="h-7 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium flex items-center gap-1"
            >
              <span>{currentHeadingLabel}</span>
              <span>▾</span>
            </button>
            {headingMenuOpen && (
              <div className="absolute left-0 mt-1 w-32 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-xl p-1 z-30">
                {[
                  { label: '본문', action: () => editor.chain().focus().setParagraph().run() },
                  {
                    label: '제목 1',
                    action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                  },
                  {
                    label: '제목 2',
                    action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  },
                  {
                    label: '제목 3',
                    action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                  },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      opt.action();
                      setHeadingMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-7 h-7 rounded-lg text-xs font-bold ${
              editor.isActive('bold')
                ? 'bg-[#6A5ACD] text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-7 h-7 rounded-lg text-xs italic font-serif ${
              editor.isActive('italic')
                ? 'bg-[#6A5ACD] text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`w-7 h-7 rounded-lg text-xs underline ${
              editor.isActive('underline')
                ? 'bg-[#6A5ACD] text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            U
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-7 h-7 rounded-lg text-xs line-through ${
              editor.isActive('strike')
                ? 'bg-[#6A5ACD] text-white'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            S
          </button>

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          {/* Text Color & Background Color Popover */}
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setColorPopover((p) => (p === 'text' ? null : 'text'))}
              className={`w-7 h-7 rounded-lg text-xs font-bold underline decoration-[#6A5ACD] decoration-2 ${
                editor.isActive('textColorMark')
                  ? 'bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD]'
                  : 'hover:bg-black/5'
              }`}
              title="글자색"
            >
              A
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setColorPopover((p) => (p === 'bg' ? null : 'bg'))}
              className={`w-7 h-7 rounded-lg text-xs font-bold bg-[#FFF099] text-[#1B1B1F] ${
                editor.isActive('bgColorMark') ? 'ring-2 ring-[#6A5ACD]' : ''
              }`}
              title="배경색"
            >
              A
            </button>

            {colorPopover && (
              <div className="bs-animate-popover absolute left-0 top-9 w-64 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-4 z-40 flex flex-col gap-3">
                <div className="text-xs font-bold">{colorPopover === 'text' ? '글자색' : '배경색'}</div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (colorPopover === 'bg') {
                        editor.chain().focus().unsetMark('bgColorMark').run();
                      } else {
                        editor.chain().focus().unsetMark('textColorMark').run();
                      }
                      setColorPopover(null);
                    }}
                    className="px-3 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                  >
                    색 없음
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      const mode = colorPopover;
                      setColorPopover(null);
                      setEyedropper({
                        mode,
                        x: e.clientX,
                        y: e.clientY,
                        color: pickedColor,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#6A5ACD] inline-flex items-center gap-1 hover:bg-[#F3F1FB]"
                  >
                    <Pipette className="w-3 h-3" />
                    스포이드
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['#1B1B1F', '#6A5ACD', '#E11D48', '#D97706', '#059669', '#2563EB'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyHighlightOrText(c)}
                      className="w-6 h-6 rounded-md border border-black/10"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div>
                  <div className="text-[10.5px] text-[#8A8998] mb-1">최근 사용한 색</div>
                  <div className="flex gap-1.5">
                    {recentColors.map((rc) => (
                      <button
                        key={rc}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyHighlightOrText(rc)}
                        className="w-5 h-5 rounded border border-black/10"
                        style={{ backgroundColor: rc }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className="w-8 h-8 rounded-lg border border-black/15 dark:border-white/15 shrink-0"
                    style={{ backgroundColor: pickedColor }}
                  />
                  <input
                    type="text"
                    value={pickedColor}
                    onChange={(e) => setPickedColor(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-mono"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHighlightOrText(pickedColor)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#6A5ACD] text-white text-xs font-semibold"
                  >
                    적용
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          {[
            { icon: AlignLeft, align: 'left' as const },
            { icon: AlignCenter, align: 'center' as const },
            { icon: AlignRight, align: 'right' as const },
            { icon: AlignJustify, align: 'justify' as const },
          ].map((item, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyBlockAlignment(item.align)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5"
            >
              <item.icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-7 h-7 rounded-lg text-xs ${
              editor.isActive('bulletList') ? 'bg-[#6A5ACD] text-white' : 'hover:bg-black/5'
            }`}
          >
            •
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-7 h-7 rounded-lg text-xs ${
              editor.isActive('orderedList') ? 'bg-[#6A5ACD] text-white' : 'hover:bg-black/5'
            }`}
          >
            1.
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`w-7 h-7 rounded-lg text-xs ${
              editor.isActive('taskList') ? 'bg-[#6A5ACD] text-white' : 'hover:bg-black/5'
            }`}
          >
            ☐
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-7 h-7 rounded-lg text-xs ${
              editor.isActive('blockquote') ? 'bg-[#6A5ACD] text-white' : 'hover:bg-black/5'
            }`}
          >
            “
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="w-7 h-7 rounded-lg text-xs hover:bg-black/5"
          >
            —
          </button>

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          {/* Link Popover */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setLinkPopoverOpen((p) => !p)}
              className="h-7 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium hover:border-[#6A5ACD]"
            >
              링크
            </button>

            {linkPopoverOpen && (
              <div className="absolute right-0 top-9 w-80 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-4 z-40 flex flex-col gap-3">
                <div className="grid grid-cols-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5">
                  <button
                    type="button"
                    onClick={() => setLinkTab('internal')}
                    className={`py-1 rounded-[9px] text-xs font-semibold ${
                      linkTab === 'internal' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                    }`}
                  >
                    내부 문서
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkTab('external')}
                    className={`py-1 rounded-[9px] text-xs font-semibold ${
                      linkTab === 'external' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                    }`}
                  >
                    외부 주소
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6D7A] mb-1">
                    표시할 글자
                  </label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="링크 버튼에 보일 글자"
                    className="w-full h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                  />
                </div>

                {linkTab === 'internal' ? (
                  <>
                    <input
                      type="text"
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="문서 이름 검색"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                    />
                    <div className="max-h-40 overflow-y-auto divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
                      {documents
                        .filter(
                          (d) =>
                            !d.deletedAt &&
                            d.id !== activeDocument?.id &&
                            (!linkSearch.trim() ||
                              d.title.toLowerCase().includes(linkSearch.toLowerCase()))
                        )
                        .map((doc) => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              const label = linkText.trim() || doc.title;
                              editor
                                .chain()
                                .focus()
                                .insertContent(
                                  `<a href="#blankspace-doc:${doc.id}">🔗 ${label}</a> `
                                )
                                .run();
                              setLinkPopoverOpen(false);
                              setLinkText('');
                            }}
                            className="w-full py-2 px-1.5 flex items-center gap-2 text-left hover:bg-[#FAF9FE] dark:hover:bg-[#262436] rounded-lg"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-[#EBE8F5] text-[#6A5ACD] text-[10px] font-semibold shrink-0">
                              문서
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate">{doc.title}</div>
                              <div className="text-[10.5px] text-[#8A8998] truncate">
                                {getDocumentPath(doc)}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setLinkPopoverOpen(false)}
                        className="px-3 py-1.5 rounded-lg border border-[#E6E3F0] text-xs"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!externalUrl.trim()) return;
                          const label = linkText.trim() || externalUrl.trim();
                          editor
                            .chain()
                            .focus()
                            .insertContent(
                              `<a href="${externalUrl.trim()}" target="_blank" rel="noopener noreferrer">🔗 ${label}</a> `
                            )
                            .run();
                          setLinkPopoverOpen(false);
                          setExternalUrl('');
                          setLinkText('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#6A5ACD] text-white text-xs font-semibold"
                      >
                        적용
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium hover:border-[#6A5ACD]"
          >
            이미지
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Image Size Controls when an image is selected */}
          {isImageSelected && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F3F1FB] dark:bg-[#2C2845] text-[11px]">
              <span className="text-[#6A5ACD] font-semibold">이미지 크기:</span>
              {['25%', '50%', '75%', '100%'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().updateAttributes('image', { width: w }).run()}
                  className="px-1.5 py-0.5 rounded hover:bg-[#6A5ACD] hover:text-white font-semibold"
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {/* Table Insertion / Modification Popover (Number inputs + prevent nested table inside table) */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTableGridOpen((p) => !p)}
              className={`h-7 px-2.5 rounded-lg border text-xs font-medium ${
                isInsideTable
                  ? 'border-[#6A5ACD] bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD]'
                  : 'border-[#E6E3F0] dark:border-[#323244] hover:border-[#6A5ACD]'
              }`}
            >
              {isInsideTable ? '표 편집 ▾' : '표 ▾'}
            </button>

            {tableGridOpen && (
              <div className="bs-animate-popover absolute right-0 top-9 w-56 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-3.5 z-40 flex flex-col gap-2.5 text-xs">
                {isInsideTable ? (
                  <>
                    <div className="text-[11px] font-bold text-[#6A5ACD]">
                      현재 표 편집 (표 내부 중첩 삽입 불가)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().addRowAfter().run()}
                        className="py-1.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] hover:border-[#6A5ACD]"
                      >
                        + 아래 행 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().deleteRow().run()}
                        className="py-1.5 rounded-lg border border-rose-200 text-rose-500"
                      >
                        - 현재 행 삭제
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().addColumnAfter().run()}
                        className="py-1.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] hover:border-[#6A5ACD]"
                      >
                        + 오른쪽 열 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().deleteColumn().run()}
                        className="py-1.5 rounded-lg border border-rose-200 text-rose-500"
                      >
                        - 현재 열 삭제
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        editor.chain().focus().deleteTable().run();
                        setTableGridOpen(false);
                      }}
                      className="w-full py-1.5 rounded-lg bg-rose-500 text-white font-semibold"
                    >
                      표 전체 삭제
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-bold">표 크기 입력</div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-[#8A8998]">행 (세로)</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={tableRowsInput}
                          onChange={(e) =>
                            setTableRowsInput(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                          }
                          className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-[#8A8998]">열 (가로)</span>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={tableColsInput}
                          onChange={(e) =>
                            setTableColsInput(Math.max(1, Math.min(12, Number(e.target.value) || 1)))
                          }
                          className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        editor
                          .chain()
                          .focus()
                          .insertTable({
                            rows: tableRowsInput,
                            cols: tableColsInput,
                            withHeaderRow: true,
                          })
                          .run();
                        setTableGridOpen(false);
                      }}
                      className="w-full py-2 rounded-xl bg-[#6A5ACD] text-white font-semibold"
                    >
                      {tableRowsInput} × {tableColsInput} 표 삽입
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Centered Document Sheet */}
      <div
        ref={scrollAreaRef}
        onScroll={(e) => {
          const st = (e.currentTarget as HTMLDivElement).scrollTop;
          setCompactTitleVisible(st > 140);
        }}
        className="flex-1 overflow-y-auto py-8 px-6"
        onClick={() => setTableMenu(null)}
      >
        <div
          data-export-root="true"
          className={`max-w-[780px] mx-auto rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] overflow-hidden shadow-2xs ${
            searchPulseActive ? 'bs-search-pulse' : ''
          }`}
        >
          {/* Pastel Cover Strip or Uploaded Cover Banner */}
          {activeDocument?.coverImage ? (
            <div className="h-32 w-full overflow-hidden">
              <img
                src={activeDocument.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-24 bg-[#DCD7F3] dark:bg-[#2F2B4E]" />
          )}

          <div ref={titleBlockRef} className="px-10 pb-10">
            {/* Icon badge overlapping cover: clickable in Edit Mode to pick emoji or upload image */}
            <div className="relative -mt-7 mb-4 inline-block">
              <button
                type="button"
                onClick={() => isEditMode && setIconPickerOpen((p) => !p)}
                className={`w-14 h-14 rounded-2xl bg-[#F3F1FB] dark:bg-[#2C2845] border-4 border-white dark:border-[#1E1E29] flex items-center justify-center text-xl font-bold text-[#6A5ACD] dark:text-[#9A8FE6] shadow-xs overflow-hidden ${
                  isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-[#6A5ACD]' : 'cursor-default'
                }`}
              >
                {activeDocument?.icon?.startsWith('data:') ? (
                  <img src={activeDocument.icon} alt="아이콘" className="w-full h-full object-cover" />
                ) : (
                  <span>{activeDocument?.icon || '📄'}</span>
                )}
              </button>

              {isEditMode && iconPickerOpen && activeDocument && (
                <div className="bs-animate-popover absolute left-0 top-16 z-30 w-60 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-3 flex flex-col gap-2.5 text-xs">
                  <div className="font-bold">아이콘 변경</div>
                  <div className="grid grid-cols-6 gap-1">
                    {ICON_PRESETS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => {
                          updateDocument(activeDocument.id, { icon: ic });
                          setIconPickerOpen(false);
                        }}
                        className="h-8 rounded-lg hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845] text-base flex items-center justify-center"
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => iconFileRef.current?.click()}
                    className="py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] font-semibold text-[#6A5ACD]"
                  >
                    이미지 아이콘 업로드
                  </button>
                  <input
                    ref={iconFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => {
                        if (typeof r.result === 'string') {
                          updateDocument(activeDocument.id, { icon: r.result });
                          setIconPickerOpen(false);
                        }
                      };
                      r.readAsDataURL(f);
                    }}
                  />
                </div>
              )}
            </div>

            {isEditMode && activeDocument ? (
              <input
                type="text"
                value={activeDocument.title}
                onChange={(e) => updateDocument(activeDocument.id, { title: e.target.value })}
                className="w-full text-[26px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] bg-transparent focus:outline-none"
              />
            ) : (
              <h2 className="text-[26px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                {activeDocument?.title || '문서 제목'}
              </h2>
            )}

            {/* Description: never show template default description text */}
            {isEditMode && activeDocument ? (
              <input
                type="text"
                value={cleanDescription}
                onChange={(e) => updateDocument(activeDocument.id, { description: e.target.value })}
                placeholder="문서 설명을 입력하세요 (선택)"
                className="mt-1 w-full text-xs text-[#8A8998] bg-transparent focus:outline-none"
              />
            ) : (
              cleanDescription && <p className="mt-1 text-xs text-[#8A8998]">{cleanDescription}</p>
            )}

            {/* Tags: editable in Edit Mode */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {(activeDocument?.tags || []).map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3F1FB] dark:bg-[#2C2845] text-[11px] font-medium text-[#6A5ACD] dark:text-[#9A8FE6]"
                >
                  {t}
                  {isEditMode && activeDocument && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDocument(activeDocument.id, {
                          tags: (activeDocument.tags || []).filter((_, idx) => idx !== i),
                        })
                      }
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}

              {isEditMode && activeDocument && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newTagInput.trim()) return;
                    updateDocument(activeDocument.id, {
                      tags: [...(activeDocument.tags || []), newTagInput.trim()],
                    });
                    setNewTagInput('');
                  }}
                  className="inline-flex items-center gap-1"
                >
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="+ 태그 입력 후 Enter"
                    className="h-6 px-2.5 rounded-full border border-dashed border-[#B6ACEA] bg-transparent text-[11px] w-32 focus:outline-none"
                  />
                </form>
              )}
            </div>

            <div
              className="mt-6 [&_img]:bs-animate-fade [&_img]:rounded-xl"
              onClick={handleLinkClick}
              onContextMenu={handleTableContextMenu}
            >
              <EditorContent editor={editor} />
            </div>

            {/* Backlinks in View Mode */}
            {!isEditMode && backlinks.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#F0EEF7] dark:border-[#2A2938]">
                <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6] mb-2.5">
                  역링크 ({backlinks.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {backlinks.map((bl) => (
                    <button
                      key={bl.sourceDoc.id}
                      type="button"
                      onClick={() => bl.status === 'active' && openDocument(bl.sourceDoc.id)}
                      className="px-3 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs flex items-center gap-2 hover:border-[#6A5ACD]"
                    >
                      <span className="text-[#6A5ACD] font-semibold">문서</span>
                      <span className={bl.status === 'trashed' ? 'line-through text-[#8A8998]' : ''}>
                        {bl.sourceDoc.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Context Menu */}
      {tableMenu && editor && (
        <div
          style={{ left: tableMenu.x, top: tableMenu.y }}
          className="bs-animate-popover fixed z-50 w-40 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-1 text-xs"
        >
          {[
            { label: '위에 행 추가', fn: () => editor.chain().focus().addRowBefore().run() },
            { label: '아래에 행 추가', fn: () => editor.chain().focus().addRowAfter().run() },
            { label: '행 삭제', fn: () => editor.chain().focus().deleteRow().run() },
            { label: '왼쪽에 열 추가', fn: () => editor.chain().focus().addColumnBefore().run() },
            { label: '오른쪽에 열 추가', fn: () => editor.chain().focus().addColumnAfter().run() },
            { label: '열 삭제', fn: () => editor.chain().focus().deleteColumn().run() },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.fn();
                setTableMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Deleted / Trashed Document Link Popover */}
      {deletedLinkPopover && (
        <div
          style={{ left: deletedLinkPopover.x, top: deletedLinkPopover.y }}
          className="bs-animate-popover fixed z-[90] w-64 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#1E1E29] shadow-2xl p-3 flex flex-col gap-2 text-xs"
        >
          <div className="font-bold text-[#1B1B1F] dark:text-white truncate">
            {deletedLinkPopover.title}
          </div>
          <div className="text-[11px] text-rose-500">
            {deletedLinkPopover.status === 'trashed'
              ? '삭제된 문서입니다 (휴지통에 있음)'
              : '영구 삭제된 문서입니다'}
          </div>
          <div className="flex items-center gap-2">
            {deletedLinkPopover.status === 'trashed' && (
              <button
                type="button"
                onClick={() => {
                  const id = deletedLinkPopover.docId;
                  const title = deletedLinkPopover.title;
                  restoreItems([{ type: 'document', id }]);
                  showToast(`'${title}' 문서를 휴지통에서 복원했습니다`);
                  setDeletedLinkPopover(null);
                  openDocument(id);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#6A5ACD] text-white text-[11px] font-semibold"
              >
                휴지통에서 복원
              </button>
            )}
            <button
              type="button"
              onClick={() => setDeletedLinkPopover(null)}
              className="px-2.5 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-[11px] text-[#8A8998]"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Text / Highlight Eyedropper Overlay via Portal */}
      {eyedropper &&
        createPortal(
          <div
            data-eyedropper-overlay="true"
            onMouseMove={(e) => {
              const c = samplePointColor(e.clientX, e.clientY);
              setEyedropper((prev) =>
                prev ? { ...prev, x: e.clientX, y: e.clientY, color: c } : null
              );
            }}
            onClick={() => {
              const c = samplePointColor(eyedropper.x, eyedropper.y);
              setPickedColor(c);
              applyHighlightOrText(c, eyedropper.mode);
              setEyedropper(null);
            }}
            className="fixed inset-0 z-[9999] cursor-crosshair"
          >
            <div
              style={{
                left:
                  eyedropper.x + 110 > window.innerWidth
                    ? eyedropper.x - 102
                    : eyedropper.x + 5,
                top:
                  eyedropper.y + 110 > window.innerHeight
                    ? eyedropper.y - 102
                    : eyedropper.y + 5,
              }}
              className="bs-animate-fade fixed w-24 h-24 rounded-full border-4 border-white shadow-2xl pointer-events-none flex flex-col items-center justify-end pb-2 overflow-hidden"
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: eyedropper.color,
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              />
              <div className="relative z-10 w-3.5 h-3.5 border-2 border-white shadow-xs rounded-xs mb-3" />
              <span className="relative z-10 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                {eyedropper.color}
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
