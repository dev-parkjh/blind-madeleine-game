import type { PointerPoint } from "../../editorTypes";
import {
  normalizeCanvasColor,
  portraitEditorCanvasHeight,
  portraitEditorCanvasWidth,
  setupFixedCanvas
} from "./portraitCanvasShared";

const gameFaceAnchorX = 0.5;
const gameFaceAnchorY = 0.34;
const gamePortraitZoomPercent = 300;
const spectrumPreviewWidthRatio = 0.76;

export function getGameFacePosition() {
  return {
    x: portraitEditorCanvasWidth * gameFaceAnchorX,
    y: portraitEditorCanvasHeight * gameFaceAnchorY
  };
}

export function drawSpectrumOffsetCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  faceCenter: PointerPoint,
  offset: PointerPoint,
  nameColor: string
) {
  const context = setupFixedCanvas(canvas, portraitEditorCanvasWidth, portraitEditorCanvasHeight);
  context.fillStyle = "#0f0d14";
  context.fillRect(0, 0, portraitEditorCanvasWidth, portraitEditorCanvasHeight);
  drawSpectrumGrid(context);

  const facePosition = getGameFacePosition();
  if (image) {
    const sourceWidth = Math.max(1, image.naturalWidth || image.width);
    const sourceHeight = Math.max(1, image.naturalHeight || image.height);
    const baseScale = Math.min(
      (portraitEditorCanvasWidth * 0.92) / sourceWidth,
      (portraitEditorCanvasHeight * 0.92) / sourceHeight
    );
    const scale = baseScale * (gamePortraitZoomPercent / 100);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    context.drawImage(
      image,
      facePosition.x - faceCenter.x * width,
      facePosition.y - faceCenter.y * height,
      width,
      height
    );
  }

  drawSpectrumFaceCrosshair(context, facePosition);
  drawSpectrumPreview(context, {
    x: facePosition.x + offset.x * portraitEditorCanvasWidth,
    y: facePosition.y + offset.y * portraitEditorCanvasHeight
  }, nameColor);
}

function drawSpectrumFaceCrosshair(context: CanvasRenderingContext2D, facePosition: PointerPoint) {
  context.strokeStyle = "rgba(120, 220, 255, 0.35)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(facePosition.x + 0.5, 0);
  context.lineTo(facePosition.x + 0.5, portraitEditorCanvasHeight);
  context.moveTo(0, facePosition.y + 0.5);
  context.lineTo(portraitEditorCanvasWidth, facePosition.y + 0.5);
  context.stroke();

  context.strokeStyle = "rgba(120, 220, 255, 0.85)";
  const size = 10;
  context.beginPath();
  context.moveTo(facePosition.x - size, facePosition.y);
  context.lineTo(facePosition.x + size, facePosition.y);
  context.moveTo(facePosition.x, facePosition.y - size);
  context.lineTo(facePosition.x, facePosition.y + size);
  context.stroke();
}

function drawSpectrumPreview(context: CanvasRenderingContext2D, point: PointerPoint, nameColor: string) {
  const span = portraitEditorCanvasWidth * spectrumPreviewWidthRatio;
  const barCount = Math.max(28, Math.round(span / 7));
  const barWidth = Math.max(2, Math.min(4, span / barCount * 0.46));
  const step = span / Math.max(1, barCount - 1);
  const startX = point.x - span / 2;
  const baseHeight = 10;
  const spectrumColor = normalizeCanvasColor(nameColor, "#ffffff");

  context.strokeStyle = "rgba(255, 255, 255, 0.7)";
  context.lineWidth = 1;
  context.setLineDash([4, 3]);
  context.beginPath();
  context.moveTo(point.x - span / 2, point.y);
  context.lineTo(point.x + span / 2, point.y);
  context.stroke();
  context.setLineDash([]);

  context.save();
  context.fillStyle = spectrumColor;
  context.globalAlpha = 0.55;
  for (let index = 0; index < barCount; index += 1) {
    const ratio = index / Math.max(1, barCount - 1);
    const wave = Math.sin(ratio * Math.PI * 4.2) * 0.52 + Math.sin(ratio * Math.PI * 10.4) * 0.18;
    const envelope = 0.74 + Math.sin(ratio * Math.PI) * 0.28;
    const height = Math.max(6, baseHeight + (wave + 1) * 7 * envelope);
    const x = startX + step * index - barWidth / 2;
    context.fillRect(x, point.y - height, barWidth, height);
  }
  context.restore();

  context.fillStyle = "rgba(255, 79, 168, 0.25)";
  context.strokeStyle = "#ff4fa8";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(point.x, point.y, 10, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawSpectrumGrid(context: CanvasRenderingContext2D) {
  context.strokeStyle = "rgba(255, 255, 255, 0.05)";
  context.lineWidth = 1;
  for (let x = 0; x <= portraitEditorCanvasWidth; x += 20) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, portraitEditorCanvasHeight);
    context.stroke();
  }
  for (let y = 0; y <= portraitEditorCanvasHeight; y += 20) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(portraitEditorCanvasWidth, y + 0.5);
    context.stroke();
  }
}
