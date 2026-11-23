import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { useToast } from '../../toast/ToastContext';

type DialogueCardType = 'event' | 'dialogue' | 'choice';

interface DialogueChoiceItem {
  id: string;
  key: string;
  label: string;
  nextCardId?: string;
}

interface DialogueCardNode {
  id: string;
  type: DialogueCardType;
  title: string;
  speaker?: string;
  text?: string;
  conditions?: string[];
  results?: string[];
  choices?: DialogueChoiceItem[];
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
      { id: 'ch-a', key: 'A', label: '열쇠를 사용해 문을 연다', nextCardId: 'dc-4' },
      { id: 'ch-b', key: 'B', label: '문양을 먼저 조사한다', nextCardId: 'dc-4' },
      { id: 'ch-c', key: 'C', label: '일행을 불러 모은다', nextCardId: 'dc-5' },
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
  const { showToast } = useToast();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [cards, setCards] = useState<DialogueCardNode[]>(DEFAULT_DIALOGUE_CARDS);
  const [selectedId, setSelectedId] = useState<string | null>('dc-5');
  const [liveDragCard, setLiveDragCard] = useState<{ id: string; x: number; y: number } | null>(null);
  const [lineLockTip, setLineLockTip] = useState<{ x: number; y: number } | null>(null);

  // Preview states (§6-7)
  const [isPreview, setIsPreview] = useState(false);
  const [previewCardId, setPreviewCardId] = useState<string>('dc-2');
  const [choiceHistory, setChoiceHistory] = useState<{ key: string; label: string }[]>([]);
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

  const activePreviewCard =
    cards.find((c) => c.id === previewCardId) ||
    cards.find((c) => c.type === 'dialogue') ||
    cards[0];

  const previewDialogueText =
    activePreviewCard?.type === 'dialogue'
      ? activePreviewCard.text || '대사를 입력하세요.'
      : activePreviewCard?.type === 'event'
        ? `[이벤트: ${activePreviewCard.title}] ${(activePreviewCard.results || []).join(' · ')}`
        : '선택지를 골라 진행하세요.';

