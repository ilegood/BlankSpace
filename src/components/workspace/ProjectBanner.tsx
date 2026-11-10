import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Project } from '../../types';

interface ProjectBannerProps {
  project: Project;
}

export const ProjectBanner: React.FC<ProjectBannerProps> = ({ project }) => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#292936] shadow-soft select-none transition-colors duration-200">
      {/* Background Cover Image with Gradient Overlay */}
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={project.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop'}
          alt={project.name}
          className="w-full h-full object-cover object-center"
        />
        {/* Soft Lavender / Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-lavender-900/40 via-lavender-500/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent dark:from-[#292936] dark:via-[#292936]/60 dark:to-transparent" />

        {/* Content over bottom left */}
        <div className="absolute bottom-5 left-6 flex items-center gap-4">
          <img
            src={project.avatarImage || project.coverImage}
            alt={project.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-[#3A3948] shadow-md shrink-0 bg-white dark:bg-[#292936]"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#E8E7EF] tracking-tight drop-shadow-sm">
              {project.name}
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#A5A3B5] mt-1 font-medium">
              {project.description || '창작 프로젝트 워크스페이스'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
