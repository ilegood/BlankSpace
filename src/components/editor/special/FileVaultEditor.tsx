import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { useToast } from '../../toast/ToastContext';

interface VaultFileItem {
  id: string;
  name: string;
  ext: string;
  size: string;
  addedAt: string;
  description: string;
  tags: string[];
  dataUrl?: string;
}

const DEFAULT_FILES: VaultFileItem[] = [
  { id: 'vf-1', name: '파일 이름 1', ext: 'PDF', size: '2.4 MB', addedAt: '2026.11.20', description: '게임 기획 원안 문서', tags: ['태그 1'] },
  { id: 'vf-2', name: '파일 이름 2', ext: 'PSD', size: '48.2 MB', addedAt: '2026.11.20', description: '캐릭터 원화 레이어', tags: [] },
  { id: 'vf-3', name: '파일 이름 3', ext: 'FBX', size: '12.1 MB', addedAt: '2026.11.19', description: '주인공 3D 메쉬', tags: [] },
  { id: 'vf-4', name: '파일 이름 4', ext: 'WAV', size: '6.8 MB', addedAt: '2026.11.19', description: '전투 BGM 마스터', tags: [] },
  { id: 'vf-5', name: '파일 이름 5', ext: 'ZIP', size: '84.0 MB', addedAt: '2026.11.18', description: '텍스처 팩', tags: [] },
  { id: 'vf-6', name: '파일 이름 6', ext: 'TXT', size: '14 KB', addedAt: '2026.11.18', description: '대사 더미 데이터', tags: [] },
  { id: 'vf-7', name: '파일 이름 7', ext: 'PNG', size: '3.2 MB', addedAt: '2026.11.17', description: 'UI 아이콘 시트', tags: [] },
  { id: 'vf-8', name: '파일 이름 8', ext: 'XLSX', size: '420 KB', addedAt: '2026.11.17', description: '아이템 밸런스 표', tags: [] },
];

