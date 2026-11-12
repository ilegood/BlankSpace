import { CanvasDocumentData, CanvasElement, CanvasElementContent } from '../types/canvas';
import { generateId } from './id';

function blankContentForTemplate(element: CanvasElement): CanvasElementContent {
  const source = element.content || {};
  const content: CanvasElementContent = {};
  if (source.title) content.title = source.title;

  switch (element.type) {
    case 'character-image':
    case 'image-card':
    case 'image':
      content.alt = source.alt;
      content.aspectRatio = source.aspectRatio;
      content.caption = '';
      content.imageUrl = '';
      break;
    case 'name-badge':
      content.nameFields = (source.nameFields || []).map((field) => ({
        id: field.id,
        label: field.label,
        value: '',
        fontSize: field.fontSize,
        fontWeight: field.fontWeight,
        color: field.color,
        isPrimary: field.isPrimary,
      }));
      break;
    case 'detail-card':
    case 'info-card':
    case 'info-field':
      content.infoDisplayMode = source.infoDisplayMode;
      content.infoCardItems = (source.infoCardItems || []).map((item) => ({ ...item, value: '' }));
      break;
    case 'narrative-card':
      content.placeholder = source.placeholder;
      content.narrativeText = '';
      break;
    case 'text-card':
    case 'text':
      content.text = '';
      break;
    case 'tag-card':
    case 'keyword-card':
      content.tagDisplayMode = source.tagDisplayMode;
      content.tags = (source.tags || []).map((tag) => ({ ...tag, text: '' }));
      break;
    case 'quote-card':
      content.quoteStyle = source.quoteStyle;
      content.quoteText = '';
      content.quoteSituation = '';
      break;
    case 'memo-card':
      content.memoContent = '';
      break;
    case 'palette-card':
      content.paletteShape = source.paletteShape;
      content.showPaletteHex = source.showPaletteHex;
      content.paletteColors = (source.paletteColors || []).map((color) => ({
        id: color.id,
        color: '#E5E7EB',
        label: '',
      }));
      break;
    case 'gallery-card':
      content.galleryImages = (source.galleryImages || []).map((image) => ({
        id: image.id,
        url: '',
        caption: '',
        alt: '',
        tag: image.tag,
      }));
      break;
    case 'table-card':
      content.tableHeaders = [...(source.tableHeaders || [])];
      content.tableRows = (source.tableRows || []).map((row) => row.map(() => ''));
      break;
    case 'doc-link-card':
      content.targetDocumentId = '';
      content.targetDocumentTitle = '';
      break;
    case 'video-card':
      content.videoUrl = '';
      break;
    case 'audio-card':
      content.audioUrl = '';
      content.audioFileName = '';
      break;
    case 'profile-card':
      content.profileImageUrl = '';
      content.profileName = '';
      content.profileNickname = '';
      content.profileSummary = '';
      break;
    case 'stat-card':
    case 'radar-chart':
    case 'status-chart':
      content.statMode = source.statMode;
      content.statItems = (source.statItems || []).map((item) => ({ ...item, value: 0 }));
      content.radarAxes = (source.radarAxes || []).map((axis) => ({ ...axis, value: 0 }));
      content.radarMaxValue = source.radarMaxValue;
      content.radarColor = source.radarColor;
      content.radarFillOpacity = source.radarFillOpacity;
      break;
    case 'relationship-card':
      content.relationships = (source.relationships || []).map((item) => ({
        id: item.id,
        name: '',
        relation: '',
        description: '',
        color: item.color,
      }));
      break;
    case 'hierarchy-card':
      content.hierarchyItems = (source.hierarchyItems || []).map((item) => ({
        id: item.id,
        label: '',
        parentId: item.parentId,
        isOpen: item.isOpen,
      }));
      break;
    case 'category-list-card':
      content.categoryGroups = (source.categoryGroups || []).map((group) => ({
        id: group.id,
        name: '',
        items: group.items.map((item) => ({ id: item.id, text: '', subText: '' })),
      }));
      break;
    case 'zone-card':
      content.zoneLocations = (source.zoneLocations || []).map((location) => ({
        id: location.id,
        name: '',
        icon: location.icon,
        imageUrl: '',
        summary: '',
        features: '',
      }));
      break;
    case 'spacer':
      content.spacerHeight = source.spacerHeight;
      break;
    case 'divider':
      content.lineStyle = source.lineStyle;
      break;
    case 'heading':
    case 'section-heading':
      content.text = '';
      break;
    default:
      break;
  }

  return content;
}

/** Store only reusable layout, component structure and appearance, never document values or links. */
export function createCanvasLayoutTemplate(canvas: CanvasDocumentData): CanvasDocumentData {
  return {
    ...canvas,
    elements: canvas.elements.map((element) => ({
      ...element,
      content: blankContentForTemplate(element),
    })),
  };
}

/** Apply layout and appearance while keeping every existing element ID and content payload. */
export function applyCanvasLayoutTemplate(
  current: CanvasDocumentData,
  template: CanvasDocumentData
): CanvasDocumentData {
  const unusedCurrent = new Set(current.elements.map((element) => element.id));
  const currentTypeCounts = new Map<string, number>();
  const templateTypeCounts = new Map<string, number>();
  current.elements.forEach((element) => currentTypeCounts.set(element.type, (currentTypeCounts.get(element.type) || 0) + 1));
  template.elements.forEach((element) => templateTypeCounts.set(element.type, (templateTypeCounts.get(element.type) || 0) + 1));
  const elements: CanvasElement[] = template.elements.map((layoutElement) => {
    const currentMatch = current.elements.find(
      (element) => unusedCurrent.has(element.id) && element.id === layoutElement.id && element.type === layoutElement.type
    ) || (currentTypeCounts.get(layoutElement.type) === 1 && templateTypeCounts.get(layoutElement.type) === 1
      ? current.elements.find((element) => unusedCurrent.has(element.id) && element.type === layoutElement.type)
      : undefined);

    if (!currentMatch) {
      return {
        ...layoutElement,
        id: generateId('el'),
        content: blankContentForTemplate(layoutElement),
      };
    }

    unusedCurrent.delete(currentMatch.id);
    return {
      ...layoutElement,
      id: currentMatch.id,
      content: currentMatch.content,
      style: layoutElement.style ? { ...layoutElement.style } : currentMatch.style,
    };
  });

  const retainedElements = current.elements.filter((element) => unusedCurrent.has(element.id));
  const maxRight = [...elements, ...retainedElements].reduce((max, element) => Math.max(max, element.x + element.width + 40), 0);
  const maxBottom = [...elements, ...retainedElements].reduce((max, element) => Math.max(max, element.y + element.height + 40), 0);

  return {
    ...current,
    canvasWidth: Math.max(current.canvasWidth, template.canvasWidth, maxRight),
    canvasHeight: Math.max(current.canvasHeight, template.canvasHeight, maxBottom),
    backgroundColor: template.backgroundColor,
    gradient: template.gradient,
    pattern: template.pattern,
    elements: [...elements, ...retainedElements],
  };
}
