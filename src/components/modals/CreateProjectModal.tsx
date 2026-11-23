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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProject(name, description, coverColor);
    showToast(`'${name.trim()}' 프로젝트가 생성되었습니다`);
    setName('');
    setDescription('');
    setCoverColor(PASTEL_COLORS[0]);
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
            커버 색상
          </label>
          <div className="flex items-center gap-2.5">
            {PASTEL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setCoverColor(color)}
                className={`w-8 h-8 rounded-lg transition-all ${
                  coverColor === color
                    ? 'ring-2 ring-[#6A5ACD] ring-offset-2 dark:ring-offset-[#1E1E29]'
                    : 'opacity-85 hover:opacity-100'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
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
