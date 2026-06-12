import type { PointerPoint } from "../../editorTypes";
import { clamp01Number, clampNumber, round4Number, roundForInput } from "../../lib/numeric";
import {
  portraitCenterCanvasHeight,
  portraitCenterCanvasWidth,
  portraitCenterZoomDefault,
  portraitCenterZoomMax,
  portraitCenterZoomMin,
  portraitCenterZoomStep,
  setupFixedCanvas
} from "./portraitCanvasShared";

const portraitCenterAnchorX = 0.5;
const portraitCenterAnchorYAt100 = 0.2;
const portraitCenterAnchorYAt500 = 0.5;
const portraitCenterAnchorYZoomLo = 1;
const portraitCenterAnchorYZoomHi = 5;

export function clampPortraitCenterZoom(value: unknown) {
  const step = portraitCenterZoomStep;
  const raw = Number(value);
  const clamped = clampNumber(Number.isFinite(raw) ? raw : portraitCenterZoomDefault, portraitCenterZoomMin, portraitCenterZoomMax, portraitCenterZoomDefault);
  return roundForInput(Math.round(clamped / step) * step);
}

export function portraitCenterOffsetFromCenter(image: HTMLImageElement, center: PointerPoint, viewZoom: number): PointerPoint {
  const size = portraitCenterImageSize(image, viewZoom);
  const anchor = portraitCenterAnchor(viewZoom);
  return {
    x: anchor.x - clamp01Number(center.x, 0.5) * size.width,
    y: anchor.y - clamp01Number(center.y, 0.5) * size.height
  };
}

export function portraitCenterFromOffset(image: HTMLImageElement | null, offset: PointerPoint, viewZoom: number): PointerPoint {
  if (!image) return { x: 0.5, y: 0.5 };
  const size = portraitCenterImageSize(image, viewZoom);
  const anchor = portraitCenterAnchor(viewZoom);
  return {
    x: round4Number(clamp01Number((anchor.x - offset.x) / size.width, 0.5)),
    y: round4Number(clamp01Number((anchor.y - offset.y) / size.height, 0.5))
  };
}

export function drawPortraitCenterCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  imageOffset: PointerPoint,
  center: PointerPoint,
  viewZoom: number
) {
  const context = setupFixedCanvas(canvas, portraitCenterCanvasWidth, portraitCenterCanvasHeight);
  drawPortraitCenterBackground(context);

  if (image) {
    const size = portraitCenterImageSize(image, viewZoom);
    context.drawImage(
      image,
      Math.round(imageOffset.x),
      Math.round(imageOffset.y),
      Math.max(1, Math.round(size.width)),
      Math.max(1, Math.round(size.height))
    );
  }

  drawPortraitCenterCrosshair(context, center, viewZoom);
}

function portraitCenterAnchorYForZoom(viewZoom: number) {
  const t = clamp01Number(
    (viewZoom - portraitCenterAnchorYZoomLo) / (portraitCenterAnchorYZoomHi - portraitCenterAnchorYZoomLo),
    0
  );
  return portraitCenterAnchorYAt100 + t * (portraitCenterAnchorYAt500 - portraitCenterAnchorYAt100);
}

function portraitCenterAnchor(viewZoom: number): PointerPoint {
  return {
    x: portraitCenterCanvasWidth * portraitCenterAnchorX,
    y: portraitCenterCanvasHeight * portraitCenterAnchorYForZoom(viewZoom)
  };
}

function portraitCenterImageSize(image: HTMLImageElement, viewZoom: number) {
  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
  const baseScale = Math.min(
    (portraitCenterCanvasWidth * 0.88) / sourceWidth,
    (portraitCenterCanvasHeight * 0.88) / sourceHeight,
    2
  );
  const scale = baseScale * clampPortraitCenterZoom(viewZoom);
  return {
    width: Math.max(1, sourceWidth * scale),
    height: Math.max(1, sourceHeight * scale)
  };
}

function drawPortraitCenterBackground(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, portraitCenterCanvasWidth, portraitCenterCanvasHeight);
  context.fillStyle = "#0d1115";
  context.fillRect(0, 0, portraitCenterCanvasWidth, portraitCenterCanvasHeight);
  context.strokeStyle = "rgba(255, 255, 255, 0.06)";
  context.lineWidth = 1;
  for (let x = 0; x <= portraitCenterCanvasWidth; x += 20) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, portraitCenterCanvasHeight);
    context.stroke();
  }
  for (let y = 0; y <= portraitCenterCanvasHeight; y += 20) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(portraitCenterCanvasWidth, y + 0.5);
    context.stroke();
  }
}

function drawPortraitCenterCrosshair(context: CanvasRenderingContext2D, center: PointerPoint, viewZoom: number) {
  const anchor = portraitCenterAnchor(viewZoom);
  const ax = Math.round(anchor.x) + 0.5;
  const ay = Math.round(anchor.y) + 0.5;
  context.strokeStyle = "rgba(126, 231, 216, 0.72)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(ax, 0);
  context.lineTo(ax, portraitCenterCanvasHeight);
  context.moveTo(0, ay);
  context.lineTo(portraitCenterCanvasWidth, ay);
  context.stroke();

  context.fillStyle = "rgba(126, 231, 216, 0.22)";
  context.strokeStyle = "#7ee7d8";
  context.beginPath();
  context.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(228, 234, 239, 0.74)";
  context.font = "700 11px Pretendard, system-ui, sans-serif";
  context.textAlign = "right";
  context.textBaseline = "top";
  context.fillText(`${center.x.toFixed(3)}, ${center.y.toFixed(3)}`, portraitCenterCanvasWidth - 8, 8);
}
