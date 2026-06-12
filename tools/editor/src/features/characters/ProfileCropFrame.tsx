import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef } from "react";
import type { PointerPoint } from "../../editorTypes";
import { loadImageElement } from "../../lib/imageLoading";
import { round4Number } from "../../lib/numeric";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import { drawProfileCropCanvas, profileCropCanvasSize } from "./portraitCanvas";
import {
  getProfileOffset,
  getProfileZoom,
  withProfileOffset
} from "./portraitModel";

export function ProfileCropFrame({
  compact,
  dragLocked = false,
  faceCenter,
  imagePath,
  profile,
  onChangeProfile
}: {
  compact?: boolean;
  dragLocked?: boolean;
  faceCenter: PointerPoint;
  imagePath: unknown;
  profile: ResourceRecord;
  onChangeProfile?: (nextProfile: ResourceRecord) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const imageUrl = resPathToAssetUrl(imagePath);
  const offset = getProfileOffset(profile);
  const zoom = getProfileZoom(profile.zoom);
  const frameStateRef = useRef({ faceCenter, offset, zoom });

  useEffect(() => {
    const canvas = canvasRef.current;
    frameStateRef.current = { faceCenter, offset, zoom };
    if (canvas) drawProfileCropCanvas(canvas, imageRef.current, faceCenter, { zoom, offset });
  }, [faceCenter.x, faceCenter.y, offset.x, offset.y, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;

    imageRef.current = null;
    drawProfileCropCanvas(canvas, null, frameStateRef.current.faceCenter, {
      zoom: frameStateRef.current.zoom,
      offset: frameStateRef.current.offset
    });

    if (!imageUrl) return () => {
      cancelled = true;
    };

    loadImageElement(imageUrl)
      .then((image) => {
        if (cancelled) return;
        imageRef.current = image;
        drawProfileCropCanvas(canvas, image, frameStateRef.current.faceCenter, {
          zoom: frameStateRef.current.zoom,
          offset: frameStateRef.current.offset
        });
      })
      .catch(() => {
        if (cancelled) return;
        imageRef.current = null;
        drawProfileCropCanvas(canvas, null, frameStateRef.current.faceCenter, {
          zoom: frameStateRef.current.zoom,
          offset: frameStateRef.current.offset
        });
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return undefined;
    const redraw = () => drawProfileCropCanvas(canvas, imageRef.current, frameStateRef.current.faceCenter, {
      zoom: frameStateRef.current.zoom,
      offset: frameStateRef.current.offset
    });
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (profileCropCanvasSize / rect.width),
      y: (event.clientY - rect.top) * (profileCropCanvasSize / rect.height)
    };
  }

  function updateOffset(nextOffset: PointerPoint) {
    if (!onChangeProfile) return;
    const nextProfile = withProfileOffset(profile, nextOffset);
    const canvas = canvasRef.current;
    if (canvas) {
      drawProfileCropCanvas(canvas, imageRef.current, faceCenter, {
        zoom: getProfileZoom(nextProfile.zoom),
        offset: getProfileOffset(nextProfile)
      });
    }
    onChangeProfile(nextProfile);
  }

  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <div className={`profile-crop-frame ${compact ? "compact" : ""}`}>
      <canvas
        aria-label="Profile crop preview"
        className={`${onChangeProfile ? "editable" : ""} ${dragLocked ? "drag-locked" : ""}`}
        height={profileCropCanvasSize}
        onPointerCancel={stopDrag}
        onPointerDown={(event) => {
          if (dragLocked || !onChangeProfile || !imageRef.current) return;
          const point = canvasPoint(event);
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: point.x,
            startY: point.y,
            offsetX: offset.x,
            offsetY: offset.y
          };
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (dragLocked) return;
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const point = canvasPoint(event);
          updateOffset({
            x: round4Number(drag.offsetX + (point.x - drag.startX) / profileCropCanvasSize),
            y: round4Number(drag.offsetY + (point.y - drag.startY) / profileCropCanvasSize)
          });
          event.preventDefault();
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              // Pointer capture can already be released by the browser.
            }
          }
          stopDrag();
        }}
        ref={canvasRef}
        width={profileCropCanvasSize}
      />
    </div>
  );
}
