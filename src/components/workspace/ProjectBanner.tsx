import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Project } from '../../types';

interface ProjectBannerProps {
  project: Project;
}

export const ProjectBanner: React.FC<ProjectBannerProps> = ({ project }) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#ECEEF3] bg-white shadow-soft">
      {/* Background Cover Image with Gradient Overlay */}
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={project.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop'}
          alt={project.name}
          className="w-full h-full object-cover object-center"
        />
        {/* Soft Lavender / White Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-lavender-900/40 via-lavender-500/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent" />

        {/* Top Right Options */}
        <button
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 text-slate-600 hover:text-slate-900 hover:bg-white shadow-soft transition-all"
          title="프로젝트 설정"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Content over bottom left */}
        <div className="absolute bottom-5 left-6 flex items-center gap-4">
          <img
            src={project.avatarImage || project.coverImage}
            alt={project.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight drop-shadow-sm">
              {project.name}
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {project.description || '창작 프로젝트 워크스페이스'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

