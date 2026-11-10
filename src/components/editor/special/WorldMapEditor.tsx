import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';
import {
  WorldMapDocData,
  MapElement,
  TerritoryPolygon,
  MapSettings,
  MapElementType,
} from '../../../types/mapFactions';
import {
  INITIAL_MAP_DATA,
  convertLegacyToWorldMap,
} from './map/mapPresets';
import { MapToolbar, MapToolMode } from './map/MapToolbar';
import { MapSidebar } from './map/MapSidebar';
import { MapCanvas } from './map/MapCanvas';
import { MapInspector } from './map/MapInspector';
import { ChangeMapImageModal } from './map/ChangeMapImageModal';

export const WorldMapEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent, setActiveDocument } = useWorkspace();
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  // 1. Core Document State
  const [docData, setDocData] = useState<WorldMapDocData>(INITIAL_MAP_DATA);

  // 2. View Mode & Tool State
  // Requirement: View mode by default
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [toolMode, setToolMode] = useState<MapToolMode>('select');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 3. Selection State
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);

  // 4. Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // 5. Modals
  const [isMapImageModalOpen, setIsMapImageModalOpen] = useState(false);

  // 6. Undo / Redo History
  const [history, setHistory] = useState<WorldMapDocData[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Load from Page Content or Initial
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && (activePage.content.startsWith('{') || activePage.content.startsWith('['))) {
        const parsed = JSON.parse(activePage.content);
        const converted = convertLegacyToWorldMap(parsed);
        setDocData(converted);
        setHistory([converted]);
        setHistoryIdx(0);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse world map data, falling back to initial:', e);
    }

    setDocData(INITIAL_MAP_DATA);
    setHistory([INITIAL_MAP_DATA]);
    setHistoryIdx(0);
  }, [activePage?.id]);

  // Push State & Autosave
  const pushState = useCallback(
    (nextData: WorldMapDocData) => {
      setDocData(nextData);

      if (!isUndoRedoAction.current) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIdx + 1);
          return [...sliced, nextData];
        });
        setHistoryIdx((prev) => prev + 1);
      }
      isUndoRedoAction.current = false;

      if (!activePage) return;
      setSaveStatus('saving');
      updatePageContent(activePage.id, JSON.stringify(nextData));
      setTimeout(() => setSaveStatus('saved'), 300);
    },
    [activePage, historyIdx, updatePageContent]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      isUndoRedoAction.current = true;
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setDocData(prev);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(prev));
    }
  }, [history, historyIdx, activePage, updatePageContent]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setDocData(next);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(next));
    }
  }, [history, historyIdx, activePage, updatePageContent]);

  // Keyboard Shortcuts (Undo, Redo, Tool switching, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }

      // Tool shortcuts in Edit mode
      if (isEditMode) {
        if (e.key.toLowerCase() === 'v') setToolMode('select');
        else if (e.key.toLowerCase() === 'h') setToolMode('pan');
        else if (e.key.toLowerCase() === 'e') setToolMode('add-element');
        else if (e.key.toLowerCase() === 'b') setToolMode('draw-boundary');
        else if (e.key.toLowerCase() === 'p') setToolMode('edit-boundary');
        else if (e.key.toLowerCase() === 'd') setToolMode('delete');
        else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedElementId) {
            handleDeleteElement(selectedElementId);
          } else if (selectedTerritoryId) {
            handleDeleteTerritory(selectedTerritoryId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, selectedElementId, selectedTerritoryId, handleUndo, handleRedo]);

  // ------------------------------------------------------------------
  // Element Handlers
  // ------------------------------------------------------------------
  const handleAddElementAtCoords = (x: number, y: number, type: MapElementType = 'region') => {
    const newId = `elem-${Date.now()}`;
    const defaultNames: Record<MapElementType, string> = {
      country: '새 국가',
      faction: '새 세력',
      region: '새 지역',
      location: '새 거점 / 장소',
    };

    const newElement: MapElement = {
      id: newId,
      name: defaultNames[type],
      type,
      description: '상세 정보 패널에서 설명을 입력하세요.',
      x,
      y,
      size: docData.settings.defaultMarkerSize || 'md',
      visible: true,
    };

    pushState({
      ...docData,
      elements: [...docData.elements, newElement],
      updatedAt: Date.now(),
    });

    setSelectedTerritoryId(null);
    setSelectedElementId(newId);
    setToolMode('select');
    toast.success(`'${newElement.name}' 마커가 배치되었습니다.`);
  };

  const handleUpdateElement = (id: string, updates: Partial<MapElement>) => {
    const nextElements = docData.elements.map((elem) =>
      elem.id === id ? { ...elem, ...updates } : elem
    );
    pushState({
      ...docData,
      elements: nextElements,
      updatedAt: Date.now(),
    });
  };

  const handleUpdateElementPosition = (id: string, x: number, y: number) => {
    handleUpdateElement(id, { x, y });
  };

  const handleDeleteElement = (id: string) => {
    const nextElements = docData.elements.filter((elem) => elem.id !== id);
    if (selectedElementId === id) setSelectedElementId(null);
    pushState({
      ...docData,
      elements: nextElements,
      updatedAt: Date.now(),
    });
    toast.info('요소가 삭제되었습니다.');
  };

  const handleDuplicateElement = (id: string) => {
    const target = docData.elements.find((e) => e.id === id);
    if (!target) return;

    const newId = `elem-${Date.now()}`;
    const duplicated: MapElement = {
      ...target,
      id: newId,
      name: `${target.name} (복사본)`,
      x: Math.min(95, target.x + 3),
      y: Math.min(95, target.y + 3),
    };

    pushState({
      ...docData,
      elements: [...docData.elements, duplicated],
      updatedAt: Date.now(),
    });

    setSelectedTerritoryId(null);
    setSelectedElementId(newId);
    toast.success('요소가 복제되었습니다.');
  };

  const handleToggleElementVisibility = (id: string) => {
    const target = docData.elements.find((e) => e.id === id);
    if (!target) return;
    handleUpdateElement(id, { visible: !target.visible });
  };

  // ------------------------------------------------------------------
  // Territory Handlers
  // ------------------------------------------------------------------
  const handleCreateTerritory = (points: { x: number; y: number }[]) => {
    const newId = `terr-${Date.now()}`;
    const newTerritory: TerritoryPolygon = {
      id: newId,
      name: `새 세력 영역 ${docData.territories.length + 1}`,
      points,
      strokeColor: '#8B5CF6',
      strokeWidth: 2.5,
      strokeStyle: 'solid',
      fillColor: '#8B5CF6',
      fillOpacity: 0.2,
      visible: true,
    };

    pushState({
      ...docData,
      territories: [...docData.territories, newTerritory],
      updatedAt: Date.now(),
    });

    setSelectedElementId(null);
    setSelectedTerritoryId(newId);
    setToolMode('select');
  };

  const handleUpdateTerritory = (id: string, updates: Partial<TerritoryPolygon>) => {
    const nextTerritories = docData.territories.map((terr) =>
      terr.id === id ? { ...terr, ...updates } : terr
    );
    pushState({
      ...docData,
      territories: nextTerritories,
      updatedAt: Date.now(),
    });
  };

  const handleUpdateTerritoryPoints = (id: string, points: { x: number; y: number }[]) => {
    handleUpdateTerritory(id, { points });
  };

  const handleDeleteTerritory = (id: string) => {
    const nextTerritories = docData.territories.filter((terr) => terr.id !== id);
    if (selectedTerritoryId === id) setSelectedTerritoryId(null);
    pushState({
      ...docData,
      territories: nextTerritories,
      updatedAt: Date.now(),
    });
    toast.info('영역이 삭제되었습니다.');
  };

  const handleDuplicateTerritory = (id: string) => {
    const target = docData.territories.find((t) => t.id === id);
    if (!target) return;

    const newId = `terr-${Date.now()}`;
    const duplicated: TerritoryPolygon = {
      ...target,
      id: newId,
      name: `${target.name} (복사본)`,
      points: target.points.map((p) => ({
        x: Math.min(100, p.x + 3),
        y: Math.min(100, p.y + 3),
      })),
    };

    pushState({
      ...docData,
      territories: [...docData.territories, duplicated],
      updatedAt: Date.now(),
    });

    setSelectedElementId(null);
    setSelectedTerritoryId(newId);
    toast.success('영역이 복제되었습니다.');
  };

  const handleToggleTerritoryVisibility = (id: string) => {
    const target = docData.territories.find((t) => t.id === id);
    if (!target) return;
    handleUpdateTerritory(id, { visible: !target.visible });
  };

  // ------------------------------------------------------------------
  // Map Image Change & Settings
  // ------------------------------------------------------------------
  const handleConfirmMapImage = (newUrl: string, resetData: boolean) => {
    if (resetData) {
      pushState({
        ...docData,
        mapImageUrl: newUrl,
        elements: [],
        territories: [],
        updatedAt: Date.now(),
      });
      setSelectedElementId(null);
      setSelectedTerritoryId(null);
      toast.success('지도 이미지가 교체되었으며 기존 데이터가 초기화되었습니다.');
    } else {
      pushState({
        ...docData,
        mapImageUrl: newUrl,
        updatedAt: Date.now(),
      });
      toast.success('지도 이미지가 교체되었으며 기존 요소와 경계선이 유지됩니다.');
    }
  };

  const handleToggleSetting = (key: keyof MapSettings) => {
    pushState({
      ...docData,
      settings: {
        ...docData.settings,
        [key]: !docData.settings[key],
      },
    });
  };

  // Export Image
  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    try {
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument.title || '지도-및-세력도'}`,
      });
      toast.success('지도 및 세력도 이미지가 저장되었습니다.');
    } catch (e) {
      toast.error('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // View reset
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const selectedElement = useMemo(
    () => docData.elements.find((e) => e.id === selectedElementId) || null,
    [docData.elements, selectedElementId]
  );

  const selectedTerritory = useMemo(
    () => docData.territories.find((t) => t.id === selectedTerritoryId) || null,
    [docData.territories, selectedTerritoryId]
  );

  return (
    <div
      ref={printRef}
      className={`h-full flex flex-col bg-[#F9FAFD] dark:bg-[#17171D] text-slate-800 dark:text-[#E8E7EF] font-sans antialiased overflow-hidden select-none transition-colors duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* 1. Global Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
      />

      {/* 2. Map Specialized Toolbar */}
      <MapToolbar
        toolMode={toolMode}
        isEditMode={isEditMode}
        zoom={zoom}
        canUndo={historyIdx > 0}
        canRedo={historyIdx < history.length - 1}
        settings={docData.settings}
        isFullscreen={isFullscreen}
        onSetToolMode={setToolMode}
        onToggleEditMode={() => {
          setIsEditMode((prev) => !prev);
          if (!isEditMode) {
            setToolMode('select');
            toast.info('편집 모드로 진입했습니다. 요소 배치 및 경계선 그리기가 가능합니다.');
          } else {
            setToolMode('select');
            toast.success('보기 모드로 전환되었습니다.');
          }
        }}
        onZoomIn={() => setZoom((z) => Math.min(3.5, z + 0.25))}
        onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.25))}
        onResetView={handleResetView}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenMapImageModal={() => setIsMapImageModalOpen(true)}
        onToggleSetting={handleToggleSetting}
        onExportImage={handleExportImage}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* 3. Main Stage: 3-Column Layout (Sidebar + Canvas + Inspector) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: Map Elements & Layers Sidebar */}
        <MapSidebar
          elements={docData.elements}
          territories={docData.territories}
          selectedElementId={selectedElementId}
          selectedTerritoryId={selectedTerritoryId}
          isEditMode={isEditMode}
          onSelectElement={(id) => {
            setSelectedTerritoryId(null);
            setSelectedElementId(id);
          }}
          onSelectTerritory={(id) => {
            setSelectedElementId(null);
            setSelectedTerritoryId(id);
          }}
          onAddElement={(type) => {
            // Place in center of screen
            handleAddElementAtCoords(50, 50, type);
          }}
          onStartDrawingTerritory={() => {
            setToolMode('draw-boundary');
            toast.info('지도 위를 클릭하여 경계선의 각 점을 생성하세요.');
          }}
          onToggleElementVisibility={handleToggleElementVisibility}
          onToggleTerritoryVisibility={handleToggleTerritoryVisibility}
          onDeleteElement={handleDeleteElement}
          onDeleteTerritory={handleDeleteTerritory}
          onDuplicateElement={handleDuplicateElement}
          onDuplicateTerritory={handleDuplicateTerritory}
        />

        {/* Center: Interactive Map Canvas */}
        <MapCanvas
          mapImageUrl={docData.mapImageUrl}
          elements={docData.elements}
          territories={docData.territories}
          settings={docData.settings}
          toolMode={toolMode}
          isEditMode={isEditMode}
          selectedElementId={selectedElementId}
          selectedTerritoryId={selectedTerritoryId}
          zoom={zoom}
          pan={pan}
          onPanChange={setPan}
          onZoomChange={setZoom}
          onSelectElement={(id) => {
            setSelectedTerritoryId(null);
            setSelectedElementId(id);
          }}
          onSelectTerritory={(id) => {
            setSelectedElementId(null);
            setSelectedTerritoryId(id);
          }}
          onUpdateElementPosition={handleUpdateElementPosition}
          onUpdateTerritoryPoints={handleUpdateTerritoryPoints}
          onAddElementAtCoords={(x, y) => handleAddElementAtCoords(x, y, 'region')}
          onCreateTerritory={handleCreateTerritory}
          onDeleteElement={handleDeleteElement}
          onDeleteTerritory={handleDeleteTerritory}
          onNavigateToDocument={setActiveDocument}
        />

        {/* Right: Detailed Inspector Panel */}
        <MapInspector
          selectedElement={selectedElement}
          selectedTerritory={selectedTerritory}
          allElements={docData.elements}
          isEditMode={isEditMode}
          onUpdateElement={handleUpdateElement}
          onDeleteElement={handleDeleteElement}
          onUpdateTerritory={handleUpdateTerritory}
          onDeleteTerritory={handleDeleteTerritory}
          onClose={() => {
            setSelectedElementId(null);
            setSelectedTerritoryId(null);
          }}
        />
      </div>

      {/* 4. Map Image Change Modal */}
      <ChangeMapImageModal
        isOpen={isMapImageModalOpen}
        currentMapUrl={docData.mapImageUrl}
        onConfirm={handleConfirmMapImage}
        onClose={() => setIsMapImageModalOpen(false)}
      />
    </div>
  );
};
