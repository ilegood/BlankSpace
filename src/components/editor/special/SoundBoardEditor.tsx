import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit2,
  Music,
  Radio,
  Mic,
  Wind,
  Search,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export type SoundTag = 'bgm' | 'sfx' | 'voice' | 'ambient';

export interface SoundItem {
  id: string;
  title: string;
  tag: SoundTag;
  audioUrl: string;
  description: string;
  triggerEvent?: string; // e.g. "보스전 2페이즈 시작 시"
  duration?: string; // e.g. "02:45"
}

export const SOUND_TAG_CONFIG: Record<
  SoundTag,
  { name: string; icon: React.ElementType; color: string; bg: string; badge: string }
> = {
  bgm: { name: '배경음 (BGM)', icon: Music, color: 'text-indigo-600', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
  sfx: { name: '효과음 (SFX)', icon: Radio, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  voice: { name: '캐릭터 보이스', icon: Mic, color: 'text-rose-600', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700' },
  ambient: { name: '환경음 (Ambient)', icon: Wind, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
};

const SAMPLE_SOUNDS: SoundItem[] = [
  {
    id: 'snd-1',
    title: '성당의 황혼 (Twilight of Cathedral)',
    tag: 'bgm',
    audioUrl: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
    description: '오르간과 현악기가 어우러진 웅장하고 성스러운 메인 로비 배경음악.',
    triggerEvent: '성당 맵 진입 시 루프 재생',
    duration: '01:30',
  },
  {
    id: 'snd-2',
    title: '검격 베기 타격음 (Sword Slash)',
    tag: 'sfx',
    audioUrl: 'https://cdn.freesound.org/previews/442/442903_9159316-lq.mp3',
    description: '단검 및 한손검 기본 평타 3연타 적중 사운드.',
    triggerEvent: '근접 공격 성공 시 1회 재생',
    duration: '00:02',
  },
  {
    id: 'snd-3',
    title: '동굴 속 물방울과 바람소리',
    tag: 'ambient',
    audioUrl: 'https://cdn.freesound.org/previews/518/518887_11234731-lq.mp3',
    description: '지하 던전의 음산하고 서늘한 분위기를 자아내는 환경 앰비언스.',
    triggerEvent: '지하 던전 및 미궁 지역 상시 재생',
    duration: '00:45',
  },
];

export const SoundBoardEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const listContainerRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!listContainerRef.current || !activeDocument) return;
    await exportElementAsPng(listContainerRef.current, {
      fileName: `${activeDocument.title}-사운드보드`,
    });
  };

  const [sounds, setSounds] = useState<SoundItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<SoundTag | 'all'>('all');

  // Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSoundId, setEditingSoundId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTag, setFormTag] = useState<SoundTag>('bgm');
  const [formAudioUrl, setFormAudioUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTrigger, setFormTrigger] = useState('');

  // Load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('[')) {
        const parsed = JSON.parse(activePage.content) as SoundItem[];
        setSounds(parsed);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse sound content:', e);
    }

    setSounds(SAMPLE_SOUNDS);
  }, [activePage?.id]);

  // Persist
  const persistSounds = (newSounds: SoundItem[]) => {
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(newSounds));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  // Audio element management
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setPlayingId(null);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayToggle = (sound: SoundItem) => {
    if (!audioRef.current) return;

    if (playingId === sound.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.pause();
      audioRef.current.src = sound.audioUrl;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => {
          setPlayingId(sound.id);
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
          alert('오디오를 재생할 수 없습니다. URL 및 네트워크를 확인하세요.');
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const openNewSoundModal = () => {
    setEditingSoundId(null);
    setFormTitle('');
    setFormTag('bgm');
    setFormAudioUrl('');
    setFormDescription('');
    setFormTrigger('');
    setIsModalOpen(true);
  };

  const openEditSoundModal = (snd: SoundItem) => {
    setEditingSoundId(snd.id);
    setFormTitle(snd.title);
    setFormTag(snd.tag);
    setFormAudioUrl(snd.audioUrl);
    setFormDescription(snd.description);
    setFormTrigger(snd.triggerEvent || '');
    setIsModalOpen(true);
  };

  const handleSaveSound = () => {
    if (!formTitle.trim() || !formAudioUrl.trim()) return;

    const soundData: SoundItem = {
      id: editingSoundId || `snd-${generateId()}`,
      title: formTitle.trim(),
      tag: formTag,
      audioUrl: formAudioUrl.trim(),
      description: formDescription.trim(),
      triggerEvent: formTrigger.trim() || undefined,
    };

    let updated: SoundItem[];
    if (editingSoundId) {
      updated = sounds.map((s) => (s.id === editingSoundId ? soundData : s));
    } else {
      updated = [soundData, ...sounds];
    }

    setSounds(updated);
    persistSounds(updated);
    setIsModalOpen(false);
  };

  const handleDeleteSound = (id: string) => {
    if (confirm('이 사운드 항목을 삭제하시겠습니까?')) {
      if (playingId === id && audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
      const updated = sounds.filter((s) => s.id !== id);
      setSounds(updated);
      persistSounds(updated);
    }
  };

  const filteredSounds = sounds.filter((s) => {
    const matchTag = selectedTag === 'all' || s.tag === selectedTag;
    const matchQuery =
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.triggerEvent && s.triggerEvent.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTag && matchQuery;
  });

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        onBeforeBack={() => {
          if (audioRef.current) audioRef.current.pause();
        }}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={openNewSoundModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>사운드 추가</span>
            </button>
          </div>
        }
      />

      {/* Filter and Volume Bar */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="사운드 제목, 설명, 트리거 상황 검색..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value as SoundTag | 'all')}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none py-0.5 cursor-pointer"
            >
              <option value="all">모든 사운드 분류</option>
              {Object.entries(SOUND_TAG_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Volume Slider */}
        <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-500 hover:text-slate-800"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-600" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setIsMuted(false);
              setVolume(Number(e.target.value));
            }}
            className="w-20 accent-lavender-600 cursor-pointer"
          />
          <span className="text-[11px] font-semibold text-slate-500 w-8">
            {isMuted ? '음소거' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>

      {/* Main Sound List */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto p-8 max-w-5xl w-full mx-auto bg-white">
        {filteredSounds.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3 mt-10">
            <div className="w-14 h-14 rounded-2xl bg-lavender-100 text-lavender-600 flex items-center justify-center">
              <Volume2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">등록된 오디오 리소스가 없습니다.</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              BGM, SFX, 캐릭터 보이스 등 게임의 음향 리소스를 추가하고 재생 상황을 기획해보세요.
            </p>
            <button
              onClick={openNewSoundModal}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-semibold shadow-soft"
            >
              <Plus className="w-4 h-4" />
              <span>첫 사운드 추가하기</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredSounds.map((snd) => {
              const tagConfig = SOUND_TAG_CONFIG[snd.tag] || SOUND_TAG_CONFIG.bgm;
              const TagIcon = tagConfig.icon;
              const isCurrentPlaying = playingId === snd.id;

              return (
                <div
                  key={snd.id}
                  className={`bg-white rounded-2xl border-2 p-4 transition-all flex flex-col gap-3 shadow-soft ${
                    isCurrentPlaying
                      ? 'border-lavender-500 ring-4 ring-lavender-100 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Play button + Title & Tag */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button
                        onClick={() => handlePlayToggle(snd)}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 transition-transform shadow-xs ${
                          isCurrentPlaying
                            ? 'bg-amber-500 hover:bg-amber-600 scale-105 animate-pulse'
                            : 'bg-lavender-600 hover:bg-lavender-700 hover:scale-102'
                        }`}
                      >
                        {isCurrentPlaying ? (
                          <Pause className="w-5 h-5 fill-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm truncate">{snd.title}</h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${tagConfig.badge} shrink-0`}
                          >
                            <TagIcon className="w-3 h-3" />
                            <span>{tagConfig.name.split(' ')[0]}</span>
                          </span>
                        </div>
                        {snd.description && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {snd.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditSoundModal(snd)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-lavender-600 hover:bg-lavender-50 transition-colors"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSound(snd.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Trigger event pill */}
                  {snd.triggerEvent && (
                    <div className="text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="font-bold text-slate-400 shrink-0">연출 / 재생 시점:</span>
                      <span className="truncate">{snd.triggerEvent}</span>
                    </div>
                  )}

                  {/* Active Play Progress Bar (Only visible when current is playing) */}
                  {isCurrentPlaying && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                      <span className="text-[10px] font-mono font-medium text-slate-400 w-10 text-right">
                        {formatSeconds(currentTime)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={audioDuration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 accent-lavender-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                      <span className="text-[10px] font-mono font-medium text-slate-400 w-10">
                        {formatSeconds(audioDuration)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Sound Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {editingSoundId ? '사운드 리소스 수정' : '새 사운드 리소스 추가'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  사운드 명칭 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="예: 보스전 오프닝 BGM, 피격 효과음"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">사운드 분류</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SOUND_TAG_CONFIG).map(([key, config]) => {
                    const isSelected = formTag === key;
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormTag(key as SoundTag)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-lavender-500 bg-lavender-50 ring-2 ring-lavender-200'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        <span className="font-medium text-slate-800 text-[11px]">{config.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  오디오 스트리밍 URL (.mp3, .wav, .ogg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formAudioUrl}
                  onChange={(e) => setFormAudioUrl(e.target.value)}
                  placeholder="https://example.com/audio/bgm_01.mp3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">사운드 설명</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="곡의 분위기나 악기 구성, 연출 의도를 입력하세요."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">트리거 상황 / 연출 시점</label>
                <input
                  type="text"
                  value={formTrigger}
                  onChange={(e) => setFormTrigger(e.target.value)}
                  placeholder="예: 플레이어 사망 시, 보스 2페이즈 변신 컷신"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveSound}
                disabled={!formTitle.trim() || !formAudioUrl.trim()}
                className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 disabled:opacity-50 text-xs font-semibold text-white shadow-soft"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

