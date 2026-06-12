import type { PointerPoint } from "../../editorTypes";
import { getProfileZoom } from "./portraitModel";
import {
  profileCropCanvasSize,
  setupSquareCanvas
} from "./portraitCanvasShared";

export function drawProfileCropCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  faceCenter: PointerPoint,
  profile: { zoom: number; offset: PointerPoint }
) {
  const context = setupSquareCanvas(canvas, profileCropCanvasSize);
  context.clearRect(0, 0, profileCropCanvasSize, profileCropCanvasSize);
  drawProfileCropBackground(context);

  if (image) {
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    const baseScale = Math.max(profileCropCanvasSize / sourceWidth, profileCropCanvasSize / sourceHeight);
    const scale = baseScale * getProfileZoom(profile.zoom);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const anchor = profileCropAnchor(profile.offset);
    context.drawImage(
      image,
      Math.round(anchor.x - faceCenter.x * width),
      Math.round(anchor.y - faceCenter.y * height),
      Math.max(1, Math.round(width)),
      Math.max(1, Math.round(height))
    );
  }

  drawProfileCropGuides(context, profile.offset);
}

function drawProfileCropBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = "#0d1115";
  context.fillRect(0, 0, profileCropCanvasSize, profileCropCanvasSize);
}

function drawProfileCropGuides(context: CanvasRenderingContext2D, offset: PointerPoint) {
  const center = profileCropCanvasSize / 2;
  const anchor = profileCropAnchor(offset);

  context.strokeStyle = "rgba(126, 231, 216, 0.54)";
  context.lineWidth = 1;
  context.setLineDash([6, 6]);
  context.beginPath();
  context.moveTo(center + 0.5, 0);
  context.lineTo(center + 0.5, profileCropCanvasSize);
  context.moveTo(0, center + 0.5);
  context.lineTo(profileCropCanvasSize, center + 0.5);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = "#7ee7d8";
  context.fillStyle = "rgba(126, 231, 216, 0.22)";
  context.beginPath();
  context.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(anchor.x - 14, anchor.y);
  context.lineTo(anchor.x - 5, anchor.y);
  context.moveTo(anchor.x + 5, anchor.y);
  context.lineTo(anchor.x + 14, anchor.y);
  context.moveTo(anchor.x, anchor.y - 14);
  context.lineTo(anchor.x, anchor.y - 5);
  context.moveTo(anchor.x, anchor.y + 5);
  context.lineTo(anchor.x, anchor.y + 14);
  context.stroke();
}

function profileCropAnchor(offset: PointerPoint) {
  return {
    x: profileCropCanvasSize * 0.5 + offset.x * profileCropCanvasSize,
    y: profileCropCanvasSize * 0.5 + offset.y * profileCropCanvasSize
  };
}
