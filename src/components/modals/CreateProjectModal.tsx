import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useToast } from '../toast/ToastContext';
import { ModalShell } from './ModalShell';

const PASTEL_COLORS = ['#D9D5F3', '#F5D5C6', '#D2E9DC', '#DCE6FA', '#F2DCF0'];

export const CreateProjectModal: React.FC = () => {
  const { isCreateProjectOpen, setIsCreateProjectOpen, createProject } = useWorkspace();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState(PASTEL_COLORS[0]);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject(name, description, coverColor, coverImage);
    showToast(`'${name.trim()}' 프로젝트가 생성되었습니다`);
    setName('');
    setDescription('');
    setCoverColor(PASTEL_COLORS[0]);
    setCoverImage(undefined);
    setIsCreateProjectOpen(false);
  };

  return (
    <ModalShell
      isOpen={isCreateProjectOpen}
      onClose={() => setIsCreateProjectOpen(false)}
      maxWidthClass="max-w-md"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE7F2] dark:border-[#2E2D3D]">
        <h2 className="text-[15px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">새 프로젝트</h2>
        <button
          type="button"
          onClick={() => setIsCreateProjectOpen(false)}
          className="p-1 rounded-lg text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1.5">
            프로젝트 이름
          </label>
          <input
            type="text"
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 게임 개발 프로젝트"
            className="w-full h-10 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C] text-sm text-[#1B1B1F] dark:text-[#F1F0F6] focus:outline-none focus:border-[#6A5ACD]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1.5">
            프로젝트 설명
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="프로젝트에 대한 간단한 설명"
            className="w-full h-10 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C] text-sm text-[#1B1B1F] dark:text-[#F1F0F6] focus:outline-none focus:border-[#6A5ACD]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-2">
            배너 색상 및 이미지
          </label>
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {PASTEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setCoverColor(color);
                    setCoverImage(undefined);
                  }}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    coverColor === color && !coverImage
                      ? 'ring-2 ring-[#6A5ACD] ring-offset-2 dark:ring-offset-[#1E1E29]'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <label className="px-3 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#6A5ACD] dark:text-[#9A8FE6] cursor-pointer hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845]">
              이미지 업로드
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => typeof r.result === 'string' && setCoverImage(r.result);
                  r.readAsDataURL(f);
                }}
                className="hidden"
              />
            </label>
          </div>
          {coverImage && (
            <div className="mt-2 relative h-20 rounded-xl overflow-hidden border border-[#E6E3F0] dark:border-[#323244]">
              <img src={coverImage} alt="배너 미리보기" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage(undefined)}
                className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px]"
              >
                제거
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsCreateProjectOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5 dark:hover:bg-white/5"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] text-white text-xs font-semibold"
          >
            프로젝트 만들기
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
