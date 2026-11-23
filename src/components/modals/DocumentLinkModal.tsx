import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { ModalShell } from './ModalShell';

interface DocumentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (doc: { id: string; title: string }) => void;
  excludeDocId?: string;
}

export const DocumentLinkModal: React.FC<DocumentLinkModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  excludeDocId,
}) => {
  const { documents, getDocumentPath } = useWorkspace();
  const [query, setQuery] = useState('');

  const filtered = documents.filter((d) => {
    if (d.deletedAt) return false;
    if (excludeDocId && d.id === excludeDocId) return false;
    if (!query.trim()) return true;
    return d.title.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-md"
      zIndexClass="z-[90]"
      className="flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAE7F2] dark:border-[#2E2D3D]">
        <h3 className="text-sm font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">문서 연결</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="문서 이름 검색"
          className="w-full h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C] text-xs text-[#1B1B1F] dark:text-[#F1F0F6] focus:outline-none focus:border-[#6A5ACD]"
        />

        <div className="max-h-64 overflow-y-auto divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8A8998]">일치하는 문서가 없습니다.</div>
          ) : (
            filtered.map((doc) => {
              const isTrashed = Boolean(doc.deletedAt);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    onSelect({ id: doc.id, title: doc.title });
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 py-2.5 px-2 text-left hover:bg-[#F8F7FC] dark:hover:bg-[#262436] rounded-lg transition-colors"
                >
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EBE8F5] dark:bg-[#312D4B] text-[#6A5ACD] dark:text-[#9A8FE6] shrink-0">
                    문서
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-xs font-semibold truncate ${
                        isTrashed
                          ? 'line-through text-[#8A8998]'
                          : 'text-[#1B1B1F] dark:text-[#F1F0F6]'
                      }`}
                    >
                      {doc.title} {isTrashed && '(휴지통)'}
                    </div>
                    <div className="text-[11px] text-[#8A8998] truncate">{getDocumentPath(doc)}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </ModalShell>
  );
};
