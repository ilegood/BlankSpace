import React, { useState, useRef, useEffect } from 'react';
import {
  CanvasElement,
  CanvasElementType,
  InfoItem,
  StatItem,
} from '../../../types/canvas';
import {
  Shield,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';

interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
}

type ResizeHandleDirection =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

export const CanvasElementRenderer: React.FC<CanvasElementRendererProps> = ({
  element,
  isSelected,
  zoom,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingContent, setEditingContent] = useState('');

  // 1. Drag to Move
  const handleMouseDownMove = (e: React.MouseEvent) => {
    // If clicking inside input/textarea, let text selection work
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    e.stopPropagation();
    onSelect(element.id, e);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = element.x;
    const initialY = element.y;
    const scale = zoom / 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      onUpdate(element.id, {
        x: Math.round(initialX + dx),
        y: Math.round(initialY + dy),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 2. Drag Resize Handles
  const handleMouseDownResize = (
    dir: ResizeHandleDirection,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y, width, height } = element;
    const scale = zoom / 100;
    const aspectRatio = width / height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let dx = (moveEvent.clientX - startX) / scale;
      let dy = (moveEvent.clientY - startY) / scale;

      let newX = x;
      let newY = y;
      let newW = width;
      let newH = height;

      // Handle West
      if (dir.includes('w')) {
        const potentialW = width - dx;
        if (potentialW > 30) {
          newW = potentialW;
          newX = x + dx;
        }
      }
      // Handle East
      if (dir.includes('e')) {
        newW = Math.max(30, width + dx);
      }
      // Handle North
      if (dir.includes('n')) {
        const potentialH = height - dy;
        if (potentialH > 20) {
          newH = potentialH;
          newY = y + dy;
        }
      }
      // Handle South
      if (dir.includes('s')) {
        newH = Math.max(20, height + dy);
      }

      // Preserve aspect ratio for images if corner handle dragged
      if (
        element.type === 'image' &&
        element.content.aspectRatio &&
        (dir === 'se' || dir === 'nw' || dir === 'ne' || dir === 'sw')
      ) {
        if (dir === 'se') {
          newH = Math.round(newW / aspectRatio);
        } else if (dir === 'nw') {
          newH = Math.round(newW / aspectRatio);
          newY = y + (height - newH);
        }
      }

      onUpdate(element.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Text double click handler
  const handleStartEditText = () => {
    if (element.type === 'heading' || element.type === 'text') {
      setEditingContent(element.content.text || '');
      setIsEditingText(true);
    }
  };

  const handleFinishEditText = () => {
    setIsEditingText(false);
    onUpdate(element.id, {
      content: { ...element.content, text: editingContent },
    });
  };

  // Sub-renderers for element contents
  const renderContent = () => {
    const { type, content, style } = element;

    // 1. IMAGE
    if (type === 'image') {
      return (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center rounded-[inherit] pointer-events-none select-none">
          {content.imageUrl ? (
            <img
              src={content.imageUrl}
              alt={content.alt || '이미지'}
              className="w-full h-full object-cover rounded-[inherit]"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-1.5 text-slate-400">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">이미지 없음</span>
            </div>
          )}
        </div>
      );
    }

    // 2. HEADING
    if (type === 'heading') {
      if (isEditingText) {
        return (
          <input
            type="text"
            autoFocus
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            onBlur={handleFinishEditText}
            onKeyDown={(e) => e.key === 'Enter' && handleFinishEditText()}
            className="w-full h-full px-1 font-bold text-slate-800 bg-white border border-lavender-400 rounded outline-none !bg-white"
            style={{ fontSize: style?.fontSize || 22 }}
          />
        );
      }
      return (
        <div
          onDoubleClick={handleStartEditText}
          className="w-full h-full flex items-center select-none"
          style={{
            fontSize: style?.fontSize || 22,
            fontWeight: style?.fontWeight || 'bold',
            color: style?.color || '#1E293B',
            textAlign: style?.textAlign || 'left',
          }}
        >
          <span className="truncate w-full">
            {content.text || '제목을 입력하세요'}
          </span>
        </div>
      );
    }

    // 3. TEXT / PARAGRAPH
    if (type === 'text') {
      if (isEditingText) {
        return (
          <textarea
            autoFocus
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            onBlur={handleFinishEditText}
            className="w-full h-full p-1.5 text-xs text-slate-700 bg-white border border-lavender-400 rounded outline-none resize-none leading-relaxed !bg-white"
          />
        );
      }
      return (
        <div
          onDoubleClick={handleStartEditText}
          className="w-full h-full overflow-hidden leading-relaxed select-none"
          style={{
            fontSize: style?.fontSize || 13,
            color: style?.color || '#334155',
            fontWeight: style?.fontWeight || 'normal',
            textAlign: style?.textAlign || 'left',
          }}
        >
          <p className="whitespace-pre-wrap">{content.text || '텍스트를 입력하세요'}</p>
        </div>
      );
    }

    // 4. INFO FIELD (Key-Value)
    if (type === 'info-field') {
      const items = content.infoItems || [];
      return (
        <div className="w-full h-full flex flex-col justify-around select-none">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400 shrink-0 w-12">
                  {item.label}
                </span>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...next[idx], value: e.target.value };
                    onUpdate(element.id, {
                      content: { ...content, infoItems: next },
                    });
                  }}
                  className="flex-1 font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-lavender-400 focus:outline-none px-1 py-0.5 truncate !bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. STATUS CHART
    if (type === 'status-chart') {
      const stats = content.stats || [];
      return (
        <div className="w-full h-full flex flex-col justify-between select-none">
          <div className="grid grid-cols-3 gap-2.5 h-full items-center">
            {stats.map((st, idx) => (
              <div
                key={st.id || idx}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex flex-col items-center justify-center hover:border-lavender-300 transition-colors"
              >
                <span className="text-[11px] font-medium text-slate-400">
                  {st.label}
                </span>
                <span className="text-base font-bold text-lavender-700">
                  {st.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. CONTAINER
    if (type === 'container') {
      return <div className="w-full h-full rounded-[inherit] pointer-events-none" />;
    }

    // 7. DIVIDER
    if (type === 'divider') {
      return (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-full h-0.5 bg-slate-200 rounded-full" />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        transform: `translate(${element.x}px, ${element.y}px)`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        zIndex: element.zIndex,
        backgroundColor: element.style?.backgroundColor || 'transparent',
        borderColor: element.style?.borderColor || 'transparent',
        borderWidth: element.style?.borderWidth ? `${element.style.borderWidth}px` : undefined,
        borderRadius: element.style?.borderRadius ? `${element.style.borderRadius}px` : undefined,
        boxShadow: element.style?.boxShadow,
        padding: element.style?.padding ? `${element.style.padding}px` : undefined,
      }}
      onMouseDown={handleMouseDownMove}
      className={`absolute cursor-move border transition-shadow duration-100 ${
        isSelected
          ? 'ring-2 ring-lavender-500 shadow-lg'
          : 'hover:ring-1 hover:ring-lavender-300'
      }`}
    >
      {/* Element Content */}
      {renderContent()}

      {/* 8-Direction Resize Handles (Shown only when selected) */}
      {isSelected && (
        <>
          {/* NW */}
          <div
            onMouseDown={(e) => handleMouseDownResize('nw', e)}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-nw-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
          {/* N */}
          <div
            onMouseDown={(e) => handleMouseDownResize('n', e)}
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-n-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
          {/* NE */}
          <div
            onMouseDown={(e) => handleMouseDownResize('ne', e)}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-ne-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
          {/* E */}
          <div
            onMouseDown={(e) => handleMouseDownResize('e', e)}
            className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-e-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
          {/* SE */}
          <div
            onMouseDown={(e) => handleMouseDownResize('se', e)}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-se-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
          {/* S */}
          <div
            onMouseDown={(e) => handleMouseDownResize('s', e)}
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-s-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
          {/* SW */}
          <div
            onMouseDown={(e) => handleMouseDownResize('sw', e)}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-sw-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
          {/* W */}
          <div
            onMouseDown={(e) => handleMouseDownResize('w', e)}
            className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-lavender-600 rounded-xs cursor-w-resize z-50 shadow-2xs hover:scale-125 transition-transform"
          />
        </>
      )}
    </div>
  );
};

