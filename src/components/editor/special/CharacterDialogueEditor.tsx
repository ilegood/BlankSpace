import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  GitBranch,
  Split,
  Tag,
  User,
  X,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export interface DialogueLine {
  id: string;
  speaker: string;
  avatarUrl: string;
  text: string;
  tags: string[];
  memo?: string;
}

const DEFAULT_DIALOGUES: DialogueLine[] = [
  {
    id: 'dlg-1',
    speaker: '아르젠',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
    text: '....또 늦었네.',
    tags: ['냉정', '불만', '기본'],
    memo: '약속을 중요하게 여기는 성격을 드러내는 대사.',
  },
  {
    id: 'dlg-2',
    speaker: '카일',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    text: '하네가 먼저 와 있을 줄은 몰랐지.',
    tags: ['능청', '일상'],
    memo: '긴장감 없이 여유로운 태도를 보여주는 대답.',
  },
  {
    id: 'dlg-3',
    speaker: '아르젠',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop',
    text: '약속은 지키라고 했을 텐데.',
    tags: ['단호', '원칙주의'],
    memo: '기사단 특유의 엄격한 규율 의식 반영.',
  },
  {
    id: 'dlg-4',
    speaker: '카일',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    text: '그렇게 딱딱하게 굴지 마. 별일도 아니잖아?',
    tags: ['장난', '친근'],
    memo: '아르젠의 굳은 표정을 풀어주려는 의도.',
  },
];

