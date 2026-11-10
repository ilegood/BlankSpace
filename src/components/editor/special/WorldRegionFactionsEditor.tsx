import React, { useState, useEffect, useRef } from 'react';
import {
  Castle,
  MapPin,
  Flag,
  Shield,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Download,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';

interface RegionItem {
  id: string;
  name: string;
  location: string;
  desc: string;
  imageUrl: string;
}

interface FactionItem {
  id: string;
  name: string;
  desc: string;
  symbol: string;
}

interface WorldRegionData {
  worldName: string;
  worldType: string;
  worldScale: string;
  worldSummary: string;
  regions: RegionItem[];
  factions: FactionItem[];
}

const DEFAULT_WORLD_DATA: WorldRegionData = {
  worldName: '에르제니아',
  worldType: '대륙형',
  worldScale: '3개 대륙, 1개 해역',
  worldSummary:
    '세계의 전반적인 개요를 작성하세요. 고대 문명의 유적과 정령의 축복이 깃든 판타지 대륙.',
  regions: [
    {
      id: 'reg-1',
      name: '예) 수도',
      location: '중앙 대륙',
      desc: '지역/장소의 설명을 입력하세요.',
      imageUrl:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 'reg-2',
      name: '예) 어둠의 숲',
      location: '북부 지역',
      desc: '지역/장소의 설명을 입력하세요.',
      imageUrl:
        'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 'reg-3',
      name: '예) 항구 도시',
      location: '남부 연안',
      desc: '지역/장소의 설명을 입력하세요.',
      imageUrl:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop',
    },
  ],
  factions: [
    {
      id: 'fac-1',
      name: '예) 에르젠 왕국',
      desc: '중앙 대륙의 인류 왕국',
      symbol: '❄️',
    },
    {
      id: 'fac-2',
      name: '예) 붉은 늑대단',
      desc: '전역에서 활동하는 용병 세력',
      symbol: '⚔️',
    },
  ],
};

export const WorldRegionFactionsEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'region' | 'nation' | 'faction'>('overview');
  const [data, setData] = useState<WorldRegionData>(DEFAULT_WORLD_DATA);

  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        setData({ ...DEFAULT_WORLD_DATA, ...parsed });
        return;
      }
    } catch {}
    setData(DEFAULT_WORLD_DATA);
  }, [activePage?.id]);

  const persistData = (next: WorldRegionData) => {
    setData(next);
    if (!activePage) return;
    setSaveStatus('saving');
    updatePageContent(activePage.id, JSON.stringify(next));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title}-지역및세력`,
    });
  };

  const handleAddRegion = () => {
    const name = prompt('새 지역/장소 명칭:');
    if (!name?.trim()) return;
    const location = prompt('위치 (예: 남부 연안):') || '미정';
    const newReg: RegionItem = {
      id: `reg-${Date.now()}`,
      name: name.trim(),
      location,
      desc: '지역에 대한 상세 설명',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
    };
    persistData({ ...data, regions: [...data.regions, newReg] });
  };

  const handleAddFaction = () => {
    const name = prompt('새 국가/세력 명칭:');
    if (!name?.trim()) return;
    const desc = prompt('설명:') || '신규 세력 설명';
    const newFac: FactionItem = {
      id: `fac-${Date.now()}`,
      name: name.trim(),
      desc,
      symbol: '🛡️',
    };
    persistData({ ...data, factions: [...data.factions, newFac] });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
      />

      {/* Main 2-Column: Left Sidebar + Center Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-52 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Castle className="w-4 h-4 text-lavender-600" />
              <span>개요</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('region')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'region'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>지역 및 장소</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nation')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'nation'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Flag className="w-4 h-4 text-slate-400" />
              <span>국가</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faction')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'faction'
                  ? 'bg-lavender-100 text-lavender-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>세력 및 조직</span>
            </button>
          </div>
        </div>

        {/* Center Main Stage */}
        <div
          ref={printRef}
          className="flex-1 bg-white overflow-y-auto p-6 flex flex-col gap-5"
        >
          {/* Header Banner (Castle theme matched to example image) */}
          <div className="relative rounded-2xl p-5 border border-lavender-200 bg-gradient-to-r from-lavender-100/70 via-purple-50/50 to-white overflow-hidden flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3.5 z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/80 backdrop-blur-xs border border-lavender-200 flex items-center justify-center shadow-xs">
                <Castle className="w-6 h-6 text-lavender-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  지역 및 장소 · 국가 및 세력
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  세계의 지역, 주요 장소, 국가와 세력의 정보를 정리합니다.
                </p>
              </div>
            </div>

            {/* Castle silhouette illustration in background */}
            <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center pr-6">
              <Castle className="w-32 h-32 text-lavender-700" />
            </div>
          </div>

          {/* 3-Column Grid: World Overview / Major Regions / Nations & Factions */}
          <div className="grid grid-cols-12 gap-5 items-start">
            {/* 1. World Overview (Cols 3.5) */}
            <div className="col-span-12 lg:col-span-3 border border-slate-200 rounded-2xl p-4 bg-white flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-lavender-600" />
                <h3 className="text-xs font-bold text-slate-800">세계 개요</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                세계의 규모, 구조, 주요 지역의 특징을 요약합니다.
              </p>

              <div className="flex flex-col gap-2.5 text-xs pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    세계명
                  </span>
                  <input
                    type="text"
                    value={data.worldName}
                    onChange={(e) =>
                      persistData({ ...data, worldName: e.target.value })
                    }
                    placeholder="세계명을 입력하세요"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-lavender-500 !bg-white"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    세계 형태
                  </span>
                  <select
                    value={data.worldType}
                    onChange={(e) =>
                      persistData({ ...data, worldType: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-lavender-500 !bg-white"
                  >
                    <option value="대륙형">예) 대륙형</option>
                    <option value="군도형">군도형 (수많은 섬)</option>
                    <option value="부유도형">부유도형 (공중 대륙)</option>
                    <option value="행성형">행성/우주형</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    규모
                  </span>
                  <input
                    type="text"
                    value={data.worldScale}
                    onChange={(e) =>
                      persistData({ ...data, worldScale: e.target.value })
                    }
                    placeholder="예) 대륙 수, 면적"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-lavender-500 !bg-white"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    간단한 설명
                  </span>
                  <textarea
                    rows={4}
                    value={data.worldSummary}
                    onChange={(e) =>
                      persistData({ ...data, worldSummary: e.target.value })
                    }
                    placeholder="세계의 전반적인 개요를 작성하세요."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-lavender-500 resize-none leading-relaxed !bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Major Regions & Places (Cols 6) */}
            <div className="col-span-12 lg:col-span-6 border border-slate-200 rounded-2xl p-4 bg-white flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-lavender-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  주요 지역/장소
                </h3>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.regions.map((reg) => (
                  <div
                    key={reg.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-lavender-400 transition-colors flex flex-col group"
                  >
                    <div className="h-24 bg-slate-100 overflow-hidden relative">
                      <img
                        src={reg.imageUrl}
                        alt={reg.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2.5 flex flex-col gap-1 flex-1">
                      <div className="font-bold text-xs text-slate-800 truncate">
                        {reg.name}
                      </div>
                      <div className="flex items-center gap-1 text-[10.5px] text-lavender-600">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{reg.location}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                        {reg.desc}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add Region Button Card */}
                <button
                  type="button"
                  onClick={handleAddRegion}
                  className="min-h-[140px] border-2 border-dashed border-slate-200 hover:border-lavender-400 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-lavender-600 transition-colors bg-slate-50/50 hover:bg-lavender-50/20"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs font-semibold">지역/장소 추가</span>
                </button>
              </div>
            </div>

            {/* 3. Nations & Factions (Cols 3) */}
            <div className="col-span-12 lg:col-span-3 border border-slate-200 rounded-2xl p-4 bg-white flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Flag className="w-4 h-4 text-lavender-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  국가 및 세력
                </h3>
              </div>

              {/* Faction Item List */}
              <div className="flex flex-col gap-2.5">
                {data.factions.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-lavender-300 transition-all flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-lavender-100 border border-lavender-200 flex items-center justify-center text-base shrink-0 shadow-2xs">
                      {fac.symbol}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {fac.name}
                      </div>
                      <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        {fac.desc}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Faction Button */}
                <button
                  type="button"
                  onClick={handleAddFaction}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-lavender-400 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-lavender-600 transition-colors bg-slate-50/40 hover:bg-lavender-50/20 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>국가/세력 추가</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
