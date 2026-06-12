import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import { DragLockHint, DragLockToggle, useMobileDragLock } from "../../components/DragLock";
import { Icon, NumberField, SelectField, TextField, ToggleField } from "../../components/EditorControls";
import type { ReferenceResources } from "../../editorTypes";
import { clamp01Number, clampNumber, round4Number, roundForInput } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import {
  getBackgroundStoryAssetOptions,
  getDialogueBackgroundEditorValue,
  getDialogueBackgroundPreviewImageSize,
  getDialogueBackgroundPreviewImageStyle,
  getDialogueBackgroundPreviewUrl,
  removeDialogueBackgroundEvent,
  upsertDialogueBackgroundEvent,
  type DialogueBackgroundEditorValue
} from "./dialogueNodeBackgroundModel";

export function DialogueNodeBackgroundEditor({
  node,
  references,
  onTextChange
}: {
  node: ResourceRecord;
  references: ReferenceResources;
  onTextChange: (nextText: string) => void;
}) {
  const text = String(node.text || "");
  const value = getDialogueBackgroundEditorValue(text);
  const backgroundAssetOptions = getBackgroundStoryAssetOptions(references.storyAssets);
  const previewUrl = getDialogueBackgroundPreviewUrl(value, references.storyAssets);
  const [imageAspect, setImageAspect] = useState(16 / 9);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originalX: number; originalY: number; imageWidth: number; imageHeight: number } | null>(null);
  const dragLock = useMobileDragLock();

  function commit(nextValue: DialogueBackgroundEditorValue) {
    onTextChange(upsertDialogueBackgroundEvent(text, nextValue));
  }

  function toggleBackground(checked: boolean) {
    if (!checked) {
      onTextChange(removeDialogueBackgroundEvent(text, value));
      return;
    }
    commit({ ...value, enabled: true });
  }

  function patch(patchValue: Partial<DialogueBackgroundEditorValue>) {
    commit({ ...value, enabled: true, ...patchValue });
  }

  function setZoom(nextZoom: number) {
    patch({ zoom: roundForInput(clampNumber(nextZoom, 1, 6, 1)) });
  }

  function setFocus(nextX: number, nextY: number) {
    patch({
      x: round4Number(clamp01Number(nextX, 0.5)),
      y: round4Number(clamp01Number(nextY, 0.5))
    });
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!value.enabled || !previewUrl || event.button !== 0 || dragLock.locked) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const imageSize = getDialogueBackgroundPreviewImageSize(rect.width, rect.height, value.zoom, imageAspect);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originalX: value.x,
      originalY: value.y,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height
    };
    event.preventDefault();
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag) return;
    setFocus(
      drag.originalX - (event.clientX - drag.startX) / Math.max(1, drag.imageWidth),
      drag.originalY - (event.clientY - drag.startY) / Math.max(1, drag.imageHeight)
    );
    event.preventDefault();
  }

  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <section className={`dialogue-background-editor ${value.enabled ? "enabled" : ""}`}>
      <div className="dialogue-background-toggle-row">
        <ToggleField label="배경 조정" checked={value.enabled} onChange={toggleBackground} />
        {value.enabled && (
          <code>{value.id ? `id ${value.id}` : value.path || "배경 미지정"} · zoom {value.zoom.toFixed(2)} · {value.x.toFixed(2)}, {value.y.toFixed(2)}</code>
        )}
      </div>
      {value.enabled && (
        <div className="dialogue-background-workspace">
          <div className="dialogue-background-preview-wrap">
            <div className="coordinate-editor-header">
              <span>배경 위치</span>
              <div className="coordinate-editor-meta">
                <code>drag</code>
                <DragLockToggle
                  available={dragLock.available}
                  locked={dragLock.locked}
                  onToggle={dragLock.toggle}
                />
              </div>
            </div>
            <div
              className={`dialogue-background-preview-stage ${previewUrl ? "has-image" : ""} ${dragLock.locked ? "drag-locked" : ""}`}
              onPointerCancel={stopDrag}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              ref={stageRef}
            >
              <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
              {previewUrl ? (
                <img
                  alt=""
                  draggable={false}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    const width = image.naturalWidth || image.width || 16;
                    const height = image.naturalHeight || image.height || 9;
                    if (width > 0 && height > 0) setImageAspect(width / height);
                  }}
                  src={previewUrl}
                  style={getDialogueBackgroundPreviewImageStyle(value, imageAspect)}
                />
              ) : (
                <span>배경 에셋이나 경로를 선택하세요.</span>
              )}
            </div>
          </div>
          <div className="background-adjust-panel dialogue-background-controls">
            <div className="background-adjust-grid">
              <SelectField
                label="배경 에셋"
                value={value.id}
                options={backgroundAssetOptions}
                onChange={(id) => patch({ id, path: id ? "" : value.path })}
              />
              <div className="background-adjust-wide">
                <TextField label="직접 경로" value={value.path} onChange={(path) => patch({ id: "", path })} />
              </div>
              <NumberField label="X" value={value.x} min={0} max={1} step={0.01} resetValue={0.5} onChange={(x) => setFocus(x, value.y)} />
              <NumberField label="Y" value={value.y} min={0} max={1} step={0.01} resetValue={0.5} onChange={(y) => setFocus(value.x, y)} />
              <NumberField label="줌" value={value.zoom} min={1} max={6} step={0.05} resetValue={1} onChange={setZoom} />
              <div className="background-adjust-actions">
                <button aria-label="배경 줌아웃" type="button" onClick={() => setZoom(value.zoom - 0.05)}><Icon name="ZoomOut" /></button>
                <button aria-label="배경 줌 초기화" type="button" onClick={() => setZoom(1)}><Icon name="SettingsBackupRestore" /></button>
                <button aria-label="배경 줌인" type="button" onClick={() => setZoom(value.zoom + 0.05)}><Icon name="ZoomIn" /></button>
                <button aria-label="배경 가운데 정렬" type="button" onClick={() => setFocus(0.5, 0.5)}><Icon name="CenterFocusStrong" /></button>
              </div>
              <NumberField label="전환 시간" value={value.duration} min={0} max={10} step={0.1} resetValue={0.5} onChange={(duration) => patch({ duration })} />
              <NumberField label="흐림" value={value.blur} min={0} max={12} step={0.5} resetValue={3} onChange={(blur) => patch({ blur })} />
              <NumberField label="어둡게" value={value.dim} min={0} max={1} step={0.05} resetValue={0.15} onChange={(dim) => patch({ dim })} />
              <ToggleField label="고정" checked={value.fixed} onChange={(fixed) => patch({ fixed })} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
