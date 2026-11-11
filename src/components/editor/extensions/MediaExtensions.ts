import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CustomAudioPlayer } from './CustomAudioPlayer';

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
    audio: {
      setAudio: (options: { src: string }) => ReturnType;
    };
    linkCard: {
      setLinkCard: (options: { url: string; title: string; description?: string }) => ReturnType;
    };
  }
}

/**
 * 1. HTML5 Video Extension
 */
export const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
      {
        tag: 'div[data-type="blankspace-video"] video',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-type': 'blankspace-video',
        contenteditable: 'false',
        class: 'my-4 max-w-2xl mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-[#3A3948] shadow-soft bg-black aspect-video flex items-center justify-center',
      },
      [
        'video',
        mergeAttributes(HTMLAttributes, {
          controls: 'true',
          class: 'w-full h-full object-contain block',
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * 2. Custom Styled HTML5 Audio Extension with React NodeView
 */
export const AudioExtension = Node.create({
  name: 'audio',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            src: el.getAttribute('src') || '',
          };
        },
      },
      {
        tag: 'div[data-type="blankspace-audio"]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const audio = el.querySelector('audio');
          return {
            src: el.getAttribute('data-src') || audio?.getAttribute('src') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || '';
    return [
      'div',
      {
        'data-type': 'blankspace-audio',
        'data-src': src,
        contenteditable: 'false',
        class: 'my-3 max-w-xl mx-auto p-3.5 rounded-2xl bg-white dark:bg-[#252433] border border-slate-200 dark:border-[#3A3948] shadow-soft',
      },
      [
        'audio',
        mergeAttributes(HTMLAttributes, {
          controls: 'true',
          class: 'w-full',
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomAudioPlayer);
  },

  addCommands() {
    return {
      setAudio:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

/**
 * 3. External Link Card Extension
 * Format:
 * [Top] 설정한 이름 (Title) + ↗
 * [Middle] 설명 (Description)
 * [Bottom] 주소 형식 (URL / Domain)
 */
export const LinkCardExtension = Node.create({
  name: 'linkCard',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      url: {
        default: '',
      },
      title: {
        default: '',
      },
      description: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="blankspace-link-card"]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            url: el.getAttribute('data-url') || '',
            title: el.getAttribute('data-title') || '',
            description: el.getAttribute('data-desc') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const url = HTMLAttributes.url || '';
    const title = HTMLAttributes.title || url;
    const desc = HTMLAttributes.description || '';

    return [
      'div',
      {
        'data-type': 'blankspace-link-card',
        'data-url': url,
        'data-title': title,
        'data-desc': desc,
        contenteditable: 'false',
        class: 'my-4 max-w-xl mx-auto rounded-2xl border border-slate-200/90 dark:border-[#3A3948] bg-white dark:bg-[#252433] hover:border-lavender-400 dark:hover:border-lavender-500 shadow-soft hover:shadow-md transition-all duration-150 overflow-hidden select-none group',
      },
      [
        'a',
        {
          href: url,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'p-4 flex flex-col gap-1.5 text-inherit no-underline block w-full cursor-pointer',
        },
        // 1. 위쪽: 설정한 이름 (제목) + 우측 ↗
        [
          'div',
          { class: 'flex items-center justify-between gap-2' },
          [
            'div',
            { class: 'font-bold text-sm text-slate-800 dark:text-[#F3F2F8] truncate group-hover:text-lavender-600 dark:group-hover:text-[#B7A5FF] transition-colors flex items-center gap-2' },
            ['span', { class: 'text-base' }, '🔗'],
            ['span', { class: 'truncate' }, title],
          ],
          [
            'div',
            { class: 'shrink-0 text-slate-400 dark:text-[#7262A8] group-hover:text-lavender-500 transition-colors font-bold text-xs' },
            '↗',
          ],
        ],
        // 2. 중간: 설명
        desc
          ? [
              'div',
              { class: 'text-xs text-slate-500 dark:text-[#A5A3B5] line-clamp-2 mt-0.5 pl-6 leading-relaxed' },
              desc,
            ]
          : ['span', { class: 'hidden' }],
        // 3. 아래쪽: 주소 형식
        [
          'div',
          { class: 'text-[11px] text-slate-400 dark:text-[#8E8B9E] font-medium truncate mt-1 pl-6 flex items-center gap-1.5' },
          ['span', { class: 'text-emerald-600 dark:text-emerald-400' }, '🌐'],
          ['span', { class: 'truncate text-lavender-600 dark:text-[#B7A5FF] font-mono group-hover:underline' }, url],
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setLinkCard:
        (options: { url: string; title: string; description?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
