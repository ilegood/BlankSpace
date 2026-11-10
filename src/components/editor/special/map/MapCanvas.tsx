import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MapElement,
  TerritoryPolygon,
  MapSettings,
  MapElementType,
} from '../../../../types/mapFactions';
import { MapToolMode } from './MapToolbar';
import {
  Flag,
  Shield,
  MapPin,
  Compass,
  Plus,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface MapCanvasProps {
  mapImageUrl: string;
  elements: MapElement[];
  territories: TerritoryPolygon[];
  settings: MapSettings;
  toolMode: MapToolMode;
  isEditMode: boolean;
  selectedElementId: string | null;
  selectedTerritoryId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onSelectElement: (id: string | null) => void;
  onSelectTerritory: (id: string | null) => void;
  onUpdateElementPosition: (id: string, x: number, y: number) => void;
  onUpdateTerritoryPoints: (id: string, points: { x: number; y: number }[]) => void;
  onAddElementAtCoords: (x: number, y: number) => void;
  onCreateTerritory: (points: { x: number; y: number }[]) => void;
  onDeleteElement: (id: string) => void;
  onDeleteTerritory: (id: string) => void;
  onNavigateToDocument: (docId: string) => void;
}

// Helper: Calculate polygon centroid
function getPolygonCentroid(pts: { x: number; y: number }[]) {
  if (!pts || pts.length === 0) return { x: 50, y: 50 };
  let xSum = 0;
  let ySum = 0;
  for (const p of pts) {
    xSum += p.x;
    ySum += p.y;
  }
  return { x: xSum / pts.length, y: ySum / pts.length };
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  mapImageUrl,
  elements,
  territories,
  settings,
  toolMode,
  isEditMode,
  selectedElementId,
  selectedTerritoryId,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  onSelectElement,
  onSelectTerritory,
  onUpdateElementPosition,
  onUpdateTerritoryPoints,
  onAddElementAtCoords,
  onCreateTerritory,
  onDeleteElement,
  onDeleteTerritory,
  onNavigateToDocument,
}) => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement>(null);

  // Pan interaction
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Boundary Drawing interaction
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(null);

  // Vertex Dragging interaction
  const [draggingVertex, setDraggingVertex] = useState<{
    territoryId: string;
    pointIdx: number;
  } | null>(null);

  // Element Dragging interaction
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);

  // Territory Drag Moving (Whole territory move)
  const [draggingTerritory, setDraggingTerritory] = useState<{
    territoryId: string;
    initialPoints: { x: number; y: number }[];
    startCoord: { x: number; y: number };
  } | null>(null);

  // Convert mouse event client coordinates to map percentage (0 - 100%)
  const getMapCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!mapImageRef.current) return { x: 50, y: 50 };
      const rect = mapImageRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(0, Math.min(100, Math.round(x * 10) / 10)),
        y: Math.max(0, Math.min(100, Math.round(y * 10) / 10)),
      };
    },
    []
  );

  // ------------------------------------------------------------------
  // 1. Zoom via Mouse Wheel
  // ------------------------------------------------------------------
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const nextZoom = Math.max(0.3, Math.min(3.5, zoom * zoomFactor));
    onZoomChange(nextZoom);
  };

  // ------------------------------------------------------------------
  // 2. Pan Handlers (Mouse Drag on Background)
  // ------------------------------------------------------------------
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or Pan tool or spacebar held
    if (e.button === 1 || toolMode === 'pan' || !isEditMode) {
      e.preventDefault();
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Left click on background
    if (e.button === 0) {
      const coords = getMapCoords(e.clientX, e.clientY);

      // Add Element Tool
      if (isEditMode && toolMode === 'add-element') {
        onAddElementAtCoords(coords.x, coords.y);
        return;
      }

      // Draw Boundary Tool
      if (isEditMode && toolMode === 'draw-boundary') {
        // Check if clicked near first point to close
        if (drawingPoints.length >= 3) {
          const first = drawingPoints[0];
          const dist = Math.hypot(coords.x - first.x, coords.y - first.y);
          if (dist < 3) {
            // Close polygon
            handleFinishDrawing();
            return;
          }
        }
        setDrawingPoints((prev) => [...prev, coords]);
        return;
      }

      // Click on background in Select mode deselects
      if (toolMode === 'select') {
        onSelectElement(null);
        onSelectTerritory(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Pan
    if (isPanning) {
      onPanChange({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
      return;
    }

    const coords = getMapCoords(e.clientX, e.clientY);

    // Track cursor for boundary drawing preview
    if (toolMode === 'draw-boundary' && drawingPoints.length > 0) {
      setCursorCoords(coords);
    }

    // Dragging Vertex
    if (draggingVertex) {
      const targetTerr = territories.find((t) => t.id === draggingVertex.territoryId);
      if (targetTerr) {
        const nextPoints = [...targetTerr.points];
        nextPoints[draggingVertex.pointIdx] = coords;
        onUpdateTerritoryPoints(draggingVertex.territoryId, nextPoints);
      }
      return;
    }

    // Dragging Element
    if (draggingElementId) {
      onUpdateElementPosition(draggingElementId, coords.x, coords.y);
      return;
    }

    // Dragging Whole Territory
    if (draggingTerritory) {
      const dx = coords.x - draggingTerritory.startCoord.x;
      const dy = coords.y - draggingTerritory.startCoord.y;
      const movedPoints = draggingTerritory.initialPoints.map((p) => ({
        x: Math.max(0, Math.min(100, Math.round((p.x + dx) * 10) / 10)),
        y: Math.max(0, Math.min(100, Math.round((p.y + dy) * 10) / 10)),
      }));
      onUpdateTerritoryPoints(draggingTerritory.territoryId, movedPoints);
      return;
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingVertex(null);
    setDraggingElementId(null);
    setDraggingTerritory(null);
  };

  // Finish Boundary Drawing
  const handleFinishDrawing = () => {
    if (drawingPoints.length < 3) {
      toast.warning('영역을 생성하려면 최소 3개 이상의 점을 찍어야 합니다.');
      return;
    }
    onCreateTerritory(drawingPoints);
    setDrawingPoints([]);
    setCursorCoords(null);
    toast.success('새 세력 영토 경계선이 생성되었습니다.');
  };

  // Cancel Boundary Drawing on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawingPoints.length > 0) {
          setDrawingPoints([]);
          setCursorCoords(null);
          toast.info('경계선 그리기가 취소되었습니다.');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingPoints]);

  // Selected territory object
  const selectedTerritory = useMemo(
    () => territories.find((t) => t.id === selectedTerritoryId),
    [territories, selectedTerritoryId]
  );

  // ------------------------------------------------------------------
  // Element Icon Component
  // ------------------------------------------------------------------
  const renderElementMarker = (elem: MapElement) => {
    if (!elem.visible) return null;

    const isSelected = selectedElementId === elem.id;
    const sizeClasses =
      elem.size === 'sm'
        ? 'w-6 h-6 text-[10px]'
        : elem.size === 'lg'
        ? 'w-10 h-10 text-base'
        : 'w-8 h-8 text-xs';

    const getIcon = () => {
      switch (elem.type) {
        case 'country':
          return <Flag className="w-4 h-4 fill-current" />;
        case 'faction':
          return <Shield className="w-4 h-4 fill-current" />;
        case 'region':
          return <MapPin className="w-4 h-4 fill-current" />;
        case 'location':
          return <Compass className="w-4 h-4 fill-current" />;
      }
    };

    const getColorClass = () => {
      switch (elem.type) {
        case 'country':
          return 'bg-rose-500 text-white border-white shadow-rose-500/50';
        case 'faction':
          return 'bg-purple-600 text-white border-white shadow-purple-600/50';
        case 'region':
          return 'bg-emerald-500 text-white border-white shadow-emerald-500/50';
        case 'location':
          return 'bg-blue-500 text-white border-white shadow-blue-500/50';
      }
    };

    return (
      <div
        key={elem.id}
        style={{
          left: `${elem.x}%`,
          top: `${elem.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (toolMode === 'delete' && isEditMode) {
            onDeleteElement(elem.id);
            return;
          }
          onSelectTerritory(null);
          onSelectElement(elem.id);
        }}
        onMouseDown={(e) => {
          if (isEditMode && toolMode === 'select' && e.button === 0) {
            e.stopPropagation();
            setDraggingElementId(elem.id);
            onSelectTerritory(null);
            onSelectElement(elem.id);
          }
        }}
        className={`absolute z-30 flex flex-col items-center cursor-pointer group transition-transform ${
          isSelected ? 'scale-125 z-40' : 'hover:scale-110'
        }`}
      >
        {/* Pin Marker Bubble */}
        <div
          className={`${sizeClasses} ${getColorClass()} rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all ${
            isSelected ? 'ring-4 ring-lavender-400 dark:ring-lavender-500 animate-pulse' : ''
          }`}
        >
          {getIcon()}
        </div>

        {/* Name Label */}
        {settings.showElementLabels && (
          <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/85 text-white text-[10px] font-bold tracking-tight whitespace-nowrap shadow-md pointer-events-none border border-white/20 backdrop-blur-xs flex items-center gap-1">
            <span>{elem.name}</span>
            {elem.targetDocId && (
              <span className="w-1.5 h-1.5 rounded-full bg-lavender-400" />
            )}
          </div>
        )}

        {/* View Mode Quick Link Button */}
        {!isEditMode && elem.targetDocId && isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToDocument(elem.targetDocId!);
            }}
            className="mt-1 px-2.5 py-1 rounded-lg bg-lavender-600 hover:bg-lavender-500 text-white text-[10.5px] font-bold shadow-lg flex items-center gap-1 pointer-events-auto transition-colors animate-in fade-in"
          >
            <span>문서 열기</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  // ------------------------------------------------------------------
  // Territory Polygon Component
  // ------------------------------------------------------------------
  const renderTerritory = (terr: TerritoryPolygon) => {
    if (!terr.visible || terr.points.length < 3) return null;

    const isSelected = selectedTerritoryId === terr.id;
    const pointsStr = terr.points.map((p) => `${p.x},${p.y}`).join(' ');
    const centroid = getPolygonCentroid(terr.points);

    return (
      <g key={terr.id} className="cursor-pointer group">
        {/* Polygon Area */}
        <polygon
          points={pointsStr}
          fill={terr.fillColor}
          fillOpacity={isSelected ? Math.min(1, terr.fillOpacity + 0.15) : terr.fillOpacity}
          stroke={terr.strokeColor}
          strokeWidth={isSelected ? terr.strokeWidth * 1.5 : terr.strokeWidth}
          strokeDasharray={
            terr.strokeStyle === 'dashed' ? '5,5' : terr.strokeStyle === 'dotted' ? '2,4' : undefined
          }
          className="transition-all"
          onClick={(e) => {
            e.stopPropagation();
            if (toolMode === 'delete' && isEditMode) {
              onDeleteTerritory(terr.id);
              return;
            }
            onSelectElement(null);
            onSelectTerritory(terr.id);
          }}
          onMouseDown={(e) => {
            if (isEditMode && (toolMode === 'select' || toolMode === 'edit-boundary') && e.button === 0) {
              e.stopPropagation();
              const coords = getMapCoords(e.clientX, e.clientY);
              setDraggingTerritory({
                territoryId: terr.id,
                initialPoints: [...terr.points],
                startCoord: coords,
              });
              onSelectElement(null);
              onSelectTerritory(terr.id);
            }
          }}
        />

        {/* Territory Centroid Name Label */}
        {settings.showTerritoryLabels && (
          <text
            x={centroid.x}
            y={centroid.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={terr.strokeColor}
            fontSize="3"
            fontWeight="bold"
            className="pointer-events-none drop-shadow-md select-none font-sans"
            style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))' }}
          >
            {terr.name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`flex-1 relative overflow-hidden bg-slate-900 select-none ${
        toolMode === 'pan' || !isEditMode
          ? isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : toolMode === 'add-element'
          ? 'cursor-crosshair'
          : toolMode === 'draw-boundary'
          ? 'cursor-crosshair'
          : toolMode === 'delete'
          ? 'cursor-not-allowed'
          : 'cursor-default'
      }`}
    >
      {/* 1. Zoomable & Pannable Stage Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        {/* Map Bounding Box */}
        <div className="relative inline-block pointer-events-auto shadow-2xl">
          {/* Base Map Image */}
          <img
            ref={mapImageRef}
            src={mapImageUrl}
            alt="세계관 지도"
            draggable={false}
            className="max-w-none block select-none border border-slate-700/60 rounded-xs"
          />

          {/* SVG Territory Polygons Layer */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-auto"
          >
            {/* Render completed territories */}
            {territories.map(renderTerritory)}

            {/* Render currently drawing boundary path */}
            {drawingPoints.length > 0 && (
              <g className="pointer-events-none">
                <polyline
                  points={drawingPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2.5"
                  strokeDasharray="4,4"
                />
                {cursorCoords && drawingPoints.length > 0 && (
                  <line
                    x1={drawingPoints[drawingPoints.length - 1].x}
                    y1={drawingPoints[drawingPoints.length - 1].y}
                    x2={cursorCoords.x}
                    y2={cursorCoords.y}
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                )}
                {drawingPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={i === 0 ? 3 : 2}
                    fill={i === 0 ? '#10B981' : '#8B5CF6'}
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                ))}
              </g>
            )}

            {/* Render Vertex Control Handles for Selected Territory in Edit Mode */}
            {isEditMode &&
              selectedTerritory &&
              (toolMode === 'edit-boundary' || toolMode === 'select') && (
                <g className="pointer-events-auto">
                  {selectedTerritory.points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="2"
                      fill="#FFFFFF"
                      stroke="#8B5CF6"
                      strokeWidth="1"
                      className="cursor-move hover:scale-150 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingVertex({
                          territoryId: selectedTerritory.id,
                          pointIdx: idx,
                        });
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Delete point (minimum 3 points)
                        if (selectedTerritory.points.length <= 3) {
                          toast.warning('영역을 구성하려면 최소 3개의 점이 필요합니다.');
                          return;
                        }
                        const next = selectedTerritory.points.filter((_, i) => i !== idx);
                        onUpdateTerritoryPoints(selectedTerritory.id, next);
                        toast.info('경계선 점이 삭제되었습니다.');
                      }}
                    />
                  ))}
                </g>
              )}
          </svg>

          {/* HTML Elements Markers Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {elements.map(renderElementMarker)}
          </div>
        </div>
      </div>

      {/* 2. Floating Boundary Drawing Helper Bar */}
      {toolMode === 'draw-boundary' && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-lavender-400 animate-pulse" />
            <span>
              경계선 그리기: <strong>{drawingPoints.length}개</strong> 점 등록됨 (최소 3개 필요)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={drawingPoints.length < 3}
              onClick={handleFinishDrawing}
              className="px-3 py-1 bg-lavender-600 hover:bg-lavender-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>영역 완성</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawingPoints([]);
                setCursorCoords(null);
              }}
              className="px-2.5 py-1 text-slate-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              취소 (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