export const CharacterDialogueEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [dialogueCategory, setDialogueCategory] = useState<'daily' | 'conflict' | 'event'>('daily');
  const [lines, setLines] = useState<DialogueLine[]>(DEFAULT_DIALOGUES);
  const [selectedLineId, setSelectedLineId] = useState<string | null>('dlg-1');
  const [newTagInput, setNewTagInput] = useState('');

  // Load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('[')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.length > 0) {
          setLines(parsed);
          setSelectedLineId(parsed[0].id);
          return;
        }
      }
    } catch {}
    setLines(DEFAULT_DIALOGUES);
    setSelectedLineId('dlg-1');
  }, [activePage?.id]);

  const persistLines = (newLines: DialogueLine[]) => {
    setLines(newLines);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(newLines));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-대사스크립트`,
    });
  };

  const handleAddLine = (speaker: string = '아르젠') => {
    const isArzen = speaker === '아르젠';
    const newLine: DialogueLine = {
      id: `dlg-${generateId()}`,
      speaker,
      avatarUrl: isArzen
        ? 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      text: '새로운 대사를 입력하세요.',
      tags: ['기본'],
      memo: '',
    };
    const next = [...lines, newLine];
    persistLines(next);
    setSelectedLineId(newLine.id);
  };

  const handleDeleteLine = (id: string) => {
    const next = lines.filter((l) => l.id !== id);
    persistLines(next);
    if (selectedLineId === id) {
      setSelectedLineId(next[0]?.id || null);
    }
  };

  const updateSelectedLine = (key: keyof DialogueLine, value: any) => {
    if (!selectedLineId) return;
    const next = lines.map((l) => (l.id === selectedLineId ? { ...l, [key]: value } : l));
    persistLines(next);
  };

  const selectedLine = lines.find((l) => l.id === selectedLineId) || lines[0];

  const handleAddTag = () => {
    if (!newTagInput.trim() || !selectedLine) return;
    const tag = newTagInput.trim();
    if (!selectedLine.tags.includes(tag)) {
      updateSelectedLine('tags', [...selectedLine.tags, tag]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    if (!selectedLine) return;
    updateSelectedLine('tags', selectedLine.tags.filter((item) => item !== t));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddLine(selectedLine?.speaker === '아르젠' ? '카일' : '아르젠')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>대사 추가</span>
            </button>
            <button
              onClick={() => alert('선택지 분기 블록이 삽입되었습니다.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
            >
              <Split className="w-3.5 h-3.5 text-lavender-600" />
              <span>선택지 추가</span>
            </button>
            <button
              onClick={() => alert('분기 설정 패널을 엽니다.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-slate-500" />
              <span>분기 설정</span>
            </button>
          </div>
        }
      />

      {/* Main 3-Column Layout: Left Dialogue List + Center Timeline + Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Dialogue Category List */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 px-1">대화 목록</span>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: 'daily', label: '일상 대화', count: 4 },
                { id: 'conflict', label: '갈등', count: 2 },
                { id: 'event', label: '특정 이벤트', count: 1 },
              ].map((c) => {
                const isSelected = dialogueCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setDialogueCategory(c.id as any)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-lavender-50 text-lavender-900 font-bold border border-lavender-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-lavender-600' : 'text-slate-400'}`} />
                      <span>{c.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{c.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => alert('새 대화 그룹이 추가되었습니다.')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-lavender-400 text-slate-500 hover:text-lavender-700 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>대화 추가</span>
          </button>
        </div>

        {/* Center: Dialogue Script Timeline (Example Image Style) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#F8FAFD]">
          <div ref={printRef} className="max-w-2xl w-full flex flex-col gap-3.5">
            {lines.map((line, idx) => {
              const isSelected = line.id === selectedLineId;
              const isArzen = line.speaker === '아르젠';

              return (
                <div
                  key={line.id}
                  onClick={() => setSelectedLineId(line.id)}
                  className={`bg-white rounded-2xl border-2 p-4 flex items-start gap-3.5 transition-all cursor-pointer shadow-soft ${
                    isSelected
                      ? 'border-lavender-500 ring-4 ring-lavender-100 shadow-md scale-101'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[11px] font-mono text-slate-400 font-bold pt-1.5 w-6 shrink-0">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img src={line.avatarUrl} alt={line.speaker} className="w-full h-full object-cover" />
                  </div>

                  {/* Speaker & Speech Bubble */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{line.speaker}</span>
                      <div className="flex items-center gap-1.5">
                        {line.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/80 p-3 rounded-xl border border-slate-100/80 mt-0.5">
                      {line.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Dialogue Inspector (대사 속성) */}
        <div className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col gap-4 shrink-0 overflow-y-auto">
          <span className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
            대사 속성
          </span>

          {selectedLine ? (
            <div className="flex flex-col gap-4 text-xs">
              {/* Speaker Select */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">화자</label>
                <select
                  value={selectedLine.speaker}
                  onChange={(e) => {
                    const spk = e.target.value;
                    const avatar =
                      spk === '아르젠'
                        ? 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=200&auto=format&fit=crop'
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
                    updateSelectedLine('speaker', spk);
                    updateSelectedLine('avatarUrl', avatar);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-lavender-500 !bg-white"
                >
                  <option value="아르젠">아르젠</option>
                  <option value="카일">카일</option>
                  <option value="세이라">세이라</option>
                  <option value="루인">루인</option>
                </select>
              </div>

              {/* Speech Text Input */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">대사 내용</label>
                <textarea
                  rows={3}
                  value={selectedLine.text}
                  onChange={(e) => updateSelectedLine('text', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 !bg-white focus:outline-none focus:border-lavender-500 resize-none"
                />
              </div>

              {/* Expression Tags (표현 태그) */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1.5">표현 태그</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedLine.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-lavender-50 text-lavender-700 text-[11px] font-semibold border border-lavender-200"
                    >
                      <span>{t}</span>
                      <button onClick={() => handleRemoveTag(t)} className="text-lavender-400 hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="새 태그 입력 후 엔터"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs !bg-white focus:outline-none focus:border-lavender-500"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-2.5 py-1.5 bg-lavender-100 text-lavender-700 rounded-lg font-bold text-xs hover:bg-lavender-200"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="font-semibold text-slate-600 block mb-1">메모</label>
                <textarea
                  rows={2}
                  value={selectedLine.memo || ''}
                  onChange={(e) => updateSelectedLine('memo', e.target.value)}
                  placeholder="대사의 배경 의도나 성격 연출 메모"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 !bg-white resize-none focus:outline-none focus:border-lavender-500"
                />
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDeleteLine(selectedLine.id)}
                className="mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>대사 삭제</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">선택된 대사가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};