  // Typewriter effect in preview mode (§6-7: 24ms per character)
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
    }, 24);
    return () => window.clearInterval(timer);
  }, [isPreview, previewCardId, previewDialogueText]);

  const advancePreviewToCard = (
    targetCard: DialogueCardNode | undefined,
    nextHistory = choiceHistory,
    nextInv = inventory
  ) => {
    if (!targetCard) {
      showToast('대화의 끝에 도달했습니다');
      return;
    }
    if (targetCard.type === 'event') {
      // Check conditions (§6-7)
      const unmet = (targetCard.conditions || []).find((cond) => {
        if (cond.includes('선택지') && nextHistory.length === 0) return true;
        if (cond.includes('열쇠') && !nextInv.some((i) => i.includes('열쇠'))) return true;
        return false;
      });
      if (unmet) {
        showToast(`조건 미충족: ${unmet}`, { variant: 'error' });
      } else if (targetCard.results?.length) {
        const addedItems: string[] = [];
        targetCard.results.forEach((res) => {
          if (res.includes('획득') || res.includes('추가')) {
            const cleanItem = res.replace(/획득|추가|인벤토리에/g, '').trim();
            if (cleanItem && !nextInv.includes(cleanItem)) {
              addedItems.push(cleanItem);
            }
          }
        });
        if (addedItems.length > 0) {
          setInventory([...nextInv, ...addedItems]);
          showToast(`이벤트 결과: ${addedItems.join(', ')} 획득`);
        }
      }
    }
    setPreviewCardId(targetCard.id);
  };

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

  // Interactive Dark Preview Mode matching PDF Page 37 (§6-7)
  if (isPreview) {
    const choiceCard =
      activePreviewCard?.type === 'choice'
        ? activePreviewCard
        : cards.find((c) => c.type === 'choice');
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
                  setPreviewCardId(cards[0]?.id || 'dc-1');
                  setChoiceHistory([]);
                  setInventory(['고대 열쇠']);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
              >
                ↺ 처음부터
              </button>
            </div>

            <div className="max-w-sm w-full mx-auto flex flex-col gap-2.5">
              <div className="text-center text-xs text-white/60 mb-1">게임 화면 (미리보기)</div>
              {choicesList.map((ch, idx) => (
                <button
                  key={ch.id}
                  type="button"
                  style={{ animationDelay: `${idx * 60}ms` }}
                  onClick={() => {
                    const nextHist = [...choiceHistory, { key: ch.key, label: ch.label }];
                    setChoiceHistory(nextHist);
                    let nextInv = inventory;
                    if (ch.key === 'B' && !inventory.includes('고대 문양 탁본')) {
                      nextInv = [...inventory, '고대 문양 탁본'];
                      setInventory(nextInv);
                    }
                    const target =
                      (ch.nextCardId && cards.find((c) => c.id === ch.nextCardId)) ||
                      cards.find((c) => c.type === 'dialogue' && c.id !== activePreviewCard?.id);
                    advancePreviewToCard(target, nextHist, nextInv);
                  }}
                  className="bs-animate-toast w-full px-4 py-3 rounded-xl bg-white text-[#1B1B1F] text-left text-xs font-semibold transition-all hover:ring-2 hover:ring-[#9A8FE6]"
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
                  const curIdx = cards.findIndex((c) => c.id === activePreviewCard?.id);
                  const nextCard = curIdx >= 0 && curIdx + 1 < cards.length ? cards[curIdx + 1] : cards[0];
                  advancePreviewToCard(nextCard);
                }
              }}
              className="max-w-3xl w-full mx-auto rounded-2xl border border-[#5B4CC4] bg-[#1A1828]/90 p-5 flex flex-col gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#6A5ACD]/40" />
                <span className="text-sm font-bold">
                  {activePreviewCard?.speaker || activePreviewCard?.title || '화자'}
                </span>
              </div>
              <p className="text-xs text-white/90 min-h-[20px]">
                {previewDialogueText.slice(0, typedCount)}
                {typedCount < previewDialogueText.length && <span className="animate-pulse">|</span>}
              </p>
              <div className="text-right text-xs text-white/60">
                {typedCount < previewDialogueText.length ? (
                  '클릭해 모두 보기'
                ) : (
                  <span className="animate-pulse">다음 ▾</span>
                )}
              </div>
            </div>
          </div>

          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 text-xs">
            <div className="text-sm font-bold">진행 상태</div>
            <div>
              <div className="text-[11px] text-[#8A8998]">현재 카드</div>
              <div className="flex justify-between py-1.5 border-b border-[#F0EEF7] dark:border-[#2A2938]">
                <span>이름</span>
                <span className="font-semibold">{activePreviewCard?.title || '이벤트'}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#8A8998]">선택 기록</div>
              {choiceHistory.length === 0 ? (
                <div className="py-1.5 text-[#8A8998]">아직 선택한 항목이 없습니다</div>
              ) : (
                <div className="flex flex-col divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
                  {choiceHistory.map((h, i) => (
                    <div key={i} className="bs-animate-page flex justify-between py-1.5">
                      <span className="truncate max-w-[170px]">{h.label}</span>
                      <span className="font-semibold text-[#6A5ACD]">{h.key}</span>
                    </div>
                  ))}
                </div>
              )}
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
                      className="bs-animate-fade px-2 py-0.5 rounded-md bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] text-[11px] font-semibold"
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

          <div data-export-root="true" className="relative min-w-[820px] min-h-[540px]">
            {/* Auto Orthogonal Connectors + Choice Branch Connectors SVG (§6-7) */}
            <svg className="absolute inset-0 w-full h-full">
              {cards.slice(0, -1).map((c, idx) => {
                const next = cards[idx + 1];
                const cx = (liveDragCard?.id === c.id ? liveDragCard.x : c.x) + 105;
                const cy = (liveDragCard?.id === c.id ? liveDragCard.y : c.y) + 46;
                const nx = (liveDragCard?.id === next.id ? liveDragCard.x : next.x) + 105;
                const ny = (liveDragCard?.id === next.id ? liveDragCard.y : next.y) + 46;
                const midX = (cx + nx) / 2;
                const dPath = `M ${cx} ${cy} L ${midX} ${cy} L ${midX} ${ny} L ${nx} ${ny}`;
                return (
                  <g
                    key={`conn-${c.id}-${next.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement)?.getBoundingClientRect();
                      if (rect) {
                        setLineLockTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        window.setTimeout(() => setLineLockTip(null), 1800);
                      }
                    }}
                    className="cursor-not-allowed"
                  >
                    <path d={dPath} fill="none" stroke="transparent" strokeWidth="10" />
                    <path d={dPath} fill="none" stroke="#B6ACEA" strokeWidth="1.8" />
                  </g>
                );
              })}

              {/* Branch Connectors from Choice options to their target nextCardId */}
              {cards
                .filter((c) => c.type === 'choice' && c.choices?.length)
                .flatMap((choiceCard) =>
                  (choiceCard.choices || [])
                    .filter((ch) => Boolean(ch.nextCardId))
                    .map((ch) => {
                      const target = cards.find((t) => t.id === ch.nextCardId);
                      if (!target) return null;
                      const cx =
                        (liveDragCard?.id === choiceCard.id ? liveDragCard.x : choiceCard.x) + 210;
                      const cy =
                        (liveDragCard?.id === choiceCard.id ? liveDragCard.y : choiceCard.y) + 65;
                      const tx = liveDragCard?.id === target.id ? liveDragCard.x : target.x;
                      const ty =
                        (liveDragCard?.id === target.id ? liveDragCard.y : target.y) + 38;
                      const mx = (cx + tx) / 2;
                      return (
                        <g key={`branch-${choiceCard.id}-${ch.id}-${target.id}`}>
                          <path
                            d={`M ${cx} ${cy} C ${mx} ${cy}, ${mx} ${ty}, ${tx} ${ty}`}
                            fill="none"
                            stroke="#6A5ACD"
                            strokeWidth="1.8"
                            strokeDasharray="4 3"
                            className="bs-animate-draw"
                          />
                          <text
                            x={mx}
                            y={(cy + ty) / 2 - 4}
                            fontSize="10"
                            fontWeight="700"
                            fill="#6A5ACD"
                          >
                            {ch.key}
                          </text>
                        </g>
                      );
                    })
                )}
            </svg>

            {lineLockTip && (
              <div
                style={{ left: lineLockTip.x, top: lineLockTip.y - 28 }}
                className="bs-animate-popover absolute z-40 px-2.5 py-1 rounded-lg bg-[#1B1B1F] text-white text-[10.5px] font-semibold pointer-events-none shadow-lg"
              >
                연결선은 자동으로 배치됩니다
              </div>
            )}

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

                {selected.type === 'choice' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#8A8998]">
                        선택지 및 다음 대사 연결
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = selected.choices || [];
                          const nextKey = String.fromCharCode(65 + list.length);
                          const nextChoices: DialogueChoiceItem[] = [
                            ...list,
                            {
                              id: `ch-${Date.now()}`,
                              key: nextKey,
                              label: `선택지 ${nextKey}`,
                            },
                          ];
                          persist(
                            cards.map((c) =>
                              c.id === selected.id ? { ...c, choices: nextChoices } : c
                            )
                          );
                        }}
                        className="text-[#6A5ACD] font-semibold inline-flex items-center gap-0.5 hover:underline"
                      >
                        <Plus className="w-3 h-3" />
                        추가
                      </button>
                    </div>
                    {(selected.choices || []).map((ch, idx) => (
                      <div
                        key={ch.id}
                        className="p-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-[#FAF9FE] dark:bg-[#1E1E29] flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#6A5ACD] w-4">{ch.key}</span>
                          <input
                            type="text"
                            value={ch.label}
                            onChange={(e) => {
                              const nextChoices = (selected.choices || []).map((item, i) =>
                                i === idx ? { ...item, label: e.target.value } : item
                              );
                              persist(
                                cards.map((c) =>
                                  c.id === selected.id ? { ...c, choices: nextChoices } : c
                                )
                              );
                            }}
                            className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextChoices = (selected.choices || []).filter(
                                (_, i) => i !== idx
                              );
                              persist(
                                cards.map((c) =>
                                  c.id === selected.id ? { ...c, choices: nextChoices } : c
                                )
                              );
                            }}
                            className="text-[#8A8998] hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="text-[#8A8998]">다음 대사</span>
                          <select
                            value={ch.nextCardId || ''}
                            onChange={(e) => {
                              const nextChoices = (selected.choices || []).map((item, i) =>
                                i === idx
                                  ? { ...item, nextCardId: e.target.value || undefined }
                                  : item
                              );
                              persist(
                                cards.map((c) =>
                                  c.id === selected.id ? { ...c, choices: nextChoices } : c
                                )
                              );
                            }}
                            className="w-36 h-6 px-1.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-[11px]"
                          >
                            <option value="">순차 진행</option>
                            {cards
                              .filter((c) => c.id !== selected.id)
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.speaker ? `${c.speaker}: ${c.title}` : c.title}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selected.type === 'event' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#8A8998]">발동 조건</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextConds = [...(selected.conditions || []), '새 조건'];
                          persist(
                            cards.map((c) =>
                              c.id === selected.id ? { ...c, conditions: nextConds } : c
                            )
                          );
                        }}
                        className="text-[#6A5ACD] font-semibold hover:underline"
                      >
                        + 조건
                      </button>
                    </div>
                    {(selected.conditions || []).map((cond, ci) => (
                      <div key={ci} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={cond}
                          onChange={(e) => {
                            const nextConds = (selected.conditions || []).map((v, i) =>
                              i === ci ? e.target.value : v
                            );
                            persist(
                              cards.map((c) =>
                                c.id === selected.id ? { ...c, conditions: nextConds } : c
                              )
                            );
                          }}
                          className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextConds = (selected.conditions || []).filter(
                              (_, i) => i !== ci
                            );
                            persist(
                              cards.map((c) =>
                                c.id === selected.id ? { ...c, conditions: nextConds } : c
                              )
                            );
                          }}
                          className="text-[#8A8998] hover:text-rose-500 px-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-[#8A8998]">이벤트 결과</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextRes = [...(selected.results || []), '아이템 획득'];
                          persist(
                            cards.map((c) =>
                              c.id === selected.id ? { ...c, results: nextRes } : c
                            )
                          );
                        }}
                        className="text-[#6A5ACD] font-semibold hover:underline"
                      >
                        + 결과
                      </button>
                    </div>
                    {(selected.results || []).map((res, ri) => (
                      <div key={ri} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={res}
                          onChange={(e) => {
                            const nextRes = (selected.results || []).map((v, i) =>
                              i === ri ? e.target.value : v
                            );
                            persist(
                              cards.map((c) =>
                                c.id === selected.id ? { ...c, results: nextRes } : c
                              )
                            );
                          }}
                          className="flex-1 h-7 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nextRes = (selected.results || []).filter((_, i) => i !== ri);
                            persist(
                              cards.map((c) =>
                                c.id === selected.id ? { ...c, results: nextRes } : c
                              )
                            );
                          }}
                          className="text-[#8A8998] hover:text-rose-500 px-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
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
