import { Icon, NumberField, SelectLiteralField, TextField, ToggleField, UploadField } from "../../components/EditorControls";
import { fileExtension, safeSegment } from "../../lib/files";
import type { ResourceRecord } from "../../types";
import {
  getParallaxLayerAnchor,
  getParallaxLayerEditorKind,
  getParallaxLayerMotionStrength,
  getParallaxLayerPath,
  getParallaxLayerPosition,
  getParallaxLayerScale,
  getParallaxLayerScaleX,
  getParallaxLayerScaleY,
  parallaxLayerTransformSummary
} from "./chapterArtModel";

export function ChapterLayerInspector({
  disabled,
  draftId,
  index,
  layer,
  onRemoveLayer,
  onUpdateLayer,
  uploadFile
}: {
  disabled: boolean;
  draftId: unknown;
  index: number;
  layer: ResourceRecord | undefined;
  onRemoveLayer: (index: number) => void;
  onUpdateLayer: (index: number, patch: ResourceRecord) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  if (!layer) {
    return (
      <aside className="chapter-layer-inspector empty" aria-label="Selected parallax layer options">
        <p className="empty-state">선택된 레이어가 없습니다.</p>
      </aside>
    );
  }

  const position = getParallaxLayerPosition(layer);
  const anchor = getParallaxLayerAnchor(layer);
  const scale = getParallaxLayerScale(layer);
  const layerLabel = String(layer.name || layer.id || `Layer ${index + 1}`);

  return (
    <aside className="chapter-layer-inspector" aria-label="Selected parallax layer options" data-parallax-layer-target={index}>
      <div className="chapter-layer-inspector-header">
        <span>{index + 1}</span>
        <div>
          <strong>{layerLabel}</strong>
          <code>{String(layer.kind || "sprite")} · {parallaxLayerTransformSummary(layer)}</code>
        </div>
      </div>
      <div className="chapter-layer-inspector-grid">
        <TextField label="ID" value={layer.id || ""} onChange={(value) => onUpdateLayer(index, { id: safeSegment(value, `layer_${index + 1}`) })} />
        <TextField label="Name" value={layer.name || ""} onChange={(value) => onUpdateLayer(index, { name: value })} />
        <SelectLiteralField label="Kind" value={getParallaxLayerEditorKind(layer)} options={["background", "sprite", "overlay", "title"]} onChange={(value) => onUpdateLayer(index, { kind: value })} />
        <NumberField label="Order" value={layer.order ?? index} step={1} resetValue={index} onChange={(value) => onUpdateLayer(index, { order: value })} />
        <div className="chapter-layer-inspector-wide">
          <TextField label="Path" value={getParallaxLayerPath(layer)} onChange={(value) => onUpdateLayer(index, { path: value })} />
        </div>
        <UploadField
          disabled={disabled}
          label="Upload layer"
          accept="image/png,image/jpeg,image/webp"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/chapters/${safeSegment(draftId || "chapter")}/${safeSegment(layer.id || `layer_${index + 1}`)}.${fileExtension(file)}`, file);
            onUpdateLayer(index, { path });
            return path;
          }}
        />
        <NumberField label="X" value={position[0] ?? 0.5} min={-0.5} max={1.5} step={0.01} resetValue={0.5} onChange={(value) => onUpdateLayer(index, { position: [value, position[1] ?? 0.5] })} />
        <NumberField label="Y" value={position[1] ?? 0.5} min={-0.5} max={1.5} step={0.01} resetValue={0.5} onChange={(value) => onUpdateLayer(index, { position: [position[0] ?? 0.5, value] })} />
        <NumberField label="Anchor X" value={anchor[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdateLayer(index, { anchor: [value, anchor[1] ?? 0.5] })} />
        <NumberField label="Anchor Y" value={anchor[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdateLayer(index, { anchor: [anchor[0] ?? 0.5, value] })} />
        <NumberField label="Scale" value={layer.scale ?? 1} min={0} step={0.05} resetValue={1} onChange={(value) => onUpdateLayer(index, { scale: value, scale_x: value, scale_y: value })} />
        <NumberField label="Scale X" value={getParallaxLayerScaleX(layer)} min={0.05} max={3} step={0.01} resetValue={scale} onChange={(value) => onUpdateLayer(index, { scale_x: value })} />
        <NumberField label="Scale Y" value={getParallaxLayerScaleY(layer)} min={0.05} max={3} step={0.01} resetValue={scale} onChange={(value) => onUpdateLayer(index, { scale_y: value })} />
        <NumberField label="Rotation" value={layer.rotation ?? 0} step={1} resetValue={0} onChange={(value) => onUpdateLayer(index, { rotation: value })} />
        <NumberField label="Depth" value={layer.depth ?? 0.3} step={0.05} resetValue={0.3} onChange={(value) => onUpdateLayer(index, { depth: value })} />
        <NumberField label="Perspective" value={layer.perspective ?? 0} step={0.05} resetValue={0} onChange={(value) => onUpdateLayer(index, { perspective: value })} />
        <NumberField label="Motion strength" value={getParallaxLayerMotionStrength(layer)} min={0} max={4} step={0.05} resetValue={1} onChange={(value) => onUpdateLayer(index, { motion_strength: value })} />
        <NumberField label="Opacity" value={layer.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => onUpdateLayer(index, { opacity: value })} />
        <ToggleField label="Visible" checked={layer.visible !== false} onChange={(checked) => onUpdateLayer(index, { visible: checked })} />
        <ToggleField label="Floating" checked={layer.floating !== false} onChange={(checked) => onUpdateLayer(index, { floating: checked })} />
        <ToggleField label="Thumbnail excluded" checked={Boolean(layer.thumbnail_excluded)} onChange={(checked) => onUpdateLayer(index, { thumbnail_excluded: checked })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={() => onRemoveLayer(index)}><Icon name="Delete" />삭제</button>
      </div>
    </aside>
  );
}
