import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Trash2,
  Bookmark,
  Unlink,
} from 'lucide-react';
import { InsertInternalLinkModal } from '../modals/InsertInternalLinkModal';
import { InsertMediaModal } from '../modals/InsertMediaModal';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const [isInternalModalOpen, setIsInternalModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  if (!editor) return null;

  const handleInsertImage = (src: string, alt?: string) => {
    editor.chain().focus().setImage({ src, alt: alt || undefined }).run();
  };

  const handleInsertYoutube = (url: string) => {
    (editor.commands as any).setYoutubeVideo({ src: url });
  };

  const handleInsertVideoAudio = (type: 'video' | 'audio', src: string) => {
    if (type === 'video') {
      editor
        .chain()
        .focus()
        .insertContent(
          `<div class="my-4 max-w-2xl mx-auto"><video controls src="${src}" class="w-full rounded-2xl shadow-soft border border-slate-200 aspect-video"></video></div><p></p>`
        )
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent(
          `<div class="my-3 max-w-md mx-auto p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs"><audio controls src="${src}" class="w-full"></audio></div><p></p>`
        )
        .run();
    }
  };

  const handleInsertLinkCard = (card: { url: string; title: string; description?: string }) => {
    const cardHtml = `
      <div class="blankspace-link-card my-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-all shadow-2xs flex items-center justify-between gap-4 select-none">
        <div class="flex-1 min-w-0">
          <a href="${card.url}" target="_blank" rel="noopener noreferrer" class="font-bold text-slate-800 text-sm hover:text-lavender-600 block truncate underline">${card.title}</a>
          ${card.description ? `<p class="text-xs text-slate-500 mt-1 line-clamp-2">${card.description}</p>` : ''}
          <span class="text-[11px] text-lavender-600 font-medium block mt-1 truncate">${card.url}</span>
        </div>
      </div>
      <p></p>
    `;
    editor.chain().focus().insertContent(cardHtml).run();
  };

  const setExternalLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('연결할 외부 링크 URL을 입력하세요:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // 링크 해제 (텍스트는 그대로 유지하고 링크만 해제)
  const unsetCurrentLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  const handleOpenInternalLink = () => {
    // 커서가 이미 링크 위에 있다면 링크 전체 텍스트를 자동 감지하여 선택
    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').run();
    }
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    setSelectedText(text);
    setIsInternalModalOpen(true);
  };

  const handleInsertInternalLink = (url: string, text: string) => {
    if (editor.isActive('link')) {
      // 1. 이미 링크가 걸려있는 경우: 기존 텍스트는 100% 보존하고 대상 링크(href)만 변경!
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // 2. 텍스트를 선택한 상태에서 링크 삽입: 선택된 텍스트 유지하고 링크만 적용
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      } else {
        // 3. 커서만 있는 상태: 순수 텍스트 노드 + 링크 마크로 삽입하여 텍스트 분리/수정 자유롭게 보장
        const textToInsert = text.trim() || '문서 링크';
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: textToInsert,
            marks: [{ type: 'link', attrs: { href: url } }],
          })
          .insertContent(' ')
          .run();
      }
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-[#ECEEF3] bg-[#FCFCFD] text-slate-600 select-none">
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-slate-200/80 pr-1.5 mr-1.5 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="실행 취소 (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="다시 실행 (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-slate-200/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center border-r border-slate-200/80 pr-1.5 mr-1.5 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="제목 1 (H1)"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="제목 2 (H2)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="제목 3 (H3)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Basic Marks: Bold, Italic, Strike */}
        <div className="flex items-center border-r border-slate-200/80 pr-1.5 mr-1.5 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('bold')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="굵게 (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('italic')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="기울임 (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('strike')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="취소선"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists: Bullet, Ordered, Task */}
        <div className="flex items-center border-r border-slate-200/80 pr-1.5 mr-1.5 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('bulletList')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="글머리 기호 목록"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('orderedList')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="번호 매기기 목록"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('taskList')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="할 일 체크리스트"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Blocks: Quote, Separator */}
        <div className="flex items-center border-r border-slate-200/80 pr-1.5 mr-1.5 gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('blockquote')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="인용문"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="구분선 삽입"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Insert: Internal Link (Phase 4), External Link, Unlink, Image, Table */}
        <div className="flex items-center gap-1">
          {/* Phase 4: Internal Document Link */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleOpenInternalLink}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
              editor.isActive('link') && editor.getAttributes('link').href?.startsWith('#blankspace-doc:')
                ? 'bg-lavender-100 text-lavender-800 border-lavender-300 shadow-xs'
                : 'text-lavender-700 bg-lavender-50 hover:bg-lavender-100/90 border-lavender-200/80'
            }`}
            title={editor.isActive('link') ? '내부 링크 대상 문서 변경 (기존 텍스트 유지)' : '다른 문서나 페이지로 연결되는 내부 링크 삽입'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-lavender-300" />
            <span>{editor.isActive('link') ? '링크 변경' : '내부 링크'}</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={setExternalLink}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('link') && !editor.getAttributes('link').href?.startsWith('#blankspace-doc:')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="외부 URL 링크 삽입 / 변경"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* 링크 해제 버튼 (텍스트는 그대로 남기고 링크만 해제) */}
          {editor.isActive('link') && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={unsetCurrentLink}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors animate-in fade-in"
              title="텍스트는 유지하고 링크만 해제하여 일반 텍스트로 전환합니다"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>링크 해제</span>
            </button>
          )}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsMediaModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="미디어 (이미지, GIF, YouTube, 영상, 오디오, 링크 카드) 삽입"
          >
            <ImageIcon className="w-3.5 h-3.5 text-lavender-600" />
            <span>미디어 첨부</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertTable}
            className={`p-1.5 rounded-lg transition-colors ${
              editor.isActive('table')
                ? 'bg-lavender-100 text-lavender-700 font-bold'
                : 'hover:bg-slate-200/60'
            }`}
            title="표 삽입 (3x3)"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {/* Quick controls when cursor is inside a table */}
          {editor.isActive('table') && (
            <div className="flex items-center gap-1 bg-lavender-100/70 border border-lavender-200 px-1.5 py-0.5 rounded-lg text-[11px] font-medium text-lavender-800">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="아래에 행 추가"
                className="px-1 py-0.5 hover:bg-white rounded transition-colors"
              >
                +행
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="오른쪽에 열 추가"
                className="px-1 py-0.5 hover:bg-white rounded transition-colors"
              >
                +열
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="행 삭제"
                className="px-1 py-0.5 hover:bg-rose-100 text-rose-600 rounded transition-colors"
              >
                -행
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="열 삭제"
                className="px-1 py-0.5 hover:bg-rose-100 text-rose-600 rounded transition-colors"
              >
                -열
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="표 전체 삭제"
                className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Internal Link Selection Modal */}
      <InsertInternalLinkModal
        isOpen={isInternalModalOpen}
        onClose={() => setIsInternalModalOpen(false)}
        onInsertLink={handleInsertInternalLink}
        selectedText={selectedText}
      />

      {/* Media & External Link Modal (Phase 6) */}
      <InsertMediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onInsertImage={handleInsertImage}
        onInsertYoutube={handleInsertYoutube}
        onInsertVideoAudio={handleInsertVideoAudio}
        onInsertLinkCard={handleInsertLinkCard}
      />
    </>
  );
};
