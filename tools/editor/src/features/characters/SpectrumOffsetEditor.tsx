import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { CoordinateNudgeToolbar } from "../../components/CoordinateNudgeToolbar";
import { DragLockHint, DragLockToggle, useMobileDragLock } from "../../components/DragLock";
import { NumberField } from "../../components/EditorControls";
import { loadImageElement } from "../../lib/imageLoading";
import { clampNumber, round4Number } from "../../lib/numeric";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import {
  drawSpectrumOffsetCanvas,
  getGameFacePosition,
  portraitEditorCanvasHeight,
  portraitEditorCanvasWidth
} from "./portraitCanvas";
import {
  getDefaultSpectrumPortrait,
  getPortraitCenterPoint,
  getSpectrumOffset
} from "./portraitModel";

export function SpectrumOffsetEditor({
  draft,
  updateField
}: {
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("");
  const portrait = getDefaultSpectrumPortrait(draft.portraits);
  const imageUrl = resPathToAssetUrl(portrait?.path);
  const faceCenter = getPortraitCenterPoint(portrait?.center);
  const offset = getSpectrumOffset(draft.spectrum_offset);
  const nameColor = String(draft.name_color || "#ffffff");
  const dragLock = useMobileDragLock();

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (!imageUrl) {
      drawSpectrumOffsetCanvas(canvas, null, faceCenter, offset, nameColor);
      setStatus("default 초상 또는 경로가 있는 초상이 필요합니다.");
      return undefined;
    }

    setStatus("이미지 로딩 중");
    loadImageElement(imageUrl)
      .then((image) => {
        if (cancelled) return;
        drawSpectrumOffsetCanvas(canvas, image, faceCenter, offset, nameColor);
        setStatus("");
      })
      .catch(() => {
        if (cancelled) return;
        drawSpectrumOffsetCanvas(canvas, null, faceCenter, offset, nameColor);
        setStatus("이미지를 불러올 수 없습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [faceCenter.x, faceCenter.y, imageUrl, nameColor, offset.x, offset.y]);

  function updateOffset(nextX: number, nextY: number) {
    updateField("spectrum_offset", [round4Number(nextX), round4Number(nextY)]);
  }

  function updateFromPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const canvasX = (event.clientX - rect.left) * (portraitEditorCanvasWidth / rect.width);
    const canvasY = (event.clientY - rect.top) * (portraitEditorCanvasHeight / rect.height);
    const face = getGameFacePosition();
    updateOffset(
      clampNumber((canvasX - face.x) / portraitEditorCanvasWidth, -1, 1, offset.x),
      clampNumber((canvasY - face.y) / portraitEditorCanvasHeight, -1, 1, offset.y)
    );
  }

  return (
    <div className="spectrum-offset-editor wide">
      <div className="coordinate-editor-header">
        <span>Spectrum offset</span>
        <div className="coordinate-editor-meta">
          <code>{offset.x.toFixed(4)}, {offset.y.toFixed(4)}</code>
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <div className="drag-lock-surface">
        <canvas
          className={`spectrum-offset-canvas ${dragLock.locked ? "drag-locked" : ""}`}
          height={portraitEditorCanvasHeight}
          onPointerDown={(event) => {
            if (dragLock.locked) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            updateFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (dragLock.locked) return;
            if (event.buttons !== 1) return;
            updateFromPointer(event);
          }}
          ref={canvasRef}
          width={portraitEditorCanvasWidth}
        />
        <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
      </div>
      <CoordinateNudgeToolbar
        label="Spectrum offset"
        max={1}
        min={-1}
        onChange={updateOffset}
        resetX={0}
        resetY={0}
        step={0.01}
        x={offset.x}
        y={offset.y}
      />
      <div className="form-grid compact">
        <NumberField label="Spectrum X" value={offset.x} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updateOffset(value, offset.y)} />
        <NumberField label="Spectrum Y" value={offset.y} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updateOffset(offset.x, value)} />
      </div>
      {status && <p className="media-preview-status">{status}</p>}
    </div>
  );
}
