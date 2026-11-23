import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Pipette } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { EditorHeader } from './EditorHeader';
import { useToast } from '../toast/ToastContext';

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
  } = useWorkspace();
  const { showToast } = useToast();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);

  // Popovers & Menus matching PDF Pages 54, 56, 57
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
  const [tableHover, setTableHover] = useState<{ r: number; c: number }>({ r: 3, c: 3 });
  const [deletedLinkPopover, setDeletedLinkPopover] = useState<{
    docId: string;
    title: string;
    status: 'trashed' | 'deleted';
    x: number;
    y: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    editable: isEditMode,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Placeholder.configure({ placeholder: '여기에 문서 내용을 작성하세요...' }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: activePage?.content || '<p></p>',
    onUpdate: ({ editor: ed }) => {
      if (activePage && isEditMode) {
        updatePage(activePage.id, { content: ed.getHTML() });
      }
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
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHeadingMenuOpen(false);
        setColorPopover(null);
        setLinkPopoverOpen(false);
        setTableMenu(null);
        setTableGridOpen(false);
        setDeletedLinkPopover(null);
        setEyedropper(null);
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
      document.execCommand('hiliteColor', false, color);
    } else {
      document.execCommand('foreColor', false, color);
    }
    setColorPopover(null);
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
      />

      {/* Formatting Toolbar in Edit Mode matching PDF Pages 49, 54, 56 */}
      {isEditMode && editor && (
        <div className="relative px-4 py-2 border-b border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] flex flex-wrap items-center gap-1 select-none z-20">
          {/* Block Type Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHeadingMenuOpen((p) => !p)}
              className="h-7 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium flex items-center gap-1"
            >
              <span>본문</span>
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
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`w-7 h-7 rounded-lg text-xs font-bold ${
              editor.isActive('bold') ? 'bg-[#EBE8F5] text-[#6A5ACD]' : 'hover:bg-black/5'
            }`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`w-7 h-7 rounded-lg text-xs italic font-serif ${
              editor.isActive('italic') ? 'bg-[#EBE8F5] text-[#6A5ACD]' : 'hover:bg-black/5'
            }`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('underline')}
            className="w-7 h-7 rounded-lg text-xs underline hover:bg-black/5"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-7 h-7 rounded-lg text-xs line-through ${
              editor.isActive('strike') ? 'bg-[#EBE8F5] text-[#6A5ACD]' : 'hover:bg-black/5'
            }`}
          >
            S
          </button>

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          {/* Text Color & Background Color Popover matching PDF Page 56 */}
          <div className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => setColorPopover((p) => (p === 'text' ? null : 'text'))}
              className="w-7 h-7 rounded-lg text-xs font-bold underline decoration-[#6A5ACD] decoration-2 hover:bg-black/5"
              title="글자색"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setColorPopover((p) => (p === 'bg' ? null : 'bg'))}
              className="w-7 h-7 rounded-lg text-xs font-bold bg-[#FFF099] text-[#1B1B1F]"
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
                    onClick={() => {
                      document.execCommand('removeFormat');
                      setColorPopover(null);
                    }}
                    className="px-3 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                  >
                    색 없음
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const mode = colorPopover;
                      setColorPopover(null);
                      setEyedropper({
                        mode,
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2,
                        color: pickedColor,
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#6A5ACD] inline-flex items-center gap-1 hover:bg-[#F3F1FB]"
                  >
                    <Pipette className="w-3 h-3" />
                    스포이트
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['#1B1B1F', '#6A5ACD', '#E11D48', '#D97706', '#059669', '#2563EB'].map((c) => (
                    <button
                      key={c}
                      type="button"
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
                        onClick={() => applyHighlightOrText(rc)}
                        className="w-5 h-5 rounded border border-black/10"
                        style={{ backgroundColor: rc }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={pickedColor}
                    onChange={(e) => setPickedColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={pickedColor}
                    onChange={(e) => setPickedColor(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-mono"
                  />
                  <button
                    type="button"
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
            { icon: AlignLeft, cmd: () => document.execCommand('justifyLeft') },
            { icon: AlignCenter, cmd: () => document.execCommand('justifyCenter') },
            { icon: AlignRight, cmd: () => document.execCommand('justifyRight') },
            { icon: AlignJustify, cmd: () => document.execCommand('justifyFull') },
          ].map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={item.cmd}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5"
            >
              <item.icon className="w-3.5 h-3.5" />
            </button>
          ))}

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="w-7 h-7 rounded-lg text-xs hover:bg-black/5"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="w-7 h-7 rounded-lg text-xs hover:bg-black/5"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className="w-7 h-7 rounded-lg text-xs hover:bg-black/5"
          >
            ☐
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="w-7 h-7 rounded-lg text-xs hover:bg-black/5"
          >
            “
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="w-7 h-7 rounded-lg text-xs hover:bg-black/5"
          >
            —
          </button>

          <span className="w-px h-4 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-1" />

          {/* Link Popover matching PDF Page 54 */}
          <div className="relative">
            <button
              type="button"
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
                    placeholder="링크에 보일 글자"
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
                            d.id !== activeDocument?.id &&
                            (!linkSearch.trim() ||
                              d.title.toLowerCase().includes(linkSearch.toLowerCase()))
                        )
                        .map((doc) => {
                          const isTrashed = Boolean(doc.deletedAt);
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => {
                                const label = linkText.trim() || doc.title;
                                editor
                                  .chain()
                                  .focus()
                                  .insertContent(
                                    `<a href="#blankspace-doc:${doc.id}">${label}</a> `
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
                                <div
                                  className={`text-xs font-semibold truncate ${
                                    isTrashed ? 'line-through text-[#8A8998]' : ''
                                  }`}
                                >
                                  {doc.title} {isTrashed && '(휴지통)'}
                                </div>
                                <div className="text-[10.5px] text-[#8A8998] truncate">
                                  {getDocumentPath(doc)}
                                </div>
                              </div>
                            </button>
                          );
                        })}
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
                              `<a href="${externalUrl.trim()}" target="_blank" rel="noopener noreferrer">${label}</a> `
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

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setTableHover({ r: 3, c: 3 });
                setTableGridOpen((p) => !p);
              }}
              className="h-7 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium hover:border-[#6A5ACD]"
            >
              표 ▾
            </button>

            {tableGridOpen && (
              <div className="bs-animate-popover absolute right-0 top-9 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-3 z-40 flex flex-col gap-2">
                <div className="text-[11px] font-bold text-[#6A5ACD] text-center">
                  {tableHover.r} × {tableHover.c} 표 삽입
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 8 }).map((_, ri) =>
                    Array.from({ length: 8 }).map((__, ci) => {
                      const active = ri + 1 <= tableHover.r && ci + 1 <= tableHover.c;
                      return (
                        <button
                          key={`${ri}-${ci}`}
                          type="button"
                          onMouseEnter={() => setTableHover({ r: ri + 1, c: ci + 1 })}
                          onClick={() => {
                            editor
                              .chain()
                              .focus()
                              .insertTable({ rows: ri + 1, cols: ci + 1, withHeaderRow: true })
                              .run();
                            setTableGridOpen(false);
                          }}
                          className={`w-4 h-4 rounded-xs border transition-colors ${
                            active
                              ? 'bg-[#6A5ACD] border-[#6A5ACD]'
                              : 'bg-[#FAF9FE] dark:bg-[#262436] border-[#E6E3F0] dark:border-[#323244]'
                          }`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Centered Document Sheet matching PDF Page 49 */}
      <div
        className="flex-1 overflow-y-auto py-8 px-6"
        onClick={() => setTableMenu(null)}
      >
        <div className="max-w-[780px] mx-auto rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] overflow-hidden shadow-2xs">
          {/* Pastel Cover Strip */}
          <div className="h-24 bg-[#DCD7F3] dark:bg-[#2F2B4E]" />

          <div className="px-10 pb-10">
            {/* Icon badge overlapping cover */}
            <div className="-mt-7 mb-4 w-14 h-14 rounded-2xl bg-[#F3F1FB] dark:bg-[#2C2845] border-4 border-white dark:border-[#1E1E29] flex items-center justify-center text-xs font-bold text-[#6A5ACD] dark:text-[#9A8FE6] shadow-xs">
              아이콘
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

            <p className="mt-1 text-xs text-[#8A8998]">
              {activeDocument?.description || '문서 설명'}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(activeDocument?.tags?.length ? activeDocument.tags : ['태그']).map((t, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-full bg-[#F3F1FB] dark:bg-[#2C2845] text-[11px] font-medium text-[#6A5ACD] dark:text-[#9A8FE6]"
                >
                  {t}
                </span>
              ))}
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

      {/* Table Context Menu matching PDF Page 57 */}
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

      {/* Deleted / Trashed Document Link Popover (§6-12) */}
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

      {/* Text / Highlight Eyedropper Overlay */}
      {eyedropper && (
        <div
          data-eyedropper-overlay="true"
          onMouseMove={(e) => {
            const c = samplePointColor(e.clientX, e.clientY);
            setEyedropper((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY, color: c } : null));
          }}
          onClick={() => {
            const c = samplePointColor(eyedropper.x, eyedropper.y);
            setPickedColor(c);
            applyHighlightOrText(c, eyedropper.mode);
            setEyedropper(null);
          }}
          className="fixed inset-0 z-[200] cursor-crosshair"
        >
          <div
            style={{ left: eyedropper.x + 18, top: eyedropper.y + 18 }}
            className="fixed w-24 h-24 rounded-full border-4 border-white shadow-2xl pointer-events-none flex flex-col items-center justify-end pb-2 overflow-hidden"
          >
            <div className="absolute inset-0" style={{ backgroundColor: eyedropper.color }} />
            <span className="relative z-10 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
              {eyedropper.color}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
