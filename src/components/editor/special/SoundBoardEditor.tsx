import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, X, Pencil } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { useLongPressSort } from '../../../hooks/useLongPressSort';

interface SoundItem {
  id: string;
  name: string;
  category: string;
  durationLabel: string;
  color: string;
  loop?: boolean;
  audioUrl?: string;
}

const DEFAULT_SOUNDS: SoundItem[] = [
  { id: 'sn-1', name: '사운드 1', category: '효과음', durationLabel: '0:03', color: '#6A5ACD' },
  { id: 'sn-2', name: '사운드 2', category: '배경음', durationLabel: '2:14', color: '#D97724', loop: true },
  { id: 'sn-3', name: '사운드 3', category: '보이스', durationLabel: '0:08', color: '#0F766E' },
  { id: 'sn-4', name: '사운드 4', category: '효과음', durationLabel: '0:02', color: '#6A5ACD' },
  { id: 'sn-5', name: '사운드 5', category: '배경음', durationLabel: '1:45', color: '#D97724' },
  { id: 'sn-6', name: '사운드 6', category: '보이스', durationLabel: '0:12', color: '#0F766E' },
  { id: 'sn-7', name: '사운드 7', category: '효과음', durationLabel: '0:01', color: '#6A5ACD' },
  { id: 'sn-8', name: '사운드 8', category: '배경음', durationLabel: '3:02', color: '#D97724' },
];

const ACCENT_COLORS = ['#6A5ACD', '#D97724', '#0F766E', '#1B1B1F'];

