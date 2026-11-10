import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Shield,
  Compass,
  X,
  FileText,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export interface MapMarker {
  id: string;
  name: string;
  type: 'country' | 'region' | 'faction';
  description: string;
  imageUrl?: string;
  targetDocId?: string; // Linked Blankspace document ID
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
}

interface MapData {
  mapImageUrl: string;
  markers: MapMarker[];
}

const DEFAULT_MAP_URL =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1600&auto=format&fit=crop';

export const WorldMapEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent, documents, setActiveDocument, setActivePageId } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const handleExportImage = async () => {
    if (!mapContainerRef.current) return;
    await exportElementAsPng(mapContainerRef.current, {
      fileName: `${activeDocument?.title || '지도'}-세계관지도`,
    });
  };

  const [mapImageUrl, setMapImageUrl] = useState(DEFAULT_MAP_URL);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Add / Edit Marker Modal State
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [markerName, setMarkerName] = useState('');
  const [markerType, setMarkerType] = useState<'country' | 'region' | 'faction'>('country');
  const [markerDesc, setMarkerDesc] = useState('');
  const [markerImage, setMarkerImage] = useState('');
  const [markerDocId, setMarkerDocId] = useState<string>('');
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);

  // Map Image URL Modal
  const [isMapImageModalOpen, setIsMapImageModalOpen] = useState(false);
  const [mapInputUrl, setMapInputUrl] = useState('');

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content) as MapData;
        setMapImageUrl(parsed.mapImageUrl || DEFAULT_MAP_URL);
        setMarkers(parsed.markers || []);
      } else {
        // Initial Sample markers
        const initialMarkers: MapMarker[] = [
          {
            id: 'marker-1',
            name: '성령 제국',
            type: 'country',
            description: '빛의 성령을 숭배하는 대륙 최강의 제국.',
            imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop',
            x: 35,
            y: 40,
          },
          {
            id: 'marker-2',
            name: '안개의 숲',
            type: 'region',
            description: '고대 마법 생물들이 서식하는 미지의 수림지대.',
            imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=300&auto=format&fit=crop',
            x: 65,
            y: 55,
          },
        ];
        setMarkers(initialMarkers);
      }
    } catch {
      setMarkers([]);
    }
  }, [activePage?.id]);

  const saveMapData = (newMapUrl: string, newMarkers: MapMarker[]) => {
    if (!activePage) return;
    setSaveStatus('saving');
    const data: MapData = {
      mapImageUrl: newMapUrl,
      markers: newMarkers,
    };
    updatePageContent(activePage.id, JSON.stringify(data));
    setTimeout(() => setSaveStatus('saved'), 400);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Click on map to add marker
  const handleMapDoubleClick = (e: React.MouseEvent) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setTempCoords({ x: Math.max(2, Math.min(98, clickX)), y: Math.max(2, Math.min(98, clickY)) });
    setEditingMarkerId(null);
    setMarkerName('');
    setMarkerType('country');
    setMarkerDesc('');
    setMarkerImage('');
    setMarkerDocId('');
    setIsMarkerModalOpen(true);
  };

  // Save Marker
  const handleSaveMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markerName.trim()) return;

    if (editingMarkerId) {
      // Edit existing
      const nextMarkers = markers.map((m) =>
        m.id === editingMarkerId
          ? {
              ...m,
              name: markerName.trim(),
              type: markerType,
              description: markerDesc.trim(),
              imageUrl: markerImage.trim() || undefined,
              targetDocId: markerDocId || undefined,
            }
          : m
      );
      setMarkers(nextMarkers);
      saveMapData(mapImageUrl, nextMarkers);
    } else if (tempCoords) {
      // Add new
      const newMarker: MapMarker = {
        id: generateId('marker'),
        name: markerName.trim(),
        type: markerType,
        description: markerDesc.trim(),
        imageUrl: markerImage.trim() || undefined,
        targetDocId: markerDocId || undefined,
        x: tempCoords.x,
        y: tempCoords.y,
      };
      const nextMarkers = [...markers, newMarker];
      setMarkers(nextMarkers);
      saveMapData(mapImageUrl, nextMarkers);
    }

    setIsMarkerModalOpen(false);
  };

  const handleDeleteMarker = (id: string) => {
    const nextMarkers = markers.filter((m) => m.id !== id);
    setMarkers(nextMarkers);
    saveMapData(mapImageUrl, nextMarkers);
    if (selectedMarkerId === id) setSelectedMarkerId(null);
  };

  const handleStartEditMarker = (m: MapMarker) => {
    setEditingMarkerId(m.id);
    setMarkerName(m.name);
    setMarkerType(m.type);
    setMarkerDesc(m.description);
    setMarkerImage(m.imageUrl || '');
    setMarkerDocId(m.targetDocId || '');
    setIsMarkerModalOpen(true);
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId);

  const getTypeBadge = (type: 'country' | 'region' | 'faction') => {
    switch (type) {
      case 'country':
        return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold">국가</span>;
      case 'region':
        return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">지역 / 거점</span>;
      case 'faction':
        return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">세력 / 길드</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9FAFD] overflow-hidden select-none">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMapInputUrl(mapImageUrl);
                setIsMapImageModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>지도 이미지 변경</span>
            </button>
          </div>
        }
      />

      {/* Map Canvas Viewport */}
      <div
        className="flex-1 relative overflow-hidden bg-slate-900/90 cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleMapDoubleClick}
      >
        {/* Floating Zoom & Tool Controls */}
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200 shadow-modal">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="확대 (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="축소 (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="화면 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 px-2 font-medium">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Double-Click Guidance Tip */}
        <div className="absolute top-4 left-6 z-20 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-600 flex items-center gap-1.5 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-lavender-600" />
          <span>지도를 <strong>더블클릭</strong>하면 마커 핀을 배치할 수 있습니다.</span>
        </div>

        {/* Transformed Map Container */}
        <div
          ref={mapContainerRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
          }}
          className="relative max-w-5xl w-full aspect-[16/10] bg-slate-800 rounded-xl overflow-hidden shadow-2xl shrink-0"
        >
          {/* Map Image */}
          <img
            src={mapImageUrl}
            alt="World Map"
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
          />

          {/* Markers overlay */}
          {markers.map((marker) => {
            const isSelected = selectedMarkerId === marker.id;
            return (
              <div
                key={marker.id}
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarkerId(marker.id);
                }}
                className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer z-10 transition-transform ${
                  isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                }`}
              >
                {/* Pin Head */}
                <div
                  className={`p-1.5 rounded-full shadow-lg flex items-center justify-center border-2 border-white ${
                    marker.type === 'country'
                      ? 'bg-rose-500 text-white'
                      : marker.type === 'region'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-purple-600 text-white'
                  } ${isSelected ? 'ring-4 ring-lavender-300' : ''}`}
                >
                  <MapPin className="w-4 h-4 fill-white" />
                </div>

                {/* Name Badge */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md border border-white/20">
                  {marker.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Marker Detail Card (Inspector) */}
        {selectedMarker && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-6 right-6 z-30 bg-white border border-[#ECEEF3] rounded-2xl shadow-modal p-5 w-80 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {getTypeBadge(selectedMarker.type)}
                <h3 className="font-bold text-slate-800 text-sm truncate">{selectedMarker.name}</h3>
              </div>
              <button
                onClick={() => setSelectedMarkerId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedMarker.imageUrl && (
              <img
                src={selectedMarker.imageUrl}
                alt={selectedMarker.name}
                className="w-full h-32 rounded-xl object-cover border border-slate-100 shadow-xs"
              />
            )}

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {selectedMarker.description || '상세 설명이 등록되지 않았습니다.'}
            </p>

            {/* Linked Document Button (Phase 4 integration) */}
            {selectedMarker.targetDocId && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setActiveDocument(selectedMarker.targetDocId!);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-lavender-100 hover:bg-lavender-200 text-lavender-800 font-semibold text-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-lavender-600" />
                  <span>연결된 관련 문서 열기</span>
                  <ExternalLink className="w-3 h-3 text-lavender-500 ml-1" />
                </button>
              </div>
            )}

            {/* Actions: Edit / Delete */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleStartEditMarker(selectedMarker)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3 text-slate-400" />
                <span>수정</span>
              </button>
              <button
                onClick={() => handleDeleteMarker(selectedMarker.id)}
                className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>삭제</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Marker Create / Edit Modal */}
      {isMarkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingMarkerId ? '마커 정보 수정' : '새 장소 / 세력 마커 생성'}
              </h3>
              <button onClick={() => setIsMarkerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarker} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">장소 / 세력 이름 *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={markerName}
                  onChange={(e) => setMarkerName(e.target.value)}
                  placeholder="예: 윈드포지 왕국, 안개의 숲"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">마커 유형</label>
                <select
                  value={markerType}
                  onChange={(e) => setMarkerType(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                >
                  <option value="country">국가 (Country)</option>
                  <option value="region">지역 및 장소 (Region / Landmark)</option>
                  <option value="faction">세력 및 길드 (Faction / Guild)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">설명</label>
                <textarea
                  rows={3}
                  value={markerDesc}
                  onChange={(e) => setMarkerDesc(e.target.value)}
                  placeholder="지리적 특징, 역사적 배경 등을 입력하세요."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 resize-none !bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">대표 이미지 URL (선택)</label>
                <input
                  type="url"
                  value={markerImage}
                  onChange={(e) => setMarkerImage(e.target.value)}
                  placeholder="장소 사진이나 문양 이미지 URL"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                />
              </div>

              {/* Link to Document */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  관련 문서 연결 (선택)
                </label>
                <select
                  value={markerDocId}
                  onChange={(e) => setMarkerDocId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
                >
                  <option value="">연결 문서 없음</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMarkerModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!markerName.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-lavender-600 hover:bg-lavender-700 rounded-xl"
                >
                  {editingMarkerId ? '수정 완료' : '마커 생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Image URL Change Modal */}
      {isMapImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal w-full max-w-sm p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-800 text-sm">지도 이미지 URL 변경</h3>
            <input
              type="url"
              autoFocus
              value={mapInputUrl}
              onChange={(e) => setMapInputUrl(e.target.value)}
              placeholder="지도 이미지 웹 주소를 입력하세요"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsMapImageModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (mapInputUrl.trim()) {
                    setMapImageUrl(mapInputUrl.trim());
                    saveMapData(mapInputUrl.trim(), markers);
                  }
                  setIsMapImageModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-lavender-600 hover:bg-lavender-700 rounded-xl"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

