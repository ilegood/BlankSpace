import React, { useState, useRef } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Film,
  Music,
  Bookmark,
  Upload,
  Link as LinkIcon,
  Check,
} from 'lucide-react';

export type MediaTabType = 'image' | 'youtube' | 'video-audio' | 'link-card';

interface InsertMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (src: string, alt?: string) => void;
  onInsertYoutube: (url: string) => void;
  onInsertVideoAudio: (type: 'video' | 'audio', src: string) => void;
  onInsertLinkCard: (card: { url: string; title: string; description?: string }) => void;
}

export const InsertMediaModal: React.FC<InsertMediaModalProps> = ({
  isOpen,
  onClose,
  onInsertImage,
  onInsertYoutube,
  onInsertVideoAudio,
  onInsertLinkCard,
}) => {
  const [activeTab, setActiveTab] = useState<MediaTabType>('image');

  // Image tab states
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // YouTube tab states
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Video / Audio tab states
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [mediaSrc, setMediaSrc] = useState('');
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Link card tab states
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDesc, setLinkDesc] = useState('');

  if (!isOpen) return null;

  // Handle local image / GIF file upload
  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        if (!imageAlt) {
          setImageAlt(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local video / audio file upload
  const handleLocalMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmInsert = () => {
    switch (activeTab) {
      case 'image':
        if (imageUrl.trim()) {
          onInsertImage(imageUrl.trim(), imageAlt.trim());
          onClose();
        }
        break;
      case 'youtube':
        if (youtubeUrl.trim()) {
          onInsertYoutube(youtubeUrl.trim());
          onClose();
        }
        break;
      case 'video-audio':
        if (mediaSrc.trim()) {
          onInsertVideoAudio(mediaType, mediaSrc.trim());
          onClose();
        }
        break;
      case 'link-card':
        if (linkUrl.trim()) {
          onInsertLinkCard({
            url: linkUrl.trim(),
            title: linkTitle.trim() || linkUrl.trim(),
            description: linkDesc.trim() || undefined,
          });
          onClose();
        }
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#292936] rounded-3xl w-full max-w-lg shadow-xl border border-slate-100 dark:border-[#3A3948] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#3A3948] flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-[#E8E7EF]">미디어 & 외부 링크 삽입</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#1E1E27] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 dark:border-[#3A3948] bg-slate-50/70 dark:bg-[#1E1E27]/70 p-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'image'
                ? 'bg-white dark:bg-[#292936] text-lavender-700 dark:text-lavender-300 shadow-2xs border border-slate-200 dark:border-[#3A3948]'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-white/60 dark:hover:bg-[#292936]/40'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>이미지 / GIF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'youtube'
                ? 'bg-white dark:bg-[#292936] text-rose-600 dark:text-rose-400 shadow-2xs border border-slate-200 dark:border-[#3A3948]'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-white/60 dark:hover:bg-[#292936]/40'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>YouTube 영상</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video-audio')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'video-audio'
                ? 'bg-white dark:bg-[#292936] text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-[#3A3948]'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-white/60 dark:hover:bg-[#292936]/40'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>영상 / 오디오</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('link-card')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'link-card'
                ? 'bg-white dark:bg-[#292936] text-emerald-600 dark:text-emerald-400 shadow-2xs border border-slate-200 dark:border-[#3A3948]'
                : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-white/60 dark:hover:bg-[#292936]/40'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>외부 링크 (카드)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 text-xs flex flex-col gap-4">
          {/* 1. Image / GIF */}
          {activeTab === 'image' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">이미지 또는 GIF URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/character.gif"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-lavender-500 bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF]"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 dark:text-[#A5A3B5] font-medium text-[11px]">또는 로컬 파일:</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.gif"
                  onChange={handleLocalImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-700 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#1E1E27] transition-colors font-medium text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5]" />
                  <span>내 컴퓨터에서 이미지 선택</span>
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">대체 텍스트 (설명)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="이미지에 대한 설명 (선택사항)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-lavender-500 bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF]"
                />
              </div>

              {imageUrl && (
                <div className="mt-1 flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5] mb-1">미리보기</span>
                  <div className="max-h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#1E1E27] p-1 flex items-center justify-center">
                    <img src={imageUrl} alt="preview" className="max-h-32 object-contain rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. YouTube */}
          {activeTab === 'youtube' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">
                  YouTube 동영상 URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... 또는 https://youtu.be/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-rose-400 bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF]"
                />
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-3 text-rose-800 dark:text-rose-200 text-[11px] leading-relaxed">
                <p className="font-semibold mb-0.5">유튜브 영상 임베드 안내</p>
                YouTube 주소를 입력하면 문서 내에서 바로 재생할 수 있는 고해상도 반응형 플레이어가 생성됩니다.
              </div>
            </div>
          )}

          {/* 3. Video / Audio */}
          {activeTab === 'video-audio' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">미디어 종류</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaType('video')}
                    className={`flex-1 py-1.5 rounded-xl border text-center font-medium transition-colors ${
                      mediaType === 'video'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] text-slate-600 dark:text-[#A5A3B5]'
                    }`}
                  >
                    동영상 (Video MP4/WebM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaType('audio')}
                    className={`flex-1 py-1.5 rounded-xl border text-center font-medium transition-colors ${
                      mediaType === 'audio'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] text-slate-600 dark:text-[#A5A3B5]'
                    }`}
                  >
                    오디오 (Audio MP3/WAV)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">스트리밍 / 미디어 파일 URL</label>
                <input
                  type="text"
                  value={mediaSrc}
                  onChange={(e) => setMediaSrc(e.target.value)}
                  placeholder="https://example.com/media/clip.mp4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-indigo-500 bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF]"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 dark:text-[#A5A3B5] font-medium text-[11px]">또는 로컬 파일:</span>
                <input
                  type="file"
                  ref={mediaFileInputRef}
                  accept={mediaType === 'video' ? 'video/*' : 'audio/*'}
                  onChange={handleLocalMediaSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => mediaFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-700 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#1E1E27] transition-colors font-medium text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5]" />
                  <span>내 컴퓨터에서 미디어 선택</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Link Card */}
          {activeTab === 'link-card' && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">
                  외부 웹사이트 URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => {
                    const u = e.target.value;
                    setLinkUrl(u);
                    if (!linkTitle && u) {
                      try {
                        const parsed = new URL(u);
                        setLinkTitle(parsed.hostname);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  placeholder="https://github.com, https://store.steampowered.com/ 등"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-emerald-500 bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">카드 제목</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="예: Steam 스토어 페이지, 개발자 포럼 등"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-emerald-500 bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#E8E7EF] block mb-1">간단한 설명</label>
                <textarea
                  rows={2}
                  value={linkDesc}
                  onChange={(e) => setLinkDesc(e.target.value)}
                  placeholder="링크에 대한 간략한 요약이나 코멘트를 작성하세요."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-emerald-500 bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] placeholder-slate-400 dark:placeholder-[#A5A3B5]/50 resize-none"
                />
              </div>

              {/* Preview Link Card */}
              {linkUrl && (
                <div className="mt-1">
                  <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5] mb-1 block">링크 카드 미리보기:</span>
                  <div className="bg-slate-50 dark:bg-[#1E1E27] border border-slate-200 dark:border-[#3A3948] rounded-2xl p-3.5 flex flex-col gap-1.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-[#E8E7EF] text-xs truncate">
                        <span>🔗</span>
                        <span className="truncate">{linkTitle || linkUrl}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-[#7262A8] font-bold">↗</span>
                    </div>
                    {linkDesc && (
                      <p className="text-[11px] text-slate-500 dark:text-[#A5A3B5] line-clamp-2 pl-5.5">{linkDesc}</p>
                    )}
                    <div className="text-[10px] text-slate-400 dark:text-[#8E8B9E] font-medium truncate pl-5.5 flex items-center gap-1">
                      <span>🌐</span>
                      <span className="text-lavender-600 dark:text-[#B7A5FF] font-mono truncate">{linkUrl}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-[#1E1E27]/50 border-t border-slate-100 dark:border-[#3A3948] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-semibold text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100 dark:hover:bg-[#1E1E27]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirmInsert}
            className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-xs font-semibold text-white shadow-soft"
          >
            본문에 삽입
          </button>
        </div>
      </div>
    </div>
  );
};
