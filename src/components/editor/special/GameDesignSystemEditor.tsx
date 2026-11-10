import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Gamepad2,
  Heart,
  Sprout,
  Home,
  Feather,
  Plus,
  Bookmark,
  Share2,
  ChevronDown,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface GameSystemData {
  title: string;
  subTitle: string;
  coverImage: string;
  gameTitle: string;
  duration: string;
  genre: string;
  target: string;
  platform: string;
  players: string;
  intent: string;
  systems: { name: string; desc: string; icon: string }[];
}

const DEFAULT_DEATH_LAND: GameSystemData = {
  title: '게임 기획서',
  subTitle: '〈Death Land〉',
  coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  gameTitle: 'Death Land',
  duration: '약 12개월',
  genre: '소셜 라이프 시뮬레이션 (연애 요소 포함)',
  target: '스토리 중심 게임을 선호하는 유저',
  platform: 'PC / 웹',
  players: '싱글 플레이',
  intent: '죽음과 삶의 경계에 있는 세계에서, 다양한 존재들과의 교류를 통해 두 번째 삶을 살아가는 이야기를 그린다.',
  systems: [
    { name: '호감도 시스템', desc: '캐릭터와의 관계 형성', icon: 'heart' },
    { name: '생활 시스템', desc: '재배, 제작, 거래, 노동', icon: 'sprout' },
    { name: '마을 시스템', desc: '마을의 성장과 변화', icon: 'home' },
  ],
};

export const GameDesignSystemEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { success } = useToast();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeToc, setActiveToc] = useState<string>('overview');
  const [data, setData] = useState<GameSystemData>(DEFAULT_DEATH_LAND);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        setData({ ...DEFAULT_DEATH_LAND, ...parsed });
        return;
      }
    } catch {}
    setData(DEFAULT_DEATH_LAND);
  }, [activePage?.id]);

  const persistData = (next: GameSystemData) => {
    setData(next);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(next));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${data.gameTitle || '게임기획서'}-시스템기획`,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] dark:bg-[#17171D] relative overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader saveStatus={saveStatus} onExportImage={handleExportImage} />

      {/* Main 2-Column Layout: Left TOC + Center Document Sheet */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Document Table of Contents (문서 목차) */}
        <div className="w-60 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-500 px-1">문서 목차</span>
            <div className="flex flex-col gap-1 text-xs">
              <button
                onClick={() => setActiveToc('overview')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                  activeToc === 'overview'
                    ? 'bg-lavender-50 text-lavender-900 font-bold border border-lavender-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-lavender-600" />
                <span>개요</span>
              </button>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider block mb-1">
                  게임 기획
                </span>
                <div className="flex flex-col gap-0.5 pl-2 border-l border-slate-100">
                  {['기획 의도', '게임 정보', '핵심 재미', '플레이 흐름'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveToc(item)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-lavender-700 hover:bg-slate-50 text-left text-xs"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider block mb-1">
                  시스템 기획
                </span>
                <div className="flex flex-col gap-0.5 pl-2 border-l border-slate-100">
                  {['주요 시스템', '성장 시스템', '상호작용', '기타 시스템'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setActiveToc(item)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-lavender-700 hover:bg-slate-50 text-left text-xs"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => success('섹션 추가됨', '새 기획 섹션이 추가되었습니다.')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-[#3A3948] hover:border-lavender-400 dark:hover:border-lavender-500 text-slate-500 dark:text-[#A5A3B5] hover:text-lavender-700 dark:hover:text-lavender-400 text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>항목 추가</span>
          </button>
        </div>

        {/* Center: Game Design Document Canvas (Death Land Style) */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-[#F8FAFD]">
          <div
            ref={printRef}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-soft max-w-3xl w-full p-8 flex flex-col gap-8"
          >
            {/* Top Banner Header */}
            <div className="relative rounded-2xl overflow-hidden h-40 border border-slate-200 shadow-xs flex items-center justify-center text-white">
              <img
                src={data.coverImage}
                alt="cover"
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.65]"
              />
              <div className="relative z-10 text-center flex flex-col items-center gap-1">
                <h1 className="text-2xl font-black tracking-tight">{data.title}</h1>
                <p className="text-sm font-bold text-lavender-200">{data.subTitle}</p>
              </div>
            </div>

            {/* Section 1: 게임 개요 (Table) */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>1. 게임 개요</span>
              </h2>
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <th className="py-2.5 px-4 bg-slate-50 font-semibold text-slate-500 w-28 border-r border-slate-100">게임 제목</th>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{data.gameTitle}</td>
                      <th className="py-2.5 px-4 bg-slate-50 font-semibold text-slate-500 w-28 border-r border-l border-slate-100">개발 기간</th>
                      <td className="py-2.5 px-4 text-slate-700">{data.duration}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <th className="py-2.5 px-4 bg-slate-50 font-semibold text-slate-500 border-r border-slate-100">장르</th>
                      <td className="py-2.5 px-4 text-slate-700">{data.genre}</td>
                      <th className="py-2.5 px-4 bg-slate-50 font-semibold text-slate-500 border-r border-l border-slate-100">타깃층</th>
                      <td className="py-2.5 px-4 text-slate-700">{data.target}</td>
                    </tr>
                    <tr>
                      <th className="py-2.5 px-4 bg-slate-50 font-semibold text-slate-500 border-r border-slate-100">플랫폼</th>
                      <td className="py-2.5 px-4 text-slate-700">{data.platform}</td>
                      <th className="py-2.5 px-4 bg-slate-50 font-semibold text-slate-500 border-r border-l border-slate-100">플레이 인원</th>
                      <td className="py-2.5 px-4 text-slate-700">{data.players}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: 기획 의도 (Callout) */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>2. 기획 의도</span>
              </h2>
              <div className="bg-lavender-50/70 border border-lavender-200/80 rounded-2xl p-5 flex items-start gap-3.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-lavender-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Feather className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-800 font-semibold leading-relaxed pt-1.5">
                  {data.intent}
                </p>
              </div>
            </div>

            {/* Section 3: 핵심 시스템 (3 Cards) */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>3. 핵심 시스템</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.systems.map((sys, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft flex flex-col items-center text-center gap-2 hover:border-lavender-300 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-lavender-600 flex items-center justify-center mb-1">
                      {idx === 0 ? <Heart className="w-6 h-6" /> : idx === 1 ? <Sprout className="w-6 h-6" /> : <Home className="w-6 h-6" />}
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">{sys.name}</h3>
                    <p className="text-[11px] text-slate-500 leading-snug">{sys.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

