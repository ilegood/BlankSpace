import React, { useState } from 'react';
import {
  MapElement,
  TerritoryPolygon,
  MapElementType,
} from '../../../../types/mapFactions';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  MapPin,
  Flag,
  Shield,
  Compass,
  Pentagon,
  Copy,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface MapSidebarProps {
  elements: MapElement[];
  territories: TerritoryPolygon[];
  selectedElementId: string | null;
  selectedTerritoryId: string | null;
  isEditMode: boolean;
  onSelectElement: (id: string | null) => void;
  onSelectTerritory: (id: string | null) => void;
  onAddElement: (type: MapElementType) => void;
  onStartDrawingTerritory: () => void;
  onToggleElementVisibility: (id: string) => void;
  onToggleTerritoryVisibility: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDeleteTerritory: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onDuplicateTerritory: (id: string) => void;
}

export const MapSidebar: React.FC<MapSidebarProps> = ({
  elements,
  territories,
  selectedElementId,
  selectedTerritoryId,
  isEditMode,
  onSelectElement,
  onSelectTerritory,
  onAddElement,
  onStartDrawingTerritory,
  onToggleElementVisibility,
  onToggleTerritoryVisibility,
  onDeleteElement,
  onDeleteTerritory,
  onDuplicateElement,
  onDuplicateTerritory,
}) => {
  const { customConfirm, toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'elements' | 'territories'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | MapElementType>('all');
  const [isElementsCollapsed, setIsElementsCollapsed] = useState(false);
  const [isTerritoriesCollapsed, setIsTerritoriesCollapsed] = useState(false);

  // Icon helper
  const getElementIcon = (type: MapElementType) => {
    switch (type) {
      case 'country':
        return <Flag className="w-3.5 h-3.5 text-rose-500" />;
      case 'faction':
        return <Shield className="w-3.5 h-3.5 text-purple-500" />;
      case 'region':
        return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
      case 'location':
        return <Compass className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getElementBadge = (type: MapElementType) => {
    switch (type) {
      case 'country':
        return <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold">국가</span>;
      case 'faction':
        return <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 font-bold">세력</span>;
      case 'region':
        return <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold">지역</span>;
      case 'location':
        return <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold">장소</span>;
    }
  };

  const filteredElements = elements.filter((elem) => {
    const matchesQuery = !searchQuery || elem.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || elem.type === typeFilter;
    return matchesQuery && matchesType;
  });

  const filteredTerritories = territories.filter((terr) => {
    return !searchQuery || terr.name.toLowerCase().includes(searchQuery.toLowerCase()) || (terr.factionName && terr.factionName.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="w-72 bg-white dark:bg-[#1E1E27] border-r border-[#ECEEF3] dark:border-[#3A3948] flex flex-col shrink-0 select-none overflow-hidden transition-colors duration-200">
      {/* Header & Tabs */}
      <div className="p-3.5 border-b border-[#ECEEF3] dark:border-[#3A3948] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-lavender-600 dark:text-lavender-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF]">지도 레이어 & 목록</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-[#A5A3B5]">
            총 {elements.length + territories.length}개
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="요소 또는 세력 영역 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
          />
        </div>

        {/* Tab Switcher: All / Elements / Territories */}
        <div className="flex items-center bg-slate-100 dark:bg-[#252532] p-0.5 rounded-lg text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1 rounded-md transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF]'
            }`}
          >
            전체 ({elements.length + territories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('elements')}
            className={`flex-1 py-1 rounded-md transition-all ${
              activeTab === 'elements'
                ? 'bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF]'
            }`}
          >
            요소 ({elements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('territories')}
            className={`flex-1 py-1 rounded-md transition-all ${
              activeTab === 'territories'
                ? 'bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF]'
            }`}
          >
            영역 ({territories.length})
          </button>
        </div>

        {/* Quick Add Bar in Edit Mode */}
        {isEditMode && (
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onAddElement('country')}
              className="flex-1 py-1 px-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 border border-rose-200/60 dark:border-rose-900/40 transition-colors"
              title="새 국가 마커 추가"
            >
              <Plus className="w-3 h-3" />
              <span>국가</span>
            </button>
            <button
              type="button"
              onClick={() => onAddElement('faction')}
              className="flex-1 py-1 px-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 border border-purple-200/60 dark:border-purple-900/40 transition-colors"
              title="새 세력 마커 추가"
            >
              <Plus className="w-3 h-3" />
              <span>세력</span>
            </button>
            <button
              type="button"
              onClick={() => onAddElement('region')}
              className="flex-1 py-1 px-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 border border-emerald-200/60 dark:border-emerald-900/40 transition-colors"
              title="새 지역 마커 추가"
            >
              <Plus className="w-3 h-3" />
              <span>지역</span>
            </button>
            <button
              type="button"
              onClick={onStartDrawingTerritory}
              className="flex-1 py-1 px-1.5 bg-lavender-50 dark:bg-[#2C2842] hover:bg-lavender-100 text-lavender-700 dark:text-[#C7B8FF] rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 border border-lavender-200 dark:border-[#4B4372] transition-colors"
              title="새 세력 영토 경계선 그리기"
            >
              <Pentagon className="w-3 h-3" />
              <span>영역</span>
            </button>
          </div>
        )}
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {/* Section 1: 지도 요소 (Elements) */}
        {(activeTab === 'all' || activeTab === 'elements') && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setIsElementsCollapsed((prev) => !prev)}
              className="w-full flex items-center justify-between px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] transition-colors"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                {isElementsCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>지도 배치 요소 ({filteredElements.length})</span>
              </div>
            </button>

            {!isElementsCollapsed && (
              <div className="space-y-1">
                {filteredElements.map((elem) => {
                  const isSelected = selectedElementId === elem.id;

                  return (
                    <div
                      key={elem.id}
                      onClick={() => {
                        onSelectTerritory(null);
                        onSelectElement(elem.id);
                      }}
                      className={`group flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-lavender-50/80 dark:bg-[#352E58]/40 border-lavender-300 dark:border-lavender-600 shadow-2xs'
                          : 'bg-white dark:bg-[#252532] border-slate-200/70 dark:border-[#3A3948] hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-1 rounded-md bg-slate-100 dark:bg-[#1E1E27] shrink-0">
                          {getElementIcon(elem.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                              {elem.name}
                            </span>
                            {getElementBadge(elem.type)}
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* Visibility Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleElementVisibility(elem.id);
                          }}
                          title={elem.visible ? '요소 숨기기' : '요소 표시'}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded"
                        >
                          {elem.visible ? <Eye className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {isEditMode && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateElement(elem.id);
                              }}
                              title="요소 복제"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await customConfirm({
                                  title: '요소 삭제',
                                  message: `'${elem.name}' 요소를 삭제하시겠습니까?`,
                                  confirmText: '삭제',
                                  isDanger: true,
                                });
                                if (ok) onDeleteElement(elem.id);
                              }}
                              title="요소 삭제"
                              className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredElements.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400 dark:text-[#A5A3B5]">
                    배치된 요소가 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 2: 세력 영토 경계선 (Territories) */}
        {(activeTab === 'all' || activeTab === 'territories') && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setIsTerritoriesCollapsed((prev) => !prev)}
              className="w-full flex items-center justify-between px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] transition-colors"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider">
                {isTerritoriesCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>세력 영토 및 경계선 ({filteredTerritories.length})</span>
              </div>
            </button>

            {!isTerritoriesCollapsed && (
              <div className="space-y-1">
                {filteredTerritories.map((terr) => {
                  const isSelected = selectedTerritoryId === terr.id;

                  return (
                    <div
                      key={terr.id}
                      onClick={() => {
                        onSelectElement(null);
                        onSelectTerritory(terr.id);
                      }}
                      className={`group flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-lavender-50/80 dark:bg-[#352E58]/40 border-lavender-300 dark:border-lavender-600 shadow-2xs'
                          : 'bg-white dark:bg-[#252532] border-slate-200/70 dark:border-[#3A3948] hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          style={{ backgroundColor: terr.fillColor, borderColor: terr.strokeColor }}
                          className="w-3.5 h-3.5 rounded-full border shrink-0 opacity-80"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                            {terr.name}
                          </div>
                          {terr.factionName && (
                            <span className="text-[10px] text-slate-400 dark:text-[#A5A3B5] truncate block">
                              소속: {terr.factionName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Territory Actions */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTerritoryVisibility(terr.id);
                          }}
                          title={terr.visible ? '영역 숨기기' : '영역 표시'}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded"
                        >
                          {terr.visible ? <Eye className="w-3.5 h-3.5 text-lavender-600 dark:text-lavender-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {isEditMode && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateTerritory(terr.id);
                              }}
                              title="영역 복제"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await customConfirm({
                                  title: '영역 삭제',
                                  message: `'${terr.name}' 영역을 삭제하시겠습니까? (소속 세력 정보는 보존됩니다)`,
                                  confirmText: '삭제',
                                  isDanger: true,
                                });
                                if (ok) onDeleteTerritory(terr.id);
                              }}
                              title="영역 삭제"
                              className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredTerritories.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400 dark:text-[#A5A3B5]">
                    그려진 영토 영역이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
