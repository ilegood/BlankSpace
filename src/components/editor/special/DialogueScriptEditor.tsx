import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';

type DialogueCardType = 'event' | 'dialogue' | 'choice';

interface DialogueCardNode {
  id: string;
  type: DialogueCardType;
  title: string;
  speaker?: string;
  text?: string;
  conditions?: string[];
  results?: string[];
  choices?: { id: string; key: string; label: string }[];
  x: number;
  y: number;
}

const DEFAULT_DIALOGUE_CARDS: DialogueCardNode[] = [
  {
    id: 'dc-1',
    type: 'event',
    title: '유적 입구 도착',
    conditions: ['전투 튜토리얼 완료'],
    results: ['고대 열쇠 획득', '입구 개방'],
    x: 40,
    y: 28,
  },
  {
    id: 'dc-2',
    type: 'dialogue',
    title: '대사 카드',
    speaker: '화자 A',
    text: '여기가 그 고대 유적의 입구인가요? 이상한 문양이 새겨져 있네요.',
    x: 40,
    y: 190,
  },
  {
    id: 'dc-3',
    type: 'choice',
    title: '선택지',
    choices: [
      { id: 'ch-a', key: 'A', label: '열쇠를 사용해 문을 연다' },
      { id: 'ch-b', key: 'B', label: '문양을 먼저 조사한다' },
      { id: 'ch-c', key: 'C', label: '일행을 불러 모은다' },
    ],
    x: 40,
    y: 330,
  },
  {
    id: 'dc-4',
    type: 'dialogue',
    title: '대사 카드 · 분기 응답',
    speaker: '화자 B',
    text: '좋아요, 선택에 따라 유적 내부의 반응이 달라질 겁니다.',
    x: 310,
    y: 255,
  },
  {
    id: 'dc-5',
    type: 'event',
    title: '유적 내부 진입',
    conditions: ['선택지 A, B, C 중 하나 완료'],
    results: ['유적 탐사 퀘스트 갱신'],
    x: 560,
    y: 300,
  },
];

