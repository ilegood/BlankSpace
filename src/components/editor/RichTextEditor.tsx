import React, { useEffect, useRef, useState } from 'react';
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
import { InteractiveTaskItem } from './extensions/InteractiveTaskItem';
import { Youtube } from '@tiptap/extension-youtube';
import { VideoExtension, AudioExtension, LinkCardExtension } from './extensions/MediaExtensions';
import { EditorToolbar } from './EditorToolbar';
import { Unlink, ExternalLink, ArrowRight, Bookmark } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: (html: string) => void;
  onNavigateInternalLink?: (docId: string, pageId?: string) => void;
  onEditorReady?: (editor: any) => void;
  placeholder?: string;
  isReadOnly?: boolean;
  preset?: 'modern' | 'minimal' | 'novel' | 'compact';
  showInternalToolbar?: boolean;
}

interface ActiveLinkPopup {
  href: string;
  text: string;
  top: number;
  left: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onBlur,
  onNavigateInternalLink,
  onEditorReady,
  placeholder = '여기에 자유롭게 내용을 작성하세요...',
  isReadOnly = false,
  preset = 'modern',
  showInternalToolbar = false,
}) => {
  const { documents } = useWorkspace();
  const isUpdatingFromProp = useRef(false);
  const [activeLinkPopup, setActiveLinkPopup] = useState<ActiveLinkPopup | null>(null);

  const getEditorFontClass = () => {
    switch (preset) {
      case 'novel':
        return 'font-serif text-[15.5px] leading-[2.1]';
      case 'minimal':
        return 'font-sans text-[14px] leading-relaxed';
      case 'compact':
        return 'font-sans text-[13px] leading-normal';
      case 'modern':
      default:
        return 'font-sans text-[14.5px] leading-relaxed';
    }
  };

  const editor = useEditor({
    editable: !isReadOnly,
    extensions: [
      StarterKit.configure({
        link: false, // StarterKit 내장 link 확장을 비활성화하여 중복 등록 방지
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-lavender-600 underline font-medium cursor-pointer hover:text-lavender-800',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full rounded-xl my-3 shadow-soft border border-slate-200',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      InteractiveTaskItem.configure({
        nested: true,
      }),
      Youtube.configure({
        inline: false,
        HTMLAttributes: {
          class: 'aspect-video w-full max-w-2xl mx-auto rounded-2xl shadow-soft border border-slate-200 my-4 block',
        },
      }),
      VideoExtension,
      AudioExtension,
      LinkCardExtension,
    ],
    content,
    editorProps: {
      attributes: {
        class: `focus:outline-none min-h-[460px] p-6 text-slate-800 dark:text-[#E8E7EF] bg-transparent ${getEditorFontClass()}`,
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href) {
            // View Mode: Instant direct navigation
            if (isReadOnly) {
              if (href.startsWith('#blankspace-doc:')) {
                const parts = href.replace('#blankspace-doc:', '').split(':');
                const targetDocId = parts[0];
                const targetPageId = parts[1];
                if (onNavigateInternalLink) {
                  onNavigateInternalLink(targetDocId, targetPageId);
                }
              } else {
                window.open(href, '_blank', 'noopener,noreferrer');
              }
              return true;
            }

            // Edit Mode: Action Popup
            const rect = anchor.getBoundingClientRect();
            setActiveLinkPopup({
              href,
              text: anchor.innerText || '링크',
              top: rect.bottom + 6,
              left: Math.min(rect.left, window.innerWidth - 240),
            });
            return true;
          }
        } else {
          setActiveLinkPopup(null);
        }
        return false;
      },
    },
    onSelectionUpdate: ({ editor }) => {
      // If cursor is not on a link, hide link popup
      if (!editor.isActive('link')) {
        setActiveLinkPopup(null);
      }
    },
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromProp.current) {
        onChange(editor.getHTML());
      }
    },
    onBlur: ({ editor }) => {
      if (onBlur) {
        onBlur(editor.getHTML());
      }
    },
  });

  // Sync content when page changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      isUpdatingFromProp.current = true;
      editor.commands.setContent(content || '<p></p>');
      isUpdatingFromProp.current = false;
    }
  }, [content, editor]);

  // Sync editable state when mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Expose editor instance to parent (e.g. for fixed top toolbar)
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Handle Unlink from floating popup (Keeps text intact!)
  const handleUnlink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setActiveLinkPopup(null);
  };

  // Handle Go to Target from floating popup
  const handleNavigate = () => {
    if (!activeLinkPopup) return;
    const { href } = activeLinkPopup;
    if (href.startsWith('#blankspace-doc:')) {
      const parts = href.replace('#blankspace-doc:', '').split(':');
      const targetDocId = parts[0];
      const targetPageId = parts[1];
      if (onNavigateInternalLink) {
        onNavigateInternalLink(targetDocId, targetPageId);
      }
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    setActiveLinkPopup(null);
  };

  // Get display name for internal doc
  const getTargetTitle = () => {
    if (!activeLinkPopup) return '';
    if (activeLinkPopup.href.startsWith('#blankspace-doc:')) {
      const docId = activeLinkPopup.href.replace('#blankspace-doc:', '').split(':')[0];
      const targetDoc = documents.find((d) => d.id === docId);
      return targetDoc ? targetDoc.title : '연결된 문서';
    }
    return activeLinkPopup.href;
  };

  return (
    <div className={`flex flex-col flex-1 bg-white dark:bg-[#22222C] border border-[#ECEEF3] dark:border-[#3A3948] rounded-2xl shadow-soft overflow-hidden relative ${isReadOnly ? 'border-transparent shadow-none bg-transparent dark:bg-transparent' : ''}`}>
      {/* Rich Text Toolbar (Shown only if showInternalToolbar is true) */}
      {showInternalToolbar && !isReadOnly && <EditorToolbar editor={editor} />}

      {/* Editable Area */}
      <div
        className={`flex-1 overflow-y-auto p-2 ${isReadOnly ? 'cursor-default' : 'cursor-text'}`}
        onClick={() => !isReadOnly && editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Floating Link Quick Action Tooltip */}
      {activeLinkPopup && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setActiveLinkPopup(null)}
          />
          <div
            style={{
              top: `${activeLinkPopup.top}px`,
              left: `${activeLinkPopup.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 bg-white dark:bg-[#292936] border border-[#ECEEF3] dark:border-[#3A3948] rounded-xl shadow-modal px-3 py-2 flex items-center gap-2.5 text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            <div className="flex items-center gap-1.5 max-w-[160px] truncate text-slate-700 dark:text-[#E8E7EF] font-semibold">
              {activeLinkPopup.href.startsWith('#blankspace-doc:') ? (
                <Bookmark className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400 shrink-0" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5] shrink-0" />
              )}
              <span className="truncate">{getTargetTitle()}</span>
            </div>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-[#3A3948]" />

            <button
              onClick={handleNavigate}
              className="px-2 py-1 rounded-md bg-lavender-50 dark:bg-lavender-950/50 hover:bg-lavender-100 dark:hover:bg-lavender-900/60 text-lavender-700 dark:text-lavender-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>이동</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={handleUnlink}
              title="텍스트는 유지하고 링크만 해제합니다"
              className="px-2 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium flex items-center gap-1 transition-colors"
            >
              <Unlink className="w-3 h-3 text-rose-500" />
              <span>해제</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