export const SoundBoardEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [sounds, setSounds] = useState<SoundItem[]>(DEFAULT_SOUNDS);
  const [catFilter, setCatFilter] = useState<string>('전체');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [volumeTooltipOpen, setVolumeTooltipOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<string>('효과음');
  const [newColor, setNewColor] = useState(ACCENT_COLORS[0]);
  const [newLoop, setNewLoop] = useState(false);
  const [newAudioUrl, setNewAudioUrl] = useState<string | undefined>();
  const [newDurationLabel, setNewDurationLabel] = useState('0:10');
  const [newFileName, setNewFileName] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const openEditSoundModal = (sound: SoundItem) => {
    setEditingSoundId(sound.id);
    setNewName(sound.name);
    setNewCat(sound.category);
    setNewColor(sound.color);
    setNewLoop(Boolean(sound.loop));
    setNewAudioUrl(sound.audioUrl);
    setNewDurationLabel(sound.durationLabel || '0:10');
    setNewFileName(sound.audioUrl ? '기존 오디오 파일' : '');
    setIsAddOpen(true);
  };

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.sounds)) {
          setSounds(parsed.sounds);
          return;
        }
      } catch {
        // ignore
      }
    }
    setSounds(DEFAULT_SOUNDS);
  }, [activePage?.id]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!isAddOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddOpen(false);
        setEditingSoundId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAddOpen]);

  const persist = (next: SoundItem[]) => {
    setSounds(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ sounds: next }) });
  };

  const playSynthPreview = (category: string, vol: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = category === '배경음' ? 'sine' : category === '보이스' ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(
        category === '배경음' ? 330 : category === '보이스' ? 440 : 587,
        ctx.currentTime
      );
      gain.gain.setValueAtTime(Math.max(0.01, (vol / 100) * 0.08), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // ignore audio context block
    }
  };

  const togglePlay = (sound: SoundItem) => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    audioRef.current?.pause();

    if (playingId === sound.id) {
      setPlayingId(null);
      setProgress(0);
      return;
    }

    setPlayingId(sound.id);
    setProgress(0);

    if (sound.audioUrl) {
      const audio = new Audio(sound.audioUrl);
      audio.volume = volume / 100;
      audio.loop = Boolean(sound.loop);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
      };
      audio.onended = () => {
        if (!sound.loop) {
          setPlayingId(null);
          setProgress(0);
        }
      };
    } else {
      playSynthPreview(sound.category, volume);
      timerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (sound.loop) return 0;
            if (timerRef.current) window.clearInterval(timerRef.current);
            setPlayingId(null);
            return 0;
          }
          return prev + 2.5;
        });
      }, 90);
    }
  };

  const sort = useLongPressSort({
    onReorder: (draggedId, targetId) => {
      const fromIdx = sounds.findIndex((s) => s.id === draggedId);
      const toIdx = sounds.findIndex((s) => s.id === targetId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      const copy = [...sounds];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      persist(copy);
    },
  });

  const dynamicCategories = [
    '전체',
    ...Array.from(new Set(['효과음', '배경음', '보이스', ...sounds.map((s) => s.category).filter(Boolean)])),
  ];

  const filtered = sounds.filter((s) => {
    if (catFilter !== '전체' && s.category !== catFilter) return false;
    if (search.trim() && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '사운드보드 (템플릿)' : activeDocument?.title || '사운드보드'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="design-sound-board"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside className="w-40 shrink-0 border-r border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-4 flex flex-col gap-1 overflow-y-auto">
          <div className="px-2 pb-1 text-[11px] font-semibold text-[#8A8998]">분류</div>
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCatFilter(cat)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors truncate ${
                catFilter === cat
                  ? 'bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] font-semibold'
                  : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </aside>

        <div
          data-export-root="true"
          className="flex-1 overflow-y-auto p-6 bg-[#FAF9FE] dark:bg-[#15151C]"
        >
          <div className="max-w-5xl mx-auto flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="사운드 검색"
                className="w-64 h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs"
              />
              <div className="flex items-center gap-3 text-xs text-[#6E6D7A] relative">
                <span>한 번에 하나씩만 재생됩니다</span>
                <span>볼륨</span>
                <div
                  className="relative flex items-center"
                  onMouseEnter={() => setVolumeTooltipOpen(true)}
                  onMouseLeave={() => setVolumeTooltipOpen(false)}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      if (audioRef.current) audioRef.current.volume = v / 100;
                    }}
                    className="w-24 accent-[#6A5ACD]"
                  />
                  {volumeTooltipOpen && (
                    <span className="bs-animate-popover absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#1B1B1F] text-white text-[10px] font-bold">
                      {volume}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {filtered.map((sound) => {
                const isPlaying = playingId === sound.id;
                const isDragging = sort.draggingId === sound.id;
                const isHover = sort.hoverTargetId === sound.id && sort.draggingId !== sound.id;
                return (
                  <div
                    key={sound.id}
                    data-sort-id={sound.id}
                    data-sort-kind="card"
                    onMouseDown={(e) => isEditMode && sort.startPress(e, sound.id, 'card')}
                    onClick={() => {
                      if (sort.wasDraggedRef.current) return;
                      togglePlay(sound);
                    }}
                    style={{ borderLeft: `4px solid ${sound.color}` }}
                    className={`bs-card-interactive rounded-2xl border bg-white dark:bg-[#1E1E29] p-4 cursor-pointer flex flex-col justify-between min-h-[88px] ${
                      isDragging ? 'opacity-40 scale-95' : ''
                    } ${isHover ? 'ring-2 ring-[#6A5ACD]' : ''} ${
                      isPlaying
                        ? 'border-[#6A5ACD] ring-1 ring-[#6A5ACD]/30'
                        : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                          {sound.name}
                        </div>
                        <div className="text-[11px] text-[#8A8998] mt-0.5">
                          {sound.durationLabel} · {sound.category}
                          {sound.loop ? ' · 반복' : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isPlaying ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#6A5ACD]">
                            <Square className="w-3 h-3 fill-[#6A5ACD]" /> 재생 중
                          </span>
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-[#1B1B1F] dark:fill-white" />
                        )}
                        {isEditMode && (
                          <>
                            <button
                              type="button"
                              title="사운드 수정"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditSoundModal(sound);
                              }}
                              className="p-0.5 text-[#8A8998] hover:text-[#6A5ACD]"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="사운드 삭제"
                              onClick={(e) => {
                                e.stopPropagation();
                                persist(sounds.filter((x) => x.id !== sound.id));
                              }}
                              className="p-0.5 text-[#8A8998] hover:text-rose-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isPlaying && (
                      <div className="mt-2 h-1.5 rounded-full bg-[#EBE8F5] dark:bg-[#2C2845] overflow-hidden">
                        <div
                          className="h-full bg-[#6A5ACD] transition-[width] duration-100 ease-linear"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {isEditMode && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSoundId(null);
                    setNewName('');
                    setNewCat('효과음');
                    setNewColor(ACCENT_COLORS[0]);
                    setNewLoop(false);
                    setNewFileName('');
                    setNewAudioUrl(undefined);
                    setNewDurationLabel('0:10');
                    setIsAddOpen(true);
                  }}
                  className="min-h-[88px] rounded-2xl border border-dashed border-[#DCD8EC] dark:border-[#323244] text-lg text-[#6A5ACD] hover:bg-[#F3F1FB]/50"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Sound Modal */}
      {isAddOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddOpen(false);
              setEditingSoundId(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4"
        >
          <div className="bs-animate-modal w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] shadow-2xl p-6 flex flex-col gap-3.5 text-xs">
            <h3 className="text-base font-bold">{editingSoundId ? '사운드 수정' : '사운드 추가'}</h3>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="사운드 이름"
              className="h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
            />
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] cursor-pointer font-semibold shrink-0">
                파일 선택
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setNewFileName(f.name);
                    if (!newName) setNewName(f.name.replace(/\.[^/.]+$/, ''));
                    const r = new FileReader();
                    r.onload = () => {
                      if (typeof r.result === 'string') {
                        const dataUrl = r.result;
                        setNewAudioUrl(dataUrl);
                        const tempAudio = new Audio(dataUrl);
                        tempAudio.onloadedmetadata = () => {
                          const sec = Math.max(1, Math.round(tempAudio.duration || 0));
                          const m = Math.floor(sec / 60);
                          const s = String(sec % 60).padStart(2, '0');
                          setNewDurationLabel(`${m}:${s}`);
                        };
                      }
                    };
                    r.readAsDataURL(f);
                  }}
                  className="hidden"
                />
              </label>
              <span className="text-[#8A8998] truncate">
                {newFileName ? `${newFileName} (${newDurationLabel})` : '선택된 파일 없음'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#8A8998]">분류 (직접 입력 또는 선택)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  placeholder="분류명 입력"
                  className="flex-1 h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
                />
                <select
                  value={dynamicCategories.includes(newCat) ? newCat : ''}
                  onChange={(e) => e.target.value && setNewCat(e.target.value)}
                  className="w-28 h-9 px-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C]"
                >
                  <option value="">기존 분류</option>
                  {dynamicCategories
                    .filter((c) => c !== '전체')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-md ${newColor === c ? 'ring-2 ring-[#6A5ACD]' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <label className="flex items-center justify-between">
              <span>반복 재생</span>
              <input
                type="checkbox"
                checked={newLoop}
                onChange={(e) => setNewLoop(e.target.checked)}
                className="accent-[#6A5ACD]"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingSoundId(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#E6E3F0]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newName.trim()) return;
                  const record: SoundItem = {
                    id: editingSoundId || `sn-${Date.now()}`,
                    name: newName.trim(),
                    category: newCat.trim() || '효과음',
                    durationLabel: newDurationLabel || '0:10',
                    color: newColor,
                    loop: newLoop,
                    audioUrl: newAudioUrl,
                  };
                  if (editingSoundId) {
                    persist(sounds.map((s) => (s.id === editingSoundId ? record : s)));
                  } else {
                    persist([...sounds, record]);
                  }
                  setIsAddOpen(false);
                  setEditingSoundId(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#6A5ACD] text-white font-semibold"
              >
                {editingSoundId ? '저장' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
