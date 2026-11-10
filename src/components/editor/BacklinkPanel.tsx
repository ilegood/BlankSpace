import React from 'react';
import { Link2, FileText, ArrowRight, CornerDownRight, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { Document, DocumentPage } from '../../types';
import { TEMPLATES } from '../../templates/templateList';

interface BacklinkItem {
  sourceDoc: Document;
  sourcePage: DocumentPage;
}

interface BacklinkPanelProps {
  onNavigateToDocument: (docId: string, pageId?: string) => void;
}

export const BacklinkPanel: React.FC<BacklinkPanelProps> = ({ onNavigateToDocument }) => {
  const { activeDocument, activeProject, documents, pages } = useWorkspace();

  if (!activeDocument) return null;

  // Scan all other documents and pages in this project for references to activeDocument.id
  const currentDocId = activeDocument.id;
  const targetPattern = `#blankspace-doc:${currentDocId}`;

  const backlinks: BacklinkItem[] = [];
  const seenPageIds = new Set<string>();

  // Filter project docs except current document
  const otherDocs = documents.filter(
    (d) => d.projectId === activeProject?.id && d.id !== currentDocId
  );

  for (const doc of otherDocs) {
    const docPages = pages.filter((p) => p.documentId === doc.id);
    for (const page of docPages) {
      if (page.content && page.content.includes(targetPattern) && !seenPageIds.has(page.id)) {
        seenPageIds.add(page.id);
        backlinks.push({
          sourceDoc: doc,
          sourcePage: page,
        });
      }
    }
  }

  return (
    <div className="bg-white dark:bg-[#1E1E27] border border-[#ECEEF3] dark:border-[#3A3948] rounded-2xl p-6 shadow-soft mt-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3A3948]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-lavender-100 dark:bg-lavender-950/60 text-lavender-600 dark:text-lavender-400 flex items-center justify-center">
            <Link2 className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF]">
            연결된 문서 (백링크)
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-lavender-100 dark:bg-lavender-950/60 text-lavender-700 dark:text-lavender-300">
            {backlinks.length}
          </span>
        </div>

        <span className="text-[11px] text-slate-400 dark:text-[#A5A3B5]">
          이 문서를 참조하고 있는 다른 문서 목록입니다.
        </span>
      </div>

      {/* Backlinks List */}
      <div className="pt-4">
        {backlinks.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400 dark:text-[#A5A3B5] gap-1.5 bg-slate-50/50 dark:bg-[#17171D]/40 rounded-xl border border-dashed border-slate-200 dark:border-[#3A3948]">
            <Sparkles className="w-5 h-5 text-slate-300 dark:text-[#525068] stroke-1" />
            <p className="text-xs font-medium text-slate-500 dark:text-[#A5A3B5]">
              이 문서를 참조하고 있는 다른 문서가 아직 없습니다.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-[#A5A3B5]/80 max-w-sm">
              다른 문서 본문에서 상단 툴바의 <strong className="text-lavender-600 dark:text-lavender-400">[내부 링크]</strong> 버튼을 사용하여 이 문서를 참조해 보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {backlinks.map(({ sourceDoc, sourcePage }) => {
              const template = TEMPLATES.find((t) => t.id === sourceDoc.templateType);
              return (
                <div
                  key={`${sourceDoc.id}-${sourcePage.id}`}
                  onClick={() => onNavigateToDocument(sourceDoc.id, sourcePage.id)}
                  className="group p-3.5 rounded-xl border border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#292936] hover:border-lavender-300 dark:hover:border-lavender-500 hover:bg-lavender-50/30 dark:hover:bg-[#292936]/80 transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-2xs hover:shadow-soft"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-lavender-100/80 dark:bg-lavender-950/60 text-lavender-700 dark:text-lavender-300">
                      {template?.name || '문서'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-[#525068] group-hover:text-lavender-600 dark:group-hover:text-lavender-400 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] group-hover:text-lavender-700 dark:group-hover:text-lavender-400 transition-colors truncate">
                      {sourceDoc.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-[#A5A3B5] mt-0.5 truncate">
                      <CornerDownRight className="w-3 h-3 text-slate-300 dark:text-[#525068] shrink-0" />
                      <span className="truncate">{sourcePage.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

