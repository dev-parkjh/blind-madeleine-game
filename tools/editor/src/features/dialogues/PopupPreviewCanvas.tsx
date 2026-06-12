import { useEffect, useRef } from "react";
import { loadImageElement } from "../../lib/imageLoading";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import { getProfileOffset, getProfileZoom } from "../characters/portraitModel";
import type { PopupPreviewEntry } from "./nodePopupPreviewModel";

export function PopupPreviewCanvas({ entry }: { entry: PopupPreviewEntry }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageUrl = resPathToAssetUrl(entry.imagePath);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let image: HTMLImageElement | null = null;

    function redraw() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || entry.size.x));
      const height = Math.max(1, Math.round(rect.height || entry.size.y));
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(9, 8, 8, 0.86)";
      ctx.fillRect(0, 0, width, height);
      if (!image) {
        ctx.fillStyle = "rgba(203, 211, 224, 0.72)";
        ctx.font = "700 12px Pretendard, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("이미지 없음", width * 0.5, height * 0.5);
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      if (entry.source === "character_profile") {
        const profileOffset = getProfileOffset(entry.profile);
        const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const drawW = image.naturalWidth * baseScale * getProfileZoom(entry.profile.zoom);
        const drawH = image.naturalHeight * baseScale * getProfileZoom(entry.profile.zoom);
        const anchorX = width * 0.5 + profileOffset.x * width;
        const anchorY = height * 0.5 + profileOffset.y * height;
        ctx.drawImage(
          image,
          Math.round(anchorX - entry.center.x * drawW),
          Math.round(anchorY - entry.center.y * drawH),
          Math.max(1, Math.round(drawW)),
          Math.max(1, Math.round(drawH))
        );
      } else {
        const mode = entry.imageMode === "cover" || entry.imageMode === "crop" ? "cover" : "fit";
        const baseScale = mode === "cover"
          ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
          : Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawW = image.naturalWidth * baseScale * entry.imageZoom;
        const drawH = image.naturalHeight * baseScale * entry.imageZoom;
        ctx.drawImage(
          image,
          Math.round(width * 0.5 - drawW * 0.5),
          Math.round(height * 0.5 - drawH * 0.5),
          Math.max(1, Math.round(drawW)),
          Math.max(1, Math.round(drawH))
        );
      }
      ctx.restore();
    }

    redraw();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(redraw);
      resizeObserver.observe(canvas);
    }
    if (imageUrl) {
      loadImageElement(imageUrl)
        .then((loaded) => {
          if (cancelled) return;
          image = loaded;
          redraw();
        })
        .catch(() => {
          if (cancelled) return;
          image = null;
          redraw();
        });
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [entry.center.x, entry.center.y, entry.imageMode, entry.imagePath, entry.imageZoom, entry.profile, entry.size.x, entry.size.y, entry.source, imageUrl]);

  return <canvas aria-hidden="true" ref={canvasRef} />;
}
