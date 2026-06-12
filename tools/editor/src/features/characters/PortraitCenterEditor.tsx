import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { CoordinateNudgeToolbar } from "../../components/CoordinateNudgeToolbar";
import { DragLockToggle, useMobileDragLock } from "../../components/DragLock";
import { Icon } from "../../components/EditorControls";
import type { PointerPoint } from "../../editorTypes";
import { loadImageElement } from "../../lib/imageLoading";
import { clamp01Number, roundCoordinate } from "../../lib/numeric";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import {
  clampPortraitCenterZoom,
  drawPortraitCenterCanvas,
  portraitCenterCanvasHeight,
  portraitCenterCanvasWidth,
  portraitCenterFromOffset,
  portraitCenterOffsetFromCenter,
  portraitCenterZoomDefault,
  portraitCenterZoomStep
} from "./portraitCanvas";

export function PortraitCenterEditor({
  label,
  imagePath,
  x,
  y,
  onChange
}: {
  label: string;
  imagePath: unknown;
  x: unknown;
  y: unknown;
  onChange: (x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageOffsetRef = useRef<PointerPoint>({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const [viewZoom, setViewZoom] = useState(portraitCenterZoomDefault);
  const [displayCenter, setDisplayCenter] = useState<PointerPoint>(() => ({
    x: clamp01Number(x, 0.5),
    y: clamp01Number(y, 0.5)
  }));
  const displayCenterRef = useRef(displayCenter);
  const imageUrl = resPathToAssetUrl(imagePath);
  const dragLock = useMobileDragLock();
  const safeCenter = {
    x: clamp01Number(x, 0.5),
    y: clamp01Number(y, 0.5)
  };

  function redraw(center = displayCenter) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawPortraitCenterCanvas(canvas, imageRef.current, imageOffsetRef.current, center, viewZoom);
  }

  function updateDisplayCenter(center: PointerPoint) {
    displayCenterRef.current = center;
    setDisplayCenter(center);
  }

  function setOffsetForCenter(center: PointerPoint) {
    const image = imageRef.current;
    imageOffsetRef.current = image ? portraitCenterOffsetFromCenter(image, center, viewZoom) : { x: 0, y: 0 };
  }

  useEffect(() => {
    const center = { x: safeCenter.x, y: safeCenter.y };
    if (!dragRef.current) {
      updateDisplayCenter(center);
      setOffsetForCenter(center);
    }
    redraw(center);
  }, [safeCenter.x, safeCenter.y, viewZoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    imageRef.current = null;
    setOffsetForCenter(safeCenter);
    redraw(safeCenter);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => redraw());
      resizeObserver.observe(canvas);
    }

    if (imageUrl) {
      loadImageElement(imageUrl)
        .then((image) => {
          if (cancelled) return;
          imageRef.current = image;
          setOffsetForCenter(safeCenter);
          redraw(safeCenter);
        })
        .catch(() => {
          if (cancelled) return;
          imageRef.current = null;
          setOffsetForCenter(safeCenter);
          redraw(safeCenter);
        });
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [imageUrl]);

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (portraitCenterCanvasWidth / rect.width),
      y: (event.clientY - rect.top) * (portraitCenterCanvasHeight / rect.height)
    };
  }

  function commitCenter(center: PointerPoint) {
    onChange(roundCoordinate(center.x), roundCoordinate(center.y));
  }

  function updateZoom(nextZoom: number) {
    setViewZoom(clampPortraitCenterZoom(nextZoom));
  }

  function stopDrag(event?: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (event && drag.pointerId === event.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture can already be released by the browser.
      }
    }
    commitCenter(displayCenterRef.current);
  }

  return (
    <div className="portrait-center-editor">
      <div className="coordinate-editor-header">
        <span>{label}</span>
        <div className="coordinate-editor-meta">
          <code>{displayCenter.x.toFixed(3)}, {displayCenter.y.toFixed(3)}</code>
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <div className="portrait-center-frame">
        <canvas
          aria-label={`${label} preview`}
          className={dragLock.locked ? "drag-locked" : ""}
          height={portraitCenterCanvasHeight}
          onPointerCancel={(event) => stopDrag(event)}
          onPointerDown={(event) => {
            if (dragLock.locked || !imageRef.current) return;
            const point = canvasPoint(event);
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              pointerId: event.pointerId,
              startX: point.x,
              startY: point.y,
              offsetX: imageOffsetRef.current.x,
              offsetY: imageOffsetRef.current.y
            };
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (dragLock.locked) return;
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            const point = canvasPoint(event);
            imageOffsetRef.current = {
              x: drag.offsetX + point.x - drag.startX,
              y: drag.offsetY + point.y - drag.startY
            };
            const nextCenter = portraitCenterFromOffset(imageRef.current, imageOffsetRef.current, viewZoom);
            updateDisplayCenter(nextCenter);
            drawPortraitCenterCanvas(event.currentTarget, imageRef.current, imageOffsetRef.current, nextCenter, viewZoom);
            event.preventDefault();
          }}
          onPointerUp={(event) => stopDrag(event)}
          ref={canvasRef}
          width={portraitCenterCanvasWidth}
        />
      </div>
      <div className="profile-crop-actions portrait-center-actions">
        <button type="button" onClick={() => updateZoom(viewZoom - portraitCenterZoomStep)}><Icon name="ZoomOut" />축소</button>
        <button type="button" onClick={() => updateZoom(portraitCenterZoomDefault)}><Icon name="SettingsBackupRestore" />줌 초기화</button>
        <button type="button" onClick={() => updateZoom(viewZoom + portraitCenterZoomStep)}><Icon name="ZoomIn" />확대</button>
      </div>
      <CoordinateNudgeToolbar
        label={label}
        onChange={onChange}
        resetX={0.5}
        resetY={0.5}
        x={displayCenter.x}
        y={displayCenter.y}
      />
    </div>
  );
}
