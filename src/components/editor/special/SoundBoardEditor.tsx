import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Check,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface SoundTrack {
  id: string;
  fileName: string;
  type: string;
  duration: string;
  durationSec: number;
  isLoop: boolean;
  description: string;
  tags: string[];
}

const DEFAULT_SOUND_TRACKS: SoundTrack[] = [
  {
    id: 's-1',
    fileName: 'Town_Day.ogg',
    type: 'BGM',
    duration: '02:34',
    durationSec: 154,
    isLoop: true,
    description: '마을의 평화로운 낮',
    tags: ['마을', '일상'],
  },
  {
    id: 's-2',
    fileName: 'Town_Night.ogg',
    type: 'BGM',
    duration: '02:48',
    durationSec: 168,
    isLoop: true,
    description: '마을의 조용한 밤',
    tags: ['마을', '밤'],
  },
  {
    id: 's-3',
    fileName: 'Dungeon.ogg',
    type: 'BGM',
    duration: '03:12',
    durationSec: 192,
    isLoop: true,
    description: '던전 탐험 테마',
    tags: ['던전'],
  },
  {
    id: 's-4',
    fileName: 'Item_Get.wav',
    type: 'SFX',
    duration: '00:01',
    durationSec: 1,
    isLoop: false,
    description: '아이템 획득 효과음',
    tags: ['UI'],
  },
  {
    id: 's-5',
    fileName: 'Door_Open.wav',
    type: 'SFX',
    duration: '00:02',
    durationSec: 2,
    isLoop: false,
    description: '문 여는 소리',
    tags: ['환경'],
  },
];

// Generate fake realistic waveform heights (0 to 100)
const WAVEFORM_BARS = [
  15, 25, 45, 30, 60, 80, 50, 70, 95, 80, 65, 40, 55, 75, 90, 85, 60, 45, 30,
  50, 70, 85, 100, 75, 60, 40, 55, 70, 85, 60, 45, 30, 20, 35, 50, 70, 85, 65,
  50, 40, 60, 80, 90, 75, 60, 45, 30, 50, 70, 85, 60, 40, 25, 35, 50, 65, 80,
  70, 55, 40, 25, 15,
];