export const DialogueScriptEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [cards, setCards] = useState<DialogueCardNode[]>(DEFAULT_DIALOGUE_CARDS);
  const [selectedId, setSelectedId] = useState<string | null>('dc-5');
  const [liveDragCard, setLiveDragCard] = useState<{ id: string; x: number; y: number } | null>(null);

  // Preview states (§6-7)
  const [isPreview, setIsPreview] = useState(false);
  const [previewChoice, setPreviewChoice] = useState('A');
  const [previewStep, setPreviewStep] = useState(0);
  const [inventory, setInventory] = useState<string[]>(['고대 열쇠']);
  const [typedCount, setTypedCount] = useState(0);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.cards)) {
          setCards(parsed.cards);
          return;
        }
      } catch {
        // ignore
      }
    }
    setCards(DEFAULT_DIALOGUE_CARDS);
  }, [activePage?.id]);

  const persist = (next: DialogueCardNode[]) => {
    setCards(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ cards: next }) });
  };

  const previewDialogueText = `${previewChoice} 선택지에 따른 반응: "좋아요, 이제 안으로 들어가 보죠."`;

  // Typewriter effect in preview mode
  useEffect(() => {
    if (!isPreview) return;
    setTypedCount(0);
    const timer = window.setInterval(() => {
      setTypedCount((prev) => {
        if (prev >= previewDialogueText.length) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 28);
    return () => window.clearInterval(timer);
  }, [isPreview, previewChoice, previewStep, previewDialogueText.length]);

  const selected = cards.find((c) => c.id === selectedId) || null;

  const startCardDrag = (e: React.MouseEvent, card: DialogueCardNode) => {
    if (!isEditMode || e.button !== 0) return;
    e.stopPropagation();
    setSelectedId(card.id);
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = card.x;
    const oy = card.y;
    let moved = false;
    let fx = ox;
    let fy = oy;

    const onMove = (ev: MouseEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
      moved = true;
      fx = Math.max(12, Math.round(ox + ev.clientX - sx));
      fy = Math.max(12, Math.round(oy + ev.clientY - sy));
      setLiveDragCard({ id: card.id, x: fx, y: fy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setLiveDragCard(null);
      if (moved) {
        persist(cards.map((c) => (c.id === card.id ? { ...c, x: fx, y: fy } : c)));
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Interactive Dark Preview Mode matching PDF Page 37
  if (isPreview) {
    const choiceCard = cards.find((c) => c.type === 'choice');
    const choicesList = choiceCard?.choices || [
      { id: 'a', key: 'A', label: '선택지 A' },
      { id: 'b', key: 'B', label: '선택지 B' },
      { id: 'c', key: 'C', label: '선택지 C' },
    ];
    return (
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
        <EditorHeader
          title="게임 대화 스크립트 · 미리보기"
          templateType="character-dialogue"
          isEditMode={false}
          onChangeMode={() => {}}
          onExit={() => setIsPreview(false)}
        />
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 bg-[#221F32] text-white p-6 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
              >
                ■ 정지
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewChoice('A');
                  setPreviewStep(0);
                  setInventory(['고대 열쇠']);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
              >
                ↺ 처음부터
              </button>
            </div>

            <div className="max-w-sm w-full mx-auto flex flex-col gap-2.5">
              <div className="text-center text-xs text-white/60 mb-1">게임 화면 (미리보기)</div>
              {choicesList.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setPreviewChoice(ch.key);
                    setPreviewStep((s) => s + 1);
                    if (ch.key === 'B' && !inventory.includes('고대 문양 탁본')) {
                      setInventory((inv) => [...inv, '고대 문양 탁본']);
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-white text-[#1B1B1F] text-left text-xs font-semibold transition-all ${
                    previewChoice === ch.key ? 'ring-2 ring-[#9A8FE6] scale-[1.01]' : 'opacity-90 hover:opacity-100'
                  }`}
                >
                  <span className="font-bold mr-2 text-[#6A5ACD]">{ch.key}</span> {ch.label}
                </button>
              ))}
            </div>

            <div
              onClick={() => {
                if (typedCount < previewDialogueText.length) {
                  setTypedCount(previewDialogueText.length);
                } else {
                  setPreviewStep((s) => s + 1);
                }
              }}
              className="max-w-3xl w-full mx-auto rounded-2xl border border-[#5B4CC4] bg-[#1A1828]/90 p-5 flex flex-col gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#6A5ACD]/40" />
                <span className="text-sm font-bold">화자 B</span>
              </div>
              <p className="text-xs text-white/90 min-h-[20px]">
                {previewDialogueText.slice(0, typedCount)}
                {typedCount < previewDialogueText.length && <span className="animate-pulse">|</span>}
              </p>
              <div className="text-right text-xs text-white/60">
                {typedCount < previewDialogueText.length ? '클릭해 모두 보기' : '다음 ▾'}
              </div>
            </div>
          </div>

          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 text-xs">
            <div className="text-sm font-bold">진행 상태</div>
            <div>
              <div className="text-[11px] text-[#8A8998]">현재 이벤트</div>
              <div className="flex justify-between py-1.5 border-b border-[#F0EEF7] dark:border-[#2A2938]">
                <span>이름</span>
                <span className="font-semibold">{cards[0]?.title || '이벤트'}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#8A8998]">선택 기록</div>
              <div className="flex justify-between py-1.5 border-b border-[#F0EEF7] dark:border-[#2A2938]">
                <span>선택지 카드</span>
                <span className="font-semibold text-[#6A5ACD]">{previewChoice}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#8A8998] mb-1">인벤토리</div>
              <div className="flex flex-wrap gap-1.5">
                {inventory.length === 0 ? (
                  <span className="text-[#8A8998]">비어 있음</span>
                ) : (
                  inventory.map((it) => (
                    <span
                      key={it}
                      className="px-2 py-0.5 rounded-md bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] text-[11px] font-semibold"
                    >
                      {it}
                    </span>
                  ))
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#8A8998] leading-relaxed">
              분기 조건과 이벤트 결과가 제대로 동작하는지 여기서 확인합니다.
            </p>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '게임 대화 스크립트 (템플릿)' : activeDocument?.title || '게임 대화 스크립트'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="character-dialogue"
        isEditMode={isEditMode}
        onChangeMode={(edit) => {
          setIsEditMode(edit);
          if (!edit) setSelectedId(null);
        }}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
        onPreviewClick={() => setIsPreview(true)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div
          onClick={() => setSelectedId(null)}
          className="flex-1 relative overflow-auto canvas-dot-grid p-6"
        >
          <p className="text-center text-[11px] text-[#8A8998] mb-3">
            카드 사이의 연결선은 자동으로 배치되며 직접 조정할 수 없습니다. 카드 위치만 옮길 수 있습니다.
          </p>

          <div className="relative min-w-[820px] min-h-[540px]">
            {/* Auto Orthogonal Connectors SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {cards.slice(0, -1).map((c, idx) => {
                const next = cards[idx + 1];
                const cx = (liveDragCard?.id === c.id ? liveDragCard.x : c.x) + 105;
                const cy = (liveDragCard?.id === c.id ? liveDragCard.y : c.y) + 46;
                const nx = (liveDragCard?.id === next.id ? liveDragCard.x : next.x) + 105;
                const ny = (liveDragCard?.id === next.id ? liveDragCard.y : next.y) + 46;
                const midX = (cx + nx) / 2;
                const dPath = `M ${cx} ${cy} L ${midX} ${cy} L ${midX} ${ny} L ${nx} ${ny}`;
                return (
                  <path
                    key={`conn-${c.id}-${next.id}`}
                    d={dPath}
                    fill="none"
                    stroke="#B6ACEA"
                    strokeWidth="1.8"
                  />
                );
              })}
            </svg>

            {cards.map((c) => {
              const isSel = selectedId === c.id;
              const rx = liveDragCard?.id === c.id ? liveDragCard.x : c.x;
              const ry = liveDragCard?.id === c.id ? liveDragCard.y : c.y;
              return (
                <div
                  key={c.id}
                  onMouseDown={(e) => startCardDrag(e, c)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditMode) setSelectedId(c.id);
                  }}
                  style={{ left: rx, top: ry, width: 210 }}
                  className={`absolute rounded-2xl bg-white dark:bg-[#1E1E29] border p-3.5 text-xs shadow-2xs transition-shadow ${
                    isEditMode ? 'cursor-move' : 'cursor-default'
                  } ${
                    isSel && isEditMode
                      ? 'border-[#6A5ACD] border-2 shadow-md z-20'
                      : 'border-[#E6E3F0] dark:border-[#2E2D3D] z-10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] text-[10px] font-semibold">
                      {c.type === 'event' ? '이벤트' : c.type === 'dialogue' ? '화자' : '선택지'}
                    </span>
                    <span className="font-bold truncate">{c.speaker || c.title}</span>
                  </div>
                  {c.text && <p className="text-[11px] text-[#6E6D7A] dark:text-[#9E9CAF]">{c.text}</p>}
                  {c.conditions && (
                    <div className="text-[10.5px] text-[#6E6D7A] mt-1">
                      조건: {c.conditions.join(', ')}
                    </div>
                  )}
                  {c.choices && (
                    <div className="flex flex-col gap-1 mt-1">
                      {c.choices.map((ch) => (
                        <div
                          key={ch.id}
                          className="px-2 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-[11px]"
                        >
                          <strong>{ch.key}</strong> {ch.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel matching PDF Pages 33 & 40 */}
        {isEditMode && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 select-none text-xs">
            {selected ? (
              <>
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="text-[#6A5ACD] hover:underline"
                  >
                    ← 컴포넌트 추가
                  </button>
                  <div className="text-sm font-bold mt-1.5">컴포넌트 수정 · {selected.title}</div>
                </div>
                <input
                  type="text"
                  value={selected.speaker || selected.title}
                  onChange={(e) =>
                    persist(
                      cards.map((c) =>
                        c.id === selected.id
                          ? selected.type === 'dialogue'
                            ? { ...c, speaker: e.target.value }
                            : { ...c, title: e.target.value }
                          : c
                      )
                    )
                  }
                  className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                />
                {selected.type === 'dialogue' && (
                  <textarea
                    rows={3}
                    value={selected.text || ''}
                    onChange={(e) =>
                      persist(
                        cards.map((c) =>
                          c.id === selected.id ? { ...c, text: e.target.value } : c
                        )
                      )
                    }
                    className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] resize-none"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    persist(cards.filter((c) => c.id !== selected.id));
                    setSelectedId(null);
                  }}
                  className="self-start px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
                >
                  삭제
                </button>
              </>
            ) : (
              <>
                <div>
                  <div className="text-sm font-bold">컴포넌트 추가</div>
                  <p className="text-[11px] text-[#8A8998] mt-0.5">
                    이 템플릿에서는 전용 컴포넌트만 사용할 수 있습니다.
                  </p>
                </div>
                <span className="self-start px-3 py-1 rounded-full border border-[#6A5ACD] bg-[#F3F1FB] text-[#6A5ACD] font-semibold">
                  대화 스크립트 전용 3
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { type: 'event' as const, label: '이벤트 카드' },
                    { type: 'dialogue' as const, label: '대사 카드' },
                    { type: 'choice' as const, label: '선택지 카드' },
                  ].map((def) => (
                    <button
                      key={def.type}
                      type="button"
                      onClick={() => {
                        const nc: DialogueCardNode = {
                          id: `dc-${Date.now()}`,
                          type: def.type,
                          title: def.label,
                          speaker: def.type === 'dialogue' ? '화자' : undefined,
                          text: def.type === 'dialogue' ? '새 대사' : undefined,
                          conditions: def.type === 'event' ? ['조건 내용'] : undefined,
                          choices:
                            def.type === 'choice'
                              ? [{ id: 'a', key: 'A', label: '선택지 문구' }]
                              : undefined,
                          x: 120 + (cards.length % 4) * 30,
                          y: 80 + (cards.length % 4) * 30,
                        };
                        persist([...cards, nc]);
                        setSelectedId(nc.id);
                      }}
                      className="rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] p-2.5 text-left hover:border-[#6A5ACD]"
                    >
                      <div className="h-10 rounded-lg bg-[#F5F4FB] dark:bg-[#242334] mb-1.5" />
                      <div className="font-semibold text-[11.5px]">{def.label}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};
