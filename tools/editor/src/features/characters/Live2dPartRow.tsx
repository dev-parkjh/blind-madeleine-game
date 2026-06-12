import { useEffect, useState } from "react";
import { Icon, NumberField, TextField, UploadField } from "../../components/EditorControls";
import type { PointerPoint } from "../../editorTypes";
import { fileExtension, safeSegment } from "../../lib/files";
import type { ResourceRecord } from "../../types";
import type { Live2dEditorCopy } from "./live2dEditorCopy";
import { getLive2dPoint } from "./live2dModel";

export function Live2dPartRow({
  canvasSize,
  characterId,
  copy,
  disabled,
  onRemove,
  onRename,
  onUpdate,
  part,
  uploadFile
}: {
  canvasSize: PointerPoint;
  characterId: string;
  copy: Live2dEditorCopy;
  disabled: boolean;
  onRemove: () => void;
  onRename: (nextId: string) => void;
  onUpdate: (patch: ResourceRecord) => void;
  part: ResourceRecord;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const [draftId, setDraftId] = useState(String(part.id || ""));
  const position = getLive2dPoint(part.position, canvasSize.x * 0.5, canvasSize.y * 0.5);
  const anchor = getLive2dPoint(part.anchor, 0.5, 0.5);
  const scale = getLive2dPoint(part.scale, 1, 1);

  useEffect(() => {
    setDraftId(String(part.id || ""));
  }, [part.id]);

  function commitPartId() {
    const clean = safeSegment(draftId || part.id || "part", "part");
    setDraftId(clean);
    if (clean !== part.id) onRename(clean);
  }

  return (
    <article className="structured-row live2d-part-row">
      <div className="live2d-part-main">
        <TextField
          label={copy.partId}
          value={draftId}
          onBlur={commitPartId}
          onChange={setDraftId}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <TextField label={copy.path} value={part.path || ""} onChange={(value) => onUpdate({ path: value })} />
        <UploadField
          disabled={disabled}
          label={copy.uploadPart}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/characters/${safeSegment(characterId)}/live2d/${safeSegment(part.id || "part")}.${fileExtension(file)}`, file);
            onUpdate({ path });
            return path;
          }}
        />
      </div>
      <div className="live2d-part-controls">
        <NumberField label={copy.zIndex} value={part.z_index ?? part.order ?? 0} min={-100} max={100} step={1} resetValue={0} onChange={(value) => onUpdate({ z_index: value })} />
        <NumberField label={copy.x} value={position.x} min={-canvasSize.x} max={canvasSize.x * 2} step={1} resetValue={canvasSize.x * 0.5} onChange={(value) => onUpdate({ position: [value, position.y] })} />
        <NumberField label={copy.y} value={position.y} min={-canvasSize.y} max={canvasSize.y * 2} step={1} resetValue={canvasSize.y * 0.5} onChange={(value) => onUpdate({ position: [position.x, value] })} />
        <NumberField label={copy.anchorX} value={anchor.x} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ anchor: [value, anchor.y] })} />
        <NumberField label={copy.anchorY} value={anchor.y} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ anchor: [anchor.x, value] })} />
        <NumberField label={copy.scaleX} value={scale.x} min={0.01} max={5} step={0.01} resetValue={1} onChange={(value) => onUpdate({ scale: [value, scale.y] })} />
        <NumberField label={copy.scaleY} value={scale.y} min={0.01} max={5} step={0.01} resetValue={1} onChange={(value) => onUpdate({ scale: [scale.x, value] })} />
        <NumberField label={copy.rotation} value={part.rotation ?? 0} min={-360} max={360} step={1} resetValue={0} onChange={(value) => onUpdate({ rotation: value })} />
        <NumberField label={copy.opacity} value={part.opacity ?? part.alpha ?? 1} min={0} max={1} step={0.01} resetValue={1} onChange={(value) => onUpdate({ opacity: value })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={onRemove}><Icon name="Delete" />{copy.deletePart}</button>
      </div>
    </article>
  );
}