export const SoundBoardEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { customPrompt, success } = useToast();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState('bgm');
  const [categories, setCategories] = useState([
    { id: 'bgm', name: 'BGM' },
    { id: 'sfx', name: '효과음 (SFX)' },
    { id: 'ui', name: 'UI' },
    { id: 'voice', name: '음성 (보이스)' },
    { id: 'ambience', name: '환경음 (앰비언스)' },
  ]);

  const [tracks, setTracks] = useState<SoundTrack[]>(DEFAULT_SOUND_TRACKS);
  const [currentTrackId, setCurrentTrackId] = useState<string>('s-1');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const currentTrack =
    tracks.find((t) => t.id === currentTrackId) || tracks[0];

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.tracks) setTracks(parsed.tracks);
        if (parsed.categories) setCategories(parsed.categories);
        return;
      }
    } catch {}
    setTracks(DEFAULT_SOUND_TRACKS);
  }, [activePage?.id]);

  const persistData = (newTracks: SoundTrack[], newCats = categories) => {
    setTracks(newTracks);
    setCategories(newCats);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(
      activePage.id,
      JSON.stringify({ tracks: newTracks, categories: newCats })
    );
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  // Playback timer simulation
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setPlaybackSeconds((prev) => {
        if (prev >= currentTrack.durationSec) {
          if (currentTrack.isLoop) return 0;
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, currentTrack]);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-사운드보드`,
    });
  };

  const handleToggleLoop = (trackId: string) => {
    const updated = tracks.map((t) =>
      t.id === trackId ? { ...t, isLoop: !t.isLoop } : t
    );
    persistData(updated);
  };

  const handleAddTrack = async () => {
    const fileName = await customPrompt({
      title: '트랙 추가',
      message: '추가할 사운드 파일명을 입력하세요:',
      placeholder: '예: Battle_BGM.ogg, Skill_Slash.wav',
      defaultValue: 'New_Sound.ogg',
      confirmText: '추가',
    });
    if (!fileName?.trim()) return;
    const newTrack: SoundTrack = {
      id: `s-${Date.now()}`,
      fileName: fileName.trim(),
      type: 'BGM',
      duration: '02:15',
      durationSec: 135,
      isLoop: true,
      description: '새 사운드 트랙',
      tags: ['신규'],
    };
    persistData([newTrack, ...tracks]);
    success('트랙 추가됨', `'${fileName.trim()}' 트랙이 추가되었습니다.`);
  };

  const handleAddCategory = async () => {
    const name = await customPrompt({
      title: '새 카테고리 추가',
      message: '생성할 사운드 카테고리 이름을 입력하세요:',
      placeholder: '예: 전투 효과음, 인터랙션',
      confirmText: '추가',
    });
    if (!name?.trim()) return;
    const newCat = { id: `cat-${Date.now()}`, name: name.trim() };
    const nextCats = [...categories, newCat];
    persistData(tracks, nextCats);
    setActiveCategory(newCat.id);
    success('카테고리 추가됨', `'${name.trim()}' 카테고리가 추가되었습니다.`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tracks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tracks.map((t) => t.id));
    }
  };

  // Calculate current playback progress percentage
  const progressRatio = currentTrack.durationSec > 0
    ? playbackSeconds / currentTrack.durationSec
    : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] dark:bg-[#17171D] relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <button
            type="button"
            onClick={handleAddTrack}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-lavender-500 hover:bg-lavender-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>파일 추가</span>
          </button>
        }
      />

      {/* Main 2-Column: Left Sidebar + Center Sound Board & Table */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Sound Category List */}
        <div className="w-52 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider">
              사운드 목록
            </span>
            <div className="flex flex-col gap-1 text-xs">
              {categories.map((c) => {
                const isActive = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left font-medium transition-all ${
                      isActive
                        ? 'bg-lavender-100 text-lavender-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Folder
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-lavender-600 fill-lavender-300'
                          : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleAddCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-lavender-600 hover:bg-lavender-50 rounded-xl transition-colors mt-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>카테고리 추가</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Main Stage */}
        <div
          ref={printRef}
          className="flex-1 bg-white overflow-auto p-6 flex flex-col gap-6"
        >
          {/* Top Audio Player Card (Town_Day) */}
          <div className="bg-[#FAFBFD] border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col gap-4">
            {/* Player Title & Tags */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">
                {currentTrack.description} ({currentTrack.fileName.replace(/\.[^/.]+$/, '')})
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 bg-lavender-100 text-lavender-700 rounded-lg text-xs font-semibold">
                  {currentTrack.type}
                </span>
                {currentTrack.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {currentTrack.isLoop && (
                  <span className="px-2.5 py-0.5 bg-lavender-50 text-lavender-600 border border-lavender-200 rounded-lg text-xs font-medium">
                    루프
                  </span>
                )}
              </div>
            </div>

            {/* Waveform Visualization + Big Play Button */}
            <div className="flex items-center gap-5 pt-1">
              {/* Big Purple Play Button */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-13 h-13 rounded-2xl bg-lavender-500 hover:bg-lavender-600 text-white flex items-center justify-center shadow-md shadow-lavender-200 transition-all shrink-0 hover:scale-105"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-white" />
                ) : (
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                )}
              </button>

              {/* Waveform Bars */}
              <div className="flex-1 flex items-center justify-between h-14 gap-1 px-2">
                {WAVEFORM_BARS.map((heightPercent, idx) => {
                  const barRatio = idx / WAVEFORM_BARS.length;
                  const isPassed = barRatio <= progressRatio;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setPlaybackSeconds(
                          Math.floor(barRatio * currentTrack.durationSec)
                        );
                      }}
                      style={{ height: `${Math.max(12, heightPercent * 0.52)}px` }}
                      className={`flex-1 min-w-[3px] max-w-[6px] rounded-full cursor-pointer transition-colors ${
                        isPassed
                          ? 'bg-lavender-500 hover:bg-lavender-600'
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Timers & Volume Slider */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="font-mono font-medium">
                {formatSec(playbackSeconds)} / {currentTrack.duration}
              </span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVolume((v) => (v === 0 ? 80 : 0))}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 accent-lavender-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                <button
                  type="button"
                  title="다운로드"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Table: Sound File Data */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
                <tr>
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === tracks.length && tracks.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-lavender-600 focus:ring-lavender-400 cursor-pointer !bg-white"
                    />
                  </th>
                  <th className="px-4 py-3">파일명</th>
                  <th className="px-4 py-3">유형</th>
                  <th className="px-4 py-3">길이</th>
                  <th className="px-4 py-3">루프</th>
                  <th className="px-4 py-3">설명</th>
                  <th className="px-4 py-3">태그</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tracks.map((track) => {
                  const isCurrent = currentTrackId === track.id;
                  const isChecked = selectedIds.includes(track.id);

                  return (
                    <tr
                      key={track.id}
                      onClick={() => {
                        setCurrentTrackId(track.id);
                        setPlaybackSeconds(0);
                      }}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isCurrent ? 'bg-lavender-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(track.id)}
                          className="rounded border-slate-300 text-lavender-600 focus:ring-lavender-400 cursor-pointer !bg-white"
                        />
                      </td>

                      {/* File Name with Play Button */}
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCurrent) {
                                setIsPlaying(!isPlaying);
                              } else {
                                setCurrentTrackId(track.id);
                                setPlaybackSeconds(0);
                                setIsPlaying(true);
                              }
                            }}
                            className={`p-1 rounded-full transition-colors ${
                              isCurrent && isPlaying
                                ? 'bg-lavender-500 text-white'
                                : 'text-slate-400 hover:text-lavender-600 hover:bg-slate-100'
                            }`}
                          >
                            {isCurrent && isPlaying ? (
                              <Pause className="w-3 h-3 fill-white" />
                            ) : (
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                            )}
                          </button>
                          <span>{track.fileName}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-600">
                          {track.type}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {track.duration}
                      </td>

                      {/* Loop Toggle */}
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleLoop(track.id)}
                          className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${
                            track.isLoop ? 'bg-lavender-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                              track.isLoop ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 text-slate-700">
                        {track.description}
                      </td>

                      {/* Tags */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {track.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