export const FileVaultEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const {
    activeDocument,
    activePage,
    openDocument,
    openTemplateEditor,
    updateDocument,
    updatePage,
    isFileReferenced,
  } = useWorkspace();
  const { showToast } = useToast();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [files, setFiles] = useState<VaultFileItem[]>(DEFAULT_FILES);
  const [selectedId, setSelectedId] = useState<string | null>('vf-1');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [confirmDeleteRef, setConfirmDeleteRef] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.files)) {
          setFiles(parsed.files);
          return;
        }
      } catch {
        // ignore
      }
    }
    setFiles(DEFAULT_FILES);
  }, [activePage?.id]);

  const persist = (next: VaultFileItem[]) => {
    setFiles(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ files: next }) });
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const arr = Array.from(fileList);
    setUploadingCount(arr.length);
    let currentFiles = [...files];

    arr.forEach((f) => {
      const ext = (f.name.split('.').pop() || 'FILE').toUpperCase();
      const size =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(f.size / 1024))} KB`;
      const reader = new FileReader();
      reader.onload = () => {
        const nf: VaultFileItem = {
          id: `vf-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: f.name,
          ext,
          size,
          addedAt: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
          description: '',
          tags: [],
          dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        };
        currentFiles = [...currentFiles, nf];
        persist(currentFiles);
        setSelectedId(nf.id);
        setUploadingCount((c) => Math.max(0, c - 1));
        showToast(`'${f.name}' 파일을 추가했습니다`);
      };
      reader.readAsDataURL(f);
    });
  };

  const performDeleteFile = (target: VaultFileItem) => {
    const prevFiles = [...files];
    persist(files.filter((f) => f.id !== target.id));
    setSelectedId(null);
    setConfirmDeleteRef(false);
    showToast(`'${target.name}' 파일을 삭제했습니다`, {
      onUndo: () => {
        persist(prevFiles);
        setSelectedId(target.id);
      },
    });
  };

  const filtered = files.filter(
    (f) => !search.trim() || f.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = files.find((f) => f.id === selectedId) || null;
  const selectedReferenced = selected
    ? isFileReferenced(selected.name) || isFileReferenced(selected.id)
    : false;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '파일 보관함 (템플릿)' : activeDocument?.title || '파일 보관함'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="general-files"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <div
          onDragEnter={(e) => {
            if (!isEditMode) return;
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragOver={(e) => {
            if (isEditMode) e.preventDefault();
          }}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setIsDragOver(false);
          }}
          onDrop={(e) => {
            if (!isEditMode) return;
            e.preventDefault();
            setIsDragOver(false);
            handleAddFiles(e.dataTransfer.files);
          }}
          className="flex-1 overflow-y-auto p-6 bg-[#FAF9FE] dark:bg-[#15151C] relative"
        >
          {/* Drag-Over Overlay (§6-13) */}
          {isEditMode && isDragOver && (
            <div className="bs-animate-fade absolute inset-4 z-30 rounded-2xl border-2 border-dashed border-[#6A5ACD] bg-[#EBE8F5]/85 dark:bg-[#2C2845]/85 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <UploadCloud className="w-10 h-10 text-[#6A5ACD]" />
              <span className="text-sm font-bold text-[#6A5ACD]">
                여기에 파일을 놓아 보관함에 업로드하세요
              </span>
            </div>
          )}

          {/* Upload Progress Ring Banner (§6-13) */}
          {uploadingCount > 0 && (
            <div className="bs-animate-popover mb-4 px-4 py-2 rounded-xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#323244] inline-flex items-center gap-2.5 text-xs shadow-xs">
              <svg className="w-4 h-4 animate-spin text-[#6A5ACD]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="font-semibold">파일 {uploadingCount}개 업로드 중…</span>
            </div>
          )}

          <div
            data-export-root="true"
            className="max-w-5xl mx-auto flex flex-col gap-5"
          >
            <div className="flex items-center justify-between gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="파일 검색"
                className="w-64 h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
              />
              <div className="relative inline-grid grid-cols-2 items-center rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] p-0.5 text-xs">
                <span
                  aria-hidden="true"
                  style={{
                    transform: viewMode === 'grid' ? 'translateX(0%)' : 'translateX(100%)',
                  }}
                  className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-lg bg-[#6A5ACD] transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                />
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`relative z-10 px-3 py-1 rounded-lg font-semibold transition-colors duration-200 ${
                    viewMode === 'grid' ? 'text-white' : 'text-[#6E6D7A]'
                  }`}
                >
                  카드
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`relative z-10 px-3 py-1 rounded-lg font-semibold transition-colors duration-200 ${
                    viewMode === 'list' ? 'text-white' : 'text-[#6E6D7A]'
                  }`}
                >
                  목록
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {filtered.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(f.id);
                      setConfirmDeleteRef(false);
                    }}
                    className={`bs-card-interactive rounded-2xl border bg-white dark:bg-[#1E1E29] p-4 text-left flex flex-col gap-3 ${
                      selectedId === f.id
                        ? 'border-[#6A5ACD] ring-1 ring-[#6A5ACD]/30'
                        : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                    }`}
                  >
                    <span className="self-start px-2.5 py-1 rounded-lg bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] text-[11px] font-bold">
                      {f.ext}
                    </span>
                    <div>
                      <div className="text-[13.5px] font-bold truncate">{f.name}</div>
                      <div className="text-[11px] text-[#8A8998] mt-0.5">
                        {f.size} · {f.addedAt}
                      </div>
                    </div>
                  </button>
                ))}

                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-2xl border border-dashed border-[#DCD8EC] dark:border-[#323244] p-4 flex flex-col items-center justify-center gap-1.5 text-[#6A5ACD] hover:bg-[#F3F1FB]/50 min-h-[115px]"
                  >
                    <span className="text-lg">+</span>
                    <span className="text-[11px] font-semibold">파일 추가 · 끌어다 놓기</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
                {filtered.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(f.id);
                      setConfirmDeleteRef(false);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#FAF9FE] dark:hover:bg-[#242334]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-[#EBE8F5] text-[#6A5ACD] text-[10.5px] font-bold">
                        {f.ext}
                      </span>
                      <span className="text-xs font-bold">{f.name}</span>
                    </div>
                    <span className="text-xs text-[#8A8998]">
                      {f.size} · {f.addedAt}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleAddFiles(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Right File Info Inspector matching PDF Page 52 */}
        {selected && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-3.5 select-none text-xs">
            <div className="text-sm font-bold">파일 정보</div>
            <div className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
              <span className="text-[#8A8998]">이름</span>
              <span className="font-semibold truncate max-w-[150px]">{selected.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
              <span className="text-[#8A8998]">형식</span>
              <span className="font-semibold">{selected.ext}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
              <span className="text-[#8A8998]">크기</span>
              <span>{selected.size}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EEF7] dark:border-[#2A2938]">
              <span className="text-[#8A8998]">추가한 날짜</span>
              <span>{selected.addedAt}</span>
            </div>
            <textarea
              rows={3}
              readOnly={!isEditMode}
              value={selected.description}
              onChange={(e) =>
                persist(
                  files.map((f) =>
                    f.id === selected.id ? { ...f, description: e.target.value } : f
                  )
                )
              }
              placeholder="파일 설명"
              className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] resize-none"
            />

            {confirmDeleteRef && (
              <div className="bs-animate-popover rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-2.5 flex flex-col gap-2 text-[11px] text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-1.5 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>다른 문서에서 참조 중인 파일입니다. 정말 삭제하시겠습니까?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => performDeleteFile(selected)}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold"
                  >
                    강제 삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteRef(false)}
                    className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-800 dark:text-amber-200"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {selected.dataUrl && (
                <a
                  href={selected.dataUrl}
                  download={selected.name}
                  className="px-3.5 py-1.5 rounded-xl bg-[#6A5ACD] text-white font-semibold"
                >
                  다운로드
                </a>
              )}
              {isEditMode && !confirmDeleteRef && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedReferenced) {
                      setConfirmDeleteRef(true);
                    } else {
                      performDeleteFile(selected);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
                >
                  삭제
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
