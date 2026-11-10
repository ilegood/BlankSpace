import React from 'react';
import { MoreHorizontal, Folder, FileText, Trash2, Edit2, Calendar } from 'lucide-react';
import { Project } from '../../types';
import { useWorkspace } from '../../store/WorkspaceContext';
import { formatRelativeTime } from '../../utils/time';
import { toast, customConfirm } from '../toast/ToastContext';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { setActiveProject, folders, documents, deleteProject, renameProject } = useWorkspace();
  const [showMenu, setShowMenu] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState(project.name);

  // Count items inside this project
  const projectFolders = folders.filter((f) => f.projectId === project.id);
  const projectDocs = documents.filter((d) => d.projectId === project.id);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName.trim() !== project.name) {
      await renameProject(project.id, newName.trim());
      toast.success('이름 변경 완료', `'${newName.trim()}'으로 변경되었습니다.`);
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    const confirmed = await customConfirm({
      title: '프로젝트 삭제',
      message: `'${project.name}' 프로젝트를 삭제하시겠습니까? 내부의 모든 폴더와 문서가 영구히 삭제됩니다.`,
      confirmText: '프로젝트 삭제',
      isDanger: true,
    });

    if (confirmed) {
      await deleteProject(project.id);
      toast.success('프로젝트 삭제 완료', `'${project.name}' 프로젝트가 삭제되었습니다.`);
    }
  };

  return (
    <div
      onClick={() => setActiveProject(project.id)}
      className="group relative bg-white dark:bg-[#292936] border border-[#ECEEF3] dark:border-[#3A3948] rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-hover hover:border-lavender-300 dark:hover:border-[#A995F5] transition-all duration-200 cursor-pointer flex flex-col select-none"
    >
      {/* Cover Image Banner */}
      <div className="h-36 w-full relative overflow-hidden bg-slate-100 dark:bg-[#1E1E27]">
        <img
          src={project.coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop'}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

        {/* Thumbnail Avatar floating on bottom-left of cover */}
        <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
          <img
            src={project.avatarImage || project.coverImage}
            alt={project.name}
            className="w-10 h-10 rounded-xl object-cover border-2 border-white dark:border-[#292936] shadow-md bg-white dark:bg-[#292936]"
          />
        </div>

        {/* Top-right menu button */}
        <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 rounded-xl bg-white/80 dark:bg-[#292936]/80 hover:bg-white dark:hover:bg-[#292936] text-slate-700 dark:text-[#E8E7EF] shadow-sm transition-all"
            title="프로젝트 설정"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-9 w-36 bg-white dark:bg-[#292936] border border-slate-100 dark:border-[#3A3948] rounded-xl shadow-lg p-1.5 z-20 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setIsRenaming(true);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#1E1E27] transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5]" />
                <span>이름 변경</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>프로젝트 삭제</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {isRenaming ? (
            <form
              onSubmit={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="mb-1"
            >
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRenameSubmit}
                className="text-base font-bold text-slate-800 dark:text-[#E8E7EF] border-b-2 border-lavender-500 outline-none w-full pb-0.5 bg-white dark:bg-[#1E1E27] px-1"
              />
            </form>
          ) : (
            <h3 className="font-bold text-base text-slate-800 dark:text-[#E8E7EF] truncate group-hover:text-lavender-700 dark:group-hover:text-[#B7A5FF] transition-colors">
              {project.name}
            </h3>
          )}
          {project.description ? (
            <p className="text-xs text-slate-500 dark:text-[#A5A3B5] line-clamp-2 mt-1 leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-[#A5A3B5] italic mt-1">설명 없음</p>
          )}
        </div>

        {/* Card Footer: Counts & Date */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-[#A5A3B5] pt-3 border-t border-slate-100 dark:border-[#3A3948]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5]" />
              <span>{projectFolders.length}</span>
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5]" />
              <span>{projectDocs.length}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11.5px]">
            <Calendar className="w-3 h-3 text-slate-400 dark:text-[#A5A3B5]" />
            <span>{formatRelativeTime(project.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
