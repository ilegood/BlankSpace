import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

export const CustomAudioPlayer: React.FC<NodeViewProps> = ({ node }) => {
  const src = node.attrs.src as string;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Time format helper (mm:ss)
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // Autoplay policy or error fallback
      });
    }
  }, [isPlaying]);

  // Toggle mute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle seek range change
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const targetTime = Number(e.target.value);
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  // Extract clean file name or label from src
  const getAudioLabel = () => {
    if (!src) return '오디오 파일 없음';
    if (src.startsWith('data:')) return '녹음 / 첨부 오디오 트랙';
    try {
      const url = new URL(src);
      const pathname = url.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      return decodeURIComponent(filename) || '오디오 트랙';
    } catch {
      return '오디오 트랙';
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
    };
    const onEnded = () => {
      setIsPlaying(false);
      audio.currentTime = 0;
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <NodeViewWrapper className="my-4 max-w-xl mx-auto select-none" contentEditable={false}>
      {/* Hidden native HTML5 Audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Custom BlankSpace Styled Audio Player Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#252433] border border-slate-200/90 dark:border-[#3A3948] shadow-soft hover:shadow-md transition-all flex flex-col gap-3 group">
        {/* Top: Track Info & Mute Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center shrink-0">
              <Music className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs text-slate-800 dark:text-[#F3F2F8] truncate">
              {getAudioLabel()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? '음소거 해제' : '음소거'}
              className="p-1.5 rounded-lg text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#352E58] transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Middle: Controls & Interactive Seekbar */}
        <div className="flex items-center gap-3">
          {/* Circular Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? '일시정지' : '재생'}
            className="w-10 h-10 rounded-full bg-lavender-600 dark:bg-lavender-500 hover:bg-lavender-700 dark:hover:bg-lavender-400 text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Seekbar and Timeline */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="relative w-full flex items-center">
              {/* Visual Progress Track */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#352E58] overflow-hidden">
                <div
                  className="h-full bg-lavender-500 dark:bg-lavender-400 rounded-full transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Invisible native range input overlay for smooth interaction */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Timestamps */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-[#8E8B9E] font-medium px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : isLoaded ? '0:00' : '불러오는 중...'}</span>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

